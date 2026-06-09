# @mobigent/react-native

Full React Native implementation package for Mobigent.

Most React Native and Expo apps should start with the smaller app SDK:

```bash
npm install @mobigent/app
```

`@mobigent/app` is the normal product surface. It reuses this package internally and keeps the first integration focused on one thing: expose app functions.

If you install this package directly, the simple path is the same:

```ts
const mobigent = createApp({
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

The SDK handles namespacing, JSON Schema generation, validation, confirmation, connection lifecycle, reconnects, heartbeat, event queueing, and agent discovery updates.
Advanced apps can still pass a backend connection directly, but the normal path does not require generated files or setup commands.

## Install

Recommended app package:

```bash
npm install @mobigent/app
```

Install this package directly only when you need the full React Native API surface:

```bash
npm install @mobigent/react-native
```

## Add App Functions

Create `src/mobigent.ts`:

```ts
import { createApp } from "@mobigent/app";

export const mobigent = createApp({
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

For production, keep this code and set public app config:

```bash
EXPO_PUBLIC_MOBIGENT_APP=com.acme.expenses
EXPO_PUBLIC_MOBIGENT_URL=wss://your-backend.example.com
```

Plain `list`, `get`, `read`, `fetch`, `search`, and `load` functions are treated as reads. Other plain functions are confirmed writes by default.

Use `write()` only when you want validation, descriptions, or custom approval copy:

```ts
import { write } from "@mobigent/app";

create: write(createExpense, {
  input: { merchant: "string", amount: "number" },
  confirm: "Create expense?"
})
```

Your backend calls those app functions with short names like:

```txt
expense.list
expense.create
```

Under the hood, Mobigent maps those functions into the exact names and shapes each agent integration needs.

## Wrap Your Existing App

```tsx
import { mobigent } from "./src/mobigent";
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

Run a Mobigent backend from your server with `@mobigent/backend`, then open the inspector URL it prints. Local defaults work for first runs; use `MOBIGENT_APP` and `EXPO_PUBLIC_MOBIGENT_APP` for production identity.

No app-side init command is required. Write the functions directly in your app code. Optional generators are for examples, not real integration.

For a Node demo, test host, or another non-React runtime, use the same app object:

```ts
import { startMobigent } from "@mobigent/backend";
import { createApp } from "@mobigent/app";
import { expenseFunctions } from "./app-functions";

const backend = await startMobigent();
const mobigent = createApp(expenseFunctions, {
  backend
});

const connection = await mobigent.connect();
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
import { emitMobigentEvent } from "@mobigent/react-native";

async function saveExpense(input) {
  const expense = await createExpense(input);
  emitMobigentEvent("expense.created", { id: expense.id });
  return expense;
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

The direct `@mobigent/react-native` package includes lower-level APIs for mature apps:

- `MobigentProvider`
- `mobigent.registerAction()`
- `mobigent.registerResource()`
- `mobigent.registerComponent()`
- `createAgentModule()`
- `createAgentApp()`
- `createAgentExpoApp()`
- `schema.*`
- diagnostics and status hooks

Use these when you need screen-scoped app functions, custom provider placement, custom confirmation UI, signed production setup, or advanced environment switching. New apps should start with `createApp(functions)`.
