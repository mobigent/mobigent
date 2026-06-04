# Using Mobigent With MCP Clients

Mobigent ships an MCP stdio server through `@mobigent/gateway`.

The MCP server:

1. Starts the mobile app WebSocket bridge.
2. Waits for apps using `@mobigent/app` to connect.
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

Then expose app functions with the same app id:

```ts
import { createApp } from "@mobigent/app";

export const mobigent = createApp("com.example.expenses", {
  expense: {
    list: async () => ({ expenses: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

## Tool Mapping

An app write function:

```ts
createApp("com.example.expenses", {
  expense: {
    create: async (input) => createExpense(input)
  }
});
```

becomes an MCP tool named:

```text
com_example_expenses.expense_create
```

Resource providers become read-only tools using the `get_` prefix.

## Dynamic Tool Updates

Mobigent emits MCP tool-list-changed notifications when:

- a mobile app registers a new manifest
- a mobile app disconnects
- the gateway stops

Clients that support MCP list-change notifications can refresh their tool list automatically.
