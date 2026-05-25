import {
  createMobigentHttpClient,
  createMobigentToolExecutor,
  toGeminiFunctionDeclarations
} from "@mobigent/providers";

const client = createMobigentHttpClient({
  baseUrl: process.env.MOBIGENT_HTTP_URL ?? "http://localhost:8788",
  auth: process.env.MOBIGENT_HTTP_API_KEY ? "bearer" : "none",
  apiKey: process.env.MOBIGENT_HTTP_API_KEY,
  agentId: "google-gemini",
  requestId: () => crypto.randomUUID(),
  retries: 2
});

const tools = await client.listTools();
const functionDeclarations = toGeminiFunctionDeclarations(tools);
const executeMobigentTool = createMobigentToolExecutor(client);

console.log("Pass these function declarations to Gemini:");
console.log(JSON.stringify([{ functionDeclarations }], null, 2));

console.log("When Gemini returns a functionCall, execute it like this:");
console.log("await executeMobigentTool(functionCall.name, functionCall.args);");

export { client, executeMobigentTool, functionDeclarations };
