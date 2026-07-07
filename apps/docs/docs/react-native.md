---
sidebar_position: 3
---

# React Native Integration

Use Mobigent like normal app code: expose a few real functions, wrap the app once, and let the SDK handle delivery.

For the shortest existing-app recipe, see [Existing React Native App](./existing-react-native-app.md). No generator is required.

## 1. Install

```bash
npm install @mobigent/app
```

For a first local run, you do not need an app id. Production apps can keep the same code and set `EXPO_PUBLIC_MOBIGENT_APP` plus backend `MOBIGENT_APP`.

## 2. Expose App Functions

```ts
import { createApp, type AppFunctions } from '@mobigent/app';

export const appFunctions = {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input),
  },
} satisfies AppFunctions;

export type MyAppFunctions = typeof appFunctions;

export const mobigent = createApp(appFunctions);
```

Backend code can use that same function shape with `mobigent.app<MyAppFunctions>()`, so server code calls `app.expense.list()` and `app.expense.create(input)` with autocomplete.

For production, set public app config:

```bash
EXPO_PUBLIC_MOBIGENT_APP=com.acme.expenses
EXPO_PUBLIC_MOBIGENT_BACKEND_URL=wss://your-backend.example.com
```

## 3. Wrap The App

```tsx
import { mobigent } from './mobigent';
import App from './App';

export default mobigent.with(App);
```

Or wrap directly in one file while you are trying the SDK:

```tsx
import { withMobigent } from '@mobigent/app';
import App from './App';

export default withMobigent(App, {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input),
  },
});
```

That is enough for a local first run.

To add another app area later, add another namespace inside `functions`.

No app-side init command is required. Starter generation is only for demos.

For multiple app areas in one file, use the same plain object shape:

```ts
import { createApp } from '@mobigent/app';

export const mobigent = createApp({
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input),
  },
  task: {
    list: async () => ({ items: await listTasks() }),
  },
});
```

## 4. Run The Backend

In your backend:

```bash
npm install @mobigent/backend
```

```ts
import { startMobigent } from '@mobigent/backend';

const mobigent = await startMobigent();
```

Backend function calls wait for the app automatically. For production, set `MOBIGENT_APP=com.acme.expenses` on the backend.

Your backend can call app namespaces directly. If you can import the app function type, use it for typed backend calls without loading React Native code:

```ts
import type { MyAppFunctions } from '../app/mobigent';

const app = mobigent.app<MyAppFunctions>();

await app.expense.create({ merchant: 'Coffee', amount: 8 });
```

If the backend cannot share that type, bind backend-friendly helper names once:

```ts
const expenses = mobigent.app('expense', {
  createExpense: 'create',
  listExpenses: 'list',
});

await expenses.createExpense({ merchant: 'Coffee', amount: 8 });
```

## Non-React Host Or Demo

If you are running a local demo, test host, or another runtime where you are using the singleton `mobigent` client directly:

```ts
import { startMobigent } from '@mobigent/backend';
import { createApp } from '@mobigent/app';
import { expenseFunctions } from './app-functions';

const backend = await startMobigent();
const mobigent = createApp(expenseFunctions, {
  backend,
});

const session = await mobigent.connect();
```

That one call makes the functions available to the backend and returns a `disconnect()` helper.

## What The SDK Handles

- app/backend delivery
- namespacing
- schema generation
- input/output validation
- confirmation before risky writes
- reconnects and heartbeat
- queued app events
- agent discovery updates
- diagnostics/status hooks

## Field Types

```ts
input: {
  title: "string",
  amount: "number",
  count: "integer",
  approved: "boolean",
  category: ["Meals", "Travel", "Office"],
  tags: ["string"]
}
```

Use full JSON Schema or the lower-level `schema.*` helpers only when plain fields are not enough.

## Advanced

The lower-level provider, hooks, `createAgentModule()`, explicit `defineFeature()`, and manual registration APIs are still available for screen-scoped app functions, custom confirmation UI, custom environment switching, and advanced signing. Start with `createApp(functions)` first.
