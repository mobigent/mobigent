#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BridgeGateway } from './BridgeGateway.js';
import { createMcpServer } from './mcp.js';
import { loadGatewayConfig } from './config.js';

const config = loadGatewayConfig();

const gateway = new BridgeGateway({
  port: config.wsPort,
  authToken: config.authToken,
  manifestSigningSecret: config.manifestSigningSecret,
  allowedAppIds: config.allowedAppIds,
  agentProfiles: config.agentProfiles,
});
gateway.start();

const server = createMcpServer(gateway);
const transport = new StdioServerTransport();

process.on('SIGINT', () => {
  void server.close().finally(() => gateway.stop());
});

process.on('SIGTERM', () => {
  void server.close().finally(() => gateway.stop());
});

await server.connect(transport);
