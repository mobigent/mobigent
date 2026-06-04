# API Reference

Start with the two-package path:

- `@mobigent/app`: app SDK for exposing app functions.
- `@mobigent/backend`: backend SDK for the agent-facing API, inspector, OpenAPI, MCP-ready routing, and app connections.

Lower-level packages exist inside the repo, but most developers should not need them on day one.

## App API

```ts
import { createApp } from "@mobigent/app";

export const mobigent = createApp("com.acme.expenses", {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

```tsx
import { mobigent } from "./mobigent/expenses";
import App from "./App";

export default mobigent.with(App);
```

Direct one-file wrapper:

```tsx
import { withMobigent } from "@mobigent/app";
import App from "./App";

export default withMobigent(App, "com.acme.expenses", {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

For non-React hosts, demos, and tests:

```ts
import { startMobigent } from "@mobigent/backend";
import { mobigent } from "./mobigent/expenses";

const backend = await startMobigent("com.acme.expenses");

const connection = await mobigent.connect(backend);
// Or pass the app-side settings explicitly:
const explicitConnection = await mobigent.connect(backend.appClient());

connection.disconnect();
explicitConnection.disconnect();
```

## Backend API

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent("com.acme.expenses");

await mobigent.app.expense.create({ merchant: "Coffee", amount: 8 });

console.log(mobigent.inspectorUrl);
console.log(mobigent.openApiUrl);
console.log(mobigent.agentUrl);
```

For local development, `startMobigent()` can infer a starter app identity from your project name:

```ts
const mobigent = await startMobigent();
```

The common backend object includes:

- `inspectorUrl`
- `apiUrl`
- `agentUrl`
- `openApiUrl`
- `appConnectionUrl`
- `appClient()` to produce app-side connection settings
- `app.expense.create(input)` or `app.expense.list()` to call app functions with the clean package API
- `use("expense", { createExpense: "create" })` to bind backend-friendly helper names
- `use("expense").create(input)` or `use("expense", ["create", "list"])` to bind app function groups
- `call("expense.create", input)` or `call("expense.list")`; pass `{ waitForApp: false }` only when you want an immediate failure if the app is not connected
- `fn("expense.create")` to create a reusable backend function
- `listFunctions()` to inspect discovered app functions
- `apps()` to inspect connected app sessions
- `waitForApp()` when you want an explicit startup health gate
- `resolveFunctionName("expense.create")`
- `stop()`

Advanced and compatibility fields are still available, but they should not be needed for the normal package path:

- `advanced` for lower-level server and transport details
- `advanced.urls.websocket`, `advanced.urls.http`, `advanced.urls.inspector`, and `advanced.urls.openapi` for transport details
- `advanced.appConfigPath` and `advanced.appConfigModulePath` for optional generated local files
- `advanced.appConfig({ appId, appName })`, `advanced.appConfigModule(...)`, and `advanced.copyAppConfig()` for manual app pairing artifacts
- `client()` as the older name for `appClient()`
- `app({ appId, appName })` when you need to produce a connection object for another app id
- `feature("expense")` and `functions.expense.create(input)` for older backend SDK styles
- `tools()`, `resolveToolName()`, `callApp()`, `function()`, `appFunction()`, `appFunctions()`, and `invoke()` for provider internals or backward compatibility

## Simple App Helpers

- `createApp(appId, functions)`: normal app setup.
- `createApp({ namespace: { name: fn } })`: quick local demo setup.
- `mobigent.with(App)`: wraps an existing React Native app.
- `mobigent.connect(backend)`: connects a non-React host or demo using the same app functions.
- `mobigent.connect(backend.appClient())`: connects with explicit app-side settings from the backend.
- `mobigent.emit(name, payload)`: emits app activity.
- `createApp(appId, functions, { connection: { host: "192.168.1.20" } })`: connects a physical phone to your local backend.
- `createApp(appId, functions, { connection: "wss://your-backend.example.com" })`: connects an app to a hosted backend.
- `read(handler, options)`: exposes app state.
- `write(handler, options)`: exposes confirmed app behavior.
- `screen(handler, options)`: lets an agent focus a screen or UI surface.

Advanced app helpers are still available from `@mobigent/app/app` when you need explicit internal objects or manual lifecycle control:

- `defineFunctions({ namespace: { name: read(fn) } })`
- `defineFeature(namespace, { name: read(fn), name: write(fn) })`
- `defineMobigent({ namespace: { name: read(fn) } })`: older alias for `defineFunctions`
- `defineMobigentConfig(config)`: typed compatibility helper
- `withMobigent(App, feature)`: older wrapper helper kept for compatibility.
- `setupMobigent(feature)`: wraps a React Native app once.
- `setupMobigent({ config, features })`: production form when you need exact app config.
- `connectMobigent(feature, options)`: lower-level connect helper.
- `registerFeatures(client, features)`: lower-level attach helper when you need manual lifecycle control.

## App Function Types

### Read

Expose app state without changing anything:

```ts
createApp("com.acme.store", {
  cart: {
    current: read(async () => getCart())
  }
});
```

### Write

Expose app behavior that changes state:

```ts
createApp("com.acme.store", {
  cart: {
    checkout: write(async (input) => checkout(input), {
      input: { paymentMethodId: "string" },
      confirm: "Place order?"
    })
  }
});
```

### Screen

Expose a focusable app surface:

```ts
createApp("com.acme.expenses", {
  expense: {
    detail: screen(async (props) => {
      navigation.navigate("ExpenseDetail", { id: props.id });
      return { focused: true };
    }, {
      props: { id: "string" }
    })
  }
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

## Advanced Internals

The app and backend packages own the public integration path. Internal packages still power schema validation, transport, provider mapping, and hosting, but app teams should reach for them only when building Mobigent itself or a custom hosting/runtime layer.
