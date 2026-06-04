# Mobigent Quickstart

This guide gets you from an app with no agent interface to a working Mobigent loop: app SDK, backend SDK, discovered app functions, confirmed write, and read function.

## 1. Run The Starter

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- create-mobigent-app my-demo --package-source github-release --install
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
Use the same `appId` in the app and backend. That is the normal pairing mechanism.

## 2. Add App Functions To An Existing App

Install the app SDK:

```bash
npm install @mobigent/app
```

Current public fallback until npmjs publishing is connected:

```bash
npm install \
  https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-core-0.1.15.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-react-native-0.1.15.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-app-0.1.15.tgz
```

Create a Mobigent file yourself. There is no app-side init command in the normal path:

```ts
import { createApp } from "@mobigent/app";

export const mobigent = createApp({
  appId: "com.acme.expenses",
  functions: {
    expense: {
      list: async () => ({ items: await listExpenses() }),
      create: async (input) => createExpense(input)
    }
  }
});
```

That is enough for a first integration. Mobigent treats `list`, `get`, `read`, `fetch`, `search`, and `load` as reads. Other plain functions are confirmed writes by default. Add `write()` later only when you want input validation or custom approval text.

Create one Mobigent app object and wrap your existing app once:

```tsx
import { mobigent } from "./mobigent";
import App from "./App";

export default mobigent.with(App);
```

That is the app integration. For throwaway local demos, Mobigent can use a safe starter app identity, but real apps should pass a stable `appId`.

No app-side init command is required. The SDK handles the bridge setup. The old `mobigent-init --feature ...` flow is only useful when you want generated sample files.

For a non-React demo or test host, connect the same feature in one call:

```ts
import { startMobigent } from "@mobigent/backend";
import { mobigent } from "./mobigent";

const backend = await startMobigent({
  appId: "com.acme.expenses"
});

await mobigent.connect(backend);
```

## 3. Run The Backend

Install the backend SDK:

```bash
npm install @mobigent/backend
```

Current public fallback until npmjs publishing is connected:

```bash
npm install \
  https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-core-0.1.15.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-providers-0.1.15.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-gateway-0.1.15.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-backend-0.1.15.tgz
```

In your server:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appId: "com.acme.expenses",
  appName: "Acme Expenses"
});

console.log(mobigent.inspectorUrl);
```

The backend and app pair by `appId`. The backend handles the connection, function routing, inspector, agent endpoints, and readiness waiting.

Optional local helper: pass `appDir: "../mobile-app"` only when you want Mobigent to write `mobigent.app.json` and `src/mobigent-config.ts` into an existing app project. The normal path does not need generated config files.

Prefer generated sample files? Use the starter. Backend/app init commands are helpers, not required integration.

Call app functions from the backend SDK object. Mobigent waits for the app connection when a function is called:

```ts
const expenses = mobigent.feature("expense");

await expenses.create({ merchant: "Coffee", amount: 8 });
await expenses.list();
```

With no options, Mobigent infers a starter app id and app name from your project. Real apps should pass `appId` explicitly.

Use `mobigent.waitForApp()` only when you want an explicit startup health gate. If the app is not running yet, function calls and readiness checks tell you exactly what is missing.

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

For local simulators, the SDK usually picks the right local connection. If you are on a physical device or hosted backend, pass the backend location directly in your app:

```ts
export const mobigent = createApp({
  appId: "com.acme.expenses",
  connection: { host: "192.168.1.20" },
  functions: {
    expense: {
      list: async () => ({ items: [] }),
      create: async (input) => ({ id: "EXP-1", ...input })
    }
  }
});
```

Use your computer's LAN IP for a physical phone. For a hosted backend, use the hosted WebSocket URL:

```ts
connection: "wss://your-backend.example.com"
```

No generated app config file is needed.

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
