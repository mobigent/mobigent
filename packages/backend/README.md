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

const mobigent: Backend = await startMobigent();

await mobigent.functions.expense.create({ merchant: "Airport Taxi", amount: 42.25 });
await mobigent.functions.expense.list();
```

That is the main backend API.

Mobigent handles waiting for the app connection and routing calls to the matching app functions.

For production, pass the same stable app id that your app SDK uses: `startMobigent("com.acme.expenses")`.

For tests or non-React demos, pass the backend object when you create the app SDK object:

```ts
import { createApp } from "@mobigent/app";

const backend = await startMobigent();
const app = createApp(appFunctions, {
  backend
});

await app.connect();
```

The public `backend.connection` object contains the same app connection details for compatibility. You usually do not need to read or copy it yourself.
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

`mobigent.app.expense.create(...)` works too. It means the same thing and reads nicely when you want to emphasize that the function lives inside the app.

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

The public TypeScript surface uses backend names:

- `Backend` for the object returned by `startMobigent(...)`
- `BackendOptions` for startup options
- `BackendStartOptions` for `startMobigent(appId, options)`
- `backend.functions` for calling app functions from backend code
- `backend.connection` and `backend.appSettings()` for compatibility when code needs explicit app setup values
- `backend.chatgpt()`, `backend.claude()`, and `backend.openai()` for common agent setup
- `BackendPairing` for `backend.pairing()`
- `BackendConnection` for `backend.connection` and compatibility code
- `AppFunction` for a callable app function on the backend
- `MobigentFunctionInfo` for `listFunctions()`
- `MobigentBackendStatus` for `ready()` and `waitForApp()`
- `MobigentAppSession` for `apps()`
- `MobigentCallResult` for app function call results

Prefer generated sample files? Use `create-mobigent-app`. The backend package is designed so real integrations can stay as install plus code.

Advanced docs cover OpenAPI, MCP, custom auth, provider runtimes, and hosted deployments after the simple app/backend loop works.
