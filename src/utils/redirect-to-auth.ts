import {Context} from 'hono';
import {AppEnv} from 'types';

export async function redirectToAuth(
  ctx: Context<AppEnv>,
  isOnline = false,
): Promise<Response> {
  const ctxAppConfig = ctx.get('AppConfig');
  const shop = ctxAppConfig.api.utils.sanitizeShop(ctx.req.query('shop') || '');
  if (shop) {
    if (ctx.req.query('embedded') === '1') {
      return clientSideRedirect(ctx, shop);
    } else {
      return serverSideRedirect(ctx, shop, isOnline);
    }
  } else {
    await ctxAppConfig.logger.error('No shop provided to redirect to auth');

    ctx.status(500);
    return ctx.text('No shop provided');
  }
}

async function clientSideRedirect(
  ctx: Context<AppEnv>,
  shop: string,
): Promise<Response> {
  const ctxAppConfig = ctx.get('AppConfig');

  const host = ctxAppConfig.api.utils.sanitizeHost(ctx.req.query('host') || '');
  if (!host) {
    ctx.status(500);
    return ctx.text('No host provided');
  }

  const redirectUriParams = new URLSearchParams({shop, host}).toString();

  const appHost = `${ctxAppConfig.api.config.hostScheme}://${ctxAppConfig.api.config.hostName}`;
  const queryParams = new URLSearchParams({
    ...ctx.req.queries(),
    shop,
    redirectUri: `${appHost}${ctxAppConfig.auth.path}?${redirectUriParams}`,
  }).toString();

  await ctxAppConfig.logger.debug(
    `Redirecting to auth while embedded, going to ${ctxAppConfig.exitIframePath}`,
    {shop},
  );

  return ctx.redirect(`${ctxAppConfig.exitIframePath}?${queryParams}`);
}

async function serverSideRedirect(
  ctx: Context<AppEnv>,
  shop: string,
  isOnline: boolean,
): Promise<Response> {
  const ctxAppConfig = ctx.get('AppConfig');
  await ctxAppConfig.logger.debug(
    `Redirecting to auth at ${ctxAppConfig.auth.path}, with callback ${ctxAppConfig.auth.callbackPath}`,
    {shop, isOnline},
  );

  await ctxAppConfig.api.auth.begin({
    callbackPath: ctxAppConfig.auth.callbackPath,
    shop,
    isOnline,
    rawRequest: ctx.req,
    rawResponse: ctx.res,
  });

  return ctx.res;
}
