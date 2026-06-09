# Mobigent iOS

Swift Package for exposing native iOS app functions to AI agents through `@mobigent/backend`.

```swift
let client = MobigentClient(
    appId: "com.example.expenses",
    appName: "Expenses"
)

client.functions("expense") { expense in
    expense.write(
        "create",
        description: "Create an expense after approval.",
        inputSchema: .object([
            "merchant": .string(),
            "amount": .number()
        ], required: ["merchant", "amount"]),
        confirmation: .init(required: true, risk: .medium)
    ) { input in
        ["id": "EXP-1", "merchant": input["merchant"] ?? "", "amount": input["amount"] ?? 0]
    }
}

try await client.connect()
```

The default URL is the local simulator backend. Pass `backendURL` only for a physical device or hosted backend.

Use `functions("expense")` to group app functions exactly how backend code calls them with `mobigent.app("expense")`.

Use `onConfirmation` to render your own native approval UI before sensitive handlers run.
