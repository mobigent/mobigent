# Provider Compatibility Matrix

This document lists every provider adapter in `@mobigent/providers`, its transport, auth model, test fixture status, and known limitations. Update this matrix when provider behavior changes.

## Legend

- **Transport**: `stdio` (local MCP server), `http` (direct HTTP gateway), `openapi` (public OpenAPI schema)
- **Dynamic tools**: Provider reloads tools when the mobile app changes capabilities at runtime
- **Public URL**: Provider requires the gateway to be reachable on the public internet
- **Fixture status**: Whether automated fixture tests exist for this provider's tool format
  - ✅ Covered — fixture test exercises the tool-conversion and result-format paths
  - ⚠️ Partial — some paths covered, integration-level coverage missing
  - ❌ Not covered — no automated fixture test yet

## MCP / Local Agent Providers

| Provider       | Transport | Dynamic Tools | Public URL | Fixture Status | Notes                                                                |
| -------------- | --------- | ------------- | ---------- | -------------- | -------------------------------------------------------------------- |
| MCP stdio      | `stdio`   | ✅            | ❌         | ⚠️ Partial     | Core transport; tool resolution/formatter coverage in provider tests |
| Claude Desktop | `stdio`   | ✅            | ❌         | ⚠️ Partial     | Wraps MCP stdio with Claude Desktop config shape                     |
| Cursor         | `stdio`   | ✅            | ❌         | ⚠️ Partial     | Wraps MCP stdio with Cursor MCP config shape                         |
| VS Code        | `stdio`   | ✅            | ❌         | ⚠️ Partial     | Wraps MCP stdio with VS Code MCP config shape                        |

## Hosted Action Providers

| Provider        | Transport | Dynamic Tools | Public URL | Fixture Status | Notes                                                             |
| --------------- | --------- | ------------- | ---------- | -------------- | ----------------------------------------------------------------- |
| OpenAPI         | `openapi` | ❌            | ✅         | ✅ Covered     | Generic OpenAPI schema; snapshot test in `openapi-schema.test.ts` |
| ChatGPT Actions | `openapi` | ❌            | ✅         | ✅ Covered     | Wraps OpenAPI provider for ChatGPT Custom GPTs                    |

## Runtime Agent Providers

### OpenAI-compatible (Chat Completions tool-calling)

| Provider              | Transport | Dynamic Tools | Public URL | Fixture Status | Notes                                      |
| --------------------- | --------- | ------------- | ---------- | -------------- | ------------------------------------------ |
| OpenAI Responses      | `http`    | ✅            | ❌         | ✅ Covered     | Tool conversion + result formatting tested |
| Azure OpenAI          | `http`    | ✅            | ❌         | ✅ Covered     | Chat function-tool shape tested            |
| OpenAI-compatible     | `http`    | ✅            | ❌         | ✅ Covered     | Generic chat function-tool shape tested    |
| OpenRouter            | `http`    | ✅            | ❌         | ✅ Covered     | Chat function-tool shape tested            |
| LiteLLM               | `http`    | ✅            | ❌         | ✅ Covered     | Chat function-tool shape tested            |
| Ollama                | `http`    | ✅            | ❌         | ✅ Covered     | Chat function-tool shape tested            |
| LM Studio             | `http`    | ✅            | ❌         | ✅ Covered     | Chat function-tool shape tested            |
| Groq                  | `http`    | ✅            | ❌         | ✅ Covered     | Chat function-tool shape tested            |
| Perplexity            | `http`    | ✅            | ❌         | ✅ Covered     | Chat function-tool shape tested            |
| xAI Grok              | `http`    | ✅            | ❌         | ✅ Covered     | Chat function-tool shape tested            |
| DeepSeek              | `http`    | ✅            | ❌         | ✅ Covered     | Chat function-tool shape tested            |
| Together AI           | `http`    | ✅            | ❌         | ✅ Covered     | Chat function-tool shape tested            |
| Fireworks AI          | `http`    | ✅            | ❌         | ✅ Covered     | Chat function-tool shape tested            |
| Qwen DashScope        | `http`    | ✅            | ❌         | ✅ Covered     | Chat function-tool shape tested            |
| NVIDIA NIM            | `http`    | ✅            | ❌         | ✅ Covered     | Chat function-tool shape tested            |
| Cloudflare AI Gateway | `http`    | ✅            | ❌         | ✅ Covered     | Chat function-tool shape tested            |

### Native Tool-Use APIs

| Provider             | Transport | Dynamic Tools | Public URL | Fixture Status | Notes                                                                 |
| -------------------- | --------- | ------------- | ---------- | -------------- | --------------------------------------------------------------------- |
| Anthropic Tool Use   | `http`    | ✅            | ❌         | ✅ Covered     | `input_schema` shape tested; result formatting tested                 |
| Google Gemini        | `http`    | ✅            | ❌         | ✅ Covered     | `functionDeclarations` shape tested; `functionResponse` result tested |
| Google Vertex AI     | `http`    | ✅            | ❌         | ✅ Covered     | Same shape as Gemini                                                  |
| AWS Bedrock Converse | `http`    | ✅            | ❌         | ✅ Covered     | `toolSpec.inputSchema.json` shape tested; `toolResult` tested         |
| Mistral              | `http`    | ✅            | ❌         | ✅ Covered     | Chat function-tool shape tested                                       |
| Cohere               | `http`    | ✅            | ❌         | ✅ Covered     | Chat function-tool shape tested                                       |

### Framework Adapters

| Provider        | Transport | Dynamic Tools | Public URL | Fixture Status | Notes                                                     |
| --------------- | --------- | ------------- | ---------- | -------------- | --------------------------------------------------------- |
| Vercel AI SDK   | `http`    | ✅            | ❌         | ⚠️ Partial     | Tool executor tested; full SDK integration not covered    |
| LangChain       | `http`    | ✅            | ❌         | ⚠️ Partial     | DynamicStructuredTool shape; integration not covered      |
| LlamaIndex      | `http`    | ✅            | ❌         | ⚠️ Partial     | FunctionTool shape; integration not covered               |
| Mastra          | `http`    | ✅            | ❌         | ⚠️ Partial     | Tool executor tested; full Mastra integration not covered |
| Semantic Kernel | `http`    | ✅            | ❌         | ⚠️ Partial     | Plugin function shape; .NET/Python runtimes not covered   |
| CrewAI          | `http`    | ✅            | ❌         | ⚠️ Partial     | Custom tool shape; Python runtime not covered             |
| AutoGen         | `http`    | ✅            | ❌         | ⚠️ Partial     | FunctionTool shape; Python runtime not covered            |
| Haystack        | `http`    | ✅            | ❌         | ⚠️ Partial     | Tool/ToolInvoker shape; Python runtime not covered        |

## Generic / Fallback

| Provider      | Transport | Dynamic Tools | Public URL | Fixture Status | Notes                                                        |
| ------------- | --------- | ------------- | ---------- | -------------- | ------------------------------------------------------------ |
| Generic Agent | `http`    | ✅            | ❌         | ✅ Covered     | Raw `MobigentToolCallResult` passthrough; tested as fallback |

## Test Coverage Summary

| Category          | Count  | Covered | Partial | Not Covered |
| ----------------- | ------ | ------- | ------- | ----------- |
| MCP / Local Agent | 4      | 0       | 4       | 0           |
| Hosted Actions    | 2      | 2       | 0       | 0           |
| OpenAI-compatible | 14     | 14      | 0       | 0           |
| Native Tool-Use   | 6      | 6       | 0       | 0           |
| Framework         | 8      | 0       | 8       | 0           |
| Generic           | 1      | 1       | 0       | 0           |
| **Total**         | **35** | **23**  | **12**  | **0**       |

All 35 advertised providers have at least partial fixture coverage. The 12 framework adapters marked "Partial" have tool-conversion and result-formatting paths tested; only full-runtime integration against the framework's actual SDK is deferred to integration/E2E environments.

## Adding a New Provider

1. Add a `ProviderKind` entry in `packages/providers/src/index.ts`.
2. Add a `create<Name>Provider()` factory function.
3. Add the provider to the `MobigentProviderRuntimeKind` union and `MobigentRuntimeToolsByKind` map.
4. Add a `to<Name>Tools()` function if the provider uses a non-standard tool shape.
5. Add fixture tests in `tests/provider-adapters.test.ts`.
6. Update this matrix.
