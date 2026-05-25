#!/usr/bin/env node
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { BridgeGateway } from "./BridgeGateway.js";

const gateway = new BridgeGateway(Number(process.env.AGENTBRIDGE_PORT ?? 8787));
gateway.start();

const rl = readline.createInterface({ input, output });

console.log("");
console.log("Commands:");
console.log("  tools");
console.log("  call <tool_name> <json_input>");
console.log("  exit");
console.log("");

for await (const line of rl) {
  const trimmed = line.trim();

  if (trimmed === "exit") {
    break;
  }

  if (trimmed === "tools") {
    console.log(JSON.stringify(gateway.listTools(), null, 2));
    continue;
  }

  if (trimmed.startsWith("call ")) {
    const [, tool, ...jsonParts] = trimmed.split(" ");
    const json = jsonParts.join(" ") || "{}";

    try {
      const result = await gateway.callTool(tool, JSON.parse(json));
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
    }
    continue;
  }

  console.log(`Unknown command: ${trimmed}`);
}

gateway.stop();
rl.close();
