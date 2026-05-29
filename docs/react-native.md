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

No app id ceremony is required for a first run. If `mobigent.app.json` is present, the initializer uses it. If not, it infers a starter app id and app name from your `package.json`, so you can add the wrapper and feature code immediately.

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

- `com_example_app.get_expense_list`
- `com_example_app.expense_create`

## 3. Wrap The App

```tsx
import { setupMobigent } from "@mobigent/react-native";
import { mobigentConfig } from "./mobigent/config";
import { expenses } from "./mobigent/expenses";

const { Root } = setupMobigent({
  config: mobigentConfig,
  features: [expenses]
});

export default function App() {
  return (
    <Root>
      <YourExistingApp />
    </Root>
  );
}
```

## 4. Run The Backend

In your backend:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent();
```

Mobigent infers a starter app id and app name from your project. Pass `app: { id, name }` when you want exact production values. Open the inspector URL printed by the backend. When the app connects, the feature tools appear there.

## Non-React Host Or Demo

If you are running a local demo, test host, or another runtime where you are using the singleton `mobigent` client directly:

```ts
import { startMobigent } from "@mobigent/backend";
import { connectMobigent } from "@mobigent/react-native";
import { expenses } from "./mobigent/expenses";

const backend = await startMobigent();
const connection = await connectMobigent({
  config: backend.defaultApp,
  features: [expenses]
});
```

That one call consumes the backend app config, registers the feature, connects to the backend, and returns a `disconnect()` helper.

## What The SDK Handles

- app connection
- namespacing
- schema generation
- input/output validation
- confirmation before risky writes
- reconnects and heartbeat
- queued app events
- manifest updates
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
