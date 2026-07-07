# Mobigent Android SDK

Mobigent's Android SDK lets a native Kotlin app expose normal app functions to AI agents. Use it with `@mobigent/backend`: the backend runs the agent-facing service, and the Android app connects with the same app id.

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
    implementation("io.mobigent:mobigent-android:0.1.15")
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
    .build()
```

That default connects the Android emulator to the local Mobigent backend. For a physical device or hosted backend, pass `backendUrl(...)` explicitly:

```kotlin
val client = MobigentClient.Builder(context)
    .appId("com.example.expenses")
    .appName("Expenses")
    .backendUrl("ws://YOUR_MAC_LAN_IP:8787")
    .build()
```

## Expose App Functions

```kotlin
client.functions("expense") {
    write(
        "create",
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

    read(
        "list",
        description = "List expenses.",
        outputSchema = MobigentSchema.obj(
            mapOf("items" to MobigentSchema.array(MobigentSchema.obj())),
            required = listOf("items")
        )
    ) {
        mapOf("items" to emptyList<Map<String, Any?>>())
    }
}
```

`functions("expense")` keeps native code grouped the same way your backend calls it: `mobigent.app("expense").create(...)` and `mobigent.app("expense").list()`.

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

After the app connects, the backend can call the functions you exposed and receive the returned values.

## Test The Full Loop

Start the backend package:

```bash
npm install @mobigent/backend
```

```ts
import { startMobigent } from '@mobigent/backend';

const mobigent = await startMobigent('com.example.expenses');
const expenses = mobigent.app('expense');

await expenses.create({ merchant: 'Coffee', amount: 8 });
```

Then run the Android app and connect the client:

```kotlin
client.connect()
```

For local testing from this repo you can run:

```bash
npm run dev:http
```

Use these backend URLs:

- Android emulator: `ws://10.0.2.2:8787`
- physical device: `ws://YOUR_MAC_LAN_IP:8787`
- hosted backend: `wss://your-backend.example.com`

Open the local inspector:

```bash
open http://localhost:8788/inspect
```

You should see the app functions, recent audit events, and metrics. The same functions are also available to backend code through `mobigent.app("expense")` and to agents through the backend service.

## Optional App Actions Starter

Mobigent can generate a first-pass Android App Actions XML file when you want a starter for shortcuts or deep links:

```bash
npx mobigent app \
  --platform-actions android-xml \
  --app-id com.example.expenses \
  --app-name "Expenses" \
  --feature expense
```

Use the generated XML as a starting point, then forward the Android entry point into your Mobigent client or app service layer. You do not need this command for normal Mobigent integration.

## Example

See `examples/android-expense` for a small native example with one confirmed action and one resource.
