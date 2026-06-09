# Flagship Demo

This is the fastest way to show what Mobigent solves.

For a new project:

```bash
npm create mobigent-app@latest my-demo -- --install
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
- Inspector link for app calls, approvals, and audit events

Generated starters also include `npm run doctor`. Run it in another terminal while `npm run dev` is running to confirm the visible app, backend health, readiness, and expected app function are all working. Then run `npm run agent:local`, `npm run agent:openapi`, or `npm run agent:chatgpt` for copy-paste agent setup.

For the first real adaptation, edit `src/app-functions.ts`. It holds the sample `expenseFunctions` object separately from the demo server/UI.

If your system blocks auto-open, open the app manually:

```bash
open http://localhost:8790
```

Open the inspector when you want to see app functions, call results, approvals, and audit events:

```bash
open http://localhost:8788/inspect
```

## What To Say

Mobigent gives mobile apps a real agent interface. The app exposes safe functions, the backend lets agents call those functions, and risky writes still pause inside the app for user approval.

## Demo Beats

1. Run `npm run demo:app`.
2. Click `Run agent request`.
3. Show the new expense row appear in the app.
4. Open `/inspect` to show discovered app functions, call count, app session, and audit trail.
5. Point to ChatGPT Actions or MCP: the same backend can connect those agents after the app loop works.

## Video Shot List

1. Terminal: `npm run demo:app`
2. Browser: `http://localhost:8790`
3. Click: `Run agent request`
4. Browser: new row appears in the expense table
5. Browser: `http://localhost:8788/inspect`
6. Closing frame: "Make mobile apps agent-ready."
