# API Reference

Start with the two-package path:

- `@mobigent/app`: app SDK for exposing app functions.
- `@mobigent/backend`: backend SDK for the agent-facing API, inspector, OpenAPI, MCP-ready routing, and app connections.

Lower-level packages exist inside the repo, but most developers should not need them on day one.

## App API

```ts
import { createApp } from "@mobigent/app";

export const mobigent = createApp({
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

export default withMobigent(App, {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

For non-React hosts, demos, and tests:

```ts
import { startMobigent } from "@mobigent/backend";
import { createApp } from "@mobigent/app";
import { expenseFunctions } from "./app-functions";

const backend = await startMobigent();
const mobigent = createApp(expenseFunctions, {
  backend
});

const connection = await mobigent.connect();

connection.disconnect();
```

When the app setup needs a plain settings object instead of the live backend object:

```ts
const mobigent = createApp(expenseFunctions, {
  backend: backend.forApp()
});
```

## Backend API

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent();

await mobigent.functions.expense.create({ merchant: "Coffee", amount: 8 });

console.log(mobigent.inspectorUrl);
console.log(mobigent.openApiUrl);
console.log(mobigent.agentUrl);
```

For production, keep the same code and set backend app identity:

```bash
MOBIGENT_APP_ID=com.acme.expenses
MOBIGENT_APP_NAME=Acme Expenses
```

The common backend object includes:

- `inspectorUrl`
- `apiUrl`
- `agentUrl`
- `openApiUrl`
- `appConnectionUrl`
- `forApp()` for explicit app setup values when the app cannot receive the live backend object
- `connection` and `appSettings()` for compatibility when code needs explicit app setup values
- `pairing()` for older app-side pairing settings
- `appClient()` as an older explicit name for `pairing()`
- `connect.chatgpt()`, `connect.claude()`, and `connect.openai()` for common agent setup
- `setup.chatgpt()`, `setup.claude()`, and `setup.openai()` as compatibility aliases
- `chatgpt()`, `claude()`, and `openai()` as direct aliases
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
- `client()` as the older name for `appClient()` and `pairing()`
- `app({ appId, appName })` when you need to produce a connection object for another app id
- `feature("expense")` and `functions.expense.create(input)` for older backend SDK styles
- `tools()`, `resolveToolName()`, `callApp()`, `function()`, `appFunction()`, `appFunctions()`, and `invoke()` for provider internals or backward compatibility

## Simple App Helpers

- `createApp(functions)`: normal app setup for local and env-configured production.
- `createApp(appId, functions)`: optional explicit identity setup when you want identity in code.
- `mobigent.with(App)`: wraps an existing React Native app.
- `createApp(functions, { backend })`: lets the app SDK read identity and connection details from the backend object.
- `createApp(functions, { backend: backend.forApp() })`: passes a plain settings object when the app/backend boundary needs one.
- `mobigent.connect()`: connects a non-React host or demo after setup.
- `mobigent.emit(name, payload)`: emits app activity.
- `createApp(functions, { connection: { host: "192.168.1.20" } })`: connects a physical phone to your local backend.
- `createApp(functions, { connection: "wss://your-backend.example.com" })`: connects an app to a hosted backend.
- `read(handler, options)`: exposes app state.
- `write(handler, options)`: exposes confirmed app behavior.
- `screen(handler, options)`: lets an agent focus a screen or UI surface.

Friendly public types:

- `AppFunctions` and `AppFunctionMap` for app-owned functions.
- `MobigentAppBackendSource` for app/backend handoff values.
- `AppPairing`, `BackendPairing`, and `Pairing` remain available for compatibility.
- `Backend`, `BackendOptions`, and `BackendPairing` from `@mobigent/backend`.
- `AppConnection`, `AppConnectionSettings`, and `BackendConnection` remain available for compatibility.

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
createApp({
  cart: {
    current: read(async () => getCart())
  }
});
```

### Write

Expose app behavior that changes state:

```ts
createApp({
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
createApp({
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
