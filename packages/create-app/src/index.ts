import { existsSync, mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, join, resolve } from "node:path";

export type CreateMobigentAppOptions = {
  targetDir: string;
  appId: string;
  appName: string;
  packageName?: string;
  gatewayPort: number;
  httpPort: number;
  appPort: number;
  openBrowser: boolean;
  force: boolean;
  dryRun: boolean;
  localPackages?: string;
  packageSource?: "github-release" | "npm";
  packageVersion?: string;
  installDependencies?: boolean;
};

export type GeneratedFile = {
  path: string;
  contents: string;
};

export function createMobigentAppFiles(options: CreateMobigentAppOptions): GeneratedFile[] {
  const packageName = sanitizePackageName(options.packageName ?? basename(options.targetDir));

  return [
    {
      path: "package.json",
      contents: `${JSON.stringify(createPackageJson(packageName, options), null, 2)}\n`
    },
    {
      path: "README.md",
      contents: createReadme(options)
    },
    {
      path: "tsconfig.json",
      contents: `${JSON.stringify(createTsConfig(), null, 2)}\n`
    },
    {
      path: ".gitignore",
      contents: "node_modules\ndist\n.env\n.DS_Store\n"
    },
    {
      path: join("src", "server.ts"),
      contents: createServerFile(options)
    },
    {
      path: join("src", "capabilities.ts"),
      contents: createCapabilitiesFile()
    },
    {
      path: join("src", "doctor.ts"),
      contents: createDoctorFile(options)
    },
    {
      path: join("src", "nodeSocket.ts"),
      contents: createNodeSocketFile()
    }
  ];
}

export function writeMobigentApp(options: CreateMobigentAppOptions): GeneratedFile[] {
  const files = createMobigentAppFiles(options);
  const targetDir = resolve(options.targetDir);

  if (options.dryRun) {
    return files;
  }

  if (existsSync(targetDir) && !options.force) {
    throw new Error(`Target directory already exists: ${targetDir}. Re-run with --force to write into it.`);
  }

  for (const file of files) {
    const path = join(targetDir, file.path);
    if (existsSync(path) && !options.force) {
      throw new Error(`Refusing to overwrite ${path}. Re-run with --force to replace generated files.`);
    }
    mkdirSync(resolve(path, ".."), { recursive: true });
    writeFileSync(path, file.contents, "utf8");
  }

  return files;
}

export function formatSuccessMessage(options: CreateMobigentAppOptions) {
  const relativeDir = options.targetDir;
  const openLine = options.openBrowser
    ? `The dev server opens http://localhost:${options.appPort} automatically.`
    : `Open http://localhost:${options.appPort} after the dev server starts.`;
  const next = options.installDependencies
    ? `  cd ${shellPath(relativeDir)}
  npm run dev`
    : `  cd ${shellPath(relativeDir)}
  npm install
  npm run dev`;

  return `Created Mobigent starter in ${relativeDir}

Next:
${next}

${openLine}
Click "Run agent request" to watch a Mobigent tool call update the app.
Run "npm run doctor" in another terminal to confirm the app, gateway, readiness check, and tool discovery are healthy.
`;
}

export function installMobigentAppDependencies(options: Pick<CreateMobigentAppOptions, "targetDir">) {
  const result = spawnSync("npm", ["install"], {
    cwd: resolve(options.targetDir),
    encoding: "utf8"
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error
  };
}

const defaultMobigentVersion = "0.1.1";

function createPackageJson(packageName: string, options?: CreateMobigentAppOptions) {
  const packageSource = options?.packageSource ?? "github-release";
  const version = options?.packageVersion ?? defaultMobigentVersion;
  const dependencies = options?.localPackages
    ? {
        "@mobigent/core": localPackageSpec(options, "core"),
        "@mobigent/providers": localPackageSpec(options, "providers"),
        "@mobigent/gateway": localPackageSpec(options, "gateway"),
        "@mobigent/react-native": localPackageSpec(options, "react-native"),
        express: "^5.2.1",
        ws: "^8.21.0"
      }
    : packageSource === "github-release"
      ? {
          "@mobigent/gateway": releaseTarballSpec("mobigent-gateway", version),
          "@mobigent/providers": releaseTarballSpec("mobigent-providers", version),
          "@mobigent/react-native": releaseTarballSpec("mobigent-react-native", version),
          express: "^5.2.1",
          ws: "^8.21.0"
        }
    : {
        "@mobigent/gateway": `^${version}`,
        "@mobigent/providers": `^${version}`,
        "@mobigent/react-native": `^${version}`,
        express: "^5.2.1",
        ws: "^8.21.0"
      };

  return {
    name: packageName,
    version: "0.1.1",
    private: true,
    type: "module",
    scripts: {
      dev: "tsx src/server.ts",
      doctor: "tsx src/doctor.ts",
      "agent:local": "mobigent-provider --provider claude-desktop --command mobigent-mcp --format guide",
      "agent:openapi": `mobigent-provider --provider openapi --base-url http://localhost:${options?.httpPort ?? 8788} --format guide`,
      "agent:chatgpt": "mobigent-provider --provider chatgpt-actions --base-url https://your-public-gateway.example --format guide",
      check: "tsc -p tsconfig.json --noEmit"
    },
    dependencies,
    devDependencies: {
      "@types/express": "^5.0.6",
      "@types/node": "^25.9.1",
      "@types/ws": "^8.18.1",
      tsx: "^4.22.3",
      typescript: "^6.0.3"
    }
  };
}

function createTsConfig() {
  return {
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      types: ["node"]
    },
    include: ["src/**/*.ts"]
  };
}

function createReadme(options: CreateMobigentAppOptions) {
  const packageSource = options.localPackages ? "local" : (options.packageSource ?? "github-release");
  const sourceNote =
    packageSource === "local"
      ? "\nThis starter is linked to local Mobigent packages from this repository.\n"
      : packageSource === "github-release"
        ? "\nThis starter installs Mobigent packages from public GitHub release tarballs, so it works before npmjs publishing is connected.\n"
        : "";
  const runSteps = options.installDependencies ? "npm run dev" : "npm install\nnpm run dev";

  return `# ${options.appName}

This app was created with \`create-mobigent-app\`.
${sourceNote}

## Run

\`\`\`bash
${runSteps}
\`\`\`

${options.openBrowser ? `The demo opens \`http://localhost:${options.appPort}\` automatically.` : `Open \`http://localhost:${options.appPort}\` after the dev server starts.`}

Click \`Run agent request\`. The request calls the Mobigent gateway tool endpoint, runs the app-owned action, and updates visible app state.

In another terminal, run this anytime:

\`\`\`bash
npm run doctor
\`\`\`

It checks the visible app, gateway health, readiness, and exposed Mobigent tool.

Then choose an agent path:

\`\`\`bash
npm run agent:local
npm run agent:openapi
npm run agent:chatgpt
\`\`\`

These print copy-paste setup for Claude Desktop/MCP, generic OpenAPI agents, and ChatGPT Actions.

## What Is Running

- App playground: \`http://localhost:${options.appPort}\`
- Gateway inspector: \`http://localhost:${options.httpPort}/inspect\`
- App WebSocket gateway: \`ws://localhost:${options.gatewayPort}\`

## What To Edit

- \`src/capabilities.ts\`: app state, Mobigent actions/resources, schemas, and handlers
- \`src/server.ts\`: demo UI, gateway process, and local agent playground
- \`src/nodeSocket.ts\`: Node WebSocket transport for the local demo

When you move this into a real mobile app, start by copying the shape from \`src/capabilities.ts\` and replacing the in-memory handlers with your app's real data/functions.
`;
}

function createServerFile(options: CreateMobigentAppOptions) {
  return `import { spawn } from "node:child_process";
import express from "express";
import { BridgeGateway, createHttpApp } from "@mobigent/gateway";
import { mobigent } from "@mobigent/react-native";
import { expenses, parsePrompt, registerMobigentCapabilities } from "./capabilities.js";
import { createNodeSocket } from "./nodeSocket.js";

let lastAgentRun: unknown;

const gatewayPort = ${options.gatewayPort};
const httpPort = ${options.httpPort};
const appPort = ${options.appPort};
const toolName = "${toolName(options.appId, "create_expense")}";

const gateway = new BridgeGateway(gatewayPort);
gateway.start();

const gatewayHttp = createHttpApp(gateway);
const gatewayServer = gatewayHttp.listen(httpPort, () => {
  console.log(\`Mobigent inspector: http://localhost:\${httpPort}/inspect\`);
});

const app = express();
app.use(express.json());
app.get("/favicon.ico", (_req, res) => res.status(204).end());
app.get("/", (_req, res) => res.type("html").send(renderPage()));
app.get("/state", (_req, res) => res.json({ expenses, lastAgentRun }));
app.post("/agent/run", async (req, res) => {
  const input = parsePrompt(typeof req.body?.prompt === "string" ? req.body.prompt : "");
  const run = {
    prompt: req.body?.prompt,
    tool: toolName,
    input,
    createdAt: new Date().toISOString()
  };

  try {
    const response = await fetch(\`http://localhost:\${httpPort}/tools/\${toolName}/call\`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    });
    const body = await response.json();
    lastAgentRun = { ...run, response: body };
    res.status(response.ok ? 200 : response.status).json(lastAgentRun);
  } catch (error) {
    lastAgentRun = { ...run, error: error instanceof Error ? error.message : String(error) };
    res.status(500).json(lastAgentRun);
  }
});

const appServer = app.listen(appPort, () => {
  console.log(\`Mobigent starter: http://localhost:\${appPort}\`);
  console.log("One page. One button. Real tool call.");
  openBrowser(\`http://localhost:\${appPort}\`);
});

mobigent.configure({
  appId: ${JSON.stringify(options.appId)},
  appName: ${JSON.stringify(options.appName)},
  gatewayUrl: \`ws://localhost:\${gatewayPort}\`,
  createSocket: createNodeSocket,
  confirm: async ({ action, input }) => {
    console.log(\`\\n[approval] \${action.confirmation?.title ?? action.name}\`);
    console.log(JSON.stringify(input, null, 2));
    console.log("[approval] approved by the starter host\\n");
    return true;
  }
});

registerMobigentCapabilities();

await mobigent.connect();

function openBrowser(url: string) {
  if (${options.openBrowser ? "false" : "true"} || process.env.MOBIGENT_DEMO_OPEN === "0") {
    return;
  }
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = spawn(command, args, { detached: true, stdio: "ignore" });
  child.on("error", () => undefined);
  child.unref();
}

function shutdown() {
  mobigent.disconnect();
  gateway.stop();
  gatewayServer.close();
  appServer.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function renderPage() {
  return \`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeTemplate(options.appName)}</title>
  <style>
    :root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #101828; background: #f8faff; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: radial-gradient(circle at 15% 8%, rgba(41,69,255,.16), transparent 34%), #f8faff; }
    main { max-width: 1180px; margin: 0 auto; padding: 34px 20px 40px; }
    header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
    h1 { margin: 0; font-size: clamp(34px, 6vw, 62px); line-height: .96; letter-spacing: 0; }
    h2 { margin: 0; font-size: 18px; }
    p { color: #667085; margin: 8px 0 0; line-height: 1.55; }
    textarea { width: 100%; min-height: 112px; resize: vertical; border: 1px solid #d9e0ff; border-radius: 10px; padding: 12px; font: inherit; overflow-wrap: anywhere; }
    button { border: 0; border-radius: 10px; background: #2945ff; color: #fff; min-height: 44px; padding: 0 16px; font-weight: 700; cursor: pointer; box-shadow: 0 14px 34px rgba(41,69,255,.24); }
    button:disabled { opacity: .55; cursor: wait; }
    pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 12px; line-height: 1.55; color: #344054; }
    .status, .panel { border: 1px solid #d9e0ff; background: rgba(255,255,255,.84); border-radius: 12px; box-shadow: 0 16px 50px rgba(49,87,255,.10); backdrop-filter: blur(18px); }
    .status { padding: 12px 14px; border-radius: 10px; }
    .status strong, .link { color: #2945ff; }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 370px; gap: 16px; align-items: start; }
    .appGrid { display: grid; grid-template-columns: 250px 1fr; gap: 16px; margin-top: 16px; }
    .explain { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
    .panel { padding: 18px; }
    .step { min-height: 132px; }
    .step span { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 999px; background: #2945ff; color: #fff; font-size: 13px; font-weight: 800; }
    .step h3 { margin: 12px 0 0; font-size: 15px; }
    .step p { font-size: 13px; }
    code { display: inline-block; max-width: 100%; border: 1px solid #d9e0ff; border-radius: 7px; padding: 2px 6px; background: #f8faff; color: #2945ff; font-size: 12px; overflow-wrap: anywhere; }
    .metric { display: grid; gap: 14px; }
    .metric div { border-bottom: 1px solid #edf0ff; padding-bottom: 14px; }
    .metric div:last-child { border-bottom: 0; padding-bottom: 0; }
    .metric span, label { display: block; color: #667085; font-size: 13px; font-weight: 600; }
    .metric strong { display: block; margin-top: 4px; font-size: 28px; }
    .agentPanel { display: grid; gap: 14px; position: sticky; top: 20px; }
    .agentPanel header { display: block; margin: 0; }
    .hint { border-left: 3px solid #2945ff; padding: 10px 12px; border-radius: 8px; background: #f4f6ff; color: #475467; font-size: 13px; line-height: 1.45; overflow-wrap: anywhere; }
    .result { min-height: 170px; border: 1px solid #edf0ff; border-radius: 10px; padding: 12px; background: rgba(248,250,255,.78); overflow: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #edf0ff; font-size: 14px; vertical-align: top; overflow-wrap: anywhere; }
    th { color: #667085; font-weight: 600; }
    .pill { display: inline-flex; border: 1px solid #d9e0ff; color: #2945ff; border-radius: 999px; padding: 4px 8px; font-size: 12px; background: #f8faff; white-space: nowrap; }
    .link { font-weight: 700; text-decoration: none; }
    @media (max-width: 980px) { .layout, .appGrid, .explain { display: block; } .panel, .agentPanel, .step { margin-top: 16px; position: static; } }
    @media (max-width: 640px) { main { padding: 24px 14px; } header { display: block; } .status { margin-top: 16px; } .panel { overflow: auto; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>${escapeTemplate(options.appName)}</h1>
        <p>Your first Mobigent app: real app state plus an agent tool call.</p>
      </div>
      <div class="status">Mobigent <strong>connected</strong></div>
    </header>
    <section class="layout">
      <section>
        <div class="panel">
          <h2>Actual app state</h2>
          <p>When the agent calls the Mobigent tool, the app-owned handler adds a row here.</p>
        </div>
        <section class="appGrid">
          <aside class="panel metric">
            <div><span>Total expenses</span><strong id="count">0</strong></div>
            <div><span>Total amount</span><strong id="total">$0.00</strong></div>
            <div><span>Last update</span><strong id="updated">-</strong></div>
          </aside>
          <section class="panel">
            <table>
              <thead><tr><th>ID</th><th>Merchant</th><th>Category</th><th>Amount</th><th>Notes</th></tr></thead>
              <tbody id="rows"></tbody>
            </table>
          </section>
        </section>
      </section>
      <aside class="panel agentPanel">
        <header>
          <h2>Agent playground</h2>
          <p>Click once. This posts to the Mobigent gateway and updates the app.</p>
        </header>
        <label for="prompt">Agent request</label>
        <textarea id="prompt">Create a $42.80 meals expense at Expo Coffee with notes: Created from the Mobigent starter</textarea>
        <button id="run">Run agent request</button>
        <div class="hint">Calls <strong>\${toolName}</strong>. <a class="link" href="http://localhost:${options.httpPort}/inspect" target="_blank" rel="noreferrer">Open inspector</a>.</div>
        <div class="result"><pre id="result">Waiting for an agent request...</pre></div>
      </aside>
    </section>
    <section class="explain" aria-label="How this demo works">
      <div class="panel step">
        <span>1</span>
        <h3>Agent calls a tool</h3>
        <p>The playground posts to <code>/tools/\${toolName}/call</code>.</p>
      </div>
      <div class="panel step">
        <span>2</span>
        <h3>Gateway routes it</h3>
        <p>Mobigent sends the request to the connected app over WebSocket.</p>
      </div>
      <div class="panel step">
        <span>3</span>
        <h3>App owns the action</h3>
        <p><code>src/capabilities.ts</code> runs <code>create_expense</code> and updates state.</p>
      </div>
      <div class="panel step">
        <span>4</span>
        <h3>You edit one file</h3>
        <p>Replace the sample action with your real app function, then open the inspector.</p>
      </div>
    </section>
  </main>
  <script>
    const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
    const runButton = document.getElementById("run");
    const promptInput = document.getElementById("prompt");
    const resultOutput = document.getElementById("result");

    runButton.addEventListener("click", async () => {
      runButton.disabled = true;
      resultOutput.textContent = "Calling Mobigent gateway...";
      try {
        const response = await fetch("/agent/run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt: promptInput.value })
        });
        const body = await response.json();
        resultOutput.textContent = JSON.stringify(body, null, 2);
        await refresh();
      } finally {
        runButton.disabled = false;
      }
    });

    async function refresh() {
      const response = await fetch("/state");
      const { expenses, lastAgentRun } = await response.json();
      document.getElementById("count").textContent = expenses.length;
      document.getElementById("total").textContent = money.format(expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0));
      document.getElementById("updated").textContent = new Date().toLocaleTimeString();
      document.getElementById("rows").innerHTML = expenses.map((expense) => \\\`
        <tr>
          <td><span class="pill">\\\${escapeHtml(expense.id)}</span></td>
          <td>\\\${escapeHtml(expense.merchant)}</td>
          <td>\\\${escapeHtml(expense.category)}</td>
          <td>\\\${money.format(expense.amount)}</td>
          <td>\\\${escapeHtml(expense.notes)}</td>
        </tr>
      \\\`).join("");
      if (lastAgentRun && resultOutput.textContent === "Waiting for an agent request...") {
        resultOutput.textContent = JSON.stringify(lastAgentRun, null, 2);
      }
    }
    refresh();
    setInterval(refresh, 1000);
  </script>
</body>
</html>\`;
}
`;
}

function createCapabilitiesFile() {
  return `import { mobigent, schema } from "@mobigent/react-native";

export type Expense = {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  notes?: string;
  createdAt: string;
};

export const expenses: Expense[] = [
  {
    id: "EXP-1001",
    amount: 18.75,
    merchant: "Blue Bottle",
    category: "Meals",
    createdAt: new Date().toISOString()
  }
];

export function registerMobigentCapabilities() {
  mobigent.registerAction({
    name: "create_expense",
    description: "Create an expense in the app.",
    inputSchema: schema.object(
      {
        amount: schema.number({ description: "Expense amount." }),
        merchant: schema.string({ description: "Merchant name." }),
        category: schema.string({ description: "Expense category." }),
        notes: schema.string({ description: "Optional notes." })
      },
      { required: ["amount", "merchant", "category"] }
    ),
    confirmation: {
      required: true,
      title: "Create expense?",
      risk: "medium"
    },
    policy: {
      foregroundOnly: true,
      requiresUser: true
    },
    handler: async (input) => {
      const expense = await createExpense({
        amount: Number(input.amount),
        merchant: String(input.merchant),
        category: String(input.category),
        notes: input.notes ? String(input.notes) : undefined
      });

      mobigent.emit("expense.created", { id: expense.id, amount: expense.amount, merchant: expense.merchant });
      return expense;
    }
  });

  mobigent.registerResource({
    name: "expenses",
    description: "Read expenses from the app.",
    outputSchema: schema.object(
      {
        expenses: schema.array(schema.object())
      },
      { required: ["expenses"] }
    ),
    policy: { readOnly: true },
    read: async () => ({ expenses })
  });
}

export async function createExpense(input: {
  amount: number;
  merchant: string;
  category: string;
  notes?: string;
}) {
  const expense: Expense = {
    id: \`EXP-\${1001 + expenses.length}\`,
    amount: input.amount,
    merchant: input.merchant,
    category: input.category,
    notes: input.notes,
    createdAt: new Date().toISOString()
  };

  expenses.unshift(expense);
  return expense;
}

export function parsePrompt(prompt: string) {
  const amountMatch = prompt.match(/(?:\\$|usd\\s*)?(\\d+(?:\\.\\d{1,2})?)/i);
  const categoryMatch = prompt.match(/\\b(meals|travel|software|office|lodging|transport|shopping)\\b/i);
  const merchantMatch = prompt.match(/\\b(?:at|from|for)\\s+(.+?)(?:\\s+(?:with|as|under|category|note|notes)\\b|$)/i);
  const notesMatch = prompt.match(/\\bnotes?\\s*[:\\-]?\\s*["']?(.+?)["']?$/i);

  return {
    amount: amountMatch ? Number(amountMatch[1]) : 42.8,
    merchant: merchantMatch?.[1]?.replace(/[.,]$/, "").trim() || "Expo Coffee",
    category: categoryMatch ? titleCase(categoryMatch[1]) : "Meals",
    notes: notesMatch?.[1]?.trim() || "Created from the Mobigent starter"
  };
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
`;
}

function createDoctorFile(options: CreateMobigentAppOptions) {
  const tool = toolName(options.appId, "create_expense");
  return `const appUrl = "http://localhost:${options.appPort}";
const gatewayUrl = "http://localhost:${options.httpPort}";
const expectedTool = "${tool}";

type Check = {
  name: string;
  ok: boolean;
  message: string;
};

const checks: Check[] = [];

await check("App playground", async () => {
  const body = await getJson<{ expenses?: unknown[] }>(\`\${appUrl}/state\`);
  return Array.isArray(body.expenses)
    ? \`reachable with \${body.expenses.length} expense rows\`
    : "reachable but state shape is unexpected";
});

await check("Gateway health", async () => {
  const body = await getJson<{ status?: { tools?: number; appsWithManifests?: number } }>(\`\${gatewayUrl}/health\`);
  return \`\${body.status?.appsWithManifests ?? 0} app manifest(s), \${body.status?.tools ?? 0} tool(s)\`;
});

await check("Gateway readiness", async () => {
  const body = await getJson<{ ok?: boolean }>(\`\${gatewayUrl}/ready?minApps=1&minTools=1\`);
  if (!body.ok) {
    throw new Error("gateway is reachable but not ready for one app and one tool yet");
  }
  return "ready for agent startup";
});

await check("Expense tool", async () => {
  const body = await getJson<{ tools?: Array<{ name?: string }> }>(\`\${gatewayUrl}/tools\`);
  const names = body.tools?.map((tool) => tool.name).filter(Boolean) ?? [];
  if (!names.includes(expectedTool)) {
    throw new Error(\`expected \${expectedTool}; saw \${names.join(", ") || "no tools"}\`);
  }
  return expectedTool;
});

const passed = checks.every((item) => item.ok);
console.log(\`Mobigent starter doctor: \${passed ? "PASS" : "FAIL"}\`);
for (const item of checks) {
  console.log(\`\${item.ok ? "PASS" : "FAIL"} \${item.name}: \${item.message}\`);
}

if (!passed) {
  console.log("\\nStart the demo with npm run dev, wait for the browser page, then run npm run doctor again.");
  process.exitCode = 1;
}

async function check(name: string, run: () => Promise<string>) {
  try {
    checks.push({ name, ok: true, message: await run() });
  } catch (error) {
    checks.push({ name, ok: false, message: error instanceof Error ? error.message : String(error) });
  }
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(\`\${url} returned HTTP \${response.status}\`);
  }
  return (await response.json()) as T;
}
`;
}

function createNodeSocketFile() {
  return `import WebSocket from "ws";

export function createNodeSocket(url: string): WebSocket {
  return new WebSocket(url);
}
`;
}

function sanitizePackageName(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._/-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "mobigent-app";
}

function localPackageSpec(options: CreateMobigentAppOptions, packageDir: string) {
  const packagePath = realpathSync(resolve(options.localPackages ?? ".", "packages", packageDir));
  return `file:${packagePath.replaceAll("\\", "/")}`;
}

function releaseTarballSpec(packageFileName: string, version: string) {
  return `https://github.com/mobigent/mobigent/releases/download/v${version}/${packageFileName}-${version}.tgz`;
}

function toolName(appId: string, capability: string) {
  return `${appId.replace(/[^a-zA-Z0-9]/g, "_")}.${capability}`.toLowerCase();
}

function shellPath(path: string) {
  return path.includes(" ") ? JSON.stringify(path) : path;
}

function escapeTemplate(value: string) {
  return value.replace(/[`\\]/g, "\\$&").replace(/\${/g, "\\${");
}
