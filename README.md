# Mobigent

<p align="center">
  <img src="assets/brand/mobigent-mark.svg" alt="Mobigent logo" width="96" height="96">
</p>

**Make mobile apps agent-ready with normal app functions.**

Mobigent is an open-source SDK for letting AI agents call safe functions inside mobile apps. The model is intentionally boring:

- install `@mobigent/app` in the app
- install `@mobigent/backend` in the backend
- expose normal functions from the app
- call those functions from backend code
- let the SDK handle delivery, validation, confirmations, retries, events, agent setup, and audit logs

## Install

```bash
npm install @mobigent/app
npm install @mobigent/backend
```

That is the normal integration. No app-side init command is required.

## App Code

Create one Mobigent file in your app:

```ts
import { createApp, type AppFunctions } from '@mobigent/app';

export const appFunctions = {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input),
  },
} satisfies AppFunctions;

export type MyAppFunctions = typeof appFunctions;

export const mobigent = createApp(appFunctions);
```

Wrap your app once:

```tsx
import { mobigent } from './mobigent';
import App from './App';

export default mobigent.with(App);
```

Or try it in one file:

```tsx
import { withMobigent } from '@mobigent/app';
import App from './App';

export default withMobigent(App, {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input),
  },
});
```

Plain `list`, `get`, `read`, `fetch`, `search`, and `load` functions are treated as reads. Other plain functions are confirmed writes by default. Use `write()` only when you want schemas or custom approval copy:

```ts
import { write } from '@mobigent/app';

create: write(createExpense, {
  input: { merchant: 'string', amount: 'number' },
  confirm: 'Create expense?',
});
```

## Backend Code

Start Mobigent in your backend:

```ts
import { startMobigent } from '@mobigent/backend';
import type { MyAppFunctions } from '../app/mobigent';

const mobigent = await startMobigent();
const app = mobigent.app<MyAppFunctions>();

await app.expense.create({ merchant: 'Coffee', amount: 8 });
await app.expense.list();
```

That type import is erased at runtime, so the backend gets autocomplete without loading mobile code.

If you want backend-friendly helper names, bind them once:

```ts
const expenses = mobigent.app('expense', {
  createExpense: 'create',
  listExpenses: 'list',
});

await expenses.createExpense({ merchant: 'Coffee', amount: 8 });
```

## Production Config

Keep the code the same and set matching app identity in config:

```bash
# backend
MOBIGENT_APP=com.acme.expenses

# Expo / React Native app
EXPO_PUBLIC_MOBIGENT_APP=com.acme.expenses
EXPO_PUBLIC_MOBIGENT_BACKEND_URL=wss://your-backend.example.com
```

## Local Demo

Try the full loop before touching your app:

```bash
npm create mobigent-app@latest my-demo -- --install
cd my-demo
npm run dev
```

The demo opens one page with app state, an agent request box, and an inspector link. Click **Run agent request** to call the app-owned `expense.create` function.

Working from this repo:

```bash
npm install
npm run demo:app
```

## Non-React Or Test Hosts

Use the same app function object and pass the backend once:

```ts
import { startMobigent } from '@mobigent/backend';
import { createApp } from '@mobigent/app';
import { expenseFunctions } from './app-functions';

const backend = await startMobigent();
const mobigent = createApp(expenseFunctions, {
  backend,
});

await mobigent.connect();
```

## Agents

The backend object also gives you agent setup:

```ts
console.log(mobigent.connect.chatgpt().endpoints.openApi);
console.log(mobigent.connect.claude().guide);
console.log(mobigent.connect.openai().guide);
```

For local debugging:

```bash
open http://localhost:8788/inspect
curl http://localhost:8788/health
```

## Packages

Most apps use two packages:

- `@mobigent/app`: app-side functions, React Native wrapping, confirmations, events
- `@mobigent/backend`: backend function calls, inspector, readiness, agent setup

Optional helpers:

- `mobigent`: friendly CLI for demos, checks, and agent setup
- `create-mobigent-app`: runnable starter app
- `packages/ios`: native Swift SDK
- `packages/android`: native Kotlin/Android SDK

## Examples

- `examples/expense-app`: sample app functions
- `examples/agent-server`: provider examples
- `examples/ios-expense`: native Swift example
- `examples/android-expense`: native Kotlin/Android example

## Docs

- Website: https://mobigent.github.io/mobigent/
- Docs: https://mobigent.github.io/mobigent/docs.html
- Quickstart: [docs/quickstart.md](./docs/quickstart.md)
- Existing React Native app: [docs/existing-react-native-app.md](./docs/existing-react-native-app.md)
- React Native: [docs/react-native.md](./docs/react-native.md)
- iOS: [docs/ios.md](./docs/ios.md)
- Android: [docs/android.md](./docs/android.md)
- Security: [docs/security.md](./docs/security.md)
- Production backend: [docs/production-gateway.md](./docs/production-gateway.md)
- ChatGPT Actions: [docs/chatgpt-actions.md](./docs/chatgpt-actions.md)
- MCP: [docs/mcp.md](./docs/mcp.md)

## How It Works

Mobigent follows the same pattern as Firebase, Stripe, or any backend SDK you already know:

| Step | You do | Mobigent handles |
|------|--------|------------------|
| 1. Install | `npm install @mobigent/app @mobigent/backend` | All dependencies, no native linking |
| 2. Expose | Write normal async functions in your app | Input/output validation, read/write detection |
| 3. Wrap | `export default mobigent.with(App)` | WebSocket connection, reconnect, heartbeat |
| 4. Call | `await app.expense.create(input)` from your backend | Delivery, routing, user confirmation, retries, audit |
| 5. Agents | `mobigent.connect.chatgpt()` when ready | 30+ agent frameworks, tool discovery, provider setup |

The SDK handles delivery, validation, confirmations, retries, events, agent setup, and audit logs. You write the app functions and call them.

## Status

Mobigent is in beta. The SDK includes React Native, native iOS (Swift Package), native Android (Kotlin/Gradle), local app/backend delivery, HTTP/OpenAPI, MCP, confirmation flow, validation, structured logging, audit events, Prometheus metrics, provider adapters for 30+ agent frameworks, GitHub Pages docs, native CI, and Docker production hosting.

The goal: make Mobigent the easiest way to build agentic mobile apps. Install two packages, expose normal functions, call them from backend code. The SDK handles the rest.

## License

MIT
