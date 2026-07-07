import { mobigent } from '@mobigent/react-native';
import { createNodeSocket } from './nodeSocket.js';

type Expense = {
  id: string;
  amount: number;
  merchant: string;
  category?: string;
  notes?: string;
};

const expenses: Expense[] = [
  {
    id: 'EXP-1001',
    amount: 18.75,
    merchant: 'Blue Bottle',
    category: 'Meals',
  },
];

mobigent.configure({
  appId: 'com.mobigent.expenses',
  appName: 'Mobigent Expenses',
  gatewayUrl: process.env.MOBIGENT_GATEWAY_URL ?? 'ws://localhost:8787',
  authToken: process.env.MOBIGENT_AUTH_TOKEN,
  createSocket: createNodeSocket,
  confirm: async ({ action, input }) => {
    console.log('');
    console.log(`[confirmation] ${action.confirmation?.title ?? action.name}`);
    console.log(JSON.stringify(input, null, 2));
    console.log('[confirmation] auto-approved for PoC demo');
    console.log('');
    return true;
  },
});

mobigent.registerAction({
  name: 'create_expense',
  description: 'Create a new expense report.',
  inputSchema: {
    type: 'object',
    properties: {
      amount: { type: 'number', description: 'Expense amount.' },
      merchant: { type: 'string', description: 'Merchant or vendor name.' },
      category: { type: 'string', description: 'Expense category.' },
      notes: { type: 'string', description: 'Optional notes.' },
    },
    required: ['amount', 'merchant'],
  },
  confirmation: {
    required: true,
    title: 'Create expense?',
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
      category: input.category ? String(input.category) : undefined,
      notes: input.notes ? String(input.notes) : undefined,
    };

    expenses.push(expense);
    mobigent.emit('expense.created', expense);
    return expense;
  },
});

mobigent.registerAction({
  name: 'delete_expense',
  description: 'Delete an existing expense report by id.',
  inputSchema: {
    type: 'object',
    properties: {
      expenseId: { type: 'string', description: 'Expense id to delete.' },
    },
    required: ['expenseId'],
  },
  confirmation: {
    required: true,
    title: 'Delete expense?',
    risk: 'high',
  },
  policy: {
    foregroundOnly: true,
    requiresUser: true,
  },
  handler: async (input) => {
    const index = expenses.findIndex((expense) => expense.id === input.expenseId);
    if (index === -1) {
      throw new Error(`Expense not found: ${String(input.expenseId)}`);
    }

    const [deleted] = expenses.splice(index, 1);
    mobigent.emit('expense.deleted', { expenseId: deleted.id });
    return { deleted: true, expenseId: deleted.id };
  },
});

mobigent.registerResource({
  name: 'expenses',
  description: 'Current list of expense reports.',
  outputSchema: {
    type: 'object',
    properties: {
      expenses: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
    },
  },
  policy: {
    readOnly: true,
  },
  read: async () => ({ expenses }),
});

mobigent.registerComponent({
  name: 'expense_detail',
  description: 'Expense detail screen.',
  propsSchema: {
    type: 'object',
    properties: {
      expenseId: { type: 'string', description: 'Expense id to open.' },
    },
    required: ['expenseId'],
  },
  policy: {
    foregroundOnly: true,
  },
  focus: async (props) => {
    const expense = expenses.find((item) => item.id === props.expenseId);
    if (!expense) {
      throw new Error(`Expense not found: ${String(props.expenseId)}`);
    }

    console.log(`[component] focused expense_detail for ${expense.id}`);
    return {
      focused: true,
      screen: 'expense_detail',
      expense,
    };
  },
});

await mobigent.connect();

console.log('Expense app connected. Registered capabilities:');
console.log(JSON.stringify(mobigent.getManifest(), null, 2));
