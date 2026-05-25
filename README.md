# Mobigent

**The open-source capability layer for agentic mobile apps.**

Mobigent is the exciting, practical way to make mobile apps agent-ready. Instead of asking an AI agent to click around a phone screen, your app exposes safe, typed capabilities that agents can discover and call with confidence.

That means your app stays in control, your users stay protected, and agents finally get a clean path to do useful work.

- actions: things the app can do
- resources: things the app can read
- components: screens or UI surfaces the app can focus
- events: things the app can report
- confirmations: moments where the user must approve a sensitive action

The current implementation is a TypeScript developer preview for the core architecture:

- `packages/core`: shared protocol and manifest types.
- `packages/react-native`: app-side SDK API that a React Native app would use.
- `packages/gateway`: local gateway, terminal server, HTTP API, and OpenAPI schema.
- `packages/providers`: provider configuration helpers for MCP, Claude Desktop, Cursor, VS Code, OpenAPI, ChatGPT Actions, OpenAI Responses, Azure OpenAI, OpenAI-compatible chat providers, OpenRouter, LiteLLM, Ollama, LM Studio, Groq, Perplexity, xAI Grok, DeepSeek, Together AI, Fireworks AI, Qwen DashScope, NVIDIA NIM, Cloudflare AI Gateway, Mistral, Cohere, Anthropic Tool Use, Google Gemini, Google Vertex AI, AWS Bedrock Converse, Vercel AI SDK, LangChain, LlamaIndex, Mastra, Semantic Kernel, CrewAI, AutoGen, and Haystack.
- `apps/docs`: Vite landing page and docs site.
- MCP stdio transport for MCP-compatible agents.
- `examples/expense-app`: simulated React Native expense app.
- `examples/agent-server`: server-side provider examples for OpenAI, Anthropic, Gemini, AWS Bedrock Converse, Vercel AI SDK, and an offline mock agent.

## Quick Demo

```bash
npm install
npm run demo
```

CI runs the full project gate on pull requests:

```bash
npm run verify
```

The demo starts the gateway, connects the example app, discovers tools, calls `create_expense`, runs a confirmation hook, and reads back the expense list.

To see the agent-side adapters without API keys or a running gateway:

```bash
npm run demo -w @mobigent/example-agent-server
```

That demo maps one Mobigent tool into OpenAI, Anthropic, Gemini, AWS Bedrock Converse, and Vercel AI SDK shapes, then executes it through the SDK HTTP client.

To try the provider runtime starter against a live HTTP gateway:

```bash
MOBIGENT_PROVIDER=anthropic-tool-use \
MOBIGENT_MIN_APPS=1 \
MOBIGENT_MIN_TOOLS=1 \
MOBIGENT_HTTP_URL=http://localhost:8788 \
npm run runtime -w @mobigent/example-agent-server
```

## Interactive Mode

Terminal 1:

```bash
npm run dev:gateway
```

Terminal 2:

```bash
npm run dev:app
```

Then in the gateway terminal:

```bash
tools
call com_mobigent_expenses.create_expense {"amount":28.5,"merchant":"Uber","category":"Travel"}
call com_mobigent_expenses.get_expenses {}
```

## HTTP / ChatGPT Action Testing

Terminal 1:

```bash
npm run dev:http
```

Terminal 2:

```bash
npm run dev:app
```

Then test locally:

```bash
curl http://localhost:8788/tools
curl http://localhost:8788/ready?minTools=1
curl http://localhost:8788/apps
curl http://localhost:8788/providers
curl -X POST http://localhost:8788/tools/com_mobigent_expenses.create_expense/call \
  -H "content-type: application/json" \
  -d '{"amount":42.25,"merchant":"Airport Taxi","category":"Travel"}'
```

The OpenAPI schema is available at:

```text
http://localhost:8788/openapi.json
```

`GET /health` includes gateway counts, `GET /ready?minTools=1` returns 200 only when enough mobile app capability is connected, `GET /config` shows the gateway protocol and integration contract, and `GET /apps` shows connected app sessions, SDK versions, negotiated protocol versions, liveness fields (`lastSeenAt`, `ageMs`, `idleMs`), capability counts, and manifest signature status.

To test from ChatGPT, expose port `8788` with an HTTPS tunnel such as ngrok or Cloudflare Tunnel, then add the public `/openapi.json` schema as a Custom GPT Action. Start the app before importing the schema so it includes one concrete OpenAPI operation per connected tool, including declared input and output schemas.

## MCP Testing

```bash
npm run dev:mcp
npm run dev:app
```

See [docs/mcp.md](./docs/mcp.md) for MCP client configuration.

## React Native SDK Example

Use the Expo-first React API for normal app integration. Define one agent module per product area with `createAgentModule({ namespace })`, and the SDK handles namespacing, registration, safety preflight, and lifecycle cleanup:

```bash
npx mobigent-init --app-id com.example.app --app-name "Example App" --feature expense --out-dir src
npx mobigent-init --app-id com.example.app --app-name "Example App" --feature expense --out-dir src --expo-router
npx mobigent-expo-init --app-id com.example.app --app-name "Example App" --feature expense --out-dir src
npx mobigent-rn-init --app-id com.example.app --app-name "Example App" --feature expense --out-dir src
npx mobigent-rn-init --app-id com.example.app --app-name "Example App" --feature expense --out-dir src --expo
npx mobigent-rn-init --app-id com.example.app --app-name "Example App" --feature expense --out-dir src --custom-confirmation
npx mobigent-rn-init --feature invoice --out-dir src --feature-only
npx mobigent-rn-init --doctor --app-id com.example.app --app-name "Example App" --feature expense --out-dir src --app-root .
npx mobigent-rn-init --manifest --app-id com.example.app --app-name "Example App" --feature expense --out-dir src
npx mobigent-rn-init --write-manifest ./mobigent-integration.json --app-id com.example.app --app-name "Example App" --feature expense --out-dir src
npx mobigent-rn-init --validate-manifest ./mobigent-integration.json
npx mobigent-rn-init --contract --app-id com.example.app --app-name "Example App" --feature expense
npx mobigent-rn-init --write-contract ./mobigent-contract.json --app-id com.example.app --app-name "Example App" --feature expense
npx mobigent-rn-init --validate-contract ./mobigent-contract.json
npx mobigent-rn-init --env-template --gateway-url ws://localhost:8787
npx mobigent-rn-init --write-env ./.env.mobigent --gateway-url ws://localhost:8787
```

`mobigent-init` is the Expo-first default command; it writes a root that uses `createAgentExpoApp()` and `Constants.expoConfig`. Add `--expo-router` to also generate `app/_layout.tsx` with Expo Router's `<Stack />` wrapped by `MobigentRoot`. `mobigent-expo-init` and `mobigent-rn-init --expo` produce the same root when you want explicit or older command names. `--custom-confirmation` generates an editable confirmation component and wires it into the app shell. The scaffold passes the first feature with `modules: [featureModule]`, so simple apps can add later `--feature-only` modules to that array or mount route-owned features with `<AgentModules />`. The non-Expo scaffold uses `createAgentEnvironmentFromEnv()` so local, device, hosted, and disabled modes can be controlled with env vars instead of editing the app shell. Use `--env-template` or `--write-env` to create the matching `EXPO_PUBLIC_MOBIGENT_*` template. Use `createAgentCapabilities()` when you need plugin-style loading or feature flags that install modules during bootstrap. `--write-manifest` creates an integration metadata file with generated file paths, gateway URL, feature namespace, and expected capability names. `--validate-manifest` checks that saved metadata file. `--write-contract` creates the protocol contract that CI or provider setup can validate.

The doctor checks the generated wrapper and feature files, and with `--app-root` it also verifies the app package includes `@mobigent/react-native` plus a React Native runtime dependency.

The docs [Integration Artifacts](apps/docs/docs/integration-artifacts.md) guide explains how to commit `mobigent-integration.json`, `mobigent-contract.json`, and `mobigent-providers.json`, plus the CI checks that keep them honest.

The generated `MobigentRoot` accepts runtime overrides such as `enabled={false}`, `gatewayUrl`, `gateway`, `authToken`, and confirmation modal options, so production apps can keep one standard wrapper while changing environment-specific behavior at the app shell.

```tsx
import {
  AgentAction,
  AgentComponent,
  AgentModules,
  AgentResource,
  AgentSurface,
  MobigentModuleMount,
  applyAgentPolicy,
  composeAgentCapabilities,
  createAgentCapabilities,
  createAgentEnvironment,
  createAgentEnvironmentFromEnv,
  createAgentFeature,
  createAgentModule,
  createAgentPolicy,
  diagnoseMobigentCapabilities,
  defineAgentAction,
  defineAgentCapabilities,
  defineAgentResource,
  formatMobigentCapabilityDiagnostics,
  formatMobigentDiagnostics,
  schema,
  useAgent,
  useAgentAction,
  useAgentEvent,
  useAgentModule,
  useAgentResource,
  useAgentScreen,
  useMobigentConfirmation,
  useMobigentConnection,
  useMobigentDiagnostics,
  useMobigentStatus,
  useMobigentEvent,
  useMobigentModule,
  useMobigentModuleDefinition,
  useMobigentModules,
  useMobigentSurface,
  createAgentApp,
  createAgentExpoApp,
  MobigentDiagnosticsPanel,
  MobigentStatusBadge
} from "@mobigent/react-native/app";

const expenseModule = createAgentModule({
  namespace: "expense",
  actions: [
    {
      name: "create",
      description: "Create a new expense report.",
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
      handler: async (input) => ({ id: "EXP-1002", ...input })
    }
  ],
  resources: [
    {
      name: "list",
      description: "Current expenses.",
      outputSchema: schema.object(
        {
          expenses: schema.array(schema.object())
        },
        { required: ["expenses"] }
      ),
      read: async () => ({ expenses: [] })
    }
  ]
});

const profileCapabilities = defineAgentCapabilities({
  resources: [
    defineAgentResource({
      name: "profile",
      description: "Current user profile.",
      read: async () => ({ name: "Ada" })
    })
  ]
});

const { Root: MobigentRoot } = createAgentApp({
  app: {
    id: "com.example.expenses",
    name: "Example Expenses",
    version: "1.0.0"
  },
  reconnect: true,
  heartbeat: true,
  preflight: true,
  modules: [expenseModule],
  capabilities: profileCapabilities
});

function ExpenseEvents() {
  const emit = useMobigentEvent();

  return <ExpenseButton onCreated={(id) => emit("expense.created", { id })} />;
}

function AgentConnectionBadge() {
  const status = useMobigentStatus();

  return <MobigentStatusBadge status={status} />;
}

export function App() {
  return (
    <MobigentRoot capabilityDeps={[currentWorkspaceId]}>
      <AgentConnectionBadge />
      <ExpenseEvents />
      <YourApp />
    </MobigentRoot>
  );
}
```

For non-React modules or custom bootstraps, the imperative API is still available:

Use `createAgentApp()` for the cleanest React Native setup: configure app identity with `app: { id, name, version }`, connection behavior, feature modules, and inline capabilities once, then render the returned `Root` around your app. `createMobigentApp()` and `MobigentApp` are still available for explicit SDK-style code. Both paths wrap `MobigentProvider`, derive the local gateway URL from the current React Native platform, mount one module, one capability kit, or arrays of either, and include the default confirmation modal. Set `preflight: true` to fail fast on invalid capability names, manifest shape errors, or obvious safety-policy gaps; pass `{ throwOnFailure: false, onReport }` when you want telemetry instead. Pass `capabilityDeps` when handlers close over changing values such as workspace ID, auth scope, tenant, or navigation state and should refresh the exposed agent surface.
For Expo apps, use `createAgentExpoApp()` with `Constants.expoConfig`. It derives app identity from Expo metadata, reads the Mobigent Expo config plugin plus `EXPO_PUBLIC_MOBIGENT_*` overrides, and defaults to reconnects, heartbeat, and preflight checks:

```tsx
import Constants from "expo-constants";
import { createAgentExpoApp } from "@mobigent/react-native/app";

const { Root } = createAgentExpoApp({
  expo: Constants.expoConfig,
  modules: [expenseModule]
});
```

Expo config can own the default gateway:

```json
{
  "expo": {
    "plugins": [
      ["@mobigent/react-native/expo", { "mode": "hosted", "host": "gateway.example.com" }]
    ]
  }
}
```

Use declarative `<AgentAction />`, `<AgentResource />`, and `<AgentComponent />` when a screen owns the capability lifecycle and you want the exposed agent surface to follow normal React mounting. The explicit `Mobigent*` component names remain available as SDK aliases:

For hook-first screens, use `useAgentScreen()` when a route exposes agent capabilities that depend on route params, auth scope, or local state. It creates a namespaced module, registers it while the screen is mounted, refreshes when `deps` change, and returns helpers for local UI:

```tsx
function ExpenseQuickActions({ expenseId }) {
  const agent = useAgentScreen({
    namespace: "expense",
    resources: [
      {
        name: "current",
        description: "The expense currently open on screen.",
        read: async () => loadExpense(expenseId)
      }
    ],
    actions: [
      {
        name: "approve",
        description: "Approve the open expense.",
        confirmation: { required: true, risk: "medium" },
        handler: async (input) => approveExpense(expenseId, input)
      }
    ],
    deps: [expenseId]
  });

  return <ExpenseButton disabled={!agent.connected} onCreated={(id) => agent.emit("expense.created", { id })} />;
}
```

Use `useAgent()` for a tiny already-qualified bundle, `useAgentAction()`, `useAgentResource()`, and `useAgentComponent()` for one-off inline capabilities, and `<AgentSurface />` when you prefer declarative JSX around a whole screen.

```tsx
function ExpenseScreen({ expenseId }) {
  return (
    <>
      <AgentAction
        name="expense_approve"
        description="Approve the open expense."
        inputSchema={schema.object({ note: schema.string({ optional: true }) })}
        confirmation={{ required: true, title: "Approve expense?", risk: "medium" }}
        deps={[expenseId]}
        handler={async (input) => approveExpense(expenseId, input.note)}
      />
      <AgentResource
        name="expense_current"
        description="The expense currently open on screen."
        deps={[expenseId]}
        read={async () => loadExpense(expenseId)}
      />
      <YourExpenseUi />
    </>
  );
}
```

Use `createAgentPolicy()` to avoid hand-rolling common safety policy shapes:

```tsx
const approvePolicy = createAgentPolicy("confirmed", {
  title: "Approve expense?",
  allowedAgents: ["finance-agent"],
  rateLimitPerMinute: 5
});

defineAgentAction({
  name: "expense_approve",
  description: "Approve an expense.",
  inputSchema: schema.object({ id: schema.string() }, { required: "all" }),
  ...approvePolicy,
  handler: approveExpense
});
```

Presets include `read-only`, `foreground`, `user-required`, `confirmed`, and `destructive`. You can pass `policy` or `confirmation` overrides when a capability needs stricter agent allowlists, rate limits, sensitive-data labels, or custom approval copy.

Use `applyAgentPolicy()` to put shared defaults on a whole feature or module. Individual capabilities still win when they define their own `policy` or action `confirmation`.

```tsx
const guardedExpenseCapabilities = applyAgentPolicy(
  expenseCapabilities,
  createAgentPolicy("confirmed", {
    title: "Approve expense action?",
    allowedAgents: ["finance-agent"]
  })
);
```

Pass `ConfirmationComponent` to keep the standard app shell while rendering approvals with your own design system. The component can call `useMobigentConfirmation()` to read the pending request and approve or reject it, while `confirmationModal={{ approveLabel, rejectLabel }}` still passes label props through.
Pass `enabled={false}` to `createMobigentApp()`, `MobigentApp`, or `MobigentProvider` to turn the bridge off for local builds, E2E runs, staged rollouts, or unsupported regions without removing capability definitions. When disabled, the SDK does not connect, register capabilities, show confirmations, or emit queued events.
Use `createAgentEnvironment()` when the app shell switches between local simulator, physical device, hosted gateway, and disabled environments:

```tsx
const bridgeEnvironment = createAgentEnvironment(
  releaseChannel === "production"
    ? { mode: "hosted", host: "gateway.example.com", authToken: agentBridgeToken }
    : isPhysicalDevice
      ? { mode: "device", deviceHost: "192.168.1.20" }
      : { mode: "local" }
);

const { Root } = createMobigentApp({
  app: { id: "com.example.expenses", name: "Example Expenses" },
  ...bridgeEnvironment
});
```

Expo and React Native environment variables can drive the same app shell without custom branching:

```tsx
const bridgeEnvironment = createAgentEnvironmentFromEnv({
  fallback: { mode: "local" }
});

const { Root } = createMobigentApp({
  app: { id: "com.example.expenses", name: "Example Expenses" },
  modules: [expenseModule],
  ...bridgeEnvironment
});
```

The helper reads `MOBIGENT_*`, `EXPO_PUBLIC_MOBIGENT_*`, and `REACT_NATIVE_MOBIGENT_*` variables for `MODE`, `GATEWAY_URL`, `HOST`, `PORT`, `DEVICE_HOST`, `PLATFORM`, `SECURE`, `AUTH_TOKEN`, and `ENABLED`.

Pass `gateway={{ deviceHost: "192.168.1.20" }}` for a physical device or `gateway={{ host: "gateway.example.com", secure: true, port: 443 }}` for a hosted gateway when you want direct control. You can still use `createMobigentGatewayUrlForPlatform()` or `createMobigentGatewayUrl()` directly for custom bootstraps.
Use `createAgentFeature("expense")` when a feature module owns a grouped agent surface and you want local names automatically prefixed, such as `create` becoming `expense_create`. The returned factory has `action()`, `resource()`, `component()`, and `capabilities()` helpers for clean feature-folder exports. Use `defineAgentFeature()` for object-style definitions, or `defineAgentCapabilities()` when names are already fully qualified.
Use `createAgentCapabilities()` for a standard app-level registry that feature modules can install into during bootstrap, then pass the registry directly to `createAgentApp({ capabilities })`. For static modules, pass `modules: [expenseModule]` directly to the app shell. The registry exposes `add()`, idempotent `install()`, `remove()`, `clear()`, `getCapabilities()`, `getModules()`, and `subscribe()` for staged rollouts, plugin-like feature loading, CI inventory, and tests. Mounted registries refresh automatically when their sources change.
Use `useAgentScreen()` when a screen builds definitions from route params, auth scope, or local state. Use `<AgentSurface modules={expenseModule}>...</AgentSurface>` when you prefer a declarative wrapper around the UI, and use `<AgentModules modules={expenseModule} />` or `useAgentModule(expenseModule)` when you only need a null registration mount. Use `useMobigentModule()` or `<MobigentModuleMount />` when a feature flag or plugin loader should install a module into a shared registry and remove it on unmount.
Pass arrays to `modules` or `capabilities` for the shortest app-shell setup, or use `composeAgentCapabilities()` when you want an explicit combined kit.
Capability names must be unique across actions, resources, and components. `createAgentCapabilities()` and `composeAgentCapabilities()` validate duplicates before mounting so feature modules fail fast during app startup.
Use `diagnoseMobigentCapabilities()` as a feature-level preflight in app startup, tests, or CI. It checks duplicate names, runtime-safe naming, manifest shape, and obvious safety-policy gaps; `formatMobigentCapabilityDiagnostics()` prints a support-friendly report.
Use `useMobigentConnection()`, `useMobigentConnectionState()`, or `useMobigentConnected()` for connection-aware UI without pulling in the full bridge context.
Use `MobigentStatusBadge` for a default operator-visible badge, or drop `MobigentDiagnosticsPanel` into a settings/support screen for status, capability counts, issue text, and connect/disconnect controls. Use `useMobigentStatus()` for custom settings rows; the status object returns a stable `level`, label, connection state, capability count, issue counts, and queued event count. Use `useMobigentDiagnostics()` and `formatMobigentDiagnostics()` for development screens and support logs. The report includes the resolved gateway URL, connection state, capability counts, queued events, reconnect/heartbeat settings, and actionable issue codes such as `not_configured`, `no_capabilities`, `not_connected`, `queued_events`, and `last_error`.
Use `schema.object()`, `schema.string()`, `schema.number()`, `schema.integer()`, `schema.boolean()`, `schema.array()`, `schema.enum()`, `schema.literal()`, `schema.null()`, and `schema.nullable()` to keep common capability schemas compact while still producing plain JSON Schema.

```ts
import { intentBridge } from "@mobigent/react-native";

intentBridge.configure({
  appId: "com.example.expenses",
  appName: "Example Expenses",
  gatewayUrl: "ws://localhost:8787",
  confirm: async ({ action, input }) => {
    return true;
  }
});

intentBridge.registerAction({
  name: "create_expense",
  description: "Create a new expense report.",
  inputSchema: {
    type: "object",
    properties: {
      amount: { type: "number" },
      merchant: { type: "string" }
    },
    required: ["amount", "merchant"]
  },
  outputSchema: {
    type: "object",
    properties: {
      id: { type: "string" },
      amount: { type: "number" },
      merchant: { type: "string" }
    },
    required: ["id", "amount", "merchant"]
  },
  confirmation: {
    required: true,
    title: "Create expense?",
    risk: "medium"
  },
  policy: {
    foregroundOnly: true,
    requiresUser: true
  },
  handler: async (input) => {
    return { id: "EXP-1002", ...input };
  }
});
```

Action inputs are validated before handlers run. If `outputSchema` is present, action results are validated before they are returned to agents.

Resources can also declare `outputSchema`; the SDK validates resource reads before sending data back to agents.

```ts
intentBridge.registerResource({
  name: "expenses",
  description: "Current expenses.",
  outputSchema: {
    type: "object",
    properties: {
      expenses: { type: "array", items: { type: "object" } }
    },
    required: ["expenses"]
  },
  read: async () => ({ expenses: [] })
});
```

React Native provides a global `WebSocket`, so normal app integrations do not need to configure transport. Node-based tests and examples can inject a socket factory with `createSocket`.

Capabilities can be cleaned up with `unregisterAction(name)`, `unregisterResource(name)`, and `unregisterComponent(name)`. Successful unregisters publish a fresh manifest to connected agents.

## Production Audit Logging

The gateway keeps recent audit events in memory and can also write durable JSONL logs:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  auditLogPath: "./mobigent-audit.jsonl"
});
```

For the HTTP gateway binary:

```bash
MOBIGENT_AUDIT_LOG_PATH=./mobigent-audit.jsonl npm run dev:http
```

Audit events are recursively redacted before storage. Add app-specific keys with:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  auditRedactKeys: ["email", "ssn", "cardNumber"]
});
```

Or:

```bash
MOBIGENT_AUDIT_REDACT_KEYS=email,ssn,cardNumber npm run dev:http
```

Long-running gateways prune retained operational state. Successful idempotency records default to a five-minute replay window, and stale rate-limit buckets are removed after their policy window:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  idempotencyRecordTtlMs: 5 * 60_000,
  cleanupIntervalMs: 60_000
});
```

For the HTTP gateway:

```bash
MOBIGENT_IDEMPOTENCY_RECORD_TTL_MS=300000 \
MOBIGENT_CLEANUP_INTERVAL_MS=60000 \
npm run dev:http
```

## Signed Manifests

Production gateways can require HMAC-SHA256 signatures before accepting app capability manifests:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  manifestSigningSecret: process.env.MOBIGENT_MANIFEST_SIGNING_SECRET
});
```

The gateway also validates manifest shape before registration. Malformed manifests are rejected as `manifest.rejected` with `reason: "invalid_manifest"` and validation errors in audit details, including duplicate tool names inside a single manifest.

## App ID Allowlist

Gateways can restrict which mobile app ids are allowed to connect:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  allowedAppIds: ["com.example.expenses"]
});
```

For the HTTP gateway:

```bash
MOBIGENT_ALLOWED_APP_IDS=com.example.expenses,com.example.crm npm run dev:http
```

React Native apps provide a signer callback:

```ts
const { Root } = createMobigentApp({
  app: { id: "com.example.expenses", name: "Example Expenses" },
  gateway: { host: "gateway.example.com", secure: true, port: 443 },
  signManifest: async (manifest) => ({
    alg: "hmac-sha256",
    keyId: "mobile-prod",
    signature: await signManifestWithYourCrypto(manifest)
  })
});
```

## Confirmation UI

Use `createConfirmationController()` when you want your app to render its own confirmation modal:

```ts
import { createConfirmationController, intentBridge } from "@mobigent/react-native";

const confirmationController = createConfirmationController();

intentBridge.configure({
  appId: "com.example.expenses",
  appName: "Example Expenses",
  gatewayUrl: "ws://localhost:8787",
  confirmationController
});

confirmationController.subscribe((request) => {
  if (!request) return;

  // Render your native modal here. Then call:
  // confirmationController.approve()
  // or
  // confirmationController.reject()
});
```

For React Native apps, use the provider and optional default modal:

```tsx
import { MobigentProvider } from "@mobigent/react-native";
import { MobigentConfirmationModal } from "@mobigent/react-native/ui";

export function App() {
  return (
    <MobigentProvider
      appId="com.example.expenses"
      appName="Example Expenses"
      gateway={{ platform: "ios" }}
      reconnect
      heartbeat
    >
      <YourApp />
      <MobigentConfirmationModal />
    </MobigentProvider>
  );
}
```

See [docs/react-native.md](./docs/react-native.md) for the full integration guide.

## Provider Adapters

Use `@mobigent/providers` to generate copy-pasteable setup for different agent clients:

```ts
import {
  createClaudeDesktopProvider,
  createVsCodeProvider,
  createChatGptActionsProvider,
  createDeepSeekProvider,
  createOpenAiResponsesProvider,
  createOpenRouterProvider,
  createLiteLlmProvider,
  createOllamaProvider,
  createLmStudioProvider,
  createGroqProvider,
  createPerplexityProvider,
  createXaiGrokProvider,
  createTogetherAiProvider,
  createFireworksAiProvider,
  createQwenDashScopeProvider,
  createNvidiaNimProvider,
  createCloudflareAiGatewayProvider,
  createMistralProvider,
  createCohereProvider,
  createAnthropicToolUseProvider,
  createGoogleGeminiProvider,
  createGoogleVertexAiProvider,
  createAwsBedrockConverseProvider,
  createVercelAiSdkProvider,
  createLangChainProvider
} from "@mobigent/providers";

createClaudeDesktopProvider({ command: "mobigent-mcp" });
createVsCodeProvider({ command: "mobigent-mcp" });
createChatGptActionsProvider({ baseUrl: "https://example.ngrok.app" });
createOpenAiResponsesProvider({ baseUrl: "http://localhost:8788" });
createOpenRouterProvider({ baseUrl: "http://localhost:8788" });
createLiteLlmProvider({ baseUrl: "http://localhost:8788" });
createOllamaProvider({ baseUrl: "http://localhost:8788" });
createLmStudioProvider({ baseUrl: "http://localhost:8788" });
createGroqProvider({ baseUrl: "http://localhost:8788" });
createPerplexityProvider({ baseUrl: "http://localhost:8788" });
createXaiGrokProvider({ baseUrl: "http://localhost:8788" });
createDeepSeekProvider({ baseUrl: "http://localhost:8788" });
createTogetherAiProvider({ baseUrl: "http://localhost:8788" });
createFireworksAiProvider({ baseUrl: "http://localhost:8788" });
createQwenDashScopeProvider({ baseUrl: "http://localhost:8788" });
createNvidiaNimProvider({ baseUrl: "http://localhost:8788" });
createCloudflareAiGatewayProvider({ baseUrl: "http://localhost:8788" });
createMistralProvider({ baseUrl: "http://localhost:8788" });
createCohereProvider({ baseUrl: "http://localhost:8788" });
createAnthropicToolUseProvider({ baseUrl: "http://localhost:8788" });
createGoogleGeminiProvider({ baseUrl: "http://localhost:8788" });
createGoogleVertexAiProvider({ baseUrl: "http://localhost:8788" });
createAwsBedrockConverseProvider({ baseUrl: "http://localhost:8788" });
createVercelAiSdkProvider({ baseUrl: "http://localhost:8788" });
createLangChainProvider({ baseUrl: "http://localhost:8788" });
createSemanticKernelProvider({ baseUrl: "http://localhost:8788" });
```

MCP-based providers work best for local agents with dynamic tool discovery. OpenAPI providers work best for hosted agent platforms that import a public schema. HTTP tool providers work best when you control the server-side agent loop and can map `GET /tools`, `GET /tools/{toolName}`, and `POST /tools/{toolName}/call` into the target framework's native tool format.

You can also generate provider config from the CLI:

```bash
npx mobigent-provider --matrix --base-url http://localhost:8788
npx mobigent-provider --compatibility --base-url http://localhost:8788
npx mobigent-provider --write-matrix ./mobigent-providers.json --base-url http://localhost:8788
npx mobigent-provider --write-compatibility ./mobigent-provider-compatibility.json --base-url http://localhost:8788
npx mobigent-provider --setup-plan runtime-agent --base-url http://localhost:8788 --query openrouter --limit 1
npx mobigent-provider --write-setup-plan ./mobigent-provider-setup.json --base-url http://localhost:8788 --query anthropic
npx mobigent-provider --validate-setup-plan ./mobigent-provider-setup.json
npx mobigent-provider --recommend-presets
npx mobigent-provider --recommend local-agent
npx mobigent-provider --recommend hosted-actions --base-url https://example.ngrok.app
npx mobigent-provider --recommend runtime-agent --base-url http://localhost:8788 --query openrouter --limit 1
npx mobigent-provider --provider claude-desktop --command mobigent-mcp
npx mobigent-provider --provider chatgpt-actions --base-url https://example.ngrok.app
npx mobigent-provider --provider openai-responses --base-url http://localhost:8788
npx mobigent-provider --provider openrouter --base-url http://localhost:8788 --validate
npx mobigent-provider --provider azure-openai --base-url http://localhost:8788
npx mobigent-provider --provider openai-compatible --base-url http://localhost:8788
npx mobigent-provider --provider openrouter --base-url http://localhost:8788
npx mobigent-provider --provider litellm --base-url http://localhost:8788
npx mobigent-provider --provider ollama --base-url http://localhost:8788
npx mobigent-provider --provider lm-studio --base-url http://localhost:8788
npx mobigent-provider --provider groq --base-url http://localhost:8788
npx mobigent-provider --provider perplexity --base-url http://localhost:8788
npx mobigent-provider --provider xai-grok --base-url http://localhost:8788
npx mobigent-provider --provider deepseek --base-url http://localhost:8788
npx mobigent-provider --provider together-ai --base-url http://localhost:8788
npx mobigent-provider --provider fireworks-ai --base-url http://localhost:8788
npx mobigent-provider --provider qwen-dashscope --base-url http://localhost:8788
npx mobigent-provider --provider nvidia-nim --base-url http://localhost:8788
npx mobigent-provider --provider cloudflare-ai-gateway --base-url http://localhost:8788
npx mobigent-provider --provider mistral --base-url http://localhost:8788
npx mobigent-provider --provider cohere --base-url http://localhost:8788
npx mobigent-provider --provider anthropic-tool-use --base-url http://localhost:8788
npx mobigent-provider --provider google-gemini --base-url http://localhost:8788
npx mobigent-provider --provider aws-bedrock-converse --base-url http://localhost:8788
npx mobigent-provider --provider vercel-ai-sdk --base-url http://localhost:8788
npx mobigent-provider --provider anthropic-tool-use --base-url http://localhost:8788 --format runtime-env
npx mobigent-provider --runtime-config --provider openrouter --base-url https://gateway.example.com --auth bearer --env MOBIGENT_HTTP_API_KEY=secret --format guide
npx mobigent-provider --provider semantic-kernel --base-url http://localhost:8788
npx mobigent-provider --provider crewai --base-url http://localhost:8788
npx mobigent-provider --provider autogen --base-url http://localhost:8788
npx mobigent-provider --provider haystack --base-url http://localhost:8788
```

Use `--matrix` to compare all built-in providers by category, best-for labels, setup complexity, transport, runtime support, dynamic tool support, public URL requirement, production notes, and generated setup command. Use `--write-matrix` to commit the same comparison as a JSON artifact for CI, release review, or setup dashboards. Use `--compatibility` or `--write-compatibility` to validate every generated provider setup at once and produce pass/warn/fail counts for CI gates. Use `--setup-plan` or `--write-setup-plan` when you want one recommended provider plus validation, endpoints, setup bundle, and runtime env in a single artifact. Use `--recommend-presets` to expose the supported setup shapes, then use `--recommend local-agent`, `--recommend hosted-actions`, or `--recommend runtime-agent` when you want scored defaults with preset metadata, reasons, and setup commands instead of reading the whole matrix. Use `--validate` to check generated setup before pasting it into a provider; hosted action configs fail when they still point at localhost, and HTTP runtime configs report missing tool endpoints or agent identity warnings.

Provider ids can also be used in runtime policy:

```ts
intentBridge.registerAction({
  name: "delete_expense",
  description: "Delete an expense.",
  inputSchema: { type: "object", properties: {} },
  policy: {
    allowedAgents: ["claude-desktop", "cursor", "chatgpt-actions", "openai-responses"],
    rateLimitPerMinute: 5,
    requiresUser: true
  },
  handler: async () => ({ deleted: true })
});
```

For server-side agent loops, the provider package also includes a tiny HTTP adapter:

```ts
import {
  createMobigentHttpClient,
  diagnoseMobigentProvider,
  formatMobigentProviderDiagnostics,
  createProviderRuntimeEnv,
  createProviderSafeToolNameMap,
  createOpenRouterProvider,
  stringifyProviderRuntimeEnv,
  toOpenAiTools,
  toChatFunctionTools,
  toAnthropicTools,
  toGeminiFunctionDeclarations,
  toBedrockToolConfigTools,
  toVercelAiSdkTools,
  toLangChainTools,
  toLlamaIndexTools,
  toMastraTools,
  toSemanticKernelPlugin,
  toCrewAiTools,
  toAutoGenTools,
  toHaystackTools,
  createMobigentProviderRuntime,
  createMobigentProviderRuntimeFromEnv,
  createMobigentProviderRuntimeReport,
  diagnoseMobigentProviderRuntimeConfig,
  formatMobigentProviderRuntimeConfigReport,
  formatMobigentProviderRuntimeReport,
  formatMobigentToolCallResult,
  formatMobigentToolCallResults,
  watchMobigentProviderRuntime,
  createMobigentToolExecutor
} from "@mobigent/providers";

const client = createMobigentHttpClient({
  baseUrl: "http://localhost:8788",
  agentId: "openai-responses"
});

const health = await client.getHealth();
const readiness = await client.getReadiness({ minApps: 1, minTools: 1 });
await client.waitForReadiness({ minApps: 1, minTools: 1, timeoutMs: 30000 });
const config = await client.getConfig();
const metrics = await client.getMetrics();
const auditEvents = await client.listAuditEvents({ limit: 50 });
const liveAudit = client.watchAuditEvents({ replay: 10 });
const apps = await client.listApps();
const visibility = await client.listAgentVisibility({ agentId: ["openrouter", "chatgpt-actions"] });
const tools = await client.waitForTools({ timeoutMs: 30000, intervalMs: 500 });
const diagnostics = await client.diagnose({ minApps: 1, minTools: 1, expectedProvider: "openrouter" });
console.log(formatMobigentProviderDiagnostics(diagnostics));
const safeNames = createProviderSafeToolNameMap(tools);
const providers = await client.listProviders();
const openAiTools = toOpenAiTools(tools);
const chatFunctionTools = toChatFunctionTools(tools);
const anthropicTools = toAnthropicTools(tools);
const geminiFunctionDeclarations = toGeminiFunctionDeclarations(tools);
const bedrockTools = toBedrockToolConfigTools(tools);
const vercelTools = toVercelAiSdkTools(tools, client);
const langChainTools = toLangChainTools(tools, client);
const llamaIndexTools = toLlamaIndexTools(tools, client);
const mastraTools = toMastraTools(tools, client);
const semanticKernelPlugin = toSemanticKernelPlugin(tools, client);
const crewAiTools = toCrewAiTools(tools, client);
const autoGenTools = toAutoGenTools(tools, client);
const haystackTools = toHaystackTools(tools, client);
const executeTool = createMobigentToolExecutor(client);
const openRouterProvider = createOpenRouterProvider({ baseUrl: "http://localhost:8788" });
const runtimeEnv = createProviderRuntimeEnv(openRouterProvider, { watchTools: true });
const runtimeEnvFile = stringifyProviderRuntimeEnv(openRouterProvider);

const anthropicRuntime = await createMobigentProviderRuntime({
  kind: "anthropic-tool-use",
  client,
  waitForTools: { timeoutMs: 30000, intervalMs: 500 }
});

const openRouterRuntime = await createMobigentProviderRuntime({
  kind: "openrouter",
  client,
  toolNames: { mode: "provider-safe" }
});
console.log(formatMobigentProviderRuntimeReport(createMobigentProviderRuntimeReport(openRouterRuntime)));
const toolResults = await openRouterRuntime.executeToolCalls(modelMessage.tool_calls ?? []);
const providerMessages = openRouterRuntime.formatToolCallResults(toolResults);
const anthropicToolResult = formatMobigentToolCallResult(toolResults[0], "anthropic-tool-use");

const bootstrap = await createMobigentProviderRuntimeFromEnv({
  requestId: () => crypto.randomUUID()
});

for await (const runtime of watchMobigentProviderRuntime({
  kind: "anthropic-tool-use",
  client,
  stream: { signal: controller.signal }
})) {
  console.log(runtime.reason, runtime.rawTools.length);
}
```

`getConfig()` reads `GET /config`, a public metadata endpoint with auth requirements, endpoint paths, feature flags, request limits, and standard Mobigent headers for provider adapters.
`getReadiness()` reads `GET /ready` and returns structured readiness checks. `waitForReadiness()` polls that endpoint with timeout and abort support for deployment probes or agent startup flows that need at least one accepted app manifest or visible tool before registering model tools.
`formatMobigentToolCallResult()` and runtime `formatToolCallResults()` convert mobile tool execution results into provider response envelopes for OpenAI Responses, OpenAI-compatible chat providers, Anthropic Tool Use, Gemini function calling, Bedrock Converse, or generic agent loops.
`diagnose()` and `diagnoseMobigentProvider()` run a provider-side doctor report across config, health, readiness, app sessions, visible tools, provider catalog, and audit access, returning `pass`, `warn`, or `fail` checks. Use `formatMobigentProviderDiagnostics()` for startup logs and support bundles.
`listAgentVisibility()` reads `GET /agents` and reports visible and hidden tool names for one or more agent ids after app policies and gateway profiles are applied. It is the quickest way to debug a provider that connects correctly but cannot see a capability.

HTTP/OpenAPI callers can send `x-mobigent-agent`, and direct gateway callers can pass `{ agentId }` to `callTool`. Discovery is policy-aware too: if a capability declares `allowedAgents`, `GET /tools`, `GET /tools/{toolName}`, `GET /tools/stream`, and the provider SDK only expose it when the agent id is allowlisted.
Use `waitForTools()` during agent startup when the mobile app may connect a moment after the server starts. `createMobigentProviderRuntime()` wraps that startup step and returns provider-native tool definitions plus the `toolNameMap`, `executeTool()`, `resolveToolCall()`, `executeToolCall()`, and `executeToolCalls()` helpers for OpenAI Responses, Azure OpenAI, OpenAI-compatible chat providers, OpenRouter, LiteLLM, Ollama, LM Studio, Groq, Perplexity, xAI Grok, DeepSeek, Together AI, Fireworks AI, Qwen DashScope, NVIDIA NIM, Cloudflare AI Gateway, Mistral, Cohere, Anthropic Tool Use, Gemini, Google Vertex AI, Bedrock Converse, Vercel AI SDK, LangChain, LlamaIndex, Mastra, Semantic Kernel, CrewAI, AutoGen, Haystack, and generic agents. Runtime helpers infer provider-specific TypeScript shapes from `kind`, so `kind: "azure-openai"`, `kind: "openai-compatible"`, `kind: "openrouter"`, `kind: "litellm"`, `kind: "ollama"`, `kind: "lm-studio"`, `kind: "groq"`, `kind: "perplexity"`, `kind: "xai-grok"`, `kind: "deepseek"`, `kind: "together-ai"`, `kind: "fireworks-ai"`, `kind: "qwen-dashscope"`, `kind: "nvidia-nim"`, and `kind: "cloudflare-ai-gateway"` return chat function tools, `kind: "anthropic-tool-use"` returns Anthropic tool definitions, `kind: "google-gemini"` and `kind: "google-vertex-ai"` return Gemini function declarations, and `kind: "vercel-ai-sdk"` returns a Vercel tool record. `watchMobigentProviderRuntime()` does the same mapping for live tool-stream snapshots so long-running agents can refresh provider-native definitions when mobile capabilities change.
Use `createMobigentProviderRuntimeReport()` and `formatMobigentProviderRuntimeReport()` in agent-server boot logs to show the selected provider, result format, raw mobile tool names, provider-facing names, and any provider-safe name mappings.
Use `toolNames: { mode: "provider-safe" }` or `createProviderSafeToolNameMap()` when a provider rejects punctuation or long function names. The model sees sanitized names, while execution still calls the original mobile tool name.
`createMobigentProviderRuntimeFromEnv()` is the recommended deployable bootstrap helper. It reads `MOBIGENT_PROVIDER`, `MOBIGENT_HTTP_URL`, `MOBIGENT_HTTP_API_KEY`, `MOBIGENT_AGENT_ID`, timeout, retry, and wait settings, waits for gateway readiness, and returns `{ client, readiness, runtime }`.
`diagnoseMobigentProviderRuntimeConfig()` and `formatMobigentProviderRuntimeConfigReport()` validate env-driven provider runtime settings before network startup, including provider support, HTTP URL shape, auth key presence, agent identity, readiness waits, and live-tool watching.
`createProviderRuntimeEnv()` and `stringifyProviderRuntimeEnv()` generate the matching environment artifact from a provider descriptor, so setup UIs, docs generators, and deployment scripts use the same values as `--format runtime-env` and provider bundles.

## Audit Events

The gateway emits structured audit events for app sessions, manifests, app events, tool calls, denials, failures, and timeouts:

```ts
gateway.onAudit((event) => {
  console.log(event.type, event.tool, event.agentId);
});

const recent = gateway.getAuditLog(50);
```

The HTTP gateway exposes recent events at `GET /audit?limit=50` and live Server-Sent Events at `GET /audit/stream?replay=10`. Provider clients can use `listAuditEvents()` for recent history or `watchAuditEvents()` for live admin views.

## Documentation Site

```bash
npm run docs:start
npm run docs:build
```

The Vite docs source lives in `apps/docs`.

## Gateway Auth

For local-only development, auth can be omitted. When exposing the gateway through an HTTPS tunnel, set a shared app token:

```bash
MOBIGENT_AUTH_TOKEN=dev-secret npm run dev:http
```

Then configure the app SDK with the same token:

```ts
intentBridge.configure({
  appId: "com.example.expenses",
  appName: "Example Expenses",
  gatewayUrl: "ws://localhost:8787",
  authToken: "dev-secret"
});
```

For the agent-facing HTTP API, set a separate API key:

```bash
MOBIGENT_HTTP_API_KEY=http-secret npm run dev:http
```

HTTP clients can authenticate with `Authorization: Bearer http-secret` or `x-mobigent-api-key: http-secret`.

Restrict browser CORS origins when the HTTP gateway is reachable outside localhost:

```bash
MOBIGENT_HTTP_CORS_ORIGINS=https://agent.example.com,https://admin.example.com npm run dev:http
```

Tune the JSON request size limit for agent tool calls when your payloads need to be smaller or larger than the default `1mb`:

```bash
MOBIGENT_HTTP_JSON_LIMIT=256kb npm run dev:http
```

## What This Proves

The app owns its business logic and confirmation flow. The agent only sees typed, permissioned capabilities:

- actions: `create_expense`, `delete_expense`
- resources: `expenses`
- components: `expense_detail`
- events: `expense.created`, `expense.deleted`

Action inputs are validated against the declared JSON schema before app handlers run.

This is the core pattern Mobigent implements across local gateway, HTTP/OpenAPI, and MCP transports.

## Repository Structure

```text
packages/
  core/          Shared protocol and capability manifest types
  gateway/       Agent-facing gateway and HTTP/OpenAPI server
  providers/     Provider configuration helpers
  react-native/  App SDK for registering actions, resources, and events
apps/
  docs/          Vite landing page and docs site
examples/
  expense-app/   End-to-end example app and demos
docs/
  api/
  chatgpt-actions.md
  mcp.md
  react-native.md
tests/
  bridge.test.ts
```

## Validation

```bash
npm run typecheck
npm test
npm run pack:check
npm run demo
npm run demo:http
```

## Project Health

- CI: `.github/workflows/ci.yml`
- Security policy: [SECURITY.md](./SECURITY.md)
- API reference: [docs/api/README.md](./docs/api/README.md)
- Changelog: [CHANGELOG.md](./CHANGELOG.md)
