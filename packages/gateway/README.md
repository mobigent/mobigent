# @mobigent/gateway

Local gateway for Mobigent.

The gateway accepts app SDK connections over WebSocket and exposes registered app capabilities through:

- an in-process TypeScript API
- an interactive terminal server
- an HTTP/OpenAPI API for ChatGPT Actions-style testing
- an MCP stdio server for MCP-compatible agents

```ts
import { BridgeGateway, createHttpApp } from "@mobigent/gateway";

const gateway = new BridgeGateway({
  port: 8787,
  auditLogPath: "./mobigent-audit.jsonl"
});
gateway.start();
```

## Commands

```bash
npx mobigent-gateway
npx mobigent-http
npx mobigent-mcp
```

## Operational Introspection

```ts
const status = gateway.getStatus();
const apps = gateway.listApps();
```

HTTP endpoints:

```text
GET /health
GET /ready
GET /config
GET /apps
GET /providers
GET /snapshot
GET /tools
GET /tools/{toolName}
GET /tools/stream
POST /tools/{toolName}/call
GET /metrics
GET /metrics/prometheus
GET /audit?limit=50
GET /audit/stream?replay=25
```

`/health` includes session, tool, idempotency-record, and rate-limit bucket counts. `/ready?minApps=1&minTools=1` returns 200 only when enough accepted app manifests and exposed tools are connected for agent startup. `/config` returns machine-readable integration metadata: protocol versions, auth requirements, endpoints, supported features, limits, and provider headers.
`/apps` returns connected app sessions, SDK versions, negotiated protocol versions, `lastSeenAt`, `ageMs`, `idleMs`, capability counts, manifest acceptance time, and whether each manifest was signed.
`/providers` returns provider integration descriptors for MCP, OpenAPI, OpenAI, OpenRouter, LiteLLM, Ollama, LM Studio, xAI Grok, DeepSeek, Together AI, Fireworks AI, Mistral, Cohere, Anthropic, Gemini, AWS Bedrock Converse, Vercel AI SDK, LangChain, LlamaIndex, Mastra, Semantic Kernel, and generic agents.
`/snapshot` returns one provider bootstrap payload with config, health, readiness, connected apps, provider descriptors, visible tools, metrics, and recent audit events.
`/tools`, `/tools/{toolName}`, and `/tools/stream` respect `allowedAgents` and gateway agent profiles when callers send `x-mobigent-agent`, so providers only discover capabilities they are allowed to invoke. Restricted capabilities are hidden from anonymous discovery.
`/tools/stream` is a Server-Sent Events stream for provider runtimes that need to refresh model tool definitions when mobile apps connect, disconnect, or change capabilities.
`/metrics` returns lifetime operational counters for audit events, tool calls, tools, agents, retained idempotency records, retained rate-limit buckets, and current gateway status. `/metrics/prometheus` exposes the same counters in Prometheus text format for scraping.

## Policy Enforcement

The gateway enforces app-declared capability policies:

- `allowedAgents` blocks callers whose provider id is not allowlisted.
- `allowedAgents` also filters HTTP tool discovery and tool streams.
- Gateway agent profiles can apply server-owned `allowedTools`, `deniedTools`, `readOnly`, and `maxRisk` guardrails per provider.
- `rateLimitPerMinute` limits calls per agent and tool.
- `requestTimeoutMs` controls the default app response timeout.

HTTP calls can pass `x-mobigent-agent`, `x-mobigent-request-id`, `x-mobigent-idempotency-key`, and `x-mobigent-timeout-ms`. Direct gateway calls can pass the same intent in code:

```ts
await gateway.callTool("com_example_app.create_expense", input, {
  agentId: "claude-desktop",
  idempotencyKey: "expense-create-123",
  requestId: "provider-call-123",
  timeoutMs: 30_000
});
```

Request ids and idempotency keys are recorded in audit event details so provider logs, gateway logs, and consequential mobile actions can be correlated. Reusing the same idempotency key with the same tool, agent, and input returns the first successful result without running the mobile action again. Reusing the key with different input is rejected.

Successful idempotency records are retained for `idempotencyRecordTtlMs` so retries can safely replay results, then cleaned up by the gateway's operational cleanup loop. Stale rate-limit buckets are also pruned after their one-minute policy window. Configure these values in code:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  idempotencyRecordTtlMs: 5 * 60_000,
  cleanupIntervalMs: 60_000
});
```

Or with the HTTP binary:

```bash
MOBIGENT_IDEMPOTENCY_RECORD_TTL_MS=300000 \
MOBIGENT_CLEANUP_INTERVAL_MS=60000 \
npx mobigent-http
```

When a tool is connected, the HTTP route validates request JSON against the tool's declared `inputSchema` before sending anything to the app. Invalid inputs return `400` with an `Invalid tool input` error.

HTTP errors include stable machine-readable fields:

```json
{
  "code": "invalid_input",
  "error": "Invalid tool input: $.message is required",
  "retryable": false
}
```

Agents can use `code` and `retryable` to distinguish user-fixable input errors from `rate_limited`, `timeout`, `conflict`, `not_found`, `forbidden`, or `upstream_error` failures.

`/openapi.json` is also agent-scoped. Pass `x-mobigent-agent` or use `?agentId=chatgpt-actions` when importing schemas into hosted OpenAPI providers, so restricted tools stay out of the imported action list.

Gateway-owned agent profiles are useful when app manifests are broad but individual providers should be narrow:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  agentProfiles: {
    "chatgpt-actions": {
      readOnly: true,
      maxRisk: "low",
      allowedTools: ["com_example_expenses.*"]
    },
    cursor: {
      allowedTools: ["com_example_expenses.*"],
      deniedTools: ["com_example_expenses.delete_*"]
    },
    "*": {
      readOnly: true,
      maxRisk: "low"
    }
  }
});
```

For `npx mobigent-http`, pass JSON:

```bash
MOBIGENT_AGENT_PROFILES='{"chatgpt-actions":{"readOnly":true,"maxRisk":"low","allowedTools":["com_example_expenses.*"]}}' npx mobigent-http
```

## HTTP API Key

Set `MOBIGENT_HTTP_API_KEY` to require authentication for agent-facing HTTP endpoints:

```bash
MOBIGENT_HTTP_API_KEY=http-secret npx mobigent-http
```

Clients can send either `Authorization: Bearer http-secret` or `x-mobigent-api-key: http-secret`.

For multi-provider gateways, bind keys to trusted agent ids:

```ts
const app = createHttpApp(gateway, {
  agentApiKeys: {
    "chatgpt-actions": process.env.CHATGPT_ACTIONS_KEY!,
    cursor: process.env.CURSOR_AGENT_KEY!
  }
});
```

Or with the HTTP binary:

```bash
MOBIGENT_HTTP_AGENT_API_KEYS='{"chatgpt-actions":"chatgpt-secret","cursor":"cursor-secret"}' npx mobigent-http
```

Per-agent keys pin discovery, calls, rate limits, profiles, idempotency, and audit metrics to the authenticated agent id. A conflicting `x-mobigent-agent` header is rejected.

## HTTP CORS

By default, the HTTP app uses permissive CORS for local development. Restrict browser origins in production:

```ts
const app = createHttpApp(gateway, {
  apiKey: process.env.MOBIGENT_HTTP_API_KEY,
  corsOrigins: ["https://agent.example.com"]
});
```

For `npx mobigent-http`, use a comma-separated list:

```bash
MOBIGENT_HTTP_CORS_ORIGINS=https://agent.example.com,https://admin.example.com npx mobigent-http
```

## HTTP JSON Body Limit

The HTTP gateway accepts JSON request bodies up to `1mb` by default. Tune this limit for production deployments:

```ts
const app = createHttpApp(gateway, {
  jsonBodyLimit: "256kb"
});
```

For `npx mobigent-http`, set:

```bash
MOBIGENT_HTTP_JSON_LIMIT=256kb npx mobigent-http
```

Requests above the configured limit return `413` with a JSON error.

## Signed Manifests

Set `manifestSigningSecret` in code, or `MOBIGENT_MANIFEST_SIGNING_SECRET` for `npx mobigent-http`, to require HMAC-SHA256 signatures on app capability manifests:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  manifestSigningSecret: process.env.MOBIGENT_MANIFEST_SIGNING_SECRET
});
```

Malformed, unsigned, or invalid manifests are ignored and recorded as `manifest.rejected` audit events. Malformed manifests include validation errors in audit details with `reason: "invalid_manifest"`, including duplicate tool names inside a single manifest.

Manifests that would expose a tool name already exposed by another connected session are also rejected. This keeps routing deterministic when duplicate app installs, simulators, dev builds, or cross-type names like an action `get_profile` and resource `profile` are connected at the same time.

## App ID Allowlist

Limit the gateway to known app ids:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  allowedAppIds: ["com.example.expenses"]
});
```

Or with the HTTP binary:

```bash
MOBIGENT_ALLOWED_APP_IDS=com.example.expenses,com.example.crm npx mobigent-http
```

Disallowed apps are rejected during `hello` and recorded as `app.rejected` audit events.

## Protocol Compatibility

Apps send `protocolVersion` in the initial `hello` and manifest. The gateway responds with a `ready` message that includes the negotiated protocol version and supported versions. Unsupported protocol versions are rejected during `hello` and recorded as `app.rejected` audit events with `reason: "unsupported_protocol_version"`.

## Audit Events

```ts
gateway.onAudit((event) => {
  console.log(event.type, event.message);
});

const recent = gateway.getAuditLog(50);
```

The HTTP app exposes `GET /audit?limit=50` for recent in-memory events and `GET /audit/stream?replay=25` for a Server-Sent Events stream. The stream emits `event: audit` frames and can replay recent events before live events.

Set `auditLogPath` in code, or `MOBIGENT_AUDIT_LOG_PATH` when using `npx mobigent-http`, to append every event as JSONL:

```bash
MOBIGENT_AUDIT_LOG_PATH=./mobigent-audit.jsonl npx mobigent-http
```

Audit events are recursively redacted before they are stored or written. Default redacted keys include `token`, `authToken`, `authorization`, `password`, `secret`, `api_key`, `access_token`, and `refresh_token`.

Add app-specific keys:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  auditRedactKeys: ["email", "ssn", "cardNumber"]
});
```

Or:

```bash
MOBIGENT_AUDIT_REDACT_KEYS=email,ssn,cardNumber npx mobigent-http
```
