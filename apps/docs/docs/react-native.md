---
sidebar_position: 3
---

# React Native SDK

Use Mobigent like normal app code: expose a few real functions, wrap the app once, and let the SDK handle the bridge.

## Install

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.12/mobigent-app-0.1.12.tgz
```

No setup command is required on the app side. If no config exists yet, the app SDK uses safe local defaults. When the backend starts with `appDir`, it writes `mobigent.app.json` plus `src/mobigent-config.ts` into the app for exact local or production values.

Prefer generated starter files? `npx mobigent-init --feature expense --out-dir src` is still available as an optional scaffold.

## Create A Feature

```ts
import { defineFeature, read, write } from "@mobigent/app";

export const expenses = defineFeature("expense", {
  list: read(async () => ({ items: await listExpenses() })),
  create: write(async (input) => createExpense(input), {
    input: {
      merchant: "string",
      amount: "number",
      notes: "string"
    },
    confirm: true
  })
});
```

## Wrap The App

```tsx
import { withMobigent } from "@mobigent/app";
import { expenses } from "./mobigent/expenses";
import App from "./App";

export default withMobigent(App, expenses);
```

## Run The Backend

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appDir: "../mobile-app"
});
await mobigent.waitForApp();
```

`appDir` lets the backend SDK infer identity from the mobile app and write `mobigent.app.json` plus `src/mobigent-config.ts` there for you. `mobigent.waitForApp()` waits until the app is connected and has exposed at least one function.

## Non-React Host Or Demo

If you are running a local demo, test host, or another runtime where you are using the singleton `mobigent` client directly:

```ts
import { startMobigent } from "@mobigent/backend";
import { connectMobigent } from "@mobigent/app";
import { expenses } from "./mobigent/expenses";

const backend = await startMobigent();

const connection = await connectMobigent(expenses, {
  connectionUrl: backend.defaultApp.connectionUrl,
});
```

That one call registers the feature, connects to the backend, and returns a `disconnect()` helper.

## Backend Names

For `appId: "com.example.app"` and `feature("expense")`:

- backend code can call `expense.list`
- backend code can call `expense.create`

Backend code can use those same short names.

## Advanced

The lower-level provider, hooks, manual registration, `createAgentModule()`, and `schema.*` APIs are still available. Use them for screen-scoped capabilities, custom confirmation UI, advanced environment switching, and manifest signing.
