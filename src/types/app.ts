import {Session, Shopify, ShopifyRestResources} from '@shopify/shopify-api';
import {SessionStorage} from '@shopify/shopify-app-session-storage';
import {Env} from 'hono';

import {
  AppConfigParams,
  AuthConfigParams,
  WebhooksConfigParams,
} from './config';

export interface AppEnv extends Env {
  Bindings: {
    SHOPIFY_API_KEY?: string;
    SHOPIFY_API_SECRET?: string;
    SCOPES?: string;
    HOST?: string;
    SHOP_CUSTOM_DOMAIN?: string;
  };
  Variables: {
    AppConfig: AppConfigContext;
    Session: Session;
  };
}

export interface AppConfigContext<
  R extends ShopifyRestResources = any,
  S extends SessionStorage = SessionStorage,
> {
  config: AppConfigParams<R, S>;
  auth: AuthConfigParams;
  webhooks: WebhooksConfigParams;
  api: Shopify<R>;
  useOnlineTokens: boolean;
  exitIframePath: string;
  sessionStorage: S;
  logger: Shopify['logger'];
}
