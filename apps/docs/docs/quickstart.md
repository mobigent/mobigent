---
sidebar_position: 2
---

# Quickstart

The easiest path is the starter:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.11/create-mobigent-app-0.1.11.tgz \
  -- create-mobigent-app my-demo --install
cd my-demo
npm run dev
```

Click **Run agent request**. The demo calls the app-owned `expense_create` action and updates visible app state.

In another terminal:

```bash
npm run doctor
```

You should see app, backend, readiness, and tool checks pass.

## Existing React Native App

Install the app SDK and scaffold the small Mobigent folder:

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.11/mobigent-react-native-0.1.11.tgz
npx mobigent init --app-id com.example.app --app-name "Example App" --feature expense --out-dir src
```

Create one feature:

```ts
import { feature } from "@mobigent/react-native";

export const expenses = feature("expense")
  .read("list", async () => ({ items: await listExpenses() }))
  .write("create", async (input) => createExpense(input), {
    input: {
      merchant: "string",
      amount: "number"
    },
    confirm: true
  });
```

Wrap the app once:

```tsx
import { mobigentApp } from "@mobigent/react-native";
import { mobigentConfig } from "./mobigent/config";
import { expenses } from "./mobigent/expenses";

const { Root } = mobigentApp({
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

For a non-React demo or test host, connect the same feature in one call:

```ts
import { startMobigentBackend } from "@mobigent/backend";
import { mobigent } from "@mobigent/react-native";
import { connectMobigent } from "@mobigent/react-native";
import { expenses } from "./mobigent/expenses";

const backend = await startMobigentBackend();
await connectMobigent(mobigent, {
  config: backend.app({
    appId: "com.example.app",
    appName: "Example App"
  }),
  features: [expenses]
});
```

## Backend

Install the backend SDK and generate the backend entrypoint:

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.11/mobigent-backend-0.1.11.tgz
npx mobigent-backend init --app-id com.example.app --app-name "Example App"
```

Or write it manually:

```ts
import { startMobigentBackend } from "@mobigent/backend";

const mobigent = await startMobigentBackend();

console.log(mobigent.urls.inspector);
console.log(mobigent.urls.openapi);

const appConfig = mobigent.app({
  appId: "com.example.app",
  appName: "Example App"
});

console.log(mobigent.appConfigModule({
  appId: "com.example.app",
  appName: "Example App"
}));
```

Open the inspector URL. When the app connects, its tools appear there.
