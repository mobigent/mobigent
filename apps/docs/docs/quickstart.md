---
sidebar_position: 2
---

# Quickstart

The easiest path is the starter:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
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

Current public fallback until npmjs publishing is connected:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- mobigent-install app
```

Create one Mobigent file:

```ts
import { createApp } from "@mobigent/app";

export const mobigent = createApp("com.acme.expenses", {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

For quick local demos, pass the function map directly:

```ts
export const mobigent = createApp({
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

Use `createApp(appId, functions)` before connecting real apps and agents.

That is the normal path. Mobigent treats `list`, `get`, `read`, `fetch`, `search`, and `load` as reads. Other plain functions are confirmed writes by default. Add `write()` only when you want validation or custom approval copy.

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

export default withMobigent(App, "com.acme.expenses", {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

No app-side init command is required.

For a non-React demo or test host, use the same app SDK object:

```ts
import { startMobigent } from "@mobigent/backend";
import { mobigent } from "./mobigent";

const backend = await startMobigent("com.acme.expenses", "Acme Expenses");

await mobigent.connect(backend);
```

## Backend

Install the backend SDK:

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

const mobigent = await startMobigent("com.acme.expenses", "Acme Expenses");

console.log(mobigent.inspectorUrl);
console.log(mobigent.agent("chatgpt").endpoints.openApi);
```

Mobigent pairs the backend and app by `appId`, handles the connection, routes app function calls, exposes the inspector, and waits for readiness when needed.

Prefer generated sample files? Use the starter. Backend/app init commands are helpers, not required integration.

Call app functions from the backend SDK object. Mobigent waits for the app connection when a function is called:

```ts
await mobigent.app.expense.create({ merchant: "Coffee", amount: 8 });
await mobigent.app.expense.list();
```

Or bind backend-friendly names once:

```ts
const expenses = mobigent.use({
  createExpense: "expense.create",
  listExpenses: "expense.list"
});

await expenses.createExpense({ merchant: "Coffee", amount: 8 });
await expenses.listExpenses();
```

Shortest explicit backend start:

```ts
const mobigent = await startMobigent("com.acme.expenses", "Acme Expenses");
```
