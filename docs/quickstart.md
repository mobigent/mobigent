# Mobigent Quickstart

This guide gets you from an app with no agent interface to a working Mobigent loop: app SDK, backend SDK, discovered app functions, confirmed write, and read function.

## 1. Run The Starter

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.12/create-mobigent-app-0.1.12.tgz \
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

The demo starts a Mobigent backend, connects a sample expense app, calls a confirmed write function, then reads the updated expense list.

## The Simple Mental Model

Mobigent is two normal packages:

- `@mobigent/app` goes in the app and exposes real app functions.
- `@mobigent/backend` goes in the backend and calls those functions.

The SDK handles the bridge, config, connection lifecycle, validation, confirmations, agent setup, and audit events.

## 2. Add One Feature To An Existing App

Install the app SDK:

```bash
npm install @mobigent/app
```

Create a feature file:

```ts
import { createApp, defineFeature, read, write } from "@mobigent/app";

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

Create one Mobigent app object and wrap your existing app once:

```tsx
import { expenses } from "./mobigent/expenses";
import App from "./App";

const mobigent = createApp({ features: expenses });

export default mobigent.with(App);
```

If you prefer the older wrapper helper, `withMobigent(App, expenses)` still works. If you prefer explicit JSX wrapping, `setupMobigent(expenses)` still returns `{ Root }`.

That is enough for local development. Mobigent uses a safe starter app identity until you pass exact production values or import a backend-generated config.

Prefer generated starter files? `npx mobigent-init --feature expense --out-dir src` is still available as an optional scaffold.

For a non-React demo or test host, connect the same feature in one call:

```ts
import { startMobigent } from "@mobigent/backend";
import { createApp } from "@mobigent/app";
import { expenses } from "./mobigent/expenses";

const backend = await startMobigent();
const mobigent = createApp({
  features: expenses,
  connectionUrl: backend.defaultApp.connectionUrl
});

await mobigent.connect();
```

## 3. Run The Backend

Install the backend SDK:

```bash
npm install @mobigent/backend
```

In your server:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appDir: "../mobile-app"
});
await mobigent.waitForApp();

console.log(mobigent.urls.inspector);

const appConfig = mobigent.defaultApp;

console.log(mobigent.appConfigPath);
console.log(mobigent.appConfigModulePath);
```

Mobigent infers starter app identity from the app project when `appDir` is present. Pass exact `app` values only when production needs them.

With `appDir`, Mobigent also writes `mobigent.app.json` and `src/mobigent-config.ts` into the app project. Your app package can use those files without any app-side setup command. If no config exists yet, the app SDK still works with safe local defaults.

Prefer a generated backend helper file? `npx mobigent-backend --app-dir ../mobile-app` is still available as an optional scaffold.

Create a tiny app function object by feature name:

```ts
const expense = mobigent.feature("expense");

await expense.create({ merchant: "Coffee", amount: 8 });
await expense.list();
```

With no options, Mobigent infers a starter app id and app name from your project. With `appDir`, it infers from the mobile app project and writes `mobigent.app.json` plus `src/mobigent-config.ts` there for you. Pass `app: { id, name }` only when you want exact production values.

`mobigent.waitForApp()` waits until the app is connected and has exposed at least one function. If the app is not running yet, it tells you exactly what is missing.

Call app-owned functions through that backend object:

```ts
const expense = mobigent.feature("expense");

await expense.create({ merchant: "Airport Taxi", amount: 42.25 });
await expense.list();
```

Need agent setup? Use the same backend object:

```ts
console.log(mobigent.agent("chatgpt").endpoints.openApi);
console.log(mobigent.agent("claude").guide);
```

For local checks:

```bash
curl http://localhost:8788/health
open http://localhost:8788/inspect
```

## 4. Connect From A Device

For local simulators, the SDK usually picks the right local connection. If you are on a physical device or hosted backend, set the app connection URL in `mobigent.app.json`:

- iOS simulator: `ws://localhost:8787`
- Android emulator: `ws://10.0.2.2:8787`
- physical device: `ws://YOUR_MAC_LAN_IP:8787`
- hosted backend: `wss://your-backend.example.com`

## 5. Verify The Loop

You know the first integration works when:

- `/health` reports one connected app
- `/inspect` shows the app functions generated from your app feature
- the write function pauses for confirmation in the app
- the handler only runs after approval
- the read function returns the updated state
- `/audit` shows the call, approval, result, and any emitted app events

## Next Steps

After the first loop works, add more features by product area. Keep each feature small. Start with reads, then add confirmed writes for anything that can change user data, spend money, send messages, or expose sensitive information.
