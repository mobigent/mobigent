# API Reference

Start with the two-package path:

- `@mobigent/react-native`: app SDK for exposing app functions.
- `@mobigent/backend`: backend SDK for the agent-facing API, inspector, OpenAPI, MCP-ready routing, and app connections.

Lower-level protocol packages still exist, but most developers should not need them on day one.

## App API

```ts
import { defineFeature } from "@mobigent/react-native";

export const expenses = defineFeature("expense")
  .read("list", async () => ({ items: await listExpenses() }))
  .write("create", async (input) => createExpense(input), {
    input: {
      merchant: "string",
      amount: "number"
    },
    confirm: true
  });
```

```tsx
import { setupMobigent } from "@mobigent/react-native";
import { expenses } from "./mobigent/expenses";

const { Root } = setupMobigent(expenses);
```

For non-React hosts, demos, and tests:

```ts
import { startMobigent } from "@mobigent/backend";
import { connectMobigent } from "@mobigent/react-native";
import { expenses } from "./mobigent/expenses";

const backend = await startMobigent();
const connection = await connectMobigent(expenses, {
  connectionUrl: backend.defaultApp.connectionUrl,
});

connection.disconnect();
```

## Backend API

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  app: {
    id: "com.example.app",
    name: "Example App"
  }
});

console.log(mobigent.urls.inspector);
console.log(mobigent.urls.openapi);

const appConfig = mobigent.defaultApp;
const appConfigCode = mobigent.copyAppConfig();
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
- `app({ appId, appName })`
- `appConfig({ appId, appName })`
- `copyAppConfig()`
- `tools()`
- `apps()`
- `call("expense.create", input)` or `call("expense.list")`
- `resolveToolName("expense.create")`
- `stop()`

## Simple App Helpers

- `defineFeature(namespace)`: creates a small app feature.
- `defineMobigentConfig(config)`: gives app config a stable SDK type.
- New configs use `connectionUrl`; existing `gatewayUrl` configs still work.
- `read(name, handler)`: exposes app state.
- `write(name, handler, options)`: exposes confirmed app behavior.
- `screen(name, handler)`: lets an agent focus a screen or UI surface.
- `setupMobigent(feature)`: wraps a React Native app once.
- `setupMobigent({ config, features })`: production form when you need exact app config.
- `connectMobigent(feature, options)`: configures, registers features, and connects in one call.
- `registerFeatures(client, features)`: lower-level attach helper when you need manual lifecycle control.

## Capability Types

### Read

Expose app state without changing anything:

```ts
defineFeature("cart").read("current", async () => getCart());
```

### Write

Expose app behavior that changes state:

```ts
defineFeature("cart").write("checkout", async (input) => checkout(input), {
  input: { paymentMethodId: "string" },
  confirm: "Place order?"
});
```

### Screen

Expose a focusable app surface:

```ts
defineFeature("expense").screen("detail", async (props) => {
  navigation.navigate("ExpenseDetail", { id: props.id });
  return { focused: true };
}, {
  props: { id: "string" }
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
