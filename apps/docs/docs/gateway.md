---
sidebar_position: 4
---

# Gateway

`@mobigent/gateway` is the agent-facing process. It keeps app sessions, exposes tools, routes calls to the app, and publishes MCP or HTTP interfaces.

## Local terminal gateway

```bash
npm run dev:gateway
```

## HTTP and OpenAPI

```bash
npm run dev:http
```

Useful endpoints:

- `GET /health`
- `GET /ready`
- `GET /config`
- `GET /apps`
- `GET /providers`
- `GET /snapshot`
- `GET /tools`
- `GET /tools/:toolName`
- `GET /tools/stream`
- `POST /tools/:toolName/call`
- `GET /metrics`
- `GET /metrics/prometheus`
- `GET /audit`
- `GET /audit/stream`
- `GET /openapi.json`

`GET /health` includes gateway counts for connected app sessions, authenticated app sessions, accepted manifests, exposed tools, audit events, retained idempotency records, retained rate-limit buckets, whether manifest signing is required, and whether gateway agent profiles are configured.

`GET /ready?minApps=1&minTools=1` returns 200 when the gateway has enough accepted app manifests and exposed tools for an agent server to start. It returns 503 with structured check details while the gateway is running but mobile app capability has not connected yet.

`GET /config` returns machine-readable integration metadata for providers and operators: protocol versions, auth requirements, endpoint paths, feature flags, request limits, and the standard Mobigent HTTP headers.

`GET /apps` returns connected app sessions with app id, SDK version, negotiated protocol version, compatibility status, `lastSeenAt`, `ageMs`, `idleMs`, capability counts, manifest acceptance time, and whether the manifest was signed.

`GET /providers` returns setup descriptors for supported integrations: MCP, OpenAPI, ChatGPT Actions, OpenAI Responses, OpenRouter, LiteLLM, Ollama, LM Studio, xAI Grok, DeepSeek, Together AI, Fireworks AI, Mistral, Cohere, Anthropic Tool Use, Google Gemini, AWS Bedrock Converse, Vercel AI SDK, LangChain, LlamaIndex, Mastra, Semantic Kernel, Claude Desktop, Cursor, VS Code, and generic agents.

`GET /snapshot` returns a single provider bootstrap payload with config, health, readiness, connected apps, provider descriptors, agent-visible tools, metrics, and recent audit events. Use it when an agent server wants one startup call before registering model tools.

`GET /tools`, `GET /tools/:toolName`, and `GET /tools/stream` respect `allowedAgents` and gateway agent profiles when callers send `x-mobigent-agent`. Restricted capabilities are hidden from discovery, so each provider only receives tools it can invoke.

`GET /tools/:toolName` returns one tool descriptor by full Mobigent tool name. `GET /tools/stream` is a Server-Sent Events stream that emits `event: tools` snapshots whenever connected app capabilities change. Provider runtimes can use it to refresh OpenAI, Anthropic, Gemini, AWS Bedrock Converse, Vercel AI SDK, LangChain, LlamaIndex, or Mastra tool definitions without polling.

`GET /metrics` returns operational counters for dashboards and health checks, including current gateway status, audit event counts, retained idempotency records, retained rate-limit buckets, total tool call outcomes, and call outcomes grouped by tool and agent. `GET /metrics/prometheus` exposes those counters in Prometheus text format.

HTTP calls can include provider identity, request correlation, idempotency, and timeout headers:

```bash
curl -X POST http://localhost:8788/tools/com_example_app.create_expense/call \
  -H "content-type: application/json" \
  -H "authorization: Bearer http-secret" \
  -H "x-mobigent-agent: chatgpt-actions" \
  -H "x-mobigent-request-id: provider-call-123" \
  -H "x-mobigent-idempotency-key: expense-create-123" \
  -H "x-mobigent-timeout-ms: 30000" \
  -d '{"amount":42,"merchant":"Taxi"}'
```

`x-mobigent-agent` is used by capability policies such as `allowedAgents` and `rateLimitPerMinute`, plus gateway-owned agent profiles. It also filters `GET /tools`, `GET /tools/:toolName`, and `GET /tools/stream`, so agents discover only the capabilities they are allowed to call. `x-mobigent-timeout-ms` overrides the gateway request timeout for one call.
`x-mobigent-request-id` is optional and appears in gateway audit details as `externalRequestId`, which helps correlate mobile app actions with provider logs. `x-mobigent-idempotency-key` is also written to audit details. Reusing the same idempotency key with the same tool, agent, and input returns the first successful result without running the mobile action again; reusing it with different input is rejected.

Successful idempotency records are retained for `idempotencyRecordTtlMs` so retries can safely replay results, then cleaned up by the gateway's operational cleanup loop. Stale rate-limit buckets are also pruned after their one-minute policy window:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  idempotencyRecordTtlMs: 5 * 60_000,
  cleanupIntervalMs: 60_000
});
```

For `npx mobigent-http`, use:

```bash
MOBIGENT_IDEMPOTENCY_RECORD_TTL_MS=300000 \
MOBIGENT_CLEANUP_INTERVAL_MS=60000 \
npx mobigent-http
```

For connected tools, the HTTP gateway validates the JSON request body against the tool's declared `inputSchema` before routing the call to the app. Invalid inputs return `400` with an `Invalid tool input` message.

HTTP failures use a stable JSON shape:

```json
{
  "code": "invalid_input",
  "error": "Invalid tool input: $.message is required",
  "retryable": false
}
```

Common codes are `unauthorized`, `forbidden`, `not_found`, `invalid_input`, `conflict`, `rate_limited`, `timeout`, `payload_too_large`, and `upstream_error`. The provider client maps these into `MobigentHttpError.code`, so agents and framework adapters can decide whether to retry, ask the user for different input, or stop.

The OpenAPI schema is dynamic and agent-scoped. Once apps connect, `/openapi.json` includes a concrete operation per visible tool with that tool's declared input schema and, when present, its declared output schema. This includes actions, resources, and focusable components, which is friendlier for ChatGPT Actions and other hosted OpenAPI providers than a single generic operation.

For hosted schema importers that cannot send headers during import, use `?agentId=`:

```text
https://gateway.example.com/openapi.json?agentId=chatgpt-actions
```

The same identity filtering applies as `GET /tools`, so profile-limited or `allowedAgents`-limited tools are hidden from the imported schema.

## HTTP API key

When exposing the HTTP gateway outside localhost, set an agent-facing API key:

```bash
MOBIGENT_HTTP_API_KEY=http-secret npm run dev:http
```

Protected endpoints accept either:

```text
Authorization: Bearer http-secret
x-mobigent-api-key: http-secret
```

`/health`, `/ready`, `/config`, and `/openapi.json` remain readable so providers can bootstrap, probe readiness, and import the schema. `/apps`, `/providers`, `/snapshot`, `/tools`, `/tools/stream`, `/metrics`, `/metrics/prometheus`, `/audit`, `/audit/stream`, and tool calls are protected. When the API key is enabled, `/openapi.json` includes bearer and API-key security schemes for protected operations.

For stronger multi-provider deployments, bind API keys to agent ids:

```ts
const app = createHttpApp(gateway, {
  agentApiKeys: {
    "chatgpt-actions": process.env.CHATGPT_ACTIONS_KEY!,
    cursor: process.env.CURSOR_AGENT_KEY!,
    "openrouter-prod": process.env.OPENROUTER_AGENT_KEY!
  }
});
```

For `npx mobigent-http`, pass JSON:

```bash
MOBIGENT_HTTP_AGENT_API_KEYS='{"chatgpt-actions":"chatgpt-secret","cursor":"cursor-secret"}' \
npx mobigent-http
```

When a per-agent key is used, the gateway pins the request to that agent id. If the caller sends a conflicting `x-mobigent-agent`, the gateway returns `403`. This keeps agent profiles meaningful even when different providers share one public gateway.

## HTTP CORS

The HTTP app uses permissive CORS by default for local development. Restrict browser origins in production:

```ts
const app = createHttpApp(gateway, {
  apiKey: process.env.MOBIGENT_HTTP_API_KEY,
  corsOrigins: ["https://agent.example.com"]
});
```

For `npx mobigent-http`, use a comma-separated list:

```bash
MOBIGENT_HTTP_CORS_ORIGINS=https://agent.example.com,https://admin.example.com npm run dev:http
```

## HTTP JSON body limit

The HTTP gateway accepts JSON request bodies up to `1mb` by default. Tune this for production:

```ts
const app = createHttpApp(gateway, {
  jsonBodyLimit: "256kb"
});
```

For `npx mobigent-http`, set:

```bash
MOBIGENT_HTTP_JSON_LIMIT=256kb npm run dev:http
```

Requests above the configured limit return `413` with a JSON error.

## App id allowlist

Restrict the gateway to known mobile apps:

```bash
MOBIGENT_ALLOWED_APP_IDS=com.example.expenses,com.example.crm npm run dev:http
```

In code:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  allowedAppIds: ["com.example.expenses"]
});
```

Disallowed apps are rejected before their manifest is accepted.

## Protocol compatibility

Apps send `protocolVersion` in the initial `hello` and manifest. The gateway replies with a `ready` message containing the negotiated protocol version and supported versions. Unsupported protocol versions are rejected during `hello` and recorded as `app.rejected` audit events with `reason: "unsupported_protocol_version"`.

If two connected app sessions would expose the same full tool name, the newer manifest is rejected and recorded as `manifest.rejected` with `reason: "duplicate_tool_name"`. This prevents ambiguous routing when duplicate dev builds or app installs are connected.

Malformed manifests are rejected before signature and cross-session duplicate-name checks. The gateway records `manifest.rejected` with `reason: "invalid_manifest"` and validation errors in audit details. This also catches duplicate tool names inside one manifest, including cross-type collisions such as action `get_profile` plus resource `profile`.

## MCP stdio

```bash
npm run dev:mcp
```

MCP is best for local desktop agents because it supports dynamic tool discovery without a public URL.

## Gateway policies

The gateway enforces policy metadata from registered actions and resources:

```ts
intentBridge.registerAction({
  name: "delete_expense",
  description: "Delete an expense.",
  inputSchema: { type: "object", properties: {} },
  policy: {
    allowedAgents: ["claude-desktop", "cursor"],
    rateLimitPerMinute: 5,
    foregroundOnly: true,
    requiresUser: true
  },
  handler: async () => ({ deleted: true })
});
```

Direct gateway callers can pass an agent id:

```ts
await gateway.callTool("com_example_app.delete_expense", {}, {
  agentId: "claude-desktop",
  timeoutMs: 30_000
});
```

## Agent profiles

Agent profiles are gateway-owned allowlists and guardrails. They are useful when one gateway serves multiple providers, for example letting ChatGPT Actions read data, letting Cursor call developer-only tools, and blocking hosted providers from high-risk write actions.

```ts
const gateway = new BridgeGateway({
  port: 8787,
  agentProfiles: {
    "chatgpt-actions": {
      description: "Hosted read-only provider.",
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
MOBIGENT_AGENT_PROFILES='{"chatgpt-actions":{"readOnly":true,"maxRisk":"low","allowedTools":["com_example_expenses.*"]}}' \
npx mobigent-http
```

Profiles support `allowedTools`, `deniedTools`, `readOnly`, and `maxRisk`. Tool patterns can be exact names or prefix wildcards such as `com_example_expenses.*`. The `*` profile applies to agents without a more specific profile, including anonymous HTTP callers.

## Audit trail

Use `gateway.onAudit()` for live events and `gateway.getAuditLog()` for recent in-memory events. The HTTP gateway also exposes `GET /audit?limit=50`.

For dashboards, logs, and hosted provider debugging, stream audit events with Server-Sent Events:

```bash
curl -N http://localhost:8788/audit/stream?replay=25 \
  -H "authorization: Bearer http-secret"
```

Each event is emitted as `event: audit` with the audit event JSON in `data`. The optional `replay` query sends recent in-memory events before live events.
