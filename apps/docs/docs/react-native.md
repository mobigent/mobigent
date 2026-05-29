---
sidebar_position: 3
---

# React Native SDK

Use Mobigent like normal app code: expose a few real functions, wrap the app once, and let the SDK handle the bridge.

## Install

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.12/mobigent-react-native-0.1.12.tgz
```

If your backend was started with `appDir`, it writes the app config module that the wrapper imports, and the app initializer preserves that file when you scaffold features later. If your backend is in a sibling folder named `backend`, `server`, `api`, `agent-server`, or `mobigent-backend`, the app initializer finds `mobigent.app.json` automatically. For custom layouts, pass `--backend-dir ../server`.

Run the same init command with a new feature name to expose another app area. Mobigent creates that feature file and appends it to the existing wrapper.

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

const mobigent = await startMobigent({
  appDir: "../mobile-app"
});
await mobigent.ready();
```

`appDir` lets the backend SDK infer identity from the mobile app and write `mobigent.app.json` plus `src/mobigent-config.ts` there for you. `mobigent.ready()` waits until the app is connected and has exposed at least one function.

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

- backend code can call `expense.list`
- backend code can call `expense.create`

Agent-facing transports still receive stable full tool names, but app and backend code can use the short names.

## Advanced

The lower-level provider, hooks, manual registration, `createAgentModule()`, and `schema.*` APIs are still available. Use them for screen-scoped capabilities, custom confirmation UI, advanced environment switching, and manifest signing.
