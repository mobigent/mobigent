import { createAgentApp, type AgentAppFactoryOptions } from "./ui.js";
import type { MobigentSimpleAppConfig, MobigentSimpleFeature } from "./simple.js";

export type MobigentSimpleAppOptions = Omit<AgentAppFactoryOptions, "capabilities" | "modules"> & {
  config?: MobigentSimpleAppConfig;
  features?: MobigentSimpleFeature | MobigentSimpleFeature[];
  capabilities?: AgentAppFactoryOptions["capabilities"];
  modules?: AgentAppFactoryOptions["modules"];
};

export type MobigentSimpleAppInput = MobigentSimpleAppOptions | MobigentSimpleFeature | MobigentSimpleFeature[];

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

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}
