import { createMobigentHttpClient, toVercelAiSdkTools } from '@mobigent/providers';

const client = createMobigentHttpClient({
  baseUrl: process.env.MOBIGENT_HTTP_URL ?? 'http://localhost:8788',
  auth: process.env.MOBIGENT_HTTP_API_KEY ? 'bearer' : 'none',
  apiKey: process.env.MOBIGENT_HTTP_API_KEY,
  agentId: 'vercel-ai-sdk',
  requestId: () => crypto.randomUUID(),
  retries: 2,
});

const tools = await client.listTools();
const vercelTools = toVercelAiSdkTools(tools, client);

console.log('Pass this tools object to generateText or streamText:');
console.log(Object.keys(vercelTools));

export { client, vercelTools };
