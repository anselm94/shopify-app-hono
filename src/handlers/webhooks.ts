import {AddHandlersParams, DeliveryMethod} from '@shopify/shopify-api';
import {AppInstallations} from 'app-installations';
import {Context, Handler} from 'hono';
import {AppEnv} from 'types';

import {deleteAppInstallationHandler} from '~middlewares/ensure-installed-on-shop';

export function processWebhooks(
  webhookHandlers: AddHandlersParams,
): Handler<AppEnv> {
  return async (ctx) => {
    mountWebhooks(ctx, webhookHandlers);

    const logger = ctx.get('logger');
    try {
      await ctx.get('api').webhooks.process({
        rawBody: await ctx.req.text(),
        rawRequest: ctx.req,
        rawResponse: ctx.res,
      });

      await logger.info('Webhook processed, returned status code 200');
    } catch (error) {
      await logger.error(`Failed to process webhook: ${error}`);

      // The library will respond even if the handler throws an error
    }
    return ctx.res;
  };
}

function mountWebhooks(ctx: Context<AppEnv>, handlers: AddHandlersParams) {
  const api = ctx.get('api');
  const config = ctx.get('config');

  api.webhooks.addHandlers(handlers as AddHandlersParams);

  // Add our custom app uninstalled webhook
  const appInstallations = new AppInstallations(ctx.get('session-storage'));

  api.webhooks.addHandlers({
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: config.webhooks.path,
      callback: deleteAppInstallationHandler(ctx, appInstallations),
    },
  });
}
