# Mobigent

<p align="center">
  <img src="assets/brand/mobigent-mark.svg" alt="Mobigent logo" width="96" height="96">
</p>

**Make mobile apps agent-ready.**

Mobigent is an open-source SDK that lets AI agents use mobile app functions the same way your backend uses Firebase Cloud Messaging: install a client package, install a backend package, pass typed data, and let the SDK handle the bridge.

Your app exposes what agents are allowed to do:

- **Actions**: create an expense, submit an order, update a profile
- **Resources**: read app state, fetch a list, inspect a record
- **Components**: focus a screen or important UI surface
- **Events**: report app activity back to the agent
- **Confirmations**: ask the user before sensitive actions run

The result: agents get a clean interface, users stay in control, and your app decides exactly what is possible.

## The Simple Model

Mobigent has two normal packages:

- **App package**: `@mobigent/react-native` lives inside the mobile app and exposes app functions.
- **Backend package**: `@mobigent/backend` runs the agent-facing API, OpenAPI, inspector, and app connection layer.

The app developer should only think:

```txt
defineFeature("expense")
  .read("list", listExpenses)
  .write("create", createExpense, { input: { merchant: "string", amount: "number" } })
```

The backend developer should only think:

```ts
import { startMobigent } from "@mobigent/backend";

const backend = await startMobigent({
  app: {
    id: "com.example.app",
    name: "Example App"
  }
});
```

For a non-React host or local demo, pass the backend config straight to the SDK:

```ts
await connectMobigent({
  config: backend.defaultApp,
  features: [expenses]
});
```

Everything else, WebSockets, tokens, registration loops, manifests, OpenAPI, MCP, confirmations, retries, audit events, and inspector wiring, is SDK plumbing.

## Quick Start

Create a Mobigent starter from the public GitHub release:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.12/create-mobigent-app-0.1.12.tgz \
  -- create-mobigent-app my-demo --install
cd my-demo
npm run dev
```

That opens a visible app beside an agent playground. Click **Run agent request** and Mobigent calls the app's `expense_create` tool, asks for approval in the app host, and adds a new row to the app state. In another terminal, run `npm run doctor` to confirm everything is healthy, then `npm run agent:local`, `npm run agent:openapi`, or `npm run agent:chatgpt` for copy-paste agent setup.

When you are ready to adapt it, start with `src/capabilities.ts`. That is the small file that owns the sample action, resource, schemas, and handler.

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

That first run is the whole idea: agents do not tap screens or guess UI. Your app exposes safe tools, and Mobigent lets agents call them.

For an existing React Native app, install the app SDK:

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.12/mobigent-react-native-0.1.12.tgz
```

For a backend/server app, install the backend package:

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.12/mobigent-backend-0.1.12.tgz
```

After npmjs publishing is connected, the normal backend setup is:

```bash
npm install @mobigent/backend
npx mobigent-backend init --app-id com.example.app
```

From the backend, generate the tiny config file your app imports:

```ts
const backend = await startMobigent({
  appToken: "dev-token",
  app: {
    id: "com.example.app",
    name: "Example App"
  }
});

console.log(backend.copyAppConfig());
```

## Install Packages

Until npmjs.com publishing is connected with an `NPM_TOKEN`, packages are published from tagged releases to GitHub Packages and attached to GitHub Releases.

Install directly from the public release tarball:

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.12/mobigent-react-native-0.1.12.tgz
```

Or install from npmjs after npm publishing is connected:

```bash
npm install @mobigent/react-native
npm install @mobigent/backend
```

Maintainer note: npmjs publishing is tracked in [docs/npm-publishing.md](./docs/npm-publishing.md). The release workflow supports either `NPM_TOKEN` or npm Trusted Publishing through GitHub Actions OIDC.

## Add It To An Existing React Native App

Install the app package, then let the SDK create the tiny Mobigent folder from the backend config:

```bash
npm install @mobigent/react-native
npx mobigent init --feature expense --out-dir src
```

Create one feature file:

```ts
import { defineFeature } from "@mobigent/react-native";

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

Put the backend-generated config in your app, then wrap the app once:

```tsx
import { setupMobigent } from "@mobigent/react-native";
import { mobigentConfig } from "./mobigent/config";
import { expenses } from "./mobigent/expenses";

const { Root } = setupMobigent({
  config: mobigentConfig,
  features: [expenses]
});

export default function App() {
  return (
    <Root>
      <YourExistingApp />
    </Root>
  );
}
```

Mobigent handles namespacing, schemas, validation, confirmation, connection lifecycle, backend communication, and event queueing.

If you are wiring a Node demo, test host, or another non-React runtime, use the same feature with the one-call connector:

```ts
import { startMobigent } from "@mobigent/backend";
import { connectMobigent } from "@mobigent/react-native";
import { expenses } from "./mobigent/expenses";

const backend = await startMobigent({
  app: {
    id: "com.example.app",
    name: "Example App"
  }
});

await connectMobigent({
  config: backend.defaultApp,
  features: [expenses]
});
```

## Add It To A Backend

Create the backend entrypoint and app config:

```bash
npm install @mobigent/backend
npx mobigent-backend init --app-id com.example.app
```

That creates `mobigent.app.json`. Put it in the app project and the app package auto-detects it:

```bash
npx mobigent init --feature expense --out-dir src
```

Or write it manually:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  app: {
    id: "com.example.app",
    name: "Example App"
  }
});

console.log(mobigent.urls.inspector);
console.log(mobigent.urls.openapi);

const appConfig = mobigent.defaultApp;
```

That one function starts the app connection endpoint, HTTP API, OpenAPI schema, inspector, tool routing, audit trail, and readiness checks.

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

Then inspect the tools:

```bash
curl http://localhost:8788/tools
curl http://localhost:8788/openapi.json
open http://localhost:8788/inspect
```

For the friendliest local loop, use the visible demo instead:

```bash
npm run demo:app
```

That single page includes the app UI, an agent request box, the tool call result, and a link to the inspector.

Use `mobigent.agent("chatgpt")` for ChatGPT Actions setup, `mobigent.agent("claude")` for Claude Desktop setup, or `mobigent.agent("openai")` for server-side OpenAI Responses setup.

The lower-level MCP command is still available for local agent clients:

```bash
npm run dev:mcp
```

## Packages

Most apps start with two packages:

- `@mobigent/react-native`: app SDK for declaring app functions with `defineFeature()` and `setupMobigent()`
- `@mobigent/backend`: backend SDK for `startMobigent({ app })`, tool routing, inspector, agent HTTP, and app connections

Useful extras:

- `create-mobigent-app`: one-command starter app with backend, inspector, visible app, and agent playground
- `packages/ios`: native Swift Package for iOS apps
- `packages/android`: native Kotlin/Android SDK

Advanced internals:

- `@mobigent/core`: protocol and shared types
- `@mobigent/gateway`: lower-level gateway package for custom hosting, HTTP/OpenAPI, and MCP
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

- Open `http://localhost:8788/inspect` to see apps, tools, metrics, audit events, and backend snapshot data.
- Run `npx mobigent-init --security-doctor ...` before exposing a hosted gateway.
- Use `fromZod()` or `fromTypeBox()` when you already have schemas.
- Run `npx mobigent-init --platform-actions json ...` to generate iOS App Intents and Android App Actions bridge plans.

## Why Mobigent Exists

Mobile apps were not designed for agents. Today, most agent workflows depend on fragile UI automation, screenshots, and guessing.

Mobigent gives apps a real agent interface:

1. Apps declare capabilities.
2. Agents discover those capabilities.
3. Calls are validated before they run.
4. Risky actions require user confirmation.
5. Every important event can be audited.

It is MCP-inspired, but built for mobile app control, app state, user approval, and native product workflows.

## Project Status

Mobigent is an early developer preview. The proof of concept already includes:

- React Native SDK APIs
- Native iOS SDK
- Native Android SDK
- Local gateway
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
