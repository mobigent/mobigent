import Foundation

public typealias MobigentJSON = [String: Any]

public enum MobigentConnectionState: String, Sendable {
    case idle
    case connecting
    case connected
    case reconnecting
    case disconnected
    case error
}

public enum MobigentRisk: String, Sendable {
    case low
    case medium
    case high
}

public struct MobigentSchema {
    public let rawValue: MobigentJSON

    public init(_ rawValue: MobigentJSON) {
        self.rawValue = rawValue
    }

    public static func string(description: String? = nil) -> MobigentSchema {
        schema(type: "string", description: description)
    }

    public static func number(description: String? = nil) -> MobigentSchema {
        schema(type: "number", description: description)
    }

    public static func boolean(description: String? = nil) -> MobigentSchema {
        schema(type: "boolean", description: description)
    }

    public static func array(of items: MobigentSchema, description: String? = nil) -> MobigentSchema {
        var raw: MobigentJSON = ["type": "array", "items": items.rawValue]
        if let description { raw["description"] = description }
        return MobigentSchema(raw)
    }

    public static func object(
        _ properties: [String: MobigentSchema] = [:],
        required: [String] = [],
        description: String? = nil
    ) -> MobigentSchema {
        var raw: MobigentJSON = [
            "type": "object",
            "properties": properties.mapValues(\.rawValue)
        ]
        if !required.isEmpty { raw["required"] = required }
        if let description { raw["description"] = description }
        return MobigentSchema(raw)
    }

    public static func enumeration(_ values: [String], description: String? = nil) -> MobigentSchema {
        var raw: MobigentJSON = ["type": "string", "enum": values]
        if let description { raw["description"] = description }
        return MobigentSchema(raw)
    }

    private static func schema(type: String, description: String?) -> MobigentSchema {
        var raw: MobigentJSON = ["type": type]
        if let description { raw["description"] = description }
        return MobigentSchema(raw)
    }
}

public struct MobigentConfirmationPolicy: Sendable {
    public let required: Bool
    public let title: String?
    public let message: String?
    public let risk: MobigentRisk?

    public init(required: Bool, title: String? = nil, message: String? = nil, risk: MobigentRisk? = nil) {
        self.required = required
        self.title = title
        self.message = message
        self.risk = risk
    }

    var rawValue: MobigentJSON {
        var raw: MobigentJSON = ["required": required]
        if let title { raw["title"] = title }
        if let message { raw["message"] = message }
        if let risk { raw["risk"] = risk.rawValue }
        return raw
    }
}

public struct MobigentCapabilityPolicy: Sendable {
    public let readOnly: Bool?
    public let foregroundOnly: Bool?
    public let requiresUser: Bool?
    public let allowedAgents: [String]?
    public let rateLimitPerMinute: Int?
    public let sensitiveData: [String]?

    public init(
        readOnly: Bool? = nil,
        foregroundOnly: Bool? = nil,
        requiresUser: Bool? = nil,
        allowedAgents: [String]? = nil,
        rateLimitPerMinute: Int? = nil,
        sensitiveData: [String]? = nil
    ) {
        self.readOnly = readOnly
        self.foregroundOnly = foregroundOnly
        self.requiresUser = requiresUser
        self.allowedAgents = allowedAgents
        self.rateLimitPerMinute = rateLimitPerMinute
        self.sensitiveData = sensitiveData
    }

    var rawValue: MobigentJSON {
        var raw: MobigentJSON = [:]
        if let readOnly { raw["readOnly"] = readOnly }
        if let foregroundOnly { raw["foregroundOnly"] = foregroundOnly }
        if let requiresUser { raw["requiresUser"] = requiresUser }
        if let allowedAgents { raw["allowedAgents"] = allowedAgents }
        if let rateLimitPerMinute { raw["rateLimitPerMinute"] = rateLimitPerMinute }
        if let sensitiveData { raw["sensitiveData"] = sensitiveData }
        return raw
    }
}

public struct MobigentAction {
    public let name: String
    public let description: String
    public let inputSchema: MobigentSchema
    public let outputSchema: MobigentSchema?
    public let confirmation: MobigentConfirmationPolicy?
    public let policy: MobigentCapabilityPolicy?
    public let handler: @Sendable (MobigentJSON) async throws -> Any

    public init(
        name: String,
        description: String,
        inputSchema: MobigentSchema,
        outputSchema: MobigentSchema? = nil,
        confirmation: MobigentConfirmationPolicy? = nil,
        policy: MobigentCapabilityPolicy? = nil,
        handler: @escaping @Sendable (MobigentJSON) async throws -> Any
    ) {
        self.name = name
        self.description = description
        self.inputSchema = inputSchema
        self.outputSchema = outputSchema
        self.confirmation = confirmation
        self.policy = policy
        self.handler = handler
    }

    var manifestValue: MobigentJSON {
        var raw: MobigentJSON = [
            "name": name,
            "description": description,
            "inputSchema": inputSchema.rawValue
        ]
        if let outputSchema { raw["outputSchema"] = outputSchema.rawValue }
        if let confirmation { raw["confirmation"] = confirmation.rawValue }
        if let policy { raw["policy"] = policy.rawValue }
        return raw
    }
}

public struct MobigentResource {
    public let name: String
    public let description: String
    public let outputSchema: MobigentSchema?
    public let policy: MobigentCapabilityPolicy?
    public let read: @Sendable () async throws -> Any

    public init(
        name: String,
        description: String,
        outputSchema: MobigentSchema? = nil,
        policy: MobigentCapabilityPolicy? = nil,
        read: @escaping @Sendable () async throws -> Any
    ) {
        self.name = name
        self.description = description
        self.outputSchema = outputSchema
        self.policy = policy
        self.read = read
    }

    var manifestValue: MobigentJSON {
        var raw: MobigentJSON = ["name": name, "description": description]
        if let outputSchema { raw["outputSchema"] = outputSchema.rawValue }
        if let policy { raw["policy"] = policy.rawValue }
        return raw
    }
}

public struct MobigentComponent {
    public let name: String
    public let description: String
    public let propsSchema: MobigentSchema?
    public let policy: MobigentCapabilityPolicy?
    public let focus: @Sendable (MobigentJSON) async throws -> Any

    public init(
        name: String,
        description: String,
        propsSchema: MobigentSchema? = nil,
        policy: MobigentCapabilityPolicy? = nil,
        focus: @escaping @Sendable (MobigentJSON) async throws -> Any
    ) {
        self.name = name
        self.description = description
        self.propsSchema = propsSchema
        self.policy = policy
        self.focus = focus
    }

    var manifestValue: MobigentJSON {
        var raw: MobigentJSON = ["name": name, "description": description]
        if let propsSchema { raw["propsSchema"] = propsSchema.rawValue }
        if let policy { raw["policy"] = policy.rawValue }
        return raw
    }
}

public struct MobigentConfirmationRequest {
    public let actionName: String
    public let actionDescription: String
    public let input: MobigentJSON
    public let confirmation: MobigentConfirmationPolicy
}

public struct MobigentDiagnostics: Sendable {
    public let configured: Bool
    public let appId: String
    public let appName: String
    public let gatewayURL: URL
    public let connectionState: MobigentConnectionState
    public let connected: Bool
    public let actionCount: Int
    public let resourceCount: Int
    public let componentCount: Int
    public let queuedEventCount: Int
    public let reconnectEnabled: Bool
    public let heartbeatEnabled: Bool
    public let lastError: String?
}

public struct MobigentReconnectOptions: Sendable {
    public var enabled: Bool
    public var maxAttempts: Int
    public var delayMs: Int
    public var maxDelayMs: Int
    public var backoffFactor: Double

    public init(enabled: Bool = false, maxAttempts: Int = Int.max, delayMs: Int = 1_000, maxDelayMs: Int = 30_000, backoffFactor: Double = 2) {
        self.enabled = enabled
        self.maxAttempts = maxAttempts
        self.delayMs = delayMs
        self.maxDelayMs = maxDelayMs
        self.backoffFactor = backoffFactor
    }
}

public struct MobigentHeartbeatOptions: Sendable {
    public var enabled: Bool
    public var intervalMs: Int
    public var timeoutMs: Int

    public init(enabled: Bool = false, intervalMs: Int = 30_000, timeoutMs: Int = 10_000) {
        self.enabled = enabled
        self.intervalMs = intervalMs
        self.timeoutMs = timeoutMs
    }
}

public struct MobigentEventQueueOptions: Sendable {
    public var enabled: Bool
    public var maxSize: Int

    public init(enabled: Bool = true, maxSize: Int = 100) {
        self.enabled = enabled
        self.maxSize = maxSize
    }
}

public protocol MobigentWebSocket: AnyObject {
    var isOpen: Bool { get }
    func connect(onMessage: @escaping @Sendable (String) -> Void, onClose: @escaping @Sendable () -> Void) async throws
    func send(_ text: String) async throws
    func close()
}

public final class URLSessionMobigentWebSocket: MobigentWebSocket {
    private let url: URL
    private var task: URLSessionWebSocketTask?
    public private(set) var isOpen = false

    public init(url: URL) {
        self.url = url
    }

    public func connect(onMessage: @escaping @Sendable (String) -> Void, onClose: @escaping @Sendable () -> Void) async throws {
        let task = URLSession.shared.webSocketTask(with: url)
        self.task = task
        task.resume()
        isOpen = true
        receiveLoop(task: task, onMessage: onMessage, onClose: onClose)
    }

    public func send(_ text: String) async throws {
        try await task?.send(.string(text))
    }

    public func close() {
        isOpen = false
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
    }

    private func receiveLoop(
        task: URLSessionWebSocketTask,
        onMessage: @escaping @Sendable (String) -> Void,
        onClose: @escaping @Sendable () -> Void
    ) {
        task.receive { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(.string(let text)):
                onMessage(text)
                self.receiveLoop(task: task, onMessage: onMessage, onClose: onClose)
            case .success(.data(let data)):
                if let text = String(data: data, encoding: .utf8) {
                    onMessage(text)
                }
                self.receiveLoop(task: task, onMessage: onMessage, onClose: onClose)
            case .failure:
                self.isOpen = false
                onClose()
            @unknown default:
                self.isOpen = false
                onClose()
            }
        }
    }
}

public final class MobigentClient {
    public typealias ConfirmationHandler = @Sendable (MobigentConfirmationRequest) async -> Bool
    public typealias WebSocketFactory = @Sendable (URL) -> MobigentWebSocket

    private let appId: String
    private let appName: String
    private let gatewayURL: URL
    private let version: String
    private let authToken: String?
    private let reconnect: MobigentReconnectOptions
    private let heartbeat: MobigentHeartbeatOptions
    private let eventQueueOptions: MobigentEventQueueOptions
    private let webSocketFactory: WebSocketFactory
    private var confirmationHandler: ConfirmationHandler?
    private var actions: [String: MobigentAction] = [:]
    private var resources: [String: MobigentResource] = [:]
    private var components: [String: MobigentComponent] = [:]
    private var socket: MobigentWebSocket?
    private var queuedEvents: [MobigentJSON] = []
    private var reconnectAttempts = 0
    private var manualDisconnect = false
    private var lastError: String?
    public private(set) var connectionState: MobigentConnectionState = .idle

    public init(
        appId: String,
        appName: String,
        gatewayURL: URL,
        version: String = "0.1.3",
        authToken: String? = nil,
        reconnect: MobigentReconnectOptions = .init(),
        heartbeat: MobigentHeartbeatOptions = .init(),
        eventQueue: MobigentEventQueueOptions = .init(),
        webSocketFactory: @escaping WebSocketFactory = { URLSessionMobigentWebSocket(url: $0) }
    ) {
        self.appId = appId
        self.appName = appName
        self.gatewayURL = gatewayURL
        self.version = version
        self.authToken = authToken
        self.reconnect = reconnect
        self.heartbeat = heartbeat
        self.eventQueueOptions = eventQueue
        self.webSocketFactory = webSocketFactory
    }

    public var diagnostics: MobigentDiagnostics {
        MobigentDiagnostics(
            configured: true,
            appId: appId,
            appName: appName,
            gatewayURL: gatewayURL,
            connectionState: connectionState,
            connected: connectionState == .connected,
            actionCount: actions.count,
            resourceCount: resources.count,
            componentCount: components.count,
            queuedEventCount: queuedEvents.count,
            reconnectEnabled: reconnect.enabled,
            heartbeatEnabled: heartbeat.enabled,
            lastError: lastError
        )
    }

    public func onConfirmation(_ handler: @escaping ConfirmationHandler) {
        confirmationHandler = handler
    }

    public func registerAction(_ action: MobigentAction) {
        assertCapabilityAvailable(name: action.name)
        actions[action.name] = action
        sendManifestIfConnected()
    }

    @discardableResult
    public func unregisterAction(_ name: String) -> Bool {
        let removed = actions.removeValue(forKey: name) != nil
        if removed { sendManifestIfConnected() }
        return removed
    }

    public func registerResource(_ resource: MobigentResource) {
        assertCapabilityAvailable(name: resource.name)
        resources[resource.name] = resource
        sendManifestIfConnected()
    }

    @discardableResult
    public func unregisterResource(_ name: String) -> Bool {
        let removed = resources.removeValue(forKey: name) != nil
        if removed { sendManifestIfConnected() }
        return removed
    }

    public func registerComponent(_ component: MobigentComponent) {
        assertCapabilityAvailable(name: component.name)
        components[component.name] = component
        sendManifestIfConnected()
    }

    @discardableResult
    public func unregisterComponent(_ name: String) -> Bool {
        let removed = components.removeValue(forKey: name) != nil
        if removed { sendManifestIfConnected() }
        return removed
    }

    public func connect() async throws {
        manualDisconnect = false
        connectionState = reconnectAttempts > 0 ? .reconnecting : .connecting
        let nextSocket = webSocketFactory(gatewayURL)
        socket = nextSocket
        do {
            try await nextSocket.connect(
                onMessage: { [weak self] text in Task { await self?.handle(text: text) } },
                onClose: { [weak self] in Task { await self?.handleClose() } }
            )
            connectionState = .connected
            reconnectAttempts = 0
            var hello: MobigentJSON = ["type": "hello", "appId": appId, "appName": appName, "sdk": "ios", "version": version, "protocolVersion": 1]
            if let authToken {
                hello["authToken"] = authToken
            }
            try await send(hello)
            try await sendManifest()
            try await flushEventQueue()
            if heartbeat.enabled {
                startHeartbeat()
            }
        } catch {
            lastError = error.localizedDescription
            connectionState = .error
            throw error
        }
    }

    public func disconnect() {
        manualDisconnect = true
        socket?.close()
        socket = nil
        connectionState = .disconnected
    }

    @discardableResult
    public func emit(name: String, payload: MobigentJSON) -> Bool {
        let event: MobigentJSON = ["type": "event", "name": name, "payload": payload, "at": isoNow()]
        guard socket?.isOpen == true else {
            return queueEvent(event)
        }
        Task { try? await send(event) }
        return true
    }

    public func manifest() -> MobigentJSON {
        [
            "appId": appId,
            "appName": appName,
            "sdk": "ios",
            "version": version,
            "protocolVersion": 1,
            "actions": actions.values.map(\.manifestValue),
            "resources": resources.values.map(\.manifestValue),
            "components": components.values.map(\.manifestValue)
        ]
    }

    private func handle(text: String) async {
        guard let message = jsonObject(from: text), let type = message["type"] as? String else { return }
        switch type {
        case "call_action":
            await handleActionCall(message)
        case "read_resource":
            await handleResourceRead(message)
        case "focus_component":
            await handleComponentFocus(message)
        case "pong":
            break
        default:
            break
        }
    }

    private func handleActionCall(_ message: MobigentJSON) async {
        guard let id = message["id"] as? String, let name = message["name"] as? String else { return }
        guard let action = actions[name] else {
            try? await send(["type": "action_result", "id": id, "ok": false, "error": "Unknown action: \(name)"])
            return
        }
        let input = message["input"] as? MobigentJSON ?? [:]
        if let confirmation = action.confirmation, confirmation.required {
            let approved = await (confirmationHandler?(MobigentConfirmationRequest(actionName: action.name, actionDescription: action.description, input: input, confirmation: confirmation)) ?? true)
            guard approved else {
                try? await send(["type": "action_result", "id": id, "ok": false, "error": "User rejected action."])
                return
            }
        }
        do {
            let result = try await action.handler(input)
            try await send(["type": "action_result", "id": id, "ok": true, "result": result])
        } catch {
            try? await send(["type": "action_result", "id": id, "ok": false, "error": error.localizedDescription])
        }
    }

    private func handleResourceRead(_ message: MobigentJSON) async {
        guard let id = message["id"] as? String, let name = message["name"] as? String else { return }
        guard let resource = resources[name] else {
            try? await send(["type": "resource_result", "id": id, "ok": false, "error": "Unknown resource: \(name)"])
            return
        }
        do {
            try await send(["type": "resource_result", "id": id, "ok": true, "result": try await resource.read()])
        } catch {
            try? await send(["type": "resource_result", "id": id, "ok": false, "error": error.localizedDescription])
        }
    }

    private func handleComponentFocus(_ message: MobigentJSON) async {
        guard let id = message["id"] as? String, let name = message["name"] as? String else { return }
        guard let component = components[name] else {
            try? await send(["type": "component_result", "id": id, "ok": false, "error": "Unknown component: \(name)"])
            return
        }
        do {
            try await send(["type": "component_result", "id": id, "ok": true, "result": try await component.focus(message["props"] as? MobigentJSON ?? [:])])
        } catch {
            try? await send(["type": "component_result", "id": id, "ok": false, "error": error.localizedDescription])
        }
    }

    private func handleClose() async {
        socket = nil
        if manualDisconnect || !reconnect.enabled || reconnectAttempts >= reconnect.maxAttempts {
            connectionState = .disconnected
            return
        }
        connectionState = .reconnecting
        let delay = min(reconnect.maxDelayMs, Int(Double(reconnect.delayMs) * pow(reconnect.backoffFactor, Double(reconnectAttempts))))
        reconnectAttempts += 1
        try? await Task.sleep(nanoseconds: UInt64(max(0, delay)) * 1_000_000)
        try? await connect()
    }

    private func sendManifestIfConnected() {
        guard socket?.isOpen == true else { return }
        Task { try? await sendManifest() }
    }

    private func sendManifest() async throws {
        try await send(["type": "manifest", "manifest": manifest()])
    }

    private func send(_ message: MobigentJSON) async throws {
        guard let socket, socket.isOpen else { return }
        let data = try JSONSerialization.data(withJSONObject: jsonReady(message), options: [.sortedKeys])
        try await socket.send(String(data: data, encoding: .utf8) ?? "{}")
    }

    private func queueEvent(_ event: MobigentJSON) -> Bool {
        guard eventQueueOptions.enabled, eventQueueOptions.maxSize > 0 else { return false }
        queuedEvents.append(event)
        while queuedEvents.count > eventQueueOptions.maxSize {
            queuedEvents.removeFirst()
        }
        return true
    }

    private func flushEventQueue() async throws {
        let events = queuedEvents
        queuedEvents.removeAll()
        for event in events {
            try await send(event)
        }
    }

    private func startHeartbeat() {
        Task { [weak self] in
            guard let self else { return }
            while self.socket?.isOpen == true {
                try? await Task.sleep(nanoseconds: UInt64(max(1, self.heartbeat.intervalMs)) * 1_000_000)
                try? await self.send(["type": "ping", "id": "heartbeat_\(Date().timeIntervalSince1970)", "at": self.isoNow()])
            }
        }
    }

    private func assertCapabilityAvailable(name: String) {
        precondition(name.range(of: #"^[A-Za-z][A-Za-z0-9_]*$"#, options: .regularExpression) != nil, "Invalid capability name \(name).")
        precondition(actions[name] == nil && resources[name] == nil && components[name] == nil, "Duplicate capability name \(name).")
    }

    private func isoNow() -> String {
        ISO8601DateFormatter().string(from: Date())
    }
}

private func jsonObject(from text: String) -> MobigentJSON? {
    guard let data = text.data(using: .utf8),
          let object = try? JSONSerialization.jsonObject(with: data) as? MobigentJSON else {
        return nil
    }
    return object
}

private func jsonReady(_ value: Any) -> Any {
    if let dictionary = value as? MobigentJSON {
        return dictionary.mapValues(jsonReady)
    }
    if let array = value as? [Any] {
        return array.map(jsonReady)
    }
    return value
}
