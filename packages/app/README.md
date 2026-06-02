# @mobigent/app

The app-side Mobigent SDK.

Use this package inside your React Native or Expo app:

```bash
npm install @mobigent/app
```

Then expose normal app functions:

```ts
import { defineFeature, read, write } from "@mobigent/app";

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
```

Wrap the app once:

```tsx
import { withMobigent } from "@mobigent/app";
import { expenses } from "./mobigent/expenses";
import App from "./App";

export default withMobigent(App, expenses);
```

Prefer generated starter files? `npx mobigent-init --feature expense --out-dir src` is available, but it is optional.

`@mobigent/app` re-exports the React Native SDK from `@mobigent/react-native`. The older package remains supported, but new docs and starters use the shorter app-focused name.
