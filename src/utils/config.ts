import {
  ConfigParams as ApiConfigParams,
  FeatureDeprecatedError,
  LATEST_API_VERSION,
  Shopify,
  ShopifyRestResources,
} from '@shopify/shopify-api';
import {Context} from 'hono';
import * as semver from 'semver';

import {LIB_VERSION} from '../version';

import {AppEnv} from '~types/app';

export function overrideLogger(logger: Shopify['logger']): Shopify['logger'] {
  const baseContext = {package: 'shopify-app'};

  return {
    ...logger,
    log: async (severity, message, context = {}) =>
      logger.log(severity, message, {...baseContext, ...context}),
    debug: async (message, context = {}) =>
      logger.debug(message, {...baseContext, ...context}),
    info: async (message, context = {}) =>
      logger.info(message, {...baseContext, ...context}),
    warning: async (message, context = {}) =>
      logger.warning(message, {...baseContext, ...context}),
    error: async (message, context = {}) =>
      logger.error(message, {...baseContext, ...context}),
    deprecated: async (version: string, message: string) => {
      if (semver.gte(LIB_VERSION, version)) {
        throw new FeatureDeprecatedError(
          `Feature was deprecated in version ${version}`,
        );
      }
      logger.warning(`[Deprecated | ${version}] ${message}`, {...baseContext});
    },
  };
}

export function validateApiConfig<R extends ShopifyRestResources = any>(
  ctx: Context<AppEnv>,
  config: Partial<ApiConfigParams<R>>,
): ApiConfigParams<R> {
  let userAgent = `Shopify Hono Library v${LIB_VERSION}`;

  if (config.userAgentPrefix) {
    userAgent = `${config.userAgentPrefix} | ${userAgent}`;
  }
  return {
    apiKey: ctx.env.SHOPIFY_API_KEY!,
    apiSecretKey: ctx.env.SHOPIFY_API_SECRET!,
    scopes: ctx.env.SCOPES?.split(',')!,
    hostScheme: (ctx.env.HOST?.split('://')[0] as 'http' | 'https')!,
    hostName: ctx.env.HOST?.replace(/https?:\/\//, '')!,
    isEmbeddedApp: true,
    apiVersion: LATEST_API_VERSION,
    ...(ctx.env.SHOP_CUSTOM_DOMAIN && {
      customShopDomains: [ctx.env.SHOP_CUSTOM_DOMAIN],
    }),
    ...config,
    userAgentPrefix: userAgent,
  };
}
