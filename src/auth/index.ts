import {Handler} from 'hono';

import {authCallback} from './auth-callback';

import {AppEnv} from '~types/app';
import {redirectToAuth} from '~utils/redirect-to-auth';

export function auth() {
  return {
    begin(): Handler<AppEnv> {
      return (ctx) => {
        return redirectToAuth(ctx);
      };
    },
    callback(): Handler {
      return async (ctx, next) => {
        const ctxAppConfig = ctx.get('AppConfig');
        await ctxAppConfig.logger.info(
          'Handling request to complete OAuth process',
        );

        const oauthCompleted = await authCallback(ctx);

        if (oauthCompleted) {
          await next();
        }

        return ctx.res;
      };
    },
  };
}
