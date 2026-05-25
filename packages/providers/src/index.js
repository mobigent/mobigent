export class MobigentHttpError extends Error {
    code;
    operation;
    status;
    body;
    retryable;
    constructor(options) {
        super(options.message, { cause: options.cause });
        this.name = "MobigentHttpError";
        this.code = options.code;
        this.operation = options.operation;
        this.status = options.status;
        this.body = options.body;
        this.retryable = options.retryable ?? false;
    }
}
const mcpCapabilities = {
    transport: "stdio",
    supportsTools: true,
    supportsDynamicTools: true,
    requiresPublicUrl: false,
    supportsConfirmationNotes: true
};
const openApiCapabilities = {
    transport: "openapi",
    supportsTools: true,
    supportsDynamicTools: false,
    requiresPublicUrl: true,
    supportsConfirmationNotes: true
};
const httpAgentCapabilities = {
    transport: "http",
    supportsTools: true,
    supportsDynamicTools: true,
    requiresPublicUrl: false,
    supportsConfirmationNotes: true
};
export function createMcpStdioProvider(options = {}) {
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
export function createClaudeDesktopProvider(options = {}) {
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
export function createCursorProvider(options = {}) {
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
export function createVsCodeProvider(options = {}) {
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
export function createOpenApiProvider(options) {
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
export function createChatGptActionsProvider(options) {
    return {
        ...createOpenApiProvider(options),
        id: "chatgpt-actions",
        kind: "chatgpt-actions",
        name: "ChatGPT Actions",
        description: "ChatGPT Custom GPT Actions configuration using Mobigent's OpenAPI schema.",
        docsUrl: "https://platform.openai.com/docs/actions"
    };
}
export function createOpenAiResponsesProvider(options) {
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
export function createAnthropicToolUseProvider(options) {
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
export function createGoogleGeminiProvider(options) {
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
export function createAwsBedrockConverseProvider(options) {
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
export function createVercelAiSdkProvider(options) {
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
export function createLangChainProvider(options) {
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
export function createLlamaIndexProvider(options) {
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
export function createMastraProvider(options) {
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
export function createMobigentHttpClient(options) {
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
        async listTools() {
            const response = await requestWithRetries(request, `${baseUrl}/tools`, () => ({
                method: "GET",
                headers: headers()
            }), retries, retryDelayMs, "listTools");
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
        async callTool(toolName, input = {}, callOptions = {}) {
            const response = await requestWithRetries(request, `${baseUrl}/tools/${encodeURIComponent(toolName)}/call`, () => ({
                method: "POST",
                headers: createHttpHeaders(options, callOptions),
                body: JSON.stringify(input)
            }), retries, retryDelayMs, "callTool");
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
        watchTools(streamOptions = {}) {
            return watchToolStream(request, `${baseUrl}/tools/stream`, {
                ...options,
                headers: {
                    ...options.headers,
                    ...streamOptions.headers
                }
            }, streamOptions.signal);
        }
    };
}
export function toOpenAiTools(tools) {
    return tools.map((tool) => ({
        type: "function",
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
    }));
}
export function toAnthropicTools(tools) {
    return tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema
    }));
}
export function toGeminiFunctionDeclarations(tools) {
    return tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
    }));
}
export function toBedrockToolConfigTools(tools) {
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
export function createMobigentToolExecutor(client) {
    return async (toolName, input = {}) => {
        return client.callTool(toolName, input);
    };
}
export function toExecutableTools(tools, client) {
    return tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        schema: tool.inputSchema,
        execute: (input = {}) => client.callTool(tool.name, input)
    }));
}
export function toLangChainTools(tools, client) {
    return toExecutableTools(tools, client).map((tool) => ({
        ...tool,
        lc_namespace: ["mobigent", "tools"]
    }));
}
export function toLlamaIndexTools(tools, client) {
    return tools.map((tool) => ({
        metadata: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema
        },
        call: (input = {}) => client.callTool(tool.name, input)
    }));
}
export function toMastraTools(tools, client) {
    return tools.map((tool) => ({
        id: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        execute: (context) => client.callTool(tool.name, readMastraInput(context))
    }));
}
export function toVercelAiSdkTools(tools, client) {
    return Object.fromEntries(tools.map((tool) => [
        tool.name,
        {
            description: tool.description,
            parameters: tool.inputSchema,
            execute: (input = {}) => client.callTool(tool.name, input)
        }
    ]));
}
export function createGenericAgentProvider(options) {
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
export function createProviderCatalog(options = {}) {
    const providers = [
        createMcpStdioProvider(options.mcp),
        createClaudeDesktopProvider(options.mcp),
        createCursorProvider(options.mcp),
        createVsCodeProvider(options.mcp)
    ];
    if (options.openApi) {
        providers.push(createOpenApiProvider(options.openApi));
        providers.push(createChatGptActionsProvider(options.openApi));
        providers.push(createOpenAiResponsesProvider(options.openApi));
        providers.push(createAnthropicToolUseProvider(options.openApi));
        providers.push(createGoogleGeminiProvider(options.openApi));
        providers.push(createAwsBedrockConverseProvider(options.openApi));
        providers.push(createVercelAiSdkProvider(options.openApi));
        providers.push(createLangChainProvider(options.openApi));
        providers.push(createLlamaIndexProvider(options.openApi));
        providers.push(createMastraProvider(options.openApi));
    }
    providers.push(createGenericAgentProvider(options));
    return providers;
}
export function stringifyProviderSetup(provider) {
    return JSON.stringify(provider.setup, null, 2);
}
export function createProviderGuide(provider) {
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
function trimTrailingSlash(value) {
    return value.endsWith("/") ? value.slice(0, -1) : value;
}
function createHttpAgentSetup(options, defaultAgentId) {
    const baseUrl = trimTrailingSlash(options.baseUrl);
    const auth = options.auth ?? "none";
    const headers = {
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
        listToolsUrl: `${baseUrl}/tools`,
        callToolUrlTemplate: `${baseUrl}/tools/{toolName}/call`,
        auth,
        headers
    };
}
function createHttpHeaders(options, callOptions = {}) {
    const headers = {
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
    }
    else if (options.requestId) {
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
async function requestWithRetries(request, url, init, retries, retryDelayMs, operation) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const response = await request(url, init());
            if (!isTransientStatus(response.status) || attempt === retries) {
                return response;
            }
        }
        catch (error) {
            lastError = error;
            if (attempt === retries) {
                throw createNetworkError(operation, error);
            }
        }
        if (retryDelayMs > 0) {
            await delay(retryDelayMs);
        }
    }
    throw createNetworkError(operation, lastError);
}
async function* watchToolStream(request, url, options, signal) {
    let response;
    try {
        response = await request(url, {
            method: "GET",
            headers: createHttpHeaders(options),
            signal
        });
    }
    catch (error) {
        throw createNetworkError("watchTools", error);
    }
    if (!response.ok) {
        throw createHttpError("watchTools", response.status, await readJson(response));
    }
    if (!response.body) {
        throw new MobigentHttpError({
            code: "invalid_response",
            operation: "watchTools",
            message: "Mobigent tool stream returned no response body.",
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
                const event = parseToolStreamFrame(frame);
                if (event) {
                    yield event;
                }
                boundary = buffer.indexOf("\n\n");
            }
        }
    }
    finally {
        reader.releaseLock();
    }
}
function parseToolStreamFrame(frame) {
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
    const parsed = JSON.parse(data);
    if (!isToolChangeEvent(parsed)) {
        throw new MobigentHttpError({
            code: "invalid_response",
            operation: "watchTools",
            message: "Mobigent tool stream emitted an invalid tools event.",
            body: parsed
        });
    }
    return parsed;
}
function isToolChangeEvent(body) {
    if (!body || typeof body !== "object") {
        return false;
    }
    const candidate = body;
    return ((candidate.reason === "snapshot" || candidate.reason === "changed") &&
        Array.isArray(candidate.tools));
}
function isTransientStatus(status) {
    return status === 408 || status === 429 || status >= 500;
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function readMastraInput(context) {
    if ("input" in context && context.input && typeof context.input === "object") {
        return context.input;
    }
    return context;
}
async function readJson(response) {
    const text = await response.text();
    if (!text) {
        return undefined;
    }
    try {
        return JSON.parse(text);
    }
    catch {
        return text;
    }
}
function isToolListBody(body) {
    if (!body || typeof body !== "object" || !("tools" in body)) {
        return false;
    }
    const tools = body.tools;
    return Array.isArray(tools);
}
function isToolCallBody(body) {
    return Boolean(body && typeof body === "object" && "result" in body);
}
function createHttpError(operation, status, body) {
    const code = classifyStatus(status, body);
    return new MobigentHttpError({
        code,
        operation,
        status,
        body,
        retryable: isTransientStatus(status),
        message: `Mobigent ${formatOperation(operation)} failed: ${formatHttpError(status, body)}`
    });
}
function createNetworkError(operation, cause) {
    return new MobigentHttpError({
        code: "network_error",
        operation,
        retryable: true,
        cause,
        message: `Mobigent ${formatOperation(operation)} failed: ${cause instanceof Error ? cause.message : String(cause)}`
    });
}
function formatOperation(operation) {
    if (operation === "listTools") {
        return "tool discovery";
    }
    if (operation === "watchTools") {
        return "tool stream";
    }
    return "tool call";
}
function classifyStatus(status, body) {
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
    if (status === 408 || status === 429 || errorText.includes("rate limit")) {
        return "rate_limited";
    }
    if (status === 400 && errorText.includes("invalid")) {
        return "invalid_input";
    }
    return "gateway_error";
}
function readErrorText(body) {
    if (body && typeof body === "object" && "error" in body) {
        return String(body.error);
    }
    if (typeof body === "string") {
        return body;
    }
    return "";
}
function formatHttpError(status, body) {
    const errorText = readErrorText(body);
    if (errorText) {
        return `${status} ${errorText}`;
    }
    return `${status}`;
}
//# sourceMappingURL=index.js.map