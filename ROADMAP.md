# Mobigent Roadmap

## Completed In 0.1 Developer Preview

- Workspace packages: `@mobigent/core`, `@mobigent/gateway`, and `@mobigent/react-native`.
- App-side TypeScript SDK API.
- WebSocket bridge between app and gateway.
- Actions, resources, events, policies, confirmation hooks, and runtime input validation.
- React Native-compatible WebSocket transport abstraction.
- React Native provider, hooks, and optional default confirmation modal.
- SDK connection state subscriptions and reconnect options.
- HTTP API and OpenAPI schema for hosted agent/action testing.
- MCP stdio server for MCP-compatible clients.
- MCP tool-list-changed notifications when app capabilities change.
- Provider helpers for Claude Desktop, Cursor, VS Code, OpenAPI, ChatGPT Actions, OpenAI Responses, Anthropic Tool Use, LangChain, LlamaIndex, Mastra, and generic agents.
- Optional app auth token for gateway sessions.
- Simulated React Native expense app.
- Automated bridge, confirmation, auth, MCP, schema validation, and tool-change tests.
- CI workflow, security policy, package `files` allowlists, and npm pack smoke checks.

## Next: 0.2

- Expo example app with an actual mobile screen.
- Streamable HTTP MCP transport.
- Persistent audit log storage.
- Signed capability manifests.
- Copy-paste runtime adapters for OpenAI, Anthropic, LangChain, LlamaIndex, and Mastra.

## Later

- Native iOS and Android adapters.
- Cloud gateway option.
- Developer dashboard.
- Integration test suite against real emulators/devices.
