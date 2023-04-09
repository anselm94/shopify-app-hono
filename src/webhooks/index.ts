import {
  AddHandlersParams,
  DeliveryMethod,
  WebhookHandler,
} from '@shopify/shopify-api';
import {AppInstallations} from 'app-installations';
import {Context, Handler} from 'hono';

import {AppEnv} from '~types/app';

export interface WebhookHandlersParam {
  [topic: string]: WebhookHandler | WebhookHandler[];
}

export function processWebhooks(
  webhookHandlers: WebhookHandlersParam,
): Handler<AppEnv> {
  return async (ctx) => {
    mountWebhooks(ctx, webhookHandlers);

    const ctxAppConfig = ctx.get('AppConfig');
    try {
      await ctxAppConfig.api.webhooks.process({
        rawBody: await ctx.req.text(),
        rawRequest: ctx.req,
        rawResponse: ctx.res,
      });

      await ctxAppConfig.logger.info(
        'Webhook processed, returned status code 200',
      );
    } catch (error) {
      await ctxAppConfig.logger.error(`Failed to process webhook: ${error}`);

      // The library will respond even if the handler throws an error
    }
    return ctx.res;
  };
}

function mountWebhooks(ctx: Context<AppEnv>, handlers: WebhookHandlersParam) {
  const ctxAppConfig = ctx.get('AppConfig');

  ctxAppConfig.api.webhooks.addHandlers(handlers as AddHandlersParams);

  // Add our custom app uninstalled webhook
  const appInstallations = new AppInstallations(ctxAppConfig);

  ctxAppConfig.api.webhooks.addHandlers({
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: ctxAppConfig.webhooks.path,
      callback: deleteAppInstallationHandler(appInstallations, ctxAppConfig),
    },
  });
}
