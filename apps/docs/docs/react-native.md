---
sidebar_position: 3
---

# React Native SDK

Register app capabilities with `@mobigent/react-native`.

## React-first integration

Use the Expo-first React API for normal app integration. Define one agent module per product area with `createAgentModule({ namespace })`; the SDK handles namespacing, registration, safety preflight, and lifecycle cleanup.

Generate the standard app shell and first feature module with:

```bash
npx mobigent-init --app-id com.example.expenses --app-name "Example Expenses" --feature expense --out-dir src
npx mobigent-init --app-id com.example.expenses --app-name "Example Expenses" --feature expense --out-dir src --expo-router
npx mobigent-expo-init --app-id com.example.expenses --app-name "Example Expenses" --feature expense --out-dir src
npx mobigent-rn-init --app-id com.example.expenses --app-name "Example Expenses" --feature expense --out-dir src
npx mobigent-rn-init --app-id com.example.expenses --app-name "Example Expenses" --feature expense --out-dir src --expo
npx mobigent-rn-init --app-id com.example.expenses --app-name "Example Expenses" --feature expense --out-dir src --custom-confirmation
npx mobigent-rn-init --feature invoice --out-dir src --feature-only
npx mobigent-rn-init --doctor --app-id com.example.expenses --app-name "Example Expenses" --feature expense --out-dir src --app-root .
npx mobigent-rn-init --manifest --app-id com.example.expenses --app-name "Example Expenses" --feature expense --out-dir src
npx mobigent-rn-init --write-manifest ./mobigent-integration.json --app-id com.example.expenses --app-name "Example Expenses" --feature expense --out-dir src
npx mobigent-rn-init --validate-manifest ./mobigent-integration.json
npx mobigent-rn-init --contract --app-id com.example.expenses --app-name "Example Expenses" --feature expense
npx mobigent-rn-init --write-contract ./mobigent-contract.json --app-id com.example.expenses --app-name "Example Expenses" --feature expense
npx mobigent-rn-init --validate-contract ./mobigent-contract.json
npx mobigent-rn-init --env-template --gateway-url ws://localhost:8787
npx mobigent-rn-init --write-env ./.env.mobigent --gateway-url ws://localhost:8787
```

Use `mobigent-init` for Expo projects; it generates an app root with `createAgentExpoApp()` and `Constants.expoConfig`. Add `--expo-router` to also generate `app/_layout.tsx`, wrapping Expo Router's normal `<Stack />` with `MobigentRoot`. `mobigent-expo-init` remains as an explicit Expo alias, and `mobigent-rn-init --expo` remains as the compatibility command name. Use `--custom-confirmation` to generate `mobigent-confirmation.tsx` and wire it into `MobigentRoot` through `ConfirmationComponent`. The generated root passes the first feature with `modules: [featureModule]`; the Expo root reads plugin metadata from `@mobigent/react-native/expo`, while the non-Expo root uses `createAgentEnvironmentFromEnv()` for local, device, hosted, and disabled rollout modes. Use `--env-template` or `--write-env` to create the matching `EXPO_PUBLIC_MOBIGENT_*` template. Use `--feature-only` to add another feature module, then either add it to that root `modules` array or render `<AgentModules />` from the route that owns the feature. Use `createAgentCapabilities()` when you need plugin-style loading or feature flags that install modules during bootstrap. Commit `mobigent-integration.json` when you want CI, app reviewers, or agent configuration tooling to inspect the generated file paths, gateway URL, feature namespace, and expected capabilities without reading app code. Commit `mobigent-contract.json` when you want provider setup or CI to validate the protocol-level action/resource contract.

Run `--doctor` from the React Native app root, or pass `--app-root`, so the CLI can check `package.json` for `@mobigent/react-native` and a React Native runtime dependency. The doctor also verifies the generated root wrapper and feature file shape, which catches half-wired integrations early.

The generated `MobigentRoot` keeps the default app identity and feature capabilities in one file, but still accepts runtime app-shell overrides:

```tsx
<MobigentRoot
  enabled={!isE2E}
  gatewayUrl={releaseChannel === "production" ? "wss://gateway.example.com:443" : undefined}
>
  <YourApp />
</MobigentRoot>
```

Use this for staged rollouts, local test runs, device-specific gateway URLs, or hosted gateway environments without changing the feature modules.

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
      outputSchema: schema.object(
        {
          id: schema.string(),
          amount: schema.number(),
          merchant: schema.string()
        },
        { required: "all" }
      ),
      confirmation: {
        required: true,
        risk: "medium"
      },
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
  ],
  components: [
    {
      name: "detail",
      description: "Expense detail screen.",
      propsSchema: schema.object({ expenseId: schema.string() }, { required: "all" }),
      policy: { foregroundOnly: true },
      focus: async (props) => ({ focused: true, expenseId: props.expenseId })
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
  reconnect: { enabled: true, maxAttempts: 20 },
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

export function App({ navigation }) {
  const expenseCapabilities = createExpenseCapabilities(navigation);

  return (
    <MobigentRoot capabilities={expenseCapabilities} capabilityDeps={[navigation]}>
      <AgentConnectionBadge />
      <ExpenseEvents />
      <YourApp />
    </MobigentRoot>
  );
}
```

`createAgentApp()` is the shortest app-shell API for new integrations. Configure app identity, connection behavior, static feature modules, and inline capabilities once, then render the returned `Root` around your app. You can pass additional screen-owned modules or capabilities to `Root` at render time. Set `preflight: true` to fail fast when capability names, manifest shape, or safety policies are not production-ready; pass `{ throwOnFailure: false, onReport }` when you want to log or upload the report instead. Add `capabilityDeps` when those capabilities close over changing values such as navigation, workspace ID, tenant, or auth scope; the SDK will unregister and re-register the exposed agent surface when the dependency changes. `createMobigentApp()` and `MobigentApp` remain available when you prefer explicit SDK names. Both paths create the provider, derive the local gateway URL from the current React Native platform, mount one module, one capability kit, or arrays of either, render children, and include the default confirmation modal. Use `MobigentProvider` directly when a mature app needs custom placement for confirmation UI or multiple feature-specific capability mounts.

For Expo, start with `createAgentExpoApp()` instead of hand-wiring hostnames:

```tsx
import Constants from "expo-constants";
import { createAgentExpoApp } from "@mobigent/react-native/app";

const { Root } = createAgentExpoApp({
  expo: Constants.expoConfig,
  modules: [expenseModule]
});
```

For config-driven Expo apps, add the config plugin:

```json
{
  "expo": {
    "plugins": [
      [
        "@mobigent/react-native/expo",
        {
          "app": { "id": "com.example.expenses", "name": "Example Expenses" },
          "mode": "hosted",
          "host": "gateway.example.com",
          "secure": true
        }
      ]
    ]
  }
}
```

The Expo factory reads plugin metadata from `extra.mobigent`, then lets `EXPO_PUBLIC_MOBIGENT_MODE`, `EXPO_PUBLIC_MOBIGENT_HOST`, `EXPO_PUBLIC_MOBIGENT_DEVICE_HOST`, `EXPO_PUBLIC_MOBIGENT_GATEWAY_URL`, and `EXPO_PUBLIC_MOBIGENT_AUTH_TOKEN` override it. It derives the app id/name/version from `extra.mobigent.app`, `extra.mobigentApp`, bundle identifiers, package names, or the Expo slug, then enables reconnects, heartbeat, and preflight by default.

Use declarative registration components when a screen owns a capability and that capability should appear only while the screen is mounted:

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

Use `createAgentPolicy()` to apply common safety policy shapes without duplicating policy objects:

```tsx
defineAgentAction({
  name: "expense_approve",
  description: "Approve an expense.",
  inputSchema: schema.object({ id: schema.string() }, { required: "all" }),
  ...createAgentPolicy("confirmed", {
    title: "Approve expense?",
    allowedAgents: ["finance-agent"],
    rateLimitPerMinute: 5
  }),
  handler: approveExpense
});
```

Presets include `read-only`, `foreground`, `user-required`, `confirmed`, and `destructive`. Pass `policy` or `confirmation` overrides when a capability needs stricter allowlists, rate limits, sensitive-data labels, or custom approval copy.

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

Use `ConfirmationComponent` when you want the simple app shell but need the approval prompt to use your design system:

```tsx
function AgentApprovalSheet({ approveLabel = "Approve", rejectLabel = "Reject" }) {
  const { request, approve, reject } = useMobigentConfirmation();

  return (
    <YourBottomSheet visible={Boolean(request)} onDismiss={reject}>
      <Text>{request?.action.confirmation?.title ?? request?.action.description}</Text>
      <Button title={rejectLabel} onPress={reject} />
      <Button title={approveLabel} onPress={approve} />
    </YourBottomSheet>
  );
}

<MobigentRoot
  ConfirmationComponent={AgentApprovalSheet}
  confirmationModal={{ approveLabel: "Allow", rejectLabel: "Deny" }}
>
  <YourApp />
</MobigentRoot>
```

Pass `enabled={false}` to `createMobigentApp()`, `MobigentApp`, or `MobigentProvider` to turn the bridge off for local builds, E2E runs, staged rollouts, or unsupported regions without removing capability definitions. When disabled, the SDK does not connect, register capabilities, show confirmations, or emit queued events.

Use `createAgentEnvironment()` when the app shell needs a clean switch between local simulator, physical device, hosted gateway, and disabled environments:

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

Pass `gateway` directly when you need lower-level control. Android emulator uses `10.0.2.2`, iOS simulator uses `localhost`, and physical devices can pass `deviceHost`:

```ts
const { Root } = createMobigentApp({
  app: { id: "com.example.expenses", name: "Example Expenses" },
  gateway: { deviceHost: "192.168.1.20" }
});

const { Root: HostedRoot } = createMobigentApp({
  app: { id: "com.example.expenses", name: "Example Expenses" },
  gateway: { host: "gateway.example.com", secure: true, port: 443 }
});
```

Use `createMobigentGatewayUrl()` or `createMobigentGatewayUrlForPlatform()` directly for custom bootstraps:

```ts
createMobigentGatewayUrl({ target: "android-emulator" });
createMobigentGatewayUrl({ target: "device", host: "192.168.1.20" });
createMobigentGatewayUrl({ host: "gateway.example.com", secure: true, port: 443 });
createMobigentGatewayUrlForPlatform("android", { deviceHost: "192.168.1.20" });
```

`useAgentScreen()` is the shortest modern hook when a route exposes capabilities that depend on route params, auth scope, or local state. Pass a `namespace`, local action/resource/component names, and `deps`; the hook creates a namespaced module, registers it while the screen is mounted, refreshes when dependencies change, and returns `emit`, `status`, `connection`, `connected`, and the generated `module`. Use `useAgent()` for a tiny already-qualified bundle. For one-off capabilities, `useAgentAction()`, `useAgentResource()`, and `useAgentComponent()` take one object with `handler`, `read`, or `focus` inline. Use `<AgentSurface modules={expenseModule}>...</AgentSurface>` or `useAgentModule(expenseModule)` when a screen owns an existing module. Use `useMobigentModule()` or `<MobigentModuleMount />` when a feature flag or plugin loader should install a module into a shared registry and remove it on unmount.

```tsx
function ExpenseQuickActions({ expenseId }) {
  const agent = useAgentScreen({
    namespace: "expense",
    actions: [
      {
        name: "approve",
        description: "Approve the open expense.",
        inputSchema: schema.object({ note: schema.string({ optional: true }) }),
        confirmation: { required: true, title: "Approve expense?", risk: "medium" },
        handler: async (input) => approveExpense(expenseId, input.note)
      }
    ],
    resources: [
      {
        name: "current",
        description: "The expense currently open on screen.",
        read: async () => loadExpense(expenseId)
      }
    ],
    deps: [expenseId]
  });

  return <YourExpenseUi connected={agent.connected} />;
}
```

Use `useMobigentConnection()`, `useMobigentConnectionState()`, or `useMobigentConnected()` for connection-aware UI without reaching into the full bridge context.
Use `MobigentStatusBadge` for a default operator-visible badge, or drop `MobigentDiagnosticsPanel` into a settings/support screen for status, capability counts, issue text, and connect/disconnect controls. Use `useMobigentStatus()` for custom settings rows; the status object returns a stable `level`, label, connection state, capability count, issue counts, and queued event count. Use `useMobigentDiagnostics()` and `formatMobigentDiagnostics()` for development screens and support logs. The report includes configuration state, resolved gateway URL, connection state, capability counts, queued events, reconnect/heartbeat status, and actionable issues like `not_configured`, `no_capabilities`, `not_connected`, `queued_events`, and `last_error`.

```tsx
function AgentSupportScreen() {
  return <MobigentDiagnosticsPanel title="Agent bridge" />;
}
```

Use `schema.object()`, `schema.string()`, `schema.number()`, `schema.integer()`, `schema.boolean()`, `schema.array()`, `schema.enum()`, `schema.literal()`, `schema.null()`, and `schema.nullable()` to keep common capability schemas compact. The helpers return plain JSON Schema, so you can still pass hand-written schemas when you need advanced shapes.

Use `diagnoseMobigentCapabilities()` before mounting a feature, or in CI, when you want a capability preflight. It checks duplicate names, runtime-safe naming, manifest shape, and obvious safety-policy gaps such as user-required actions without confirmation:

```ts
const report = diagnoseMobigentCapabilities(expenseModule, {
  app: { id: "com.example.app", name: "Example App" }
});

console.log(formatMobigentCapabilityDiagnostics(report));
```

For route-owned or stateful app surfaces, prefer `useAgentScreen()`. Use `useMobigentCapabilityDefinition()` or `useMobigentModuleDefinition()` only when you need lower-level memoization control:

```tsx
function ExpenseScreen({ workspaceId }: { workspaceId: string }) {
  useAgentScreen({
    namespace: "expense",
    actions: [
      {
        name: "create",
        description: "Create an expense in the active workspace.",
        inputSchema: schema.object({ merchant: schema.string() }, { required: "all" }),
        handler: async (input) => createExpense(workspaceId, input)
      }
    ],
    deps: [workspaceId]
  });

  return <ExpenseList workspaceId={workspaceId} />;
}
```

For grouped capability lists, use `createAgentFeature("expense")` when a feature module owns its agent surface and you want local names automatically prefixed, such as `create` becoming `expense_create`. The returned factory has `action()`, `resource()`, `component()`, and `capabilities()` helpers so each feature folder can export one clean kit. Wrap a kit with `createAgentModule()` when you want a named, versionable plugin-style package that can be installed into the app registry. Use `defineAgentFeature()` for object-style definitions, or `defineAgentCapabilities()` when names are already fully qualified.

Use `createAgentCapabilities()` when the app shell should own one standard registry while feature modules register their capabilities during bootstrap. For static modules, pass `modules: [expenseModule]` directly to `createAgentApp()` or `AgentApp`; for route-owned modules, render `<AgentSurface modules={expenseModule} enabled={isFocused}>...</AgentSurface>` or `<AgentModules modules={expenseModule} enabled={isFocused} />`. The explicit `MobigentSurface` and `MobigentModules` names remain available as SDK aliases. The registry validates duplicate names, exposes `add()`, `install()`, `remove()`, `clear()`, `getCapabilities()`, `getModules()`, and `subscribe()`, refreshes mounted registrations when sources change, and can be passed directly to `createAgentApp({ capabilities })`. `install()` is idempotent for the same module object, so plugin loaders and feature-flag toggles can safely call it more than once while duplicate capability names from different sources still fail fast:

```ts
const appBridgeCapabilities = createAgentCapabilities();

appBridgeCapabilities.add(profileCapabilities);
appBridgeCapabilities.install(expenseModule);

console.log(appBridgeCapabilities.getModules());

function ExpensePlugin() {
  useMobigentModule(appBridgeCapabilities, expenseModule);
  return null;
}

function ConditionalPlugin({ enabled }: { enabled: boolean }) {
  return <MobigentModuleMount registry={appBridgeCapabilities} module={expenseModule} enabled={enabled} />;
}

const { Root } = createMobigentApp({
  app: { id: "com.example.expenses", name: "Example Expenses" },
  capabilities: appBridgeCapabilities
});
```

Pass arrays to `modules` or `capabilities` for the shortest app-shell setup, or use `composeAgentCapabilities()` when you want an explicit combined kit. Mount the returned `Component`, or call `useRegister()` when the registration depends on local screen values:

```tsx
const syncCapabilities = defineAgentCapabilities({
  actions: [
    defineAgentAction({
      name: "sync_now",
      description: "Sync local data.",
      inputSchema: schema.object(),
      handler: async () => ({ ok: true })
    })
  ]
});

const appCapabilities = composeAgentCapabilities(expenseCapabilities, syncCapabilities);

function SyncCapabilities() {
  syncCapabilities.useRegister({ deps: [] });

  return null;
}
```

## Imperative integration

Use the lower-level singleton from non-React modules or custom bootstraps:

```ts
import { mobigent } from "@mobigent/react-native";

mobigent.configure({
  appId: "com.example.expenses",
  appName: "Example Expenses",
  gatewayUrl: "ws://localhost:8787",
  confirm: async () => true
});

mobigent.registerAction({
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
    risk: "medium"
  },
  handler: async (input) => ({ id: "EXP-1002", ...input })
});
```

Action inputs are validated before handlers run. If `outputSchema` is present, action results are validated before they are returned to agents.

Capability names must be unique across actions, resources, and components. This prevents one screen or module from silently replacing another module's tool contract. `composeAgentCapabilities()` validates duplicates before mounting so feature modules fail fast during app startup. To hot-swap a capability, unregister the existing one first and then register the new definition.

Register components when an agent should be able to ask the app to open or focus a native screen:

```ts
mobigent.registerComponent({
  name: "expense_detail",
  description: "Expense detail screen.",
  propsSchema: {
    type: "object",
    properties: {
      expenseId: { type: "string" }
    },
    required: ["expenseId"]
  },
  policy: {
    foregroundOnly: true
  },
  focus: async (props) => {
    navigation.navigate("ExpenseDetail", { expenseId: props.expenseId });
    return { focused: true };
  }
});
```

The gateway exposes this as a tool named `show_expense_detail` under the app id, for example `com_example_expenses.show_expense_detail`.

## Resource output schemas

Resources can declare `outputSchema`. The SDK validates read results before returning them to agents:

```ts
mobigent.registerResource({
  name: "expenses",
  description: "Current expenses.",
  outputSchema: {
    type: "object",
    properties: {
      expenses: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            amount: { type: "number" }
          },
          required: ["id", "amount"]
        }
      }
    },
    required: ["expenses"]
  },
  read: async () => ({ expenses: [] })
});
```

## Lifecycle cleanup

If capabilities are registered from a mounted screen or hook, unregister them when that owner unmounts:

```ts
useEffect(() => {
  bridge.registerAction({
    name: "quick_add_expense",
    description: "Create an expense from this screen.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ({ ok: true })
  });

  return () => {
    bridge.unregisterAction("quick_add_expense");
  };
}, [bridge]);
```

The SDK also provides `unregisterResource(name)` and `unregisterComponent(name)`. Each successful unregister publishes a fresh manifest, so connected agents see the updated tool list.

## Signed manifests

Production gateways can require signed capability manifests. The SDK uses a signer callback so you can use the secure crypto library that fits your React Native stack:

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

`MobigentProvider` and `MobigentApp` accept the same `signManifest` option when you are not using the factory. They also accept `createSocket` for custom transports, test sockets, or platform-specific WebSocket implementations.

The gateway verifies signatures when `manifestSigningSecret` or `MOBIGENT_MANIFEST_SIGNING_SECRET` is configured.

## Reconnects

Mobile connections are not stable forever. Enable reconnects for production apps so the SDK can recover after app resume, gateway restarts, or network changes:

```ts
mobigent.configure({
  appId: "com.example.expenses",
  appName: "Example Expenses",
  gatewayUrl: "wss://gateway.example.com",
  reconnect: {
    enabled: true,
    maxAttempts: 20,
    delayMs: 1000,
    maxDelayMs: 30000,
    backoffFactor: 2,
    jitterRatio: 0.2
  }
});
```

Retries use exponential backoff. `delayMs` is the first retry delay, `backoffFactor` multiplies each failed attempt, `maxDelayMs` caps the delay, and `jitterRatio` adds random spread to avoid reconnect bursts when many apps resume together.

## Heartbeats

Enable heartbeats when mobile networks or proxies may silently drop idle WebSockets:

```ts
mobigent.configure({
  appId: "com.example.expenses",
  appName: "Example Expenses",
  gatewayUrl: "wss://gateway.example.com",
  reconnect: true,
  heartbeat: {
    enabled: true,
    intervalMs: 30000,
    timeoutMs: 10000
  }
});
```

The SDK sends `ping` messages at `intervalMs`. If the gateway does not return `pong` within `timeoutMs`, the SDK closes the stale socket so reconnect logic can create a fresh connection.

## Event Queue

`emit()` returns `true` when the event was sent or queued, and `false` when it was dropped. Enable a bounded queue when app events should survive short disconnects:

```ts
mobigent.configure({
  appId: "com.example.expenses",
  appName: "Example Expenses",
  gatewayUrl: "wss://gateway.example.com",
  reconnect: true,
  eventQueue: {
    enabled: true,
    maxSize: 100
  }
});

mobigent.emit("screen.viewed", { name: "ExpenseDetail" });
```

Queued events flush after the socket reconnects. When the queue is full, the oldest event is dropped first so memory stays bounded.

Use `MobigentApp` for the shortest React Native setup. Use `MobigentProvider` and `MobigentConfirmationModal` separately when you want custom placement for confirmation UI. The provider accepts the same `reconnect`, `heartbeat`, and `eventQueue` options as `mobigent.configure()`. Use `createConfirmationController()` when you want full control over the modal.
