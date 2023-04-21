import {InvalidSession, InvalidShopError} from '@shopify/shopify-api';
import {Context, MiddlewareHandler, Next} from 'hono';

import {InvalidShopifyHonoConfig} from '#/error';
import {AppEnv} from '#/types';
import {getAppUrl, getShopFrom} from '#/utils/common';

export function embeddedShopifyAppAuth(): MiddlewareHandler<AppEnv> {
  return async (ctx: Context<AppEnv>, next: Next) => {
    const api = ctx.get('api');

    if (!api.config.isEmbeddedApp) {
      throw new InvalidShopifyHonoConfig(
        'Using Embedded App authentication validation for Standalone app',
      );
    }

    const shop = await getShopFrom(ctx);
    if (!shop) {
      throw new InvalidShopError();
    }

    if (!ctx.get('embedded')) {
      const embeddedAppUrl = await getAppUrl(ctx);
      return ctx.redirect(embeddedAppUrl);
    }

    const sessionId = api.session.getOfflineId(shop);
    const session = await ctx.get('session-storage').loadSession(sessionId);
    if (!session || session.isActive(api.config.scopes)) {
      throw new InvalidSession();
    }
    ctx.set('session', session);

    ctx.header(
      'Content-Security-Policy',
      `frame-ancestors https://${encodeURIComponent(
        shop,
      )} https://admin.shopify.com;`,
    );

    return next();
  };
}
