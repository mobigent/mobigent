# Execution Strategy For Future Agents

This file describes how to execute the production-readiness work without losing the thread.

## Operating Principles

- Preserve the existing architecture unless a measured production risk requires a change.
- Prefer additive hardening over public API churn.
- Keep PRs small enough to review.
- Every behavior change needs tests and docs.
- Keep local developer ergonomics intact while tightening production defaults.
- Treat gateway security and observability as first-class product features, not deployment afterthoughts.

## Suggested Agent Roles

If multiple agents or tools are available, split work by lane.

Gateway production agent:

- Config validation
- endpoint policy
- inspector hardening
- storage interfaces
- graceful shutdown
- load tests

Observability/security agent:

- structured logging
- OpenTelemetry
- dashboards and alerts
- threat model
- security workflows
- audit redaction and retention

SDK/mobile agent:

- React Native/Expo E2E example
- native Swift/Kotlin integration tests
- simulator/emulator CI
- compatibility matrix
- app-side confirmation production guidance

Release/docs agent:

- roadmap/status reconciliation
- release checklist
- npm registry verification
- Docker smoke
- docs site updates
- changelog and migration process

One agent can do all of this, but should still execute it lane by lane.

## Recommended PR Sequence

PR 1: Baseline and doc truth

- Run baseline checks.
- Reconcile stale roadmap/status docs.
- Add release gate checklist if missing.
- No runtime behavior changes.

PR 2: CI and package hygiene

- Add lint/format/coverage/reporting.
- Add Docker smoke.
- Add clean package install smoke if missing.
- Keep behavior unchanged.

PR 3: Gateway production config

- Add typed config loader.
- Add production mode diagnostics/failures.
- Add endpoint exposure policy.
- Add inspector protection controls.
- Update docs and tests.

PR 4: Observability

- Add logger injection/structured logs.
- Add OpenTelemetry hooks.
- Add dashboard and alert docs.
- Add request/session/tool correlation tests.

PR 5: Durable state abstractions

- Add storage interfaces and memory implementations.
- Add durable audit sink implementation.
- Add idempotency and rate-limit store contracts.
- Add restart/concurrency tests.

PR 6: Mobile E2E

- Add Expo/React Native full-loop example.
- Add emulator/simulator/manual QA gates.
- Expand native integration tests.

PR 7: Release and compatibility

- Add compatibility policy and API/export checks.
- Verify npm and starter install from public artifacts.
- Complete or document native publishing channels.
- Update README status.

## Branch And Commit Strategy

Use small branches with names like:

- `codex/prod-docs-baseline`
- `codex/prod-ci-gates`
- `codex/prod-gateway-config`
- `codex/prod-observability`
- `codex/prod-durable-state`
- `codex/prod-mobile-e2e`
- `codex/prod-release-policy`

Commit style:

- Use one commit per coherent deliverable.
- Include tests/docs in the same commit as the behavior they validate.
- Avoid mechanical formatting mixed with logic changes.

## Baseline Commands

Run these before and after significant work:

```bash
npm run verify
npm run docs:build
```

Run native checks when touching native, protocol, package metadata, release, or CI:

```bash
npm run verify:ios
npm run verify:android
```

Run publish/package checks before release-related changes are considered done:

```bash
npm run pack:check
npm run packed-install:smoke
npm run npm:preflight
```

Run Docker checks when touching gateway runtime, package dependencies, or deployment docs:

```bash
docker build -t mobigent-gateway:local .
docker run --rm -p 8787:8787 -p 8788:8788 mobigent-gateway:local
```

In another shell, verify:

```bash
curl http://localhost:8788/health
curl http://localhost:8788/ready
curl http://localhost:8788/metrics/prometheus
```

## Decision Rules

Endpoint authentication:

- Local developer mode may stay permissive.
- Production mode must make public endpoint exposure explicit.
- Provider import needs can justify public OpenAPI, but this should be scoped, documented, and optionally protected.

Storage:

- Keep memory stores as default for local use.
- Add interfaces before choosing a durable implementation.
- Do not hard-code one cloud vendor into the core gateway.

Observability:

- Avoid logging raw inputs/results by default.
- Prefer ids, counts, status, duration, and error codes.
- Audit logs may contain business-sensitive data even after redaction; document retention and access expectations.

Compatibility:

- Do not remove existing exports without migration notes.
- Treat protocol version changes as cross-SDK changes.
- Add compatibility tests before changing tool names, manifest shape, HTTP error schema, or provider mapping.

Native:

- Keep native protocol parity with `@mobigent/core`.
- Do not ship production claims based only on TypeScript mocks.
- Require at least one full-loop runtime validation path.

## What To Avoid

- Do not replace the existing gateway with an unrelated server framework.
- Do not merge broad API renames into production hardening work.
- Do not make hosted production safer by breaking the local quickstart.
- Do not store or log provider/app secrets in audit details or structured logs.
- Do not hide failing native or docs checks behind a green Node-only test result.
- Do not publish packages until install paths are verified from a clean environment.

## Done Definition For The Whole Effort

The production-readiness effort is complete when:

- All P0 backlog items are closed.
- `npm run verify`, docs build, native checks, Docker smoke, package install smoke, and release preflight are green.
- Production gateway docs include secure config, endpoint policy, observability, audit retention, and scaling guidance.
- Public artifacts install and run outside the repository.
- A release candidate has full-loop mobile validation evidence.
- README and docs clearly state the production support level.
