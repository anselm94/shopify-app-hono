import {Context} from 'hono';

import {AppEnv} from '~types/app';

export async function returnTopLevelRedirection(
  ctx: Context<AppEnv>,
  redirectUrl: string,
  bearerPresent: boolean,
): Promise<Response> {
  const ctxAppConfig = ctx.get('AppConfig');
  // If the request has a bearer token, the app is currently embedded, and must break out of the iframe to
  // re-authenticate
  if (bearerPresent) {
    await ctxAppConfig.logger.debug(
      `Redirecting to top level at ${redirectUrl} while embedded, returning headers`,
    );

    ctx.status(403);
    ctx.header('X-Shopify-API-Request-Failure-Reauthorize', '1');
    ctx.header('X-Shopify-API-Request-Failure-Reauthorize-Url', redirectUrl);

    return ctx.res;
  } else {
    await ctxAppConfig.logger.debug(
      `Redirecting to ${redirectUrl} while at the top level`,
    );

    return ctx.redirect(redirectUrl);
  }
}
