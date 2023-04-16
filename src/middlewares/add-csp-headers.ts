import {MiddlewareHandler} from 'hono';
import {AppEnv} from 'types';

import {addCSPHeader} from '~utils/request';

export function cspHeaders(): MiddlewareHandler<AppEnv> {
  return async (ctx) => {
    addCSPHeader(ctx);
  };
}
