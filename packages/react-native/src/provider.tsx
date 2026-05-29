import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import {
  Mobigent,
  type MobigentDiagnostics,
  type MobigentConnectionState,
  type MobigentEventQueueOptions,
  type MobigentHeartbeatOptions,
  type MobigentManifestSigner,
  type MobigentReconnectOptions,
  type AgentBridge as AgentBridgeCompat
} from "./AgentBridge.js";
import type {
  ActionDefinition,
  CapabilityPolicy,
  ComponentDefinition,
  ConfirmationPolicy,
  JsonObject,
  ResourceDefinition
} from "@mobigent/core";
import { validateCapabilityManifest } from "@mobigent/core";
import {
  ConfirmationController,
  createConfirmationController,
  type ConfirmationRequest
} from "./confirmation.js";
import {
  createMobigentGatewayUrl,
  createMobigentGatewayUrlForPlatform,
  type MobigentGatewayPlatform,
  type MobigentGatewayTarget,
  type MobigentGatewayUrlOptions
} from "./gatewayUrl.js";
import type { MobigentSocketFactory } from "./transport.js";

export type MobigentProviderGatewayOptions = Omit<MobigentGatewayUrlOptions, "target"> & {
  platform?: MobigentGatewayPlatform;
  target?: MobigentGatewayTarget;
  deviceHost?: string;
  androidTarget?: Extract<MobigentGatewayTarget, "android-emulator" | "device">;
};

export type MobigentEnvironmentMode = "local" | "device" | "hosted" | "disabled";

export type MobigentEnvironmentOptions = {
  mode?: MobigentEnvironmentMode;
  platform?: MobigentGatewayPlatform;
  deviceHost?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  path?: string;
  gatewayUrl?: string;
  authToken?: string;
  enabled?: boolean;
};

export type MobigentEnvironmentVariables = Record<string, string | undefined>;

export type MobigentEnvironmentFromEnvOptions = {
  env?: MobigentEnvironmentVariables;
  prefix?: string;
  fallback?: MobigentEnvironmentOptions;
};

export type MobigentEnvironmentConfig = Pick<
  MobigentProviderProps,
  "enabled" | "gateway" | "gatewayUrl" | "authToken"
>;

export type MobigentAppIdentity = {
  id: string;
  name: string;
  version?: string;
};

export type MobigentExpoConfig = {
  name?: string;
  slug?: string;
  version?: string;
  extra?: Record<string, unknown>;
  ios?: {
    bundleIdentifier?: string;
  };
  android?: {
    package?: string;
  };
};

export type MobigentExpoExtraConfig = MobigentEnvironmentOptions & {
  app?: MobigentAppIdentity;
  appId?: string;
  appName?: string;
  version?: string;
};

export type MobigentProviderProps = {
  app?: MobigentAppIdentity;
  appId?: string;
  appName?: string;
  gatewayUrl?: string;
  gateway?: MobigentProviderGatewayOptions;
  authToken?: string;
  version?: string;
  reconnect?: boolean | MobigentReconnectOptions;
  eventQueue?: boolean | MobigentEventQueueOptions;
  heartbeat?: boolean | MobigentHeartbeatOptions;
  signManifest?: MobigentManifestSigner;
  createSocket?: MobigentSocketFactory;
  bridge?: Mobigent;
  enabled?: boolean;
  autoConnect?: boolean;
  children: ReactNode;
};

export type MobigentContextValue = {
  bridge: Mobigent;
  confirmationController: ConfirmationController;
  confirmationRequest: ConfirmationRequest | undefined;
  connected: boolean;
  connectionState: MobigentConnectionState;
  diagnostics: MobigentDiagnostics;
  enabled: boolean;
  connect(): Promise<void>;
  disconnect(): void;
};

export type MobigentStatusLevel = "disabled" | "ready" | "connecting" | "attention" | "offline";

export type MobigentStatus = {
  level: MobigentStatusLevel;
  label: string;
  connected: boolean;
  connectionState: MobigentConnectionState;
  capabilityCount: number;
  issueCount: number;
  blockingIssueCount: number;
  queuedEventCount: number;
};

export type MobigentActionHandler = (input: JsonObject) => Promise<unknown> | unknown;
export type MobigentResourceReader = () => Promise<unknown> | unknown;
export type MobigentComponentFocusHandler = (props: JsonObject) => Promise<unknown> | unknown;

export type MobigentRegistrationOptions = {
  enabled?: boolean;
  deps?: readonly unknown[];
};

export type MobigentPolicyPreset =
  | "read-only"
  | "foreground"
  | "user-required"
  | "confirmed"
  | "destructive";

export type MobigentPolicyOptions = {
  title?: string;
  message?: string;
  risk?: ConfirmationPolicy["risk"];
  allowedAgents?: string[];
  rateLimitPerMinute?: number;
  sensitiveData?: string[];
  policy?: CapabilityPolicy;
  confirmation?: ConfirmationPolicy;
};

export type MobigentPolicyBundle = {
  policy?: CapabilityPolicy;
  confirmation?: ConfirmationPolicy;
};

export type MobigentActionRegistration = ActionDefinition & {
  handler: MobigentActionHandler;
};

export type MobigentResourceRegistration = ResourceDefinition & {
  read: MobigentResourceReader;
};

export type MobigentComponentRegistration = ComponentDefinition & {
  focus: MobigentComponentFocusHandler;
};

export type MobigentActionProps = MobigentActionRegistration & MobigentRegistrationOptions;

export type MobigentResourceProps = MobigentResourceRegistration & MobigentRegistrationOptions;

export type MobigentComponentProps = MobigentComponentRegistration & MobigentRegistrationOptions;

export type AgentActionProps = MobigentActionProps;
export type AgentResourceProps = MobigentResourceProps;
export type AgentComponentProps = MobigentComponentProps;

export type MobigentCapabilitiesProps = {
  actions?: MobigentActionRegistration[];
  resources?: MobigentResourceRegistration[];
  components?: MobigentComponentRegistration[];
  enabled?: boolean;
  deps?: readonly unknown[];
};

export type AgentOptions = MobigentCapabilitiesProps;

export type AgentHookResult = {
  emit: ReturnType<typeof useMobigentEvent>;
  status: MobigentStatus;
  connection: ReturnType<typeof useMobigentConnection>;
  connected: boolean;
};

export type AgentScreenOptions = AgentFeatureModuleOptions & MobigentModuleRegistrationOptions;

export type AgentScreenFactory = () => AgentFeatureModuleOptions | MobigentModule;

export type AgentScreenHookResult = AgentHookResult & {
  module: MobigentModule;
};

export type MobigentFeatureOptions = {
  namespace: string;
  actions?: MobigentActionRegistration[];
  resources?: MobigentResourceRegistration[];
  components?: MobigentComponentRegistration[];
};

export type MobigentFeatureCapabilitiesOptions = Omit<MobigentFeatureOptions, "namespace">;

export type MobigentFeatureFactory = {
  namespace: string;
  action(action: MobigentActionRegistration): MobigentActionRegistration;
  resource(resource: MobigentResourceRegistration): MobigentResourceRegistration;
  component(component: MobigentComponentRegistration): MobigentComponentRegistration;
  capabilities(options?: MobigentFeatureCapabilitiesOptions): MobigentCapabilityKit;
};

export type MobigentCapabilityKit = Required<
  Pick<MobigentCapabilitiesProps, "actions" | "resources" | "components">
> & {
  useRegister(options?: MobigentRegistrationOptions): void;
  Component(props?: MobigentRegistrationOptions): null;
};

export type MobigentModuleOptions = {
  id: string;
  name?: string;
  version?: string;
  capabilities: MobigentCapabilitySource | MobigentCapabilitySource[];
};

export type AgentModuleOptions = MobigentModuleOptions | AgentFeatureModuleOptions;

export type AgentFeatureModuleOptions = {
  namespace: string;
  id?: string;
  name?: string;
  version?: string;
  actions?: MobigentActionRegistration[];
  resources?: MobigentResourceRegistration[];
  components?: MobigentComponentRegistration[];
  capabilities?: MobigentCapabilitySource | MobigentCapabilitySource[];
};

export type MobigentModuleMetadata = {
  id: string;
  name?: string;
  version?: string;
  actions: string[];
  resources: string[];
  components: string[];
};

export type MobigentModule = MobigentCapabilityKit & {
  id: string;
  name?: string;
  version?: string;
};

export type MobigentModuleRegistrationOptions = {
  enabled?: boolean;
  deps?: readonly unknown[];
};

export type MobigentModulesProps = MobigentModuleRegistrationOptions & {
  modules: MobigentModule | MobigentModule[];
};

export type MobigentSurfaceProps = MobigentModuleRegistrationOptions & {
  children?: ReactNode;
  capabilities?: MobigentCapabilitySource | MobigentCapabilitySource[];
  modules?: MobigentModule | MobigentModule[];
};

export type AgentModulesProps = MobigentModulesProps;
export type AgentSurfaceProps = MobigentSurfaceProps;

export type MobigentModuleMountProps = MobigentModuleRegistrationOptions & {
  registry: MobigentCapabilityRegistry;
  module: MobigentModule;
};

export type MobigentCapabilitySource =
  | MobigentCapabilityKit
  | MobigentModule
  | MobigentCapabilitiesProps
  | undefined
  | null
  | false;

export type MobigentCapabilityRegistry = MobigentCapabilityKit & {
  add(...sources: MobigentCapabilitySource[]): MobigentCapabilityRegistry;
  install(...modules: MobigentModule[]): MobigentCapabilityRegistry;
  remove(...sources: MobigentCapabilitySource[]): MobigentCapabilityRegistry;
  clear(): MobigentCapabilityRegistry;
  getCapabilities(): MobigentCapabilityKit;
  getModules(): MobigentModuleMetadata[];
  subscribe(listener: () => void): () => void;
};

export type MobigentCapabilityDiagnosticsStatus = "pass" | "warn" | "fail";

export type MobigentCapabilityDiagnosticsCheck = {
  name: string;
  status: MobigentCapabilityDiagnosticsStatus;
  message: string;
  details?: unknown;
};

export type MobigentCapabilityDiagnostics = {
  status: MobigentCapabilityDiagnosticsStatus;
  summary: {
    actions: number;
    resources: number;
    components: number;
    total: number;
  };
  checks: MobigentCapabilityDiagnosticsCheck[];
  errors: string[];
};

export type MobigentCapabilityDiagnosticsOptions = {
  app?: MobigentAppIdentity;
  version?: string;
};

export type MobigentCapabilityDefinitionFactory = () => MobigentCapabilitySource | MobigentCapabilitySource[];

export type MobigentModuleDefinitionFactory = () => MobigentModule;

const MobigentContext = createContext<MobigentContextValue | undefined>(undefined);

export function MobigentProvider({
  app,
  appId,
  appName,
  gatewayUrl,
  gateway,
  authToken,
  version,
  reconnect,
  eventQueue,
  heartbeat,
  signManifest,
  createSocket,
  bridge,
  enabled = true,
  autoConnect = true,
  children
}: MobigentProviderProps) {
  const bridgeRef = useRef<Mobigent>(bridge ?? new Mobigent());
  const confirmationController = useMemo(() => createConfirmationController(), []);
  const [confirmationRequest, setConfirmationRequest] = useState<ConfirmationRequest | undefined>();
  const [connectionState, setConnectionState] = useState<MobigentConnectionState>(
    bridgeRef.current.getConnectionState()
  );
  const connected = connectionState === "connected";
  const diagnostics = bridgeRef.current.getDiagnostics();

  useEffect(() => {
    return confirmationController.subscribe(setConfirmationRequest);
  }, [confirmationController]);

  useEffect(() => {
    return bridgeRef.current.subscribeConnection(setConnectionState);
  }, []);

  useEffect(() => {
    if (!enabled) {
      bridgeRef.current.disconnect();
      return;
    }

    const resolvedGatewayUrl = resolveMobigentProviderGatewayUrl(gatewayUrl, gateway);
    const identity = resolveMobigentAppIdentity(app, appId, appName, version);

    bridgeRef.current.configure({
      appId: identity.id,
      appName: identity.name,
      gatewayUrl: resolvedGatewayUrl,
      authToken,
      version: identity.version,
      reconnect,
      eventQueue,
      heartbeat,
      signManifest,
      createSocket,
      confirmationController
    });
  }, [
    enabled,
    app,
    appId,
    appName,
    gatewayUrl,
    gateway,
    authToken,
    version,
    reconnect,
    eventQueue,
    heartbeat,
    signManifest,
    createSocket,
    confirmationController
  ]);

  const connect = useCallback(async () => {
    await bridgeRef.current.connect();
  }, []);

  const disconnect = useCallback(() => {
    bridgeRef.current.disconnect();
  }, []);

  const value = useMemo<MobigentContextValue>(
    () => ({
      bridge: bridgeRef.current,
      confirmationController,
      confirmationRequest,
      connected,
      connectionState,
      diagnostics,
      enabled,
      connect,
      disconnect
    }),
    [confirmationController, confirmationRequest, connected, connectionState, diagnostics, enabled, connect, disconnect]
  );

  useEffect(() => {
    if (!enabled || !autoConnect) {
      return;
    }

    let active = true;

    connect().catch(() => {
      if (active) {
        setConnectionState(bridgeRef.current.getConnectionState());
      }
    });

    return () => {
      active = false;
      disconnect();
    };
  }, [enabled, autoConnect, connect, disconnect]);

  return <MobigentContext.Provider value={value}>{children}</MobigentContext.Provider>;
}

export function useMobigent() {
  const context = useContext(MobigentContext);
  if (!context) {
    throw new Error("useMobigent must be used inside MobigentProvider.");
  }

  return context;
}

export function resolveMobigentProviderGatewayUrl(
  gatewayUrl?: string,
  gateway: MobigentProviderGatewayOptions = {}
) {
  if (gatewayUrl) {
    return gatewayUrl;
  }

  if (gateway.platform) {
    return createMobigentGatewayUrlForPlatform(gateway.platform, gateway);
  }

  return createMobigentGatewayUrl(gateway);
}

export function createMobigentEnvironment({
  mode = "local",
  platform,
  deviceHost,
  host,
  port,
  secure,
  path,
  gatewayUrl,
  authToken,
  enabled
}: MobigentEnvironmentOptions = {}): MobigentEnvironmentConfig {
  if (mode === "disabled") {
    return {
      enabled: false,
      authToken
    };
  }

  if (gatewayUrl) {
    return {
      enabled: enabled ?? true,
      gatewayUrl,
      authToken
    };
  }

  if (mode === "device") {
    if (!deviceHost && !host) {
      throw new Error("Mobigent device environment requires deviceHost or host.");
    }

    return {
      enabled: enabled ?? true,
      gateway: {
        platform,
        target: "device",
        deviceHost: deviceHost ?? host,
        host,
        port,
        secure,
        path
      },
      authToken
    };
  }

  if (mode === "hosted") {
    if (!host) {
      throw new Error("Mobigent hosted environment requires host or gatewayUrl.");
    }

    return {
      enabled: enabled ?? true,
      gateway: {
        host,
        port: port ?? 443,
        secure: secure ?? true,
        path
      },
      authToken
    };
  }

  return {
    enabled: enabled ?? true,
    gateway: {
      platform,
      port,
      secure,
      path
    },
    authToken
  };
}

export const createAgentEnvironment = createMobigentEnvironment;
export const createAgentEnvironmentFromEnv = createMobigentEnvironmentFromEnv;
export const createAgentEnvironmentFromExpoConfig = createMobigentEnvironmentFromExpoConfig;

export function createMobigentEnvironmentFromEnv({
  env = getDefaultMobigentEnv(),
  prefix = "MOBIGENT",
  fallback = {}
}: MobigentEnvironmentFromEnvOptions = {}): MobigentEnvironmentConfig {
  const read = (name: string) =>
    env[`${prefix}_${name}`] ??
    env[`EXPO_PUBLIC_${prefix}_${name}`] ??
    env[`REACT_NATIVE_${prefix}_${name}`];
  const mode = parseMobigentEnvironmentMode(read("MODE")) ?? fallback.mode;
  const enabled = parseMobigentBoolean(read("ENABLED")) ?? fallback.enabled;
  const port = parseMobigentPort(read("PORT")) ?? fallback.port;
  const secure = parseMobigentBoolean(read("SECURE")) ?? fallback.secure;
  const platform = parseMobigentGatewayPlatform(read("PLATFORM")) ?? fallback.platform;

  return createMobigentEnvironment({
    ...fallback,
    mode: enabled === false ? "disabled" : mode,
    enabled,
    platform,
    deviceHost: read("DEVICE_HOST") ?? fallback.deviceHost,
    host: read("HOST") ?? fallback.host,
    port,
    secure,
    path: read("PATH") ?? fallback.path,
    gatewayUrl: read("GATEWAY_URL") ?? fallback.gatewayUrl,
    authToken: read("AUTH_TOKEN") ?? fallback.authToken
  });
}

export function createMobigentEnvironmentFromExpoConfig(
  expo: MobigentExpoConfig = {},
  fallback: MobigentEnvironmentOptions = {}
): MobigentEnvironmentConfig {
  return createMobigentEnvironment({
    ...fallback,
    ...readMobigentExpoExtraConfig(expo)
  });
}

export function resolveMobigentAppIdentity(
  app?: MobigentAppIdentity,
  appId?: string,
  appName?: string,
  version?: string
): MobigentAppIdentity {
  const id = app?.id ?? appId;
  const name = app?.name ?? appName;
  const resolvedVersion = app?.version ?? version;

  if (!id || !name) {
    throw new Error(
      'Mobigent app identity is required. Pass app={{ id, name }} or both appId and appName.'
    );
  }

  return {
    id,
    name,
    version: resolvedVersion
  };
}

export function resolveMobigentExpoAppIdentity(expo: MobigentExpoConfig = {}): MobigentAppIdentity {
  const extra = expo.extra ?? {};
  const extraApp = isMobigentExpoExtraApp(extra.mobigentApp)
    ? extra.mobigentApp
    : isMobigentExpoExtraApp(extra.intentBridgeApp)
      ? extra.intentBridgeApp
      : undefined;
  const extraBridge = readMobigentExpoExtraConfig(expo);
  const id =
    readMobigentString(extraApp?.id) ??
    extraBridge.app?.id ??
    extraBridge.appId ??
    expo.ios?.bundleIdentifier ??
    expo.android?.package ??
    (expo.slug ? `expo.${normalizeExpoSlug(expo.slug)}` : undefined);
  const name =
    readMobigentString(extraApp?.name) ??
    extraBridge.app?.name ??
    extraBridge.appName ??
    expo.name ??
    expo.slug;
  const resolvedVersion =
    readMobigentString(extraApp?.version) ??
    extraBridge.app?.version ??
    extraBridge.version ??
    expo.version;

  if (!id || !name) {
    throw new Error(
      "Mobigent Expo app identity is required. Pass app, expo config with name/slug, or extra.mobigentApp."
    );
  }

  return {
    id,
    name,
    version: resolvedVersion
  };
}

export function useMobigentConfirmation() {
  const { confirmationController, confirmationRequest } = useMobigent();

  return {
    request: confirmationRequest,
    approve: () => confirmationController.approve(),
    reject: () => confirmationController.reject()
  };
}

export function useMobigentConnection() {
  const { connected, connectionState, connect, disconnect } = useMobigent();

  return {
    connected,
    connectionState,
    connect,
    disconnect
  };
}

export function useMobigentDiagnostics() {
  return useMobigent().diagnostics;
}

export function useMobigentStatus() {
  const { diagnostics, enabled } = useMobigent();

  return createMobigentStatus(diagnostics, { enabled });
}

export function createMobigentStatus(
  diagnostics: MobigentDiagnostics,
  options: { enabled?: boolean } = {}
): MobigentStatus {
  const enabled = options.enabled ?? true;
  const blockingIssueCount = diagnostics.issues.filter((issue) => issue.severity === "error").length;
  const warningIssueCount = diagnostics.issues.filter((issue) => issue.severity === "warn").length;

  if (!enabled) {
    return {
      level: "disabled",
      label: "Agent bridge disabled",
      connected: false,
      connectionState: diagnostics.connectionState,
      capabilityCount: diagnostics.capabilityCounts.total,
      issueCount: diagnostics.issues.length,
      blockingIssueCount,
      queuedEventCount: diagnostics.queuedEventCount
    };
  }

  const base = {
    connected: diagnostics.connected,
    connectionState: diagnostics.connectionState,
    capabilityCount: diagnostics.capabilityCounts.total,
    issueCount: diagnostics.issues.length,
    blockingIssueCount,
    queuedEventCount: diagnostics.queuedEventCount
  };

  if (diagnostics.connectionState === "connecting" || diagnostics.connectionState === "reconnecting") {
    return {
      ...base,
      level: "connecting",
      label: diagnostics.connectionState === "reconnecting" ? "Agent bridge reconnecting" : "Agent bridge connecting"
    };
  }

  if (blockingIssueCount > 0 || warningIssueCount > 0) {
    return {
      ...base,
      level: "attention",
      label: blockingIssueCount > 0 ? "Agent bridge needs attention" : "Agent bridge has warnings"
    };
  }

  if (diagnostics.connected) {
    return {
      ...base,
      level: "ready",
      label: "Agent bridge ready"
    };
  }

  return {
    ...base,
    level: "offline",
    label: "Agent bridge offline"
  };
}

export function createMobigentPolicy(
  preset: MobigentPolicyPreset,
  options: MobigentPolicyOptions = {}
): MobigentPolicyBundle {
  const base = createMobigentPolicyPreset(preset, options);
  const policy = mergeCapabilityPolicy(base.policy, options.policy);
  const confirmation = mergeConfirmationPolicy(base.confirmation, options.confirmation);

  return removeUndefinedFields({ policy, confirmation });
}

export const createAgentPolicy = createMobigentPolicy;
export const applyAgentPolicy = applyMobigentPolicy;

export function applyMobigentPolicy(
  source: MobigentCapabilitySource,
  bundle: MobigentPolicyBundle
): MobigentCapabilityKit {
  if (!source) {
    return defineMobigentCapabilities();
  }

  return defineMobigentCapabilities({
    actions: (source.actions ?? []).map((action) => ({
      ...action,
      policy: mergeCapabilityPolicy(bundle.policy, action.policy),
      confirmation: mergeConfirmationPolicy(bundle.confirmation, action.confirmation)
    })),
    resources: (source.resources ?? []).map((resource) => ({
      ...resource,
      policy: mergeCapabilityPolicy(bundle.policy, resource.policy)
    })),
    components: (source.components ?? []).map((component) => ({
      ...component,
      policy: mergeCapabilityPolicy(bundle.policy, component.policy)
    }))
  });
}

export function useMobigentConnectionState() {
  return useMobigentConnection().connectionState;
}

export function useMobigentConnected() {
  return useMobigentConnection().connected;
}

export function useMobigentAction(
  action: MobigentActionRegistration,
  options?: MobigentRegistrationOptions
): void;
export function useMobigentAction(
  action: ActionDefinition,
  handler: MobigentActionHandler,
  options?: MobigentRegistrationOptions
): void;
export function useMobigentAction(
  action: ActionDefinition | MobigentActionRegistration,
  handlerOrOptions?: MobigentActionHandler | MobigentRegistrationOptions,
  maybeOptions: MobigentRegistrationOptions = {}
) {
  const { bridge, enabled: providerEnabled } = useMobigent();
  const handler = "handler" in action ? action.handler : handlerOrOptions;
  const options = typeof handlerOrOptions === "function" ? maybeOptions : handlerOrOptions ?? {};
  if (typeof handler !== "function") {
    throw new Error("useMobigentAction requires a handler function.");
  }

  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const enabled = providerEnabled && (options.enabled ?? true);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    bridge.registerAction({
      ...action,
      handler: (input) => handlerRef.current(input)
    });

    return () => {
      bridge.unregisterAction(action.name);
    };
  }, [bridge, enabled, action.name, ...(options.deps ?? [])]);
}

export function MobigentAction({ handler, enabled, deps, ...action }: MobigentActionProps) {
  useMobigentAction(action, handler, { enabled, deps });
  return null;
}

export const AgentAction = MobigentAction;
export const useAgentAction = useMobigentAction;

export function useMobigentResource(
  resource: MobigentResourceRegistration,
  options?: MobigentRegistrationOptions
): void;
export function useMobigentResource(
  resource: ResourceDefinition,
  read: MobigentResourceReader,
  options?: MobigentRegistrationOptions
): void;
export function useMobigentResource(
  resource: ResourceDefinition | MobigentResourceRegistration,
  readOrOptions?: MobigentResourceReader | MobigentRegistrationOptions,
  maybeOptions: MobigentRegistrationOptions = {}
) {
  const { bridge, enabled: providerEnabled } = useMobigent();
  const read = "read" in resource ? resource.read : readOrOptions;
  const options = typeof readOrOptions === "function" ? maybeOptions : readOrOptions ?? {};
  if (typeof read !== "function") {
    throw new Error("useMobigentResource requires a read function.");
  }

  const readRef = useRef(read);
  readRef.current = read;
  const enabled = providerEnabled && (options.enabled ?? true);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    bridge.registerResource({
      ...resource,
      read: () => readRef.current()
    });

    return () => {
      bridge.unregisterResource(resource.name);
    };
  }, [bridge, enabled, resource.name, ...(options.deps ?? [])]);
}

export function MobigentResource({ read, enabled, deps, ...resource }: MobigentResourceProps) {
  useMobigentResource(resource, read, { enabled, deps });
  return null;
}

export const AgentResource = MobigentResource;
export const useAgentResource = useMobigentResource;

export function useMobigentComponent(
  component: MobigentComponentRegistration,
  options?: MobigentRegistrationOptions
): void;
export function useMobigentComponent(
  component: ComponentDefinition,
  focus: MobigentComponentFocusHandler,
  options?: MobigentRegistrationOptions
): void;
export function useMobigentComponent(
  component: ComponentDefinition | MobigentComponentRegistration,
  focusOrOptions?: MobigentComponentFocusHandler | MobigentRegistrationOptions,
  maybeOptions: MobigentRegistrationOptions = {}
) {
  const { bridge, enabled: providerEnabled } = useMobigent();
  const focus = "focus" in component ? component.focus : focusOrOptions;
  const options = typeof focusOrOptions === "function" ? maybeOptions : focusOrOptions ?? {};
  if (typeof focus !== "function") {
    throw new Error("useMobigentComponent requires a focus function.");
  }

  const focusRef = useRef(focus);
  focusRef.current = focus;
  const enabled = providerEnabled && (options.enabled ?? true);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    bridge.registerComponent({
      ...component,
      focus: (props) => focusRef.current(props)
    });

    return () => {
      bridge.unregisterComponent(component.name);
    };
  }, [bridge, enabled, component.name, ...(options.deps ?? [])]);
}

export function MobigentComponent({ focus, enabled, deps, ...component }: MobigentComponentProps) {
  useMobigentComponent(component, focus, { enabled, deps });
  return null;
}

export const AgentComponent = MobigentComponent;
export const useAgentComponent = useMobigentComponent;

export function useMobigentEvent() {
  const { bridge, enabled } = useMobigent();

  return useCallback(
    (name: string, payload: JsonObject = {}) => (enabled ? bridge.emit(name, payload) : false),
    [bridge, enabled]
  );
}

export const useAgentEvent = useMobigentEvent;

export function useMobigentCapabilities({
  actions = [],
  resources = [],
  components = [],
  enabled = true,
  deps = []
}: MobigentCapabilitiesProps = {}) {
  const { bridge, enabled: providerEnabled } = useMobigent();
  const registrationEnabled = providerEnabled && enabled;

  useEffect(() => {
    if (!registrationEnabled) {
      return;
    }

    for (const action of actions) {
      bridge.registerAction(action);
    }
    for (const resource of resources) {
      bridge.registerResource(resource);
    }
    for (const component of components) {
      bridge.registerComponent(component);
    }

    return () => {
      for (const action of actions) {
        bridge.unregisterAction(action.name);
      }
      for (const resource of resources) {
        bridge.unregisterResource(resource.name);
      }
      for (const component of components) {
        bridge.unregisterComponent(component.name);
      }
    };
  }, [bridge, registrationEnabled, ...deps]);
}

export function MobigentCapabilities(props: MobigentCapabilitiesProps) {
  useMobigentCapabilities(props);

  return null;
}

export function useAgent(options: AgentOptions = {}): AgentHookResult {
  useMobigentCapabilities(options);

  return useAgentRuntime();
}

function useAgentRuntime(): AgentHookResult {
  const emit = useAgentEvent();
  const status = useMobigentStatus();
  const connection = useMobigentConnection();

  return {
    emit,
    status,
    connection,
    connected: connection.connected
  };
}

export function defineMobigentAction(action: MobigentActionRegistration) {
  return action;
}

export const defineAgentAction = defineMobigentAction;

export function defineMobigentResource(resource: MobigentResourceRegistration) {
  return resource;
}

export const defineAgentResource = defineMobigentResource;

export function defineMobigentComponent(component: MobigentComponentRegistration) {
  return component;
}

export const defineAgentComponent = defineMobigentComponent;

export function defineMobigentCapabilities({
  actions = [],
  resources = [],
  components = []
}: MobigentCapabilitiesProps = {}): MobigentCapabilityKit {
  const kit = {
    actions,
    resources,
    components,
    useRegister(options: MobigentRegistrationOptions = {}) {
      useMobigentCapabilities({
        actions,
        resources,
        components,
        ...options
      });
    },
    Component(props: MobigentRegistrationOptions = {}) {
      useMobigentCapabilities({
        actions,
        resources,
        components,
        ...props
      });

      return null;
    }
  };

  return kit;
}

export const defineAgentCapabilities = defineMobigentCapabilities;

export function useMobigentCapabilityDefinition(
  factory: MobigentCapabilityDefinitionFactory,
  deps: readonly unknown[] = []
): MobigentCapabilityKit {
  return useMemo(() => composeMobigentCapabilities(...toMobigentCapabilitySources(factory())), deps);
}

export function defineMobigentFeature({
  namespace,
  actions = [],
  resources = [],
  components = []
}: MobigentFeatureOptions): MobigentCapabilityKit {
  assertFeatureNamespace(namespace);

  return defineMobigentCapabilities({
    actions: actions.map((action) => ({
      ...action,
      name: qualifyFeatureCapabilityName(namespace, action.name)
    })),
    resources: resources.map((resource) => ({
      ...resource,
      name: qualifyFeatureCapabilityName(namespace, resource.name)
    })),
    components: components.map((component) => ({
      ...component,
      name: qualifyFeatureCapabilityName(namespace, component.name)
    }))
  });
}

export const defineAgentFeature = defineMobigentFeature;

export function createMobigentFeature(namespace: string): MobigentFeatureFactory {
  assertFeatureNamespace(namespace);

  return {
    namespace,
    action(action: MobigentActionRegistration) {
      return {
        ...action,
        name: qualifyFeatureCapabilityName(namespace, action.name)
      };
    },
    resource(resource: MobigentResourceRegistration) {
      return {
        ...resource,
        name: qualifyFeatureCapabilityName(namespace, resource.name)
      };
    },
    component(component: MobigentComponentRegistration) {
      return {
        ...component,
        name: qualifyFeatureCapabilityName(namespace, component.name)
      };
    },
    capabilities(options: MobigentFeatureCapabilitiesOptions = {}) {
      return defineMobigentFeature({
        namespace,
        ...options
      });
    }
  };
}

export const createAgentFeature = createMobigentFeature;

export function composeMobigentCapabilities(
  ...sources: MobigentCapabilitySource[]
): MobigentCapabilityKit {
  const actions: MobigentActionRegistration[] = [];
  const resources: MobigentResourceRegistration[] = [];
  const components: MobigentComponentRegistration[] = [];
  const names = new Map<string, string>();

  for (const source of sources) {
    if (!source) {
      continue;
    }

    for (const action of source.actions ?? []) {
      assertComposableCapabilityName(names, "action", action.name);
      actions.push(action);
    }
    for (const resource of source.resources ?? []) {
      assertComposableCapabilityName(names, "resource", resource.name);
      resources.push(resource);
    }
    for (const component of source.components ?? []) {
      assertComposableCapabilityName(names, "component", component.name);
      components.push(component);
    }
  }

  return defineMobigentCapabilities({
    actions,
    resources,
    components
  });
}

export const composeAgentCapabilities = composeMobigentCapabilities;

export function diagnoseMobigentCapabilities(
  source: MobigentCapabilitySource | MobigentCapabilitySource[],
  options: MobigentCapabilityDiagnosticsOptions = {}
): MobigentCapabilityDiagnostics {
  const checks: MobigentCapabilityDiagnosticsCheck[] = [];
  let capabilities: MobigentCapabilityKit;

  try {
    capabilities = composeMobigentCapabilities(...toMobigentCapabilitySources(source));
    checks.push({
      name: "composition",
      status: "pass",
      message: "Capability names are unique across actions, resources, and components."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "fail",
      summary: { actions: 0, resources: 0, components: 0, total: 0 },
      checks: [{ name: "composition", status: "fail", message }],
      errors: [message]
    };
  }

  const summary = {
    actions: capabilities.actions.length,
    resources: capabilities.resources.length,
    components: capabilities.components.length,
    total: capabilities.actions.length + capabilities.resources.length + capabilities.components.length
  };

  checks.push(validateCapabilityRuntimeNames(capabilities));
  checks.push(validateCapabilityManifestShape(capabilities, options));
  checks.push(validateCapabilitySafetyPolicies(capabilities));

  const status = summarizeCapabilityDiagnosticsStatus(checks);
  return {
    status,
    summary,
    checks,
    errors: checks.filter((check) => check.status === "fail").map((check) => check.message)
  };
}

export function formatMobigentCapabilityDiagnostics(report: MobigentCapabilityDiagnostics) {
  const lines = [
    `Mobigent capability diagnostics: ${report.status.toUpperCase()}`,
    `Capabilities: ${report.summary.total} total, ${report.summary.actions} actions, ${report.summary.resources} resources, ${report.summary.components} components`
  ];

  for (const check of report.checks) {
    lines.push(`[${check.status.toUpperCase()}] ${check.name}: ${check.message}`);
  }

  return `${lines.join("\n")}\n`;
}

export function createMobigentModule({
  id,
  name,
  version,
  capabilities
}: MobigentModuleOptions): MobigentModule {
  assertMobigentModuleId(id);

  return {
    id,
    name,
    version,
    ...composeMobigentCapabilities(...toMobigentCapabilitySources(capabilities))
  };
}

export function createAgentModule(options: AgentModuleOptions): MobigentModule {
  if (!("namespace" in options)) {
    return createMobigentModule(options);
  }

  const { namespace, id, name, version, actions = [], resources = [], components = [], capabilities } = options;
  const featureCapabilities = defineMobigentFeature({
    namespace,
    actions,
    resources,
    components
  });

  return createMobigentModule({
    id: id ?? `mobigent.${namespace}`,
    name: name ?? `${namespace} feature`,
    version,
    capabilities: [
      featureCapabilities,
      ...toMobigentCapabilitySources(capabilities ?? [])
    ]
  });
}

export const createAgentCapabilities = createMobigentCapabilityRegistry;

export function useMobigentModuleDefinition(
  factory: MobigentModuleDefinitionFactory,
  deps: readonly unknown[] = []
): MobigentModule {
  return useMemo(factory, deps);
}

export function useAgentScreen(options: AgentScreenOptions): AgentScreenHookResult;
export function useAgentScreen(factory: AgentScreenFactory, deps?: readonly unknown[]): AgentScreenHookResult;
export function useAgentScreen(
  optionsOrFactory: AgentScreenOptions | AgentScreenFactory,
  deps: readonly unknown[] = []
): AgentScreenHookResult {
  const module = useMemo(
    () => {
      const options = typeof optionsOrFactory === "function" ? optionsOrFactory() : optionsOrFactory;
      return isMobigentModule(options) ? options : createAgentModule(options);
    },
    typeof optionsOrFactory === "function" ? deps : [...(optionsOrFactory.deps ?? []), ...(deps ?? [])]
  );
  const enabled = typeof optionsOrFactory === "function" ? true : optionsOrFactory.enabled;

  useMobigentModules(module, {
    enabled,
    deps: [module, module.id, ...(typeof optionsOrFactory === "function" ? deps : optionsOrFactory.deps ?? [])]
  });

  return {
    ...useAgentRuntime(),
    module
  };
}

export const useAgentModule = useMobigentModules;

export function useMobigentModules(
  modules: MobigentModule | MobigentModule[],
  options: MobigentModuleRegistrationOptions = {}
) {
  const kit = composeMobigentCapabilities(...toMobigentModuleArray(modules));

  useMobigentCapabilities({
    actions: kit.actions,
    resources: kit.resources,
    components: kit.components,
    enabled: options.enabled,
    deps: [...toMobigentModuleDeps(modules), ...(options.deps ?? [])]
  });
}

export function MobigentModules({ modules, enabled, deps }: MobigentModulesProps) {
  useMobigentModules(modules, { enabled, deps });
  return null;
}

export const AgentModules = MobigentModules;

export function useMobigentSurface({
  capabilities,
  modules,
  enabled,
  deps
}: Omit<MobigentSurfaceProps, "children"> = {}) {
  const sources = [
    ...toMobigentCapabilitySources(capabilities ?? []),
    ...toMobigentCapabilitySources(modules ?? [])
  ];

  const kit = composeMobigentCapabilities(...sources);

  useMobigentCapabilities({
    actions: kit.actions,
    resources: kit.resources,
    components: kit.components,
    enabled,
    deps: [...sources.filter(Boolean), ...(deps ?? [])]
  });
}

export function MobigentSurface({ children, capabilities, modules, enabled, deps }: MobigentSurfaceProps) {
  useMobigentSurface({ capabilities, modules, enabled, deps });
  return <>{children}</>;
}

export const AgentSurface = MobigentSurface;

export function useMobigentModule(
  registry: MobigentCapabilityRegistry,
  module: MobigentModule,
  options: MobigentModuleRegistrationOptions = {}
) {
  const enabled = options.enabled ?? true;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    registry.install(module);

    return () => {
      registry.remove(module);
    };
  }, [registry, module, enabled, module.id, ...(options.deps ?? [])]);
}

export function MobigentModuleMount({ registry, module, enabled, deps }: MobigentModuleMountProps) {
  useMobigentModule(registry, module, { enabled, deps });
  return null;
}

export function createMobigentCapabilityRegistry(
  ...initialSources: MobigentCapabilitySource[]
): MobigentCapabilityRegistry {
  const sources: MobigentCapabilitySource[] = [];
  const listeners = new Set<() => void>();

  const registry = {
    actions: [] as MobigentActionRegistration[],
    resources: [] as MobigentResourceRegistration[],
    components: [] as MobigentComponentRegistration[],
    add(...nextSources: MobigentCapabilitySource[]) {
      sources.push(...nextSources);
      refreshMobigentCapabilityRegistry(registry, sources);
      notifyMobigentCapabilityRegistry(listeners);
      return registry;
    },
    install(...modules: MobigentModule[]) {
      const nextModules = modules.filter((module) => !sources.includes(module));
      if (nextModules.length === 0) {
        return registry;
      }

      sources.push(...nextModules);
      refreshMobigentCapabilityRegistry(registry, sources);
      notifyMobigentCapabilityRegistry(listeners);
      return registry;
    },
    remove(...removedSources: MobigentCapabilitySource[]) {
      for (const removedSource of removedSources) {
        const index = sources.indexOf(removedSource);
        if (index >= 0) {
          sources.splice(index, 1);
        }
      }
      refreshMobigentCapabilityRegistry(registry, sources);
      notifyMobigentCapabilityRegistry(listeners);
      return registry;
    },
    clear() {
      sources.length = 0;
      refreshMobigentCapabilityRegistry(registry, sources);
      notifyMobigentCapabilityRegistry(listeners);
      return registry;
    },
    getCapabilities() {
      return defineMobigentCapabilities({
        actions: registry.actions,
        resources: registry.resources,
        components: registry.components
      });
    },
    getModules() {
      return sources.flatMap((source) => getMobigentModuleMetadata(source));
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    useRegister(options: MobigentRegistrationOptions = {}) {
      useMobigentCapabilityRegistryVersion(registry);
      useMobigentCapabilities({
        actions: registry.actions,
        resources: registry.resources,
        components: registry.components,
        ...options
      });
    },
    Component(props: MobigentRegistrationOptions = {}) {
      useMobigentCapabilityRegistryVersion(registry);
      useMobigentCapabilities({
        actions: registry.actions,
        resources: registry.resources,
        components: registry.components,
        ...props
      });

      return null;
    }
  };

  registry.add(...initialSources);

  return registry;
}

function toMobigentCapabilitySources(
  source: MobigentCapabilitySource | MobigentCapabilitySource[]
): MobigentCapabilitySource[] {
  return Array.isArray(source) ? source : [source];
}

function toMobigentModuleArray(modules: MobigentModule | MobigentModule[]) {
  return Array.isArray(modules) ? modules : [modules];
}

function toMobigentModuleDeps(modules: MobigentModule | MobigentModule[]) {
  return toMobigentModuleArray(modules).flatMap((module) => [module, module.id]);
}

function getMobigentModuleMetadata(source: MobigentCapabilitySource): MobigentModuleMetadata[] {
  if (!isMobigentModule(source)) {
    return [];
  }

  return [
    {
      id: source.id,
      name: source.name,
      version: source.version,
      actions: source.actions.map((action) => action.name),
      resources: source.resources.map((resource) => resource.name),
      components: source.components.map((component) => component.name)
    }
  ];
}

function isMobigentModule(source: MobigentCapabilitySource): source is MobigentModule {
  return Boolean(source && typeof source === "object" && "id" in source && "Component" in source && "useRegister" in source);
}

function getDefaultMobigentEnv(): MobigentEnvironmentVariables {
  return typeof process !== "undefined" && process.env ? process.env : {};
}

function parseMobigentEnvironmentMode(value: string | undefined): MobigentEnvironmentMode | undefined {
  if (value === "local" || value === "device" || value === "hosted" || value === "disabled") {
    return value;
  }

  return undefined;
}

function parseMobigentGatewayPlatform(value: string | undefined): MobigentGatewayPlatform | undefined {
  if (value === "ios" || value === "android" || value === "web") {
    return value;
  }

  return undefined;
}

function parseMobigentBoolean(value: string | undefined): boolean | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return undefined;
}

function parseMobigentPort(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : undefined;
}

function isMobigentExpoExtraApp(
  value: unknown
): value is { id?: unknown; name?: unknown; version?: unknown } {
  return Boolean(value && typeof value === "object");
}

function isMobigentExpoExtraObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function readMobigentExpoExtraConfig(expo: MobigentExpoConfig): MobigentExpoExtraConfig {
  const extra = expo.extra ?? {};
  const raw = isMobigentExpoExtraObject(extra.mobigent)
    ? extra.mobigent
    : isMobigentExpoExtraObject(extra.intentBridge)
      ? extra.intentBridge
      : {};
  const rawApp = isMobigentExpoExtraObject(raw.app) ? raw.app : undefined;
  const appId = readMobigentString(rawApp?.id);
  const appName = readMobigentString(rawApp?.name);
  const app = appId && appName
    ? {
        id: appId,
        name: appName,
        version: readMobigentString(rawApp?.version)
      }
    : undefined;

  return removeUndefinedFields({
    mode: parseMobigentEnvironmentMode(readMobigentString(raw.mode)),
    platform: parseMobigentGatewayPlatform(readMobigentString(raw.platform)),
    deviceHost: readMobigentString(raw.deviceHost),
    host: readMobigentString(raw.host),
    port: parseMobigentPort(readMobigentString(raw.port)) ?? (typeof raw.port === "number" ? raw.port : undefined),
    secure: typeof raw.secure === "boolean" ? raw.secure : parseMobigentBoolean(readMobigentString(raw.secure)),
    path: readMobigentString(raw.path),
    gatewayUrl: readMobigentString(raw.gatewayUrl),
    authToken: readMobigentString(raw.authToken),
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : parseMobigentBoolean(readMobigentString(raw.enabled)),
    app,
    appId: readMobigentString(raw.appId),
    appName: readMobigentString(raw.appName),
    version: readMobigentString(raw.version)
  });
}

function readMobigentString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function normalizeExpoSlug(slug: string) {
  return slug.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function useMobigentCapabilityRegistryVersion(registry: Pick<MobigentCapabilityRegistry, "subscribe">) {
  const [, setVersion] = useState(0);

  useEffect(() => {
    return registry.subscribe(() => setVersion((version) => version + 1));
  }, [registry]);
}

function refreshMobigentCapabilityRegistry(
  registry: Pick<MobigentCapabilityRegistry, "actions" | "resources" | "components">,
  sources: MobigentCapabilitySource[]
) {
  const capabilities = composeMobigentCapabilities(...sources);
  registry.actions = capabilities.actions;
  registry.resources = capabilities.resources;
  registry.components = capabilities.components;
}

function notifyMobigentCapabilityRegistry(listeners: Set<() => void>) {
  for (const listener of listeners) {
    listener();
  }
}

function validateCapabilityRuntimeNames(
  capabilities: MobigentCapabilityKit
): MobigentCapabilityDiagnosticsCheck {
  const invalid = [
    ...capabilities.actions.map((action) => ({ kind: "action", name: action.name })),
    ...capabilities.resources.map((resource) => ({ kind: "resource", name: resource.name })),
    ...capabilities.components.map((component) => ({ kind: "component", name: component.name }))
  ].filter((capability) => !isMobigentRuntimeCapabilityName(capability.name));

  if (invalid.length > 0) {
    return {
      name: "runtime-names",
      status: "fail",
      message: "Capability names must use letters, numbers, and underscores before they are registered with the bridge.",
      details: invalid
    };
  }

  return {
    name: "runtime-names",
    status: "pass",
    message: "Capability names are valid for React Native runtime registration."
  };
}

function validateCapabilityManifestShape(
  capabilities: MobigentCapabilityKit,
  options: MobigentCapabilityDiagnosticsOptions
): MobigentCapabilityDiagnosticsCheck {
  const app = options.app ?? { id: "com.mobigent.diagnostics", name: "Mobigent Diagnostics" };
  const validation = validateCapabilityManifest({
    appId: app.id,
    appName: app.name,
    sdk: "react-native",
    version: app.version ?? options.version ?? "0.1.10",
    actions: capabilities.actions.map(stripCapabilityRuntimeHandlers),
    resources: capabilities.resources.map(stripCapabilityRuntimeHandlers),
    components: capabilities.components.map(stripCapabilityRuntimeHandlers)
  });

  if (!validation.ok) {
    return {
      name: "manifest-shape",
      status: "fail",
      message: "Capability definitions do not produce a valid Mobigent manifest.",
      details: validation.errors
    };
  }

  return {
    name: "manifest-shape",
    status: "pass",
    message: "Capability definitions produce a valid Mobigent manifest."
  };
}

function validateCapabilitySafetyPolicies(
  capabilities: MobigentCapabilityKit
): MobigentCapabilityDiagnosticsCheck {
  const warnings: string[] = [];

  for (const action of capabilities.actions) {
    if (action.policy?.requiresUser && !action.confirmation?.required) {
      warnings.push(`${action.name} requires a user but does not require confirmation.`);
    }
    if ((action.policy?.sensitiveData?.length ?? 0) > 0 && (action.policy?.allowedAgents?.length ?? 0) === 0) {
      warnings.push(`${action.name} handles sensitive data without an allowedAgents policy.`);
    }
    if (action.confirmation?.risk === "high" && !action.confirmation.required) {
      warnings.push(`${action.name} is high risk but confirmation.required is not true.`);
    }
  }

  const readSurfaces = [...capabilities.resources, ...capabilities.components];
  for (const capability of readSurfaces) {
    if ((capability.policy?.sensitiveData?.length ?? 0) > 0 && (capability.policy?.allowedAgents?.length ?? 0) === 0) {
      warnings.push(`${capability.name} exposes sensitive data without an allowedAgents policy.`);
    }
  }

  if (warnings.length > 0) {
    return {
      name: "safety-policy",
      status: "warn",
      message: "Review capability safety policies before exposing these tools to agents.",
      details: warnings
    };
  }

  return {
    name: "safety-policy",
    status: "pass",
    message: "Capability safety policies do not have obvious gaps."
  };
}

function summarizeCapabilityDiagnosticsStatus(
  checks: MobigentCapabilityDiagnosticsCheck[]
): MobigentCapabilityDiagnosticsStatus {
  if (checks.some((check) => check.status === "fail")) {
    return "fail";
  }
  if (checks.some((check) => check.status === "warn")) {
    return "warn";
  }
  return "pass";
}

function stripCapabilityRuntimeHandlers<T extends Record<string, unknown>>(capability: T) {
  const { handler: _handler, read: _read, focus: _focus, ...definition } = capability;
  return definition;
}

function isMobigentRuntimeCapabilityName(name: string) {
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
}

function createMobigentPolicyPreset(
  preset: MobigentPolicyPreset,
  options: MobigentPolicyOptions
): MobigentPolicyBundle {
  const sharedPolicy = {
    allowedAgents: options.allowedAgents,
    rateLimitPerMinute: options.rateLimitPerMinute,
    sensitiveData: options.sensitiveData
  };

  if (preset === "read-only") {
    return {
      policy: {
        ...sharedPolicy,
        readOnly: true
      }
    };
  }

  if (preset === "foreground") {
    return {
      policy: {
        ...sharedPolicy,
        foregroundOnly: true
      }
    };
  }

  if (preset === "user-required") {
    return {
      policy: {
        ...sharedPolicy,
        foregroundOnly: true,
        requiresUser: true
      }
    };
  }

  if (preset === "confirmed") {
    return {
      policy: {
        ...sharedPolicy,
        foregroundOnly: true,
        requiresUser: true
      },
      confirmation: {
        required: true,
        title: options.title,
        message: options.message,
        risk: options.risk ?? "medium"
      }
    };
  }

  return {
    policy: {
      ...sharedPolicy,
      foregroundOnly: true,
      requiresUser: true
    },
    confirmation: {
      required: true,
      title: options.title,
      message: options.message,
      risk: options.risk ?? "high"
    }
  };
}

function mergeCapabilityPolicy(
  base: CapabilityPolicy | undefined,
  override: CapabilityPolicy | undefined
): CapabilityPolicy | undefined {
  if (!base) {
    return override;
  }
  if (!override) {
    return removeUndefinedFields(base);
  }
  return removeUndefinedFields({
    ...base,
    ...override
  });
}

function mergeConfirmationPolicy(
  base: ConfirmationPolicy | undefined,
  override: ConfirmationPolicy | undefined
): ConfirmationPolicy | undefined {
  if (!base) {
    return override;
  }
  if (!override) {
    return removeUndefinedFields(base);
  }
  return removeUndefinedFields({
    ...base,
    ...override
  });
}

function removeUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter((entry) => entry[1] !== undefined)) as T;
}

function qualifyFeatureCapabilityName(namespace: string, name: string) {
  assertFeatureCapabilityName(name);

  if (name.startsWith(`${namespace}_`)) {
    return name;
  }

  return `${namespace}_${name}`;
}

function assertFeatureNamespace(namespace: string) {
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(namespace)) {
    throw new Error(
      `Invalid Mobigent feature namespace "${namespace}". Use letters, numbers, and underscores, starting with a letter.`
    );
  }
}

function assertFeatureCapabilityName(name: string) {
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(
      `Invalid Mobigent feature capability name "${name}". Use unqualified local names with letters, numbers, and underscores, starting with a letter.`
    );
  }
}

function assertMobigentModuleId(id: string) {
  if (!/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(id)) {
    throw new Error(
      `Invalid Mobigent module id "${id}". Use letters, numbers, dots, hyphens, and underscores, starting with a letter.`
    );
  }
}

function assertComposableCapabilityName(names: Map<string, string>, kind: string, name: string) {
  const existingKind = names.get(name);
  if (existingKind) {
    throw new Error(
      `Duplicate capability name "${name}" while composing Mobigent capabilities. The name is already used by a ${existingKind}; rename this ${kind} or compose only one owner for that capability.`
    );
  }
  names.set(name, kind);
}

export type { AgentBridgeCompat };
