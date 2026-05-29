import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import WebSocket from "ws";
import { z } from "zod";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { BridgeGateway, createHttpApp, createMcpServer, createOpenApiSpec } from "@mobigent/gateway";
import {
  canonicalJson,
  validateCapabilityManifest,
  validateJsonSchema,
  type BridgeMessage,
  type CapabilityManifest
} from "@mobigent/core";
import {
  createAnthropicToolUseProvider,
  createAutoGenProvider,
  createAwsBedrockConverseProvider,
  createAzureOpenAiProvider,
  createChatGptActionsProvider,
  createClaudeDesktopProvider,
  createCohereProvider,
  createCrewAiProvider,
  createDeepSeekProvider,
  createFireworksAiProvider,
  createGoogleGeminiProvider,
  createGoogleVertexAiProvider,
  createGroqProvider,
  createHaystackProvider,
  createMobigentHttpClient,
  createMobigentProviderRuntime,
  createMobigentProviderRuntimeFromEnv,
  createMobigentProviderRuntimeReport,
  diagnoseMobigentProviderRuntimeConfig,
  createMobigentToolCallExecutor,
  createMobigentToolExecutor,
  formatMobigentProviderRuntimeConfigReport,
  formatMobigentProviderRuntimeReport,
  formatMobigentToolCallResult,
  formatMobigentToolCallResults,
  createProviderSafeToolNameMap,
  filterProviderCatalog,
  MobigentHttpError,
  formatProviderSetupValidation,
  createLangChainProvider,
  createLiteLlmProvider,
  createLmStudioProvider,
  createMistralProvider,
  createProviderCatalog,
  createProviderCompatibilityReport,
  createProviderBundle,
  createProviderGuide,
  createProviderRuntimeEnv,
  createProviderSetupPlan,
  formatProviderSetupPlanValidation,
  createOpenApiProvider,
  getProviderIntegrationProfile,
  getProviderRecommendationPreset,
  listProviderRecommendationPresets,
  recommendProviders,
  summarizeProviderCatalog,
  stringifyProviderRuntimeEnv,
  createOpenAiCompatibleProvider,
  createOllamaProvider,
  createOpenRouterProvider,
  createPerplexityProvider,
  createCloudflareAiGatewayProvider,
  mapToolsForProviderNames,
  readMobigentProviderRuntimeConfig,
  resolveMobigentToolCall,
  diagnoseMobigentProvider,
  formatMobigentProviderDiagnostics,
  createSemanticKernelProvider,
  createNvidiaNimProvider,
  createQwenDashScopeProvider,
  createTogetherAiProvider,
  createVercelAiSdkProvider,
  createVsCodeProvider,
  createXaiGrokProvider,
  toAnthropicTools,
  toAutoGenTools,
  toBedrockToolConfigTools,
  toChatFunctionTools,
  toCrewAiTools,
  toExecutableTools,
  toGeminiFunctionDeclarations,
  toHaystackTools,
  toLangChainTools,
  toLlamaIndexTools,
  toMastraTools,
  toOpenAiTools,
  toSemanticKernelPlugin,
  toVercelAiSdkTools,
  validateProviderSetup,
  validateProviderSetupPlan,
  watchMobigentProviderRuntime
} from "@mobigent/providers";
import { runProviderCli } from "../packages/providers/src/cli.js";
import type {
  AgentAppFactoryOptions,
  AgentAppProps,
  AgentAppRootProps,
  AgentExpoAppOptions,
  MobigentAppRootProps,
  MobigentAppPreflightOptions,
  MobigentConfirmationComponentProps,
  MobigentDiagnosticsPanelProps,
  MobigentExpoAppOptions,
  MobigentStatusBadgeProps
} from "../packages/react-native/src/ConfirmationModal.js";
import {
  MobigentStatusBadge,
  createAgentApp,
  createAgentExpoApp
} from "../packages/react-native/src/ConfirmationModal.js";
import {
  createReactNativeCapabilityContract,
  createReactNativeEnvTemplate,
  createReactNativeIntegrationManifest,
  createReactNativeDoctorReport,
  createReactNativeSecurityDoctorReport,
  createReactNativeFeatureFiles,
  createReactNativeStarterFiles,
  runReactNativeInitCli,
  validateReactNativeCapabilityContractFile,
  validateReactNativeIntegrationManifestFile
} from "../packages/react-native/src/cli.js";
import withMobigentExpoConfig from "../packages/react-native/src/expo.js";
import {
  applyAgentPolicy,
  applyMobigentPolicy,
  createAgentCapabilities,
  createAgentEnvironment,
  createAgentEnvironmentFromEnv,
  createAgentEnvironmentFromExpoConfig,
  createConfirmationController,
  createMobigentCapabilityRegistry,
  createMobigentGatewayUrl,
  createMobigentGatewayUrlForPlatform,
  createMobigentStatus,
  composeAgentCapabilities,
  composeMobigentCapabilities,
  createAgentFeature,
  createAgentModule,
  createMobigentEnvironment,
  createMobigentEnvironmentFromExpoConfig,
  createMobigentEnvironmentFromEnv,
  createAgentPolicy,
  createMobigentPolicy,
  createMobigentFeature,
  createMobigentModule,
  diagnoseMobigentCapabilities,
  defineAgentAction,
  defineAgentCapabilities,
  defineAgentComponent,
  defineAgentFeature,
  defineAgentResource,
  defineMobigentAction,
  defineMobigentCapabilities,
  defineMobigentComponent,
  defineMobigentFeature,
  defineMobigentResource,
  formatMobigentCapabilityDiagnostics,
  formatMobigentDiagnostics,
  fromTypeBox,
  fromZod,
  createAndroidAppActionsPlan,
  createAppleAppIntentsPlan,
  renderAndroidAppActionsXml,
  renderAppleAppIntentsSwift,
  AgentAction,
  AgentComponent,
  AgentModules,
  AgentResource,
  AgentSurface,
  Mobigent,
  MobigentAction,
  MobigentCapabilities,
  MobigentComponent,
  MobigentModuleMount,
  MobigentModules,
  MobigentSurface,
  MobigentResource,
  intentBridge,
  integerSchema,
  literalSchema,
  mobigent,
  nullableSchema,
  objectSchema,
  resolveMobigentAppIdentity,
  resolveMobigentExpoAppIdentity,
  resolveMobigentProviderGatewayUrl,
  schema,
  type MobigentActionProps,
  type MobigentComponentProps,
  type MobigentManifestSigner,
  type MobigentModulesProps,
  type MobigentProviderProps,
  type MobigentResourceProps,
  type MobigentSurfaceProps,
  type MobigentSocket,
  type MobigentSocketFactory,
  useAgent,
  useAgentAction,
  useAgentComponent,
  useAgentEvent,
  useAgentModule,
  useAgentResource,
  useAgentScreen,
  type AgentHookResult,
  type AgentActionProps,
  type AgentComponentProps,
  type AgentModulesProps,
  type AgentOptions,
  type AgentResourceProps,
  type AgentScreenHookResult,
  type AgentScreenOptions,
  type AgentSurfaceProps,
  useMobigentAction,
  useMobigentCapabilities,
  useMobigentCapabilityDefinition,
  useMobigentConnected,
  useMobigentConnection,
  useMobigentConnectionState,
  useMobigentComponent,
  useMobigentDiagnostics,
  useMobigentStatus,
  useMobigentEvent,
  useMobigentModule,
  useMobigentModuleDefinition,
  useMobigentModules,
  useMobigentSurface,
  useMobigentResource
} from "@mobigent/react-native";

const createNodeSocket: MobigentSocketFactory = (url) => new WebSocket(url);

test("React Native package exposes mobigent as primary singleton with legacy alias", () => {
  assert.equal(mobigent, intentBridge);
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class MockMobigentSocket implements MobigentSocket {
  readyState = 0;
  sent: string[] = [];
  private listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  private onceListeners = new Map<string, Set<(...args: unknown[]) => void>>();

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
    this.emitClose();
  }

  on(event: "open" | "error" | "message" | "close", listener: (...args: unknown[]) => void) {
    const listeners = this.listeners.get(event) ?? new Set<(...args: unknown[]) => void>();
    listeners.add(listener);
    this.listeners.set(event, listeners);
  }

  once(event: "open" | "error", listener: (...args: unknown[]) => void) {
    const listeners = this.onceListeners.get(event) ?? new Set<(...args: unknown[]) => void>();
    listeners.add(listener);
    this.onceListeners.set(event, listeners);
  }

  emitOpen() {
    this.readyState = 1;
    this.emit("open");
  }

  emitError(error: unknown = new Error("socket failed")) {
    this.emit("error", error);
  }

  emitClose() {
    this.emit("close");
  }

  emitMessage(data: string) {
    this.emit("message", data);
  }

  private emit(event: string, ...args: unknown[]) {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...args);
    }
    const onceListeners = this.onceListeners.get(event) ?? new Set<(...args: unknown[]) => void>();
    this.onceListeners.delete(event);
    for (const listener of onceListeners) {
      listener(...args);
    }
  }
}

async function waitFor(predicate: () => boolean, timeoutMs = 1_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) {
      return;
    }
    await delay(10);
  }
  throw new Error("Timed out waiting for condition.");
}

async function readStreamUntil(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  needle: string,
  timeoutMs = 1_000
) {
  const decoder = new TextDecoder();
  const deadline = Date.now() + timeoutMs;
  let buffer = "";

  while (Date.now() < deadline) {
    const remainingMs = deadline - Date.now();
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timed out waiting for stream data containing ${needle}.`)), remainingMs);
    });
    const result = await Promise.race([reader.read(), timeout]);
    if (result.done) {
      break;
    }
    buffer += decoder.decode(result.value, { stream: true });
    if (buffer.includes(needle)) {
      return buffer;
    }
  }

  throw new Error(`Timed out waiting for stream data containing ${needle}.`);
}

function signManifest(manifest: CapabilityManifest, secret: string) {
  return {
    alg: "hmac-sha256" as const,
    signature: createHmac("sha256", secret).update(canonicalJson(manifest)).digest("hex")
  };
}

test("gateway discovers app capabilities and routes action/resource calls", async () => {
  const port = 18_787;
  const gateway = new BridgeGateway(port);
  const bridge = new Mobigent();
  const created: Array<{ id: string; merchant: string; amount: number }> = [];

  gateway.start();

  bridge.configure({
    appId: "com.mobigent.test",
    appName: "Mobigent Test",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket,
    confirm: async () => true
  });

  bridge.registerAction({
    name: "create_expense",
    description: "Create a test expense.",
    inputSchema: {
      type: "object",
      properties: {
        merchant: { type: "string" },
        amount: { type: "number" }
      },
      required: ["merchant", "amount"]
    },
    confirmation: {
      required: true,
      risk: "medium"
    },
    handler: async (input) => {
      const expense = {
        id: `EXP-${created.length + 1}`,
        merchant: String(input.merchant),
        amount: Number(input.amount)
      };
      created.push(expense);
      return expense;
    }
  });

  bridge.registerResource({
    name: "expenses",
    description: "Read test expenses.",
    policy: {
      readOnly: true
    },
    read: async () => ({ expenses: created })
  });

  try {
    await bridge.connect();
    await delay(50);

    const tools = gateway.listTools();
    assert.deepEqual(
      tools.map((tool) => tool.name).sort(),
      ["com_mobigent_test.create_expense", "com_mobigent_test.get_expenses"]
    );

    const createdExpense = await gateway.callTool("com_mobigent_test.create_expense", {
      merchant: "Uber",
      amount: 28.5
    });
    assert.deepEqual(createdExpense, {
      id: "EXP-1",
      merchant: "Uber",
      amount: 28.5
    });

    const readResult = await gateway.callTool("com_mobigent_test.get_expenses", {});
    assert.deepEqual(readResult, {
      expenses: [
        {
          id: "EXP-1",
          merchant: "Uber",
          amount: 28.5
        }
      ]
    });
  } finally {
    bridge.disconnect();
    gateway.stop();
  }
});

test("gateway exposes app components as focusable tools", async () => {
  const port = 18_812;
  const gateway = new BridgeGateway(port);
  const bridge = new Mobigent();
  const focused: Array<{ expenseId?: string }> = [];

  gateway.start();

  bridge.configure({
    appId: "com.mobigent.components",
    appName: "Component App",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket
  });

  bridge.registerComponent({
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
      focused.push({ expenseId: String(props.expenseId) });
      return { focused: true, screen: "expense_detail", expenseId: props.expenseId };
    }
  });

  try {
    await bridge.connect();
    await delay(50);

    assert.deepEqual(
      gateway.listTools().map((tool) => tool.name),
      ["com_mobigent_components.show_expense_detail"]
    );

    await assert.rejects(
      () => gateway.callTool("com_mobigent_components.show_expense_detail", {}),
      /Invalid component props/
    );

    const result = await gateway.callTool("com_mobigent_components.show_expense_detail", {
      expenseId: "EXP-1001"
    });
    assert.deepEqual(result, {
      focused: true,
      screen: "expense_detail",
      expenseId: "EXP-1001"
    });
    assert.deepEqual(focused, [{ expenseId: "EXP-1001" }]);
  } finally {
    bridge.disconnect();
    gateway.stop();
  }
});

test("SDK unregisters capabilities and refreshes gateway tools", async () => {
  const port = 18_813;
  const gateway = new BridgeGateway(port);
  const bridge = new Mobigent();

  gateway.start();

  bridge.configure({
    appId: "com.mobigent.lifecycle",
    appName: "Lifecycle App",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket
  });

  bridge.registerAction({
    name: "temporary_action",
    description: "Temporary action.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ({ ok: true })
  });
  bridge.registerResource({
    name: "temporary_resource",
    description: "Temporary resource.",
    read: async () => ({ ok: true })
  });
  bridge.registerComponent({
    name: "temporary_screen",
    description: "Temporary screen.",
    focus: async () => ({ focused: true })
  });

  try {
    await bridge.connect();
    await delay(50);

    assert.deepEqual(
      gateway.listTools().map((tool) => tool.name).sort(),
      [
        "com_mobigent_lifecycle.get_temporary_resource",
        "com_mobigent_lifecycle.show_temporary_screen",
        "com_mobigent_lifecycle.temporary_action"
      ]
    );

    assert.equal(bridge.unregisterAction("temporary_action"), true);
    assert.equal(bridge.unregisterResource("temporary_resource"), true);
    assert.equal(bridge.unregisterComponent("temporary_screen"), true);
    assert.equal(bridge.unregisterAction("missing_action"), false);
    await delay(50);

    assert.deepEqual(gateway.listTools(), []);
  } finally {
    bridge.disconnect();
    gateway.stop();
  }
});

test("SDK rejects invalid capability names", () => {
  const bridge = new Mobigent();

  assert.throws(
    () =>
      bridge.registerAction({
        name: "bad-name",
        description: "Invalid action.",
        inputSchema: {
          type: "object",
          properties: {}
        },
        handler: async () => ({ ok: true })
      }),
    /Invalid capability name/
  );
});

test("SDK rejects duplicate capability names across registrations", () => {
  const bridge = new Mobigent();
  bridge.configure({
    appId: "com.mobigent.duplicates",
    appName: "Duplicates App",
    gatewayUrl: "ws://localhost:0",
    createSocket: createNodeSocket
  });

  bridge.registerAction({
    name: "shared_name",
    description: "Original action.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ({ ok: true })
  });

  assert.throws(
    () =>
      bridge.registerAction({
        name: "shared_name",
        description: "Duplicate action.",
        inputSchema: { type: "object", properties: {} },
        handler: async () => ({ ok: true })
      }),
    /Duplicate capability name/
  );
  assert.throws(
    () =>
      bridge.registerResource({
        name: "shared_name",
        description: "Duplicate resource.",
        read: async () => ({ ok: true })
      }),
    /Duplicate capability name/
  );
  assert.throws(
    () =>
      bridge.registerComponent({
        name: "shared_name",
        description: "Duplicate component.",
        focus: async () => ({ focused: true })
      }),
    /Duplicate capability name/
  );

  assert.equal(bridge.unregisterAction("shared_name"), true);
  bridge.registerResource({
    name: "shared_name",
    description: "Registered after cleanup.",
    read: async () => ({ ok: true })
  });
  assert.deepEqual(bridge.getManifest().resources.map((resource) => resource.name), ["shared_name"]);
});

test("SDK validates action input against declared schema before running handler", async () => {
  const port = 18_801;
  const gateway = new BridgeGateway(port);
  const bridge = new Mobigent();
  let handlerCalls = 0;

  gateway.start();

  bridge.configure({
    appId: "com.mobigent.validation",
    appName: "Validation App",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket
  });

  bridge.registerAction({
    name: "create_expense",
    description: "Create a validated expense.",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "number" },
        merchant: { type: "string" },
        reimbursable: { type: "boolean" }
      },
      required: ["amount", "merchant"]
    },
    handler: async () => {
      handlerCalls += 1;
      return { ok: true };
    }
  });

  try {
    await bridge.connect();
    await delay(50);

    await assert.rejects(
      () =>
        gateway.callTool("com_mobigent_validation.create_expense", {
          amount: "28.50",
          reimbursable: "yes"
        }),
      /Invalid action input/
    );

    assert.equal(handlerCalls, 0);

    const result = await gateway.callTool("com_mobigent_validation.create_expense", {
      amount: 28.5,
      merchant: "Uber",
      reimbursable: true
    });
    assert.deepEqual(result, { ok: true });
    assert.equal(handlerCalls, 1);
  } finally {
    bridge.disconnect();
    gateway.stop();
  }
});

test("SDK validates action output against declared schema before returning to agents", async () => {
  const port = 18_823;
  const gateway = new BridgeGateway(port);
  const bridge = new Mobigent();

  gateway.start();

  bridge.configure({
    appId: "com.mobigent.action_output",
    appName: "Action Output App",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket
  });

  bridge.registerAction({
    name: "valid_action",
    description: "Return valid output.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        ok: { type: "boolean" }
      },
      required: ["id", "ok"]
    },
    handler: async () => ({ id: "ACT-1", ok: true })
  });

  bridge.registerAction({
    name: "invalid_action",
    description: "Return invalid output.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        ok: { type: "boolean" }
      },
      required: ["id", "ok"]
    },
    handler: async () => ({ id: "ACT-2", ok: "yes" })
  });

  try {
    await bridge.connect();
    await delay(50);

    assert.deepEqual(await gateway.callTool("com_mobigent_action_output.valid_action", {}), {
      id: "ACT-1",
      ok: true
    });
    await assert.rejects(
      () => gateway.callTool("com_mobigent_action_output.invalid_action", {}),
      /Invalid action output: \$\.ok must be boolean/
    );
  } finally {
    bridge.disconnect();
    gateway.stop();
  }
});

test("SDK validates resource output against declared schema before returning to agents", async () => {
  const port = 18_822;
  const gateway = new BridgeGateway(port);
  const bridge = new Mobigent();

  gateway.start();

  bridge.configure({
    appId: "com.mobigent.resource_validation",
    appName: "Resource Validation App",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket
  });

  bridge.registerResource({
    name: "valid_expenses",
    description: "Valid expenses.",
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
    read: async () => ({
      expenses: [{ id: "EXP-1", amount: 12.5 }]
    })
  });

  bridge.registerResource({
    name: "invalid_expenses",
    description: "Invalid expenses.",
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
    read: async () => ({
      expenses: [{ id: "EXP-2", amount: "12.5" }]
    })
  });

  try {
    await bridge.connect();
    await delay(50);

    assert.deepEqual(
      await gateway.callTool("com_mobigent_resource_validation.get_valid_expenses", {}),
      {
        expenses: [{ id: "EXP-1", amount: 12.5 }]
      }
    );
    await assert.rejects(
      () => gateway.callTool("com_mobigent_resource_validation.get_invalid_expenses", {}),
      /Invalid resource output: \$\.expenses\[0\]\.amount must be number/
    );
  } finally {
    bridge.disconnect();
    gateway.stop();
  }
});

test("SDK publishes connection state changes", async () => {
  const port = 18_799;
  const gateway = new BridgeGateway(port);
  const bridge = new Mobigent();
  const states: string[] = [];

  gateway.start();
  bridge.subscribeConnection((state) => states.push(state));

  bridge.configure({
    appId: "com.mobigent.state",
    appName: "State App",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket
  });

  try {
    await bridge.connect();
    await delay(20);
    bridge.disconnect();
    await delay(20);

    assert.deepEqual(states, ["idle", "connecting", "connected", "disconnected"]);
  } finally {
    gateway.stop();
  }
});

test("SDK reconnects with exponential backoff and stops after max attempts", async () => {
  const bridge = new Mobigent();
  const states: string[] = [];
  const sockets: MockMobigentSocket[] = [];
  const createdAt: number[] = [];

  bridge.subscribeConnection((state) => states.push(state));
  bridge.configure({
    appId: "com.mobigent.reconnect",
    appName: "Reconnect App",
    gatewayUrl: "ws://localhost:19999",
    reconnect: {
      enabled: true,
      maxAttempts: 2,
      delayMs: 10,
      maxDelayMs: 25,
      backoffFactor: 2,
      jitterRatio: 0
    },
    createSocket: () => {
      const socket = new MockMobigentSocket();
      sockets.push(socket);
      createdAt.push(Date.now());
      setTimeout(() => {
        if (sockets.length === 1) {
          socket.emitOpen();
          return;
        }
        socket.emitError(new Error("offline"));
      }, 0);
      return socket;
    }
  });

  try {
    await bridge.connect();
    sockets[0]?.emitClose();
    await waitFor(() => bridge.getConnectionState() === "disconnected");

    assert.equal(sockets.length, 3);
    assert.ok(createdAt[1]! - createdAt[0]! >= 8);
    assert.ok(createdAt[2]! - createdAt[1]! >= 18);
    assert.deepEqual(states, ["idle", "connecting", "connected", "reconnecting", "disconnected"]);
  } finally {
    bridge.disconnect();
  }
});

test("SDK heartbeat closes stale sockets so reconnect can recover", async () => {
  const bridge = new Mobigent();
  const socket = new MockMobigentSocket();

  bridge.configure({
    appId: "com.mobigent.heartbeat",
    appName: "Heartbeat App",
    gatewayUrl: "ws://localhost:19999",
    heartbeat: {
      enabled: true,
      intervalMs: 10,
      timeoutMs: 10
    },
    createSocket: () => {
      setTimeout(() => socket.emitOpen(), 0);
      return socket;
    }
  });

  try {
    await bridge.connect();
    await waitFor(() => socket.sent.some((message) => JSON.parse(message).type === "ping"));
    await waitFor(() => bridge.getConnectionState() === "disconnected");

    const ping = socket.sent.map((message) => JSON.parse(message)).find((message) => message.type === "ping");
    assert.equal(typeof ping.id, "string");
    assert.equal(socket.readyState, 3);
  } finally {
    bridge.disconnect();
  }
});

test("SDK queues app events while disconnected and flushes them on connect", async () => {
  const bridge = new Mobigent();
  const socket = new MockMobigentSocket();

  bridge.configure({
    appId: "com.mobigent.event_queue",
    appName: "Event Queue App",
    gatewayUrl: "ws://localhost:19998",
    eventQueue: {
      enabled: true,
      maxSize: 2
    },
    createSocket: () => socket
  });

  assert.equal(bridge.emit("dropped.event", { order: 1 }), true);
  assert.equal(bridge.emit("kept.event.one", { order: 2 }), true);
  assert.equal(bridge.emit("kept.event.two", { order: 3 }), true);
  assert.equal(bridge.getQueuedEventCount(), 2);

  const connecting = bridge.connect();
  socket.emitOpen();
  await connecting;

  const events = socket.sent
    .map((message) => JSON.parse(message) as { type: string; name?: string; payload?: JsonObject })
    .filter((message) => message.type === "event");
  assert.deepEqual(
    events.map((event) => event.name),
    ["kept.event.one", "kept.event.two"]
  );
  assert.deepEqual(events.map((event) => event.payload?.order), [2, 3]);
  assert.equal(bridge.getQueuedEventCount(), 0);
});

test("SDK reports unqueued app events when event queue is disabled", () => {
  const bridge = new Mobigent();

  bridge.configure({
    appId: "com.mobigent.no_event_queue",
    appName: "No Event Queue App",
    gatewayUrl: "ws://localhost:19997"
  });

  assert.equal(bridge.emit("offline.event", { ok: true }), false);
  assert.equal(bridge.getQueuedEventCount(), 0);
});

test("React Native package exports React-first integration helpers", () => {
  assert.equal(typeof MobigentAction, "function");
  assert.equal(typeof MobigentCapabilities, "function");
  assert.equal(typeof MobigentComponent, "function");
  assert.equal(typeof createMobigentGatewayUrl, "function");
  assert.equal(typeof createMobigentGatewayUrlForPlatform, "function");
  assert.equal(typeof createMobigentEnvironment, "function");
  assert.equal(typeof createMobigentEnvironmentFromExpoConfig, "function");
  assert.equal(typeof createMobigentEnvironmentFromEnv, "function");
  assert.equal(typeof createMobigentCapabilityRegistry, "function");
  assert.equal(createAgentCapabilities, createMobigentCapabilityRegistry);
  assert.equal(createAgentEnvironment, createMobigentEnvironment);
  assert.equal(createAgentEnvironmentFromEnv, createMobigentEnvironmentFromEnv);
  assert.equal(createAgentEnvironmentFromExpoConfig, createMobigentEnvironmentFromExpoConfig);
  assert.equal(createAgentPolicy, createMobigentPolicy);
  assert.equal(applyAgentPolicy, applyMobigentPolicy);
  assert.equal(typeof applyMobigentPolicy, "function");
  assert.equal(typeof createMobigentPolicy, "function");
  assert.equal(typeof createMobigentStatus, "function");
  assert.equal(composeAgentCapabilities, composeMobigentCapabilities);
  assert.equal(typeof composeMobigentCapabilities, "function");
  assert.equal(typeof diagnoseMobigentCapabilities, "function");
  assert.equal(typeof formatMobigentCapabilityDiagnostics, "function");
  assert.equal(typeof createMobigentFeature, "function");
  assert.equal(createAgentFeature, createMobigentFeature);
  assert.equal(typeof createAgentModule, "function");
  assert.equal(typeof resolveMobigentProviderGatewayUrl, "function");
  assert.equal(defineAgentAction, defineMobigentAction);
  assert.equal(defineAgentCapabilities, defineMobigentCapabilities);
  assert.equal(defineAgentComponent, defineMobigentComponent);
  assert.equal(defineAgentFeature, defineMobigentFeature);
  assert.equal(defineAgentResource, defineMobigentResource);
  assert.equal(typeof defineMobigentAction, "function");
  assert.equal(typeof defineMobigentCapabilities, "function");
  assert.equal(typeof defineMobigentComponent, "function");
  assert.equal(typeof defineMobigentFeature, "function");
  assert.equal(typeof defineMobigentResource, "function");
  assert.equal(typeof formatMobigentDiagnostics, "function");
  assert.equal(typeof resolveMobigentAppIdentity, "function");
  assert.equal(typeof useAgent, "function");
  assert.equal(AgentAction, MobigentAction);
  assert.equal(AgentResource, MobigentResource);
  assert.equal(AgentComponent, MobigentComponent);
  assert.equal(AgentModules, MobigentModules);
  assert.equal(AgentSurface, MobigentSurface);
  assert.equal(useAgentAction, useMobigentAction);
  assert.equal(useAgentResource, useMobigentResource);
  assert.equal(useAgentComponent, useMobigentComponent);
  assert.equal(useAgentEvent, useMobigentEvent);
  assert.equal(useAgentModule, useMobigentModules);
  assert.equal(typeof useAgentScreen, "function");
  assert.equal(typeof useMobigentAction, "function");
  assert.equal(typeof useMobigentCapabilities, "function");
  assert.equal(typeof useMobigentConnection, "function");
  assert.equal(typeof useMobigentConnectionState, "function");
  assert.equal(typeof useMobigentConnected, "function");
  assert.equal(typeof useMobigentDiagnostics, "function");
  assert.equal(typeof useMobigentStatus, "function");
  assert.equal(typeof useMobigentCapabilityDefinition, "function");
  assert.equal(typeof useMobigentResource, "function");
  assert.equal(typeof useMobigentComponent, "function");
  assert.equal(typeof useMobigentEvent, "function");
  assert.equal(typeof useMobigentModuleDefinition, "function");
  assert.equal(typeof MobigentModules, "function");
  assert.equal(typeof useMobigentModules, "function");
  assert.equal(typeof MobigentSurface, "function");
  assert.equal(typeof useMobigentSurface, "function");
  assert.equal(typeof MobigentResource, "function");

  const hookFirstAction = {
    name: "profile_refresh",
    description: "Refresh profile data.",
    handler: async () => ({ ok: true })
  };
  useMobigentAction satisfies (
    action: typeof hookFirstAction,
    options?: { enabled?: boolean; deps?: readonly unknown[] }
  ) => void;
  type CreateAgentApp = (options: AgentAppFactoryOptions) => {
    Root: unknown;
    Provider: unknown;
    options: AgentAppFactoryOptions;
  };
  type CreateAgentExpoApp = (options: AgentExpoAppOptions) => {
    Root: unknown;
    Provider: unknown;
    options: AgentAppFactoryOptions;
  };
  type AgentAppComponent = (props: AgentAppProps) => unknown;
  const createAgentAppTypeCheck = undefined as unknown as CreateAgentApp;
  const createAgentExpoAppTypeCheck = undefined as unknown as CreateAgentExpoApp;
  const agentAppTypeCheck = undefined as unknown as AgentAppComponent;
  createAgentAppTypeCheck satisfies CreateAgentApp;
  createAgentExpoAppTypeCheck satisfies CreateAgentExpoApp;
  agentAppTypeCheck satisfies AgentAppComponent;
  const agentRootProps = {} as AgentAppRootProps;
  agentRootProps satisfies MobigentAppRootProps;
  useAgent satisfies (options?: AgentOptions) => AgentHookResult;
  const agentActionProps = {} as AgentActionProps;
  agentActionProps satisfies MobigentActionProps;
  const agentResourceProps = {} as AgentResourceProps;
  agentResourceProps satisfies MobigentResourceProps;
  const agentComponentProps = {} as AgentComponentProps;
  agentComponentProps satisfies MobigentComponentProps;
  const agentModulesProps = {} as AgentModulesProps;
  agentModulesProps satisfies MobigentModulesProps;
  const agentSurfaceProps = {} as AgentSurfaceProps;
  agentSurfaceProps satisfies MobigentSurfaceProps;
  const agentScreenOptions = {
    namespace: "profile",
    actions: [hookFirstAction],
    deps: ["profile_123"]
  } satisfies AgentScreenOptions;
  assert.equal(agentScreenOptions.namespace, "profile");
  useAgentScreen satisfies (options: AgentScreenOptions) => AgentScreenHookResult;
  useAgentAction satisfies (
    action: typeof hookFirstAction,
    options?: { enabled?: boolean; deps?: readonly unknown[] }
  ) => void;

  const hookFirstResource = {
    name: "profile_current",
    description: "Current profile.",
    read: async () => ({ id: "profile_123" })
  };
  useMobigentResource satisfies (
    resource: typeof hookFirstResource,
    options?: { enabled?: boolean; deps?: readonly unknown[] }
  ) => void;
  useAgentResource satisfies (
    resource: typeof hookFirstResource,
    options?: { enabled?: boolean; deps?: readonly unknown[] }
  ) => void;

  const hookFirstComponent = {
    name: "profile_screen",
    description: "Profile screen.",
    focus: async () => ({ focused: true })
  };
  useMobigentComponent satisfies (
    component: typeof hookFirstComponent,
    options?: { enabled?: boolean; deps?: readonly unknown[] }
  ) => void;
  useAgentComponent satisfies (
    component: typeof hookFirstComponent,
    options?: { enabled?: boolean; deps?: readonly unknown[] }
  ) => void;
});

test("React Native provider props support production signing and custom transports", () => {
  const signer: MobigentManifestSigner = (manifest) => ({
    alg: "hmac-sha256",
    keyId: "test",
    signature: `signed:${manifest.appId}`
  });
  const socketFactory: MobigentProviderProps["createSocket"] = () => new MockMobigentSocket();
  const props = {
    appId: "com.mobigent.react_production",
    appName: "React Production",
    gatewayUrl: "ws://localhost:8787",
    signManifest: signer,
    createSocket: socketFactory,
    enabled: false,
    children: null
  } satisfies MobigentProviderProps;

  assert.equal(typeof props.signManifest, "function");
  assert.equal(typeof props.createSocket, "function");
  assert.equal(props.enabled, false);
});

test("React Native app factory root accepts runtime provider overrides", () => {
  const DesignSystemConfirmation = (_props: MobigentConfirmationComponentProps) => null;
  const profileModule = createMobigentModule({
    id: "com.example.profile",
    capabilities: defineMobigentCapabilities({
      resources: [
        defineMobigentResource({
          name: "profile.current",
          description: "Read active profile.",
          read: () => ({ id: "profile_123" })
        })
      ]
    })
  });
  const props = {
    children: null,
    enabled: false,
    gatewayUrl: "wss://gateway.example.com:443",
    authToken: "test-token",
    modules: [profileModule],
    capabilityDeps: ["tenant_123"],
    preflight: {
      throwOnFailure: true,
      onReport: (report) => {
        assert.notEqual(report.status, "fail");
      }
    },
    ConfirmationComponent: DesignSystemConfirmation,
    confirmationModal: false
  } satisfies MobigentAppRootProps;

  assert.equal(props.enabled, false);
  assert.equal(props.gatewayUrl, "wss://gateway.example.com:443");
  assert.deepEqual(props.modules?.map((module) => module.id), ["com.example.profile"]);
  assert.deepEqual(props.capabilityDeps, ["tenant_123"]);
  assert.equal(typeof props.preflight, "object");
  assert.equal(props.ConfirmationComponent, DesignSystemConfirmation);

  const preflight = {
    enabled: true,
    throwOnFailure: false,
    onReport: (report) => assert.ok(report.summary.total >= 0)
  } satisfies MobigentAppPreflightOptions;
  assert.equal(preflight.enabled, true);
  assert.equal(preflight.throwOnFailure, false);
});

test("React Native UI exports a default status badge component", () => {
  const props = {
    showCount: false,
    status: {
      level: "ready",
      label: "Agent bridge ready",
      connected: true,
      connectionState: "connected",
      capabilityCount: 3,
      issueCount: 0,
      blockingIssueCount: 0,
      queuedEventCount: 0
    }
  } satisfies MobigentStatusBadgeProps;

  assert.equal(props.status.level, "ready");
  assert.equal(props.showCount, false);

  const panelProps = {
    title: "Agent support",
    showControls: false,
    showIssues: true
  } satisfies MobigentDiagnosticsPanelProps;
  assert.equal(panelProps.title, "Agent support");
  assert.equal(panelProps.showControls, false);
});

test("React Native provider resolves app identity from standard app object", () => {
  assert.deepEqual(
    resolveMobigentAppIdentity({ id: "com.mobigent.clean", name: "Clean App", version: "2.0.0" }),
    { id: "com.mobigent.clean", name: "Clean App", version: "2.0.0" }
  );
  assert.deepEqual(
    resolveMobigentAppIdentity(undefined, "com.mobigent.legacy", "Legacy App", "1.0.0"),
    { id: "com.mobigent.legacy", name: "Legacy App", version: "1.0.0" }
  );
  assert.deepEqual(
    resolveMobigentAppIdentity({ id: "com.mobigent.app", name: "App Object" }, "ignored", "Ignored", "1.0.0"),
    { id: "com.mobigent.app", name: "App Object", version: "1.0.0" }
  );
  assert.throws(
    () => resolveMobigentAppIdentity(undefined, "missing-name"),
    /Mobigent app identity is required/
  );
});

test("Expo app factory derives modern defaults from Expo config and public env", () => {
  const config = withMobigentExpoConfig(
    { name: "Expense AI", slug: "expense-ai", extra: { keep: "value" } },
    {
      app: {
        id: "com.example.expense",
        name: "Expense AI",
        version: "3.2.1"
      },
      mode: "hosted",
      host: "agent.example.com",
      authToken: "dev-token"
    }
  );

  assert.deepEqual(config.extra?.mobigent, {
    app: {
      id: "com.example.expense",
      name: "Expense AI",
      version: "3.2.1"
    },
    mode: "hosted",
    host: "agent.example.com",
    authToken: "dev-token"
  });
  assert.equal(config.extra?.keep, "value");

  assert.deepEqual(
    resolveMobigentExpoAppIdentity(config),
    {
      id: "com.example.expense",
      name: "Expense AI",
      version: "3.2.1"
    }
  );
  assert.deepEqual(createMobigentEnvironmentFromExpoConfig(config), {
    enabled: true,
    gateway: {
      host: "agent.example.com",
      port: 443,
      secure: true,
      path: undefined
    },
    authToken: "dev-token"
  });

  const options = {
    expo: { name: "Typed Expo", slug: "typed-expo" },
    env: {
      EXPO_PUBLIC_MOBIGENT_MODE: "hosted",
      EXPO_PUBLIC_MOBIGENT_HOST: "agent.example.com",
      EXPO_PUBLIC_MOBIGENT_AUTH_TOKEN: "dev-token"
    },
    fallback: { mode: "disabled" }
  } satisfies MobigentExpoAppOptions;
  assert.equal(options.fallback?.mode, "disabled");
  assert.equal(options.env?.EXPO_PUBLIC_MOBIGENT_HOST, "agent.example.com");
});

test("React Native diagnostics summarize configuration, capabilities, and warnings", () => {
  const bridge = new Mobigent();
  const unconfigured = bridge.getDiagnostics();

  assert.equal(unconfigured.configured, false);
  assert.equal(unconfigured.connectionState, "idle");
  assert.equal(unconfigured.capabilityCounts.total, 0);
  assert.equal(unconfigured.issues[0]?.code, "not_configured");
  assert.match(formatMobigentDiagnostics(unconfigured), /Mobigent app diagnostics: ERROR/);
  assert.match(formatMobigentDiagnostics(unconfigured), /\[ERROR\] not_configured/);
  assert.deepEqual(createMobigentStatus(unconfigured, { enabled: false }), {
    level: "disabled",
    label: "Agent bridge disabled",
    connected: false,
    connectionState: "idle",
    capabilityCount: 0,
    issueCount: 1,
    blockingIssueCount: 1,
    queuedEventCount: 0
  });

  bridge.configure({
    appId: "com.mobigent.diagnostics",
    appName: "Diagnostics App",
    gatewayUrl: "ws://localhost:19996",
    reconnect: true,
    heartbeat: true,
    eventQueue: true
  });
  bridge.registerAction({
    name: "create_note",
    description: "Create a note.",
    inputSchema: schema.object({ text: schema.string() }, { required: "all" }),
    handler: () => ({ ok: true })
  });
  bridge.emit("note.created", { id: "note_1" });

  const diagnostics = bridge.getDiagnostics();
  assert.equal(diagnostics.configured, true);
  assert.equal(diagnostics.appId, "com.mobigent.diagnostics");
  assert.equal(diagnostics.gatewayUrl, "ws://localhost:19996");
  assert.equal(diagnostics.capabilityCounts.actions, 1);
  assert.equal(diagnostics.capabilityCounts.total, 1);
  assert.equal(diagnostics.queuedEventCount, 1);
  assert.equal(diagnostics.reconnectEnabled, true);
  assert.equal(diagnostics.heartbeatEnabled, true);
  assert.ok(diagnostics.issues.some((issue) => issue.code === "not_connected"));
  assert.ok(diagnostics.issues.some((issue) => issue.code === "queued_events"));
  assert.deepEqual(createMobigentStatus(diagnostics), {
    level: "offline",
    label: "Agent bridge offline",
    connected: false,
    connectionState: "idle",
    capabilityCount: 1,
    issueCount: 2,
    blockingIssueCount: 0,
    queuedEventCount: 1
  });
  assert.match(formatMobigentDiagnostics(diagnostics), /Mobigent app diagnostics: OK/);
  assert.match(formatMobigentDiagnostics(diagnostics), /capabilities: 1 total, 1 actions, 0 resources, 0 components/);
  assert.doesNotMatch(
    formatMobigentDiagnostics(diagnostics, { includeGatewayUrl: false, includeIssues: false }),
    /gateway:|issues:/
  );
});

test("React Native gateway URL helper handles simulator and device targets", () => {
  assert.equal(createMobigentGatewayUrl(), "ws://localhost:8787");
  assert.equal(
    createMobigentGatewayUrl({ target: "android-emulator" }),
    "ws://10.0.2.2:8787"
  );
  assert.equal(
    createMobigentGatewayUrl({ target: "ios-simulator", port: 19000, path: "bridge" }),
    "ws://localhost:19000/bridge"
  );
  assert.equal(
    createMobigentGatewayUrl({
      target: "device",
      host: "192.168.1.20",
      port: 443,
      secure: true,
      path: "/mobigent"
    }),
    "wss://192.168.1.20:443/mobigent"
  );
  assert.equal(
    createMobigentGatewayUrlForPlatform("android"),
    "ws://10.0.2.2:8787"
  );
  assert.equal(
    createMobigentGatewayUrlForPlatform("ios", { port: 9000 }),
    "ws://localhost:9000"
  );
  assert.equal(
    createMobigentGatewayUrlForPlatform("android", { deviceHost: "192.168.1.30" }),
    "ws://192.168.1.30:8787"
  );
  assert.equal(
    createMobigentGatewayUrlForPlatform("web", { host: "gateway.example.com", secure: true, port: 443 }),
    "wss://gateway.example.com:443"
  );
  assert.equal(
    resolveMobigentProviderGatewayUrl(undefined, { platform: "android" }),
    "ws://10.0.2.2:8787"
  );
  assert.equal(
    resolveMobigentProviderGatewayUrl(undefined, { platform: "ios", port: 9000 }),
    "ws://localhost:9000"
  );
  assert.equal(
    resolveMobigentProviderGatewayUrl("ws://custom.example/bridge", { platform: "android" }),
    "ws://custom.example/bridge"
  );
  assert.deepEqual(createMobigentEnvironment({ mode: "local", platform: "android" }), {
    enabled: true,
    gateway: { platform: "android", port: undefined, secure: undefined, path: undefined },
    authToken: undefined
  });
  assert.deepEqual(createMobigentEnvironment({ mode: "device", deviceHost: "192.168.1.30", port: 8787 }), {
    enabled: true,
    gateway: {
      platform: undefined,
      target: "device",
      deviceHost: "192.168.1.30",
      host: undefined,
      port: 8787,
      secure: undefined,
      path: undefined
    },
    authToken: undefined
  });
  assert.deepEqual(createMobigentEnvironment({ mode: "hosted", host: "gateway.example.com", authToken: "secret" }), {
    enabled: true,
    gateway: { host: "gateway.example.com", port: 443, secure: true, path: undefined },
    authToken: "secret"
  });
  assert.deepEqual(createMobigentEnvironment({ mode: "disabled" }), {
    enabled: false,
    authToken: undefined
  });
  assert.deepEqual(createMobigentEnvironment({ gatewayUrl: "wss://gateway.example.com/bridge" }), {
    enabled: true,
    gatewayUrl: "wss://gateway.example.com/bridge",
    authToken: undefined
  });
  assert.deepEqual(
    createMobigentEnvironmentFromEnv({
      env: {
        EXPO_PUBLIC_MOBIGENT_MODE: "hosted",
        EXPO_PUBLIC_MOBIGENT_HOST: "gateway.example.com",
        EXPO_PUBLIC_MOBIGENT_AUTH_TOKEN: "secret"
      }
    }),
    {
      enabled: true,
      gateway: { host: "gateway.example.com", port: 443, secure: true, path: undefined },
      authToken: "secret"
    }
  );
  assert.deepEqual(
    createMobigentEnvironmentFromEnv({
      env: {
        REACT_NATIVE_MOBIGENT_MODE: "device",
        REACT_NATIVE_MOBIGENT_DEVICE_HOST: "192.168.1.40",
        REACT_NATIVE_MOBIGENT_PORT: "9000",
        REACT_NATIVE_MOBIGENT_PLATFORM: "android"
      }
    }),
    {
      enabled: true,
      gateway: {
        platform: "android",
        target: "device",
        deviceHost: "192.168.1.40",
        host: undefined,
        port: 9000,
        secure: undefined,
        path: undefined
      },
      authToken: undefined
    }
  );
  assert.deepEqual(
    createMobigentEnvironmentFromEnv({
      env: { MOBIGENT_ENABLED: "false", MOBIGENT_AUTH_TOKEN: "kept-for-later" },
      fallback: { mode: "hosted", host: "gateway.example.com" }
    }),
    {
      enabled: false,
      authToken: "kept-for-later"
    }
  );
  assert.throws(() => createMobigentEnvironment({ mode: "device" }), /requires deviceHost or host/);
  assert.throws(() => createMobigentEnvironment({ mode: "hosted" }), /requires host or gatewayUrl/);
});

test("React Native capability definition helpers create mountable kits", () => {
  assert.deepEqual(createMobigentPolicy("read-only"), {
    policy: { readOnly: true }
  });
  assert.deepEqual(
    createMobigentPolicy("confirmed", {
      title: "Approve expense?",
      allowedAgents: ["finance-agent"],
      rateLimitPerMinute: 5
    }),
    {
      policy: {
        foregroundOnly: true,
        requiresUser: true,
        allowedAgents: ["finance-agent"],
        rateLimitPerMinute: 5
      },
      confirmation: {
        required: true,
        title: "Approve expense?",
        risk: "medium"
      }
    }
  );
  assert.deepEqual(
    createMobigentPolicy("destructive", {
      title: "Delete expense?",
      policy: { rateLimitPerMinute: 1 },
      confirmation: { required: true, risk: "high", message: "This cannot be undone." }
    }),
    {
      policy: {
        foregroundOnly: true,
        requiresUser: true,
        rateLimitPerMinute: 1
      },
      confirmation: {
        required: true,
        title: "Delete expense?",
        risk: "high",
        message: "This cannot be undone."
      }
    }
  );
  const createExpense = defineMobigentAction({
    name: "expense.create",
    description: "Create an expense.",
    inputSchema: schema.object({ merchant: schema.string() }, { required: "all" }),
    ...createMobigentPolicy("confirmed", { title: "Create expense?" }),
    handler: () => ({ id: "exp_123" })
  });
  const listExpenses = defineMobigentResource({
    name: "expense.list",
    description: "List expenses.",
    read: () => ({ expenses: [] })
  });
  const expenseDetail = defineMobigentComponent({
    name: "expense.detail",
    description: "Focus an expense detail screen.",
    propsSchema: schema.object({ id: schema.string() }, { required: "all" }),
    focus: () => ({ focused: true })
  });

  const kit = defineMobigentCapabilities({
    actions: [createExpense],
    resources: [listExpenses],
    components: [expenseDetail]
  });
  const settings = defineMobigentCapabilities({
    actions: [
      defineMobigentAction({
        name: "settings.open",
        description: "Open settings.",
        inputSchema: schema.object(),
        handler: () => ({ opened: true })
      })
    ]
  });
  const composed = composeMobigentCapabilities(kit, settings, false, {
    resources: [
      defineMobigentResource({
        name: "profile.read",
        description: "Read profile.",
        read: () => ({ name: "Ada" })
      })
    ]
  });

  assert.deepEqual(kit.actions, [createExpense]);
  assert.deepEqual(kit.resources, [listExpenses]);
  assert.deepEqual(kit.components, [expenseDetail]);
  assert.equal(typeof kit.useRegister, "function");
  assert.equal(typeof kit.Component, "function");
  const guarded = applyMobigentPolicy(
    kit,
    createMobigentPolicy("confirmed", {
      title: "Approve module action?",
      allowedAgents: ["finance-agent"],
      rateLimitPerMinute: 3,
      sensitiveData: ["expense"]
    })
  );

  assert.deepEqual(guarded.actions[0]?.policy, {
    foregroundOnly: true,
    requiresUser: true,
    allowedAgents: ["finance-agent"],
    rateLimitPerMinute: 3,
    sensitiveData: ["expense"]
  });
  assert.deepEqual(guarded.actions[0]?.confirmation, {
    required: true,
    title: "Create expense?",
    risk: "medium"
  });
  assert.deepEqual(guarded.resources[0]?.policy, {
    foregroundOnly: true,
    requiresUser: true,
    allowedAgents: ["finance-agent"],
    rateLimitPerMinute: 3,
    sensitiveData: ["expense"]
  });
  assert.deepEqual(guarded.components[0]?.policy, {
    foregroundOnly: true,
    requiresUser: true,
    allowedAgents: ["finance-agent"],
    rateLimitPerMinute: 3,
    sensitiveData: ["expense"]
  });
  assert.deepEqual(
    composed.actions.map((action) => action.name),
    ["expense.create", "settings.open"]
  );
  assert.deepEqual(
    composed.resources.map((resource) => resource.name),
    ["expense.list", "profile.read"]
  );
  assert.deepEqual(
    composed.components.map((component) => component.name),
    ["expense.detail"]
  );
  assert.equal(typeof composed.useRegister, "function");
  assert.equal(typeof composed.Component, "function");
  const diagnostics = diagnoseMobigentCapabilities(
    defineMobigentCapabilities({
      actions: [
        defineMobigentAction({
          name: "expense_create",
          description: "Create an expense.",
          inputSchema: schema.object({ merchant: schema.string() }, { required: "all" }),
          outputSchema: schema.object({ id: schema.string() }, { required: "all" }),
          ...createMobigentPolicy("confirmed", { allowedAgents: ["finance-agent"] }),
          handler: () => ({ id: "exp_123" })
        })
      ],
      resources: [
        defineMobigentResource({
          name: "expense_list",
          description: "List expenses.",
          outputSchema: schema.object({ expenses: schema.array(schema.object()) }),
          read: () => ({ expenses: [] })
        })
      ]
    }),
    { app: { id: "com.example.expenses", name: "Expenses" } }
  );
  assert.equal(diagnostics.status, "pass");
  assert.deepEqual(diagnostics.summary, { actions: 1, resources: 1, components: 0, total: 2 });
  assert.match(formatMobigentCapabilityDiagnostics(diagnostics), /Mobigent capability diagnostics: PASS/);

  const unsafeDiagnostics = diagnoseMobigentCapabilities(
    defineMobigentCapabilities({
      actions: [
        defineMobigentAction({
          name: "unsafe_action",
          description: "Send sensitive data.",
          inputSchema: schema.object(),
          policy: { requiresUser: true, sensitiveData: ["token"] },
          handler: () => ({ ok: true })
        })
      ]
    })
  );
  assert.equal(unsafeDiagnostics.status, "warn");
  assert.equal(unsafeDiagnostics.checks.find((check) => check.name === "safety-policy")?.status, "warn");

  const invalidNameDiagnostics = diagnoseMobigentCapabilities(
    defineMobigentCapabilities({
      actions: [
        defineMobigentAction({
          name: "expense.create",
          description: "Create an expense.",
          inputSchema: schema.object(),
          handler: () => ({ ok: true })
        })
      ]
    })
  );
  assert.equal(invalidNameDiagnostics.status, "fail");
  assert.match(invalidNameDiagnostics.errors.join("\n"), /letters, numbers, and underscores/);

  const duplicateDiagnostics = diagnoseMobigentCapabilities([
    defineMobigentCapabilities({
      actions: [
        defineMobigentAction({
          name: "duplicate_tool",
          description: "First.",
          inputSchema: schema.object(),
          handler: () => ({ ok: true })
        })
      ]
    }),
    defineMobigentCapabilities({
      resources: [
        defineMobigentResource({
          name: "duplicate_tool",
          description: "Second.",
          read: () => ({ ok: true })
        })
      ]
    })
  ]);
  assert.equal(duplicateDiagnostics.status, "fail");
  assert.match(duplicateDiagnostics.errors.join("\n"), /Duplicate capability name/);
  const registry = createMobigentCapabilityRegistry(kit);
  const registrySnapshots: string[][] = [];
  const unsubscribeRegistry = registry.subscribe(() => {
    registrySnapshots.push(registry.actions.map((action) => action.name));
  });
  assert.deepEqual(
    registry.actions.map((action) => action.name),
    ["expense.create"]
  );
  registry.add(settings, {
    resources: [
      defineMobigentResource({
        name: "workspace.read",
        description: "Read active workspace.",
        read: () => ({ id: "workspace_123" })
      })
    ]
  });
  assert.deepEqual(
    registry.getCapabilities().actions.map((action) => action.name),
    ["expense.create", "settings.open"]
  );
  assert.deepEqual(registrySnapshots.at(-1), ["expense.create", "settings.open"]);
  assert.deepEqual(
    registry.resources.map((resource) => resource.name),
    ["expense.list", "workspace.read"]
  );
  registry.remove(settings);
  assert.deepEqual(
    registry.actions.map((action) => action.name),
    ["expense.create"]
  );
  registry.clear();
  assert.deepEqual(registry.actions, []);
  assert.deepEqual(registrySnapshots, [
    ["expense.create", "settings.open"],
    ["expense.create"],
    []
  ]);
  unsubscribeRegistry();
  registry.add(settings);
  assert.deepEqual(registrySnapshots, [
    ["expense.create", "settings.open"],
    ["expense.create"],
    []
  ]);
  assert.equal(typeof registry.useRegister, "function");
  assert.equal(typeof registry.Component, "function");
  assert.throws(
    () =>
      composeMobigentCapabilities(kit, {
        actions: [
          defineMobigentAction({
            name: "expense.list",
            description: "Duplicate resource name.",
            inputSchema: schema.object(),
            handler: () => ({ ok: true })
          })
        ]
      }),
    /Duplicate capability name "expense.list" while composing Mobigent capabilities/
  );
});

test("React Native feature helper namespaces local capability names", () => {
  const expenseFeature = defineMobigentFeature({
    namespace: "expense",
    actions: [
      defineMobigentAction({
        name: "create",
        description: "Create an expense.",
        inputSchema: schema.object(),
        handler: () => ({ ok: true })
      }),
      defineMobigentAction({
        name: "expense_sync",
        description: "Sync expenses.",
        inputSchema: schema.object(),
        handler: () => ({ ok: true })
      })
    ],
    resources: [
      defineMobigentResource({
        name: "list",
        description: "List expenses.",
        read: () => ({ expenses: [] })
      })
    ],
    components: [
      defineMobigentComponent({
        name: "detail",
        description: "Open expense detail.",
        propsSchema: schema.object({ id: schema.string() }, { required: "all" }),
        focus: () => ({ focused: true })
      })
    ]
  });

  assert.deepEqual(
    expenseFeature.actions.map((action) => action.name),
    ["expense_create", "expense_sync"]
  );
  assert.deepEqual(
    expenseFeature.resources.map((resource) => resource.name),
    ["expense_list"]
  );
  assert.deepEqual(
    expenseFeature.components.map((component) => component.name),
    ["expense_detail"]
  );
  assert.throws(
    () =>
      defineMobigentFeature({
        namespace: "expense-report",
        actions: []
      }),
    /Invalid Mobigent feature namespace/
  );
  assert.throws(
    () =>
      defineMobigentFeature({
        namespace: "expense",
        actions: [
          defineMobigentAction({
            name: "create-report",
            description: "Invalid local name.",
            inputSchema: schema.object(),
            handler: () => ({ ok: true })
          })
        ]
      }),
    /Invalid Mobigent feature capability name/
  );
});

test("React Native feature factory creates namespaced feature modules", () => {
  const expense = createMobigentFeature("expense");
  const createExpense = expense.action({
    name: "create",
    description: "Create an expense.",
    inputSchema: schema.object({ merchant: schema.string() }, { required: "all" }),
    handler: () => ({ ok: true })
  });
  const listExpenses = expense.resource({
    name: "list",
    description: "List expenses.",
    read: () => ({ expenses: [] })
  });
  const expenseDetail = expense.component({
    name: "detail",
    description: "Open expense detail.",
    propsSchema: schema.object({ id: schema.string() }, { required: "all" }),
    focus: () => ({ focused: true })
  });
  const kit = expense.capabilities({
    actions: [createExpense],
    resources: [listExpenses],
    components: [expenseDetail]
  });

  assert.equal(expense.namespace, "expense");
  assert.equal(createExpense.name, "expense_create");
  assert.equal(listExpenses.name, "expense_list");
  assert.equal(expenseDetail.name, "expense_detail");
  assert.deepEqual(
    kit.actions.map((action) => action.name),
    ["expense_create"]
  );
  assert.deepEqual(
    kit.resources.map((resource) => resource.name),
    ["expense_list"]
  );
  assert.deepEqual(
    kit.components.map((component) => component.name),
    ["expense_detail"]
  );
  assert.throws(() => createMobigentFeature("expense-report"), /Invalid Mobigent feature namespace/);
});

test("React Native modules package feature capabilities for app-level installation", () => {
  const expense = createMobigentFeature("expense");
  const profile = createMobigentFeature("profile");
  const expenseCapabilities = expense.capabilities({
    actions: [
      expense.action({
        name: "create",
        description: "Create an expense.",
        inputSchema: schema.object({ merchant: schema.string() }, { required: "all" }),
        handler: () => ({ ok: true })
      })
    ]
  });
  const profileCapabilities = profile.capabilities({
    resources: [
      profile.resource({
        name: "current",
        description: "Read the active profile.",
        read: () => ({ id: "profile-1" })
      })
    ]
  });

  const module = createMobigentModule({
    id: "com.example.expenses",
    name: "Expense module",
    version: "1.0.0",
    capabilities: [expenseCapabilities, profileCapabilities]
  });
  const registry = createMobigentCapabilityRegistry().install(module);

  assert.equal(module.id, "com.example.expenses");
  assert.equal(module.name, "Expense module");
  assert.equal(module.version, "1.0.0");
  assert.equal(typeof MobigentModuleMount, "function");
  assert.equal(typeof MobigentModules, "function");
  assert.equal(typeof MobigentSurface, "function");
  assert.equal(typeof useMobigentModule, "function");
  assert.equal(typeof useMobigentModules, "function");
  assert.equal(typeof useMobigentSurface, "function");
  const surfaceProps = {
    children: null,
    modules: module,
    enabled: true,
    deps: ["workspace-1"]
  } satisfies MobigentSurfaceProps;
  assert.equal(surfaceProps.modules, module);
  assert.deepEqual(
    module.actions.map((action) => action.name),
    ["expense_create"]
  );
  assert.deepEqual(
    registry.getCapabilities().resources.map((resource) => resource.name),
    ["profile_current"]
  );
  registry.install(module);
  assert.deepEqual(
    registry.getCapabilities().actions.map((action) => action.name),
    ["expense_create"]
  );
  assert.deepEqual(registry.getModules(), [
    {
      id: "com.example.expenses",
      name: "Expense module",
      version: "1.0.0",
      actions: ["expense_create"],
      resources: ["profile_current"],
      components: []
    }
  ]);
  registry.remove(module);
  assert.deepEqual(registry.getModules(), []);
  assert.deepEqual(registry.getCapabilities().actions, []);
  registry.install(module);
  assert.deepEqual(registry.getModules().map((installedModule) => installedModule.id), ["com.example.expenses"]);
  assert.throws(
    () =>
      createMobigentModule({
        id: "expense module",
        capabilities: expenseCapabilities
      }),
    /Invalid Mobigent module id/
  );
});

test("React Native agent module API creates namespaced modules directly", () => {
  const module = createAgentModule({
    namespace: "task",
    actions: [
      {
        name: "create",
        description: "Create a task.",
        inputSchema: schema.object({ title: schema.string() }, { required: "all" }),
        handler: () => ({ ok: true })
      }
    ],
    resources: [
      {
        name: "list",
        description: "List tasks.",
        read: () => ({ items: [] })
      }
    ]
  });

  assert.equal(module.id, "mobigent.task");
  assert.equal(module.name, "task feature");
  assert.deepEqual(module.actions.map((action) => action.name), ["task_create"]);
  assert.deepEqual(module.resources.map((resource) => resource.name), ["task_list"]);
  assert.throws(
    () =>
      createAgentModule({
        namespace: "bad-name",
        actions: []
      }),
    /Invalid Mobigent feature namespace/
  );
});

test("React Native init CLI generates a standard app integration scaffold", async () => {
  const files = createReactNativeStarterFiles({
    appId: "com.mobigent.demo",
    appName: "Demo App",
    appVersion: "1.2.3",
    feature: "expense",
    outDir: "src",
    dryRun: true,
    force: false,
    doctor: false,
    manifest: false,
    contract: false
  });
  const rootFile = files.find((file) => file.path === join("src", "mobigent.tsx"));
  const featureFile = files.find((file) => file.path === join("src", "mobigent-features", "expense.ts"));

  assert.ok(rootFile);
  assert.ok(featureFile);
  assert.match(rootFile.contents, /mobigentApp/);
  assert.match(rootFile.contents, /@mobigent\/react-native/);
  assert.match(rootFile.contents, /features: \[expenseFeature\]/);
  assert.doesNotMatch(rootFile.contents, /createMobigentEnvironmentFromEnv/);
  assert.doesNotMatch(rootFile.contents, /createMobigentCapabilityRegistry/);
  assert.match(rootFile.contents, /MobigentRootProps/);
  assert.doesNotMatch(rootFile.contents, /mobigentEnvironment/);
  assert.doesNotMatch(rootFile.contents, /mobigentCapabilities/);
  assert.match(rootFile.contents, /com.mobigent.demo/);
  assert.doesNotMatch(rootFile.contents, /modules: \[expenseModule\]/);
  assert.doesNotMatch(rootFile.contents, /\.\.\.mobigentEnvironment/);
  assert.match(rootFile.contents, /expenseFeature/);
  assert.doesNotMatch(featureFile.contents, /createAgentModule/);
  assert.match(featureFile.contents, /@mobigent\/react-native/);
  assert.match(featureFile.contents, /feature\("expense"\)/);
  assert.match(featureFile.contents, /export const expenseFeature/);
  assert.match(featureFile.contents, /\.write\("create"/);

  const expoFiles = createReactNativeStarterFiles({
    appId: "com.mobigent.expo",
    appName: "Expo App",
    feature: "expense",
    outDir: "src",
    dryRun: true,
    force: false,
    doctor: false,
    manifest: false,
    contract: false,
    customConfirmation: false,
    expo: true
  });
  const expoRootFile = expoFiles.find((file) => file.path === join("src", "mobigent.tsx"));
  assert.ok(expoRootFile);
  assert.doesNotMatch(expoRootFile.contents, /expo-constants/);
  assert.match(expoRootFile.contents, /mobigentApp/);
  assert.match(expoRootFile.contents, /@mobigent\/react-native/);
  assert.doesNotMatch(expoRootFile.contents, /Constants\.expoConfig/);
  assert.doesNotMatch(expoRootFile.contents, /createMobigentEnvironmentFromEnv/);

  const expoRouterFiles = createReactNativeStarterFiles({
    appId: "com.mobigent.router",
    appName: "Expo Router App",
    feature: "expense",
    outDir: "src",
    dryRun: true,
    force: false,
    doctor: false,
    manifest: false,
    contract: false,
    customConfirmation: false,
    expo: true,
    expoRouter: true
  });
  const expoRouterLayoutFile = expoRouterFiles.find((file) => file.path === join("app", "_layout.tsx"));
  assert.ok(expoRouterLayoutFile);
  assert.match(expoRouterLayoutFile.contents, /expo-router/);
  assert.match(expoRouterLayoutFile.contents, /Stack/);
  assert.match(expoRouterLayoutFile.contents, /MobigentRoot/);
  assert.match(expoRouterLayoutFile.contents, /from "\.\.\/src\/mobigent"/);

  const featureOnlyFiles = createReactNativeFeatureFiles({
    feature: "invoice",
    outDir: "src"
  });
  assert.deepEqual(
    featureOnlyFiles.map((file) => file.path),
    [join("src", "mobigent-features", "invoice.ts")]
  );
  assert.match(featureOnlyFiles[0]?.contents ?? "", /feature\("invoice"\)/);
  assert.match(featureOnlyFiles[0]?.contents ?? "", /export const invoiceFeature/);

  const featureOnlyStarterFiles = createReactNativeStarterFiles({
    appId: "",
    appName: "",
    feature: "invoice",
    outDir: "src",
    dryRun: true,
    force: false,
    doctor: false,
    manifest: false,
    contract: false,
    featureOnly: true,
    customConfirmation: false
  });
  assert.deepEqual(
    featureOnlyStarterFiles.map((file) => file.path),
    [join("src", "mobigent-features", "invoice.ts")]
  );

  const envTemplate = createReactNativeEnvTemplate({ gatewayUrl: "ws://localhost:9000" });
  assert.match(envTemplate, /EXPO_PUBLIC_MOBIGENT_MODE=local/);
  assert.match(envTemplate, /EXPO_PUBLIC_MOBIGENT_GATEWAY_URL=ws:\/\/localhost:9000/);
  assert.match(envTemplate, /EXPO_PUBLIC_MOBIGENT_DEVICE_HOST/);
  assert.match(envTemplate, /EXPO_PUBLIC_MOBIGENT_AUTH_TOKEN/);

  const customConfirmationFiles = createReactNativeStarterFiles({
    appId: "com.mobigent.demo",
    appName: "Demo App",
    feature: "expense",
    outDir: "src",
    dryRun: true,
    force: false,
    doctor: false,
    manifest: false,
    contract: false,
    customConfirmation: true
  });
  const customRootFile = customConfirmationFiles.find((file) => file.path === join("src", "mobigent.tsx"));
  const confirmationFile = customConfirmationFiles.find((file) => file.path === join("src", "mobigent-confirmation.tsx"));
  assert.ok(customRootFile);
  assert.ok(confirmationFile);
  assert.match(customRootFile.contents, /ConfirmationComponent: MobigentAgentApproval/);
  assert.match(confirmationFile.contents, /useMobigentConfirmation/);

  let stdout = "";
  let stderr = "";
  const dryRunCode = runReactNativeInitCli(
    [
      "--app-id",
      "com.mobigent.demo",
      "--app-name",
      "Demo App",
      "--feature",
      "expense",
      "--out-dir",
      "src",
      "--dry-run"
    ],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream
  );

	  assert.equal(dryRunCode, 0);
	  assert.equal(stderr, "");
	  assert.match(stdout, /mobigent\.tsx/);
	  assert.match(stdout, /mobigent-features/);

	  stdout = "";
	  stderr = "";
	  const initDryRunCode = runReactNativeInitCli(
	    [
	      "--app-id",
	      "com.mobigent.init",
	      "--app-name",
	      "Init App",
	      "--feature",
	      "expense",
	      "--out-dir",
	      "src",
	      "--dry-run"
	    ],
	    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
	    { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream,
	    "mobigent-init"
	  );
	  assert.equal(initDryRunCode, 0);
	  assert.equal(stderr, "");
	  assert.match(stdout, /mobigentApp/);
	  assert.doesNotMatch(stdout, /expo-constants/);

	  stdout = "";
	  stderr = "";
	  const initBareDryRunCode = runReactNativeInitCli(
	    [
	      "--app-id",
	      "com.mobigent.bare",
	      "--app-name",
	      "Bare App",
	      "--feature",
	      "expense",
	      "--out-dir",
	      "src",
	      "--react-native",
	      "--dry-run"
	    ],
	    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
	    { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream,
	    "mobigent-init"
	  );
	  assert.equal(initBareDryRunCode, 0);
	  assert.equal(stderr, "");
	  assert.match(stdout, /mobigentApp/);
	  assert.doesNotMatch(stdout, /expo-constants/);

	  stdout = "";
	  stderr = "";
	  const expoDryRunCode = runReactNativeInitCli(
    [
      "--app-id",
      "com.mobigent.expo",
      "--app-name",
      "Expo App",
      "--feature",
      "expense",
      "--out-dir",
      "src",
      "--expo",
      "--dry-run"
    ],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream
  );
  assert.equal(expoDryRunCode, 0);
  assert.equal(stderr, "");
  assert.match(stdout, /mobigentApp/);
  assert.doesNotMatch(stdout, /expo-constants/);

  stdout = "";
  stderr = "";
  const expoRouterDryRunCode = runReactNativeInitCli(
    [
      "--app-id",
      "com.mobigent.router",
      "--app-name",
      "Expo Router App",
      "--feature",
      "expense",
      "--out-dir",
      "src",
      "--expo-router",
      "--dry-run"
    ],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream
  );
  assert.equal(expoRouterDryRunCode, 0);
  assert.equal(stderr, "");
  assert.match(stdout, /app[\\/]_layout\.tsx/);
  assert.match(stdout, /expo-router/);
  assert.match(stdout, /MobigentRoot/);

  stdout = "";
  stderr = "";
  const envTemplateCode = runReactNativeInitCli(
    ["--env-template", "--gateway-url", "ws://localhost:9000"],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream
  );
  assert.equal(envTemplateCode, 0);
  assert.equal(stderr, "");
  assert.match(stdout, /EXPO_PUBLIC_MOBIGENT_GATEWAY_URL=ws:\/\/localhost:9000/);

  stdout = "";
  stderr = "";
  const featureOnlyCode = runReactNativeInitCli(
    ["--feature", "invoice", "--out-dir", "src", "--feature-only", "--dry-run"],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream
  );
  assert.equal(featureOnlyCode, 0);
  assert.equal(stderr, "");
  assert.match(stdout, /invoiceFeature/);
  assert.doesNotMatch(stdout, /mobigent\.tsx/);

  const dir = await mkdtemp(join(tmpdir(), "mobigent-rn-init-"));
  const envPath = join(dir, ".env.mobigent");
  const writeEnvCode = runReactNativeInitCli(
    ["--write-env", envPath, "--gateway-url", "wss://gateway.example.com"],
    { write: () => undefined } as NodeJS.WritableStream,
    { write: () => undefined } as NodeJS.WritableStream
  );
  assert.equal(writeEnvCode, 0);
  assert.match(await readFile(envPath, "utf8"), /EXPO_PUBLIC_MOBIGENT_GATEWAY_URL=wss:\/\/gateway.example.com/);

  const writeCode = runReactNativeInitCli(
    ["--app-id", "com.mobigent.demo", "--app-name", "Demo App", "--feature", "task", "--out-dir", dir],
    { write: () => undefined } as NodeJS.WritableStream,
    { write: () => undefined } as NodeJS.WritableStream
  );

  assert.equal(writeCode, 0);
  assert.match(await readFile(join(dir, "mobigent.tsx"), "utf8"), /taskFeature/);
  const taskFeatureFile = await readFile(join(dir, "mobigent-features", "task.ts"), "utf8");
  assert.match(taskFeatureFile, /feature\("task"\)/);
  assert.match(taskFeatureFile, /export const taskFeature/);
  await rm(dir, { force: true, recursive: true });

  assert.equal(
    runReactNativeInitCli(
      ["--app-id", "com.mobigent.demo", "--app-name", "Demo App", "--feature", "bad-name", "--dry-run"],
      { write: () => undefined } as NodeJS.WritableStream,
      { write: () => undefined } as NodeJS.WritableStream
    ),
    1
  );
});

test("React Native init CLI diagnoses local integration setup", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mobigent-rn-doctor-"));
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify({
      dependencies: {
        "@mobigent/react-native": "0.1.0",
        "react-native": "0.74.0"
      }
    }),
    "utf8"
  );
  runReactNativeInitCli(
    ["--app-id", "com.mobigent.demo", "--app-name", "Demo App", "--feature", "task", "--out-dir", dir],
    { write: () => undefined } as NodeJS.WritableStream,
    { write: () => undefined } as NodeJS.WritableStream
  );

  const report = createReactNativeDoctorReport({
    appId: "com.mobigent.demo",
    appName: "Demo App",
    feature: "task",
    appRoot: dir,
    outDir: dir,
    gatewayUrl: "ws://localhost:8787",
    dryRun: false,
    force: false,
    doctor: true,
    manifest: false,
    contract: false
  });

  assert.equal(report.status, "pass");
  assert.deepEqual(
    report.checks.map((check) => check.name),
    ["app_identity", "feature_name", "gateway_url", "package_json", "root_file", "feature_file"]
  );
  assert.equal(report.checks.find((check) => check.name === "package_json")?.status, "pass");

  let stdout = "";
  const code = runReactNativeInitCli(
    [
      "--doctor",
      "--app-id",
      "com.mobigent.demo",
      "--app-name",
      "Demo App",
      "--feature",
      "task",
      "--app-root",
      dir,
      "--out-dir",
      dir,
      "--gateway-url",
      "ws://localhost:8787"
    ],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: () => undefined } as NodeJS.WritableStream
  );

  assert.equal(code, 0);
  assert.match(stdout, /Mobigent React Native doctor: PASS/);
  assert.match(stdout, /PASS package_json/);
  assert.match(stdout, /PASS root_file/);

  const missingDependencyDir = await mkdtemp(join(tmpdir(), "mobigent-rn-doctor-missing-dep-"));
  await writeFile(join(missingDependencyDir, "package.json"), JSON.stringify({ dependencies: {} }), "utf8");
  assert.equal(
    createReactNativeDoctorReport({
      appId: "com.mobigent.demo",
      appName: "Demo App",
      feature: "task",
      appRoot: missingDependencyDir,
      outDir: dir,
      gatewayUrl: "ws://localhost:8787",
      dryRun: false,
      force: false,
      doctor: true,
      manifest: false,
      contract: false
    }).status,
    "warn"
  );

  assert.equal(
    createReactNativeDoctorReport({
      appId: "",
      appName: "",
      feature: "bad-name",
      outDir: dir,
      gatewayUrl: "http://localhost:8788",
      dryRun: false,
      force: false,
      doctor: true,
      manifest: false,
      contract: false
    }).status,
    "fail"
  );

  await rm(dir, { force: true, recursive: true });
  await rm(missingDependencyDir, { force: true, recursive: true });
});

test("React Native init CLI runs a security doctor and prints native platform action plans", () => {
  const safeReport = createReactNativeSecurityDoctorReport({
    appId: "com.mobigent.demo",
    appName: "Demo App",
    feature: "expense",
    outDir: "src",
    gatewayUrl: "wss://gateway.example.com",
    dryRun: false,
    force: false,
    doctor: false,
    securityDoctor: true,
    customConfirmation: true,
    manifest: false,
    contract: false
  });

  assert.equal(safeReport.status, "pass");
  assert.deepEqual(
    safeReport.checks.map((check) => check.name),
    ["gateway_transport", "risky_action_confirmation", "host_approval_ui", "app_identity"]
  );

  const riskyReport = createReactNativeSecurityDoctorReport({
    appId: "com.mobigent.demo",
    appName: "Demo App",
    feature: "expense",
    outDir: "src",
    gatewayUrl: "ws://gateway.example.com",
    dryRun: false,
    force: false,
    doctor: false,
    securityDoctor: true,
    customConfirmation: false,
    manifest: false,
    contract: false
  });
  assert.equal(riskyReport.status, "fail");

  let stdout = "";
  const securityCode = runReactNativeInitCli(
    [
      "--security-doctor",
      "--app-id",
      "com.mobigent.demo",
      "--app-name",
      "Demo App",
      "--feature",
      "expense",
      "--gateway-url",
      "wss://gateway.example.com",
      "--custom-confirmation"
    ],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: () => undefined } as NodeJS.WritableStream
  );
  assert.equal(securityCode, 0);
  assert.match(stdout, /Mobigent security doctor: PASS/);

  stdout = "";
  const planCode = runReactNativeInitCli(
    ["--platform-actions", "json", "--app-id", "com.mobigent.demo", "--app-name", "Demo App", "--feature", "expense"],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: () => undefined } as NodeJS.WritableStream
  );
  assert.equal(planCode, 0);
  assert.match(stdout, /mobigent\.apple-app-intents\.plan/);
  assert.match(stdout, /mobigent\.android-app-actions\.plan/);
});

test("React Native init CLI prints a machine-readable integration manifest", () => {
  const manifestOptions = {
    appId: "com.mobigent.demo",
    appName: "Demo App",
    appVersion: "1.2.3",
    feature: "expense",
    outDir: "src",
    gatewayUrl: "wss://gateway.example.com:443",
    dryRun: false,
    force: false,
    doctor: false,
    manifest: true,
    contract: false
  };
  const manifest = createReactNativeIntegrationManifest(manifestOptions);

  assert.equal(manifest.kind, "mobigent.react-native.integration");
  assert.deepEqual(manifest.app, {
    id: "com.mobigent.demo",
    name: "Demo App",
    version: "1.2.3"
  });
  assert.equal(manifest.gatewayUrl, "wss://gateway.example.com:443");
  assert.deepEqual(manifest.capabilities.actions, ["expense_create"]);
  assert.deepEqual(manifest.capabilities.resources, ["expense_list"]);
  assert.deepEqual(manifest.capabilities.events, ["expense.created"]);
  assert.deepEqual(manifest.modules, [
    {
      id: "mobigent.expense",
      name: "expense feature",
      feature: "expense",
      file: join("src", "mobigent-features", "expense.ts"),
      actions: ["expense_create"],
      resources: ["expense_list"],
      components: []
    }
  ]);
  assert.match(manifest.commands.generate, /mobigent-rn-init/);
	  assert.match(
	    createReactNativeIntegrationManifest({
	      ...manifestOptions,
	      expo: true
	    }).commands.generate,
    /mobigent-init/
  );
  assert.match(manifest.commands.doctor, /--doctor/);

  let stdout = "";
  const code = runReactNativeInitCli(
    [
      "--manifest",
      "--app-id",
      "com.mobigent.demo",
      "--app-name",
      "Demo App",
      "--feature",
      "expense",
      "--out-dir",
      "src"
    ],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: () => undefined } as NodeJS.WritableStream
  );
  const parsed = JSON.parse(stdout) as ReturnType<typeof createReactNativeIntegrationManifest>;

  assert.equal(code, 0);
  assert.equal(parsed.kind, "mobigent.react-native.integration");
  assert.equal(parsed.files.root, join("src", "mobigent.tsx"));
  assert.equal(parsed.capabilities.actions[0], "expense_create");
  assert.equal(parsed.modules[0]?.id, "mobigent.expense");
});

test("React Native init CLI writes integration manifests for app onboarding", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mobigent-rn-write-manifest-"));
  const manifestPath = join(dir, "mobigent-integration.json");

  let stdout = "";
  const writeCode = runReactNativeInitCli(
    [
      "--write-manifest",
      manifestPath,
      "--app-id",
      "com.mobigent.demo",
      "--app-name",
      "Demo App",
      "--app-version",
      "1.2.3",
      "--feature",
      "expense",
      "--out-dir",
      "src",
      "--gateway-url",
      "wss://gateway.example.com:443"
    ],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: () => undefined } as NodeJS.WritableStream
  );
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as ReturnType<
    typeof createReactNativeIntegrationManifest
  >;

  assert.equal(writeCode, 0);
  assert.match(stdout, /Created Mobigent integration manifest/);
  assert.equal(manifest.kind, "mobigent.react-native.integration");
  assert.equal(manifest.app.version, "1.2.3");
  assert.equal(manifest.gatewayUrl, "wss://gateway.example.com:443");
  assert.deepEqual(manifest.capabilities.actions, ["expense_create"]);

  assert.equal(
    runReactNativeInitCli(
      [
        "--write-manifest",
        manifestPath,
        "--app-id",
        "com.mobigent.demo",
        "--app-name",
        "Demo App",
        "--feature",
        "expense"
      ],
      { write: () => undefined } as NodeJS.WritableStream,
      { write: () => undefined } as NodeJS.WritableStream
    ),
    1
  );

  assert.equal(
    runReactNativeInitCli(
      [
        "--write-manifest",
        manifestPath,
        "--app-id",
        "com.mobigent.demo",
        "--app-name",
        "Demo App",
        "--feature",
        "expense",
        "--force"
      ],
      { write: () => undefined } as NodeJS.WritableStream,
      { write: () => undefined } as NodeJS.WritableStream
    ),
    0
  );

  await rm(dir, { force: true, recursive: true });
});

test("React Native init CLI validates saved integration manifests", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mobigent-rn-manifest-"));
  const validPath = join(dir, "valid-integration.json");
  const invalidPath = join(dir, "invalid-integration.json");
  const manifest = createReactNativeIntegrationManifest({
    appId: "com.mobigent.demo",
    appName: "Demo App",
    feature: "expense",
    outDir: "src",
    gatewayUrl: "ws://localhost:8787",
    dryRun: false,
    force: false,
    doctor: false,
    manifest: true,
    contract: false
  });

  await writeFile(validPath, JSON.stringify(manifest), "utf8");
  await writeFile(invalidPath, JSON.stringify({ ...manifest, kind: "wrong", gatewayUrl: "http://localhost" }), "utf8");

  assert.deepEqual(validateReactNativeIntegrationManifestFile(validPath), {
    status: "pass",
    path: validPath,
    errors: []
  });
  assert.equal(validateReactNativeIntegrationManifestFile(invalidPath).status, "fail");

  let stdout = "";
  const validCode = runReactNativeInitCli(
    ["--validate-manifest", validPath],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: () => undefined } as NodeJS.WritableStream
  );

  assert.equal(validCode, 0);
  assert.match(stdout, /Mobigent React Native integration manifest: PASS/);

  stdout = "";
  const invalidCode = runReactNativeInitCli(
    ["--validate-manifest", invalidPath],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: () => undefined } as NodeJS.WritableStream
  );

  assert.equal(invalidCode, 1);
  assert.match(stdout, /Mobigent React Native integration manifest: FAIL/);
  assert.match(stdout, /ERROR gatewayUrl/);

  await rm(dir, { force: true, recursive: true });
});

test("React Native init CLI prints a protocol-native capability contract", () => {
  const contract = createReactNativeCapabilityContract({
    appId: "com.mobigent.demo",
    appName: "Demo App",
    appVersion: "1.2.3",
    feature: "expense",
    outDir: "src",
    dryRun: false,
    force: false,
    doctor: false,
    manifest: false,
    contract: true
  });

  assert.equal(contract.kind, "mobigent.react-native.capability-contract");
  assert.equal(contract.sdk, "react-native");
  assert.equal(contract.version, "1.2.3");
  assert.deepEqual(
    contract.actions.map((action) => action.name),
    ["expense_create"]
  );
  assert.deepEqual(
    contract.resources.map((resource) => resource.name),
    ["expense_list"]
  );
  assert.deepEqual(validateCapabilityManifest(contract), { ok: true });

  let stdout = "";
  const code = runReactNativeInitCli(
    [
      "--contract",
      "--app-id",
      "com.mobigent.demo",
      "--app-name",
      "Demo App",
      "--app-version",
      "1.2.3",
      "--feature",
      "expense"
    ],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: () => undefined } as NodeJS.WritableStream
  );
  const parsed = JSON.parse(stdout) as ReturnType<typeof createReactNativeCapabilityContract>;

  assert.equal(code, 0);
  assert.equal(parsed.kind, "mobigent.react-native.capability-contract");
  assert.equal(parsed.actions[0].inputSchema.properties?.title.type, "string");
  assert.equal(parsed.resources[0].policy?.readOnly, true);
});

test("React Native init CLI writes capability contracts for CI validation", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mobigent-rn-write-contract-"));
  const contractPath = join(dir, "contracts", "mobigent-contract.json");

  let stdout = "";
  const writeCode = runReactNativeInitCli(
    [
      "--write-contract",
      contractPath,
      "--app-id",
      "com.mobigent.demo",
      "--app-name",
      "Demo App",
      "--app-version",
      "1.2.3",
      "--feature",
      "expense"
    ],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: () => undefined } as NodeJS.WritableStream
  );
  const contract = JSON.parse(await readFile(contractPath, "utf8")) as ReturnType<
    typeof createReactNativeCapabilityContract
  >;

  assert.equal(writeCode, 0);
  assert.match(stdout, /Created Mobigent capability contract/);
  assert.equal(contract.kind, "mobigent.react-native.capability-contract");
  assert.equal(contract.version, "1.2.3");
  assert.deepEqual(validateReactNativeCapabilityContractFile(contractPath), {
    status: "pass",
    path: contractPath,
    errors: []
  });

  const duplicateCode = runReactNativeInitCli(
    [
      "--write-contract",
      contractPath,
      "--app-id",
      "com.mobigent.demo",
      "--app-name",
      "Demo App",
      "--feature",
      "expense"
    ],
    { write: () => undefined } as NodeJS.WritableStream,
    { write: () => undefined } as NodeJS.WritableStream
  );
  assert.equal(duplicateCode, 1);

  const forceCode = runReactNativeInitCli(
    [
      "--write-contract",
      contractPath,
      "--app-id",
      "com.mobigent.demo",
      "--app-name",
      "Demo App",
      "--feature",
      "expense",
      "--force"
    ],
    { write: () => undefined } as NodeJS.WritableStream,
    { write: () => undefined } as NodeJS.WritableStream
  );
  assert.equal(forceCode, 0);

  await rm(dir, { force: true, recursive: true });
});

test("React Native init CLI validates saved capability contracts", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mobigent-rn-contract-"));
  const validPath = join(dir, "valid-contract.json");
  const invalidPath = join(dir, "invalid-contract.json");
  const contract = createReactNativeCapabilityContract({
    appId: "com.mobigent.demo",
    appName: "Demo App",
    feature: "expense",
    outDir: "src",
    dryRun: false,
    force: false,
    doctor: false,
    manifest: false,
    contract: true
  });

  await writeFile(validPath, JSON.stringify(contract), "utf8");
  await writeFile(invalidPath, JSON.stringify({ ...contract, actions: [{ name: "broken" }] }), "utf8");

  assert.deepEqual(validateReactNativeCapabilityContractFile(validPath), {
    status: "pass",
    path: validPath,
    errors: []
  });
  assert.equal(validateReactNativeCapabilityContractFile(invalidPath).status, "fail");

  let stdout = "";
  const validCode = runReactNativeInitCli(
    ["--validate-contract", validPath],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: () => undefined } as NodeJS.WritableStream
  );

  assert.equal(validCode, 0);
  assert.match(stdout, /Mobigent React Native contract: PASS/);

  stdout = "";
  const invalidCode = runReactNativeInitCli(
    ["--validate-contract", invalidPath],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: () => undefined } as NodeJS.WritableStream
  );

  assert.equal(invalidCode, 1);
  assert.match(stdout, /Mobigent React Native contract: FAIL/);
  assert.match(stdout, /ERROR/);

  await rm(dir, { force: true, recursive: true });
});

test("React Native schema helpers create JSON schema definitions", () => {
  assert.deepEqual(
    schema.object(
      {
        merchant: schema.string({ description: "Merchant name." }),
        amount: schema.number(),
        guests: schema.integer(),
        reimbursable: schema.boolean(),
        category: schema.enum(["travel", "meals"]),
        kind: schema.literal("expense"),
        note: schema.nullable(schema.string()),
        tags: schema.array(schema.string())
      },
      { required: "all" }
    ),
    {
      type: "object",
      properties: {
        merchant: { type: "string", description: "Merchant name." },
        amount: { type: "number" },
        guests: { type: "integer" },
        reimbursable: { type: "boolean" },
        category: { type: "string", enum: ["travel", "meals"] },
        kind: { type: "string", enum: ["expense"] },
        note: { type: ["string", "null"] },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["merchant", "amount", "guests", "reimbursable", "category", "kind", "note", "tags"]
    }
  );
  assert.deepEqual(integerSchema(), { type: "integer" });
  assert.deepEqual(literalSchema("ready"), { type: "string", enum: ["ready"] });
  assert.deepEqual(nullableSchema(schema.number(), { description: "Optional amount." }), {
    type: ["number", "null"],
    description: "Optional amount."
  });
  assert.deepEqual(validateJsonSchema(schema.nullable(schema.string()), null), { ok: true });
  assert.deepEqual(validateJsonSchema(schema.nullable(schema.string()), "hello"), { ok: true });
  assert.deepEqual(validateJsonSchema(schema.nullable(schema.string()), 10), {
    ok: false,
    errors: ["$ must be string or null"]
  });
  assert.deepEqual(objectSchema({ id: schema.string() }, { required: ["id"] }), {
    type: "object",
    properties: {
      id: { type: "string" }
    },
    required: ["id"]
  });
});

test("React Native schema adapters and platform action generators keep manifest parity", () => {
  assert.deepEqual(fromTypeBox({ type: "string" }), { type: "string" });
  assert.deepEqual(fromZod(z.object({ merchant: z.string(), amount: z.number() })), {
    type: "object",
    properties: {
      merchant: { type: "string" },
      amount: { type: "number" }
    },
    required: ["merchant", "amount"],
    additionalProperties: false
  });

  const contract = createReactNativeCapabilityContract({
    appId: "com.mobigent.demo",
    appName: "Demo App",
    feature: "expense",
    outDir: "src",
    dryRun: false,
    force: false,
    doctor: false,
    manifest: false,
    contract: true
  });
  const ios = createAppleAppIntentsPlan(contract);
  const android = createAndroidAppActionsPlan(contract);

  assert.equal(ios.intents[0]?.swiftTypeName, "ExpenseCreateIntent");
  assert.equal(android.actions[0]?.deepLink, "mobigent://com.mobigent.demo/actions/expense_create");
  assert.match(renderAppleAppIntentsSwift(ios), /struct ExpenseCreateIntent: AppIntent/);
  assert.match(renderAndroidAppActionsXml(android), /actions.intent.EXPENSE_CREATE/);
});

test("confirmation controller pauses action calls until approved", async () => {
  const port = 18_788;
  const gateway = new BridgeGateway(port);
  const bridge = new Mobigent();
  const confirmation = createConfirmationController();

  gateway.start();

  bridge.configure({
    appId: "com.mobigent.confirmation",
    appName: "Mobigent Confirmation",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket,
    confirmationController: confirmation
  });

  bridge.registerAction({
    name: "dangerous_action",
    description: "A consequential action.",
    inputSchema: {
      type: "object",
      properties: {}
    },
    confirmation: {
      required: true,
      risk: "high"
    },
    handler: async () => ({ completed: true })
  });

  try {
    await bridge.connect();
    await delay(50);

    const pending = gateway.callTool("com_mobigent_confirmation.dangerous_action", {});
    await delay(20);
    assert.equal(confirmation.getCurrent()?.action.name, "dangerous_action");

    confirmation.approve();
    assert.deepEqual(await pending, { completed: true });
  } finally {
    bridge.disconnect();
    gateway.stop();
  }
});

test("gateway only accepts app sessions with matching auth token", async () => {
  const port = 18_797;
  const gateway = new BridgeGateway({ port, authToken: "secret" });
  const rejectedBridge = new Mobigent();
  const acceptedBridge = new Mobigent();

  gateway.start();
  await delay(20);

  rejectedBridge.configure({
    appId: "com.mobigent.rejected",
    appName: "Rejected",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket,
    authToken: "wrong"
  });

  acceptedBridge.configure({
    appId: "com.mobigent.accepted",
    appName: "Accepted",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket,
    authToken: "secret"
  });

  rejectedBridge.registerAction({
    name: "bad_action",
    description: "Should not be exposed.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ({ ok: false })
  });

  acceptedBridge.registerAction({
    name: "good_action",
    description: "Should be exposed.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ({ ok: true })
  });

  try {
    await acceptedBridge.connect();
    await delay(80);

    assert.deepEqual(
      gateway.listTools().map((tool) => tool.name),
      ["com_mobigent_accepted.good_action"]
    );

    await rejectedBridge.connect();
    await delay(80);

    assert.deepEqual(
      gateway.listTools().map((tool) => tool.name),
      ["com_mobigent_accepted.good_action"]
    );
  } finally {
    rejectedBridge.disconnect();
    acceptedBridge.disconnect();
    gateway.stop();
  }
});

test("gateway can restrict app sessions by app id", async () => {
  const port = 18_820;
  const gateway = new BridgeGateway({ port, allowedAppIds: ["com.mobigent.allowed"] });
  const rejectedBridge = new Mobigent();
  const allowedBridge = new Mobigent();
  const auditTypes: string[] = [];

  gateway.onAudit((event) => auditTypes.push(event.type));
  gateway.start();

  rejectedBridge.configure({
    appId: "com.mobigent.rejected",
    appName: "Rejected App",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket
  });
  rejectedBridge.registerAction({
    name: "rejected_action",
    description: "Should not be exposed.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ({ ok: true })
  });

  allowedBridge.configure({
    appId: "com.mobigent.allowed",
    appName: "Allowed App",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket
  });
  allowedBridge.registerAction({
    name: "allowed_action",
    description: "Should be exposed.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ({ ok: true })
  });

  try {
    await rejectedBridge.connect();
    await delay(80);
    assert.deepEqual(gateway.listTools(), []);
    assert.ok(auditTypes.includes("app.rejected"));
    assert.equal(gateway.getStatus().appAllowlistEnabled, true);

    await allowedBridge.connect();
    await delay(50);
    assert.deepEqual(
      gateway.listTools().map((tool) => tool.name),
      ["com_mobigent_allowed.allowed_action"]
    );
  } finally {
    rejectedBridge.disconnect();
    allowedBridge.disconnect();
    gateway.stop();
  }
});

test("gateway can require signed capability manifests", async () => {
  const port = 18_817;
  const secret = "manifest-secret";
  const gateway = new BridgeGateway({ port, manifestSigningSecret: secret });
  const unsignedBridge = new Mobigent();
  const signedBridge = new Mobigent();
  const auditTypes: string[] = [];

  gateway.onAudit((event) => auditTypes.push(event.type));
  gateway.start();

  unsignedBridge.configure({
    appId: "com.mobigent.unsigned",
    appName: "Unsigned App",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket
  });
  unsignedBridge.registerAction({
    name: "unsigned_action",
    description: "Should not be exposed.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ({ ok: true })
  });

  signedBridge.configure({
    appId: "com.mobigent.signed",
    appName: "Signed App",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket,
    signManifest: (manifest) => signManifest(manifest, secret)
  });
  signedBridge.registerAction({
    name: "signed_action",
    description: "Should be exposed.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ({ ok: true })
  });

  try {
    await unsignedBridge.connect();
    await delay(50);
    assert.deepEqual(gateway.listTools(), []);
    assert.ok(auditTypes.includes("manifest.rejected"));

    await signedBridge.connect();
    await delay(50);
    assert.deepEqual(
      gateway.listTools().map((tool) => tool.name),
      ["com_mobigent_signed.signed_action"]
    );
    assert.deepEqual(await gateway.callTool("com_mobigent_signed.signed_action", {}), {
      ok: true
    });
  } finally {
    unsignedBridge.disconnect();
    signedBridge.disconnect();
    gateway.stop();
  }
});

test("gateway rejects malformed capability manifests before registration", async () => {
  const port = 18_838;
  const gateway = new BridgeGateway(port);
  let socket: WebSocket | undefined;

  gateway.start();

  try {
    socket = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((resolve, reject) => {
      socket?.once("open", resolve);
      socket?.once("error", reject);
    });

    socket.send(
      JSON.stringify({
        type: "hello",
        appId: "com.mobigent.malformed",
        appName: "Malformed App",
        sdk: "react-native",
        version: "0.1.0",
        protocolVersion: 1
      })
    );
    socket.send(
      JSON.stringify({
        type: "manifest",
        manifest: {
          appId: "com.mobigent.malformed",
          appName: "Malformed App",
          sdk: "react-native",
          version: "0.1.0",
          protocolVersion: 1,
          actions: [
            {
              name: "broken_action",
              description: "Missing input schema."
            }
          ],
          resources: "not-an-array",
          components: []
        }
      })
    );

    await delay(50);
    assert.deepEqual(gateway.listTools(), []);
    const rejected = gateway.getAuditLog().find((event) => event.type === "manifest.rejected");
    assert.equal(rejected?.details?.reason, "invalid_manifest");
    assert.ok(
      ((rejected?.details?.errors as string[] | undefined) ?? []).some((error) =>
        error.includes("$.actions[0].inputSchema")
      )
    );
    assert.ok(
      ((rejected?.details?.errors as string[] | undefined) ?? []).some((error) =>
        error.includes("$.resources must be an array")
      )
    );
  } finally {
    socket?.close();
    gateway.stop();
  }
});

test("gateway rejects manifests with duplicate internal tool names", async () => {
  const port = 18_839;
  const gateway = new BridgeGateway(port);
  let socket: WebSocket | undefined;

  gateway.start();

  try {
    socket = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((resolve, reject) => {
      socket?.once("open", resolve);
      socket?.once("error", reject);
    });

    socket.send(
      JSON.stringify({
        type: "hello",
        appId: "com.mobigent.internal_duplicate",
        appName: "Internal Duplicate App",
        sdk: "react-native",
        version: "0.1.0",
        protocolVersion: 1
      })
    );
    socket.send(
      JSON.stringify({
        type: "manifest",
        manifest: {
          appId: "com.mobigent.internal_duplicate",
          appName: "Internal Duplicate App",
          sdk: "react-native",
          version: "0.1.0",
          protocolVersion: 1,
          actions: [
            {
              name: "get_profile",
              description: "Action that collides with a resource tool.",
              inputSchema: { type: "object", properties: {} }
            }
          ],
          resources: [
            {
              name: "profile",
              description: "Profile resource."
            }
          ],
          components: []
        }
      })
    );

    await delay(50);
    assert.deepEqual(gateway.listTools(), []);
    const rejected = gateway.getAuditLog().find((event) => event.type === "manifest.rejected");
    assert.equal(rejected?.details?.reason, "invalid_manifest");
    assert.ok(
      ((rejected?.details?.errors as string[] | undefined) ?? []).some((error) =>
        error.includes("duplicate tool name com_mobigent_internal_duplicate.get_profile")
      )
    );
  } finally {
    socket?.close();
    gateway.stop();
  }
});

test("gateway rejects manifests that would expose duplicate tool names", async () => {
  const port = 18_826;
  const gateway = new BridgeGateway(port);
  const firstBridge = new Mobigent();
  const duplicateBridge = new Mobigent();
  const auditEvents: Array<{ type: string; details?: JsonObject }> = [];

  gateway.onAudit((event) => auditEvents.push({ type: event.type, details: event.details }));
  gateway.start();

  firstBridge.configure({
    appId: "com.mobigent.duplicate_app",
    appName: "Duplicate App One",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket
  });
  firstBridge.registerAction({
    name: "shared_action",
    description: "First shared action.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ({ owner: "first" })
  });

  duplicateBridge.configure({
    appId: "com.mobigent.duplicate_app",
    appName: "Duplicate App Two",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket
  });
  duplicateBridge.registerAction({
    name: "shared_action",
    description: "Second shared action.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ({ owner: "second" })
  });

  try {
    await firstBridge.connect();
    await delay(50);
    await duplicateBridge.connect();
    await delay(80);

    assert.deepEqual(
      gateway.listTools().map((tool) => tool.name),
      ["com_mobigent_duplicate_app.shared_action"]
    );
    assert.deepEqual(await gateway.callTool("com_mobigent_duplicate_app.shared_action", {}), {
      owner: "first"
    });
    const rejected = auditEvents.find(
      (event) => event.type === "manifest.rejected" && event.details?.reason === "duplicate_tool_name"
    );
    assert.equal(rejected?.details?.tool, "com_mobigent_duplicate_app.shared_action");
  } finally {
    duplicateBridge.disconnect();
    firstBridge.disconnect();
    gateway.stop();
  }
});

test("MCP server exposes connected app capabilities as tools", async () => {
  const port = 18_798;
  const gateway = new BridgeGateway(port);
  const bridge = new Mobigent();
  const mcpServer = createMcpServer(gateway);
  const client = new Client({
    name: "mobigent-test-client",
    version: "0.1.0"
  });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  gateway.start();

  bridge.configure({
    appId: "com.mobigent.mcp",
    appName: "MCP App",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket,
    confirm: async () => true
  });

  bridge.registerAction({
    name: "create_expense",
    description: "Create an expense through MCP.",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "number" },
        merchant: { type: "string" }
      },
      required: ["amount", "merchant"]
    },
    confirmation: {
      required: true,
      risk: "medium"
    },
    handler: async (input) => ({
      id: "EXP-MCP",
      amount: Number(input.amount),
      merchant: String(input.merchant)
    })
  });

  try {
    await bridge.connect();
    await delay(50);
    await Promise.all([mcpServer.connect(serverTransport), client.connect(clientTransport)]);

    const listed = await client.listTools();
    assert.deepEqual(
      listed.tools.map((tool) => tool.name),
      ["com_mobigent_mcp.create_expense"]
    );

    const called = await client.callTool({
      name: "com_mobigent_mcp.create_expense",
      arguments: {
        amount: 12.5,
        merchant: "Train"
      }
    });

    assert.equal(called.isError, undefined);
    assert.deepEqual(called.structuredContent, {
      id: "EXP-MCP",
      amount: 12.5,
      merchant: "Train"
    });
  } finally {
    bridge.disconnect();
    await client.close();
    await mcpServer.close();
    gateway.stop();
  }
});

test("gateway emits tool change events when manifests appear and disappear", async () => {
  const port = 18_800;
  const gateway = new BridgeGateway(port);
  const bridge = new Mobigent();
  let changes = 0;

  gateway.start();
  gateway.onToolsChanged(() => {
    changes += 1;
  });

  bridge.configure({
    appId: "com.mobigent.changes",
    appName: "Changes App",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket
  });

  bridge.registerAction({
    name: "ping_action",
    description: "Ping.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ({ pong: true })
  });

  try {
    await bridge.connect();
    await delay(50);
    assert.equal(changes, 1);

    bridge.disconnect();
    await delay(50);
    assert.equal(changes, 2);
  } finally {
    gateway.stop();
  }
});

test("HTTP provider client streams tool snapshots when app capabilities change", async () => {
  const wsPort = 18_827;
  const httpPort = 18_828;
  const gateway = new BridgeGateway(wsPort);
  const bridge = new Mobigent();
  const app = createHttpApp(gateway);
  const controller = new AbortController();
  let server: ReturnType<typeof app.listen> | undefined;

  gateway.start();
  server = app.listen(httpPort);

  bridge.configure({
    appId: "com.mobigent.tool_stream",
    appName: "Tool Stream App",
    gatewayUrl: `ws://localhost:${wsPort}`,
    createSocket: createNodeSocket
  });

  bridge.registerAction({
    name: "streamed_action",
    description: "Action discovered through the tool stream.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ({ ok: true })
  });

  const client = createMobigentHttpClient({
    baseUrl: `http://localhost:${httpPort}`,
    agentId: "streaming-agent"
  });

  try {
    const events: Array<{ reason: string; toolNames: string[] }> = [];
    const reader = (async () => {
      for await (const event of client.watchTools({ signal: controller.signal })) {
        events.push({
          reason: event.reason,
          toolNames: event.tools.map((tool) => tool.name)
        });
        if (events.length === 2) {
          controller.abort();
          break;
        }
      }
    })();

    await waitFor(() => events.length === 1);
    assert.deepEqual(events[0], { reason: "snapshot", toolNames: [] });

    await bridge.connect();
    await waitFor(() => events.length === 2);
    await reader;

    assert.equal(events[1]?.reason, "changed");
    assert.deepEqual(events[1]?.toolNames, ["com_mobigent_tool_stream.streamed_action"]);
  } finally {
    controller.abort();
    bridge.disconnect();
    gateway.stop();
    server?.close();
  }
});

test("provider runtime stream maps live tool changes into provider-native shapes", async () => {
  const wsPort = 18_840;
  const httpPort = 18_841;
  const gateway = new BridgeGateway(wsPort);
  const bridge = new Mobigent();
  const app = createHttpApp(gateway);
  const controller = new AbortController();
  let server: ReturnType<typeof app.listen> | undefined;

  gateway.start();
  server = app.listen(httpPort);

  bridge.configure({
    appId: "com.mobigent.runtime_stream",
    appName: "Runtime Stream App",
    gatewayUrl: `ws://localhost:${wsPort}`,
    createSocket: createNodeSocket
  });

  bridge.registerAction({
    name: "streamed_runtime_action",
    description: "Action discovered through the provider runtime stream.",
    inputSchema: {
      type: "object",
      properties: {
        value: { type: "string" }
      }
    },
    handler: async () => ({ ok: true })
  });

  const client = createMobigentHttpClient({
    baseUrl: `http://localhost:${httpPort}`,
    agentId: "anthropic-tool-use"
  });

  try {
    const events: Array<{ reason: string; rawToolNames: string[]; mappedToolNames: string[] }> = [];
    const reader = (async () => {
      for await (const event of watchMobigentProviderRuntime({
        kind: "anthropic-tool-use",
        client,
        stream: { signal: controller.signal }
      })) {
        events.push({
          reason: event.reason,
          rawToolNames: event.rawTools.map((tool) => tool.name),
          mappedToolNames: (event.tools as Array<{ name: string }>).map((tool) => tool.name)
        });
        if (events.length === 2) {
          controller.abort();
          break;
        }
      }
    })();

    await waitFor(() => events.length === 1);
    assert.deepEqual(events[0], { reason: "snapshot", rawToolNames: [], mappedToolNames: [] });

    await bridge.connect();
    await waitFor(() => events.length === 2);
    await reader;

    assert.equal(events[1]?.reason, "changed");
    assert.deepEqual(events[1]?.rawToolNames, ["com_mobigent_runtime_stream.streamed_runtime_action"]);
    assert.deepEqual(events[1]?.mappedToolNames, ["com_mobigent_runtime_stream.streamed_runtime_action"]);
  } finally {
    controller.abort();
    bridge.disconnect();
    gateway.stop();
    server?.close();
  }
});

test("gateway responds to SDK heartbeat pings", async () => {
  const port = 18_830;
  const gateway = new BridgeGateway(port);
  let socket: WebSocket | undefined;

  gateway.start();

  try {
    socket = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((resolve, reject) => {
      socket.once("open", resolve);
      socket.once("error", reject);
    });
    socket.send(
      JSON.stringify({
        type: "hello",
        appId: "com.mobigent.heartbeat",
        appName: "Heartbeat App",
        sdk: "react-native",
        version: "0.1.0"
      })
    );
    socket.send(JSON.stringify({ type: "ping", id: "heartbeat-1", at: new Date().toISOString() }));

    const response = await new Promise<BridgeMessage>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timed out waiting for heartbeat pong.")), 500);
      socket.on("message", (raw) => {
        const message = JSON.parse(raw.toString()) as BridgeMessage;
        if (message.type === "pong") {
          clearTimeout(timeout);
          resolve(message);
        }
      });
    });

    assert.deepEqual(
      { type: response.type, id: response.type === "pong" ? response.id : undefined },
      { type: "pong", id: "heartbeat-1" }
    );
  } finally {
    socket?.close();
    gateway.stop();
  }
});

test("gateway negotiates supported app protocol versions", async () => {
  const port = 18_836;
  const gateway = new BridgeGateway(port);
  let socket: WebSocket | undefined;

  gateway.start();

  try {
    socket = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((resolve, reject) => {
      socket.once("open", resolve);
      socket.once("error", reject);
    });

    socket.send(
      JSON.stringify({
        type: "hello",
        appId: "com.mobigent.protocol",
        appName: "Protocol App",
        sdk: "react-native",
        version: "0.1.0",
        protocolVersion: 1
      })
    );

    const ready = await new Promise<BridgeMessage>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timed out waiting for ready message.")), 500);
      socket?.on("message", (raw) => {
        const message = JSON.parse(raw.toString()) as BridgeMessage;
        if (message.type === "ready") {
          clearTimeout(timeout);
          resolve(message);
        }
      });
    });

    assert.deepEqual(ready, {
      type: "ready",
      protocolVersion: 1,
      supportedProtocolVersions: [1]
    });
    assert.equal(
      gateway.getAuditLog().find((event) => event.type === "app.authenticated")?.details?.protocolVersion,
      1
    );
  } finally {
    socket?.close();
    gateway.stop();
  }
});

test("gateway rejects unsupported app protocol versions", async () => {
  const port = 18_837;
  const gateway = new BridgeGateway(port);
  let socket: WebSocket | undefined;

  gateway.start();

  try {
    socket = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((resolve, reject) => {
      socket.once("open", resolve);
      socket.once("error", reject);
    });

    const closed = new Promise<{ code: number; reason: string }>((resolve) => {
      socket?.once("close", (code, rawReason) => {
        resolve({ code, reason: rawReason.toString() });
      });
    });

    socket.send(
      JSON.stringify({
        type: "hello",
        appId: "com.mobigent.future",
        appName: "Future App",
        sdk: "react-native",
        version: "99.0.0",
        protocolVersion: 99
      })
    );

    const close = await closed;
    assert.equal(close.code, 1002);
    assert.match(close.reason, /Unsupported Mobigent protocol version/);
    const rejected = gateway.getAuditLog().find((event) => event.type === "app.rejected");
    assert.equal(rejected?.details?.reason, "unsupported_protocol_version");
    assert.equal(rejected?.details?.protocolVersion, 99);
  } finally {
    socket?.close();
    gateway.stop();
  }
});

test("gateway enforces allowed agent and rate limit policies", async () => {
  const port = 18_802;
  const gateway = new BridgeGateway(port);
  const bridge = new Mobigent();
  let calls = 0;

  gateway.start();

  bridge.configure({
    appId: "com.mobigent.policy",
    appName: "Policy App",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket
  });

  bridge.registerAction({
    name: "limited_action",
    description: "Policy protected action.",
    inputSchema: { type: "object", properties: {} },
    policy: {
      allowedAgents: ["trusted-agent"],
      rateLimitPerMinute: 1
    },
    handler: async () => {
      calls += 1;
      return { calls };
    }
  });

  try {
    await bridge.connect();
    await delay(50);

    assert.deepEqual(gateway.listToolsForAgent().map((tool) => tool.name), []);
    assert.deepEqual(gateway.listToolsForAgent("unknown-agent").map((tool) => tool.name), []);
    assert.deepEqual(gateway.listToolsForAgent("trusted-agent").map((tool) => tool.name), [
      "com_mobigent_policy.limited_action"
    ]);

    await assert.rejects(
      () => gateway.callTool("com_mobigent_policy.limited_action", {}),
      /anonymous.*not allowed/
    );
    await assert.rejects(
      () =>
        gateway.callTool("com_mobigent_policy.limited_action", {}, { agentId: "unknown-agent" }),
      /unknown-agent.*not allowed/
    );

    assert.deepEqual(
      await gateway.callTool("com_mobigent_policy.limited_action", {}, {
        agentId: "trusted-agent",
        idempotencyKey: "limited-1"
      }),
      { calls: 1 }
    );
    assert.deepEqual(
      await gateway.callTool("com_mobigent_policy.limited_action", {}, {
        agentId: "trusted-agent",
        idempotencyKey: "limited-1"
      }),
      { calls: 1 }
    );
    await assert.rejects(
      () => gateway.callTool("com_mobigent_policy.limited_action", {}, { agentId: "trusted-agent" }),
      /Rate limit exceeded/
    );
    assert.equal(calls, 1);
  } finally {
    bridge.disconnect();
    gateway.stop();
  }
});

test("gateway agent profiles filter discovery and enforce risk/read-only limits", async () => {
  const port = 18_832;
  const gateway = new BridgeGateway({
    port,
    agentProfiles: {
      readonly: {
        readOnly: true,
        allowedTools: ["com_mobigent_profiles.*"]
      },
      safe: {
        maxRisk: "low",
        deniedTools: ["com_mobigent_profiles.get_private_notes"]
      },
      scoped: {
        allowedTools: ["com_mobigent_profiles.get_balance"]
      }
    }
  });
  const bridge = new Mobigent();

  gateway.start();

  bridge.configure({
    appId: "com.mobigent.profiles",
    appName: "Profile Policy App",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket
  });

  bridge.registerAction({
    name: "create_payment",
    description: "Create a payment.",
    inputSchema: { type: "object", properties: {} },
    confirmation: {
      required: true,
      risk: "high"
    },
    handler: async () => ({ paid: true })
  });

  bridge.registerResource({
    name: "balance",
    description: "Read balance.",
    read: async () => ({ balance: 42 })
  });

  bridge.registerResource({
    name: "private_notes",
    description: "Read private notes.",
    read: async () => ({ notes: [] })
  });

  try {
    await bridge.connect();
    await delay(50);

    assert.deepEqual(
      gateway.listToolsForAgent("readonly").map((tool) => tool.name).sort(),
      ["com_mobigent_profiles.get_balance", "com_mobigent_profiles.get_private_notes"]
    );
    assert.deepEqual(
      gateway.listToolsForAgent("safe").map((tool) => tool.name).sort(),
      ["com_mobigent_profiles.get_balance"]
    );
    assert.deepEqual(
      gateway.listToolsForAgent("scoped").map((tool) => tool.name),
      ["com_mobigent_profiles.get_balance"]
    );
    assert.deepEqual(
      gateway.listAgentVisibility(["safe"]).map((agent) => ({
        agentId: agent.agentId,
        profileConfigured: agent.profileConfigured,
        visibleTools: agent.visibleTools,
        hiddenTools: agent.hiddenTools,
        visibleToolNames: agent.visibleToolNames
      })),
      [
        {
          agentId: "safe",
          profileConfigured: true,
          visibleTools: 1,
          hiddenTools: 2,
          visibleToolNames: ["com_mobigent_profiles.get_balance"]
        }
      ]
    );

    await assert.rejects(
      () => gateway.callTool("com_mobigent_profiles.create_payment", {}, { agentId: "readonly" }),
      /read-only/
    );
    await assert.rejects(
      () => gateway.callTool("com_mobigent_profiles.create_payment", {}, { agentId: "safe" }),
      /up to low risk/
    );
    await assert.rejects(
      () => gateway.callTool("com_mobigent_profiles.get_private_notes", {}, { agentId: "safe" }),
      /profile denies access/
    );

    assert.deepEqual(
      await gateway.callTool("com_mobigent_profiles.get_balance", {}, { agentId: "readonly" }),
      { balance: 42 }
    );
    assert.equal(gateway.getStatus().agentProfilesConfigured, true);
  } finally {
    bridge.disconnect();
    gateway.stop();
  }
});

test("gateway prunes retained idempotency records and stale rate-limit buckets", async () => {
  const port = 18_831;
  const gateway = new BridgeGateway({
    port,
    idempotencyRecordTtlMs: 10,
    cleanupIntervalMs: 0
  });
  const bridge = new Mobigent();
  const originalNow = Date.now;
  let now = 1_700_000_000_000;

  Date.now = () => now;
  gateway.start();

  bridge.configure({
    appId: "com.mobigent.retention",
    appName: "Retention App",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket
  });

  bridge.registerAction({
    name: "limited_action",
    description: "Retention test action.",
    inputSchema: { type: "object", properties: {} },
    policy: {
      rateLimitPerMinute: 10
    },
    handler: async () => ({ ok: true })
  });

  try {
    await bridge.connect();
    await delay(50);

    assert.deepEqual(
      await gateway.callTool("com_mobigent_retention.limited_action", {}, {
        agentId: "retention-agent",
        idempotencyKey: "retention-1"
      }),
      { ok: true }
    );

    assert.equal(gateway.getStatus().idempotencyRecords, 1);
    assert.equal(gateway.getStatus().rateLimitBuckets, 1);

    now += 61_000;
    assert.equal(gateway.getStatus().idempotencyRecords, 0);
    assert.equal(gateway.getStatus().rateLimitBuckets, 0);
  } finally {
    Date.now = originalNow;
    bridge.disconnect();
    gateway.stop();
  }
});

test("HTTP gateway forwards agent identity, idempotency, request ids, and per-call timeout", async () => {
  const wsPort = 18_803;
  const httpPort = 18_804;
  const gateway = new BridgeGateway({ port: wsPort, requestTimeoutMs: 500 });
  const bridge = new Mobigent();
  const app = createHttpApp(gateway);
  let server: ReturnType<typeof app.listen> | undefined;
  let allowedCalls = 0;

  gateway.start();
  server = app.listen(httpPort);

  bridge.configure({
    appId: "com.mobigent.http_policy",
    appName: "HTTP Policy App",
    gatewayUrl: `ws://localhost:${wsPort}`,
    createSocket: createNodeSocket
  });

  bridge.registerAction({
    name: "allowed_action",
    description: "Only selected HTTP agents can call this.",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string" }
      },
      required: ["message"]
    },
    policy: {
      allowedAgents: ["chatgpt-actions"]
    },
    handler: async (input) => {
      allowedCalls += 1;
      return { calls: allowedCalls, ok: true, message: input.message };
    }
  });

  bridge.registerAction({
    name: "slow_action",
    description: "Slow action for timeout testing.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => {
      await delay(80);
      return { ok: true };
    }
  });

  try {
    await bridge.connect();
    await delay(50);

    const anonymousTools = await fetch(`http://localhost:${httpPort}/tools`);
    assert.equal(anonymousTools.status, 200);
    assert.deepEqual(
      (await anonymousTools.json()).tools.map((tool: { name: string }) => tool.name),
      ["com_mobigent_http_policy.slow_action"]
    );

    const chatGptTools = await fetch(`http://localhost:${httpPort}/tools`, {
      headers: {
        "x-mobigent-agent": "chatgpt-actions"
      }
    });
    assert.equal(chatGptTools.status, 200);
    assert.deepEqual(
      (await chatGptTools.json()).tools.map((tool: { name: string }) => tool.name).sort(),
      ["com_mobigent_http_policy.allowed_action", "com_mobigent_http_policy.slow_action"]
    );

    const deniedLookup = await fetch(
      `http://localhost:${httpPort}/tools/com_mobigent_http_policy.allowed_action`
    );
    assert.equal(deniedLookup.status, 403);
    assert.deepEqual(await deniedLookup.json(), {
      code: "forbidden",
      error: 'Agent "anonymous" is not allowed to call com_mobigent_http_policy.allowed_action.',
      retryable: false
    });

    const allowedLookup = await fetch(
      `http://localhost:${httpPort}/tools/com_mobigent_http_policy.allowed_action`,
      {
        headers: {
          "x-mobigent-agent": "chatgpt-actions"
        }
      }
    );
    assert.equal(allowedLookup.status, 200);
    assert.equal((await allowedLookup.json()).tool.name, "com_mobigent_http_policy.allowed_action");

    const missingLookup = await fetch(`http://localhost:${httpPort}/tools/com_mobigent_http_policy.missing`);
    assert.equal(missingLookup.status, 404);
    assert.equal(((await missingLookup.json()) as { code: string }).code, "not_found");

    const denied = await fetch(
      `http://localhost:${httpPort}/tools/com_mobigent_http_policy.allowed_action/call`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({})
      }
    );
    assert.equal(denied.status, 403);
    assert.equal(((await denied.json()) as { code: string }).code, "forbidden");

    const invalidInput = await fetch(
      `http://localhost:${httpPort}/tools/com_mobigent_http_policy.allowed_action/call`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-mobigent-agent": "chatgpt-actions"
        },
        body: JSON.stringify({})
      }
    );
    assert.equal(invalidInput.status, 400);
    const invalidInputBody = (await invalidInput.json()) as { code: string; error: string; retryable: boolean };
    assert.equal(invalidInputBody.code, "invalid_input");
    assert.equal(invalidInputBody.retryable, false);
    assert.match(invalidInputBody.error, /Invalid tool input.*message is required/);

    const allowed = await fetch(
      `http://localhost:${httpPort}/tools/com_mobigent_http_policy.allowed_action/call`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-mobigent-agent": "chatgpt-actions",
          "x-mobigent-idempotency-key": "expense-create-1",
          "x-mobigent-request-id": "provider-request-1"
        },
        body: JSON.stringify({ message: "hello" })
      }
    );
    assert.equal(allowed.status, 200);
    assert.deepEqual(await allowed.json(), {
      tool: "com_mobigent_http_policy.allowed_action",
      result: { calls: 1, ok: true, message: "hello" }
    });

    const replayed = await fetch(
      `http://localhost:${httpPort}/tools/com_mobigent_http_policy.allowed_action/call`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-mobigent-agent": "chatgpt-actions",
          "x-mobigent-idempotency-key": "expense-create-1",
          "x-mobigent-request-id": "provider-request-2"
        },
        body: JSON.stringify({ message: "hello" })
      }
    );
    assert.equal(replayed.status, 200);
    assert.deepEqual(await replayed.json(), {
      tool: "com_mobigent_http_policy.allowed_action",
      result: { calls: 1, ok: true, message: "hello" }
    });
    assert.equal(allowedCalls, 1);

    const mismatchedReplay = await fetch(
      `http://localhost:${httpPort}/tools/com_mobigent_http_policy.allowed_action/call`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-mobigent-agent": "chatgpt-actions",
          "x-mobigent-idempotency-key": "expense-create-1"
        },
        body: JSON.stringify({ message: "different" })
      }
    );
    assert.equal(mismatchedReplay.status, 409);
    assert.equal(((await mismatchedReplay.json()) as { code: string }).code, "conflict");

    const successEvent = gateway
      .getAuditLog()
      .find((event) => event.type === "tool.call.succeeded" && event.tool === "com_mobigent_http_policy.allowed_action");
    assert.equal(successEvent?.details?.externalRequestId, "provider-request-1");
    assert.equal(successEvent?.details?.idempotencyKey, "expense-create-1");
    const deduplicatedEvent = gateway
      .getAuditLog()
      .find((event) => event.type === "tool.call.deduplicated" && event.tool === "com_mobigent_http_policy.allowed_action");
    assert.equal(deduplicatedEvent?.details?.externalRequestId, "provider-request-2");

    const timedOut = await fetch(
      `http://localhost:${httpPort}/tools/com_mobigent_http_policy.slow_action/call`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-mobigent-timeout-ms": "10"
        },
        body: JSON.stringify({})
      }
    );
    assert.equal(timedOut.status, 504);
    const timeoutBody = (await timedOut.json()) as { code: string; error: string; retryable: boolean };
    assert.equal(timeoutBody.code, "timeout");
    assert.equal(timeoutBody.retryable, true);
    assert.match(timeoutBody.error, /Timed out waiting for app response/);
  } finally {
    bridge.disconnect();
    gateway.stop();
    server?.close();
  }
});

test("gateway records and streams audit events", async () => {
  const port = 18_805;
  const gateway = new BridgeGateway({ port, auditLogLimit: 4 });
  const bridge = new Mobigent();
  const streamed: string[] = [];

  gateway.onAudit((event) => streamed.push(event.type));
  gateway.start();

  bridge.configure({
    appId: "com.mobigent.audit",
    appName: "Audit App",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket
  });

  bridge.registerAction({
    name: "audit_action",
    description: "Audited action.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ({ ok: true })
  });

  try {
    await bridge.connect();
    await delay(50);
    bridge.emit("audit.test", { ok: true });
    await delay(20);

    assert.deepEqual(await gateway.callTool("com_mobigent_audit.audit_action", {}), {
      ok: true
    });
    await assert.rejects(
      () => gateway.callTool("com_mobigent_audit.missing_action", {}),
      /No connected app exposes tool/
    );

    assert.ok(streamed.includes("gateway.started"));
    assert.ok(streamed.includes("session.connected"));
    assert.ok(streamed.includes("manifest.registered"));
    assert.ok(streamed.includes("app.event"));
    assert.ok(streamed.includes("tool.call.started"));
    assert.ok(streamed.includes("tool.call.succeeded"));
    assert.ok(streamed.includes("tool.call.failed"));

    bridge.disconnect();
    await delay(20);

    const limited = gateway.getAuditLog();
    assert.equal(limited.length, 4);
    assert.deepEqual(
      limited.map((event) => event.type),
      ["tool.call.started", "tool.call.succeeded", "tool.call.failed", "session.disconnected"]
    );
    assert.equal(gateway.getAuditLog(2).length, 2);
  } finally {
    bridge.disconnect();
    gateway.stop();
  }
});

test("gateway writes durable JSONL audit events", async () => {
  const port = 18_816;
  const tempDir = await mkdtemp(join(tmpdir(), "mobigent-audit-"));
  const auditLogPath = join(tempDir, "nested", "audit.jsonl");
  const gateway = new BridgeGateway({ port, auditLogPath });

  try {
    gateway.start();
    gateway.stop();

    const lines = (await readFile(auditLogPath, "utf8")).trim().split("\n");
    const events = lines.map((line) => JSON.parse(line) as { type: string; at: string; id: string });

    assert.deepEqual(
      events.map((event) => event.type),
      ["gateway.started", "gateway.stopped"]
    );
    assert.ok(events.every((event) => event.id));
    assert.ok(events.every((event) => !Number.isNaN(Date.parse(event.at))));
  } finally {
    gateway.stop();
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("gateway redacts sensitive audit details before memory and JSONL storage", async () => {
  const port = 18_821;
  const tempDir = await mkdtemp(join(tmpdir(), "mobigent-redaction-"));
  const auditLogPath = join(tempDir, "audit.jsonl");
  const gateway = new BridgeGateway({
    port,
    auditLogPath,
    auditRedactKeys: ["email"]
  });
  const bridge = new Mobigent();

  gateway.start();

  bridge.configure({
    appId: "com.mobigent.redaction",
    appName: "Redaction App",
    gatewayUrl: `ws://localhost:${port}`,
    createSocket: createNodeSocket
  });

  try {
    await bridge.connect();
    await delay(50);

    bridge.emit("profile.updated", {
      email: "person@example.com",
      nested: {
        token: "secret-token",
        keep: "visible"
      },
      list: [{ password: "pw", label: "work" }]
    });
    await delay(30);

    const appEvent = gateway.getAuditLog().find((event) => event.type === "app.event");
    assert.deepEqual(appEvent?.details, {
      name: "profile.updated",
      payload: {
        email: "[REDACTED]",
        nested: {
          token: "[REDACTED]",
          keep: "visible"
        },
        list: [{ password: "[REDACTED]", label: "work" }]
      },
      at: appEvent?.details?.at
    });

    const lines = (await readFile(auditLogPath, "utf8")).trim().split("\n");
    const persistedEvents = lines.map((line) => JSON.parse(line) as { type: string; details?: JsonObject });
    const persistedAppEvent = persistedEvents.find((event) => event.type === "app.event");
    assert.deepEqual((persistedAppEvent?.details?.payload as JsonObject).email, "[REDACTED]");
    assert.deepEqual(
      ((persistedAppEvent?.details?.payload as JsonObject).nested as JsonObject).token,
      "[REDACTED]"
    );
  } finally {
    bridge.disconnect();
    gateway.stop();
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("HTTP gateway exposes recent audit events", async () => {
  const wsPort = 18_806;
  const httpPort = 18_807;
  const gateway = new BridgeGateway({ port: wsPort });
  const app = createHttpApp(gateway);
  let server: ReturnType<typeof app.listen> | undefined;

  gateway.start();
  server = app.listen(httpPort);

  try {
    const response = await fetch(`http://localhost:${httpPort}/audit?limit=1`);
    assert.equal(response.status, 200);
    const body = (await response.json()) as { events: Array<{ type: string }> };
    assert.equal(body.events.length, 1);
    assert.equal(body.events[0]?.type, "gateway.started");

    const badLimit = await fetch(`http://localhost:${httpPort}/audit?limit=0`);
    assert.equal(badLimit.status, 400);
  } finally {
    gateway.stop();
    server?.close();
  }
});

test("HTTP gateway streams audit events as server-sent events", async () => {
  const wsPort = 18_824;
  const httpPort = 18_825;
  const gateway = new BridgeGateway({ port: wsPort });
  const app = createHttpApp(gateway);
  const abort = new AbortController();
  let server: ReturnType<typeof app.listen> | undefined;

  gateway.start();
  server = app.listen(httpPort);

  try {
    const response = await fetch(`http://localhost:${httpPort}/audit/stream?replay=1`, {
      signal: abort.signal
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type")?.startsWith("text/event-stream"), true);
    assert.ok(response.body);

    const reader = response.body.getReader();
    const started = await readStreamUntil(reader, "gateway.started");
    assert.match(started, /event: audit/);

    await assert.rejects(
      () => gateway.callTool("com_mobigent_stream.missing_tool", {}),
      /No connected app exposes tool/
    );
    const live = await readStreamUntil(reader, "tool.call.failed");
    assert.match(live, /No connected app exposes tool/);

    await reader.cancel();
  } finally {
    abort.abort();
    gateway.stop();
    server?.close();
  }
});

test("provider HTTP client streams audit events", async () => {
  const wsPort = 18_828;
  const httpPort = 18_829;
  const gateway = new BridgeGateway({ port: wsPort });
  const app = createHttpApp(gateway);
  const controller = new AbortController();
  let server: ReturnType<typeof app.listen> | undefined;

  gateway.start();
  server = app.listen(httpPort);

  const client = createMobigentHttpClient({
    baseUrl: `http://localhost:${httpPort}`,
    agentId: "audit-monitor"
  });

  try {
    const events: string[] = [];
    const reader = (async () => {
      for await (const event of client.watchAuditEvents({ replay: 1, signal: controller.signal })) {
        events.push(event.type);
        if (events.includes("tool.call.failed")) {
          controller.abort();
          break;
        }
      }
    })();

    await waitFor(() => events.includes("gateway.started"));
    await assert.rejects(
      () => gateway.callTool("com_mobigent_stream.missing_tool", {}, { agentId: "audit-monitor" }),
      /No connected app exposes tool/
    );
    await waitFor(() => events.includes("tool.call.failed"));
    await reader;

    assert.ok(events.includes("gateway.started"));
    assert.ok(events.includes("tool.call.failed"));
  } finally {
    controller.abort();
    gateway.stop();
    server?.close();
  }
});

test("gateway exposes app session status for operators", async () => {
  const wsPort = 18_818;
  const httpPort = 18_819;
  const gateway = new BridgeGateway({ port: wsPort, manifestSigningSecret: "status-secret" });
  const bridge = new Mobigent();
  const app = createHttpApp(gateway);
  let server: ReturnType<typeof app.listen> | undefined;

  gateway.start();
  server = app.listen(httpPort);

  bridge.configure({
    appId: "com.mobigent.status",
    appName: "Status App",
    gatewayUrl: `ws://localhost:${wsPort}`,
    createSocket: createNodeSocket,
    signManifest: (manifest) => signManifest(manifest, "status-secret")
  });
  bridge.registerAction({
    name: "status_action",
    description: "Action for status test.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ({ ok: true })
  });
  bridge.registerResource({
    name: "status_resource",
    description: "Status resource.",
    read: async () => ({ ok: true })
  });
  bridge.registerComponent({
    name: "status_screen",
    description: "Status screen.",
    focus: async () => ({ focused: true })
  });

  try {
    await bridge.connect();
    await delay(50);

    assert.deepEqual(gateway.getStatus(), {
      appSessions: 1,
      authenticatedAppSessions: 1,
      appsWithManifests: 1,
      tools: 3,
      auditEvents: gateway.getAuditLog().length,
      idempotencyRecords: 0,
      rateLimitBuckets: 0,
      manifestSigningRequired: true,
      appAllowlistEnabled: false,
      agentProfilesConfigured: false
    });

    const apps = gateway.listApps();
    assert.equal(apps.length, 1);
    assert.equal(apps[0]?.app?.id, "com.mobigent.status");
    assert.ok(apps[0]?.lastSeenAt);
    assert.equal(typeof apps[0]?.ageMs, "number");
    assert.equal(typeof apps[0]?.idleMs, "number");
    assert.equal(apps[0]?.app?.protocolVersion, 1);
    assert.equal(apps[0]?.app?.protocolCompatible, true);
    assert.equal(apps[0]?.capabilities.tools, 3);
    assert.equal(apps[0]?.manifest?.signed, true);
    assert.ok(apps[0]?.manifest?.acceptedAt);

    const healthResponse = await fetch(`http://localhost:${httpPort}/health`);
    assert.equal(healthResponse.status, 200);
    const health = (await healthResponse.json()) as {
      status: { appSessions: number; tools: number; manifestSigningRequired: boolean };
    };
    assert.equal(health.status.appSessions, 1);
    assert.equal(health.status.tools, 3);
    assert.equal(health.status.manifestSigningRequired, true);

    const readyResponse = await fetch(`http://localhost:${httpPort}/ready?minApps=1&minTools=3`);
    assert.equal(readyResponse.status, 200);
    const ready = (await readyResponse.json()) as {
      ok: boolean;
      requirements: { minApps: number; minTools: number };
      checks: { apps: { actual: number; required: number }; tools: { actual: number; required: number } };
    };
    assert.equal(ready.ok, true);
    assert.deepEqual(ready.requirements, { minApps: 1, minTools: 3 });
    assert.equal(ready.checks.apps.actual, 1);
    assert.equal(ready.checks.tools.required, 3);

    const notReadyResponse = await fetch(`http://localhost:${httpPort}/ready?minTools=4`);
    assert.equal(notReadyResponse.status, 503);
    const notReady = (await notReadyResponse.json()) as { ok: boolean; checks: { tools: { actual: number } } };
    assert.equal(notReady.ok, false);
    assert.equal(notReady.checks.tools.actual, 3);

    assert.deepEqual(await gateway.callTool("com_mobigent_status.status_action", {}, { agentId: "ops-agent" }), {
      ok: true
    });
    await assert.rejects(
      () => gateway.callTool("com_mobigent_status.missing_action", {}, { agentId: "ops-agent" }),
      /No connected app exposes tool/
    );

    const metrics = gateway.getMetrics();
    assert.equal(metrics.status.tools, 3);
    assert.equal(metrics.auditEvents["tool.call.started"], 1);
    assert.equal(metrics.auditEvents["tool.call.succeeded"], 1);
    assert.equal(metrics.auditEvents["tool.call.failed"], 1);
    assert.equal(metrics.toolCalls.started, 1);
    assert.equal(metrics.toolCalls.succeeded, 1);
    assert.equal(metrics.toolCalls.failed, 1);
    assert.equal(metrics.byTool["com_mobigent_status.status_action"]?.succeeded, 1);
    assert.equal(metrics.byAgent["ops-agent"]?.started, 1);
    assert.equal(metrics.byAgent["ops-agent"]?.failed, 1);

    const metricsResponse = await fetch(`http://localhost:${httpPort}/metrics`);
    assert.equal(metricsResponse.status, 200);
    const metricsBody = (await metricsResponse.json()) as {
      metrics: { status: { tools: number }; toolCalls: { succeeded: number } };
    };
    assert.equal(metricsBody.metrics.status.tools, 3);
    assert.equal(metricsBody.metrics.toolCalls.succeeded, 1);

    const prometheusResponse = await fetch(`http://localhost:${httpPort}/metrics/prometheus`);
    assert.equal(prometheusResponse.status, 200);
    assert.match(prometheusResponse.headers.get("content-type") ?? "", /text\/plain/);
    const prometheus = await prometheusResponse.text();
    assert.match(prometheus, /# TYPE mobigent_tools gauge/);
    assert.match(prometheus, /mobigent_tools 3/);
    assert.match(prometheus, /mobigent_tool_calls_total\{outcome="succeeded"\} 1/);
    assert.match(
      prometheus,
      /mobigent_tool_calls_by_tool_total\{tool="com_mobigent_status.status_action",outcome="succeeded"\} 1/
    );
    assert.match(prometheus, /mobigent_tool_calls_by_agent_total\{agent="ops-agent",outcome="failed"\} 1/);

    const appsResponse = await fetch(`http://localhost:${httpPort}/apps`);
    assert.equal(appsResponse.status, 200);
    const appsBody = (await appsResponse.json()) as {
      apps: Array<{ app?: { id: string }; capabilities: { tools: number }; manifest?: { signed: boolean } }>;
    };
    assert.equal(appsBody.apps[0]?.app?.id, "com.mobigent.status");
    assert.equal(appsBody.apps[0]?.capabilities.tools, 3);
    assert.equal(appsBody.apps[0]?.manifest?.signed, true);

    const providersResponse = await fetch(`http://localhost:${httpPort}/providers`);
    assert.equal(providersResponse.status, 200);
    const providersBody = (await providersResponse.json()) as {
      providers: Array<{ id: string; setup?: { openApiUrl?: string } }>;
    };
    assert.ok(providersBody.providers.some((provider) => provider.id === "openai-responses"));
    assert.ok(providersBody.providers.some((provider) => provider.id === "openrouter"));
    assert.ok(providersBody.providers.some((provider) => provider.id === "litellm"));
    assert.ok(providersBody.providers.some((provider) => provider.id === "ollama"));
    assert.ok(providersBody.providers.some((provider) => provider.id === "lm-studio"));
    assert.ok(providersBody.providers.some((provider) => provider.id === "xai-grok"));
    assert.ok(providersBody.providers.some((provider) => provider.id === "deepseek"));
    assert.ok(providersBody.providers.some((provider) => provider.id === "together-ai"));
    assert.ok(providersBody.providers.some((provider) => provider.id === "fireworks-ai"));
    assert.ok(providersBody.providers.some((provider) => provider.id === "mistral"));
    assert.ok(providersBody.providers.some((provider) => provider.id === "cohere"));
    assert.ok(providersBody.providers.some((provider) => provider.id === "anthropic-tool-use"));
    assert.ok(providersBody.providers.some((provider) => provider.id === "aws-bedrock-converse"));
    assert.equal(
      providersBody.providers.find((provider) => provider.id === "openapi")?.setup?.openApiUrl,
      `http://localhost:${httpPort}/openapi.json`
    );

    const snapshotResponse = await fetch(`http://localhost:${httpPort}/snapshot`, {
      headers: {
        "x-mobigent-agent": "ops-agent"
      }
    });
    assert.equal(snapshotResponse.status, 200);
    const snapshotBody = (await snapshotResponse.json()) as {
      agentId?: string;
      config: { endpoints: { snapshot: string } };
      health: { status: { tools: number } };
      providers: Array<{ id: string }>;
      tools: Array<{ name: string }>;
      audit: Array<{ type: string }>;
    };
    assert.equal(snapshotBody.agentId, "ops-agent");
    assert.equal(snapshotBody.config.endpoints.snapshot, "/snapshot");
    assert.equal(snapshotBody.health.status.tools, 3);
    assert.ok(snapshotBody.providers.some((provider) => provider.id === "openai-responses"));
    assert.ok(snapshotBody.tools.some((tool) => tool.name === "com_mobigent_status.status_action"));
    assert.ok(snapshotBody.audit.some((event) => event.type === "tool.call.succeeded"));

    const snapshotClient = createMobigentHttpClient({
      baseUrl: `http://localhost:${httpPort}`,
      agentId: "ops-agent"
    });
    const clientSnapshot = await snapshotClient.getSnapshot();
    assert.equal(clientSnapshot.agentId, "ops-agent");
    assert.equal(clientSnapshot.tools.length, 3);
    assert.equal(clientSnapshot.agents[0]?.agentId, "ops-agent");
    assert.equal(clientSnapshot.agents[0]?.visibleTools, 3);

    const agentVisibility = await snapshotClient.listAgentVisibility({ agentId: ["ops-agent", "anonymous"] });
    assert.deepEqual(
      agentVisibility.map((agent) => ({
        agentId: agent.agentId,
        profileConfigured: agent.profileConfigured,
        visibleTools: agent.visibleTools,
        hiddenTools: agent.hiddenTools
      })),
      [
        { agentId: "ops-agent", profileConfigured: false, visibleTools: 3, hiddenTools: 0 },
        { agentId: "anonymous", profileConfigured: false, visibleTools: 3, hiddenTools: 0 }
      ]
    );

    const configResponse = await fetch(`http://localhost:${httpPort}/config`);
    assert.equal(configResponse.status, 200);
    const configBody = (await configResponse.json()) as {
      baseUrl: string;
      protocol: { currentVersion: number; supportedVersions: number[] };
      auth: { required: boolean };
      endpoints: { ready: string; agents: string; providers: string; snapshot: string; tools: string; toolStream: string; inspector: string; openApi: string };
      features: { dynamicTools: boolean; agentVisibility: boolean; agentScopedDiscovery: boolean; agentProfiles: boolean; providerSnapshot: boolean };
      limits: { jsonBodyLimit: string | number; maxTimeoutMs: number };
      headers: { agentId: string; idempotencyKey: string };
    };
    assert.equal(configBody.baseUrl, `http://localhost:${httpPort}`);
    assert.equal(configBody.protocol.currentVersion, 1);
    assert.deepEqual(configBody.protocol.supportedVersions, [1]);
    assert.equal(configBody.auth.required, false);
    assert.equal(configBody.endpoints.ready, "/ready");
    assert.equal(configBody.endpoints.agents, "/agents");
    assert.equal(configBody.endpoints.providers, "/providers");
    assert.equal(configBody.endpoints.snapshot, "/snapshot");
    assert.equal(configBody.endpoints.tools, "/tools");
    assert.equal(configBody.endpoints.toolStream, "/tools/stream");
    assert.equal(configBody.endpoints.inspector, "/inspect");
    assert.equal(configBody.endpoints.openApi, "/openapi.json");
    assert.equal(configBody.features.dynamicTools, true);
    assert.equal(configBody.features.agentVisibility, true);
    assert.equal(configBody.features.agentScopedDiscovery, true);
    assert.equal(configBody.features.agentProfiles, true);
    assert.equal(configBody.features.providerSnapshot, true);
    assert.equal(configBody.limits.jsonBodyLimit, "1mb");
    assert.equal(configBody.limits.maxTimeoutMs, 120_000);
    assert.equal(configBody.headers.agentId, "x-mobigent-agent");
    assert.equal(configBody.headers.idempotencyKey, "x-mobigent-idempotency-key");

    const openApi = await fetch(`http://localhost:${httpPort}/openapi.json`);
    assert.equal(openApi.status, 200);
    const spec = (await openApi.json()) as { paths: Record<string, unknown> };
    assert.ok(spec.paths["/apps"]);
    assert.ok(spec.paths["/agents"]);
    assert.ok(spec.paths["/config"]);
    assert.ok(spec.paths["/ready"]);
    assert.ok(spec.paths["/providers"]);
    assert.ok(spec.paths["/snapshot"]);
    assert.ok(spec.paths["/metrics"]);
    assert.ok(spec.paths["/metrics/prometheus"]);

    const inspector = await fetch(`http://localhost:${httpPort}/inspect`);
    assert.equal(inspector.status, 200);
    assert.match(await inspector.text(), /Mobigent Inspector/);
  } finally {
    bridge.disconnect();
    gateway.stop();
    server?.close();
  }
});

test("HTTP gateway can require an agent-facing API key", async () => {
  const wsPort = 18_810;
  const httpPort = 18_811;
  const gateway = new BridgeGateway({ port: wsPort });
  const app = createHttpApp(gateway, { apiKey: "http-secret" });
  let server: ReturnType<typeof app.listen> | undefined;

  gateway.start();
  server = app.listen(httpPort);

  try {
    const health = await fetch(`http://localhost:${httpPort}/health`);
    assert.equal(health.status, 200);

    const ready = await fetch(`http://localhost:${httpPort}/ready?minTools=1`);
    assert.equal(ready.status, 503);

    const openApi = await fetch(`http://localhost:${httpPort}/openapi.json`);
    assert.equal(openApi.status, 200);
    const spec = (await openApi.json()) as {
      components?: { securitySchemes?: Record<string, unknown> };
      paths: Record<string, { get?: { security?: unknown } }>;
    };
    assert.ok(spec.components?.securitySchemes?.bearerAuth);
    assert.ok(spec.components?.securitySchemes?.mobigentApiKey);
    assert.deepEqual(spec.paths["/tools"]?.get?.security, [
      { bearerAuth: [] },
      { mobigentApiKey: [] }
    ]);

    const denied = await fetch(`http://localhost:${httpPort}/tools`);
    assert.equal(denied.status, 401);
    const deniedMetrics = await fetch(`http://localhost:${httpPort}/metrics`);
    assert.equal(deniedMetrics.status, 401);
    const deniedPrometheusMetrics = await fetch(`http://localhost:${httpPort}/metrics/prometheus`);
    assert.equal(deniedPrometheusMetrics.status, 401);
    const deniedProviders = await fetch(`http://localhost:${httpPort}/providers`);
    assert.equal(deniedProviders.status, 401);
    const publicConfig = await fetch(`http://localhost:${httpPort}/config`);
    assert.equal(publicConfig.status, 200);
    assert.equal(((await publicConfig.json()) as { auth: { required: boolean } }).auth.required, true);

    const apiKeyAllowed = await fetch(`http://localhost:${httpPort}/tools`, {
      headers: { "x-mobigent-api-key": "http-secret" }
    });
    assert.equal(apiKeyAllowed.status, 200);

    const providersAllowed = await fetch(`http://localhost:${httpPort}/providers`, {
      headers: { "x-mobigent-api-key": "http-secret" }
    });
    assert.equal(providersAllowed.status, 200);

    const bearerAllowed = await fetch(`http://localhost:${httpPort}/audit`, {
      headers: { authorization: "Bearer http-secret" }
    });
    assert.equal(bearerAllowed.status, 200);
  } finally {
    gateway.stop();
    server?.close();
  }
});

test("HTTP gateway binds per-agent API keys to agent identity", async () => {
  const wsPort = 18_843;
  const httpPort = 18_844;
  const gateway = new BridgeGateway({
    port: wsPort,
    agentProfiles: {
      "chatgpt-actions": {
        readOnly: true,
        maxRisk: "low"
      },
      cursor: {
        allowedTools: ["com_mobigent_agent_keys.*"]
      }
    }
  });
  const bridge = new Mobigent();
  const app = createHttpApp(gateway, {
    agentApiKeys: {
      "chatgpt-actions": "chatgpt-secret",
      cursor: "cursor-secret"
    }
  });
  let server: ReturnType<typeof app.listen> | undefined;

  gateway.start();
  server = app.listen(httpPort);

  bridge.configure({
    appId: "com.mobigent.agent_keys",
    appName: "Agent Keys App",
    gatewayUrl: `ws://localhost:${wsPort}`,
    createSocket: createNodeSocket
  });

  bridge.registerAction({
    name: "create_note",
    description: "Create a note.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ({ created: true })
  });

  bridge.registerResource({
    name: "notes",
    description: "Read notes.",
    read: async () => ({ notes: [] })
  });

  try {
    await bridge.connect();
    await delay(50);

    const denied = await fetch(`http://localhost:${httpPort}/tools`);
    assert.equal(denied.status, 401);

    const chatGptTools = await fetch(`http://localhost:${httpPort}/tools`, {
      headers: { "x-mobigent-api-key": "chatgpt-secret" }
    });
    assert.equal(chatGptTools.status, 200);
    assert.deepEqual(
      (await chatGptTools.json()).tools.map((tool: { name: string }) => tool.name),
      ["com_mobigent_agent_keys.get_notes"]
    );

    const spoofed = await fetch(`http://localhost:${httpPort}/tools`, {
      headers: {
        "x-mobigent-api-key": "chatgpt-secret",
        "x-mobigent-agent": "cursor"
      }
    });
    assert.equal(spoofed.status, 403);
    assert.match(await spoofed.text(), /bound to agent .*chatgpt-actions/);

    const cursorCall = await fetch(`http://localhost:${httpPort}/tools/com_mobigent_agent_keys.create_note/call`, {
      method: "POST",
      headers: {
        authorization: "Bearer cursor-secret",
        "content-type": "application/json"
      },
      body: "{}"
    });
    assert.equal(cursorCall.status, 200);
    assert.deepEqual(await cursorCall.json(), {
      tool: "com_mobigent_agent_keys.create_note",
      result: { created: true }
    });
  } finally {
    bridge.disconnect();
    gateway.stop();
    server?.close();
  }
});

test("HTTP gateway can restrict browser CORS origins", async () => {
  const port = 18_832;
  const httpPort = 18_833;
  const gateway = new BridgeGateway(port);
  const app = createHttpApp(gateway, {
    corsOrigins: ["https://allowed.example"]
  });
  let server: ReturnType<typeof app.listen> | undefined;

  gateway.start();
  server = app.listen(httpPort);

  try {
    const allowed = await fetch(`http://localhost:${httpPort}/health`, {
      headers: { origin: "https://allowed.example" }
    });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.headers.get("access-control-allow-origin"), "https://allowed.example");

    const denied = await fetch(`http://localhost:${httpPort}/health`, {
      headers: { origin: "https://denied.example" }
    });
    assert.equal(denied.status, 200);
    assert.equal(denied.headers.get("access-control-allow-origin"), null);
  } finally {
    gateway.stop();
    server?.close();
  }
});

test("HTTP gateway rejects JSON request bodies larger than the configured limit", async () => {
  const port = 18_834;
  const httpPort = 18_835;
  const gateway = new BridgeGateway(port);
  const app = createHttpApp(gateway, {
    jsonBodyLimit: "20b"
  });
  let server: ReturnType<typeof app.listen> | undefined;

  gateway.start();
  server = app.listen(httpPort);

  try {
    const response = await fetch(`http://localhost:${httpPort}/tools/example.call/call`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ value: "this body is intentionally too large" })
    });
    assert.equal(response.status, 413);
    assert.match(await response.text(), /larger than the configured Mobigent HTTP JSON limit/);
  } finally {
    gateway.stop();
    server?.close();
  }
});

test("OpenAPI schema includes provider-friendly per-tool operations", () => {
  const spec = createOpenApiSpec(
    "https://mobigent.example",
    [
      {
        name: "com_mobigent_expenses.create_expense",
        description: "Expenses: Create a new expense.",
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
        readOnly: false,
        risk: "medium",
        app: {
          id: "com.mobigent.expenses",
          name: "Expenses"
        }
      },
      {
        name: "com_mobigent_expenses.get_expenses",
        description: "Expenses: Read expenses.",
        inputSchema: {
          type: "object",
          properties: {}
        },
        outputSchema: {
          type: "object",
          properties: {
            expenses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" }
                },
                required: ["id"]
              }
            }
          },
          required: ["expenses"]
        },
        readOnly: true,
        risk: "low",
        app: {
          id: "com.mobigent.expenses",
          name: "Expenses"
        }
      }
    ],
    { requireAuth: true }
  );

  const createPath = spec.paths["/tools/com_mobigent_expenses.create_expense/call"];
  const readPath = spec.paths["/tools/com_mobigent_expenses.get_expenses/call"];

  assert.equal(spec.servers[0]?.url, "https://mobigent.example");
  assert.ok(spec.components?.securitySchemes?.bearerAuth);
  assert.equal(createPath?.post.operationId, "call_com_mobigent_expenses_create_expense");
  assert.equal(createPath?.post["x-openai-isConsequential"], true);
  assert.deepEqual(createPath?.post.security, [{ bearerAuth: [] }, { mobigentApiKey: [] }]);
  assert.deepEqual(
    createPath?.post.requestBody.content["application/json"].schema.required,
    ["amount", "merchant"]
  );
  assert.deepEqual(
    createPath?.post.responses["200"].content["application/json"].schema.properties.result.required,
    ["id", "amount", "merchant"]
  );
  assert.equal(readPath?.post["x-openai-isConsequential"], false);
  assert.equal(
    readPath?.post.responses["200"].content["application/json"].schema.properties.result.properties.expenses.type,
    "array"
  );
  assert.equal(spec.paths["/tools/stream"]?.get.operationId, "streamTools");
  assert.equal(spec.paths["/tools/{toolName}/call"]?.post.operationId, "callTool");
});

test("HTTP OpenAPI endpoint reflects currently connected tools", async () => {
  const wsPort = 18_808;
  const httpPort = 18_809;
  const gateway = new BridgeGateway({ port: wsPort });
  const bridge = new Mobigent();
  const app = createHttpApp(gateway);
  let server: ReturnType<typeof app.listen> | undefined;

  gateway.start();
  server = app.listen(httpPort);

  bridge.configure({
    appId: "com.mobigent.openapi",
    appName: "OpenAPI App",
    gatewayUrl: `ws://localhost:${wsPort}`,
    createSocket: createNodeSocket
  });

  bridge.registerAction({
    name: "create_expense",
    description: "Create an expense.",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "number" }
      },
      required: ["amount"]
    },
    outputSchema: {
      type: "object",
      properties: {
        amount: { type: "number" }
      },
      required: ["amount"]
    },
    handler: async (input) => ({ amount: input.amount })
  });
  bridge.registerAction({
    name: "admin_delete_expense",
    description: "Delete an expense.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" }
      },
      required: ["id"]
    },
    policy: {
      allowedAgents: ["admin-agent"]
    },
    handler: async () => ({ deleted: true })
  });

  try {
    await bridge.connect();
    await delay(50);

    const response = await fetch(`http://localhost:${httpPort}/openapi.json`);
    assert.equal(response.status, 200);
    const spec = (await response.json()) as { paths: Record<string, any> };
    const path = spec.paths["/tools/com_mobigent_openapi.create_expense/call"];
    assert.ok(path);
    assert.equal(spec.paths["/tools/com_mobigent_openapi.admin_delete_expense/call"], undefined);
    assert.equal(
      path.post.responses["200"].content["application/json"].schema.properties.result.properties.amount.type,
      "number"
    );

    const adminResponse = await fetch(`http://localhost:${httpPort}/openapi.json?agentId=admin-agent`);
    assert.equal(adminResponse.status, 200);
    const adminSpec = (await adminResponse.json()) as { paths: Record<string, any> };
    assert.ok(adminSpec.paths["/tools/com_mobigent_openapi.admin_delete_expense/call"]);
  } finally {
    bridge.disconnect();
    gateway.stop();
    server?.close();
  }
});

test("provider HTTP adapter lists, maps, and executes gateway tools", async () => {
  const wsPort = 18_814;
  const httpPort = 18_815;
  const gateway = new BridgeGateway({ port: wsPort });
  const bridge = new Mobigent();
  const app = createHttpApp(gateway, { apiKey: "adapter-secret" });
  let server: ReturnType<typeof app.listen> | undefined;

  gateway.start();
  server = app.listen(httpPort);

  bridge.configure({
    appId: "com.mobigent.adapter",
    appName: "Adapter App",
    gatewayUrl: `ws://localhost:${wsPort}`,
    createSocket: createNodeSocket
  });

  bridge.registerAction({
    name: "create_note",
    description: "Create a note.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" }
      },
      required: ["title"]
    },
    policy: {
      allowedAgents: ["openai-responses"]
    },
    handler: async (input) => ({ id: "NOTE-1", title: input.title })
  });

  try {
    await bridge.connect();
    await delay(50);

    const client = createMobigentHttpClient({
      baseUrl: `http://localhost:${httpPort}`,
      auth: "bearer",
      apiKey: "adapter-secret",
      agentId: "openai-responses"
    });
    const tools = await client.listTools();
    const tool = await client.getTool("com_mobigent_adapter.create_note");
    const apps = await client.listApps();
    const auditEvents = await client.listAuditEvents({ limit: 10 });
    const providers = await client.listProviders();
    const config = await client.getConfig();
    const health = await client.getHealth();
    const readiness = await client.getReadiness({ minApps: 1, minTools: 1 });
    const metrics = await client.getMetrics();

    assert.deepEqual(client.headers(), {
      "content-type": "application/json",
      "x-mobigent-agent": "openai-responses",
      authorization: "Bearer adapter-secret"
    });
    assert.deepEqual(
      tools.map((tool) => tool.name),
      ["com_mobigent_adapter.create_note"]
    );
    assert.equal(tool.name, "com_mobigent_adapter.create_note");
    assert.equal(tool.inputSchema.properties?.title?.type, "string");
    assert.equal(apps[0]?.app?.id, "com.mobigent.adapter");
    assert.equal(apps[0]?.capabilities.tools, 1);
    assert.ok(auditEvents.some((event) => event.type === "manifest.registered"));
    assert.ok(providers.some((provider) => provider.id === "openai-responses"));
    assert.ok(providers.some((provider) => provider.id === "openrouter"));
    assert.ok(providers.some((provider) => provider.id === "litellm"));
    assert.ok(providers.some((provider) => provider.id === "ollama"));
    assert.ok(providers.some((provider) => provider.id === "lm-studio"));
    assert.ok(providers.some((provider) => provider.id === "xai-grok"));
  assert.ok(providers.some((provider) => provider.id === "deepseek"));
  assert.ok(providers.some((provider) => provider.id === "together-ai"));
  assert.ok(providers.some((provider) => provider.id === "fireworks-ai"));
  assert.ok(providers.some((provider) => provider.id === "mistral"));
    assert.ok(providers.some((provider) => provider.id === "cohere"));
    assert.ok(providers.some((provider) => provider.id === "semantic-kernel"));
    assert.equal(config.auth.required, true);
    assert.deepEqual(config.protocol.supportedVersions, [1]);
    assert.equal(config.endpoints.ready, "/ready");
    assert.equal(config.endpoints.toolCallTemplate, "/tools/{toolName}/call");
    assert.equal(config.features.toolStreaming, true);
    assert.equal(config.headers.timeoutMs, "x-mobigent-timeout-ms");
    assert.equal(health.ok, true);
    assert.equal(health.status.tools, 1);
    assert.equal(readiness.ok, true);
    assert.equal(readiness.checks.tools.actual, 1);
    assert.equal(metrics.status.tools, 1);
    assert.equal(metrics.toolCalls.started, 0);
    assert.deepEqual(toOpenAiTools(tools), [
      {
        type: "function",
        name: "com_mobigent_adapter.create_note",
        description: "Adapter App: Create a note.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" }
          },
          required: ["title"]
        }
      }
    ]);
    assert.deepEqual(toChatFunctionTools(tools), [
      {
        type: "function",
        function: {
          name: "com_mobigent_adapter.create_note",
          description: "Adapter App: Create a note.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" }
            },
            required: ["title"]
          }
        }
      }
    ]);
    assert.deepEqual(toAnthropicTools(tools), [
      {
        name: "com_mobigent_adapter.create_note",
        description: "Adapter App: Create a note.",
        input_schema: {
          type: "object",
          properties: {
            title: { type: "string" }
          },
          required: ["title"]
        }
      }
    ]);
    assert.deepEqual(toGeminiFunctionDeclarations(tools), [
      {
        name: "com_mobigent_adapter.create_note",
        description: "Adapter App: Create a note.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" }
          },
          required: ["title"]
        }
      }
    ]);
    assert.deepEqual(toBedrockToolConfigTools(tools), [
      {
        toolSpec: {
          name: "com_mobigent_adapter.create_note",
          description: "Adapter App: Create a note.",
          inputSchema: {
            json: {
              type: "object",
              properties: {
                title: { type: "string" }
              },
              required: ["title"]
            }
          }
        }
      }
    ]);

    const executeTool = createMobigentToolExecutor(client);
    assert.deepEqual(await executeTool("com_mobigent_adapter.create_note", { title: "Ship SDK" }), {
      id: "NOTE-1",
      title: "Ship SDK"
    });

    const executableTools = toExecutableTools(tools, client);
    assert.equal(executableTools[0]?.schema, tools[0]?.inputSchema);
    assert.deepEqual(await executableTools[0]?.execute({ title: "Executable" }), {
      id: "NOTE-1",
      title: "Executable"
    });

    const langChainTools = toLangChainTools(tools, client);
    assert.deepEqual(langChainTools[0]?.lc_namespace, ["mobigent", "tools"]);
    assert.deepEqual(await langChainTools[0]?.execute({ title: "LangChain" }), {
      id: "NOTE-1",
      title: "LangChain"
    });

    const llamaIndexTools = toLlamaIndexTools(tools, client);
    assert.equal(llamaIndexTools[0]?.metadata.name, "com_mobigent_adapter.create_note");
    assert.deepEqual(await llamaIndexTools[0]?.call({ title: "LlamaIndex" }), {
      id: "NOTE-1",
      title: "LlamaIndex"
    });

    const mastraTools = toMastraTools(tools, client);
    assert.equal(mastraTools[0]?.inputSchema, tools[0]?.inputSchema);
    assert.deepEqual(await mastraTools[0]?.execute({ input: { title: "Mastra" } }), {
      id: "NOTE-1",
      title: "Mastra"
    });

    const semanticKernelPlugin = toSemanticKernelPlugin(tools, client);
    assert.equal(semanticKernelPlugin[0]?.pluginName, "Mobigent");
    assert.equal(semanticKernelPlugin[0]?.parameters, tools[0]?.inputSchema);
    assert.deepEqual(await semanticKernelPlugin[0]?.invoke({ title: "Semantic Kernel" }), {
      id: "NOTE-1",
      title: "Semantic Kernel"
    });

    const vercelTools = toVercelAiSdkTools(tools, client);
    assert.equal(vercelTools["com_mobigent_adapter.create_note"]?.parameters, tools[0]?.inputSchema);
    assert.deepEqual(
      await vercelTools["com_mobigent_adapter.create_note"]?.execute({ title: "Vercel" }),
      {
        id: "NOTE-1",
        title: "Vercel"
      }
    );

    const crewAiTools = toCrewAiTools(tools, client);
    assert.equal(crewAiTools[0]?.args_schema, tools[0]?.inputSchema);
    assert.deepEqual(await crewAiTools[0]?.run({ title: "CrewAI" }), {
      id: "NOTE-1",
      title: "CrewAI"
    });

    const autoGenTools = toAutoGenTools(tools, client);
    assert.equal(autoGenTools[0]?.schema, tools[0]?.inputSchema);
    assert.deepEqual(await autoGenTools[0]?.run({ title: "AutoGen" }), {
      id: "NOTE-1",
      title: "AutoGen"
    });

    const haystackTools = toHaystackTools(tools, client);
    assert.equal(haystackTools[0]?.parameters, tools[0]?.inputSchema);
    assert.deepEqual(await haystackTools[0]?.invoke({ title: "Haystack" }), {
      id: "NOTE-1",
      title: "Haystack"
    });
  } finally {
    bridge.disconnect();
    gateway.stop();
    server?.close();
  }
});

test("provider helpers generate copy-pasteable agent configuration", () => {
  const claude = createClaudeDesktopProvider({
    command: "mobigent-mcp",
    env: { MOBIGENT_AUTH_TOKEN: "secret" }
  });
  const chatgpt = createChatGptActionsProvider({
    baseUrl: "https://mobigent.example",
    auth: "bearer"
  });
  const vscode = createVsCodeProvider({ command: "npx", args: ["mobigent-mcp"] });
  const anthropic = createAnthropicToolUseProvider({
    baseUrl: "http://localhost:8788",
    auth: "api-key",
    agentId: "claude-server"
  });
  const azureOpenAi = createAzureOpenAiProvider({
    baseUrl: "http://localhost:8788"
  });
  const openAiCompatible = createOpenAiCompatibleProvider({
    baseUrl: "http://localhost:8788"
  });
  const openrouter = createOpenRouterProvider({
    baseUrl: "http://localhost:8788"
  });
  const litellm = createLiteLlmProvider({
    baseUrl: "http://localhost:8788"
  });
  const ollama = createOllamaProvider({
    baseUrl: "http://localhost:8788"
  });
  const lmStudio = createLmStudioProvider({
    baseUrl: "http://localhost:8788"
  });
  const groq = createGroqProvider({
    baseUrl: "http://localhost:8788"
  });
  const perplexity = createPerplexityProvider({
    baseUrl: "http://localhost:8788"
  });
  const xaiGrok = createXaiGrokProvider({
    baseUrl: "http://localhost:8788"
  });
  const deepseek = createDeepSeekProvider({
    baseUrl: "http://localhost:8788"
  });
  const together = createTogetherAiProvider({
    baseUrl: "http://localhost:8788"
  });
  const fireworks = createFireworksAiProvider({
    baseUrl: "http://localhost:8788"
  });
  const qwen = createQwenDashScopeProvider({
    baseUrl: "http://localhost:8788"
  });
  const nvidia = createNvidiaNimProvider({
    baseUrl: "http://localhost:8788"
  });
  const cloudflare = createCloudflareAiGatewayProvider({
    baseUrl: "http://localhost:8788"
  });
  const mistral = createMistralProvider({
    baseUrl: "http://localhost:8788"
  });
  const cohere = createCohereProvider({
    baseUrl: "http://localhost:8788"
  });
  const langchain = createLangChainProvider({
    baseUrl: "http://localhost:8788"
  });
  const gemini = createGoogleGeminiProvider({
    baseUrl: "http://localhost:8788",
    auth: "bearer"
  });
  const vertexAi = createGoogleVertexAiProvider({
    baseUrl: "http://localhost:8788"
  });
  const bedrock = createAwsBedrockConverseProvider({
    baseUrl: "http://localhost:8788"
  });
  const vercel = createVercelAiSdkProvider({
    baseUrl: "http://localhost:8788"
  });
  const semanticKernel = createSemanticKernelProvider({
    baseUrl: "http://localhost:8788"
  });
  const crewai = createCrewAiProvider({
    baseUrl: "http://localhost:8788"
  });
  const autogen = createAutoGenProvider({
    baseUrl: "http://localhost:8788"
  });
  const haystack = createHaystackProvider({
    baseUrl: "http://localhost:8788"
  });
  const catalog = createProviderCatalog({
    mcp: { command: "mobigent-mcp" },
    openApi: { baseUrl: "https://mobigent.example" }
  });

  assert.equal(claude.capabilities.transport, "stdio");
  assert.equal(claude.capabilities.supportsDynamicTools, true);
  assert.deepEqual(claude.setup, {
    mcpServers: {
      mobigent: {
        command: "mobigent-mcp",
        args: [],
        env: { MOBIGENT_AUTH_TOKEN: "secret" }
      }
    }
  });

  assert.equal(chatgpt.capabilities.requiresPublicUrl, true);
  assert.equal(chatgpt.setup.openApiUrl, "https://mobigent.example/openapi.json");
  assert.deepEqual(vscode.setup, {
    servers: {
      mobigent: {
        type: "stdio",
        command: "npx",
        args: ["mobigent-mcp"],
        env: {}
      }
    }
  });
  assert.equal(anthropic.capabilities.transport, "http");
  assert.equal(anthropic.capabilities.supportsDynamicTools, true);
  assert.deepEqual(getProviderIntegrationProfile(claude), {
    category: "local-agent",
    bestFor: ["desktop agents", "local development", "MCP-compatible clients"],
    setupComplexity: "low",
    productionNotes: [
      "Runs without a public URL.",
      "Best when the provider can launch a local Mobigent MCP command."
    ]
  });
  assert.equal(getProviderIntegrationProfile(chatgpt).category, "hosted-actions");
  assert.equal(getProviderIntegrationProfile(anthropic).category, "runtime-agent");
  assert.deepEqual(anthropic.setup.headers, {
    "content-type": "application/json",
    "x-mobigent-agent": "claude-server",
    "x-mobigent-api-key": "${MOBIGENT_HTTP_API_KEY}"
  });
  assert.equal(azureOpenAi.kind, "azure-openai");
  assert.match(azureOpenAi.setup.adapter as string, /Azure OpenAI chat function tools/);
  assert.equal(openAiCompatible.kind, "openai-compatible");
  assert.match(openAiCompatible.setup.adapter as string, /OpenAI-compatible chat function tools/);
  assert.equal(openrouter.kind, "openrouter");
  assert.match(openrouter.setup.adapter as string, /OpenAI-compatible chat function tools/);
  assert.equal(litellm.kind, "litellm");
  assert.match(litellm.setup.adapter as string, /LiteLLM/);
  assert.equal(ollama.kind, "ollama");
  assert.match(ollama.setup.adapter as string, /Ollama chat function tools/);
  assert.equal(lmStudio.kind, "lm-studio");
  assert.match(lmStudio.setup.adapter as string, /LM Studio OpenAI-compatible/);
  assert.equal(groq.kind, "groq");
  assert.match(groq.setup.adapter as string, /Groq OpenAI-compatible/);
  assert.equal(perplexity.kind, "perplexity");
  assert.match(perplexity.setup.adapter as string, /Perplexity function-calling tools/);
  assert.equal(xaiGrok.kind, "xai-grok");
  assert.match(xaiGrok.setup.adapter as string, /xAI Grok OpenAI-compatible/);
  assert.equal(deepseek.kind, "deepseek");
  assert.match(deepseek.setup.adapter as string, /DeepSeek OpenAI-compatible/);
  assert.equal(together.kind, "together-ai");
  assert.match(together.setup.adapter as string, /Together AI OpenAI-compatible/);
  assert.equal(fireworks.kind, "fireworks-ai");
  assert.match(fireworks.setup.adapter as string, /Fireworks AI OpenAI-compatible/);
  assert.equal(qwen.kind, "qwen-dashscope");
  assert.match(qwen.setup.adapter as string, /Qwen DashScope OpenAI-compatible/);
  assert.equal(nvidia.kind, "nvidia-nim");
  assert.match(nvidia.setup.adapter as string, /NVIDIA NIM OpenAI-compatible/);
  assert.equal(cloudflare.kind, "cloudflare-ai-gateway");
  assert.match(cloudflare.setup.adapter as string, /Cloudflare AI Gateway/);
  assert.equal(mistral.kind, "mistral");
  assert.match(mistral.setup.adapter as string, /Mistral chat function tools/);
  assert.equal(cohere.kind, "cohere");
  assert.match(cohere.setup.adapter as string, /Cohere function tools/);
  assert.equal(langchain.setup.callToolUrlTemplate, "http://localhost:8788/tools/{toolName}/call");
  assert.equal(gemini.kind, "google-gemini");
  assert.equal((gemini.setup.headers as Record<string, string>)["x-mobigent-agent"], "google-gemini");
  assert.equal(vertexAi.kind, "google-vertex-ai");
  assert.equal((vertexAi.setup.headers as Record<string, string>)["x-mobigent-agent"], "google-vertex-ai");
  assert.equal(bedrock.kind, "aws-bedrock-converse");
  assert.equal((bedrock.setup.headers as Record<string, string>)["x-mobigent-agent"], "aws-bedrock-converse");
  assert.equal(vercel.kind, "vercel-ai-sdk");
  assert.deepEqual(vercel.setup.npm, ["ai"]);
  assert.equal(semanticKernel.kind, "semantic-kernel");
  assert.deepEqual(semanticKernel.setup.python, ["semantic-kernel"]);
  assert.equal(crewai.kind, "crewai");
  assert.deepEqual(crewai.setup.python, ["crewai", "crewai-tools", "pydantic"]);
  assert.equal(autogen.kind, "autogen");
  assert.deepEqual(autogen.setup.python, ["autogen-core"]);
  assert.equal(haystack.kind, "haystack");
  assert.deepEqual(haystack.setup.python, ["haystack-ai"]);
  assert.deepEqual(
    catalog.map((provider) => provider.id),
    [
      "mcp-stdio",
      "claude-desktop",
      "cursor",
      "vscode",
      "openapi",
      "chatgpt-actions",
      "openai-responses",
      "azure-openai",
      "openai-compatible",
      "openrouter",
      "litellm",
      "ollama",
      "lm-studio",
      "groq",
      "perplexity",
      "xai-grok",
      "deepseek",
      "together-ai",
      "fireworks-ai",
      "qwen-dashscope",
      "nvidia-nim",
      "cloudflare-ai-gateway",
      "mistral",
      "cohere",
      "anthropic-tool-use",
      "google-gemini",
      "google-vertex-ai",
      "aws-bedrock-converse",
      "vercel-ai-sdk",
      "langchain",
      "llamaindex",
      "mastra",
      "semantic-kernel",
      "crewai",
      "autogen",
      "haystack",
      "generic-agent"
    ]
  );
  assert.deepEqual(
    filterProviderCatalog(catalog, { transport: "stdio" }).map((provider) => provider.id),
    ["mcp-stdio", "claude-desktop", "cursor", "vscode"]
  );
  assert.deepEqual(
    filterProviderCatalog(catalog, { transport: "openapi", requiresPublicUrl: true }).map((provider) => provider.id),
    ["openapi", "chatgpt-actions", "generic-agent"]
  );
  assert.deepEqual(
    filterProviderCatalog(catalog, { runtimeOnly: true, query: "openai-compatible" }).map((provider) => provider.id),
    [
      "openai-compatible",
      "openrouter",
      "litellm",
      "lm-studio",
      "groq",
      "xai-grok",
      "deepseek",
      "together-ai",
      "fireworks-ai",
      "qwen-dashscope",
      "nvidia-nim",
      "cloudflare-ai-gateway"
    ]
  );
  assert.deepEqual(
    filterProviderCatalog(catalog, { ids: ["mistral", "cohere", "missing"] }).map((provider) => provider.id),
    ["mistral", "cohere"]
  );
  assert.deepEqual(summarizeProviderCatalog(catalog), {
    total: 37,
    byTransport: {
      stdio: 4,
      http: 30,
      openapi: 3
    },
    byCategory: {
      "local-agent": 4,
      "hosted-actions": 2,
      "runtime-agent": 30,
      fallback: 1
    },
    runtimeProviders: 31,
    publicUrlProviders: 3,
    dynamicToolProviders: 35
  });
  const compatibility = createProviderCompatibilityReport(catalog);
  assert.equal(compatibility.summary.total, 37);
  assert.equal(compatibility.summary.pass, 37);
  assert.equal(compatibility.summary.fail, 0);
  assert.deepEqual(compatibility.providers.find((provider) => provider.id === "openrouter"), {
    id: "openrouter",
    name: "OpenRouter",
    transport: "http",
    runtime: true,
    status: "pass",
    failingChecks: [],
    warningChecks: []
  });
  assert.deepEqual(
    createProviderCompatibilityReport([createOpenApiProvider({ baseUrl: "http://localhost:8788" })]).providers[0],
    {
      id: "openapi",
      name: "OpenAPI",
      transport: "openapi",
      runtime: false,
      status: "fail",
      failingChecks: ["publicUrl"],
      warningChecks: []
    }
  );
  assert.deepEqual(
    listProviderRecommendationPresets().map((preset) => preset.id),
    ["local-agent", "hosted-actions", "runtime-agent"]
  );
  assert.equal(getProviderRecommendationPreset("hosted-actions").recommendedTransport, "openapi");
  assert.equal(getProviderRecommendationPreset().id, "runtime-agent");
  assert.deepEqual(
    recommendProviders(catalog, { useCase: "local-agent", limit: 2 }).map((recommendation) => recommendation.provider.id),
    ["claude-desktop", "cursor"]
  );
  assert.deepEqual(
    recommendProviders(catalog, { useCase: "hosted-actions", limit: 2 }).map((recommendation) => recommendation.provider.id),
    ["chatgpt-actions", "openapi"]
  );
  assert.deepEqual(
    recommendProviders(catalog, { useCase: "runtime-agent", query: "openrouter", limit: 1 }).map(
      (recommendation) => recommendation.provider.id
    ),
    ["openrouter"]
  );
  const setupPlan = createProviderSetupPlan(catalog, {
    useCase: "runtime-agent",
    query: "openrouter",
    runtimeEnv: {
      agentId: "openrouter-prod",
      watchTools: true,
      minTools: 2
    }
  });
  assert.equal(setupPlan.recommendation.provider.id, "openrouter");
  assert.equal(setupPlan.profile.category, "runtime-agent");
  assert.equal(setupPlan.validation.status, "pass");
  assert.equal(setupPlan.bundle.runtimeEnv?.MOBIGENT_AGENT_ID, "openrouter-prod");
  assert.equal(setupPlan.bundle.runtimeEnv?.MOBIGENT_MIN_TOOLS, "2");
  assert.equal(setupPlan.bundle.runtimeEnv?.MOBIGENT_WATCH_TOOLS, "true");
  assert.deepEqual(validateProviderSetupPlan(setupPlan), {
    ok: true,
    status: "pass",
    errors: [],
    provider: {
      id: "openrouter",
      name: "OpenRouter"
    }
  });
  assert.match(formatProviderSetupPlanValidation(validateProviderSetupPlan(setupPlan)), /Mobigent provider setup plan: PASS/);
  assert.equal(
    validateProviderSetupPlan({
      ...setupPlan,
      bundle: { ...setupPlan.bundle, provider: { ...setupPlan.bundle.provider, id: "wrong-provider" } }
    }).status,
    "fail"
  );
  assert.match(createProviderGuide(chatgpt), /https:\/\/mobigent.example\/openapi\.json/);
  assert.match(createProviderGuide(azureOpenAi), /Azure OpenAI/);
  assert.match(createProviderGuide(openAiCompatible), /OpenAI-compatible/);
  assert.match(createProviderGuide(openrouter), /OpenRouter/);
  assert.match(createProviderGuide(litellm), /LiteLLM/);
  assert.match(createProviderGuide(ollama), /Ollama/);
  assert.match(createProviderGuide(lmStudio), /LM Studio/);
  assert.match(createProviderGuide(groq), /Groq/);
  assert.match(createProviderGuide(perplexity), /Perplexity/);
  assert.match(createProviderGuide(xaiGrok), /xAI Grok/);
  assert.match(createProviderGuide(deepseek), /DeepSeek/);
  assert.match(createProviderGuide(together), /Together AI/);
  assert.match(createProviderGuide(fireworks), /Fireworks AI/);
  assert.match(createProviderGuide(qwen), /Qwen DashScope/);
  assert.match(createProviderGuide(nvidia), /NVIDIA NIM/);
  assert.match(createProviderGuide(cloudflare), /Cloudflare AI Gateway/);
  assert.match(createProviderGuide(mistral), /Mistral/);
  assert.match(createProviderGuide(cohere), /Cohere/);
  assert.match(createProviderGuide(gemini), /functionDeclarations/);
  assert.match(createProviderGuide(vertexAi), /Vertex AI/);
  assert.match(createProviderGuide(bedrock), /toolConfig/);
  assert.match(createProviderGuide(semanticKernel), /plugin functions/);
  assert.match(createProviderGuide(crewai), /CrewAI tools/);
  assert.match(createProviderGuide(autogen), /AutoGen FunctionTool/);
  assert.match(createProviderGuide(haystack), /Haystack Tool/);

  const anthropicBundle = createProviderBundle(anthropic);
  assert.equal(anthropicBundle.provider.id, "anthropic-tool-use");
  assert.equal(anthropicBundle.endpoints.snapshot, "http://localhost:8788/snapshot");
  assert.equal(anthropicBundle.endpoints.tools, "http://localhost:8788/tools");
  assert.equal(anthropicBundle.runtimeEnv?.MOBIGENT_PROVIDER, "anthropic-tool-use");
  assert.equal(anthropicBundle.runtimeEnv?.MOBIGENT_AGENT_ID, "claude-server");
  assert.equal(anthropicBundle.runtimeEnv?.MOBIGENT_HTTP_API_KEY, "${MOBIGENT_HTTP_API_KEY}");
  assert.match(anthropicBundle.guide, /Anthropic Tool Use/);
  assert.deepEqual(createProviderRuntimeEnv(anthropic, { watchTools: true, minTools: 2 }), {
    MOBIGENT_PROVIDER: "anthropic-tool-use",
    MOBIGENT_HTTP_URL: "http://localhost:8788",
    MOBIGENT_AGENT_ID: "claude-server",
    MOBIGENT_HTTP_API_KEY: "${MOBIGENT_HTTP_API_KEY}",
    MOBIGENT_MIN_APPS: "1",
    MOBIGENT_MIN_TOOLS: "2",
    MOBIGENT_WAIT_TIMEOUT_MS: "30000",
    MOBIGENT_WAIT_INTERVAL_MS: "500",
    MOBIGENT_WATCH_TOOLS: "true"
  });
  assert.match(stringifyProviderRuntimeEnv(anthropic), /MOBIGENT_PROVIDER=anthropic-tool-use/);
  assert.throws(() => createProviderRuntimeEnv(claude), /not an HTTP runtime provider/);

  const chatGptBundle = createProviderBundle(chatgpt);
  assert.equal(chatGptBundle.endpoints.openApi, "https://mobigent.example/openapi.json");
  assert.equal(chatGptBundle.runtimeEnv, undefined);
  assert.equal(validateProviderSetup(openrouter).status, "pass");
  assert.match(formatProviderSetupValidation(validateProviderSetup(openrouter)), /OpenRouter setup is ready/);
  assert.equal(
    validateProviderSetup(createChatGptActionsProvider({ baseUrl: "http://localhost:8788" })).status,
    "fail"
  );
});

test("provider HTTP client forwards reliability headers and retries transient failures", async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  let healthAttempts = 0;
  let readinessAttempts = 0;
  let metricsAttempts = 0;
  let auditAttempts = 0;
  let appAttempts = 0;
  let providerAttempts = 0;
  let listAttempts = 0;
  let callAttempts = 0;
  let requestId = 0;
  const mockFetch: typeof fetch = async (url, init) => {
    requests.push({ url: String(url), init });

    if (String(url).endsWith("/health")) {
      healthAttempts += 1;
      if (healthAttempts === 1) {
        return new Response(JSON.stringify({ error: "warming up" }), { status: 503 });
      }
      return new Response(
        JSON.stringify({
          ok: true,
          name: "Mobigent Gateway",
          status: {
            appSessions: 1,
            authenticatedAppSessions: 1,
            appsWithManifests: 1,
            tools: 2,
            auditEvents: 3,
            idempotencyRecords: 0,
            rateLimitBuckets: 0,
            manifestSigningRequired: false,
            appAllowlistEnabled: false
          }
        }),
        { status: 200 }
      );
    }

    if (String(url).includes("/ready")) {
      readinessAttempts += 1;
      if (readinessAttempts === 1) {
        return new Response(JSON.stringify({ error: "warming up" }), { status: 503 });
      }
      return new Response(
        JSON.stringify({
          ok: false,
          name: "Mobigent Gateway",
          status: {
            appSessions: 1,
            authenticatedAppSessions: 1,
            appsWithManifests: 1,
            tools: 2,
            auditEvents: 3,
            idempotencyRecords: 0,
            rateLimitBuckets: 0,
            manifestSigningRequired: false,
            appAllowlistEnabled: false
          },
          requirements: {
            minApps: 1,
            minTools: 3
          },
          checks: {
            apps: {
              ok: true,
              actual: 1,
              required: 1
            },
            tools: {
              ok: false,
              actual: 2,
              required: 3
            }
          }
        }),
        { status: 503 }
      );
    }

    if (String(url).endsWith("/metrics")) {
      metricsAttempts += 1;
      if (metricsAttempts === 1) {
        return new Response(JSON.stringify({ error: "warming up" }), { status: 503 });
      }
      return new Response(
        JSON.stringify({
          metrics: {
            status: {
              appSessions: 1,
              authenticatedAppSessions: 1,
              appsWithManifests: 1,
              tools: 2,
              auditEvents: 3,
              idempotencyRecords: 0,
              rateLimitBuckets: 0,
              manifestSigningRequired: false,
              appAllowlistEnabled: false
            },
            auditEvents: {
              "tool.call.started": 1
            },
            toolCalls: {
              started: 1,
              succeeded: 1,
              failed: 0,
              denied: 0,
              timedOut: 0,
              deduplicated: 0
            },
            byTool: {},
            byAgent: {}
          }
        }),
        { status: 200 }
      );
    }

    if (String(url).includes("/audit")) {
      auditAttempts += 1;
      if (auditAttempts === 1) {
        return new Response(JSON.stringify({ error: "warming up" }), { status: 503 });
      }
      return new Response(
        JSON.stringify({
          events: [
            {
              id: "audit-1",
              at: "2026-05-24T00:00:02.000Z",
              type: "tool.call.started",
              severity: "info",
              message: "Tool call started.",
              tool: "com.example.create_note",
              agentId: "anthropic-tool-use",
              details: {
                requestId: "req-1"
              }
            }
          ]
        }),
        { status: 200 }
      );
    }

    if (String(url).endsWith("/providers")) {
      providerAttempts += 1;
      if (providerAttempts === 1) {
        return new Response(JSON.stringify({ error: "warming up" }), { status: 503 });
      }
      return new Response(
        JSON.stringify({
          providers: [
            {
              id: "openai-responses",
              kind: "openai-responses",
              name: "OpenAI Responses",
              description: "OpenAI Responses API tool adapter metadata.",
              capabilities: {
                transport: "http",
                supportsTools: true,
                supportsDynamicTools: true,
                requiresPublicUrl: false,
                supportsConfirmationNotes: true
              },
              setup: {}
            }
          ]
        }),
        { status: 200 }
      );
    }

    if (String(url).endsWith("/apps")) {
      appAttempts += 1;
      if (appAttempts === 1) {
        return new Response(JSON.stringify({ error: "warming up" }), { status: 503 });
      }
      return new Response(
        JSON.stringify({
          apps: [
            {
              sessionId: "session-1",
              connectedAt: "2026-05-24T00:00:00.000Z",
              lastSeenAt: "2026-05-24T00:00:03.000Z",
              ageMs: 3000,
              idleMs: 0,
              authenticated: true,
              app: {
                id: "com.mobigent.mock",
                name: "Mock App",
                sdk: "react-native",
                version: "0.1.0",
                protocolVersion: 1,
                protocolCompatible: true
              },
              capabilities: {
                actions: 1,
                resources: 0,
                components: 0,
                tools: 1
              },
              manifest: {
                acceptedAt: "2026-05-24T00:00:01.000Z",
                signed: false
              }
            }
          ]
        }),
        { status: 200 }
      );
    }

    if (String(url).endsWith("/tools")) {
      listAttempts += 1;
      if (listAttempts === 1) {
        return new Response(JSON.stringify({ error: "warming up" }), { status: 503 });
      }
      return new Response(JSON.stringify({ tools: [] }), { status: 200 });
    }

    callAttempts += 1;
    if (callAttempts === 1) {
      return new Response(JSON.stringify({ error: "busy" }), { status: 429 });
    }
    return new Response(JSON.stringify({ result: { ok: true } }), { status: 200 });
  };

  const client = createMobigentHttpClient({
    baseUrl: "http://localhost:8788/",
    auth: "api-key",
    apiKey: "provider-secret",
    agentId: "anthropic-tool-use",
    timeoutMs: 20_000,
    requestId: () => `req-${++requestId}`,
    headers: {
      "x-custom-provider": "test"
    },
    retries: 1,
    retryDelayMs: 0,
    fetch: mockFetch
  });

  assert.equal((await client.getHealth()).status.tools, 2);
  const readiness = await client.getReadiness({ minApps: 1, minTools: 3 });
  assert.equal(readiness.ok, false);
  assert.equal(readiness.checks.tools.actual, 2);
  assert.equal((await client.getMetrics()).toolCalls.succeeded, 1);
  assert.deepEqual(
    (await client.listAuditEvents({ limit: 1 })).map((event) => event.type),
    ["tool.call.started"]
  );
  assert.deepEqual(
    (await client.listApps()).map((app) => app.app?.id),
    ["com.mobigent.mock"]
  );
  assert.deepEqual(
    (await client.listProviders()).map((provider) => provider.id),
    ["openai-responses"]
  );
  assert.deepEqual(await client.listTools(), []);
  assert.deepEqual(
    await client.callTool(
      "com.example.create_note",
      { title: "Retry" },
      {
        agentId: "openai-responses",
        headers: { "x-call-scope": "single-call" },
        idempotencyKey: "note-create-1",
        requestId: "call-req",
        timeoutMs: 5_000
      }
    ),
    { ok: true }
  );
  assert.equal(healthAttempts, 2);
  assert.equal(readinessAttempts, 2);
  assert.equal(metricsAttempts, 2);
  assert.equal(auditAttempts, 2);
  assert.equal(appAttempts, 2);
  assert.equal(providerAttempts, 2);
  assert.equal(listAttempts, 2);
  assert.equal(callAttempts, 2);

  const firstHeaders = requests[0]?.init?.headers as Record<string, string>;
  const lastHeaders = requests.at(-1)?.init?.headers as Record<string, string>;
  assert.equal(firstHeaders["x-mobigent-agent"], "anthropic-tool-use");
  assert.equal(firstHeaders["x-mobigent-api-key"], "provider-secret");
  assert.equal(firstHeaders["x-mobigent-timeout-ms"], "20000");
  assert.equal(firstHeaders["x-custom-provider"], "test");
  assert.equal(firstHeaders["x-mobigent-request-id"], "req-1");
  assert.equal(lastHeaders["x-mobigent-agent"], "openai-responses");
  assert.equal(lastHeaders["x-mobigent-timeout-ms"], "5000");
  assert.equal(lastHeaders["x-mobigent-request-id"], "call-req");
  assert.equal(lastHeaders["x-mobigent-idempotency-key"], "note-create-1");
  assert.equal(lastHeaders["x-call-scope"], "single-call");
});

test("provider HTTP client waits for visible tools during agent startup", async () => {
  let listAttempts = 0;
  const mockFetch: typeof fetch = async (url) => {
    if (!String(url).endsWith("/tools")) {
      return new Response(JSON.stringify({ error: "unexpected route" }), { status: 404 });
    }

    listAttempts += 1;
    if (listAttempts < 3) {
      return new Response(JSON.stringify({ tools: [] }), { status: 200 });
    }

    return new Response(
      JSON.stringify({
        tools: [
          {
            name: "com_example_notes.create_note",
            description: "Create a note.",
            inputSchema: {
              type: "object",
              properties: {
                title: { type: "string" }
              },
              required: ["title"]
            },
            readOnly: false,
            risk: "low"
          }
        ]
      }),
      { status: 200 }
    );
  };

  const client = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: mockFetch
  });

  const tools = await client.waitForTools({ intervalMs: 0, timeoutMs: 100 });
  assert.equal(listAttempts, 3);
  assert.deepEqual(
    tools.map((tool) => tool.name),
    ["com_example_notes.create_note"]
  );
});

test("provider diagnostics summarize readiness warnings and endpoint failures", async () => {
  const status = {
    appSessions: 1,
    authenticatedAppSessions: 1,
    appsWithManifests: 1,
    tools: 0,
    auditEvents: 1,
    idempotencyRecords: 0,
    rateLimitBuckets: 0,
    manifestSigningRequired: false,
    appAllowlistEnabled: false
  };
  const client = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async (url) => {
      const path = String(url);
      if (path.endsWith("/config")) {
        return new Response(
          JSON.stringify({
            name: "Mobigent Gateway",
            version: "0.1.0",
            baseUrl: "http://localhost:8788",
            protocol: { currentVersion: 1, supportedVersions: [1] },
            auth: {
              required: false,
              schemes: ["bearer", "api-key"],
              apiKeyHeader: "x-mobigent-api-key",
              bearerHeader: "authorization"
            },
            endpoints: {
              health: "/health",
              ready: "/ready",
              config: "/config",
              agents: "/agents",
              apps: "/apps",
              providers: "/providers",
              snapshot: "/snapshot",
              tools: "/tools",
              toolStream: "/tools/stream",
              toolLookupTemplate: "/tools/{toolName}",
              metrics: "/metrics",
              prometheusMetrics: "/metrics/prometheus",
              audit: "/audit",
              auditStream: "/audit/stream",
              openApi: "/openapi.json",
              toolCallTemplate: "/tools/{toolName}/call"
            },
            features: {
              dynamicTools: true,
              toolStreaming: true,
              auditStreaming: true,
              appSessionDiscovery: true,
              providerCatalog: true,
              providerSnapshot: true,
              openApiSchema: true,
              perCallTimeouts: true,
              idempotencyKeys: true,
              requestIds: true,
              agentVisibility: true,
              agentScopedDiscovery: true,
              agentProfiles: true
            },
            limits: { jsonBodyLimit: "1mb", maxTimeoutMs: 30000 },
            headers: {
              agentId: "x-mobigent-agent",
              idempotencyKey: "x-mobigent-idempotency-key",
              requestId: "x-mobigent-request-id",
              timeoutMs: "x-mobigent-timeout-ms"
            }
          }),
          { status: 200 }
        );
      }
      if (path.endsWith("/health")) {
        return new Response(JSON.stringify({ ok: true, name: "Mobigent Gateway", status }), { status: 200 });
      }
      if (path.includes("/ready")) {
        return new Response(
          JSON.stringify({
            ok: false,
            name: "Mobigent Gateway",
            status,
            requirements: { minApps: 1, minTools: 1 },
            checks: {
              apps: { ok: true, actual: 1, required: 1 },
              tools: { ok: false, actual: 0, required: 1 }
            }
          }),
          { status: 503 }
        );
      }
      if (path.endsWith("/apps")) {
        return new Response(
          JSON.stringify({
            apps: [
              {
                sessionId: "session-1",
                connectedAt: "2026-05-24T00:00:00.000Z",
                lastSeenAt: "2026-05-24T00:00:01.000Z",
                ageMs: 1000,
                idleMs: 0,
                authenticated: true,
                app: {
                  id: "com.example",
                  name: "Example",
                  sdk: "react-native",
                  version: "0.1.0",
                  protocolVersion: 1,
                  protocolCompatible: true
                },
                capabilities: { actions: 0, resources: 0, components: 0, tools: 0 },
                manifest: { acceptedAt: "2026-05-24T00:00:00.000Z", signed: false }
              }
            ]
          }),
          { status: 200 }
        );
      }
      if (path.endsWith("/tools")) {
        return new Response(JSON.stringify({ tools: [] }), { status: 200 });
      }
      if (path.endsWith("/providers")) {
        return new Response(
          JSON.stringify({
            providers: [
              {
                id: "openrouter",
                kind: "openrouter",
                name: "OpenRouter",
                description: "OpenRouter provider.",
                capabilities: {
                  transport: "http",
                  supportsTools: true,
                  supportsDynamicTools: true,
                  requiresPublicUrl: false,
                  supportsConfirmationNotes: true
                },
                setup: {}
              }
            ]
          }),
          { status: 200 }
        );
      }
      if (path.includes("/audit")) {
        return new Response(
          JSON.stringify({
            events: [
              {
                id: "audit-1",
                at: "2026-05-24T00:00:00.000Z",
                type: "gateway.started",
                severity: "info",
                message: "Gateway started."
              }
            ]
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
    }
  });

  const report = await diagnoseMobigentProvider(client, {
    minApps: 1,
    minTools: 1,
    expectedProvider: "openrouter"
  });
  assert.equal(report.ok, true);
  assert.equal(report.status, "warn");
  assert.equal(report.summary.apps, 1);
  assert.equal(report.summary.tools, 0);
  assert.equal(report.summary.providers, 1);
  assert.equal(report.summary.auditEvents, 1);
  assert.equal(report.checks.find((check) => check.name === "readiness")?.status, "warn");
  assert.equal(report.checks.find((check) => check.name === "expected-provider")?.status, "pass");
  assert.match(formatMobigentProviderDiagnostics(report), /Mobigent provider diagnostics: WARN/);
  assert.match(formatMobigentProviderDiagnostics(report), /\[WARN\] readiness/);
  assert.match(
    formatMobigentProviderDiagnostics(report, { includeDetails: true }),
    /"agentScopedDiscovery": true/
  );

  const failingClient = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () => new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 })
  });
  const failingReport = await failingClient.diagnose({ expectedProvider: "openrouter" });
  assert.equal(failingReport.ok, false);
  assert.equal(failingReport.status, "fail");
  assert.ok(failingReport.checks.every((check) => check.status === "fail"));
  assert.equal((failingReport.checks[0]?.details as { code?: string } | undefined)?.code, "unauthorized");
});

test("provider HTTP client waits for gateway readiness during agent startup", async () => {
  let readinessAttempts = 0;
  const client = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async (url) => {
      assert.match(String(url), /\/ready\?minApps=1&minTools=2$/);
      readinessAttempts += 1;
      const ready = readinessAttempts >= 3;
      return new Response(
        JSON.stringify({
          ok: ready,
          name: "Mobigent Gateway",
          status: {
            appSessions: 1,
            authenticatedAppSessions: 1,
            appsWithManifests: ready ? 1 : 0,
            tools: ready ? 2 : 1,
            auditEvents: 0,
            idempotencyRecords: 0,
            rateLimitBuckets: 0,
            manifestSigningRequired: false,
            appAllowlistEnabled: false
          },
          requirements: {
            minApps: 1,
            minTools: 2
          },
          checks: {
            apps: {
              ok: ready,
              actual: ready ? 1 : 0,
              required: 1
            },
            tools: {
              ok: ready,
              actual: ready ? 2 : 1,
              required: 2
            }
          }
        }),
        { status: ready ? 200 : 503 }
      );
    }
  });

  const readiness = await client.waitForReadiness({ minApps: 1, minTools: 2, intervalMs: 0, timeoutMs: 100 });
  assert.equal(readinessAttempts, 3);
  assert.equal(readiness.ok, true);
  assert.equal(readiness.checks.tools.actual, 2);
});

test("provider HTTP client reports typed timeout while waiting for gateway readiness", async () => {
  const client = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () =>
      new Response(
        JSON.stringify({
          ok: false,
          name: "Mobigent Gateway",
          status: {
            appSessions: 0,
            authenticatedAppSessions: 0,
            appsWithManifests: 0,
            tools: 0,
            auditEvents: 0,
            idempotencyRecords: 0,
            rateLimitBuckets: 0,
            manifestSigningRequired: false,
            appAllowlistEnabled: false
          },
          requirements: {
            minApps: 1,
            minTools: 1
          },
          checks: {
            apps: {
              ok: false,
              actual: 0,
              required: 1
            },
            tools: {
              ok: false,
              actual: 0,
              required: 1
            }
          }
        }),
        { status: 503 }
      )
  });

  await assert.rejects(
    () => client.waitForReadiness({ minApps: 1, minTools: 1, intervalMs: 0, timeoutMs: 1 }),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "gateway_error");
      assert.equal(error.operation, "waitForReadiness");
      assert.equal(error.retryable, true);
      assert.match(error.message, /apps 0\/1, tools 0\/1/);
      assert.equal((error.body as { ok?: boolean }).ok, false);
      return true;
    }
  );
});

test("provider runtime waits for tools and maps them to provider-native shapes", async () => {
  let listAttempts = 0;
  const tool = {
    name: "com_example_notes.create_note",
    description: "Create a note.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" }
      },
      required: ["title"]
    },
    readOnly: false,
    risk: "low"
  };

  const client = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async (url, init) => {
      if (String(url).endsWith("/tools")) {
        listAttempts += 1;
        if (listAttempts === 1) {
          return new Response(JSON.stringify({ tools: [] }), { status: 200 });
        }
        return new Response(JSON.stringify({ tools: [tool] }), { status: 200 });
      }

      assert.equal(String(url), "http://localhost:8788/tools/com_example_notes.create_note/call");
      assert.equal(init?.method, "POST");
      return new Response(JSON.stringify({ result: { created: true } }), { status: 200 });
    }
  });

  const anthropicRuntime = await createMobigentProviderRuntime({
    kind: "anthropic-tool-use",
    client,
    waitForTools: { minTools: 1, intervalMs: 0, timeoutMs: 100 }
  });
  assert.equal(listAttempts, 2);
  assert.deepEqual(anthropicRuntime.tools, toAnthropicTools([tool]));
  assert.equal(anthropicRuntime.tools[0]?.input_schema.type, "object");
  assert.deepEqual(await anthropicRuntime.executeTool(tool.name, { title: "Runtime" }), { created: true });

  const openRouterRuntime = await createMobigentProviderRuntime({
    kind: "openrouter",
    client,
    tools: [tool]
  });
  assert.deepEqual(openRouterRuntime.tools, toChatFunctionTools([tool]));
  assert.equal(openRouterRuntime.tools[0]?.function.parameters, tool.inputSchema);

  const azureOpenAiRuntime = await createMobigentProviderRuntime({
    kind: "azure-openai",
    client,
    tools: [tool]
  });
  assert.deepEqual(azureOpenAiRuntime.tools, toChatFunctionTools([tool]));

  const openAiCompatibleRuntime = await createMobigentProviderRuntime({
    kind: "openai-compatible",
    client,
    tools: [tool]
  });
  assert.deepEqual(openAiCompatibleRuntime.tools, toChatFunctionTools([tool]));

  const liteLlmRuntime = await createMobigentProviderRuntime({
    kind: "litellm",
    client,
    tools: [tool]
  });
  assert.deepEqual(liteLlmRuntime.tools, toChatFunctionTools([tool]));

  const ollamaRuntime = await createMobigentProviderRuntime({
    kind: "ollama",
    client,
    tools: [tool]
  });
  assert.deepEqual(ollamaRuntime.tools, toChatFunctionTools([tool]));

  const lmStudioRuntime = await createMobigentProviderRuntime({
    kind: "lm-studio",
    client,
    tools: [tool]
  });
  assert.deepEqual(lmStudioRuntime.tools, toChatFunctionTools([tool]));

  const groqRuntime = await createMobigentProviderRuntime({
    kind: "groq",
    client,
    tools: [tool]
  });
  assert.deepEqual(groqRuntime.tools, toChatFunctionTools([tool]));

  const perplexityRuntime = await createMobigentProviderRuntime({
    kind: "perplexity",
    client,
    tools: [tool]
  });
  assert.deepEqual(perplexityRuntime.tools, toChatFunctionTools([tool]));

  const xaiGrokRuntime = await createMobigentProviderRuntime({
    kind: "xai-grok",
    client,
    tools: [tool]
  });
  assert.deepEqual(xaiGrokRuntime.tools, toChatFunctionTools([tool]));

  const deepSeekRuntime = await createMobigentProviderRuntime({
    kind: "deepseek",
    client,
    tools: [tool]
  });
  assert.deepEqual(deepSeekRuntime.tools, toChatFunctionTools([tool]));

  const togetherRuntime = await createMobigentProviderRuntime({
    kind: "together-ai",
    client,
    tools: [tool]
  });
  assert.deepEqual(togetherRuntime.tools, toChatFunctionTools([tool]));

  const fireworksRuntime = await createMobigentProviderRuntime({
    kind: "fireworks-ai",
    client,
    tools: [tool]
  });
  assert.deepEqual(fireworksRuntime.tools, toChatFunctionTools([tool]));

  const qwenRuntime = await createMobigentProviderRuntime({
    kind: "qwen-dashscope",
    client,
    tools: [tool]
  });
  assert.deepEqual(qwenRuntime.tools, toChatFunctionTools([tool]));

  const nvidiaRuntime = await createMobigentProviderRuntime({
    kind: "nvidia-nim",
    client,
    tools: [tool]
  });
  assert.deepEqual(nvidiaRuntime.tools, toChatFunctionTools([tool]));

  const cloudflareRuntime = await createMobigentProviderRuntime({
    kind: "cloudflare-ai-gateway",
    client,
    tools: [tool]
  });
  assert.deepEqual(cloudflareRuntime.tools, toChatFunctionTools([tool]));

  const mistralRuntime = await createMobigentProviderRuntime({
    kind: "mistral",
    client,
    tools: [tool]
  });
  assert.equal(mistralRuntime.tools[0]?.function.name, tool.name);

  const cohereRuntime = await createMobigentProviderRuntime({
    kind: "cohere",
    client,
    tools: [tool]
  });
  assert.equal(cohereRuntime.tools[0]?.function.description, "Create a note.");

  const vertexRuntime = await createMobigentProviderRuntime({
    kind: "google-vertex-ai",
    client,
    tools: [tool]
  });
  assert.deepEqual(vertexRuntime.tools, toGeminiFunctionDeclarations([tool]));

  const vercelRuntime = await createMobigentProviderRuntime({
    kind: "vercel-ai-sdk",
    client,
    tools: [tool]
  });
  assert.equal(typeof vercelRuntime.tools[tool.name]?.execute, "function");

  const semanticKernelRuntime = await createMobigentProviderRuntime({
    kind: "semantic-kernel",
    client,
    tools: [tool],
    pluginName: "MobileApp"
  });
  assert.equal(Array.isArray(semanticKernelRuntime.tools), true);
  assert.equal(semanticKernelRuntime.tools[0]?.pluginName, "MobileApp");
});

test("provider adapters can expose provider-safe tool names while executing original tools", async () => {
  const called: Array<{ toolName: string; input?: Record<string, unknown> }> = [];
  const tools = [
    {
      name: "com.example.notes/create-note",
      description: "Create a note.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "com_example_notes_create_note",
      description: "Create another note.",
      inputSchema: { type: "object", properties: {} }
    }
  ];
  const client = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async (url, init) => {
      if (String(url).includes("/call")) {
        called.push({
          toolName: decodeURIComponent(String(url).split("/tools/")[1]?.split("/call")[0] ?? ""),
          input: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>
        });
        return new Response(JSON.stringify({ result: { ok: true } }), { status: 200 });
      }
      return new Response(JSON.stringify({ tools }), { status: 200 });
    }
  });

  const nameMap = createProviderSafeToolNameMap(tools);
  assert.deepEqual(
    nameMap.tools.map((tool) => tool.name),
    ["com_example_notes_create-note", "com_example_notes_create_note"]
  );
  assert.equal(nameMap.resolve("com_example_notes_create-note"), "com.example.notes/create-note");
  assert.equal(nameMap.resolve("unknown_tool"), "unknown_tool");

  const collisionMap = mapToolsForProviderNames(tools, { mode: "provider-safe" });
  assert.notEqual(collisionMap.tools[0]?.name, tools[0]?.name);
  assert.equal(mapToolsForProviderNames(tools).tools[0]?.name, tools[0]?.name);

  const openRouterRuntime = await createMobigentProviderRuntime({
    kind: "openrouter",
    client,
    tools,
    toolNames: { mode: "provider-safe" }
  });
  const exposedName = openRouterRuntime.tools[0]?.function.name ?? "";
  assert.deepEqual(openRouterRuntime.toolNameMap.entries[0], {
    originalName: "com.example.notes/create-note",
    providerName: exposedName
  });
  assert.deepEqual(createMobigentProviderRuntimeReport(openRouterRuntime), {
    kind: "openrouter",
    toolCount: 2,
    resultFormat: "chat-completions",
    rawToolNames: ["com.example.notes/create-note", "com_example_notes_create_note"],
    providerToolNames: ["com_example_notes_create-note", "com_example_notes_create_note"],
    toolNameMap: [
      {
        originalName: "com.example.notes/create-note",
        providerName: "com_example_notes_create-note"
      },
      {
        originalName: "com_example_notes_create_note",
        providerName: "com_example_notes_create_note"
      }
    ]
  });
  assert.match(
    formatMobigentProviderRuntimeReport(createMobigentProviderRuntimeReport(openRouterRuntime)),
    /com_example_notes_create-note -> com\.example\.notes\/create-note/
  );
  assert.equal(exposedName, "com_example_notes_create-note");
  assert.deepEqual(await openRouterRuntime.executeTool(exposedName, { title: "Safe" }), { ok: true });
  assert.deepEqual(called[0], {
    toolName: "com.example.notes/create-note",
    input: { title: "Safe" }
  });

  const vercelRuntime = await createMobigentProviderRuntime({
    kind: "vercel-ai-sdk",
    client,
    tools,
    toolNames: { mode: "provider-safe" }
  });
  assert.deepEqual(await vercelRuntime.tools[exposedName]?.execute({ title: "Vercel Safe" }), { ok: true });
  assert.deepEqual(called[1], {
    toolName: "com.example.notes/create-note",
    input: { title: "Vercel Safe" }
  });
});

test("provider runtime resolves and executes common tool call shapes", async () => {
  const calls: Array<{ toolName: string; input?: Record<string, unknown> }> = [];
  const client = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async (url, init) => {
      const toolName = decodeURIComponent(String(url).split("/tools/")[1]?.split("/call")[0] ?? "");
      calls.push({
        toolName,
        input: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>
      });

      if (toolName === "fail_action") {
        return new Response(
          JSON.stringify({
            error: {
              code: "gateway_error",
              message: "App failed.",
              retryable: true
            }
          }),
          { status: 502 }
        );
      }

      return new Response(JSON.stringify({ result: { ok: true, toolName } }), { status: 200 });
    }
  });

  assert.deepEqual(
    resolveMobigentToolCall({
      id: "call-1",
      function: {
        name: "create_note",
        arguments: "{\"title\":\"Runtime\"}"
      }
    }),
    {
      id: "call-1",
      name: "create_note",
      input: { title: "Runtime" }
    }
  );
  assert.deepEqual(resolveMobigentToolCall({ name: "anthropic_tool", input: { ok: true } }), {
    name: "anthropic_tool",
    input: { ok: true }
  });
  assert.throws(
    () => resolveMobigentToolCall({ function: { name: "broken", arguments: "not-json" } }),
    /JSON object/
  );

  const executeToolCall = createMobigentToolCallExecutor((toolName, input) => client.callTool(toolName, input));
  assert.deepEqual(
    await executeToolCall({
      id: "call-2",
      function: {
        name: "create_note",
        arguments: "{\"title\":\"Executor\"}"
      }
    }),
    {
      id: "call-2",
      name: "create_note",
      input: { title: "Executor" },
      result: { ok: true, toolName: "create_note" }
    }
  );

  const runtime = await createMobigentProviderRuntime({
    kind: "openrouter",
    client,
    tools: [
      {
        name: "com.example.notes/create-note",
        description: "Create note.",
        inputSchema: { type: "object", properties: {} }
      }
    ],
    toolNames: { mode: "provider-safe" }
  });
  const exposedName = runtime.tools[0]?.function.name ?? "";
  const results = await runtime.executeToolCalls([
    {
      id: "call-3",
      function: {
        name: exposedName,
        arguments: { title: "Safe call" }
      }
    },
    {
      id: "call-4",
      function: {
        name: "fail_action",
        arguments: "{}"
      }
    }
  ]);

  assert.deepEqual(results[0], {
    id: "call-3",
    name: exposedName,
    input: { title: "Safe call" },
    result: { ok: true, toolName: "com.example.notes/create-note" }
  });
  assert.equal(results[1]?.id, "call-4");
  assert.equal(results[1]?.name, "fail_action");
  assert.equal(results[1]?.error?.code, "gateway_error");
  assert.equal(results[1]?.error?.retryable, true);
  assert.deepEqual(runtime.formatToolCallResult(results[0]!), {
    role: "tool",
    tool_call_id: "call-3",
    content: JSON.stringify({ ok: true, toolName: "com.example.notes/create-note" })
  });
  assert.deepEqual(runtime.formatToolCallResult(results[1]!), {
    role: "tool",
    tool_call_id: "call-4",
    content: JSON.stringify({
      error: results[1]?.error,
      name: "fail_action"
    })
  });
  assert.deepEqual(formatMobigentToolCallResult(results[0]!, "openai-responses"), {
    type: "function_call_output",
    call_id: "call-3",
    output: JSON.stringify({ ok: true, toolName: "com.example.notes/create-note" })
  });
  assert.deepEqual(formatMobigentToolCallResult(results[1]!, "anthropic-tool-use"), {
    type: "tool_result",
    tool_use_id: "call-4",
    content: JSON.stringify({
      error: results[1]?.error,
      name: "fail_action"
    }),
    is_error: true
  });
  assert.deepEqual(formatMobigentToolCallResult(results[0]!, "google-gemini"), {
    functionResponse: {
      name: exposedName,
      response: { ok: true, toolName: "com.example.notes/create-note" }
    }
  });
  assert.deepEqual(formatMobigentToolCallResult(results[0]!, "aws-bedrock-converse"), {
    toolResult: {
      toolUseId: "call-3",
      content: [{ json: { ok: true, toolName: "com.example.notes/create-note" } }],
      status: "success"
    }
  });
  assert.deepEqual(formatMobigentToolCallResults(results, "generic-agent"), results);
  assert.deepEqual(calls.at(-2), {
    toolName: "com.example.notes/create-note",
    input: { title: "Safe call" }
  });
});

test("provider runtime bootstrap reads environment defaults and creates a ready runtime", async () => {
  const requests: string[] = [];
  const tool = {
    name: "com_example_bootstrap.create_note",
    description: "Create a note from bootstrap.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" }
      },
      required: ["title"]
    }
  };

  const config = readMobigentProviderRuntimeConfig({
    env: {
      MOBIGENT_PROVIDER: "openrouter",
      MOBIGENT_HTTP_URL: "http://localhost:8788/",
      MOBIGENT_HTTP_API_KEY: "bootstrap-secret",
      MOBIGENT_AGENT_ID: "openrouter-prod",
      MOBIGENT_TIMEOUT_MS: "12000",
      MOBIGENT_RETRIES: "3",
      MOBIGENT_RETRY_DELAY_MS: "10",
      MOBIGENT_MIN_APPS: "1",
      MOBIGENT_MIN_TOOLS: "1",
      MOBIGENT_WAIT_TIMEOUT_MS: "250",
      MOBIGENT_WAIT_INTERVAL_MS: "0",
      MOBIGENT_WATCH_TOOLS: "true"
    }
  });
  assert.equal(config.kind, "openrouter");
  assert.equal(config.auth, "bearer");
  assert.equal(config.agentId, "openrouter-prod");
  assert.equal(config.timeoutMs, 12000);
  assert.equal(config.retries, 3);
  assert.equal(config.watchTools, true);

  const bootstrap = await createMobigentProviderRuntimeFromEnv({
    env: {
      MOBIGENT_PROVIDER: "openrouter",
      MOBIGENT_HTTP_URL: "http://localhost:8788",
      MOBIGENT_HTTP_API_KEY: "bootstrap-secret",
      MOBIGENT_AGENT_ID: "openrouter-prod",
      MOBIGENT_WAIT_INTERVAL_MS: "0"
    },
    requestId: "bootstrap-request",
    fetch: async (url, init) => {
      requests.push(String(url));
      const headers = init?.headers as Record<string, string>;
      assert.equal(headers.authorization, "Bearer bootstrap-secret");
      assert.equal(headers["x-mobigent-agent"], "openrouter-prod");
      assert.equal(headers["x-mobigent-request-id"], "bootstrap-request");

      if (String(url).includes("/ready")) {
        return new Response(
          JSON.stringify({
            ok: true,
            name: "Mobigent Gateway",
            status: {
              appSessions: 1,
              authenticatedAppSessions: 1,
              appsWithManifests: 1,
              tools: 1,
              auditEvents: 0,
              idempotencyRecords: 0,
              rateLimitBuckets: 0,
              manifestSigningRequired: false,
              appAllowlistEnabled: false
            },
            requirements: {
              minApps: 1,
              minTools: 1
            },
            checks: {
              apps: {
                ok: true,
                actual: 1,
                required: 1
              },
              tools: {
                ok: true,
                actual: 1,
                required: 1
              }
            }
          }),
          { status: 200 }
        );
      }

      if (String(url).endsWith("/tools")) {
        return new Response(JSON.stringify({ tools: [tool] }), { status: 200 });
      }

      if (String(url).endsWith("/tools/com_example_bootstrap.create_note/call")) {
        return new Response(JSON.stringify({ result: { ok: true } }), { status: 200 });
      }

      return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
    }
  });

  assert.equal(bootstrap.kind, "openrouter");
  assert.equal(bootstrap.readiness?.ok, true);
  assert.deepEqual(bootstrap.runtime.rawTools, [tool]);
  assert.deepEqual(bootstrap.runtime.tools, toChatFunctionTools([tool]));
  assert.deepEqual(await bootstrap.runtime.executeTool(tool.name, { title: "Bootstrap" }), { ok: true });
  assert.ok(requests.some((url) => url.includes("/ready")));
  assert.ok(requests.some((url) => url.endsWith("/tools")));

  assert.throws(
    () =>
      readMobigentProviderRuntimeConfig({
        env: { MOBIGENT_PROVIDER: "bad-provider" }
      }),
    /Unsupported MOBIGENT_PROVIDER/
  );
  assert.throws(
    () =>
      readMobigentProviderRuntimeConfig({
        env: { MOBIGENT_WAIT_TIMEOUT_MS: "0" }
      }),
    /MOBIGENT_WAIT_TIMEOUT_MS must be a positive integer/
  );
});

test("provider runtime config diagnostics validate deployable env settings", () => {
  const report = diagnoseMobigentProviderRuntimeConfig({
    kind: "openrouter",
    baseUrl: "https://gateway.example.com",
    auth: "bearer",
    apiKey: "runtime-secret",
    agentId: "openrouter-prod",
    minApps: 1,
    minTools: 1,
    waitTimeoutMs: 1000,
    waitIntervalMs: 100,
    env: { MOBIGENT_WATCH_TOOLS: "true" }
  });

  assert.equal(report.status, "pass");
  assert.equal(report.config?.kind, "openrouter");
  assert.match(formatMobigentProviderRuntimeConfigReport(report), /Mobigent provider runtime config: PASS/);
  assert.match(formatMobigentProviderRuntimeConfigReport(report), /Provider: openrouter/);

  const localReport = diagnoseMobigentProviderRuntimeConfig({
    kind: "anthropic-tool-use",
    baseUrl: "http://localhost:8788",
    minApps: 0,
    minTools: 0
  });
  assert.equal(localReport.status, "warn");
  assert.deepEqual(
    localReport.checks.filter((check) => check.status === "warn").map((check) => check.name),
    ["gateway-url", "auth", "readiness", "tool-watching"]
  );

  const failedAuthReport = diagnoseMobigentProviderRuntimeConfig({
    kind: "openrouter",
    baseUrl: "https://gateway.example.com",
    auth: "bearer"
  });
  assert.equal(failedAuthReport.status, "fail");
  assert.match(failedAuthReport.errors.join("\n"), /requires MOBIGENT_HTTP_API_KEY/);

  const invalidProviderReport = diagnoseMobigentProviderRuntimeConfig({
    env: { MOBIGENT_PROVIDER: "not-real" }
  });
  assert.equal(invalidProviderReport.status, "fail");
  assert.match(formatMobigentProviderRuntimeConfigReport(invalidProviderReport), /Unsupported MOBIGENT_PROVIDER/);
});

test("provider HTTP client reports typed timeout while waiting for tools", async () => {
  const client = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () => new Response(JSON.stringify({ tools: [] }), { status: 200 })
  });

  await assert.rejects(
    () => client.waitForTools({ intervalMs: 0, timeoutMs: 1 }),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "gateway_error");
      assert.equal(error.operation, "waitForTools");
      assert.equal(error.retryable, true);
      assert.match(error.message, /Timed out waiting/);
      return true;
    }
  );
});

test("provider HTTP client throws typed errors for HTTP, network, and shape failures", async () => {
  const invalidInputClient = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () =>
      new Response(JSON.stringify({ code: "invalid_input", error: "Invalid tool input: $.message is required", retryable: false }), {
        status: 400
      })
  });

  await assert.rejects(
    () => invalidInputClient.callTool("com.example.create_note", {}),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "invalid_input");
      assert.equal(error.operation, "callTool");
      assert.equal(error.status, 400);
      assert.equal(error.retryable, false);
      assert.deepEqual(error.body, {
        code: "invalid_input",
        error: "Invalid tool input: $.message is required",
        retryable: false
      });
      return true;
    }
  );

  const conflictClient = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () =>
      new Response(JSON.stringify({ code: "conflict", error: "Idempotency key was already used.", retryable: false }), {
        status: 409
      })
  });

  await assert.rejects(
    () => conflictClient.callTool("com.example.create_note", {}),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "conflict");
      assert.equal(error.retryable, false);
      return true;
    }
  );

  const gatewayTimeoutClient = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () =>
      new Response(JSON.stringify({ code: "timeout", error: "Timed out waiting for app response.", retryable: true }), {
        status: 504
      })
  });

  await assert.rejects(
    () => gatewayTimeoutClient.callTool("com.example.create_note", {}),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "timeout");
      assert.equal(error.retryable, true);
      return true;
    }
  );

  const forbiddenClient = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () => new Response(JSON.stringify({ error: 'Agent "anonymous" is not allowed.' }), { status: 400 })
  });

  await assert.rejects(
    () => forbiddenClient.callTool("com.example.create_note", {}),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "forbidden");
      assert.equal(error.operation, "callTool");
      return true;
    }
  );

  const invalidShapeClient = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () => new Response(JSON.stringify({ tools: "bad" }), { status: 200 })
  });

  await assert.rejects(
    () => invalidShapeClient.listTools(),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "invalid_response");
      assert.equal(error.operation, "listTools");
      return true;
    }
  );

  const invalidToolShapeClient = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () => new Response(JSON.stringify({ tool: { name: "missing-schema" } }), { status: 200 })
  });

  await assert.rejects(
    () => invalidToolShapeClient.getTool("com.example.create_note"),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "invalid_response");
      assert.equal(error.operation, "getTool");
      return true;
    }
  );

  const missingToolClient = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () => new Response(JSON.stringify({ error: "No connected app exposes tool." }), { status: 404 })
  });

  await assert.rejects(
    () => missingToolClient.getTool("com.example.missing"),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "not_found");
      assert.equal(error.operation, "getTool");
      assert.equal(error.status, 404);
      return true;
    }
  );

  const invalidProviderShapeClient = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () => new Response(JSON.stringify({ providers: "bad" }), { status: 200 })
  });

  await assert.rejects(
    () => invalidProviderShapeClient.listProviders(),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "invalid_response");
      assert.equal(error.operation, "listProviders");
      return true;
    }
  );

  const invalidConfigShapeClient = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () => new Response(JSON.stringify({ name: "wrong" }), { status: 200 })
  });

  await assert.rejects(
    () => invalidConfigShapeClient.getConfig(),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "invalid_response");
      assert.equal(error.operation, "getConfig");
      return true;
    }
  );

  const invalidAppShapeClient = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () => new Response(JSON.stringify({ apps: [{ sessionId: "missing-fields" }] }), { status: 200 })
  });

  await assert.rejects(
    () => invalidAppShapeClient.listApps(),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "invalid_response");
      assert.equal(error.operation, "listApps");
      return true;
    }
  );

  const invalidHealthShapeClient = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () => new Response(JSON.stringify({ ok: true }), { status: 200 })
  });

  await assert.rejects(
    () => invalidHealthShapeClient.getHealth(),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "invalid_response");
      assert.equal(error.operation, "getHealth");
      return true;
    }
  );

  const invalidReadinessShapeClient = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () =>
      new Response(
        JSON.stringify({
          ok: false,
          name: "Mobigent Gateway",
          status: {
            appSessions: 0,
            authenticatedAppSessions: 0,
            appsWithManifests: 0,
            tools: 0,
            auditEvents: 0,
            idempotencyRecords: 0,
            rateLimitBuckets: 0,
            manifestSigningRequired: false,
            appAllowlistEnabled: false
          },
          requirements: {}
        }),
        { status: 503 }
      )
  });

  await assert.rejects(
    () => invalidReadinessShapeClient.getReadiness({ minTools: 1 }),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "invalid_response");
      assert.equal(error.operation, "getReadiness");
      return true;
    }
  );

  const invalidMetricsShapeClient = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () => new Response(JSON.stringify({ metrics: { status: {} } }), { status: 200 })
  });

  await assert.rejects(
    () => invalidMetricsShapeClient.getMetrics(),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "invalid_response");
      assert.equal(error.operation, "getMetrics");
      return true;
    }
  );

  const invalidAuditShapeClient = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () => new Response(JSON.stringify({ events: [{ id: "missing-fields" }] }), { status: 200 })
  });

  await assert.rejects(
    () => invalidAuditShapeClient.listAuditEvents(),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "invalid_response");
      assert.equal(error.operation, "listAuditEvents");
      return true;
    }
  );

  const networkClient = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    fetch: async () => {
      throw new Error("socket hang up");
    }
  });

  await assert.rejects(
    () => networkClient.listTools(),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "network_error");
      assert.equal(error.operation, "listTools");
      assert.equal(error.retryable, true);
      return true;
    }
  );

  const timeoutClient = createMobigentHttpClient({
    baseUrl: "http://localhost:8788",
    timeoutMs: 5,
    fetch: async (_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted by test signal")), {
          once: true
        });
      })
  });

  await assert.rejects(
    () => timeoutClient.getHealth(),
    (error) => {
      assert.ok(error instanceof MobigentHttpError);
      assert.equal(error.code, "network_error");
      assert.equal(error.operation, "getHealth");
      assert.equal(error.retryable, true);
      assert.match(error.message, /timed out after 5ms/);
      return true;
    }
  );
});

test("provider CLI generates setup and validates required options", () => {
  const listed = runProviderCli(["--list"]);
  assert.equal(listed.code, 0);
  assert.match(listed.stdout, /claude-desktop/);
  assert.match(listed.stdout, /chatgpt-actions/);
  assert.match(listed.stdout, /openai-responses/);
  assert.match(listed.stdout, /azure-openai/);
  assert.match(listed.stdout, /openai-compatible/);
  assert.match(listed.stdout, /openrouter/);
  assert.match(listed.stdout, /litellm/);
  assert.match(listed.stdout, /ollama/);
  assert.match(listed.stdout, /lm-studio/);
  assert.match(listed.stdout, /groq/);
  assert.match(listed.stdout, /perplexity/);
  assert.match(listed.stdout, /xai-grok/);
  assert.match(listed.stdout, /deepseek/);
  assert.match(listed.stdout, /together-ai/);
  assert.match(listed.stdout, /fireworks-ai/);
  assert.match(listed.stdout, /mistral/);
  assert.match(listed.stdout, /cohere/);
  assert.match(listed.stdout, /anthropic-tool-use/);
  assert.match(listed.stdout, /google-gemini/);
  assert.match(listed.stdout, /aws-bedrock-converse/);
  assert.match(listed.stdout, /vercel-ai-sdk/);

  const matrix = runProviderCli(["--matrix", "--base-url", "https://mobigent.example", "--auth", "bearer"]);
  assert.equal(matrix.code, 0);
  const matrixBody = JSON.parse(matrix.stdout) as {
    summary: {
      total: number;
      byTransport: { stdio: number; openapi: number; http: number };
      byCategory: { "local-agent": number; "hosted-actions": number; "runtime-agent": number; fallback: number };
    };
    providers: Array<{
      id: string;
      transport: string;
      category: string;
      bestFor: string[];
      setupComplexity: string;
      runtime: boolean;
      dynamicTools: boolean;
      requiresPublicUrl: boolean;
      productionNotes: string[];
      setupCommand: string;
    }>;
  };
  assert.ok(matrixBody.summary.total >= 30);
  assert.ok(matrixBody.summary.byTransport.http > 20);
  assert.ok(matrixBody.summary.byCategory["runtime-agent"] > 20);
  assert.ok(
    matrixBody.providers.some(
      (provider) =>
        provider.id === "claude-desktop" &&
        provider.dynamicTools &&
        provider.category === "local-agent" &&
        provider.bestFor.includes("desktop agents")
    )
  );
  assert.ok(
    matrixBody.providers.some(
      (provider) =>
        provider.id === "chatgpt-actions" &&
        provider.transport === "openapi" &&
        provider.category === "hosted-actions" &&
        provider.setupComplexity === "high" &&
        provider.requiresPublicUrl &&
        provider.setupCommand.includes("https://mobigent.example")
    )
  );
  assert.ok(
    matrixBody.providers.some(
      (provider) =>
        provider.id === "openai-responses" &&
        provider.category === "runtime-agent" &&
        provider.runtime &&
        provider.productionNotes.some((note) => note.includes("Fetch tools")) &&
        provider.setupCommand.includes("--format runtime-env")
    )
  );

  const presets = runProviderCli(["--recommend-presets"]);
  assert.equal(presets.code, 0);
  const presetsBody = JSON.parse(presets.stdout) as {
    presets: Array<{ id: string; recommendedTransport: string; publicUrlDefault: boolean }>;
  };
  assert.deepEqual(
    presetsBody.presets.map((preset) => preset.id),
    ["local-agent", "hosted-actions", "runtime-agent"]
  );
  assert.ok(
    presetsBody.presets.some(
      (preset) => preset.id === "hosted-actions" && preset.recommendedTransport === "openapi" && preset.publicUrlDefault
    )
  );

  const recommendation = runProviderCli([
    "--recommend",
    "runtime-agent",
    "--base-url",
    "http://localhost:8788",
    "--query",
    "openrouter",
    "--limit",
    "1"
  ]);
  assert.equal(recommendation.code, 0);
  const recommendationBody = JSON.parse(recommendation.stdout) as {
    useCase: string;
    preset: { id: string; recommendedTransport: string };
    recommendations: Array<{ id: string; score: number; reasons: string[]; setupCommand: string }>;
  };
  assert.equal(recommendationBody.useCase, "runtime-agent");
  assert.equal(recommendationBody.preset.recommendedTransport, "http");
  assert.deepEqual(recommendationBody.recommendations.map((provider) => provider.id), ["openrouter"]);
  assert.ok(recommendationBody.recommendations[0]?.score);
  assert.ok(recommendationBody.recommendations[0]?.reasons.some((reason) => reason.includes("server-side")));
  assert.match(recommendationBody.recommendations[0]?.setupCommand ?? "", /--provider openrouter/);

  const setupPlan = runProviderCli([
    "--setup-plan",
    "runtime-agent",
    "--base-url",
    "http://localhost:8788",
    "--query",
    "openrouter",
    "--limit",
    "1",
    "--agent-id",
    "openrouter-prod"
  ]);
  assert.equal(setupPlan.code, 0, setupPlan.stderr);
  const setupPlanBody = JSON.parse(setupPlan.stdout) as {
    useCase: string;
    recommendation: { provider: { id: string }; score: number };
    validation: { status: string };
    bundle: {
      runtimeEnv: {
        MOBIGENT_PROVIDER: string;
        MOBIGENT_HTTP_URL: string;
        MOBIGENT_AGENT_ID: string;
      };
      endpoints: { tools: string; toolStream: string };
    };
  };
  assert.equal(setupPlanBody.useCase, "runtime-agent");
  assert.equal(setupPlanBody.recommendation.provider.id, "openrouter");
  assert.ok(setupPlanBody.recommendation.score > 0);
  assert.equal(setupPlanBody.validation.status, "pass");
  assert.equal(setupPlanBody.bundle.runtimeEnv.MOBIGENT_PROVIDER, "openrouter");
  assert.equal(setupPlanBody.bundle.runtimeEnv.MOBIGENT_HTTP_URL, "http://localhost:8788");
  assert.equal(setupPlanBody.bundle.runtimeEnv.MOBIGENT_AGENT_ID, "openrouter-prod");
  assert.equal(setupPlanBody.bundle.endpoints.tools, "http://localhost:8788/tools");
  assert.equal(setupPlanBody.bundle.endpoints.toolStream, "http://localhost:8788/tools/stream");

  const validSetup = runProviderCli([
    "--provider",
    "openrouter",
    "--base-url",
    "http://localhost:8788",
    "--validate"
  ]);
  assert.equal(validSetup.code, 0);
  const validSetupBody = JSON.parse(validSetup.stdout) as { status: string; ok: boolean; summary: string };
  assert.equal(validSetupBody.status, "pass");
  assert.equal(validSetupBody.ok, true);
  assert.match(validSetupBody.summary, /ready/);

  const invalidHostedSetup = runProviderCli([
    "--provider",
    "chatgpt-actions",
    "--base-url",
    "http://localhost:8788",
    "--validate"
  ]);
  assert.equal(invalidHostedSetup.code, 1);
  const invalidHostedSetupBody = JSON.parse(invalidHostedSetup.stdout) as { status: string; ok: boolean };
  assert.equal(invalidHostedSetupBody.status, "fail");
  assert.equal(invalidHostedSetupBody.ok, false);

  const validationGuide = runProviderCli([
    "--provider",
    "openrouter",
    "--base-url",
    "http://localhost:8788",
    "--validate",
    "--format",
    "guide"
  ]);
  assert.equal(validationGuide.code, 0);
  assert.match(validationGuide.stdout, /Mobigent provider setup: PASS/);

  const claude = runProviderCli([
    "--provider",
    "claude-desktop",
    "--command",
    "npx",
    "--arg",
    "mobigent-mcp",
    "--env",
    "MOBIGENT_AUTH_TOKEN=secret"
  ]);
  assert.equal(claude.code, 0);
  assert.deepEqual(JSON.parse(claude.stdout), {
    mcpServers: {
      mobigent: {
        command: "npx",
        args: ["mobigent-mcp"],
        env: { MOBIGENT_AUTH_TOKEN: "secret" }
      }
    }
  });

  const chatgpt = runProviderCli([
    "--provider",
    "chatgpt-actions",
    "--base-url",
    "https://mobigent.example",
    "--format",
    "guide"
  ]);
  assert.equal(chatgpt.code, 0);
  assert.match(chatgpt.stdout, /ChatGPT Actions/);
  assert.match(chatgpt.stdout, /https:\/\/mobigent.example\/openapi\.json/);

  const openai = runProviderCli([
    "--provider",
    "openai-responses",
    "--base-url",
    "http://localhost:8788",
    "--auth",
    "bearer",
    "--agent-id",
    "openai-prod"
  ]);
  assert.equal(openai.code, 0);
  assert.deepEqual(JSON.parse(openai.stdout).headers, {
    "content-type": "application/json",
    "x-mobigent-agent": "openai-prod",
    authorization: "Bearer ${MOBIGENT_HTTP_API_KEY}"
  });

  const azureOpenAi = runProviderCli([
    "--provider",
    "azure-openai",
    "--base-url",
    "http://localhost:8788",
    "--format",
    "runtime-env"
  ]);
  assert.equal(azureOpenAi.code, 0);
  assert.match(azureOpenAi.stdout, /MOBIGENT_PROVIDER=azure-openai/);

  const openAiCompatible = runProviderCli([
    "--provider",
    "openai-compatible",
    "--base-url",
    "http://localhost:8788",
    "--format",
    "guide"
  ]);
  assert.equal(openAiCompatible.code, 0);
  assert.match(openAiCompatible.stdout, /OpenAI-compatible/);

  const openrouter = runProviderCli([
    "--provider",
    "openrouter",
    "--base-url",
    "http://localhost:8788",
    "--format",
    "guide"
  ]);
  assert.equal(openrouter.code, 0);
  assert.match(openrouter.stdout, /OpenRouter/);
  assert.match(openrouter.stdout, /chat function tools/);

  const openrouterBundle = runProviderCli([
    "--provider",
    "openrouter",
    "--base-url",
    "http://localhost:8788",
    "--format",
    "bundle"
  ]);
  assert.equal(openrouterBundle.code, 0);
  const bundle = JSON.parse(openrouterBundle.stdout) as {
    provider: { id: string };
    endpoints: { snapshot: string; tools: string };
    runtimeEnv: { MOBIGENT_PROVIDER: string; MOBIGENT_AGENT_ID: string };
  };
  assert.equal(bundle.provider.id, "openrouter");
  assert.equal(bundle.endpoints.snapshot, "http://localhost:8788/snapshot");
  assert.equal(bundle.endpoints.tools, "http://localhost:8788/tools");
  assert.equal(bundle.runtimeEnv.MOBIGENT_PROVIDER, "openrouter");
  assert.equal(bundle.runtimeEnv.MOBIGENT_AGENT_ID, "openrouter");

  const litellm = runProviderCli([
    "--provider",
    "litellm",
    "--base-url",
    "http://localhost:8788"
  ]);
  assert.equal(litellm.code, 0);
  assert.equal(JSON.parse(litellm.stdout).headers["x-mobigent-agent"], "litellm");
  assert.match(JSON.parse(litellm.stdout).adapter, /LiteLLM/);

  const ollama = runProviderCli([
    "--provider",
    "ollama",
    "--base-url",
    "http://localhost:8788"
  ]);
  assert.equal(ollama.code, 0);
  assert.equal(JSON.parse(ollama.stdout).headers["x-mobigent-agent"], "ollama");
  assert.match(JSON.parse(ollama.stdout).adapter, /Ollama/);

  const lmStudio = runProviderCli([
    "--provider",
    "lm-studio",
    "--base-url",
    "http://localhost:8788"
  ]);
  assert.equal(lmStudio.code, 0);
  assert.equal(JSON.parse(lmStudio.stdout).headers["x-mobigent-agent"], "lm-studio");
  assert.match(JSON.parse(lmStudio.stdout).adapter, /LM Studio/);

  const groq = runProviderCli([
    "--provider",
    "groq",
    "--base-url",
    "http://localhost:8788"
  ]);
  assert.equal(groq.code, 0);
  assert.equal(JSON.parse(groq.stdout).headers["x-mobigent-agent"], "groq");
  assert.match(JSON.parse(groq.stdout).adapter, /Groq/);

  const perplexity = runProviderCli([
    "--provider",
    "perplexity",
    "--base-url",
    "http://localhost:8788"
  ]);
  assert.equal(perplexity.code, 0);
  assert.equal(JSON.parse(perplexity.stdout).headers["x-mobigent-agent"], "perplexity");
  assert.match(JSON.parse(perplexity.stdout).adapter, /Perplexity/);

  const xaiGrok = runProviderCli([
    "--provider",
    "xai-grok",
    "--base-url",
    "http://localhost:8788"
  ]);
  assert.equal(xaiGrok.code, 0);
  assert.equal(JSON.parse(xaiGrok.stdout).headers["x-mobigent-agent"], "xai-grok");
  assert.match(JSON.parse(xaiGrok.stdout).adapter, /xAI Grok/);

  const deepseek = runProviderCli([
    "--provider",
    "deepseek",
    "--base-url",
    "http://localhost:8788"
  ]);
  assert.equal(deepseek.code, 0);
  assert.equal(JSON.parse(deepseek.stdout).headers["x-mobigent-agent"], "deepseek");
  assert.match(JSON.parse(deepseek.stdout).adapter, /DeepSeek/);

  const together = runProviderCli([
    "--provider",
    "together-ai",
    "--base-url",
    "http://localhost:8788"
  ]);
  assert.equal(together.code, 0);
  assert.equal(JSON.parse(together.stdout).headers["x-mobigent-agent"], "together-ai");
  assert.match(JSON.parse(together.stdout).adapter, /Together AI/);

  const fireworks = runProviderCli([
    "--provider",
    "fireworks-ai",
    "--base-url",
    "http://localhost:8788"
  ]);
  assert.equal(fireworks.code, 0);
  assert.equal(JSON.parse(fireworks.stdout).headers["x-mobigent-agent"], "fireworks-ai");
  assert.match(JSON.parse(fireworks.stdout).adapter, /Fireworks AI/);

  const mistral = runProviderCli([
    "--provider",
    "mistral",
    "--base-url",
    "http://localhost:8788"
  ]);
  assert.equal(mistral.code, 0);
  assert.equal(JSON.parse(mistral.stdout).headers["x-mobigent-agent"], "mistral");

  const cohereRuntimeEnv = runProviderCli([
    "--provider",
    "cohere",
    "--base-url",
    "http://localhost:8788",
    "--format",
    "runtime-env"
  ]);
  assert.equal(cohereRuntimeEnv.code, 0);
  assert.match(cohereRuntimeEnv.stdout, /MOBIGENT_PROVIDER=cohere/);

  const runtimeEnv = runProviderCli([
    "--provider",
    "anthropic-tool-use",
    "--base-url",
    "http://localhost:8788",
    "--auth",
    "bearer",
    "--agent-id",
    "claude-prod",
    "--format",
    "runtime-env"
  ]);
  assert.equal(runtimeEnv.code, 0);
  assert.match(runtimeEnv.stdout, /MOBIGENT_PROVIDER=anthropic-tool-use/);
  assert.match(runtimeEnv.stdout, /MOBIGENT_HTTP_URL=http:\/\/localhost:8788/);
  assert.match(runtimeEnv.stdout, /MOBIGENT_AGENT_ID=claude-prod/);
  assert.match(runtimeEnv.stdout, /MOBIGENT_HTTP_API_KEY=\$\{MOBIGENT_HTTP_API_KEY\}/);
  assert.match(runtimeEnv.stdout, /MOBIGENT_MIN_APPS=1/);
  assert.match(runtimeEnv.stdout, /MOBIGENT_WATCH_TOOLS=false/);

  const gemini = runProviderCli([
    "--provider",
    "google-gemini",
    "--base-url",
    "http://localhost:8788",
    "--auth",
    "api-key"
  ]);
  assert.equal(gemini.code, 0);
  assert.equal(JSON.parse(gemini.stdout).headers["x-mobigent-agent"], "google-gemini");

  const bedrock = runProviderCli([
    "--provider",
    "aws-bedrock-converse",
    "--base-url",
    "http://localhost:8788"
  ]);
  assert.equal(bedrock.code, 0);
  assert.equal(JSON.parse(bedrock.stdout).headers["x-mobigent-agent"], "aws-bedrock-converse");

  const vercel = runProviderCli([
    "--provider",
    "vercel-ai-sdk",
    "--base-url",
    "http://localhost:8788"
  ]);
  assert.equal(vercel.code, 0);
  assert.deepEqual(JSON.parse(vercel.stdout).npm, ["ai"]);

  const crewai = runProviderCli([
    "--provider",
    "crewai",
    "--base-url",
    "http://localhost:8788"
  ]);
  assert.equal(crewai.code, 0);
  assert.deepEqual(JSON.parse(crewai.stdout).python, ["crewai", "crewai-tools", "pydantic"]);

  const autogen = runProviderCli([
    "--provider",
    "autogen",
    "--base-url",
    "http://localhost:8788"
  ]);
  assert.equal(autogen.code, 0);
  assert.deepEqual(JSON.parse(autogen.stdout).python, ["autogen-core"]);

  const haystack = runProviderCli([
    "--provider",
    "haystack",
    "--base-url",
    "http://localhost:8788"
  ]);
  assert.equal(haystack.code, 0);
  assert.deepEqual(JSON.parse(haystack.stdout).python, ["haystack-ai"]);

  const missingBaseUrl = runProviderCli(["--provider", "openapi"]);
  assert.equal(missingBaseUrl.code, 1);
  assert.match(missingBaseUrl.stderr, /--base-url is required/);

  const invalidRuntimeEnv = runProviderCli(["--provider", "claude-desktop", "--format", "runtime-env"]);
  assert.equal(invalidRuntimeEnv.code, 1);
  assert.match(invalidRuntimeEnv.stderr, /runtime-env is only available/);
});

test("provider CLI writes provider matrix artifacts for setup review", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mobigent-provider-matrix-"));
  const matrixPath = join(dir, "mobigent-providers.json");
  const compatibilityPath = join(dir, "mobigent-provider-compatibility.json");
  const setupPlanPath = join(dir, "mobigent-provider-setup.json");

  const written = runProviderCli([
    "--write-matrix",
    matrixPath,
    "--base-url",
    "https://mobigent.example",
    "--auth",
    "bearer"
  ]);
  assert.equal(written.code, 0, written.stderr);
  assert.match(written.stdout, /Created Mobigent provider matrix/);

  const matrix = JSON.parse(await readFile(matrixPath, "utf8")) as {
    summary: { total: number };
    providers: Array<{ id: string; setupCommand: string }>;
  };
  assert.ok(matrix.summary.total >= 30);
  assert.ok(matrix.providers.some((provider) => provider.id === "chatgpt-actions"));
  assert.ok(
    matrix.providers.some(
      (provider) => provider.id === "openai-responses" && provider.setupCommand.includes("--format runtime-env")
    )
  );

  const duplicate = runProviderCli(["--write-matrix", matrixPath, "--base-url", "https://mobigent.example"]);
  assert.equal(duplicate.code, 1);
  assert.match(duplicate.stderr, /already exists/);

  const forced = runProviderCli([
    "--write-matrix",
    matrixPath,
    "--base-url",
    "https://mobigent.example",
    "--force"
  ]);
  assert.equal(forced.code, 0, forced.stderr);

  const compatibility = runProviderCli([
    "--compatibility",
    "--base-url",
    "https://mobigent.example",
    "--auth",
    "bearer"
  ]);
  assert.equal(compatibility.code, 0, compatibility.stderr);
  const compatibilityReport = JSON.parse(compatibility.stdout) as {
    summary: { total: number; pass: number; warn: number; fail: number };
    providers: Array<{ id: string; status: string; failingChecks: string[]; warningChecks: string[] }>;
  };
  assert.ok(compatibilityReport.summary.total >= 30);
  assert.equal(compatibilityReport.summary.fail, 0);
  assert.ok(compatibilityReport.summary.warn > 0);
  assert.ok(
    compatibilityReport.providers.some(
      (provider) =>
        provider.id === "openrouter" &&
        provider.status === "warn" &&
        provider.warningChecks.includes("http.auth")
    )
  );

  const writtenCompatibility = runProviderCli([
    "--write-compatibility",
    compatibilityPath,
    "--base-url",
    "https://mobigent.example"
  ]);
  assert.equal(writtenCompatibility.code, 0, writtenCompatibility.stderr);
  assert.match(writtenCompatibility.stdout, /Created Mobigent provider compatibility report/);
  assert.equal((JSON.parse(await readFile(compatibilityPath, "utf8")) as { summary: { fail: number } }).summary.fail, 0);

  const writtenSetupPlan = runProviderCli([
    "--write-setup-plan",
    setupPlanPath,
    "--base-url",
    "http://localhost:8788",
    "--query",
    "anthropic",
    "--agent-id",
    "claude-prod"
  ]);
  assert.equal(writtenSetupPlan.code, 0, writtenSetupPlan.stderr);
  assert.match(writtenSetupPlan.stdout, /Created Mobigent provider setup plan/);
  const setupPlan = JSON.parse(await readFile(setupPlanPath, "utf8")) as {
    recommendation: { provider: { id: string } };
    bundle: { runtimeEnv: { MOBIGENT_AGENT_ID: string } };
  };
  assert.equal(setupPlan.recommendation.provider.id, "anthropic-tool-use");
  assert.equal(setupPlan.bundle.runtimeEnv.MOBIGENT_AGENT_ID, "claude-prod");

  const validateSetupPlan = runProviderCli(["--validate-setup-plan", setupPlanPath]);
  assert.equal(validateSetupPlan.code, 0, validateSetupPlan.stderr);
  assert.match(validateSetupPlan.stdout, /Mobigent provider setup plan: PASS/);
  assert.match(validateSetupPlan.stdout, /PROVIDER anthropic-tool-use/);

  const invalidSetupPlanPath = join(dir, "invalid-provider-setup.json");
  await writeFile(invalidSetupPlanPath, JSON.stringify({ ...setupPlan, useCase: "broken" }), "utf8");
  const invalidSetupPlan = runProviderCli(["--validate-setup-plan", invalidSetupPlanPath]);
  assert.equal(invalidSetupPlan.code, 1);
  assert.match(invalidSetupPlan.stdout, /Mobigent provider setup plan: FAIL/);

  const runtimeConfig = runProviderCli([
    "--runtime-config",
    "--provider",
    "openrouter",
    "--base-url",
    "https://mobigent.example",
    "--auth",
    "bearer",
    "--env",
    "MOBIGENT_HTTP_API_KEY=runtime-secret",
    "--agent-id",
    "openrouter-prod"
  ]);
  assert.equal(runtimeConfig.code, 0, runtimeConfig.stderr);
  const runtimeConfigBody = JSON.parse(runtimeConfig.stdout) as { status: string; config: { kind: string; agentId: string } };
  assert.equal(runtimeConfigBody.status, "warn");
  assert.equal(runtimeConfigBody.config.kind, "openrouter");
  assert.equal(runtimeConfigBody.config.agentId, "openrouter-prod");

  const runtimeConfigGuide = runProviderCli([
    "--runtime-config",
    "--provider",
    "openrouter",
    "--base-url",
    "https://mobigent.example",
    "--auth",
    "bearer",
    "--env",
    "MOBIGENT_HTTP_API_KEY=runtime-secret",
    "--env",
    "MOBIGENT_WATCH_TOOLS=true",
    "--format",
    "guide"
  ]);
  assert.equal(runtimeConfigGuide.code, 0, runtimeConfigGuide.stderr);
  assert.match(runtimeConfigGuide.stdout, /Mobigent provider runtime config: PASS/);

  const invalidRuntimeConfig = runProviderCli([
    "--runtime-config",
    "--provider",
    "openrouter",
    "--base-url",
    "ws://gateway.example.com",
    "--auth",
    "bearer"
  ]);
  assert.equal(invalidRuntimeConfig.code, 1);
  assert.match(JSON.parse(invalidRuntimeConfig.stdout).errors.join("\n"), /http:\/\/ or https:\/\//);

  await rm(dir, { force: true, recursive: true });
});
