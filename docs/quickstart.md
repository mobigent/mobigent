# Mobigent Quickstart

This guide gets you from an app with no agent interface to a working Mobigent loop: app SDK, backend SDK, discovered app functions, confirmed write, and read function.

## The Simple Mental Model

Mobigent is two normal packages:

- `@mobigent/app` goes in the app and exposes real app functions.
- `@mobigent/backend` goes in the backend and calls those functions.

The SDK handles the app/backend connection, local defaults, production env config, validation, confirmations, agent setup, and audit events. Local demos can start with no app id; production can keep the same code and set environment keys.

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
import { createApp, type AppFunctions } from "@mobigent/app";

export const appFunctions = {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
} satisfies AppFunctions;

export type MyAppFunctions = typeof appFunctions;

export const mobigent = createApp(appFunctions);
```

For production, keep the same app code and set public app config:

```bash
EXPO_PUBLIC_MOBIGENT_APP=com.acme.expenses
EXPO_PUBLIC_MOBIGENT_URL=wss://your-backend.example.com
```

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

export default withMobigent(App, {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

That is the app integration. For real production apps, set `EXPO_PUBLIC_MOBIGENT_APP` so the app and backend pair by a stable identity without passing the same string through code. Mobigent infers the app name from that id unless you override it.

No app-side init command is required. The SDK handles the app connection. Optional generators are only useful when you want example files.

For a non-React demo or test host, pass the backend once and connect with no extra setup:

```ts
import { startMobigent } from "@mobigent/backend";
import { createApp } from "@mobigent/app";
import { expenseFunctions } from "./app-functions";

const backend = await startMobigent();
const mobigent = createApp(expenseFunctions, {
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

const mobigent = await startMobigent();

console.log(mobigent.inspectorUrl);
```

The backend handles the connection, function routing, inspector, agent endpoints, and readiness waiting. For production, set `MOBIGENT_APP` to the same value as the app's public config.

Prefer generated sample files? Use the starter. Starter generation is a demo shortcut, not required integration.

Call app functions from the backend SDK object. If you can import the app function type, the backend gets typed calls with the same namespaces without loading mobile code:

```ts
import type { MyAppFunctions } from "../app/mobigent";

const app = mobigent.use<MyAppFunctions>();

await app.expense.create({ merchant: "Coffee", amount: 8 });
await app.expense.list();
```

Mobigent waits for the app connection when a function is called. If the backend cannot share that type, `mobigent.functions.expense.create(...)` still works dynamically. If you want backend-specific helper names, bind aliases once:

```ts
const expenses = mobigent.use("expense", {
  createExpense: "create",
  listExpenses: "list"
});

await expenses.createExpense({ merchant: "Coffee", amount: 8 });
await expenses.listExpenses();
```

With no options, Mobigent uses local defaults. Real deployments should set `MOBIGENT_APP`, the app's `EXPO_PUBLIC_MOBIGENT_APP`, and the hosted app URL in environment/config.

Use `mobigent.waitForApp()` only when you want an explicit startup health gate. If the app is not running yet, function calls and readiness checks tell you exactly what is missing.

Need agent setup? Use the same backend object:

```ts
console.log(mobigent.connect.chatgpt().endpoints.openApi);
console.log(mobigent.connect.claude().guide);
```

For local checks:

```bash
curl http://localhost:8788/health
open http://localhost:8788/inspect
```

## 3. Connect From A Device

For local simulators, the SDK usually picks the right local connection. If you are on a physical device or hosted backend, set the backend location in public app config:

```bash
EXPO_PUBLIC_MOBIGENT_URL=ws://192.168.1.20:8787
```

Use your computer's LAN IP for a physical phone. For a hosted backend, use the hosted app connection URL:

```bash
EXPO_PUBLIC_MOBIGENT_URL=wss://your-backend.example.com
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

Adding Mobigent to an app that already exists? Read [Existing React Native App](./existing-react-native-app.md). It keeps the path to install packages, expose functions, wrap once, and start the backend.

After the first loop works, add more features by product area. Keep each feature small. Start with reads, then add confirmed writes for anything that can change user data, spend money, send messages, or expose sensitive information.
