# Release QA Script

Run this script before every release candidate to validate the full Mobigent loop.

## Prerequisites

- [ ] Clean checkout of the release tag
- [ ] Node.js 20+ installed
- [ ] npm installed
- [ ] Docker (optional, for gateway smoke testing)
- [ ] iOS simulator or Android emulator (optional, for mobile validation)
- [ ] Swift 5.9+ (for iOS validation)
- [ ] Gradle (for Android validation, or CI-only)

## 1. Build & Test

```bash
# Install dependencies
npm ci

# Full verification
npm run verify

# Expected: all checks pass, 138+ tests pass
```

- [ ] `npm run verify` passes
- [ ] `npm run docs:build` passes
- [ ] `npm run format:check` passes
- [ ] `npm run lint` passes (0 errors, warnings acceptable)

## 2. Native Checks

```bash
# iOS
npm run verify:ios
# Expected: 5 Swift tests pass, iOS expense example builds

# Android (if Gradle available)
npm run verify:android
# Expected: Android library tests pass, example APK builds
```

- [ ] iOS: tests pass and example builds
- [ ] Android: tests pass and example builds (or documented blocker)

## 3. Package Verification

```bash
# Inspect package contents
npm run pack:check

# Smoke test packed installs
npm run packed-install:smoke

# npm publish preflight
npm run npm:preflight
```

- [ ] Package contents look correct (no extra files)
- [ ] Packed install smoke tests pass
- [ ] npm preflight passes

## 4. Docker Verification

```bash
# Build image
docker build -t mobigent-gateway:local .

# Run smoke test
npm run docker:smoke
```

- [ ] Docker image builds
- [ ] Health endpoint responds
- [ ] Prometheus metrics endpoint responds

## 5. Starter App

```bash
# Create a starter app from the local workspace
npm run starter:new -- --output /tmp/mobigent-qa

# Or from packed tarball:
cd /tmp
npx create-mobigent-app@latest mobigent-qa -- --install
cd mobigent-qa
npm test
```

- [ ] Starter app is generated without errors
- [ ] Generated app has expected files (mobigent.ts, App.tsx, etc.)
- [ ] `npm test` in generated app passes (if tests exist)

## 6. Gateway Runtime (Manual)

Start the gateway and verify endpoints:

```bash
# Terminal 1: Start gateway
npm run dev:http

# Terminal 2: Verify endpoints
curl http://localhost:8788/health
# Expected: {"ok":true,"name":"Mobigent Gateway",...}

curl http://localhost:8788/ready
# Expected: {"ok":false,...} (no apps connected is expected)

curl http://localhost:8788/metrics/prometheus
# Expected: Prometheus text metrics with mobigent_* metrics

curl http://localhost:8788/openapi.json
# Expected: OpenAPI 3.1.0 schema
```

- [ ] Health endpoint responds 200
- [ ] Readiness endpoint responds
- [ ] Prometheus metrics contain `mobigent_` metrics
- [ ] OpenAPI schema is valid JSON
- [ ] Inspector page loads (development mode)

## 7. Production Config Smoke

```bash
# Terminal 1: Start with production-like config
MOBIGENT_ENV=production \
MOBIGENT_AUTH_TOKEN=test-token \
MOBIGENT_HTTP_API_KEY=test-key \
MOBIGENT_ALLOWED_APP_IDS=com.example.app \
MOBIGENT_INSPECTOR=disabled \
npm run dev:http

# Terminal 2:
curl http://localhost:8788/health
# Expected: 200 OK

curl http://localhost:8788/inspect
# Expected: 404 (inspector disabled)
```

- [ ] Gateway starts in production mode with diagnostics
- [ ] Health endpoint still public
- [ ] Inspector returns 404 when disabled
- [ ] Protected endpoints require auth

## 8. Full-Loop Demo

```bash
# Run the built-in demo
npm run demo
# Expected: simulated expense app connects, tool calls work
```

- [ ] Demo runs without errors
- [ ] App connects and registers manifest
- [ ] Tool calls succeed
- [ ] Audit events are generated

## 9. Mobile Runtime (When Available)

### React Native / Expo

```bash
# In examples/expense-app or a test Expo app:
cd examples/expense-app
npx expo start

# In another terminal, start the gateway:
npm run dev:http

# Verify:
# - App connects to gateway
# - Manifest is registered
# - Tools are discoverable
# - Read functions work
# - Confirmed writes work
# - Events emit
# - Reconnect works after disconnection
```

- [ ] App connects to gateway over WebSocket
- [ ] Manifest registration succeeds
- [ ] Read functions return expected results
- [ ] Write functions show confirmation and complete
- [ ] Events are received by gateway
- [ ] Reconnect works after killing and restarting gateway

### Swift (iOS)

```bash
swift test --package-path packages/ios
swift build --package-path examples/ios-expense
```

- [ ] Swift tests pass (5/5)
- [ ] iOS expense example builds

### Kotlin (Android)

```bash
gradle -p packages/android test
gradle -p examples/android-expense :app:assembleDebug
```

- [ ] Android library tests pass
- [ ] Android expense example builds

## 10. Final Checklist

- [ ] All required quality gates pass
- [ ] Package contents verified
- [ ] Docker smoke test passes (if Docker available)
- [ ] Starter app generates and runs
- [ ] Gateway starts in production mode
- [ ] Endpoint policies work as configured
- [ ] Inspector is protected/disabled in production
- [ ] Demo runs end-to-end
- [ ] No unexpected warnings or errors in logs
- [ ] Docs site builds and is consistent
- [ ] Changelog and migration notes are current
- [ ] Release notes are ready

## Results

| Gate | Status | Notes |
|---|---|---|
| `npm run verify` | ⬜ | |
| `npm run verify:ios` | ⬜ | |
| `npm run verify:android` | ⬜ | |
| `npm run docs:build` | ⬜ | |
| Package check | ⬜ | |
| Docker smoke | ⬜ | |
| Starter app | ⬜ | |
| Gateway runtime | ⬜ | |
| Production config | ⬜ | |
| Full-loop demo | ⬜ | |
| Mobile runtime | ⬜ | |

**QA performed by:** _______________
**Date:** _______________
**Release candidate:** _______________
