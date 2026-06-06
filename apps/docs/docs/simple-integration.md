---
sidebar_position: 2
---

# Simple Integration

Mobigent should feel like two normal SDK installs.

Adding it to an app that already exists? Use [Existing React Native App](./existing-react-native-app.md). It is the same simple model without any generated app files.

You do not start with connection plumbing. The SDK owns that until you need advanced production control.

## The Whole Model

```txt
mobile app  ->  @mobigent/app      -> exposes real app functions
backend     ->  @mobigent/backend  -> lets agents call those functions
```

The app owns the real behavior. The backend calls that behavior. Mobigent owns the connection, discovery, validation, confirmations, retries, and audit trail.

## 1. Add It To The App

```bash
npm install @mobigent/app
```

Current public fallback until npmjs publishing is connected:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- mobigent-install app
```

Create one app SDK object and expose the functions agents may call:

```ts
import { createApp } from "@mobigent/app";

export const mobigent = createApp({
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

Plain functions are the beginner path. Mobigent treats `list`, `get`, `read`, `fetch`, `search`, and `load` as reads. Other plain functions are confirmed writes by default.

Add `write()` only when you want validation, descriptions, or custom approval text:

```ts
import { write } from "@mobigent/app";

create: write(createExpense, {
  input: {
    merchant: "string",
    amount: "number"
  },
  confirm: "Create expense?"
})
```

Wrap the app once:

```tsx
import { mobigent } from "./mobigent";
import App from "./App";

export default mobigent.with(App);
```

Or wrap directly in one file while you are trying the SDK:

```tsx
import { withMobigent } from "@mobigent/app";
import App from "./App";

export default withMobigent(App, {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

That is the frontend integration.

No app-side init command is required. Write the functions directly in your app code. Optional generators are for examples, not real integration.

## 2. Add It To The Backend

```bash
npm install @mobigent/backend
```

Current public fallback until npmjs publishing is connected:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- mobigent-install backend
```

```ts
import { startMobigent } from "@mobigent/backend";
import { appFunctions } from "./app-functions";

const mobigent = await startMobigent();
const app = mobigent.use(appFunctions);

await app.expense.create({ merchant: "Airport Taxi", amount: 42.25 });
await app.expense.list();
```

That is the backend integration.

For production, keep the same code and set app identity/config outside the call site:

```bash
# backend
MOBIGENT_APP=com.acme.expenses

# Expo / React Native app
EXPO_PUBLIC_MOBIGENT_APP=com.acme.expenses
EXPO_PUBLIC_MOBIGENT_URL=wss://your-backend.example.com
```

Prefer generated sample files? Use the starter. Starter generation is a demo shortcut, not required integration.

If the backend cannot import that shared function shape, `mobigent.functions.expense.create(...)` still works dynamically. If your backend wants its own helper names, bind aliases once:

```ts
const expenses = mobigent.use("expense", {
  createExpense: "create",
  listExpenses: "list"
});

await expenses.createExpense({ merchant: "Airport Taxi", amount: 42.25 });
await expenses.listExpenses();
```

For one quick explicit call, use `mobigent.call("expense.create", input)`.

## 3. What The SDK Handles

- app connection
- local development defaults
- app/backend matching by app id
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
