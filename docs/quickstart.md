# Mobigent Quickstart

This guide gets you from an app with no agent interface to a working Mobigent loop: app SDK, backend SDK, discovered app functions, confirmed write, and read function.

## The Simple Mental Model

Mobigent is two normal packages:

- `@mobigent/app` goes in the app and exposes real app functions.
- `@mobigent/backend` goes in the backend and calls those functions.

The SDK handles the app/backend connection, local defaults, validation, confirmations, agent setup, and audit events.
Use the same `appId` in the app and backend. That is the normal pairing mechanism.

## 1. Add App Functions To An Existing App

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

Create a Mobigent file yourself. There is no app-side init command in the normal path:

```ts
import { createApp } from "@mobigent/app";

export const mobigent = createApp("com.acme.expenses", {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

For local demos, the package also accepts the plain function map directly:

```ts
export const mobigent = createApp({
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

Use `createApp(appId, functions)` for real apps so the backend can pair with the correct app.

That is enough for a first integration. Mobigent treats `list`, `get`, `read`, `fetch`, `search`, and `load` as reads. Other plain functions are confirmed writes by default. Add `write()` later only when you want input validation or custom approval text.

Create one Mobigent app object and wrap your existing app once:

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

That is the app integration. For throwaway local demos, Mobigent can use a safe starter app identity, but real apps should pass a stable `appId`.

No app-side init command is required. The SDK handles the app connection. Optional generators are only useful when you want example files.

For a non-React demo or test host, pass the backend once and connect with no extra setup:

```ts
import { startMobigent } from "@mobigent/backend";
import { createApp } from "@mobigent/app";
import { expenseFunctions } from "./app-functions";

const backend = await startMobigent("com.acme.expenses");
const mobigent = createApp("com.acme.expenses", expenseFunctions, {
  backend
});

await mobigent.connect();
```

## 2. Run The Backend

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

In your server:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent("com.acme.expenses");

console.log(mobigent.inspectorUrl);
```

The backend and app pair by `appId`. The backend handles the connection, function routing, inspector, agent endpoints, and readiness waiting.

Prefer generated sample files? Use the starter. Starter generation is a demo shortcut, not required integration.

Call app functions from the backend SDK object. Mobigent waits for the app connection when a function is called:

```ts
await mobigent.app.expense.create({ merchant: "Coffee", amount: 8 });
await mobigent.app.expense.list();
```

Or bind backend-friendly names once and use them like normal helpers:

```ts
const expenses = mobigent.use("expense", {
  createExpense: "create",
  listExpenses: "list"
});

await expenses.createExpense({ merchant: "Coffee", amount: 8 });
await expenses.listExpenses();
```

With no options, Mobigent infers a starter app id and app name from your project. Real apps should pass `appId` explicitly.

Shortest explicit form:

```ts
const mobigent = await startMobigent("com.acme.expenses");
```

Use `mobigent.waitForApp()` only when you want an explicit startup health gate. If the app is not running yet, function calls and readiness checks tell you exactly what is missing.

Need agent setup? Use the same backend object:

```ts
console.log(mobigent.chatgpt().endpoints.openApi);
console.log(mobigent.claude().guide);
```

For local checks:

```bash
curl http://localhost:8788/health
open http://localhost:8788/inspect
```

## 3. Connect From A Device

For local simulators, the SDK usually picks the right local connection. If you are on a physical device or hosted backend, pass the backend location directly in your app:

```ts
export const mobigent = createApp("com.acme.expenses", {
  expense: {
    list: async () => ({ items: [] }),
    create: async (input) => ({ id: "EXP-1", ...input })
  }
}, {
  connection: { host: "192.168.1.20" }
});
```

Use your computer's LAN IP for a physical phone. For a hosted backend, use the hosted app connection URL:

```ts
createApp("com.acme.expenses", functions, {
  connection: "wss://your-backend.example.com"
});
```

No generated app config file is needed.

## 4. Verify The Loop

You know the first integration works when:

- `/health` reports one connected app
- `/inspect` shows the app functions generated from your app feature
- the write function pauses for confirmation in the app
- the handler only runs after approval
- the read function returns the updated state
- `/audit` shows the call, approval, result, and any emitted app events

## 5. Optional Starter

If you want to see a full sample before touching an existing app, run the starter:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- create-mobigent-app my-demo --install
cd my-demo
npm run dev
```

Click **Run agent request** in the browser. That one click calls the app-owned `expense.create` function, asks for confirmation, and updates visible app state.

Run the starter doctor in another terminal:

```bash
npm run doctor
```

For this repository checkout:

```bash
npm install
npm run demo:app
```

The demo starts a Mobigent backend, connects a sample expense app, calls a confirmed write function, then reads the updated expense list. The starter is only a sample; real app integration is install plus code.

## Next Steps

After the first loop works, add more features by product area. Keep each feature small. Start with reads, then add confirmed writes for anything that can change user data, spend money, send messages, or expose sensitive information.
