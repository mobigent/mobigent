---
sidebar_position: 2
---

# Quickstart

The easiest path is the starter:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- create-mobigent-app my-demo --install
cd my-demo
npm run dev
```

Click **Run agent request**. The demo calls the app-owned `expense.create` function and updates visible app state.

In another terminal:

```bash
npm run doctor
```

You should see app, backend, readiness, and function checks pass.

## Simple Model

Use `@mobigent/app` in the mobile app and `@mobigent/backend` in the backend. The app exposes functions. The backend waits for the app and calls those functions. Mobigent handles connection, validation, confirmations, retries, and agent setup.

## Existing React Native App

Install the app SDK:

```bash
npm install @mobigent/app
```

Current public fallback until npmjs publishing is connected:

```bash
npm install \
  https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-core-0.1.15.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-react-native-0.1.15.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-app-0.1.15.tgz
```

Create one Mobigent file:

```ts
import { createApp } from "@mobigent/app";

export const mobigent = createApp("com.acme.expenses", {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

That is the normal path. Mobigent treats `list`, `get`, `read`, `fetch`, `search`, and `load` as reads. Other plain functions are confirmed writes by default. Add `write()` only when you want validation or custom approval copy.

Wrap the app once:

```tsx
import { mobigent } from "./mobigent";
import App from "./App";

export default mobigent.with(App);
```

No app-side init command is required.

For a non-React demo or test host, use the same app SDK object:

```ts
import { startMobigent } from "@mobigent/backend";
import { mobigent } from "./mobigent";

const backend = await startMobigent("com.acme.expenses", "Acme Expenses");

await mobigent.connect(backend);
```

## Backend

Install the backend SDK:

```bash
npm install @mobigent/backend
```

Current public fallback until npmjs publishing is connected:

```bash
npm install \
  https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-core-0.1.15.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-providers-0.1.15.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-gateway-0.1.15.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-backend-0.1.15.tgz
```

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent("com.acme.expenses", "Acme Expenses");

console.log(mobigent.inspectorUrl);
console.log(mobigent.agent("chatgpt").endpoints.openApi);
```

Mobigent pairs the backend and app by `appId`, handles the connection, routes app function calls, exposes the inspector, and waits for readiness when needed.

Prefer generated sample files? Use the starter. Backend/app init commands are helpers, not required integration.

Call app functions from the backend SDK object. Mobigent waits for the app connection when a function is called:

```ts
await mobigent.app.expense.create({ merchant: "Coffee", amount: 8 });
await mobigent.app.expense.list();
```

Shortest explicit backend start:

```ts
const mobigent = await startMobigent("com.acme.expenses", "Acme Expenses");
```
