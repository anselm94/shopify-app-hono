import {Shopify} from '@shopify/shopify-api';
import {Context} from 'hono';

export interface WebhookHandlersParam {
  [topic: string]: WebhookHandler | WebhookHandler[];
}

export interface WebhookProcessParams {
  ctx: Context;
  api: Shopify;
  config: AppConfigInterface;
}

export interface ProcessWebhooksMiddlewareParams {
  webhookHandlers: WebhookHandlersParam;
}

export type ProcessWebhooksMiddleware = (
  params: ProcessWebhooksMiddlewareParams,
) => RequestHandler[];
