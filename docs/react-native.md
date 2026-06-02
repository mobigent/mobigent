# React Native Integration

Use Mobigent like normal app code: expose a few real functions, wrap the app once, and let the SDK handle the bridge.

## 1. Install

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.12/mobigent-app-0.1.12.tgz
```

After npm publishing is enabled:

```bash
npm install @mobigent/app
```

No app id ceremony is required for a first run. If no config exists yet, the app SDK uses safe local defaults. When the backend starts with `appDir`, it writes `mobigent.app.json` plus `src/mobigent-config.ts` into the app for exact local or production values.

## 2. Expose App Functions

```ts
import { createApp, read, write } from "@mobigent/app";

export const mobigent = createApp({
  functions: {
    expense: {
      list: read(async () => ({ items: await listExpenses() })),
      create: write(async (input) => createExpense(input), {
        input: {
          merchant: "string",
          amount: "number",
          notes: "string"
        },
        confirm: true
      })
    }
  }
});
```

This exposes:

- backend shorthand `expense.list`
- backend shorthand `expense.create`

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
import { createApp, read, write } from "@mobigent/app";

export const mobigent = createApp({
  functions: {
    expense: {
      list: read(async () => ({ items: await listExpenses() })),
      create: write(createExpense, {
        input: { merchant: "string", amount: "number" }
      })
    },
    task: {
      list: read(async () => ({ items: await listTasks() }))
    }
  }
});
```

## 4. Run The Backend

In your backend:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appDir: "../mobile-app"
});
```

Mobigent infers a starter app id and app name from your project. With `appDir`, it infers from the mobile app project and writes `mobigent.app.json` plus `src/mobigent-config.ts` there for you. Pass `app: { id, name }` only when you want exact production values. Backend function calls wait for the app connection automatically.

## Non-React Host Or Demo

If you are running a local demo, test host, or another runtime where you are using the singleton `mobigent` client directly:

```ts
import { startMobigent } from "@mobigent/backend";
import { mobigent } from "./mobigent/expenses";

const backend = await startMobigent();

const connection = await mobigent.connect({
  connectionUrl: backend.defaultApp.connectionUrl
});

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

The lower-level provider, hooks, `createAgentModule()`, explicit `defineFeature()`, and manual registration APIs are still available for screen-scoped capabilities, custom confirmation UI, custom environment switching, and manifest signing. Start with `createApp({ functions })` first.
