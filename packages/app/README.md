# @mobigent/app

The app-side Mobigent SDK.

Use this package inside your React Native or Expo app:

```bash
npm install @mobigent/app
```

Then expose normal app functions and create one app SDK object:

```ts
import { createApp, defineFeature, read, write } from "@mobigent/app";

export const expenses = defineFeature("expense", {
  list: read(async () => ({ items: await listExpenses() })),
  create: write(async (input) => createExpense(input), {
    input: {
      merchant: "string",
      amount: "number"
    },
    confirm: true
  })
});

export const mobigent = createApp({ features: expenses });
```

Wrap the app once:

```tsx
import { mobigent } from "./mobigent/expenses";
import App from "./App";

export default mobigent.with(App);
```

For non-React hosts and local demos, call `await mobigent.connect()` instead of wrapping a component. Use `mobigent.emit(name, payload)` for app events.

Prefer generated starter files? `npx mobigent-init --feature expense --out-dir src` is available, but it is optional.

`@mobigent/app` re-exports the React Native SDK from `@mobigent/react-native`. The older package remains supported, but new docs and starters use the shorter app-focused name.
