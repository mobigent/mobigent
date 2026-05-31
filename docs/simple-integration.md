# Simple Integration

Mobigent should feel like two normal SDK installs.

You do not start with gateways, manifests, MCP, provider adapters, or protocol messages. Those are internal plumbing until you need advanced production control.

## The Whole Model

```txt
mobile app  ->  @mobigent/app      -> exposes real app functions
backend     ->  @mobigent/backend  -> lets agents call those functions
```

The app owns the real behavior. The backend owns the agent-facing API. Mobigent owns the connection, discovery, schemas, confirmations, retries, and audit trail.

## 1. Add It To The App

```bash
npm install @mobigent/app
npx mobigent-init --feature expense --out-dir src
```

Create or edit the generated feature:

```ts
import { defineFeature, read, write } from "@mobigent/app";

export const expenses = defineFeature("expense", {
  list: read(async () => ({ items: await listExpenses() })),
  create: write(async (input) => createExpense(input), {
    input: {
      merchant: "string",
      amount: "number"
    },
    confirm: true
  })
});
```

Wrap the app once:

```tsx
import { withMobigent } from "@mobigent/app";
import { expenses } from "./mobigent/expenses";
import App from "./App";

export default withMobigent(App, expenses);
```

That is the frontend integration.

## 2. Add It To The Backend

```bash
npm install @mobigent/backend
npx mobigent-backend --app-dir ../mobile-app
```

The generated backend file starts Mobigent and exports helper functions:

```ts
import { callApp, waitForApp, appFunction } from "./mobigent";

await waitForApp();

await callApp("expense.create", {
  merchant: "Airport Taxi",
  amount: 42.25
});

const createExpense = appFunction("expense.create");
await createExpense({ merchant: "Coffee", amount: 8 });
```

That is the backend integration.

## 3. What The SDK Handles

- app connection
- local development config
- backend-generated app config
- function naming
- JSON schemas
- input validation
- output validation
- confirmation before risky writes
- reconnects and heartbeat
- queued app events
- OpenAPI and agent setup
- inspector and audit events

## 4. What You Keep Control Of

- which app functions agents can call
- what input each function accepts
- whether a write needs confirmation
- how the app shows the approval UI
- which backend routes or agent flows call Mobigent
- production auth and hosting choices

## 5. When To Read Advanced Docs

Read the gateway, provider, MCP, and production docs only after the simple app/backend loop works.

Use the advanced docs when you need hosted ChatGPT Actions, Claude Desktop MCP, provider-specific adapters, custom auth, rate limits, signed manifests, or Docker hosting.
