# Simple Integration

Mobigent should feel like two normal SDK installs.

Adding it to an app that already exists? Use [Existing React Native App](./existing-react-native-app.md). It is the same simple model without any generated app files.

You do not start with transport setup. The SDK owns that until you need advanced production control.

## The Whole Model

```txt
mobile app  ->  @mobigent/app      -> exposes real app functions
backend     ->  @mobigent/backend  -> lets agents call those functions
```

The app owns the real behavior. The backend calls that behavior. Mobigent owns delivery, discovery, validation, confirmations, retries, and the audit trail.

## 1. Add It To The App

```bash
npm install @mobigent/app
```

Create one app SDK object and expose the functions agents may call:

```ts
import { createApp, type AppFunctions } from "@mobigent/app";

export const appFunctions = {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
} satisfies AppFunctions;

export type MyAppFunctions = typeof appFunctions;

export const mobigent = createApp(appFunctions);
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

```ts
import { startMobigent } from "@mobigent/backend";
import type { MyAppFunctions } from "../app/mobigent";

const mobigent = await startMobigent();
const app = mobigent.app<MyAppFunctions>();

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
EXPO_PUBLIC_MOBIGENT_BACKEND_URL=wss://your-backend.example.com
```

Prefer generated sample files? Use the starter. Starter generation is a demo shortcut, not required integration.

That import is type-only, so your backend gets autocomplete without loading React Native code. If the backend cannot share that function shape, bind the app function group once:

```ts
const expenses = mobigent.app("expense", {
  createExpense: "create",
  listExpenses: "list"
});

await expenses.createExpense({ merchant: "Airport Taxi", amount: 42.25 });
await expenses.listExpenses();
```

For one quick explicit call, use `mobigent.call("expense.create", input)`.

## 3. What The SDK Handles

- app/backend delivery
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
