import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
  type Tool
} from "@modelcontextprotocol/sdk/types.js";
import type { JsonObject, ToolDescriptor } from "@mobigent/core";
import { BridgeGateway } from "./BridgeGateway.js";

export type MobigentMcpOptions = {
  name?: string;
  version?: string;
};

export function createMcpServer(
  gateway: BridgeGateway,
  options: MobigentMcpOptions = {}
) {
  const server = new Server(
    {
      name: options.name ?? "mobigent",
      version: options.version ?? "0.1.7"
    },
    {
      capabilities: {
        tools: {
          listChanged: true
        }
      },
      instructions:
        "Mobigent exposes typed, user-approved mobile app capabilities as MCP tools. Sensitive actions may require confirmation inside the mobile app."
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: gateway.listTools().map(toMcpTool)
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    try {
      const result = await gateway.callTool(
        request.params.name,
        (request.params.arguments ?? {}) as JsonObject
      );

      return {
        content: [
          {
            type: "text",
            text: formatToolResult(result)
          }
        ],
        structuredContent:
          isJsonObject(result) ? result : { result }
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : String(error)
          }
        ]
      };
    }
  });

  gateway.onToolsChanged(() => {
    void server.sendToolListChanged().catch(() => {
      // The MCP client may not be initialized yet; the next tools/list call will still be fresh.
    });
  });

  return server;
}

function toMcpTool(tool: ToolDescriptor): Tool {
  const destructive = !tool.readOnly && tool.risk === "high";

  return {
    name: tool.name,
    description: tool.description,
    inputSchema: {
      type: "object",
      properties: tool.inputSchema.properties,
      required: tool.inputSchema.required
    },
    annotations: {
      readOnlyHint: tool.readOnly,
      destructiveHint: destructive,
      openWorldHint: true,
      title: tool.description
    },
    _meta: {
      "mobigent/appId": tool.app.id,
      "mobigent/appName": tool.app.name,
      "mobigent/risk": tool.risk
    }
  };
}

function formatToolResult(result: unknown) {
  if (typeof result === "string") {
    return result;
  }

  return JSON.stringify(result, null, 2);
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
