import {Context, MiddlewareHandler} from 'hono';

import {AppEnv} from '../../types';

import {embeddedAppSession} from './embedded-app-auth';
import {standaloneAppSession} from './standalone-app-auth';

export function authSession(): MiddlewareHandler {
  return async (ctx: Context<AppEnv>, next) => {
    if (ctx.get('api').config.isEmbeddedApp) {
      return embeddedAppSession()(ctx, next);
    } else {
      return standaloneAppSession()(ctx, next);
    }
  };
}
