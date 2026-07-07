# Production Roadmap

This roadmap assumes the current codebase remains the foundation. The goal is to harden, validate, and operationalize it rather than restart the architecture.

## Milestone 0: Handoff And Baseline

Target duration: 1-2 days.

Objective:

- Establish a clean baseline before implementation.
- Convert this handoff into tracked issues or tasks.
- Fix obvious documentation drift.

Deliverables:

- Root `AGENTS.md` is read and followed.
- `npm run verify` passes locally and in CI.
- `npm run verify:ios`, `npm run verify:android`, and `npm run docs:build` are either passing or documented with exact blockers.
- Root `ROADMAP.md`, README status, docs site status, and this production-readiness pack agree on the current native SDK state.
- Issue tracker is populated from `backlog.md`.

Exit criteria:

- A future agent can run one command sequence and know whether the repository is healthy.
- There is no stale public roadmap claim that contradicts current code.

## Milestone 1: Release Candidate Hygiene

Target duration: 3-7 days.

Objective:

- Make the existing preview safer to release and easier to validate.

Deliverables:

- Add or enforce lint/format checks.
- Add coverage collection for Node tests and set an initial report-only threshold.
- Split or tag high-level test groups so gateway, providers, app DX, and native protocol can be run independently.
- Add Docker build and container smoke test to CI.
- Add package install smoke tests from generated tarballs in clean temp projects.
- Add docs build to required CI if it is not already required by `npm run verify`.
- Add a release checklist that requires npm package visibility and starter-app install checks.

Exit criteria:

- Release candidates can be built, packed, installed, smoke-tested, and documented from a clean checkout.
- The team can see what changed in package contents before publishing.

## Milestone 2: Production Gateway Hardening

Target duration: 1-2 weeks.

Objective:

- Make hosted gateway deployments explicitly secure, observable, and restart-tolerant for early production.

Deliverables:

- Add a typed configuration loader with validation and startup diagnostics.
- Add explicit production mode, for example `MOBIGENT_ENV=production`, that warns or fails when critical controls are missing.
- Make public endpoint policy configurable for `/openapi.json`, `/config`, `/ready`, and `/health`.
- Add dedicated inspector access control. Options include requiring HTTP auth, disabling inspector in production, or binding inspector to an internal listener.
- Add structured logging abstraction with request id, session id, app id, agent id, tool name, status, duration, and error code fields.
- Add OpenTelemetry hooks for traces and metrics.
- Add dashboard and alert templates for gateway health.
- Add durable audit sink interface with JSONL as one implementation and a production implementation option, such as Postgres, S3-compatible object storage, or webhook/export callback.
- Add storage interfaces for idempotency and rate limits. Keep memory implementations for local use.
- Add graceful shutdown and drain behavior for WebSocket sessions and in-flight calls.

Exit criteria:

- A production gateway can start with validated config, emit structured telemetry, protect operator endpoints, and persist audit events outside process memory.
- Restart behavior and in-flight call behavior are documented and tested.

## Milestone 3: Mobile Runtime Confidence

Target duration: 1-2 weeks.

Objective:

- Prove the SDK works beyond unit-level mocks and protocol fixtures.

Deliverables:

- Add a minimal Expo or React Native example app that runs the full app/backend/gateway loop.
- Add emulator CI for Android using the example app where practical.
- Add iOS simulator CI where practical, or document the limitation with manual release-gate steps.
- Add native Swift/Kotlin integration tests for hello, manifest, action call, confirmation, event, heartbeat, reconnect, and error paths.
- Add real-device/manual QA script with screenshots or logs for every release candidate.
- Add compatibility matrix for supported React Native, Expo, iOS, Android, Node, and package-manager versions.

Exit criteria:

- A release cannot be called production-ready unless at least one real mobile runtime path has exercised registration, tool discovery, confirmed write, read, event, reconnect, and audit capture.

## Milestone 4: Provider And API Compatibility

Target duration: 1 week.

Objective:

- Make provider integrations reliable as external APIs evolve.

Deliverables:

- Freeze and document the gateway HTTP API error schema.
- Add OpenAPI schema snapshot tests.
- Add provider adapter fixture tests for each supported provider output shape.
- Add conformance tests for safe tool names and reverse mapping.
- Add compatibility/deprecation policy for protocol version, package exports, provider adapters, CLI commands, and generated starter files.
- Add migration notes for any breaking changes since `0.1.15`.

Exit criteria:

- The project can explain what is stable, what is preview, and how breaking changes will be handled.

## Milestone 5: Public Release And Adoption

Target duration: 1 week after hardening.

Objective:

- Ship a production-ready release candidate and verify real install paths.

Deliverables:

- npm packages published and visible.
- `create-mobigent-app` verified from npm in a clean directory.
- Docker image built, scanned, and smoke-tested.
- Swift Package consumption verified from a Git tag.
- Android Maven Central path either completed or clearly marked as source/tag consumption until credentials are ready.
- Docs site updated with production deployment guide, security model, compatibility matrix, release notes, and examples.
- Public README status updated to production-ready, beta, or release candidate based on actual gates passed.

Exit criteria:

- A developer who has never seen the repository can install, run, integrate, deploy, and observe Mobigent using only public artifacts and docs.

## Milestone 6: Scale And Enterprise Readiness

Target duration: ongoing after first production release.

Objective:

- Support larger deployments and enterprise requirements.

Deliverables:

- Distributed gateway mode with shared session directory and tool registry.
- Tenant-aware gateway routing and data isolation.
- Managed secret rotation and key ids for app and agent credentials.
- Audit retention policies, export formats, and compliance controls.
- Admin dashboard or CLI for sessions, agents, tools, audit search, and policy.
- SLOs, incident runbooks, and on-call dashboards.
- Enterprise auth options, such as OIDC/JWT validation for operator APIs.

Exit criteria:

- Mobigent can support multiple production tenants, horizontal gateway scale, compliance-sensitive audit flows, and incident response without custom one-off infrastructure.
