# Flagship Demo

This is the fastest way to show what Mobigent solves.

For a new project from the public GitHub release:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.8/create-mobigent-app-0.1.8.tgz \
  -- create-mobigent-app my-demo --install
cd my-demo
npm run dev
```

For this repository:

```bash
npm install
npm run demo:app
```

To generate a separate local starter from this checkout:

```bash
npm run starter:new -- my-demo --install
cd my-demo
npm run dev
```

The demo runs the Mobigent backend, connects a visible expense app, and opens the simplest adoption story:

- App state on the left
- Agent request box on the right
- One button that calls the app through Mobigent
- Inspector link for the gateway details

Generated starters also include `npm run doctor`. Run it in another terminal while `npm run dev` is running to confirm the visible app, backend health, readiness, and expected tool are all working. Then run `npm run agent:local`, `npm run agent:openapi`, or `npm run agent:chatgpt` for copy-paste agent setup.

For the first real adaptation, edit `src/capabilities.ts`. It holds the sample `feature("expense")` definition separately from the demo server/UI.

If your system blocks auto-open, open the app manually:

```bash
open http://localhost:8790
```

Open the inspector when you want to see the gateway details:

```bash
open http://localhost:8788/inspect
```

## What To Say

Mobigent gives mobile apps a real agent interface. The app declares safe capabilities, the gateway exposes them as tools, and agents call those tools through HTTP, OpenAPI, or MCP. Risky actions still pause inside the app for user approval.

## Demo Beats

1. Run `npm run demo:app`.
2. Click `Run agent request`.
3. Show the new expense row appear in the app.
4. Open `/inspect` to show the discovered tools, call count, app session, and audit trail.
5. Point to ChatGPT Actions or MCP: the same gateway contract works across agent runtimes.

## Video Shot List

1. Terminal: `npm run demo:app`
2. Browser: `http://localhost:8790`
3. Click: `Run agent request`
4. Browser: new row appears in the expense table
5. Browser: `http://localhost:8788/inspect`
6. Closing frame: "Make mobile apps agent-ready."
