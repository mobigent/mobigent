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
- `emitMobigentEvent()` for app activity
- confirmation callbacks for sensitive writes

The result: agents get a clean interface, users stay in control, and your app decides exactly what is possible.

## The Simple Model

Mobigent has two normal packages:

- **App package**: `@mobigent/app` lives inside the mobile app and exposes app functions.
- **Backend package**: `@mobigent/backend` runs the agent-facing API, OpenAPI, inspector, and app connection layer.

Each package ships its own setup command, so the first integration stays small:

```bash
npx mobigent-init --feature expense --out-dir src
npx mobigent-backend --app-dir ../mobile-app
npx mobigent-backend agent chatgpt --base-url https://your-backend.example
```

The app developer writes ordinary app functions:

```txt
defineFeature("expense", {
  list: read(listExpenses),
  create: write(createExpense, {
    input: { merchant: "string", amount: "number" }
  })
})
```

The backend developer starts Mobigent like backend plumbing and calls app functions from a small object:

```ts
import { startMobigent } from "@mobigent/backend";

const backend = await startMobigent();
await backend.waitForApp();

const app = backend.appFunctions({
  createExpense: "expense.create",
  listExpenses: "expense.list"
});

await app.createExpense({ merchant: "Coffee", amount: 8 });
```

For local development, `startMobigent()` infers the app id and name from your project.

For a non-React host or local demo, pass the feature straight to the SDK:

```ts
await connectMobigent(expenses);
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
  -- create-mobigent-app my-demo --install
cd my-demo
npm run dev
```

That opens a visible app beside an agent playground. Click **Run agent request** and Mobigent calls the app's `expense.create` function, asks for approval in the app host, and adds a new row to the app state. In another terminal, run `npm run doctor` to confirm everything is healthy, then `npm run agent:local`, `npm run agent:openapi`, or `npm run agent:chatgpt` for copy-paste agent setup.

When you are ready to adapt it, start with `src/capabilities.ts`. That is the small file that owns the sample functions, schemas, and handlers.

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
npx mobigent-init --feature expense --out-dir src
```

In the backend:

```bash
npm install @mobigent/backend
npx mobigent-backend --app-dir ../mobile-app
```

Then backend code can call app functions like ordinary functions:

```ts
import { appFunctions, waitForApp } from "./mobigent";

await waitForApp();

const app = appFunctions({
  createExpense: "expense.create",
  listExpenses: "expense.list"
});

await app.createExpense({ merchant: "Coffee", amount: 8 });
```

See [docs/simple-integration.md](./docs/simple-integration.md) for the clean path before reading the advanced gateway/provider docs.

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

Then create the backend entrypoint:

```bash
npm install @mobigent/backend
npx mobigent-backend --app-dir ../mobile-app
```

From the backend, point Mobigent at the app folder and let the SDK write the tiny app config files:

```ts
const backend = await startMobigent({
  appDir: "../mobile-app",
  appToken: "dev-token",
  app: {
    id: "com.example.app",
    name: "Example App"
  }
});

console.log(backend.appConfigPath);
console.log(backend.appConfigModulePath);
```

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

Install the app package, then let the SDK create the tiny Mobigent folder from the backend config:

```bash
npm install @mobigent/app
npx mobigent-init --feature expense --out-dir src
```

You do not need to invent an app id for local development. If `mobigent.app.json` exists in the app, a parent folder, or a common sibling backend folder such as `../backend`, the app package uses it. For custom layouts, pass `--backend-dir ../server`. If no config exists yet, the initializer infers a starter app id and app name from `package.json`.

Create one feature file:

```ts
import { defineFeature } from "@mobigent/app";

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
```

Wrap the app once:

```tsx
import { withMobigent } from "@mobigent/app";
import { expenses } from "./mobigent/expenses";
import App from "./App";

export default withMobigent(App, expenses);
```

Prefer provider-style JSX? `setupMobigent(expenses)` still returns `{ Root }`.

Mobigent handles namespacing, schemas, validation, confirmation, connection lifecycle, backend communication, and event queueing.

Need another feature later? Run `npx mobigent-init --feature invoice --out-dir src`. Mobigent preserves the existing config and wrapper, creates the new feature file, and adds it to the wrapper.

For local development, the app package uses a safe starter identity when no config is present. For production, pass exact values or drop the backend-generated `mobigent.app.json` into the app and import its typed config.

If you are wiring a Node demo, test host, or another non-React runtime, use the same feature with the one-call connector:

```ts
import { startMobigent } from "@mobigent/backend";
import { connectMobigent } from "@mobigent/app";
import { expenses } from "./mobigent/expenses";

const backend = await startMobigent();

await connectMobigent(expenses, {
  connectionUrl: backend.defaultApp.connectionUrl,
});
```

## Add It To A Backend

Create the backend entrypoint and app config:

```bash
npm install @mobigent/backend
npx mobigent-backend --app-dir ../mobile-app
```

Mobigent infers starter app identity from the app project when `--app-dir` is present. Pass `--app-id` and `--app-name` only when you want exact production values.

That creates `mobigent.app.json` in the backend project. If your app lives beside a folder named `backend`, `server`, `api`, `agent-server`, or `mobigent-backend`, the app initializer auto-detects that config. For any other layout, pass `--app-dir` from the backend or `--backend-dir` from the app:

```bash
npx mobigent-init --feature expense --out-dir src --backend-dir ../server
```

Or write it manually:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appDir: "../mobile-app",
  app: {
    id: "com.example.app",
    name: "Example App"
  }
});

console.log(mobigent.urls.inspector);
console.log(mobigent.urls.openapi);

const appConfig = mobigent.defaultApp;
```

For the fastest first run, this also works:

```ts
const mobigent = await startMobigent();
const appConfig = mobigent.defaultApp;
```

That one function starts the app connection endpoint, HTTP API, OpenAPI schema, inspector, app function routing, audit trail, and readiness checks. When `appDir` is set, it infers identity from the mobile app and writes `../mobile-app/mobigent.app.json` plus `../mobile-app/src/mobigent-config.ts`, so the app package can use the backend connection without manual copying. If that config module already exists, the app initializer preserves it.

Wait for the app when your server needs to call app functions immediately:

```ts
await mobigent.waitForApp();
```

Call app-owned functions through a normal backend object:

```ts
const app = mobigent.appFunctions({
  createExpense: "expense.create",
  listExpenses: "expense.list"
});

await app.createExpense({ merchant: "Airport Taxi", amount: 42.25 });
await app.listExpenses();
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

Then inspect the app functions and generated agent interface:

```bash
curl http://localhost:8788/tools
curl http://localhost:8788/openapi.json
open http://localhost:8788/inspect
```

For the friendliest local loop, use the visible demo instead:

```bash
npm run demo:app
```

That single page includes the app UI, an agent request box, the function result, and a link to the inspector.

Use `mobigent.agent("chatgpt")` for ChatGPT Actions setup, `mobigent.agent("claude")` for Claude Desktop setup, or `mobigent.agent("openai")` for server-side OpenAI Responses setup.

The lower-level MCP command is still available for local agent clients:

```bash
npm run dev:mcp
```

## Packages

Most apps start with two packages:

- `@mobigent/app`: app SDK for declaring app functions with `defineFeature()` and wrapping apps with `withMobigent()`
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
