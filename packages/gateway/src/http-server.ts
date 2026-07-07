#!/usr/bin/env node
import { BridgeGateway } from './BridgeGateway.js';
import { createHttpApp } from './http.js';
import { loadGatewayConfig, configDiagnostics } from './config.js';

const config = loadGatewayConfig();

if (config.env === 'production') {
  console.log('Mobigent Gateway starting in production mode.');
}

console.log('Gateway configuration:', configDiagnostics(config));

const gateway = new BridgeGateway({
  port: config.wsPort,
  authToken: config.authToken,
  auditLogPath: config.auditLogPath,
  idempotencyRecordTtlMs: config.idempotencyRecordTtlMs,
  cleanupIntervalMs: config.cleanupIntervalMs,
  auditRedactKeys: config.auditRedactKeys,
  manifestSigningSecret: config.manifestSigningSecret,
  allowedAppIds: config.allowedAppIds,
  agentProfiles: config.agentProfiles,
});
gateway.start();

const app = createHttpApp(gateway, {
  apiKey: config.httpApiKey,
  agentApiKeys: config.httpAgentApiKeys,
  corsOrigins: config.httpCorsOrigins,
  jsonBodyLimit: config.httpJsonBodyLimit,
  healthEndpoint: config.healthEndpoint,
  readyEndpoint: config.readyEndpoint,
  configEndpoint: config.configEndpoint,
  openApiEndpoint: config.openApiEndpoint,
  inspectorMode: config.inspectorMode,
});
const server = app.listen(config.httpPort, () => {
  console.log(`Mobigent HTTP API listening on http://localhost:${config.httpPort}`);
  console.log(`OpenAPI schema: http://localhost:${config.httpPort}/openapi.json`);
  if (config.httpApiKey) {
    console.log('HTTP API key auth is enabled.');
  }
  if (config.httpAgentApiKeys && Object.keys(config.httpAgentApiKeys).length) {
    console.log(
      `Per-agent HTTP API keys are enabled for: ${Object.keys(config.httpAgentApiKeys).join(', ')}`,
    );
  }
  if (config.httpCorsOrigins?.length) {
    console.log(`HTTP CORS origins are restricted to: ${config.httpCorsOrigins.join(', ')}`);
  }
  if (config.httpJsonBodyLimit) {
    console.log(`HTTP JSON body limit is ${config.httpJsonBodyLimit}.`);
  }
  if (config.auditLogPath) {
    console.log(`Audit events will be written to ${config.auditLogPath}.`);
  }
  if (config.auditRedactKeys?.length) {
    console.log(`Additional audit redaction keys: ${config.auditRedactKeys.join(', ')}`);
  }
  if (config.manifestSigningSecret) {
    console.log('Manifest signature verification is enabled.');
  }
  if (config.allowedAppIds?.length) {
    console.log(`App id allowlist is enabled: ${config.allowedAppIds.join(', ')}`);
  }
  if (config.agentProfiles && Object.keys(config.agentProfiles).length) {
    console.log(`Agent profiles are enabled for: ${Object.keys(config.agentProfiles).join(', ')}`);
  }
  console.log(`Endpoint policies — health:${config.healthEndpoint} ready:${config.readyEndpoint} config:${config.configEndpoint} openapi:${config.openApiEndpoint}`);
  console.log(`Inspector mode: ${config.inspectorMode}`);
});

process.on('SIGINT', () => {
  server.close();
  gateway.stop();
});

process.on('SIGTERM', () => {
  server.close();
  gateway.stop();
});
