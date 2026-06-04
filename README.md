# Mobigent

<p align="center">
  <img src="assets/brand/mobigent-mark.svg" alt="Mobigent logo" width="96" height="96">
</p>

**Make mobile apps agent-ready.**

Mobigent is an open-source SDK that lets AI agents use mobile app functions the same way your backend uses Firebase Cloud Messaging: install a client package, install a backend package, pass typed data, and let the SDK handle the bridge.

Your app exposes normal functions agents are allowed to use:

- plain functions such as `expense.list()` and `expense.create()`
- optional `read()` and `write()` wrappers when you want schemas, descriptions, or approval text
- `screen()` functions for focusing important UI
- `mobigent.emit()` for app activity
- confirmation callbacks for sensitive writes

The result: agents get a clean interface, users stay in control, and your app decides exactly what is possible.

## The Simple Model

Mobigent has two normal packages:

- **App package**: `@mobigent/app` lives inside the mobile app and exposes app functions.
- **Backend package**: `@mobigent/backend` lets your backend call those app functions and handles the agent-facing service.

The app side does not need a setup command. Install the package and expose the functions your app already owns. Optional generators are for examples, not real integration.

Use the same app id on both sides, like a normal mobile/backend integration:

```bash
npm install @mobigent/app
npm install @mobigent/backend
```

The app developer writes ordinary app functions and creates one app SDK object:

```txt
const mobigent = createApp("com.acme.expenses", {
  expense: {
    list: async () => listExpenses(),
    create: async (input) => createExpense(input)
  }
})

export default mobigent.with(App)
```

The backend developer starts Mobigent like backend plumbing and calls app functions from a small object:

```ts
import { startMobigent } from "@mobigent/backend";

const backend = await startMobigent("com.acme.expenses", "Acme Expenses");

await backend.app.expense.create({ merchant: "Coffee", amount: 8 });
```

For local development, Mobigent can infer starter values when you leave the app id out, but real apps should pass the same stable `appId` in the app and backend.

For a non-React host or local demo, use the same app SDK object:

```ts
const backend = await startMobigent("com.acme.expenses", "Acme Expenses");

await mobigent.connect(backend);
```

Everything else, connection URLs, sockets, tokens, registration loops, provider mapping, confirmations, retries, audit events, agent setup, and inspector wiring, is SDK plumbing.

## Quick Start

After npm publishing is enabled, the first run is:

```bash
npm create mobigent-app@latest my-demo -- --install
cd my-demo
npm run dev
```

Current public fallback until npmjs publishing is connected:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- create-mobigent-app my-demo --install
cd my-demo
npm run dev
```

That opens a visible app beside an agent playground. Click **Run agent request** and Mobigent calls the app's `expense.create` function, asks for approval in the app host, and adds a new row to the app state. In another terminal, run `npm run doctor` to confirm everything is healthy, then `npm run agent:local`, `npm run agent:openapi`, or `npm run agent:chatgpt` for copy-paste agent setup.

When you are ready to adapt it, start with `src/capabilities.ts`. That is the small file that owns the sample app functions.

Working from this repo? Create the same starter locally:

```bash
npm run starter:new -- my-demo --install
cd my-demo
npm run dev
```

Working from this repo? Run the local demo:

```bash
npm install
npm run demo:app
```

That first run is the whole idea: agents do not tap screens or guess UI. Your app exposes safe functions, and Mobigent lets agents call them.

## The Boring Integration Path

In the app:

```bash
npm install @mobigent/app
```

Then create one Mobigent file and wire it once:

```ts
import { createApp } from "@mobigent/app";

export const mobigent = createApp("com.acme.expenses", {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

For a quick local demo, you can pass the function map directly:

```ts
export const mobigent = createApp({
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

Use `createApp(appId, functions)` before connecting real apps and agents.

Mobigent treats `list`/`get`/`read`/`fetch`/`search`/`load` functions as reads. Other plain functions are writes and require confirmation by default. When you want validation or custom approval copy, wrap that one function:

```ts
import { write } from "@mobigent/app";

create: write(createExpense, {
  input: { merchant: "string", amount: "number" },
  confirm: "Create expense?"
})
```

```tsx
import { mobigent } from "./mobigent";
import App from "./App";

export default mobigent.with(App);
```

In the backend:

```bash
npm install @mobigent/backend
```

Then backend code can call app functions like ordinary functions:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent("com.acme.expenses", "Acme Expenses");

await mobigent.app.expense.create({ merchant: "Coffee", amount: 8 });
```

See [docs/simple-integration.md](./docs/simple-integration.md) for the clean path before reading advanced docs.

For an existing React Native app, the intended npm path is:

```bash
npm install @mobigent/app
```

Current public fallback:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- mobigent-install app
```

For a backend/server app, the intended npm path is:

```bash
npm install @mobigent/backend
```

Current public fallback:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- mobigent-install backend
```

Prefer generated sample files? Use `mobigent new my-demo --install`. The app-side init command is demo scaffolding, not required integration.

## Install Packages

Until npmjs.com publishing is connected with an `NPM_TOKEN`, the preview installer pulls packages from the public GitHub release.

Install the app SDK during the preview:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- mobigent-install app
```

Or install from npmjs after npm publishing is connected:

```bash
npm install @mobigent/app
npm install @mobigent/backend
npm install -D mobigent
```

Maintainer note: npmjs publishing is tracked in [docs/npm-publishing.md](./docs/npm-publishing.md). The release workflow supports either `NPM_TOKEN` or npm Trusted Publishing through GitHub Actions OIDC.

## Add It To An Existing React Native App

Install the app package:

```bash
npm install @mobigent/app
```

Use one stable app id and reuse it in the backend. For quick local experiments, the app SDK can use safe local defaults.

Create one Mobigent file and one app SDK object:

```ts
import { createApp } from "@mobigent/app";

export const mobigent = createApp("com.acme.expenses", {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

For quick local experiments, this also works:

```ts
export const mobigent = createApp({
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});
```

Use `createApp(appId, functions)` before connecting real apps and agents.

Wrap the app once:

```tsx
import { mobigent } from "./mobigent";
import App from "./App";

export default mobigent.with(App);
```

Mobigent handles names, validation, confirmation, connection lifecycle, backend communication, and event queueing.

Need another app area later? Add another namespace inside `functions`.

No app-side init command is required. Starter generation is only for demos.

For production, pass the same `appId` in the app and backend. If `mobigent.app.json` exists, the app package can still use it, but a generated config file is not required.

If you are wiring a Node demo, test host, or another non-React runtime, use the same app SDK object:

```ts
import { startMobigent } from "@mobigent/backend";
import { mobigent } from "./mobigent";

const backend = await startMobigent("com.acme.expenses", "Acme Expenses");

await mobigent.connect(backend);
```

## Add It To A Backend

Install the backend SDK:

```bash
npm install @mobigent/backend
```

Start Mobigent from your server code:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent("com.acme.expenses", "Acme Expenses");

console.log(mobigent.inspectorUrl);
console.log(mobigent.openApiUrl);
```

The app and backend pair by `appId`. For local experiments, `startMobigent()` can infer a starter app id from the project name, but a real app should pass a stable id.

Optional local helper: pass `appDir: "../mobile-app"` only when you want the backend to write `mobigent.app.json` and `src/mobigent-config.ts` into an existing app project. The normal path does not need generated config files.

Prefer a generated backend entrypoint? `npx mobigent-backend --app com.acme.expenses --app-name "Acme Expenses"` is still available as an optional scaffold.

For the fastest first run, this also works:

```ts
const mobigent = await startMobigent();
```

That one function starts Mobigent, routes app function calls, infers a local app id for demos, and exposes the local inspector for debugging.

Call app-owned functions through a normal backend object. Mobigent waits for the app connection when the function is called:

```ts
await mobigent.app.expense.create({ merchant: "Airport Taxi", amount: 42.25 });
await mobigent.app.expense.list();
```

Or bind backend-friendly names once:

```ts
const expenses = mobigent.functions({
  createExpense: "expense.create",
  listExpenses: "expense.list"
});

await expenses.createExpense({ merchant: "Airport Taxi", amount: 42.25 });
await expenses.listExpenses();
```

Use `waitForApp()` only when you want an explicit startup health gate:

```ts
await mobigent.waitForApp();
```

For quick one-off calls, use `mobigent.call("expense.create", input)`.

It also gives you agent setup from the same backend object:

```ts
console.log(mobigent.agent("chatgpt").endpoints.openApi);
console.log(mobigent.agent("claude").guide);
```

## Connect An Agent

Start the backend:

```bash
npm run dev
```

Then inspect the app functions:

```bash
open http://localhost:8788/inspect
```

For the friendliest local loop, use the visible demo instead:

```bash
npm run demo:app
```

That single page includes the app UI, an agent request box, the function result, and a link to the inspector.

Use `mobigent.agent("chatgpt")` for ChatGPT Actions setup, `mobigent.agent("claude")` for Claude Desktop setup, or `mobigent.agent("openai")` for server-side OpenAI Responses setup.

Advanced local agent clients can still use MCP:

```bash
npm run dev:mcp
```

## Packages

Most apps start with two packages:

- `@mobigent/app`: app SDK for `createApp()`, app functions, app events, and React Native wrapping
- `@mobigent/backend`: backend SDK for `startMobigent()`, `mobigent.app.expense.create(...)`, inspector, agent HTTP, and app connections

Useful extras:

- `mobigent`: optional CLI for creating starters and printing agent setup
- `create-mobigent-app`: one-command starter app with backend, inspector, visible app, and agent playground
- `packages/ios`: native Swift Package for iOS apps
- `packages/android`: native Kotlin/Android SDK

Advanced internals:

- `@mobigent/core`: protocol and shared types
- `@mobigent/gateway`: lower-level internal bridge package for custom hosting, HTTP/OpenAPI, and MCP
- `@mobigent/providers`: provider setup helpers behind `mobigent.agent(...)`

## Examples

- `examples/expense-app`: sample mobile app capabilities
- `examples/ios-expense`: native Swift example
- `examples/android-expense`: native Kotlin/Android example
- `examples/agent-server`: OpenAI, Anthropic, Gemini, Bedrock, Vercel AI SDK, and mock agent examples

## Documentation

- Website: https://mobigent.github.io/mobigent/
- Docs: https://mobigent.github.io/mobigent/docs.html
- Flagship demo: [docs/flagship-demo.md](./docs/flagship-demo.md)
- First run: [docs/quickstart.md](./docs/quickstart.md)
- MCP setup: [docs/mcp.md](./docs/mcp.md)
- ChatGPT Actions: [docs/chatgpt-actions.md](./docs/chatgpt-actions.md)
- React Native guide: [docs/react-native.md](./docs/react-native.md)
- iOS guide: [docs/ios.md](./docs/ios.md)
- Android guide: [docs/android.md](./docs/android.md)
- Capability design: [docs/capability-design.md](./docs/capability-design.md)
- Security model: [docs/security.md](./docs/security.md)
- Production gateway: [docs/production-gateway.md](./docs/production-gateway.md)
- Hosted gateway and tunnels: [docs/hosted-gateway.md](./docs/hosted-gateway.md)
- Native publishing plan: [docs/native-publishing.md](./docs/native-publishing.md)
- npm publishing: [docs/npm-publishing.md](./docs/npm-publishing.md)
- Developer workflow: [docs/developer-workflow.md](./docs/developer-workflow.md)

## Developer Workflow Highlights

- Open `http://localhost:8788/inspect` to see apps, functions, metrics, audit events, and backend snapshot data.
- Run `npx mobigent app --security-doctor ...` before exposing a hosted gateway.
- Use `fromZod()` or `fromTypeBox()` when you already have schemas.
- Run `npx mobigent app --platform-actions json ...` to generate optional iOS App Intents and Android App Actions bridge plans.

## Why Mobigent Exists

Mobile apps were not designed for agents. Today, most agent workflows depend on fragile UI automation, screenshots, and guessing.

Mobigent gives apps a real agent interface:

1. Apps define functions.
2. Agents discover the allowed functions.
3. Calls are validated before they run.
4. Risky actions require user confirmation.
5. Every important event can be audited.

It is MCP-inspired, but built for mobile app control, app state, user approval, and native product workflows.

## Project Status

Mobigent is an early developer preview. The proof of concept already includes:

- React Native SDK APIs
- Native iOS SDK
- Native Android SDK
- Local app/backend bridge
- HTTP and OpenAPI support
- MCP server support
- User confirmation flow
- Capability validation
- Audit events
- Provider examples
- GitHub Pages docs site
- Native CI workflow
- Docker production gateway path

The goal is simple: make Mobigent the easiest way to build agentic mobile apps.

## License

MIT
