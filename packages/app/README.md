# @mobigent/app

The app-side Mobigent SDK.

Use this package inside your React Native or Expo app:

```bash
npm install @mobigent/app
```

Until npmjs publishing is connected, install the public release tarballs together:

```bash
npm install \
  https://github.com/mobigent/mobigent/releases/download/v0.1.14/mobigent-core-0.1.14.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.14/mobigent-react-native-0.1.14.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.14/mobigent-app-0.1.14.tgz
```

Then expose normal app functions and create one app SDK object:

```ts
import { createApp } from "@mobigent/app";

export const mobigent = createApp({
  appId: "com.acme.expenses",
  functions: {
    expense: {
      list: async () => ({ items: await listExpenses() }),
      create: async (input) => createExpense(input)
    }
  }
});
```

Mobigent treats `list`, `get`, `read`, `fetch`, `search`, and `load` as reads. Other plain functions are confirmed writes by default. Use `read()`, `write()`, or `action()` only when you want schemas, descriptions, or custom approval text.

Wrap the app once:

```tsx
import { mobigent } from "./mobigent/expenses";
import App from "./App";

export default mobigent.with(App);
```

For non-React hosts and local demos, call `await mobigent.connect(backend)` instead of wrapping a component. Use `mobigent.emit(name, payload)` for app events.

No app-side init command is required. You should not have to run `npx mobigent-init --feature expense --out-dir src` just to integrate Mobigent. That command is only a sample-file generator.

The root `@mobigent/app` import is intentionally small: app functions, schema helpers, confirmation/status UI, and connection helpers. Advanced React Native APIs remain available from explicit subpaths such as `@mobigent/app/ui`, `@mobigent/app/schema-adapters`, `@mobigent/app/platform-actions`, and `@mobigent/app/expo`.
