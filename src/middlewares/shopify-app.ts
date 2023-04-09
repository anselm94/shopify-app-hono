import {ShopifyRestResources, shopifyApi} from '@shopify/shopify-api';
import {SessionStorage} from '@shopify/shopify-app-session-storage';
import {Context, MiddlewareHandler} from 'hono';
import {overrideLogger, validateApiConfig} from 'utils/config';

import {AppConfigParams} from '~types/config';
import {AppConfigContext, AppEnv} from '~types/app';

function createAppConfigContext<
  R extends ShopifyRestResources = any,
  S extends SessionStorage = SessionStorage,
>(ctx: Context<AppEnv>, config: AppConfigParams<R, S>): AppConfigContext {
  const api = shopifyApi(validateApiConfig(ctx, config.api || {}));
  return {
    config,
    api,
    useOnlineTokens: config.useOnlineTokens ?? false,
    exitIframePath: config.exitIframePath ?? '/exitiframe',
    sessionStorage: config.sessionStorage,
    auth: config.auth,
    webhooks: config.webhooks,
    logger: overrideLogger(api.logger),
  };
}

export function shopifyApp<
  R extends ShopifyRestResources = any,
  S extends SessionStorage = SessionStorage,
>(params: AppConfigParams<R, S>): MiddlewareHandler<AppEnv> {
  return async (ctx, next) => {
    ctx.set('AppConfig', createAppConfigContext(ctx, params));
    await next();
  };
}
