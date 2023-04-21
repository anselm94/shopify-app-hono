import {MiddlewareHandler} from 'hono';

import {AppEnv} from '#/types';
import {getAppUrl} from '#/utils/common';

export function shopifyRedirect(): MiddlewareHandler<AppEnv> {
  return async (ctx) => {
    const redirectUrl = await getAppUrl(ctx);
    return ctx.redirect(redirectUrl);
  };
}
