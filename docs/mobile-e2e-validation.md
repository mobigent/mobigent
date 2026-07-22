# Mobile End-to-End Validation

This document defines the manual QA gate for mobile runtime validation. Run through this checklist on at least one platform (iOS simulator, Android emulator, or physical device) before every release candidate.

## Prerequisites

- [ ] Local gateway running (`npm run dev:http`)
- [ ] React Native/Expo development environment set up
- [ ] Example expense app built and running on simulator/emulator/device
- [ ] Gateway URL reachable from the app (use `localhost` for sim, local IP for device)

## Test Matrix

| #   | Test Case                            | Category      | Automated?   | Notes                                                |
| --- | ------------------------------------ | ------------- | ------------ | ---------------------------------------------------- |
| 1   | App connects with auth token         | Auth          | ❌ Manual    | Set `MOBIGENT_AUTH_TOKEN` and configure in app       |
| 2   | App rejected with bad auth token     | Auth          | ❌ Manual    | Verify rejection audit event                         |
| 3   | Hello handshake succeeds             | Connection    | ❌ Manual    | App id, name, SDK reported correctly                 |
| 4   | Manifest registers with actions      | Registration  | ❌ Manual    | Tools appear in `GET /tools`                         |
| 5   | Manifest registers with resources    | Registration  | ❌ Manual    | Read-only tools appear correctly                     |
| 6   | Manifest rejected when unsigned      | Registration  | ❌ Manual    | When `MOBIGENT_MANIFEST_SIGNING_SECRET` is set       |
| 7   | Read function returns data           | Tool Call     | ❌ Manual    | Read action → handler → result                       |
| 8   | Confirmed write function succeeds    | Tool Call     | ❌ Manual    | Write action → confirmation dialog → result          |
| 9   | Confirmed write denied by user       | Tool Call     | ❌ Manual    | User taps "Deny" → error returned to agent           |
| 10  | Event emitted from app               | Events        | ❌ Manual    | App event → audit event on gateway                   |
| 11  | Event received by gateway SSE        | Events        | ❌ Manual    | `GET /audit/stream` shows the event                  |
| 12  | Reconnect after gateway restart      | Resilience    | ❌ Manual    | Kill gateway, restart → app reconnects               |
| 13  | Heartbeat keeps session alive        | Resilience    | ❌ Manual    | Session stays connected for >60s                     |
| 14  | Disconnected event queue             | Resilience    | ❌ Manual    | App offline → events queued → delivered on reconnect |
| 15  | Diagnostics visible in app           | Observability | ❌ Manual    | Status badge shows connected state                   |
| 16  | Multiple apps connect simultaneously | Scale         | ✅ Automated | `concurrency.test.ts`                                |
| 17  | App id allowlist enforced            | Security      | ❌ Manual    | Disallowed app id → connection rejected              |
| 18  | Manifest signing verified            | Security      | ❌ Manual    | Signed manifest accepted, unsigned rejected          |

## Procedure

### 1. Auth & Connection

```bash
# Terminal 1: Start gateway with auth
MOBIGENT_AUTH_TOKEN=qa-test-token \
MOBIGENT_ALLOWED_APP_IDS=com.mobigent.qa \
npm run dev:http
```

In the app:

```typescript
// Configure app with auth token
Mobigent.configure({
  appId: 'com.mobigent.qa',
  appName: 'Mobigent QA',
  gatewayUrl: 'ws://localhost:8787',
  authToken: 'qa-test-token',
});
```

- [ ] **1.1** App connects successfully (gateway logs "App session connected")
- [ ] **1.2** Hello handshake succeeds (gateway logs "App hello: Mobigent QA")
- [ ] **1.3** Wrong auth token → connection rejected (gateway logs "Rejected unauthenticated app session")
- [ ] **1.4** Disallowed app id → connection rejected (gateway logs "Rejected app session with disallowed app id")

### 2. Manifest & Discovery

Register actions and resources:

```typescript
// Read action
bridge.registerResource({
  name: 'qa_expenses',
  description: 'Read QA expense reports.',
  read: async () => ({ expenses: [{ id: 1, amount: 42 }] }),
});

// Confirmed write
bridge.registerAction({
  name: 'qa_create_expense',
  description: 'Create a QA expense report.',
  inputSchema: {
    type: 'object',
    properties: { amount: { type: 'number' } },
    required: ['amount'],
  },
  confirmation: { required: true, message: 'Create expense?' },
  handler: async (input) => ({ id: Date.now(), amount: input.amount }),
});
```

- [ ] **2.1** `GET /tools` shows both tools
- [ ] **2.2** Tool names are correctly namespaced (`com_mobigent_qa.qa_expenses`, `com_mobigent_qa.qa_create_expense`)
- [ ] **2.3** Read tool has `readOnly: true`
- [ ] **2.4** Write tool has `readOnly: false`

### 3. Tool Calls

```bash
# Read
curl -X POST http://localhost:8788/tools/com_mobigent_qa.qa_expenses/call \
  -H 'content-type: application/json' -d '{}'
# Expected: {"tool":"...","result":{"expenses":[{"id":1,"amount":42}]}}

# Write (triggers confirmation in app)
curl -X POST http://localhost:8788/tools/com_mobigent_qa.qa_create_expense/call \
  -H 'content-type: application/json' -d '{"amount":99}'
# Expected: 202 while waiting for confirmation, then result after user confirms
```

- [ ] **3.1** Read returns expected data
- [ ] **3.2** Write triggers confirmation dialog in app
- [ ] **3.3** User confirms → write completes, result returned
- [ ] **3.4** User denies → error returned with `code: 'user_denied'`
- [ ] **3.5** Write timeout → error returned with `code: 'timeout'`
- [ ] **3.6** Audit event logged for each call (check `GET /audit`)

### 4. Events

In the app, emit an event:

```typescript
bridge.emit('qa_test_event', { timestamp: Date.now(), value: 'hello from mobile' });
```

- [ ] **4.1** Gateway logs "App event: qa_test_event"
- [ ] **4.2** `GET /audit` shows the event
- [ ] **4.3** `GET /audit/stream` (SSE) streams the event in real-time

### 5. Reconnect & Resilience

```bash
# Kill the gateway
kill <gateway-pid>

# Wait 5 seconds

# Restart gateway
MOBIGENT_AUTH_TOKEN=qa-test-token npm run dev:http
```

- [ ] **5.1** App detects disconnection (diagnostics shows disconnected)
- [ ] **5.2** App automatically reconnects when gateway restarts
- [ ] **5.3** Manifest re-registers after reconnect
- [ ] **5.4** Tools are available again within 10 seconds of gateway restart
- [ ] **5.5** Events emitted while disconnected are queued and delivered on reconnect
- [ ] **5.6** Heartbeat keeps session alive over extended idle (>60s)

### 6. Diagnostics

In the app, check the diagnostics UI:

- [ ] **6.1** Connection state shows "Connected" when gateway is up
- [ ] **6.2** Connection state shows "Disconnected" or "Reconnecting" when gateway is down
- [ ] **6.3** Status badge or indicator is visible
- [ ] **6.4** App id, SDK version, and protocol version are displayed

### 7. Security

```bash
# Test manifest signing
MOBIGENT_MANIFEST_SIGNING_SECRET=test-signing-secret npm run dev:http
```

- [ ] **7.1** Unsigned manifest → rejected (gateway logs "Rejected unsigned or invalid manifest")
- [ ] **7.2** Signed manifest with correct secret → accepted
- [ ] **7.3** Signed manifest with wrong secret → rejected

### 8. Swift Packages (iOS)

```bash
swift test --package-path packages/ios
swift build --package-path examples/ios-expense
```

- [ ] **8.1** 5 Swift tests pass
- [ ] **8.2** iOS expense example builds without errors

### 9. Kotlin/Gradle (Android)

```bash
gradle -p packages/android test
gradle -p examples/android-expense :app:assembleDebug
```

- [ ] **9.1** Android library tests pass
- [ ] **9.2** Android expense example APK builds without errors

## Results

| Platform        | Connection | Manifest | Read | Write | Events | Reconnect | Diagnostics | Security |
| --------------- | ---------- | -------- | ---- | ----- | ------ | --------- | ----------- | -------- |
| iOS Sim         | ⬜         | ⬜       | ⬜   | ⬜    | ⬜     | ⬜        | ⬜          | ⬜       |
| Android Emu     | ⬜         | ⬜       | ⬜   | ⬜    | ⬜     | ⬜        | ⬜          | ⬜       |
| Physical Device | ⬜         | ⬜       | ⬜   | ⬜    | ⬜     | ⬜        | ⬜          | ⬜       |

**QA performed by:** _______________
**Date:** _______________
**Device/Platform:** _______________
**App version:** _______________
**Gateway version:** _______________
