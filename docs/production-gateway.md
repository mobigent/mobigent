# Production Gateway Guide

The Mobigent gateway is the bridge between connected apps and agent runtimes. In production it should be treated like an API service.

## Recommended Topology

```text
Mobile app SDK  ->  Mobigent WebSocket gateway  ->  HTTP/OpenAPI/MCP providers  ->  Agent
```

Hosted providers such as ChatGPT Actions need a public HTTPS URL for the HTTP API and OpenAPI schema. Local MCP clients can run the gateway locally.

## Environment

```bash
MOBIGENT_WS_PORT=8787
MOBIGENT_HTTP_PORT=8788
MOBIGENT_AUTH_TOKEN=app-session-secret
MOBIGENT_HTTP_API_KEY=agent-http-secret
MOBIGENT_ALLOWED_APP_IDS=com.example.app
MOBIGENT_MANIFEST_SIGNING_SECRET=manifest-secret
MOBIGENT_AUDIT_LOG_PATH=/data/mobigent-audit.jsonl
MOBIGENT_HTTP_CORS_ORIGINS=https://your-admin.example.com
MOBIGENT_HTTP_JSON_LIMIT=256kb
MOBIGENT_IDEMPOTENCY_RECORD_TTL_MS=300000
MOBIGENT_CLEANUP_INTERVAL_MS=60000
```

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
curl https://gateway.example.com/ready?minApps=1&minTools=1
curl https://gateway.example.com/metrics
curl https://gateway.example.com/metrics/prometheus
```

`/ready` should gate agent startup when a connected app and tools are required.

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

## Scaling Notes

The current gateway keeps connected sessions in memory. For early production, run one gateway per environment or tenant and keep mobile apps sticky to that gateway. A future distributed gateway can add shared session routing and durable tool registry storage without changing the SDK wire contract.
