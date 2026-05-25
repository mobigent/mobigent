---
sidebar_position: 6
---

# MCP

Run the Mobigent MCP server:

```bash
npm run dev:mcp
```

Example MCP configuration:

```json
{
  "mcpServers": {
    "mobigent": {
      "command": "mobigent-mcp",
      "args": [],
      "env": {
        "MOBIGENT_AUTH_TOKEN": "dev-secret"
      }
    }
  }
}
```

The MCP server exposes connected app actions and resources as tools. When an app connects or disconnects, the server emits tool-list change notifications.
