# React Native Integration

Use Mobigent like normal app code: expose a few real functions, wrap the app once, and let the SDK handle the bridge.

## 1. Install

```bash
npm install \
  https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-core-0.1.15.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-react-native-0.1.15.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-app-0.1.15.tgz
```

After npm publishing is enabled:

```bash
npm install @mobigent/app
```

Use the same `appId` in the app and backend. For a first throwaway run, the app SDK can use safe local defaults.

## 2. Expose App Functions

```ts
import { createApp } from "@mobigent/app";

export const mobigent = createApp("com.acme.expenses", {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

This exposes:

- backend call `mobigent.app.expense.list`
- backend call `mobigent.app.expense.create`

Backend code can use those same short names.

## 3. Wrap The App

```tsx
import { mobigent } from "./mobigent";
import App from "./App";

export default mobigent.with(App);
```

If you prefer explicit feature objects, `defineFeature("expense", ...)`, `withMobigent(App, expenses)`, and `setupMobigent(expenses)` still work.

That is enough for a local first run.

To add another app area later, add another namespace inside `functions`.

No app-side init command is required. Starter generation is only for demos.

For multiple app areas in one file, use the same plain object shape:

```ts
import { createApp } from "@mobigent/app";

export const mobigent = createApp("com.acme.expenses", {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  },
  task: {
    list: async () => ({ items: await listTasks() })
  }
});
```

## 4. Run The Backend

In your backend:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent("com.acme.expenses", "Acme Expenses");
```

Mobigent pairs the backend and app by `appId`. Backend function calls wait for the app connection automatically. Optional local helper: pass `appDir: "../mobile-app"` when you want the backend to write app config files into the mobile app.

## Non-React Host Or Demo

If you are running a local demo, test host, or another runtime where you are using the singleton `mobigent` client directly:

```ts
import { startMobigent } from "@mobigent/backend";
import { mobigent } from "./mobigent/expenses";

const backend = await startMobigent("com.acme.expenses", "Acme Expenses");

const connection = await mobigent.connect(backend);

```

That one call registers the feature, connects to the backend, and returns a `disconnect()` helper.

## What The SDK Handles

- app connection
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

The lower-level provider, hooks, `createAgentModule()`, explicit `defineFeature()`, and manual registration APIs are still available for screen-scoped capabilities, custom confirmation UI, custom environment switching, and manifest signing. Start with `createApp(appId, functions)` first.
