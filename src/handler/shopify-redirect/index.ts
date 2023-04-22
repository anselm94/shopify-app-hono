import {Context, Handler} from 'hono';

import {AppEnv} from '../../types';
import {getAppUrl} from '../../utils/common';

export function redirectToApp(): Handler {
  return async (ctx: Context<AppEnv>) => {
    const redirectUrl = await getAppUrl(ctx);
    return ctx.redirect(redirectUrl);
  };
}
