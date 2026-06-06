---
sidebar_position: 3
---

# Existing React Native App

This is the normal Mobigent integration path. You do not need `npx mobigent-init`.

That command only creates sample files for demos. In a real app, developers should write the Mobigent functions beside the app code they already have.

## Install

```bash
npm install @mobigent/app
npm install @mobigent/backend
```

Current public fallback until npmjs publishing is connected:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- mobigent-install app

npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- mobigent-install backend
```

## App Code

Create one small Mobigent file:

```ts
import { createApp } from "@mobigent/app";

export const mobigent = createApp("com.acme.expenses", {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

Wrap your existing app once:

```tsx
import { mobigent } from "./mobigent";
import App from "./App";

export default mobigent.with(App);
```

Or try it in one file first:

```tsx
import { withMobigent } from "@mobigent/app";
import App from "./App";

export default withMobigent(App, "com.acme.expenses", {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

That is the app integration.

Mobigent treats `list`, `get`, `read`, `fetch`, `search`, and `load` as reads. Other plain functions are confirmed writes by default.

Use `write()` only when you want input validation or custom approval copy:

```ts
import { write } from "@mobigent/app";

create: write(createExpense, {
  input: {
    merchant: "string",
    amount: "number"
  },
  confirm: "Create expense?"
})
```

## Backend Code

Start Mobigent with the same app id:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent("com.acme.expenses");
```

Call app-owned functions from backend code:

```ts
await mobigent.functions.expense.create({
  merchant: "Coffee",
  amount: 8
});

await mobigent.functions.expense.list();
```

`mobigent.app.expense.create(...)` works too. It means the same thing.

If your backend wants custom helper names, bind them once with `mobigent.use(...)`. Most apps do not need that on day one.

## What Developers Should Care About

- choose the app functions agents may call
- use the same `appId` in app and backend
- add schemas only when plain fields are not enough
- add confirmation copy for risky writes
- open the inspector during development

## What Mobigent Handles

- app/backend connection
- local development defaults
- function discovery
- validation
- user approval before risky writes
- reconnects and heartbeat
- queued events
- agent setup
- inspector and audit logs

## When To Use A Generator

Use `create-mobigent-app` when you want a full runnable demo before touching your app.

Use `mobigent-init` only if you want sample files copied into a project. It is not required for adoption.
