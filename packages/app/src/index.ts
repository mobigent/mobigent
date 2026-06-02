import type { ComponentType } from "react";
import {
  connectMobigent,
  emitMobigentEvent,
  setupMobigent,
  withMobigent,
  type AgentAppRootProps,
  type MobigentSimpleAppInput,
  type MobigentSimpleAppOptions,
  type MobigentSimpleConnection,
  type MobigentSimpleConnectionSettings,
  type MobigentSimpleFeature,
  type MobigentWithAppOptions
} from "@mobigent/react-native/app";

export type MobigentAppPackageOptions = MobigentSimpleAppInput | MobigentWithAppOptions;

export type MobigentAppPackage = ReturnType<typeof setupMobigent> & {
  with<P extends object>(App: ComponentType<P>, rootProps?: Omit<AgentAppRootProps, "children">): ComponentType<P>;
  connect(settings?: MobigentSimpleConnectionSettings): Promise<MobigentSimpleConnection>;
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
    connect(settings: MobigentSimpleConnectionSettings = {}) {
      return connectMobigent(features, {
        ...resolvePackageConnectionSettings(input),
        ...settings
      });
    },
    emit: emitMobigentEvent
  };
}

export const app = createApp;
export const connect = connectMobigent;
export const emit = emitMobigentEvent;
export const setup = setupMobigent;

export * from "@mobigent/react-native";

function resolvePackageFeatures(input: MobigentAppPackageOptions): MobigentSimpleFeature | MobigentSimpleFeature[] {
  if (isFeatureInput(input)) {
    return input;
  }

  const features = (input as MobigentSimpleAppOptions).features;
  if (!features) {
    throw new Error("createApp(...).connect() requires at least one Mobigent feature.");
  }

  return features;
}

function resolvePackageConnectionSettings(input: MobigentAppPackageOptions): MobigentSimpleConnectionSettings {
  if (isFeatureInput(input)) {
    return {};
  }

  const { features: _features, capabilities: _capabilities, modules: _modules, rootProps: _rootProps, ...settings } =
    input as MobigentWithAppOptions;

  return settings;
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
