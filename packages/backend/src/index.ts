import type { Server } from "node:http";
import {
  BridgeGateway,
  createHttpApp,
  type AgentProfile,
  type GatewayAppSession,
  type ToolCallOptions
} from "@mobigent/gateway";
import type { JsonObject } from "@mobigent/core";

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
  stop(): Promise<void>;
  tools(): ReturnType<BridgeGateway["listTools"]>;
  apps(): GatewayAppSession[];
  call(toolName: string, input?: unknown, options?: ToolCallOptions): ReturnType<BridgeGateway["callTool"]>;
};

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

  return {
    gateway,
    httpServer,
    urls,
    app: appConfig,
    appConfig,
    appConfigModule,
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
