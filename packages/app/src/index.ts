import type { ComponentType } from "react";
import {
  connectMobigent,
  defineMobigent,
  emitMobigentEvent,
  setupMobigent,
  withMobigent as withMobigentRoot,
  type AgentAppRootProps,
  type MobigentSimpleAppInput,
  type MobigentSimpleAppOptions,
  type MobigentSimpleAppConfig,
  type MobigentSimpleBackendConnection,
  type MobigentSimpleConnection,
  type MobigentSimpleConnectionSettings,
  type MobigentSimpleFeature,
  type MobigentSimpleFunctionMap,
  type MobigentWithAppOptions
} from "@mobigent/react-native/app";
export {
  action,
  emitMobigentEvent,
  read,
  screen,
  write,
  type MobigentSimpleActionOptions,
  type MobigentSimpleAppConfig,
  type MobigentSimpleCapabilities,
  type MobigentSimpleCapabilityDefinition,
  type MobigentSimpleCapabilityMap,
  type MobigentSimpleComponentOptions,
  type MobigentSimpleFeature,
  type MobigentSimpleFeatureMap,
  type MobigentSimpleField,
  type MobigentSimpleFunction,
  type MobigentSimpleFunctionMap,
  type MobigentSimpleObjectSchema,
  type MobigentSimpleResourceOptions,
  type MobigentSimpleSchema
} from "@mobigent/react-native/app";
export {
  arraySchema,
  booleanSchema,
  enumSchema,
  fromJsonSchema,
  fromTypeBox,
  fromZod,
  integerSchema,
  literalSchema,
  nullSchema,
  nullableSchema,
  numberSchema,
  objectSchema,
  schema,
  schemaAdapters,
  stringSchema,
  type MobigentSchemaAdapterOptions
} from "@mobigent/react-native";
export {
  MobigentConfirmationModal,
  MobigentDiagnosticsPanel,
  MobigentStatusBadge,
  type AgentAppRootProps,
  type MobigentAppRootProps,
  type MobigentConfirmationComponentProps,
  type MobigentConfirmationModalProps,
  type MobigentDiagnosticsPanelProps,
  type MobigentStatusBadgeProps
} from "@mobigent/react-native/ui";
export {
  useMobigentConfirmation,
  useMobigentConnected,
  useMobigentConnectionState,
  useMobigentDiagnostics,
  useMobigentStatus
} from "@mobigent/react-native";
export type {
  ConfirmationRequest,
  MobigentConnectionState,
  MobigentDiagnostics,
  MobigentEventQueueOptions,
  MobigentHeartbeatOptions,
  MobigentManifestSigner,
  MobigentReconnectOptions
} from "@mobigent/react-native";

export type MobigentAppPackageOptions = MobigentSimpleAppInput | MobigentWithAppOptions;
export type MobigentAppPackageIdentityOptions = Omit<MobigentSimpleAppOptions, "appId" | "functions"> & {
  appName?: string;
  backend?: MobigentAppBackendSource;
};
export type MobigentAppPackageInput = MobigentAppPackageOptions | MobigentSimpleFunctionMap | string;
type MobigentAppPairingSource = MobigentSimpleAppConfig | (() => MobigentSimpleAppConfig);
type MobigentBackendConnectionTarget = {
  pairing?: MobigentAppPairingSource;
  connection?: MobigentSimpleConnectionSettings;
  backendUrl?: string;
  appConnectionUrl?: string;
};
type MobigentLegacyBackendConnectionTarget = MobigentBackendConnectionTarget & {
  connection?: MobigentSimpleConnectionSettings;
  urls?: {
    websocket?: string;
  };
  defaultApp?: {
    appId?: string;
    appName?: string;
    connection?: MobigentSimpleBackendConnection;
    connectionUrl?: string;
    backendUrl?: string;
    gatewayUrl?: string;
    version?: string;
    authToken?: string;
  };
};
type MobigentAppBackendSource = MobigentAppPairingSource | MobigentBackendConnectionTarget;
type MobigentAppConnectSettings = MobigentSimpleConnectionSettings | MobigentBackendConnectionTarget;

export type MobigentAppPackage = ReturnType<typeof setupMobigent> & {
  with<P extends object>(App: ComponentType<P>, rootProps?: Omit<AgentAppRootProps, "children">): ComponentType<P>;
  connect(settings?: MobigentAppConnectSettings): Promise<MobigentSimpleConnection>;
  emit: typeof emitMobigentEvent;
};

export type AppFunctions = MobigentSimpleFunctionMap;
export type AppFunctionMap = MobigentSimpleFunctionMap;
export type AppOptions = MobigentAppPackageIdentityOptions;
export type AppConnection = MobigentSimpleConnection;
export type MobigentApp = MobigentAppPackage;

export function createApp(
  appId: string,
  functions: MobigentSimpleFunctionMap,
  options?: MobigentAppPackageIdentityOptions
): MobigentAppPackage;
export function createApp(functions: MobigentSimpleFunctionMap, options?: MobigentAppPackageIdentityOptions): MobigentAppPackage;
export function createApp(input: MobigentAppPackageOptions): MobigentAppPackage;
export function createApp(
  input: MobigentAppPackageInput,
  functions?: MobigentSimpleFunctionMap | MobigentAppPackageIdentityOptions,
  options: MobigentAppPackageIdentityOptions = {}
): MobigentAppPackage {
  const appInput = normalizeCreateAppInput(input, functions, options);
  const appRoot = setupMobigent(appInput as MobigentSimpleAppInput);
  const features = resolvePackageFeatures(appInput);

  return {
    ...appRoot,
    with<P extends object>(App: ComponentType<P>, rootProps?: Omit<AgentAppRootProps, "children">) {
      return withMobigentRoot(App, appInput as MobigentSimpleAppInput, rootProps);
    },
    connect(settings: MobigentAppConnectSettings = {}) {
      return connectMobigent(features, {
        ...resolvePackageConnectSettings(appInput, settings)
      });
    },
    emit: emitMobigentEvent
  };
}

export const app = createApp;
export const emit = emitMobigentEvent;

export function withMobigent<P extends object>(
  App: ComponentType<P>,
  appId: string,
  functions: MobigentSimpleFunctionMap,
  options?: MobigentAppPackageIdentityOptions
): ComponentType<P>;
export function withMobigent<P extends object>(
  App: ComponentType<P>,
  functions: MobigentSimpleFunctionMap,
  options?: MobigentAppPackageIdentityOptions
): ComponentType<P>;
export function withMobigent<P extends object>(
  App: ComponentType<P>,
  input: MobigentAppPackageOptions,
  rootProps?: Omit<AgentAppRootProps, "children">
): ComponentType<P>;
export function withMobigent<P extends object>(
  App: ComponentType<P>,
  input: MobigentAppPackageInput,
  functionsOrOptions?: MobigentSimpleFunctionMap | MobigentAppPackageIdentityOptions | Omit<AgentAppRootProps, "children">,
  options: MobigentAppPackageIdentityOptions = {}
): ComponentType<P> {
  if (typeof input === "string") {
    return createApp(input, functionsOrOptions as MobigentSimpleFunctionMap, options).with(App);
  }

  if (isFunctionMapInput(input)) {
    return createApp(input, functionsOrOptions as MobigentAppPackageIdentityOptions | undefined).with(App);
  }

  return withMobigentRoot(App, input as MobigentSimpleAppInput, functionsOrOptions as Omit<AgentAppRootProps, "children"> | undefined);
}

function normalizeCreateAppInput(
  input: MobigentAppPackageInput,
  functionsOrOptions: MobigentSimpleFunctionMap | MobigentAppPackageIdentityOptions | undefined,
  options: MobigentAppPackageIdentityOptions
): MobigentAppPackageOptions {
  if (typeof input !== "string") {
    if (isFunctionMapInput(input)) {
      return normalizeBackendBackedAppInput({
        ...(functionsOrOptions as MobigentAppPackageIdentityOptions | undefined),
        functions: input
      });
    }

    return normalizeBackendBackedAppInput(input);
  }

  if (!functionsOrOptions || isIdentityOptions(functionsOrOptions)) {
    throw new Error("createApp(appId, functions) requires an app functions object.");
  }

  return normalizeBackendBackedAppInput({
    ...options,
    appId: input,
    functions: functionsOrOptions
  });
}

function normalizeBackendBackedAppInput(input: MobigentAppPackageOptions): MobigentAppPackageOptions {
  if (isFeatureInput(input)) {
    return input;
  }

  const options = input as MobigentWithAppOptions & { functions?: MobigentSimpleFunctionMap; backend?: MobigentAppBackendSource };
  const backendSettings = resolveAppBackendSettings(options.backend);

  return omitUndefinedValues({
    ...backendSettings,
    ...options,
    appId: options.appId ?? backendSettings.appId,
    appName: options.appName ?? backendSettings.appName,
    connection: options.connection ?? backendSettings.connection,
    backendUrl: options.backendUrl ?? backendSettings.backendUrl,
    connectionUrl: options.connectionUrl ?? backendSettings.connectionUrl,
    gatewayUrl: options.gatewayUrl ?? backendSettings.gatewayUrl,
    version: options.version ?? backendSettings.version,
    authToken: options.authToken ?? backendSettings.authToken
  });
}

function isFunctionMapInput(value: MobigentAppPackageInput): value is MobigentSimpleFunctionMap {
  if (!value || typeof value !== "object" || Array.isArray(value) || isFeatureInput(value as MobigentAppPackageOptions)) {
    return false;
  }

  return Object.values(value).every(isCapabilityMap);
}

function isIdentityOptions(value: MobigentSimpleFunctionMap | MobigentAppPackageIdentityOptions): value is MobigentAppPackageIdentityOptions {
  return !isFunctionMapInput(value);
}

function isCapabilityMap(value: unknown): value is MobigentSimpleFunctionMap[string] {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.values(value).every(isSimpleFunction)
  );
}

function isSimpleFunction(value: unknown): value is MobigentSimpleFunctionMap[string][string] {
  return (
    typeof value === "function" ||
    Boolean(
      value &&
        typeof value === "object" &&
        "kind" in value &&
        (value.kind === "action" || value.kind === "resource" || value.kind === "component")
    )
  );
}

function resolvePackageFeatures(input: MobigentAppPackageOptions): MobigentSimpleFeature | MobigentSimpleFeature[] {
  if (isFeatureInput(input)) {
    return input;
  }

  const options = input as MobigentSimpleAppOptions & { functions?: MobigentSimpleFunctionMap };
  const features = [...toArray(options.features), ...resolveFunctionFeatures(options.functions)];
  if (features.length === 0) {
    throw new Error("createApp(...).connect() requires at least one Mobigent feature.");
  }

  return features;
}

function resolvePackageConnectionSettings(input: MobigentAppPackageOptions): MobigentSimpleConnectionSettings {
  if (isFeatureInput(input)) {
    return {};
  }

  const {
    features: _features,
    functions: _functions,
    capabilities: _capabilities,
    modules: _modules,
    rootProps: _rootProps,
    backend,
    ...settings
  } = input as MobigentWithAppOptions & { functions?: MobigentSimpleFunctionMap; backend?: MobigentAppBackendSource };

  return {
    ...resolveAppBackendSettings(backend),
    ...settings
  };
}

function resolvePackageConnectSettings(
  input: MobigentAppPackageOptions,
  settings: MobigentAppConnectSettings
): MobigentSimpleConnectionSettings {
  const appSettings = resolvePackageConnectionSettings(input);
  const connectionSettings = isBackendConnectionTarget(settings)
    ? resolveBackendConnectionSettings(settings)
    : settings;

  return isBackendConnectionTarget(settings)
    ? {
        ...connectionSettings,
        ...appSettings
      } as MobigentSimpleConnectionSettings
    : {
        ...appSettings,
        ...connectionSettings
      } as MobigentSimpleConnectionSettings;
}

function resolveBackendConnectionSettings(target: MobigentLegacyBackendConnectionTarget): MobigentSimpleConnectionSettings {
  const pairing = resolveAppPairing(target.pairing);
  const config = pairing ?? target.connection ?? target.defaultApp ?? {};

  return {
    appId: config.appId,
    appName: config.appName,
    pairing,
    connection: config.connection,
    backendUrl: config.backendUrl ?? target.backendUrl,
    connectionUrl:
      config.connectionUrl ??
      config.backendUrl ??
      config.gatewayUrl ??
      target.backendUrl ??
      target.appConnectionUrl ??
      target.urls?.websocket,
    version: config.version,
    authToken: config.authToken
  };
}

function resolveAppBackendSettings(backend: MobigentAppBackendSource | undefined): MobigentSimpleConnectionSettings {
  if (!backend) {
    return {};
  }

  if (isBackendConnectionTarget(backend)) {
    return resolveBackendConnectionSettings(backend);
  }

  return {
    pairing: resolveAppPairing(backend as MobigentAppPairingSource)
  };
}

function isBackendConnectionTarget(value: unknown): value is MobigentLegacyBackendConnectionTarget {
  return Boolean(
    value &&
      typeof value === "object" &&
      (("pairing" in value && typeof value.pairing === "object") ||
        ("pairing" in value && typeof value.pairing === "function") ||
        ("connection" in value && typeof value.connection === "object") ||
        ("backendUrl" in value && typeof value.backendUrl === "string") ||
        ("appConnectionUrl" in value && typeof value.appConnectionUrl === "string") ||
        ("urls" in value && typeof value.urls === "object") ||
        ("defaultApp" in value && typeof value.defaultApp === "object"))
  );
}

function resolveAppPairing(pairing: MobigentAppPairingSource | undefined): MobigentSimpleAppConfig | undefined {
  return typeof pairing === "function" ? pairing() : pairing;
}

function isFeatureInput(value: MobigentAppPackageOptions): value is MobigentSimpleFeature | MobigentSimpleFeature[] {
  if (Array.isArray(value)) {
    return value.every(isFeature);
  }

  return isFeature(value);
}

function isFeature(value: MobigentAppPackageOptions | MobigentSimpleFeature): value is MobigentSimpleFeature {
  return Boolean(
    value &&
      typeof value === "object" &&
      "namespace" in value &&
      "actions" in value &&
      "resources" in value &&
      "components" in value
  );
}

function resolveFunctionFeatures(functions: MobigentSimpleFunctionMap | undefined): MobigentSimpleFeature[] {
  return functions ? defineMobigent(functions) : [];
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function omitUndefinedValues<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)) as T;
}
