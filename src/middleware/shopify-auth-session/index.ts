import {Context, MiddlewareHandler} from 'hono';

import {AppEnv} from '../../types';

import {embeddedShopifyAppAuth} from './embedded-app-auth';
import {standaloneShopifyAppAuth} from './standalone-app-auth';

export function shopifyAuthenticatedSession(): MiddlewareHandler {
  return async (ctx: Context<AppEnv>, next) => {
    if (ctx.get('api').config.isEmbeddedApp) {
      return embeddedShopifyAppAuth()(ctx, next);
    } else {
      return standaloneShopifyAppAuth()(ctx, next);
    }
  };
}
