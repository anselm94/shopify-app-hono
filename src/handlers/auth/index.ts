import {Handler} from 'hono';

import {authCallback} from './auth-callback';
import {beginAuth} from './begin-auth';

import {AppEnv} from '#/types';

export function auth() {
  return {
    begin(): Handler<AppEnv> {
      return beginAuth();
    },
    callback(): Handler<AppEnv> {
      return authCallback();
    },
  };
}
