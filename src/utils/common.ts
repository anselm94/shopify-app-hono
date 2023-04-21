import {InvalidHostError, InvalidShopError} from '@shopify/shopify-api';
import {Context} from 'hono';

import {AppEnv} from '#/types';

export function getBearerToken(ctx: Context<AppEnv>): string | undefined {
  const extText = ctx.req.headers.get('Authorization')?.match(/Bearer (.*)/);
  return extText ? extText[1] : undefined;
}

export async function getShopFrom(ctx: Context<AppEnv>) {
  const api = ctx.get('api');
  const session = ctx.get('session');
  const token = getBearerToken(ctx);
  if (session) {
    return session.shop;
  } else if (api.config.isEmbeddedApp && token) {
    const payload = await api.session.decodeSessionToken(token);
    return payload.dest.replace('https://', '');
  }
  return ctx.get('shop');
}

export async function getAppUrl(ctx: Context<AppEnv>) {
  const api = ctx.get('api');
  const embeddedAppUrl = await api.auth.getEmbeddedAppUrl({
    rawRequest: ctx.req,
    rawResponse: ctx.res,
  });
  if (api.config.isEmbeddedApp) {
    return `${embeddedAppUrl}/${ctx.req.path}`;
  } else {
    const shop = ctx.get('shop');
    if (!shop) {
      throw new InvalidShopError();
    }

    const host = ctx.get('host');
    if (!host) {
      throw new InvalidHostError();
    }

    return `/${ctx.req.path}?shop=${shop}&host=${encodeURIComponent(host)}`;
  }
}
