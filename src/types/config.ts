import {
  ConfigParams as ApiConfigParams,
  ShopifyRestResources,
} from '@shopify/shopify-api';
import {SessionStorage} from '@shopify/shopify-app-session-storage';

export interface AuthConfigParams {
  path: string;
  callbackPath: string;
  checkBillingPlans?: string[];
}

export interface WebhooksConfigParams {
  path: string;
}

export interface AppConfigParams<
  R extends ShopifyRestResources = any,
  S extends SessionStorage = SessionStorage,
> {
  auth: AuthConfigParams;
  webhooks: WebhooksConfigParams;
  sessionStorage: S;
  api?: Partial<ApiConfigParams<R>>;
  useOnlineTokens?: boolean;
  exitIframePath?: string;
}
