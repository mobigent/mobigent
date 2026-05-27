# Mobigent iOS SDK

Mobigent's iOS SDK lets a native Swift app expose typed capabilities to AI agents through the Mobigent gateway.

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
.package(url: "https://github.com/mobigent/mobigent", from: "0.1.0")
```

## Create A Client

```swift
let client = MobigentClient(
    appId: "com.example.expenses",
    appName: "Expenses",
    gatewayURL: URL(string: "ws://localhost:8787")!,
    reconnect: .init(enabled: true),
    heartbeat: .init(enabled: true)
)
```

Use `ws://localhost:8787` in the simulator. Use your Mac's LAN IP for a physical device.

## Register Capabilities

```swift
client.registerAction(MobigentAction(
    name: "create",
    description: "Create an expense after approval.",
    inputSchema: .object([
        "merchant": .string(),
        "amount": .number()
    ], required: ["merchant", "amount"]),
    confirmation: .init(required: true, risk: .medium)
) { input in
    ["id": "EXP-1", "merchant": input["merchant"] ?? "", "amount": input["amount"] ?? 0]
})

client.registerResource(MobigentResource(
    name: "list",
    description: "List expenses.",
    outputSchema: .object(["items": .array(of: .object())], required: ["items"])
) {
    ["items": []]
})
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

The client sends the same `hello`, `manifest`, `event`, `action_result`, `resource_result`, `component_result`, and `ping` messages used by the React Native SDK.

## Example

See `examples/ios-expense` for a small native example with one confirmed action and one resource.
