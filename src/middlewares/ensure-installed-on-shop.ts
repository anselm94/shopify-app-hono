import {Session} from '@shopify/shopify-api';
import {Context, MiddlewareHandler} from 'hono';
import {AppInstallations} from 'app-installations';
import {AppEnv} from 'types';

import {validateAuthenticatedSession} from './validate-authenticated-session';

import {hasValidAccessToken} from '~utils/has-valid-access-token';
import {redirectToAuth} from '~utils/redirect-to-auth';
import {addCSPHeader} from '~utils/request';

export function ensureInstalled(): MiddlewareHandler<AppEnv> {
  return async (ctx, next) => {
    const logger = ctx.get('logger');
    const api = ctx.get('api');
    const config = ctx.get('config');

    logger.info('Running ensureInstalledOnShop');

    if (!api.config.isEmbeddedApp) {
      logger.warning(
        'ensureInstalledOnShop() should only be used in embedded apps; calling validateAuthenticatedSession() instead',
      );

      return validateAuthenticatedSession()(ctx, next);
    }

    const shop = getRequestShop(ctx);
    if (!shop) {
      return ctx.res;
    }

    logger.debug('Checking if shop has installed the app', {shop});

    const sessionId = api.session.getOfflineId(shop);
    const session = await ctx.get('session-storage').loadSession(sessionId);

    const exitIframeRE = new RegExp(`^${config.exitIframePath}`, 'i');
    if (!session && !ctx.req.url.match(exitIframeRE)) {
      logger.debug(
        'App installation was not found for shop, redirecting to auth',
        {shop},
      );

      return redirectToAuth(ctx);
    }

    if (api.config.isEmbeddedApp && ctx.req.query('embedded') !== '1') {
      if (await sessionHasValidAccessToken(ctx, session)) {
        await embedAppIntoShopify(ctx, shop);
        return ctx.res;
      } else {
        logger.info(
          'Found a session, but it is not valid. Redirecting to auth',
          {shop},
        );

        return redirectToAuth(ctx);
      }
    }

    addCSPHeader(ctx);

    logger.info('App is installed and ready to load', {shop});

    return next();
  };
}

export function deleteAppInstallationHandler(
  ctx: Context<AppEnv>,
  appInstallations: AppInstallations,
) {
  return async function (
    _topic: string,
    shop: string,
    _body: any,
    _webhookId: string,
  ) {
    await ctx.get('logger').debug('Deleting shop sessions', {shop});

    await appInstallations.delete(shop);
  };
}

function getRequestShop(ctx: Context<AppEnv>): string | undefined {
  const logger = ctx.get('logger');
  if (typeof ctx.req.query('shop') !== 'string') {
    logger.error(
      'ensureInstalledOnShop did not receive a shop query argument',
      {
        shop: ctx.req.query('shop'),
      },
    );

    ctx.status(400);
    ctx.text('No shop provided');
    return undefined;
  }

  const shop = ctx.get('shop');

  if (!shop) {
    logger.error(
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
  ctx: Context<AppEnv>,
  session: Session | undefined,
): Promise<boolean> {
  if (!session) {
    return false;
  }

  const api = ctx.get('api');

  try {
    return (
      session.isActive(api.config.scopes) &&
      (await hasValidAccessToken(api, session))
    );
  } catch (error) {
    ctx.get('logger').error(`Could not check if session was valid: ${error}`, {
      shop: session.shop,
    });
    return false;
  }
}

async function embedAppIntoShopify(
  ctx: Context<AppEnv>,
  shop: string,
): Promise<Response> {
  const api = ctx.get('api');
  const logger = ctx.get('logger');

  let embeddedUrl: string;
  try {
    embeddedUrl = await api.auth.getEmbeddedAppUrl({
      rawRequest: ctx.req,
      rawResponse: ctx.res,
    });
  } catch (error) {
    logger.error(
      `ensureInstalledOnShop did not receive a host query argument`,
      {
        shop,
      },
    );

    ctx.status(400);
    return ctx.text('No host provided');
  }

  logger.debug(
    `Request is not embedded but app is. Redirecting to ${embeddedUrl} to embed the app`,
    {shop},
  );

  return ctx.redirect(embeddedUrl + ctx.req.path);
}
