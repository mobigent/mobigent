import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import WebSocket from "ws";
import {
  formatMobigentAppConfigModule,
  inferMobigentAppIdentity,
  startMobigent,
  startMobigentBackend
} from "@mobigent/backend";
import { createMobigentBackendFiles, runMobigentBackendCli } from "@mobigent/backend/cli";
import {
  connectMobigent,
  defineMobigentConfig,
  feature,
  mobigent,
  setupMobigent,
  simpleSchema,
  type MobigentSocketFactory
} from "@mobigent/react-native";

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

test("app setup accepts features directly for the shortest React Native path", () => {
  const expenses = feature("expense").write("create", async () => ({ ok: true }));
  const app = setupMobigent(expenses);

  assert.deepEqual(app.options.capabilities, [expenses]);
});

test("backend helper starts HTTP, OpenAPI, and inspector endpoints from one function", async () => {
  const backend = await startMobigentBackend({
    wsPort: 18987,
    httpPort: 18988,
    appToken: "dev-token",
    silent: true
  });

  try {
    const health = await fetch(`${backend.urls.http}/health`).then((response) => response.json() as Promise<{ ok: boolean }>);
    assert.equal(health.ok, true);
    assert.equal(backend.urls.websocket, "ws://localhost:18987");
    assert.equal(backend.urls.openapi, "http://localhost:18988/openapi.json");
    assert.deepEqual(backend.app({ appId: "com.example.app", appName: "Example App" }), {
      appId: "com.example.app",
      appName: "Example App",
      connectionUrl: "ws://localhost:18987",
      authToken: "dev-token",
      version: undefined
    });
    assert.match(
      backend.appConfigModule({ appId: "com.example.app", appName: "Example App" }),
      /export const mobigentConfig = defineMobigentConfig/
    );
    assert.equal(backend.agent("chatgpt").provider.id, "chatgpt-actions");
    assert.equal(backend.agent("chatgpt").endpoints.openApi, "http://localhost:18988/openapi.json");
    assert.equal(backend.agent("claude").provider.id, "claude-desktop");
    assert.ok(backend.agents().some((agent) => agent.provider.id === "openai-responses"));
  } finally {
    await backend.stop();
  }
});

test("backend SDK can start with one app config like normal backend plumbing", async () => {
  const backend = await startMobigent({
    wsPort: 18991,
    httpPort: 18992,
    appToken: "dev-token",
    app: {
      id: "com.example.simple",
      name: "Simple App"
    },
    silent: true
  });

  try {
    assert.deepEqual(backend.defaultApp, {
      appId: "com.example.simple",
      appName: "Simple App",
      connectionUrl: "ws://localhost:18991",
      authToken: "dev-token",
      version: undefined
    });
    assert.match(backend.copyAppConfig(), /com.example.simple/);
    assert.match(backend.appConfigCode ?? "", /defineMobigentConfig/);
  } finally {
    await backend.stop();
  }
});

test("backend SDK infers app identity when no app config is passed", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mobigent-infer-sdk-"));
  const previousCwd = process.cwd();

  try {
    await writeFile(join(dir, "package.json"), JSON.stringify({ name: "@acme/travel-wallet" }), "utf8");
    process.chdir(dir);

    const inferred = inferMobigentAppIdentity();
    assert.deepEqual(inferred, {
      appId: "app.acme.travel.wallet",
      appName: "Travel Wallet"
    });

    const backend = await startMobigent({
      wsPort: 18995,
      httpPort: 18996,
      silent: true
    });

    try {
      assert.deepEqual(backend.defaultApp, {
        appId: "app.acme.travel.wallet",
        appName: "Travel Wallet",
        connectionUrl: "ws://localhost:18995",
        authToken: undefined,
        version: undefined
      });
      assert.match(backend.copyAppConfig(), /Travel Wallet/);
    } finally {
      await backend.stop();
    }
  } finally {
    process.chdir(previousCwd);
    await rm(dir, { force: true, recursive: true });
  }
});

test("backend init helper creates a copy-paste server entrypoint", () => {
  const files = createMobigentBackendFiles({
    appId: "com.example.app",
    appName: "Example App",
    outDir: "src",
    fileName: "mobigent.ts",
    envFile: ".env.mobigent",
    configFile: "mobigent.app.json",
    connectionUrl: "ws://localhost:8787",
    authToken: "dev-token",
    force: false,
    dryRun: true
  });

  assert.deepEqual(files.map((file) => file.path), ["src/mobigent.ts", ".env.mobigent", "mobigent.app.json"]);
  assert.match(files[0]?.contents ?? "", /startMobigent/);
  assert.match(files[0]?.contents ?? "", /defaultApp/);
  assert.match(files[0]?.contents ?? "", /copyAppConfig/);
  assert.match(files[1]?.contents ?? "", /MOBIGENT_AUTH_TOKEN/);
  assert.match(files[2]?.contents ?? "", /"connectionUrl": "ws:\/\/localhost:8787"/);
});

test("backend init CLI infers app identity and prints the short app init command", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mobigent-backend-cli-"));
  const previousCwd = process.cwd();
  let stdout = "";
  let stderr = "";

  try {
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({ name: "@example/expense-hub" }),
      "utf8"
    );
    process.chdir(dir);
    const code = runMobigentBackendCli(
      ["--dry-run"],
      { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
      { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream
    );

    assert.equal(code, 0, stderr);
    const files = JSON.parse(stdout).files as Array<{ path: string; contents: string }>;
    const config = JSON.parse(files.find((file) => file.path === "mobigent.app.json")?.contents ?? "{}");
    assert.equal(config.appId, "app.example.expense.hub");
    assert.equal(config.appName, "Expense Hub");

    stdout = "";
    stderr = "";
    const writeCode = runMobigentBackendCli(
      ["--app", "com.example.expense", "--app-name", "Expense App"],
      { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
      { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream
    );
    assert.equal(writeCode, 0, stderr);
    assert.match(stdout, /npx mobigent init --feature expense --out-dir src/);
    assert.doesNotMatch(stdout, /--config/);
    assert.match(await readFile(join(dir, "mobigent.app.json"), "utf8"), /Expense App/);

    const appDir = join(dir, "mobile-app");
    stdout = "";
    stderr = "";
    const appDirCode = runMobigentBackendCli(
      ["--app", "com.example.mobile", "--app-name", "Mobile App", "--app-dir", appDir, "--force"],
      { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
      { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream
    );
    assert.equal(appDirCode, 0, stderr);
    assert.match(stdout, /mobile-app.*mobigent\.app\.json/);
    assert.match(await readFile(join(appDir, "mobigent.app.json"), "utf8"), /Mobile App/);
  } finally {
    process.chdir(previousCwd);
    await rm(dir, { force: true, recursive: true });
  }
});

test("backend CLI prints agent setup without a separate provider command", () => {
  let stdout = "";
  let stderr = "";
  const chatgptCode = runMobigentBackendCli(
    ["agent", "chatgpt", "--base-url", "https://example.test"],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream
  );

  assert.equal(chatgptCode, 0, stderr);
  assert.match(stdout, /ChatGPT Actions/);
  assert.match(stdout, /https:\/\/example\.test\/openapi\.json/);

  stdout = "";
  stderr = "";
  const claudeCode = runMobigentBackendCli(
    ["agent", "claude", "--format", "json"],
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream
  );

  assert.equal(claudeCode, 0, stderr);
  assert.equal(JSON.parse(stdout).provider.id, "claude-desktop");
});

test("app config helpers create typed copy-paste app config", () => {
  const config = defineMobigentConfig({
    appId: "com.example.app",
    appName: "Example App",
    connectionUrl: "ws://localhost:8787",
    authToken: "dev-token"
  });

  assert.equal(config.appId, "com.example.app");
  assert.equal(formatMobigentAppConfigModule(config), `import { defineMobigentConfig } from "@mobigent/react-native";

export const mobigentConfig = defineMobigentConfig({
  "appId": "com.example.app",
  "appName": "Example App",
  "connectionUrl": "ws://localhost:8787",
  "authToken": "dev-token"
});
`);
  assert.throws(() => formatMobigentAppConfigModule(config, { exportName: "not valid" }), /Invalid/);
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
  let mobigentConnection: { disconnect(): void } | undefined;

  try {
    mobigentConnection = await connectMobigent(mobigent, {
      config: backend.app({
        appId: "com.example.existing",
        appName: "Existing App"
      }),
      features: expenses,
      createSocket: createNodeSocket,
      confirm: async () => true
    });

    await waitFor(() => backend.tools().some((tool) => tool.name === "com_example_existing.expense_create"));

    assert.equal(backend.resolveToolName("expense.create"), "com_example_existing.expense_create");

    const result = await backend.call("expense.create", {
      merchant: "Airport Taxi",
      amount: 42.25
    });

    assert.deepEqual(result, {
      id: "EXP-1",
      merchant: "Airport Taxi",
      amount: 42.25
    });
    assert.deepEqual(await backend.call("expense.list"), {
      items: [result]
    });
  } finally {
    mobigentConnection?.disconnect();
    await backend.stop();
  }
});

test("existing app DX can connect without passing the singleton client manually", async () => {
  const created: Array<{ id: string; merchant: string; amount: number }> = [];
  const expenses = feature("expense").write(
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
      confirm: true
    }
  );

  const backend = await startMobigent({
    wsPort: 18993,
    httpPort: 18994,
    app: {
      id: "com.example.onecall",
      name: "One Call App"
    },
    silent: true
  });
  let mobigentConnection: { disconnect(): void } | undefined;

  try {
    mobigentConnection = await connectMobigent(expenses, {
      config: backend.defaultApp,
      createSocket: createNodeSocket,
      confirm: async () => true
    });

    await waitFor(() => backend.tools().some((tool) => tool.name === "com_example_onecall.expense_create"));

    assert.deepEqual(await backend.call("expense.create", {
      merchant: "Airport Taxi",
      amount: 42.25
    }), {
      id: "EXP-1",
      merchant: "Airport Taxi",
      amount: 42.25
    });
  } finally {
    mobigentConnection?.disconnect();
    await backend.stop();
  }
});

test("existing app DX can connect with only features for local demos", async () => {
  const expenses = feature("expense").write(
    "create",
    async (input) => ({
      id: "EXP-LOCAL",
      merchant: String(input.merchant),
      amount: Number(input.amount)
    }),
    {
      input: {
        merchant: "string",
        amount: "number"
      },
      confirm: true
    }
  );

  const backend = await startMobigent({
    wsPort: 18997,
    httpPort: 18998,
    silent: true
  });
  let mobigentConnection: { disconnect(): void } | undefined;

  try {
    mobigentConnection = await connectMobigent(expenses, {
      connectionUrl: backend.defaultApp.connectionUrl,
      createSocket: createNodeSocket,
      confirm: async () => true
    });

    await waitFor(() => backend.tools().some((tool) => tool.name === "app_mobigent_local.expense_create"));

    assert.deepEqual(await backend.call("expense.create", {
      merchant: "Airport Taxi",
      amount: 42.25
    }), {
      id: "EXP-LOCAL",
      merchant: "Airport Taxi",
      amount: 42.25
    });
  } finally {
    mobigentConnection?.disconnect();
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
