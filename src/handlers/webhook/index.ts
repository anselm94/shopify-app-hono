import {AddHandlersParams, DeliveryMethod} from '@shopify/shopify-api';
import {Handler} from 'hono';

import {uninstallAppCallback} from './callback-uninstall-app';

import {AppEnv} from '#/types';

export function webhook(webhookHandlers: AddHandlersParams): Handler<AppEnv> {
  return async (ctx) => {
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
