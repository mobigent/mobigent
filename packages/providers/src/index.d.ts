export type ProviderKind =
  | 'mcp-stdio'
  | 'openapi'
  | 'chatgpt-actions'
  | 'openai-responses'
  | 'anthropic-tool-use'
  | 'google-gemini'
  | 'aws-bedrock-converse'
  | 'vercel-ai-sdk'
  | 'langchain'
  | 'llamaindex'
  | 'mastra'
  | 'claude-desktop'
  | 'cursor'
  | 'vscode'
  | 'generic-agent';
export type ProviderTransport = 'stdio' | 'http' | 'openapi';
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
export type McpStdioOptions = {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
};
export type OpenApiOptions = {
  baseUrl: string;
  schemaPath?: string;
  auth?: 'none' | 'bearer' | 'api-key';
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
export type MobigentHttpClientOptions = {
  baseUrl: string;
  apiKey?: string;
  auth?: 'none' | 'bearer' | 'api-key';
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
  reason: 'snapshot' | 'changed';
  tools: MobigentHttpTool[];
};
export type MobigentToolStreamOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
};
export type MobigentHttpClient = {
  listTools: () => Promise<MobigentHttpTool[]>;
  callTool: (
    toolName: string,
    input?: Record<string, unknown>,
    options?: MobigentToolCallOptions,
  ) => Promise<unknown>;
  watchTools: (options?: MobigentToolStreamOptions) => AsyncIterable<MobigentToolChangeEvent>;
  headers: () => Record<string, string>;
};
export type MobigentHttpErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid_input'
  | 'not_found'
  | 'rate_limited'
  | 'gateway_error'
  | 'network_error'
  | 'invalid_response';
export declare class MobigentHttpError extends Error {
  readonly code: MobigentHttpErrorCode;
  readonly operation: 'listTools' | 'callTool' | 'watchTools';
  readonly status?: number;
  readonly body?: unknown;
  readonly retryable: boolean;
  constructor(options: {
    code: MobigentHttpErrorCode;
    operation: 'listTools' | 'callTool' | 'watchTools';
    message: string;
    status?: number;
    body?: unknown;
    retryable?: boolean;
    cause?: unknown;
  });
}
export type OpenAiToolDefinition = {
  type: 'function';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
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
  lc_namespace: ['mobigent', 'tools'];
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
  execute: (
    context:
      | {
          input?: Record<string, unknown>;
        }
      | Record<string, unknown>,
  ) => Promise<unknown>;
};
export declare function createMcpStdioProvider(options?: McpStdioOptions): ProviderDescriptor;
export declare function createClaudeDesktopProvider(options?: McpStdioOptions): ProviderDescriptor;
export declare function createCursorProvider(options?: McpStdioOptions): ProviderDescriptor;
export declare function createVsCodeProvider(options?: McpStdioOptions): ProviderDescriptor;
export declare function createOpenApiProvider(options: OpenApiOptions): ProviderDescriptor;
export declare function createChatGptActionsProvider(options: OpenApiOptions): ProviderDescriptor;
export declare function createOpenAiResponsesProvider(
  options: HttpAgentOptions,
): ProviderDescriptor;
export declare function createAnthropicToolUseProvider(
  options: HttpAgentOptions,
): ProviderDescriptor;
export declare function createGoogleGeminiProvider(options: HttpAgentOptions): ProviderDescriptor;
export declare function createAwsBedrockConverseProvider(
  options: HttpAgentOptions,
): ProviderDescriptor;
export declare function createVercelAiSdkProvider(options: HttpAgentOptions): ProviderDescriptor;
export declare function createLangChainProvider(options: HttpAgentOptions): ProviderDescriptor;
export declare function createLlamaIndexProvider(options: HttpAgentOptions): ProviderDescriptor;
export declare function createMastraProvider(options: HttpAgentOptions): ProviderDescriptor;
export declare function createMobigentHttpClient(
  options: MobigentHttpClientOptions,
): MobigentHttpClient;
export declare function toOpenAiTools(tools: MobigentHttpTool[]): OpenAiToolDefinition[];
export declare function toAnthropicTools(tools: MobigentHttpTool[]): AnthropicToolDefinition[];
export declare function toGeminiFunctionDeclarations(
  tools: MobigentHttpTool[],
): GeminiFunctionDeclaration[];
export declare function toBedrockToolConfigTools(
  tools: MobigentHttpTool[],
): BedrockToolSpecification[];
export declare function createMobigentToolExecutor(
  client: MobigentHttpClient,
): (toolName: string, input?: Record<string, unknown>) => Promise<unknown>;
export declare function toExecutableTools(
  tools: MobigentHttpTool[],
  client: MobigentHttpClient,
): MobigentExecutableTool[];
export declare function toLangChainTools(
  tools: MobigentHttpTool[],
  client: MobigentHttpClient,
): LangChainToolDefinition[];
export declare function toLlamaIndexTools(
  tools: MobigentHttpTool[],
  client: MobigentHttpClient,
): LlamaIndexToolDefinition[];
export declare function toMastraTools(
  tools: MobigentHttpTool[],
  client: MobigentHttpClient,
): MastraToolDefinition[];
export declare function toVercelAiSdkTools(
  tools: MobigentHttpTool[],
  client: MobigentHttpClient,
): Record<string, VercelAiSdkToolDefinition>;
export declare function createGenericAgentProvider(options: {
  mcp?: McpStdioOptions;
  openApi?: OpenApiOptions;
}): ProviderDescriptor;
export declare function createProviderCatalog(options?: {
  mcp?: McpStdioOptions;
  openApi?: OpenApiOptions;
}): ProviderDescriptor[];
export declare function stringifyProviderSetup(provider: ProviderDescriptor): string;
export declare function createProviderGuide(provider: ProviderDescriptor): string;
//# sourceMappingURL=index.d.ts.map
