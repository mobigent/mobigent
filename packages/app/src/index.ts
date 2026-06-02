import type { ComponentType } from "react";
import {
  connectMobigent,
  defineMobigent,
  emitMobigentEvent,
  setupMobigent,
  withMobigent,
  type AgentAppRootProps,
  type MobigentSimpleAppInput,
  type MobigentSimpleAppOptions,
  type MobigentSimpleBackendConnection,
  type MobigentSimpleConnection,
  type MobigentSimpleConnectionSettings,
  type MobigentSimpleFeature,
  type MobigentSimpleFunctionMap,
  type MobigentWithAppOptions
} from "@mobigent/react-native/app";
export {
  action,
  connectMobigent,
  createFeature,
  defineFeature,
  defineFunctions,
  defineMobigent,
  defineMobigentConfig,
  emitMobigentEvent,
  feature,
  functions,
  read,
  resolveMobigentConnectionUrl,
  screen,
  simpleSchema,
  toSchema,
  write,
  type MobigentSimpleActionOptions,
  type MobigentSimpleAppConfig,
  type MobigentSimpleCapabilities,
  type MobigentSimpleBackendConnection,
  type MobigentSimpleCapabilityDefinition,
  type MobigentSimpleCapabilityMap,
  type MobigentSimpleComponentOptions,
  type MobigentSimpleConnection,
  type MobigentSimpleConnectionOptions,
  type MobigentSimpleConnectionSettings,
  type MobigentSimpleFeature,
  type MobigentSimpleFeatureMap,
  type MobigentSimpleField,
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
  mobigent,
  setupMobigent,
  withMobigent,
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
export type MobigentBackendConnectionTarget = {
  urls?: {
    websocket?: string;
  };
  defaultApp?: {
    appId?: string;
    appName?: string;
    connection?: MobigentSimpleBackendConnection;
    connectionUrl?: string;
    gatewayUrl?: string;
    version?: string;
    authToken?: string;
  };
};
export type MobigentAppConnectSettings = MobigentSimpleConnectionSettings | MobigentBackendConnectionTarget;

export type MobigentAppPackage = ReturnType<typeof setupMobigent> & {
  with<P extends object>(App: ComponentType<P>, rootProps?: Omit<AgentAppRootProps, "children">): ComponentType<P>;
  connect(settings?: MobigentAppConnectSettings): Promise<MobigentSimpleConnection>;
  emit: typeof emitMobigentEvent;
};

export function createApp(input: MobigentAppPackageOptions): MobigentAppPackage {
  const appRoot = setupMobigent(input as MobigentSimpleAppInput);
  const features = resolvePackageFeatures(input);

  return {
    ...appRoot,
    with<P extends object>(App: ComponentType<P>, rootProps?: Omit<AgentAppRootProps, "children">) {
      return withMobigent(App, input as MobigentSimpleAppInput, rootProps);
    },
    connect(settings: MobigentAppConnectSettings = {}) {
      return connectMobigent(features, {
        ...resolvePackageConnectSettings(input, settings)
      });
    },
    emit: emitMobigentEvent
  };
}

export const app = createApp;
export const connect = connectMobigent;
export const emit = emitMobigentEvent;
export const setup = setupMobigent;

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
    ...settings
  } = input as MobigentWithAppOptions & { functions?: MobigentSimpleFunctionMap };

  return settings;
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
      }
    : {
        ...appSettings,
        ...connectionSettings
      };
}

function resolveBackendConnectionSettings(target: MobigentBackendConnectionTarget): MobigentSimpleConnectionSettings {
  const config = target.defaultApp ?? {};

  return {
    appId: config.appId,
    appName: config.appName,
    connection: config.connection,
    connectionUrl: config.connectionUrl ?? config.gatewayUrl ?? target.urls?.websocket,
    version: config.version,
    authToken: config.authToken
  };
}

function isBackendConnectionTarget(value: MobigentAppConnectSettings): value is MobigentBackendConnectionTarget {
  return Boolean(
    value &&
      typeof value === "object" &&
      (("urls" in value && typeof value.urls === "object") ||
        ("defaultApp" in value && typeof value.defaultApp === "object"))
  );
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
