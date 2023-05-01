# `@anselm94/shopify-app-hono`

<!-- ![Build Status]() -->

> **Warning**
> 
> This is an alpha experimental software. Please use it with caution.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)
[![npm version](https://badge.fury.io/js/%40anselm94%2Fshopify-app-hono.svg)](https://badge.fury.io/js/%40anselm94%2Fshopify-app-hono)

This package makes it easy for [Hono](https://hono.dev/) edge web apps to integrate with Shopify.
It builds on the `@shopify/shopify-api` package and creates a middleware layer that allows the app to communicate with and authenticate requests from Shopify.

> **Note**: this package will enable your app's backend to work with Shopify APIs, and by default it will behave as an [embedded app](https://shopify.dev/docs/apps/auth/oauth/session-tokens). You'll need to use [Shopify App Bridge](https://shopify.dev/docs/apps/tools/app-bridge) in your frontend to authenticate requests to the backend.

## Requirements

To follow these usage guides, you will need to:

- have a Shopify Partner account and development store
- have an app already set up on your partner account
- have a JavaScript package manager such as [yarn](https://yarnpkg.com) installed

## Getting started

To install this package, you can run this on your terminal:

```bash
# Create your project folder
mkdir /my/project/path
# Set up a new yarn project
yarn init .
# You can use your preferred Node package manager
yarn add @anselm94/shopify-app-hono
```

Then, you can import the package in your app by creating a `.js` file depending on your edge runtime containing:

```ts
// Import shopify-app-hono adapter for shopify-api for adapting 'hono'
import "@anselm94/shopify-app-hono/adapter";

// Import shopify-app-hono related dependencies for config, handler and middleware
import { ShopifyHonoAppConfig, shopifyHandler, shopifyMiddleware } from "@anselm94/shopify-app-hono";

// Import Hono and adapters for various runtime
import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages"; // Cloudflare Pages

// create shopify-app-hono config
const config: ShopifyHonoAppConfig = {
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/webhooks",
  },
  sessionStorage: new KVSessionStorage(),
};

// create a new Hono app
const app = new Hono().basePath("/api");

// Middlewares //
app.use("*", shopifyMiddleware.shopifyApp(config)); // mandatory to register this before any middleware/handler
app.use("/products/*", shopifyMiddleware.authSession()); // protected routes
app.use("/public/*", shopifyMiddleware.publicSession()); // unprotected routes

// Handlers //
app.get("/auth", shopifyHandler.authBegin()); // handle oauth flow begin
app.get("/auth/callback", shopifyHandler.authCallback()); // handle oauth flow callback
app.post(config.webhooks.path, shopifyHandler.webhooks(webhookHandlers)); // handle webhooks

// Your API //
app.get("/products/count", (c) => {
  return c.json({ count: 99 });
});

// hono handle requests
export const onRequest = handle(app);
```

Once you set the appropriate configuration values, you can then run your app depending on your runtime:

```bash
# Cloudflare Pages
wrangler pages dev
```

To load your app within the Shopify Admin app, you need to:

1. Update your app's URL in your Partners Dashboard app setup page to `http://localhost:8080`
2. Update your app's callback URL to `http://localhost:8080/api/auth/callback` in that same page
3. Go to **Test your app** in Partners Dashboard and select your development store

## Next steps

Now that your app is up and running, you can learn more about the `shopifyApp` object in [the reference docs](./docs/reference/shopifyApp.md).
