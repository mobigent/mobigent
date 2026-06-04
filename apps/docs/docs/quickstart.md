---
sidebar_position: 2
---

# Quickstart

Mobigent should feel like adding any other app/backend SDK. The normal path is install two packages, expose app functions, then call those functions from the backend.

## Add To An Existing App

Install the app SDK:

```bash
npm install @mobigent/app
```

Install the backend SDK:

```bash
npm install @mobigent/backend
```

Current public fallback until npmjs publishing is connected:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- mobigent-install app

npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- mobigent-install backend
```

That is it for setup. No app-side init command is required.

## App

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

For a non-React demo or test host, use the same app SDK object:

```ts
import { startMobigent } from "@mobigent/backend";
import { mobigent } from "./mobigent";

const backend = await startMobigent("com.acme.expenses", "Acme Expenses");

await mobigent.connect(backend);
```

## Backend

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
const expenses = mobigent.use("expense", {
  createExpense: "create",
  listExpenses: "list"
});

await expenses.createExpense({ merchant: "Coffee", amount: 8 });
await expenses.listExpenses();
```

Shortest explicit backend start:

```ts
const mobigent = await startMobigent("com.acme.expenses", "Acme Expenses");
```

## Optional Demo App

Prefer a generated sample you can run before touching your app? Use the starter:

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

You should see app, backend, readiness, and function checks pass. The starter is only a demo shortcut; the real integration path is install plus code.
