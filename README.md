# Mobigent

<p align="center">
  <img src="assets/brand/mobigent-mark.svg" alt="Mobigent logo" width="96" height="96">
</p>

**Make mobile apps agent-ready.**

Mobigent is an open-source SDK that lets AI agents use mobile app functions the same way your backend uses Firebase Cloud Messaging: install a client package, install a backend package, pass typed data, and let the SDK handle the bridge.

Your app exposes normal functions agents are allowed to use:

- `read()` functions for app state
- `write()` functions for app changes
- `screen()` functions for focusing important UI
- `mobigent.emit()` for app activity
- confirmation callbacks for sensitive writes

The result: agents get a clean interface, users stay in control, and your app decides exactly what is possible.

## The Simple Model

Mobigent has two normal packages:

- **App package**: `@mobigent/app` lives inside the mobile app and exposes app functions.
- **Backend package**: `@mobigent/backend` lets your backend call those app functions and handles the agent-facing service.

The app side does not need a setup command. Install the package and expose the functions your app already owns. The backend helper can write the tiny app config when you point it at the app folder:

```bash
npm install @mobigent/app
npm install @mobigent/backend
```

The app developer writes ordinary app functions and creates one app SDK object:

```txt
defineFeature("expense", {
  list: read(listExpenses),
  create: write(createExpense, {
    input: { merchant: "string", amount: "number" }
  })
})

const mobigent = createApp({ features: expenses })
export default mobigent.with(App)
```

The backend developer starts Mobigent like backend plumbing and calls app functions from a small object:

```ts
import { startMobigent } from "@mobigent/backend";

const backend = await startMobigent();
await backend.waitForApp();

const expense = backend.feature("expense");

await expense.create({ merchant: "Coffee", amount: 8 });
```

For local development, `startMobigent()` infers the app id and name from your project.

For a non-React host or local demo, use the same app SDK object:

```ts
const mobigent = createApp({ features: expenses });
await mobigent.connect();
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
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.12/create-mobigent-app-0.1.12.tgz \
  -- create-mobigent-app my-demo --package-source github-release --install
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

Then create one feature file and wire it once:

```ts
import { createApp, defineFeature, read, write } from "@mobigent/app";

export const expenses = defineFeature("expense", {
  list: read(async () => ({ items: await listExpenses() })),
  create: write(async (input) => createExpense(input), {
    input: { merchant: "string", amount: "number" },
    confirm: true
  })
});
```

```tsx
import { expenses } from "./mobigent/expenses";
import App from "./App";

const mobigent = createApp({ features: expenses });

export default mobigent.with(App);
```

In the backend:

```bash
npm install @mobigent/backend
```

Then backend code can call app functions like ordinary functions:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appDir: "../mobile-app"
});
await mobigent.waitForApp();

const expense = mobigent.feature("expense");

await expense.create({ merchant: "Coffee", amount: 8 });
```

See [docs/simple-integration.md](./docs/simple-integration.md) for the clean path before reading advanced docs.

For an existing React Native app, the intended npm path is:

```bash
npm install @mobigent/app
```

Current public fallback:

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.12/mobigent-app-0.1.12.tgz
```

For a backend/server app, the intended npm path is:

```bash
npm install @mobigent/backend
```

Current public fallback:

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.12/mobigent-backend-0.1.12.tgz
```

From the backend, point Mobigent at the app folder and let the SDK write the tiny app config files:

```ts
import { startMobigent } from "@mobigent/backend";

const backend = await startMobigent({
  appDir: "../mobile-app"
});

console.log(backend.appConfigPath);
console.log(backend.appConfigModulePath);
```

Prefer a generated backend entrypoint? `npx mobigent-backend --app-dir ../mobile-app` is still available as an optional scaffold.

## Install Packages

Until npmjs.com publishing is connected with an `NPM_TOKEN`, packages are published from tagged releases to GitHub Packages and attached to GitHub Releases.

Install directly from the public release tarball:

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.12/mobigent-app-0.1.12.tgz
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

You do not need to invent an app id for local development. If `mobigent.app.json` exists in the app, a parent folder, or a common sibling backend folder such as `../backend`, the app package uses it. If no config exists yet, the app SDK uses safe local defaults.

Create one feature file and one app SDK object:

```ts
import { createApp, defineFeature } from "@mobigent/app";

export const expenses = defineFeature("expense")
  .read("list", async () => ({
    items: await listExpenses()
  }))
  .write("create", async (input) => createExpense(input), {
    input: {
      merchant: "string",
      amount: "number"
    },
    confirm: true
  });

export const mobigent = createApp({ features: expenses });
```

Wrap the app once:

```tsx
import { mobigent } from "./mobigent/expenses";
import App from "./App";

export default mobigent.with(App);
```

Prefer explicit JSX wrapping? `setupMobigent(expenses)` still returns `{ Root }`.

Mobigent handles names, validation, confirmation, connection lifecycle, backend communication, and event queueing.

Need another feature later? Add another `defineFeature("invoice", ...)` file and pass both features to `createApp({ features: [expenses, invoices] })`.

Prefer generated starter files? `npx mobigent-init --feature expense --out-dir src` is still available as an optional scaffold, but it is not required.

For local development, the app package uses a safe starter identity when no config is present. For production, pass exact values or drop the backend-generated `mobigent.app.json` into the app and import its typed config.

If you are wiring a Node demo, test host, or another non-React runtime, use the same app SDK object:

```ts
import { startMobigent } from "@mobigent/backend";
import { createApp } from "@mobigent/app";
import { expenses } from "./mobigent/expenses";

const backend = await startMobigent();
const mobigent = createApp({
  features: expenses,
  connectionUrl: backend.defaultApp.connectionUrl
});

await mobigent.connect();
```

## Add It To A Backend

Install the backend SDK:

```bash
npm install @mobigent/backend
```

Start Mobigent from your server code:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appDir: "../mobile-app"
});

console.log(mobigent.urls.inspector);
console.log(mobigent.urls.openapi);

const appConfig = mobigent.defaultApp;
```

Mobigent infers starter app identity from the app project when `appDir` is present. Pass exact `app` values only when production needs them.

With `appDir`, Mobigent also writes `mobigent.app.json` and `src/mobigent-config.ts` into the app project. Your app package can use those files without any app-side setup command.

Prefer a generated backend entrypoint? `npx mobigent-backend --app-dir ../mobile-app` is still available as an optional scaffold.

For the fastest first run, this also works:

```ts
const mobigent = await startMobigent();
const appConfig = mobigent.defaultApp;
```

That one function starts Mobigent, routes app function calls, writes the app config when `appDir` is set, and exposes the local inspector for debugging.

Wait for the app when your server needs to call app functions immediately:

```ts
await mobigent.waitForApp();
```

Call app-owned functions through a normal backend object:

```ts
const expense = mobigent.feature("expense");

await expense.create({ merchant: "Airport Taxi", amount: 42.25 });
await expense.list();
```

For quick one-off calls, `mobigent.callApp("expense.create", input)` is still available.

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

- `@mobigent/app`: app SDK for `createApp()`, `defineFeature()`, app events, and React Native wrapping
- `@mobigent/backend`: backend SDK for `startMobigent()`, app function routing, inspector, agent HTTP, and app connections

Useful extras:

- `mobigent`: one friendly CLI for creating starters, adding app features, backend setup, and agent setup
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
- Run `npx mobigent-init --security-doctor ...` before exposing a hosted gateway.
- Use `fromZod()` or `fromTypeBox()` when you already have schemas.
- Run `npx mobigent-init --platform-actions json ...` to generate iOS App Intents and Android App Actions bridge plans.

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
