import {AddHandlersParams, DeliveryMethod} from '@shopify/shopify-api';
import {Context, Handler} from 'hono';

import {AppEnv} from '../../types';

import {uninstallAppCallback} from './callback-uninstall-app';

export function shopifyWebhooks(webhookHandlers: AddHandlersParams): Handler {
  return async (ctx: Context<AppEnv>) => {
    const api = ctx.get('api');
    const config = ctx.get('config');
    const logger = ctx.get('logger');

    api.webhooks.addHandlers({
      ...webhookHandlers,
      APP_UNINSTALLED: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: config.webhooks.path,
        callback: uninstallAppCallback(ctx),
      },
    });

    try {
      await api.webhooks.process({
        rawBody: await ctx.req.text(),
        rawRequest: ctx.req,
        rawResponse: ctx.res,
      });

      await logger.info('Webhook processed, returned status code 200');
    } catch (error) {
      await logger.error(`Failed to process webhook: ${error}`);
      throw error;
    }
    return ctx.res;
  };
}
