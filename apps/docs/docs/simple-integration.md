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

`mobigent-init` can still generate starter files, but it is optional. The normal app-side path is install plus code.

## Backend

```bash
npm install @mobigent/backend
npx mobigent-backend --app-dir ../mobile-app
```

```ts
import { feature, waitForApp } from "./mobigent";

await waitForApp();

const expense = feature("expense");

await expense.create({ merchant: "Coffee", amount: 8 });
await expense.list();
```

## What Mobigent Handles

- local development config
- app connection
- function discovery
- input and output validation
- user confirmation for risky writes
- reconnects and heartbeat
- queued app events
- agent setup
- inspector and audit events

Read the advanced docs when you need hosted ChatGPT Actions, Claude Desktop MCP, custom auth, rate limits, signed manifests, or Docker hosting.
