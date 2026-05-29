---
sidebar_position: 9
---

# API Packages

Most integrations use two packages:

- `@mobigent/react-native`: lives inside the app and exposes app functions.
- `@mobigent/backend`: lives in your backend and exposes tools to agents.

## React Native

```ts
import { feature } from "@mobigent/react-native";

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
import { mobigentApp } from "@mobigent/react-native";
import { mobigentConfig } from "./mobigent/config";

const { Root } = mobigentApp({
  config: mobigentConfig,
  features: [expenses]
});
```

For non-React hosts, demos, and tests:

```ts
import { startMobigentBackend } from "@mobigent/backend";
import { mobigent } from "@mobigent/react-native";
import { connectMobigent } from "@mobigent/react-native";
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

## Simple App Helpers

- `feature(namespace)`: creates a small app feature.
- `defineMobigentConfig(config)`: gives app config a stable SDK type.
- `read(name, handler)`: exposes app state.
- `write(name, handler, options)`: exposes confirmed app behavior.
- `screen(name, handler)`: lets an agent focus a screen or UI surface.
- `mobigentApp({ config, features })`: wraps a React Native app once.
- `connectMobigent(client, { config, features })`: configures, registers features, and connects in one call.
- `registerFeatures(client, features)`: lower-level attach helper when you need manual lifecycle control.

## Backend

```ts
import { startMobigentBackend } from "@mobigent/backend";

const mobigent = await startMobigentBackend();
```

The backend object exposes:

- `urls`
- `app({ appId, appName })`
- `appConfig({ appId, appName })`
- `appConfigModule({ appId, appName })`
- `tools()`
- `apps()`
- `call(toolName, input)`
- `stop()`

## Providers

`@mobigent/providers` helps generate provider setup guides and adapt Mobigent tools to agent runtimes such as ChatGPT Actions, OpenAI Responses, Anthropic, Gemini, Bedrock, Vercel AI SDK, LangChain, LlamaIndex, Cursor, Claude Desktop, and MCP-compatible clients.

## Advanced

`@mobigent/core` and `@mobigent/gateway` are lower-level packages for protocol work, custom gateway hosting, MCP stdio, and advanced security controls.
