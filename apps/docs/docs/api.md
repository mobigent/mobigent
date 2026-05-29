---
sidebar_position: 9
---

# API Packages

Most integrations use two packages:

- `@mobigent/react-native`: lives inside the app and exposes app functions.
- `@mobigent/backend`: lives in your backend and exposes tools to agents.

## React Native

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

const { Root } = mobigentApp({
  appId: "com.example.app",
  appName: "Example App",
  features: [expenses]
});
```

## Backend

```ts
import { startMobigentBackend } from "@mobigent/backend";

const mobigent = await startMobigentBackend();
```

The backend object exposes:

- `urls`
- `tools()`
- `apps()`
- `call(toolName, input)`
- `stop()`

## Providers

`@mobigent/providers` helps generate provider setup guides and adapt Mobigent tools to agent runtimes such as ChatGPT Actions, OpenAI Responses, Anthropic, Gemini, Bedrock, Vercel AI SDK, LangChain, LlamaIndex, Cursor, Claude Desktop, and MCP-compatible clients.

## Advanced

`@mobigent/core` and `@mobigent/gateway` are lower-level packages for protocol work, custom gateway hosting, MCP stdio, and advanced security controls.

