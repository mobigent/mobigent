import {
  createMobigentHttpClient,
  toAnthropicTools,
  toBedrockToolConfigTools,
  toChatFunctionTools,
  toGeminiFunctionDeclarations,
  toOpenAiTools,
  toVercelAiSdkTools,
} from '@mobigent/providers';

const mockTools = [
  {
    name: 'com_acme_expenses.create_expense',
    description: 'Create an expense in the mobile app.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['amount', 'merchant'],
      properties: {
        amount: { type: 'number' },
        merchant: { type: 'string' },
        category: { type: 'string' },
      },
    },
    outputSchema: {
      type: 'object',
      required: ['id', 'status'],
      properties: {
        id: { type: 'string' },
        status: { type: 'string', enum: ['created'] },
      },
    },
    risk: 'high',
    app: {
      id: 'com.acme.expenses',
      name: 'Acme Expenses',
    },
  },
];

const mockFetch: typeof fetch = async (url, init) => {
  const path = String(url);

  if (path.endsWith('/tools')) {
    return jsonResponse({ tools: mockTools });
  }

  if (path.endsWith('/tools/com_acme_expenses.create_expense/call')) {
    const input = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
    return jsonResponse({
      result: {
        id: 'exp_demo_123',
        status: 'created',
        input,
      },
    });
  }

  return jsonResponse({ error: 'not found' }, 404);
};

const client = createMobigentHttpClient({
  baseUrl: 'http://localhost:8788',
  agentId: 'example-agent',
  requestId: 'demo-request',
  fetch: mockFetch,
});

const tools = await client.listTools();

console.log('OpenAI tools');
console.log(JSON.stringify(toOpenAiTools(tools), null, 2));

console.log('Chat function tools');
console.log(JSON.stringify(toChatFunctionTools(tools), null, 2));

console.log('Anthropic tools');
console.log(JSON.stringify(toAnthropicTools(tools), null, 2));

console.log('Gemini function declarations');
console.log(JSON.stringify(toGeminiFunctionDeclarations(tools), null, 2));

console.log('Bedrock Converse tools');
console.log(JSON.stringify(toBedrockToolConfigTools(tools), null, 2));

const vercelTools = toVercelAiSdkTools(tools, client);
const result = await vercelTools['com_acme_expenses.create_expense'].execute({
  amount: 42.5,
  merchant: 'Cafe Demo',
  category: 'meals',
});

console.log('Executed through Mobigent');
console.log(JSON.stringify(result, null, 2));

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}
