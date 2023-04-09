import {Context, MiddlewareHandler} from 'hono';
import {AppEnv} from 'types';

export function cspHeaders(): MiddlewareHandler<AppEnv> {
  return async (ctx) => {
    addCSPHeader(ctx);
  };
}

export function addCSPHeader(ctx: Context<AppEnv>) {
  const ctxAppConfig = ctx.get('AppConfig');
  const shop = ctxAppConfig.api.utils.sanitizeShop(ctx.req.query('shop') || '');
  if (ctxAppConfig.api.config.isEmbeddedApp && shop) {
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
