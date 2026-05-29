---
sidebar_position: 2
---

# Quickstart

The easiest path is the starter:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.7/create-mobigent-app-0.1.7.tgz \
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

Install the app SDK:

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.7/mobigent-react-native-0.1.7.tgz
```

Create one feature:

```ts
import { feature } from "@mobigent/react-native/simple";

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

For a non-React demo or test host, connect the same feature in one call:

```ts
import { mobigent } from "@mobigent/react-native";
import { connectMobigent } from "@mobigent/react-native/simple";
import { expenses } from "./mobigent/expenses";

await connectMobigent(mobigent, {
  appId: "com.example.app",
  appName: "Example App",
  gatewayUrl: "ws://localhost:8787",
  features: [expenses]
});
```

## Backend

Install the backend SDK:

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.7/mobigent-backend-0.1.7.tgz
```

Start Mobigent:

```ts
import { startMobigentBackend } from "@mobigent/backend";

const mobigent = await startMobigentBackend();

console.log(mobigent.urls.inspector);
console.log(mobigent.urls.openapi);
```

Open the inspector URL. When the app connects, its tools appear there.
