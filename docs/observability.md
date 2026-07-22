# Observability Guide

This guide covers monitoring, dashboards, alerts, and operational visibility for Mobigent gateway deployments.

## Current Runtime State

The gateway now emits structured JSON logs through the `Logger` interface defined in `packages/gateway/src/logger.ts`. The default gateway runtime (`http-server.ts`) wires a console-backed structured logger with JSON output to stdout/stderr. Key lifecycle events — startup, shutdown, session connect/disconnect, malformed messages — are logged with correlation fields (`sessionId`, `appId`, `eventType`). The gateway constructor accepts an optional `logger` parameter for embedders who want to route logs to existing infrastructure.

OpenTelemetry helpers exist in `telemetry.ts` but are not yet auto-detected by the default runtime. Embedders can still import `createTelemetry()` and pass the result to the gateway.

## Structured Logging

The gateway emits structured JSON logs to stdout (info/debug) and stderr (warn/error). Each log line includes:

```json
{
  "level": "info",
  "message": "Tool call started: com.acme.expenses.create_expense",
  "timestamp": "2026-07-07T16:00:00.000Z",
  "requestId": "req_abc123",
  "sessionId": "sess_xyz789",
  "appId": "com.acme.expenses",
  "agentId": "claude",
  "tool": "com.acme.expenses.create_expense",
  "eventType": "tool.call.started"
}
```

Log levels: `debug`, `info`, `warn`, `error`.

Set `MOBIGENT_LOG_LEVEL` to `debug`, `info`, `warn`, or `error` to control verbosity. Production defaults to `info`.

### Custom Logger Injection

Embedders can inject a custom logger that implements the `Logger` interface (see `packages/gateway/src/logger.ts`). Pass it via `new BridgeGateway({ logger: myLogger })`. This allows routing logs to existing infrastructure (Winston, Pino, Datadog, etc.). The gateway also accepts `logger` in its HTTP server startup.

### Secret Safety

Logs never include raw action inputs, results, API keys, auth tokens, or signing secrets. Audit events may contain business data after redaction and should be treated as sensitive.

## OpenTelemetry

`packages/gateway/src/telemetry.ts` contains OpenTelemetry-compatible helper abstractions (`createTelemetry()`, `createGatewayMetrics()`, `startTracedToolCall()`). The gateway constructor is ready for telemetry injection. The default runtime does not yet auto-detect `@opentelemetry/api` — embedders should call `createTelemetry()` and pass the result. Once wired, it emits:

- **Traces**: Spans for each tool call (`tool_call.<name>`)
- **Metrics**: Counters and histograms for tool calls, sessions, auth, HTTP requests

### Installation

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```

Configure the OTel SDK before starting the gateway:

```ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: 'https://your-otel-collector:4318/v1/traces' }),
  metricExporter: ...,
});

sdk.start();
// Then start the gateway
```

When the helper is used without `@opentelemetry/api`, telemetry calls are no-ops.

## Prometheus Metrics

The gateway exposes Prometheus metrics at `/metrics/prometheus`. Available metrics:

| Metric                                | Type    | Description                      |
| ------------------------------------- | ------- | -------------------------------- |
| `mobigent_app_sessions`               | gauge   | Currently connected app sessions |
| `mobigent_authenticated_app_sessions` | gauge   | Authenticated app sessions       |
| `mobigent_apps_with_manifests`        | gauge   | Apps with accepted manifests     |
| `mobigent_tools`                      | gauge   | Currently exposed tools          |
| `mobigent_idempotency_records`        | gauge   | Retained idempotency records     |
| `mobigent_rate_limit_buckets`         | gauge   | Active rate-limit buckets        |
| `mobigent_audit_events_total`         | counter | Audit events by type             |
| `mobigent_tool_calls_total`           | counter | Tool calls by outcome            |
| `mobigent_tool_calls_by_tool_total`   | counter | Tool calls by tool and outcome   |
| `mobigent_tool_calls_by_agent_total`  | counter | Tool calls by agent and outcome  |

## Dashboards

### Gateway Overview Dashboard

Recommended Prometheus queries for a Grafana dashboard:

**Uptime & Sessions:**

```
# Active sessions
mobigent_app_sessions

# Apps with manifests
mobigent_apps_with_manifests

# Exposed tools
mobigent_tools
```

**Tool Call Rate:**

```
# Tool calls per second (1m rate)
rate(mobigent_tool_calls_total[1m])

# Success rate
sum(rate(mobigent_tool_calls_total{outcome="succeeded"}[5m]))
  /
sum(rate(mobigent_tool_calls_total[5m]))
```

**Latency (from OTel histograms):**

```
# P50, P95, P99 tool call latency
histogram_quantile(0.50, rate(mobigent_tool_calls_duration_ms[5m]))
histogram_quantile(0.95, rate(mobigent_tool_calls_duration_ms[5m]))
histogram_quantile(0.99, rate(mobigent_tool_calls_duration_ms[5m]))
```

**Security Panel:**

```
# Auth rejection rate
rate(mobigent_tool_calls_total{outcome="denied"}[5m])

# Manifest rejections
rate(mobigent_manifest_rejections[5m])
```

## Alerts

Recommended alert rules:

### Critical (P1 — immediate response)

| Alert              | Expression                                   | Threshold | For |
| ------------------ | -------------------------------------------- | --------- | --- |
| Gateway down       | `up == 0`                                    | —         | 1m  |
| Readiness failing  | `mobigent_apps_with_manifests < 1`           | —         | 5m  |
| Audit sink failure | `rate(mobigent_audit_sink_failures[5m]) > 0` | > 0       | 5m  |
| No connected apps  | `mobigent_app_sessions == 0`                 | —         | 10m |

### Warning (P2 — investigate)

| Alert                    | Expression                                                                     | Threshold | For |
| ------------------------ | ------------------------------------------------------------------------------ | --------- | --- |
| High tool failure rate   | `rate(tool_calls_total{outcome="failed"}[5m]) / rate(tool_calls_total[5m])`    | > 0.10    | 5m  |
| High tool timeout rate   | `rate(tool_calls_total{outcome="timed_out"}[5m]) / rate(tool_calls_total[5m])` | > 0.05    | 5m  |
| Auth rejection spike     | `rate(mobigent_auth_rejections[5m])`                                           | > 5       | 5m  |
| Manifest rejection spike | `rate(mobigent_manifest_rejections[5m])`                                       | > 3       | 5m  |
| High HTTP 5xx rate       | `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])` | > 0.05    | 5m  |

## Correlation

Every request through the gateway can be correlated using these fields:

- `requestId` — unique per HTTP request or WebSocket message
- `sessionId` — persistent across the lifetime of one app connection
- `appId` — the app identity (e.g., `com.acme.expenses`)
- `agentId` — the provider/agent identity
- `tool` — the tool name being called

Today these fields appear in audit events and selected request/call metadata. Structured logs, OpenTelemetry spans, and response headers are planned follow-ups.
