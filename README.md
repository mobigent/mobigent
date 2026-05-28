# Mobigent

<p align="center">
  <img src="assets/brand/mobigent-mark.svg" alt="Mobigent logo" width="96" height="96">
</p>

**Make mobile apps agent-ready.**

Mobigent is an open-source SDK that lets AI agents talk to mobile apps through safe, typed capabilities instead of brittle screen tapping.

Your app exposes what agents are allowed to do:

- **Actions**: create an expense, submit an order, update a profile
- **Resources**: read app state, fetch a list, inspect a record
- **Components**: focus a screen or important UI surface
- **Events**: report app activity back to the agent
- **Confirmations**: ask the user before sensitive actions run

The result: agents get a clean interface, users stay in control, and your app decides exactly what is possible.

## Quick Start

Create a Mobigent starter once npm publishing is connected:

```bash
npm create mobigent-app my-demo
cd my-demo
npm install
npm run dev
```

That opens a visible app beside an agent playground. Click **Run agent request** and Mobigent calls the app's `create_expense` tool through the gateway, asks for approval in the app host, and adds a new row to the app state.

The `create-mobigent-app` package is release-ready in this repo. Until npm auth is configured, use the repo demo below.

Working from this repo? Run the local demo:

```bash
npm install
npm run demo:app
```

That first run is the whole idea: agents do not tap screens or guess UI. Your app exposes safe tools, and Mobigent lets agents call them.

For a fresh React Native app, the fastest path is:

```bash
npm install @mobigent/react-native
npx mobigent-init \
  --app-id com.example.app \
  --app-name "Example App" \
  --feature expense \
  --out-dir src \
  --expo-router \
  --custom-confirmation
```

Run the full verification suite:

```bash
npm run verify
```

## Install Packages

Until npmjs.com publishing is connected with an `NPM_TOKEN`, packages are published from tagged releases to GitHub Packages and attached to GitHub Releases.

Install directly from the public release tarball:

```bash
npm install https://github.com/mobigent/mobigent/releases/download/v0.1.0/mobigent-react-native-0.1.0.tgz
```

Or install from GitHub Packages with a GitHub token that has package read access:

```bash
npm config set @mobigent:registry https://npm.pkg.github.com
npm install @mobigent/react-native
```

## Use It In React Native

Generate a starter integration:

```bash
npx mobigent-init \
  --app-id com.example.app \
  --app-name "Example App" \
  --feature expense \
  --out-dir src
```

Define what your app can safely expose:

```tsx
import { createAgentModule, createAgentPolicy, schema } from "@mobigent/react-native/app";

export const expenseModule = createAgentModule({
  namespace: "expense",
  actions: [
    {
      name: "create",
      description: "Create a new expense.",
      inputSchema: schema.object(
        {
          amount: schema.number(),
          merchant: schema.string()
        },
        { required: "all" }
      ),
      confirmation: {
        required: true,
        title: "Create expense?",
        risk: "medium"
      },
      policy: createAgentPolicy("user-required").policy,
      handler: async (input) => ({
        id: "EXP-1001",
        ...input
      })
    }
  ]
});
```

Mobigent handles registration, namespacing, validation, confirmation, connection lifecycle, and gateway communication.

## Connect An Agent

Start the HTTP gateway:

```bash
npm run dev:http
npm run dev:app
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
- `create-mobigent-app`: one-command starter app with gateway, inspector, visible app, and agent playground
- `packages/ios`: native Swift Package for iOS apps
- `packages/android`: native Kotlin/Android SDK
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
