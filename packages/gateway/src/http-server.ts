#!/usr/bin/env node
import { BridgeGateway } from './BridgeGateway.js';
import { createHttpApp } from './http.js';
import { loadGatewayConfig, configDiagnostics } from './config.js';
import { createConsoleLogger } from './logger.js';
import { createTelemetry, createGatewayMetrics } from './telemetry.js';
import type { Request, Response, NextFunction } from 'express';

const config = loadGatewayConfig();
const logger = createConsoleLogger(config.logLevel);

logger.info('Mobigent Gateway starting', {
  eventType: 'gateway.starting',
  context: { env: config.env, version: '0.1.15' },
});

logger.info('Gateway configuration loaded', {
  eventType: 'config.loaded',
  context: configDiagnostics(config),
});

// ---------------------------------------------------------------------------
// OpenTelemetry auto-detection
// ---------------------------------------------------------------------------

let telemetryMetrics: ReturnType<typeof createGatewayMetrics> | undefined;

createTelemetry()
  .then(({ telemetry, metrics }) => {
    logger.info('OpenTelemetry auto-detected and initialized', {
      eventType: 'telemetry.initialized',
    });
    // Metrics are available for the gateway to use.
    // The Telemetry object can be passed to BridgeGateway or HTTP middleware
    // for trace context propagation.
    telemetryMetrics = metrics;
  })
  .catch(() => {
    logger.debug('OpenTelemetry not available — running without traces/metrics.', {
      eventType: 'telemetry.unavailable',
    });
  });

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
  logger,
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

// Track in-flight requests for graceful shutdown
let inFlight = 0;

app.use((_req: Request, _res: Response, next: NextFunction) => {
  inFlight++;
  _res.on('finish', () => {
    inFlight--;
  });
  next();
});

const server = app.listen(config.httpPort, () => {
  logger.info(`HTTP API listening on http://localhost:${config.httpPort}`, {
    eventType: 'http.started',
    context: {
      httpPort: config.httpPort,
      wsPort: config.wsPort,
      openApiPath: '/openapi.json',
    },
  });

  if (config.httpApiKey) {
    logger.info('HTTP API key auth is enabled', { eventType: 'config.auth.http_api_key' });
  }
  if (config.httpAgentApiKeys && Object.keys(config.httpAgentApiKeys).length) {
    logger.info(
      `Per-agent HTTP API keys enabled for: ${Object.keys(config.httpAgentApiKeys).join(', ')}`,
      { eventType: 'config.auth.agent_api_keys' },
    );
  }
  if (config.httpCorsOrigins?.length) {
    logger.info(`HTTP CORS restricted to: ${config.httpCorsOrigins.join(', ')}`, {
      eventType: 'config.cors',
    });
  }
  if (config.httpJsonBodyLimit) {
    logger.info(`HTTP JSON body limit: ${config.httpJsonBodyLimit}`, {
      eventType: 'config.json_limit',
    });
  }
  if (config.auditLogPath) {
    logger.info(`Audit events → ${config.auditLogPath}`, {
      eventType: 'config.audit_log',
    });
  }
  if (config.auditRedactKeys?.length) {
    logger.info(`Additional audit redaction keys: ${config.auditRedactKeys.join(', ')}`, {
      eventType: 'config.audit_redaction',
    });
  }
  if (config.manifestSigningSecret) {
    logger.info('Manifest signature verification enabled', {
      eventType: 'config.manifest_signing',
    });
  }
  if (config.allowedAppIds?.length) {
    logger.info(`App id allowlist: ${config.allowedAppIds.join(', ')}`, {
      eventType: 'config.app_allowlist',
    });
  }
  if (config.agentProfiles && Object.keys(config.agentProfiles).length) {
    logger.info(`Agent profiles enabled for: ${Object.keys(config.agentProfiles).join(', ')}`, {
      eventType: 'config.agent_profiles',
    });
  }
  logger.info(
    `Endpoint policies — health:${config.healthEndpoint} ready:${config.readyEndpoint} config:${config.configEndpoint} openapi:${config.openApiEndpoint}`,
    {
      eventType: 'config.endpoint_policies',
    },
  );
  logger.info(`Inspector mode: ${config.inspectorMode}`, {
    eventType: 'config.inspector_mode',
  });
});

// ---------------------------------------------------------------------------
// Graceful shutdown with drain
// ---------------------------------------------------------------------------

const SHUTDOWN_DRAIN_TIMEOUT_MS = 30_000;

function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}, initiating graceful shutdown...`, {
    eventType: 'gateway.shutdown.initiated',
  });

  // Stop accepting new HTTP connections
  server.close((err) => {
    if (err) {
      logger.error('Error closing HTTP server', {
        eventType: 'gateway.shutdown.error',
        errorCode: 'HTTP_CLOSE_ERROR',
      });
    }
  });

  // Stop accepting new WebSocket connections
  gateway.stop();

  // Wait for in-flight requests to drain
  const drainStart = Date.now();
  const checkDrain = setInterval(() => {
    if (inFlight <= 0) {
      clearInterval(checkDrain);
      logger.info('All in-flight requests drained, exiting.', {
        eventType: 'gateway.shutdown.complete',
        context: { drainMs: Date.now() - drainStart },
      });
      process.exit(0);
    }
    if (Date.now() - drainStart >= SHUTDOWN_DRAIN_TIMEOUT_MS) {
      clearInterval(checkDrain);
      logger.warn(`Shutdown drain timeout after ${SHUTDOWN_DRAIN_TIMEOUT_MS}ms, forcing exit.`, {
        eventType: 'gateway.shutdown.drain_timeout',
        errorCode: 'DRAIN_TIMEOUT',
        context: { inFlight },
      });
      process.exit(1);
    }
  }, 100);

  // Failsafe: force exit after drain timeout + buffer
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.', {
      eventType: 'gateway.shutdown.forced',
      errorCode: 'FORCED_SHUTDOWN',
    });
    process.exit(1);
  }, SHUTDOWN_DRAIN_TIMEOUT_MS + 5_000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
