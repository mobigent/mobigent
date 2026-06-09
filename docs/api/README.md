# API Reference

Most Mobigent apps use two packages:

- `@mobigent/app`: lives inside the mobile app and exposes normal app functions.
- `@mobigent/backend`: lives in your backend and gives agents a clean API for those functions.

## App Package

Create one Mobigent app object from functions you already own:

```ts
import { createApp, type AppFunctions } from "@mobigent/app";

export const appFunctions = {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
} satisfies AppFunctions;

export type MyAppFunctions = typeof appFunctions;

export const mobigent = createApp(appFunctions);
```

Wrap the existing React Native app once:

```tsx
import { mobigent } from "./mobigent/expenses";
import App from "./App";

export default mobigent.with(App);
```

Or use the one-file trial path:

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

For local demos, tests, or non-React hosts, pass the backend object during setup and connect with no arguments:

```ts
import { startMobigent } from "@mobigent/backend";
import { createApp } from "@mobigent/app";
import { expenseFunctions } from "./app-functions";

const backend = await startMobigent();
const mobigent = createApp(expenseFunctions, {
  backend
});

const session = await mobigent.connect();

session.disconnect();
```

Common app helpers:

- `createApp(functions)`: app setup for local and env-configured production.
- `createApp(appId, functions)`: optional identity-in-code setup.
- `mobigent.with(App)`: React Native wrapper.
- `withMobigent(App, functions)`: direct existing-app wrapper.
- `createApp(functions, { backend })`: app/backend setup without repeating app identity.
- `mobigent.connect()`: manual startup for non-React hosts and tests.
- `mobigent.emit(name, payload)`: app activity events.
- `read(handler, options)`: force read-only behavior when the name is not obvious.
- `write(handler, options)`: force confirmed write behavior.
- `screen(handler, options)`: focus a screen or UI surface.

Useful app types:

- `AppFunctions` and `AppFunctionMap` for app-owned function maps.
- `MobigentApp` for the object returned by `createApp`.

## Backend Package

Start the backend, import only the app function type, then call the app with autocomplete:

```ts
import { startMobigent } from "@mobigent/backend";
import type { MyAppFunctions } from "../app/mobigent";

const mobigent = await startMobigent();
const app = mobigent.app<MyAppFunctions>();

await app.expense.create({ merchant: "Coffee", amount: 8 });

console.log(mobigent.inspectorUrl);
console.log(mobigent.openApiUrl);
console.log(mobigent.agentUrl);
```

For production, keep the same code and set matching app identity:

```bash
MOBIGENT_APP=com.acme.expenses
```

Common backend helpers:

- `startMobigent()`: starts the local backend.
- `mobigent.app<MyAppFunctions>()`: typed calls from the app-owned function shape.
- `mobigent.use<MyAppFunctions>()`: compatibility alias for typed backend calls.
- `mobigent.app("expense", { createExpense: "create" })`: backend-friendly helper names.
- `mobigent.call("expense.create", input)`: dynamic call when names are runtime data.
- `mobigent.fn("expense.create")`: reusable single function handle.
- `mobigent.waitForApp()`: explicit startup health gate.
- `mobigent.listFunctions()`: inspect connected app functions.
- `mobigent.apps()`: inspect connected app sessions.
- `mobigent.connect.chatgpt()`, `mobigent.connect.claude()`, and `mobigent.connect.openai()`: common agent setup.
- `mobigent.stop()`: stop the backend.

Useful backend types:

- `Backend`
- `BackendOptions`
- `BackendStartOptions`

## Production Config

App:

```bash
EXPO_PUBLIC_MOBIGENT_APP=com.acme.expenses
EXPO_PUBLIC_MOBIGENT_BACKEND_URL=wss://your-backend.example.com
```

Backend:

```bash
MOBIGENT_APP=com.acme.expenses
```

## App Function Types

### Read

Expose app state without changing anything:

```ts
createApp({
  cart: {
    current: read(async () => getCart())
  }
});
```

### Write

Expose app behavior that changes state:

```ts
createApp({
  cart: {
    checkout: write(async (input) => checkout(input), {
      input: { paymentMethodId: "string" },
      confirm: "Place order?"
    })
  }
});
```

### Screen

Expose a focusable app surface:

```ts
createApp({
  expense: {
    detail: screen(async (props) => {
      navigation.navigate("ExpenseDetail", { id: props.id });
      return { focused: true };
    }, {
      props: { id: "string" }
    })
  }
});
```

## Field Maps

```ts
{
  title: "string",
  amount: "number",
  count: "integer",
  approved: "boolean",
  category: ["Meals", "Travel", "Office"],
  tags: ["string"]
}
```

Full JSON Schema and lower-level `schema.*` helpers are still available for advanced shapes.

## Advanced Internals

The app and backend packages own the public integration path. Advanced subpath imports and compatibility aliases still exist for older code and custom runtime work, but new apps should start with `@mobigent/app`, `@mobigent/backend`, and plain app functions.
