import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
  action,
  connectMobigent,
  createApp,
  defineFunctions,
  defineMobigent,
  defineMobigentConfig,
  emitMobigentEvent,
  feature,
  mobigent,
  read,
  setupMobigent,
  simpleSchema,
  withMobigent,
  write,
  type MobigentSocketFactory
} from "@mobigent/app";

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

test("plain object feature API exposes normal app functions with less ceremony", () => {
  const expenses = feature("expense", {
    list: read(async () => ({ items: [] }), {
      output: {
        items: ["object"]
      }
    }),
    create: write(async (input) => ({ id: "EXP-1", ...input }), {
      input: {
        merchant: "string",
        amount: "number"
      }
    }),
    archive: action(async (input) => ({ archived: input.id }), {
      input: {
        id: "string"
      },
      confirm: "Archive expense?"
    })
  });

  assert.equal(expenses.resources[0].name, "expense_list");
  assert.equal(expenses.actions[0].name, "expense_create");
  assert.equal(expenses.actions[0].confirmation?.required, true);
  assert.equal(expenses.actions[1].name, "expense_archive");
  assert.equal(expenses.actions[1].confirmation?.title, "Archive expense?");
});

test("defineMobigent maps product areas to features for one-line app wrapping", () => {
  const features = defineMobigent({
    expense: {
      list: read(async () => ({ items: [] })),
      create: write(async () => ({ ok: true }))
    },
    task: {
      list: read(async () => ({ items: [] }))
    }
  });

  assert.equal(features.length, 2);
  assert.equal(features[0].namespace, "expense");
  assert.equal(features[0].actions[0].name, "expense_create");
  assert.equal(features[1].resources[0].name, "task_list");
});

test("createApp accepts app functions directly for the lowest ceremony path", () => {
  const appFunctions = {
    expense: {
      list: read(async () => ({ items: [] })),
      create: write(async () => ({ ok: true }))
    }
  };

  const features = defineFunctions(appFunctions);
  const app = createApp({ functions: appFunctions });

  assert.equal(features[0].namespace, "expense");
  assert.equal(features[0].actions[0].name, "expense_create");
  assert.equal(app.options.capabilities[0]?.namespace, "expense");
  assert.equal(app.options.capabilities[0]?.actions[0]?.name, "expense_create");
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
  assert.deepEqual(app.options.reconnect, { enabled: true, maxAttempts: 20 });
  assert.equal(app.options.heartbeat, true);
});

test("withMobigent wraps an existing React Native app with one normal function call", () => {
  const expenses = feature("expense").write("create", async () => ({ ok: true }));
  function ExistingApp() {
    return null;
  }

  const WrappedApp = withMobigent(ExistingApp, expenses);

  assert.equal(typeof WrappedApp, "function");
  assert.equal(WrappedApp.displayName, "withMobigent(ExistingApp)");
});

test("simple event helper hides the low-level singleton from app feature files", () => {
  const sentOrQueued = emitMobigentEvent("expense.created", { id: "EXP-1" });

  assert.equal(typeof sentOrQueued, "boolean");
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
    await assert.rejects(
      backend.ready({ minFunctions: 1, timeoutMs: 5, intervalMs: 1 }),
      /waiting for 1 connected app\(s\) and 1 exposed function\(s\)/
    );
  } finally {
    await backend.stop();
  }
});

test("backend SDK exposes app functions without tool vocabulary", async () => {
  const backend = await startMobigentBackend({
    wsPort: 18998,
    httpPort: 18999,
    app: {
      id: "com.example.functions",
      name: "Function App"
    },
    silent: true
  });
  const expensesState: unknown[] = [];
  const expenses = feature("expense")
    .write("create", async (input) => {
      const expense = { id: "EXP-1", ...input };
      expensesState.push(expense);
      return expense;
    })
    .read("list", async () => ({ items: expensesState }));

  try {
    const connection = await connectMobigent(expenses, {
      config: backend.defaultApp,
      createSocket: createNodeSocket
    });

    try {
      await backend.waitForApp({ minFunctions: 1 });
      assert.equal(backend.functions()[0]?.name, "com_example_functions.expense_create");
      assert.equal(backend.resolveFunctionName("expense.create"), "com_example_functions.expense_create");
      assert.deepEqual(await backend.callApp("expense.create", { merchant: "Cafe" }), {
        id: "EXP-1",
        merchant: "Cafe"
      });

      const createExpense = backend.appFunction("expense.create");
      assert.deepEqual(await createExpense({ merchant: "Airport Taxi" }), {
        id: "EXP-1",
        merchant: "Airport Taxi"
      });

      const app = backend.feature("expense");

      assert.deepEqual(await app.create({ merchant: "Bakery" }), {
        id: "EXP-1",
        merchant: "Bakery"
      });
      assert.deepEqual(await app.list(), {
        items: [
          { id: "EXP-1", merchant: "Cafe" },
          { id: "EXP-1", merchant: "Airport Taxi" },
          { id: "EXP-1", merchant: "Bakery" }
        ]
      });
    } finally {
      connection.disconnect();
    }
  } finally {
    await backend.stop();
  }
});

test("backend app functions wait for the app connection automatically", async () => {
  const expenses = feature("expense").write(
    "create",
    async (input) => ({
      id: "EXP-AUTO",
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
    wsPort: 19007,
    httpPort: 19008,
    app: {
      id: "com.example.autowait",
      name: "Auto Wait App"
    },
    silent: true
  });
  let connection: { disconnect(): void } | undefined;
  let connectionPromise: Promise<{ disconnect(): void }> | undefined;

  try {
    const createExpense = backend.feature("expense").create({
      merchant: "Train Station",
      amount: 19.5
    });

    setTimeout(() => {
      connectionPromise = connectMobigent(expenses, {
        config: backend.defaultApp,
        createSocket: createNodeSocket,
        confirm: async () => true
      });
    }, 20);

    assert.deepEqual(await createExpense, {
      id: "EXP-AUTO",
      merchant: "Train Station",
      amount: 19.5
    });
    connection = await connectionPromise;

    await assert.rejects(
      backend.callApp("expense.missing", {}, { waitTimeoutMs: 20, waitIntervalMs: 5 }),
      /waiting for app function expense\.missing/
    );
  } finally {
    connection?.disconnect();
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

test("backend SDK writes app config when appDir is provided", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mobigent-backend-appdir-"));
  const appDir = join(dir, "mobile-app");

  try {
    const backend = await startMobigent({
      wsPort: 19001,
      httpPort: 19002,
      appToken: "dev-token",
      appDir,
      app: {
        id: "com.example.mobile",
        name: "Mobile App"
      },
      silent: true
    });

    try {
      assert.equal(backend.appConfigPath, join(appDir, "mobigent.app.json"));
      assert.equal(backend.appConfigModulePath, undefined);
      const config = JSON.parse(await readFile(join(appDir, "mobigent.app.json"), "utf8"));
      assert.deepEqual(config, {
        appId: "com.example.mobile",
        appName: "Mobile App",
        connectionUrl: "ws://localhost:19001",
        authToken: "dev-token"
      });
    } finally {
      await backend.stop();
    }
  } finally {
    await rm(dir, { force: true, recursive: true });
  }
});

test("backend SDK infers default app identity from appDir", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mobigent-backend-appdir-identity-"));
  const appDir = join(dir, "apps", "travel-wallet-mobile");

  try {
    await mkdir(appDir, { recursive: true });
    await writeFile(join(appDir, "package.json"), JSON.stringify({ name: "@acme/travel-wallet-mobile" }), "utf8");

    const backend = await startMobigent({
      wsPort: 19003,
      httpPort: 19004,
      appDir,
      silent: true
    });

    try {
      assert.deepEqual(backend.defaultApp, {
        appId: "app.acme.travel.wallet.mobile",
        appName: "Travel Wallet Mobile",
        connectionUrl: "ws://localhost:19003",
        authToken: undefined,
        version: undefined
      });
      const config = JSON.parse(await readFile(join(appDir, "mobigent.app.json"), "utf8"));
      assert.equal(config.appId, "app.acme.travel.wallet.mobile");
      assert.equal(config.appName, "Travel Wallet Mobile");
    } finally {
      await backend.stop();
    }
  } finally {
    await rm(dir, { force: true, recursive: true });
  }
});

test("backend SDK writes React Native app config module when requested", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mobigent-backend-app-config-module-"));
  const appDir = join(dir, "mobile-app");

  try {
    const backend = await startMobigent({
      wsPort: 19005,
      httpPort: 19006,
      appDir,
      appConfigModuleFile: join("src", "mobigent-config.ts"),
      app: {
        id: "com.example.mobile",
        name: "Mobile App"
      },
      silent: true
    });

    try {
      assert.equal(backend.appConfigPath, join(appDir, "mobigent.app.json"));
      assert.equal(backend.appConfigModulePath, join(appDir, "src", "mobigent-config.ts"));
      const configModule = await readFile(join(appDir, "src", "mobigent-config.ts"), "utf8");
      assert.match(configModule, /defineMobigentConfig/);
      assert.match(configModule, /com\.example\.mobile/);
    } finally {
      await backend.stop();
    }
  } finally {
    await rm(dir, { force: true, recursive: true });
  }
});

test("backend init helper creates a simple server entrypoint", () => {
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
  assert.match(files[0]?.contents ?? "", /export const waitForApp = mobigent\.waitForApp/);
  assert.match(files[0]?.contents ?? "", /export const callApp = mobigent\.callApp/);
  assert.match(files[0]?.contents ?? "", /export const appFunction = mobigent\.appFunction/);
  assert.match(files[0]?.contents ?? "", /export const feature = mobigent\.feature/);
  assert.match(files[0]?.contents ?? "", /export const appFunctions = mobigent\.appFunctions/);
  assert.doesNotMatch(files[0]?.contents ?? "", /copyAppConfig|Copy this/);
  assert.match(files[1]?.contents ?? "", /# MOBIGENT_AUTH_TOKEN=replace-me/);
  assert.match(files[2]?.contents ?? "", /"connectionUrl": "ws:\/\/localhost:8787"/);
});

test("backend init helper bakes appDir into generated backend code", () => {
  const files = createMobigentBackendFiles({
    appId: "com.example.app",
    appName: "Example App",
    outDir: "src",
    fileName: "mobigent.ts",
    envFile: ".env.mobigent",
    configFile: "mobigent.app.json",
    appDir: "../mobile-app",
    connectionUrl: "ws://localhost:8787",
    authToken: "dev-token",
    force: false,
    dryRun: true
  });

  const backendFile = files.find((file) => file.path === "src/mobigent.ts")?.contents ?? "";

  assert.deepEqual(files.map((file) => file.path), [
    "src/mobigent.ts",
    ".env.mobigent",
    "mobigent.app.json",
    "../mobile-app/mobigent.app.json",
    "../mobile-app/src/mobigent-config.ts"
  ]);
  assert.match(backendFile, /appDir: "\.\.\/mobile-app"/);
  assert.match(backendFile, /appConfigModuleFile: "src\/mobigent-config\.ts"/);
  assert.doesNotMatch(backendFile, /app: \{/);
  assert.match(backendFile, /mobigent\.appConfigPath/);
  assert.match(backendFile, /mobigent\.appConfigModulePath/);
  assert.match(files.find((file) => file.path === "../mobile-app/src/mobigent-config.ts")?.contents ?? "", /defineMobigentConfig/);
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
    assert.equal("authToken" in config, false);

    const inferredAppDir = join(dir, "apps", "wallet-mobile");
    await mkdir(inferredAppDir, { recursive: true });
    await writeFile(
      join(inferredAppDir, "package.json"),
      JSON.stringify({ name: "@example/wallet-mobile" }),
      "utf8"
    );

    stdout = "";
    stderr = "";
    const appDirDryRunCode = runMobigentBackendCli(
      ["--app-dir", inferredAppDir, "--dry-run"],
      { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
      { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream
    );
    assert.equal(appDirDryRunCode, 0, stderr);
    const appDirFiles = JSON.parse(stdout).files as Array<{ path: string; contents: string }>;
    const appDirConfig = JSON.parse(
      appDirFiles.find((file) => file.path === join(inferredAppDir, "mobigent.app.json"))?.contents ?? "{}"
    );
    assert.equal(appDirConfig.appId, "app.example.wallet.mobile");
    assert.equal(appDirConfig.appName, "Wallet Mobile");

    stdout = "";
    stderr = "";
    const writeCode = runMobigentBackendCli(
      ["--app", "com.example.expense", "--app-name", "Expense App"],
      { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
      { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream
    );
    assert.equal(writeCode, 0, stderr);
    assert.match(stdout, /npm install @mobigent\/app/);
    assert.match(stdout, /Add a mobigent\.ts file, expose normal app functions, then wrap your app once/);
    assert.match(stdout, /export const mobigent = createApp\(\{ functions: \{ expense: \{ list: read\(listExpenses\) \} \} \}\);/);
    assert.match(stdout, /Need sample files instead of hand-writing them\?/);
    assert.doesNotMatch(stdout, /npx mobigent-init --feature expense --out-dir src/);
    assert.match(stdout, /npx tsx src\/mobigent\.ts/);
    assert.doesNotMatch(stdout, /--config/);
    assert.doesNotMatch(stdout, /--env-file/);
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
  assert.equal(formatMobigentAppConfigModule(config), `import { defineMobigentConfig } from "@mobigent/app";

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

    const status = await backend.waitForApp();
    assert.equal(status.appsWithManifests, 1);
    assert.equal(status.tools, 2);

    assert.equal(backend.resolveFunctionName("expense.create"), "com_example_existing.expense_create");

    const result = await backend.callApp("expense.create", {
      merchant: "Airport Taxi",
      amount: 42.25
    });

    assert.deepEqual(result, {
      id: "EXP-1",
      merchant: "Airport Taxi",
      amount: 42.25
    });
    assert.deepEqual(await backend.callApp("expense.list"), {
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

    await waitFor(() => backend.functions().some((fn) => fn.name === "com_example_onecall.expense_create"));

    assert.deepEqual(await backend.callApp("expense.create", {
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

    await waitFor(() => backend.functions().some((fn) => fn.name === "app_mobigent_local.expense_create"));

    assert.deepEqual(await backend.callApp("expense.create", {
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
