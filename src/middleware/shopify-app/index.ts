import {
  CookieNotFound,
  InvalidHostError,
  InvalidJwtError,
  InvalidOAuthError,
  InvalidSession,
  InvalidShopError,
  ShopifyRestResources,
  shopifyApi,
} from '@shopify/shopify-api';
import {SessionStorage} from '@shopify/shopify-app-session-storage';
import {Context, MiddlewareHandler} from 'hono';

import {InvalidAppInstallationError} from '../../error';
import {ShopifyHonoAppConfig, AppEnv} from '../../types';
import {createLogger, normalizeApiConfig} from '../../utils/config';
import {redirectToAuth} from '../../utils/redirect-to-auth';

export function shopifyApp<
  R extends ShopifyRestResources = any,
  S extends SessionStorage = SessionStorage,
>(config: ShopifyHonoAppConfig<R, S>): MiddlewareHandler {
  return async (ctx: Context<AppEnv>, next) => {
    const api = shopifyApi(normalizeApiConfig(ctx, config.api || {}));

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

    if (ctx.error) {
      if (ctx.error instanceof InvalidOAuthError) {
        return ctx.text(ctx.error.message, 400);
      } else if (ctx.error instanceof CookieNotFound) {
        return redirectToAuth(ctx);
      } else if (ctx.error instanceof InvalidSession) {
        return redirectToAuth(ctx);
      } else if (ctx.error instanceof InvalidAppInstallationError) {
        return redirectToAuth(ctx);
      } else if (ctx.error instanceof InvalidJwtError) {
        return ctx.text(ctx.error.message, 401);
      } else if (ctx.error instanceof InvalidShopError) {
        api.logger.error(
          'ensureInstalledOnShop did not receive a valid shop query argument',
          {shop: ctx.req.query('shop')},
        );
        return ctx.text('Invalid shop provided', 422);
      } else if (ctx.error instanceof InvalidHostError) {
        api.logger.error(
          `ensureInstalledOnShop did not receive a host query argument`,
        );
        return ctx.text('No host provided', 400);
      } else {
        return ctx.text(ctx.error.message, 500);
      }
    } else {
      return ctx.res;
    }
  };
}
