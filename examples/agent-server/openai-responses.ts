import {
  createMobigentHttpClient,
  createMobigentToolExecutor,
  toOpenAiTools,
} from '@mobigent/providers';

const client = createMobigentHttpClient({
  baseUrl: process.env.MOBIGENT_HTTP_URL ?? 'http://localhost:8788',
  auth: process.env.MOBIGENT_HTTP_API_KEY ? 'bearer' : 'none',
  apiKey: process.env.MOBIGENT_HTTP_API_KEY,
  agentId: 'openai-responses',
  requestId: () => crypto.randomUUID(),
  retries: 2,
});

const tools = await client.listTools();
const openAiTools = toOpenAiTools(tools);
const executeMobigentTool = createMobigentToolExecutor(client);

console.log('Pass these tools to the OpenAI Responses API:');
console.log(JSON.stringify(openAiTools, null, 2));

console.log('When OpenAI returns a function call, execute it like this:');
console.log('await executeMobigentTool(functionCall.name, JSON.parse(functionCall.arguments));');

export { client, executeMobigentTool, openAiTools };
