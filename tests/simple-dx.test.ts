import assert from "node:assert/strict";
import test from "node:test";
import { startMobigentBackend } from "@mobigent/backend";
import { feature, simpleSchema } from "@mobigent/react-native/simple";

test("simple React Native feature API creates agent-ready capabilities without schema ceremony", async () => {
  const expenses = feature("expense")
    .read("list", async () => ({ items: [] }), {
      output: {
        items: ["object"]
      }
    })
    .write("create", async (input) => ({ id: "EXP-1", ...input }), {
      input: {
        merchant: "string",
        amount: "number"
      },
      output: {
        id: "string",
        merchant: "string",
        amount: "number"
      }
    });

  assert.equal(expenses.resources[0].name, "expense_list");
  assert.equal(expenses.actions[0].name, "expense_create");
  assert.equal(expenses.actions[0].confirmation?.required, true);
  assert.deepEqual(expenses.actions[0].inputSchema?.required, ["merchant", "amount"]);
  assert.equal(expenses.actions[0].inputSchema?.properties?.merchant.type, "string");
});

test("simple schema helper accepts plain field maps", () => {
  const input = simpleSchema({
    userId: "string",
    count: "integer",
    tags: ["string"]
  });

  assert.equal(input.type, "object");
  assert.deepEqual(input.required, ["userId", "count", "tags"]);
  assert.equal(input.properties?.tags.type, "array");
});

test("backend helper starts HTTP, OpenAPI, and inspector endpoints from one function", async () => {
  const backend = await startMobigentBackend({
    wsPort: 18987,
    httpPort: 18988,
    silent: true
  });

  try {
    const health = await fetch(`${backend.urls.http}/health`).then((response) => response.json() as Promise<{ ok: boolean }>);
    assert.equal(health.ok, true);
    assert.equal(backend.urls.websocket, "ws://localhost:18987");
    assert.equal(backend.urls.openapi, "http://localhost:18988/openapi.json");
  } finally {
    await backend.stop();
  }
});
