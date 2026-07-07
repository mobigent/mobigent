import { createElement, type ComponentType } from 'react';
import { createAgentApp, type AgentAppFactoryOptions, type AgentAppRootProps } from './ui.js';
import {
  connectMobigent,
  defineMobigent,
  emitMobigentEvent,
  resolveMobigentEnvironmentConfig,
  resolveMobigentConnectionUrl,
  type MobigentSimpleAppConfig,
  type MobigentSimpleBackendConnection,
  type MobigentSimpleConnection,
  type MobigentSimpleConnectionOptions,
  type MobigentSimpleConnectionSettings,
  type MobigentSimpleFeature,
  type MobigentSimpleFunctionMap,
} from './simple.js';

export type MobigentSimpleAppOptions = Omit<AgentAppFactoryOptions, 'capabilities' | 'modules'> & {
  config?: MobigentSimpleAppConfig;
  pairing?: MobigentSimpleAppConfig;
  connection?: MobigentSimpleBackendConnection;
  backendUrl?: string;
  connectionUrl?: string;
  confirm?: MobigentSimpleConnectionOptions['confirm'];
  features?: MobigentSimpleFeature | MobigentSimpleFeature[];
  functions?: MobigentSimpleFunctionMap;
  capabilities?: AgentAppFactoryOptions['capabilities'];
  modules?: AgentAppFactoryOptions['modules'];
};

export type MobigentSimpleAppInput =
  MobigentSimpleAppOptions | MobigentSimpleFeature | MobigentSimpleFeature[];
export type MobigentSimpleAppIdentityOptions = Omit<
  MobigentSimpleAppOptions,
  'appId' | 'functions'
> & {
  appName?: string;
};

export type MobigentWithAppOptions = MobigentSimpleAppOptions & {
  rootProps?: Omit<AgentAppRootProps, 'children'>;
};

export type MobigentCreatedApp = ReturnType<typeof createAgentApp> & {
  with<P extends object>(
    App: ComponentType<P>,
    rootProps?: Omit<AgentAppRootProps, 'children'>,
  ): ComponentType<P>;
  connect(settings?: MobigentSimpleConnectionSettings): Promise<MobigentSimpleConnection>;
  emit: typeof emitMobigentEvent;
};

export function mobigentApp(
  appId: string,
  functions: MobigentSimpleFunctionMap,
  options?: MobigentSimpleAppIdentityOptions,
): MobigentCreatedApp;
export function mobigentApp(input: MobigentSimpleAppInput): MobigentCreatedApp;
export function mobigentApp(
  input: MobigentSimpleAppInput | string,
  functions?: MobigentSimpleFunctionMap,
  identityOptions: MobigentSimpleAppIdentityOptions = {},
): MobigentCreatedApp {
  const normalizedInput = normalizeMobigentAppInput(input, functions, identityOptions);
  const options = isMobigentFeatureInput(normalizedInput)
    ? { features: normalizedInput }
    : normalizedInput;
  const features = [...toArray(options.features), ...resolveFunctionFeatures(options.functions)];
  const { config, pairing, functions: _functions, confirm, ...appOptions } = options;
  const envConfig = resolveMobigentEnvironmentConfig();
  const appConnectionUrl =
    appOptions.gatewayUrl ??
    appOptions.backendUrl ??
    appOptions.connectionUrl ??
    resolveMobigentConnectionUrl(appOptions.connection) ??
    pairing?.gatewayUrl ??
    pairing?.backendUrl ??
    pairing?.connectionUrl ??
    resolveMobigentConnectionUrl(pairing?.connection) ??
    config?.gatewayUrl ??
    config?.backendUrl ??
    config?.connectionUrl ??
    resolveMobigentConnectionUrl(config?.connection) ??
    envConfig.gatewayUrl ??
    envConfig.backendUrl ??
    envConfig.connectionUrl;
  const app = createAgentApp({
    ...appOptions,
    appId: appOptions.appId ?? pairing?.appId ?? config?.appId ?? envConfig.appId,
    appName: appOptions.appName ?? pairing?.appName ?? config?.appName ?? envConfig.appName,
    gatewayUrl: appConnectionUrl,
    version: appOptions.version ?? pairing?.version ?? config?.version ?? envConfig.version,
    authToken:
      appOptions.authToken ?? pairing?.authToken ?? config?.authToken ?? envConfig.authToken,
    capabilities: [...toArray(options.capabilities), ...features],
    modules: options.modules,
  });

  const connectionSettings = {
    config,
    pairing,
    appId: appOptions.appId ?? pairing?.appId ?? config?.appId ?? envConfig.appId,
    appName: appOptions.appName ?? pairing?.appName ?? config?.appName ?? envConfig.appName,
    connection: appOptions.connection ?? config?.connection,
    backendUrl: appOptions.backendUrl ?? config?.backendUrl,
    connectionUrl: appOptions.connectionUrl ?? config?.connectionUrl,
    gatewayUrl: appOptions.gatewayUrl ?? config?.gatewayUrl ?? envConfig.gatewayUrl,
    version: appOptions.version ?? config?.version ?? envConfig.version,
    authToken: appOptions.authToken ?? config?.authToken ?? envConfig.authToken,
    confirm,
    signManifest: appOptions.signManifest,
    createSocket: appOptions.createSocket,
    reconnect: appOptions.reconnect,
    eventQueue: appOptions.eventQueue,
    heartbeat: appOptions.heartbeat,
  };

  return {
    ...app,
    with<P extends object>(App: ComponentType<P>, rootProps?: Omit<AgentAppRootProps, 'children'>) {
      function MobigentWrappedApp(props: P) {
        return createElement(app.Root, {
          ...rootProps,
          children: createElement(App, props),
        });
      }

      MobigentWrappedApp.displayName = `mobigent.with(${App.displayName ?? App.name ?? 'App'})`;
      return MobigentWrappedApp;
    },
    connect(settings: MobigentSimpleConnectionSettings = {}) {
      return connectMobigent(features, {
        ...connectionSettings,
        ...settings,
      });
    },
    emit: emitMobigentEvent,
  };
}

export const createMobigentRoot = mobigentApp;
export const createApp = mobigentApp;
export const createSimpleMobigentApp = mobigentApp;
export const setupMobigent = mobigentApp;

export function withMobigent<P extends object>(
  App: ComponentType<P>,
  input: MobigentSimpleAppInput,
  rootProps?: Omit<AgentAppRootProps, 'children'>,
): ComponentType<P>;
export function withMobigent<P extends object>(
  App: ComponentType<P>,
  options: MobigentWithAppOptions,
): ComponentType<P>;
export function withMobigent<P extends object>(
  App: ComponentType<P>,
  input: MobigentSimpleAppInput | MobigentWithAppOptions,
  rootProps?: Omit<AgentAppRootProps, 'children'>,
): ComponentType<P> {
  const { Root, rootProps: resolvedRootProps } = createMobigentWrapper(input, rootProps);

  function MobigentWrappedApp(props: P) {
    return createElement(Root, {
      ...resolvedRootProps,
      children: createElement(App, props),
    });
  }

  MobigentWrappedApp.displayName = `withMobigent(${App.displayName ?? App.name ?? 'App'})`;

  return MobigentWrappedApp;
}

export function createMobigentWrapper(
  input: MobigentSimpleAppInput | MobigentWithAppOptions,
  rootProps?: Omit<AgentAppRootProps, 'children'>,
) {
  if (isMobigentWithAppOptions(input)) {
    const { rootProps: inputRootProps, ...options } = input;
    const { Root } = mobigentApp(options);

    return {
      Root,
      rootProps: inputRootProps ?? rootProps,
    };
  }

  const { Root } = mobigentApp(input);

  return {
    Root,
    rootProps,
  };
}

export const wrapMobigent = withMobigent;

function isMobigentFeatureInput(
  value: MobigentSimpleAppInput,
): value is MobigentSimpleFeature | MobigentSimpleFeature[] {
  if (Array.isArray(value)) {
    return value.every(isMobigentFeature);
  }

  return isMobigentFeature(value);
}

function normalizeMobigentAppInput(
  input: MobigentSimpleAppInput | string,
  functions: MobigentSimpleFunctionMap | undefined,
  options: MobigentSimpleAppIdentityOptions,
): MobigentSimpleAppInput {
  if (typeof input !== 'string') {
    return input;
  }

  if (!functions) {
    throw new Error('createApp(appId, functions) requires an app functions object.');
  }

  return {
    ...options,
    appId: input,
    functions,
  };
}

function isMobigentFeature(
  value: MobigentSimpleAppInput | MobigentSimpleFeature,
): value is MobigentSimpleFeature {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'namespace' in value &&
    'actions' in value &&
    'resources' in value &&
    'components' in value,
  );
}

function isMobigentWithAppOptions(
  value: MobigentSimpleAppInput | MobigentWithAppOptions,
): value is MobigentWithAppOptions {
  return Boolean(
    value && typeof value === 'object' && !Array.isArray(value) && 'rootProps' in value,
  );
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function resolveFunctionFeatures(
  functions: MobigentSimpleFunctionMap | undefined,
): MobigentSimpleFeature[] {
  return functions ? defineMobigent(functions) : [];
}
