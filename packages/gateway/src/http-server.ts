#!/usr/bin/env node
import { BridgeGateway, type AgentProfile } from "./BridgeGateway.js";
import { createHttpApp } from "./http.js";

const bridgePort = Number(process.env.MOBIGENT_WS_PORT ?? 8787);
const httpPort = Number(process.env.MOBIGENT_HTTP_PORT ?? 8788);
const authToken = process.env.MOBIGENT_AUTH_TOKEN;
const httpApiKey = process.env.MOBIGENT_HTTP_API_KEY;
const httpAgentApiKeys = process.env.MOBIGENT_HTTP_AGENT_API_KEYS
  ? parseStringMap(process.env.MOBIGENT_HTTP_AGENT_API_KEYS, "MOBIGENT_HTTP_AGENT_API_KEYS")
  : undefined;
const httpJsonBodyLimit = process.env.MOBIGENT_HTTP_JSON_LIMIT;
const httpCorsOrigins = process.env.MOBIGENT_HTTP_CORS_ORIGINS
  ?.split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const auditLogPath = process.env.MOBIGENT_AUDIT_LOG_PATH;
const idempotencyRecordTtlMs = process.env.MOBIGENT_IDEMPOTENCY_RECORD_TTL_MS
  ? Number(process.env.MOBIGENT_IDEMPOTENCY_RECORD_TTL_MS)
  : undefined;
const cleanupIntervalMs = process.env.MOBIGENT_CLEANUP_INTERVAL_MS
  ? Number(process.env.MOBIGENT_CLEANUP_INTERVAL_MS)
  : undefined;
const manifestSigningSecret = process.env.MOBIGENT_MANIFEST_SIGNING_SECRET;
const allowedAppIds = process.env.MOBIGENT_ALLOWED_APP_IDS
  ?.split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const auditRedactKeys = process.env.MOBIGENT_AUDIT_REDACT_KEYS
  ?.split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const agentProfiles = process.env.MOBIGENT_AGENT_PROFILES
  ? parseAgentProfiles(process.env.MOBIGENT_AGENT_PROFILES)
  : undefined;

const gateway = new BridgeGateway({
  port: bridgePort,
  authToken,
  auditLogPath,
  idempotencyRecordTtlMs,
  cleanupIntervalMs,
  auditRedactKeys,
  manifestSigningSecret,
  allowedAppIds,
  agentProfiles
});
gateway.start();

const app = createHttpApp(gateway, {
  apiKey: httpApiKey,
  agentApiKeys: httpAgentApiKeys,
  corsOrigins: httpCorsOrigins,
  jsonBodyLimit: httpJsonBodyLimit
});
const server = app.listen(httpPort, () => {
  console.log(`Mobigent HTTP API listening on http://localhost:${httpPort}`);
  console.log(`OpenAPI schema: http://localhost:${httpPort}/openapi.json`);
  if (httpApiKey) {
    console.log("HTTP API key auth is enabled.");
  }
  if (httpAgentApiKeys && Object.keys(httpAgentApiKeys).length) {
    console.log(`Per-agent HTTP API keys are enabled for: ${Object.keys(httpAgentApiKeys).join(", ")}`);
  }
  if (httpCorsOrigins?.length) {
    console.log(`HTTP CORS origins are restricted to: ${httpCorsOrigins.join(", ")}`);
  }
  if (httpJsonBodyLimit) {
    console.log(`HTTP JSON body limit is ${httpJsonBodyLimit}.`);
  }
  if (auditLogPath) {
    console.log(`Audit events will be written to ${auditLogPath}.`);
  }
  if (auditRedactKeys?.length) {
    console.log(`Additional audit redaction keys: ${auditRedactKeys.join(", ")}`);
  }
  if (manifestSigningSecret) {
    console.log("Manifest signature verification is enabled.");
  }
  if (allowedAppIds?.length) {
    console.log(`App id allowlist is enabled: ${allowedAppIds.join(", ")}`);
  }
  if (agentProfiles && Object.keys(agentProfiles).length) {
    console.log(`Agent profiles are enabled for: ${Object.keys(agentProfiles).join(", ")}`);
  }
});

process.on("SIGINT", () => {
  server.close();
  gateway.stop();
});

process.on("SIGTERM", () => {
  server.close();
  gateway.stop();
});

function parseAgentProfiles(raw: string): Record<string, AgentProfile> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("value must be a JSON object");
    }

    return parsed as Record<string, AgentProfile>;
  } catch (error) {
    throw new Error(
      `MOBIGENT_AGENT_PROFILES must be valid JSON. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function parseStringMap(raw: string, envName: string): Record<string, string> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("value must be a JSON object");
    }

    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== "string" || !value) {
        throw new Error(`${key} must map to a non-empty string`);
      }
    }

    return parsed as Record<string, string>;
  } catch (error) {
    throw new Error(`${envName} must be valid JSON. ${error instanceof Error ? error.message : String(error)}`);
  }
}
