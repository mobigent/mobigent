# Mobigent iOS

Swift Package for exposing native iOS app capabilities to AI agents through the Mobigent gateway.

```swift
let client = MobigentClient(
    appId: "com.example.expenses",
    appName: "Expenses",
    gatewayURL: URL(string: "ws://localhost:8787")!
)

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

try await client.connect()
```

Use `onConfirmation` to render your own native approval UI before sensitive handlers run.
