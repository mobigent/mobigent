import {
  createMobigentHttpClient,
  createMobigentToolExecutor,
  toBedrockToolConfigTools
} from "@mobigent/providers";

const client = createMobigentHttpClient({
  baseUrl: process.env.MOBIGENT_HTTP_URL ?? "http://localhost:8788",
  auth: process.env.MOBIGENT_HTTP_API_KEY ? "bearer" : "none",
  apiKey: process.env.MOBIGENT_HTTP_API_KEY,
  agentId: "aws-bedrock-converse",
  requestId: () => crypto.randomUUID(),
  retries: 2
});

const tools = await client.listTools();
const bedrockTools = toBedrockToolConfigTools(tools);
const executeMobigentTool = createMobigentToolExecutor(client);

console.log("Pass these entries as toolConfig.tools to Bedrock Converse:");
console.log(JSON.stringify(bedrockTools, null, 2));

console.log("When Bedrock returns a toolUse block, execute it like this:");
console.log("await executeMobigentTool(toolUse.name, toolUse.input);");

export { bedrockTools, client, executeMobigentTool };
