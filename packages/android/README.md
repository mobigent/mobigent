# Mobigent Android

Kotlin/Android SDK for exposing native app capabilities to AI agents through the Mobigent gateway.

```kotlin
val client = MobigentClient.Builder(context)
    .appId("com.example.expenses")
    .appName("Expenses")
    .gatewayUrl("ws://10.0.2.2:8787")
    .build()

client.registerAction(
    MobigentAction(
        name = "create",
        description = "Create an expense after approval.",
        inputSchema = MobigentSchema.obj(
            mapOf("merchant" to MobigentSchema.string(), "amount" to MobigentSchema.number()),
            required = listOf("merchant", "amount")
        ),
        confirmation = MobigentConfirmationPolicy(required = true, risk = MobigentRisk.Medium)
    ) { input ->
        mapOf("id" to "EXP-1", "merchant" to input["merchant"], "amount" to input["amount"])
    }
)

client.connect()
```

Use `confirmationHandler { request -> Boolean }` to render your own native approval UI before sensitive handlers run.
