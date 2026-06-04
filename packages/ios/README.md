# Mobigent iOS

Swift Package for exposing native iOS app capabilities to AI agents through `@mobigent/backend`.

```swift
let client = MobigentClient(
    appId: "com.example.expenses",
    appName: "Expenses"
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

The default URL is the local simulator backend. Pass `gatewayURL` only for a physical device or hosted backend.

Use `onConfirmation` to render your own native approval UI before sensitive handlers run.
