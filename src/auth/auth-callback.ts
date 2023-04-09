import {
  CookieNotFound,
  gdprTopics,
  InvalidOAuthError,
  Session,
} from '@shopify/shopify-api';
import {Context} from 'hono';
import {AppEnv} from 'types';

import {redirectToAuth} from '~utils/redirect-to-auth';

export async function authCallback(ctx: Context<AppEnv>): Promise<boolean> {
  const ctxAppConfig = ctx.get('AppConfig');
  try {
    const callbackResponse = await ctxAppConfig.api.auth.callback({
      rawRequest: ctx.req,
      rawResponse: ctx.res,
    });

    await ctxAppConfig.logger.debug('Callback is valid, storing session', {
      shop: callbackResponse.session.shop,
      isOnline: callbackResponse.session.isOnline,
    });

    await ctxAppConfig.sessionStorage.storeSession(callbackResponse.session);

    // If this is an offline OAuth process, register webhooks
    if (!callbackResponse.session.isOnline) {
      await registerWebhooks(ctx, callbackResponse.session);
    }

    // If we're completing an offline OAuth process, immediately kick off the online one
    if (ctxAppConfig.useOnlineTokens && !callbackResponse.session.isOnline) {
      await ctxAppConfig.logger.debug(
        'Completing offline token OAuth, redirecting to online token OAuth',
        {shop: callbackResponse.session.shop},
      );

      await redirectToAuth(ctx, true);
      return false;
    }

    ctx.set('Session', callbackResponse.session);

    await ctxAppConfig.logger.debug('Completed OAuth callback', {
      shop: callbackResponse.session.shop,
      isOnline: callbackResponse.session.isOnline,
    });

    return true;
  } catch (_err) {
    const error = _err as Error;
    await ctxAppConfig.logger.error(
      `Failed to complete OAuth with error: ${error}`,
    );

    await handleCallbackError(ctx, error);
  }

  return false;
}

async function registerWebhooks(ctx: Context<AppEnv>, session: Session) {
  const ctxAppConfig = ctx.get('AppConfig');
  await ctxAppConfig.logger.debug('Registering webhooks', {shop: session.shop});

  const responsesByTopic = await ctxAppConfig.api.webhooks.register({session});

  for (const topic in responsesByTopic) {
    if (!Object.prototype.hasOwnProperty.call(responsesByTopic, topic)) {
      continue;
    }

    for (const response of responsesByTopic[topic]) {
      if (!response.success && !gdprTopics.includes(topic)) {
        const result: any = response.result;

        if (result.errors) {
          await ctxAppConfig.logger.error(
            `Failed to register ${topic} webhook: ${result.errors[0].message}`,
            {shop: session.shop},
          );
        } else {
          await ctxAppConfig.logger.error(
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
