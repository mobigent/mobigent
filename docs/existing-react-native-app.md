# Existing React Native App

This is the normal Mobigent integration path. You do not need a generator.

Generators only create sample files for demos. In a real app, developers should write the Mobigent functions beside the app code they already have.

## Install

```bash
npm install @mobigent/app
npm install @mobigent/backend
```

## App Code

Create one small Mobigent file:

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

Wrap your existing app once:

```tsx
import { mobigent } from "./mobigent";
import App from "./App";

export default mobigent.with(App);
```

Or try it in one file first:

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

That is the app integration.

Mobigent treats `list`, `get`, `read`, `fetch`, `search`, and `load` as reads. Other plain functions are confirmed writes by default.

Use `write()` only when you want input validation or custom approval copy:

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

## Backend Code

Start Mobigent:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent();
```

For production, keep the code the same and set matching app identity/config:

```bash
# backend
MOBIGENT_APP=com.acme.expenses

# Expo / React Native app
EXPO_PUBLIC_MOBIGENT_APP=com.acme.expenses
EXPO_PUBLIC_MOBIGENT_URL=wss://your-backend.example.com
```

Call app-owned functions from backend code. If the backend can import the app function type, use it for typed calls without loading React Native code:

```ts
import type { MyAppFunctions } from "../app/mobigent";

const app = mobigent.use<MyAppFunctions>();

await app.expense.create({
  merchant: "Coffee",
  amount: 8
});

await app.expense.list();
```

If the backend cannot share that type, bind the app function group once with `mobigent.use("expense", aliases)`. Most apps do not need that on day one.

## What Developers Should Care About

- choose the app functions agents may call
- set a stable app id before production
- add schemas only when plain fields are not enough
- add confirmation copy for risky writes
- open the inspector during development

## What Mobigent Handles

- app/backend connection
- local development defaults
- function discovery
- validation
- user approval before risky writes
- reconnects and heartbeat
- queued events
- agent setup
- inspector and audit logs

## When To Use A Generator

Use `create-mobigent-app` when you want a full runnable demo before touching your app.

Use `mobigent-rn-init --feature-only` only if you want a sample function module copied into a project. It is not required for adoption.
