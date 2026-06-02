# Simple Integration

Mobigent should feel like two normal SDK installs.

You do not start with protocol plumbing. The SDK owns that until you need advanced production control.

## The Whole Model

```txt
mobile app  ->  @mobigent/app      -> exposes real app functions
backend     ->  @mobigent/backend  -> lets agents call those functions
```

The app owns the real behavior. The backend calls that behavior. Mobigent owns the connection, discovery, validation, confirmations, retries, and audit trail.
Use the same `appId` on both sides.

## 1. Add It To The App

```bash
npm install @mobigent/app
```

Create one app SDK object and expose the functions agents may call:

```ts
import { createApp, read, write } from "@mobigent/app";

export const mobigent = createApp({
  appId: "com.acme.expenses",
  functions: {
    expense: {
      list: read(async () => ({ items: await listExpenses() })),
      create: write(async (input) => createExpense(input), {
        input: {
          merchant: "string",
          amount: "number"
        },
        confirm: true
      })
    }
  }
});
```

Wrap the app once:

```tsx
import { mobigent } from "./mobigent";
import App from "./App";

export default mobigent.with(App);
```

That is the frontend integration.

No app-side init command is required. You should not have to run `npx mobigent-init --feature expense --out-dir src` just to integrate Mobigent. That command is only a sample-file generator.

## 2. Add It To The Backend

```bash
npm install @mobigent/backend
```

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

That is the backend integration.

Prefer generated sample files? Use the starter. Backend/app init commands are helpers, not required integration.

If you only need one quick call, `callApp("expense.create", input)` is still available.

## 3. What The SDK Handles

- app connection
- local development defaults
- app/backend pairing by app id
- function naming
- automatic readiness waiting
- input/output shapes
- input validation
- output validation
- confirmation before risky writes
- reconnects and heartbeat
- queued app events
- agent setup
- inspector and audit events

## 4. What You Keep Control Of

- which app functions agents can call
- what input each function accepts
- whether a write needs confirmation
- how the app shows the approval UI
- which backend routes or agent flows call Mobigent
- production auth and hosting choices

## 5. When To Read Advanced Docs

Read the advanced docs only after the simple app/backend loop works.

Use the advanced docs when you need hosted ChatGPT Actions, Claude Desktop MCP, provider-specific adapters, custom auth, rate limits, signed manifests, or Docker hosting.
