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

Current public fallback until npmjs publishing is connected:

```bash
npm install \
  https://github.com/mobigent/mobigent/releases/download/v0.1.14/mobigent-core-0.1.14.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.14/mobigent-react-native-0.1.14.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.14/mobigent-app-0.1.14.tgz
```

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

```tsx
import { mobigent } from "./mobigent";
import App from "./App";

export default mobigent.with(App);
```

That is the app-side path. No app-side init command is required.

On a physical phone or hosted backend, pass the backend location directly:

```ts
connection: { host: "192.168.1.20" }
// or
connection: "wss://your-backend.example.com"
```

## Backend

```bash
npm install @mobigent/backend
```

Current public fallback until npmjs publishing is connected:

```bash
npm install \
  https://github.com/mobigent/mobigent/releases/download/v0.1.14/mobigent-core-0.1.14.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.14/mobigent-providers-0.1.14.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.14/mobigent-gateway-0.1.14.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.14/mobigent-backend-0.1.14.tgz
```

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appId: "com.acme.expenses",
  appName: "Acme Expenses"
});

await mobigent.functions.expense.create({ merchant: "Coffee", amount: 8 });
await mobigent.functions.expense.list();
```

Mobigent pairs the app and backend by `appId`, waits for the app connection when a function is called, and routes the call to the app-owned function.

Starter and backend init commands are optional sample helpers. The normal path is install plus code.

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
