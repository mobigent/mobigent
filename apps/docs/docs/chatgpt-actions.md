---
sidebar_position: 7
---

# ChatGPT Actions

Start the HTTP gateway:

```bash
MOBIGENT_AUTH_TOKEN=dev-secret \
MOBIGENT_HTTP_API_KEY=http-secret \
npm run dev:http
```

Expose `localhost:8788` with an HTTPS tunnel, then import:

```text
https://your-public-domain.example/openapi.json?agentId=chatgpt-actions
```

The OpenAPI schema maps each visible app action or resource to an HTTP operation. Start the app before importing the schema so `/openapi.json?agentId=chatgpt-actions` includes concrete operations like:

```text
POST /tools/com_mobigent_expenses.create_expense/call
```

Mobigent also keeps the generic compatibility operation:

```text
POST /tools/{toolName}/call
```

For local development, refresh the imported schema after capabilities change.

When calling through a hosted action provider, configure the provider to send:

```text
Authorization: Bearer http-secret
x-mobigent-agent: chatgpt-actions
```

That lets app policies allow or block ChatGPT separately from local MCP clients.

Keep the tunnel private while testing. `MOBIGENT_AUTH_TOKEN` protects mobile app sessions. `MOBIGENT_HTTP_API_KEY` protects the agent-facing HTTP API.
