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

export type MobigentBackend = {
  gateway: BridgeGateway;
  httpServer: Server;
  urls: {
    websocket: string;
    http: string;
    inspector: string;
    openapi: string;
  };
  stop(): Promise<void>;
  tools(): ReturnType<BridgeGateway["listTools"]>;
  apps(): GatewayAppSession[];
  call(toolName: string, input?: unknown, options?: ToolCallOptions): ReturnType<BridgeGateway["callTool"]>;
};

export async function startMobigentBackend(options: MobigentBackendOptions = {}): Promise<MobigentBackend> {
  const wsPort = options.wsPort ?? Number(process.env.MOBIGENT_WS_PORT ?? 8787);
  const httpPort = options.httpPort ?? Number(process.env.MOBIGENT_HTTP_PORT ?? 8788);
  const host = options.host ?? "localhost";
  const gateway = new BridgeGateway({
    port: wsPort,
    authToken: options.authToken ?? process.env.MOBIGENT_AUTH_TOKEN,
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

  return {
    gateway,
    httpServer,
    urls,
    stop: () => stopBackend(httpServer, gateway),
    tools: () => gateway.listTools(),
    apps: () => gateway.listApps(),
    call: (toolName, input = {}, callOptions) => gateway.callTool(toolName, input as JsonObject, callOptions)
  };
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
