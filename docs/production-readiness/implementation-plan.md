# Implementation Plan

This plan is organized for execution by another agent. Each phase should be a small series of pull requests. Avoid mixing runtime changes, docs rewrites, and release automation changes in one PR unless the acceptance criteria require it.

## Phase 0: Baseline, Issues, And Documentation Drift

Goal:

- Make the current state explicit and remove contradictions before deeper work starts.

Tasks:

1. Run baseline commands:

```bash
npm run verify
npm run verify:ios
npm run verify:android
npm run docs:build
docker build -t mobigent-gateway:local .
```

2. Record results in a temporary implementation note or issue comment.
3. Reconcile status language:
   - `README.md`
   - `ROADMAP.md`
   - `docs/native-publishing.md`
   - `docs/ios.md`
   - `docs/android.md`
   - `apps/docs/docs/*`
4. Convert `docs/production-readiness/backlog.md` into issues or tracked work items.
5. Add a release gate checklist to docs if no equivalent exists.

Acceptance criteria:

- Public docs no longer say native iOS/Android adapters are future-only while native packages already exist.
- Baseline command failures, if any, are documented with exact command output and assigned owners.
- The next PR can focus on implementation, not state discovery.

## Phase 1: Quality Gates And Test Maintainability

Goal:

- Increase confidence without changing public behavior.

Tasks:

1. Add linting and formatting:
   - Pick tooling that fits the existing TypeScript/ESM setup.
   - Add root scripts, for example `lint`, `format:check`, and `format`.
   - Add CI jobs or fold them into `npm run verify`.
2. Add coverage reporting:
   - Start report-only to avoid blocking urgent work with arbitrary thresholds.
   - Collect per-domain coverage for gateway, providers, app/backend APIs, and React Native helpers where possible.
3. Add test grouping:
   - Keep existing tests green.
   - Introduce domain-specific npm scripts, for example `test:gateway`, `test:providers`, `test:app-dx`, `test:native-protocol`.
   - Split `tests/bridge.test.ts` only when it reduces maintenance risk; do not do a large mechanical split in the same PR as behavior changes.
4. Add clean package install checks:
   - Build/pick tarballs.
   - Install into temp apps.
   - Verify package exports, CLI entrypoints, starter generation, and runtime boot.
5. Add Docker checks:
   - Build image.
   - Run gateway container with production-like env.
   - Call `/health`, `/ready`, `/metrics/prometheus`, and protected endpoints.

Acceptance criteria:

- `npm run verify` remains green.
- CI shows lint, tests, docs build, package smoke, and Docker smoke results.
- Failures point to one domain instead of one enormous test bucket whenever practical.

## Phase 2: Production Configuration And Endpoint Policy

Goal:

- Make production deployments fail loudly when unsafe and make endpoint exposure intentional.

Tasks:

1. Create a typed gateway config module.
   - Parse `MOBIGENT_*` values once.
   - Validate numbers, JSON objects, string lists, URLs, and booleans.
   - Produce startup diagnostics without leaking secrets.
2. Add production mode.
   - Define `MOBIGENT_ENV=production` or a similarly explicit flag.
   - In production mode, fail or emit high-severity warnings when auth, app allowlist, signing, CORS, audit sink, or body limit are absent.
3. Make public endpoint policy explicit.
   - Add config for unauthenticated `/openapi.json`, `/config`, `/ready`, and `/health`.
   - Preserve local developer ergonomics.
   - Add tests for every endpoint under no-auth, API-key auth, and production mode.
4. Harden inspector access.
   - Add `MOBIGENT_INSPECTOR=enabled|disabled|internal|auth-required` or equivalent.
   - Ensure production default is safe.
   - Add tests proving inspector is inaccessible when disabled/protected.
5. Update docs:
   - `docs/production-gateway.md`
   - `docs/security.md`
   - package READMEs if env names are user-facing.

Acceptance criteria:

- Unsafe production config is caught at startup.
- Public endpoint behavior is documented and tested.
- Inspector is explicitly protected or disabled in production.
- Local quickstart remains simple.

## Phase 3: Observability And Operations

Goal:

- Give operators enough signals to run the gateway with confidence.

Tasks:

1. Add structured logging.
   - Include `requestId`, `sessionId`, `appId`, `agentId`, `tool`, `eventType`, `durationMs`, `status`, and `errorCode`.
   - Keep logs secret-safe by default.
   - Allow custom logger injection for embedders.
2. Add OpenTelemetry hooks.
   - Trace tool calls across HTTP/provider request, gateway routing, app call, and response.
   - Emit counters and histograms for tool calls, duration, denials, failures, timeouts, app sessions, manifests, SSE clients, and audit sink errors.
3. Add dashboard templates.
   - Prometheus queries.
   - Recommended panels.
   - Alert rules for no connected apps, high tool failure rate, denied spike, timeout spike, audit sink failure, auth rejection spike, high memory, and readiness failure.
4. Add operational runbook.
   - Startup checks.
   - Common failure modes.
   - Secret rotation.
   - Gateway restart/drain.
   - Provider import issues.

Acceptance criteria:

- An operator can correlate a provider request to a gateway audit event and app call result.
- Metrics and alerts distinguish user denial, policy denial, validation failure, timeout, app disconnect, and gateway error.
- Docs include copy-pasteable dashboard/alert starting points.

## Phase 4: Durable State Interfaces

Goal:

- Remove single-process assumptions from production-critical state while keeping local use simple.

Tasks:

1. Define storage interfaces:
   - `AuditSink`
   - `IdempotencyStore`
   - `RateLimitStore`
   - optional `ToolRegistrySnapshotStore`
2. Keep memory implementations for local/default usage.
3. Add a durable audit implementation:
   - Preferred first option: append-only JSONL with rotation plus documented external log shipper, or Postgres/S3 sink if infrastructure choice is known.
   - Include failure handling and metrics.
4. Add a shared idempotency implementation:
   - Use compare-and-set semantics where needed.
   - Preserve existing deduplication behavior.
5. Add shared rate limit implementation:
   - Use atomic counters or sorted windows depending on backing store.
   - Document clock assumptions.
6. Add tests:
   - Contract tests for every store.
   - Restart behavior.
   - Concurrent idempotency calls.
   - Rate-limit behavior across two gateway instances if supported.

Acceptance criteria:

- Production deployments can persist audit events and avoid losing idempotency/rate-limit state on restart.
- Existing memory behavior remains available for local demos.
- Store implementations are replaceable and documented.

## Phase 5: Gateway Lifecycle, Scaling, And Resilience

Goal:

- Make failure modes predictable and documented.

Tasks:

1. Add graceful shutdown.
   - Stop accepting new HTTP calls.
   - Stop accepting new WebSocket sessions.
   - Let in-flight calls finish until timeout.
   - Emit shutdown audit events.
2. Add app session drain semantics.
3. Document sticky session requirements for WebSocket deployments.
4. Add load tests:
   - Many connected app sessions.
   - Many tools per manifest.
   - Concurrent HTTP calls.
   - SSE clients.
   - high-denial/high-timeout scenarios.
5. Add performance budgets:
   - Manifest registration latency.
   - Tool list latency.
   - Tool call overhead excluding app handler time.
   - memory per connected app/tool.

Acceptance criteria:

- Restart/deploy behavior does not surprise operators.
- Load tests publish baseline numbers and fail on large regressions.
- Scaling docs tell users when one gateway is enough and when sticky routing/shared storage is required.

## Phase 6: Mobile And Native End-To-End Validation

Goal:

- Prove production behavior on actual mobile runtimes.

Tasks:

1. Build an Expo or React Native example app that exercises:
   - app identity from env/config
   - read functions
   - confirmed write functions
   - event emission
   - reconnect
   - diagnostics UI/status badge
   - gateway auth token
   - manifest signing where feasible
2. Add Android emulator CI:
   - install example app
   - connect to local gateway
   - execute read/write through backend or HTTP API
3. Add iOS simulator CI if feasible:
   - if not, create a documented manual QA gate.
4. Expand Swift/Kotlin protocol tests:
   - malformed manifests
   - auth rejection
   - heartbeat
   - reconnect
   - error result mapping
5. Add release QA script:
   - commands
   - expected logs
   - screenshots or artifact paths

Acceptance criteria:

- Release candidates include evidence from at least one full mobile runtime.
- Native examples are not just buildable; they prove the bridge contract.

## Phase 7: Release, Registry, And Compatibility

Goal:

- Make public releases repeatable and trustworthy.

Tasks:

1. Define compatibility policy:
   - package exports
   - ESM-only support
   - protocol version support window
   - native SDK compatibility
   - provider adapter stability
   - generated starter template stability
2. Add API/exports checks:
   - snapshot package exports
   - compare declaration output for public APIs
   - require migration notes for breaking changes
3. Verify npm publishing:
   - first publish with token if needed
   - configure Trusted Publishing once packages exist
   - run install tests from npm registry
4. Complete native release story:
   - Swift Package via Git tag
   - Android Maven Central plan or implementation
5. Add release checklist:
   - version bump
   - changelog
   - verify commands
   - package contents
   - Docker smoke
   - docs
   - registry visibility
   - rollback notes

Acceptance criteria:

- A release manager can produce a release without undocumented local knowledge.
- Public artifacts are verified from the same source users consume.
