# @mobigent/backend

The backend-side Mobigent SDK.

Use it like normal backend plumbing: start Mobigent, then call app functions from your server code. Mobigent waits for the app connection when a function is called.

```bash
npm install @mobigent/backend
```

Until npmjs publishing is connected, install the public release tarballs together:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- mobigent-install backend
```

## Call App Functions

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent("com.acme.expenses");

await mobigent.app.expense.create({ merchant: "Airport Taxi", amount: 42.25 });
await mobigent.app.expense.list();
```

That is the main backend API.

The app and backend pair by `appId`. Mobigent handles waiting for the app connection and routing calls to the matching app functions.

If you want the shortest possible local demo, `startMobigent()` also works with inferred starter values. For production, pass a stable app id.

For tests or non-React demos, pass the backend object straight into the app SDK:

```ts
const backend = await startMobigent("com.acme.expenses");

await mobigent.connect(backend);
```

The public `backend.connection` object contains the pairing details. You usually do not need to read or copy it yourself.

## What It Handles

- app connection setup
- app/backend pairing by app id
- app function routing
- validation
- confirmations
- automatic readiness waiting
- inspector and audit trail
- agent setup helpers

Bind backend-friendly names once when you do not want backend code to mirror app namespaces:

```ts
const expenses = mobigent.use("expense", {
  createExpense: "create",
  listExpenses: "list"
});

await expenses.createExpense({ merchant: "Airport Taxi", amount: 42.25 });
await expenses.listExpenses();
```

For quick one-off explicit calls, use `mobigent.call("expense.create", input)`. For shutdown, call `await mobigent.stop()`.

Prefer generated sample files? Use `create-mobigent-app`. The backend package is designed so real integrations can stay as install plus code.

Advanced docs cover OpenAPI, MCP, custom auth, provider runtimes, and hosted deployments after the simple app/backend loop works.
