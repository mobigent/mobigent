/**
 * OpenTelemetry hooks and metrics instrumentation for the Mobigent gateway.
 *
 * This module provides a lightweight abstraction over OpenTelemetry that
 * works without requiring @opentelemetry/api to be installed. When the
 * OTel API is available, traces and metrics are emitted automatically.
 * When it's absent, calls are no-ops so the gateway works without it.
 */

import type { Logger } from './logger.js';
import { MOBIGENT_VERSION } from './config.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TelemetrySpan = {
  setAttribute(key: string, value: string | number | boolean): void;
  setStatus(status: 'ok' | 'error', message?: string): void;
  end(): void;
};

export type TelemetryTracer = {
  startSpan(
    name: string,
    options?: { attributes?: Record<string, string | number | boolean> },
  ): TelemetrySpan;
};

export type TelemetryMeter = {
  createCounter(name: string, options?: { description?: string; unit?: string }): TelemetryCounter;
  createHistogram(
    name: string,
    options?: { description?: string; unit?: string },
  ): TelemetryHistogram;
};

export type TelemetryCounter = {
  add(value: number, attributes?: Record<string, string | number | boolean>): void;
};

export type TelemetryHistogram = {
  record(value: number, attributes?: Record<string, string | number | boolean>): void;
};

export interface Telemetry {
  tracer: TelemetryTracer;
  meter: TelemetryMeter;
}

// ---------------------------------------------------------------------------
// No-op implementations (default when OTel is not installed)
// ---------------------------------------------------------------------------

const noopSpan: TelemetrySpan = {
  setAttribute: () => {},
  setStatus: () => {},
  end: () => {},
};

const noopTracer: TelemetryTracer = {
  startSpan: () => noopSpan,
};

const noopCounter: TelemetryCounter = {
  add: () => {},
};

const noopHistogram: TelemetryHistogram = {
  record: () => {},
};

const noopMeter: TelemetryMeter = {
  createCounter: () => noopCounter,
  createHistogram: () => noopHistogram,
};

export const noopTelemetry: Telemetry = {
  tracer: noopTracer,
  meter: noopMeter,
};

// ---------------------------------------------------------------------------
// OTel-based implementation (loaded lazily when @opentelemetry/api is available)
// ---------------------------------------------------------------------------

let cachedOtelTelemetry: Telemetry | undefined;

async function tryLoadOtel(): Promise<Telemetry> {
  if (cachedOtelTelemetry) return cachedOtelTelemetry;

  try {
    // Use a variable for the module name so TypeScript cannot statically
    // resolve the import and doesn't require @opentelemetry/api at build time.
    const otelModule = '@opentelemetry/api';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api: any = await (import(otelModule) as Promise<any>);

    const trace = api.trace;
    const metrics = api.metrics;
    const SpanStatusCode = api.SpanStatusCode ?? { OK: 1, ERROR: 2 };

    if (!trace || typeof trace.getTracer !== 'function') {
      cachedOtelTelemetry = noopTelemetry;
      return noopTelemetry;
    }

    const otelTracer = trace.getTracer('mobigent-gateway', MOBIGENT_VERSION);
    const otelMeter =
      metrics && typeof metrics.getMeter === 'function'
        ? metrics.getMeter('mobigent-gateway', MOBIGENT_VERSION)
        : undefined;

    cachedOtelTelemetry = {
      tracer: {
        startSpan(name, options) {
          const span = otelTracer.startSpan(name);
          if (options?.attributes) {
            for (const [key, value] of Object.entries(options.attributes)) {
              span.setAttribute(key, value);
            }
          }
          return {
            setAttribute(key: string, value: string | number | boolean) {
              span.setAttribute(key, value);
            },
            setStatus(status: 'ok' | 'error', message?: string) {
              span.setStatus({
                code: status === 'ok' ? SpanStatusCode.OK : SpanStatusCode.ERROR,
                message,
              });
            },
            end() {
              span.end();
            },
          };
        },
      },
      meter: otelMeter
        ? {
            createCounter(name: string, options?: { description?: string; unit?: string }) {
              const counter = otelMeter.createCounter(name, options);
              return {
                add(value: number, attributes?: Record<string, string | number | boolean>) {
                  counter.add(value, attributes);
                },
              };
            },
            createHistogram(name: string, options?: { description?: string; unit?: string }) {
              const histogram = otelMeter.createHistogram(name, options);
              return {
                record(value: number, attributes?: Record<string, string | number | boolean>) {
                  histogram.record(value, attributes);
                },
              };
            },
          }
        : noopMeter,
    };

    return cachedOtelTelemetry;
  } catch {
    cachedOtelTelemetry = noopTelemetry;
    return noopTelemetry;
  }
}

// ---------------------------------------------------------------------------
// Gateway-specific metrics factory
// ---------------------------------------------------------------------------

export type GatewayMetrics = ReturnType<typeof createGatewayMetrics>;

/**
 * Create typed gateway metrics backed by the given telemetry provider.
 * All counters and histograms are no-ops when OTel is unavailable.
 */
export function createGatewayMetrics(telemetry: Telemetry = noopTelemetry) {
  return {
    toolCallsStarted: telemetry.meter.createCounter('mobigent.tool_calls.started', {
      description: 'Number of tool calls started.',
      unit: '1',
    }),
    toolCallsSucceeded: telemetry.meter.createCounter('mobigent.tool_calls.succeeded', {
      description: 'Number of tool calls that succeeded.',
      unit: '1',
    }),
    toolCallsFailed: telemetry.meter.createCounter('mobigent.tool_calls.failed', {
      description: 'Number of tool calls that failed.',
      unit: '1',
    }),
    toolCallsDenied: telemetry.meter.createCounter('mobigent.tool_calls.denied', {
      description: 'Number of tool calls denied by policy.',
      unit: '1',
    }),
    toolCallsTimedOut: telemetry.meter.createCounter('mobigent.tool_calls.timed_out', {
      description: 'Number of tool calls that timed out.',
      unit: '1',
    }),
    toolCallsDeduplicated: telemetry.meter.createCounter('mobigent.tool_calls.deduplicated', {
      description: 'Number of duplicate tool calls deduplicated.',
      unit: '1',
    }),
    toolCallDurationMs: telemetry.meter.createHistogram('mobigent.tool_calls.duration_ms', {
      description: 'Tool call duration in milliseconds.',
      unit: 'ms',
    }),
    appSessions: telemetry.meter.createCounter('mobigent.app_sessions.connected', {
      description: 'Number of app sessions connected.',
      unit: '1',
    }),
    appDisconnections: telemetry.meter.createCounter('mobigent.app_sessions.disconnected', {
      description: 'Number of app sessions disconnected.',
      unit: '1',
    }),
    authRejections: telemetry.meter.createCounter('mobigent.auth.rejections', {
      description: 'Number of authentication rejections.',
      unit: '1',
    }),
    manifestRejections: telemetry.meter.createCounter('mobigent.manifest.rejections', {
      description: 'Number of manifest rejections.',
      unit: '1',
    }),
    auditSinkFailures: telemetry.meter.createCounter('mobigent.audit.sink_failures', {
      description: 'Number of audit sink write failures.',
      unit: '1',
    }),
    httpRequests: telemetry.meter.createCounter('mobigent.http.requests', {
      description: 'Number of HTTP requests received.',
      unit: '1',
    }),
    httpRequestDurationMs: telemetry.meter.createHistogram('mobigent.http.request_duration_ms', {
      description: 'HTTP request duration in milliseconds.',
      unit: 'ms',
    }),
  };
}

// ---------------------------------------------------------------------------
// Tool call tracing helper
// ---------------------------------------------------------------------------

export type TracedToolCall = {
  span: TelemetrySpan;
  metrics: GatewayMetrics;
  logger: Logger;
  startTime: number;
};

/**
 * Start a traced tool call with span, metrics, and log correlation.
 */
export function startTracedToolCall(params: {
  telemetry?: Telemetry;
  metrics?: GatewayMetrics;
  logger?: Logger;
  toolName: string;
  agentId?: string;
  appId?: string;
  sessionId?: string;
  requestId?: string;
}): TracedToolCall {
  const tel = params.telemetry ?? noopTelemetry;
  const metrics = params.metrics ?? createGatewayMetrics(tel);
  const logger = params.logger;
  const startTime = Date.now();

  const span = tel.tracer.startSpan(`tool_call.${params.toolName}`, {
    attributes: {
      'mobigent.tool': params.toolName,
      ...(params.agentId ? { 'mobigent.agent_id': params.agentId } : {}),
      ...(params.appId ? { 'mobigent.app_id': params.appId } : {}),
      ...(params.requestId ? { 'mobigent.request_id': params.requestId } : {}),
    },
  });

  metrics.toolCallsStarted.add(1, { tool: params.toolName });

  logger?.info(`Tool call started: ${params.toolName}`, {
    tool: params.toolName,
    agentId: params.agentId,
    appId: params.appId,
    sessionId: params.sessionId,
    requestId: params.requestId,
    eventType: 'tool.call.started',
  });

  return { span, metrics, logger: logger ?? ({} as Logger), startTime };
}

/**
 * End a traced tool call with an outcome.
 */
export function endTracedToolCall(
  traced: TracedToolCall,
  outcome: 'succeeded' | 'failed' | 'denied' | 'timeout' | 'deduplicated',
  details?: { errorCode?: string; message?: string },
): void {
  const durationMs = Date.now() - traced.startTime;

  switch (outcome) {
    case 'succeeded':
      traced.metrics.toolCallsSucceeded.add(1);
      traced.span.setStatus('ok');
      break;
    case 'failed':
      traced.metrics.toolCallsFailed.add(1);
      traced.span.setStatus('error', details?.message);
      break;
    case 'denied':
      traced.metrics.toolCallsDenied.add(1);
      traced.span.setStatus('error', 'denied by policy');
      break;
    case 'timeout':
      traced.metrics.toolCallsTimedOut.add(1);
      traced.span.setStatus('error', 'timed out');
      break;
    case 'deduplicated':
      traced.metrics.toolCallsDeduplicated.add(1);
      traced.span.setStatus('ok');
      break;
  }

  traced.metrics.toolCallDurationMs.record(durationMs);
  traced.span.setAttribute('mobigent.outcome', outcome);
  traced.span.setAttribute('mobigent.duration_ms', durationMs);
  if (details?.errorCode) {
    traced.span.setAttribute('mobigent.error_code', details.errorCode);
  }
  traced.span.end();
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export async function createTelemetry(): Promise<{
  telemetry: Telemetry;
  metrics: GatewayMetrics;
}> {
  const telemetry = await tryLoadOtel();
  const metrics = createGatewayMetrics(telemetry);
  return { telemetry, metrics };
}
