# @mobigent/backend

The backend-side Mobigent SDK.

Use it like normal backend plumbing: start Mobigent, wait for the app, then call app functions from your server code.

```bash
npm install @mobigent/backend
npx mobigent-backend --app-dir ../mobile-app
```

That creates a small `src/mobigent.ts` file for your backend. If `--app-dir` is present, Mobigent also writes the tiny app config into the mobile app so the app package can connect without manual copying.

## Call App Functions

```ts
import { appFunctions, waitForApp } from "./mobigent";

await waitForApp();

const app = appFunctions({
  createExpense: "expense.create",
  listExpenses: "expense.list"
});

await app.createExpense({ merchant: "Airport Taxi", amount: 42.25 });
await app.listExpenses();
```

That is the main backend API.

## Start Manually

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appDir: "../mobile-app"
});

await mobigent.waitForApp();

const app = mobigent.appFunctions({
  createExpense: "expense.create"
});

await app.createExpense({ merchant: "Coffee", amount: 8 });
```

Mobigent infers local app identity from the app project. Pass exact `app` values only when production needs them.

## What It Handles

- app connection setup
- app config files
- app function routing
- validation
- confirmations
- retries and readiness
- inspector and audit trail
- agent setup helpers

For quick one-off calls, `mobigent.callApp("expense.create", input)` is still available. For shutdown, call `await mobigent.stop()`.

Advanced docs cover OpenAPI, MCP, custom auth, provider runtimes, and hosted deployments after the simple app/backend loop works.
