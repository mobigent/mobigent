import { BridgeGateway, createHttpApp } from "@mobigent/gateway";
import { fromZod, mobigent, schema } from "@mobigent/react-native";
import { z } from "zod";
import { createNodeSocket } from "./nodeSocket.js";

type Expense = {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  note?: string;
};

const expenses: Expense[] = [
  {
    id: "EXP-1001",
    amount: 18.75,
    merchant: "Blue Bottle",
    category: "Meals"
  }
];

const gateway = new BridgeGateway(8787);
gateway.start();

const app = createHttpApp(gateway);
const server = app.listen(8788, () => {
  log("gateway", "HTTP inspector ready at http://localhost:8788/inspect");
});

mobigent.configure({
  appId: "com.mobigent.expenses",
  appName: "Mobigent Expenses",
  gatewayUrl: "ws://localhost:8787",
  createSocket: createNodeSocket,
  confirm: async ({ action, input }) => {
    log("approval", `${action.confirmation?.title ?? action.name}`);
    console.log(JSON.stringify(input, null, 2));
    return true;
  }
});

mobigent.registerResource({
  name: "expenses",
  description: "Read the current expense list.",
  outputSchema: schema.object(
    {
      expenses: schema.array(schema.object())
    },
    { required: "all" }
  ),
  policy: { readOnly: true },
  read: async () => ({ expenses })
});

mobigent.registerAction({
  name: "create_expense",
  description: "Create a new expense after user approval.",
  inputSchema: fromZod(
    z.object({
      amount: z.number(),
      merchant: z.string(),
      category: z.string(),
      note: z.string().optional()
    })
  ),
  outputSchema: schema.object(
    {
      id: schema.string(),
      amount: schema.number(),
      merchant: schema.string(),
      category: schema.string()
    },
    { required: ["id", "amount", "merchant", "category"] }
  ),
  confirmation: {
    required: true,
    title: "Create this expense?",
    risk: "medium"
  },
  policy: {
    requiresUser: true,
    foregroundOnly: true
  },
  handler: async (input) => {
    const expense = {
      id: `EXP-${1001 + expenses.length}`,
      amount: Number(input.amount),
      merchant: String(input.merchant),
      category: String(input.category),
      note: input.note ? String(input.note) : undefined
    };

    expenses.push(expense);
    mobigent.emit("expense.created", { id: expense.id, amount: expense.amount });
    return expense;
  }
});

try {
  await mobigent.connect();
  await wait(120);

  log("step 1", "Agent discovers app tools");
  await printJson(await get("http://localhost:8788/tools"));

  log("step 2", "Agent reads the current app state");
  await printJson(
    await post("http://localhost:8788/tools/com_mobigent_expenses.get_expenses/call", {})
  );

  log("step 3", "Agent asks the app to create an expense");
  await printJson(
    await post("http://localhost:8788/tools/com_mobigent_expenses.create_expense/call", {
      amount: 42.25,
      merchant: "Airport Taxi",
      category: "Travel",
      note: "Client meeting transfer"
    })
  );

  log("step 4", "Gateway snapshot shows tools, audit, metrics, and connected app state");
  const snapshot = await get("http://localhost:8788/snapshot");
  await printJson({
    apps: snapshot.apps?.length ?? 0,
    tools: snapshot.tools?.map((tool: { name: string }) => tool.name) ?? [],
    auditEvents: snapshot.audit?.length ?? 0,
    metrics: snapshot.metrics
  });

  log("done", "Open http://localhost:8788/inspect to see the same loop visually.");
} finally {
  mobigent.disconnect();
  gateway.stop();
  server.close();
}

async function get(url: string) {
  const response = await fetch(url);
  return response.json();
}

async function post(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return response.json();
}

async function printJson(value: unknown) {
  console.log(JSON.stringify(value, null, 2));
}

function log(label: string, message: string) {
  console.log(`\n[mobigent ${label}] ${message}`);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
