import { createAgentApp, type AgentAppFactoryOptions } from "./ui.js";
import type { MobigentSimpleFeature } from "./simple.js";

export type MobigentSimpleAppOptions = Omit<AgentAppFactoryOptions, "capabilities" | "modules"> & {
  features?: MobigentSimpleFeature | MobigentSimpleFeature[];
  capabilities?: AgentAppFactoryOptions["capabilities"];
  modules?: AgentAppFactoryOptions["modules"];
};

export function mobigentApp(options: MobigentSimpleAppOptions) {
  const features = toArray(options.features);

  return createAgentApp({
    ...options,
    capabilities: [
      ...toArray(options.capabilities),
      ...features
    ],
    modules: options.modules
  });
}

export const createSimpleMobigentApp = mobigentApp;

export {
  agentFeature,
  connectMobigent,
  feature,
  registerFeature,
  registerFeatures,
  simpleSchema,
  toSchema,
  type MobigentSimpleActionOptions,
  type MobigentSimpleClient,
  type MobigentSimpleComponentOptions,
  type MobigentSimpleConnection,
  type MobigentSimpleConnectionClient,
  type MobigentSimpleConnectionOptions,
  type MobigentSimpleFeature,
  type MobigentSimpleField,
  type MobigentSimpleObjectSchema,
  type MobigentSimpleResourceOptions,
  type MobigentSimpleSchema
} from "./simple.js";

export {
  AgentAction,
  AgentComponent,
  MobigentModuleMount,
  AgentModules,
  AgentResource,
  AgentSurface,
  applyAgentPolicy,
  composeAgentCapabilities,
  createAgentCapabilities,
  createAgentEnvironment,
  createAgentEnvironmentFromEnv,
  createAgentEnvironmentFromExpoConfig,
  createAgentFeature,
  createAgentModule,
  createAgentPolicy,
  defineAgentAction,
  defineAgentCapabilities,
  defineAgentComponent,
  defineAgentFeature,
  defineAgentResource,
  diagnoseMobigentCapabilities,
  formatMobigentCapabilityDiagnostics,
  formatMobigentDiagnostics,
  fromJsonSchema,
  fromTypeBox,
  fromZod,
  schema,
  schemaAdapters,
  useAgent,
  useAgentAction,
  useAgentComponent,
  useAgentEvent,
  useAgentModule,
  useAgentResource,
  useAgentScreen,
  useMobigentConfirmation,
  useMobigentConnected,
  useMobigentConnection,
  useMobigentConnectionState,
  useMobigentDiagnostics,
  useMobigentEvent,
  useMobigentModule,
  useMobigentModuleDefinition,
  useMobigentModules,
  useMobigentStatus,
  useMobigentSurface,
  type AgentActionProps,
  type AgentComponentProps,
  type AgentFeatureModuleOptions,
  type AgentHookResult,
  type AgentModuleOptions,
  type AgentModulesProps,
  type AgentOptions,
  type AgentResourceProps,
  type AgentScreenFactory,
  type AgentScreenHookResult,
  type AgentScreenOptions,
  type AgentSurfaceProps
} from "./index.js";
export {
  AgentApp,
  MobigentConfirmationModal,
  MobigentDiagnosticsPanel,
  MobigentStatusBadge,
  createAgentApp,
  createAgentExpoApp,
  type AgentAppFactoryOptions,
  type AgentAppProps,
  type AgentAppRootProps,
  type AgentExpoAppOptions,
  type MobigentConfirmationComponentProps,
  type MobigentConfirmationModalProps,
  type MobigentDiagnosticsPanelProps,
  type MobigentStatusBadgeProps
} from "./ui.js";

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}
