# API Reference

## Packages

- `@mobigent/core`: shared protocol and type definitions.
- `@mobigent/react-native`: app SDK, provider, hooks, confirmation controller, transport.
- `@mobigent/react-native/ui`: optional React Native confirmation modal.
- `@mobigent/gateway`: local gateway, HTTP/OpenAPI server, MCP server.

## Core Concepts

### Action

An app-owned function that an agent can call.

```ts
intentBridge.registerAction({
  name: "create_expense",
  description: "Create an expense.",
  inputSchema: {
    type: "object",
    properties: {
      amount: { type: "number" },
      merchant: { type: "string" }
    },
    required: ["amount", "merchant"]
  },
  confirmation: { required: true, risk: "medium" },
  handler: async (input) => ({ id: "EXP-1", ...input })
});
```

Action input is validated against `inputSchema` before confirmation or handler execution. Invalid agent input returns an error and never reaches app business logic.

### Resource

A read-only or read-mostly provider exposed as a `get_` tool.

```ts
intentBridge.registerResource({
  name: "expenses",
  description: "Current expense list.",
  policy: { readOnly: true },
  read: async () => ({ expenses: [] })
});
```

### Event

App-originated notifications sent to the gateway.

```ts
intentBridge.emit("expense.created", { id: "EXP-1" });
```

## Gateway APIs

```ts
const gateway = new BridgeGateway({ port: 8787, authToken: "secret" });
gateway.start();
gateway.listTools();
await gateway.callTool("com_example_app.create_expense", { amount: 10 }, {
  agentId: "openai-responses",
  idempotencyKey: "expense-create-123",
  requestId: "provider-call-123"
});
```

## MCP

```ts
const mcpServer = createMcpServer(gateway);
```

## HTTP

```ts
const app = createHttpApp(gateway);
```
