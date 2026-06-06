# @mobigent/backend

The backend-side Mobigent SDK.

Use it like normal backend plumbing: start Mobigent, then call app functions from your server code. Mobigent waits for the app connection when a function is called.

```bash
npm install @mobigent/backend
```

Until npmjs publishing is connected, install the public release tarballs together:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- mobigent-install backend
```

## Call App Functions

```ts
import { startMobigent, type Backend } from "@mobigent/backend";
import { appFunctions } from "./app-functions";

const mobigent: Backend = await startMobigent();
const app = mobigent.use(appFunctions);

await app.expense.create({ merchant: "Airport Taxi", amount: 42.25 });
await app.expense.list();
```

That is the main backend API.

Mobigent handles waiting for the app connection and routing calls to the matching app functions. The shared `appFunctions` object is only a TypeScript-friendly shape; the backend still calls the real function inside the connected app.

For production, keep `startMobigent()` and set backend config:

```bash
MOBIGENT_APP=com.acme.expenses
```

Explicit `startMobigent("com.acme.expenses")` still works when you want identity in code.

For tests or non-React demos, pass the backend object when you create the app SDK object:

```ts
import { createApp } from "@mobigent/app";

const backend = await startMobigent();
const app = createApp(appFunctions, {
  backend
});

await app.connect();
```

If the app setup needs a plain serializable settings object instead of the live backend object, pass `backend.forApp()`:

```ts
const app = createApp(appFunctions, {
  backend: backend.forApp()
});
```

The public `backend.connection` object contains the same app connection details for compatibility. `backend.appSettings()` is an older name for that explicit setup object. You usually do not need either in the normal same-process demo path.
For debugging, `backend.appConnectionUrl` shows where apps connect and `backend.agentUrl` shows the agent-facing API.

## What It Handles

- app connection setup
- app/backend matching by app id
- app function routing
- validation
- confirmations
- automatic readiness waiting
- inspector and audit trail
- agent setup helpers

`mobigent.functions.expense.create(...)` and `mobigent.app.expense.create(...)` work too when the backend cannot import the shared app function object.

Bind backend-friendly names once when you do not want backend code to mirror app namespaces:

```ts
const expenses = mobigent.use("expense", {
  createExpense: "create",
  listExpenses: "list"
});

await expenses.createExpense({ merchant: "Airport Taxi", amount: 42.25 });
await expenses.listExpenses();
```

For quick one-off explicit calls, use `mobigent.call("expense.create", input)`. For shutdown, call `await mobigent.stop()`.

When the app loop works, connect an agent from the same backend object:

```ts
const chatgpt = mobigent.connect.chatgpt({
  publicUrl: "https://backend.example.com"
});

const claude = mobigent.connect.claude();
const openai = mobigent.connect.openai();
```

The public TypeScript surface uses backend names:

- `Backend` for the object returned by `startMobigent(...)`
- `BackendOptions` for startup options
- `BackendStartOptions` for `startMobigent(appId, options)`
- `backend.use(appFunctions)` for typed backend calls that mirror the app's plain function object
- `backend.functions` for dynamic app function calls when the backend cannot import the function shape
- `backend.forApp()` for explicit app setup values when you cannot pass the backend object directly
- `backend.connection` and `backend.appSettings()` for compatibility when code needs explicit app setup values
- `backend.connect.chatgpt()`, `backend.connect.claude()`, and `backend.connect.openai()` for common agent setup
- `backend.setup.chatgpt()`, `backend.setup.claude()`, and `backend.setup.openai()` as compatibility aliases
- `backend.chatgpt()`, `backend.claude()`, and `backend.openai()` as direct aliases
- `BackendPairing` for `backend.pairing()`
- `BackendConnection` for `backend.connection` and compatibility code
- `AppFunction` for a callable app function on the backend
- `MobigentFunctionInfo` for `listFunctions()`
- `MobigentBackendStatus` for `ready()` and `waitForApp()`
- `MobigentAppSession` for `apps()`
- `MobigentCallResult` for app function call results

Prefer generated sample files? Use `create-mobigent-app`. The backend package is designed so real integrations can stay as install plus code.

Advanced docs cover OpenAPI, MCP, custom auth, provider runtimes, and hosted deployments after the simple app/backend loop works.
