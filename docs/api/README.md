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
import { expenses } from "./mobigent/expenses";

const { Root } = mobigentApp({
  appId: "com.example.app",
  appName: "Example App",
  features: [expenses]
});
```

## Backend API

```ts
import { startMobigentBackend } from "@mobigent/backend";

const mobigent = await startMobigentBackend();

console.log(mobigent.urls.inspector);
console.log(mobigent.urls.openapi);
```

The returned object includes:

- `urls.websocket`
- `urls.http`
- `urls.inspector`
- `urls.openapi`
- `tools()`
- `apps()`
- `call(toolName, input)`
- `stop()`

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

