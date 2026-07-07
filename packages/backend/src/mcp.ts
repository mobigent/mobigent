#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BridgeGateway, createMcpServer } from '@mobigent/gateway';

const bridgePort = Number(process.env.MOBIGENT_WS_PORT ?? 8787);
const authToken = process.env.MOBIGENT_AUTH_TOKEN;

const gateway = new BridgeGateway({ port: bridgePort, authToken });
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
