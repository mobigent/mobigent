# mobigent

One friendly CLI and convenience SDK entrypoint for Mobigent.

Use this package when you want one command to remember:

```bash
npx mobigent new my-demo --install
npx mobigent install app
npx mobigent install backend
npx mobigent agent chatgpt --base-url https://your-backend.example
```

The runtime SDKs are still the two normal packages:

- `@mobigent/app` in the app
- `@mobigent/backend` in the backend

This package also re-exports backend helpers and lightweight app-function builders for experiments or tiny demos:

```ts
import { startMobigent, write } from 'mobigent';
import { createApp } from '@mobigent/app';

const backend = await startMobigent();
const app = createApp(
  {
    expense: {
      list: async () => ({ items: await listExpenses() }),
      create: write(createExpense, {
        input: { merchant: 'string', amount: 'number' },
      }),
    },
  },
  {
    backend,
  },
);
```

For production apps, the split packages keep ownership clear: `@mobigent/app` in the app and `@mobigent/backend` in the backend. App-side and backend scaffolding are optional; the normal SDK path is `npm install @mobigent/app`, `npm install @mobigent/backend`, `createApp(functions).with(App)`, and `startMobigent()`. Add a stable app id on both sides when you move beyond local development.

You do not need the app-side init command for a real integration. Write the functions directly in your app code. The generator exists only when you want sample files.

## Common Commands

```bash
mobigent install app
mobigent install backend
```

Install the app SDK or backend SDK from the current public release while npmjs publishing is being connected.

```bash
mobigent new my-demo --install
mobigent create my-demo --install
```

Create a runnable starter with an app, backend, inspector, and agent playground.

```bash
mobigent agent claude
mobigent agent chatgpt --base-url https://your-backend.example
```

Print agent setup using the backend package.

## Optional Tools

```bash
mobigent backend --app com.acme.expenses
```

Generate a backend entrypoint if you do not want to write it by hand.

```bash
mobigent app --doctor --app-root .
mobigent app --security-doctor --feature expense
```

Check a React Native integration. Advanced artifact commands are available from `mobigent app --help`, but real app integration stays in code: install `@mobigent/app`, expose functions, and wrap the app once.

For a complete throwaway sample, use `mobigent new my-demo --install`. The app helper commands are not part of normal installation.
