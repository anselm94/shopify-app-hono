import {Session, gdprTopics} from '@shopify/shopify-api';
import {Context, Handler} from 'hono';

import {AppEnv} from '#/types';
import {getAppUrl} from '#/utils/common';
import {redirectToAuth} from '#/utils/redirect-to-auth';

export const authCallback = (): Handler<AppEnv> => {
  return async (ctx) => {
    const api = ctx.get('api');
    const config = ctx.get('config');

    const callbackResponse = await api.auth.callback({
      rawRequest: ctx.req,
      rawResponse: ctx.res,
    });

    const session = callbackResponse.session;
    if (!session) {
      return ctx.text(
        'Cannot authenticate since session cannot be created',
        400,
      );
    }

    ctx.set('session', session);

    await ctx.get('session-storage').storeSession(session);

    // If this is an offline OAuth process, register webhooks
    if (!session.isOnline) {
      await registerWebhooks(ctx, session);

      // If we're completing an offline OAuth process, immediately kick off the online one
      if (config.useOnlineTokens) {
        return redirectToAuth(ctx, true);
      }
    }

    const appUrl = await getAppUrl(ctx);

    return ctx.redirect(appUrl);
  };
};

async function registerWebhooks(ctx: Context<AppEnv>, session: Session) {
  const logger = ctx.get('logger');
  const api = ctx.get('api');

  const responsesByTopic = await api.webhooks.register({session});

  for (const topic of Object.keys(responsesByTopic)) {
    for (const response of responsesByTopic[topic]) {
      if (!response.success && !gdprTopics.includes(topic)) {
        const result: any = response.result;
        logger.error(
          `Failed to register ${topic} webhook: ${
            result.errors ? result.errors[0].message : result.data
          }`,
          {shop: session.shop},
        );
      }
    }
  }
}
