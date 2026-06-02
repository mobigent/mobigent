# API Reference

Start with the two-package path:

- `@mobigent/app`: app SDK for exposing app functions.
- `@mobigent/backend`: backend SDK for the agent-facing API, inspector, OpenAPI, MCP-ready routing, and app connections.

Lower-level protocol packages still exist, but most developers should not need them on day one.

## App API

```ts
import { createApp, defineFeature, read, write } from "@mobigent/app";

export const expenses = defineFeature("expense", {
  list: read(async () => ({ items: await listExpenses() })),
  create: write(async (input) => createExpense(input), {
    input: {
      merchant: "string",
      amount: "number"
    },
    confirm: true
  })
});

export const mobigent = createApp({ features: expenses });
```

```tsx
import { mobigent } from "./mobigent/expenses";
import App from "./App";

export default mobigent.with(App);
```

For non-React hosts, demos, and tests:

```ts
import { startMobigent } from "@mobigent/backend";
import { createApp } from "@mobigent/app";
import { expenses } from "./mobigent/expenses";

const backend = await startMobigent();
const mobigent = createApp({
  features: expenses,
  connectionUrl: backend.defaultApp.connectionUrl
});

const connection = await mobigent.connect();

connection.disconnect();
```

## Backend API

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appDir: "../mobile-app"
});

console.log(mobigent.urls.inspector);
console.log(mobigent.urls.openapi);
console.log(mobigent.appConfigPath);
console.log(mobigent.appConfigModulePath);

const appConfig = mobigent.defaultApp;
```

For local development, `startMobigent()` can infer `defaultApp` from your project name:

```ts
const mobigent = await startMobigent();
const appConfig = mobigent.defaultApp;
```

The returned object includes:

- `urls.websocket`
- `urls.http`
- `urls.inspector`
- `urls.openapi`
- `appConfigPath`
- `appConfigModulePath`
- `app({ appId, appName })`
- `appConfig({ appId, appName })`
- `copyAppConfig()` for advanced manual config generation
- `functions()`
- `tools()` for backward compatibility and provider internals
- `apps()`
- `waitForApp()` to wait until an app is connected and callable
- `feature("expense")` to create a tiny object of normal backend functions for one app feature
- `appFunctions("expense")` for the same feature-scoped helper
- `appFunctions({ createExpense: "expense.create" })` when you prefer explicit aliases
- `callApp("expense.create", input)` or `callApp("expense.list")`
- `appFunction("expense.create")` to create a reusable backend function
- `invoke("expense.create", input)` for compatibility
- `fn("expense.create")` for compatibility
- `call("expense.create", input)` for backward compatibility
- `resolveFunctionName("expense.create")`
- `resolveToolName("expense.create")` for backward compatibility
- `stop()`

## Simple App Helpers

- `defineFeature(namespace, { name: read(fn), name: write(fn) })`: creates a small app feature.
- `createApp({ features })`: creates the app-side SDK object.
- `mobigent.with(App)`: wraps an existing React Native app.
- `mobigent.connect()`: connects a non-React host or demo using the same features.
- `mobigent.emit(name, payload)`: emits app activity.
- `defineMobigent({ namespace: { name: read(fn) } })`: creates multiple app areas from one plain object.
- `defineMobigentConfig(config)`: gives app config a stable SDK type.
- New configs use `connectionUrl`; existing `gatewayUrl` configs still work.
- `read(handler, options)`: exposes app state.
- `write(handler, options)`: exposes confirmed app behavior.
- `screen(handler, options)`: lets an agent focus a screen or UI surface.
- `withMobigent(App, feature)`: older wrapper helper kept for compatibility.
- `setupMobigent(feature)`: wraps a React Native app once.
- `setupMobigent({ config, features })`: production form when you need exact app config.
- `connectMobigent(feature, options)`: lower-level connect helper.
- `registerFeatures(client, features)`: lower-level attach helper when you need manual lifecycle control.

## Capability Types

### Read

Expose app state without changing anything:

```ts
defineFeature("cart", {
  current: read(async () => getCart())
});
```

### Write

Expose app behavior that changes state:

```ts
defineFeature("cart", {
  checkout: write(async (input) => checkout(input), {
    input: { paymentMethodId: "string" },
    confirm: "Place order?"
  })
});
```

### Screen

Expose a focusable app surface:

```ts
defineFeature("expense", {
  detail: screen(async (props) => {
    navigation.navigate("ExpenseDetail", { id: props.id });
    return { focused: true };
  }, {
    props: { id: "string" }
  })
});
```

## Field Maps

```ts
{
  title: "string",
  amount: "number",
  count: "integer",
  approved: "boolean",
  category: ["Meals", "Travel", "Office"],
  tags: ["string"]
}
```

Full JSON Schema and lower-level `schema.*` helpers are still available for advanced shapes.

## Advanced Packages

- `@mobigent/core`: shared protocol, manifests, schemas, and validation.
- `@mobigent/gateway`: lower-level gateway, HTTP/OpenAPI server, and MCP stdio server.
- `@mobigent/providers`: provider setup helpers and runtime adapters behind `mobigent.agent(...)`.
