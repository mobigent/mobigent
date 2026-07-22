# Production-Readiness Verification Assignment

Verify the current production-readiness branch and make only minimal fixes for real blockers.

## Required Constraints

- Read `AGENTS.md` first.
- Do not commit, push, or rewrite history.
- Do not revert unrelated changes.
- Preserve public API unless a verification failure proves a change is required.
- Add focused tests for behavior changes.
- Keep docs accurate when runtime features are not wired yet.

## Verification Targets

1. Inspect `git status --short --branch` and the current diff.
2. Run `git diff --check origin/main...HEAD`.
3. Run `npm run format:check`.
4. Run `npm run verify`.
5. Run `npm run docker:smoke`.
6. Run `npm run verify:ios`.
7. Run `npm run verify:android`; report clearly if it only skips because Gradle is unavailable.
8. Run `actionlint` if available; otherwise report that it is not installed.

## Areas To Re-Check

- Gateway production config/defaults.
- Inspector endpoint policy, including internal/protected/disabled behavior.
- Structured logging, telemetry, and log-level documentation versus runtime wiring.
- Storage injection documentation versus runtime wiring.
- Graceful shutdown claims versus runtime behavior.
- Node engine floor.
- React Native compatibility claims versus package peer dependencies.
- Docker runtime user and healthcheck status.
- Swift `.build` output ignores.

## Expected Result

If all gates pass, return a concise report with commands run and residual risks.

If anything fails, fix only the smallest necessary scope, rerun relevant checks, and report files changed plus remaining failures.
