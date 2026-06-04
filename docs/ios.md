# Mobigent iOS SDK

Mobigent's iOS SDK lets a native Swift app expose normal app functions to AI agents. Use it with `@mobigent/backend`: the backend runs the agent-facing service, and the iOS app connects with the same app id.

## Install

For local development, add the Swift package from this repository checkout:

```swift
.package(path: "../mobigent/packages/ios")
```

Use the package product:

```swift
import Mobigent
```

The package targets iOS 15+ and Swift 5.9+.

After tagged releases begin, Swift Package Manager will be able to consume the public Git tag directly:

```swift
.package(url: "https://github.com/mobigent/mobigent", from: "0.1.15")
```

## Create A Client

```swift
let client = MobigentClient(
    appId: "com.example.expenses",
    appName: "Expenses"
)
```

That default connects the iOS simulator to the local Mobigent backend. For a physical device or hosted backend, pass `backendURL` explicitly:

```swift
let client = MobigentClient(
    appId: "com.example.expenses",
    appName: "Expenses",
    backendURL: URL(string: "ws://YOUR_MAC_LAN_IP:8787")!
)
```

## Expose App Functions

```swift
client.write(
    name: "create",
    description: "Create an expense after approval.",
    inputSchema: .object([
        "merchant": .string(),
        "amount": .number()
    ], required: ["merchant", "amount"]),
    confirmation: .init(required: true, risk: .medium)
) { input in
    ["id": "EXP-1", "merchant": input["merchant"] ?? "", "amount": input["amount"] ?? 0]
}

client.read(
    name: "list",
    description: "List expenses.",
    outputSchema: .object(["items": .array(of: .object())], required: ["items"])
) {
    ["items": []]
}
```

## Confirm Sensitive Actions

```swift
client.onConfirmation { request in
    // Show your own native approval UI.
    return true
}
```

If no confirmation handler is provided, the SDK allows the action. Production apps should provide a handler for medium/high risk actions.

## Connect

```swift
try await client.connect()
client.emit(name: "expense.created", payload: ["id": "EXP-1"])
```

After the app connects, the backend can call the functions you exposed and receive the returned values.

## Test The Full Loop

Start the backend package:

```bash
npm install @mobigent/backend
```

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent("com.example.expenses");
```

Then run the iOS app and connect the client:

```swift
try await client.connect()
```

For local testing from this repo you can run:

```bash
npm run dev:http
```

Use these backend URLs when you override the default:

- iOS simulator: `ws://localhost:8787`
- physical device: `ws://YOUR_MAC_LAN_IP:8787`
- hosted backend: `wss://your-backend.example.com`

Open the local inspector:

```bash
open http://localhost:8788/inspect
```

You should see the app functions, recent audit events, and metrics. The same functions are also available to the backend through `mobigent.app.expense.create(...)` and to agents through the backend service.

## Optional App Intents Starter

Mobigent can generate a first-pass App Intents file when you want a starter for Siri or Shortcuts:

```bash
npx mobigent app \
  --platform-actions ios-swift \
  --app-id com.example.expenses \
  --app-name "Expenses" \
  --feature expense
```

Use the generated Swift as a starting point, then forward the native intent handler into your Mobigent client or app service layer. You do not need this command for normal Mobigent integration.

## Example

See `examples/ios-expense` for a small native example with one confirmed action and one resource.
