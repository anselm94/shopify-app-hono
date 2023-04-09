import {Session, Shopify, InvalidJwtError} from '@shopify/shopify-api';
import {Context, MiddlewareHandler} from 'hono';
import {AppEnv} from 'types';

import {hasValidAccessToken} from '~utils/has-valid-access-token';
import {redirectToAuth} from '~utils/redirect-to-auth';
import {returnTopLevelRedirection} from '~utils/return-top-level-redirection';

export function validateAuthenticatedSession(): MiddlewareHandler<AppEnv> {
  return async (ctx, next) => {
    const ctxAppConfig = ctx.get('AppConfig');

    ctxAppConfig.logger.info('Running validateAuthenticatedSession');

    let sessionId: string | undefined;
    try {
      sessionId = await ctxAppConfig.api.session.getCurrentId({
        isOnline: ctxAppConfig.useOnlineTokens,
        rawRequest: ctx.req,
        rawResponse: ctx.res,
      });
    } catch (_err) {
      const error = _err as Error;
      await ctxAppConfig.logger.error(
        `Error when loading session from storage: ${error}`,
      );

      return handleSessionError(ctx, error);
    }

    let session: Session | undefined;
    if (sessionId) {
      try {
        session = await ctxAppConfig.sessionStorage.loadSession(sessionId);
      } catch (_err) {
        const error = _err as Error;
        await ctxAppConfig.logger.error(
          `Error when loading session from storage: ${error}`,
        );

        ctx.status(500);
        return ctx.text(error.message);
      }
    }

    let shop =
      ctxAppConfig.api.utils.sanitizeShop(ctx.req.query('shop') || '') ||
      session?.shop;

    if (session && shop && session.shop !== shop) {
      ctxAppConfig.logger.debug(
        'Found a session for a different shop in the request',
        {currentShop: session.shop, requestShop: shop},
      );

      return redirectToAuth(ctx);
    }

    if (session) {
      ctxAppConfig.logger.debug('Request session found and loaded', {
        shop: session.shop,
      });

      if (session.isActive(ctxAppConfig.api.config.scopes)) {
        ctxAppConfig.logger.debug('Request session exists and is active', {
          shop: session.shop,
        });

        if (await hasValidAccessToken(ctxAppConfig.api, session)) {
          ctxAppConfig.logger.info('Request session has a valid access token', {
            shop: session.shop,
          });

          ctx.set('Session', session);
          await next();
          return ctx.res;
        }
      }
    }

    const bearerPresent = ctx.req.headers
      .get('Authorization')
      ?.match(/Bearer (.*)/);
    if (bearerPresent) {
      if (!shop) {
        shop = await setShopFromSessionOrToken(
          ctxAppConfig.api,
          session,
          bearerPresent[1],
        );
      }
    }

    const redirectUrl = `${ctxAppConfig.auth.path}?shop=${shop}`;
    ctxAppConfig.logger.info(
      `Session was not valid. Redirecting to ${redirectUrl}`,
      {
        shop,
      },
    );

    return returnTopLevelRedirection(ctx, redirectUrl, Boolean(bearerPresent));
  };
}

async function handleSessionError(
  ctx: Context<AppEnv>,
  error: Error,
): Promise<Response> {
  switch (true) {
    case error instanceof InvalidJwtError:
      ctx.status(401);
      return ctx.text(error.message);
    default:
      ctx.status(500);
      return ctx.text(error.message);
  }
}

async function setShopFromSessionOrToken(
  api: Shopify,
  session: Session | undefined,
  token: string,
): Promise<string | undefined> {
  let shop: string | undefined;

  if (session) {
    shop = session.shop;
  } else if (api.config.isEmbeddedApp) {
    const payload = await api.session.decodeSessionToken(token);
    shop = payload.dest.replace('https://', '');
  }
  return shop;
}
