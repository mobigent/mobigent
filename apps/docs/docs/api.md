---
sidebar_position: 9
---

# API Packages

## `@mobigent/core`

Shared protocol types, manifest types, tool descriptors, name sanitization, and JSON schema validation. `hello` and manifests carry `protocolVersion` so SDK package versions can move independently from gateway wire compatibility. `validateCapabilityManifest()` validates custom SDK manifests before the gateway accepts them, including duplicate tool-name checks.

## `@mobigent/react-native`

App-side SDK for registering actions, resources, focusable components, events, confirmations, and connection state. The React API includes capability definition helpers, lifecycle hooks, schema builders, and the `@mobigent/react-native/ui` app shell for mounting a provider, capability kit, and confirmation modal together.

## `@mobigent/gateway`

Gateway server, HTTP/OpenAPI server, and MCP stdio server.

Notable runtime controls:

- `authToken` rejects app sessions without the shared token.
- `requestTimeoutMs` sets the default app response timeout.
- `auditLogLimit` controls the in-memory audit log size.
- `callTool(name, input, { agentId, idempotencyKey, requestId, timeoutMs })` enforces provider identity and records call correlation metadata.
- `listAgentVisibility(agentIds?)` explains which tools each agent can see after app policies and gateway agent profiles are applied.
- `onAudit(listener)` streams structured gateway audit events.
- `getAuditLog(limit)` reads recent audit events.
- `getMetrics()` returns lifetime operational counters and current gateway status.

## `@mobigent/providers`

Provider configuration helpers for MCP, Claude Desktop, Cursor, VS Code, OpenAPI, ChatGPT Actions, OpenAI Responses, OpenRouter, LiteLLM, Ollama, LM Studio, Groq, xAI Grok, DeepSeek, Together AI, Fireworks AI, Mistral, Cohere, Anthropic Tool Use, Google Gemini, AWS Bedrock Converse, Vercel AI SDK, LangChain, LlamaIndex, Mastra, Semantic Kernel, CrewAI, AutoGen, Haystack, and generic agents.

Includes the `mobigent-provider` CLI for generating provider setup JSON and Markdown guides. The HTTP client includes `getReadiness()` and `waitForReadiness()` for deployment or agent startup probes, `listAgentVisibility()` for policy debugging, `getTool(name)` for lazy descriptor lookup, and `waitForTools()` for flows that should wait until mobile app capabilities are connected. `createMobigentProviderRuntime()` combines startup waiting, provider-native tool mapping, provider-specific TypeScript inference, and execution helpers for server-side agent loops. `watchMobigentProviderRuntime()` maps live gateway tool-stream updates into provider-native runtime snapshots.
