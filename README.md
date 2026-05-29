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
feature("expense")
  .read("list", listExpenses)
  .write("create", createExpense, { input: { merchant: "string", amount: "number" } })
```

The backend developer should only think:

```ts
import { startMobigentBackend } from "@mobigent/backend";

await startMobigentBackend();
```

Everything else, WebSockets, manifests, OpenAPI, MCP, confirmations, retries, audit events, and inspector wiring, is SDK plumbing.

## Quick Start

Create a Mobigent starter from the public GitHub release:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.5/create-mobigent-app-0.1.5.tgz \
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
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.5/mobigent-react-native-0.1.5.tgz
```

For a backend/server app, install the backend package:

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.5/mobigent-backend-0.1.5.tgz
```

## Install Packages

Until npmjs.com publishing is connected with an `NPM_TOKEN`, packages are published from tagged releases to GitHub Packages and attached to GitHub Releases.

Install directly from the public release tarball:

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.5/mobigent-react-native-0.1.5.tgz
```

Or install from npmjs after npm publishing is connected:

```bash
npm install @mobigent/react-native
```

## Add It To An Existing React Native App

Create one feature file:

```ts
import { feature } from "@mobigent/react-native/simple";

export const expenses = feature("expense")
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
import { mobigentApp } from "@mobigent/react-native/app";
import { expenses } from "./mobigent/expenses";

const { Root } = mobigentApp({
  appId: "com.example.app",
  appName: "Example App",
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

Mobigent handles namespacing, schemas, validation, confirmation, connection lifecycle, gateway communication, and event queueing.

## Add It To A Backend

```ts
import { startMobigentBackend } from "@mobigent/backend";

const mobigent = await startMobigentBackend();

console.log(mobigent.urls.inspector);
console.log(mobigent.urls.openapi);
```

That one function starts the app connection endpoint, HTTP API, OpenAPI schema, inspector, tool routing, audit trail, and readiness checks.

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

Use the OpenAPI schema with ChatGPT Actions, or use the MCP server for MCP-compatible agents:

```bash
npm run dev:mcp
```

## Packages

- `@mobigent/core`: protocol and shared types
- `@mobigent/react-native`: React Native app-side SDK
- `create-mobigent-app`: one-command starter app with backend, inspector, visible app, and agent playground
- `packages/ios`: native Swift Package for iOS apps
- `packages/android`: native Kotlin/Android SDK
- `@mobigent/backend`: one-function backend for agent HTTP, OpenAPI, inspector, routing, and app connections
- `@mobigent/gateway`: local gateway, HTTP API, OpenAPI, and MCP bridge
- `@mobigent/providers`: provider setup helpers for agent runtimes

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
- Developer workflow: [docs/developer-workflow.md](./docs/developer-workflow.md)

## Developer Workflow Highlights

- Open `http://localhost:8788/inspect` to see apps, tools, metrics, audit events, and gateway snapshot data.
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
