package io.mobigent.example

import android.app.Activity
import android.os.Bundle
import android.widget.TextView
import io.mobigent.MobigentClient
import io.mobigent.MobigentConfirmationPolicy
import io.mobigent.MobigentRisk
import io.mobigent.MobigentSchema

class MainActivity : Activity() {
    private val expenses = mutableListOf<Map<String, Any?>>()
    private lateinit var client: MobigentClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(TextView(this).apply { text = "Mobigent Android Expense Example" })

        client = MobigentClient.Builder(this)
            .appId("com.mobigent.examples.android.expense")
            .appName("Mobigent Android Expense Example")
            .gatewayUrl("ws://10.0.2.2:8787")
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
                mapOf(
                    "id" to "EXP-${expenses.size + 1}",
                    "merchant" to input["merchant"],
                    "amount" to input["amount"]
                ).also { expenses += it }
            }

            read(
                "list",
                description = "List expenses.",
                outputSchema = MobigentSchema.obj(mapOf("items" to MobigentSchema.array(MobigentSchema.obj())), required = listOf("items"))
            ) {
                mapOf("items" to expenses)
            }
        }

        client.confirmationHandler { true }
        client.connect()
    }

    override fun onDestroy() {
        client.disconnect()
        super.onDestroy()
    }
}
