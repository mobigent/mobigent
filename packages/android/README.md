# Mobigent Android

Kotlin/Android SDK for exposing native app functions to AI agents through `@mobigent/backend`.

```kotlin
val client = MobigentClient.Builder(context)
    .appId("com.example.expenses")
    .appName("Expenses")
    .build()

client.functions("expense") {
    write(
        "create",
        description = "Create an expense after approval.",
        inputSchema = MobigentSchema.obj(
            mapOf("merchant" to MobigentSchema.string(), "amount" to MobigentSchema.number()),
            required = listOf("merchant", "amount")
        ),
        confirmation = MobigentConfirmationPolicy(required = true, risk = MobigentRisk.Medium)
    ) { input ->
        mapOf("id" to "EXP-1", "merchant" to input["merchant"], "amount" to input["amount"])
    }
}

client.connect()
```

The default URL is the local Android emulator backend. Pass `backendUrl(...)` only for a physical device or hosted backend.

Use `functions("expense")` to group app functions exactly how backend code calls them with `mobigent.use("expense")`.

Use `confirmationHandler { request -> Boolean }` to render your own native approval UI before sensitive handlers run.
