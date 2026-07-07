import type * as ReactNativeRuntime from 'react-native';
import {
  composeMobigentCapabilities,
  createMobigentEnvironmentFromExpoConfig,
  createMobigentEnvironmentFromEnv,
  diagnoseMobigentCapabilities,
  MobigentCapabilities,
  MobigentProvider,
  resolveMobigentExpoAppIdentity,
  useMobigentConfirmation,
  useMobigentConnection,
  useMobigentDiagnostics,
  useMobigentStatus,
  type MobigentCapabilitiesProps,
  type MobigentCapabilityDiagnostics,
  type MobigentCapabilityKit,
  type MobigentEnvironmentFromEnvOptions,
  type MobigentEnvironmentVariables,
  type MobigentEnvironmentMode,
  type MobigentExpoConfig,
  type MobigentModule,
  type MobigentProviderProps,
  type MobigentStatus,
  type MobigentStatusLevel,
} from './provider.js';
import { useEffect, useMemo, type ComponentType, type ReactNode } from 'react';

declare const require: (id: string) => unknown;

function getReactNative() {
  return require('react-native') as typeof ReactNativeRuntime;
}

function getReactNativePlatformOS() {
  return getReactNative().Platform.OS;
}

export type MobigentConfirmationModalProps = {
  approveLabel?: string;
  rejectLabel?: string;
};

export type MobigentConfirmationComponentProps = MobigentConfirmationModalProps;

export type MobigentStatusBadgeProps = {
  status?: MobigentStatus;
  showCount?: boolean;
  label?: string;
};

export type MobigentDiagnosticsPanelProps = {
  title?: string;
  showControls?: boolean;
  showIssues?: boolean;
};

export type MobigentAppPreflightOptions = {
  enabled?: boolean;
  throwOnFailure?: boolean;
  onReport?: (report: MobigentCapabilityDiagnostics) => void;
};

export type MobigentAppProps = Omit<MobigentProviderProps, 'children'> & {
  children: ReactNode;
  capabilities?:
    | MobigentCapabilityKit
    | MobigentCapabilitiesProps
    | Array<MobigentCapabilityKit | MobigentCapabilitiesProps>;
  modules?: MobigentModule | MobigentModule[];
  capabilityDeps?: readonly unknown[];
  preflight?: boolean | MobigentAppPreflightOptions;
  confirmationModal?: boolean | MobigentConfirmationModalProps;
  ConfirmationComponent?: ComponentType<MobigentConfirmationComponentProps>;
};

export type MobigentAppFactoryOptions = Omit<MobigentAppProps, 'children'>;

export type MobigentExpoAppOptions = Omit<
  MobigentAppFactoryOptions,
  'app' | 'appId' | 'appName' | 'version' | 'gateway' | 'gatewayUrl' | 'authToken' | 'enabled'
> & {
  app?: MobigentAppFactoryOptions['app'];
  expo?: MobigentExpoConfig;
  env?: MobigentEnvironmentVariables;
  envPrefix?: MobigentEnvironmentFromEnvOptions['prefix'];
  fallback?: MobigentEnvironmentFromEnvOptions['fallback'];
};

export type MobigentAppRootProps = {
  children: ReactNode;
  capabilities?: MobigentAppProps['capabilities'];
  modules?: MobigentAppProps['modules'];
} & Partial<Omit<MobigentAppProps, 'children' | 'capabilities' | 'modules'>>;

export type AgentAppProps = MobigentAppProps;
export type AgentAppFactoryOptions = MobigentAppFactoryOptions;
export type AgentExpoAppOptions = MobigentExpoAppOptions;
export type AgentAppRootProps = MobigentAppRootProps;

export type MobigentAppFactory = {
  Root: ComponentType<MobigentAppRootProps>;
  Provider: ComponentType<MobigentAppRootProps>;
  options: MobigentAppFactoryOptions;
};

export function createMobigentApp(options: MobigentAppFactoryOptions): MobigentAppFactory {
  const appOptions: MobigentAppFactoryOptions = {
    reconnect: { enabled: true, maxAttempts: 20 },
    heartbeat: true,
    ...options,
  };

  function MobigentRoot({ children, capabilities, ...runtimeOptions }: MobigentAppRootProps) {
    return (
      <MobigentApp
        {...appOptions}
        {...runtimeOptions}
        capabilities={mergeMobigentAppCapabilities(appOptions.capabilities, capabilities)}
        modules={mergeMobigentAppModules(appOptions.modules, runtimeOptions.modules)}
      >
        {children}
      </MobigentApp>
    );
  }

  return {
    Root: MobigentRoot,
    Provider: MobigentRoot,
    options: appOptions,
  };
}

export function createMobigentExpoApp({
  app,
  expo,
  env,
  envPrefix,
  fallback,
  ...options
}: MobigentExpoAppOptions): MobigentAppFactory {
  return createMobigentApp({
    ...createMobigentEnvironmentFromEnv({
      env,
      prefix: envPrefix,
      fallback: createMobigentExpoEnvironmentFallback(expo, fallback),
    }),
    app: app ?? resolveMobigentExpoAppIdentity(expo),
    reconnect: options.reconnect ?? { enabled: true, maxAttempts: 20 },
    heartbeat: options.heartbeat ?? true,
    preflight: options.preflight ?? true,
    ...options,
  });
}

export const createAgentApp = createMobigentApp;
export const createAgentExpoApp = createMobigentExpoApp;

export function MobigentApp({
  children,
  capabilities,
  modules,
  capabilityDeps = [],
  preflight,
  confirmationModal = true,
  ConfirmationComponent = MobigentConfirmationModal,
  ...providerProps
}: MobigentAppProps) {
  const normalizedCapabilities = normalizeMobigentAppCapabilities(capabilities, modules);
  const preflightOptions = normalizeMobigentAppPreflight(preflight);
  const preflightReport = useMemo(
    () =>
      preflightOptions.enabled
        ? createMobigentAppPreflight({
            ...providerProps,
            capabilities,
            modules,
          })
        : undefined,
    [
      preflightOptions.enabled,
      providerProps.app,
      providerProps.appId,
      providerProps.appName,
      providerProps.version,
      capabilities,
      modules,
      preflight,
    ],
  );
  const CapabilityMount = isCapabilityKit(normalizedCapabilities)
    ? normalizedCapabilities.Component
    : undefined;
  const capabilityProps =
    normalizedCapabilities && !isCapabilityKit(normalizedCapabilities)
      ? withMobigentCapabilityDeps(normalizedCapabilities, capabilityDeps)
      : undefined;
  const confirmationProps = typeof confirmationModal === 'object' ? confirmationModal : {};
  const enabled = providerProps.enabled ?? true;
  const resolvedProviderProps =
    providerProps.gatewayUrl || providerProps.gateway
      ? providerProps
      : { ...providerProps, gateway: { platform: getReactNativePlatformOS() } };

  useEffect(() => {
    if (preflightReport) {
      preflightOptions.onReport?.(preflightReport);
    }
  }, [preflightOptions, preflightReport]);

  if (preflightOptions.throwOnFailure && preflightReport?.status === 'fail') {
    throw new Error(`Mobigent app preflight failed: ${preflightReport.errors.join('; ')}`);
  }

  return (
    <MobigentProvider {...resolvedProviderProps}>
      {enabled && CapabilityMount ? <CapabilityMount deps={capabilityDeps} /> : null}
      {enabled && capabilityProps ? <MobigentCapabilities {...capabilityProps} /> : null}
      {children}
      {enabled && confirmationModal ? <ConfirmationComponent {...confirmationProps} /> : null}
    </MobigentProvider>
  );
}

export const AgentApp = MobigentApp;

export function createMobigentAppPreflight(
  options: Pick<
    MobigentAppProps,
    'app' | 'appId' | 'appName' | 'version' | 'capabilities' | 'modules'
  >,
): MobigentCapabilityDiagnostics {
  const normalizedCapabilities = normalizeMobigentAppCapabilities(
    options.capabilities,
    options.modules,
  );
  const app =
    options.app ??
    (options.appId && options.appName
      ? { id: options.appId, name: options.appName, version: options.version }
      : undefined);

  return diagnoseMobigentCapabilities(normalizedCapabilities, {
    app,
    version: app?.version ?? options.version,
  });
}

export function MobigentConfirmationModal({
  approveLabel = 'Approve',
  rejectLabel = 'Reject',
}: MobigentConfirmationModalProps) {
  const { Button, Modal, Text, View } = getReactNative();
  const { request, approve, reject } = useMobigentConfirmation();

  return (
    <Modal visible={Boolean(request)} transparent animationType="fade" onRequestClose={reject}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>
            {request?.action.confirmation?.title ??
              request?.action.description ??
              'Approve action?'}
          </Text>
          {request?.action.confirmation?.message ? (
            <Text style={styles.message}>{request.action.confirmation.message}</Text>
          ) : null}
          <Text style={styles.payload}>{JSON.stringify(request?.input ?? {}, null, 2)}</Text>
          <View style={styles.actions}>
            <Button title={rejectLabel} onPress={reject} />
            <Button title={approveLabel} onPress={approve} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function MobigentStatusBadge({ status, showCount = true, label }: MobigentStatusBadgeProps) {
  const { Text, View } = getReactNative();
  const currentStatus = status ?? useMobigentStatus();
  const tone = statusBadgeTone[currentStatus.level];
  const text = label ?? currentStatus.label;
  const count = showCount ? ` · ${currentStatus.capabilityCount}` : '';

  return (
    <View
      style={[styles.statusBadge, { borderColor: tone.border, backgroundColor: tone.background }]}
    >
      <View style={[styles.statusDot, { backgroundColor: tone.dot }]} />
      <Text style={[styles.statusText, { color: tone.text }]}>
        {text}
        {count}
      </Text>
    </View>
  );
}

export function MobigentDiagnosticsPanel({
  title = 'Agent bridge',
  showControls = true,
  showIssues = true,
}: MobigentDiagnosticsPanelProps) {
  const { Button, Text, View } = getReactNative();
  const diagnostics = useMobigentDiagnostics();
  const status = useMobigentStatus();
  const { connect, disconnect, connected, connectionState } = useMobigentConnection();
  const issueCount = diagnostics.issues.length;
  const primaryAction = connected ? disconnect : () => void connect();

  return (
    <View style={styles.diagnosticsPanel}>
      <View style={styles.diagnosticsHeader}>
        <View style={styles.diagnosticsTitleGroup}>
          <Text style={styles.diagnosticsTitle}>{title}</Text>
          <Text style={styles.diagnosticsSubtitle}>
            {connectionState} · {diagnostics.capabilityCounts.total} capabilities
          </Text>
        </View>
        <MobigentStatusBadge status={status} />
      </View>
      <View style={styles.diagnosticsGrid}>
        <DiagnosticsMetric label="Actions" value={diagnostics.capabilityCounts.actions} />
        <DiagnosticsMetric label="Resources" value={diagnostics.capabilityCounts.resources} />
        <DiagnosticsMetric label="Components" value={diagnostics.capabilityCounts.components} />
        <DiagnosticsMetric label="Queued" value={diagnostics.queuedEventCount} />
      </View>
      {showIssues && issueCount > 0 ? (
        <View style={styles.issueList}>
          {diagnostics.issues.map((issue) => (
            <Text key={`${issue.code}:${issue.message}`} style={styles.issueText}>
              [{issue.severity}] {issue.code}: {issue.message}
            </Text>
          ))}
        </View>
      ) : null}
      {showControls ? (
        <View style={styles.diagnosticsActions}>
          <Button title={connected ? 'Disconnect' : 'Connect'} onPress={primaryAction} />
        </View>
      ) : null}
    </View>
  );
}

function DiagnosticsMetric({ label, value }: { label: string; value: number }) {
  const { Text, View } = getReactNative();

  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function isCapabilityKit(
  capabilities: MobigentCapabilityKit | MobigentCapabilitiesProps | undefined,
): capabilities is MobigentCapabilityKit {
  return Boolean(capabilities && 'Component' in capabilities && 'useRegister' in capabilities);
}

function normalizeMobigentAppCapabilities(
  capabilities: MobigentAppProps['capabilities'],
  modules: MobigentAppProps['modules'],
) {
  const sources = [...toOptionalCapabilityArray(capabilities), ...toOptionalModuleArray(modules)];

  if (sources.length === 0) {
    return undefined;
  }

  if (sources.length === 1) {
    return sources[0];
  }

  return composeMobigentCapabilities(...sources);
}

function mergeMobigentAppCapabilities(
  base: MobigentAppProps['capabilities'],
  override: MobigentAppProps['capabilities'],
) {
  if (!base) {
    return override;
  }

  if (!override) {
    return base;
  }

  return [...toCapabilityArray(base), ...toCapabilityArray(override)];
}

function toCapabilityArray(capabilities: NonNullable<MobigentAppProps['capabilities']>) {
  return Array.isArray(capabilities) ? capabilities : [capabilities];
}

function mergeMobigentAppModules(
  base: MobigentAppProps['modules'],
  override: MobigentAppProps['modules'],
) {
  if (!base) {
    return override;
  }

  if (!override) {
    return base;
  }

  return [...toModuleArray(base), ...toModuleArray(override)];
}

function toOptionalCapabilityArray(capabilities: MobigentAppProps['capabilities']) {
  return capabilities ? toCapabilityArray(capabilities) : [];
}

function toOptionalModuleArray(modules: MobigentAppProps['modules']) {
  return modules ? toModuleArray(modules) : [];
}

function toModuleArray(modules: NonNullable<MobigentAppProps['modules']>) {
  return Array.isArray(modules) ? modules : [modules];
}

function withMobigentCapabilityDeps(
  capabilities: MobigentCapabilitiesProps,
  deps: readonly unknown[],
): MobigentCapabilitiesProps {
  if (deps.length === 0) {
    return capabilities;
  }

  return {
    ...capabilities,
    deps: [...(capabilities.deps ?? []), ...deps],
  };
}

function normalizeMobigentAppPreflight(
  preflight: MobigentAppProps['preflight'],
): Required<Omit<MobigentAppPreflightOptions, 'onReport'>> &
  Pick<MobigentAppPreflightOptions, 'onReport'> {
  if (preflight === true) {
    return {
      enabled: true,
      throwOnFailure: true,
      onReport: undefined,
    };
  }

  if (!preflight) {
    return {
      enabled: false,
      throwOnFailure: false,
      onReport: undefined,
    };
  }

  return {
    enabled: preflight.enabled ?? true,
    throwOnFailure: preflight.throwOnFailure ?? true,
    onReport: preflight.onReport,
  };
}

function createMobigentExpoEnvironmentFallback(
  expo: MobigentExpoConfig | undefined,
  fallback: MobigentEnvironmentFromEnvOptions['fallback'],
) {
  const expoEnvironment = createMobigentEnvironmentFromExpoConfig(expo, {
    platform: getReactNativePlatformOS(),
    ...fallback,
  });

  return {
    platform: getReactNativePlatformOS(),
    ...fallback,
    enabled: expoEnvironment.enabled ?? fallback?.enabled,
    gateway: undefined,
    gatewayUrl: expoEnvironment.gatewayUrl,
    authToken: expoEnvironment.authToken,
    mode: resolveMobigentExpoEnvironmentMode(expoEnvironment),
    host: expoEnvironment.gateway?.host,
    port: expoEnvironment.gateway?.port,
    secure: expoEnvironment.gateway?.secure,
    path: expoEnvironment.gateway?.path,
    deviceHost: expoEnvironment.gateway?.deviceHost,
  };
}

function resolveMobigentExpoEnvironmentMode(
  config: ReturnType<typeof createMobigentEnvironmentFromExpoConfig>,
): MobigentEnvironmentMode | undefined {
  if (config.enabled === false) {
    return 'disabled';
  }
  if (config.gatewayUrl) {
    return undefined;
  }
  if (config.gateway?.target === 'device' || config.gateway?.deviceHost) {
    return 'device';
  }
  if (config.gateway?.host && config.gateway.secure) {
    return 'hosted';
  }
  return 'local';
}

const styles = {
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 8,
    backgroundColor: 'white',
    padding: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    color: '#374151',
  },
  payload: {
    marginTop: 12,
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    color: '#111827',
    fontFamily: 'Courier',
  },
  actions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    minHeight: 28,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  diagnosticsPanel: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 12,
  },
  diagnosticsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  diagnosticsTitleGroup: {
    flexShrink: 1,
  },
  diagnosticsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  diagnosticsSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6b7280',
  },
  diagnosticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metric: {
    minWidth: 82,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f9fafb',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  metricLabel: {
    marginTop: 2,
    fontSize: 11,
    color: '#6b7280',
  },
  issueList: {
    gap: 6,
  },
  issueText: {
    fontSize: 12,
    color: '#92400e',
  },
  diagnosticsActions: {
    alignSelf: 'flex-start',
  },
} as const;

const statusBadgeTone: Record<
  MobigentStatusLevel,
  {
    background: string;
    border: string;
    dot: string;
    text: string;
  }
> = {
  ready: {
    background: '#ecfdf5',
    border: '#a7f3d0',
    dot: '#059669',
    text: '#065f46',
  },
  connecting: {
    background: '#eff6ff',
    border: '#bfdbfe',
    dot: '#2563eb',
    text: '#1e40af',
  },
  attention: {
    background: '#fffbeb',
    border: '#fde68a',
    dot: '#d97706',
    text: '#92400e',
  },
  offline: {
    background: '#f9fafb',
    border: '#d1d5db',
    dot: '#6b7280',
    text: '#374151',
  },
  disabled: {
    background: '#f3f4f6',
    border: '#d1d5db',
    dot: '#9ca3af',
    text: '#4b5563',
  },
};
