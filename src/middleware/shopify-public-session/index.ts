import {MiddlewareHandler} from 'hono';

import {getShopFrom} from '../../utils/common';

export function publicSession(): MiddlewareHandler {
  return async (ctx) => {
    const shop = await getShopFrom(ctx);
    const api = ctx.get('api');

    if (api.config.isEmbeddedApp && shop) {
      ctx.header(
        'Content-Security-Policy',
        `frame-ancestors https://${encodeURIComponent(
          shop,
        )} https://admin.shopify.com;`,
      );
    } else {
      ctx.header('Content-Security-Policy', `frame-ancestors 'none';`);
    }
  };
}
