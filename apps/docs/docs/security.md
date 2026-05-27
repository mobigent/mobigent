---
sidebar_position: 8
---

# Security Model

Mobigent is designed around app-owned control.

- The app decides which actions and resources exist.
- Inputs are validated before handlers run.
- Sensitive actions can require user confirmation.
- The gateway can allowlist trusted app ids.
- The gateway can require an auth token.
- The gateway can require signed app manifests.
- The HTTP gateway can require an agent-facing API key.
- The HTTP gateway can restrict browser CORS origins.
- The HTTP gateway can enforce a JSON body size limit.
- The gateway enforces `allowedAgents` allowlists.
- The gateway can enforce server-owned agent profiles with `allowedTools`, `deniedTools`, `readOnly`, and `maxRisk`.
- The HTTP gateway can bind API keys to specific agent ids.
- The gateway enforces `rateLimitPerMinute` per agent and tool.
- HTTP callers can identify themselves with `x-mobigent-agent`.
- Subscribe to `gateway.onAudit()` and persist important audit events outside the process.
- Configure audit redaction for app-specific sensitive fields.
- Read resources can be marked read-only.
- Agent providers receive typed capabilities, not direct UI control.

## Signed manifests

The gateway can require HMAC-SHA256 signatures before it accepts a capability manifest:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  manifestSigningSecret: process.env.MOBIGENT_MANIFEST_SIGNING_SECRET
});
```

For `npx mobigent-http`:

```bash
MOBIGENT_MANIFEST_SIGNING_SECRET=manifest-secret npx mobigent-http
```

React Native apps provide a signer callback:

```ts
mobigent.configure({
  appId: "com.example.expenses",
  appName: "Example Expenses",
  gatewayUrl: "wss://gateway.example.com",
  signManifest: async (manifest) => ({
    alg: "hmac-sha256",
    keyId: "mobile-prod",
    signature: await signManifestWithYourCrypto(manifest)
  })
});
```

Malformed, unsigned, or invalid manifests are ignored and recorded as `manifest.rejected` audit events. Malformed manifests include validation errors in audit details with `reason: "invalid_manifest"`, including duplicate tool names inside a single manifest.

## App id allowlist

Use `allowedAppIds` when the gateway should only accept known apps:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  allowedAppIds: ["com.example.expenses", "com.example.crm"]
});
```

For `npx mobigent-http`, use a comma-separated list:

```bash
MOBIGENT_ALLOWED_APP_IDS=com.example.expenses,com.example.crm npx mobigent-http
```

Disallowed apps are rejected during `hello` and recorded as `app.rejected` audit events.

## Agent profiles

Use agent profiles when provider permissions should be controlled by the gateway instead of only by app manifests:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  agentProfiles: {
    "chatgpt-actions": {
      readOnly: true,
      maxRisk: "low",
      allowedTools: ["com_example_expenses.*"]
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

Profiles are applied during discovery and execution. If a profile hides a tool, `GET /tools` omits it and direct calls are rejected.

## Per-agent HTTP keys

Use per-agent keys when multiple providers share one public gateway:

```ts
const app = createHttpApp(gateway, {
  agentApiKeys: {
    "chatgpt-actions": process.env.CHATGPT_ACTIONS_KEY!,
    cursor: process.env.CURSOR_AGENT_KEY!
  }
});
```

For `npx mobigent-http`:

```bash
MOBIGENT_HTTP_AGENT_API_KEYS='{"chatgpt-actions":"chatgpt-secret","cursor":"cursor-secret"}' \
npx mobigent-http
```

The key determines the trusted agent id for discovery, profile checks, rate limits, idempotency records, and audit metrics. If a caller presents the `chatgpt-actions` key but claims `x-mobigent-agent: cursor`, the request is rejected.

## HTTP CORS

By default, CORS is permissive for local development. Restrict browser origins when the HTTP gateway is reachable outside localhost:

```ts
const app = createHttpApp(gateway, {
  apiKey: process.env.MOBIGENT_HTTP_API_KEY,
  corsOrigins: ["https://agent.example.com"]
});
```

For `npx mobigent-http`, use:

```bash
MOBIGENT_HTTP_CORS_ORIGINS=https://agent.example.com,https://admin.example.com npx mobigent-http
```

## HTTP JSON body limit

Keep agent-facing payloads bounded with the default `1mb` JSON body limit, or set a stricter limit:

```ts
const app = createHttpApp(gateway, {
  jsonBodyLimit: "256kb"
});
```

For `npx mobigent-http`, use:

```bash
MOBIGENT_HTTP_JSON_LIMIT=256kb npx mobigent-http
```

Oversized requests return `413` before they reach tool routing.

## Audit redaction

Audit events are recursively redacted before they are stored, streamed, returned by HTTP, or written to JSONL. Mobigent redacts common secret keys by default, including `token`, `authToken`, `authorization`, `password`, and `secret`.

Add your own keys:

```ts
const gateway = new BridgeGateway({
  port: 8787,
  auditRedactKeys: ["email", "ssn", "cardNumber"]
});
```

For `npx mobigent-http`:

```bash
MOBIGENT_AUDIT_REDACT_KEYS=email,ssn,cardNumber npx mobigent-http
```

For production, add durable audit logs, scoped tokens, transport encryption, signed manifests, app id allowlists, agent profiles, audit redaction, rate limits, and per-provider allowlists.
