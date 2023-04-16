import {Context} from 'hono';
import {AppEnv} from 'types';

import {hasBearerToken} from './request';

export async function returnTopLevelRedirection(
  ctx: Context<AppEnv>,
  redirectUrl: string,
): Promise<Response> {
  const logger = ctx.get('logger');
  // If the request has a bearer token, the app is currently embedded, and must break out of the iframe to
  // re-authenticate
  if (hasBearerToken(ctx)) {
    await logger.debug(
      `Redirecting to top level at ${redirectUrl} while embedded, returning headers`,
    );

    return ctx.text('Unauthorized', 403, {
      'X-Shopify-API-Request-Failure-Reauthorize': '1',
      'X-Shopify-API-Request-Failure-Reauthorize-Url': redirectUrl,
    });
  } else {
    await logger.debug(`Redirecting to ${redirectUrl} while at the top level`);

    return ctx.redirect(redirectUrl);
  }
}
