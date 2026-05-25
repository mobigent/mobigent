# Mobigent

**Make mobile apps agent-ready.**

Mobigent is an open-source SDK that lets AI agents talk to mobile apps through safe, typed capabilities instead of brittle screen tapping.

Your app exposes what agents are allowed to do:

- **Actions**: create an expense, submit an order, update a profile
- **Resources**: read app state, fetch a list, inspect a record
- **Components**: focus a screen or important UI surface
- **Events**: report app activity back to the agent
- **Confirmations**: ask the user before sensitive actions run

The result: agents get a clean interface, users stay in control, and your app decides exactly what is possible.

## Quick Start

Run the local demo:

```bash
npm install
npm run demo
```

This starts a Mobigent gateway, connects a sample expense app, discovers its capabilities, creates an expense through an agent-style call, asks for confirmation, and reads the updated expense list.

Run the full verification suite:

```bash
npm run verify
```

## Use It In React Native

Generate a starter integration:

```bash
npx mobigent-init \
  --app-id com.example.app \
  --app-name "Example App" \
  --feature expense \
  --out-dir src
```

Define what your app can safely expose:

```tsx
import { createAgentModule, createAgentPolicy, schema } from "@mobigent/react-native/app";

export const expenseModule = createAgentModule({
  namespace: "expense",
  actions: [
    {
      name: "create",
      description: "Create a new expense.",
      inputSchema: schema.object(
        {
          amount: schema.number(),
          merchant: schema.string()
        },
        { required: "all" }
      ),
      confirmation: {
        required: true,
        title: "Create expense?",
        risk: "medium"
      },
      policy: createAgentPolicy("user-required").policy,
      handler: async (input) => ({
        id: "EXP-1001",
        ...input
      })
    }
  ]
});
```

Mobigent handles registration, namespacing, validation, confirmation, connection lifecycle, and gateway communication.

## Connect An Agent

Start the HTTP gateway:

```bash
npm run dev:http
npm run dev:app
```

Then inspect the tools:

```bash
curl http://localhost:8788/tools
curl http://localhost:8788/openapi.json
```

Use the OpenAPI schema with ChatGPT Actions, or use the MCP server for MCP-compatible agents:

```bash
npm run dev:mcp
```

## Packages

- `@mobigent/core`: protocol and shared types
- `@mobigent/react-native`: React Native app-side SDK
- `@mobigent/gateway`: local gateway, HTTP API, OpenAPI, and MCP bridge
- `@mobigent/providers`: provider setup helpers for agent runtimes

## Examples

- `examples/expense-app`: sample mobile app capabilities
- `examples/agent-server`: OpenAI, Anthropic, Gemini, Bedrock, Vercel AI SDK, and mock agent examples

## Documentation

- Website: https://mobigent.github.io/mobigent/
- Docs: https://mobigent.github.io/mobigent/docs.html
- MCP setup: [docs/mcp.md](./docs/mcp.md)
- ChatGPT Actions: [docs/chatgpt-actions.md](./docs/chatgpt-actions.md)
- React Native guide: [docs/react-native.md](./docs/react-native.md)

## Why Mobigent Exists

Mobile apps were not designed for agents. Today, most agent workflows depend on fragile UI automation, screenshots, and guessing.

Mobigent gives apps a real agent interface:

1. Apps declare capabilities.
2. Agents discover those capabilities.
3. Calls are validated before they run.
4. Risky actions require user confirmation.
5. Every important event can be audited.

It is MCP-inspired, but built for mobile app control, app state, user approval, and native product workflows.

## Project Status

Mobigent is an early developer preview. The proof of concept already includes:

- React Native SDK APIs
- Local gateway
- HTTP and OpenAPI support
- MCP server support
- User confirmation flow
- Capability validation
- Audit events
- Provider examples
- GitHub Pages docs site

The goal is simple: make Mobigent the easiest way to build agentic mobile apps.

## License

MIT
