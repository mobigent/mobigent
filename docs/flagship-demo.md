# Flagship Demo

This is the fastest way to show what Mobigent solves.

```bash
npm install
npm run demo:magic
```

The demo runs a local gateway, connects a sample expense app, exposes typed capabilities, asks for approval before a write action, emits an app event, and prints the gateway snapshot.

Open the inspector while the demo is running:

```bash
open http://localhost:8788/inspect
```

## What To Say

Mobigent gives mobile apps a real agent interface. The app declares safe capabilities, the gateway exposes them as tools, and agents call those tools through HTTP, OpenAPI, or MCP. Risky actions still pause inside the app for user approval.

## Demo Beats

1. Show `GET /tools`: the agent discovers app-owned tools.
2. Call `read_expenses`: the agent reads real app state.
3. Call `create_expense`: the app asks for confirmation before the handler runs.
4. Show `/snapshot` or `/inspect`: tools, audit, metrics, and app session data are visible.
5. Point to ChatGPT Actions or MCP: the same gateway contract works across agent runtimes.

## Video Shot List

1. Terminal: `npm run demo:magic`
2. Browser: `http://localhost:8788/inspect`
3. OpenAPI: `http://localhost:8788/openapi.json`
4. Docs: native iOS/Android quickstart
5. Closing frame: "Make mobile apps agent-ready."
