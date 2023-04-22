import {
  ConfigParams as ApiConfigParams,
  Session,
  Shopify,
  ShopifyRestResources,
} from '@shopify/shopify-api';
import {SessionStorage} from '@shopify/shopify-app-session-storage';
import {Env} from 'hono';

export interface AppEnv<
  R extends ShopifyRestResources = any,
  S extends SessionStorage = SessionStorage,
> extends Env {
  Bindings: {
    SHOPIFY_API_KEY?: string;
    SHOPIFY_API_SECRET?: string;
    SCOPES?: string;
    HOST?: string;
    SHOP_CUSTOM_DOMAIN?: string;
  };
  Variables: {
    config: AppConfigParams;
    logger: Shopify['logger'];
    api: Shopify<R>;
    'session-storage': S;
    shop?: string;
    host?: string;
    embedded: boolean;
    session?: Session;
  };
}

export interface AuthConfigParams {
  path: string;
  callbackPath: string;
  checkBillingPlans?: string[];
}

export interface WebhooksConfigParams {
  path: string;
}

export interface AppConfigParams {
  auth: AuthConfigParams;
  webhooks: WebhooksConfigParams;
  useOnlineTokens: boolean;
  exitIframePath: string;
}

export interface ShopifyHonoAppConfig<
  R extends ShopifyRestResources = any,
  S extends SessionStorage = SessionStorage,
> extends Partial<AppConfigParams> {
  auth: AuthConfigParams;
  webhooks: WebhooksConfigParams;
  sessionStorage: S;
  api?: Partial<ApiConfigParams<R>>;
}
