---
sidebar_position: 3
---

# React Native SDK

Use Mobigent like normal app code: expose a few real functions, wrap the app once, and let the SDK handle the bridge.

## Install

```bash
npm install @mobigent/app
```

Current public fallback until npmjs publishing is connected:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- mobigent-install app
```

No setup command is required on the app side. Create one Mobigent file, expose the app functions agents may call, and wrap the app once.

## Create The App SDK Object

```ts
import { createApp } from "@mobigent/app";

export const mobigent = createApp("com.acme.expenses", {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

## Wrap The App

```tsx
import { mobigent } from "./mobigent";
import App from "./App";

export default mobigent.with(App);
```

For a physical phone or hosted backend, pass `connection` in `createApp()`:

```ts
createApp("com.acme.expenses", functions, {
  connection: { host: "192.168.1.20" }
});

createApp("com.acme.expenses", functions, {
  connection: "wss://your-backend.example.com"
});
```

## Run The Backend

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent("com.acme.expenses", "Acme Expenses");
```

The app and backend pair by `appId`. Backend calls wait for the app connection automatically.

## Non-React Host Or Demo

If you are running a local demo, test host, or another runtime:

```ts
import { startMobigent } from "@mobigent/backend";
import { mobigent } from "./mobigent";

const backend = await startMobigent("com.acme.expenses", "Acme Expenses");

const connection = await mobigent.connect(backend);
```

That one call registers the feature, connects to the backend, and returns a `disconnect()` helper.

## Backend Names

For `appId: "com.example.app"` and the `expense` function namespace:

- backend code can call `mobigent.app.expense.list`
- backend code can call `mobigent.app.expense.create`

Backend code can use those same short names.

Or bind the app functions to backend helper names:

```ts
const expenses = mobigent.use({
  createExpense: "expense.create",
  listExpenses: "expense.list"
});

await expenses.createExpense({ merchant: "Coffee", amount: 8 });
```

## Advanced

The lower-level provider, hooks, manual registration, `createAgentModule()`, and `schema.*` APIs are still available. Use them for screen-scoped app functions, custom confirmation UI, advanced environment switching, and manifest signing.
