import { spawn } from 'node:child_process';
import express from 'express';
import { BridgeGateway, createHttpApp } from '@mobigent/gateway';
import { mobigent, schema } from '@mobigent/react-native';
import { createNodeSocket } from './nodeSocket.js';

type Expense = {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  notes?: string;
  createdAt: string;
};

type AgentRun = {
  prompt: string;
  tool: string;
  input: {
    amount: number;
    merchant: string;
    category: string;
    notes?: string;
  };
  response?: unknown;
  error?: string;
  createdAt: string;
};

const expenses: Expense[] = [
  {
    id: 'EXP-1001',
    amount: 18.75,
    merchant: 'Blue Bottle',
    category: 'Meals',
    createdAt: new Date().toISOString(),
  },
];

let lastAgentRun: AgentRun | undefined;

const gateway = new BridgeGateway(8787);
gateway.start();

const gatewayApp = createHttpApp(gateway);
const gatewayServer = gatewayApp.listen(8788, () => {
  console.log('Mobigent gateway inspector: http://localhost:8788/inspect');
});

const app = express();
app.use(express.json());
app.get('/favicon.ico', (_req, res) => res.status(204).end());
app.get('/', (_req, res) => res.type('html').send(renderExpenseApp()));
app.get('/state', (_req, res) => res.json({ expenses, lastAgentRun }));

app.post('/agent/run', async (req, res) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt : '';
  const input = parseExpensePrompt(prompt);
  const run: AgentRun = {
    prompt,
    tool: 'com_mobigent_visible_expenses.create_expense',
    input,
    createdAt: new Date().toISOString(),
  };

  try {
    const response = await fetch(`http://localhost:8788/tools/${run.tool}/call`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(body));
    }

    run.response = body;
    lastAgentRun = run;
    res.json(run);
  } catch (error) {
    run.error = error instanceof Error ? error.message : String(error);
    lastAgentRun = run;
    res.status(500).json(run);
  }
});

const appServer = app.listen(8790, () => {
  console.log('Visible Expense app: http://localhost:8790');
  console.log('Agent playground is built into the same page. No curl needed.');
  openDemoPage('http://localhost:8790');
});

mobigent.configure({
  appId: 'com.mobigent.visible.expenses',
  appName: 'Visible Expense App',
  gatewayUrl: 'ws://localhost:8787',
  createSocket: createNodeSocket,
  confirm: async ({ action, input }) => {
    console.log(`\n[app approval] ${action.confirmation?.title ?? action.name}`);
    console.log(JSON.stringify(input, null, 2));
    console.log('[app approval] approved by visible demo host\n');
    return true;
  },
});

mobigent.registerAction({
  name: 'create_expense',
  description: 'Create an expense in the visible app UI.',
  inputSchema: schema.object(
    {
      amount: schema.number({ description: 'Expense amount.' }),
      merchant: schema.string({ description: 'Merchant name.' }),
      category: schema.string({ description: 'Expense category.' }),
      notes: schema.string({ description: 'Optional notes.' }),
    },
    { required: ['amount', 'merchant', 'category'] },
  ),
  outputSchema: schema.object(
    {
      id: schema.string(),
      amount: schema.number(),
      merchant: schema.string(),
      category: schema.string(),
      createdAt: schema.string(),
    },
    { required: ['id', 'amount', 'merchant', 'category', 'createdAt'] },
  ),
  confirmation: {
    required: true,
    title: 'Create expense in app?',
    risk: 'medium',
  },
  policy: {
    foregroundOnly: true,
    requiresUser: true,
  },
  handler: async (input) => {
    const expense: Expense = {
      id: `EXP-${1001 + expenses.length}`,
      amount: Number(input.amount),
      merchant: String(input.merchant),
      category: String(input.category),
      notes: input.notes ? String(input.notes) : undefined,
      createdAt: new Date().toISOString(),
    };

    expenses.unshift(expense);
    mobigent.emit('expense.created', {
      id: expense.id,
      amount: expense.amount,
      merchant: expense.merchant,
    });
    return expense;
  },
});

mobigent.registerResource({
  name: 'expenses',
  description: 'Read expenses from the visible app UI.',
  outputSchema: schema.object(
    {
      expenses: schema.array(schema.object()),
    },
    { required: ['expenses'] },
  ),
  policy: { readOnly: true },
  read: async () => ({ expenses }),
});

await mobigent.connect();

const shutdown = () => {
  mobigent.disconnect();
  gateway.stop();
  gatewayServer.close();
  appServer.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function parseExpensePrompt(prompt: string): AgentRun['input'] {
  const fallback = {
    amount: 42.8,
    merchant: 'Expo Coffee',
    category: 'Meals',
    notes: 'Created from the built-in agent playground',
  };

  const amountMatch = prompt.match(/(?:\$|usd\s*)?(\d+(?:\.\d{1,2})?)/i);
  const amount = amountMatch ? Number(amountMatch[1]) : fallback.amount;

  const categoryMatch = prompt.match(
    /\b(meals|travel|software|office|lodging|transport|shopping)\b/i,
  );
  const category = categoryMatch ? titleCase(categoryMatch[1]) : fallback.category;

  const merchantMatch = prompt.match(
    /\b(?:at|from|for)\s+(.+?)(?:\s+(?:with|as|under|category|note|notes)\b|$)/i,
  );
  const merchant = merchantMatch?.[1]?.replace(/[.,]$/, '').trim() || fallback.merchant;

  const notesMatch = prompt.match(/\bnotes?\s*[:\-]?\s*["']?(.+?)["']?$/i);

  return {
    amount,
    merchant,
    category,
    notes: notesMatch?.[1]?.trim() || fallback.notes,
  };
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function openDemoPage(url: string) {
  if (process.env.MOBIGENT_DEMO_OPEN === '0') {
    return;
  }

  const command =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];

  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
  });
  child.on('error', () => undefined);
  child.unref();
}

function renderExpenseApp() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Visible Expense App</title>
  <style>
    :root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #101828; background: #f6f8ff; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background:
      radial-gradient(circle at 12% 8%, rgba(49,87,255,.16), transparent 34%),
      radial-gradient(circle at 88% 18%, rgba(49,87,255,.10), transparent 28%),
      #f8faff; }
    main { max-width: 1180px; margin: 0 auto; padding: 34px 20px 40px; }
    header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
    h1 { margin: 0; font-size: clamp(34px, 6vw, 62px); line-height: .96; letter-spacing: 0; }
    h2 { margin: 0; font-size: 18px; }
    p { color: #667085; margin: 8px 0 0; line-height: 1.55; }
    button { border: 0; border-radius: 10px; background: #2945ff; color: #fff; min-height: 44px; padding: 0 16px; font-weight: 700; cursor: pointer; box-shadow: 0 14px 34px rgba(41,69,255,.24); }
    button:disabled { opacity: .55; cursor: wait; }
    textarea { width: 100%; min-height: 112px; resize: vertical; border: 1px solid #d9e0ff; border-radius: 10px; padding: 12px; font: inherit; color: #101828; background: rgba(255,255,255,.92); outline-color: #2945ff; overflow-wrap: anywhere; }
    pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 12px; line-height: 1.55; color: #344054; }
    .status { border: 1px solid #d9e0ff; background: rgba(255,255,255,.9); border-radius: 10px; padding: 12px 14px; box-shadow: 0 16px 50px rgba(49, 87, 255, .10); backdrop-filter: blur(18px); }
    .status strong { color: #2945ff; }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 370px; gap: 16px; align-items: start; }
    .appGrid { display: grid; grid-template-columns: 250px 1fr; gap: 16px; margin-top: 16px; }
    .explain { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
    .panel { border: 1px solid #d9e0ff; background: rgba(255,255,255,.84); border-radius: 12px; padding: 18px; box-shadow: 0 16px 50px rgba(49, 87, 255, .10); backdrop-filter: blur(18px); }
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
    .link { color: #2945ff; font-weight: 700; text-decoration: none; }
    @media (max-width: 980px) { .layout, .appGrid, .explain { display: block; } .panel, .agentPanel, .step { margin-top: 16px; position: static; } }
    @media (max-width: 640px) { main { padding: 24px 14px; } header { display: block; } .status { margin-top: 16px; } .panel { overflow: auto; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Expense App</h1>
        <p>One command starts the app, gateway, inspector, and agent playground.</p>
      </div>
      <div class="status">Mobigent <strong>connected</strong></div>
    </header>
    <section class="layout">
      <section>
        <div class="panel">
          <h2>Actual app state</h2>
          <p>When the agent calls the Mobigent tool, the row appears here because the app handler ran.</p>
        </div>
        <section class="appGrid">
          <aside class="panel metric">
            <div><span>Total expenses</span><strong id="count">0</strong></div>
            <div><span>Total amount</span><strong id="total">$0.00</strong></div>
            <div><span>Last update</span><strong id="updated">-</strong></div>
          </aside>
          <section class="panel">
            <table>
              <thead>
                <tr><th>ID</th><th>Merchant</th><th>Category</th><th>Amount</th><th>Notes</th></tr>
              </thead>
              <tbody id="rows"></tbody>
            </table>
          </section>
        </section>
      </section>
      <aside class="panel agentPanel">
        <header>
          <h2>Agent playground</h2>
          <p>Click once. This posts to the gateway tool endpoint and updates the app.</p>
        </header>
        <label for="prompt">Agent request</label>
        <textarea id="prompt">Create a $42.80 meals expense at Expo Coffee with notes: Created from the built-in agent playground</textarea>
        <button id="run">Run agent request</button>
        <div class="hint">
          Calls <strong>com_mobigent_visible_expenses.create_expense</strong> through the same HTTP gateway an agent would use.
          <a class="link" href="http://localhost:8788/inspect" target="_blank" rel="noreferrer">Open inspector</a>.
        </div>
        <div class="result"><pre id="result">Waiting for an agent request...</pre></div>
      </aside>
    </section>
    <section class="explain" aria-label="How this demo works">
      <div class="panel step">
        <span>1</span>
        <h3>Agent calls a tool</h3>
        <p>The playground posts to <code>/tools/com_mobigent_visible_expenses.create_expense/call</code>.</p>
      </div>
      <div class="panel step">
        <span>2</span>
        <h3>Gateway routes it</h3>
        <p>Mobigent sends the request to the connected app over WebSocket.</p>
      </div>
      <div class="panel step">
        <span>3</span>
        <h3>App owns the action</h3>
        <p><code>run-visible-app-demo.ts</code> runs <code>create_expense</code> and updates state.</p>
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
    const runButton = document.getElementById("run");
    const promptInput = document.getElementById("prompt");
    const resultOutput = document.getElementById("result");
    const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);

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
      } catch (error) {
        resultOutput.textContent = error instanceof Error ? error.message : String(error);
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
      document.getElementById("rows").innerHTML = expenses.map((expense) => \`
        <tr>
          <td><span class="pill">\${escapeHtml(expense.id)}</span></td>
          <td>\${escapeHtml(expense.merchant)}</td>
          <td>\${escapeHtml(expense.category)}</td>
          <td>\${money.format(expense.amount)}</td>
          <td>\${escapeHtml(expense.notes)}</td>
        </tr>
      \`).join("");
      if (lastAgentRun && resultOutput.textContent === "Waiting for an agent request...") {
        resultOutput.textContent = JSON.stringify(lastAgentRun, null, 2);
      }
    }
    refresh();
    setInterval(refresh, 1000);
  </script>
</body>
</html>`;
}
