import {Session} from '@shopify/shopify-api';
import {Context, MiddlewareHandler} from 'hono';
import {AppInstallations} from 'app-installations';
import {AppConfigContext, AppEnv} from 'types';

import {validateAuthenticatedSession} from './validate-authenticated-session';
import {addCSPHeader} from './csp-headers';

import {hasValidAccessToken} from '~utils/has-valid-access-token';
import {redirectToAuth} from '~utils/redirect-to-auth';

export function ensureInstalled(): MiddlewareHandler<AppEnv> {
  return async (ctx, next) => {
    const ctxAppConfig = ctx.get('AppConfig');
    ctxAppConfig.logger.info('Running ensureInstalledOnShop');

    if (!ctxAppConfig.api.config.isEmbeddedApp) {
      ctxAppConfig.logger.warning(
        'ensureInstalledOnShop() should only be used in embedded apps; calling validateAuthenticatedSession() instead',
      );

      return validateAuthenticatedSession()(ctx, next);
    }

    const shop = getRequestShop(ctx);
    if (!shop) {
      return ctx.res;
    }

    ctxAppConfig.logger.debug('Checking if shop has installed the app', {shop});

    const sessionId = ctxAppConfig.api.session.getOfflineId(shop);
    const session = await ctxAppConfig.sessionStorage.loadSession(sessionId);

    const exitIframeRE = new RegExp(`^${ctxAppConfig.exitIframePath}`, 'i');
    if (!session && !ctx.req.url.match(exitIframeRE)) {
      ctxAppConfig.logger.debug(
        'App installation was not found for shop, redirecting to auth',
        {shop},
      );

      return redirectToAuth(ctx);
    }

    if (
      ctxAppConfig.api.config.isEmbeddedApp &&
      ctx.req.query('embedded') !== '1'
    ) {
      if (await sessionHasValidAccessToken(ctxAppConfig, session)) {
        await embedAppIntoShopify(ctx, shop);
        return ctx.res;
      } else {
        ctxAppConfig.logger.info(
          'Found a session, but it is not valid. Redirecting to auth',
          {shop},
        );

        return redirectToAuth(ctx);
      }
    }

    addCSPHeader(ctx);

    ctxAppConfig.logger.info('App is installed and ready to load', {shop});

    return next();
  };
}

export function deleteAppInstallationHandler(
  ctx: Context<AppEnv>,
  appInstallations: AppInstallations,
) {
  const ctxAppConfig = ctx.get('AppConfig');
  return async function (
    _topic: string,
    shop: string,
    _body: any,
    _webhookId: string,
  ) {
    await ctxAppConfig.logger.debug('Deleting shop sessions', {shop});

    await appInstallations.delete(shop);
  };
}

function getRequestShop(ctx: Context<AppEnv>): string | undefined {
  const ctxAppConfig = ctx.get('AppConfig');
  if (typeof ctx.req.query('shop') !== 'string') {
    ctxAppConfig.logger.error(
      'ensureInstalledOnShop did not receive a shop query argument',
      {shop: ctx.req.query('shop')},
    );

    ctx.status(400);
    ctx.text('No shop provided');
    return undefined;
  }

  const shop = ctxAppConfig.api.utils.sanitizeShop(ctx.req.query('shop') || '');

  if (!shop) {
    ctxAppConfig.logger.error(
      'ensureInstalledOnShop did not receive a valid shop query argument',
      {shop: ctx.req.query('shop')},
    );

    ctx.status(422);
    ctx.text('Invalid shop provided');
    return undefined;
  }

  return shop;
}

async function sessionHasValidAccessToken(
  config: AppConfigContext,
  session: Session | undefined,
): Promise<boolean> {
  if (!session) {
    return false;
  }

  try {
    return (
      session.isActive(config.api.config.scopes) &&
      (await hasValidAccessToken(config.api, session))
    );
  } catch (error) {
    config.logger.error(`Could not check if session was valid: ${error}`, {
      shop: session.shop,
    });
    return false;
  }
}

async function embedAppIntoShopify(
  ctx: Context<AppEnv>,
  shop: string,
): Promise<Response> {
  const ctxAppConfig = ctx.get('AppConfig');
  let embeddedUrl: string;
  try {
    embeddedUrl = await ctxAppConfig.api.auth.getEmbeddedAppUrl({
      rawRequest: ctx.req,
      rawResponse: ctx.res,
    });
  } catch (error) {
    ctxAppConfig.logger.error(
      `ensureInstalledOnShop did not receive a host query argument`,
      {shop},
    );

    ctx.status(400);
    return ctx.text('No host provided');
  }

  ctxAppConfig.logger.debug(
    `Request is not embedded but app is. Redirecting to ${embeddedUrl} to embed the app`,
    {shop},
  );

  return ctx.redirect(embeddedUrl + ctx.req.path);
}
