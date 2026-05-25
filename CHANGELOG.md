# Changelog

All notable changes to Mobigent will be documented in this file.

The format follows Keep a Changelog, and this project uses semantic versioning once published.

## 0.1.0 - Unreleased

### Added

- `@mobigent/core` package with shared protocol types and JSON schema validation.
- `@mobigent/react-native` SDK with actions, resources, events, confirmation controller, provider, hooks, default UI modal, connection state, and reconnect options.
- `@mobigent/gateway` package with WebSocket app bridge, terminal gateway, HTTP/OpenAPI gateway, and MCP stdio server.
- ChatGPT Actions testing path through OpenAPI.
- MCP tool discovery and tool calling with list-change notifications.
- Optional app auth token for gateway sessions.
- Example expense app.
- Automated tests, CI, package dry-run checks, security policy, and docs.
- Tag-driven npm release workflow for the public SDK packages with provenance.
- Gateway-owned agent profiles for per-provider tool allowlists, denylists, read-only mode, and maximum risk levels.
- Per-agent HTTP API keys that bind authenticated requests to trusted provider ids.
- Structured HTTP gateway errors with stable `code`, `error`, and `retryable` fields, plus provider-client mapping for retry and recovery logic.
- Provider bootstrap snapshots through `GET /snapshot` and `client.getSnapshot()`.
- Agent-scoped OpenAPI schema generation using `x-mobigent-agent` or `?agentId=` so hosted OpenAPI providers import only visible tools.
- Provider bundles through `createProviderBundle()` and `mobigent-provider --format bundle`, including runtime agent identity and secured HTTP API-key placeholders.
- LiteLLM provider support using the shared OpenAI-compatible chat function runtime.
- Ollama provider support for local/self-hosted model tool calling.
- LM Studio provider support for local OpenAI-compatible tool calling.
- xAI Grok provider support through the shared OpenAI-compatible chat function runtime.
- DeepSeek provider support through the shared OpenAI-compatible chat function runtime.
- Together AI provider support through the shared OpenAI-compatible chat function runtime.
- Fireworks AI provider support through the shared OpenAI-compatible chat function runtime.
