# @mobigent/app

The app-side Mobigent SDK.

Use this package inside your React Native or Expo app:

```bash
npm install @mobigent/app
```

Then expose normal app functions and create one app SDK object:

```ts
import { createApp, read, write } from "@mobigent/app";

export const mobigent = createApp({
  functions: {
    expense: {
      list: read(async () => ({ items: await listExpenses() })),
      create: write(async (input) => createExpense(input), {
        input: {
          merchant: "string",
          amount: "number"
        },
        confirm: true
      })
    }
  }
});
```

Wrap the app once:

```tsx
import { mobigent } from "./mobigent/expenses";
import App from "./App";

export default mobigent.with(App);
```

For non-React hosts and local demos, call `await mobigent.connect()` instead of wrapping a component. Use `mobigent.emit(name, payload)` for app events.

No app-side init command is required. Starter generation is only for demos.

`@mobigent/app` re-exports the React Native SDK from `@mobigent/react-native`. The older package remains supported, but new docs and starters use the shorter app-focused name.
