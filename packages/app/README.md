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
  appId: "com.acme.expenses",
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

For non-React hosts and local demos, call `await mobigent.connect(backend)` instead of wrapping a component. Use `mobigent.emit(name, payload)` for app events.

No app-side init command is required. You should not have to run `npx mobigent-init --feature expense --out-dir src` just to integrate Mobigent. That command is only a sample-file generator.

The root `@mobigent/app` import is intentionally small: app functions, schema helpers, confirmation/status UI, and connection helpers. Advanced React Native APIs remain available from explicit subpaths such as `@mobigent/app/ui`, `@mobigent/app/schema-adapters`, `@mobigent/app/platform-actions`, and `@mobigent/app/expo`.
