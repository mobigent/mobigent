package io.mobigent

import android.content.Context
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.util.Timer
import kotlin.concurrent.schedule
import kotlin.coroutines.startCoroutine
import kotlin.math.min

typealias MobigentJson = Map<String, Any?>

enum class MobigentConnectionState {
    Idle,
    Connecting,
    Connected,
    Reconnecting,
    Disconnected,
    Error
}

enum class MobigentRisk(val wireValue: String) {
    Low("low"),
    Medium("medium"),
    High("high")
}

data class MobigentSchema(val raw: MobigentJson) {
    companion object {
        fun string(description: String? = null) = simple("string", description)
        fun number(description: String? = null) = simple("number", description)
        fun boolean(description: String? = null) = simple("boolean", description)
        fun array(items: MobigentSchema, description: String? = null) = MobigentSchema(
            buildMap {
                put("type", "array")
                put("items", items.raw)
                if (description != null) put("description", description)
            }
        )
        fun obj(properties: Map<String, MobigentSchema> = emptyMap(), required: List<String> = emptyList(), description: String? = null) = MobigentSchema(
            buildMap {
                put("type", "object")
                put("properties", properties.mapValues { it.value.raw })
                if (required.isNotEmpty()) put("required", required)
                if (description != null) put("description", description)
            }
        )
        fun enum(values: List<String>, description: String? = null) = MobigentSchema(
            buildMap {
                put("type", "string")
                put("enum", values)
                if (description != null) put("description", description)
            }
        )
        private fun simple(type: String, description: String?) = MobigentSchema(
            buildMap {
                put("type", type)
                if (description != null) put("description", description)
            }
        )
    }
}

data class MobigentConfirmationPolicy(
    val required: Boolean,
    val title: String? = null,
    val message: String? = null,
    val risk: MobigentRisk? = null
) {
    fun toJson() = buildMap {
        put("required", required)
        if (title != null) put("title", title)
        if (message != null) put("message", message)
        if (risk != null) put("risk", risk.wireValue)
    }
}

data class MobigentCapabilityPolicy(
    val readOnly: Boolean? = null,
    val foregroundOnly: Boolean? = null,
    val requiresUser: Boolean? = null,
    val allowedAgents: List<String>? = null,
    val rateLimitPerMinute: Int? = null,
    val sensitiveData: List<String>? = null
) {
    fun toJson() = buildMap {
        if (readOnly != null) put("readOnly", readOnly)
        if (foregroundOnly != null) put("foregroundOnly", foregroundOnly)
        if (requiresUser != null) put("requiresUser", requiresUser)
        if (allowedAgents != null) put("allowedAgents", allowedAgents)
        if (rateLimitPerMinute != null) put("rateLimitPerMinute", rateLimitPerMinute)
        if (sensitiveData != null) put("sensitiveData", sensitiveData)
    }
}

data class MobigentAction(
    val name: String,
    val description: String,
    val inputSchema: MobigentSchema,
    val outputSchema: MobigentSchema? = null,
    val confirmation: MobigentConfirmationPolicy? = null,
    val policy: MobigentCapabilityPolicy? = null,
    val handler: suspend (MobigentJson) -> Any?
) {
    fun manifestValue() = buildMap {
        put("name", name)
        put("description", description)
        put("inputSchema", inputSchema.raw)
        if (outputSchema != null) put("outputSchema", outputSchema.raw)
        if (confirmation != null) put("confirmation", confirmation.toJson())
        if (policy != null) put("policy", policy.toJson())
    }
}

data class MobigentResource(
    val name: String,
    val description: String,
    val outputSchema: MobigentSchema? = null,
    val policy: MobigentCapabilityPolicy? = null,
    val read: suspend () -> Any?
) {
    fun manifestValue() = buildMap {
        put("name", name)
        put("description", description)
        if (outputSchema != null) put("outputSchema", outputSchema.raw)
        if (policy != null) put("policy", policy.toJson())
    }
}

data class MobigentComponent(
    val name: String,
    val description: String,
    val propsSchema: MobigentSchema? = null,
    val policy: MobigentCapabilityPolicy? = null,
    val focus: suspend (MobigentJson) -> Any?
) {
    fun manifestValue() = buildMap {
        put("name", name)
        put("description", description)
        if (propsSchema != null) put("propsSchema", propsSchema.raw)
        if (policy != null) put("policy", policy.toJson())
    }
}

data class MobigentConfirmationRequest(
    val actionName: String,
    val actionDescription: String,
    val input: MobigentJson,
    val confirmation: MobigentConfirmationPolicy
)

data class MobigentReconnectOptions(
    val enabled: Boolean = false,
    val maxAttempts: Int = Int.MAX_VALUE,
    val delayMs: Long = 1_000,
    val maxDelayMs: Long = 30_000,
    val backoffFactor: Double = 2.0
)

data class MobigentHeartbeatOptions(
    val enabled: Boolean = false,
    val intervalMs: Long = 30_000,
    val timeoutMs: Long = 10_000
)

data class MobigentEventQueueOptions(
    val enabled: Boolean = true,
    val maxSize: Int = 100
)

data class MobigentDiagnostics(
    val configured: Boolean,
    val appId: String,
    val appName: String,
    val gatewayUrl: String,
    val connectionState: MobigentConnectionState,
    val connected: Boolean,
    val actionCount: Int,
    val resourceCount: Int,
    val componentCount: Int,
    val queuedEventCount: Int,
    val reconnectEnabled: Boolean,
    val heartbeatEnabled: Boolean,
    val lastError: String?
)

interface MobigentTransport {
    val isOpen: Boolean
    fun connect(url: String, onMessage: (String) -> Unit, onClose: () -> Unit)
    fun send(text: String)
    fun close()
}

class OkHttpMobigentTransport(private val client: OkHttpClient = OkHttpClient()) : MobigentTransport {
    private var socket: WebSocket? = null
    override val isOpen: Boolean get() = socket != null

    override fun connect(url: String, onMessage: (String) -> Unit, onClose: () -> Unit) {
        val request = Request.Builder().url(url).build()
        socket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) = onMessage(text)
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                socket = null
                onClose()
            }
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                socket = null
                onClose()
            }
        })
    }

    override fun send(text: String) {
        socket?.send(text)
    }

    override fun close() {
        socket?.close(1000, "Mobigent disconnected")
        socket = null
    }
}

class MobigentClient private constructor(
    private val appId: String,
    private val appName: String,
    private val gatewayUrl: String,
    private val version: String,
    private val authToken: String?,
    private val reconnect: MobigentReconnectOptions,
    private val heartbeat: MobigentHeartbeatOptions,
    private val eventQueue: MobigentEventQueueOptions,
    private val transportFactory: () -> MobigentTransport
) {
    class Builder(private val context: Context? = null) {
        private var appId: String = context?.packageName ?: "io.mobigent.app"
        private var appName: String = context?.applicationInfo?.loadLabel(context.packageManager)?.toString() ?: "Android App"
        private var gatewayUrl: String = "ws://10.0.2.2:8787"
        private var version: String = "0.1.6"
        private var authToken: String? = null
        private var reconnect: MobigentReconnectOptions = MobigentReconnectOptions()
        private var heartbeat: MobigentHeartbeatOptions = MobigentHeartbeatOptions()
        private var eventQueue: MobigentEventQueueOptions = MobigentEventQueueOptions()
        private var transportFactory: () -> MobigentTransport = { OkHttpMobigentTransport() }

        fun appId(value: String) = apply { appId = value }
        fun appName(value: String) = apply { appName = value }
        fun gatewayUrl(value: String) = apply { gatewayUrl = value }
        fun version(value: String) = apply { version = value }
        fun authToken(value: String?) = apply { authToken = value }
        fun reconnect(value: MobigentReconnectOptions) = apply { reconnect = value }
        fun heartbeat(value: MobigentHeartbeatOptions) = apply { heartbeat = value }
        fun eventQueue(value: MobigentEventQueueOptions) = apply { eventQueue = value }
        fun transportFactory(value: () -> MobigentTransport) = apply { transportFactory = value }
        fun build() = MobigentClient(appId, appName, gatewayUrl, version, authToken, reconnect, heartbeat, eventQueue, transportFactory)
    }

    private val actions = linkedMapOf<String, MobigentAction>()
    private val resources = linkedMapOf<String, MobigentResource>()
    private val components = linkedMapOf<String, MobigentComponent>()
    private val queuedEvents = mutableListOf<Map<String, Any?>>()
    private var transport: MobigentTransport? = null
    private var manualDisconnect = false
    private var reconnectAttempts = 0
    private var timer = Timer("mobigent", true)
    var confirmationHandler: (suspend (MobigentConfirmationRequest) -> Boolean)? = null
    var connectionState: MobigentConnectionState = MobigentConnectionState.Idle
        private set
    var lastError: String? = null
        private set

    val diagnostics: MobigentDiagnostics
        get() = MobigentDiagnostics(
            configured = true,
            appId = appId,
            appName = appName,
            gatewayUrl = gatewayUrl,
            connectionState = connectionState,
            connected = connectionState == MobigentConnectionState.Connected,
            actionCount = actions.size,
            resourceCount = resources.size,
            componentCount = components.size,
            queuedEventCount = queuedEvents.size,
            reconnectEnabled = reconnect.enabled,
            heartbeatEnabled = heartbeat.enabled,
            lastError = lastError
        )

    fun confirmationHandler(handler: suspend (MobigentConfirmationRequest) -> Boolean) = apply {
        confirmationHandler = handler
    }

    fun registerAction(action: MobigentAction) {
        assertCapabilityAvailable(action.name)
        actions[action.name] = action
        sendManifestIfConnected()
    }

    fun unregisterAction(name: String) = actions.remove(name) != null

    fun registerResource(resource: MobigentResource) {
        assertCapabilityAvailable(resource.name)
        resources[resource.name] = resource
        sendManifestIfConnected()
    }

    fun unregisterResource(name: String) = resources.remove(name) != null

    fun registerComponent(component: MobigentComponent) {
        assertCapabilityAvailable(component.name)
        components[component.name] = component
        sendManifestIfConnected()
    }

    fun unregisterComponent(name: String) = components.remove(name) != null

    fun connect() {
        manualDisconnect = false
        connectionState = if (reconnectAttempts > 0) MobigentConnectionState.Reconnecting else MobigentConnectionState.Connecting
        val nextTransport = transportFactory()
        transport = nextTransport
        nextTransport.connect(gatewayUrl, onMessage = { handleMessage(it) }, onClose = { handleClose() })
        connectionState = MobigentConnectionState.Connected
        reconnectAttempts = 0
        send(buildMap {
            put("type", "hello")
            put("appId", appId)
            put("appName", appName)
            put("sdk", "android")
            put("version", version)
            put("protocolVersion", 1)
            if (authToken != null) put("authToken", authToken)
        })
        sendManifest()
        flushEventQueue()
        if (heartbeat.enabled) startHeartbeat()
    }

    fun disconnect() {
        manualDisconnect = true
        transport?.close()
        transport = null
        connectionState = MobigentConnectionState.Disconnected
    }

    fun emit(name: String, payload: MobigentJson): Boolean {
        val event = mapOf("type" to "event", "name" to name, "payload" to payload, "at" to Instant.now().toString())
        if (transport?.isOpen == true) {
            send(event)
            return true
        }
        if (!eventQueue.enabled || eventQueue.maxSize <= 0) return false
        queuedEvents += event
        while (queuedEvents.size > eventQueue.maxSize) queuedEvents.removeAt(0)
        return true
    }

    fun manifest(): MobigentJson = mapOf(
        "appId" to appId,
        "appName" to appName,
        "sdk" to "android",
        "version" to version,
        "protocolVersion" to 1,
        "actions" to actions.values.map { it.manifestValue() },
        "resources" to resources.values.map { it.manifestValue() },
        "components" to components.values.map { it.manifestValue() }
    )

    private fun handleMessage(text: String) {
        val message = JSONObject(text)
        when (message.optString("type")) {
            "call_action" -> handleActionCall(message)
            "read_resource" -> handleResourceRead(message)
            "focus_component" -> handleComponentFocus(message)
            "pong" -> Unit
        }
    }

    private fun handleActionCall(message: JSONObject) {
        val id = message.getString("id")
        val name = message.getString("name")
        val action = actions[name]
        if (action == null) {
            send(mapOf("type" to "action_result", "id" to id, "ok" to false, "error" to "Unknown action: $name"))
            return
        }
        val input = message.optJSONObject("input")?.toMap() ?: emptyMap()
        Thread {
            try {
                val confirmation = action.confirmation
                if (confirmation?.required == true) {
                    val approved = runBlockingConfirm(MobigentConfirmationRequest(action.name, action.description, input, confirmation))
                    if (!approved) {
                        send(mapOf("type" to "action_result", "id" to id, "ok" to false, "error" to "User rejected action."))
                        return@Thread
                    }
                }
                val result = runBlockingHandler { action.handler(input) }
                send(mapOf("type" to "action_result", "id" to id, "ok" to true, "result" to result))
            } catch (error: Throwable) {
                send(mapOf("type" to "action_result", "id" to id, "ok" to false, "error" to (error.message ?: error.toString())))
            }
        }.start()
    }

    private fun handleResourceRead(message: JSONObject) {
        val id = message.getString("id")
        val name = message.getString("name")
        val resource = resources[name]
        if (resource == null) {
            send(mapOf("type" to "resource_result", "id" to id, "ok" to false, "error" to "Unknown resource: $name"))
            return
        }
        Thread {
            try {
                val result = runBlockingHandler { resource.read() }
                send(mapOf("type" to "resource_result", "id" to id, "ok" to true, "result" to result))
            } catch (error: Throwable) {
                send(mapOf("type" to "resource_result", "id" to id, "ok" to false, "error" to (error.message ?: error.toString())))
            }
        }.start()
    }

    private fun handleComponentFocus(message: JSONObject) {
        val id = message.getString("id")
        val name = message.getString("name")
        val component = components[name]
        if (component == null) {
            send(mapOf("type" to "component_result", "id" to id, "ok" to false, "error" to "Unknown component: $name"))
            return
        }
        val props = message.optJSONObject("props")?.toMap() ?: emptyMap()
        Thread {
            try {
                val result = runBlockingHandler { component.focus(props) }
                send(mapOf("type" to "component_result", "id" to id, "ok" to true, "result" to result))
            } catch (error: Throwable) {
                send(mapOf("type" to "component_result", "id" to id, "ok" to false, "error" to (error.message ?: error.toString())))
            }
        }.start()
    }

    private fun handleClose() {
        transport = null
        if (manualDisconnect || !reconnect.enabled || reconnectAttempts >= reconnect.maxAttempts) {
            connectionState = MobigentConnectionState.Disconnected
            return
        }
        connectionState = MobigentConnectionState.Reconnecting
        val delay = min(reconnect.maxDelayMs, (reconnect.delayMs * Math.pow(reconnect.backoffFactor, reconnectAttempts.toDouble())).toLong())
        reconnectAttempts += 1
        timer.schedule(delay) { connect() }
    }

    private fun sendManifestIfConnected() {
        if (transport?.isOpen == true) sendManifest()
    }

    private fun sendManifest() {
        send(mapOf("type" to "manifest", "manifest" to manifest()))
    }

    private fun flushEventQueue() {
        val events = queuedEvents.toList()
        queuedEvents.clear()
        events.forEach(::send)
    }

    private fun startHeartbeat() {
        timer.schedule(heartbeat.intervalMs, heartbeat.intervalMs) {
            if (transport?.isOpen == true) {
                send(mapOf("type" to "ping", "id" to "heartbeat_${System.currentTimeMillis()}", "at" to Instant.now().toString()))
            }
        }
    }

    private fun send(message: Map<String, Any?>) {
        transport?.send(wrapJson(message).toString())
    }

    private fun assertCapabilityAvailable(name: String) {
        require(Regex("^[A-Za-z][A-Za-z0-9_]*$").matches(name)) { "Invalid capability name $name." }
        require(!actions.containsKey(name) && !resources.containsKey(name) && !components.containsKey(name)) {
            "Duplicate capability name $name."
        }
    }
}

private fun JSONObject.toMap(): MobigentJson = keys().asSequence().associateWith { key ->
    when (val value = get(key)) {
        is JSONObject -> value.toMap()
        is JSONArray -> value.toList()
        JSONObject.NULL -> null
        else -> value
    }
}

private fun JSONArray.toList(): List<Any?> = (0 until length()).map { index ->
    when (val value = get(index)) {
        is JSONObject -> value.toMap()
        is JSONArray -> value.toList()
        JSONObject.NULL -> null
        else -> value
    }
}

private fun wrapJson(value: Any?): Any? = when (value) {
    null -> JSONObject.NULL
    is Map<*, *> -> JSONObject(value.entries.associate { (key, child) -> key.toString() to wrapJson(child) })
    is Iterable<*> -> JSONArray(value.map(::wrapJson))
    else -> value
}

private fun <T> runBlockingHandler(block: suspend () -> T): T {
    var outcome: Any? = null
    val latch = java.util.concurrent.CountDownLatch(1)
    block.startCoroutine(object : kotlin.coroutines.Continuation<T> {
        override val context = kotlin.coroutines.EmptyCoroutineContext
        override fun resumeWith(resumeResult: Result<T>) {
            outcome = resumeResult
            latch.countDown()
        }
    })
    latch.await()
    @Suppress("UNCHECKED_CAST")
    return (outcome as Result<T>).getOrThrow()
}

private fun MobigentClient.runBlockingConfirm(request: MobigentConfirmationRequest): Boolean {
    val handler = confirmationHandler ?: return true
    return runBlockingHandler { handler(request) }
}
