# Production Gateway Guide

The Mobigent gateway is the bridge between connected apps and agent runtimes. In production it should be treated like an API service.

## Recommended Topology

```text
Mobile app SDK  ->  Mobigent WebSocket gateway  ->  HTTP/OpenAPI/MCP providers  ->  Agent
```

Hosted providers such as ChatGPT Actions need a public HTTPS URL for the HTTP API and OpenAPI schema. Local MCP clients can run the gateway locally.

## Environment

```bash
# Required in production
MOBIGENT_ENV=production
MOBIGENT_AUTH_TOKEN=app-session-secret
MOBIGENT_HTTP_API_KEY=agent-http-secret

# Strongly recommended
MOBIGENT_ALLOWED_APP_IDS=com.example.app
MOBIGENT_MANIFEST_SIGNING_SECRET=manifest-secret
MOBIGENT_HTTP_CORS_ORIGINS=https://your-admin.example.com
MOBIGENT_HTTP_JSON_LIMIT=256kb

# Endpoint policy (production defaults shown)
MOBIGENT_HEALTH_ENDPOINT=public
MOBIGENT_READY_ENDPOINT=public
MOBIGENT_CONFIG_ENDPOINT=protected
MOBIGENT_OPENAPI_ENDPOINT=protected

# Inspector (disabled by default in production)
MOBIGENT_INSPECTOR=disabled

# State management
MOBIGENT_AUDIT_LOG_PATH=/data/mobigent-audit.jsonl
MOBIGENT_IDEMPOTENCY_RECORD_TTL_MS=300000
MOBIGENT_CLEANUP_INTERVAL_MS=60000

# Logging
MOBIGENT_LOG_LEVEL=info

# Optional: per-agent API keys (JSON object)
MOBIGENT_HTTP_AGENT_API_KEYS={"agent-claude":"key-1","agent-gpt":"key-2"}

# Optional: agent profiles (JSON object)
MOBIGENT_AGENT_PROFILES={"agent-claude":{"readOnly":false,"maxRisk":"medium"}}

# Optional: strict production mode (fail on missing safety controls)
MOBIGENT_STRICT_PRODUCTION=true
```

Production mode (`MOBIGENT_ENV=production`) validates that critical security controls are configured at startup. Set `MOBIGENT_STRICT_PRODUCTION=false` to use warnings instead of fatal errors during gradual rollout.

Start the gateway:

```bash
npx mobigent-http
```

## Docker

The repository includes a production-oriented Dockerfile:

```bash
docker build -t mobigent-gateway .
docker run --rm -p 8787:8787 -p 8788:8788 \
  -e MOBIGENT_AUTH_TOKEN=app-session-secret \
  -e MOBIGENT_HTTP_API_KEY=agent-http-secret \
  -e MOBIGENT_ALLOWED_APP_IDS=com.example.app \
  mobigent-gateway
```

Use a reverse proxy or platform load balancer to terminate TLS and expose the HTTP API over HTTPS and the app gateway over WSS.

## Health And Readiness

Use:

```bash
curl https://gateway.example.com/health
curl https://gateway.example.com/ready?minApps=1&minFunctions=1
curl https://gateway.example.com/metrics
curl https://gateway.example.com/metrics/prometheus
```

`/ready` should gate agent startup when a connected app and app functions are required.

For trusted development or an internal protected environment, open:

```bash
open https://gateway.example.com/inspect
```

The inspector shows connected apps, tools, metrics, audit events, and the gateway snapshot in one browser view.

## Provider Setup

For ChatGPT Actions:

```bash
curl https://gateway.example.com/openapi.json
```

Import that schema into the action builder. If the gateway uses agent profiles, import with a scoped agent id:

```text
https://gateway.example.com/openapi.json?agentId=chatgpt-actions
```

For MCP clients:

```bash
npx mobigent-mcp
```

## Operational Checklist

Before exposing a gateway to real users:

- require app session auth with `MOBIGENT_AUTH_TOKEN`
- require HTTP auth with `MOBIGENT_HTTP_API_KEY` or per-agent keys
- restrict app ids with `MOBIGENT_ALLOWED_APP_IDS`
- require signed manifests for shared environments
- restrict CORS for browser-based admin tools
- set a smaller JSON body limit
- write audit logs to durable storage
- monitor `/metrics/prometheus`
- keep `/inspect` behind trusted network access or auth
- use idempotency keys for write calls
- use request ids to correlate provider, gateway, and app logs

## Further Reading

- [Security & Threat Model](./security.md) — auth, threat model, security controls
- [Observability Guide](./observability.md) — structured logging, OpenTelemetry, dashboards, alerts
- [Operations Runbook](./operations.md) — startup checks, common failures, secret rotation, drain
- [Scaling & Deployment](./scaling.md) — horizontal scaling, Kubernetes, load balancing
- [Compatibility Policy](./compatibility-policy.md) — supported runtimes, breaking change process
- [Release Checklist](./release-checklist.md) — release process and gates
- [Threat Model](./threat-model.md) — assets, trust boundaries, abuse cases, controls
