export interface AuthMiddleware {
  begin: () => RequestHandler;
  callback: () => RequestHandler;
}
export type ValidateAuthenticatedSessionMiddleware = () => RequestHandler;
export type EnsureInstalledMiddleware = () => RequestHandler;
export type CspHeadersMiddleware = () => RequestHandler;
export type RedirectToShopifyOrAppRootMiddleware = () => RequestHandler;
