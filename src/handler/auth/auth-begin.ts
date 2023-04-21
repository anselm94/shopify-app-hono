import {Context, Handler} from 'hono';

import {redirectToAuth} from '../../utils/redirect-to-auth';
import {AppEnv} from '../../types';

export function shopifyAuthBegin(): Handler {
  return (ctx: Context<AppEnv>) => {
    return redirectToAuth(ctx);
  };
}
