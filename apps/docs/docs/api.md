---
sidebar_position: 9
---

# API Packages

Most integrations use two packages:

- `@mobigent/app`: lives inside the app and exposes app functions.
- `@mobigent/backend`: lives in your backend and exposes app functions to agents.

## React Native

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
import { mobigent } from "./mobigent";
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
import { mobigent } from "./mobigent";

const backend = await startMobigent("com.acme.expenses");

const connection = await mobigent.connect(backend);

connection.disconnect();
```

## Simple App Helpers

- `createApp(appId, { namespace: { name: fn } })`: creates the app-side SDK object.
- `mobigent.with(App)`: wraps an existing React Native app.
- `mobigent.connect(backend)`: connects a non-React host or demo using the same functions.
- `mobigent.emit(name, payload)`: emits app activity.
- `createApp(appId, functions, { connection: { host: "192.168.1.20" } })`: connects a physical phone to your local backend.
- `createApp(appId, functions, { connection: "wss://your-backend.example.com" })`: connects an app to a hosted backend.
- `read(handler, options)`: exposes app state.
- `write(handler, options)`: exposes confirmed app behavior.
- `screen(handler, options)`: lets an agent focus a screen or UI surface.

Advanced app helpers are still available when you need manual lifecycle control:

- `defineFunctions({ namespace: { name: fn } })`: converts a function map to explicit internal objects.
- `defineFeature(namespace, { name: fn })`: creates a named internal object for lower-level integrations.
- `defineMobigentConfig(config)`: gives manual app config a stable SDK type.
- `connectMobigent(feature, options)`: lower-level connect helper.
- `registerFeatures(client, features)`: lower-level attach helper.

## Backend

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent("com.acme.expenses");

await mobigent.app.expense.create({ merchant: "Coffee", amount: 8 });

const expenses = mobigent.use("expense", {
  createExpense: "create",
  listExpenses: "list"
});

await expenses.createExpense({ merchant: "Coffee", amount: 8 });
```

The backend object exposes:

- `inspectorUrl`
- `apiUrl`
- `openApiUrl`
- `agent("chatgpt" | "claude" | "openai")`
- `agents()`
- `listFunctions()`
- `waitForApp()` to wait until an app is connected and callable
- `app.expense.create(input)` or `app.expense.list()` to call app functions with the clean package API
- `use("expense").create(input)`, `use("expense", ["create", "list"])`, or `use("expense", { createExpense: "create" })` to bind app functions in backend code
- `feature("expense")` when you need the older grouped API shape
- `functions.expense.create(input)` for backward compatibility with the older object-style backend SDK shape
- `call("expense.create", input)` or `call("expense.list")`
- `fn("expense.create")` to create a reusable backend function
- `resolveFunctionName("expense.create")`
- `advanced` for lower-level server, transport, URL, and compatibility details
- `stop()`

## Providers

Most apps use `mobigent.agent("chatgpt")`, `mobigent.agent("claude")`, or `mobigent.agent("openai")` from `@mobigent/backend`.

`@mobigent/providers` is the advanced package behind that helper. Use it directly when you are building setup screens, custom CLIs, or runtime adapters for ChatGPT Actions, OpenAI Responses, Anthropic, Gemini, Bedrock, Vercel AI SDK, LangChain, LlamaIndex, Cursor, Claude Desktop, and MCP-compatible clients.

## Advanced

`@mobigent/core` and `@mobigent/gateway` are lower-level packages for protocol work, custom gateway hosting, MCP stdio, and advanced security controls.
