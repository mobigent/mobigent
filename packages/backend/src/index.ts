import type { Server } from "node:http";
import {
  BridgeGateway,
  createHttpApp,
  type AgentProfile,
  type GatewayAppSession,
  type ToolCallOptions
} from "@mobigent/gateway";
import type { JsonObject } from "@mobigent/core";
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
};

export type MobigentBackendDefaultAppOptions = {
  id?: string;
  name?: string;
  appId?: string;
  appName?: string;
  version?: string;
  gatewayUrl?: string;
  appToken?: string;
  authToken?: string;
};

export type MobigentBackendAppConfigOptions = {
  appId: string;
  appName: string;
  version?: string;
  gatewayUrl?: string;
  appToken?: string;
  authToken?: string;
};

export type MobigentBackendAppConfig = {
  appId: string;
  appName: string;
  gatewayUrl: string;
  version?: string;
  authToken?: string;
};

export type MobigentBackendAppConfigModuleOptions = MobigentBackendAppConfigOptions & {
  exportName?: string;
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
  gateway: BridgeGateway;
  httpServer: Server;
  urls: {
    websocket: string;
    http: string;
    inspector: string;
    openapi: string;
  };
  app(options: MobigentBackendAppConfigOptions): MobigentBackendAppConfig;
  appConfig(options: MobigentBackendAppConfigOptions): MobigentBackendAppConfig;
  appConfigModule(options: MobigentBackendAppConfigModuleOptions): string;
  agent(kind?: MobigentAgentKind, options?: MobigentAgentOptions): ProviderBundle;
  agents(options?: MobigentAgentOptions): ProviderBundle[];
  defaultApp?: MobigentBackendAppConfig;
  appConfigCode?: string;
  copyAppConfig(): string;
  stop(): Promise<void>;
  tools(): ReturnType<BridgeGateway["listTools"]>;
  apps(): GatewayAppSession[];
  call(toolName: string, input?: unknown, options?: ToolCallOptions): ReturnType<BridgeGateway["callTool"]>;
};

export type MobigentBackendWithApp = MobigentBackend & {
  defaultApp: MobigentBackendAppConfig;
  appConfigCode: string;
};

export type MobigentBackendOptionsWithApp = MobigentBackendOptions & {
  app: MobigentBackendDefaultAppOptions;
};

export async function startMobigentBackend(options: MobigentBackendOptionsWithApp): Promise<MobigentBackendWithApp>;
export async function startMobigentBackend(options?: MobigentBackendOptions): Promise<MobigentBackend>;
export async function startMobigentBackend(options: MobigentBackendOptions = {}): Promise<MobigentBackend> {
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
    gatewayUrl: appOptions.gatewayUrl ?? urls.websocket,
    version: appOptions.version,
    authToken: appOptions.appToken ?? appOptions.authToken ?? appToken
  });
  const appConfigModule = (appOptions: MobigentBackendAppConfigModuleOptions) =>
    formatMobigentAppConfigModule(appConfig(appOptions), {
      exportName: appOptions.exportName
    });
  const defaultApp = options.app ? appConfig(normalizeDefaultApp(options.app)) : undefined;
  const appConfigCode = defaultApp ? formatMobigentAppConfigModule(defaultApp) : undefined;
  const createAgentCatalog = (agentOptions: MobigentAgentOptions = {}) => createProviderCatalog({
    mcp: {
      command: "mobigent-mcp"
    },
    openApi: {
      baseUrl: agentOptions.publicUrl ?? agentOptions.baseUrl ?? urls.http,
      auth: agentOptions.auth ?? (options.apiKey || process.env.MOBIGENT_HTTP_API_KEY ? "api-key" : "none")
    }
  });

  return {
    gateway,
    httpServer,
    urls,
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
    copyAppConfig: () => {
      if (appConfigCode) {
        return appConfigCode;
      }
      return formatMobigentAppConfigModule(
        appConfig({
          appId: "com.example.app",
          appName: "Example App"
        })
      );
    },
    stop: () => stopBackend(httpServer, gateway),
    tools: () => gateway.listTools(),
    apps: () => gateway.listApps(),
    call: (toolName, input = {}, callOptions) => gateway.callTool(toolName, input as JsonObject, callOptions)
  };
}

export function formatMobigentAppConfigModule(
  config: MobigentBackendAppConfig,
  options: { exportName?: string } = {}
) {
  const exportName = options.exportName ?? "mobigentConfig";
  assertValidExportName(exportName);

  return `import { defineMobigentConfig } from "@mobigent/react-native";

export const ${exportName} = defineMobigentConfig(${JSON.stringify(config, null, 2)});
`;
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
  const appName = app.appName ?? app.name;

  if (!appId || !appName) {
    throw new Error("Mobigent backend app config requires app.id/appId and app.name/appName.");
  }

  return {
    appId,
    appName,
    version: app.version,
    gatewayUrl: app.gatewayUrl,
    appToken: app.appToken,
    authToken: app.authToken
  };
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
