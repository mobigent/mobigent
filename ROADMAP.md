# Mobigent Roadmap

## Completed (0.1 Developer Preview)

- Workspace packages: `@mobigent/core`, `@mobigent/gateway`, `@mobigent/react-native`, `@mobigent/app`, `@mobigent/backend`, `@mobigent/providers`, `mobigent`, and `create-mobigent-app`.
- App-side TypeScript SDK API with low-ceremony `createApp` and `withMobigent` helpers.
- WebSocket bridge between app and gateway.
- Actions, resources, events, policies, confirmation hooks, and runtime input validation.
- React Native-compatible WebSocket transport abstraction.
- React Native provider, hooks, and optional default confirmation modal.
- SDK connection state subscriptions, reconnect, heartbeat, and disconnected event queue.
- HTTP API and OpenAPI schema for hosted agent/action testing.
- MCP stdio server for MCP-compatible clients.
- MCP tool-list-changed notifications, SSE streams.
- Provider adapters for Claude Desktop, Cursor, VS Code, OpenAPI, ChatGPT Actions, OpenAI Responses, Anthropic Tool Use, Gemini, Bedrock, Vercel AI SDK, LangChain, LlamaIndex, Mastra, and OpenAI-compatible providers.
- Native iOS Swift Package (`Mobigent`, iOS 15+, Swift 5.9+).
- Native Android Kotlin/Gradle library (`io.mobigent:mobigent-android`, API 23+, JVM 17).
- Signed capability manifests.
- Agent profiles, per-agent API keys, app id allowlists.
- Rate limiting, idempotency, audit events, metrics, Prometheus output.
- Optional app auth token and HTTP API key auth.
- Backend helper API for starting Mobigent and calling app functions.
- Simulated expense app example with native Swift and Kotlin examples.
- Automated bridge, confirmation, auth, MCP, schema validation, and tool-change tests (138 passing).
- CI workflow (Node 20/22), native CI (Swift + Android), security policy, package `files` allowlists, npm pack smoke checks, Docker gateway image.

## In Progress (0.2)

- Production gateway hardening: typed config validation, production mode, endpoint policy, inspector protection.
- Structured logging, OpenTelemetry hooks, dashboard and alert templates.
- Durable audit, idempotency, and rate-limit storage interfaces.
- CI quality gates: linting, formatting, coverage reporting, Docker smoke, security workflows.
- Expo / React Native full-loop example app with emulator CI.
- Compatibility policy and release checklist.
- Docs site IA rework and provider compatibility matrix.

## Upcoming

- Distributed gateway mode with shared session directory and tool registry.
- Real device and emulator end-to-end CI.
- Load and performance tests with published baselines.
- Maven Central publishing for Android SDK.
- Admin dashboard or CLI for sessions, agents, tools, audit search, and policy.
- Enterprise auth options (OIDC/JWT for operator APIs).
- Compliance-ready audit exports with retention and encryption.
- Cloud gateway control plane.
