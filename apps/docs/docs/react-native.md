---
sidebar_position: 3
---

# React Native SDK

Use Mobigent like normal app code: expose a few real functions, wrap the app once, and let the SDK handle the bridge.

## Install

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.12/mobigent-react-native-0.1.12.tgz
```

## Create A Feature

```ts
import { feature } from "@mobigent/react-native";

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

## Wrap The App

```tsx
import { mobigentApp } from "@mobigent/react-native";
import { expenses } from "./mobigent/expenses";

const { Root } = mobigentApp(expenses);

export default function App() {
  return (
    <Root>
      <YourExistingApp />
    </Root>
  );
}
```

## Run The Backend

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent();
```

Open the inspector URL printed by the backend. When the app connects, the feature tools appear there.

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

## Tool Names

For `appId: "com.example.app"` and `feature("expense")`:

- read `list` becomes `com_example_app.get_expense_list`
- write `create` becomes `com_example_app.expense_create`

## Advanced

The lower-level provider, hooks, manual registration, `createAgentModule()`, and `schema.*` APIs are still available. Use them for screen-scoped capabilities, custom confirmation UI, advanced environment switching, and manifest signing.
