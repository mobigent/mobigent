---
sidebar_position: 2
---

# Simple Integration

Mobigent should feel like two normal SDK installs.

```txt
mobile app  ->  @mobigent/app      -> exposes real app functions
backend     ->  @mobigent/backend  -> lets agents call those functions
```

## App

```bash
npm install @mobigent/app
npx mobigent-init --feature expense --out-dir src
```

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

```tsx
import { withMobigent } from "@mobigent/app";
import { expenses } from "./mobigent/expenses";
import App from "./App";

export default withMobigent(App, expenses);
```

## Backend

```bash
npm install @mobigent/backend
npx mobigent-backend --app-dir ../mobile-app
```

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

## What Mobigent Handles

- local development config
- app connection
- function discovery
- input and output validation
- user confirmation for risky writes
- reconnects and heartbeat
- queued app events
- OpenAPI and agent setup
- inspector and audit events

Read the advanced docs when you need hosted ChatGPT Actions, Claude Desktop MCP, provider adapters, custom auth, rate limits, signed manifests, or Docker hosting.
