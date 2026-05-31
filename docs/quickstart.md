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

Install the app SDK and scaffold the small Mobigent folder. If your backend project is a sibling folder named `backend`, `server`, `api`, `agent-server`, or `mobigent-backend`, the app initializer finds `mobigent.app.json` automatically:

```bash
npm install @mobigent/app
npx mobigent-init --feature expense --out-dir src
```

For custom layouts, point the app initializer at the backend project:

```bash
npx mobigent-init --feature expense --out-dir src --backend-dir ../server
```

Create a feature file:

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

Wrap your existing app once:

```tsx
import { withMobigent } from "@mobigent/app";
import { expenses } from "./mobigent/expenses";
import App from "./App";

export default withMobigent(App, expenses);
```

If you prefer an explicit provider component, `setupMobigent(expenses)` still returns `{ Root }`.

That is enough for local development. Mobigent uses a safe starter app identity until you pass exact production values or import a backend-generated config.

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

## 3. Run The Backend

Generate the backend entrypoint and app config:

```bash
npm install @mobigent/backend
npx mobigent-backend --app-dir ../mobile-app
```

Mobigent infers starter app identity from the app project when `--app-dir` is present. Pass `--app-id` and `--app-name` only when you want exact production values.

That creates `mobigent.app.json` with a simple `connectionUrl`. The app initializer auto-detects that file from the app project, parent folders, and common sibling backend folders. With `--app-dir`, Mobigent also writes that config directly into the app project:

```bash
npm install @mobigent/app
npx mobigent-init --feature expense --out-dir src
```

If you run the app init command before copying `mobigent.app.json`, it still works: Mobigent infers a starter app id/name from the React Native app's `package.json` and uses the local connection URL.

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

The generated backend entrypoint also exports app-shaped helpers:

```ts
import { callApp, waitForApp, appFunction } from "./mobigent";

await waitForApp();
await callApp("expense.create", { merchant: "Airport Taxi", amount: 42.25 });

const createExpense = appFunction("expense.create");
await createExpense({ merchant: "Coffee", amount: 8 });
```

With no options, Mobigent infers a starter app id and app name from your project. With `appDir`, it infers from the mobile app project and writes `mobigent.app.json` plus `src/mobigent-config.ts` there for you. Pass `app: { id, name }` only when you want exact production values.

`mobigent.waitForApp()` waits until the app is connected and has exposed at least one function. If the app is not running yet, it tells you exactly what is missing.

Call app-owned functions with the same short names you used in the app:

```ts
await mobigent.callApp("expense.create", {
  merchant: "Airport Taxi",
  amount: 42.25
});

await mobigent.callApp("expense.list");
```

Need agent setup? Use the same backend object:

```ts
console.log(mobigent.agent("chatgpt").endpoints.openApi);
console.log(mobigent.agent("claude").guide);
```

For local checks:

```bash
curl http://localhost:8788/health
curl http://localhost:8788/tools
curl http://localhost:8788/openapi.json
```

## 4. Connect From A Device

Use the right WebSocket URL for the runtime:

- iOS simulator: `ws://localhost:8787`
- Android emulator: `ws://10.0.2.2:8787`
- physical device: `ws://YOUR_MAC_LAN_IP:8787`
- hosted gateway: `wss://your-gateway.example.com`

## 5. Verify The Loop

You know the first integration works when:

- `/health` reports one connected app
- `/tools` shows the provider-facing functions generated from your app feature
- the write function pauses for confirmation in the app
- the handler only runs after approval
- the read function returns the updated state
- `/audit` shows the call, approval, result, and any emitted app events

## Next Steps

After the first loop works, add more features by product area. Keep each feature small. Start with reads, then add confirmed writes for anything that can change user data, spend money, send messages, or expose sensitive information.
