import { createElement, type ComponentType } from "react";
import { createAgentApp, type AgentAppFactoryOptions, type AgentAppRootProps } from "./ui.js";
import type { MobigentSimpleAppConfig, MobigentSimpleFeature } from "./simple.js";

export type MobigentSimpleAppOptions = Omit<AgentAppFactoryOptions, "capabilities" | "modules"> & {
  config?: MobigentSimpleAppConfig;
  features?: MobigentSimpleFeature | MobigentSimpleFeature[];
  capabilities?: AgentAppFactoryOptions["capabilities"];
  modules?: AgentAppFactoryOptions["modules"];
};

export type MobigentSimpleAppInput = MobigentSimpleAppOptions | MobigentSimpleFeature | MobigentSimpleFeature[];

export type MobigentWithAppOptions = MobigentSimpleAppOptions & {
  rootProps?: Omit<AgentAppRootProps, "children">;
};

export function mobigentApp(input: MobigentSimpleAppInput) {
  const options = isMobigentFeatureInput(input) ? { features: input } : input;
  const features = toArray(options.features);
  const { config, ...appOptions } = options;

  return createAgentApp({
    ...appOptions,
    appId: appOptions.appId ?? config?.appId,
    appName: appOptions.appName ?? config?.appName,
    gatewayUrl: appOptions.gatewayUrl ?? config?.connectionUrl ?? config?.gatewayUrl,
    version: appOptions.version ?? config?.version,
    authToken: appOptions.authToken ?? config?.authToken,
    capabilities: [
      ...toArray(options.capabilities),
      ...features
    ],
    modules: options.modules
  });
}

export const createMobigentRoot = mobigentApp;
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
