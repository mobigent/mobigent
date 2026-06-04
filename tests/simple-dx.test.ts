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
  createApp,
  emitMobigentEvent,
  read,
  withMobigent,
  write
} from "@mobigent/app";
import {
  connectMobigent,
  defineFunctions,
  defineMobigent,
  defineMobigentConfig,
  feature,
  setupMobigent,
  simpleSchema
} from "@mobigent/app/app";
import type { MobigentSocketFactory } from "@mobigent/react-native";
import { createApp as createReactNativeApp, mobigent } from "@mobigent/react-native";

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

test("plain object feature API accepts real functions without wrappers", async () => {
  const expenses = feature("expense", {
    list: async () => ({ items: [{ id: "EXP-1" }] }),
    create: async (input) => ({ id: "EXP-2", ...input })
  });

  assert.equal(expenses.resources[0].name, "expense_list");
  assert.equal(expenses.actions[0].name, "expense_create");
  assert.equal(expenses.actions[0].confirmation?.required, true);
  assert.deepEqual(await expenses.resources[0].read(), { items: [{ id: "EXP-1" }] });
  assert.deepEqual(await expenses.actions[0].handler({ merchant: "Coffee" }), {
    id: "EXP-2",
    merchant: "Coffee"
  });
});

test("defineMobigent maps product areas to features for one-line app wrapping", () => {
  const features = defineMobigent({
    expense: {
      list: async () => ({ items: [] }),
      create: async () => ({ ok: true })
    },
    task: {
      list: async () => ({ items: [] })
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
      list: async () => ({ items: [] }),
      create: async () => ({ ok: true })
    }
  };

  const features = defineFunctions(appFunctions);
  const app = createApp({ functions: appFunctions });

  assert.equal(features[0].namespace, "expense");
  assert.equal(features[0].actions[0].name, "expense_create");
  assert.equal(app.options.capabilities[0]?.namespace, "expense");
  assert.equal(app.options.capabilities[0]?.actions[0]?.name, "expense_create");
});

test("app package createApp accepts a plain function map with no wrapper key", () => {
  const app = createApp({
    expense: {
      list: async () => ({ items: [] }),
      create: async (input) => ({ id: "EXP-PLAIN", ...input })
    }
  });

  assert.equal(app.options.appId, undefined);
  assert.equal(app.options.capabilities[0]?.namespace, "expense");
  assert.equal(app.options.capabilities[0]?.resources[0]?.name, "expense_list");
  assert.equal(app.options.capabilities[0]?.actions[0]?.name, "expense_create");
});

test("app package createApp accepts a plain function map with identity options", () => {
  const app = createApp(
    {
      expense: {
        list: async () => ({ items: [] })
      }
    },
    {
      appName: "Plain Expenses",
      connection: "ws://localhost:8787"
    }
  );

  assert.equal(app.options.appName, "Plain Expenses");
  assert.equal(app.options.gatewayUrl, "ws://localhost:8787");
  assert.equal(app.options.capabilities[0]?.namespace, "expense");
});

test("createApp accepts an app id and functions as the shortest app path", () => {
  const app = createApp("com.example.shortapp", {
    expense: {
      list: async () => ({ items: [] }),
      create: async (input) => ({ id: "EXP-SHORT", ...input })
    }
  });

  assert.equal(app.options.appId, "com.example.shortapp");
  assert.equal(app.options.capabilities[0]?.namespace, "expense");
  assert.equal(app.options.capabilities[0]?.resources[0]?.name, "expense_list");
  assert.equal(app.options.capabilities[0]?.actions[0]?.name, "expense_create");
});

test("React Native package createApp also accepts the short app id path", () => {
  const app = createReactNativeApp("com.example.rnshort", {
    expense: {
      list: async () => ({ items: [] }),
      create: async (input) => ({ id: "EXP-RN", ...input })
    }
  });

  assert.equal(app.options.appId, "com.example.rnshort");
  assert.equal(app.options.capabilities[0]?.namespace, "expense");
  assert.equal(app.options.capabilities[0]?.actions[0]?.name, "expense_create");
});

test("createApp accepts a friendly connection target instead of generated app config", async () => {
  const app = createApp({
    appId: "com.example.expenses",
    connection: { host: "192.168.1.20" },
    functions: {
      expense: {
        list: read(async () => ({ items: [] }))
      }
    }
  });
  const configured: unknown[] = [];
  const client = {
    configure(options: unknown) {
      configured.push(options);
    },
    async connect() {},
    disconnect() {},
    registerAction() {},
    registerResource() {},
    registerComponent() {}
  };

  assert.equal(app.options.gatewayUrl, "ws://192.168.1.20:8787");
  await connectMobigent(client, app.options.capabilities[0], {
    appId: "com.example.expenses",
    connection: { host: "192.168.1.20" }
  });

  assert.equal((configured[0] as { gatewayUrl?: string }).gatewayUrl, "ws://192.168.1.20:8787");
});

test("createApp accepts a hosted backend URL directly", () => {
  const app = createApp({
    appId: "com.example.hosted",
    connection: "wss://mobigent.example.com",
    functions: {
      expense: {
        list: read(async () => ({ items: [] }))
      }
    }
  });

  assert.equal(app.options.gatewayUrl, "wss://mobigent.example.com");
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

test("app package withMobigent accepts app id and functions directly", () => {
  function ExistingApp() {
    return null;
  }

  const WrappedApp = withMobigent(ExistingApp, "com.example.directwrap", {
    expense: {
      list: async () => ({ items: [] }),
      create: async (input) => ({ id: "EXP-WRAP", ...input })
    }
  });

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
    const health = await fetch(`${backend.apiUrl}/health`).then((response) => response.json() as Promise<{ ok: boolean }>);
    assert.equal(health.ok, true);
    assert.equal(backend.connection.connectionUrl, "ws://localhost:18987");
    assert.equal(backend.openApiUrl, "http://localhost:18988/openapi.json");
    assert.equal(backend.apiUrl, "http://localhost:18988");
    assert.equal(backend.inspectorUrl, "http://localhost:18988/inspect");
    assert.equal(backend.openApiUrl, "http://localhost:18988/openapi.json");
    assert.equal(backend.advanced.urls.websocket, "ws://localhost:18987");
    assert.equal(backend.advanced.urls.http, backend.apiUrl);
    assert.match(backend.advanced.copyAppConfig(), new RegExp(backend.connection.appId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.deepEqual(backend.client(), backend.connection);
    assert.deepEqual(backend.client("com.example.client", "Client App"), {
      appId: "com.example.client",
      appName: "Client App",
      connectionUrl: "ws://localhost:18987",
      authToken: "dev-token",
      version: undefined
    });
    assert.deepEqual(backend.client({ appId: "com.example.client", appName: "Client App" }), {
      appId: "com.example.client",
      appName: "Client App",
      connectionUrl: "ws://localhost:18987",
      authToken: "dev-token",
      version: undefined
    });
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
      config: backend.client(),
      createSocket: createNodeSocket
    });

    try {
      await backend.waitForApp({ minFunctions: 1 });
      assert.equal(backend.listFunctions()[0]?.name, "com_example_functions.expense_create");
      assert.equal(backend.listFunctions()[0]?.name, "com_example_functions.expense_create");
      assert.equal(backend.resolveFunctionName("expense.create"), "com_example_functions.expense_create");
      assert.deepEqual(await backend.call("expense.create", { merchant: "Cafe" }), {
        id: "EXP-1",
        merchant: "Cafe"
      });

      const createExpense = backend.fn("expense.create");
      assert.deepEqual(await createExpense({ merchant: "Airport Taxi" }), {
        id: "EXP-1",
        merchant: "Airport Taxi"
      });

      assert.deepEqual(await backend.functions.expense.create({ merchant: "Bookshop" }), {
        id: "EXP-1",
        merchant: "Bookshop"
      });

      assert.deepEqual(await backend.app.expense.create({ merchant: "Juice Bar" }), {
        id: "EXP-1",
        merchant: "Juice Bar"
      });

      assert.deepEqual(await backend.use("expense").create({ merchant: "Pizzeria" }), {
        id: "EXP-1",
        merchant: "Pizzeria"
      });

      const expenseHelpers = backend.use({
        createExpense: "expense.create",
        listExpenses: "expense.list"
      });

      assert.deepEqual(await expenseHelpers.createExpense({ merchant: "Deli" }), {
        id: "EXP-1",
        merchant: "Deli"
      });

      const namedExpenses = backend.use("expense", {
        createExpense: "create",
        listExpenses: "list"
      });
      assert.deepEqual(await namedExpenses.createExpense({ merchant: "Market" }), {
        id: "EXP-1",
        merchant: "Market"
      });

      const directExpenses = backend.use("expense", ["create", "list"] as const);
      assert.deepEqual(await directExpenses.create({ merchant: "Grocer" }), {
        id: "EXP-1",
        merchant: "Grocer"
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
          { id: "EXP-1", merchant: "Bookshop" },
          { id: "EXP-1", merchant: "Juice Bar" },
          { id: "EXP-1", merchant: "Pizzeria" },
          { id: "EXP-1", merchant: "Deli" },
          { id: "EXP-1", merchant: "Market" },
          { id: "EXP-1", merchant: "Grocer" },
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

test("app package connects to a backend object without connection URL ceremony", async () => {
  const backend = await startMobigent("com.example.backendtarget", "Backend Target App", {
    wsPort: 19011,
    httpPort: 19012,
    silent: true
  });
  const app = createApp({
    appId: "com.example.backendtarget",
    functions: {
      expense: {
        create: write(async (input) => ({ id: "EXP-BACKEND", ...input }), {
          input: {
            merchant: "string"
          },
          confirm: true
        })
      }
    },
    createSocket: createNodeSocket,
    confirm: async () => true
  });

  try {
    assert.equal(backend.connection.appId, "com.example.backendtarget");
    assert.equal(backend.connection.connectionUrl, "ws://localhost:19011");

    const connection = await app.connect(backend);

    try {
      await backend.waitForApp({ minFunctions: 1 });
      assert.deepEqual(await backend.app.expense.create({ merchant: "Tea" }), {
        id: "EXP-BACKEND",
        merchant: "Tea"
      });
      assert.deepEqual(await backend.functions.expense.create({ merchant: "Coffee" }), {
        id: "EXP-BACKEND",
        merchant: "Coffee"
      });
    } finally {
      connection.disconnect();
    }
  } finally {
    await backend.stop();
  }
});

test("app and backend SDKs can pair with matching string app identity", async () => {
  const previousWsPort = process.env.MOBIGENT_WS_PORT;
  const previousHttpPort = process.env.MOBIGENT_HTTP_PORT;
  process.env.MOBIGENT_WS_PORT = "19015";
  process.env.MOBIGENT_HTTP_PORT = "19016";

  const backend = await startMobigent("com.example.stringpair", "String Pair App");
  const app = createApp(
    "com.example.stringpair",
    {
      expense: {
        create: write(async (input) => ({ id: "EXP-STRING", ...input }), {
          input: {
            merchant: "string"
          },
          confirm: true
        })
      }
    },
    {
      createSocket: createNodeSocket,
      confirm: async () => true
    }
  );

  try {
    const connection = await app.connect(backend);

    try {
      assert.deepEqual(await backend.app.expense.create({ merchant: "Noodles" }), {
        id: "EXP-STRING",
        merchant: "Noodles"
      });
    } finally {
      connection.disconnect();
    }
  } finally {
    await backend.stop();
    if (previousWsPort === undefined) {
      delete process.env.MOBIGENT_WS_PORT;
    } else {
      process.env.MOBIGENT_WS_PORT = previousWsPort;
    }
    if (previousHttpPort === undefined) {
      delete process.env.MOBIGENT_HTTP_PORT;
    } else {
      process.env.MOBIGENT_HTTP_PORT = previousHttpPort;
    }
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
  const backend = await startMobigent("com.example.autowait", "Auto Wait App", {
    wsPort: 19007,
    httpPort: 19008,
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
        config: backend.client(),
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
      backend.call("expense.missing", {}, { waitTimeoutMs: 20, waitIntervalMs: 5 }),
      /waiting for app function expense\.missing/
    );
  } finally {
    connection?.disconnect();
    await backend.stop();
  }
});

test("backend SDK can start with one app identity and normal backend options", async () => {
  const backend = await startMobigent("com.example.simple", "Simple App", {
    wsPort: 18991,
    httpPort: 18992,
    appToken: "dev-token",
    silent: true
  });

  try {
    assert.deepEqual(backend.connection, {
      appId: "com.example.simple",
      appName: "Simple App",
      connectionUrl: "ws://localhost:18991",
      authToken: "dev-token",
      version: undefined
    });
    assert.match(backend.advanced.copyAppConfig(), /com.example.simple/);
    assert.match(backend.advanced.appConfigCode ?? "", /defineMobigentConfig/);
  } finally {
    await backend.stop();
  }
});

test("backend SDK can pair with an app using only a top-level app id", async () => {
  const backend = await startMobigent("com.example.minimal", undefined, {
    wsPort: 19009,
    httpPort: 19010,
    silent: true
  });

  try {
    assert.deepEqual(backend.connection, {
      appId: "com.example.minimal",
      appName: "Minimal",
      connectionUrl: "ws://localhost:19009",
      authToken: undefined,
      version: undefined
    });
  } finally {
    await backend.stop();
  }
});

test("backend SDK can start from just an app id string", async () => {
  const previousWsPort = process.env.MOBIGENT_WS_PORT;
  const previousHttpPort = process.env.MOBIGENT_HTTP_PORT;
  process.env.MOBIGENT_WS_PORT = "19013";
  process.env.MOBIGENT_HTTP_PORT = "19014";

  const backend = await startMobigent("com.example.stringapp", "String App");

  try {
    assert.equal(backend.connection.appId, "com.example.stringapp");
    assert.equal(backend.connection.appName, "String App");
    assert.equal(backend.inspectorUrl, "http://localhost:19014/inspect");
  } finally {
    await backend.stop();
    if (previousWsPort === undefined) {
      delete process.env.MOBIGENT_WS_PORT;
    } else {
      process.env.MOBIGENT_WS_PORT = previousWsPort;
    }
    if (previousHttpPort === undefined) {
      delete process.env.MOBIGENT_HTTP_PORT;
    } else {
      process.env.MOBIGENT_HTTP_PORT = previousHttpPort;
    }
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
      assert.deepEqual(backend.connection, {
        appId: "app.acme.travel.wallet",
        appName: "Travel Wallet",
        connectionUrl: "ws://localhost:18995",
        authToken: undefined,
        version: undefined
      });
      assert.match(backend.advanced.copyAppConfig(), /Travel Wallet/);
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
      assert.equal(backend.advanced.appConfigPath, join(appDir, "mobigent.app.json"));
      assert.equal(backend.advanced.appConfigModulePath, undefined);
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
      assert.deepEqual(backend.connection, {
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
      assert.equal(backend.advanced.appConfigPath, join(appDir, "mobigent.app.json"));
      assert.equal(backend.advanced.appConfigModulePath, join(appDir, "src", "mobigent-config.ts"));
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

  assert.deepEqual(files.map((file) => file.path), ["src/mobigent.ts", ".env.mobigent"]);
  assert.match(files[0]?.contents ?? "", /startMobigent/);
  assert.doesNotMatch(files[0]?.contents ?? "", /defaultApp/);
  assert.doesNotMatch(files[0]?.contents ?? "", /export const mobigentConfig/);
  assert.match(files[0]?.contents ?? "", /export const waitForApp = mobigent\.waitForApp/);
  assert.match(files[0]?.contents ?? "", /export const call = mobigent\.call/);
  assert.match(files[0]?.contents ?? "", /export const listFunctions = mobigent\.listFunctions/);
  assert.match(files[0]?.contents ?? "", /export const functions = mobigent\.functions/);
  assert.match(files[0]?.contents ?? "", /export const fn = mobigent\.fn/);
  assert.match(files[0]?.contents ?? "", /export const feature = mobigent\.feature/);
  assert.match(files[0]?.contents ?? "", /mobigent\.inspectorUrl/);
  assert.match(files[0]?.contents ?? "", /mobigent\.openApiUrl/);
  assert.doesNotMatch(files[0]?.contents ?? "", /callApp|appFunction|appFunctions|mobigent\.appFunction/);
  assert.doesNotMatch(files[0]?.contents ?? "", /copyAppConfig|mobigent\.urls|Copy this/);
  assert.match(files[1]?.contents ?? "", /# MOBIGENT_AUTH_TOKEN=replace-me/);
  assert.equal(files.some((file) => file.path === "mobigent.app.json"), false);
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
    assert.deepEqual(files.map((file) => file.path), ["src/mobigent.ts", ".env.mobigent"]);
    assert.match(
      files.find((file) => file.path === "src/mobigent.ts")?.contents ?? "",
      /startMobigent\("app\.example\.expense\.hub", "Expense Hub", \{/
    );
    assert.equal(files.some((file) => file.path === "mobigent.app.json"), false);

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
    assert.match(stdout, /use the same app id, expose normal app functions, then wrap your app once/);
    assert.match(stdout, /createApp\("com\.example\.expense", \{/);
    assert.match(stdout, /expense: \{ list: async \(\) => listExpenses\(\) \}/);
    assert.doesNotMatch(stdout, /functions: \{ expense/);
    assert.doesNotMatch(stdout, /read\(listExpenses\)/);
    assert.match(stdout, /No app config file is required for the normal app\/backend path/);
    assert.match(stdout, /Need sample files instead of hand-writing them\?/);
    assert.doesNotMatch(stdout, /npx mobigent-init --feature expense --out-dir src/);
    assert.doesNotMatch(stdout, /pass --app-dir \.\.\/mobile-app only/);
    assert.match(stdout, /npx tsx src\/mobigent\.ts/);
    assert.doesNotMatch(stdout, /--config/);
    assert.doesNotMatch(stdout, /--env-file/);
    const generatedBackend = await readFile(join(dir, "src", "mobigent.ts"), "utf8");
    assert.match(generatedBackend, /startMobigent\("com\.example\.expense", "Expense App", \{/);
    assert.doesNotMatch(generatedBackend, /appId: "com\.example\.expense"/);
    assert.doesNotMatch(generatedBackend, /appName: "Expense App"/);
    assert.doesNotMatch(generatedBackend, /app: \{/);
    await assert.rejects(readFile(join(dir, "mobigent.app.json"), "utf8"), /ENOENT/);

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
  assert.equal(formatMobigentAppConfigModule(config), `import { defineMobigentConfig } from "@mobigent/app/app";

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
    assert.equal(status.appsWithFunctions, 1);
    assert.equal(status.functions, 2);

    assert.equal(backend.resolveFunctionName("expense.create"), "com_example_existing.expense_create");

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

    const backendExpenses = backend.use({
      createExpense: "expense.create",
      listExpenses: "expense.list"
    });
    assert.deepEqual(await backendExpenses.createExpense({
      merchant: "Bakery",
      amount: 12
    }), {
      id: "EXP-2",
      merchant: "Bakery",
      amount: 12
    });
    assert.deepEqual(await backendExpenses.listExpenses(), {
      items: [
        result,
        {
          id: "EXP-2",
          merchant: "Bakery",
          amount: 12
        }
      ]
    });

    const cleanBackendExpenses = backend.use("expense", {
      createExpense: "create",
      listExpenses: "list"
    });
    assert.deepEqual(await cleanBackendExpenses.createExpense({
      merchant: "Bookshop",
      amount: 18
    }), {
      id: "EXP-3",
      merchant: "Bookshop",
      amount: 18
    });
    assert.deepEqual(await cleanBackendExpenses.listExpenses(), {
      items: [
        result,
        {
          id: "EXP-2",
          merchant: "Bakery",
          amount: 12
        },
        {
          id: "EXP-3",
          merchant: "Bookshop",
          amount: 18
        }
      ]
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

  const backend = await startMobigent("com.example.onecall", "One Call App", {
    wsPort: 18993,
    httpPort: 18994,
    silent: true
  });
  let mobigentConnection: { disconnect(): void } | undefined;

  try {
    mobigentConnection = await connectMobigent(expenses, {
      config: backend.client(),
      createSocket: createNodeSocket,
      confirm: async () => true
    });

    await waitFor(() => backend.listFunctions().some((fn) => fn.name === "com_example_onecall.expense_create"));

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
      connectionUrl: backend.connection.connectionUrl,
      createSocket: createNodeSocket,
      confirm: async () => true
    });

    await waitFor(() => backend.listFunctions().some((fn) => fn.name === "app_mobigent_local.expense_create"));

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
