import Foundation
import Dispatch
import Mobigent

actor ExpenseStore {
    private var expenses: [[String: Any]] = []

    func create(input: [String: Any]) -> [String: Any] {
        let expense: [String: Any] = [
            "id": "EXP-\(expenses.count + 1)",
            "merchant": input["merchant"] ?? "Unknown",
            "amount": input["amount"] ?? 0
        ]
        expenses.append(expense)
        return expense
    }

    func list() -> [[String: Any]] {
        expenses
    }
}

let store = ExpenseStore()

let client = MobigentClient(
    appId: "com.mobigent.examples.ios.expense",
    appName: "Mobigent iOS Expense Example",
    gatewayURL: URL(string: ProcessInfo.processInfo.environment["MOBIGENT_GATEWAY_URL"] ?? "ws://localhost:8787")!,
    reconnect: .init(enabled: true),
    heartbeat: .init(enabled: true)
)

client.registerAction(MobigentAction(
    name: "create",
    description: "Create an expense after approval.",
    inputSchema: .object([
        "merchant": .string(),
        "amount": .number()
    ], required: ["merchant", "amount"]),
    confirmation: .init(required: true, title: "Create expense?", risk: .medium)
) { input in
    await store.create(input: input)
})

client.registerResource(MobigentResource(
    name: "list",
    description: "List expenses.",
    outputSchema: .object(["items": .array(of: .object())], required: ["items"])
) {
    ["items": await store.list()]
})

client.onConfirmation { request in
    print("Approving \(request.actionName): \(request.input)")
    return true
}

print("Connecting Mobigent iOS example to \(client.diagnostics.gatewayURL.absoluteString)")
try await client.connect()
dispatchMain()
