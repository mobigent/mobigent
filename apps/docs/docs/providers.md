---
sidebar_position: 5
---

# Providers

`@mobigent/providers` generates setup metadata for different agent platforms.

```ts
import {
  createClaudeDesktopProvider,
  createCursorProvider,
  createVsCodeProvider,
  createChatGptActionsProvider,
  createDeepSeekProvider,
  createTogetherAiProvider,
  createFireworksAiProvider,
  createQwenDashScopeProvider,
  createNvidiaNimProvider,
  createCloudflareAiGatewayProvider,
  createOpenAiResponsesProvider,
  createOpenRouterProvider,
  createLiteLlmProvider,
  createOllamaProvider,
  createLmStudioProvider,
  createGroqProvider,
  createPerplexityProvider,
  createXaiGrokProvider,
  createMistralProvider,
  createCohereProvider,
  createAnthropicToolUseProvider,
  createGoogleGeminiProvider,
  createGoogleVertexAiProvider,
  createAwsBedrockConverseProvider,
  createVercelAiSdkProvider,
  createLangChainProvider,
  createLlamaIndexProvider,
  createMastraProvider,
  createSemanticKernelProvider,
  createCrewAiProvider,
  createAutoGenProvider,
  createHaystackProvider
} from "@mobigent/providers";

createClaudeDesktopProvider({
  command: "mobigent-mcp",
  env: { MOBIGENT_AUTH_TOKEN: "dev-secret" }
});

createCursorProvider({ command: "mobigent-mcp" });
createVsCodeProvider({ command: "mobigent-mcp" });

createChatGptActionsProvider({
  baseUrl: "https://example.ngrok.app",
  auth: "bearer"
});

createOpenAiResponsesProvider({
  baseUrl: "http://localhost:8788",
  agentId: "openai-prod"
});

createOpenRouterProvider({ baseUrl: "http://localhost:8788" });
createLiteLlmProvider({ baseUrl: "http://localhost:8788" });
createOllamaProvider({ baseUrl: "http://localhost:8788" });
createLmStudioProvider({ baseUrl: "http://localhost:8788" });
createGroqProvider({ baseUrl: "http://localhost:8788" });
createPerplexityProvider({ baseUrl: "http://localhost:8788" });
createXaiGrokProvider({ baseUrl: "http://localhost:8788" });
createDeepSeekProvider({ baseUrl: "http://localhost:8788" });
createTogetherAiProvider({ baseUrl: "http://localhost:8788" });
createFireworksAiProvider({ baseUrl: "http://localhost:8788" });
createQwenDashScopeProvider({ baseUrl: "http://localhost:8788" });
createNvidiaNimProvider({ baseUrl: "http://localhost:8788" });
createCloudflareAiGatewayProvider({ baseUrl: "http://localhost:8788" });
createMistralProvider({ baseUrl: "http://localhost:8788" });
createCohereProvider({ baseUrl: "http://localhost:8788" });

createAnthropicToolUseProvider({
  baseUrl: "http://localhost:8788",
  auth: "api-key"
});

createGoogleGeminiProvider({ baseUrl: "http://localhost:8788" });
createGoogleVertexAiProvider({ baseUrl: "http://localhost:8788" });
createAwsBedrockConverseProvider({ baseUrl: "http://localhost:8788" });
createVercelAiSdkProvider({ baseUrl: "http://localhost:8788" });
createLangChainProvider({ baseUrl: "http://localhost:8788" });
createLlamaIndexProvider({ baseUrl: "http://localhost:8788" });
createMastraProvider({ baseUrl: "http://localhost:8788" });
createSemanticKernelProvider({ baseUrl: "http://localhost:8788" });
createCrewAiProvider({ baseUrl: "http://localhost:8788" });
createAutoGenProvider({ baseUrl: "http://localhost:8788" });
createHaystackProvider({ baseUrl: "http://localhost:8788" });
```

## CLI

Generate provider config without writing code:

```bash
npx mobigent-provider --list
npx mobigent-provider --matrix --base-url http://localhost:8788
npx mobigent-provider --compatibility --base-url http://localhost:8788
npx mobigent-provider --write-matrix ./mobigent-providers.json --base-url http://localhost:8788
npx mobigent-provider --write-compatibility ./mobigent-provider-compatibility.json --base-url http://localhost:8788
npx mobigent-provider --setup-plan runtime-agent --base-url http://localhost:8788 --query openrouter --limit 1
npx mobigent-provider --write-setup-plan ./mobigent-provider-setup.json --base-url http://localhost:8788 --query anthropic
npx mobigent-provider --validate-setup-plan ./mobigent-provider-setup.json
npx mobigent-provider --recommend-presets
npx mobigent-provider --recommend local-agent
npx mobigent-provider --recommend hosted-actions --base-url https://example.ngrok.app
npx mobigent-provider --recommend runtime-agent --base-url http://localhost:8788 --query openrouter --limit 1
npx mobigent-provider --provider claude-desktop --command mobigent-mcp
npx mobigent-provider --provider cursor --command npx --arg mobigent-mcp
npx mobigent-provider --provider vscode --command mobigent-mcp
npx mobigent-provider --provider chatgpt-actions --base-url https://example.ngrok.app
npx mobigent-provider --provider openai-responses --base-url http://localhost:8788
npx mobigent-provider --provider openrouter --base-url http://localhost:8788 --validate
npx mobigent-provider --provider azure-openai --base-url http://localhost:8788
npx mobigent-provider --provider openai-compatible --base-url http://localhost:8788
npx mobigent-provider --provider openrouter --base-url http://localhost:8788
npx mobigent-provider --provider litellm --base-url http://localhost:8788
npx mobigent-provider --provider ollama --base-url http://localhost:8788
npx mobigent-provider --provider lm-studio --base-url http://localhost:8788
npx mobigent-provider --provider groq --base-url http://localhost:8788
npx mobigent-provider --provider perplexity --base-url http://localhost:8788
npx mobigent-provider --provider xai-grok --base-url http://localhost:8788
npx mobigent-provider --provider deepseek --base-url http://localhost:8788
npx mobigent-provider --provider together-ai --base-url http://localhost:8788
npx mobigent-provider --provider fireworks-ai --base-url http://localhost:8788
npx mobigent-provider --provider qwen-dashscope --base-url http://localhost:8788
npx mobigent-provider --provider nvidia-nim --base-url http://localhost:8788
npx mobigent-provider --provider cloudflare-ai-gateway --base-url http://localhost:8788
npx mobigent-provider --provider mistral --base-url http://localhost:8788
npx mobigent-provider --provider cohere --base-url http://localhost:8788
npx mobigent-provider --provider anthropic-tool-use --base-url http://localhost:8788 --auth bearer
npx mobigent-provider --provider google-gemini --base-url http://localhost:8788
npx mobigent-provider --provider google-vertex-ai --base-url http://localhost:8788
npx mobigent-provider --provider aws-bedrock-converse --base-url http://localhost:8788
npx mobigent-provider --provider vercel-ai-sdk --base-url http://localhost:8788
npx mobigent-provider --provider anthropic-tool-use --base-url http://localhost:8788 --format runtime-env
npx mobigent-provider --provider langchain --base-url http://localhost:8788
npx mobigent-provider --provider llamaindex --base-url http://localhost:8788
npx mobigent-provider --provider mastra --base-url http://localhost:8788
npx mobigent-provider --provider semantic-kernel --base-url http://localhost:8788
npx mobigent-provider --provider crewai --base-url http://localhost:8788
npx mobigent-provider --provider autogen --base-url http://localhost:8788
npx mobigent-provider --provider haystack --base-url http://localhost:8788
```

Use `--matrix` when choosing between providers or building setup UI. It prints JSON with summary counts and one row per provider:

```json
{
  "summary": {
    "total": 37,
    "byTransport": {
      "stdio": 4,
      "http": 30,
      "openapi": 3
    },
    "byCategory": {
      "local-agent": 4,
      "hosted-actions": 2,
      "runtime-agent": 30,
      "fallback": 1
    }
  },
  "providers": [
    {
      "id": "openai-responses",
      "transport": "http",
      "category": "runtime-agent",
      "bestFor": ["server-side agent loops", "framework adapters", "private gateways"],
      "setupComplexity": "medium",
      "runtime": true,
      "dynamicTools": true,
      "requiresPublicUrl": false,
      "productionNotes": ["Fetch tools from the gateway at runtime."],
      "setupCommand": "mobigent-provider --provider openai-responses --base-url http://localhost:8788 --format runtime-env"
    }
  ]
}
```

For local agents, choose a `local-agent` / `stdio` provider. For hosted action-schema platforms, choose a `hosted-actions` / `openapi` provider and expose the gateway through HTTPS. For server-side agent loops, choose a `runtime-agent` / `http` provider so the agent can fetch live tools and call them directly. The matrix includes `bestFor`, `setupComplexity`, and `productionNotes` so provider setup UIs can explain the tradeoffs without hard-coding provider knowledge.

Use `--write-matrix` to commit the same provider comparison as `mobigent-providers.json` for CI checks, release review, docs sites, or onboarding dashboards. Re-run with `--force` when intentionally refreshing the artifact.

Use `--compatibility` when you need a machine-readable readiness report for the whole provider catalog. It runs the same setup validation used by `--validate`, then returns pass/warn/fail counts and failing or warning check names per provider. `--write-compatibility` writes that report to disk for CI gates:

```bash
npx mobigent-provider --compatibility --base-url https://mobigent.example
npx mobigent-provider --write-compatibility ./mobigent-provider-compatibility.json --base-url https://mobigent.example
```

Use `--setup-plan` when onboarding should produce one deployable path instead of a ranked list:

```bash
npx mobigent-provider --setup-plan runtime-agent --base-url http://localhost:8788 --query openrouter --agent-id openrouter-prod
npx mobigent-provider --write-setup-plan ./mobigent-provider-setup.json --base-url http://localhost:8788 --query anthropic
npx mobigent-provider --validate-setup-plan ./mobigent-provider-setup.json
```

The setup plan includes the selected recommendation, preset metadata, integration profile, validation report, provider bundle, useful gateway endpoints, and runtime environment defaults. `--validate-setup-plan` checks the saved artifact shape for CI and release review.

Use `--validate` before copying a generated setup into an agent. It prints a readiness report for the selected provider and returns a failing exit code when required values are missing. Hosted action providers fail if they still use localhost because ChatGPT-style hosted imports need a public HTTPS gateway URL:

```bash
npx mobigent-provider --provider openrouter --base-url http://localhost:8788 --validate
npx mobigent-provider --provider chatgpt-actions --base-url https://example.ngrok.app --validate --format guide
```

Use `--recommend` when you want Mobigent to rank provider choices for the integration shape:

```bash
npx mobigent-provider --recommend-presets
npx mobigent-provider --recommend local-agent
npx mobigent-provider --recommend hosted-actions --base-url https://example.ngrok.app
npx mobigent-provider --recommend runtime-agent --base-url http://localhost:8788 --query openrouter --limit 1
```

`--recommend-presets` prints the supported setup shapes as JSON. `local-agent` favors MCP stdio tools for apps like Claude Desktop, Cursor, and VS Code. `hosted-actions` favors OpenAPI/action-schema integrations that can import an HTTPS URL. `runtime-agent` favors server-side model loops that can fetch live tools and call the HTTP gateway directly. Each recommendation includes preset metadata, a score, reasons, and a ready setup command.

Print a Markdown guide:

```bash
npx mobigent-provider \
  --provider chatgpt-actions \
  --base-url https://example.ngrok.app \
  --format guide
```

Print runtime starter environment variables:

```bash
npx mobigent-provider \
  --provider anthropic-tool-use \
  --base-url http://localhost:8788 \
  --format runtime-env
```

Run a deployable runtime preflight:

```bash
npx mobigent-provider \
  --runtime-config \
  --provider openrouter \
  --base-url https://gateway.example.com \
  --auth bearer \
  --env MOBIGENT_HTTP_API_KEY=secret \
  --format guide
```

Print a complete provider bundle:

```bash
npx mobigent-provider \
  --provider openrouter \
  --base-url http://localhost:8788 \
  --format bundle
```

The bundle includes the provider descriptor, copy-paste setup JSON, Markdown guide, useful gateway endpoints, and runtime environment defaults when the provider supports HTTP tool execution. Secured HTTP bundles include the generated agent identity and `MOBIGENT_HTTP_API_KEY` placeholder so the same artifact works for local tests and deployed agent runtimes.

Useful options:

- `--env KEY=value`
- `--arg value`
- `--schema-path /openapi.json`
- `--auth none|bearer|api-key`
- `--agent-id openai-prod`

## Choosing a provider

- Use MCP for Claude Desktop, Cursor, VS Code, and other local agents.
- Use OpenAPI for hosted platforms that import action schemas.
- Use ChatGPT Actions when exposing the HTTP gateway through an HTTPS tunnel.
- Use OpenAI Responses, Azure OpenAI, OpenAI-compatible chat providers, OpenRouter, LiteLLM, Ollama, LM Studio, Groq, Perplexity, xAI Grok, DeepSeek, Together AI, Fireworks AI, Mistral, Cohere, Anthropic Tool Use, Google Gemini, AWS Bedrock Converse, Vercel AI SDK, LangChain, LlamaIndex, Mastra, Semantic Kernel, CrewAI, AutoGen, or Haystack when you control the server-side agent loop and can call the Mobigent HTTP gateway directly.

MCP supports dynamic tool updates. OpenAPI providers usually need a stable schema URL and may require re-importing when capabilities change.

HTTP tool providers use the same two endpoints:

```text
GET /providers
GET /snapshot
GET /tools
GET /tools/{toolName}
POST /tools/{toolName}/call
```

`GET /providers` returns setup descriptors for every built-in integration, including MCP, OpenAPI, ChatGPT Actions, OpenAI Responses, Azure OpenAI, OpenAI-compatible chat providers, OpenRouter, LiteLLM, Ollama, LM Studio, Groq, Perplexity, xAI Grok, DeepSeek, Together AI, Fireworks AI, Mistral, Cohere, Anthropic Tool Use, Google Gemini, AWS Bedrock Converse, Vercel AI SDK, LangChain, LlamaIndex, Mastra, Semantic Kernel, CrewAI, AutoGen, Haystack, Claude Desktop, Cursor, VS Code, and generic agents.

`GET /tools` returns tool names, descriptions, and JSON schemas. `GET /tools/{toolName}` returns one descriptor for lazy hydration or debugging. When the provider sends `x-mobigent-agent`, the gateway filters these reads with the same `allowedAgents` policy used for calls, so the model only sees tools that provider can invoke. The provider adapter maps those descriptors into the target framework's native tool shape. When the model chooses a tool, the adapter sends the tool input to `POST /tools/{toolName}/call`.

## Catalog Helpers

Use `filterProviderCatalog()` and `summarizeProviderCatalog()` when building docs, setup screens, CLIs, or dashboards from the same provider list:

```ts
import {
  createProviderCatalog,
  createProviderSetupPlan,
  filterProviderCatalog,
  formatProviderSetupValidation,
  listProviderRecommendationPresets,
  recommendProviders,
  summarizeProviderCatalog,
  validateProviderSetup
} from "@mobigent/providers";

const catalog = createProviderCatalog({
  mcp: { command: "mobigent-mcp" },
  openApi: { baseUrl: "https://mobigent.example" }
});

const runtimeProviders = filterProviderCatalog(catalog, { runtimeOnly: true });
const localDynamicProviders = filterProviderCatalog(catalog, {
  transport: "stdio",
  supportsDynamicTools: true
});
const hostedSchemaProviders = filterProviderCatalog(catalog, {
  transport: "openapi",
  requiresPublicUrl: true
});
const openAiCompatibleProviders = filterProviderCatalog(catalog, {
  runtimeOnly: true,
  query: "openai-compatible"
});
const recommendedRuntimeProviders = recommendProviders(catalog, {
  useCase: "runtime-agent",
  query: "openrouter",
  limit: 1
});
const setupPlan = createProviderSetupPlan(catalog, {
  useCase: "runtime-agent",
  query: "openrouter",
  runtimeEnv: { agentId: "openrouter-prod", watchTools: true }
});
const recommendationPresets = listProviderRecommendationPresets();
const setupReport = validateProviderSetup(catalog.find((provider) => provider.id === "openrouter")!);
console.log(formatProviderSetupValidation(setupReport));
const summary = summarizeProviderCatalog(catalog);
```

Use `createProviderSetupPlan()` when a setup UI or script should choose one best provider and return everything needed to explain and ship it: the selected recommendation, preset metadata, integration profile, validation report, provider bundle, endpoints, and runtime environment defaults.

## HTTP Adapter Utilities

For server-side agents, use the built-in HTTP client and mapper helpers:

```ts
import {
  createMobigentHttpClient,
  MobigentHttpError,
  diagnoseMobigentProvider,
  formatMobigentProviderDiagnostics,
  createProviderSafeToolNameMap,
  mapToolsForProviderNames,
  toOpenAiTools,
  toChatFunctionTools,
  toAnthropicTools,
  toGeminiFunctionDeclarations,
  toBedrockToolConfigTools,
  toVercelAiSdkTools,
  toLangChainTools,
  toLlamaIndexTools,
  toMastraTools,
  toSemanticKernelPlugin,
  toCrewAiTools,
  toAutoGenTools,
  toHaystackTools,
  filterProviderCatalog,
  summarizeProviderCatalog,
  createMobigentProviderRuntime,
  createMobigentProviderRuntimeFromEnv,
  createMobigentProviderRuntimeReport,
  diagnoseMobigentProviderRuntimeConfig,
  formatMobigentProviderRuntimeConfigReport,
  formatMobigentProviderRuntimeReport,
  formatMobigentToolCallResult,
  formatMobigentToolCallResults,
  createOpenRouterProvider,
  createProviderRuntimeEnv,
  stringifyProviderRuntimeEnv,
  watchMobigentProviderRuntime,
  createMobigentToolExecutor
} from "@mobigent/providers";

const client = createMobigentHttpClient({
  baseUrl: "http://localhost:8788",
  auth: "bearer",
  apiKey: process.env.MOBIGENT_HTTP_API_KEY,
  agentId: "openai-responses",
  timeoutMs: 30000,
  retries: 2,
  retryDelayMs: 250,
  requestId: () => crypto.randomUUID()
});

const health = await client.getHealth();
const readiness = await client.getReadiness({ minApps: 1, minTools: 1 });
await client.waitForReadiness({ minApps: 1, minTools: 1, timeoutMs: 30000 });
const config = await client.getConfig();
const metrics = await client.getMetrics();
const auditEvents = await client.listAuditEvents({ limit: 50 });
const apps = await client.listApps();
const visibility = await client.listAgentVisibility({ agentId: ["openrouter", "chatgpt-actions"] });
const tools = await client.waitForTools({ timeoutMs: 30000, intervalMs: 500 });
const diagnostics = await client.diagnose({ minApps: 1, minTools: 1, expectedProvider: "openrouter" });
console.log(formatMobigentProviderDiagnostics(diagnostics));
const safeNames = createProviderSafeToolNameMap(tools);
const providers = await client.listProviders();
const runtimeProviders = filterProviderCatalog(providers, { runtimeOnly: true });
const localProviders = filterProviderCatalog(providers, { transport: "stdio", supportsDynamicTools: true });
const providerSummary = summarizeProviderCatalog(providers);
const openAiTools = toOpenAiTools(tools);
const chatFunctionTools = toChatFunctionTools(tools);
const anthropicTools = toAnthropicTools(tools);
const geminiFunctionDeclarations = toGeminiFunctionDeclarations(tools);
const bedrockTools = toBedrockToolConfigTools(tools);
const vercelTools = toVercelAiSdkTools(tools, client);
const langChainTools = toLangChainTools(tools, client);
const llamaIndexTools = toLlamaIndexTools(tools, client);
const mastraTools = toMastraTools(tools, client);
const semanticKernelPlugin = toSemanticKernelPlugin(tools, client);
const crewAiTools = toCrewAiTools(tools, client);
const autoGenTools = toAutoGenTools(tools, client);
const haystackTools = toHaystackTools(tools, client);
const executeMobigentTool = createMobigentToolExecutor(client);
const openRouterProvider = createOpenRouterProvider({ baseUrl: "http://localhost:8788" });
const runtimeEnv = createProviderRuntimeEnv(openRouterProvider, { watchTools: true });
const runtimeEnvFile = stringifyProviderRuntimeEnv(openRouterProvider);

const anthropicRuntime = await createMobigentProviderRuntime({
  kind: "anthropic-tool-use",
  client,
  waitForTools: { timeoutMs: 30000, intervalMs: 500 }
});

const openRouterRuntime = await createMobigentProviderRuntime({
  kind: "openrouter",
  client,
  toolNames: { mode: "provider-safe" }
});
console.log(formatMobigentProviderRuntimeReport(createMobigentProviderRuntimeReport(openRouterRuntime)));
const toolResults = await openRouterRuntime.executeToolCalls(modelMessage.tool_calls ?? []);
const providerMessages = openRouterRuntime.formatToolCallResults(toolResults);
const anthropicToolResult = formatMobigentToolCallResult(toolResults[0], "anthropic-tool-use");

const bootstrap = await createMobigentProviderRuntimeFromEnv({
  requestId: () => crypto.randomUUID()
});

for await (const runtime of watchMobigentProviderRuntime({
  kind: "anthropic-tool-use",
  client,
  stream: { signal: controller.signal }
})) {
  console.log(runtime.reason, runtime.rawTools.length);
}
```

`toOpenAiTools()` returns OpenAI Responses function-tool definitions with `parameters`. `toChatFunctionTools()` returns OpenAI-compatible chat function tools for Azure OpenAI, generic OpenAI-compatible gateways, OpenRouter, LiteLLM, Ollama, LM Studio, Groq, Perplexity, xAI Grok, DeepSeek, Together AI, Fireworks AI, Mistral, Cohere, and similar chat-completions providers. `toAnthropicTools()` returns tool definitions with `input_schema`. `toGeminiFunctionDeclarations()` returns Gemini function declarations for the Gemini API's function calling flow. `toBedrockToolConfigTools()` returns Bedrock Converse `toolConfig.tools` entries with `toolSpec.inputSchema.json`. The executor takes the selected tool name and model-provided input, then calls the mobile app through the Mobigent gateway.
`createProviderSafeToolNameMap()` and runtime `toolNames: { mode: "provider-safe" }` help with providers that reject punctuation or long function names. The adapter exposes sanitized names to the model while execution resolves back to the original mobile tool name.
`createMobigentProviderRuntime()` wraps startup readiness and provider mapping in one call. It waits for policy-visible mobile tools unless you pass `waitForTools: false`, then returns provider-native tool definitions plus `toolNameMap`, `executeTool()`, `resolveToolCall()`, `executeToolCall()`, `executeToolCalls()`, `formatToolCallResult()`, and `formatToolCallResults()` helpers. The tool-call helpers accept common OpenAI-compatible and Anthropic-style tool call objects, parse JSON argument strings, resolve provider-safe names, and return structured success/error results. The format helpers turn those results into OpenAI Responses `function_call_output`, OpenAI-compatible chat `role: "tool"` messages, Anthropic `tool_result` blocks, Gemini `functionResponse` parts, Bedrock Converse `toolResult` blocks, or generic JSON results.
`createMobigentProviderRuntimeReport()` and `formatMobigentProviderRuntimeReport()` produce provider boot logs with the selected provider, result format, raw mobile tool names, provider-facing names, and provider-safe name mappings.
`createMobigentProviderRuntimeFromEnv()` is the deployable bootstrap path for agent servers. It reads provider, gateway URL, auth key, agent identity, timeout, retry, and wait settings from `MOBIGENT_*` environment variables, waits for gateway readiness, then returns `{ client, readiness, runtime }`.
`diagnoseMobigentProviderRuntimeConfig()` and `formatMobigentProviderRuntimeConfigReport()` validate the env-driven runtime before network startup. The report checks provider support, HTTP URL shape, auth key presence, agent identity, readiness waits, and live tool watching so deployment mistakes can fail in CI.
`createProviderRuntimeEnv()` and `stringifyProviderRuntimeEnv()` generate the matching environment artifact from a provider descriptor, so setup UIs, docs generators, and deployment scripts use the same values as `--format runtime-env` and provider bundles.
Runtime helpers infer provider-specific TypeScript shapes from `kind`: Azure OpenAI, OpenAI-compatible, OpenRouter, LiteLLM, Ollama, LM Studio, Groq, Perplexity, xAI Grok, DeepSeek, Together AI, Fireworks AI, Mistral, and Cohere runtimes expose chat function tools, Anthropic runtimes expose `input_schema`, Vercel AI SDK runtimes expose a tool record keyed by tool name, and Semantic Kernel runtimes expose plugin function descriptors.
`watchMobigentProviderRuntime()` maps every live tool-stream snapshot into the selected provider's native shape, so long-running agents can refresh their registered tools when mobile capabilities appear, disappear, or update.
`toSemanticKernelPlugin()` returns plugin function descriptors with `pluginName`, JSON parameters, and an `invoke()` handler that can be wrapped by Semantic Kernel apps.
`toCrewAiTools()`, `toAutoGenTools()`, and `toHaystackTools()` return dependency-free descriptors for Python agent wrappers that call the Mobigent HTTP gateway.
`getHealth()` reads `GET /health` and returns process health plus connected app/tool counts.
`getReadiness()` reads `GET /ready` and returns structured readiness checks. `waitForReadiness()` polls readiness with timeout and abort support. Use it before registering model tools if your agent server should wait for at least one accepted app manifest or visible tool.
`getConfig()` reads `GET /config` and returns machine-readable gateway integration metadata: protocol versions, auth requirements, endpoint paths, feature flags, request limits, and standard Mobigent headers.
`getMetrics()` reads `GET /metrics` and returns lifetime audit and tool-call counters for dashboards, alerts, or adaptive agent behavior.
`diagnose()` and `diagnoseMobigentProvider()` run a provider-side doctor report across config, health, readiness, app sessions, visible tools, provider catalog, and audit access. The report returns `pass`, `warn`, or `fail` checks. Use `formatMobigentProviderDiagnostics()` to print a readable support report, with optional JSON details for logs.
`listAgentVisibility()` reads `GET /agents` and returns visible and hidden tool names for one or more agent ids after app `allowedAgents` policies and gateway agent profiles are applied. Use it in setup UIs and support reports when a provider connects successfully but cannot see the expected mobile capability.
`listAuditEvents()` reads `GET /audit` and returns recent structured gateway events for debugging, admin views, and compliance exports.
`listApps()` reads `GET /apps` and returns connected app sessions, SDK versions, negotiated protocol versions, liveness fields (`lastSeenAt`, `ageMs`, `idleMs`), capability counts, and manifest signature status.
`listProviders()` reads `GET /providers` and returns the gateway's supported provider descriptors, including setup metadata for MCP, OpenAPI, hosted model APIs, and framework adapters.
`getTool(name)` reads `GET /tools/{toolName}` and returns one tool descriptor. This is useful for framework adapters that hydrate tool schemas lazily or for admin/debug views that inspect one capability.
`waitForTools()` repeatedly calls `listTools()` until at least one policy-visible tool is available. Use it during agent startup so OpenAI, OpenRouter, LiteLLM, Ollama, LM Studio, Groq, Perplexity, xAI Grok, DeepSeek, Together AI, Fireworks AI, Mistral, Cohere, Anthropic, Gemini, LangChain, and similar adapters do not register an empty tool list while the mobile app is still connecting.

Operator dashboards can subscribe to live audit events:

```ts
for await (const event of client.watchAuditEvents({ replay: 10, signal: controller.signal })) {
  console.log(event.severity, event.type, event.message);
}
```

`watchAuditEvents()` uses `GET /audit/stream`. The optional `replay` value sends recent events first, then the stream continues with live session, manifest, app event, tool call, denial, timeout, and failure events.

For agent runtimes that can refresh tools while running, subscribe to the HTTP tool stream:

```ts
const controller = new AbortController();

for await (const event of client.watchTools({ signal: controller.signal })) {
  const openAiTools = toOpenAiTools(event.tools);
  console.log(event.reason, openAiTools.length);
}
```

`watchTools()` uses `GET /tools/stream`, receives an initial `snapshot`, then receives `changed` events when mobile app capabilities appear, disappear, or update. The stream uses the adapter's configured `agentId`, so restricted tools stay hidden from providers that are not allowlisted.

`toVercelAiSdkTools()`, `toLangChainTools()`, `toLlamaIndexTools()`, and `toMastraTools()` return lightweight executable tool objects. They intentionally do not import those frameworks, so your agent server can adapt them to the exact framework version it already uses.

For example:

```ts
const langChainTools = toLangChainTools(tools, client);

await langChainTools[0].execute({
  amount: 42,
  merchant: "Taxi"
});
```

The HTTP client can add provider headers, correlation ids, idempotency keys, client-side request timeouts, gateway timeout hints, and simple retries:

```ts
const client = createMobigentHttpClient({
  baseUrl: "http://localhost:8788",
  auth: "api-key",
  apiKey: process.env.MOBIGENT_HTTP_API_KEY,
  agentId: "anthropic-tool-use",
  headers: { "x-provider-workspace": "prod" },
  timeoutMs: 30000,
  requestId: () => crypto.randomUUID(),
  retries: 2,
  retryDelayMs: 250
});

await client.callTool(
  "com_example_app.expense_create",
  { amount: 42, merchant: "Taxi" },
  {
    idempotencyKey: "expense-create-123",
    requestId: "provider-call-123",
    timeoutMs: 10_000
  }
);
```

When the same tool, agent, idempotency key, and input are retried, the gateway returns the first successful result without running the mobile action again. A repeated key with different input is rejected.

`timeoutMs` aborts the provider-side fetch and is also sent as `x-mobigent-timeout-ms` so the gateway can cap the mobile app call.

Retries are only used for transient gateway or network failures such as `408`, `429`, and `5xx` responses. Validation, policy, and permission errors are returned immediately.

Provider clients throw `MobigentHttpError` for HTTP, network, and malformed gateway responses:

```ts
try {
  await executeMobigentTool("com_example_app.expense_create", {
    amount: "not a number"
  });
} catch (error) {
  if (error instanceof MobigentHttpError) {
    console.log(error.code, error.status, error.retryable);
  }
}
```

Common error codes include `unauthorized`, `forbidden`, `invalid_input`, `not_found`, `rate_limited`, `gateway_error`, `network_error`, and `invalid_response`.

## Runnable Examples

The repo includes an agent-server example workspace:

```bash
npm run demo -w @mobigent/example-agent-server
```

The offline demo does not need provider API keys. It uses a mock gateway response, converts the discovered Mobigent tool into OpenAI, chat function, Anthropic, Gemini, AWS Bedrock Converse, and Vercel AI SDK shapes, then executes the tool through the HTTP client.

Provider-specific starter files are available in `examples/agent-server`:

```bash
MOBIGENT_HTTP_URL=http://localhost:8788 tsx examples/agent-server/openai-responses.ts
MOBIGENT_HTTP_URL=http://localhost:8788 tsx examples/agent-server/anthropic-tool-use.ts
MOBIGENT_HTTP_URL=http://localhost:8788 tsx examples/agent-server/gemini-function-calling.ts
MOBIGENT_HTTP_URL=http://localhost:8788 tsx examples/agent-server/vercel-ai-sdk.ts
```

The provider runtime starter is the recommended generic example for server-side agent loops. It waits for gateway readiness and policy-visible mobile tools before producing provider-native tool definitions:

```bash
MOBIGENT_PROVIDER=anthropic-tool-use \
MOBIGENT_MIN_APPS=1 \
MOBIGENT_MIN_TOOLS=1 \
MOBIGENT_HTTP_URL=http://localhost:8788 \
npm run runtime -w @mobigent/example-agent-server

MOBIGENT_PROVIDER=vercel-ai-sdk \
MOBIGENT_WATCH_TOOLS=true \
MOBIGENT_HTTP_URL=http://localhost:8788 \
npm run runtime -w @mobigent/example-agent-server
```

Set `MOBIGENT_DIAGNOSE=true` on the runtime starter to print the formatted provider doctor report after startup.

The runtime starter accepts `openai-responses`, `azure-openai`, `openai-compatible`, `openrouter`, `litellm`, `ollama`, `lm-studio`, `groq`, `perplexity`, `xai-grok`, `deepseek`, `together-ai`, `fireworks-ai`, `mistral`, `cohere`, `anthropic-tool-use`, `google-gemini`, `aws-bedrock-converse`, `vercel-ai-sdk`, `langchain`, `llamaindex`, `mastra`, `semantic-kernel`, `crewai`, `autogen`, `haystack`, and `generic-agent`.

You can generate matching environment variables from the CLI:

```bash
npx mobigent-provider \
  --provider openrouter \
  --base-url http://localhost:8788 \
  --format runtime-env
```

## Agent identity

Use stable provider ids in policies:

```ts
policy: {
  allowedAgents: ["claude-desktop", "cursor", "chatgpt-actions", "openai-responses", "openrouter"],
  rateLimitPerMinute: 10
}
```

For HTTP/OpenAPI providers, pass the identity through `x-mobigent-agent`. For SDK or server-side integrations, pass it to `gateway.callTool()`.
