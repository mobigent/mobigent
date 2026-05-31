# @mobigent/react-native

Make a React Native app callable by AI agents with normal app functions.

Mobigent's React Native package should feel like this:

```ts
defineFeature("expense", {
  list: read(listExpenses),
  create: write(createExpense, {
    input: { merchant: "string", amount: "number" },
    confirm: true
  })
});
```

The SDK handles namespacing, JSON Schema generation, validation, confirmation, connection lifecycle, reconnects, heartbeat, event queueing, and agent discovery updates.
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
npm install @mobigent/react-native
npx mobigent-init --feature expense --out-dir src
```

That command works before you have a backend config file. It infers a starter app id/name from `package.json`, creates a Mobigent root wrapper, creates `src/mobigent-config.ts`, and creates one feature file. When your backend runs with `appDir`, it keeps that config module updated for the app. If `src/mobigent-config.ts` already exists, the initializer preserves it. If `mobigent.app.json` already exists, the initializer auto-detects it from the app, parent folders, or common sibling backend folders such as `../backend`. For custom layouts, use `--backend-dir ../server`.

Run the same command with a new feature name whenever you want to expose another app area. Mobigent preserves the existing wrapper, adds the new feature import, and appends it to the feature list.

Create `src/mobigent/expenses.ts`:

```ts
import { defineFeature, read, write } from "@mobigent/react-native";

export const expenses = defineFeature("expense", {
  list: read(async () => ({
    items: await listExpenses()
  })),
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

Your backend calls those app functions with short names like:

```txt
expense.list
expense.create
```

Under the hood, Mobigent maps those functions to provider-safe names for OpenAPI, MCP, and model SDKs.

## Wrap Your Existing App

```tsx
import { withMobigent } from "@mobigent/react-native";
import { expenses } from "./src/mobigent/expenses";
import App from "./App";

export default withMobigent(App, expenses);
```

If you prefer an explicit provider component, `setupMobigent(expenses)` still returns `{ Root }`.

Run a Mobigent backend from your server with `@mobigent/backend`, then open the inspector URL it prints. For the simplest setup, start the backend with `appDir: "../mobile-app"` so it writes the same `src/mobigent-config.ts` file that this wrapper imports.

For a Node demo, test host, or another non-React runtime, use the same feature without manual registration:

```ts
import { startMobigent } from "@mobigent/backend";
import { connectMobigent } from "@mobigent/react-native";
import { expenses } from "./mobigent/expenses";

const backend = await startMobigent();
const connection = await connectMobigent(expenses, {
  connectionUrl: backend.defaultApp.connectionUrl,
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
