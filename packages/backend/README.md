# @mobigent/backend

The backend-side Mobigent SDK.

Use it like normal backend plumbing: start Mobigent, wait for the app, then call app functions from your server code.

```bash
npm install @mobigent/backend
```

## Call App Functions

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appDir: "../mobile-app"
});
await mobigent.waitForApp();

const expense = mobigent.feature("expense");

await expense.create({ merchant: "Airport Taxi", amount: 42.25 });
await expense.list();
```

That is the main backend API.

If `appDir` is present, Mobigent also writes the tiny app config into the mobile app so the app package can connect without manual copying.

## Optional Generated Entrypoint

If you prefer a generated `src/mobigent.ts` helper file:

```bash
npx mobigent-backend --app-dir ../mobile-app
```

```ts
import { feature, waitForApp } from "./mobigent";

await waitForApp();

const expense = feature("expense");
await expense.create({ merchant: "Airport Taxi", amount: 42.25 });
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

For quick one-off calls, `mobigent.callApp("expense.create", input)` is still available. If you prefer explicit aliases, `mobigent.appFunctions({ createExpense: "expense.create" })` still works. For shutdown, call `await mobigent.stop()`.

Advanced docs cover OpenAPI, MCP, custom auth, provider runtimes, and hosted deployments after the simple app/backend loop works.
