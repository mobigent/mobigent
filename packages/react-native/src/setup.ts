import { createElement, type ComponentType } from "react";
import { createAgentApp, type AgentAppFactoryOptions, type AgentAppRootProps } from "./ui.js";
import {
  connectMobigent,
  defineMobigent,
  emitMobigentEvent,
  resolveMobigentConnectionUrl,
  type MobigentSimpleAppConfig,
  type MobigentSimpleBackendConnection,
  type MobigentSimpleConnection,
  type MobigentSimpleConnectionOptions,
  type MobigentSimpleConnectionSettings,
  type MobigentSimpleFeature,
  type MobigentSimpleFunctionMap
} from "./simple.js";

export type MobigentSimpleAppOptions = Omit<AgentAppFactoryOptions, "capabilities" | "modules"> & {
  config?: MobigentSimpleAppConfig;
  connection?: MobigentSimpleBackendConnection;
  connectionUrl?: string;
  confirm?: MobigentSimpleConnectionOptions["confirm"];
  features?: MobigentSimpleFeature | MobigentSimpleFeature[];
  functions?: MobigentSimpleFunctionMap;
  capabilities?: AgentAppFactoryOptions["capabilities"];
  modules?: AgentAppFactoryOptions["modules"];
};

export type MobigentSimpleAppInput = MobigentSimpleAppOptions | MobigentSimpleFeature | MobigentSimpleFeature[];

export type MobigentWithAppOptions = MobigentSimpleAppOptions & {
  rootProps?: Omit<AgentAppRootProps, "children">;
};

export type MobigentCreatedApp = ReturnType<typeof createAgentApp> & {
  with<P extends object>(App: ComponentType<P>, rootProps?: Omit<AgentAppRootProps, "children">): ComponentType<P>;
  connect(settings?: MobigentSimpleConnectionSettings): Promise<MobigentSimpleConnection>;
  emit: typeof emitMobigentEvent;
};

export function mobigentApp(input: MobigentSimpleAppInput): MobigentCreatedApp {
  const options = isMobigentFeatureInput(input) ? { features: input } : input;
  const features = [...toArray(options.features), ...resolveFunctionFeatures(options.functions)];
  const { config, functions: _functions, confirm, ...appOptions } = options;
  const appConnectionUrl =
    appOptions.gatewayUrl ??
    appOptions.connectionUrl ??
    resolveMobigentConnectionUrl(appOptions.connection) ??
    config?.gatewayUrl ??
    config?.connectionUrl ??
    resolveMobigentConnectionUrl(config?.connection);
  const app = createAgentApp({
    ...appOptions,
    appId: appOptions.appId ?? config?.appId,
    appName: appOptions.appName ?? config?.appName,
    gatewayUrl: appConnectionUrl,
    version: appOptions.version ?? config?.version,
    authToken: appOptions.authToken ?? config?.authToken,
    capabilities: [...toArray(options.capabilities), ...features],
    modules: options.modules
  });

  const connectionSettings = {
    config,
    appId: appOptions.appId ?? config?.appId,
    appName: appOptions.appName ?? config?.appName,
    connection: appOptions.connection ?? config?.connection,
    connectionUrl: appOptions.connectionUrl ?? config?.connectionUrl,
    gatewayUrl: appOptions.gatewayUrl ?? config?.gatewayUrl,
    version: appOptions.version ?? config?.version,
    authToken: appOptions.authToken ?? config?.authToken,
    confirm,
    signManifest: appOptions.signManifest,
    createSocket: appOptions.createSocket,
    reconnect: appOptions.reconnect,
    eventQueue: appOptions.eventQueue,
    heartbeat: appOptions.heartbeat
  };

  return {
    ...app,
    with<P extends object>(App: ComponentType<P>, rootProps?: Omit<AgentAppRootProps, "children">) {
      function MobigentWrappedApp(props: P) {
        return createElement(app.Root, {
          ...rootProps,
          children: createElement(App, props)
        });
      }

      MobigentWrappedApp.displayName = `mobigent.with(${App.displayName ?? App.name ?? "App"})`;
      return MobigentWrappedApp;
    },
    connect(settings: MobigentSimpleConnectionSettings = {}) {
      return connectMobigent(features, {
        ...connectionSettings,
        ...settings
      });
    },
    emit: emitMobigentEvent
  };
}

export const createMobigentRoot = mobigentApp;
export const createApp = mobigentApp;
export const createSimpleMobigentApp = mobigentApp;
export const setupMobigent = mobigentApp;

export function withMobigent<P extends object>(
  App: ComponentType<P>,
  input: MobigentSimpleAppInput,
  rootProps?: Omit<AgentAppRootProps, "children">
): ComponentType<P>;
export function withMobigent<P extends object>(App: ComponentType<P>, options: MobigentWithAppOptions): ComponentType<P>;
export function withMobigent<P extends object>(
  App: ComponentType<P>,
  input: MobigentSimpleAppInput | MobigentWithAppOptions,
  rootProps?: Omit<AgentAppRootProps, "children">
): ComponentType<P> {
  const { Root, rootProps: resolvedRootProps } = createMobigentWrapper(input, rootProps);

  function MobigentWrappedApp(props: P) {
    return createElement(Root, {
      ...resolvedRootProps,
      children: createElement(App, props)
    });
  }

  MobigentWrappedApp.displayName = `withMobigent(${App.displayName ?? App.name ?? "App"})`;

  return MobigentWrappedApp;
}

export function createMobigentWrapper(
  input: MobigentSimpleAppInput | MobigentWithAppOptions,
  rootProps?: Omit<AgentAppRootProps, "children">
) {
  if (isMobigentWithAppOptions(input)) {
    const { rootProps: inputRootProps, ...options } = input;
    const { Root } = mobigentApp(options);

    return {
      Root,
      rootProps: inputRootProps ?? rootProps
    };
  }

  const { Root } = mobigentApp(input);

  return {
    Root,
    rootProps
  };
}

export const wrapMobigent = withMobigent;

function isMobigentFeatureInput(value: MobigentSimpleAppInput): value is MobigentSimpleFeature | MobigentSimpleFeature[] {
  if (Array.isArray(value)) {
    return value.every(isMobigentFeature);
  }

  return isMobigentFeature(value);
}

function isMobigentFeature(value: MobigentSimpleAppInput | MobigentSimpleFeature): value is MobigentSimpleFeature {
  return Boolean(
    value &&
      typeof value === "object" &&
      "namespace" in value &&
      "actions" in value &&
      "resources" in value &&
      "components" in value
  );
}

function isMobigentWithAppOptions(value: MobigentSimpleAppInput | MobigentWithAppOptions): value is MobigentWithAppOptions {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && "rootProps" in value);
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function resolveFunctionFeatures(functions: MobigentSimpleFunctionMap | undefined): MobigentSimpleFeature[] {
  return functions ? defineMobigent(functions) : [];
}
