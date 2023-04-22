import {Context, Handler} from 'hono';

import {redirectToAuth} from '../../utils/redirect-to-auth';
import {AppEnv} from '../../types';

export function authBegin(): Handler {
  return (ctx: Context<AppEnv>) => {
    return redirectToAuth(ctx);
  };
}
