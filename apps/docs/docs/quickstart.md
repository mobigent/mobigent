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
npm install @mobigent/app
```

Create one Mobigent file:

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

Wrap the app once:

```tsx
import { mobigent } from "./mobigent";
import App from "./App";

export default mobigent.with(App);
```

No app-side init command is required.

For a non-React demo or test host, use the same app SDK object:

```ts
import { startMobigent } from "@mobigent/backend";
import { mobigent } from "./mobigent";

const backend = await startMobigent({
  appId: "com.acme.expenses"
});

await mobigent.connect(backend);
```

## Backend

Install the backend SDK:

```bash
npm install @mobigent/backend
```

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appId: "com.acme.expenses",
  appName: "Acme Expenses"
});

console.log(mobigent.inspectorUrl);
console.log(mobigent.agent("chatgpt").endpoints.openApi);
```

Mobigent pairs the backend and app by `appId`, handles the connection, routes app function calls, exposes the inspector, and waits for readiness when needed.

Prefer generated sample files? Use the starter. Backend/app init commands are helpers, not required integration.

Call app functions from the backend SDK object. Mobigent waits for the app connection when a function is called:

```ts
await mobigent.functions.expense.create({ merchant: "Coffee", amount: 8 });
await mobigent.functions.expense.list();
```
