# Current State Assessment

Assessment date: 2026-07-07.

## Verification Performed

Command executed:

```bash
npm test
```

Result:

- SDK packages built successfully.
- Node test runner passed `138/138` tests.
- No failures, skips, or TODO tests were reported.

Commands not executed during this handoff:

- `npm run verify`
- `npm run verify:ios`
- `npm run verify:android`
- `npm run docs:build`
- Docker build and runtime smoke checks
- real npm registry install checks
- emulator/device checks

Those commands belong in the next agent's baseline pass before starting implementation.

## Repository Shape

The repository is a private npm workspace monorepo named `mobigent-repo`, currently versioned at `0.1.15`.

Workspace groups:

- `packages/*`: SDKs, gateway, CLI, provider adapters, starter generator.
- `apps/*`: docs site.
- `examples/*`: expense app, provider examples, native examples.

Key root files:

- `package.json`: workspace scripts and version.
- `tsconfig.json`: strict TypeScript, `NodeNext`, ES2022, declaration/source maps.
- `Dockerfile`: production-oriented gateway image.
- `.github/workflows/ci.yml`: Node 20/22 verify matrix.
- `.github/workflows/native.yml`: Swift and Android CI.
- `.github/workflows/release.yml`: tag release, npm publish, GitHub Packages, GitHub release artifacts.
- `SECURITY.md`: public vulnerability policy and defaults.
- `ROADMAP.md`: older roadmap, now partially stale.
- `docs/`: user-facing guides and deployment docs.

## Package Inventory

`@mobigent/core`

- Shared protocol, schemas, tool naming, canonical JSON, manifest validation, sanitization.
- ESM package with declarations and source maps.

`@mobigent/react-native`

- Mobile-side bridge, capability registration, confirmation flow, reconnect, heartbeat, event queue, diagnostics, Expo helpers, schema helpers, CLI scaffolding, UI exports.
- Depends on `@mobigent/core` and `zod`.
- Peer dependencies currently specify React and React Native.

`@mobigent/app`

- Product-facing wrapper over the React Native SDK.
- Provides lower-ceremony app function definitions and app setup helpers.
- Depends on `@mobigent/react-native`.

`@mobigent/gateway`

- WebSocket gateway for app sessions.
- HTTP API, OpenAPI schema, MCP server, inspector, SSE streams.
- Implements auth token checks, HTTP API keys, per-agent keys, CORS restrictions, JSON body limits, app id allowlists, manifest signing, agent profiles, rate limits, idempotency, audit logs, metrics, and Prometheus output.
- Current state keeps app sessions, tool registry, idempotency, rate-limit buckets, metrics, and recent audit events in memory, with optional JSONL audit file output.

`@mobigent/backend`

- Developer-facing backend helper that starts gateway/HTTP services and exposes app functions without tool vocabulary.
- Provides client/app config generation, setup helpers, readiness waits, provider bundle helpers, and function call wrappers.

`@mobigent/providers`

- Provider catalog and adapters for OpenAI, ChatGPT Actions, Anthropic, Gemini, Bedrock, Vercel AI SDK, LangChain, LlamaIndex, Mastra, Cursor/VS Code MCP, and additional OpenAI-compatible providers.
- Includes HTTP client/runtime utilities, provider setup validation, diagnostics, safe tool name mapping, runtime config reports, and CLI.

`mobigent`

- Friendly CLI wrapper over the app/backend/react-native/create-app workflow.

`create-mobigent-app`

- Starter generator with install/runtime validation scripts.

Native packages:

- `packages/ios`: Swift Package named `Mobigent`, iOS 15+ target.
- `packages/android`: Gradle/Kotlin Android library with example app, JVM 17 target.

## Existing Strengths

Architecture:

- Clear separation between protocol/core, app SDK, backend helper, gateway, provider adapters, and starter tooling.
- Agent-facing protocols share one gateway core rather than separate behavior per provider.
- TypeScript strict mode is enabled.
- ESM-only packaging is consistent across npm packages.
- Workspaces make build and release orchestration straightforward.

Security:

- App sessions can require `MOBIGENT_AUTH_TOKEN`.
- HTTP endpoints can require `MOBIGENT_HTTP_API_KEY`.
- Per-agent API keys bind keys to agent ids.
- App ids can be allowlisted.
- Capability manifests can be signed.
- Agent profiles can filter discovery and enforce read-only/max-risk policies.
- Tool policies support allowed agents and rate limits.
- Action/resource output validation exists.
- Audit redaction covers common secret keys, with configurable extra keys.
- CORS and JSON body size limits are configurable.

Reliability:

- SDK reconnect, heartbeat, disconnected event queue, and connection state subscriptions are implemented and tested.
- Gateway supports request ids, idempotency keys, per-call timeouts, and cleanup of retained records.
- Readiness endpoints can require minimum app/function counts.
- Provider HTTP client retries transient failures and waits for readiness/tools.

Observability:

- Gateway has health, readiness, metrics, Prometheus metrics, audit list, audit SSE stream, tools SSE stream, and inspector.
- Audit event taxonomy covers startup, sessions, manifest registration/rejection, malformed messages, tool calls, denials, failures, timeouts, deduplication, and app events.

Release:

- CI runs `npm run verify` on Node 20 and 22.
- Native CI runs Swift tests/builds and Android tests/example builds.
- Release workflow supports npm token publishing, npm Trusted Publishing, GitHub Packages, GitHub release tarballs, and native package validation.
- Publish scripts have preflight/status/idempotency checks.
- Package `files` allowlists restrict npm contents.

Docs:

- Quickstart, React Native, existing app, iOS, Android, MCP, ChatGPT Actions, production gateway, security, npm publishing, native publishing, and developer workflow docs already exist.
- Docs site exists under `apps/docs`.

Testing:

- `tests/bridge.test.ts` provides broad coverage across gateway, HTTP, MCP, OpenAPI, providers, policy, audit, metrics, auth, app SDK, React Native helpers, and CLI behavior.
- `tests/simple-dx.test.ts` covers the low-ceremony product-facing app/backend APIs.
- `tests/native-protocol.test.ts` validates shared native protocol shape.

## Production Readiness Gaps

P0 gaps:

- No full production threat model, abuse-case matrix, or formal security review artifact.
- Public status language is inconsistent. `README.md` says native SDKs exist, while `ROADMAP.md` still lists native iOS and Android adapters under "Later".
- Gateway state is in memory. This is acceptable for a single sticky gateway but not for high availability or horizontal scale.
- Durable audit logging is file-based JSONL only. There is no storage interface, retention policy, rotation story, encryption guidance, or export pipeline.
- Rate-limit and idempotency state is process-local. It resets on restart and does not work across horizontally scaled gateway instances.
- Observability is useful but not complete. There is no structured logger abstraction, OpenTelemetry tracing, standard dashboard, SLO, or alert pack.
- Production HTTP auth defaults need an explicit decision. `/health`, `/ready`, `/config`, and `/openapi.json` can be public even when HTTP auth is configured. That can be legitimate for some provider flows, but it must be documented, configurable, and tested as an intentional production posture.
- Inspector protection depends on deployment and HTTP middleware. It should have an explicit production access policy and tests for protected deployments.
- Real mobile runtime coverage is thin. Native package builds/tests exist, but there is no recurring React Native app running on iOS/Android simulators or real devices through the full bridge.
- Release validation does not appear to install from the final public npm registry as a required gate before launch.
- No formal backwards compatibility policy for protocol versions, package exports, native SDKs, provider adapters, or generated starter templates.

P1 gaps:

- No coverage reporting or minimum coverage thresholds.
- No linter/formatter gate is visible in root scripts.
- No CodeQL, dependency review, secret scanning workflow, or scheduled security audit workflow is visible.
- No load/performance tests for many app sessions, high tool counts, long-running calls, SSE clients, or provider retries.
- `tests/bridge.test.ts` is very large and mixes many domains. It works today but will become harder to maintain as production features expand.
- Docker image is present but lacks a documented smoke-test gate, image scanning, SBOM, non-root runtime user, and healthcheck.
- Native publishing is not complete for Android Maven Central.
- Provider compatibility is broad but needs automated external conformance checks or recorded fixtures for real provider formats.
- Docs site likely needs information architecture cleanup before launch.

P2 gaps:

- No public support policy beyond `SECURITY.md`.
- No deprecation process or changelog template for breaking changes.
- No telemetry privacy statement.
- No customer-facing migration guides.
- No examples for multitenant deployments, enterprise auth, or persistent audit storage.
- No hosted cloud gateway control plane yet. The docs correctly describe this as future work.

## Current Risk Profile

Lowest risk areas:

- Protocol validation and tool naming.
- Local app/backend developer experience.
- Provider shape mapping and SDK API ergonomics.
- Basic gateway auth/policy/rate-limit/idempotency behavior.

Medium risk areas:

- Release packaging and real install path until npm publishing is verified end to end.
- Documentation consistency across root docs, docs site docs, and package READMEs.
- Native SDK maturity and full mobile runtime confidence.
- Long-term test maintainability due to large combined test files.

Highest risk areas:

- Hosted production gateway security posture.
- Operations under scale or restart.
- Audit durability/compliance.
- Compatibility guarantees once real users adopt pre-1.0 packages.
- Public endpoint exposure decisions for OpenAPI/config/readiness.

## Recommended Production Target

Initial production target:

- One gateway deployment per environment or tenant.
- Sticky WebSocket routing if multiple runtime instances are temporarily unavoidable.
- Required app auth token, HTTP auth, app id allowlist, manifest signing, restricted CORS, smaller JSON limit, request ids, idempotency keys for writes, audit export, metrics scraping, and protected inspector.
- Release from npm packages, not local workspace paths.
- Public docs clearly label what is stable, preview, and experimental.

Full production target:

- Durable shared storage for audit, idempotency, rate limits, connected session directory, and tool registry snapshots.
- Horizontal scale with explicit session routing and app affinity.
- OpenTelemetry traces and structured logs.
- Security workflows and documented threat model.
- Real device/emulator E2E coverage.
- npm, Swift Package Manager, and Maven Central release channels.
- Compatibility and deprecation policy with protocol version tests.
