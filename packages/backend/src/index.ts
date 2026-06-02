import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { basename, dirname, join } from "node:path";
import {
  BridgeGateway,
  createHttpApp,
  type AgentProfile,
  type GatewayAppSession,
  type ToolCallOptions
} from "@mobigent/gateway";
import { sanitize, type JsonObject } from "@mobigent/core";
import {
  createProviderBundle,
  createProviderCatalog,
  filterProviderCatalog,
  type ProviderBundle,
  type ProviderKind
} from "@mobigent/providers";

export type MobigentBackendOptions = {
  wsPort?: number;
  httpPort?: number;
  appId?: string;
  appName?: string;
  version?: string;
  appToken?: string;
  authToken?: string;
  apiKey?: string;
  agentApiKeys?: Record<string, string>;
  corsOrigins?: string[];
  auditLogPath?: string;
  auditRedactKeys?: string[];
  allowedAppIds?: string[];
  agentProfiles?: Record<string, AgentProfile>;
  manifestSigningSecret?: string;
  jsonBodyLimit?: string;
  idempotencyRecordTtlMs?: number;
  cleanupIntervalMs?: number;
  host?: string;
  silent?: boolean;
  app?: MobigentBackendDefaultAppOptions;
  appDir?: string;
  appConfigFile?: string;
  appConfigModuleFile?: string | false;
  writeAppConfig?: boolean;
};

export type MobigentBackendDefaultAppOptions = {
  id?: string;
  name?: string;
  appId?: string;
  appName?: string;
  version?: string;
  connectionUrl?: string;
  gatewayUrl?: string;
  appToken?: string;
  authToken?: string;
};

export type MobigentBackendAppConfigOptions = {
  appId: string;
  appName: string;
  version?: string;
  connectionUrl?: string;
  gatewayUrl?: string;
  appToken?: string;
  authToken?: string;
};

export type MobigentBackendAppConfig = {
  appId: string;
  appName: string;
  connectionUrl: string;
  gatewayUrl?: string;
  version?: string;
  authToken?: string;
};

export type MobigentBackendReadyOptions = {
  minApps?: number;
  minFunctions?: number;
  /** @deprecated Use minFunctions. Kept for compatibility with provider/tool internals. */
  minTools?: number;
  timeoutMs?: number;
  intervalMs?: number;
};

export type MobigentBackendCallOptions = ToolCallOptions & {
  waitForApp?: boolean;
  waitTimeoutMs?: number;
  waitIntervalMs?: number;
};

export type MobigentBackendAppConfigModuleOptions = MobigentBackendAppConfigOptions & {
  exportName?: string;
};

export type MobigentInferredAppIdentity = {
  appId: string;
  appName: string;
};

export type MobigentAgentKind =
  | ProviderKind
  | "chatgpt"
  | "claude"
  | "openai"
  | "openapi-actions"
  | "openapi-agent";

export type MobigentAgentOptions = {
  baseUrl?: string;
  publicUrl?: string;
  auth?: "none" | "bearer" | "api-key";
  agentId?: string;
};

export type MobigentBackend = {
  /** @deprecated Low-level bridge object. Prefer the backend methods on this object. */
  gateway: BridgeGateway;
  httpServer: Server;
  urls: {
    websocket: string;
    http: string;
    inspector: string;
    openapi: string;
  };
  appConfigPath?: string;
  appConfigModulePath?: string;
  app(options: MobigentBackendAppConfigOptions): MobigentBackendAppConfig;
  appConfig(options: MobigentBackendAppConfigOptions): MobigentBackendAppConfig;
  appConfigModule(options: MobigentBackendAppConfigModuleOptions): string;
  agent(kind?: MobigentAgentKind, options?: MobigentAgentOptions): ProviderBundle;
  agents(options?: MobigentAgentOptions): ProviderBundle[];
  defaultApp?: MobigentBackendAppConfig;
  appConfigCode?: string;
  copyAppConfig(): string;
  stop(): Promise<void>;
  ready(options?: MobigentBackendReadyOptions): Promise<ReturnType<BridgeGateway["getStatus"]>>;
  waitForApp(options?: MobigentBackendReadyOptions): Promise<ReturnType<BridgeGateway["getStatus"]>>;
  listFunctions(): ReturnType<BridgeGateway["listTools"]>;
  /** @deprecated Use listFunctions(). Kept for compatibility. */
  functions(): ReturnType<BridgeGateway["listTools"]>;
  /** @deprecated Use listFunctions(). Kept for compatibility with provider/tool internals. */
  tools(): ReturnType<BridgeGateway["listTools"]>;
  apps(): GatewayAppSession[];
  resolveFunctionName(name: string): string;
  /** @deprecated Use resolveFunctionName(). Kept for compatibility. */
  resolveToolName(name: string): string;
  callApp(name: string, input?: unknown, options?: MobigentBackendCallOptions): ReturnType<BridgeGateway["callTool"]>;
  /** @deprecated Use callApp() or function(). Kept for compatibility. */
  call(toolName: string, input?: unknown, options?: MobigentBackendCallOptions): ReturnType<BridgeGateway["callTool"]>;
  /** @deprecated Use callApp() or function(). Kept for compatibility. */
  invoke(name: string, input?: unknown, options?: MobigentBackendCallOptions): ReturnType<BridgeGateway["callTool"]>;
  function(name: string): MobigentBackendFunction;
  /** @deprecated Use function(). Kept for compatibility. */
  appFunction(name: string): MobigentBackendFunction;
  /** @deprecated Use feature(). Kept for compatibility. */
  appFeature(namespace: string): MobigentBackendFeatureFunctions;
  feature(namespace: string): MobigentBackendFeatureFunctions;
  /** @deprecated Use feature() or function(). Kept for compatibility. */
  appFunctions(namespace: string): MobigentBackendFeatureFunctions;
  /** @deprecated Use function() for explicit aliases in user code. Kept for compatibility. */
  appFunctions<const T extends Record<string, string>>(functions: T): MobigentBackendFunctionMap<T>;
  /** @deprecated Use function(). Kept for compatibility. */
  fn(name: string): MobigentBackendFunction;
};

export type MobigentBackendFunction = (input?: unknown, options?: MobigentBackendCallOptions) => ReturnType<BridgeGateway["callTool"]>;
export type MobigentBackendFeatureFunctions = {
  [functionName: string]: MobigentBackendFunction;
};
export type MobigentBackendFunctionMap<T extends Record<string, string>> = {
  [K in keyof T]: MobigentBackendFunction;
};

export type MobigentBackendWithApp = MobigentBackend & {
  defaultApp: MobigentBackendAppConfig;
  appConfigCode: string;
};

export type MobigentBackendOptionsWithApp = MobigentBackendOptions & {
  app: MobigentBackendDefaultAppOptions;
};

export async function startMobigentBackend(options?: MobigentBackendOptions): Promise<MobigentBackendWithApp>;
export async function startMobigentBackend(options: MobigentBackendOptions = {}): Promise<MobigentBackendWithApp> {
  const wsPort = options.wsPort ?? Number(process.env.MOBIGENT_WS_PORT ?? 8787);
  const httpPort = options.httpPort ?? Number(process.env.MOBIGENT_HTTP_PORT ?? 8788);
  const host = options.host ?? "localhost";
  const appToken = options.appToken ?? options.authToken ?? process.env.MOBIGENT_AUTH_TOKEN;
  const gateway = new BridgeGateway({
    port: wsPort,
    authToken: appToken,
    auditLogPath: options.auditLogPath ?? process.env.MOBIGENT_AUDIT_LOG_PATH,
    auditRedactKeys: options.auditRedactKeys,
    allowedAppIds: options.allowedAppIds,
    agentProfiles: options.agentProfiles,
    manifestSigningSecret: options.manifestSigningSecret ?? process.env.MOBIGENT_MANIFEST_SIGNING_SECRET,
    idempotencyRecordTtlMs: options.idempotencyRecordTtlMs,
    cleanupIntervalMs: options.cleanupIntervalMs
  });

  gateway.start();

  const app = createHttpApp(gateway, {
    apiKey: options.apiKey ?? process.env.MOBIGENT_HTTP_API_KEY,
    agentApiKeys: options.agentApiKeys,
    corsOrigins: options.corsOrigins,
    jsonBodyLimit: options.jsonBodyLimit
  });

  const httpServer = await listen(app, httpPort);
  const urls = {
    websocket: `ws://${host}:${wsPort}`,
    http: `http://${host}:${httpPort}`,
    inspector: `http://${host}:${httpPort}/inspect`,
    openapi: `http://${host}:${httpPort}/openapi.json`
  };

  if (!options.silent) {
    console.log(`Mobigent backend ready`);
    console.log(`App WebSocket: ${urls.websocket}`);
    console.log(`Agent HTTP: ${urls.http}`);
    console.log(`Inspector: ${urls.inspector}`);
    console.log(`OpenAPI: ${urls.openapi}`);
  }

  const appConfig = (appOptions: MobigentBackendAppConfigOptions): MobigentBackendAppConfig => ({
    appId: appOptions.appId,
    appName: appOptions.appName,
    connectionUrl: appOptions.connectionUrl ?? appOptions.gatewayUrl ?? urls.websocket,
    version: appOptions.version,
    authToken: appOptions.appToken ?? appOptions.authToken ?? appToken
  });
  const appConfigModule = (appOptions: MobigentBackendAppConfigModuleOptions) =>
    formatMobigentAppConfigModule(appConfig(appOptions), {
      exportName: appOptions.exportName
    });
  const defaultApp = appConfig(resolveDefaultAppOptions(options));
  const appConfigCode = formatMobigentAppConfigModule(defaultApp);
  const appConfigFiles = writeDefaultAppConfig(options, defaultApp, appConfigCode);
  const createAgentCatalog = (agentOptions: MobigentAgentOptions = {}) => createProviderCatalog({
    mcp: {
      command: "mobigent-mcp"
    },
    openApi: {
      baseUrl: agentOptions.publicUrl ?? agentOptions.baseUrl ?? urls.http,
      auth: agentOptions.auth ?? (options.apiKey || process.env.MOBIGENT_HTTP_API_KEY ? "api-key" : "none")
    }
  });

  const invoke = async (name: string, input: unknown = {}, callOptions: MobigentBackendCallOptions = {}) => {
    const { waitForApp = true, waitTimeoutMs, waitIntervalMs, ...toolCallOptions } = callOptions;
    const toolName = waitForApp
      ? await waitForBackendFunction(gateway, name, defaultApp, {
          timeoutMs: waitTimeoutMs,
          intervalMs: waitIntervalMs
        })
      : resolveBackendToolName(gateway.listTools(), name, defaultApp);

    return gateway.callTool(toolName, input as JsonObject, toolCallOptions);
  };

  const appFunction = (name: string): MobigentBackendFunction =>
    (input: unknown = {}, callOptions?: ToolCallOptions) => invoke(name, input, callOptions);
  const appFeature = (namespace: string): MobigentBackendFeatureFunctions => createFeatureFunctionProxy(namespace, appFunction);
  function appFunctions(namespace: string): MobigentBackendFeatureFunctions;
  function appFunctions<const T extends Record<string, string>>(functions: T): MobigentBackendFunctionMap<T>;
  function appFunctions<const T extends Record<string, string>>(
    functionsOrNamespace: T | string
  ): MobigentBackendFunctionMap<T> | MobigentBackendFeatureFunctions {
    if (typeof functionsOrNamespace === "string") {
      return appFeature(functionsOrNamespace);
    }

    const functions = functionsOrNamespace;
    const entries = Object.entries(functions).map(([alias, functionName]) => [alias, appFunction(functionName)]);
    return Object.fromEntries(entries) as MobigentBackendFunctionMap<T>;
  }

  return {
    gateway,
    httpServer,
    urls,
    appConfigPath: appConfigFiles.jsonPath,
    appConfigModulePath: appConfigFiles.modulePath,
    app: appConfig,
    appConfig,
    appConfigModule,
    agent: (kind = "chatgpt-actions", agentOptions = {}) => {
      const id = normalizeAgentKind(kind);
      const [provider] = filterProviderCatalog(createAgentCatalog(agentOptions), { ids: [id] });
      if (!provider) {
        throw new Error(`Mobigent agent provider is not available: ${kind}`);
      }
      const bundle = createProviderBundle(provider);
      if (agentOptions.agentId && bundle.runtimeEnv) {
        bundle.runtimeEnv.MOBIGENT_AGENT_ID = agentOptions.agentId;
      }
      return bundle;
    },
    agents: (agentOptions = {}) => createAgentCatalog(agentOptions).map((provider) => createProviderBundle(provider)),
    defaultApp,
    appConfigCode,
    copyAppConfig: () => appConfigCode,
    stop: () => stopBackend(httpServer, gateway),
    ready: (readyOptions) => waitForBackendReady(gateway, readyOptions),
    waitForApp: (readyOptions) => waitForBackendReady(gateway, readyOptions),
    listFunctions: () => gateway.listTools(),
    functions: () => gateway.listTools(),
    tools: () => gateway.listTools(),
    apps: () => gateway.listApps(),
    resolveFunctionName: (name) => resolveBackendToolName(gateway.listTools(), name, defaultApp),
    resolveToolName: (name) => resolveBackendToolName(gateway.listTools(), name, defaultApp),
    callApp: invoke,
    call: invoke,
    invoke,
    function: appFunction,
    appFunction,
    appFeature,
    feature: appFeature,
    appFunctions,
    fn: appFunction
  };
}

function createFeatureFunctionProxy(namespace: string, appFunction: (name: string) => MobigentBackendFunction) {
  const cache = new Map<string, MobigentBackendFunction>();

  return new Proxy(
    {},
    {
      get(_target, property) {
        if (typeof property !== "string" || property === "then") {
          return undefined;
        }

        if (!cache.has(property)) {
          cache.set(property, appFunction(`${namespace}.${property}`));
        }

        return cache.get(property);
      }
    }
  ) as MobigentBackendFeatureFunctions;
}

function writeDefaultAppConfig(
  options: MobigentBackendOptions,
  defaultApp: MobigentBackendAppConfig,
  appConfigCode: string
) {
  if (!options.appDir || options.writeAppConfig === false) {
    return {};
  }

  const fileName = options.appConfigFile ?? "mobigent.app.json";
  const jsonPath = join(options.appDir, fileName);

  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, `${JSON.stringify(defaultApp, null, 2)}\n`, "utf8");

  let modulePath: string | undefined;
  if (options.appConfigModuleFile) {
    modulePath = join(options.appDir, options.appConfigModuleFile);
    mkdirSync(dirname(modulePath), { recursive: true });
    writeFileSync(modulePath, appConfigCode, "utf8");
  }

  return { jsonPath, modulePath };
}

function resolveDefaultAppOptions(options: MobigentBackendOptions): MobigentBackendAppConfigOptions {
  if (options.app) {
    return normalizeDefaultApp(options.app);
  }

  if (options.appId || options.appName || options.version) {
    const inferred = inferMobigentAppIdentity(options.appDir ?? process.cwd());
    return normalizeDefaultApp({
      id: options.appId ?? inferred.appId,
      name: options.appName,
      version: options.version
    });
  }

  return inferMobigentAppIdentity(options.appDir ?? process.cwd());
}

export function formatMobigentAppConfigModule(
  config: MobigentBackendAppConfig,
  options: { exportName?: string } = {}
) {
  const exportName = options.exportName ?? "mobigentConfig";
  assertValidExportName(exportName);

  return `import { defineMobigentConfig } from "@mobigent/app";

export const ${exportName} = defineMobigentConfig(${JSON.stringify(config, null, 2)});
`;
}

export function inferMobigentAppIdentity(startDir = process.cwd()): MobigentInferredAppIdentity {
  const projectName = findProjectName(startDir);

  return {
    appId: inferAppId(projectName),
    appName: inferAppName(projectName)
  };
}

export const mobigentBackend = {
  start: startMobigentBackend
};
export const startMobigent: typeof startMobigentBackend = startMobigentBackend;
export const createMobigentBackend: typeof startMobigentBackend = startMobigentBackend;

function listen(app: ReturnType<typeof createHttpApp>, port: number) {
  return new Promise<Server>((resolve, reject) => {
    const server = app.listen(port, () => resolve(server));
    server.once("error", reject);
  });
}

function assertValidExportName(value: string) {
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value)) {
    throw new Error(`Invalid Mobigent app config export name: ${value}`);
  }
}

function normalizeDefaultApp(app: MobigentBackendDefaultAppOptions): MobigentBackendAppConfigOptions {
  const appId = app.appId ?? app.id;

  if (!appId) {
    throw new Error("Mobigent backend app config requires appId or app.id.");
  }

  const appName = app.appName ?? app.name ?? inferAppNameFromId(appId);

  return {
    appId,
    appName,
    version: app.version,
    connectionUrl: app.connectionUrl,
    gatewayUrl: app.gatewayUrl,
    appToken: app.appToken,
    authToken: app.authToken
  };
}

function inferAppNameFromId(appId: string): string {
  return titleFromName(appId.split(".").filter(Boolean).at(-1) ?? appId);
}

function findProjectName(startDir: string): string {
  let dir = startDir;

  while (true) {
    const packageJsonPath = join(dir, "package.json");
    if (existsSync(packageJsonPath)) {
      try {
        const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { name?: unknown };
        if (typeof parsed.name === "string" && parsed.name.trim()) {
          return parsed.name;
        }
      } catch {
        break;
      }
    }

    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  return basename(startDir) || "mobigent-app";
}

function inferAppName(projectName: string): string {
  return titleFromName(projectName);
}

function inferAppId(projectName: string): string {
  const withoutNpmScope = projectName.replace(/^@/, "");
  const segments = withoutNpmScope
    .split(/[/.]+/)
    .flatMap((segment) => segment.split(/[-_\s]+/))
    .map((segment) => segment.toLowerCase().replace(/[^a-z0-9]+/g, ""))
    .filter(Boolean);

  return ["app", ...(segments.length > 0 ? segments : ["mobigent"])].join(".");
}

function titleFromName(value: string): string {
  const name = value
    .replace(/^@[^/]+\//, "")
    .replace(/[-_.]+/g, " ")
    .trim();

  return (name || "Mobigent App").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeAgentKind(kind: MobigentAgentKind): ProviderKind {
  switch (kind) {
    case "chatgpt":
    case "openapi-actions":
      return "chatgpt-actions";
    case "claude":
      return "claude-desktop";
    case "openai":
      return "openai-responses";
    case "openapi-agent":
      return "openapi";
    default:
      return kind;
  }
}

function resolveBackendToolName(
  tools: ReturnType<BridgeGateway["listTools"]>,
  name: string,
  defaultApp?: MobigentBackendAppConfig
) {
  return findBackendToolName(tools, name, defaultApp) ?? name;
}

function findBackendToolName(
  tools: ReturnType<BridgeGateway["listTools"]>,
  name: string,
  defaultApp?: MobigentBackendAppConfig
) {
  if (tools.some((tool) => tool.name === name)) {
    return name;
  }

  const candidates = createToolNameCandidates(name, defaultApp);
  for (const candidate of candidates) {
    if (tools.some((tool) => tool.name === candidate)) {
      return candidate;
    }
  }

  const matchingTools = tools.filter((tool) => candidates.some((candidate) => tool.name.endsWith(`.${candidate}`)));
  if (matchingTools.length === 1) {
    return matchingTools[0].name;
  }

  if (matchingTools.length > 1) {
    throw new Error(
      `Mobigent function name ${name} is ambiguous. Use one of: ${matchingTools.map((tool) => tool.name).join(", ")}`
    );
  }

  return undefined;
}

function createToolNameCandidates(name: string, defaultApp?: MobigentBackendAppConfig) {
  const capabilityNames = createCapabilityNameCandidates(name);
  const appPrefix = defaultApp ? sanitize(defaultApp.appId) : undefined;

  return [
    ...(appPrefix ? capabilityNames.map((capabilityName) => `${appPrefix}.${capabilityName}`) : []),
    ...capabilityNames
  ];
}

function createCapabilityNameCandidates(name: string) {
  const normalized = name.replace(/\s+/g, "").replace(/[.:/]+/g, "_");
  const candidates = [
    normalized,
    `get_${normalized}`,
    `show_${normalized}`
  ];

  return [...new Set(candidates)];
}

function stopBackend(server: Server, gateway: BridgeGateway) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      gateway.stop();
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function waitForBackendReady(gateway: BridgeGateway, options: MobigentBackendReadyOptions = {}) {
  const minApps = options.minApps ?? 1;
  const minFunctions = options.minFunctions ?? options.minTools ?? 1;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const intervalMs = options.intervalMs ?? 100;
  const startedAt = Date.now();

  return new Promise<ReturnType<BridgeGateway["getStatus"]>>((resolve, reject) => {
    let timer: NodeJS.Timeout | undefined;

    const check = () => {
      const status = gateway.getStatus();
      if (status.appsWithManifests >= minApps && status.tools >= minFunctions) {
        if (timer) {
          clearTimeout(timer);
        }
        resolve(status);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        reject(
          new Error(
              `Mobigent backend is waiting for ${minApps} connected app(s) and ${minFunctions} exposed function(s). ` +
              `Current state: ${status.appsWithManifests} app(s), ${status.tools} function(s). ` +
              "Start the app, wire it with createApp({ functions }).with(App), and make sure it uses the backend app config."
          )
        );
        return;
      }

      timer = setTimeout(check, intervalMs);
    };

    check();
  });
}

function waitForBackendFunction(
  gateway: BridgeGateway,
  name: string,
  defaultApp: MobigentBackendAppConfig | undefined,
  options: Pick<MobigentBackendReadyOptions, "timeoutMs" | "intervalMs"> = {}
) {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const intervalMs = options.intervalMs ?? 100;
  const startedAt = Date.now();

  return new Promise<string>((resolve, reject) => {
    let timer: NodeJS.Timeout | undefined;

    const check = () => {
      try {
        const toolName = findBackendToolName(gateway.listTools(), name, defaultApp);
        if (toolName) {
          if (timer) {
            clearTimeout(timer);
          }
          resolve(toolName);
          return;
        }
      } catch (error) {
        if (timer) {
          clearTimeout(timer);
        }
        reject(error);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        const status = gateway.getStatus();
        reject(
          new Error(
            `Mobigent backend is waiting for app function ${name}. ` +
              `Current state: ${status.appsWithManifests} app(s), ${status.tools} function(s). ` +
              "Start the app, wire it with createApp({ functions }).with(App), and make sure it uses the backend app config."
          )
        );
        return;
      }

      timer = setTimeout(check, intervalMs);
    };

    check();
  });
}
