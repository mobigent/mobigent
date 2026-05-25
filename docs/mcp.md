# Using Mobigent With MCP Clients

Mobigent ships an MCP stdio server through `@mobigent/gateway`.

The MCP server:

1. Starts the mobile app WebSocket bridge.
2. Waits for apps using `@mobigent/react-native` to connect.
3. Exposes registered app capabilities as MCP tools.
4. Routes MCP `tools/call` requests back into the app.

## Run Locally

Terminal 1:

```bash
npm run dev:mcp
```

Terminal 2:

```bash
npm run dev:app
```

## Published Package Command

After publishing `@mobigent/gateway`, MCP clients can run:

```bash
npx @mobigent/gateway mobigent-mcp
```

or directly:

```bash
npx mobigent-mcp
```

## Example MCP Client Config

Use this shape for clients that support stdio MCP servers:

```json
{
  "mcpServers": {
    "mobigent": {
      "command": "npx",
      "args": ["mobigent-mcp"],
      "env": {
        "MOBIGENT_WS_PORT": "8787",
        "MOBIGENT_AUTH_TOKEN": "dev-secret"
      }
    }
  }
}
```

Then configure your mobile app SDK with:

```ts
intentBridge.configure({
  appId: "com.example.expenses",
  appName: "Example Expenses",
  gatewayUrl: "ws://localhost:8787",
  authToken: "dev-secret"
});
```

## Tool Mapping

An app action:

```ts
intentBridge.registerAction({
  name: "create_expense",
  description: "Create a new expense report.",
  inputSchema: {
    type: "object",
    properties: {
      amount: { type: "number" },
      merchant: { type: "string" }
    },
    required: ["amount", "merchant"]
  },
  handler: async (input) => createExpense(input)
});
```

becomes an MCP tool named:

```text
com_example_expenses.create_expense
```

Resource providers become read-only tools using the `get_` prefix.

## Dynamic Tool Updates

Mobigent emits MCP tool-list-changed notifications when:

- a mobile app registers a new manifest
- a mobile app disconnects
- the gateway stops

Clients that support MCP list-change notifications can refresh their tool list automatically.
