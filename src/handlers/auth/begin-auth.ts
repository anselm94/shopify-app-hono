import {Handler} from 'hono';

import {AppEnv} from '#/types';
import {redirectToAuth} from '#/utils/redirect-to-auth';

export function beginAuth(): Handler<AppEnv> {
  return (ctx) => {
    return redirectToAuth(ctx);
  };
}
