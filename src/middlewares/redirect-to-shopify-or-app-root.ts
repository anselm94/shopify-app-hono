import {Handler} from 'hono';
import {AppEnv} from 'types';

export function redirectToShopifyOrAppRoot(): Handler<AppEnv> {
  return async (ctx) => {
    const ctxAppConfig = ctx.get('AppConfig');
    const session = ctx.get('Session');

    const host = ctxAppConfig.api.utils.sanitizeHost(
      ctx.req.query('host') || '',
    );
    const redirectUrl = ctxAppConfig.api.config.isEmbeddedApp
      ? await ctxAppConfig.api.auth.getEmbeddedAppUrl({
          rawRequest: ctx.req,
          rawResponse: ctx.res,
        })
      : `/?shop=${session.shop}&host=${encodeURIComponent(host || '')}`;

    await ctxAppConfig.logger.debug(`Redirecting to host at ${redirectUrl}`, {
      shop: session.shop,
    });

    return ctx.redirect(redirectUrl);
  };
}
