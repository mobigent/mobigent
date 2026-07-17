import cors from 'cors';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import type { JsonSchema, ToolDescriptor } from '@mobigent/core';
import { sanitize, validateJsonSchema } from '@mobigent/core';
import { createProviderCatalog } from '@mobigent/providers';
import { BridgeGateway } from './BridgeGateway.js';

const callBodySchema = z.record(z.string(), z.unknown()).default({});
const positiveIntegerSchema = z.coerce.number().int().positive().max(120_000);

type GatewayHttpErrorCode =
  | 'bad_request'
  | 'conflict'
  | 'forbidden'
  | 'invalid_input'
  | 'not_found'
  | 'payload_too_large'
  | 'rate_limited'
  | 'timeout'
  | 'unauthorized'
  | 'upstream_error';

export type MobigentHttpOptions = {
  apiKey?: string;
  agentApiKeys?: Record<string, string>;
  corsOrigins?: string | string[];
  jsonBodyLimit?: string | number;
  /** Endpoint exposure policy for /health (default: public). */
  healthEndpoint?: 'public' | 'protected' | 'disabled';
  /** Endpoint exposure policy for /ready (default: public). */
  readyEndpoint?: 'public' | 'protected' | 'disabled';
  /** Endpoint exposure policy for /config (default: public). */
  configEndpoint?: 'public' | 'protected' | 'disabled';
  /** Endpoint exposure policy for /openapi.json (default: public). */
  openApiEndpoint?: 'public' | 'protected' | 'disabled';
  /** Inspector access mode (default: enabled). */
  inspectorMode?: 'enabled' | 'disabled' | 'protected' | 'internal';
  /** Max authenticated HTTP requests per credential/IP per minute (default: 120). */
  httpRateLimitPerMinute?: number;
};

export type MobigentGatewayConfig = {
  name: 'Mobigent Gateway';
  version: string;
  baseUrl: string;
  protocol: {
    currentVersion: number;
    supportedVersions: number[];
  };
  auth: {
    required: boolean;
    schemes: Array<'bearer' | 'api-key'>;
    apiKeyHeader: 'x-mobigent-api-key';
    bearerHeader: 'authorization';
  };
  endpoints: {
    health: '/health';
    ready: '/ready';
    config: '/config';
    agents: '/agents';
    apps: '/apps';
    providers: '/providers';
    snapshot: '/snapshot';
    tools: '/tools';
    toolStream: '/tools/stream';
    toolLookupTemplate: '/tools/{toolName}';
    metrics: '/metrics';
    prometheusMetrics: '/metrics/prometheus';
    audit: '/audit';
    auditStream: '/audit/stream';
    inspector: '/inspect';
    openApi: '/openapi.json';
    toolCallTemplate: '/tools/{toolName}/call';
  };
  features: {
    dynamicTools: true;
    toolStreaming: true;
    auditStreaming: true;
    appSessionDiscovery: true;
    providerCatalog: true;
    providerSnapshot: true;
    openApiSchema: true;
    perCallTimeouts: true;
    idempotencyKeys: true;
    requestIds: true;
    agentVisibility: true;
    agentScopedDiscovery: true;
    agentProfiles: true;
  };
  limits: {
    jsonBodyLimit: string | number;
    maxTimeoutMs: number;
  };
  headers: {
    agentId: 'x-mobigent-agent';
    idempotencyKey: 'x-mobigent-idempotency-key';
    requestId: 'x-mobigent-request-id';
    timeoutMs: 'x-mobigent-timeout-ms';
  };
};

export function createHttpApp(gateway: BridgeGateway, options: MobigentHttpOptions = {}): Express {
  const app = express();

  app.use(cors(createCorsOptions(options.corsOrigins)));
  app.use(createHttpRateLimiter(options.httpRateLimitPerMinute ?? 120));
  app.use(express.json({ limit: options.jsonBodyLimit ?? '1mb' }));
  app.use(handleJsonBodyError);

  // Endpoint policy and auth middleware. Must run before route handlers.
  app.use((req, res, next) => {
    const policy = getEndpointPolicy(req.path, options);

    if (policy === 'disabled') {
      res.status(404).json({
        ...gatewayErrorBody('not_found', 'Endpoint is disabled in this deployment.'),
      });
      return;
    }

    if (policy === 'protected') {
      const auth = authorizeHttpRequest(
        req.header('authorization'),
        req.header('x-mobigent-api-key'),
        options,
      );
      if (!auth.ok) {
        res.status(401).json({
          ...gatewayErrorBody('unauthorized', 'Missing or invalid Mobigent HTTP API key.'),
        });
        return;
      }
      if (auth.agentId) {
        const requestedAgentId = req.header('x-mobigent-agent');
        if (requestedAgentId && requestedAgentId !== auth.agentId) {
          res.status(403).json({
            ...gatewayErrorBody(
              'forbidden',
              `Mobigent API key is bound to agent "${auth.agentId}", not "${requestedAgentId}".`,
            ),
          });
          return;
        }
        res.locals.mobigentAgentId = auth.agentId;
      }
    }

    next();
  });

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      name: 'Mobigent Gateway',
      status: gateway.getStatus(),
    });
  });

  app.get('/ready', (req, res) => {
    const parsedMinApps = req.query.minApps
      ? positiveIntegerSchema.safeParse(req.query.minApps)
      : undefined;
    const parsedMinTools = req.query.minTools
      ? positiveIntegerSchema.safeParse(req.query.minTools)
      : undefined;
    const parsedMinFunctions = req.query.minFunctions
      ? positiveIntegerSchema.safeParse(req.query.minFunctions)
      : undefined;

    if (parsedMinApps && !parsedMinApps.success) {
      res.status(400).json({
        ...gatewayErrorBody(
          'bad_request',
          'minApps must be a positive integer no larger than 120000.',
        ),
      });
      return;
    }

    if (parsedMinTools && !parsedMinTools.success) {
      res.status(400).json({
        ...gatewayErrorBody(
          'bad_request',
          'minTools must be a positive integer no larger than 120000.',
        ),
      });
      return;
    }

    if (parsedMinFunctions && !parsedMinFunctions.success) {
      res.status(400).json({
        ...gatewayErrorBody(
          'bad_request',
          'minFunctions must be a positive integer no larger than 120000.',
        ),
      });
      return;
    }

    const readiness = createReadiness(gateway.getStatus(), {
      minApps: parsedMinApps?.data ?? 0,
      minTools: parsedMinFunctions?.data ?? parsedMinTools?.data ?? 0,
    });
    res.status(readiness.ok ? 200 : 503).json(readiness);
  });

  app.get('/config', (req, res) => {
    res.json(createGatewayConfig(requestBaseUrl(req), options));
  });

  app.get('/agents', (req, res) => {
    res.json({
      agents: gateway.listAgentVisibility(readAgentIds(req.query.agentId)),
    });
  });

  app.get('/tools', (req, res) => {
    res.json({
      tools: gateway.listToolsForAgent(agentIdFromRequest(req, res)),
    });
  });

  app.get('/tools/stream', (req, res) => {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    });
    res.write(': connected\n\n');
    writeSseEvent(res, 'tools', {
      reason: 'snapshot',
      tools: gateway.listToolsForAgent(agentIdFromRequest(req, res)),
    });

    const unsubscribe = gateway.onToolsChanged(() => {
      writeSseEvent(res, 'tools', {
        reason: 'changed',
        tools: gateway.listToolsForAgent(agentIdFromRequest(req, res)),
      });
    });

    req.on('close', unsubscribe);
  });

  app.get('/tools/:toolName', (req, res) => {
    const tool = gateway.listTools().find((candidate) => candidate.name === req.params.toolName);
    if (!tool) {
      res.status(404).json({
        ...gatewayErrorBody('not_found', `No connected app exposes tool: ${req.params.toolName}`),
      });
      return;
    }

    try {
      gateway.assertToolAgentAllowed(req.params.toolName, agentIdFromRequest(req, res));
    } catch (error) {
      res.status(403).json(gatewayErrorBody('forbidden', errorMessage(error)));
      return;
    }

    res.json({ tool });
  });

  app.get('/apps', (_req, res) => {
    res.json({
      apps: gateway.listApps(),
    });
  });

  app.get('/providers', (req, res) => {
    const baseUrl = requestBaseUrl(req);
    res.json({
      providers: createProviderCatalog({
        openApi: {
          baseUrl,
          schemaPath: '/openapi.json',
          auth: hasHttpAuth(options) ? 'bearer' : 'none',
        },
      }),
    });
  });

  app.get('/snapshot', (req, res) => {
    const baseUrl = requestBaseUrl(req);
    const agentId = agentIdFromRequest(req, res);
    const config = createGatewayConfig(baseUrl, options);
    const providers = createProviderCatalog({
      openApi: {
        baseUrl,
        schemaPath: '/openapi.json',
        auth: hasHttpAuth(options) ? 'bearer' : 'none',
      },
    });
    const status = gateway.getStatus();

    res.json({
      at: new Date().toISOString(),
      agentId,
      config,
      health: {
        ok: true,
        name: 'Mobigent Gateway',
        status,
      },
      readiness: createReadiness(status, { minApps: 0, minTools: 0 }),
      apps: gateway.listApps(),
      agents: gateway.listAgentVisibility(agentId ? [agentId] : undefined),
      providers,
      tools: gateway.listToolsForAgent(agentId),
      metrics: gateway.getMetrics(),
      audit: gateway.getAuditLog(25),
    });
  });

  app.get('/inspect', (_req, res) => {
    res.type('html').send(renderInspectorHtml());
  });

  app.get('/metrics', (_req, res) => {
    res.json({
      metrics: gateway.getMetrics(),
    });
  });

  app.get('/metrics/prometheus', (_req, res) => {
    res.type('text/plain; version=0.0.4; charset=utf-8');
    res.send(renderPrometheusMetrics(gateway.getMetrics()));
  });

  app.get('/audit', (req, res) => {
    const parsedLimit = req.query.limit
      ? positiveIntegerSchema.safeParse(req.query.limit)
      : undefined;

    if (parsedLimit && !parsedLimit.success) {
      res.status(400).json({
        ...gatewayErrorBody(
          'bad_request',
          'limit must be a positive integer no larger than 120000.',
        ),
      });
      return;
    }

    res.json({
      events: gateway.getAuditLog(parsedLimit?.data),
    });
  });

  app.get('/audit/stream', (req, res) => {
    const parsedReplay = req.query.replay
      ? positiveIntegerSchema.safeParse(req.query.replay)
      : undefined;

    if (parsedReplay && !parsedReplay.success) {
      res.status(400).json({
        ...gatewayErrorBody(
          'bad_request',
          'replay must be a positive integer no larger than 120000.',
        ),
      });
      return;
    }

    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    });
    res.write(': connected\n\n');

    if (parsedReplay?.data) {
      for (const event of gateway.getAuditLog(parsedReplay.data)) {
        writeSseEvent(res, 'audit', event);
      }
    }

    const unsubscribe = gateway.onAudit((event) => {
      writeSseEvent(res, 'audit', event);
    });

    req.on('close', unsubscribe);
  });

  app.post('/tools/:toolName/call', async (req, res) => {
    const parsed = callBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        ...gatewayErrorBody('bad_request', 'Request body must be a JSON object.'),
      });
      return;
    }

    const input = parsed.data;

    try {
      const parsedTimeout = req.header('x-mobigent-timeout-ms')
        ? positiveIntegerSchema.safeParse(req.header('x-mobigent-timeout-ms'))
        : undefined;

      if (parsedTimeout && !parsedTimeout.success) {
        res.status(400).json({
          ...gatewayErrorBody(
            'bad_request',
            'x-mobigent-timeout-ms must be a positive integer no larger than 120000.',
          ),
        });
        return;
      }

      const tool = gateway.listTools().find((candidate) => candidate.name === req.params.toolName);
      if (tool) {
        gateway.assertToolAgentAllowed(req.params.toolName, agentIdFromRequest(req, res));

        const validation = validateJsonSchema(tool.inputSchema, input);
        if (!validation.ok) {
          res.status(400).json({
            ...gatewayErrorBody(
              'invalid_input',
              `Invalid tool input: ${validation.errors.join('; ')}`,
            ),
          });
          return;
        }
      }

      const result = await gateway.callTool(req.params.toolName, input, {
        agentId: agentIdFromRequest(req, res),
        idempotencyKey: req.header('x-mobigent-idempotency-key') ?? undefined,
        timeoutMs: parsedTimeout?.data,
        requestId: req.header('x-mobigent-request-id') ?? undefined,
      });
      res.json({
        tool: req.params.toolName,
        result,
      });
    } catch (error) {
      const gatewayError = classifyGatewayHttpError(error);
      res
        .status(gatewayError.status)
        .json(gatewayErrorBody(gatewayError.code, errorMessage(error)));
    }
  });

  app.get('/openapi.json', (req, res) => {
    const baseUrl = requestBaseUrl(req);
    res.json(
      createOpenApiSpec(baseUrl, gateway.listToolsForAgent(agentIdFromRequest(req, res)), {
        requireAuth: hasHttpAuth(options),
      }),
    );
  });

  return app;
}

function handleJsonBodyError(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (isPayloadTooLargeError(error)) {
    res.status(413).json({
      ...gatewayErrorBody(
        'payload_too_large',
        'Request body is larger than the configured Mobigent HTTP JSON limit.',
      ),
    });
    return;
  }

  if (isJsonSyntaxError(error)) {
    res.status(400).json({
      ...gatewayErrorBody('bad_request', 'Request body must be valid JSON.'),
    });
    return;
  }

  next(error);
}

function gatewayErrorBody(code: GatewayHttpErrorCode, error: string) {
  return {
    code,
    error,
    retryable: isRetryableGatewayErrorCode(code),
  };
}

function classifyGatewayHttpError(error: unknown): { code: GatewayHttpErrorCode; status: number } {
  const message = errorMessage(error).toLowerCase();

  if (message.includes('no connected app exposes tool')) {
    return { code: 'not_found', status: 404 };
  }
  if (
    message.includes('not allowed') ||
    message.includes('profile denies') ||
    message.includes('profile does not allow') ||
    message.includes('read-only')
  ) {
    return { code: 'forbidden', status: 403 };
  }
  if (message.includes('rate limit exceeded')) {
    return { code: 'rate_limited', status: 429 };
  }
  if (message.includes('timed out')) {
    return { code: 'timeout', status: 504 };
  }
  if (message.includes('idempotency key')) {
    return { code: 'conflict', status: 409 };
  }

  return { code: 'upstream_error', status: 502 };
}

function isRetryableGatewayErrorCode(code: GatewayHttpErrorCode) {
  return code === 'rate_limited' || code === 'timeout' || code === 'upstream_error';
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isPayloadTooLargeError(error: unknown): boolean {
  return isErrorWithType(error) && error.type === 'entity.too.large';
}

function isJsonSyntaxError(error: unknown): boolean {
  return isErrorWithType(error) && error.type === 'entity.parse.failed';
}

function isErrorWithType(error: unknown): error is Error & { type: string } {
  return (
    error instanceof Error &&
    'type' in error &&
    typeof (error as { type?: unknown }).type === 'string'
  );
}

export type OpenApiSpecOptions = {
  requireAuth?: boolean;
};

export function createGatewayConfig(
  baseUrl = 'http://localhost:8788',
  options: MobigentHttpOptions = {},
): MobigentGatewayConfig {
  return {
    name: 'Mobigent Gateway',
    version: '0.1.15',
    baseUrl,
    protocol: {
      currentVersion: 1,
      supportedVersions: [1],
    },
    auth: {
      required: hasHttpAuth(options),
      schemes: ['bearer', 'api-key'],
      apiKeyHeader: 'x-mobigent-api-key',
      bearerHeader: 'authorization',
    },
    endpoints: {
      health: '/health',
      ready: '/ready',
      config: '/config',
      agents: '/agents',
      apps: '/apps',
      providers: '/providers',
      snapshot: '/snapshot',
      tools: '/tools',
      toolStream: '/tools/stream',
      toolLookupTemplate: '/tools/{toolName}',
      metrics: '/metrics',
      prometheusMetrics: '/metrics/prometheus',
      audit: '/audit',
      auditStream: '/audit/stream',
      inspector: '/inspect',
      openApi: '/openapi.json',
      toolCallTemplate: '/tools/{toolName}/call',
    },
    features: {
      dynamicTools: true,
      toolStreaming: true,
      auditStreaming: true,
      appSessionDiscovery: true,
      providerCatalog: true,
      providerSnapshot: true,
      openApiSchema: true,
      perCallTimeouts: true,
      idempotencyKeys: true,
      requestIds: true,
      agentVisibility: true,
      agentScopedDiscovery: true,
      agentProfiles: true,
    },
    limits: {
      jsonBodyLimit: options.jsonBodyLimit ?? '1mb',
      maxTimeoutMs: 120_000,
    },
    headers: {
      agentId: 'x-mobigent-agent',
      idempotencyKey: 'x-mobigent-idempotency-key',
      requestId: 'x-mobigent-request-id',
      timeoutMs: 'x-mobigent-timeout-ms',
    },
  };
}

function renderInspectorHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mobigent Inspector</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; background: #f8fafc; color: #0f172a; }
    main { max-width: 1180px; margin: 0 auto; padding: 32px 20px 48px; }
    header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 46px); letter-spacing: 0; }
    h2 { margin: 0 0 12px; font-size: 16px; }
    button { border: 1px solid #cbd5e1; background: white; border-radius: 8px; padding: 9px 12px; color: #0f172a; cursor: pointer; }
    button:hover { border-color: #3157ff; }
    .grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; }
    .panel { grid-column: span 6; border: 1px solid #e2e8f0; background: rgba(255,255,255,.82); border-radius: 12px; padding: 16px; box-shadow: 0 18px 40px rgba(15,23,42,.08); backdrop-filter: blur(18px); }
    .wide { grid-column: span 12; }
    .metric { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
    .metric div { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: white; }
    .label { display: block; font-size: 12px; color: #64748b; }
    .value { display: block; margin-top: 4px; font-size: 22px; font-weight: 700; }
    pre { overflow: auto; max-height: 360px; margin: 0; padding: 12px; border-radius: 10px; background: #0f172a; color: #e2e8f0; font-size: 12px; }
    ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
    li { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; background: white; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .muted { color: #64748b; }
    .error { color: #b91c1c; }
    @media (max-width: 760px) { .panel { grid-column: span 12; } .metric { grid-template-columns: repeat(2, minmax(0, 1fr)); } header { align-items: flex-start; flex-direction: column; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <p class="muted">Local gateway workspace</p>
        <h1>Mobigent Inspector</h1>
      </div>
      <button id="refresh" type="button">Refresh</button>
    </header>
    <section class="grid">
      <article class="panel wide">
        <h2>Gateway</h2>
        <div class="metric" id="metrics"></div>
      </article>
      <article class="panel">
        <h2>Connected Apps</h2>
        <ul id="apps"><li class="muted">Loading...</li></ul>
      </article>
      <article class="panel">
        <h2>Tools</h2>
        <ul id="tools"><li class="muted">Loading...</li></ul>
      </article>
      <article class="panel wide">
        <h2>Recent Audit Events</h2>
        <pre id="audit">Loading...</pre>
      </article>
      <article class="panel wide">
        <h2>Snapshot JSON</h2>
        <pre id="snapshot">Loading...</pre>
      </article>
    </section>
  </main>
  <script>
    const json = (value) => JSON.stringify(value, null, 2);
    const text = (value) => String(value ?? "");
    async function load() {
      const metrics = document.getElementById("metrics");
      const apps = document.getElementById("apps");
      const tools = document.getElementById("tools");
      const audit = document.getElementById("audit");
      const snapshot = document.getElementById("snapshot");
      try {
        const response = await fetch("/snapshot");
        const data = await response.json();
        metrics.innerHTML = [
          ["Apps", data.health?.status?.appsWithManifests ?? data.apps?.length ?? 0],
          ["Tools", data.tools?.length ?? 0],
          ["Calls", data.metrics?.toolCalls?.started ?? 0],
          ["Errors", data.metrics?.toolCalls?.failed ?? 0]
        ].map(([label, value]) => "<div><span class='label'>" + label + "</span><span class='value'>" + value + "</span></div>").join("");
        apps.innerHTML = (data.apps ?? []).length ? data.apps.map((app) => "<li><strong>" + text(app.appName ?? app.name ?? app.appId) + "</strong><br><span class='muted'><code>" + text(app.appId) + "</code></span></li>").join("") : "<li class='muted'>No apps connected yet.</li>";
        tools.innerHTML = (data.tools ?? []).length ? data.tools.map((tool) => "<li><strong>" + text(tool.name) + "</strong><br><span class='muted'>" + text(tool.description) + "</span></li>").join("") : "<li class='muted'>No tools discovered yet.</li>";
        audit.textContent = json(data.audit ?? []);
        snapshot.textContent = json(data);
      } catch (error) {
        snapshot.innerHTML = "<span class='error'>" + text(error.message || error) + "</span>";
      }
    }
    document.getElementById("refresh").addEventListener("click", load);
    load();
  </script>
</body>
</html>`;
}

function readAgentIds(value: unknown): string[] | undefined {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
  const agentIds = values
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean);

  return agentIds.length > 0 ? [...new Set(agentIds)] : undefined;
}

function createReadiness(
  status: ReturnType<BridgeGateway['getStatus']>,
  requirements: { minApps: number; minTools: number },
) {
  const checks = {
    apps: {
      ok: status.appsWithManifests >= requirements.minApps,
      actual: status.appsWithManifests,
      required: requirements.minApps,
    },
    tools: {
      ok: status.tools >= requirements.minTools,
      actual: status.tools,
      required: requirements.minTools,
    },
  };

  return {
    ok: checks.apps.ok && checks.tools.ok,
    name: 'Mobigent Gateway' as const,
    status,
    requirements,
    checks,
  };
}

export function createOpenApiSpec(
  baseUrl = 'http://localhost:8788',
  tools: ToolDescriptor[] = [],
  options: OpenApiSpecOptions = {},
) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Mobigent Gateway',
      description:
        'Expose mobile app capabilities to AI agents through typed, permissioned actions. /openapi.json is agent-scoped when x-mobigent-agent or ?agentId= is provided.',
      version: '0.1.15',
    },
    servers: [
      {
        url: baseUrl,
      },
    ],
    components: options.requireAuth
      ? {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
            },
            mobigentApiKey: {
              type: 'apiKey',
              in: 'header',
              name: 'x-mobigent-api-key',
            },
          },
        }
      : undefined,
    paths: {
      '/health': {
        get: {
          operationId: 'health',
          summary: 'Check whether the Mobigent gateway is running.',
          responses: {
            '200': {
              description: 'Gateway status.',
            },
          },
        },
      },
      '/ready': {
        get: {
          operationId: 'ready',
          summary: 'Check whether enough mobile app capacity is connected for agent startup.',
          parameters: [
            {
              name: 'minApps',
              in: 'query',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
              },
              description: 'Minimum accepted app manifests required for readiness.',
            },
            {
              name: 'minFunctions',
              in: 'query',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
              },
              description: 'Minimum exposed app functions required for readiness.',
            },
            {
              name: 'minTools',
              in: 'query',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
              },
              description: 'Backward-compatible alias for minFunctions.',
            },
          ],
          responses: {
            '200': {
              description: 'Gateway is ready.',
            },
            '503': {
              description: 'Gateway is running but does not yet meet readiness requirements.',
            },
          },
        },
      },
      '/config': {
        get: {
          operationId: 'getConfig',
          summary: 'Read machine-readable Mobigent gateway integration metadata.',
          responses: {
            '200': {
              description:
                'Gateway integration metadata, endpoints, features, limits, and required headers.',
            },
          },
        },
      },
      '/tools': {
        get: {
          operationId: 'listTools',
          summary: 'List mobile app capabilities exposed as tools.',
          security: operationSecurity(options),
          responses: {
            '200': {
              description: 'Available tools.',
            },
            '401': {
              description: 'Missing or invalid HTTP API key.',
            },
          },
        },
      },
      '/tools/stream': {
        get: {
          operationId: 'streamTools',
          summary: 'Stream mobile app tool changes as Server-Sent Events.',
          security: operationSecurity(options),
          responses: {
            '200': {
              description: 'SSE stream of tool snapshots.',
              content: {
                'text/event-stream': {
                  schema: {
                    type: 'string',
                  },
                },
              },
            },
            '401': {
              description: 'Missing or invalid HTTP API key.',
            },
          },
        },
      },
      '/tools/{toolName}': {
        get: {
          operationId: 'getTool',
          summary: 'Read one mobile app capability descriptor by tool name.',
          security: operationSecurity(options),
          parameters: [
            {
              name: 'toolName',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'The full Mobigent tool name.',
            },
          ],
          responses: {
            '200': {
              description: 'Tool descriptor.',
            },
            '401': {
              description: 'Missing or invalid HTTP API key.',
            },
            '403': {
              description: 'The provider is not allowed to see this tool.',
            },
            '404': {
              description: 'No connected app exposes this tool.',
            },
          },
        },
      },
      '/providers': {
        get: {
          operationId: 'listProviders',
          summary: 'List supported Mobigent provider integrations.',
          security: operationSecurity(options),
          responses: {
            '200': {
              description: 'Supported provider integration descriptors.',
            },
            '401': {
              description: 'Missing or invalid HTTP API key.',
            },
          },
        },
      },
      '/agents': {
        get: {
          operationId: 'listAgentVisibility',
          summary: 'List agent visibility reports for policy and profile debugging.',
          security: operationSecurity(options),
          parameters: [
            {
              name: 'agentId',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
              },
              description:
                'One agent id, a comma-separated list, or repeated agentId query parameters.',
            },
          ],
          responses: {
            '200': {
              description: 'Agent visibility reports with visible and hidden tool names.',
            },
            '401': {
              description: 'Missing or invalid HTTP API key.',
            },
          },
        },
      },
      '/snapshot': {
        get: {
          operationId: 'getGatewaySnapshot',
          summary:
            'Get a provider bootstrap snapshot with config, status, apps, tools, metrics, and recent audit events.',
          security: operationSecurity(options),
          responses: {
            '200': {
              description: 'Provider bootstrap snapshot.',
            },
            '401': {
              description: 'Missing or invalid HTTP API key.',
            },
          },
        },
      },
      '/apps': {
        get: {
          operationId: 'listApps',
          summary: 'List connected mobile app sessions and manifest status.',
          security: operationSecurity(options),
          responses: {
            '200': {
              description: 'Connected app sessions.',
            },
            '401': {
              description: 'Missing or invalid HTTP API key.',
            },
          },
        },
      },
      '/metrics': {
        get: {
          operationId: 'getMetrics',
          summary: 'Read gateway operational metrics.',
          security: operationSecurity(options),
          responses: {
            '200': {
              description: 'Gateway metrics.',
            },
            '401': {
              description: 'Missing or invalid HTTP API key.',
            },
          },
        },
      },
      '/metrics/prometheus': {
        get: {
          operationId: 'getPrometheusMetrics',
          summary: 'Read gateway operational metrics in Prometheus text format.',
          security: operationSecurity(options),
          responses: {
            '200': {
              description: 'Prometheus text metrics.',
              content: {
                'text/plain': {
                  schema: {
                    type: 'string',
                  },
                },
              },
            },
            '401': {
              description: 'Missing or invalid HTTP API key.',
            },
          },
        },
      },
      '/audit': {
        get: {
          operationId: 'getAuditLog',
          summary: 'Read recent gateway audit events.',
          security: operationSecurity(options),
          parameters: [
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 120000,
              },
              description: 'Maximum number of recent audit events to return.',
            },
          ],
          responses: {
            '200': {
              description: 'Recent audit events.',
            },
            '400': {
              description: 'Invalid limit.',
            },
            '401': {
              description: 'Missing or invalid HTTP API key.',
            },
          },
        },
      },
      '/audit/stream': {
        get: {
          operationId: 'streamAuditLog',
          summary: 'Stream gateway audit events as Server-Sent Events.',
          security: operationSecurity(options),
          parameters: [
            {
              name: 'replay',
              in: 'query',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 120000,
              },
              description: 'Number of recent audit events to replay before streaming live events.',
            },
          ],
          responses: {
            '200': {
              description: 'SSE stream of audit events.',
              content: {
                'text/event-stream': {
                  schema: {
                    type: 'string',
                  },
                },
              },
            },
            '400': {
              description: 'Invalid replay value.',
            },
            '401': {
              description: 'Missing or invalid HTTP API key.',
            },
          },
        },
      },
      '/tools/{toolName}/call': {
        post: {
          operationId: 'callTool',
          summary: 'Call a mobile app capability by tool name.',
          description:
            'Use this to call an app-approved action or resource. Consequential actions are confirmed inside the app.',
          'x-openai-isConsequential': true,
          security: operationSecurity(options),
          parameters: [
            {
              name: 'toolName',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'Tool name, for example com_mobigent_expenses.create_expense.',
            },
            {
              name: 'x-mobigent-agent',
              in: 'header',
              required: false,
              schema: {
                type: 'string',
              },
              description:
                'Optional provider or agent identity used for allowlists and rate limits.',
            },
            {
              name: 'x-mobigent-timeout-ms',
              in: 'header',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 120000,
              },
              description: 'Optional per-call timeout in milliseconds.',
            },
            {
              name: 'x-mobigent-idempotency-key',
              in: 'header',
              required: false,
              schema: {
                type: 'string',
              },
              description:
                'Optional stable key for deduplicating retries of consequential tool calls.',
            },
          ],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: true,
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Tool call result.',
              content: {
                'application/json': {
                  schema: toolCallResponseSchema(),
                },
              },
            },
            '400': {
              description: 'Tool call failed.',
            },
            '401': {
              description: 'Missing or invalid HTTP API key.',
            },
          },
        },
      },
      ...createToolPaths(tools, options),
    },
  };
}

function createToolPaths(tools: ToolDescriptor[], options: OpenApiSpecOptions) {
  return Object.fromEntries(
    tools.map((tool) => [
      `/tools/${encodeURIComponent(tool.name)}/call`,
      {
        post: {
          operationId: createToolOperationId(tool.name),
          summary: tool.description,
          description: [
            `Call ${tool.name}.`,
            tool.readOnly
              ? 'This operation reads app state.'
              : 'This operation may change app state and can require confirmation inside the app.',
          ].join(' '),
          'x-openai-isConsequential': !tool.readOnly,
          tags: [tool.app.name],
          security: operationSecurity(options),
          parameters: sharedCallHeaders(),
          requestBody: {
            required: hasRequiredInput(tool.inputSchema),
            content: {
              'application/json': {
                schema: normalizeObjectSchema(tool.inputSchema),
              },
            },
          },
          responses: {
            '200': {
              description: 'Tool call result.',
              content: {
                'application/json': {
                  schema: toolCallResponseSchema(tool.outputSchema),
                },
              },
            },
            '400': {
              description: 'Tool call failed.',
            },
            '401': {
              description: 'Missing or invalid HTTP API key.',
            },
          },
        },
      },
    ]),
  );
}

function sharedCallHeaders() {
  return [
    {
      name: 'x-mobigent-agent',
      in: 'header',
      required: false,
      schema: {
        type: 'string',
      },
      description: 'Optional provider or agent identity used for allowlists and rate limits.',
    },
    {
      name: 'x-mobigent-timeout-ms',
      in: 'header',
      required: false,
      schema: {
        type: 'integer',
        minimum: 1,
        maximum: 120000,
      },
      description: 'Optional per-call timeout in milliseconds.',
    },
    {
      name: 'x-mobigent-idempotency-key',
      in: 'header',
      required: false,
      schema: {
        type: 'string',
      },
      description: 'Optional stable key for deduplicating retries of consequential tool calls.',
    },
  ];
}

function createToolOperationId(toolName: string) {
  return sanitize(`call_${toolName}`);
}

function hasRequiredInput(schema: JsonSchema) {
  return Boolean(schema.required?.length);
}

function normalizeObjectSchema(schema: JsonSchema) {
  if (schema.type === 'object') {
    return schema;
  }

  return {
    type: 'object',
    properties: {},
  };
}

function toolCallResponseSchema(resultSchema?: JsonSchema) {
  return {
    type: 'object',
    properties: {
      tool: {
        type: 'string',
      },
      result: resultSchema ?? {},
    },
    required: ['tool', 'result'],
  };
}

function writeSseEvent(res: { write: (chunk: string) => void }, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function renderPrometheusMetrics(metrics: ReturnType<BridgeGateway['getMetrics']>) {
  const lines: string[] = [
    '# HELP mobigent_app_sessions Current connected app sessions.',
    '# TYPE mobigent_app_sessions gauge',
    `mobigent_app_sessions ${metrics.status.appSessions}`,
    '# HELP mobigent_authenticated_app_sessions Current authenticated app sessions.',
    '# TYPE mobigent_authenticated_app_sessions gauge',
    `mobigent_authenticated_app_sessions ${metrics.status.authenticatedAppSessions}`,
    '# HELP mobigent_apps_with_manifests Current app sessions with accepted manifests.',
    '# TYPE mobigent_apps_with_manifests gauge',
    `mobigent_apps_with_manifests ${metrics.status.appsWithManifests}`,
    '# HELP mobigent_tools Current exposed tools.',
    '# TYPE mobigent_tools gauge',
    `mobigent_tools ${metrics.status.tools}`,
    '# HELP mobigent_idempotency_records Current retained idempotency records.',
    '# TYPE mobigent_idempotency_records gauge',
    `mobigent_idempotency_records ${metrics.status.idempotencyRecords}`,
    '# HELP mobigent_rate_limit_buckets Current retained rate-limit buckets.',
    '# TYPE mobigent_rate_limit_buckets gauge',
    `mobigent_rate_limit_buckets ${metrics.status.rateLimitBuckets}`,
    '# HELP mobigent_audit_events_total Total audit events by type.',
    '# TYPE mobigent_audit_events_total counter',
  ];

  for (const [type, count] of Object.entries(metrics.auditEvents)) {
    lines.push(`mobigent_audit_events_total{type="${escapePrometheusLabel(type)}"} ${count}`);
  }

  lines.push(
    '# HELP mobigent_tool_calls_total Total tool calls by outcome.',
    '# TYPE mobigent_tool_calls_total counter',
  );
  for (const [outcome, count] of Object.entries(metrics.toolCalls)) {
    lines.push(`mobigent_tool_calls_total{outcome="${escapePrometheusLabel(outcome)}"} ${count}`);
  }

  lines.push(
    '# HELP mobigent_tool_calls_by_tool_total Total tool calls by tool and outcome.',
    '# TYPE mobigent_tool_calls_by_tool_total counter',
  );
  for (const [tool, counts] of Object.entries(metrics.byTool)) {
    for (const [outcome, count] of Object.entries(counts)) {
      lines.push(
        `mobigent_tool_calls_by_tool_total{tool="${escapePrometheusLabel(tool)}",outcome="${escapePrometheusLabel(
          outcome,
        )}"} ${count}`,
      );
    }
  }

  lines.push(
    '# HELP mobigent_tool_calls_by_agent_total Total tool calls by agent and outcome.',
    '# TYPE mobigent_tool_calls_by_agent_total counter',
  );
  for (const [agent, counts] of Object.entries(metrics.byAgent)) {
    for (const [outcome, count] of Object.entries(counts)) {
      lines.push(
        `mobigent_tool_calls_by_agent_total{agent="${escapePrometheusLabel(agent)}",outcome="${escapePrometheusLabel(
          outcome,
        )}"} ${count}`,
      );
    }
  }

  return `${lines.join('\n')}\n`;
}

function escapePrometheusLabel(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

function createCorsOptions(origins: MobigentHttpOptions['corsOrigins']): cors.CorsOptions {
  if (!origins || origins === '*') {
    return {};
  }

  const allowedOrigins = new Set(Array.isArray(origins) ? origins : [origins]);
  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  };
}

function operationSecurity(options: OpenApiSpecOptions) {
  if (!options.requireAuth) {
    return undefined;
  }

  return [{ bearerAuth: [] }, { mobigentApiKey: [] }];
}

function hasHttpAuth(options: MobigentHttpOptions) {
  return Boolean(options.apiKey || Object.keys(options.agentApiKeys ?? {}).length);
}

function getEndpointPolicy(
  path: string,
  options: MobigentHttpOptions,
): 'public' | 'protected' | 'disabled' {
  if (path === '/health') return options.healthEndpoint ?? 'public';
  if (path === '/ready') return options.readyEndpoint ?? 'public';
  if (path === '/config') return options.configEndpoint ?? 'public';
  if (path === '/openapi.json') return options.openApiEndpoint ?? 'public';
  if (path === '/inspect') {
    const mode = options.inspectorMode ?? 'enabled';
    if (mode === 'disabled') return 'disabled';
    if (mode === 'protected') return 'protected';
    return 'public';
  }
  // All other endpoints: protected when HTTP auth is configured
  return hasHttpAuth(options) ? 'protected' : 'public';
}

function authorizeHttpRequest(
  authorization: string | undefined,
  apiKeyHeader: string | undefined,
  options: MobigentHttpOptions,
): { ok: true; agentId?: string } | { ok: false } {
  const presentedKey = apiKeyHeader ?? bearerToken(authorization);
  if (!presentedKey) {
    return { ok: false };
  }

  if (options.apiKey && presentedKey === options.apiKey) {
    return { ok: true };
  }

  for (const [agentId, apiKey] of Object.entries(options.agentApiKeys ?? {})) {
    if (presentedKey === apiKey) {
      return { ok: true, agentId };
    }
  }

  return { ok: false };
}

function createHttpRateLimiter(limitPerMinute: number) {
  return rateLimit({
    windowMs: 60_000,
    limit: limitPerMinute,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        ...gatewayErrorBody('rate_limited', 'Too many Mobigent HTTP requests.'),
      });
    },
  });
}

function bearerToken(authorization: string | undefined) {
  const prefix = 'Bearer ';
  return authorization?.startsWith(prefix) ? authorization.slice(prefix.length) : undefined;
}

function agentIdFromRequest(
  req: { header: (name: string) => string | undefined; query?: Record<string, unknown> },
  res?: Response,
) {
  const queryAgentId = req.query?.agentId;
  return (
    (res?.locals.mobigentAgentId as string | undefined) ??
    req.header('x-mobigent-agent') ??
    (typeof queryAgentId === 'string' ? queryAgentId : undefined)
  );
}

function requestBaseUrl(req: { protocol: string; get: (name: string) => string | undefined }) {
  return `${req.protocol}://${req.get('host')}`;
}
