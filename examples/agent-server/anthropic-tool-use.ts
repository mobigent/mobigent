import {
  createMobigentHttpClient,
  createMobigentToolExecutor,
  toAnthropicTools
} from "@mobigent/providers";

const client = createMobigentHttpClient({
  baseUrl: process.env.MOBIGENT_HTTP_URL ?? "http://localhost:8788",
  auth: process.env.MOBIGENT_HTTP_API_KEY ? "bearer" : "none",
  apiKey: process.env.MOBIGENT_HTTP_API_KEY,
  agentId: "anthropic-tool-use",
  requestId: () => crypto.randomUUID(),
  retries: 2
});

const tools = await client.listTools();
const anthropicTools = toAnthropicTools(tools);
const executeMobigentTool = createMobigentToolExecutor(client);

console.log("Pass these tools to Anthropic tool use:");
console.log(JSON.stringify(anthropicTools, null, 2));

console.log("When Claude returns a tool_use block, execute it like this:");
console.log("await executeMobigentTool(toolUse.name, toolUse.input);");

export { anthropicTools, client, executeMobigentTool };
