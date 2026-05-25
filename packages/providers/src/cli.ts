#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  createAnthropicToolUseProvider,
  createAutoGenProvider,
  createAwsBedrockConverseProvider,
  createAzureOpenAiProvider,
  createChatGptActionsProvider,
  createClaudeDesktopProvider,
  createCohereProvider,
  createCrewAiProvider,
  createCursorProvider,
  createDeepSeekProvider,
  createFireworksAiProvider,
  createGenericAgentProvider,
  createGoogleGeminiProvider,
  createGoogleVertexAiProvider,
  createGroqProvider,
  createHaystackProvider,
  createLangChainProvider,
  createLiteLlmProvider,
  createLmStudioProvider,
  createLlamaIndexProvider,
  createMastraProvider,
  createMcpStdioProvider,
  createMistralProvider,
  createOpenApiProvider,
  createOpenAiCompatibleProvider,
  createOpenAiResponsesProvider,
  createOllamaProvider,
  createOpenRouterProvider,
  createPerplexityProvider,
  createCloudflareAiGatewayProvider,
  createProviderCompatibilityReport,
  createProviderBundle,
  createProviderCatalog,
  createProviderGuide,
  createProviderSetupPlan,
  diagnoseMobigentProviderRuntimeConfig,
  formatMobigentProviderRuntimeConfigReport,
  formatProviderSetupPlanValidation,
  stringifyProviderRuntimeEnv,
  formatProviderSetupValidation,
  getProviderRecommendationPreset,
  getProviderIntegrationProfile,
  listProviderRecommendationPresets,
  recommendProviders,
  createSemanticKernelProvider,
  createNvidiaNimProvider,
  createQwenDashScopeProvider,
  createTogetherAiProvider,
  createVercelAiSdkProvider,
  createVsCodeProvider,
  createXaiGrokProvider,
  stringifyProviderSetup,
  summarizeProviderCatalog,
  validateProviderSetup,
  validateProviderSetupPlan,
  type McpStdioOptions,
  type OpenApiOptions,
  type ProviderDescriptor,
  type ProviderRecommendationUseCase
} from "./index.js";

type CliResult = {
  code: number;
  stdout: string;
  stderr: string;
};

type CliOptions = {
  provider?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  baseUrl?: string;
  schemaPath?: string;
  auth?: OpenApiOptions["auth"];
  agentId?: string;
  format?: "json" | "guide" | "runtime-env" | "bundle";
  validate?: boolean;
  list?: boolean;
  matrix?: boolean;
  compatibility?: boolean;
  writeMatrixPath?: string;
  writeCompatibilityPath?: string;
  setupPlan?: ProviderRecommendationUseCase;
  writeSetupPlanPath?: string;
  validateSetupPlanPath?: string;
  runtimeConfig?: boolean;
  recommendPresets?: boolean;
  recommend?: ProviderRecommendationUseCase;
  query?: string;
  limit?: number;
  force?: boolean;
  help?: boolean;
};

type ProviderMatrixEntry = {
  id: string;
  name: string;
  transport: string;
  category: string;
  bestFor: string[];
  setupComplexity: string;
  runtime: boolean;
  dynamicTools: boolean;
  requiresPublicUrl: boolean;
  productionNotes: string[];
  setupCommand: string;
};

type ProviderMatrix = {
  summary: ReturnType<typeof summarizeProviderCatalog>;
  providers: ProviderMatrixEntry[];
};

type ProviderRecommendationCliEntry = ProviderMatrixEntry & {
  score: number;
  reasons: string[];
};

type ProviderRecommendationCliReport = {
  useCase: ProviderRecommendationUseCase;
  preset: ReturnType<typeof getProviderRecommendationPreset>;
  recommendations: ProviderRecommendationCliEntry[];
};

const supportedProviders = [
  "mcp-stdio",
  "claude-desktop",
  "cursor",
  "vscode",
  "openapi",
  "chatgpt-actions",
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
  "mistral",
  "cohere",
  "anthropic-tool-use",
  "google-gemini",
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
];

export function runProviderCli(argv = process.argv.slice(2)): CliResult {
  try {
    const options = parseArgs(argv);

    if (options.help) {
      return { code: 0, stdout: helpText(), stderr: "" };
    }

    if (options.list) {
      return { code: 0, stdout: `${supportedProviders.join("\n")}\n`, stderr: "" };
    }

    if (options.matrix) {
      return { code: 0, stdout: `${JSON.stringify(createProviderMatrix(options), null, 2)}\n`, stderr: "" };
    }

    if (options.compatibility) {
      return { code: 0, stdout: `${JSON.stringify(createProviderCompatibilityCliReport(options), null, 2)}\n`, stderr: "" };
    }

    if (options.writeMatrixPath) {
      writeGeneratedFile(
        options.writeMatrixPath,
        `${JSON.stringify(createProviderMatrix(options), null, 2)}\n`,
        Boolean(options.force)
      );
      return { code: 0, stdout: `Created Mobigent provider matrix at ${options.writeMatrixPath}\n`, stderr: "" };
    }

    if (options.writeCompatibilityPath) {
      writeGeneratedFile(
        options.writeCompatibilityPath,
        `${JSON.stringify(createProviderCompatibilityCliReport(options), null, 2)}\n`,
        Boolean(options.force)
      );
      return {
        code: 0,
        stdout: `Created Mobigent provider compatibility report at ${options.writeCompatibilityPath}\n`,
        stderr: ""
      };
    }

    if (options.setupPlan) {
      return { code: 0, stdout: `${JSON.stringify(createProviderSetupPlanFromCli(options), null, 2)}\n`, stderr: "" };
    }

    if (options.writeSetupPlanPath) {
      writeGeneratedFile(
        options.writeSetupPlanPath,
        `${JSON.stringify(createProviderSetupPlanFromCli(options), null, 2)}\n`,
        Boolean(options.force)
      );
      return { code: 0, stdout: `Created Mobigent provider setup plan at ${options.writeSetupPlanPath}\n`, stderr: "" };
    }

    if (options.validateSetupPlanPath) {
      const report = validateProviderSetupPlanFile(options.validateSetupPlanPath);
      return {
        code: report.status === "fail" ? 1 : 0,
        stdout: `${formatProviderSetupPlanValidation(report)}\n`,
        stderr: ""
      };
    }

    if (options.runtimeConfig) {
      const report = diagnoseMobigentProviderRuntimeConfig({
        env: options.env,
        kind: options.provider && options.provider !== "mcp-stdio" ? (options.provider as never) : undefined,
        baseUrl: options.baseUrl,
        auth: options.auth,
        apiKey: options.env?.MOBIGENT_HTTP_API_KEY,
        agentId: options.agentId
      });
      const stdout =
        options.format === "json"
          ? `${JSON.stringify(report, null, 2)}\n`
          : formatMobigentProviderRuntimeConfigReport(report);
      return { code: report.status === "fail" ? 1 : 0, stdout, stderr: "" };
    }

    if (options.recommendPresets) {
      return { code: 0, stdout: `${JSON.stringify({ presets: listProviderRecommendationPresets() }, null, 2)}\n`, stderr: "" };
    }

    if (options.recommend) {
      return { code: 0, stdout: `${JSON.stringify(createProviderRecommendationReport(options), null, 2)}\n`, stderr: "" };
    }

    const provider = createProviderFromCli(options);
    if (options.validate) {
      const report = validateProviderSetup(provider);
      const stdout =
        options.format === "guide"
          ? `${formatProviderSetupValidation(report)}\n`
          : `${JSON.stringify(report, null, 2)}\n`;
      return { code: report.status === "fail" ? 1 : 0, stdout, stderr: "" };
    }

    const stdout =
      options.format === "guide"
        ? `${createProviderGuide(provider)}\n`
        : options.format === "runtime-env"
          ? `${createRuntimeEnv(provider, options)}\n`
          : options.format === "bundle"
            ? `${JSON.stringify(createProviderBundle(provider), null, 2)}\n`
        : `${stringifyProviderSetup(provider)}\n`;

    return { code: 0, stdout, stderr: "" };
  } catch (error) {
    return {
      code: 1,
      stdout: "",
      stderr: `${error instanceof Error ? error.message : String(error)}\n\n${helpText()}`
    };
  }
}

export function main() {
  const result = runProviderCli();
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  process.exitCode = result.code;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    provider: "mcp-stdio",
    command: "mobigent-mcp",
    args: [],
    env: {},
    format: "json"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--list":
        options.list = true;
        break;
      case "--matrix":
        options.matrix = true;
        break;
      case "--compatibility":
        options.compatibility = true;
        break;
      case "--write-matrix":
        options.writeMatrixPath = readValue(argv, index, arg);
        index += 1;
        break;
      case "--write-compatibility":
        options.writeCompatibilityPath = readValue(argv, index, arg);
        index += 1;
        break;
      case "--setup-plan": {
        const useCase = readValue(argv, index, arg);
        if (!isProviderRecommendationUseCase(useCase)) {
          throw new Error(`--setup-plan must be one of: ${listProviderRecommendationPresets().map((preset) => preset.id).join(", ")}.`);
        }
        options.setupPlan = useCase;
        index += 1;
        break;
      }
      case "--write-setup-plan":
        options.writeSetupPlanPath = readValue(argv, index, arg);
        index += 1;
        break;
      case "--validate-setup-plan":
        options.validateSetupPlanPath = readValue(argv, index, arg);
        index += 1;
        break;
      case "--runtime-config":
        options.runtimeConfig = true;
        break;
      case "--recommend-presets":
        options.recommendPresets = true;
        break;
      case "--recommend": {
        const useCase = readValue(argv, index, arg);
        if (!isProviderRecommendationUseCase(useCase)) {
          throw new Error(`--recommend must be one of: ${listProviderRecommendationPresets().map((preset) => preset.id).join(", ")}.`);
        }
        options.recommend = useCase;
        index += 1;
        break;
      }
      case "--query":
        options.query = readValue(argv, index, arg);
        index += 1;
        break;
      case "--limit": {
        const limit = Number.parseInt(readValue(argv, index, arg), 10);
        if (!Number.isFinite(limit) || limit < 1) {
          throw new Error("--limit must be a positive integer.");
        }
        options.limit = limit;
        index += 1;
        break;
      }
      case "--force":
        options.force = true;
        break;
      case "--provider":
      case "-p":
        options.provider = readValue(argv, index, arg);
        index += 1;
        break;
      case "--command":
        options.command = readValue(argv, index, arg);
        index += 1;
        break;
      case "--arg":
        options.args?.push(readValue(argv, index, arg));
        index += 1;
        break;
      case "--env": {
        const [key, ...valueParts] = readValue(argv, index, arg).split("=");
        if (!key || valueParts.length === 0) {
          throw new Error("--env must use KEY=value format.");
        }
        options.env = {
          ...options.env,
          [key]: valueParts.join("=")
        };
        index += 1;
        break;
      }
      case "--base-url":
        options.baseUrl = readValue(argv, index, arg);
        index += 1;
        break;
      case "--schema-path":
        options.schemaPath = readValue(argv, index, arg);
        index += 1;
        break;
      case "--auth": {
        const auth = readValue(argv, index, arg);
        if (!["none", "bearer", "api-key"].includes(auth)) {
          throw new Error("--auth must be one of: none, bearer, api-key.");
        }
        options.auth = auth as OpenApiOptions["auth"];
        index += 1;
        break;
      }
      case "--agent-id":
        options.agentId = readValue(argv, index, arg);
        index += 1;
        break;
      case "--format": {
        const format = readValue(argv, index, arg);
        if (format !== "json" && format !== "guide" && format !== "runtime-env" && format !== "bundle") {
          throw new Error("--format must be json, guide, runtime-env, or bundle.");
        }
        options.format = format;
        index += 1;
        break;
      }
      case "--validate":
        options.validate = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function createProviderFromCli(options: CliOptions): ProviderDescriptor {
  const mcp: McpStdioOptions = {
    command: options.command,
    args: options.args,
    env: options.env
  };

  switch (options.provider) {
    case "mcp-stdio":
      return createMcpStdioProvider(mcp);
    case "claude-desktop":
      return createClaudeDesktopProvider(mcp);
    case "cursor":
      return createCursorProvider(mcp);
    case "vscode":
      return createVsCodeProvider(mcp);
    case "openapi":
      return createOpenApiProvider(readOpenApiOptions(options));
    case "chatgpt-actions":
      return createChatGptActionsProvider(readOpenApiOptions(options));
    case "openai-responses":
      return createOpenAiResponsesProvider(readHttpAgentOptions(options));
    case "azure-openai":
      return createAzureOpenAiProvider(readHttpAgentOptions(options));
    case "openai-compatible":
      return createOpenAiCompatibleProvider(readHttpAgentOptions(options));
    case "openrouter":
      return createOpenRouterProvider(readHttpAgentOptions(options));
    case "litellm":
      return createLiteLlmProvider(readHttpAgentOptions(options));
    case "ollama":
      return createOllamaProvider(readHttpAgentOptions(options));
    case "lm-studio":
      return createLmStudioProvider(readHttpAgentOptions(options));
    case "groq":
      return createGroqProvider(readHttpAgentOptions(options));
    case "perplexity":
      return createPerplexityProvider(readHttpAgentOptions(options));
    case "xai-grok":
      return createXaiGrokProvider(readHttpAgentOptions(options));
    case "deepseek":
      return createDeepSeekProvider(readHttpAgentOptions(options));
    case "together-ai":
      return createTogetherAiProvider(readHttpAgentOptions(options));
    case "fireworks-ai":
      return createFireworksAiProvider(readHttpAgentOptions(options));
    case "qwen-dashscope":
      return createQwenDashScopeProvider(readHttpAgentOptions(options));
    case "nvidia-nim":
      return createNvidiaNimProvider(readHttpAgentOptions(options));
    case "cloudflare-ai-gateway":
      return createCloudflareAiGatewayProvider(readHttpAgentOptions(options));
    case "mistral":
      return createMistralProvider(readHttpAgentOptions(options));
    case "cohere":
      return createCohereProvider(readHttpAgentOptions(options));
    case "anthropic-tool-use":
      return createAnthropicToolUseProvider(readHttpAgentOptions(options));
    case "google-gemini":
      return createGoogleGeminiProvider(readHttpAgentOptions(options));
    case "google-vertex-ai":
      return createGoogleVertexAiProvider(readHttpAgentOptions(options));
    case "aws-bedrock-converse":
      return createAwsBedrockConverseProvider(readHttpAgentOptions(options));
    case "vercel-ai-sdk":
      return createVercelAiSdkProvider(readHttpAgentOptions(options));
    case "langchain":
      return createLangChainProvider(readHttpAgentOptions(options));
    case "llamaindex":
      return createLlamaIndexProvider(readHttpAgentOptions(options));
    case "mastra":
      return createMastraProvider(readHttpAgentOptions(options));
    case "semantic-kernel":
      return createSemanticKernelProvider(readHttpAgentOptions(options));
    case "crewai":
      return createCrewAiProvider(readHttpAgentOptions(options));
    case "autogen":
      return createAutoGenProvider(readHttpAgentOptions(options));
    case "haystack":
      return createHaystackProvider(readHttpAgentOptions(options));
    case "generic-agent":
      return createGenericAgentProvider({
        mcp,
        openApi: options.baseUrl ? readOpenApiOptions(options) : undefined
      });
    default:
      throw new Error(`Unsupported provider: ${options.provider ?? ""}`);
  }
}

function createProviderMatrix(options: CliOptions): ProviderMatrix {
  const { baseUrl, providers } = createProviderCatalogFromCli(options);

  return {
    summary: summarizeProviderCatalog(providers),
    providers: providers.map((provider) => createProviderMatrixEntry(provider, options, baseUrl))
  };
}

function createProviderCompatibilityCliReport(options: CliOptions) {
  const { providers } = createProviderCatalogFromCli(options);
  return createProviderCompatibilityReport(providers);
}

function createProviderCatalogFromCli(options: CliOptions) {
  const baseUrl = options.baseUrl ?? "http://localhost:8788";
  const providers = createProviderCatalog({
    mcp: {
      command: options.command,
      args: options.args,
      env: options.env
    },
    openApi: {
      baseUrl,
      schemaPath: options.schemaPath,
      auth: options.auth
    }
  });

  return { baseUrl, providers };
}

function createProviderRecommendationReport(options: CliOptions): ProviderRecommendationCliReport {
  const useCase = options.recommend ?? "runtime-agent";
  const preset = getProviderRecommendationPreset(useCase);
  const baseUrl = options.baseUrl ?? "http://localhost:8788";
  const providers = createProviderCatalog({
    mcp: {
      command: options.command,
      args: options.args,
      env: options.env
    },
    openApi: {
      baseUrl,
      schemaPath: options.schemaPath,
      auth: options.auth
    }
  });

  return {
    useCase,
    preset,
    recommendations: recommendProviders(providers, {
      useCase,
      query: options.query,
      limit: options.limit
    }).map((recommendation) => ({
      ...createProviderMatrixEntry(recommendation.provider, options, baseUrl),
      score: recommendation.score,
      reasons: recommendation.reasons
    }))
  };
}

function createProviderSetupPlanFromCli(options: CliOptions) {
  const useCase = options.setupPlan ?? "runtime-agent";
  const baseUrl = options.baseUrl ?? "http://localhost:8788";
  const providers = createProviderCatalog({
    mcp: {
      command: options.command,
      args: options.args,
      env: options.env
    },
    openApi: {
      baseUrl,
      schemaPath: options.schemaPath,
      auth: options.auth
    }
  });

  return createProviderSetupPlan(providers, {
    useCase,
    query: options.query,
    limit: options.limit,
    runtimeEnv: {
      baseUrl,
      agentId: options.agentId
    }
  });
}

function validateProviderSetupPlanFile(path: string) {
  try {
    return validateProviderSetupPlan(JSON.parse(readFileSync(path, "utf8")));
  } catch (error) {
    return {
      ok: false,
      status: "fail" as const,
      errors: [`Could not read or parse provider setup plan JSON: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}

function isProviderRecommendationUseCase(value: string): value is ProviderRecommendationUseCase {
  return listProviderRecommendationPresets().some((preset) => preset.id === value);
}

function createProviderMatrixEntry(provider: ProviderDescriptor, options: CliOptions, baseUrl: string): ProviderMatrixEntry {
  const profile = getProviderIntegrationProfile(provider);

  return {
    id: provider.id,
    name: provider.name,
    transport: provider.capabilities.transport,
    category: profile.category,
    bestFor: profile.bestFor,
    setupComplexity: profile.setupComplexity,
    runtime: isRuntimeProvider(provider.id),
    dynamicTools: provider.capabilities.supportsDynamicTools,
    requiresPublicUrl: provider.capabilities.requiresPublicUrl,
    productionNotes: profile.productionNotes,
    setupCommand: createProviderSetupCommand(provider.id, options, baseUrl)
  };
}

function createProviderSetupCommand(providerId: string, options: CliOptions, baseUrl: string) {
  const args = ["mobigent-provider", "--provider", providerId];

  if (isMcpProvider(providerId)) {
    args.push("--command", shellQuote(options.command ?? "mobigent-mcp"));
    for (const arg of options.args ?? []) {
      args.push("--arg", shellQuote(arg));
    }
    for (const [key, value] of Object.entries(options.env ?? {})) {
      args.push("--env", shellQuote(`${key}=${value}`));
    }
  } else {
    args.push("--base-url", shellQuote(baseUrl));
    if (options.auth) {
      args.push("--auth", options.auth);
    }
  }

  if (isRuntimeProvider(providerId)) {
    args.push("--format", "runtime-env");
  }

  return args.join(" ");
}

function isMcpProvider(providerId: string) {
  return providerId === "mcp-stdio" || providerId === "claude-desktop" || providerId === "cursor" || providerId === "vscode";
}

function readOpenApiOptions(options: CliOptions): OpenApiOptions {
  if (!options.baseUrl) {
    throw new Error(`--base-url is required for ${options.provider}.`);
  }

  return {
    baseUrl: options.baseUrl,
    schemaPath: options.schemaPath,
    auth: options.auth
  };
}

function readHttpAgentOptions(options: CliOptions) {
  return {
    ...readOpenApiOptions(options),
    agentId: options.agentId
  };
}

function createRuntimeEnv(provider: ProviderDescriptor, options: CliOptions) {
  try {
    return stringifyProviderRuntimeEnv(provider, {
      baseUrl: options.baseUrl ?? "http://localhost:8788",
      agentId: options.agentId
    });
  } catch (_error) {
    throw new Error("--format runtime-env is only available for HTTP runtime providers.");
  }
}

function isRuntimeProvider(providerId: string) {
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
    "mistral",
    "cohere",
    "anthropic-tool-use",
    "google-gemini",
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
  ].includes(providerId);
}

function readValue(argv: string[], index: number, option: string) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${option} requires a value.`);
  }
  return value;
}

function writeGeneratedFile(path: string, contents: string, force: boolean) {
  if (!force && existsSync(path)) {
    throw new Error(`${path} already exists. Re-run with --force to overwrite it.`);
  }

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, "utf8");
}

function helpText() {
  return `Mobigent provider config generator

Usage:
  mobigent-provider --list
  mobigent-provider --matrix --base-url http://localhost:8788
  mobigent-provider --compatibility --base-url http://localhost:8788
  mobigent-provider --write-matrix ./mobigent-providers.json --base-url http://localhost:8788
  mobigent-provider --write-compatibility ./mobigent-provider-compatibility.json --base-url http://localhost:8788
  mobigent-provider --setup-plan runtime-agent --base-url http://localhost:8788 --query anthropic
  mobigent-provider --write-setup-plan ./mobigent-provider-setup.json --base-url http://localhost:8788
  mobigent-provider --validate-setup-plan ./mobigent-provider-setup.json
  mobigent-provider --runtime-config --provider openrouter --base-url http://localhost:8788 --format guide
  mobigent-provider --recommend-presets
  mobigent-provider --recommend runtime-agent --base-url http://localhost:8788
  mobigent-provider --recommend local-agent --query claude
  mobigent-provider --provider claude-desktop --command mobigent-mcp
  mobigent-provider --provider chatgpt-actions --base-url https://example.ngrok.app
  mobigent-provider --provider openai-responses --base-url http://localhost:8788
  mobigent-provider --provider openrouter --base-url http://localhost:8788 --validate
  mobigent-provider --provider azure-openai --base-url http://localhost:8788
  mobigent-provider --provider openai-compatible --base-url http://localhost:8788
  mobigent-provider --provider openrouter --base-url http://localhost:8788
  mobigent-provider --provider litellm --base-url http://localhost:8788
  mobigent-provider --provider ollama --base-url http://localhost:8788
  mobigent-provider --provider lm-studio --base-url http://localhost:8788
  mobigent-provider --provider groq --base-url http://localhost:8788
  mobigent-provider --provider perplexity --base-url http://localhost:8788
  mobigent-provider --provider xai-grok --base-url http://localhost:8788
  mobigent-provider --provider deepseek --base-url http://localhost:8788
  mobigent-provider --provider together-ai --base-url http://localhost:8788
  mobigent-provider --provider fireworks-ai --base-url http://localhost:8788
  mobigent-provider --provider mistral --base-url http://localhost:8788
  mobigent-provider --provider cohere --base-url http://localhost:8788
  mobigent-provider --provider google-gemini --base-url http://localhost:8788
  mobigent-provider --provider aws-bedrock-converse --base-url http://localhost:8788
  mobigent-provider --provider vercel-ai-sdk --base-url http://localhost:8788
  mobigent-provider --provider anthropic-tool-use --base-url http://localhost:8788 --format runtime-env
  mobigent-provider --provider semantic-kernel --base-url http://localhost:8788
  mobigent-provider --provider crewai --base-url http://localhost:8788
  mobigent-provider --provider autogen --base-url http://localhost:8788
  mobigent-provider --provider haystack --base-url http://localhost:8788

Options:
  -p, --provider <id>       Provider id. Default: mcp-stdio
      --list                Print supported provider ids
      --matrix              Print a JSON comparison matrix for all built-in providers
      --compatibility       Print a JSON setup validation report for all built-in providers
      --write-matrix <path> Write the provider comparison matrix to a JSON file
      --write-compatibility <path>
                            Write the provider compatibility report to a JSON file
      --setup-plan <use>    Print one recommended provider, validation, bundle, endpoints, and runtime env
      --write-setup-plan <path>
                            Write the provider setup plan to a JSON file
      --validate-setup-plan <path>
                            Validate a saved provider setup plan JSON file
      --runtime-config      Validate env-driven provider runtime configuration
      --recommend-presets   Print available recommendation presets as JSON
      --recommend <use>     Recommend providers for local-agent, hosted-actions, or runtime-agent
      --query <text>        Filter matrix recommendations by provider text
      --limit <count>       Limit recommendation count. Default: 5
      --command <command>   MCP stdio command. Default: mobigent-mcp
      --arg <value>         Add one MCP stdio argument. Can be repeated
      --env KEY=value       Add one environment variable. Can be repeated
      --base-url <url>      Public HTTP gateway URL for OpenAPI providers
      --schema-path <path>  OpenAPI schema path. Default: /openapi.json
      --auth <type>         none, bearer, or api-key
      --agent-id <id>       Agent identity header for HTTP tool providers
      --format <format>     json, guide, runtime-env, or bundle. Default: json
      --validate            Validate generated provider setup and print a readiness report
      --force               Overwrite files written by --write-matrix, --write-compatibility, or --write-setup-plan
  -h, --help                Show help
`;
}

function shellQuote(value: string) {
  if (/^[a-zA-Z0-9_./:@-]+$/.test(value)) {
    return value;
  }

  return JSON.stringify(value);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
