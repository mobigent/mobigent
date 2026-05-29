# API Reference

Start with the two-package path:

- `@mobigent/react-native`: app SDK for exposing app functions.
- `@mobigent/backend`: backend SDK for the agent-facing API, inspector, OpenAPI, MCP-ready routing, and app connections.

Lower-level protocol packages still exist, but most developers should not need them on day one.

## App API

```ts
import { feature } from "@mobigent/react-native/simple";

export const expenses = feature("expense")
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
import { mobigentApp } from "@mobigent/react-native/app";
import { mobigentConfig } from "./mobigent/config";
import { expenses } from "./mobigent/expenses";

const { Root } = mobigentApp({
  config: mobigentConfig,
  features: [expenses]
});
```

For non-React hosts, demos, and tests:

```ts
import { startMobigentBackend } from "@mobigent/backend";
import { mobigent } from "@mobigent/react-native";
import { connectMobigent } from "@mobigent/react-native/simple";
import { expenses } from "./mobigent/expenses";

const backend = await startMobigentBackend();
const connection = await connectMobigent(mobigent, {
  config: backend.app({
    appId: "com.example.app",
    appName: "Example App"
  }),
  features: [expenses]
});

connection.disconnect();
```

## Backend API

```ts
import { startMobigentBackend } from "@mobigent/backend";

const mobigent = await startMobigentBackend();

console.log(mobigent.urls.inspector);
console.log(mobigent.urls.openapi);

const appConfig = mobigent.app({
  appId: "com.example.app",
  appName: "Example App"
});
```

The returned object includes:

- `urls.websocket`
- `urls.http`
- `urls.inspector`
- `urls.openapi`
- `app({ appId, appName })`
- `appConfig({ appId, appName })`
- `tools()`
- `apps()`
- `call(toolName, input)`
- `stop()`

## Simple App Helpers

- `feature(namespace)`: creates a small app feature.
- `read(name, handler)`: exposes app state.
- `write(name, handler, options)`: exposes confirmed app behavior.
- `screen(name, handler)`: lets an agent focus a screen or UI surface.
- `mobigentApp({ config, features })`: wraps a React Native app once.
- `connectMobigent(client, { config, features })`: configures, registers features, and connects in one call.
- `registerFeatures(client, features)`: lower-level attach helper when you need manual lifecycle control.

## Capability Types

### Read

Expose app state without changing anything:

```ts
feature("cart").read("current", async () => getCart());
```

### Write

Expose app behavior that changes state:

```ts
feature("cart").write("checkout", async (input) => checkout(input), {
  input: { paymentMethodId: "string" },
  confirm: "Place order?"
});
```

### Screen

Expose a focusable app surface:

```ts
feature("expense").screen("detail", async (props) => {
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
- `@mobigent/providers`: provider setup helpers and runtime adapters.
