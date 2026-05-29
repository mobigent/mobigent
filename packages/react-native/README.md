# @mobigent/react-native

Make a React Native app callable by AI agents with normal app functions.

Mobigent's React Native package should feel like this:

```ts
defineFeature("expense")
  .read("list", listExpenses)
  .write("create", createExpense, {
    input: { merchant: "string", amount: "number" },
    confirm: true
  });
```

The SDK handles namespacing, JSON Schema generation, validation, confirmation, connection lifecycle, reconnects, heartbeat, event queueing, and manifest updates.
New app configs use `connectionUrl`; existing `gatewayUrl` configs still work.

## Install

Until npmjs publishing is connected, install from the public GitHub release:

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.12/mobigent-react-native-0.1.12.tgz
```

After npmjs publishing is enabled:

```bash
npm install @mobigent/react-native
```

## Add One Feature

In an existing app, start with the initializer:

```bash
npx mobigent init --feature expense --out-dir src
```

It reads the backend-generated app config, then creates a Mobigent root wrapper and one feature file. You can also create the feature by hand.

Create `src/mobigent/expenses.ts`:

```ts
import { defineFeature } from "@mobigent/react-native";

export const expenses = defineFeature("expense")
  .read("list", async () => ({
    items: await listExpenses()
  }))
  .write("create", async (input) => createExpense(input), {
    input: {
      merchant: "string",
      amount: "number",
      notes: "string"
    },
    confirm: true
  });
```

Agents will see tools like:

```txt
com_example_app.get_expense_list
com_example_app.expense_create
```

## Wrap Your Existing App

```tsx
import { setupMobigent } from "@mobigent/react-native";
import { mobigentConfig } from "./src/mobigent/config";
import { expenses } from "./src/mobigent/expenses";

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

Run a Mobigent backend from your server with `@mobigent/backend`, then open the inspector URL it prints.

For a Node demo, test host, or another non-React runtime, use the same feature without manual registration:

```ts
import { startMobigent } from "@mobigent/backend";
import { connectMobigent } from "@mobigent/react-native";
import { expenses } from "./mobigent/expenses";

const backend = await startMobigent({
  app: {
    id: "com.example.app",
    name: "Example App"
  }
});
const connection = await connectMobigent({
  config: backend.defaultApp,
  features: [expenses]
});
```

## Field Types

For common inputs, use plain field maps:

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

Use `simpleSchema()` when you want the generated JSON Schema directly:

```ts
import { simpleSchema } from "@mobigent/react-native";

const inputSchema = simpleSchema({
  merchant: "string",
  amount: "number"
});
```

Advanced integrations can still pass full JSON Schema, Zod adapters, or lower-level capability definitions.

## Events

Emit app events after important work:

```ts
import { useMobigentEvent } from "@mobigent/react-native";

function ExpenseButton() {
  const emit = useMobigentEvent();

  return (
    <Button
      title="Create"
      onPress={async () => {
        const expense = await createExpenseFromUi();
        emit("expense.created", { id: expense.id });
      }}
    />
  );
}
```

## Confirmation

`write(..., { confirm: true })` uses the default confirmation flow. For production apps, keep sensitive writes confirmed:

- payments
- profile changes
- messages or emails
- orders and bookings
- access to sensitive user data

You can customize confirmation UI with the lower-level `MobigentProvider` and confirmation hooks when the default app wrapper is not enough.

## Advanced APIs

The package still includes lower-level APIs for mature apps:

- `MobigentProvider`
- `mobigent.registerAction()`
- `mobigent.registerResource()`
- `mobigent.registerComponent()`
- `createAgentModule()`
- `createAgentApp()`
- `createAgentExpoApp()`
- `schema.*`
- diagnostics and status hooks

Use these when you need screen-scoped capabilities, custom provider placement, custom confirmation UI, manifest signing, or advanced environment switching. New apps should start with `defineFeature()` and `setupMobigent()`.
