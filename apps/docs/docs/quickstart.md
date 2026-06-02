---
sidebar_position: 2
---

# Quickstart

The easiest path is the starter:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.12/create-mobigent-app-0.1.12.tgz \
  -- create-mobigent-app my-demo --install
cd my-demo
npm run dev
```

Click **Run agent request**. The demo calls the app-owned `expense.create` function and updates visible app state.

In another terminal:

```bash
npm run doctor
```

You should see app, backend, readiness, and function checks pass.

## Simple Model

Use `@mobigent/app` in the mobile app and `@mobigent/backend` in the backend. The app exposes functions. The backend waits for the app and calls those functions. Mobigent handles connection, validation, confirmations, retries, and agent setup.

## Existing React Native App

Install the app SDK:

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.12/mobigent-app-0.1.12.tgz
```

Create one feature:

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

Wrap the app once:

```tsx
import { withMobigent } from "@mobigent/app";
import { expenses } from "./mobigent/expenses";
import App from "./App";

export default withMobigent(App, expenses);
```

`mobigent-init` can generate these starter files for you, but it is optional.

For a non-React demo or test host, connect the same feature in one call:

```ts
import { startMobigent } from "@mobigent/backend";
import { connectMobigent } from "@mobigent/app";
import { expenses } from "./mobigent/expenses";

const backend = await startMobigent();

await connectMobigent(expenses, {
  connectionUrl: backend.defaultApp.connectionUrl,
});
```

## Backend

Install the backend SDK and generate the backend entrypoint:

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.12/mobigent-backend-0.1.12.tgz
npx mobigent-backend --app-dir ../mobile-app
```

Mobigent infers starter app identity from the app project when `--app-dir` is present. Pass `--app-id` and `--app-name` only when you want exact production values.

Or write it manually:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appDir: "../mobile-app"
});
await mobigent.waitForApp();

console.log(mobigent.urls.inspector);
console.log(mobigent.urls.openapi);
console.log("App config:", mobigent.appConfigPath);
console.log("App config module:", mobigent.appConfigModulePath);

const appConfig = mobigent.defaultApp;

console.log(mobigent.appConfigPath);
console.log(mobigent.agent("chatgpt").endpoints.openApi);
```

With no options, Mobigent infers a starter app id and app name from your project. With `appDir`, it infers from the mobile app project and writes `mobigent.app.json` plus `src/mobigent-config.ts` there for you. Pass `app: { id, name }` only when you want exact production values.

`mobigent.waitForApp()` waits until the app is connected and has exposed at least one function.

Generated backend files also export helper functions. Create a tiny app function object by feature name:

```ts
import { feature, waitForApp } from "./mobigent";

await waitForApp();

const expense = feature("expense");

await expense.create({ merchant: "Coffee", amount: 8 });
await expense.list();
```
