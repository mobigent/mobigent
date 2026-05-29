import { createAgentApp, type AgentAppFactoryOptions } from "./ui.js";
import type { MobigentSimpleAppConfig, MobigentSimpleFeature } from "./simple.js";

export type MobigentSimpleAppOptions = Omit<AgentAppFactoryOptions, "capabilities" | "modules"> & {
  config?: MobigentSimpleAppConfig;
  features?: MobigentSimpleFeature | MobigentSimpleFeature[];
  capabilities?: AgentAppFactoryOptions["capabilities"];
  modules?: AgentAppFactoryOptions["modules"];
};

export function mobigentApp(options: MobigentSimpleAppOptions) {
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

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}
