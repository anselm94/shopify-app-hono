import {Session} from '@shopify/shopify-api';
import {SessionStorage} from '@shopify/shopify-app-session-storage';

export class AppInstallations {
  private sessionStorage;

  constructor(sessionStorage: SessionStorage) {
    if (!sessionStorage.findSessionsByShop) {
      throw new Error(
        'To use this package, you must provide a session storage manager that implements findSessionsByShop',
      );
    }
    if (!sessionStorage.deleteSessions) {
      throw new Error(
        'To use this package, you must provide a session storage manager that implements deleteSessions',
      );
    }
    this.sessionStorage = sessionStorage;
  }

  async includes(shopDomain: string): Promise<boolean> {
    const shopSessions = await this.sessionStorage.findSessionsByShop(
      shopDomain,
    );
    if (shopSessions.length > 0) {
      for (const session of shopSessions) {
        if (session.accessToken) return true;
      }
    }
    return false;
  }

  async delete(shopDomain: string): Promise<void> {
    const shopSessions = await this.sessionStorage.findSessionsByShop(
      shopDomain,
    );
    if (shopSessions.length > 0) {
      await this.sessionStorage.deleteSessions(
        shopSessions.map((session: Session) => session.id),
      );
    }
  }
}
