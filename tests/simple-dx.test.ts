import assert from "node:assert/strict";
import test from "node:test";
import WebSocket from "ws";
import { startMobigentBackend } from "@mobigent/backend";
import { mobigent, type MobigentSocketFactory } from "@mobigent/react-native";
import { feature, simpleSchema } from "@mobigent/react-native/simple";

const createNodeSocket: MobigentSocketFactory = (url) => new WebSocket(url);

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

test("existing app DX connects simple app features to backend calls end to end", async () => {
  const created: Array<{ id: string; merchant: string; amount: number }> = [];
  const expenses = feature("expense")
    .read("list", async () => ({ items: created }), {
      output: { items: ["object"] }
    })
    .write(
      "create",
      async (input) => {
        const expense = {
          id: `EXP-${created.length + 1}`,
          merchant: String(input.merchant),
          amount: Number(input.amount)
        };
        created.push(expense);
        return expense;
      },
      {
        input: {
          merchant: "string",
          amount: "number"
        },
        output: {
          id: "string",
          merchant: "string",
          amount: "number"
        },
        confirm: true
      }
    );

  const backend = await startMobigentBackend({
    wsPort: 18989,
    httpPort: 18990,
    silent: true
  });

  try {
    mobigent.configure({
      appId: "com.example.existing",
      appName: "Existing App",
      gatewayUrl: backend.urls.websocket,
      createSocket: createNodeSocket,
      confirm: async () => true
    });

    for (const action of expenses.actions) {
      mobigent.registerAction(action);
    }
    for (const resource of expenses.resources) {
      mobigent.registerResource(resource);
    }

    await mobigent.connect();
    await waitFor(() => backend.tools().some((tool) => tool.name === "com_example_existing.expense_create"));

    const result = await backend.call("com_example_existing.expense_create", {
      merchant: "Airport Taxi",
      amount: 42.25
    });

    assert.deepEqual(result, {
      id: "EXP-1",
      merchant: "Airport Taxi",
      amount: 42.25
    });
    assert.deepEqual(await backend.call("com_example_existing.get_expense_list"), {
      items: [result]
    });
  } finally {
    for (const action of expenses.actions) {
      mobigent.unregisterAction(action.name);
    }
    for (const resource of expenses.resources) {
      mobigent.unregisterResource(resource.name);
    }
    mobigent.disconnect();
    await backend.stop();
  }
});

async function waitFor(predicate: () => boolean, timeoutMs = 1_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("Timed out waiting for condition.");
}
