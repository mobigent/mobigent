# API Reference

Start with the two-package path:

- `@mobigent/app`: app SDK for exposing app functions.
- `@mobigent/backend`: backend SDK for the agent-facing API, inspector, OpenAPI, MCP-ready routing, and app connections.

Lower-level protocol packages still exist, but most developers should not need them on day one.

## App API

```ts
import { createApp, read, write } from "@mobigent/app";

export const mobigent = createApp({
  functions: {
    expense: {
      list: read(async () => ({ items: await listExpenses() })),
      create: write(async (input) => createExpense(input), {
        input: {
          merchant: "string",
          amount: "number"
        },
        confirm: true
      })
    }
  }
});
```

```tsx
import { mobigent } from "./mobigent/expenses";
import App from "./App";

export default mobigent.with(App);
```

For non-React hosts, demos, and tests:

```ts
import { startMobigent } from "@mobigent/backend";
import { mobigent } from "./mobigent/expenses";

const backend = await startMobigent({
  appId: "com.acme.expenses"
});

const connection = await mobigent.connect(backend);

connection.disconnect();
```

## Backend API

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appId: "com.acme.expenses",
  appName: "Acme Expenses"
});

console.log(mobigent.inspectorUrl);
console.log(mobigent.openApiUrl);
```

For local development, `startMobigent()` can infer a starter app identity from your project name:

```ts
const mobigent = await startMobigent();
```

The returned object includes:

- `inspectorUrl`
- `apiUrl`
- `openApiUrl`
- `advanced` for lower-level gateway, server, URL, and generated-config details
- `urls.websocket`, `urls.http`, `urls.inspector`, and `urls.openapi` for backward compatibility
- `appConfigPath`
- `appConfigModulePath`
- `app({ appId, appName })`
- `appConfig({ appId, appName })`
- `copyAppConfig()` for advanced manual config generation
- `listFunctions()`
- `functions()` for backward compatibility
- `tools()` for provider internals
- `apps()`
- `waitForApp()` when you want an explicit startup health gate
- `feature("expense")` to create a tiny object of normal backend functions for one app feature; calls wait for the app function by default
- `callApp("expense.create", input)` or `callApp("expense.list")`; pass `{ waitForApp: false }` only when you want an immediate failure if the app is not connected
- `function("expense.create")` to create a reusable backend function
- `appFunction("expense.create")` for backward compatibility
- `appFunctions("expense")` for backward compatibility
- `appFunctions({ createExpense: "expense.create" })` for backward compatibility
- `invoke("expense.create", input)` for compatibility
- `fn("expense.create")` for compatibility
- `call("expense.create", input)` for backward compatibility
- `resolveFunctionName("expense.create")`
- `resolveToolName("expense.create")` for backward compatibility
- `stop()`

## Simple App Helpers

- `createApp({ functions: { namespace: { name: read(fn), name: write(fn) } } })`: creates the app-side SDK object.
- `mobigent.with(App)`: wraps an existing React Native app.
- `mobigent.connect(backend)`: connects a non-React host or demo using the same features.
- `mobigent.emit(name, payload)`: emits app activity.
- `defineFunctions({ namespace: { name: read(fn) } })`: converts a functions object to explicit features.
- `defineFeature(namespace, { name: read(fn), name: write(fn) })`: creates a named feature when you prefer an explicit feature object.
- `createApp({ features })`: creates the app-side SDK object from explicit features.
- `defineMobigent({ namespace: { name: read(fn) } })`: older alias for `defineFunctions`.
- `defineMobigentConfig(config)`: gives app config a stable SDK type.
- Advanced configs can pass `connectionUrl`; existing `gatewayUrl` configs still work.
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
