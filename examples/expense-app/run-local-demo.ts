import { BridgeGateway } from "@mobigent/gateway";
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
    foregroundOnly: true,
    requiresUser: true
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

console.log("");
console.log("[agent] discovered tools");
const tools = gateway.listTools();
console.log(JSON.stringify(tools, null, 2));

console.log("");
console.log("[agent] calling create_expense");
const createResult = await gateway.callTool("com_mobigent_expenses.create_expense", {
  amount: 28.5,
  merchant: "Uber",
  category: "Travel"
});
console.log(JSON.stringify(createResult, null, 2));

console.log("");
console.log("[agent] reading expenses resource");
const readResult = await gateway.callTool("com_mobigent_expenses.get_expenses", {});
console.log(JSON.stringify(readResult, null, 2));

console.log("");
console.log("[agent] focusing expense detail component");
const focusResult = await gateway.callTool("com_mobigent_expenses.show_expense_detail", {
  expenseId: "EXP-1001"
});
console.log(JSON.stringify(focusResult, null, 2));

intentBridge.disconnect();
gateway.stop();
