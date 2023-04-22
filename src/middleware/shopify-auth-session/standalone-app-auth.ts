import {InvalidSession} from '@shopify/shopify-api';
import {Context, MiddlewareHandler, Next} from 'hono';

import {InvalidShopifyHonoConfig} from '../../error';
import {AppEnv} from '../../types';
import {getShopFrom} from '../../utils/common';

export function standaloneAppSession(): MiddlewareHandler {
  return async (ctx: Context<AppEnv>, next: Next) => {
    const api = ctx.get('api');
    const config = ctx.get('config');

    if (api.config.isEmbeddedApp) {
      throw new InvalidShopifyHonoConfig(
        'Using Standalone App authentication validation for a Embedded app',
      );
    }

    const sessionId = await api.session.getCurrentId({
      isOnline: config.useOnlineTokens,
      rawRequest: ctx.req,
      rawResponse: ctx.res,
    });
    if (!sessionId) {
      throw new InvalidSession();
    }

    const session = await ctx.get('session-storage').loadSession(sessionId);
    if (!session || !session.isActive(api.config.scopes)) {
      throw new InvalidSession();
    }
    ctx.set('session', session);

    const shop = await getShopFrom(ctx);
    ctx.set('shop', shop);

    if (shop && session.shop !== shop) {
      throw new InvalidSession();
    }

    ctx.header('Content-Security-Policy', `frame-ancestors 'none';`);

    return next();
  };
}
