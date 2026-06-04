import XCTest
@testable import Mobigent

final class MockSocket: MobigentWebSocket {
    var isOpen = false
    var sent: [String] = []
    var onMessage: ((String) -> Void)?
    var onClose: (() -> Void)?

    func connect(onMessage: @escaping @Sendable (String) -> Void, onClose: @escaping @Sendable () -> Void) async throws {
        self.onMessage = onMessage
        self.onClose = onClose
        isOpen = true
    }

    func send(_ text: String) async throws {
        sent.append(text)
    }

    func close() {
        isOpen = false
        onClose?()
    }
}

final class MobigentTests: XCTestCase {
    func testManifestUsesIOSSDKAndProtocolShape() {
        let client = MobigentClient(appId: "com.example.app", appName: "Example")
        client.registerAction(MobigentAction(
            name: "create",
            description: "Create an expense.",
            inputSchema: .object(["amount": .number(), "merchant": .string()], required: ["amount", "merchant"]),
            confirmation: .init(required: true, risk: .medium),
            handler: { input in input }
        ))
        client.registerResource(MobigentResource(name: "list", description: "List expenses.") { ["items": []] })

        let manifest = client.manifest()
        XCTAssertEqual(manifest["sdk"] as? String, "ios")
        XCTAssertEqual(manifest["protocolVersion"] as? Int, 1)
        XCTAssertEqual((manifest["actions"] as? [MobigentJSON])?.count, 1)
        XCTAssertEqual((manifest["resources"] as? [MobigentJSON])?.count, 1)
    }

    func testFriendlyFunctionAliasesBuildTheSameManifest() {
        let client = MobigentClient(
            appId: "com.example.app",
            appName: "Example",
            backendURL: URL(string: "ws://localhost:8787")!
        )
        client.write(
            name: "create",
            description: "Create an expense.",
            inputSchema: .object(["amount": .number()], required: ["amount"]),
            confirmation: .init(required: true, risk: .medium)
        ) { input in input }
        client.read(name: "list", description: "List expenses.") {
            ["items": []]
        }
        client.screen(name: "details", description: "Focus expense details.") { props in
            props
        }

        let manifest = client.manifest()
        XCTAssertEqual(client.diagnostics.backendURL.absoluteString, "ws://localhost:8787")
        XCTAssertEqual((manifest["actions"] as? [MobigentJSON])?.count, 1)
        XCTAssertEqual((manifest["resources"] as? [MobigentJSON])?.count, 1)
        XCTAssertEqual((manifest["components"] as? [MobigentJSON])?.count, 1)
    }

    func testConnectionSendsHelloAndManifestThenFlushesEvents() async throws {
        let socket = MockSocket()
        let client = MobigentClient(
            appId: "com.example.app",
            appName: "Example",
            gatewayURL: URL(string: "ws://localhost:8787")!,
            webSocketFactory: { _ in socket }
        )
        XCTAssertTrue(client.emit(name: "queued", payload: ["id": "1"]))
        try await client.connect()

        XCTAssertEqual(client.connectionState, .connected)
        XCTAssertEqual(socket.sent.count, 3)
        XCTAssertTrue(socket.sent[0].contains("\"hello\""))
        XCTAssertTrue(socket.sent[1].contains("\"manifest\""))
        XCTAssertTrue(socket.sent[2].contains("\"queued\""))
    }

    func testConfirmationCanDenyAction() async throws {
        let socket = MockSocket()
        let client = MobigentClient(
            appId: "com.example.app",
            appName: "Example",
            gatewayURL: URL(string: "ws://localhost:8787")!,
            webSocketFactory: { _ in socket }
        )
        client.registerAction(MobigentAction(
            name: "delete",
            description: "Delete.",
            inputSchema: .object(),
            confirmation: .init(required: true, risk: .high),
            handler: { _ in ["deleted": true] }
        ))
        client.onConfirmation { _ in false }
        try await client.connect()
        socket.onMessage?("{\"type\":\"call_action\",\"id\":\"1\",\"name\":\"delete\",\"input\":{}}")
        try await Task.sleep(nanoseconds: 50_000_000)

        XCTAssertTrue(socket.sent.contains { $0.contains("\"action_result\"") && $0.contains("User rejected action") })
    }
}
