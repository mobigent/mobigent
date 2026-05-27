import assert from "node:assert/strict";
import test from "node:test";
import { toolName, validateCapabilityManifest, type CapabilityManifest } from "@mobigent/core";

function createNativeManifest(sdk: "ios" | "android"): CapabilityManifest {
  return {
    appId: `com.mobigent.examples.${sdk}.expense`,
    appName: `Mobigent ${sdk} Expense Example`,
    sdk,
    version: "0.1.0",
    protocolVersion: 1,
    actions: [
      {
        name: "create",
        description: "Create an expense after approval.",
        inputSchema: {
          type: "object",
          properties: {
            merchant: { type: "string" },
            amount: { type: "number" }
          },
          required: ["merchant", "amount"]
        },
        confirmation: {
          required: true,
          risk: "medium"
        }
      }
    ],
    resources: [
      {
        name: "list",
        description: "List expenses.",
        outputSchema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: { type: "object" }
            }
          },
          required: ["items"]
        },
        policy: {
          readOnly: true
        }
      }
    ],
    components: [
      {
        name: "expense_detail",
        description: "Focus the expense detail screen.",
        propsSchema: {
          type: "object",
          properties: {
            id: { type: "string" }
          },
          required: ["id"]
        }
      }
    ]
  };
}

test("native iOS and Android manifests use the shared protocol shape", () => {
  for (const sdk of ["ios", "android"] as const) {
    const manifest = createNativeManifest(sdk);
    assert.deepEqual(validateCapabilityManifest(manifest), { ok: true });
    assert.equal(toolName(manifest.appId, manifest.actions[0].name), `com_mobigent_examples_${sdk}_expense.create`);
    assert.equal(toolName(manifest.appId, `get_${manifest.resources[0].name}`), `com_mobigent_examples_${sdk}_expense.get_list`);
    assert.equal(toolName(manifest.appId, `show_${manifest.components[0].name}`), `com_mobigent_examples_${sdk}_expense.show_expense_detail`);
  }
});

test("native bridge messages match gateway expectations", () => {
  const hello = {
    type: "hello",
    appId: "com.mobigent.examples.ios.expense",
    appName: "Mobigent iOS Expense Example",
    sdk: "ios",
    version: "0.1.0",
    protocolVersion: 1
  };
  const manifest = {
    type: "manifest",
    manifest: createNativeManifest("android")
  };
  const actionResult = {
    type: "action_result",
    id: "call_1",
    ok: true,
    result: { id: "EXP-1" }
  };
  const event = {
    type: "event",
    name: "expense.created",
    payload: { id: "EXP-1" },
    at: "2026-05-27T00:00:00.000Z"
  };
  const ping = {
    type: "ping",
    id: "heartbeat_1",
    at: "2026-05-27T00:00:00.000Z"
  };

  assert.equal(hello.sdk, "ios");
  assert.deepEqual(validateCapabilityManifest(manifest.manifest), { ok: true });
  assert.equal(actionResult.type, "action_result");
  assert.equal(event.type, "event");
  assert.equal(ping.type, "ping");
});
