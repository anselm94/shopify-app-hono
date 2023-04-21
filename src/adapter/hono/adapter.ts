import {ShopifyError} from '@shopify/shopify-api/lib/error';
import {
  canonicalizeHeaders,
  flatHeaders,
  AdapterArgs,
  NormalizedRequest,
  NormalizedResponse,
  Headers,
  addHeader,
} from '@shopify/shopify-api/runtime/http';
import {HonoRequest} from 'hono';

interface HonoAdapterArgs extends AdapterArgs {
  rawRequest: HonoRequest;
  rawResponse?: Response;
}

type HonoHeaders = [string, string][];

export async function honoConvertRequest(
  adapterArgs: HonoAdapterArgs,
): Promise<NormalizedRequest> {
  const request = adapterArgs.rawRequest;
  const headers = {};
  request.headers.forEach((value, key) => addHeader(headers, key, value));

  const url = new URL(request.url);
  return {
    headers,
    method: request.method,
    url: `${url.pathname}${url.search}${url.hash}`,
  };
}

export async function honoConvertResponse(
  resp: NormalizedResponse,
  adapterArgs: HonoAdapterArgs,
): Promise<Response> {
  return new Response(resp.body, {
    status: resp.statusCode,
    statusText: resp.statusText,
    headers: await honoConvertHeaders(resp.headers ?? {}, adapterArgs),
  });
}

export async function honoConvertHeaders(
  headers: Headers,
  _adapterArgs: HonoAdapterArgs,
): Promise<HonoHeaders> {
  return Promise.resolve(flatHeaders(headers ?? {}));
}

export async function honoFetch({
  url,
  method,
  headers = {},
  body,
}: NormalizedRequest): Promise<NormalizedResponse> {
  const resp = await fetch(url, {method, headers: flatHeaders(headers), body});
  const respBody = await resp.text();
  const respHeaders: Headers = {};
  resp.headers.forEach((value, key) => (respHeaders[key] = value));
  return {
    statusCode: resp.status,
    statusText: resp.statusText,
    body: respBody,
    headers: canonicalizeHeaders(respHeaders),
  };
}

export function honoCreateDefaultStorage(): never {
  throw new ShopifyError(
    'You must specify a session storage implementation for Hono',
  );
}

// adapted from https://github.com/honojs/hono/blob/532632aa88c29b8c156090a05a1d55da729bfb12/src/context.ts#L343-L383
export function honoRuntimeString(): string {
  const global = globalThis as any;

  if (global?.Deno !== undefined) {
    return 'Deno';
  }

  if (global?.Bun !== undefined) {
    return 'Bun';
  }

  if (typeof global?.WebSocketPair === 'function') {
    return 'workerd';
  }

  if (typeof global?.EdgeRuntime === 'string') {
    return 'Edge Runtime';
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {env} = require('fastly:env');
    if (env instanceof Function) return 'Fastly Compute';
  } catch {
    // do nothing
  }

  if (global?.__lagon__ !== undefined) {
    return 'Lagon';
  }

  if (global?.process?.release?.name === 'node') {
    return 'Node';
  }

  return 'other';
}
