# @mobigent/backend

The backend-side Mobigent SDK.

Use it like normal backend plumbing: start Mobigent, then call app functions from your server code. Mobigent waits for the app connection when a function is called.

```bash
npm install @mobigent/backend
```

## Call App Functions

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appId: "com.acme.expenses",
  appName: "Acme Expenses"
});

const expense = mobigent.feature("expense");

await expense.create({ merchant: "Airport Taxi", amount: 42.25 });
await expense.list();
```

That is the main backend API.

The app and backend pair by `appId`. Mobigent handles waiting for the app connection and routing calls to the matching app functions.

If you want the shortest possible local demo, `startMobigent()` also works with inferred starter values. For production, pass a stable app id.

## Optional Generated Entrypoint

If you prefer a generated `src/mobigent.ts` helper file:

```bash
npx mobigent-backend --app-dir ../mobile-app
```

```ts
import { feature } from "./mobigent";

const expense = feature("expense");
await expense.create({ merchant: "Airport Taxi", amount: 42.25 });
```

Mobigent can infer local starter identity from the project, but real apps should pass a stable `appId`.

Optional local helper: pass `appDir: "../mobile-app"` when you want Mobigent to write the tiny app config into the mobile app.

## What It Handles

- app connection setup
- app/backend pairing by app id
- app function routing
- validation
- confirmations
- automatic readiness waiting
- inspector and audit trail
- agent setup helpers

For quick one-off calls, `mobigent.callApp("expense.create", input)` is still available. If you prefer explicit aliases, `mobigent.appFunctions({ createExpense: "expense.create" })` still works. For shutdown, call `await mobigent.stop()`.

Advanced docs cover OpenAPI, MCP, custom auth, provider runtimes, and hosted deployments after the simple app/backend loop works.
