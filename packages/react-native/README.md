# @mobigent/react-native

React Native-facing SDK for Mobigent.

Apps use this package to declare capabilities that agents can discover and call through the Mobigent gateway.

Action inputs are validated against their declared `inputSchema` before handlers run.

## React integration

For Expo and React Native apps, start with one feature module per product area. `createAgentModule({ namespace })` prefixes local names automatically, so app code stays small while agents still see stable tool names such as `expense_create` and `expense_list`:

You can generate the starter files instead of copying the setup by hand:

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

Use `mobigent-init` for Expo projects; it generates an app root with `createAgentExpoApp()` and `Constants.expoConfig`. Add `--expo-router` to also generate `app/_layout.tsx` with the normal Expo Router `<Stack />` wrapped by `MobigentRoot`. `mobigent-expo-init` remains as an explicit Expo alias, and `mobigent-rn-init --expo` remains as the compatibility command name. Use `--write-manifest` to create a small app-integration metadata file for CI and agent setup tooling. Use `--validate-manifest` to check that saved file. Use `--write-contract` for the protocol-level capability contract that providers can validate.

Use `--custom-confirmation` to generate `mobigent-confirmation.tsx` and wire it into the generated `MobigentRoot` through `ConfirmationComponent`. Run `--doctor` from the app root, or pass `--app-root`, so it can verify `package.json` includes `@mobigent/react-native` and a React Native runtime dependency.

The generated root passes the first feature with `modules: [featureModule]`. Add later `--feature-only` modules to that array for static app-wide features, or render `<AgentModules />` from the route that owns the feature. Use `createAgentCapabilities()` when you need plugin-style loading, feature flags, or bootstrap-time module installation.

The Expo root reads `Constants.expoConfig`, including the `@mobigent/react-native/expo` config plugin metadata. The non-Expo root uses `createAgentEnvironmentFromEnv()`, so app rollout can switch between local simulator, physical device, hosted gateway, and disabled bridge modes with env vars. Use `--env-template` to print the matching `EXPO_PUBLIC_MOBIGENT_*` template or `--write-env` to save it.

The generated `MobigentRoot` accepts runtime overrides for normal app rollout concerns:

```tsx
<MobigentRoot enabled={!isE2E} gatewayUrl={hostedGatewayUrl}>
  <App />
</MobigentRoot>
```

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
      description: "Create an expense.",
      inputSchema: schema.object(
        {
          amount: schema.number(),
          merchant: schema.string()
        },
        { required: "all" }
      ),
      confirmation: {
        required: true,
        risk: "medium"
      },
      handler: async (input) => ({ id: "EXP-1", ...input })
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
    id: "com.example.app",
    name: "Example App",
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

`createAgentApp()` is the shortest app-shell API for new integrations. Configure app identity, connection behavior, feature modules, and inline capabilities once, then render the returned `Root` around your app. `createMobigentApp()` and `MobigentApp` remain available when you want the explicit SDK names. Both paths create the provider, derive a local gateway URL from the current React Native platform, mount one module, one capability kit, or arrays of either, render children, and include the default confirmation modal. Set `preflight: true` to fail fast when capability names, manifest shape, or safety policies are not production-ready; pass `{ throwOnFailure: false, onReport }` when you want to log or upload the report instead. Use `capabilityDeps` on `Root` or `AgentApp` when screen-owned handlers close over values such as workspace ID, auth scope, or navigation state and should refresh after those values change. Use `MobigentProvider` directly when you want custom placement for capabilities or confirmation UI.

For Expo apps, use `createAgentExpoApp()` so app identity and gateway settings come from normal Expo metadata, the Mobigent config plugin, or `EXPO_PUBLIC_MOBIGENT_*` variables:

```tsx
import Constants from "expo-constants";
import { createAgentExpoApp } from "@mobigent/react-native/app";

const { Root } = createAgentExpoApp({
  expo: Constants.expoConfig,
  modules: [expenseModule]
});

export function App() {
  return (
    <Root>
      <YourApp />
    </Root>
  );
}
```

You can keep that runtime setup stable and move environment wiring into `app.json` or `app.config.ts` with the Expo config plugin:

```json
{
  "expo": {
    "plugins": [
      [
        "@mobigent/react-native/expo",
        {
          "app": { "id": "com.example.app", "name": "Example App" },
          "mode": "hosted",
          "host": "gateway.example.com",
          "secure": true
        }
      ]
    ]
  }
}
```

Set `mode` or `EXPO_PUBLIC_MOBIGENT_MODE` to `local` for simulators, `device` with `deviceHost` / `EXPO_PUBLIC_MOBIGENT_DEVICE_HOST` for physical devices, `hosted` with `host` / `EXPO_PUBLIC_MOBIGENT_HOST`, or `disabled` for builds where the agent bridge should not start. Environment variables override plugin metadata, so EAS profiles can change gateways without editing app code. The Expo factory defaults to reconnects, heartbeat, preflight checks, and the same `Root` component as the regular app factory.

Use declarative components when the capability belongs to a screen and should appear only while that screen is mounted:

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

Use `ConfirmationComponent` when the app shell should keep the standard bridge lifecycle but render approval prompts with your design system:

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
  app: { id: "com.example.app", name: "Example App" },
  ...bridgeEnvironment
});
```

Expo and React Native environment variables can drive the same app shell without custom branching:

```tsx
const bridgeEnvironment = createAgentEnvironmentFromEnv({
  fallback: { mode: "local" }
});

const { Root } = createMobigentApp({
  app: { id: "com.example.app", name: "Example App" },
  modules: [expenseModule],
  ...bridgeEnvironment
});
```

The helper reads `MOBIGENT_*`, `EXPO_PUBLIC_MOBIGENT_*`, and `REACT_NATIVE_MOBIGENT_*` variables for `MODE`, `GATEWAY_URL`, `HOST`, `PORT`, `DEVICE_HOST`, `PLATFORM`, `SECURE`, `AUTH_TOKEN`, and `ENABLED`.

Pass `gateway` directly when you need lower-level control. Android emulator uses `10.0.2.2`, iOS simulator uses `localhost`, and physical devices can pass `deviceHost`:

```ts
const { Root } = createMobigentApp({
  app: { id: "com.example.app", name: "Example App" },
  gateway: { deviceHost: "192.168.1.20" }
});

const { Root: HostedRoot } = createMobigentApp({
  app: { id: "com.example.app", name: "Example App" },
  gateway: { host: "gateway.example.com", secure: true, port: 443 }
});
```

You can also use `createMobigentGatewayUrl()` or `createMobigentGatewayUrlForPlatform()` directly for custom bootstraps:

```ts
createMobigentGatewayUrl({ target: "android-emulator" });
createMobigentGatewayUrl({ target: "device", host: "192.168.1.20" });
createMobigentGatewayUrl({ host: "gateway.example.com", secure: true, port: 443 });
createMobigentGatewayUrlForPlatform("android", { deviceHost: "192.168.1.20" });
```

`useAgentScreen()` is the shortest modern API for route-owned capabilities. Pass a `namespace`, local action/resource/component names, and `deps`; the hook creates a namespaced module, registers it while the screen is mounted, refreshes when dependencies change, and returns `emit`, `status`, `connection`, `connected`, and the generated `module` for local UI. Use `useAgent()` for a tiny already-qualified bundle. For one-off capabilities, `useAgentAction()`, `useAgentResource()`, and `useAgentComponent()` take one capability object with `handler`, `read`, or `focus` inline. Use `<AgentModules modules={expenseModule} />` or `useAgentModule(expenseModule)` when a screen or route owns an existing module and should expose it only while mounted. Use `useMobigentCapabilityDefinition()` or `useMobigentModuleDefinition()` only when you need lower-level memoization control.

```tsx
function ExpenseQuickActions({ expenseId }: { expenseId: string }) {
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

Use `schema.object()`, `schema.string()`, `schema.number()`, `schema.integer()`, `schema.boolean()`, `schema.array()`, `schema.enum()`, `schema.literal()`, `schema.null()`, and `schema.nullable()` to keep common capability schemas compact. The helpers return plain JSON Schema, so you can still pass hand-written schemas when you need advanced shapes.

Use `diagnoseMobigentCapabilities()` before mounting a feature, or in CI, when you want a capability preflight. It checks duplicate names, runtime-safe naming, manifest shape, and obvious safety-policy gaps such as user-required actions without confirmation:

```ts
const report = diagnoseMobigentCapabilities(expenseModule, {
  app: { id: "com.example.app", name: "Example App" }
});

console.log(formatMobigentCapabilityDiagnostics(report));
```

Use `useMobigentConnection()`, `useMobigentConnectionState()`, or `useMobigentConnected()` for connection-aware UI without reaching into the full bridge context.
Use `MobigentStatusBadge` for a default operator-visible badge, or drop `MobigentDiagnosticsPanel` into a settings/support screen for status, capability counts, issue text, and connect/disconnect controls. Use `useMobigentStatus()` for custom settings rows; the status object returns a stable `level`, label, connection state, capability count, issue counts, and queued event count. Use `useMobigentDiagnostics()` and `formatMobigentDiagnostics()` for deeper development screens and support logs. The report includes configuration state, resolved gateway URL, connection state, capability counts, queued events, reconnect/heartbeat status, and actionable issues like `not_configured`, `no_capabilities`, `not_connected`, `queued_events`, and `last_error`.

```tsx
function AgentSupportScreen() {
  return <MobigentDiagnosticsPanel title="Agent bridge" />;
}
```

For grouped capability lists, use `createAgentFeature("expense")` when a feature module owns its agent surface and you want local names automatically prefixed, such as `create` becoming `expense_create`. The returned factory has `action()`, `resource()`, `component()`, and `capabilities()` helpers so each feature folder can export one clean kit. Wrap that kit with `createAgentModule()` when you want a named, versionable plugin-style package that can be installed into the app registry. Use `defineAgentFeature()` for object-style definitions, or `defineAgentCapabilities()` when names are already fully qualified.

Use `AgentSurface` when a route, modal, or tab owns both the visible UI and the agent surface. It renders `children`, registers `capabilities` and `modules` while mounted, and unregisters them when the screen leaves. Use `createAgentCapabilities()` when you want one app-level registry that feature modules can add to during bootstrap. For static modules, pass `modules: [expenseModule]` directly to `createAgentApp()` or `AgentApp`; for route-owned modules, render `<AgentSurface modules={expenseModule} enabled={isFocused}>...</AgentSurface>` or `<AgentModules modules={expenseModule} enabled={isFocused} />`. The explicit `MobigentSurface` and `MobigentModules` names remain available as SDK aliases. The registry validates duplicate tool names, exposes `add()`, `install()`, `remove()`, `clear()`, `getCapabilities()`, `getModules()`, and `subscribe()`, refreshes mounted registrations when sources change, and can be passed directly to `createAgentApp({ capabilities })`. `install()` is idempotent for the same module object, so plugin loaders and feature-flag toggles can safely call it more than once while duplicate capability names from different sources still fail fast:

```ts
const appBridgeCapabilities = createAgentCapabilities();

appBridgeCapabilities.install(expenseModule);
appBridgeCapabilities.add(profileCapabilities);

console.log(appBridgeCapabilities.getModules());

function ExpensePlugin() {
  useMobigentModule(appBridgeCapabilities, expenseModule);
  return null;
}

function ConditionalPlugin({ enabled }: { enabled: boolean }) {
  return <MobigentModuleMount registry={appBridgeCapabilities} module={expenseModule} enabled={enabled} />;
}

const { Root } = createMobigentApp({
  app: { id: "com.example.app", name: "Example App" },
  capabilities: appBridgeCapabilities
});
```

Pass arrays to `modules` or `capabilities` for the shortest app-shell setup, or use `composeAgentCapabilities()` when you want an explicit combined kit. Mount `kit.Component` inside the provider, or call `kit.useRegister()` from a component when you need local lifecycle options:

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

const SyncCapabilityMount = syncCapabilities.Component;

<SyncCapabilityMount deps={[]} />
```

## Imperative API

The lower-level singleton is still available for non-React modules, tests, and app bootstrap code:

```ts
import { mobigent } from "@mobigent/react-native";

mobigent.configure({
  appId: "com.example.app",
  appName: "Example App",
  gatewayUrl: "ws://localhost:8787",
  confirm: async () => true
});

mobigent.registerAction({
  name: "create_expense",
  description: "Create an expense.",
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
  handler: async (input) => {
    return { id: "EXP-1", ...input };
  }
});
```

Action inputs are validated before handlers run. If `outputSchema` is present, action results are also validated before they are returned to agents.

Capability names must be unique across actions, resources, and components. `composeAgentCapabilities()` validates duplicates before mounting so feature modules fail fast during app startup. To replace a capability at runtime, call the matching `unregister*` method first and then register the new definition.

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

Capabilities can be removed when their owning screen or hook unmounts:

```ts
mobigent.unregisterAction("create_expense");
mobigent.unregisterResource("expenses");
mobigent.unregisterComponent("expense_detail");
```

## Signed Manifests

For production gateways, configure a manifest signer. The SDK accepts a callback so each React Native app can use its preferred secure crypto implementation:

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

The gateway verifies the signature when `manifestSigningSecret` or `MOBIGENT_MANIFEST_SIGNING_SECRET` is set.

## Provider

```tsx
import { MobigentProvider } from "@mobigent/react-native";
import { MobigentConfirmationModal } from "@mobigent/react-native/ui";

export function App() {
  return (
    <MobigentProvider
      appId="com.example.app"
      appName="Example App"
      gateway={{ platform: "ios" }}
      reconnect={{ enabled: true, maxAttempts: 20 }}
      heartbeat
    >
      <YourApp />
      <MobigentConfirmationModal />
    </MobigentProvider>
  );
}
```

The default modal lives under `@mobigent/react-native/ui` so Node tests and headless tooling can import the root package without loading React Native UI components.

## Transport

React Native provides a global `WebSocket`, which the SDK uses by default. Node tests and local simulations can pass `createSocket`.

## Connection State

```ts
const unsubscribe = mobigent.subscribeConnection((state) => {
  console.log(state);
});
```

Enable reconnect when needed:

```ts
mobigent.configure({
  appId: "com.example.app",
  appName: "Example App",
  gatewayUrl: "ws://localhost:8787",
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

Retries use exponential backoff. `delayMs` is the first retry delay, `backoffFactor` multiplies each failed attempt, `maxDelayMs` caps the delay, and `jitterRatio` adds random spread to avoid reconnect bursts after app resume or network recovery.

Enable heartbeats when mobile networks or proxies may silently drop idle WebSockets:

```ts
mobigent.configure({
  appId: "com.example.app",
  appName: "Example App",
  gatewayUrl: "ws://localhost:8787",
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
  appId: "com.example.app",
  appName: "Example App",
  gatewayUrl: "ws://localhost:8787",
  reconnect: true,
  eventQueue: {
    enabled: true,
    maxSize: 100
  }
});

mobigent.emit("screen.viewed", { name: "ExpenseDetail" });
```

Queued events flush after the socket reconnects. When the queue is full, the oldest event is dropped first so memory stays bounded.

## Confirmation Controller

```ts
import { createConfirmationController, mobigent } from "@mobigent/react-native";

const confirmationController = createConfirmationController();

mobigent.configure({
  appId: "com.example.app",
  appName: "Example App",
  gatewayUrl: "ws://localhost:8787",
  confirmationController
});

confirmationController.subscribe((request) => {
  if (!request) return;

  // Show your React Native modal, then call approve/reject.
  confirmationController.approve();
});
```
