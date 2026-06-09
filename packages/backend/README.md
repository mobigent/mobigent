# @mobigent/backend

The backend-side Mobigent SDK.

Use it like normal backend plumbing: start Mobigent, then call app-owned functions from your server code. The SDK waits for the app connection, routes the call, handles validation and confirmations, and exposes agent setup from the same backend object.

```bash
npm install @mobigent/backend
```

Preview fallback until npm publishing is fully connected:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- mobigent-install backend
```

## Call App Functions

```ts
import { startMobigent, type Backend } from "@mobigent/backend";
import type { MyAppFunctions } from "../app/mobigent";

const mobigent: Backend = await startMobigent();
const app = mobigent.use<MyAppFunctions>();

await app.expense.create({ merchant: "Airport Taxi", amount: 42.25 });
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
import { createApp } from "@mobigent/app";

const backend = await startMobigent();
const app = createApp(appFunctions, {
  backend
});

await app.connect();
```

When the app/backend boundary needs a plain settings object, use the explicit handoff:

```ts
const app = createApp(appFunctions, {
  backend: backend.forApp()
});
```

## Helper Names

Backend code can mirror app namespaces through `mobigent.use<MyAppFunctions>()`. If you want backend-specific helper names, bind aliases once:

```ts
const expenses = mobigent.use("expense", {
  createExpense: "create",
  listExpenses: "list"
});

await expenses.createExpense({ merchant: "Airport Taxi", amount: 42.25 });
await expenses.listExpenses();
```

For one-off explicit calls, use `mobigent.call("expense.create", input)`.

## Agents

When the app loop works, connect agents from the same backend object:

```ts
const chatgpt = mobigent.connect.chatgpt({
  publicUrl: "https://backend.example.com"
});

const claude = mobigent.connect.claude();
const openai = mobigent.connect.openai();
```

Older setup aliases and the dynamic backend function API remain available for compatibility, but new backend code should start with `mobigent.use<MyAppFunctions>()`.

## What It Handles

- app connection setup
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
- `BackendConnection`
- `AppFunction`
- `MobigentFunctionInfo`
- `MobigentBackendStatus`
- `MobigentAppSession`
- `MobigentCallResult`

Advanced docs cover OpenAPI, MCP, custom auth, provider runtimes, and hosted deployments after the simple app/backend loop works.
