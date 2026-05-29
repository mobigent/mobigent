# Mobigent Android SDK

Mobigent's Android SDK lets a native Kotlin app expose typed capabilities to AI agents through the Mobigent gateway.

## Install

The Android SDK lives in `packages/android` as a Gradle/Kotlin library. For local development, include it as a project dependency:

```kotlin
// settings.gradle.kts
include(":mobigent-android")
project(":mobigent-android").projectDir = file("../mobigent/packages/android")

// app/build.gradle.kts
dependencies {
    implementation(project(":mobigent-android"))
}
```

After Maven Central publishing is configured, apps will be able to use:

```kotlin
dependencies {
    implementation("io.mobigent:mobigent-android:0.1.11")
}
```

Targets:

- Android API 23+
- Kotlin 2.1+
- JVM 17

## Create A Client

```kotlin
val client = MobigentClient.Builder(context)
    .appId("com.example.expenses")
    .appName("Expenses")
    .gatewayUrl("ws://10.0.2.2:8787")
    .build()
```

Use `ws://10.0.2.2:8787` for the Android emulator. Use your Mac's LAN IP for a physical device.

## Register Capabilities

```kotlin
client.registerAction(
    MobigentAction(
        name = "create",
        description = "Create an expense after approval.",
        inputSchema = MobigentSchema.obj(
            mapOf(
                "merchant" to MobigentSchema.string(),
                "amount" to MobigentSchema.number()
            ),
            required = listOf("merchant", "amount")
        ),
        confirmation = MobigentConfirmationPolicy(required = true, risk = MobigentRisk.Medium)
    ) { input ->
        mapOf("id" to "EXP-1", "merchant" to input["merchant"], "amount" to input["amount"])
    }
)

client.registerResource(
    MobigentResource(
        name = "list",
        description = "List expenses.",
        outputSchema = MobigentSchema.obj(
            mapOf("items" to MobigentSchema.array(MobigentSchema.obj())),
            required = listOf("items")
        )
    ) {
        mapOf("items" to emptyList<Map<String, Any?>>())
    }
)
```

## Confirm Sensitive Actions

```kotlin
client.confirmationHandler { request ->
    // Show your own native approval UI.
    true
}
```

If no confirmation handler is provided, the SDK allows the action. Production apps should provide a handler for medium/high risk actions.

## Connect

```kotlin
client.connect()
client.emit("expense.created", mapOf("id" to "EXP-1"))
```

The client sends the same `hello`, `manifest`, `event`, `action_result`, `resource_result`, `component_result`, and `ping` messages used by the React Native SDK.

## Test The Full Loop

Start the gateway:

```bash
npm run dev:http
```

Use these gateway URLs:

- Android emulator: `ws://10.0.2.2:8787`
- physical device: `ws://YOUR_MAC_LAN_IP:8787`
- hosted gateway: `wss://your-gateway.example.com`

Open the local inspector:

```bash
open http://localhost:8788/inspect
```

You should see the app, manifest tools, recent audit events, and metrics. The same tools are also available at `http://localhost:8788/tools` and `http://localhost:8788/openapi.json`.

## App Actions Bridge Plan

Mobigent can generate a first-pass Android App Actions XML plan from the same capability contract used by the gateway:

```bash
npx mobigent-init \
  --platform-actions android-xml \
  --app-id com.example.expenses \
  --app-name "Expenses" \
  --feature expense
```

Use the generated XML as a starting point for app action shortcuts/deep links, then forward the Android entry point into your Mobigent client or app service layer.

## Example

See `examples/android-expense` for a small native example with one confirmed action and one resource.
