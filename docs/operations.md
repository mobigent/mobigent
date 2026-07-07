# Mobigent Gateway Operations Runbook

## Startup Checks

Before starting the gateway in production, verify:

```bash
# 1. All required env vars are set
#    - MOBIGENT_ENV=production (or staging)
#    - MOBIGENT_AUTH_TOKEN (required for production)
#    - MOBIGENT_HTTP_API_KEY (or MOBIGENT_HTTP_AGENT_API_KEYS)
#    - MOBIGENT_ALLOWED_APP_IDS (recommended)
#    - MOBIGENT_MANIFEST_SIGNING_SECRET (recommended)
#    - MOBIGENT_HTTP_CORS_ORIGINS (recommended)
#    - MOBIGENT_HTTP_JSON_LIMIT (recommended, e.g., "100kb")

# 2. Start the gateway
npm run dev:http
# or in Docker:
docker run -d --name mobigent \
  -e MOBIGENT_ENV=production \
  -e MOBIGENT_AUTH_TOKEN="$MOBIGENT_AUTH_TOKEN" \
  -e MOBIGENT_HTTP_API_KEY="$MOBIGENT_HTTP_API_KEY" \
  -p 8787:8787 -p 8788:8788 \
  mobigent-gateway:local
```

The gateway will emit startup diagnostics showing the loaded config (secrets redacted). Review these before sending traffic.

### Production Mode Checks

When `MOBIGENT_ENV=production` (or `MOBIGENT_STRICT_PRODUCTION=true`), the gateway:

- **Warns** (non-strict) or **fails** (strict) if `MOBIGENT_AUTH_TOKEN` is missing
- **Warns** (non-strict) or **fails** (strict) if no HTTP API key is configured
- **Warns** or **fails** if inspector is enabled in production
- **Warns** if `MOBIGENT_ALLOWED_APP_IDS` is not set
- **Warns** if `MOBIGENT_MANIFEST_SIGNING_SECRET` is not set
- **Warns** if `MOBIGENT_HTTP_CORS_ORIGINS` is not set
- **Warns** if `MOBIGENT_HTTP_JSON_LIMIT` is not set

Set `MOBIGENT_STRICT_PRODUCTION=false` to use warnings instead of fatal errors (useful for gradual rollout).

## Health & Readiness

```bash
# Basic health (gateway process is running)
curl http://localhost:8788/health
# {"ok":true,"name":"Mobigent Gateway","status":{...}}

# Readiness (enough apps connected for agent work)
curl http://localhost:8788/ready
# {"ok":true, ...} or {"ok":false, ...}

# Readiness with minimum requirements
curl "http://localhost:8788/ready?minApps=1&minFunctions=1"
```

Use `/ready` as the Kubernetes readiness probe. Use `/health` as the liveness probe.

## Common Failure Modes

### No apps connecting

1. Check gateway logs for auth rejections
2. Verify the app is using the correct `MOBIGENT_BACKEND_URL`
3. Verify `MOBIGENT_AUTH_TOKEN` matches on both sides
4. Check `MOBIGENT_ALLOWED_APP_IDS` includes the app's id
5. Check network connectivity between app and gateway

### Tool calls timing out

1. Increase `x-mobigent-timeout-ms` header (max 120000)
2. Check mobile app is in foreground and responsive
3. Verify network latency between gateway and app
4. Check for long-running confirmations in the app UI

### High denial rate

1. Check agent profiles for overly restrictive policies
2. Verify agent IDs match between provider and gateway
3. Check rate-limit configuration on tools
4. Review audit logs for denial reasons

### Audit sink failures

1. Check JSONL file path permissions
2. Verify disk space on audit log volume
3. Check for file rotation if using log shipper
4. Monitor `mobigent.audit.sink_failures` metric

### Memory growth

1. Check idempotency record TTL (`MOBIGENT_IDEMPOTENCY_RECORD_TTL_MS`, default 5 min)
2. Check cleanup interval (`MOBIGENT_CLEANUP_INTERVAL_MS`, default 60s)
3. Reduce audit log in-memory limit if needed
4. Monitor `mobigent_idempotency_records` and `mobigent_rate_limit_buckets` gauges

## Secret Rotation

### App Auth Token

1. Generate new token
2. Set `MOBIGENT_AUTH_TOKEN=new-token` on gateway (both old and new temporarily)
3. Deploy updated app builds with new token
4. Remove old token from gateway config
5. Restart gateway

### HTTP API Key

1. Generate new key
2. Set `MOBIGENT_HTTP_API_KEY=new-key` on gateway
3. Update provider/integration configs with new key
4. Remove old key

### Manifest Signing Secret

1. Generate new secret
2. Set `MOBIGENT_MANIFEST_SIGNING_SECRET=new-secret`
3. Re-sign all manifests with new secret
4. Deploy updated apps

## Gateway Restart / Drain

The gateway handles SIGTERM gracefully:

1. Stop accepting new HTTP requests
2. Stop accepting new WebSocket connections
3. Allow in-flight tool calls to complete (up to configured timeout)
4. Emit `gateway.stopped` audit event
5. Close all connections and exit

### Scaling with Sticky Sessions

In a multi-instance deployment:

1. Route WebSocket connections to the same instance (sticky sessions) using:
   - Load balancer cookie-based affinity
   - Consistent hashing on `appId`
2. HTTP API calls do not require stickiness
3. Rate limits and idempotency are per-instance until durable storage is configured
4. Use the shared storage interfaces (`AuditSink`, `IdempotencyStore`, `RateLimitStore`) for cross-instance consistency

## Provider Import Issues

When providers can't discover or call tools:

1. Verify `/openapi.json` is reachable (check endpoint policy)
2. Verify the provider's API key or auth token
3. Check agent profiles for the provider's agent ID
4. Verify the app has registered its manifest
5. Check `/ready` to confirm apps are connected

### ChatGPT Actions

ChatGPT Actions imports the OpenAPI schema from `/openapi.json`. If the endpoint requires auth:

1. Use `MOBIGENT_OPENAPI_ENDPOINT=public` (default in development)
2. Or configure the ChatGPT Action with the API key
3. Verify CORS allows `https://chat.openai.com`

## Monitoring Checklist

After deployment, verify:

- [ ] `/health` returns 200
- [ ] `/ready` returns 200 (when apps connected)
- [ ] `/metrics/prometheus` is scraped by Prometheus
- [ ] Structured logs appear in log aggregator
- [ ] OTel traces appear in trace viewer (if configured)
- [ ] Dashboard panels show data
- [ ] Alert rules are configured and firing correctly
- [ ] Audit events are persisted to the configured sink
