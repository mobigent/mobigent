# Baseline Verification Report

**Date:** 2026-07-07
**Starting version:** 0.1.15

## Commands Executed

| Command                  | Status    | Details                                                                                           |
| ------------------------ | --------- | ------------------------------------------------------------------------------------------------- |
| `npm run verify`         | ✅ PASSED | 138/138 tests, typecheck, all smoke checks, pack check, packed install, npm preflight, docs build |
| `npm run docs:build`     | ✅ PASSED | Vite build successful (1701 modules)                                                              |
| `npm run verify:ios`     | ✅ PASSED | 5/5 Swift tests, iOS expense example built                                                        |
| `npm run verify:android` | ❌ FAILED | `gradle` not installed on this machine                                                            |
| `docker build`           | ❌ FAILED | Docker daemon not running (Colima not started)                                                    |

## Blockers

1. **Android verification** requires Gradle (`gradle` or `gradlew`) to be available. The project has a Gradle wrapper at `packages/android/gradlew` but it was not found during the check. This may be a CI-only path that needs `gradle` installed locally.

2. **Docker smoke tests** require Docker daemon running. On this machine Docker routes through Colima which was not started.

## Notes

- All passing checks match or exceed the baseline captured in the AGENTS.md handoff (138 tests).
- iOS verification includes both the Swift package tests and the iOS expense example build.
- The `npm run verify` command is comprehensive — it bundles typecheck, tests, smoke checks, packaging verification, npm preflight, and docs build.
