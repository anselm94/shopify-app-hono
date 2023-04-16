import {Session, Shopify, InvalidJwtError} from '@shopify/shopify-api';
import {Context, MiddlewareHandler} from 'hono';
import {AppEnv} from 'types';

import {hasValidAccessToken} from '~utils/has-valid-access-token';
import {redirectToAuth} from '~utils/redirect-to-auth';
import {getBearerToken, hasBearerToken} from '~utils/request';
import {returnTopLevelRedirection} from '~utils/return-top-level-redirection';

export function validateAuthenticatedSession(): MiddlewareHandler<AppEnv> {
  return async (ctx, next) => {
    const logger = ctx.get('logger');
    const api = ctx.get('api');
    const config = ctx.get('config');
    let shop = ctx.get('shop');

    logger.info('Running validateAuthenticatedSession');

    let sessionId: string | undefined;
    try {
      sessionId = await api.session.getCurrentId({
        isOnline: config.useOnlineTokens,
        rawRequest: ctx.req,
        rawResponse: ctx.res,
      });
    } catch (_err) {
      const error = _err as Error;
      await logger.error(`Error when loading session from storage: ${error}`);

      return handleSessionError(ctx, error);
    }

    let session: Session | undefined;
    if (sessionId) {
      try {
        session = await ctx.get('session-storage').loadSession(sessionId);
      } catch (_err) {
        const error = _err as Error;
        await logger.error(`Error when loading session from storage: ${error}`);

        ctx.status(500);
        return ctx.text(error.message);
      }
    }

    if (session && shop && session.shop !== shop) {
      logger.debug('Found a session for a different shop in the request', {
        currentShop: session.shop,
        requestShop: shop,
      });

      return redirectToAuth(ctx);
    }

    if (session) {
      logger.debug('Request session found and loaded', {
        shosp: session.shop,
      });

      if (session.isActive(api.config.scopes)) {
        logger.debug('Request session exists and is active', {
          shop: session.shop,
        });

        if (await hasValidAccessToken(api, session)) {
          logger.info('Request session has a valid access token', {
            shop: session.shop,
          });

          ctx.set('session', session);
          await next();
          return ctx.res;
        }
      }
    }

    if (hasBearerToken(ctx)) {
      if (!shop) {
        shop = await setShopFromSessionOrToken(
          api,
          session,
          getBearerToken(ctx)!,
        );
      }
    }

    const redirectUrl = `${config.auth.path}?shop=${shop}`;
    logger.info(`Session was not valid. Redirecting to ${redirectUrl}`, {
      shop,
    });

    return returnTopLevelRedirection(ctx, redirectUrl);
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
