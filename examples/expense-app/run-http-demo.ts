import { BridgeGateway, createHttpApp } from "@mobigent/gateway";
import { intentBridge } from "@mobigent/react-native";
import { createNodeSocket } from "./nodeSocket.js";

type Expense = {
  id: string;
  amount: number;
  merchant: string;
  category?: string;
};

const gateway = new BridgeGateway(8787);
gateway.start();

const app = createHttpApp(gateway);
const server = app.listen(8788, () => {
  console.log("Mobigent HTTP API listening on http://localhost:8788");
});

const expenses: Expense[] = [
  {
    id: "EXP-1001",
    amount: 18.75,
    merchant: "Blue Bottle",
    category: "Meals"
  }
];

intentBridge.configure({
  appId: "com.mobigent.expenses",
  appName: "Mobigent Expenses",
  gatewayUrl: "ws://localhost:8787",
  createSocket: createNodeSocket,
  confirm: async ({ action, input }) => {
    console.log(`[app confirmation] ${action.confirmation?.title ?? action.name}`);
    console.log(JSON.stringify(input, null, 2));
    return true;
  }
});

intentBridge.registerAction({
  name: "create_expense",
  description: "Create a new expense report.",
  inputSchema: {
    type: "object",
    properties: {
      amount: { type: "number" },
      merchant: { type: "string" },
      category: { type: "string" }
    },
    required: ["amount", "merchant"]
  },
  confirmation: {
    required: true,
    title: "Create expense?",
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
      category: input.category ? String(input.category) : undefined
    };

    expenses.push(expense);
    return expense;
  }
});

intentBridge.registerResource({
  name: "expenses",
  description: "Current list of expense reports.",
  policy: {
    readOnly: true
  },
  read: async () => ({ expenses })
});

intentBridge.registerComponent({
  name: "expense_detail",
  description: "Expense detail screen.",
  propsSchema: {
    type: "object",
    properties: {
      expenseId: { type: "string" }
    },
    required: ["expenseId"]
  },
  policy: {
    foregroundOnly: true
  },
  focus: async (props) => {
    const expense = expenses.find((item) => item.id === props.expenseId);
    if (!expense) {
      throw new Error(`Expense not found: ${String(props.expenseId)}`);
    }

    return {
      focused: true,
      screen: "expense_detail",
      expense
    };
  }
});

await intentBridge.connect();
await new Promise((resolve) => setTimeout(resolve, 100));

const listResponse = await fetch("http://localhost:8788/tools");
console.log("[http] tools");
console.log(JSON.stringify(await listResponse.json(), null, 2));

const callResponse = await fetch(
  "http://localhost:8788/tools/com_mobigent_expenses.create_expense/call",
  {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      amount: 42.25,
      merchant: "Airport Taxi",
      category: "Travel"
    })
  }
);
console.log("[http] create_expense");
console.log(JSON.stringify(await callResponse.json(), null, 2));

const focusResponse = await fetch(
  "http://localhost:8788/tools/com_mobigent_expenses.show_expense_detail/call",
  {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      expenseId: "EXP-1001"
    })
  }
);
console.log("[http] show_expense_detail");
console.log(JSON.stringify(await focusResponse.json(), null, 2));

intentBridge.disconnect();
gateway.stop();
server.close();
