import {ShopifyRestResources, shopifyApi} from '@shopify/shopify-api';
import {SessionStorage} from '@shopify/shopify-app-session-storage';
import {MiddlewareHandler} from 'hono';
import {AppConfig, AppEnv} from 'types';
import {createLogger, validateApiConfig} from 'utils/config';

export function shopifyApp<
  R extends ShopifyRestResources = any,
  S extends SessionStorage = SessionStorage,
>(config: AppConfig<R, S>): MiddlewareHandler<AppEnv> {
  return async (ctx, next) => {
    const api = shopifyApi(validateApiConfig(ctx, config.api || {}));

    ctx.set('config', {
      auth: config.auth,
      webhooks: config.webhooks,
      exitIframePath: config.exitIframePath ?? '/exitiframe',
      useOnlineTokens: config.useOnlineTokens ?? false,
    });
    ctx.set('logger', createLogger(api.logger));
    ctx.set('api', api);
    ctx.set('session-storage', config.sessionStorage);
    ctx.set(
      'shop',
      api.utils.sanitizeShop(ctx.req.query('shop') || '') ?? undefined,
    );
    ctx.set(
      'host',
      api.utils.sanitizeHost(ctx.req.query('host') || '') ?? undefined,
    );
    ctx.set('embedded', ctx.req.query('embedded') === '1');
    await next();
  };
}
