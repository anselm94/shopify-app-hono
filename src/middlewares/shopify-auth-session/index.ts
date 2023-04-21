import {MiddlewareHandler} from 'hono';

import {embeddedShopifyAppAuth} from './embedded-app-auth';
import {standaloneShopifyAppAuth} from './standalone-app-auth';

import {AppEnv} from '#/types';

export function validateAuthenticatedSession(): MiddlewareHandler<AppEnv> {
  return async (ctx, next) => {
    if (ctx.get('api').config.isEmbeddedApp) {
      return embeddedShopifyAppAuth()(ctx, next);
    } else {
      return standaloneShopifyAppAuth()(ctx, next);
    }
  };
}
