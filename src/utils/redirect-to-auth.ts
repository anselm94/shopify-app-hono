import {Context} from 'hono';

import {AppEnv} from '../types';

export async function redirectToAuth(
  ctx: Context<AppEnv>,
  isOnline = false,
): Promise<Response> {
  if (ctx.get('shop')) {
    if (ctx.get('embedded')) {
      return clientSideRedirect(ctx);
    } else {
      return serverSideRedirect(ctx, isOnline);
    }
  } else {
    await ctx.get('logger').error('No shop provided to redirect to auth');

    return ctx.text('No shop provided', 500);
  }
}

async function clientSideRedirect(ctx: Context<AppEnv>): Promise<Response> {
  const logger = ctx.get('logger');
  const api = ctx.get('api');
  const config = ctx.get('config');
  const shop = ctx.get('shop')!;
  const host = ctx.get('host');

  if (!host) {
    return ctx.text('No host provided', 500);
  }

  const redirectUriParams = new URLSearchParams({shop, host}).toString();

  const appHost = `${api.config.hostScheme}://${api.config.hostName}`;
  const queryParams = new URLSearchParams({
    ...ctx.req.queries(),
    shop,
    redirectUri: `${appHost}${config.auth.path}?${redirectUriParams}`,
  }).toString();

  logger.debug(
    `Redirecting to auth while embedded, going to ${config.exitIframePath}`,
    {shop},
  );

  return ctx.redirect(`${config.exitIframePath}?${queryParams}`);
}

async function serverSideRedirect(
  ctx: Context<AppEnv>,
  isOnline: boolean,
): Promise<Response> {
  const shop = ctx.get('shop')!;
  const config = ctx.get('config');
  const logger = ctx.get('logger');

  logger.debug(
    `Redirecting to auth at ${config.auth.path}, with callback ${config.auth.callbackPath}`,
    {shop, isOnline},
  );

  return ctx.get('api').auth.begin({
    callbackPath: config.auth.callbackPath,
    shop,
    isOnline,
    rawRequest: ctx.req,
    rawResponse: ctx.res,
  });
}
