# React Native Integration

Use Mobigent like normal app code: expose a few real functions, wrap the app once, and let the SDK handle the bridge.

## 1. Install

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.7/mobigent-react-native-0.1.7.tgz
```

## 2. Create A Feature

```ts
import { feature } from "@mobigent/react-native/simple";

export const expenses = feature("expense")
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
import { mobigentApp } from "@mobigent/react-native/app";
import { expenses } from "./mobigent/expenses";

const { Root } = mobigentApp({
  appId: "com.example.app",
  appName: "Example App",
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
import { startMobigentBackend } from "@mobigent/backend";

const mobigent = await startMobigentBackend();
```

Open the inspector URL printed by the backend. When the app connects, the feature tools appear there.

## Non-React Host Or Demo

If you are running a local demo, test host, or another runtime where you are using the singleton `mobigent` client directly:

```ts
import { mobigent } from "@mobigent/react-native";
import { connectMobigent } from "@mobigent/react-native/simple";
import { expenses } from "./mobigent/expenses";

const connection = await connectMobigent(mobigent, {
  appId: "com.example.app",
  appName: "Example App",
  gatewayUrl: "ws://localhost:8787",
  features: [expenses]
});
```

That one call configures the app identity, registers the feature, connects to the backend, and returns a `disconnect()` helper.

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

The lower-level provider, hooks, `createAgentModule()`, and manual registration APIs are still available for screen-scoped capabilities, custom confirmation UI, custom environment switching, and manifest signing. Start with `feature()` and `mobigentApp()` first.
