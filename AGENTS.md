# AGENTS.md

This repository is Mobigent: an open-source SDK and gateway for exposing mobile app capabilities to AI agents. Use this file as the first stop for any coding agent taking over production-readiness work.

## Current Handoff

Read the production-readiness pack before making production changes:

- `docs/production-readiness/README.md`
- `docs/production-readiness/current-state.md`
- `docs/production-readiness/roadmap.md`
- `docs/production-readiness/implementation-plan.md`
- `docs/production-readiness/execution-strategy.md`
- `docs/production-readiness/quality-security-release-plan.md`
- `docs/production-readiness/backlog.md`

Baseline captured on 2026-07-07:

- `npm test` passed `138/138` tests.
- The repo was clean before these planning docs were added.
- Full `npm run verify`, native checks, docs build, Docker smoke, and registry install checks still need to be run by the execution agent.

## Repository Map

- `packages/core`: protocol, shared types, schemas, manifest validation.
- `packages/react-native`: mobile bridge, capabilities, confirmation, diagnostics, Expo/native helpers.
- `packages/app`: simpler product-facing app API over the React Native SDK.
- `packages/gateway`: WebSocket gateway, HTTP API, OpenAPI, MCP, metrics, audit, inspector.
- `packages/backend`: backend helper API for starting Mobigent and calling app functions.
- `packages/providers`: provider adapters, HTTP runtime, setup guides, diagnostics.
- `packages/cli`: `mobigent` CLI.
- `packages/create-app`: starter generator.
- `packages/ios`: Swift Package.
- `packages/android`: Kotlin/Android package.
- `apps/docs`: Vite docs site.
- `examples`: expense app, provider examples, native examples.
- `tests`: Node test suites for bridge/gateway/providers/simple DX/native protocol.
- `scripts`: release, packaging, smoke, and publish readiness scripts.

## Common Commands

Install:

```bash
npm install
```

Core validation:

```bash
npm test
npm run verify
npm run docs:build
```

Native validation:

```bash
npm run verify:ios
npm run verify:android
```

Package/release validation:

```bash
npm run pack:check
npm run packed-install:smoke
npm run npm:preflight
```

Development:

```bash
npm run dev:gateway
npm run dev:http
npm run dev:mcp
npm run demo:app
```

## Production-Readiness Priorities

Execute in this order unless the user says otherwise:

1. Reconcile docs/status drift.
2. Add or strengthen CI quality gates.
3. Harden gateway production config and endpoint policy.
4. Protect or disable inspector in production.
5. Add structured logging, OpenTelemetry hooks, dashboards, and alerts.
6. Add durable audit/idempotency/rate-limit storage interfaces.
7. Add graceful shutdown, scaling docs, and load tests.
8. Add full-loop mobile runtime validation.
9. Define compatibility and release policy.
10. Verify public package install paths.

## Guardrails

- **Do not use "codex" in branch names, commit messages, file names, examples, or any visible names.** Use descriptive prefixes like `feat/`, `fix/`, `chore/` instead.
- Do not rewrite the public API casually. The current architecture is coherent and has broad test coverage.
- Preserve local developer ergonomics while adding stricter production behavior.
- Every runtime behavior change needs tests and docs.
- Any change to protocol shape, tool names, manifest validation, HTTP error shape, provider mappings, or package exports needs compatibility review.
- Keep memory implementations for local gateway state even after adding durable interfaces.
- Avoid logging raw action inputs/results by default; they may contain user data or secrets.
- Treat audit logs as sensitive even after redaction.
- Do not call the project production ready until the gates in `docs/production-readiness/quality-security-release-plan.md` pass.

## Testing Expectations

Minimum for doc-only changes:

- Verify links and references manually.

Minimum for TypeScript changes:

```bash
npm test
```

Minimum for gateway/provider/backend/app behavior:

```bash
npm run verify
```

Minimum for protocol/native/package/release changes:

```bash
npm run verify
npm run verify:ios
npm run verify:android
npm run pack:check
```

Minimum for deployment changes:

```bash
npm run verify
npm run docs:build
docker build -t mobigent-gateway:local .
```

## Documentation Rules

- Update root docs and docs-site docs together when user-facing behavior changes.
- Keep `README.md`, `ROADMAP.md`, and production docs consistent.
- Mark preview, beta, experimental, and production-supported surfaces clearly.
- Add migration notes for breaking changes, even before 1.0.

## Release Rules

- Use SemVer tags for release workflows.
- Run publish preflight before publishing.
- Verify real install paths from npm after publishing.
- Prefer patch releases over unpublishing if a release is bad.
- Keep rollback notes in release notes for production-impacting changes.
