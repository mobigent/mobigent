# @mobigent/backend

The backend-side Mobigent SDK.

Use it like normal backend SDK code: start Mobigent, then call app-owned functions from your server code. The SDK waits for the app, routes the call, handles validation and confirmations, and exposes agent setup from the same backend object.

```bash
npm install @mobigent/backend
```

## Call App Functions

```ts
import { startMobigent, type Backend } from '@mobigent/backend';
import type { MyAppFunctions } from '../app/mobigent';

const mobigent: Backend = await startMobigent();
const app = mobigent.app<MyAppFunctions>();

await app.expense.create({ merchant: 'Airport Taxi', amount: 42.25 });
await app.expense.list();
```

That is the main backend API. The type import is erased at runtime, so Node gets autocomplete without loading React Native app code.

For production, keep the code the same and set backend identity in config:

```bash
MOBIGENT_APP=com.acme.expenses
```

## Local Tests And Demos

If your app code is running in the same Node process for a demo or test, pass the backend object once:

```ts
import { createApp } from '@mobigent/app';

const backend = await startMobigent();
const app = createApp(appFunctions, {
  backend,
});

await app.connect();
```

## Helper Names

Backend code can mirror app namespaces through `mobigent.app<MyAppFunctions>()`. If you want backend-specific helper names, bind aliases once:

```ts
const expenses = mobigent.app('expense', {
  createExpense: 'create',
  listExpenses: 'list',
});

await expenses.createExpense({ merchant: 'Airport Taxi', amount: 42.25 });
await expenses.listExpenses();
```

For one-off explicit calls, use `mobigent.call("expense.create", input)`.

## Agents

When the app loop works, connect agents from the same backend object:

```ts
const chatgpt = mobigent.connect.chatgpt({
  publicUrl: 'https://backend.example.com',
});

const claude = mobigent.connect.claude();
const openai = mobigent.connect.openai();
```

Older setup aliases, `mobigent.use()`, and the dynamic backend function API remain available for compatibility, but new backend code should start with `mobigent.app<MyAppFunctions>()`.

## What It Handles

- app/backend delivery
- app/backend matching by app id
- automatic waiting while the app connects
- app function routing
- input and output validation
- user confirmations for risky writes
- inspector, health, readiness, and audit trail
- ChatGPT, Claude, OpenAI, OpenAPI, and MCP setup helpers
- clean shutdown with `await mobigent.stop()`

Friendly public types:

- `Backend`
- `BackendOptions`
- `BackendStartOptions`
- `AppFunction`
- `MobigentFunctionInfo`
- `MobigentBackendStatus`
- `MobigentAppSession`
- `MobigentCallResult`

Advanced docs cover OpenAPI, MCP, custom auth, provider runtimes, and hosted deployments after the simple app/backend loop works.
