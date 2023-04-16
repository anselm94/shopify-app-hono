import {Context} from 'hono';
import {AppEnv} from 'types';

export function getBearerToken(ctx: Context<AppEnv>): string | undefined {
  const extText = ctx.req.headers.get('Authorization')?.match(/Bearer (.*)/);
  return extText ? extText[1] : undefined;
}

export function hasBearerToken(ctx: Context<AppEnv>): boolean {
  return getBearerToken(ctx) !== undefined;
}

export function addCSPHeader(ctx: Context<AppEnv>) {
  const shop = ctx.get('shop');
  if (ctx.get('api').config.isEmbeddedApp && shop) {
    ctx.header(
      'Content-Security-Policy',
      `frame-ancestors https://${encodeURIComponent(
        shop,
      )} https://admin.shopify.com;`,
    );
  } else {
    ctx.header('Content-Security-Policy', `frame-ancestors 'none';`);
  }
}
