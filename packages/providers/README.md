# @mobigent/providers

Provider configuration helpers for connecting Mobigent to agent platforms.

```ts
import {
  createClaudeDesktopProvider,
  createCursorProvider,
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
  createMobigentProviderRuntime,
  formatMobigentToolCallResult,
  createLangChainProvider,
  createCrewAiProvider,
  createAutoGenProvider,
  createHaystackProvider,
} from '@mobigent/providers';

createClaudeDesktopProvider({
  command: 'mobigent-mcp',
  env: { MOBIGENT_AUTH_TOKEN: 'dev-secret' },
});

createChatGptActionsProvider({
  baseUrl: 'https://example.ngrok.app',
});

createOpenAiResponsesProvider({
  baseUrl: 'http://localhost:8788',
  agentId: 'openai-responses',
});

createOpenRouterProvider({ baseUrl: 'http://localhost:8788' });
createLiteLlmProvider({ baseUrl: 'http://localhost:8788' });
createOllamaProvider({ baseUrl: 'http://localhost:8788' });
createLmStudioProvider({ baseUrl: 'http://localhost:8788' });
createGroqProvider({ baseUrl: 'http://localhost:8788' });
createPerplexityProvider({ baseUrl: 'http://localhost:8788' });
createXaiGrokProvider({ baseUrl: 'http://localhost:8788' });
createDeepSeekProvider({ baseUrl: 'http://localhost:8788' });
createTogetherAiProvider({ baseUrl: 'http://localhost:8788' });
createFireworksAiProvider({ baseUrl: 'http://localhost:8788' });
createQwenDashScopeProvider({ baseUrl: 'http://localhost:8788' });
createNvidiaNimProvider({ baseUrl: 'http://localhost:8788' });
createCloudflareAiGatewayProvider({ baseUrl: 'http://localhost:8788' });
createMistralProvider({ baseUrl: 'http://localhost:8788' });
createCohereProvider({ baseUrl: 'http://localhost:8788' });

createAnthropicToolUseProvider({
  baseUrl: 'http://localhost:8788',
  auth: 'bearer',
});

createGoogleGeminiProvider({
  baseUrl: 'http://localhost:8788',
});

createGoogleVertexAiProvider({
  baseUrl: 'http://localhost:8788',
});

createAwsBedrockConverseProvider({
  baseUrl: 'http://localhost:8788',
});

createVercelAiSdkProvider({
  baseUrl: 'http://localhost:8788',
});

createLangChainProvider({
  baseUrl: 'http://localhost:8788',
});

createCrewAiProvider({ baseUrl: 'http://localhost:8788' });
createAutoGenProvider({ baseUrl: 'http://localhost:8788' });
createHaystackProvider({ baseUrl: 'http://localhost:8788' });

const runtime = await createMobigentProviderRuntime({
  kind: 'openrouter',
  client,
  toolNames: { mode: 'provider-safe' },
});
const toolResults = await runtime.executeToolCalls(modelMessage.tool_calls ?? []);
const providerMessages = runtime.formatToolCallResults(toolResults);
const anthropicToolResult = formatMobigentToolCallResult(toolResults[0], 'anthropic-tool-use');
```

Supported provider shapes:

- MCP stdio
- Claude Desktop
- Cursor
- VS Code
- OpenAPI
- ChatGPT Actions
- OpenAI Responses API
- Azure OpenAI
- OpenAI-compatible chat providers
- OpenRouter
- LiteLLM
- Ollama
- LM Studio
- Groq
- Perplexity
- xAI Grok
- DeepSeek
- Together AI
- Fireworks AI
- Qwen DashScope
- NVIDIA NIM
- Cloudflare AI Gateway
- Mistral AI
- Cohere
- Anthropic Tool Use
- Google Gemini
- Google Vertex AI
- AWS Bedrock Converse
- Vercel AI SDK
- LangChain
- LlamaIndex
- Mastra
- Semantic Kernel
- CrewAI
- Microsoft AutoGen
- Haystack
- generic agents that support MCP or OpenAPI

Each descriptor includes:

- provider identity and docs URL
- transport capabilities
- integration category (`local-agent`, `hosted-actions`, `runtime-agent`, or `fallback`)
- best-for labels, setup complexity, and production notes
- whether a public URL is required
- whether dynamic tool discovery is supported
- JSON setup that can be copied into the target agent config

Runtime helpers also format executed mobile tool results back into provider-native response envelopes: OpenAI Responses `function_call_output`, OpenAI-compatible chat `role: "tool"` messages, Anthropic `tool_result` blocks, Gemini `functionResponse` parts, Bedrock Converse `toolResult` blocks, or generic JSON.

## CLI

```bash
npx mobigent-provider --list
npx mobigent-provider --matrix --base-url http://localhost:8788
npx mobigent-provider --compatibility --base-url http://localhost:8788
npx mobigent-provider --write-matrix ./mobigent-providers.json --base-url http://localhost:8788
npx mobigent-provider --write-compatibility ./mobigent-provider-compatibility.json --base-url http://localhost:8788
npx mobigent-provider --setup-plan runtime-agent --base-url http://localhost:8788 --query openrouter
npx mobigent-provider --write-setup-plan ./mobigent-provider-setup.json --base-url http://localhost:8788 --query anthropic
npx mobigent-provider --validate-setup-plan ./mobigent-provider-setup.json
npx mobigent-provider --recommend-presets
npx mobigent-provider --recommend local-agent
npx mobigent-provider --recommend hosted-actions --base-url https://example.ngrok.app
npx mobigent-provider --recommend runtime-agent --base-url http://localhost:8788 --query openrouter
npx mobigent-provider --provider claude-desktop --command mobigent-mcp
npx mobigent-provider --provider cursor --command npx --arg mobigent-mcp
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
npx mobigent-provider --runtime-config --provider openrouter --base-url https://gateway.example.com --auth bearer --env MOBIGENT_HTTP_API_KEY=secret --format guide
npx mobigent-provider --provider openrouter --base-url http://localhost:8788 --format bundle
npx mobigent-provider --provider langchain --base-url http://localhost:8788
npx mobigent-provider --provider semantic-kernel --base-url http://localhost:8788
npx mobigent-provider --provider crewai --base-url http://localhost:8788
npx mobigent-provider --provider autogen --base-url http://localhost:8788
npx mobigent-provider --provider haystack --base-url http://localhost:8788
```

Use `--matrix` to compare all built-in providers before choosing one. It returns summary counts plus per-provider category, best-for labels, setup complexity, transport, runtime support, dynamic tool support, public URL requirements, production notes, and a ready setup command. Use `--write-matrix` to write the same comparison to a JSON artifact for CI, release review, or setup dashboards. Use `--compatibility` or `--write-compatibility` to run setup validation across the whole catalog and produce pass/warn/fail counts for release checks.

Use `--setup-plan runtime-agent`, `--setup-plan local-agent`, or `--setup-plan hosted-actions` when onboarding should produce one best path instead of a ranked list. The setup plan includes the selected recommendation, preset metadata, integration profile, validation report, provider bundle, useful gateway endpoints, and runtime environment defaults. Use `--write-setup-plan` to commit the same artifact for setup UIs, CI review, or deployment scripts. Use `--validate-setup-plan` in CI to check that a saved setup plan still has the expected shape.

Use `--recommend-presets` to print the supported setup shapes as JSON: `local-agent`, `hosted-actions`, and `runtime-agent`. Use `--recommend local-agent`, `--recommend hosted-actions`, or `--recommend runtime-agent` when you want the CLI to rank good defaults instead of reading the whole matrix. Recommendations include preset metadata, a score, reasons, and the exact setup command. Add `--query openrouter` or `--limit 3` to narrow the answer.

Use `--validate` to print a setup readiness report for the generated provider config. It catches missing stdio commands, missing gateway URLs, missing HTTP tool endpoints, and hosted action configs that still point at localhost. Add `--format guide` for a readable support report.

Use `--runtime-config` before deploying an env-driven agent server. It validates the selected runtime provider, gateway URL, auth key, agent identity, readiness waits, and live-tool watching settings. JSON output is useful in CI; `--format guide` prints the same checks as a readable startup preflight.

Use `--format guide` to print a Markdown setup snippet. Use `--format runtime-env` with an HTTP runtime provider to print environment variables for `npm run runtime -w @mobigent/example-agent-server`. Use `--format bundle` to print one JSON artifact with the provider descriptor, setup, guide, useful endpoints, and runtime environment defaults. Secured HTTP bundles include the generated agent identity and `MOBIGENT_HTTP_API_KEY` placeholder so they can be copied into provider runtime deployments.

HTTP tool providers generate:

- `configUrl` for `GET /config`
- `snapshotUrl` for `GET /snapshot`
- `listToolsUrl` for `GET /tools`
- `toolStreamUrl` for `GET /tools/stream`
- `callToolUrlTemplate` for `POST /tools/{toolName}/call`
- `auditUrl` and `auditStreamUrl` for audit history and live audit events
- auth headers for bearer or API-key protected gateways
- an `x-mobigent-agent` identity that can be used in runtime policy

## Catalog helpers

Use `filterProviderCatalog()` and `summarizeProviderCatalog()` when building docs, setup screens, CLIs, or dashboards from the same provider list:

```ts
import {
  createProviderCatalog,
  filterProviderCatalog,
  formatProviderSetupValidation,
  listProviderRecommendationPresets,
  recommendProviders,
  createProviderSetupPlan,
  summarizeProviderCatalog,
  validateProviderSetup,
} from '@mobigent/providers';

const catalog = createProviderCatalog({
  mcp: { command: 'mobigent-mcp' },
  openApi: { baseUrl: 'https://mobigent.example' },
});

const runtimeProviders = filterProviderCatalog(catalog, { runtimeOnly: true });
const localDynamicProviders = filterProviderCatalog(catalog, {
  transport: 'stdio',
  supportsDynamicTools: true,
});
const hostedSchemaProviders = filterProviderCatalog(catalog, {
  transport: 'openapi',
  requiresPublicUrl: true,
});
const openAiCompatibleProviders = filterProviderCatalog(catalog, {
  runtimeOnly: true,
  query: 'openai-compatible',
});
const recommendedRuntimeProviders = recommendProviders(catalog, {
  useCase: 'runtime-agent',
  query: 'openrouter',
  limit: 1,
});
const setupPlan = createProviderSetupPlan(catalog, {
  useCase: 'runtime-agent',
  query: 'openrouter',
  runtimeEnv: { agentId: 'openrouter-prod', watchTools: true },
});
const recommendationPresets = listProviderRecommendationPresets();
const setupReport = validateProviderSetup(
  catalog.find((provider) => provider.id === 'openrouter')!,
);
console.log(formatProviderSetupValidation(setupReport));
const summary = summarizeProviderCatalog(catalog);
```

Use `createProviderSetupPlan()` when a setup UI or script should choose one best provider and return everything needed to explain and ship it: the selected recommendation, preset metadata, integration profile, validation report, provider bundle, endpoints, and runtime environment defaults.

## HTTP adapter utilities

```ts
import {
  createMobigentHttpClient,
  MobigentHttpError,
  createProviderBundle,
  createProviderRuntimeEnv,
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
  watchMobigentProviderRuntime,
  stringifyProviderRuntimeEnv,
  createMobigentToolExecutor,
} from '@mobigent/providers';

const client = createMobigentHttpClient({
  baseUrl: 'http://localhost:8788',
  auth: 'bearer',
  apiKey: process.env.MOBIGENT_HTTP_API_KEY,
  agentId: 'openai-responses',
  timeoutMs: 30000,
  retries: 2,
  retryDelayMs: 250,
  requestId: () => crypto.randomUUID(),
});

const health = await client.getHealth();
const readiness = await client.getReadiness({ minApps: 1, minTools: 1 });
await client.waitForReadiness({ minApps: 1, minTools: 1, timeoutMs: 30000 });
const config = await client.getConfig();
const snapshot = await client.getSnapshot();
const metrics = await client.getMetrics();
const auditEvents = await client.listAuditEvents({ limit: 50 });
const apps = await client.listApps();
const visibility = await client.listAgentVisibility({ agentId: ['openrouter', 'chatgpt-actions'] });
const tools = await client.waitForTools({ timeoutMs: 30000, intervalMs: 500 });
const diagnostics = await client.diagnose({
  minApps: 1,
  minTools: 1,
  expectedProvider: 'openrouter',
});
console.log(formatMobigentProviderDiagnostics(diagnostics));
const safeNames = createProviderSafeToolNameMap(tools);
const providers = await client.listProviders();
const runtimeProviders = filterProviderCatalog(providers, { runtimeOnly: true });
const localProviders = filterProviderCatalog(providers, {
  transport: 'stdio',
  supportsDynamicTools: true,
});
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
const executeTool = createMobigentToolExecutor(client);
const bundle = createProviderBundle(createOpenRouterProvider({ baseUrl: 'http://localhost:8788' }));
const runtimeEnv = createProviderRuntimeEnv(bundle.provider, { watchTools: true });
const runtimeEnvFile = stringifyProviderRuntimeEnv(bundle.provider);

const anthropicRuntime = await createMobigentProviderRuntime({
  kind: 'anthropic-tool-use',
  client,
  waitForTools: { timeoutMs: 30000, intervalMs: 500 },
});

const openRouterRuntime = await createMobigentProviderRuntime({
  kind: 'openrouter',
  client,
  toolNames: { mode: 'provider-safe' },
});
console.log(
  formatMobigentProviderRuntimeReport(createMobigentProviderRuntimeReport(openRouterRuntime)),
);
const toolResults = await openRouterRuntime.executeToolCalls(modelMessage.tool_calls ?? []);

const bootstrap = await createMobigentProviderRuntimeFromEnv({
  requestId: () => crypto.randomUUID(),
});

for await (const runtime of watchMobigentProviderRuntime({
  kind: 'anthropic-tool-use',
  client,
  stream: { signal: controller.signal },
})) {
  console.log(runtime.reason, runtime.rawTools.length);
}
```

Use `openAiTools`, `chatFunctionTools`, `anthropicTools`, `geminiFunctionDeclarations`, or `bedrockTools` in the target model SDK, then pass selected tool calls to `executeTool(toolName, input)`. The shared chat-function shape is used by OpenAI-compatible, OpenRouter, LiteLLM, Ollama, LM Studio, Groq, Perplexity, xAI Grok, DeepSeek, Together AI, Fireworks AI, Mistral, Cohere, and other chat providers.
Use `createProviderSafeToolNameMap()` or runtime `toolNames: { mode: "provider-safe" }` when a model provider requires stricter function names. Mobigent exposes sanitized names to the model and resolves them back to original mobile tool names during execution.
Use `createMobigentProviderRuntime()` when you want one startup call that waits for policy-visible mobile tools, maps them into a provider-native shape, and returns `toolNameMap`, `executeTool()`, `resolveToolCall()`, `executeToolCall()`, and `executeToolCalls()` helpers. The tool-call helpers accept common OpenAI-compatible and Anthropic-style tool call objects, parse JSON argument strings, resolve provider-safe names, and return structured success/error results.
Use `createMobigentProviderRuntimeReport()` and `formatMobigentProviderRuntimeReport()` in agent-server boot logs to show the selected provider, result format, raw mobile tool names, provider-facing names, and any provider-safe name mappings.
Use `createMobigentProviderRuntimeFromEnv()` for deployable agent servers. It reads `MOBIGENT_PROVIDER`, `MOBIGENT_HTTP_URL`, `MOBIGENT_HTTP_API_KEY`, `MOBIGENT_AGENT_ID`, wait settings, timeout settings, and retry settings, waits for gateway readiness, then returns `{ client, readiness, runtime }`.
Use `diagnoseMobigentProviderRuntimeConfig()` and `formatMobigentProviderRuntimeConfigReport()` as a startup preflight before creating the runtime. The report returns `pass`, `warn`, or `fail` for provider support, HTTP URL shape, auth key presence, agent identity, readiness waits, and live tool watching.
Use `createProviderRuntimeEnv()` or `stringifyProviderRuntimeEnv()` when generating deployment artifacts for an agent server. The helper derives `MOBIGENT_PROVIDER`, `MOBIGENT_HTTP_URL`, `MOBIGENT_AGENT_ID`, optional `MOBIGENT_HTTP_API_KEY`, readiness waits, and live-tool watching from the same provider descriptor used by bundles and the CLI.
Runtime helpers infer provider-specific TypeScript shapes from `kind`: OpenAI-compatible, OpenRouter, LiteLLM, Ollama, LM Studio, Groq, Perplexity, xAI Grok, DeepSeek, Together AI, Fireworks AI, Mistral, and Cohere runtimes expose chat function tools, Anthropic runtimes expose `input_schema`, Vercel AI SDK runtimes expose a tool record keyed by tool name, and Semantic Kernel runtimes expose plugin function descriptors.
Use `watchMobigentProviderRuntime()` for long-running agents that can refresh tools while the app reconnects or changes its manifest; each event is already mapped into the selected provider's native tool shape.
Use `semanticKernelPlugin` to wrap Mobigent tools as Semantic Kernel plugin functions in the language runtime you already use.
Use `crewAiTools`, `autoGenTools`, and `haystackTools` as dependency-free descriptors for Python agent wrappers that call back into the Mobigent HTTP gateway.

HTTP failures throw `MobigentHttpError` with a stable `code`, `status`, `operation`, `body`, and `retryable` flag. Gateway error bodies are preserved, so agents can distinguish `invalid_input`, `forbidden`, `not_found`, `conflict`, `rate_limited`, `timeout`, and broader `gateway_error` cases without parsing prose.

`getHealth()` reads `GET /health` and returns process health plus connected app/tool counts.
`getReadiness()` reads `GET /ready` and returns structured readiness checks. `waitForReadiness()` polls readiness with timeout and abort support. Use it before registering model tools if your agent server should wait for at least one accepted app manifest or visible tool.
`getConfig()` reads `GET /config` and returns machine-readable gateway integration metadata: protocol versions, auth requirements, endpoint paths, feature flags, request limits, and standard Mobigent headers.
`getSnapshot()` reads `GET /snapshot` and returns a one-call provider bootstrap payload with config, health, readiness, connected apps, provider descriptors, visible tools, metrics, and recent audit events.
`getMetrics()` reads `GET /metrics` and returns lifetime audit and tool-call counters for dashboards, alerts, or adaptive agent behavior.
`diagnose()` and `diagnoseMobigentProvider()` run a provider-side doctor report across config, health, readiness, app sessions, visible tools, provider catalog, and audit access. The report returns `pass`, `warn`, or `fail` checks. Use `formatMobigentProviderDiagnostics()` to print a readable support report, with optional JSON details for logs.
`listAuditEvents()` reads `GET /audit` and returns recent structured gateway events for debugging, admin views, and compliance exports.
`listApps()` reads `GET /apps` and returns connected app sessions, SDK versions, negotiated protocol versions, liveness fields (`lastSeenAt`, `ageMs`, `idleMs`), capability counts, and manifest signature status.
`listAgentVisibility()` reads `GET /agents` and returns visible and hidden tool names for one or more agent ids after app policies and gateway profiles are applied.
`listProviders()` reads `GET /providers` and returns the gateway's supported provider descriptors, including setup metadata for MCP, OpenAPI, hosted model APIs, and framework adapters.
`listTools()` sends the client's configured `agentId` as `x-mobigent-agent`. The gateway uses that identity to hide capabilities whose `allowedAgents` policy does not include the provider.
`getTool(name)` reads `GET /tools/{toolName}` and returns one tool descriptor. Use it for lazy schema hydration or admin/debug views that inspect one capability.
`waitForTools()` repeatedly calls `listTools()` until at least one policy-visible tool is available. Use it during agent startup so OpenAI, Anthropic, Gemini, LangChain, and similar adapters do not register an empty tool list while the mobile app is still connecting.

Operator dashboards can subscribe to live audit events:

```ts
for await (const event of client.watchAuditEvents({ replay: 10, signal: controller.signal })) {
  console.log(event.severity, event.type, event.message);
}
```

`watchAuditEvents()` uses `GET /audit/stream`. The optional `replay` value sends recent events first, then the stream continues with live session, manifest, app event, tool call, denial, timeout, and failure events.

Agents that support dynamic tool refresh can subscribe to gateway changes:

```ts
const controller = new AbortController();

for await (const event of client.watchTools({ signal: controller.signal })) {
  const openAiTools = toOpenAiTools(event.tools);
  console.log(event.reason, openAiTools.length);
}
```

The stream uses `GET /tools/stream` and emits an initial `snapshot` followed by `changed` events whenever app capabilities appear, disappear, or update. It sends the same provider identity headers as `listTools()`, so restricted tools remain hidden from unauthorized providers.

The Vercel AI SDK, LangChain, LlamaIndex, and Mastra helpers return lightweight executable tool objects. They avoid hard framework dependencies, so you can wrap them with the exact version of each framework your agent server already uses.

The HTTP client also supports custom headers, provider identities, request ids, idempotency keys, client-side request timeouts, gateway timeout hints, and retrying transient `408`, `429`, or `5xx` failures:

```ts
const client = createMobigentHttpClient({
  baseUrl: 'http://localhost:8788',
  auth: 'api-key',
  apiKey: process.env.MOBIGENT_HTTP_API_KEY,
  agentId: 'anthropic-tool-use',
  headers: { 'x-provider-workspace': 'prod' },
  timeoutMs: 30000,
  requestId: () => crypto.randomUUID(),
  retries: 2,
  retryDelayMs: 250,
});

await client.callTool(
  'com_example_app.create_expense',
  { amount: 42, merchant: 'Taxi' },
  {
    idempotencyKey: 'expense-create-123',
    requestId: 'provider-call-123',
    timeoutMs: 10_000,
  },
);
```

When the same tool, agent, idempotency key, and input are retried, the gateway returns the first successful result without running the mobile action again. A repeated key with different input is rejected.

`timeoutMs` aborts the provider-side fetch and is also sent as `x-mobigent-timeout-ms` so the gateway can cap the mobile app call.

HTTP, network, and malformed gateway responses throw `MobigentHttpError`:

```ts
try {
  await executeTool('com_example_app.create_expense', { amount: 'bad' });
} catch (error) {
  if (error instanceof MobigentHttpError) {
    console.log(error.code, error.status, error.retryable);
  }
}
```

Error codes include `unauthorized`, `forbidden`, `invalid_input`, `not_found`, `rate_limited`, `gateway_error`, `network_error`, and `invalid_response`.
