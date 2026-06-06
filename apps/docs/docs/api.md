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

export const mobigent = createApp({
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

## Simple App Helpers

- `createApp({ namespace: { name: fn } })`: creates the app-side SDK object for local and env-configured production.
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

Advanced app helpers are still available from `@mobigent/app/app` when you need manual lifecycle control:

- `defineFunctions({ namespace: { name: fn } })`: converts a function map to explicit internal objects.
- `defineFeature(namespace, { name: fn })`: creates a named internal object for lower-level integrations.
- `defineMobigentConfig(config)`: gives manual app config a stable SDK type.
- `connectMobigent(feature, options)`: lower-level connect helper.
- `registerFeatures(client, features)`: lower-level attach helper.

## Backend

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent();

await mobigent.functions.expense.create({ merchant: "Coffee", amount: 8 });

const expenses = mobigent.use("expense", {
  createExpense: "create",
  listExpenses: "list"
});

await expenses.createExpense({ merchant: "Coffee", amount: 8 });
```

The backend object exposes:

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
- `agent("chatgpt" | "claude" | "openai")` for explicit provider selection
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

Most apps use `mobigent.connect.chatgpt()`, `mobigent.connect.claude()`, or `mobigent.connect.openai()` from `@mobigent/backend`.

The lower-level provider layer is behind that helper. Use it directly only when you are building setup screens, custom CLIs, or runtime adapters for ChatGPT Actions, OpenAI Responses, Anthropic, Gemini, Bedrock, Vercel AI SDK, LangChain, LlamaIndex, Cursor, Claude Desktop, and MCP-compatible clients.

## Advanced

The app and backend packages own the public integration path. Internal packages still power schema validation, transport, provider mapping, MCP stdio, and advanced security controls, but app teams should not need them for normal adoption.
