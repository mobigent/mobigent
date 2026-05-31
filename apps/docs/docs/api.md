---
sidebar_position: 9
---

# API Packages

Most integrations use two packages:

- `@mobigent/app`: lives inside the app and exposes app functions.
- `@mobigent/backend`: lives in your backend and exposes app functions to agents.

## React Native

```ts
import { defineFeature, read, write } from "@mobigent/app";

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
```

```tsx
import { withMobigent } from "@mobigent/app";
import App from "./App";

export default withMobigent(App, expenses);
```

For non-React hosts, demos, and tests:

```ts
import { startMobigent } from "@mobigent/backend";
import { connectMobigent } from "@mobigent/app";
import { expenses } from "./mobigent/expenses";

const backend = await startMobigent();

const connection = await connectMobigent(expenses, {
  connectionUrl: backend.defaultApp.connectionUrl,
});

connection.disconnect();
```

## Simple App Helpers

- `defineFeature(namespace, { name: read(fn), name: write(fn) })`: creates a small app feature.
- `defineMobigent({ namespace: { name: read(fn) } })`: creates multiple feature areas from one plain object.
- `defineMobigentConfig(config)`: gives app config a stable SDK type.
- `read(handler, options)`: exposes app state.
- `write(handler, options)`: exposes confirmed app behavior.
- `screen(handler, options)`: lets an agent focus a screen or UI surface.
- `mobigentApp(feature)`: wraps a React Native app once.
- `mobigentApp({ config, features })`: production form when you need exact app config.
- `connectMobigent(feature, options)`: configures, registers features, and connects in one call.
- `registerFeatures(client, features)`: lower-level attach helper when you need manual lifecycle control.

## Backend

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appDir: "../mobile-app"
});
```

The backend object exposes:

- `urls`
- `appConfigPath`
- `appConfigModulePath`
- `app({ appId, appName })`
- `appConfig({ appId, appName })`
- `appConfigModule({ appId, appName })`
- `defaultApp`
- `copyAppConfig()`
- `agent("chatgpt" | "claude" | "openai")`
- `agents()`
- `functions()`
- `tools()` for backward compatibility and provider internals
- `apps()`
- `waitForApp()` to wait until an app is connected and callable
- `appFunctions({ createExpense: "expense.create" })` to create a normal backend object of app functions
- `callApp("expense.create", input)` or `callApp("expense.list")`
- `appFunction("expense.create")` to create a reusable backend function
- `invoke("expense.create", input)` for compatibility
- `fn("expense.create")` for compatibility
- `call("expense.create", input)` for backward compatibility
- `resolveFunctionName("expense.create")`
- `resolveToolName("expense.create")` for backward compatibility
- `stop()`

## Providers

Most apps use `mobigent.agent("chatgpt")`, `mobigent.agent("claude")`, or `mobigent.agent("openai")` from `@mobigent/backend`.

`@mobigent/providers` is the advanced package behind that helper. Use it directly when you are building setup screens, custom CLIs, or runtime adapters for ChatGPT Actions, OpenAI Responses, Anthropic, Gemini, Bedrock, Vercel AI SDK, LangChain, LlamaIndex, Cursor, Claude Desktop, and MCP-compatible clients.

## Advanced

`@mobigent/core` and `@mobigent/gateway` are lower-level packages for protocol work, custom gateway hosting, MCP stdio, and advanced security controls.
