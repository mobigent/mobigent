export type ProviderKind =
  | "mcp-stdio"
  | "openapi"
  | "chatgpt-actions"
  | "openai-responses"
  | "azure-openai"
  | "openai-compatible"
  | "openrouter"
  | "litellm"
  | "ollama"
  | "lm-studio"
  | "groq"
  | "perplexity"
  | "xai-grok"
  | "deepseek"
  | "together-ai"
  | "fireworks-ai"
  | "qwen-dashscope"
  | "nvidia-nim"
  | "cloudflare-ai-gateway"
  | "mistral"
  | "cohere"
  | "anthropic-tool-use"
  | "google-gemini"
  | "google-vertex-ai"
  | "aws-bedrock-converse"
  | "vercel-ai-sdk"
  | "langchain"
  | "llamaindex"
  | "mastra"
  | "semantic-kernel"
  | "crewai"
  | "autogen"
  | "haystack"
  | "claude-desktop"
  | "cursor"
  | "vscode"
  | "generic-agent";

export type ProviderTransport = "stdio" | "http" | "openapi";

export type ProviderIntegrationCategory = "local-agent" | "hosted-actions" | "runtime-agent" | "fallback";

export type ProviderSetupComplexity = "low" | "medium" | "high";

export type ProviderCapabilities = {
  transport: ProviderTransport;
  supportsTools: boolean;
  supportsDynamicTools: boolean;
  requiresPublicUrl: boolean;
  supportsConfirmationNotes: boolean;
};

export type ProviderDescriptor = {
  id: string;
  kind: ProviderKind;
  name: string;
  description: string;
  docsUrl?: string;
  capabilities: ProviderCapabilities;
  setup: Record<string, unknown>;
};

export type ProviderCatalogFilter = {
  transport?: ProviderTransport | ProviderTransport[];
  supportsTools?: boolean;
  supportsDynamicTools?: boolean;
  requiresPublicUrl?: boolean;
  supportsConfirmationNotes?: boolean;
  runtimeOnly?: boolean;
  ids?: string[];
  query?: string;
};

export type ProviderCatalogSummary = {
  total: number;
  byTransport: Record<ProviderTransport, number>;
  byCategory: Record<ProviderIntegrationCategory, number>;
  runtimeProviders: number;
  publicUrlProviders: number;
  dynamicToolProviders: number;
};

export type ProviderIntegrationProfile = {
  category: ProviderIntegrationCategory;
  bestFor: string[];
  setupComplexity: ProviderSetupComplexity;
  productionNotes: string[];
};

export type ProviderCompatibilityEntry = {
  id: string;
  name: string;
  transport: ProviderTransport;
  runtime: boolean;
  status: ProviderSetupValidationStatus;
  failingChecks: string[];
  warningChecks: string[];
};

export type ProviderCompatibilityReport = {
  summary: ProviderCatalogSummary & {
    pass: number;
    warn: number;
    fail: number;
  };
  providers: ProviderCompatibilityEntry[];
};

export type ProviderRecommendationUseCase = "local-agent" | "hosted-actions" | "runtime-agent";

export type ProviderRecommendationPreset = {
  id: ProviderRecommendationUseCase;
  name: string;
  description: string;
  recommendedTransport: ProviderTransport;
  dynamicToolsPreferred: boolean;
  publicUrlDefault: boolean;
  summary: string;
};

export type ProviderRecommendationOptions = {
  useCase?: ProviderRecommendationUseCase;
  preferDynamicTools?: boolean;
  allowPublicUrl?: boolean;
  query?: string;
  limit?: number;
};

export type ProviderRecommendation = {
  provider: ProviderDescriptor;
  score: number;
  reasons: string[];
};

export type ProviderBundle = {
  provider: ProviderDescriptor;
  setup: Record<string, unknown>;
  guide: string;
  runtimeEnv?: Record<string, string>;
  endpoints: {
    config?: string;
    openApi?: string;
    snapshot?: string;
    tools?: string;
    toolStream?: string;
    audit?: string;
    auditStream?: string;
  };
};

export type ProviderSetupPlan = {
  useCase: ProviderRecommendationUseCase;
  preset: ProviderRecommendationPreset;
  recommendation: ProviderRecommendation;
  profile: ProviderIntegrationProfile;
  validation: ProviderSetupValidationReport;
  bundle: ProviderBundle;
};

export type ProviderSetupPlanValidationReport = {
  ok: boolean;
  status: "pass" | "fail";
  errors: string[];
  provider?: {
    id: string;
    name?: string;
  };
};

export type ProviderSetupPlanOptions = ProviderRecommendationOptions & {
  runtimeEnv?: ProviderRuntimeEnvOptions;
};

export type ProviderRuntimeEnvOptions = {
  baseUrl?: string;
  agentId?: string;
  apiKeyPlaceholder?: string;
  minApps?: number | string;
  minTools?: number | string;
  waitTimeoutMs?: number | string;
  waitIntervalMs?: number | string;
  watchTools?: boolean | string;
};

export type ProviderSetupValidationStatus = "pass" | "warn" | "fail";

export type ProviderSetupValidationCheck = {
  name: string;
  status: ProviderSetupValidationStatus;
  message: string;
};

export type ProviderSetupValidationReport = {
  ok: boolean;
  status: ProviderSetupValidationStatus;
  provider: {
    id: string;
    name: string;
    transport: ProviderTransport;
  };
  checks: ProviderSetupValidationCheck[];
  summary: string;
};

const providerRecommendationPresets: ProviderRecommendationPreset[] = [
  {
    id: "local-agent",
    name: "Local agent",
    description: "Best for desktop and local agents that can run an MCP-style stdio command.",
    recommendedTransport: "stdio",
    dynamicToolsPreferred: true,
    publicUrlDefault: false,
    summary: "Use for Claude Desktop, Cursor, VS Code, and local MCP clients."
  },
  {
    id: "hosted-actions",
    name: "Hosted actions",
    description: "Best for hosted platforms that import an OpenAPI or action schema over HTTPS.",
    recommendedTransport: "openapi",
    dynamicToolsPreferred: true,
    publicUrlDefault: true,
    summary: "Use when the provider needs a public schema URL, like ChatGPT Actions."
  },
  {
    id: "runtime-agent",
    name: "Runtime agent",
    description: "Best for server-side model loops that can call the Mobigent HTTP gateway directly.",
    recommendedTransport: "http",
    dynamicToolsPreferred: true,
    publicUrlDefault: false,
    summary: "Use for OpenAI Responses, Anthropic, Gemini, Bedrock, Vercel AI SDK, LangChain, and similar runtimes."
  }
];

export type McpStdioOptions = {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
};

export type OpenApiOptions = {
  baseUrl: string;
  schemaPath?: string;
  auth?: "none" | "bearer" | "api-key";
};

export type HttpAgentOptions = OpenApiOptions & {
  agentId?: string;
};

export type MobigentHttpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  readOnly?: boolean;
  risk?: string;
  app?: {
    id: string;
    name: string;
  };
};

export type MobigentGatewayStatus = {
  appSessions: number;
  authenticatedAppSessions: number;
  appsWithManifests: number;
  tools: number;
  auditEvents: number;
  idempotencyRecords: number;
  rateLimitBuckets: number;
  manifestSigningRequired: boolean;
  appAllowlistEnabled: boolean;
  agentProfilesConfigured: boolean;
};

export type MobigentHealth = {
  ok: boolean;
  name: string;
  status: MobigentGatewayStatus;
};

export type MobigentReadiness = MobigentHealth & {
  requirements: {
    minApps: number;
    minTools: number;
  };
  checks: {
    apps: {
      ok: boolean;
      actual: number;
      required: number;
    };
    tools: {
      ok: boolean;
      actual: number;
      required: number;
    };
  };
};

export type MobigentGatewayConfig = {
  name: "Mobigent Gateway";
  version: string;
  baseUrl: string;
  protocol: {
    currentVersion: number;
    supportedVersions: number[];
  };
  auth: {
    required: boolean;
    schemes: Array<"bearer" | "api-key">;
    apiKeyHeader: "x-mobigent-api-key";
    bearerHeader: "authorization";
  };
  endpoints: {
    health: string;
    ready: string;
    config: string;
    agents: string;
    apps: string;
    providers: string;
    snapshot: string;
    tools: string;
    toolStream: string;
    toolLookupTemplate: string;
    metrics: string;
    prometheusMetrics: string;
    audit: string;
    auditStream: string;
    openApi: string;
    toolCallTemplate: string;
  };
  features: {
    dynamicTools: boolean;
    toolStreaming: boolean;
    auditStreaming: boolean;
    appSessionDiscovery: boolean;
    providerCatalog: boolean;
    providerSnapshot: boolean;
    openApiSchema: boolean;
    perCallTimeouts: boolean;
    idempotencyKeys: boolean;
    requestIds: boolean;
    agentVisibility: boolean;
    agentScopedDiscovery: boolean;
    agentProfiles: boolean;
  };
  limits: {
    jsonBodyLimit: string | number;
    maxTimeoutMs: number;
  };
  headers: {
    agentId: string;
    idempotencyKey: string;
    requestId: string;
    timeoutMs: string;
  };
};

export type MobigentGatewaySnapshot = {
  at: string;
  agentId?: string;
  config: MobigentGatewayConfig;
  health: MobigentHealth;
  readiness: MobigentReadiness;
  apps: MobigentAppSession[];
  agents: MobigentAgentVisibility[];
  providers: ProviderDescriptor[];
  tools: MobigentHttpTool[];
  metrics: MobigentMetrics;
  audit: MobigentAuditEvent[];
};

export type MobigentAgentVisibility = {
  agentId: string;
  profileConfigured: boolean;
  profile?: {
    description?: string;
    allowedTools?: string[];
    deniedTools?: string[];
    readOnly?: boolean;
    maxRisk?: "low" | "medium" | "high";
  };
  visibleTools: number;
  hiddenTools: number;
  visibleToolNames: string[];
  hiddenToolNames: string[];
};

export type MobigentToolCallMetric = "started" | "succeeded" | "failed" | "denied" | "timedOut" | "deduplicated";

export type MobigentToolCallMetricCounts = Record<MobigentToolCallMetric, number>;

export type MobigentMetrics = {
  status: MobigentGatewayStatus;
  auditEvents: Record<string, number>;
  toolCalls: MobigentToolCallMetricCounts;
  byTool: Record<string, MobigentToolCallMetricCounts>;
  byAgent: Record<string, MobigentToolCallMetricCounts>;
};

export type MobigentAuditEvent = {
  id: string;
  at: string;
  type: string;
  severity: "info" | "warn" | "error";
  message: string;
  sessionId?: string;
  app?: {
    id: string;
    name: string;
  };
  tool?: string;
  agentId?: string;
  durationMs?: number;
  details?: Record<string, unknown>;
};

export type MobigentAppSession = {
  sessionId: string;
  connectedAt: string;
  lastSeenAt: string;
  ageMs: number;
  idleMs: number;
  authenticated: boolean;
  app?: {
    id: string;
    name: string;
    sdk: "ios" | "android" | "react-native";
    version: string;
    protocolVersion: number;
    protocolCompatible: boolean;
  };
  capabilities: {
    actions: number;
    resources: number;
    components: number;
    tools: number;
  };
  manifest?: {
    acceptedAt: string;
    signed: boolean;
    keyId?: string;
  };
};

export type MobigentHttpClientOptions = {
  baseUrl: string;
  apiKey?: string;
  auth?: "none" | "bearer" | "api-key";
  agentId?: string;
  headers?: Record<string, string>;
  requestId?: string | (() => string);
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  fetch?: typeof fetch;
};

export type MobigentToolCallOptions = {
  agentId?: string;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  requestId?: string;
  timeoutMs?: number;
};

export type MobigentToolChangeEvent = {
  reason: "snapshot" | "changed";
  tools: MobigentHttpTool[];
};

export type MobigentToolStreamOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type MobigentAuditListOptions = {
  limit?: number;
  headers?: Record<string, string>;
};

export type MobigentAgentVisibilityOptions = {
  agentId?: string | string[];
};

export type MobigentAuditStreamOptions = {
  replay?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type MobigentWaitForToolsOptions = {
  minTools?: number;
  timeoutMs?: number;
  intervalMs?: number;
  signal?: AbortSignal;
};

export type MobigentReadinessOptions = {
  minApps?: number;
  minTools?: number;
};

export type MobigentWaitForReadinessOptions = MobigentReadinessOptions & {
  timeoutMs?: number;
  intervalMs?: number;
  signal?: AbortSignal;
};

export type MobigentProviderDiagnosticStatus = "pass" | "warn" | "fail";

export type MobigentProviderDiagnosticCheck = {
  name: string;
  status: MobigentProviderDiagnosticStatus;
  message: string;
  details?: unknown;
};

export type MobigentProviderDiagnosticsOptions = MobigentReadinessOptions & {
  expectedProvider?: string;
  auditLimit?: number;
};

export type MobigentProviderDiagnostics = {
  ok: boolean;
  status: MobigentProviderDiagnosticStatus;
  checks: MobigentProviderDiagnosticCheck[];
  summary: {
    apps: number;
    tools: number;
    providers: number;
    auditEvents: number;
  };
};

export type MobigentProviderDiagnosticsFormatOptions = {
  includeDetails?: boolean;
};

export type MobigentHttpClient = {
  getConfig: () => Promise<MobigentGatewayConfig>;
  getHealth: () => Promise<MobigentHealth>;
  getReadiness: (options?: MobigentReadinessOptions) => Promise<MobigentReadiness>;
  getSnapshot: () => Promise<MobigentGatewaySnapshot>;
  getMetrics: () => Promise<MobigentMetrics>;
  listAuditEvents: (options?: MobigentAuditListOptions) => Promise<MobigentAuditEvent[]>;
  listApps: () => Promise<MobigentAppSession[]>;
  listAgentVisibility: (options?: MobigentAgentVisibilityOptions) => Promise<MobigentAgentVisibility[]>;
  listProviders: () => Promise<ProviderDescriptor[]>;
  listTools: () => Promise<MobigentHttpTool[]>;
  getTool: (toolName: string) => Promise<MobigentHttpTool>;
  callTool: (
    toolName: string,
    input?: Record<string, unknown>,
    options?: MobigentToolCallOptions
  ) => Promise<unknown>;
  watchAuditEvents: (options?: MobigentAuditStreamOptions) => AsyncIterable<MobigentAuditEvent>;
  watchTools: (options?: MobigentToolStreamOptions) => AsyncIterable<MobigentToolChangeEvent>;
  waitForReadiness: (options?: MobigentWaitForReadinessOptions) => Promise<MobigentReadiness>;
  waitForTools: (options?: MobigentWaitForToolsOptions) => Promise<MobigentHttpTool[]>;
  diagnose: (options?: MobigentProviderDiagnosticsOptions) => Promise<MobigentProviderDiagnostics>;
  headers: () => Record<string, string>;
};

export type MobigentHttpErrorCode =
  | "unauthorized"
  | "forbidden"
  | "invalid_input"
  | "not_found"
  | "rate_limited"
  | "conflict"
  | "timeout"
  | "gateway_error"
  | "network_error"
  | "invalid_response";

export class MobigentHttpError extends Error {
  readonly code: MobigentHttpErrorCode;
  readonly operation: MobigentHttpOperation;
  readonly status?: number;
  readonly body?: unknown;
  readonly retryable: boolean;

  constructor(options: {
    code: MobigentHttpErrorCode;
    operation: MobigentHttpOperation;
    message: string;
    status?: number;
    body?: unknown;
    retryable?: boolean;
    cause?: unknown;
  }) {
    super(options.message, { cause: options.cause });
    this.name = "MobigentHttpError";
    this.code = options.code;
    this.operation = options.operation;
    this.status = options.status;
    this.body = options.body;
    this.retryable = options.retryable ?? false;
  }
}

export type MobigentHttpOperation =
  | "getConfig"
  | "getHealth"
  | "getReadiness"
  | "getSnapshot"
  | "getMetrics"
  | "listAuditEvents"
  | "listApps"
  | "listAgentVisibility"
  | "listProviders"
  | "listTools"
  | "getTool"
  | "waitForReadiness"
  | "callTool"
  | "waitForTools"
  | "diagnose"
  | "watchAuditEvents"
  | "watchTools";

export type OpenAiToolDefinition = {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type ChatFunctionToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type AnthropicToolDefinition = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

export type GeminiFunctionDeclaration = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type BedrockToolSpecification = {
  toolSpec: {
    name: string;
    description: string;
    inputSchema: {
      json: Record<string, unknown>;
    };
  };
};

export type VercelAiSdkToolDefinition = {
  description: string;
  parameters: Record<string, unknown>;
  execute: (input?: Record<string, unknown>) => Promise<unknown>;
};

export type MobigentExecutableTool = {
  name: string;
  description: string;
  schema: Record<string, unknown>;
  execute: (input?: Record<string, unknown>) => Promise<unknown>;
};

export type LangChainToolDefinition = MobigentExecutableTool & {
  lc_namespace: ["mobigent", "tools"];
};

export type LlamaIndexToolDefinition = {
  metadata: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
  call: (input?: Record<string, unknown>) => Promise<unknown>;
};

export type MastraToolDefinition = {
  id: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (context: { input?: Record<string, unknown> } | Record<string, unknown>) => Promise<unknown>;
};

export type SemanticKernelFunctionDefinition = {
  pluginName: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  invoke: (input?: Record<string, unknown>) => Promise<unknown>;
};

export type CrewAiToolDefinition = {
  name: string;
  description: string;
  args_schema: Record<string, unknown>;
  run: (input?: Record<string, unknown>) => Promise<unknown>;
};

export type AutoGenToolDefinition = {
  name: string;
  description: string;
  schema: Record<string, unknown>;
  run: (input?: Record<string, unknown>) => Promise<unknown>;
};

export type HaystackToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  invoke: (input?: Record<string, unknown>) => Promise<unknown>;
};

export type MobigentToolNameMode = "preserve" | "provider-safe";

export type MobigentToolNameOptions = {
  mode?: MobigentToolNameMode;
  maxLength?: number;
  prefix?: string;
};

export type MobigentToolNameMapEntry = {
  originalName: string;
  providerName: string;
};

export type MobigentToolNameMap = {
  entries: MobigentToolNameMapEntry[];
  tools: MobigentHttpTool[];
  resolve: (providerName: string) => string;
};

export type MobigentResolvedToolCall = {
  id?: string;
  name: string;
  input: Record<string, unknown>;
};

export type MobigentToolCallResult = MobigentResolvedToolCall & {
  result?: unknown;
  error?: {
    message: string;
    code?: string;
    retryable?: boolean;
  };
};

export type MobigentToolResultFormat =
  | "openai-responses"
  | "chat-completions"
  | "anthropic-tool-use"
  | "google-gemini"
  | "aws-bedrock-converse"
  | "generic-agent";

export type MobigentFormattedToolCallResult =
  | {
      type: "function_call_output";
      call_id: string;
      output: string;
    }
  | {
      role: "tool";
      tool_call_id: string;
      content: string;
    }
  | {
      type: "tool_result";
      tool_use_id: string;
      content: string;
      is_error?: true;
    }
  | {
      functionResponse: {
        name: string;
        response: Record<string, unknown>;
      };
    }
  | {
      toolResult: {
        toolUseId: string;
        content: Array<{ json: Record<string, unknown> }>;
        status?: "success" | "error";
      };
    }
  | MobigentToolCallResult;

export type MobigentRuntimeToolDefinition =
  | OpenAiToolDefinition
  | ChatFunctionToolDefinition
  | AnthropicToolDefinition
  | GeminiFunctionDeclaration
  | BedrockToolSpecification
  | VercelAiSdkToolDefinition
  | MobigentExecutableTool
  | LangChainToolDefinition
  | LlamaIndexToolDefinition
  | MastraToolDefinition
  | SemanticKernelFunctionDefinition
  | CrewAiToolDefinition
  | AutoGenToolDefinition
  | HaystackToolDefinition;

export type MobigentProviderRuntimeKind =
  | "openai-responses"
  | "azure-openai"
  | "openai-compatible"
  | "openrouter"
  | "litellm"
  | "ollama"
  | "lm-studio"
  | "groq"
  | "perplexity"
  | "xai-grok"
  | "deepseek"
  | "together-ai"
  | "fireworks-ai"
  | "qwen-dashscope"
  | "nvidia-nim"
  | "cloudflare-ai-gateway"
  | "mistral"
  | "cohere"
  | "anthropic-tool-use"
  | "google-gemini"
  | "google-vertex-ai"
  | "aws-bedrock-converse"
  | "vercel-ai-sdk"
  | "langchain"
  | "llamaindex"
  | "mastra"
  | "semantic-kernel"
  | "crewai"
  | "autogen"
  | "haystack"
  | "generic-agent";

export type MobigentRuntimeToolsByKind = {
  "openai-responses": OpenAiToolDefinition[];
  "azure-openai": ChatFunctionToolDefinition[];
  "openai-compatible": ChatFunctionToolDefinition[];
  openrouter: ChatFunctionToolDefinition[];
  litellm: ChatFunctionToolDefinition[];
  ollama: ChatFunctionToolDefinition[];
  "lm-studio": ChatFunctionToolDefinition[];
  groq: ChatFunctionToolDefinition[];
  perplexity: ChatFunctionToolDefinition[];
  "xai-grok": ChatFunctionToolDefinition[];
  deepseek: ChatFunctionToolDefinition[];
  "together-ai": ChatFunctionToolDefinition[];
  "fireworks-ai": ChatFunctionToolDefinition[];
  "qwen-dashscope": ChatFunctionToolDefinition[];
  "nvidia-nim": ChatFunctionToolDefinition[];
  "cloudflare-ai-gateway": ChatFunctionToolDefinition[];
  mistral: ChatFunctionToolDefinition[];
  cohere: ChatFunctionToolDefinition[];
  "anthropic-tool-use": AnthropicToolDefinition[];
  "google-gemini": GeminiFunctionDeclaration[];
  "google-vertex-ai": GeminiFunctionDeclaration[];
  "aws-bedrock-converse": BedrockToolSpecification[];
  "vercel-ai-sdk": Record<string, VercelAiSdkToolDefinition>;
  langchain: LangChainToolDefinition[];
  llamaindex: LlamaIndexToolDefinition[];
  mastra: MastraToolDefinition[];
  "semantic-kernel": SemanticKernelFunctionDefinition[];
  crewai: CrewAiToolDefinition[];
  autogen: AutoGenToolDefinition[];
  haystack: HaystackToolDefinition[];
  "generic-agent": MobigentExecutableTool[];
};

export type MobigentRuntimeToolsForKind<Kind extends MobigentProviderRuntimeKind> =
  MobigentRuntimeToolsByKind[Kind];

export type MobigentProviderRuntimeOptions<Kind extends MobigentProviderRuntimeKind = MobigentProviderRuntimeKind> = {
  kind: Kind;
  client: MobigentHttpClient;
  waitForTools?: MobigentWaitForToolsOptions | false;
  tools?: MobigentHttpTool[];
  pluginName?: string;
  toolNames?: MobigentToolNameOptions;
};

export type MobigentProviderRuntimeStreamOptions<Kind extends MobigentProviderRuntimeKind = MobigentProviderRuntimeKind> = {
  kind: Kind;
  client: MobigentHttpClient;
  stream?: MobigentToolStreamOptions;
  pluginName?: string;
  toolNames?: MobigentToolNameOptions;
};

export type MobigentProviderRuntime<Kind extends MobigentProviderRuntimeKind = MobigentProviderRuntimeKind> = {
  kind: Kind;
  rawTools: MobigentHttpTool[];
  toolNameMap: MobigentToolNameMap;
  tools: MobigentRuntimeToolsForKind<Kind>;
  executeTool: (toolName: string, input?: Record<string, unknown>) => Promise<unknown>;
  resolveToolCall: (toolCall: unknown) => MobigentResolvedToolCall;
  executeToolCall: (toolCall: unknown) => Promise<MobigentToolCallResult>;
  executeToolCalls: (toolCalls: Iterable<unknown>) => Promise<MobigentToolCallResult[]>;
  formatToolCallResult: (result: MobigentToolCallResult) => MobigentFormattedToolCallResult;
  formatToolCallResults: (results: Iterable<MobigentToolCallResult>) => MobigentFormattedToolCallResult[];
};

export type MobigentProviderRuntimeChangeEvent<Kind extends MobigentProviderRuntimeKind = MobigentProviderRuntimeKind> = MobigentProviderRuntime<Kind> & {
  reason: MobigentToolChangeEvent["reason"];
};

export type MobigentProviderRuntimeReport = {
  kind: MobigentProviderRuntimeKind;
  toolCount: number;
  resultFormat: MobigentToolResultFormat;
  rawToolNames: string[];
  providerToolNames: string[];
  toolNameMap: MobigentToolNameMapEntry[];
};

export type MobigentRuntimeBootstrapEnv = Record<string, string | undefined>;

export type MobigentProviderRuntimeBootstrapOptions<
  Kind extends MobigentProviderRuntimeKind = MobigentProviderRuntimeKind
> = {
  env?: MobigentRuntimeBootstrapEnv;
  kind?: Kind;
  baseUrl?: string;
  auth?: MobigentHttpClientOptions["auth"];
  apiKey?: string;
  agentId?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  requestId?: string | (() => string);
  fetch?: typeof fetch;
  minApps?: number;
  minTools?: number;
  waitTimeoutMs?: number;
  waitIntervalMs?: number;
  waitForReadiness?: boolean;
  waitForTools?: MobigentWaitForToolsOptions | false;
  pluginName?: string;
  toolNames?: MobigentToolNameOptions;
};

export type MobigentProviderRuntimeBootstrap<Kind extends MobigentProviderRuntimeKind = MobigentProviderRuntimeKind> = {
  kind: Kind;
  client: MobigentHttpClient;
  readiness?: MobigentReadiness;
  runtime: MobigentProviderRuntime<Kind>;
};

export type MobigentProviderRuntimeConfig<Kind extends MobigentProviderRuntimeKind = MobigentProviderRuntimeKind> = {
  kind: Kind;
  baseUrl: string;
  auth: MobigentHttpClientOptions["auth"];
  apiKey?: string;
  agentId: string;
  timeoutMs: number;
  retries: number;
  retryDelayMs: number;
  minApps: number;
  minTools: number;
  waitTimeoutMs: number;
  waitIntervalMs: number;
  watchTools: boolean;
};

export type MobigentProviderRuntimeConfigStatus = "pass" | "warn" | "fail";

export type MobigentProviderRuntimeConfigCheck = {
  name: string;
  status: MobigentProviderRuntimeConfigStatus;
  message: string;
  details?: unknown;
};

export type MobigentProviderRuntimeConfigReport<
  Kind extends MobigentProviderRuntimeKind = MobigentProviderRuntimeKind
> = {
  status: MobigentProviderRuntimeConfigStatus;
  config?: MobigentProviderRuntimeConfig<Kind>;
  checks: MobigentProviderRuntimeConfigCheck[];
  errors: string[];
};

const mcpCapabilities: ProviderCapabilities = {
  transport: "stdio",
  supportsTools: true,
  supportsDynamicTools: true,
  requiresPublicUrl: false,
  supportsConfirmationNotes: true
};

const openApiCapabilities: ProviderCapabilities = {
  transport: "openapi",
  supportsTools: true,
  supportsDynamicTools: false,
  requiresPublicUrl: true,
  supportsConfirmationNotes: true
};

const httpAgentCapabilities: ProviderCapabilities = {
  transport: "http",
  supportsTools: true,
  supportsDynamicTools: true,
  requiresPublicUrl: false,
  supportsConfirmationNotes: true
};

export function createMcpStdioProvider(options: McpStdioOptions = {}): ProviderDescriptor {
  return {
    id: "mcp-stdio",
    kind: "mcp-stdio",
    name: "MCP stdio",
    description: "Connect MCP-compatible agents to Mobigent through a local stdio server.",
    docsUrl: "https://modelcontextprotocol.io",
    capabilities: mcpCapabilities,
    setup: {
      command: options.command ?? "mobigent-mcp",
      args: options.args ?? [],
      env: options.env ?? {}
    }
  };
}

export function createClaudeDesktopProvider(options: McpStdioOptions = {}): ProviderDescriptor {
  const mcp = createMcpStdioProvider(options);

  return {
    id: "claude-desktop",
    kind: "claude-desktop",
    name: "Claude Desktop",
    description: "Claude Desktop configuration using Mobigent's MCP stdio server.",
    docsUrl: "https://modelcontextprotocol.io",
    capabilities: mcpCapabilities,
    setup: {
      mcpServers: {
        mobigent: {
          command: mcp.setup.command,
          args: mcp.setup.args,
          env: mcp.setup.env
        }
      }
    }
  };
}

export function createCursorProvider(options: McpStdioOptions = {}): ProviderDescriptor {
  const mcp = createMcpStdioProvider(options);

  return {
    id: "cursor",
    kind: "cursor",
    name: "Cursor",
    description: "Cursor MCP configuration using Mobigent's MCP stdio server.",
    docsUrl: "https://docs.cursor.com/context/model-context-protocol",
    capabilities: mcpCapabilities,
    setup: {
      mcpServers: {
        mobigent: {
          command: mcp.setup.command,
          args: mcp.setup.args,
          env: mcp.setup.env
        }
      }
    }
  };
}

export function createVsCodeProvider(options: McpStdioOptions = {}): ProviderDescriptor {
  const mcp = createMcpStdioProvider(options);

  return {
    id: "vscode",
    kind: "vscode",
    name: "VS Code",
    description: "VS Code MCP server configuration using Mobigent's MCP stdio server.",
    docsUrl: "https://code.visualstudio.com/docs/copilot/chat/mcp-servers",
    capabilities: mcpCapabilities,
    setup: {
      servers: {
        mobigent: {
          type: "stdio",
          command: mcp.setup.command,
          args: mcp.setup.args,
          env: mcp.setup.env
        }
      }
    }
  };
}

export function createOpenApiProvider(options: OpenApiOptions): ProviderDescriptor {
  const schemaPath = options.schemaPath ?? "/openapi.json";

  return {
    id: "openapi",
    kind: "openapi",
    name: "OpenAPI",
    description: "Generic OpenAPI provider for REST/action-based agent platforms.",
    docsUrl: "https://spec.openapis.org/oas/latest.html",
    capabilities: openApiCapabilities,
    setup: {
      baseUrl: options.baseUrl,
      openApiUrl: `${trimTrailingSlash(options.baseUrl)}${schemaPath}`,
      auth: options.auth ?? "none"
    }
  };
}

export function createChatGptActionsProvider(options: OpenApiOptions): ProviderDescriptor {
  return {
    ...createOpenApiProvider(options),
    id: "chatgpt-actions",
    kind: "chatgpt-actions",
    name: "ChatGPT Actions",
    description: "ChatGPT Custom GPT Actions configuration using Mobigent's OpenAPI schema.",
    docsUrl: "https://platform.openai.com/docs/actions"
  };
}

export function createOpenAiResponsesProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "openai-responses");

  return {
    id: "openai-responses",
    kind: "openai-responses",
    name: "OpenAI Responses API",
    description: "Server-side OpenAI Responses integration using Mobigent HTTP tools.",
    docsUrl: "https://platform.openai.com/docs/guides/tools",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter: "Map /tools into OpenAI function tools, then POST tool calls to /tools/{toolName}/call.",
      example: [
        "const tools = await fetch(`${baseUrl}/tools`, { headers }).then((res) => res.json());",
        "const openAiTools = tools.tools.map((tool) => ({",
        "  type: 'function',",
        "  name: tool.name,",
        "  description: tool.description,",
        "  parameters: tool.inputSchema",
        "}));"
      ].join("\n")
    }
  };
}

export function createAzureOpenAiProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "azure-openai");

  return {
    id: "azure-openai",
    kind: "azure-openai",
    name: "Azure OpenAI",
    description: "Azure OpenAI chat tool-calling adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://learn.microsoft.com/azure/ai-services/openai/how-to/function-calling",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter:
        "Map /tools into Azure OpenAI chat function tools, then execute tool_calls through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const azureOpenAiTools = toChatFunctionTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createOpenAiCompatibleProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "openai-compatible");

  return {
    id: "openai-compatible",
    kind: "openai-compatible",
    name: "OpenAI-compatible",
    description:
      "Generic OpenAI-compatible chat function-calling adapter metadata for private gateways and model providers.",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter:
        "Map /tools into OpenAI-compatible chat function tools, then execute tool_calls through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const openAiCompatibleTools = toChatFunctionTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createOpenRouterProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "openrouter");

  return {
    id: "openrouter",
    kind: "openrouter",
    name: "OpenRouter",
    description: "OpenRouter tool-calling adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://openrouter.ai/docs/guides/features/tool-calling",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter: "Map /tools into OpenAI-compatible chat function tools, then execute tool_calls through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const openRouterTools = toChatFunctionTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createLiteLlmProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "litellm");

  return {
    id: "litellm",
    kind: "litellm",
    name: "LiteLLM",
    description: "LiteLLM proxy adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://docs.litellm.ai/docs/completion/function_call",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter:
        "Map /tools into OpenAI-compatible chat function tools for LiteLLM, then execute tool_calls through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const liteLlmTools = toChatFunctionTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createOllamaProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "ollama");

  return {
    id: "ollama",
    kind: "ollama",
    name: "Ollama",
    description: "Local Ollama tool-calling adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://docs.ollama.com/capabilities/tool-calling",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter:
        "Map /tools into Ollama chat function tools, then execute returned tool_calls through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const ollamaTools = toChatFunctionTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createLmStudioProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "lm-studio");

  return {
    id: "lm-studio",
    kind: "lm-studio",
    name: "LM Studio",
    description: "Local LM Studio OpenAI-compatible tool-use adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://lmstudio.ai/docs/app/api/tools",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter:
        "Map /tools into LM Studio OpenAI-compatible chat function tools, then execute tool_calls through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const lmStudioTools = toChatFunctionTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createGroqProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "groq");

  return {
    id: "groq",
    kind: "groq",
    name: "Groq",
    description: "Groq local tool-calling adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://console.groq.com/docs/tool-use/local-tool-calling",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter:
        "Map /tools into Groq OpenAI-compatible chat function tools, then execute returned tool_calls through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const groqTools = toChatFunctionTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createPerplexityProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "perplexity");

  return {
    id: "perplexity",
    kind: "perplexity",
    name: "Perplexity",
    description: "Perplexity Agent API function-calling adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://docs.perplexity.ai/docs/grounded-llm/responses/tools/function-calling",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter:
        "Map /tools into Perplexity function-calling tools, then execute returned function_call items through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const perplexityTools = toChatFunctionTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createXaiGrokProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "xai-grok");

  return {
    id: "xai-grok",
    kind: "xai-grok",
    name: "xAI Grok",
    description: "xAI Grok OpenAI-compatible tool-calling adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://docs.x.ai/developers/tools/function-calling",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter:
        "Map /tools into xAI Grok OpenAI-compatible chat function tools, then execute tool_calls through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const grokTools = toChatFunctionTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createDeepSeekProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "deepseek");

  return {
    id: "deepseek",
    kind: "deepseek",
    name: "DeepSeek",
    description: "DeepSeek OpenAI-compatible function-calling adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://api-docs.deepseek.com/guides/function_calling/",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter:
        "Map /tools into DeepSeek OpenAI-compatible chat function tools, then execute tool_calls through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const deepSeekTools = toChatFunctionTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createTogetherAiProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "together-ai");

  return {
    id: "together-ai",
    kind: "together-ai",
    name: "Together AI",
    description: "Together AI OpenAI-compatible function-calling adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://docs.together.ai/docs/inference/function-calling/overview",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter:
        "Map /tools into Together AI OpenAI-compatible chat function tools, then execute tool_calls through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const togetherTools = toChatFunctionTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createFireworksAiProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "fireworks-ai");

  return {
    id: "fireworks-ai",
    kind: "fireworks-ai",
    name: "Fireworks AI",
    description: "Fireworks AI OpenAI-compatible tool-calling adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://docs.fireworks.ai/guides/function-calling",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter:
        "Map /tools into Fireworks AI OpenAI-compatible chat function tools, then execute tool_calls through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const fireworksTools = toChatFunctionTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createQwenDashScopeProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "qwen-dashscope");

  return {
    id: "qwen-dashscope",
    kind: "qwen-dashscope",
    name: "Qwen DashScope",
    description: "Alibaba Cloud DashScope Qwen OpenAI-compatible tool-calling adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://www.alibabacloud.com/help/en/model-studio/function-calling",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter:
        "Map /tools into Qwen DashScope OpenAI-compatible chat function tools, then execute tool_calls through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const qwenTools = toChatFunctionTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createNvidiaNimProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "nvidia-nim");

  return {
    id: "nvidia-nim",
    kind: "nvidia-nim",
    name: "NVIDIA NIM",
    description: "NVIDIA NIM OpenAI-compatible function-calling adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://docs.nvidia.com/nim/large-language-models/latest/function-calling.html",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter:
        "Map /tools into NVIDIA NIM OpenAI-compatible chat function tools, then execute tool_calls through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const nvidiaTools = toChatFunctionTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createCloudflareAiGatewayProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "cloudflare-ai-gateway");

  return {
    id: "cloudflare-ai-gateway",
    kind: "cloudflare-ai-gateway",
    name: "Cloudflare AI Gateway",
    description: "Cloudflare AI Gateway OpenAI-compatible tool-calling adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://developers.cloudflare.com/ai-gateway/",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter:
        "Map /tools into OpenAI-compatible chat function tools before calling models through Cloudflare AI Gateway, then execute tool_calls through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const cloudflareTools = toChatFunctionTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createMistralProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "mistral");

  return {
    id: "mistral",
    kind: "mistral",
    name: "Mistral AI",
    description: "Mistral function-calling adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://docs.mistral.ai/capabilities/function_calling",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter: "Map /tools into Mistral chat function tools, then execute tool_calls through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const mistralTools = toChatFunctionTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createCohereProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "cohere");

  return {
    id: "cohere",
    kind: "cohere",
    name: "Cohere",
    description: "Cohere Chat v2 tool-use adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://docs.cohere.com/v2/docs/tool-use-overview",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter: "Map /tools into Cohere function tools, then execute tool calls through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const cohereTools = toChatFunctionTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createAnthropicToolUseProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "anthropic-tool-use");

  return {
    id: "anthropic-tool-use",
    kind: "anthropic-tool-use",
    name: "Anthropic Tool Use",
    description: "Server-side Anthropic tool-use integration using Mobigent HTTP tools.",
    docsUrl: "https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter: "Map /tools into Anthropic tools, then POST tool_use input to /tools/{toolName}/call.",
      example: [
        "const tools = await fetch(`${baseUrl}/tools`, { headers }).then((res) => res.json());",
        "const anthropicTools = tools.tools.map((tool) => ({",
        "  name: tool.name,",
        "  description: tool.description,",
        "  input_schema: tool.inputSchema",
        "}));"
      ].join("\n")
    }
  };
}

export function createGoogleGeminiProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "google-gemini");

  return {
    id: "google-gemini",
    kind: "google-gemini",
    name: "Google Gemini",
    description: "Google Gemini function-calling adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://ai.google.dev/gemini-api/docs/function-calling",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter: "Map /tools into Gemini functionDeclarations, then execute functionCall args through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const functionDeclarations = toGeminiFunctionDeclarations(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createGoogleVertexAiProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "google-vertex-ai");

  return {
    id: "google-vertex-ai",
    kind: "google-vertex-ai",
    name: "Google Vertex AI",
    description: "Google Vertex AI Gemini function-calling adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter:
        "Map /tools into Gemini functionDeclarations for Vertex AI, then execute functionCall args through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const functionDeclarations = toGeminiFunctionDeclarations(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createAwsBedrockConverseProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "aws-bedrock-converse");

  return {
    id: "aws-bedrock-converse",
    kind: "aws-bedrock-converse",
    name: "AWS Bedrock Converse",
    description: "AWS Bedrock Converse API tool-use adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference-call.html",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter: "Map /tools into Bedrock toolConfig.tools[].toolSpec entries, then execute toolUse input through /tools/{toolName}/call.",
      example: [
        "const tools = await client.listTools();",
        "const bedrockTools = toBedrockToolConfigTools(tools);",
        "const executeMobigentTool = createMobigentToolExecutor(client);"
      ].join("\n")
    }
  };
}

export function createVercelAiSdkProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "vercel-ai-sdk");

  return {
    id: "vercel-ai-sdk",
    kind: "vercel-ai-sdk",
    name: "Vercel AI SDK",
    description: "Vercel AI SDK tool adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://ai-sdk.dev/docs",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter: "Create AI SDK tools from /tools and execute each tool through /tools/{toolName}/call.",
      npm: ["ai"]
    }
  };
}

export function createLangChainProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "langchain");

  return {
    id: "langchain",
    kind: "langchain",
    name: "LangChain",
    description: "LangChain DynamicStructuredTool adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://js.langchain.com/docs/how_to/custom_tools/",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter: "Create one DynamicStructuredTool per /tools entry and call /tools/{toolName}/call in the tool function.",
      npm: ["@langchain/core", "zod", "json-schema-to-zod"]
    }
  };
}

export function createLlamaIndexProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "llamaindex");

  return {
    id: "llamaindex",
    kind: "llamaindex",
    name: "LlamaIndex",
    description: "LlamaIndex FunctionTool adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://ts.llamaindex.ai/docs/llamaindex/modules/agents/tools",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter: "Create one FunctionTool per /tools entry and call /tools/{toolName}/call from each tool handler."
    }
  };
}

export function createMastraProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "mastra");

  return {
    id: "mastra",
    kind: "mastra",
    name: "Mastra",
    description: "Mastra tool adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://mastra.ai/docs",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter: "Create Mastra tools from /tools and execute them through /tools/{toolName}/call."
    }
  };
}

export function createSemanticKernelProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "semantic-kernel");

  return {
    id: "semantic-kernel",
    kind: "semantic-kernel",
    name: "Semantic Kernel",
    description: "Microsoft Semantic Kernel plugin/function adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://learn.microsoft.com/en-us/semantic-kernel/concepts/plugins/",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter: "Create Semantic Kernel plugin functions from /tools and invoke /tools/{toolName}/call from each function handler.",
      pluginName: "Mobigent",
      dotnet: ["Microsoft.SemanticKernel"],
      python: ["semantic-kernel"]
    }
  };
}

export function createCrewAiProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "crewai");

  return {
    id: "crewai",
    kind: "crewai",
    name: "CrewAI",
    description: "CrewAI custom tool adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://docs.crewai.com/en/concepts/tools",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter: "Create CrewAI tools from /tools and run each tool by calling /tools/{toolName}/call.",
      python: ["crewai", "crewai-tools", "pydantic"]
    }
  };
}

export function createAutoGenProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "autogen");

  return {
    id: "autogen",
    kind: "autogen",
    name: "Microsoft AutoGen",
    description: "AutoGen FunctionTool adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/components/tools.html",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter: "Create AutoGen FunctionTool wrappers from /tools and execute them through /tools/{toolName}/call.",
      python: ["autogen-core"]
    }
  };
}

export function createHaystackProvider(options: HttpAgentOptions): ProviderDescriptor {
  const setup = createHttpAgentSetup(options, "haystack");

  return {
    id: "haystack",
    kind: "haystack",
    name: "Haystack",
    description: "Haystack Tool/ToolInvoker adapter metadata for Mobigent HTTP tools.",
    docsUrl: "https://docs.haystack.deepset.ai/docs/tool",
    capabilities: httpAgentCapabilities,
    setup: {
      ...setup,
      adapter: "Create Haystack Tool wrappers from /tools and invoke /tools/{toolName}/call from each tool function.",
      python: ["haystack-ai"]
    }
  };
}

export function createMobigentHttpClient(
  options: MobigentHttpClientOptions
): MobigentHttpClient {
  const baseUrl = trimTrailingSlash(options.baseUrl);
  const request = options.fetch ?? fetch;
  const retries = options.retries ?? 0;
  const retryDelayMs = options.retryDelayMs ?? 250;

  if (!request) {
    throw new Error("A fetch implementation is required.");
  }

  const headers = () => createHttpHeaders(options);

  return {
    headers,
    async getConfig() {
      const response = await requestWithRetries(
        request,
        `${baseUrl}/config`,
        () => ({
          method: "GET",
          headers: headers()
        }),
        retries,
        retryDelayMs,
        "getConfig"
      );
      const body = await readJson(response);
      if (!response.ok) {
        throw createHttpError("getConfig", response.status, body);
      }
      if (!isGatewayConfig(body)) {
        throw new MobigentHttpError({
          code: "invalid_response",
          operation: "getConfig",
          message: "Mobigent gateway config returned an invalid response.",
          body
        });
      }
      return body;
    },
    async getHealth() {
      const response = await requestWithRetries(
        request,
        `${baseUrl}/health`,
        () => ({
          method: "GET",
          headers: headers()
        }),
        retries,
        retryDelayMs,
        "getHealth"
      );
      const body = await readJson(response);
      if (!response.ok) {
        throw createHttpError("getHealth", response.status, body);
      }
      if (!isHealthBody(body)) {
        throw new MobigentHttpError({
          code: "invalid_response",
          operation: "getHealth",
          message: "Mobigent health check returned an invalid response.",
          body
        });
      }
      return body;
    },
    async getReadiness(readinessOptions = {}) {
      const params = new URLSearchParams();
      if (readinessOptions.minApps !== undefined) {
        params.set("minApps", String(readinessOptions.minApps));
      }
      if (readinessOptions.minTools !== undefined) {
        params.set("minTools", String(readinessOptions.minTools));
      }

      const response = await requestWithRetries(
        request,
        `${baseUrl}/ready${params.size ? `?${params.toString()}` : ""}`,
        () => ({
          method: "GET",
          headers: headers()
        }),
        retries,
        retryDelayMs,
        "getReadiness"
      );
      const body = await readJson(response);
      if (response.status !== 503 && !response.ok) {
        throw createHttpError("getReadiness", response.status, body);
      }
      if (!isReadinessBody(body)) {
        throw new MobigentHttpError({
          code: "invalid_response",
          operation: "getReadiness",
          message: "Mobigent readiness check returned an invalid response.",
          body
        });
      }
      return body;
    },
    async getSnapshot() {
      const response = await requestWithRetries(
        request,
        `${baseUrl}/snapshot`,
        () => ({
          method: "GET",
          headers: headers()
        }),
        retries,
        retryDelayMs,
        "getSnapshot"
      );
      const body = await readJson(response);
      if (!response.ok) {
        throw createHttpError("getSnapshot", response.status, body);
      }
      if (!isGatewaySnapshot(body)) {
        throw new MobigentHttpError({
          code: "invalid_response",
          operation: "getSnapshot",
          message: "Mobigent gateway snapshot returned an invalid response.",
          body
        });
      }
      return body;
    },
    async getMetrics() {
      const response = await requestWithRetries(
        request,
        `${baseUrl}/metrics`,
        () => ({
          method: "GET",
          headers: headers()
        }),
        retries,
        retryDelayMs,
        "getMetrics"
      );
      const body = await readJson(response);
      if (!response.ok) {
        throw createHttpError("getMetrics", response.status, body);
      }
      if (!isMetricsBody(body)) {
        throw new MobigentHttpError({
          code: "invalid_response",
          operation: "getMetrics",
          message: "Mobigent metrics returned an invalid response.",
          body
        });
      }
      return body.metrics;
    },
    async listAuditEvents(auditOptions = {}) {
      const url = auditOptions.limit
        ? `${baseUrl}/audit?limit=${encodeURIComponent(String(auditOptions.limit))}`
        : `${baseUrl}/audit`;
      const response = await requestWithRetries(
        request,
        url,
        () => ({
          method: "GET",
          headers: createHttpHeaders({
            ...options,
            headers: {
              ...options.headers,
              ...auditOptions.headers
            }
          })
        }),
        retries,
        retryDelayMs,
        "listAuditEvents"
      );
      const body = await readJson(response);
      if (!response.ok) {
        throw createHttpError("listAuditEvents", response.status, body);
      }
      if (!isAuditListBody(body)) {
        throw new MobigentHttpError({
          code: "invalid_response",
          operation: "listAuditEvents",
          message: "Mobigent audit log returned an invalid response.",
          body
        });
      }
      return body.events;
    },
    async listApps() {
      const response = await requestWithRetries(
        request,
        `${baseUrl}/apps`,
        () => ({
          method: "GET",
          headers: headers()
        }),
        retries,
        retryDelayMs,
        "listApps"
      );
      const body = await readJson(response);
      if (!response.ok) {
        throw createHttpError("listApps", response.status, body);
      }
      if (!isAppListBody(body)) {
        throw new MobigentHttpError({
          code: "invalid_response",
          operation: "listApps",
          message: "Mobigent app discovery returned an invalid response.",
          body
        });
      }
      return body.apps;
    },
    async listAgentVisibility(visibilityOptions = {}) {
      const agentIds = Array.isArray(visibilityOptions.agentId)
        ? visibilityOptions.agentId
        : visibilityOptions.agentId
          ? [visibilityOptions.agentId]
          : [];
      const params = new URLSearchParams();
      for (const agentId of agentIds) {
        params.append("agentId", agentId);
      }
      const response = await requestWithRetries(
        request,
        `${baseUrl}/agents${params.size ? `?${params.toString()}` : ""}`,
        () => ({
          method: "GET",
          headers: headers()
        }),
        retries,
        retryDelayMs,
        "listAgentVisibility"
      );
      const body = await readJson(response);
      if (!response.ok) {
        throw createHttpError("listAgentVisibility", response.status, body);
      }
      if (!isAgentVisibilityListBody(body)) {
        throw new MobigentHttpError({
          code: "invalid_response",
          operation: "listAgentVisibility",
          message: "Mobigent agent visibility returned an invalid response.",
          body
        });
      }
      return body.agents;
    },
    async listProviders() {
      const response = await requestWithRetries(
        request,
        `${baseUrl}/providers`,
        () => ({
          method: "GET",
          headers: headers()
        }),
        retries,
        retryDelayMs,
        "listProviders"
      );
      const body = await readJson(response);
      if (!response.ok) {
        throw createHttpError("listProviders", response.status, body);
      }
      if (!isProviderListBody(body)) {
        throw new MobigentHttpError({
          code: "invalid_response",
          operation: "listProviders",
          message: "Mobigent provider discovery returned an invalid response.",
          body
        });
      }
      return body.providers;
    },
    async listTools() {
      const response = await requestWithRetries(
        request,
        `${baseUrl}/tools`,
        () => ({
          method: "GET",
          headers: headers()
        }),
        retries,
        retryDelayMs,
        "listTools"
      );
      const body = await readJson(response);
      if (!response.ok) {
        throw createHttpError("listTools", response.status, body);
      }
      if (!isToolListBody(body)) {
        throw new MobigentHttpError({
          code: "invalid_response",
          operation: "listTools",
          message: "Mobigent tool discovery returned an invalid response.",
          body
        });
      }
      return body.tools;
    },
    async getTool(toolName) {
      const response = await requestWithRetries(
        request,
        `${baseUrl}/tools/${encodeURIComponent(toolName)}`,
        () => ({
          method: "GET",
          headers: headers()
        }),
        retries,
        retryDelayMs,
        "getTool"
      );
      const body = await readJson(response);
      if (!response.ok) {
        throw createHttpError("getTool", response.status, body);
      }
      if (!isToolBody(body)) {
        throw new MobigentHttpError({
          code: "invalid_response",
          operation: "getTool",
          message: "Mobigent tool lookup returned an invalid response.",
          body
        });
      }
      return body.tool;
    },
    async waitForReadiness(waitOptions = {}) {
      const timeoutMs = waitOptions.timeoutMs ?? 30_000;
      const intervalMs = waitOptions.intervalMs ?? 500;
      const startedAt = Date.now();

      while (true) {
        throwIfAborted(waitOptions.signal, "waitForReadiness");
        const readiness = await this.getReadiness({
          minApps: waitOptions.minApps,
          minTools: waitOptions.minTools
        });
        if (readiness.ok) {
          return readiness;
        }

        const elapsedMs = Date.now() - startedAt;
        const remainingMs = timeoutMs - elapsedMs;
        if (remainingMs <= 0) {
          throw new MobigentHttpError({
            code: "gateway_error",
            operation: "waitForReadiness",
            message: `Timed out waiting for Mobigent readiness: ${formatReadiness(readiness)}.`,
            retryable: true,
            body: readiness
          });
        }

        await delayWithSignal(Math.min(intervalMs, remainingMs), waitOptions.signal, "waitForReadiness");
      }
    },
    async waitForTools(waitOptions = {}) {
      const minTools = waitOptions.minTools ?? 1;
      const timeoutMs = waitOptions.timeoutMs ?? 30_000;
      const intervalMs = waitOptions.intervalMs ?? 500;
      const startedAt = Date.now();

      while (true) {
        throwIfAborted(waitOptions.signal, "waitForTools");
        const tools = await this.listTools();
        if (tools.length >= minTools) {
          return tools;
        }

        const elapsedMs = Date.now() - startedAt;
        const remainingMs = timeoutMs - elapsedMs;
        if (remainingMs <= 0) {
          throw new MobigentHttpError({
            code: "gateway_error",
            operation: "waitForTools",
            message: `Timed out waiting for at least ${minTools} Mobigent tool${minTools === 1 ? "" : "s"}.`,
            retryable: true
          });
        }

        await delayWithSignal(Math.min(intervalMs, remainingMs), waitOptions.signal, "waitForTools");
      }
    },
    async callTool(toolName, input = {}, callOptions = {}) {
      const response = await requestWithRetries(
        request,
        `${baseUrl}/tools/${encodeURIComponent(toolName)}/call`,
        () => ({
          method: "POST",
          headers: createHttpHeaders(options, callOptions),
          body: JSON.stringify(input)
        }),
        retries,
        retryDelayMs,
        "callTool"
      );
      const body = await readJson(response);
      if (!response.ok) {
        throw createHttpError("callTool", response.status, body);
      }
      if (!isToolCallBody(body)) {
        throw new MobigentHttpError({
          code: "invalid_response",
          operation: "callTool",
          message: "Mobigent tool call returned an invalid response.",
          body
        });
      }
      return body.result;
    },
    async diagnose(diagnosticOptions = {}) {
      return diagnoseMobigentProvider(this, diagnosticOptions);
    },
    watchTools(streamOptions = {}) {
      return watchToolStream(
        request,
        `${baseUrl}/tools/stream`,
        {
          ...options,
          headers: {
            ...options.headers,
            ...streamOptions.headers
          }
        },
        streamOptions.signal
      );
    },
    watchAuditEvents(streamOptions = {}) {
      const url = streamOptions.replay
        ? `${baseUrl}/audit/stream?replay=${encodeURIComponent(String(streamOptions.replay))}`
        : `${baseUrl}/audit/stream`;
      return watchAuditStream(
        request,
        url,
        {
          ...options,
          headers: {
            ...options.headers,
            ...streamOptions.headers
          }
        },
        streamOptions.signal
      );
    }
  };
}

export function toOpenAiTools(tools: MobigentHttpTool[]): OpenAiToolDefinition[] {
  return tools.map((tool) => ({
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema
  }));
}

export function toChatFunctionTools(tools: MobigentHttpTool[]): ChatFunctionToolDefinition[] {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }
  }));
}

export function toAnthropicTools(tools: MobigentHttpTool[]): AnthropicToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema
  }));
}

export function toGeminiFunctionDeclarations(tools: MobigentHttpTool[]): GeminiFunctionDeclaration[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema
  }));
}

export function toBedrockToolConfigTools(tools: MobigentHttpTool[]): BedrockToolSpecification[] {
  return tools.map((tool) => ({
    toolSpec: {
      name: tool.name,
      description: tool.description,
      inputSchema: {
        json: tool.inputSchema
      }
    }
  }));
}

export function createProviderSafeToolNameMap(
  tools: MobigentHttpTool[],
  options: Omit<MobigentToolNameOptions, "mode"> = {}
): MobigentToolNameMap {
  const maxLength = options.maxLength ?? 64;
  const prefix = sanitizeToolName(options.prefix ?? "tool", 32) || "tool";
  const used = new Set<string>();
  const entries = tools.map((tool) => {
    const providerName = createUniqueProviderToolName(tool.name, used, {
      maxLength,
      prefix
    });
    return {
      originalName: tool.name,
      providerName
    };
  });
  const originalByProvider = new Map(entries.map((entry) => [entry.providerName, entry.originalName]));

  return {
    entries,
    tools: tools.map((tool, index) => ({
      ...tool,
      name: entries[index]?.providerName ?? tool.name
    })),
    resolve: (providerName) => originalByProvider.get(providerName) ?? providerName
  };
}

export function mapToolsForProviderNames(
  tools: MobigentHttpTool[],
  options: MobigentToolNameOptions = {}
): MobigentToolNameMap {
  if (options.mode !== "provider-safe") {
    const entries = tools.map((tool) => ({
      originalName: tool.name,
      providerName: tool.name
    }));
    return {
      entries,
      tools,
      resolve: (providerName) => providerName
    };
  }

  return createProviderSafeToolNameMap(tools, options);
}

export function createMobigentToolExecutor(
  client: MobigentHttpClient,
  options: { toolNames?: MobigentToolNameOptions | MobigentToolNameMap } = {}
) {
  const resolveToolName =
    options.toolNames && "resolve" in options.toolNames
      ? options.toolNames.resolve
      : options.toolNames?.mode === "provider-safe"
        ? createProviderSafeToolNameMap([], options.toolNames).resolve
      : (toolName: string) => toolName;

  return async (toolName: string, input: Record<string, unknown> = {}) => {
    return client.callTool(resolveToolName(toolName), input);
  };
}

export function resolveMobigentToolCall(toolCall: unknown): MobigentResolvedToolCall {
  if (!isPlainRecord(toolCall)) {
    throw new Error("Tool call must be an object.");
  }

  const id = readOptionalString(toolCall.id);
  const directName = readOptionalString(toolCall.name);
  const functionValue = isPlainRecord(toolCall.function) ? toolCall.function : undefined;
  const functionName = readOptionalString(functionValue?.name);
  const name = directName ?? functionName;

  if (!name) {
    throw new Error("Tool call is missing a tool name.");
  }

  const inputValue =
    "input" in toolCall
      ? toolCall.input
      : "arguments" in toolCall
        ? toolCall.arguments
        : functionValue && "arguments" in functionValue
          ? functionValue.arguments
          : undefined;

  return {
    ...(id ? { id } : {}),
    name,
    input: readToolCallInput(inputValue)
  };
}

export function createMobigentToolCallExecutor(
  executeTool: (toolName: string, input?: Record<string, unknown>) => Promise<unknown>
) {
  return async (toolCall: unknown): Promise<MobigentToolCallResult> => {
    const resolved = resolveMobigentToolCall(toolCall);

    try {
      return {
        ...resolved,
        result: await executeTool(resolved.name, resolved.input)
      };
    } catch (error) {
      return {
        ...resolved,
        error: formatToolCallError(error)
      };
    }
  };
}

export function formatMobigentToolCallResult(
  result: MobigentToolCallResult,
  format: MobigentToolResultFormat
): MobigentFormattedToolCallResult {
  const payload = createToolCallResultPayload(result);
  const content = JSON.stringify(payload);
  const callId = result.id ?? result.name;

  if (format === "openai-responses") {
    return {
      type: "function_call_output",
      call_id: callId,
      output: content
    };
  }

  if (format === "chat-completions") {
    return {
      role: "tool",
      tool_call_id: callId,
      content
    };
  }

  if (format === "anthropic-tool-use") {
    return removeUndefinedFields({
      type: "tool_result",
      tool_use_id: callId,
      content,
      is_error: result.error ? true : undefined
    });
  }

  if (format === "google-gemini") {
    return {
      functionResponse: {
        name: result.name,
        response: payload
      }
    };
  }

  if (format === "aws-bedrock-converse") {
    return {
      toolResult: removeUndefinedFields({
        toolUseId: callId,
        content: [{ json: payload }],
        status: result.error ? "error" : "success"
      })
    };
  }

  return result;
}

export function formatMobigentToolCallResults(
  results: Iterable<MobigentToolCallResult>,
  format: MobigentToolResultFormat
) {
  return Array.from(results, (result) => formatMobigentToolCallResult(result, format));
}

export async function createMobigentProviderRuntime<Kind extends MobigentProviderRuntimeKind>(
  options: MobigentProviderRuntimeOptions<Kind>
): Promise<MobigentProviderRuntime<Kind>> {
  const rawTools =
    options.tools ??
    (options.waitForTools === false
      ? await options.client.listTools()
      : await options.client.waitForTools(options.waitForTools));
  const nameMap = mapToolsForProviderNames(rawTools, options.toolNames);
  const executeTool = createMobigentToolExecutor(options.client, { toolNames: nameMap });
  const executeToolCall = createMobigentToolCallExecutor(executeTool);
  const resultFormat = resolveToolResultFormat(options.kind);

  return {
    kind: options.kind,
    rawTools,
    toolNameMap: nameMap,
    tools: createRuntimeTools(options.kind, nameMap.tools, options.client, {
      originalTools: rawTools,
      pluginName: options.pluginName
    }),
    executeTool,
    resolveToolCall: resolveMobigentToolCall,
    executeToolCall,
    executeToolCalls: (toolCalls) => Promise.all(Array.from(toolCalls, executeToolCall)),
    formatToolCallResult: (result) => formatMobigentToolCallResult(result, resultFormat),
    formatToolCallResults: (results) => formatMobigentToolCallResults(results, resultFormat)
  } as MobigentProviderRuntime<Kind>;
}

export async function* watchMobigentProviderRuntime<Kind extends MobigentProviderRuntimeKind>(
  options: MobigentProviderRuntimeStreamOptions<Kind>
): AsyncIterable<MobigentProviderRuntimeChangeEvent<Kind>> {
  for await (const event of options.client.watchTools(options.stream)) {
    const nameMap = mapToolsForProviderNames(event.tools, options.toolNames);
    const executeTool = createMobigentToolExecutor(options.client, { toolNames: nameMap });
    const executeToolCall = createMobigentToolCallExecutor(executeTool);
    const resultFormat = resolveToolResultFormat(options.kind);
    yield {
      kind: options.kind,
      reason: event.reason,
      rawTools: event.tools,
      toolNameMap: nameMap,
      tools: createRuntimeTools(options.kind, nameMap.tools, options.client, {
        originalTools: event.tools,
        pluginName: options.pluginName
      }),
      executeTool,
      resolveToolCall: resolveMobigentToolCall,
      executeToolCall,
      executeToolCalls: (toolCalls) => Promise.all(Array.from(toolCalls, executeToolCall)),
      formatToolCallResult: (result) => formatMobigentToolCallResult(result, resultFormat),
      formatToolCallResults: (results) => formatMobigentToolCallResults(results, resultFormat)
    } as MobigentProviderRuntimeChangeEvent<Kind>;
  }
}

export function createMobigentProviderRuntimeReport(
  runtime: MobigentProviderRuntime
): MobigentProviderRuntimeReport {
  return {
    kind: runtime.kind,
    toolCount: runtime.rawTools.length,
    resultFormat: resolveToolResultFormat(runtime.kind),
    rawToolNames: runtime.rawTools.map((tool) => tool.name),
    providerToolNames: runtime.toolNameMap.tools.map((tool) => tool.name),
    toolNameMap: runtime.toolNameMap.entries
  };
}

export function formatMobigentProviderRuntimeReport(report: MobigentProviderRuntimeReport) {
  const lines = [
    `Mobigent provider runtime: ${report.kind}`,
    `Tools: ${report.toolCount}`,
    `Result format: ${report.resultFormat}`
  ];

  for (const entry of report.toolNameMap) {
    lines.push(
      entry.originalName === entry.providerName
        ? `- ${entry.providerName}`
        : `- ${entry.providerName} -> ${entry.originalName}`
    );
  }

  return `${lines.join("\n")}\n`;
}

export function readMobigentProviderRuntimeConfig<
  Kind extends MobigentProviderRuntimeKind = MobigentProviderRuntimeKind
>(options: MobigentProviderRuntimeBootstrapOptions<Kind> = {}): MobigentProviderRuntimeConfig<Kind> {
  const env = options.env ?? readProcessEnv();
  const kind = options.kind ?? parseRuntimeProviderKind(env.MOBIGENT_PROVIDER ?? "anthropic-tool-use");
  const apiKey = options.apiKey ?? env.MOBIGENT_HTTP_API_KEY;
  const auth = options.auth ?? (apiKey ? "bearer" : "none");

  return {
    kind: kind as Kind,
    baseUrl: options.baseUrl ?? env.MOBIGENT_HTTP_URL ?? "http://localhost:8788",
    auth,
    apiKey,
    agentId: options.agentId ?? env.MOBIGENT_AGENT_ID ?? kind,
    timeoutMs: readPositiveNumber(options.timeoutMs, env.MOBIGENT_TIMEOUT_MS, 30_000, "MOBIGENT_TIMEOUT_MS"),
    retries: readNonNegativeNumber(options.retries, env.MOBIGENT_RETRIES, 2, "MOBIGENT_RETRIES"),
    retryDelayMs: readNonNegativeNumber(
      options.retryDelayMs,
      env.MOBIGENT_RETRY_DELAY_MS,
      250,
      "MOBIGENT_RETRY_DELAY_MS"
    ),
    minApps: readNonNegativeNumber(options.minApps, env.MOBIGENT_MIN_APPS, 1, "MOBIGENT_MIN_APPS"),
    minTools: readNonNegativeNumber(options.minTools, env.MOBIGENT_MIN_TOOLS, 1, "MOBIGENT_MIN_TOOLS"),
    waitTimeoutMs: readPositiveNumber(
      options.waitTimeoutMs,
      env.MOBIGENT_WAIT_TIMEOUT_MS,
      30_000,
      "MOBIGENT_WAIT_TIMEOUT_MS"
    ),
    waitIntervalMs: readNonNegativeNumber(
      options.waitIntervalMs,
      env.MOBIGENT_WAIT_INTERVAL_MS,
      500,
      "MOBIGENT_WAIT_INTERVAL_MS"
    ),
    watchTools: readBoolean(env.MOBIGENT_WATCH_TOOLS, false, "MOBIGENT_WATCH_TOOLS")
  };
}

export function diagnoseMobigentProviderRuntimeConfig<
  Kind extends MobigentProviderRuntimeKind = MobigentProviderRuntimeKind
>(options: MobigentProviderRuntimeBootstrapOptions<Kind> = {}): MobigentProviderRuntimeConfigReport<Kind> {
  const checks: MobigentProviderRuntimeConfigCheck[] = [];
  let config: MobigentProviderRuntimeConfig<Kind>;

  try {
    config = readMobigentProviderRuntimeConfig(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "fail",
      checks: [
        {
          name: "runtime-config",
          status: "fail",
          message
        }
      ],
      errors: [message]
    };
  }

  checks.push({
    name: "provider",
    status: "pass",
    message: `${config.kind} is a supported Mobigent runtime provider.`
  });

  checks.push(validateRuntimeConfigBaseUrl(config.baseUrl));
  checks.push(validateRuntimeConfigAuth(config));
  checks.push(validateRuntimeConfigAgent(config));
  checks.push(validateRuntimeConfigWaits(config));
  checks.push({
    name: "tool-watching",
    status: config.watchTools ? "pass" : "warn",
    message: config.watchTools
      ? "Live tool watching is enabled for long-running agents."
      : "Live tool watching is disabled; restart or refresh the agent runtime when mobile tools change."
  });

  const status = summarizeRuntimeConfigStatus(checks);
  return {
    status,
    config,
    checks,
    errors: checks.filter((check) => check.status === "fail").map((check) => check.message)
  };
}

export function formatMobigentProviderRuntimeConfigReport(
  report: MobigentProviderRuntimeConfigReport
) {
  const lines = [`Mobigent provider runtime config: ${report.status.toUpperCase()}`];
  if (report.config) {
    lines.push(
      `Provider: ${report.config.kind}`,
      `Gateway: ${report.config.baseUrl}`,
      `Agent: ${report.config.agentId}`,
      `Auth: ${report.config.auth}`,
      `Readiness: apps ${report.config.minApps}, tools ${report.config.minTools}, timeout ${report.config.waitTimeoutMs}ms`
    );
  }
  for (const check of report.checks) {
    lines.push(`[${check.status.toUpperCase()}] ${check.name}: ${check.message}`);
  }
  return `${lines.join("\n")}\n`;
}

export async function createMobigentProviderRuntimeFromEnv<
  Kind extends MobigentProviderRuntimeKind = MobigentProviderRuntimeKind
>(
  options: MobigentProviderRuntimeBootstrapOptions<Kind> = {}
): Promise<MobigentProviderRuntimeBootstrap<Kind>> {
  const config = readMobigentProviderRuntimeConfig(options);
  const client = createMobigentHttpClient({
    baseUrl: config.baseUrl,
    auth: config.auth,
    apiKey: config.apiKey,
    agentId: config.agentId,
    headers: options.headers,
    requestId: options.requestId,
    timeoutMs: config.timeoutMs,
    retries: config.retries,
    retryDelayMs: config.retryDelayMs,
    fetch: options.fetch
  });

  const readiness =
    options.waitForReadiness === false
      ? undefined
      : await client.waitForReadiness({
          minApps: config.minApps,
          minTools: config.minTools,
          timeoutMs: config.waitTimeoutMs,
          intervalMs: config.waitIntervalMs
        });

  const waitForTools =
    options.waitForTools ??
    ({
      minTools: config.minTools,
      timeoutMs: config.waitTimeoutMs,
      intervalMs: config.waitIntervalMs
    } satisfies MobigentWaitForToolsOptions);

  const runtime = await createMobigentProviderRuntime({
    kind: config.kind,
    client,
    waitForTools,
    toolNames: options.toolNames,
    pluginName: options.pluginName
  });

  return {
    kind: config.kind,
    client,
    readiness,
    runtime
  };
}

export async function diagnoseMobigentProvider(
  client: MobigentHttpClient,
  options: MobigentProviderDiagnosticsOptions = {}
): Promise<MobigentProviderDiagnostics> {
  const minApps = options.minApps ?? 1;
  const minTools = options.minTools ?? 1;
  const checks: MobigentProviderDiagnosticCheck[] = [];
  const summary = {
    apps: 0,
    tools: 0,
    providers: 0,
    auditEvents: 0
  };

  const config = await runDiagnosticCheck(checks, "config", "Gateway config endpoint is reachable.", () =>
    client.getConfig()
  );
  if (config) {
    checks.push({
      name: "features",
      status: config.features.agentScopedDiscovery && config.features.dynamicTools ? "pass" : "warn",
      message:
        config.features.agentScopedDiscovery && config.features.dynamicTools
          ? "Gateway supports dynamic, agent-scoped discovery."
          : "Gateway is missing one or more recommended provider discovery features.",
      details: config.features
    });
  }

  const health = await runDiagnosticCheck(checks, "health", "Gateway health endpoint is reachable.", () =>
    client.getHealth()
  );
  if (health) {
    summary.apps = health.status.appsWithManifests;
    summary.tools = health.status.tools;
  }

  const readiness = await runDiagnosticCheck(
    checks,
    "readiness",
    `Gateway has at least ${minApps} app manifest(s) and ${minTools} visible tool(s).`,
    () => client.getReadiness({ minApps, minTools }),
    (value) => ({
      name: "readiness",
      status: value.ok ? "pass" : "warn",
      message: value.ok
        ? `Gateway readiness passed: ${formatReadiness(value)}.`
        : `Gateway is not ready yet: ${formatReadiness(value)}.`,
      details: value
    })
  );
  if (readiness) {
    summary.apps = readiness.checks.apps.actual;
    summary.tools = readiness.checks.tools.actual;
  }

  const apps = await runDiagnosticCheck(checks, "apps", "Connected app sessions are discoverable.", () =>
    client.listApps()
  );
  if (apps) {
    summary.apps = apps.filter((app) => app.manifest).length;
    checks.push({
      name: "app-manifests",
      status: summary.apps >= minApps ? "pass" : "warn",
      message:
        summary.apps >= minApps
          ? `${summary.apps} app manifest(s) are accepted.`
          : `Only ${summary.apps} app manifest(s) are accepted; expected at least ${minApps}.`,
      details: apps.map((app) => ({
        app: app.app,
        authenticated: app.authenticated,
        capabilities: app.capabilities,
        manifest: app.manifest
      }))
    });
  }

  const tools = await runDiagnosticCheck(checks, "tools", "Provider-visible tools are discoverable.", () =>
    client.listTools()
  );
  if (tools) {
    summary.tools = tools.length;
    checks.push({
      name: "tool-count",
      status: tools.length >= minTools ? "pass" : "warn",
      message:
        tools.length >= minTools
          ? `${tools.length} provider-visible tool(s) are available.`
          : `Only ${tools.length} provider-visible tool(s) are available; expected at least ${minTools}.`,
      details: tools.map((tool) => tool.name)
    });
  }

  const providers = await runDiagnosticCheck(checks, "providers", "Provider catalog is discoverable.", () =>
    client.listProviders()
  );
  if (providers) {
    summary.providers = providers.length;
    if (options.expectedProvider) {
      checks.push({
        name: "expected-provider",
        status: providers.some((provider) => provider.id === options.expectedProvider) ? "pass" : "warn",
        message: providers.some((provider) => provider.id === options.expectedProvider)
          ? `Provider ${options.expectedProvider} is advertised by the gateway.`
          : `Provider ${options.expectedProvider} was not found in the gateway catalog.`,
        details: providers.map((provider) => provider.id)
      });
    }
  }

  const auditEvents = await runDiagnosticCheck(checks, "audit", "Audit log is readable.", () =>
    client.listAuditEvents({ limit: options.auditLimit ?? 5 })
  );
  if (auditEvents) {
    summary.auditEvents = auditEvents.length;
  }

  const status = summarizeDiagnosticStatus(checks);
  return {
    ok: status !== "fail",
    status,
    checks,
    summary
  };
}

export function formatMobigentProviderDiagnostics(
  report: MobigentProviderDiagnostics,
  options: MobigentProviderDiagnosticsFormatOptions = {}
) {
  const lines = [
    `Mobigent provider diagnostics: ${report.status.toUpperCase()}`,
    `Summary: ${report.summary.apps} app manifest(s), ${report.summary.tools} tool(s), ${report.summary.providers} provider(s), ${report.summary.auditEvents} audit event(s).`
  ];

  for (const check of report.checks) {
    lines.push(`[${check.status.toUpperCase()}] ${check.name}: ${check.message}`);
    if (options.includeDetails && check.details !== undefined) {
      lines.push(indentDiagnosticDetails(check.details));
    }
  }

  return `${lines.join("\n")}\n`;
}

export function toExecutableTools(
  tools: MobigentHttpTool[],
  client: MobigentHttpClient,
  options: { originalTools?: MobigentHttpTool[] } = {}
): MobigentExecutableTool[] {
  return tools.map((tool, index) => ({
    name: tool.name,
    description: tool.description,
    schema: tool.inputSchema,
    execute: (input = {}) => client.callTool(options.originalTools?.[index]?.name ?? tool.name, input)
  }));
}

export function toLangChainTools(
  tools: MobigentHttpTool[],
  client: MobigentHttpClient,
  options: { originalTools?: MobigentHttpTool[] } = {}
): LangChainToolDefinition[] {
  return toExecutableTools(tools, client, options).map((tool) => ({
    ...tool,
    lc_namespace: ["mobigent", "tools"]
  }));
}

export function toLlamaIndexTools(
  tools: MobigentHttpTool[],
  client: MobigentHttpClient,
  options: { originalTools?: MobigentHttpTool[] } = {}
): LlamaIndexToolDefinition[] {
  return tools.map((tool, index) => ({
    metadata: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    },
    call: (input = {}) => client.callTool(options.originalTools?.[index]?.name ?? tool.name, input)
  }));
}

export function toMastraTools(
  tools: MobigentHttpTool[],
  client: MobigentHttpClient,
  options: { originalTools?: MobigentHttpTool[] } = {}
): MastraToolDefinition[] {
  return tools.map((tool, index) => ({
    id: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    execute: (context) => client.callTool(options.originalTools?.[index]?.name ?? tool.name, readMastraInput(context))
  }));
}

export function toSemanticKernelPlugin(
  tools: MobigentHttpTool[],
  client: MobigentHttpClient,
  options: { originalTools?: MobigentHttpTool[]; pluginName?: string } = {}
): SemanticKernelFunctionDefinition[] {
  const pluginName = options.pluginName ?? "Mobigent";

  return tools.map((tool, index) => ({
    pluginName,
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema,
    invoke: (input = {}) => client.callTool(options.originalTools?.[index]?.name ?? tool.name, input)
  }));
}

export function toCrewAiTools(
  tools: MobigentHttpTool[],
  client: MobigentHttpClient,
  options: { originalTools?: MobigentHttpTool[] } = {}
): CrewAiToolDefinition[] {
  return tools.map((tool, index) => ({
    name: tool.name,
    description: tool.description,
    args_schema: tool.inputSchema,
    run: (input = {}) => client.callTool(options.originalTools?.[index]?.name ?? tool.name, input)
  }));
}

export function toAutoGenTools(
  tools: MobigentHttpTool[],
  client: MobigentHttpClient,
  options: { originalTools?: MobigentHttpTool[] } = {}
): AutoGenToolDefinition[] {
  return tools.map((tool, index) => ({
    name: tool.name,
    description: tool.description,
    schema: tool.inputSchema,
    run: (input = {}) => client.callTool(options.originalTools?.[index]?.name ?? tool.name, input)
  }));
}

export function toHaystackTools(
  tools: MobigentHttpTool[],
  client: MobigentHttpClient,
  options: { originalTools?: MobigentHttpTool[] } = {}
): HaystackToolDefinition[] {
  return tools.map((tool, index) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema,
    invoke: (input = {}) => client.callTool(options.originalTools?.[index]?.name ?? tool.name, input)
  }));
}

export function toVercelAiSdkTools(
  tools: MobigentHttpTool[],
  client: MobigentHttpClient,
  options: { originalTools?: MobigentHttpTool[] } = {}
): Record<string, VercelAiSdkToolDefinition> {
  return Object.fromEntries(
    tools.map((tool, index) => [
      tool.name,
      {
        description: tool.description,
        parameters: tool.inputSchema,
        execute: (input = {}) => client.callTool(options.originalTools?.[index]?.name ?? tool.name, input)
      }
    ])
  );
}

function createRuntimeTools(
  kind: MobigentProviderRuntimeKind,
  tools: MobigentHttpTool[],
  client: MobigentHttpClient,
  options: { originalTools?: MobigentHttpTool[]; pluginName?: string } = {}
): MobigentRuntimeToolsForKind<MobigentProviderRuntimeKind> {
  if (kind === "openai-responses") {
    return toOpenAiTools(tools);
  }
  if (
    kind === "azure-openai" ||
    kind === "openai-compatible" ||
    kind === "openrouter" ||
    kind === "litellm" ||
    kind === "ollama" ||
    kind === "lm-studio" ||
    kind === "groq" ||
    kind === "perplexity" ||
    kind === "xai-grok" ||
    kind === "deepseek" ||
    kind === "together-ai" ||
    kind === "fireworks-ai" ||
    kind === "qwen-dashscope" ||
    kind === "nvidia-nim" ||
    kind === "cloudflare-ai-gateway" ||
    kind === "mistral" ||
    kind === "cohere"
  ) {
    return toChatFunctionTools(tools);
  }
  if (kind === "anthropic-tool-use") {
    return toAnthropicTools(tools);
  }
  if (kind === "google-gemini" || kind === "google-vertex-ai") {
    return toGeminiFunctionDeclarations(tools);
  }
  if (kind === "aws-bedrock-converse") {
    return toBedrockToolConfigTools(tools);
  }
  if (kind === "vercel-ai-sdk") {
    return toVercelAiSdkTools(tools, client, { originalTools: options.originalTools });
  }
  if (kind === "langchain") {
    return toLangChainTools(tools, client, { originalTools: options.originalTools });
  }
  if (kind === "llamaindex") {
    return toLlamaIndexTools(tools, client, { originalTools: options.originalTools });
  }
  if (kind === "mastra") {
    return toMastraTools(tools, client, { originalTools: options.originalTools });
  }
  if (kind === "semantic-kernel") {
    return toSemanticKernelPlugin(tools, client, {
      originalTools: options.originalTools,
      pluginName: options.pluginName
    });
  }
  if (kind === "crewai") {
    return toCrewAiTools(tools, client, { originalTools: options.originalTools });
  }
  if (kind === "autogen") {
    return toAutoGenTools(tools, client, { originalTools: options.originalTools });
  }
  if (kind === "haystack") {
    return toHaystackTools(tools, client, { originalTools: options.originalTools });
  }

  return toExecutableTools(tools, client, { originalTools: options.originalTools });
}

function parseRuntimeProviderKind(value: string): MobigentProviderRuntimeKind {
  if (isRuntimeProviderKind(value)) {
    return value;
  }

  throw new Error(`Unsupported MOBIGENT_PROVIDER: ${value}`);
}

function isRuntimeProviderKind(value: string): value is MobigentProviderRuntimeKind {
  return [
    "openai-responses",
    "azure-openai",
    "openai-compatible",
    "openrouter",
    "litellm",
    "ollama",
    "lm-studio",
    "groq",
    "perplexity",
    "xai-grok",
    "deepseek",
    "together-ai",
    "fireworks-ai",
    "qwen-dashscope",
    "nvidia-nim",
    "cloudflare-ai-gateway",
    "mistral",
    "cohere",
    "anthropic-tool-use",
    "google-gemini",
    "google-vertex-ai",
    "aws-bedrock-converse",
    "vercel-ai-sdk",
    "langchain",
    "llamaindex",
    "mastra",
    "semantic-kernel",
    "crewai",
    "autogen",
    "haystack",
    "generic-agent"
  ].includes(value);
}

function createUniqueProviderToolName(
  originalName: string,
  used: Set<string>,
  options: { maxLength: number; prefix: string }
) {
  const base = sanitizeToolName(originalName, options.maxLength) || options.prefix;
  let candidate = base;

  if (used.has(candidate)) {
    const suffix = `_${hashToolName(originalName)}`;
    candidate = fitToolName(`${base}${suffix}`, options.maxLength, suffix);
  }

  let attempt = 2;
  while (used.has(candidate)) {
    const suffix = `_${hashToolName(`${originalName}:${attempt}`)}`;
    candidate = fitToolName(`${base}${suffix}`, options.maxLength, suffix);
    attempt += 1;
  }

  used.add(candidate);
  return candidate;
}

function sanitizeToolName(value: string, maxLength: number) {
  const normalized = value
    .replace(/[^A-Za-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  const prefixed = /^[A-Za-z]/.test(normalized) ? normalized : `tool_${normalized}`;
  return prefixed.slice(0, Math.max(1, maxLength));
}

function fitToolName(value: string, maxLength: number, suffix: string) {
  if (value.length <= maxLength) {
    return value;
  }
  const headLength = Math.max(1, maxLength - suffix.length);
  return `${value.slice(0, headLength)}${suffix}`;
}

function hashToolName(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function readProcessEnv(): MobigentRuntimeBootstrapEnv {
  const maybeProcess = globalThis as typeof globalThis & {
    process?: {
      env?: MobigentRuntimeBootstrapEnv;
    };
  };
  return maybeProcess.process?.env ?? {};
}

function readPositiveNumber(
  explicit: number | undefined,
  raw: string | undefined,
  fallback: number,
  name: string
) {
  return readNumber({ explicit, raw, fallback, name, min: 0, allowZero: false });
}

function readNonNegativeNumber(
  explicit: number | undefined,
  raw: string | undefined,
  fallback: number,
  name: string
) {
  return readNumber({ explicit, raw, fallback, name, min: 0, allowZero: true });
}

function readNumber(options: {
  explicit: number | undefined;
  raw: string | undefined;
  fallback: number;
  name: string;
  min: number;
  allowZero: boolean;
}) {
  const value = options.explicit ?? (options.raw === undefined ? options.fallback : Number(options.raw));
  const valid =
    Number.isFinite(value) &&
    (options.allowZero ? value >= options.min : value > options.min) &&
    Number.isInteger(value);

  if (!valid) {
    throw new Error(
      `${options.name} must be ${options.allowZero ? "a non-negative" : "a positive"} integer.`
    );
  }

  return value;
}

function readBoolean(raw: string | undefined, fallback: boolean, name: string) {
  if (raw === undefined) {
    return fallback;
  }
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }
  throw new Error(`${name} must be true or false.`);
}

export function createGenericAgentProvider(options: {
  mcp?: McpStdioOptions;
  openApi?: OpenApiOptions;
}): ProviderDescriptor {
  return {
    id: "generic-agent",
    kind: "generic-agent",
    name: "Generic Agent",
    description: "Provider metadata for agents that can use either MCP stdio or OpenAPI tools.",
    capabilities: {
      transport: options.openApi ? "openapi" : "stdio",
      supportsTools: true,
      supportsDynamicTools: Boolean(options.mcp),
      requiresPublicUrl: Boolean(options.openApi),
      supportsConfirmationNotes: true
    },
    setup: {
      mcp: options.mcp ? createMcpStdioProvider(options.mcp).setup : undefined,
      openApi: options.openApi ? createOpenApiProvider(options.openApi).setup : undefined
    }
  };
}

export function createProviderCatalog(options: {
  mcp?: McpStdioOptions;
  openApi?: OpenApiOptions;
} = {}) {
  const providers: ProviderDescriptor[] = [
    createMcpStdioProvider(options.mcp),
    createClaudeDesktopProvider(options.mcp),
    createCursorProvider(options.mcp),
    createVsCodeProvider(options.mcp)
  ];

  if (options.openApi) {
    providers.push(createOpenApiProvider(options.openApi));
    providers.push(createChatGptActionsProvider(options.openApi));
    providers.push(createOpenAiResponsesProvider(options.openApi));
    providers.push(createAzureOpenAiProvider(options.openApi));
    providers.push(createOpenAiCompatibleProvider(options.openApi));
    providers.push(createOpenRouterProvider(options.openApi));
    providers.push(createLiteLlmProvider(options.openApi));
    providers.push(createOllamaProvider(options.openApi));
    providers.push(createLmStudioProvider(options.openApi));
    providers.push(createGroqProvider(options.openApi));
    providers.push(createPerplexityProvider(options.openApi));
    providers.push(createXaiGrokProvider(options.openApi));
    providers.push(createDeepSeekProvider(options.openApi));
    providers.push(createTogetherAiProvider(options.openApi));
    providers.push(createFireworksAiProvider(options.openApi));
    providers.push(createQwenDashScopeProvider(options.openApi));
    providers.push(createNvidiaNimProvider(options.openApi));
    providers.push(createCloudflareAiGatewayProvider(options.openApi));
    providers.push(createMistralProvider(options.openApi));
    providers.push(createCohereProvider(options.openApi));
    providers.push(createAnthropicToolUseProvider(options.openApi));
    providers.push(createGoogleGeminiProvider(options.openApi));
    providers.push(createGoogleVertexAiProvider(options.openApi));
    providers.push(createAwsBedrockConverseProvider(options.openApi));
    providers.push(createVercelAiSdkProvider(options.openApi));
    providers.push(createLangChainProvider(options.openApi));
    providers.push(createLlamaIndexProvider(options.openApi));
    providers.push(createMastraProvider(options.openApi));
    providers.push(createSemanticKernelProvider(options.openApi));
    providers.push(createCrewAiProvider(options.openApi));
    providers.push(createAutoGenProvider(options.openApi));
    providers.push(createHaystackProvider(options.openApi));
  }

  providers.push(createGenericAgentProvider(options));
  return providers;
}

export function filterProviderCatalog(
  providers: ProviderDescriptor[],
  filter: ProviderCatalogFilter = {}
): ProviderDescriptor[] {
  const transports = normalizeFilterList(filter.transport);
  const ids = filter.ids ? new Set(filter.ids) : undefined;
  const query = filter.query?.trim().toLowerCase();

  return providers.filter((provider) => {
    if (ids && !ids.has(provider.id)) {
      return false;
    }
    if (transports.length > 0 && !transports.includes(provider.capabilities.transport)) {
      return false;
    }
    if (filter.supportsTools !== undefined && provider.capabilities.supportsTools !== filter.supportsTools) {
      return false;
    }
    if (
      filter.supportsDynamicTools !== undefined &&
      provider.capabilities.supportsDynamicTools !== filter.supportsDynamicTools
    ) {
      return false;
    }
    if (filter.requiresPublicUrl !== undefined && provider.capabilities.requiresPublicUrl !== filter.requiresPublicUrl) {
      return false;
    }
    if (
      filter.supportsConfirmationNotes !== undefined &&
      provider.capabilities.supportsConfirmationNotes !== filter.supportsConfirmationNotes
    ) {
      return false;
    }
    if (filter.runtimeOnly && !isRuntimeProviderKind(provider.id)) {
      return false;
    }
    if (query && !providerMatchesQuery(provider, query)) {
      return false;
    }

    return true;
  });
}

export function summarizeProviderCatalog(providers: ProviderDescriptor[]): ProviderCatalogSummary {
  const byTransport: Record<ProviderTransport, number> = {
    stdio: 0,
    http: 0,
    openapi: 0
  };
  const byCategory: Record<ProviderIntegrationCategory, number> = {
    "local-agent": 0,
    "hosted-actions": 0,
    "runtime-agent": 0,
    fallback: 0
  };

  let runtimeProviders = 0;
  let publicUrlProviders = 0;
  let dynamicToolProviders = 0;

  for (const provider of providers) {
    const profile = getProviderIntegrationProfile(provider);

    byTransport[provider.capabilities.transport] += 1;
    byCategory[profile.category] += 1;
    if (isRuntimeProviderKind(provider.id)) {
      runtimeProviders += 1;
    }
    if (provider.capabilities.requiresPublicUrl) {
      publicUrlProviders += 1;
    }
    if (provider.capabilities.supportsDynamicTools) {
      dynamicToolProviders += 1;
    }
  }

  return {
    total: providers.length,
    byTransport,
    byCategory,
    runtimeProviders,
    publicUrlProviders,
    dynamicToolProviders
  };
}

export function getProviderIntegrationProfile(provider: ProviderDescriptor): ProviderIntegrationProfile {
  if (provider.id === "generic-agent") {
    return {
      category: "fallback",
      bestFor: ["custom agents", "early experiments", "manual provider adapters"],
      setupComplexity: "medium",
      productionNotes: [
        "Use a provider-specific integration when one exists.",
        "Choose MCP stdio for local agents or OpenAPI for hosted action imports."
      ]
    };
  }

  if (provider.capabilities.transport === "stdio") {
    return {
      category: "local-agent",
      bestFor: ["desktop agents", "local development", "MCP-compatible clients"],
      setupComplexity: "low",
      productionNotes: [
        "Runs without a public URL.",
        "Best when the provider can launch a local Mobigent MCP command."
      ]
    };
  }

  if (provider.capabilities.transport === "openapi") {
    return {
      category: "hosted-actions",
      bestFor: ["hosted action builders", "schema imports", "public HTTPS gateways"],
      setupComplexity: provider.capabilities.requiresPublicUrl ? "high" : "medium",
      productionNotes: [
        "Requires a stable OpenAPI schema URL.",
        "Hosted providers usually need an HTTPS gateway reachable from the internet."
      ]
    };
  }

  return {
    category: "runtime-agent",
    bestFor: ["server-side agent loops", "framework adapters", "private gateways"],
    setupComplexity: provider.setup && typeof provider.setup === "object" && "auth" in provider.setup ? "medium" : "low",
    productionNotes: [
      "Fetch tools from the gateway at runtime.",
      "Use the provider runtime helpers to wait for app sessions and execute tool calls."
    ]
  };
}

export function createProviderCompatibilityReport(
  providers: ProviderDescriptor[]
): ProviderCompatibilityReport {
  const entries = providers.map((provider) => {
    const validation = validateProviderSetup(provider);

    return {
      id: provider.id,
      name: provider.name,
      transport: provider.capabilities.transport,
      runtime: isRuntimeProviderKind(provider.id),
      status: validation.status,
      failingChecks: validation.checks
        .filter((check) => check.status === "fail")
        .map((check) => check.name),
      warningChecks: validation.checks
        .filter((check) => check.status === "warn")
        .map((check) => check.name)
    };
  });

  return {
    summary: {
      ...summarizeProviderCatalog(providers),
      pass: entries.filter((entry) => entry.status === "pass").length,
      warn: entries.filter((entry) => entry.status === "warn").length,
      fail: entries.filter((entry) => entry.status === "fail").length
    },
    providers: entries
  };
}

export function recommendProviders(
  providers: ProviderDescriptor[],
  options: ProviderRecommendationOptions = {}
): ProviderRecommendation[] {
  const preset = getProviderRecommendationPreset(options.useCase);
  const limit = options.limit ?? 5;
  const query = options.query?.trim().toLowerCase();

  return providers
    .map((provider) => scoreProviderRecommendation(provider, {
      useCase: preset.id,
      preferDynamicTools: options.preferDynamicTools ?? preset.dynamicToolsPreferred,
      allowPublicUrl: options.allowPublicUrl ?? preset.publicUrlDefault,
      query
    }))
    .filter((recommendation) => recommendation.score > 0)
    .sort((left, right) => right.score - left.score || left.provider.name.localeCompare(right.provider.name))
    .slice(0, limit);
}

export function createProviderSetupPlan(
  providers: ProviderDescriptor[],
  options: ProviderSetupPlanOptions = {}
): ProviderSetupPlan {
  const useCase = options.useCase ?? "runtime-agent";
  const preset = getProviderRecommendationPreset(useCase);
  const [recommendation] = recommendProviders(providers, {
    ...options,
    useCase,
    limit: 1
  });

  if (!recommendation) {
    throw new Error(`No Mobigent provider matched setup plan ${useCase}.`);
  }

  const provider = recommendation.provider;
  const bundle = createProviderBundle(provider);

  return {
    useCase,
    preset,
    recommendation,
    profile: getProviderIntegrationProfile(provider),
    validation: validateProviderSetup(provider),
    bundle: {
      ...bundle,
      runtimeEnv:
        options.runtimeEnv && isRuntimeProviderKind(provider.id)
          ? createProviderRuntimeEnv(provider, options.runtimeEnv)
          : bundle.runtimeEnv
    }
  };
}

export function validateProviderSetupPlan(value: unknown): ProviderSetupPlanValidationReport {
  const errors: string[] = [];

  if (!isPlainRecord(value)) {
    return {
      ok: false,
      status: "fail",
      errors: ["Provider setup plan must be a JSON object."]
    };
  }

  if (!isProviderRecommendationUseCaseValue(value.useCase)) {
    errors.push("useCase must be local-agent, hosted-actions, or runtime-agent.");
  }

  if (!isPlainRecord(value.preset)) {
    errors.push("preset must be an object.");
  } else {
    if (value.preset.id !== value.useCase) {
      errors.push("preset.id must match useCase.");
    }
    if (!isNonEmptyString(value.preset.recommendedTransport)) {
      errors.push("preset.recommendedTransport must be a non-empty string.");
    }
  }

  const recommendation = isPlainRecord(value.recommendation) ? value.recommendation : undefined;
  const provider = recommendation && isPlainRecord(recommendation.provider) ? recommendation.provider : undefined;
  if (!recommendation) {
    errors.push("recommendation must be an object.");
  } else {
    if (!provider) {
      errors.push("recommendation.provider must be an object.");
    } else {
      if (!isNonEmptyString(provider.id)) {
        errors.push("recommendation.provider.id must be a non-empty string.");
      }
      if (!isNonEmptyString(provider.name)) {
        errors.push("recommendation.provider.name must be a non-empty string.");
      }
    }
    if (typeof recommendation.score !== "number" || recommendation.score <= 0) {
      errors.push("recommendation.score must be a positive number.");
    }
    if (!Array.isArray(recommendation.reasons) || !recommendation.reasons.every((reason) => typeof reason === "string")) {
      errors.push("recommendation.reasons must be an array of strings.");
    }
  }

  if (!isPlainRecord(value.profile)) {
    errors.push("profile must be an object.");
  } else {
    if (!isNonEmptyString(value.profile.category)) {
      errors.push("profile.category must be a non-empty string.");
    }
    if (!Array.isArray(value.profile.bestFor) || !value.profile.bestFor.every((item) => typeof item === "string")) {
      errors.push("profile.bestFor must be an array of strings.");
    }
  }

  const validation = isPlainRecord(value.validation) ? value.validation : undefined;
  if (!validation) {
    errors.push("validation must be an object.");
  } else {
    if (validation.status !== "pass" && validation.status !== "warn" && validation.status !== "fail") {
      errors.push("validation.status must be pass, warn, or fail.");
    }
    if (validation.ok !== (validation.status !== "fail")) {
      errors.push("validation.ok must match validation.status.");
    }
    if (!Array.isArray(validation.checks)) {
      errors.push("validation.checks must be an array.");
    }
  }

  const bundle = isPlainRecord(value.bundle) ? value.bundle : undefined;
  const bundleProvider = bundle && isPlainRecord(bundle.provider) ? bundle.provider : undefined;
  if (!bundle) {
    errors.push("bundle must be an object.");
  } else {
    if (!bundleProvider) {
      errors.push("bundle.provider must be an object.");
    } else if (provider && bundleProvider.id !== provider.id) {
      errors.push("bundle.provider.id must match recommendation.provider.id.");
    }
    if (!isPlainRecord(bundle.setup)) {
      errors.push("bundle.setup must be an object.");
    }
    if (!isPlainRecord(bundle.endpoints)) {
      errors.push("bundle.endpoints must be an object.");
    }
    if (bundle.runtimeEnv !== undefined && !isStringRecord(bundle.runtimeEnv)) {
      errors.push("bundle.runtimeEnv must be a string record when present.");
    }
  }

  return {
    ok: errors.length === 0,
    status: errors.length === 0 ? "pass" : "fail",
    errors,
    ...(provider && isNonEmptyString(provider.id)
      ? { provider: { id: provider.id, ...(isNonEmptyString(provider.name) ? { name: provider.name } : {}) } }
      : {})
  };
}

export function formatProviderSetupPlanValidation(report: ProviderSetupPlanValidationReport) {
  const lines = [`Mobigent provider setup plan: ${report.status.toUpperCase()}`];
  if (report.provider) {
    lines.push(`PROVIDER ${report.provider.id}${report.provider.name ? ` (${report.provider.name})` : ""}`);
  }
  for (const error of report.errors) {
    lines.push(`ERROR ${error}`);
  }
  return lines.join("\n");
}

export function listProviderRecommendationPresets(): ProviderRecommendationPreset[] {
  return providerRecommendationPresets.map((preset) => ({ ...preset }));
}

export function getProviderRecommendationPreset(
  useCase: ProviderRecommendationUseCase = "runtime-agent"
): ProviderRecommendationPreset {
  const preset = providerRecommendationPresets.find((candidate) => candidate.id === useCase);
  if (!preset) {
    throw new Error(`Unsupported provider recommendation preset: ${useCase}.`);
  }
  return { ...preset };
}

export function stringifyProviderSetup(provider: ProviderDescriptor) {
  return JSON.stringify(provider.setup, null, 2);
}

export function createProviderGuide(provider: ProviderDescriptor) {
  return [
    `# ${provider.name}`,
    "",
    provider.description,
    "",
    "```json",
    stringifyProviderSetup(provider),
    "```"
  ].join("\n");
}

export function createProviderBundle(provider: ProviderDescriptor): ProviderBundle {
  const setup = provider.setup as {
    baseUrl?: unknown;
    openApiUrl?: unknown;
    listToolsUrl?: unknown;
    toolStreamUrl?: unknown;
    auditUrl?: unknown;
    auditStreamUrl?: unknown;
  };
  const baseUrl = typeof setup.baseUrl === "string" ? trimTrailingSlash(setup.baseUrl) : undefined;

  return {
    provider,
    setup: provider.setup,
    guide: createProviderGuide(provider),
    runtimeEnv: isRuntimeProviderKind(provider.id) && baseUrl ? createProviderRuntimeEnv(provider) : undefined,
    endpoints: {
      config: baseUrl ? `${baseUrl}/config` : undefined,
      openApi: typeof setup.openApiUrl === "string" ? setup.openApiUrl : baseUrl ? `${baseUrl}/openapi.json` : undefined,
      snapshot: baseUrl ? `${baseUrl}/snapshot` : undefined,
      tools: typeof setup.listToolsUrl === "string" ? setup.listToolsUrl : baseUrl ? `${baseUrl}/tools` : undefined,
      toolStream: typeof setup.toolStreamUrl === "string" ? setup.toolStreamUrl : baseUrl ? `${baseUrl}/tools/stream` : undefined,
      audit: typeof setup.auditUrl === "string" ? setup.auditUrl : baseUrl ? `${baseUrl}/audit` : undefined,
      auditStream: typeof setup.auditStreamUrl === "string" ? setup.auditStreamUrl : baseUrl ? `${baseUrl}/audit/stream` : undefined
    }
  };
}

export function createProviderRuntimeEnv(
  provider: ProviderDescriptor,
  options: ProviderRuntimeEnvOptions = {}
): Record<string, string> {
  if (!isRuntimeProviderKind(provider.id)) {
    throw new Error(`${provider.id} is not an HTTP runtime provider.`);
  }

  const setup = provider.setup as {
    auth?: unknown;
    baseUrl?: unknown;
    headers?: unknown;
  };
  const setupBaseUrl = typeof setup.baseUrl === "string" ? trimTrailingSlash(setup.baseUrl) : undefined;
  const baseUrl = options.baseUrl ? trimTrailingSlash(options.baseUrl) : setupBaseUrl;

  if (!baseUrl) {
    throw new Error(`${provider.id} runtime environment requires a gateway base URL.`);
  }

  const agentId = options.agentId ?? getProviderSetupHeader(setup.headers, "x-mobigent-agent") ?? provider.id;
  const auth = typeof setup.auth === "string" ? setup.auth : undefined;

  return {
    MOBIGENT_PROVIDER: provider.id,
    MOBIGENT_HTTP_URL: baseUrl,
    MOBIGENT_AGENT_ID: agentId,
    ...(auth && auth !== "none"
      ? { MOBIGENT_HTTP_API_KEY: options.apiKeyPlaceholder ?? "${MOBIGENT_HTTP_API_KEY}" }
      : {}),
    MOBIGENT_MIN_APPS: String(options.minApps ?? 1),
    MOBIGENT_MIN_TOOLS: String(options.minTools ?? 1),
    MOBIGENT_WAIT_TIMEOUT_MS: String(options.waitTimeoutMs ?? 30_000),
    MOBIGENT_WAIT_INTERVAL_MS: String(options.waitIntervalMs ?? 500),
    MOBIGENT_WATCH_TOOLS: String(options.watchTools ?? false)
  };
}

export function stringifyProviderRuntimeEnv(
  provider: ProviderDescriptor,
  options: ProviderRuntimeEnvOptions = {}
) {
  return Object.entries(createProviderRuntimeEnv(provider, options))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

export function validateProviderSetup(provider: ProviderDescriptor): ProviderSetupValidationReport {
  const checks: ProviderSetupValidationCheck[] = [
    validateProviderIdentity(provider),
    validateProviderCapabilities(provider),
    ...validateProviderTransportSetup(provider)
  ];
  const hasFailures = checks.some((check) => check.status === "fail");
  const hasWarnings = checks.some((check) => check.status === "warn");
  const status: ProviderSetupValidationStatus = hasFailures ? "fail" : hasWarnings ? "warn" : "pass";

  return {
    ok: !hasFailures,
    status,
    provider: {
      id: provider.id,
      name: provider.name,
      transport: provider.capabilities.transport
    },
    checks,
    summary:
      status === "pass"
        ? `${provider.name} setup is ready.`
        : status === "warn"
          ? `${provider.name} setup is usable, but review warnings before shipping.`
          : `${provider.name} setup is missing required values.`
  };
}

export function formatProviderSetupValidation(report: ProviderSetupValidationReport) {
  return [
    `Mobigent provider setup: ${report.status.toUpperCase()}`,
    `${report.provider.name} (${report.provider.id}, ${report.provider.transport})`,
    report.summary,
    "",
    ...report.checks.map((check) => `[${check.status.toUpperCase()}] ${check.name}: ${check.message}`)
  ].join("\n");
}

function getProviderSetupHeader(headers: unknown, name: string) {
  if (!headers || typeof headers !== "object" || Array.isArray(headers)) {
    return undefined;
  }

  const value = (headers as Record<string, unknown>)[name];
  return typeof value === "string" ? value : undefined;
}

function validateProviderIdentity(provider: ProviderDescriptor): ProviderSetupValidationCheck {
  if (!provider.id || !provider.name) {
    return {
      name: "identity",
      status: "fail",
      message: "Provider id and name are required."
    };
  }

  return {
    name: "identity",
    status: "pass",
    message: `${provider.id} has provider identity metadata.`
  };
}

function validateProviderCapabilities(provider: ProviderDescriptor): ProviderSetupValidationCheck {
  if (!provider.capabilities.supportsTools) {
    return {
      name: "capabilities",
      status: "fail",
      message: "Provider must support tool calls to work with Mobigent."
    };
  }

  return {
    name: "capabilities",
    status: "pass",
    message: `${provider.capabilities.transport} transport supports Mobigent tools.`
  };
}

function validateProviderTransportSetup(provider: ProviderDescriptor): ProviderSetupValidationCheck[] {
  if (provider.capabilities.transport === "stdio") {
    return validateStdioProviderSetup(provider);
  }
  if (provider.capabilities.transport === "openapi") {
    return validateOpenApiProviderSetup(provider);
  }
  return validateHttpProviderSetup(provider);
}

function validateStdioProviderSetup(provider: ProviderDescriptor): ProviderSetupValidationCheck[] {
  const command = getProviderStdioCommand(provider.setup);

  return [
    command
      ? {
          name: "stdio.command",
          status: "pass",
          message: `Runs local command "${command}".`
        }
      : {
          name: "stdio.command",
          status: "fail",
          message: "Missing stdio command."
        },
    {
      name: "publicUrl",
      status: provider.capabilities.requiresPublicUrl ? "warn" : "pass",
      message: provider.capabilities.requiresPublicUrl
        ? "This stdio provider unexpectedly requires a public URL."
        : "No public gateway URL is required."
    }
  ];
}

function validateOpenApiProviderSetup(provider: ProviderDescriptor): ProviderSetupValidationCheck[] {
  const setup = getProviderOpenApiSetup(provider.setup);
  const baseUrl = getStringField(setup, "baseUrl");
  const openApiUrl = getStringField(setup, "openApiUrl");
  const publicUrlStatus = provider.capabilities.requiresPublicUrl && baseUrl && isLocalGatewayUrl(baseUrl) ? "fail" : "pass";

  return [
    baseUrl
      ? {
          name: "openapi.baseUrl",
          status: "pass",
          message: `Gateway base URL is ${baseUrl}.`
        }
      : {
          name: "openapi.baseUrl",
          status: "fail",
          message: "Missing gateway base URL."
        },
    openApiUrl
      ? {
          name: "openapi.schema",
          status: "pass",
          message: `OpenAPI schema is ${openApiUrl}.`
        }
      : {
          name: "openapi.schema",
          status: "fail",
          message: "Missing OpenAPI schema URL."
        },
    {
      name: "publicUrl",
      status: publicUrlStatus,
      message:
        publicUrlStatus === "fail"
          ? "Hosted action providers need an HTTPS URL reachable by the provider, not localhost."
          : provider.capabilities.requiresPublicUrl
            ? "Provider is configured with a public action-schema URL."
            : "Provider can use local or private gateway URLs."
    }
  ];
}

function validateHttpProviderSetup(provider: ProviderDescriptor): ProviderSetupValidationCheck[] {
  const baseUrl = getStringField(provider.setup, "baseUrl");
  const listToolsUrl = getStringField(provider.setup, "listToolsUrl");
  const callToolUrlTemplate = getStringField(provider.setup, "callToolUrlTemplate");
  const auth = getStringField(provider.setup, "auth");
  const agentId = getProviderSetupHeader(provider.setup.headers, "x-mobigent-agent");

  return [
    baseUrl
      ? {
          name: "http.baseUrl",
          status: "pass",
          message: `Gateway base URL is ${baseUrl}.`
        }
      : {
          name: "http.baseUrl",
          status: "fail",
          message: "Missing gateway base URL."
        },
    listToolsUrl && callToolUrlTemplate
      ? {
          name: "http.tools",
          status: "pass",
          message: "Tool discovery and call URLs are configured."
        }
      : {
          name: "http.tools",
          status: "fail",
          message: "Missing listToolsUrl or callToolUrlTemplate."
        },
    agentId
      ? {
          name: "http.agent",
          status: "pass",
          message: `Agent identity header is ${agentId}.`
        }
      : {
          name: "http.agent",
          status: "warn",
          message: "No x-mobigent-agent header is configured; gateway policy may treat calls as anonymous."
        },
    {
      name: "http.auth",
      status: auth && auth !== "none" ? "warn" : "pass",
      message:
        auth && auth !== "none"
          ? "Runtime must provide MOBIGENT_HTTP_API_KEY."
          : "No provider-side API key is required."
    }
  ];
}

function getProviderStdioCommand(setup: Record<string, unknown>) {
  const directCommand = getStringField(setup, "command");
  if (directCommand) {
    return directCommand;
  }

  const mcpServer = getNestedRecord(setup, ["mcpServers", "mobigent"]);
  const vscodeServer = getNestedRecord(setup, ["servers", "mobigent"]);
  return getStringField(mcpServer, "command") ?? getStringField(vscodeServer, "command");
}

function getProviderOpenApiSetup(setup: Record<string, unknown>) {
  return getRecordField(setup, "openApi") ?? setup;
}

function getRecordField(value: unknown, key: string): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const field = value[key];
  return isRecord(field) ? field : undefined;
}

function getNestedRecord(value: unknown, path: string[]): Record<string, unknown> | undefined {
  let current: unknown = value;
  for (const segment of path) {
    current = getRecordField(current, segment);
  }
  return isRecord(current) ? current : undefined;
}

function getStringField(value: unknown, key: string) {
  if (!isRecord(value)) {
    return undefined;
  }
  const field = value[key];
  return typeof field === "string" && field.length > 0 ? field : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isLocalGatewayUrl(value: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.0\.2\.2)(:|\/|$)/i.test(value);
}

function normalizeFilterList<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function providerMatchesQuery(provider: ProviderDescriptor, query: string) {
  const profile = getProviderIntegrationProfile(provider);

  return [
    provider.id,
    provider.kind,
    provider.name,
    provider.description,
    provider.docsUrl,
    profile.category,
    profile.setupComplexity,
    ...profile.bestFor,
    ...profile.productionNotes,
    stringifySearchableSetup(provider.setup)
  ]
    .filter((value): value is string => typeof value === "string")
    .some((value) => value.toLowerCase().includes(query));
}

function scoreProviderRecommendation(
  provider: ProviderDescriptor,
  options: Required<Pick<ProviderRecommendationOptions, "useCase" | "preferDynamicTools" | "allowPublicUrl">> & {
    query?: string;
  }
): ProviderRecommendation {
  let score = 0;
  const reasons: string[] = [];

  if (options.query) {
    if (!providerMatchesQuery(provider, options.query)) {
      return { provider, score: 0, reasons };
    }

    score += 20;
    reasons.push(`matches "${options.query}"`);
  }

  if (provider.capabilities.requiresPublicUrl && !options.allowPublicUrl) {
    score -= 40;
    reasons.push("requires a public URL");
  }

  if (options.useCase === "local-agent") {
    if (provider.capabilities.transport === "stdio") {
      score += 70;
      reasons.push("runs locally over MCP stdio");
    }
    if (!provider.capabilities.requiresPublicUrl) {
      score += 15;
      reasons.push("does not require a public gateway URL");
    }
  }

  if (options.useCase === "hosted-actions") {
    if (provider.capabilities.transport === "openapi") {
      score += 70;
      reasons.push("exports an OpenAPI/action schema");
    }
    if (provider.capabilities.requiresPublicUrl) {
      score += 15;
      reasons.push("designed for hosted HTTPS imports");
    }
  }

  if (options.useCase === "runtime-agent") {
    if (provider.capabilities.transport === "http" && isRuntimeProviderKind(provider.id)) {
      score += 70;
      reasons.push("works in server-side agent runtimes");
    }
    if (!provider.capabilities.requiresPublicUrl) {
      score += 10;
      reasons.push("can run against a local or private gateway");
    }
  }

  if (options.preferDynamicTools && provider.capabilities.supportsDynamicTools) {
    score += 12;
    reasons.push("supports live tool discovery");
  }

  if (provider.capabilities.supportsConfirmationNotes) {
    score += 3;
    reasons.push("preserves confirmation metadata");
  }

  if (provider.id === "generic-agent") {
    score -= 20;
    reasons.push("generic fallback after provider-specific options");
  }

  return { provider, score, reasons };
}

function stringifySearchableSetup(setup: Record<string, unknown>) {
  try {
    return JSON.stringify(setup);
  } catch {
    return "";
  }
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function createHttpAgentSetup(options: HttpAgentOptions, defaultAgentId: string) {
  const baseUrl = trimTrailingSlash(options.baseUrl);
  const auth = options.auth ?? "none";
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-mobigent-agent": options.agentId ?? defaultAgentId
  };

  if (auth === "bearer") {
    headers.authorization = "Bearer ${MOBIGENT_HTTP_API_KEY}";
  }
  if (auth === "api-key") {
    headers["x-mobigent-api-key"] = "${MOBIGENT_HTTP_API_KEY}";
  }

  return {
    baseUrl,
    configUrl: `${baseUrl}/config`,
    snapshotUrl: `${baseUrl}/snapshot`,
    listToolsUrl: `${baseUrl}/tools`,
    toolStreamUrl: `${baseUrl}/tools/stream`,
    callToolUrlTemplate: `${baseUrl}/tools/{toolName}/call`,
    auditUrl: `${baseUrl}/audit`,
    auditStreamUrl: `${baseUrl}/audit/stream`,
    auth,
    headers
  };
}

function createHttpHeaders(options: MobigentHttpClientOptions, callOptions: MobigentToolCallOptions = {}) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...options.headers,
    ...callOptions.headers
  };

  const agentId = callOptions.agentId ?? options.agentId;
  if (agentId) {
    headers["x-mobigent-agent"] = agentId;
  }

  const timeoutMs = callOptions.timeoutMs ?? options.timeoutMs;
  if (timeoutMs) {
    headers["x-mobigent-timeout-ms"] = String(timeoutMs);
  }

  if (callOptions.requestId) {
    headers["x-mobigent-request-id"] = callOptions.requestId;
  } else if (options.requestId) {
    headers["x-mobigent-request-id"] =
      typeof options.requestId === "function" ? options.requestId() : options.requestId;
  }

  if (callOptions.idempotencyKey) {
    headers["x-mobigent-idempotency-key"] = callOptions.idempotencyKey;
  }

  if (options.auth === "bearer" && options.apiKey) {
    headers.authorization = `Bearer ${options.apiKey}`;
  }

  if (options.auth === "api-key" && options.apiKey) {
    headers["x-mobigent-api-key"] = options.apiKey;
  }

  return headers;
}

async function requestWithRetries(
  request: typeof fetch,
  url: string,
  init: () => RequestInit,
  retries: number,
  retryDelayMs: number,
  operation: MobigentHttpOperation
) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const requestInit = init();
    const timeoutMs = readRequestTimeoutMs(requestInit);
    const timeout = createRequestTimeoutSignal(timeoutMs);

    try {
      const response = await request(url, {
        ...requestInit,
        signal: timeout.signal ?? requestInit.signal
      });
      if (!isTransientStatus(response.status) || attempt === retries) {
        return response;
      }
    } catch (error) {
      lastError = timeout.timedOut ? new Error(`Request timed out after ${timeoutMs}ms.`) : error;
      if (attempt === retries) {
        throw createNetworkError(operation, lastError);
      }
    } finally {
      timeout.clear();
    }

    if (retryDelayMs > 0) {
      await delay(retryDelayMs);
    }
  }

  throw createNetworkError(operation, lastError);
}

function readRequestTimeoutMs(init: RequestInit) {
  const headers = init.headers as Record<string, string> | undefined;
  const raw = headers?.["x-mobigent-timeout-ms"];
  const timeoutMs = raw ? Number(raw) : undefined;
  return timeoutMs && Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : undefined;
}

function createRequestTimeoutSignal(timeoutMs?: number) {
  if (!timeoutMs) {
    return {
      signal: undefined,
      timedOut: false,
      clear: () => {}
    };
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    get timedOut() {
      return timedOut;
    },
    clear: () => clearTimeout(timer)
  };
}

async function* watchToolStream(
  request: typeof fetch,
  url: string,
  options: MobigentHttpClientOptions,
  signal?: AbortSignal
): AsyncIterable<MobigentToolChangeEvent> {
  yield* watchSseStream(
    request,
    url,
    options,
    signal,
    "watchTools",
    "tool stream",
    isToolChangeEvent
  );
}

async function* watchAuditStream(
  request: typeof fetch,
  url: string,
  options: MobigentHttpClientOptions,
  signal?: AbortSignal
): AsyncIterable<MobigentAuditEvent> {
  yield* watchSseStream(
    request,
    url,
    options,
    signal,
    "watchAuditEvents",
    "audit stream",
    isAuditEvent
  );
}

async function* watchSseStream<T>(
  request: typeof fetch,
  url: string,
  options: MobigentHttpClientOptions,
  signal: AbortSignal | undefined,
  operation: MobigentHttpOperation,
  label: string,
  validate: (value: unknown) => value is T
): AsyncIterable<T> {
  let response: Response;
  try {
    response = await request(url, {
      method: "GET",
      headers: createHttpHeaders(options),
      signal
    });
  } catch (error) {
    throw createNetworkError(operation, error);
  }

  if (!response.ok) {
    throw createHttpError(operation, response.status, await readJson(response));
  }

  if (!response.body) {
    throw new MobigentHttpError({
      code: "invalid_response",
      operation,
      message: `Mobigent ${label} returned no response body.`,
      body: undefined
    });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        break;
      }

      buffer += decoder.decode(chunk.value, { stream: true });
      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const event = parseSseFrame(frame, operation, label, validate);
        if (event) {
          yield event;
        }
        boundary = buffer.indexOf("\n\n");
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function parseSseFrame<T>(
  frame: string,
  operation: MobigentHttpOperation,
  label: string,
  validate: (value: unknown) => value is T
): T | undefined {
  if (!frame.trim() || frame.startsWith(":")) {
    return undefined;
  }

  const data = frame
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trimStart())
    .join("\n");

  if (!data) {
    return undefined;
  }

  const parsed = JSON.parse(data) as unknown;
  if (!validate(parsed)) {
    throw new MobigentHttpError({
      code: "invalid_response",
      operation,
      message: `Mobigent ${label} emitted an invalid event.`,
      body: parsed
    });
  }

  return parsed;
}

function isToolChangeEvent(body: unknown): body is MobigentToolChangeEvent {
  if (!body || typeof body !== "object") {
    return false;
  }
  const candidate = body as { reason?: unknown; tools?: unknown };
  return (
    (candidate.reason === "snapshot" || candidate.reason === "changed") &&
    Array.isArray(candidate.tools)
  );
}

function isTransientStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function delayWithSignal(ms: number, signal: AbortSignal | undefined, operation: MobigentHttpOperation) {
  throwIfAborted(signal, operation);
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        reject(createNetworkError(operation, new Error("Request aborted.")));
      },
      { once: true }
    );
  });
}

function throwIfAborted(signal: AbortSignal | undefined, operation: MobigentHttpOperation) {
  if (signal?.aborted) {
    throw createNetworkError(operation, new Error("Request aborted."));
  }
}

function readMastraInput(context: { input?: Record<string, unknown> } | Record<string, unknown>) {
  if ("input" in context && context.input && typeof context.input === "object") {
    return context.input as Record<string, unknown>;
  }

  return context as Record<string, unknown>;
}

function formatReadiness(readiness: MobigentReadiness) {
  const apps = readiness.checks.apps;
  const tools = readiness.checks.tools;
  return `apps ${apps.actual}/${apps.required}, tools ${tools.actual}/${tools.required}`;
}

function validateRuntimeConfigBaseUrl(baseUrl: string): MobigentProviderRuntimeConfigCheck {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    return {
      name: "gateway-url",
      status: "fail",
      message: "MOBIGENT_HTTP_URL must be a valid HTTP or HTTPS URL."
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      name: "gateway-url",
      status: "fail",
      message: "MOBIGENT_HTTP_URL must use http:// or https:// for provider runtimes."
    };
  }

  if (isLocalGatewayUrl(baseUrl)) {
    return {
      name: "gateway-url",
      status: "warn",
      message: "Gateway URL points at a local host; this is fine for development but not for deployed agents.",
      details: { baseUrl }
    };
  }

  return {
    name: "gateway-url",
    status: "pass",
    message: "Gateway URL is valid for an HTTP provider runtime.",
    details: { baseUrl }
  };
}

function validateRuntimeConfigAuth(
  config: MobigentProviderRuntimeConfig
): MobigentProviderRuntimeConfigCheck {
  if ((config.auth === "bearer" || config.auth === "api-key") && !config.apiKey) {
    return {
      name: "auth",
      status: "fail",
      message: `${config.auth} auth requires MOBIGENT_HTTP_API_KEY.`
    };
  }

  if (config.auth === "none") {
    return {
      name: "auth",
      status: "warn",
      message: "Provider runtime will call the gateway without an API key."
    };
  }

  return {
    name: "auth",
    status: "pass",
    message: `${config.auth} auth is configured for provider runtime calls.`
  };
}

function validateRuntimeConfigAgent(
  config: MobigentProviderRuntimeConfig
): MobigentProviderRuntimeConfigCheck {
  if (!config.agentId.trim()) {
    return {
      name: "agent-id",
      status: "fail",
      message: "MOBIGENT_AGENT_ID must not be empty."
    };
  }

  return {
    name: "agent-id",
    status: "pass",
    message: `Agent identity ${config.agentId} will be sent with discovery and tool calls.`
  };
}

function validateRuntimeConfigWaits(
  config: MobigentProviderRuntimeConfig
): MobigentProviderRuntimeConfigCheck {
  if (config.minApps === 0 || config.minTools === 0) {
    return {
      name: "readiness",
      status: "warn",
      message: "Readiness waits allow zero apps or zero tools; startup may succeed before a mobile app is usable.",
      details: {
        minApps: config.minApps,
        minTools: config.minTools
      }
    };
  }

  return {
    name: "readiness",
    status: "pass",
    message: `Runtime waits for at least ${config.minApps} app(s) and ${config.minTools} tool(s).`,
    details: {
      waitTimeoutMs: config.waitTimeoutMs,
      waitIntervalMs: config.waitIntervalMs
    }
  };
}

function summarizeRuntimeConfigStatus(
  checks: MobigentProviderRuntimeConfigCheck[]
): MobigentProviderRuntimeConfigStatus {
  if (checks.some((check) => check.status === "fail")) {
    return "fail";
  }
  if (checks.some((check) => check.status === "warn")) {
    return "warn";
  }
  return "pass";
}

async function runDiagnosticCheck<T>(
  checks: MobigentProviderDiagnosticCheck[],
  name: string,
  passMessage: string,
  operation: () => Promise<T>,
  map?: (value: T) => MobigentProviderDiagnosticCheck
): Promise<T | undefined> {
  try {
    const value = await operation();
    checks.push(
      map?.(value) ?? {
        name,
        status: "pass",
        message: passMessage,
        details: value
      }
    );
    return value;
  } catch (error) {
    checks.push({
      name,
      status: "fail",
      message: error instanceof Error ? error.message : String(error),
      details: isMobigentHttpError(error)
        ? {
            code: error.code,
            operation: error.operation,
            status: error.status,
            retryable: error.retryable,
            body: error.body
          }
        : undefined
    });
    return undefined;
  }
}

function summarizeDiagnosticStatus(checks: MobigentProviderDiagnosticCheck[]): MobigentProviderDiagnosticStatus {
  if (checks.some((check) => check.status === "fail")) {
    return "fail";
  }
  if (checks.some((check) => check.status === "warn")) {
    return "warn";
  }
  return "pass";
}

function indentDiagnosticDetails(details: unknown) {
  return JSON.stringify(details, null, 2)
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}

function isMobigentHttpError(error: unknown): error is MobigentHttpError {
  return error instanceof MobigentHttpError;
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readToolCallInput(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null || value === "") {
    return {};
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (isPlainRecord(parsed)) {
        return parsed;
      }
    } catch {
      // Fall through to the explicit error below.
    }
    throw new Error("Tool call arguments must be a JSON object.");
  }
  if (isPlainRecord(value)) {
    return value;
  }

  throw new Error("Tool call input must be an object.");
}

function createToolCallResultPayload(result: MobigentToolCallResult): Record<string, unknown> {
  if (result.error) {
    return {
      error: result.error,
      name: result.name
    };
  }

  if (isPlainRecord(result.result)) {
    return result.result;
  }

  return {
    result: result.result ?? null
  };
}

function resolveToolResultFormat(kind: MobigentProviderRuntimeKind): MobigentToolResultFormat {
  if (kind === "openai-responses") {
    return "openai-responses";
  }

  if (kind === "anthropic-tool-use") {
    return "anthropic-tool-use";
  }

  if (kind === "google-gemini" || kind === "google-vertex-ai") {
    return "google-gemini";
  }

  if (kind === "aws-bedrock-converse") {
    return "aws-bedrock-converse";
  }

  if (
    kind === "azure-openai" ||
    kind === "openai-compatible" ||
    kind === "openrouter" ||
    kind === "litellm" ||
    kind === "ollama" ||
    kind === "lm-studio" ||
    kind === "groq" ||
    kind === "perplexity" ||
    kind === "xai-grok" ||
    kind === "deepseek" ||
    kind === "together-ai" ||
    kind === "fireworks-ai" ||
    kind === "qwen-dashscope" ||
    kind === "nvidia-nim" ||
    kind === "cloudflare-ai-gateway" ||
    kind === "mistral" ||
    kind === "cohere"
  ) {
    return "chat-completions";
  }

  return "generic-agent";
}

function removeUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter((entry) => entry[1] !== undefined)) as T;
}

function formatToolCallError(error: unknown): MobigentToolCallResult["error"] {
  if (error instanceof MobigentHttpError) {
    return {
      message: error.message,
      code: error.code,
      retryable: error.retryable
    };
  }

  return {
    message: error instanceof Error ? error.message : String(error)
  };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function isToolListBody(body: unknown): body is { tools: MobigentHttpTool[] } {
  if (!body || typeof body !== "object" || !("tools" in body)) {
    return false;
  }
  const tools = (body as { tools?: unknown }).tools;
  return Array.isArray(tools);
}

function isToolBody(body: unknown): body is { tool: MobigentHttpTool } {
  if (!body || typeof body !== "object" || Array.isArray(body) || !("tool" in body)) {
    return false;
  }

  const tool = (body as { tool?: unknown }).tool as Partial<MobigentHttpTool> | undefined;
  return Boolean(
    tool &&
      typeof tool.name === "string" &&
      typeof tool.description === "string" &&
      isPlainRecord(tool.inputSchema)
  );
}

function isProviderListBody(body: unknown): body is { providers: ProviderDescriptor[] } {
  if (!body || typeof body !== "object" || !("providers" in body)) {
    return false;
  }
  const providers = (body as { providers?: unknown }).providers;
  return Array.isArray(providers);
}

function isAgentVisibilityListBody(body: unknown): body is { agents: MobigentAgentVisibility[] } {
  if (!body || typeof body !== "object" || !("agents" in body)) {
    return false;
  }
  const agents = (body as { agents?: unknown }).agents;
  return (
    Array.isArray(agents) &&
    agents.every((agent) => {
      const candidate = agent as Partial<MobigentAgentVisibility> | undefined;
      return Boolean(
        candidate &&
          typeof candidate.agentId === "string" &&
          typeof candidate.profileConfigured === "boolean" &&
          typeof candidate.visibleTools === "number" &&
          typeof candidate.hiddenTools === "number" &&
          Array.isArray(candidate.visibleToolNames) &&
          Array.isArray(candidate.hiddenToolNames)
      );
    })
  );
}

function isGatewayConfig(body: unknown): body is MobigentGatewayConfig {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return false;
  }

  const candidate = body as Partial<MobigentGatewayConfig>;
  return Boolean(
    candidate.name === "Mobigent Gateway" &&
      typeof candidate.version === "string" &&
      typeof candidate.baseUrl === "string" &&
      isGatewayConfigProtocol(candidate.protocol) &&
      isGatewayConfigAuth(candidate.auth) &&
      isGatewayConfigEndpoints(candidate.endpoints) &&
      isGatewayConfigFeatures(candidate.features) &&
      isGatewayConfigLimits(candidate.limits) &&
      isGatewayConfigHeaders(candidate.headers)
  );
}

function isGatewayConfigProtocol(value: unknown): value is MobigentGatewayConfig["protocol"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const protocol = value as Partial<MobigentGatewayConfig["protocol"]>;
  return (
    typeof protocol.currentVersion === "number" &&
    Array.isArray(protocol.supportedVersions) &&
    protocol.supportedVersions.every((version) => typeof version === "number")
  );
}

function isGatewayConfigAuth(value: unknown): value is MobigentGatewayConfig["auth"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const auth = value as Partial<MobigentGatewayConfig["auth"]>;
  return (
    typeof auth.required === "boolean" &&
    Array.isArray(auth.schemes) &&
    auth.schemes.every((scheme) => scheme === "bearer" || scheme === "api-key") &&
    typeof auth.apiKeyHeader === "string" &&
    typeof auth.bearerHeader === "string"
  );
}

function isGatewayConfigEndpoints(value: unknown): value is MobigentGatewayConfig["endpoints"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const endpoints = value as Partial<Record<keyof MobigentGatewayConfig["endpoints"], unknown>>;
  return [
    "health",
    "ready",
    "config",
    "agents",
    "apps",
    "providers",
    "snapshot",
    "tools",
    "toolStream",
    "toolLookupTemplate",
    "metrics",
    "prometheusMetrics",
    "audit",
    "auditStream",
    "openApi",
    "toolCallTemplate"
  ].every((key) => typeof endpoints[key as keyof MobigentGatewayConfig["endpoints"]] === "string");
}

function isGatewayConfigFeatures(value: unknown): value is MobigentGatewayConfig["features"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const features = value as Partial<Record<keyof MobigentGatewayConfig["features"], unknown>>;
  return [
    "dynamicTools",
    "toolStreaming",
    "auditStreaming",
    "appSessionDiscovery",
    "providerCatalog",
    "providerSnapshot",
    "openApiSchema",
    "perCallTimeouts",
    "idempotencyKeys",
    "requestIds",
    "agentVisibility",
    "agentScopedDiscovery",
    "agentProfiles"
  ].every((key) => typeof features[key as keyof MobigentGatewayConfig["features"]] === "boolean");
}

function isGatewayConfigLimits(value: unknown): value is MobigentGatewayConfig["limits"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const limits = value as Partial<MobigentGatewayConfig["limits"]>;
  return (
    (typeof limits.jsonBodyLimit === "string" || typeof limits.jsonBodyLimit === "number") &&
    typeof limits.maxTimeoutMs === "number"
  );
}

function isGatewayConfigHeaders(value: unknown): value is MobigentGatewayConfig["headers"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const headers = value as Partial<Record<keyof MobigentGatewayConfig["headers"], unknown>>;
  return ["agentId", "idempotencyKey", "requestId", "timeoutMs"].every(
    (key) => typeof headers[key as keyof MobigentGatewayConfig["headers"]] === "string"
  );
}

function isAppListBody(body: unknown): body is { apps: MobigentAppSession[] } {
  if (!body || typeof body !== "object" || !("apps" in body)) {
    return false;
  }
  const apps = (body as { apps?: unknown }).apps;
  return Array.isArray(apps) && apps.every(isAppSession);
}

function isAppSession(value: unknown): value is MobigentAppSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<MobigentAppSession>;
  return (
    typeof session.sessionId === "string" &&
    typeof session.connectedAt === "string" &&
    typeof session.lastSeenAt === "string" &&
    typeof session.ageMs === "number" &&
    typeof session.idleMs === "number" &&
    typeof session.authenticated === "boolean" &&
    isCapabilities(session.capabilities) &&
    isOptionalAppMetadata(session.app) &&
    isOptionalManifestMetadata(session.manifest)
  );
}

function isCapabilities(value: unknown): value is MobigentAppSession["capabilities"] {
  const capabilities = value as Partial<MobigentAppSession["capabilities"]> | undefined;
  return Boolean(
    capabilities &&
      typeof capabilities.actions === "number" &&
      typeof capabilities.resources === "number" &&
      typeof capabilities.components === "number" &&
      typeof capabilities.tools === "number"
  );
}

function isOptionalAppMetadata(value: unknown): value is MobigentAppSession["app"] {
  if (value === undefined) {
    return true;
  }
  const app = value as Partial<NonNullable<MobigentAppSession["app"]>>;
  return (
    typeof app.id === "string" &&
    typeof app.name === "string" &&
    (app.sdk === "ios" || app.sdk === "android" || app.sdk === "react-native") &&
    typeof app.version === "string" &&
    typeof app.protocolVersion === "number" &&
    typeof app.protocolCompatible === "boolean"
  );
}

function isOptionalManifestMetadata(value: unknown): value is MobigentAppSession["manifest"] {
  if (value === undefined) {
    return true;
  }
  const manifest = value as Partial<NonNullable<MobigentAppSession["manifest"]>>;
  return (
    typeof manifest.acceptedAt === "string" &&
    typeof manifest.signed === "boolean" &&
    (manifest.keyId === undefined || typeof manifest.keyId === "string")
  );
}

function isHealthBody(body: unknown): body is MobigentHealth {
  if (!body || typeof body !== "object") {
    return false;
  }

  const candidate = body as { ok?: unknown; name?: unknown; status?: unknown };
  if (typeof candidate.ok !== "boolean" || typeof candidate.name !== "string") {
    return false;
  }

  const status = candidate.status as Partial<MobigentGatewayStatus> | undefined;
  return isGatewayStatus(status);
}

function isReadinessBody(body: unknown): body is MobigentReadiness {
  if (!isHealthBody(body)) {
    return false;
  }

  const candidate = body as Partial<MobigentReadiness>;
  return (
    isReadinessRequirements(candidate.requirements) &&
    isReadinessCheck(candidate.checks?.apps) &&
    isReadinessCheck(candidate.checks?.tools)
  );
}

function isReadinessRequirements(value: unknown): value is MobigentReadiness["requirements"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Partial<MobigentReadiness["requirements"]>;
  return typeof candidate.minApps === "number" && typeof candidate.minTools === "number";
}

function isReadinessCheck(value: unknown): value is MobigentReadiness["checks"]["apps"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Partial<MobigentReadiness["checks"]["apps"]>;
  return (
    typeof candidate.ok === "boolean" &&
    typeof candidate.actual === "number" &&
    typeof candidate.required === "number"
  );
}

function isGatewaySnapshot(body: unknown): body is MobigentGatewaySnapshot {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return false;
  }

  const candidate = body as Partial<MobigentGatewaySnapshot>;
  return (
    typeof candidate.at === "string" &&
    (candidate.agentId === undefined || typeof candidate.agentId === "string") &&
    isGatewayConfig(candidate.config) &&
    isHealthBody(candidate.health) &&
    isReadinessBody(candidate.readiness) &&
    Array.isArray(candidate.apps) &&
    candidate.apps.every(isAppSession) &&
    Array.isArray(candidate.agents) &&
    Array.isArray(candidate.providers) &&
    Array.isArray(candidate.tools) &&
    isMetricsBody({ metrics: candidate.metrics }) &&
    Array.isArray(candidate.audit) &&
    candidate.audit.every(isAuditEvent)
  );
}

function isMetricsBody(body: unknown): body is { metrics: MobigentMetrics } {
  if (!body || typeof body !== "object" || !("metrics" in body)) {
    return false;
  }

  const metrics = (body as { metrics?: unknown }).metrics as Partial<MobigentMetrics> | undefined;
  if (!metrics || !isGatewayStatus(metrics.status)) {
    return false;
  }

  return (
    isNumberRecord(metrics.auditEvents) &&
    isToolCallMetricCounts(metrics.toolCalls) &&
    isMetricBucketRecord(metrics.byTool) &&
    isMetricBucketRecord(metrics.byAgent)
  );
}

function isAuditListBody(body: unknown): body is { events: MobigentAuditEvent[] } {
  if (!body || typeof body !== "object" || !("events" in body)) {
    return false;
  }

  return Array.isArray((body as { events?: unknown }).events) && (body as { events: unknown[] }).events.every(isAuditEvent);
}

function isAuditEvent(value: unknown): value is MobigentAuditEvent {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<MobigentAuditEvent>;
  return Boolean(
    typeof candidate.id === "string" &&
      typeof candidate.at === "string" &&
      typeof candidate.type === "string" &&
      (candidate.severity === "info" || candidate.severity === "warn" || candidate.severity === "error") &&
      typeof candidate.message === "string" &&
      (candidate.sessionId === undefined || typeof candidate.sessionId === "string") &&
      (candidate.tool === undefined || typeof candidate.tool === "string") &&
      (candidate.agentId === undefined || typeof candidate.agentId === "string") &&
      (candidate.durationMs === undefined || typeof candidate.durationMs === "number") &&
      isOptionalAuditApp(candidate.app) &&
      (candidate.details === undefined || isPlainRecord(candidate.details))
  );
}

function isOptionalAuditApp(value: unknown): value is MobigentAuditEvent["app"] {
  if (value === undefined) {
    return true;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Partial<NonNullable<MobigentAuditEvent["app"]>>;
  return typeof candidate.id === "string" && typeof candidate.name === "string";
}

function isGatewayStatus(status: unknown): status is MobigentGatewayStatus {
  const candidate = status as Partial<MobigentGatewayStatus> | undefined;
  return Boolean(
    candidate &&
      typeof candidate.appSessions === "number" &&
      typeof candidate.authenticatedAppSessions === "number" &&
      typeof candidate.appsWithManifests === "number" &&
      typeof candidate.tools === "number" &&
      typeof candidate.auditEvents === "number" &&
      typeof candidate.idempotencyRecords === "number" &&
      typeof candidate.rateLimitBuckets === "number" &&
      typeof candidate.manifestSigningRequired === "boolean" &&
      typeof candidate.appAllowlistEnabled === "boolean"
  );
}

function isToolCallMetricCounts(value: unknown): value is MobigentToolCallMetricCounts {
  const candidate = value as Partial<MobigentToolCallMetricCounts> | undefined;
  return Boolean(
    candidate &&
      typeof candidate.started === "number" &&
      typeof candidate.succeeded === "number" &&
      typeof candidate.failed === "number" &&
      typeof candidate.denied === "number" &&
      typeof candidate.timedOut === "number" &&
      typeof candidate.deduplicated === "number"
  );
}

function isMetricBucketRecord(value: unknown): value is Record<string, MobigentToolCallMetricCounts> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(isToolCallMetricCounts);
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  if (!isPlainRecord(value)) {
    return false;
  }

  return Object.values(value).every((entry) => typeof entry === "number");
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!isPlainRecord(value)) {
    return false;
  }

  return Object.values(value).every((entry) => typeof entry === "string");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isProviderRecommendationUseCaseValue(value: unknown): value is ProviderRecommendationUseCase {
  return value === "local-agent" || value === "hosted-actions" || value === "runtime-agent";
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isToolCallBody(body: unknown): body is { result: unknown } {
  return Boolean(body && typeof body === "object" && "result" in body);
}

function createHttpError(operation: MobigentHttpOperation, status: number, body: unknown) {
  const code = classifyStatus(status, body);
  return new MobigentHttpError({
    code,
    operation,
    status,
    body,
    retryable: readRetryable(body) ?? isTransientStatus(status),
    message: `Mobigent ${formatOperation(operation)} failed: ${formatHttpError(status, body)}`
  });
}

function createNetworkError(operation: MobigentHttpOperation, cause: unknown) {
  return new MobigentHttpError({
    code: "network_error",
    operation,
    retryable: true,
    cause,
    message: `Mobigent ${formatOperation(operation)} failed: ${
      cause instanceof Error ? cause.message : String(cause)
    }`
  });
}

function formatOperation(operation: MobigentHttpOperation) {
  if (operation === "getConfig") {
    return "gateway config request";
  }
  if (operation === "getHealth") {
    return "health check";
  }
  if (operation === "getReadiness") {
    return "readiness check";
  }
  if (operation === "getSnapshot") {
    return "gateway snapshot request";
  }
  if (operation === "getMetrics") {
    return "metrics request";
  }
  if (operation === "listAuditEvents") {
    return "audit log request";
  }
  if (operation === "listApps") {
    return "app discovery";
  }
  if (operation === "listProviders") {
    return "provider discovery";
  }
  if (operation === "listTools") {
    return "tool discovery";
  }
  if (operation === "getTool") {
    return "tool lookup";
  }
  if (operation === "waitForTools") {
    return "tool readiness check";
  }
  if (operation === "waitForReadiness") {
    return "gateway readiness wait";
  }
  if (operation === "watchTools") {
    return "tool stream";
  }
  if (operation === "watchAuditEvents") {
    return "audit stream";
  }
  return "tool call";
}

function classifyStatus(status: number, body: unknown): MobigentHttpErrorCode {
  const structuredCode = readErrorCode(body);
  if (structuredCode) {
    return structuredCode;
  }

  const errorText = readErrorText(body).toLowerCase();

  if (status === 401) {
    return "unauthorized";
  }
  if (status === 403 || errorText.includes("not allowed")) {
    return "forbidden";
  }
  if (status === 404 || errorText.includes("no connected app exposes tool")) {
    return "not_found";
  }
  if (status === 409) {
    return "conflict";
  }
  if (status === 408 || errorText.includes("timed out")) {
    return "timeout";
  }
  if (status === 429 || errorText.includes("rate limit")) {
    return "rate_limited";
  }
  if (status === 400 && errorText.includes("invalid")) {
    return "invalid_input";
  }
  return "gateway_error";
}

function readErrorCode(body: unknown): MobigentHttpErrorCode | undefined {
  if (!body || typeof body !== "object" || !("code" in body)) {
    return undefined;
  }

  const code = String((body as { code?: unknown }).code);
  if (
    code === "unauthorized" ||
    code === "forbidden" ||
    code === "invalid_input" ||
    code === "not_found" ||
    code === "rate_limited" ||
    code === "conflict" ||
    code === "timeout"
  ) {
    return code;
  }

  if (code === "bad_request") {
    return "invalid_input";
  }
  if (code === "upstream_error") {
    return "gateway_error";
  }

  return undefined;
}

function readRetryable(body: unknown) {
  if (body && typeof body === "object" && "retryable" in body) {
    const retryable = (body as { retryable?: unknown }).retryable;
    return typeof retryable === "boolean" ? retryable : undefined;
  }

  return undefined;
}

function readErrorText(body: unknown) {
  if (body && typeof body === "object" && "error" in body) {
    return String((body as { error?: unknown }).error);
  }
  if (typeof body === "string") {
    return body;
  }
  return "";
}

function formatHttpError(status: number, body: unknown) {
  const errorText = readErrorText(body);
  if (errorText) {
    return `${status} ${errorText}`;
  }
  return `${status}`;
}
