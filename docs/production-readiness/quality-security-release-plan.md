# Quality, Security, And Release Plan

This file defines gates that should exist before calling Mobigent production ready.

## Quality Gates

Required for every PR:

- TypeScript build passes.
- Relevant Node tests pass.
- Docs touched by behavior changes are updated.
- Package exports remain intentional.
- No generated `dist` or temporary files are committed unless the repository policy explicitly requires them.

Required for production-impacting PRs:

- `npm run verify`
- `npm run docs:build`
- package tarball smoke tests
- Docker gateway smoke if gateway/runtime behavior changed
- native checks if protocol, SDK contracts, package metadata, or examples changed

Required before release:

```bash
npm run verify
npm run verify:ios
npm run verify:android
npm run docs:build
npm run pack:check
npm run packed-install:smoke
npm run npm:preflight
```

Recommended additions:

- `npm run lint`
- `npm run format:check`
- `npm run test:coverage`
- `npm run docker:smoke`
- `npm run e2e:mobile`
- `npm run api:check`

## Test Matrix

Node:

- Node 20
- Node 22
- Current release workflow Node version

Packages:

- workspace source tests
- packed tarball install tests
- public npm install tests after publish

Gateway:

- no-auth local mode
- production mode with required auth
- per-agent key mode
- app auth token
- app allowlist
- manifest signing
- restricted CORS
- JSON body limit
- public endpoint policy combinations
- protected/disabled inspector
- graceful shutdown
- audit sink failures
- idempotency and rate-limit persistence

Provider:

- OpenAPI schema snapshots
- MCP stdio server
- HTTP provider runtime
- provider-safe tool name mapping
- each advertised provider adapter fixture
- retry and timeout behavior

Mobile:

- React Native app full loop
- Expo app full loop if Expo is a supported primary path
- Android emulator
- iOS simulator or documented manual gate
- native Swift/Kotlin package tests
- reconnect and heartbeat
- app-side confirmation

Docs:

- docs site build
- README examples compile or are smoke-tested where practical
- quickstart fresh install
- production gateway guide verified against actual env names

## Security Plan

Required artifacts:

- Threat model covering app SDK, gateway, provider API, operator endpoints, audit logs, native SDKs, and release pipeline.
- Abuse-case matrix for malicious app, malicious agent, leaked token, broad capability, prompt injection into tool inputs, replay, rate-limit bypass, audit exfiltration, and OpenAPI schema exposure.
- Production configuration checklist.
- Security review signoff before launch.

Controls to implement or verify:

- App auth required in production.
- HTTP auth required in production unless endpoint is intentionally public.
- Per-agent keys supported and documented.
- App id allowlist supported and documented.
- Manifest signing supported and documented.
- Inspector disabled or protected in production.
- OpenAPI/config/readiness public exposure is configurable.
- Request body size limits are low by default in production.
- CORS is restricted in production.
- Audit redaction defaults are tested.
- Logs do not include secrets.
- Secret rotation guidance exists.
- Rate limits work across restarts or documented single-process constraints are explicit.
- Idempotency works across restarts or documented constraints are explicit.

Recommended GitHub/security workflows:

- CodeQL for TypeScript.
- Dependency review on pull requests.
- npm audit or equivalent scheduled dependency scan.
- secret scanning enabled at repository level.
- Docker image scan.
- SBOM generation for release artifacts.
- provenance verification for npm Trusted Publishing.

Security acceptance criteria:

- A production deployment cannot accidentally start with no app auth, no HTTP auth, broad CORS, and enabled inspector without a loud failure or explicit override.
- A leaked provider key can be rotated without code changes.
- A malicious or broken app manifest cannot shadow another app's tools or bypass signing/allowlist controls.
- Audit/log output is useful for investigations without becoming a secret dump.

## Observability Plan

Required signals:

- gateway process started/stopped
- connected app sessions
- authenticated app sessions
- manifests accepted/rejected
- tool discovery count
- tool call started/succeeded/failed/denied/timed out/deduplicated
- tool call duration
- app call latency
- HTTP request count/status/duration
- SSE clients
- audit sink writes/failures
- idempotency hits/conflicts
- rate-limit denials
- auth rejections
- readiness status

Required correlation fields:

- `requestId`
- `sessionId`
- `appId`
- `agentId`
- `tool`
- `idempotencyKey` hash or presence flag, not raw sensitive values when avoidable
- `durationMs`
- `errorCode`

Suggested dashboards:

- Gateway overview: uptime, readiness, app sessions, tools, request rate.
- Tool calls: success/failure/denial/timeout rate, latency percentiles, top tools.
- Security: auth failures, manifest rejections, policy denials, rate limits.
- Audit: audit event rate, sink failures, backlog/lag if async.
- Provider health: OpenAPI calls, MCP calls, retries, timeout rate.

Suggested alerts:

- readiness failing for more than 5 minutes
- no authenticated app sessions when min apps expected
- tool timeout rate above threshold
- tool failure rate above threshold
- audit sink failing
- auth rejection spike
- manifest rejection spike
- memory or CPU pressure
- HTTP 5xx spike

## Release Plan

Release candidate checklist:

1. Decide version and release channel.
2. Update changelog.
3. Update compatibility notes and migration notes.
4. Run full quality gates.
5. Build and inspect package tarballs.
6. Build and smoke-test Docker image.
7. Verify docs site.
8. Verify starter app from packed tarballs.
9. Verify native examples.
10. Tag release candidate or SemVer release.
11. Publish packages.
12. Verify package visibility.
13. Install from public registry in a clean directory.
14. Run `npm create mobigent-app@latest my-demo -- --install`.
15. Run generated starter checks.
16. Publish release notes.
17. Monitor post-release install/errors/issues.

Rollback plan:

- npm packages cannot be truly deleted after users install them. Prefer publishing a patch release over unpublishing.
- Keep previous Docker image available.
- Keep previous Git tag and release artifacts.
- Document downgrade steps for app/backend/gateway package combinations.
- If a security issue is involved, follow `SECURITY.md` and publish patched versions quickly.

Versioning policy to define:

- Pre-1.0 releases may include breaking changes, but breaking changes still need changelog and migration notes.
- Protocol changes require compatibility tests and a supported-version window.
- Provider adapter changes require fixture updates.
- CLI command changes require deprecation warnings before removal when practical.
