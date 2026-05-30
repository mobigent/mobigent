# React Native Integration

Use Mobigent like normal app code: expose a few real functions, wrap the app once, and let the SDK handle the bridge.

## 1. Install

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.12/mobigent-react-native-0.1.12.tgz
```

If your backend was initialized with `mobigent-backend init`, scaffold from its config file:

```bash
npm install @mobigent/react-native
npx mobigent init --feature expense --out-dir src
```

No app id ceremony is required for a first run. If `mobigent.app.json` is present in the app, a parent folder, or a common sibling backend folder such as `../backend`, the initializer uses it. For custom layouts, pass `--backend-dir ../server`. If no config exists yet, it infers a starter app id and app name from your `package.json`.

## 2. Create A Feature

```ts
import { defineFeature } from "@mobigent/react-native";

export const expenses = defineFeature("expense")
  .read("list", async () => ({ items: await listExpenses() }))
  .write("create", async (input) => createExpense(input), {
    input: {
      merchant: "string",
      amount: "number",
      notes: "string"
    },
    confirm: true
  });
```

This exposes:

- backend shorthand `expense.list`
- backend shorthand `expense.create`

Agent-facing transports still receive stable full tool names, but app and backend code can use the short names.

## 3. Wrap The App

```tsx
import { withMobigent } from "@mobigent/react-native";
import { expenses } from "./mobigent/expenses";
import App from "./App";

export default withMobigent(App, expenses);
```

If you prefer an explicit provider component, `setupMobigent(expenses)` still returns `{ Root }`.

That is enough for a local first run. The generated wrapper imports `src/mobigent-config.ts`. If your backend was started with `appDir`, Mobigent keeps that file updated for you, and the app initializer preserves it when you scaffold features later.

To add another app area later, run the same init command with a new feature name. Mobigent creates the new feature file and appends it to the existing wrapper.

## 4. Run The Backend

In your backend:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appDir: "../mobile-app"
});
await mobigent.ready();
```

Mobigent infers a starter app id and app name from your project. With `appDir`, it infers from the mobile app project and writes `mobigent.app.json` plus `src/mobigent-config.ts` there for you. Pass `app: { id, name }` only when you want exact production values. `mobigent.ready()` waits until the app is connected and has exposed at least one function.

## Non-React Host Or Demo

If you are running a local demo, test host, or another runtime where you are using the singleton `mobigent` client directly:

```ts
import { startMobigent } from "@mobigent/backend";
import { connectMobigent } from "@mobigent/react-native";
import { expenses } from "./mobigent/expenses";

const backend = await startMobigent();
const connection = await connectMobigent(expenses, {
  connectionUrl: backend.defaultApp.connectionUrl,
});
```

That one call registers the feature, connects to the backend, and returns a `disconnect()` helper.

## What The SDK Handles

- app connection
- namespacing
- schema generation
- input/output validation
- confirmation before risky writes
- reconnects and heartbeat
- queued app events
- tool discovery updates
- diagnostics/status hooks

## Field Types

```ts
input: {
  title: "string",
  amount: "number",
  count: "integer",
  approved: "boolean",
  category: ["Meals", "Travel", "Office"],
  tags: ["string"]
}
```

Use full JSON Schema or the lower-level `schema.*` helpers only when plain fields are not enough.

## Advanced

The lower-level provider, hooks, `createAgentModule()`, and manual registration APIs are still available for screen-scoped capabilities, custom confirmation UI, custom environment switching, and manifest signing. Start with `defineFeature()` and `setupMobigent()` first.
