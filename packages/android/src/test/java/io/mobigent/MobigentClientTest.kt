package io.mobigent

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

private class MockTransport : MobigentTransport {
    override var isOpen: Boolean = false
    val sent = mutableListOf<String>()
    var onMessage: ((String) -> Unit)? = null
    var onClose: (() -> Unit)? = null

    override fun connect(url: String, onMessage: (String) -> Unit, onClose: () -> Unit) {
        this.onMessage = onMessage
        this.onClose = onClose
        isOpen = true
    }

    override fun send(text: String) {
        sent += text
    }

    override fun close() {
        isOpen = false
        onClose?.invoke()
    }
}

class MobigentClientTest {
    @Test
    fun manifestUsesAndroidSdkAndProtocolShape() {
        val client = MobigentClient.Builder()
            .appId("com.example.app")
            .appName("Example")
            .build()

        client.registerAction(MobigentAction(
            name = "create",
            description = "Create an expense.",
            inputSchema = MobigentSchema.obj(
                mapOf("amount" to MobigentSchema.number(), "merchant" to MobigentSchema.string()),
                required = listOf("amount", "merchant")
            ),
            confirmation = MobigentConfirmationPolicy(required = true, risk = MobigentRisk.Medium)
        ) { it })

        val manifest = client.manifest()
        assertEquals("android", manifest["sdk"])
        assertEquals(1, manifest["protocolVersion"])
        assertEquals(1, (manifest["actions"] as List<*>).size)
    }

    @Test
    fun friendlyFunctionAliasesBuildTheSameManifest() {
        val client = MobigentClient.Builder()
            .appId("com.example.app")
            .appName("Example")
            .backendUrl("ws://localhost:8787")
            .build()

        client.write(
            name = "create",
            description = "Create an expense.",
            inputSchema = MobigentSchema.obj(
                mapOf("amount" to MobigentSchema.number()),
                required = listOf("amount")
            ),
            confirmation = MobigentConfirmationPolicy(required = true, risk = MobigentRisk.Medium)
        ) { input -> input }

        client.read(name = "list", description = "List expenses.") {
            mapOf("items" to emptyList<Map<String, Any?>>())
        }

        client.screen(name = "details", description = "Focus expense details.") { props ->
            props
        }

        val manifest = client.manifest()
        assertEquals("ws://localhost:8787", client.diagnostics.backendUrl)
        assertEquals(1, (manifest["actions"] as List<*>).size)
        assertEquals(1, (manifest["resources"] as List<*>).size)
        assertEquals(1, (manifest["components"] as List<*>).size)
    }

    @Test
    fun connectSendsHelloManifestAndQueuedEvent() {
        val transport = MockTransport()
        val client = MobigentClient.Builder()
            .appId("com.example.app")
            .appName("Example")
            .transportFactory { transport }
            .build()

        assertTrue(client.emit("queued", mapOf("id" to "1")))
        client.connect()

        assertEquals(MobigentConnectionState.Connected, client.connectionState)
        assertEquals(3, transport.sent.size)
        assertTrue(transport.sent[0].contains("\"hello\""))
        assertTrue(transport.sent[1].contains("\"manifest\""))
        assertTrue(transport.sent[2].contains("\"queued\""))
    }

    @Test
    fun duplicateCapabilityNamesAreRejected() {
        val client = MobigentClient.Builder().build()
        client.registerResource(MobigentResource("list", "List") { emptyList<Any>() })
        val failed = runCatching {
            client.registerAction(MobigentAction("list", "Duplicate", MobigentSchema.obj()) { emptyMap<String, Any>() })
        }
        assertTrue(failed.isFailure)
    }
}
