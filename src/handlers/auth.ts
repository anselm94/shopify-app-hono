import {
  CookieNotFound,
  InvalidOAuthError,
  Session,
  gdprTopics,
} from '@shopify/shopify-api';
import {Context, Handler} from 'hono';
import {AppEnv} from 'types';

import {redirectToAuth} from '~utils/redirect-to-auth';

export function auth() {
  return {
    begin(): Handler<AppEnv> {
      return (ctx) => {
        return redirectToAuth(ctx);
      };
    },
    callback(): Handler<AppEnv> {
      return async (ctx, next) => {
        await ctx
          .get('logger')
          .info('Handling request to complete OAuth process');

        const session = await authCallback(ctx);

        if (session) {
          return redirectToShopifyOrAppRoot(session)(ctx, next);
        }

        return ctx.text(
          'Cannot authenticate since session cannot be created',
          400,
        );
      };
    },
  };
}

export function redirectToShopifyOrAppRoot(session: Session): Handler<AppEnv> {
  return async (ctx) => {
    const api = ctx.get('api');
    const host = ctx.get('host');

    const redirectUrl = api.config.isEmbeddedApp
      ? await api.auth.getEmbeddedAppUrl({
          rawRequest: ctx.req,
          rawResponse: ctx.res,
        })
      : `/?shop=${session.shop}&host=${encodeURIComponent(host || '')}`;

    await ctx.get('logger').debug(`Redirecting to host at ${redirectUrl}`, {
      shop: session.shop,
    });

    return ctx.redirect(redirectUrl);
  };
}

export async function authCallback(
  ctx: Context<AppEnv>,
): Promise<Session | undefined> {
  const logger = ctx.get('logger');
  try {
    const callbackResponse = await ctx.get('api').auth.callback({
      rawRequest: ctx.req,
      rawResponse: ctx.res,
    });
    const session = callbackResponse.session;

    await logger.debug('Callback is valid, storing session', {
      shop: session.shop,
      isOnline: session.isOnline,
    });

    await ctx.get('session-storage').storeSession(session);

    // If this is an offline OAuth process, register webhooks
    if (!session.isOnline) {
      await registerWebhooks(ctx, session);
    }

    // If we're completing an offline OAuth process, immediately kick off the online one
    if (ctx.get('config').useOnlineTokens && !session.isOnline) {
      await logger.debug(
        'Completing offline token OAuth, redirecting to online token OAuth',
        {shop: session.shop},
      );

      await redirectToAuth(ctx, true);
      return undefined;
    }

    ctx.set('session', session);

    await logger.debug('Completed OAuth callback', {
      shop: session.shop,
      isOnline: session.isOnline,
    });

    return session;
  } catch (_err) {
    const error = _err as Error;
    await logger.error(`Failed to complete OAuth with error: ${error}`);

    await handleCallbackError(ctx, error);
  }
  return undefined;
}

async function registerWebhooks(ctx: Context<AppEnv>, session: Session) {
  const logger = ctx.get('logger');

  await logger.debug('Registering webhooks', {shop: session.shop});

  const responsesByTopic = await ctx.get('api').webhooks.register({session});

  for (const topic in responsesByTopic) {
    if (!Object.prototype.hasOwnProperty.call(responsesByTopic, topic)) {
      continue;
    }

    for (const response of responsesByTopic[topic]) {
      if (!response.success && !gdprTopics.includes(topic)) {
        const result: any = response.result;

        if (result.errors) {
          await logger.error(
            `Failed to register ${topic} webhook: ${result.errors[0].message}`,
            {shop: session.shop},
          );
        } else {
          await logger.error(
            `Failed to register ${topic} webhook: ${JSON.stringify(
              result.data,
            )}`,
            {shop: session.shop},
          );
        }
      }
    }
  }
}

async function handleCallbackError(
  ctx: Context<AppEnv>,
  error: Error,
): Promise<Response> {
  switch (true) {
    case error instanceof InvalidOAuthError:
      ctx.status(400);
      return ctx.text(error.message);
    case error instanceof CookieNotFound:
      return redirectToAuth(ctx);
    default:
      ctx.status(500);
      return ctx.text(error.message);
  }
}
