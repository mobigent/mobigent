# Production Readiness Backlog

This backlog is issue-ready. Convert each item into an issue or task before implementation.

Priority definitions:

- P0: required before production-ready claim.
- P1: strongly recommended before broad beta or public launch.
- P2: follow-up after initial production release.

## P0: Baseline And Truth

### P0-001 Reconcile roadmap and status docs

Problem:

- Current code includes native Swift and Android packages, but root `ROADMAP.md` still lists native iOS and Android adapters as future work.

Scope:

- Update root `ROADMAP.md`.
- Update README status if needed.
- Check docs site pages under `apps/docs/docs`.
- Keep public status language precise: preview, beta, release candidate, or production.

Acceptance:

- No public doc contradicts the package inventory.

### P0-002 Establish full baseline command report

Scope:

- Run `npm run verify`, `npm run verify:ios`, `npm run verify:android`, `npm run docs:build`, and Docker build.
- Save results in an issue comment or release readiness note.

Acceptance:

- Failures are either fixed or tracked with exact blockers.

## P0: Gateway Security

### P0-003 Add typed production config validation

Scope:

- Centralize env parsing.
- Validate all `MOBIGENT_*` env vars.
- Redact secrets in diagnostics.
- Add production mode checks.

Acceptance:

- Invalid JSON/numbers/URLs fail with actionable messages.
- Production mode warns or fails when critical controls are missing.

### P0-004 Make public endpoint policy explicit

Scope:

- Add config for `/health`, `/ready`, `/config`, and `/openapi.json` exposure.
- Preserve local defaults.
- Add tests for authenticated and unauthenticated behavior.

Acceptance:

- Operators can intentionally choose public, protected, or disabled endpoint posture where relevant.

### P0-005 Protect or disable inspector in production

Scope:

- Add production inspector policy.
- Ensure inspector is not accidentally public.
- Update docs and tests.

Acceptance:

- Production deployments cannot expose `/inspect` without explicit opt-in or auth.

### P0-006 Create threat model and abuse-case matrix

Scope:

- Document assets, trust boundaries, actors, abuse cases, controls, gaps, and owners.
- Include app SDK, gateway, provider APIs, audit logs, native SDKs, and release pipeline.

Acceptance:

- Security review has a concrete artifact to approve.

## P0: Observability And Audit

### P0-007 Add structured logging

Scope:

- Add logger abstraction/injection.
- Emit structured logs for sessions, manifests, HTTP requests, tool calls, policy denials, errors, and shutdown.

Acceptance:

- Logs can be correlated by request/session/app/agent/tool without leaking secrets.

### P0-008 Add production audit sink strategy

Scope:

- Define `AuditSink`.
- Keep memory and JSONL support.
- Add rotation/export or durable sink.
- Add sink failure metrics and tests.

Acceptance:

- Production audit persistence does not depend only on process memory.

### P0-009 Add dashboards and alerts

Scope:

- Provide Prometheus queries or dashboard templates.
- Add alert rules for readiness, app sessions, failures, timeouts, denials, auth rejection spikes, and audit sink failures.

Acceptance:

- Operators have a documented monitoring starting point.

## P0: Release And Compatibility

### P0-010 Define compatibility policy

Scope:

- Protocol versions.
- package exports.
- ESM-only support.
- CLI commands.
- provider adapters.
- native SDKs.
- starter template.

Acceptance:

- Breaking changes have a documented process.

### P0-011 Verify public npm install path

Scope:

- Publish or use packed tarballs before npm is available.
- Install in clean temp app.
- Run starter app check.
- Verify `@mobigent/app`, `@mobigent/backend`, `create-mobigent-app`, and `mobigent`.

Acceptance:

- User-facing install commands work outside the repo.

### P0-012 Add release checklist and rollback notes

Scope:

- Changelog.
- version bump.
- full gates.
- publish.
- verify visibility.
- clean install.
- rollback/patch guidance.

Acceptance:

- Release manager can ship without tribal knowledge.

## P0: Mobile Runtime Validation

### P0-013 Add full-loop mobile E2E example

Scope:

- Minimal React Native or Expo app.
- Connect to gateway/backend.
- Register read and confirmed write.
- Emit event.
- Exercise reconnect/diagnostics.

Acceptance:

- Example proves the app/backend/gateway loop on a real mobile runtime.

### P0-014 Add emulator/simulator or manual release gate

Scope:

- Android emulator CI if feasible.
- iOS simulator CI if feasible.
- Manual QA checklist when CI is impractical.

Acceptance:

- Release candidates include mobile runtime evidence.

## P1: Durability And Scale

### P1-001 Add idempotency store interface

Scope:

- Memory implementation.
- Durable implementation or documented adapter.
- concurrency contract tests.

Acceptance:

- Write deduplication can survive process restart when configured.

### P1-002 Add rate-limit store interface

Scope:

- Memory implementation.
- Durable/shared implementation.
- cross-instance tests if supported.

Acceptance:

- Rate limits can be enforced in scaled deployments.

### P1-003 Add graceful shutdown and drain

Scope:

- Stop accepting new calls.
- drain in-flight calls.
- close WebSocket sessions intentionally.
- emit audit/log events.

Acceptance:

- Deploy/restart behavior is predictable.

### P1-004 Add load and performance tests

Scope:

- connected sessions.
- tools per manifest.
- concurrent calls.
- SSE clients.
- policy denials/timeouts.

Acceptance:

- Baseline performance numbers are published and guarded.

## P1: CI And Security Automation

### P1-005 Add lint, format, and coverage gates

Scope:

- Root scripts.
- CI integration.
- report-only coverage initially.

Acceptance:

- Style and coverage drift are visible in every PR.

### P1-006 Add security workflows

Scope:

- CodeQL.
- dependency review.
- scheduled dependency audit.
- Docker scan.
- SBOM.

Acceptance:

- Dependency and code security risks are visible before release.

### P1-007 Add API/export checks

Scope:

- Snapshot public exports and declarations.
- Fail unexpected removal.

Acceptance:

- Public API drift is reviewed intentionally.

## P1: Docs And Developer Experience

### P1-008 Rework docs site launch IA

Scope:

- Clear paths for app developer, backend developer, gateway operator, provider integrator, native user.
- Production guide links security, observability, scaling, and release compatibility.

Acceptance:

- New users can choose the right path quickly.

### P1-009 Add provider compatibility matrix

Scope:

- Supported providers.
- required transport.
- auth model.
- known limitations.
- test fixture status.

Acceptance:

- Provider claims are backed by docs/tests.

### P1-010 Add migration and deprecation docs

Scope:

- Pre-1.0 breaking change policy.
- migration template.
- deprecation warning policy.

Acceptance:

- Users can upgrade with predictable guidance.

## P2: Enterprise And Hosted Future

### P2-001 Distributed gateway design

Scope:

- shared session directory.
- tool registry.
- tenant isolation.
- routing.
- storage.

Acceptance:

- Architecture doc is ready before implementation.

### P2-002 Admin dashboard/control plane

Scope:

- sessions.
- tools.
- agents.
- policies.
- audit search.
- health.

Acceptance:

- Operators can inspect production state without raw logs.

### P2-003 Enterprise auth

Scope:

- OIDC/JWT for operator APIs.
- key rotation.
- scoped tokens.

Acceptance:

- Enterprise deployments do not rely only on static shared secrets.

### P2-004 Compliance-ready audit exports

Scope:

- retention.
- encryption.
- access logs.
- export formats.

Acceptance:

- Compliance-sensitive users have a credible audit story.
