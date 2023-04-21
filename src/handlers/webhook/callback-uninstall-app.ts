import {Session, WebhookHandlerFunction} from '@shopify/shopify-api';
import {Context} from 'hono';

import {AppEnv} from '#/types';

export const uninstallAppCallback = (
  ctx: Context<AppEnv>,
): WebhookHandlerFunction => {
  return async (
    _topic: string,
    shop: string,
    _body: any,
    _webhookId: string,
  ) => {
    const sessionStorage = ctx.get('session-storage');
    const shopSessions = await sessionStorage.findSessionsByShop(shop);
    if (shopSessions.length > 0) {
      await sessionStorage.deleteSessions(
        shopSessions.map((session: Session) => session.id),
      );
    }
  };
};
