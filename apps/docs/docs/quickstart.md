---
sidebar_position: 2
---

# Quickstart

The easiest path is the starter:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.12/create-mobigent-app-0.1.12.tgz \
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
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.12/mobigent-react-native-0.1.12.tgz
npx mobigent init --feature expense --out-dir src
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
import { expenses } from "./mobigent/expenses";

const { Root } = mobigentApp({
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
import { startMobigent } from "@mobigent/backend";
import { connectMobigent } from "@mobigent/react-native";
import { expenses } from "./mobigent/expenses";

const backend = await startMobigent();

await connectMobigent({
  connectionUrl: backend.defaultApp.connectionUrl,
  features: [expenses]
});
```

## Backend

Install the backend SDK and generate the backend entrypoint:

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.12/mobigent-backend-0.1.12.tgz
npx mobigent-backend init --app-dir ../mobile-app
```

Mobigent infers starter app identity from the project. Pass `--app-id` and `--app-name` only when you want exact production values.

Or write it manually:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent();

console.log(mobigent.urls.inspector);
console.log(mobigent.urls.openapi);

const appConfig = mobigent.defaultApp;

console.log(mobigent.copyAppConfig());
console.log(mobigent.agent("chatgpt").endpoints.openApi);
```

With no options, Mobigent infers a starter app id and app name from your project. Pass `app: { id, name }` when you want exact production values.

Open the inspector URL. When the app connects, its tools appear there.
