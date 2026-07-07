---
sidebar_position: 5
---

# Audit Events

Mobigent records structured gateway audit events for sessions, app manifests, app events, tool calls, denials, failures, and timeouts.

## Subscribe in code

```ts
import { BridgeGateway } from '@mobigent/gateway';

const gateway = new BridgeGateway({
  port: 8787,
  auditLogLimit: 1000,
  auditLogPath: './mobigent-audit.jsonl',
  auditRedactKeys: ['email', 'ssn'],
});

gateway.onAudit((event) => {
  console.log(event.type, event.message);
});
```

## Read recent events

```ts
const recent = gateway.getAuditLog(50);
```

When using the HTTP gateway:

```bash
curl http://localhost:8788/audit?limit=50
curl http://localhost:8788/metrics
curl http://localhost:8788/metrics/prometheus
```

`/metrics` exposes lifetime counters derived from audit events, including tool call outcomes grouped by tool and agent. `/metrics/prometheus` returns the same counters in Prometheus text format. Unlike `/audit`, these counters are not limited by `auditLogLimit`.

## Event shape

Audit events include:

- `id`
- `at`
- `type`
- `severity`
- `message`
- `sessionId`
- `app`
- `tool`
- `agentId`
- `durationMs`
- `details`

Common event types:

- `gateway.started`
- `session.connected`
- `app.authenticated`
- `manifest.registered`
- `app.event`
- `tool.call.started`
- `tool.call.deduplicated`
- `tool.call.succeeded`
- `tool.call.denied`
- `tool.call.failed`
- `tool.call.timed_out`

The default in-memory audit log keeps the latest 500 events. Production deployments should forward audit events to durable storage.

## Durable JSONL logs

Set `auditLogPath` to append every audit event as one JSON object per line:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  auditLogPath: '/var/log/mobigent/audit.jsonl',
});
```

When running the HTTP gateway binary:

```bash
MOBIGENT_AUDIT_LOG_PATH=./mobigent-audit.jsonl npx mobigent-http
```

The gateway creates parent folders when needed. JSONL works well with `tail`, log shippers, data warehouses, and SIEM tools.

## Redaction

Audit events are recursively redacted before they are stored in memory, streamed to listeners, returned by HTTP, or written to JSONL.

Default redacted keys:

- `access_token`
- `api_key`
- `authorization`
- `authToken`
- `password`
- `refresh_token`
- `secret`
- `token`

Add app-specific keys in code:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  auditRedactKeys: ['email', 'ssn', 'cardNumber'],
});
```

Or with the HTTP gateway:

```bash
MOBIGENT_AUDIT_REDACT_KEYS=email,ssn,cardNumber npx mobigent-http
```
