#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createProviderBundle,
  createProviderCatalog,
  filterProviderCatalog,
  type ProviderKind
} from "@mobigent/providers";

export type MobigentBackendInitOptions = {
  appId: string;
  appName: string;
  outDir: string;
  fileName: string;
  envFile: string;
  configFile: string;
  appDir?: string;
  appConfigModuleFile?: string;
  connectionUrl: string;
  authToken: string;
  force: boolean;
  dryRun: boolean;
};

export type MobigentBackendGeneratedFile = {
  path: string;
  contents: string;
};

export type MobigentBackendAgentKind =
  | ProviderKind
  | "chatgpt"
  | "claude"
  | "openai"
  | "openapi-actions"
  | "openapi-agent";

export type MobigentBackendAgentOptions = {
  kind: MobigentBackendAgentKind;
  baseUrl: string;
  auth: "none" | "bearer" | "api-key";
  format: "guide" | "json";
};

export function createMobigentBackendFiles(options: MobigentBackendInitOptions): MobigentBackendGeneratedFile[] {
  const appConfigModuleFile = resolveAppConfigModuleFile(options);
  const files = [
    {
      path: join(options.outDir, options.fileName),
      contents: createBackendFile(options)
    },
    {
      path: options.envFile,
      contents: createEnvFile()
    }
  ];

  if (options.appDir) {
    const appConfigPath = join(options.appDir, options.configFile);
    if (!files.some((file) => file.path === appConfigPath)) {
      files.push({
        path: appConfigPath,
        contents: createAppConfigFile(options)
      });
    }

    if (appConfigModuleFile) {
      const appConfigModulePath = join(options.appDir, appConfigModuleFile);
      if (!files.some((file) => file.path === appConfigModulePath)) {
        files.push({
          path: appConfigModulePath,
          contents: createAppConfigModuleFile(options)
        });
      }
    }
  }

  return files;
}

export function writeMobigentBackendFiles(options: MobigentBackendInitOptions) {
  const files = createMobigentBackendFiles(options);

  if (options.dryRun) {
    return files;
  }

  for (const file of files) {
    if (existsSync(file.path) && !options.force) {
      throw new Error(`${file.path} already exists. Re-run with --force to overwrite it.`);
    }
    mkdirSync(dirname(file.path), { recursive: true });
    writeFileSync(file.path, file.contents, "utf8");
  }

  return files;
}

export function runMobigentBackendCli(
  argv = process.argv.slice(2),
  output = process.stdout,
  errorOutput = process.stderr,
  commandName = basename(process.argv[1] ?? "mobigent-backend")
) {
  try {
    const normalized = normalizeCommand(argv, commandName);

    if (normalized.help) {
      output.write(helpText());
      return 0;
    }

    if (normalized.command === "agent") {
      output.write(formatAgentSetup(parseAgentArgs(normalized.args)));
      return 0;
    }

    if (normalized.command !== "init") {
      throw new Error(`Unknown mobigent backend command ${normalized.command}\n\n${helpText()}`);
    }

    const files = writeMobigentBackendFiles(normalized.options);
    if (normalized.options.dryRun) {
      output.write(`${JSON.stringify({ files }, null, 2)}\n`);
      return 0;
    }

    output.write(formatSuccessMessage(normalized.options, files));
    return 0;
  } catch (error) {
    errorOutput.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

function normalizeCommand(argv: string[], commandName: string) {
  const [first, ...rest] = argv;
  const hasSubcommand = first && !first.startsWith("-");
  const command = hasSubcommand ? first : "init";
  const args = hasSubcommand ? rest : argv;

  if (first === "--help" || first === "-h" || first === "help") {
    return {
      command: "help",
      help: true,
      options: defaultOptions(),
      args: []
    };
  }

  if (rest.includes("--help") || rest.includes("-h")) {
    return {
      command,
      help: true,
      options: defaultOptions(),
      args: rest
    };
  }

  if (commandName === "mobigent-backend" && command === "backend") {
    return {
      command: "init",
      help: false,
      options: parseArgs(rest),
      args: rest
    };
  }

  if (command === "agent") {
    return {
      command,
      help: false,
      options: defaultOptions(),
      args
    };
  }

  return {
    command,
    help: false,
    options: parseArgs(args),
    args
  };
}

function parseArgs(argv: string[]) {
  const options = defaultOptions();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      index += 1;
      return value;
    };

    switch (arg) {
      case "--app-id":
      case "--app":
        options.appId = next();
        break;
      case "--app-name":
        options.appName = next();
        break;
      case "--out-dir":
        options.outDir = next();
        break;
      case "--file":
        options.fileName = next();
        break;
      case "--env":
        options.envFile = next();
        break;
      case "--config-file":
        options.configFile = next();
        break;
      case "--app-dir":
        options.appDir = next();
        options.appConfigModuleFile ||= join("src", "mobigent-config.ts");
        break;
      case "--app-config-module":
        options.appConfigModuleFile = next();
        break;
      case "--gateway-url":
      case "--connection-url":
        options.connectionUrl = next();
        break;
      case "--auth-token":
        options.authToken = next();
        break;
      case "--force":
        options.force = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--help":
      case "-h":
        break;
      default:
        throw new Error(`Unknown option ${arg}\n\n${helpText()}`);
    }
  }

  const projectName = findProjectName(options.appDir ?? process.cwd());
  options.appId ||= inferAppId(projectName);
  options.appName ||= inferAppName(projectName);

  return options;
}

function parseAgentArgs(argv: string[]): MobigentBackendAgentOptions {
  const options: MobigentBackendAgentOptions = {
    kind: "chatgpt-actions",
    baseUrl: "http://localhost:8788",
    auth: "none",
    format: "guide"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      index += 1;
      return value;
    };

    switch (arg) {
      case "--provider":
      case "--agent":
        options.kind = next() as MobigentBackendAgentKind;
        break;
      case "--base-url":
      case "--url":
      case "--public-url":
        options.baseUrl = next();
        break;
      case "--auth": {
        const auth = next();
        if (auth !== "none" && auth !== "bearer" && auth !== "api-key") {
          throw new Error("--auth must be none, bearer, or api-key.");
        }
        options.auth = auth;
        break;
      }
      case "--format": {
        const format = next();
        if (format !== "guide" && format !== "json") {
          throw new Error("--format must be guide or json.");
        }
        options.format = format;
        break;
      }
      default:
        if (arg.startsWith("--")) {
          throw new Error(`Unknown option ${arg}\n\n${helpText()}`);
        }
        options.kind = arg as MobigentBackendAgentKind;
        break;
    }
  }

  return options;
}

function defaultOptions(): MobigentBackendInitOptions {
  return {
    appId: "",
    appName: "",
    outDir: "src",
    fileName: "mobigent.ts",
    envFile: ".env.mobigent",
    configFile: "mobigent.app.json",
    appDir: undefined,
    appConfigModuleFile: undefined,
    connectionUrl: "ws://localhost:8787",
    authToken: "",
    force: false,
    dryRun: false
  };
}

function formatAgentSetup(options: MobigentBackendAgentOptions) {
  const id = normalizeAgentKind(options.kind);
  const catalog = createProviderCatalog({
    mcp: {
      command: "mobigent-mcp"
    },
    openApi: {
      baseUrl: options.baseUrl,
      auth: options.auth
    }
  });
  const [provider] = filterProviderCatalog(catalog, { ids: [id] });

  if (!provider) {
    throw new Error(`Mobigent agent provider is not available: ${options.kind}`);
  }

  const bundle = createProviderBundle(provider);
  return options.format === "json" ? `${JSON.stringify(bundle, null, 2)}\n` : `${bundle.guide}\n`;
}

function createBackendFile(options: MobigentBackendInitOptions) {
  const appConfigModuleFile = resolveAppConfigModuleFile(options);
  const optionLines = [
    options.appDir ? `  appDir: ${JSON.stringify(options.appDir)}` : "",
    appConfigModuleFile ? `  appConfigModuleFile: ${JSON.stringify(appConfigModuleFile)}` : "",
    "  appToken: process.env.MOBIGENT_AUTH_TOKEN",
    "  apiKey: process.env.MOBIGENT_HTTP_API_KEY"
  ].filter(Boolean);
  const optionsBlock = optionLines.join(",\n");
  const startExpression = options.appDir
    ? `startMobigent({\n${optionsBlock}\n})`
    : `startMobigent(${JSON.stringify(options.appId)}, ${JSON.stringify(options.appName)}, {\n${optionsBlock}\n})`;

  return `import { startMobigent } from "@mobigent/backend";

export const mobigent = await ${startExpression};

export const waitForApp = mobigent.waitForApp;
export const app = mobigent.app;
export const call = mobigent.call;
export const listFunctions = mobigent.listFunctions;
export const use = mobigent.use;
export const functions = mobigent.functions;
export const fn = mobigent.fn;
export const feature = mobigent.feature;

console.log("Mobigent inspector:", mobigent.inspectorUrl);
console.log("Mobigent OpenAPI:", mobigent.openApiUrl);
if (mobigent.appConfigPath) {
  console.log("Mobigent app config:", mobigent.appConfigPath);
}
if (mobigent.appConfigModulePath) {
  console.log("Mobigent app config module:", mobigent.appConfigModulePath);
}
`;
}

function createEnvFile() {
  return `# Mobigent backend
# Local development works without app auth.
# Uncomment this for shared or hosted environments, then put the same token in your app config.
# MOBIGENT_AUTH_TOKEN=replace-me

# Require this key before exposing the agent HTTP API publicly.
# MOBIGENT_HTTP_API_KEY=replace-me
`;
}

function createAppConfigFile(options: MobigentBackendInitOptions) {
  const config: Record<string, string> = {
    appId: options.appId,
    appName: options.appName,
    connectionUrl: options.connectionUrl
  };

  if (options.authToken) {
    config.authToken = options.authToken;
  }

  return `${JSON.stringify(config, null, 2)}\n`;
}

function createAppConfigModuleFile(options: MobigentBackendInitOptions) {
  return `import { defineMobigentConfig } from "@mobigent/app";

export const mobigentConfig = defineMobigentConfig(${createAppConfigFile(options).trim()});
`;
}

function formatSuccessMessage(options: MobigentBackendInitOptions, files: MobigentBackendGeneratedFile[]) {
  const appConfigModuleFile = resolveAppConfigModuleFile(options);

  return `Created Mobigent backend files:
${files.map((file) => `  ${file.path}`).join("\n")}

Then in your app:
  npm install @mobigent/app
  Add a mobigent.ts file, use the same app id, expose normal app functions, then wrap your app once:

    export const mobigent = createApp(${JSON.stringify(options.appId)}, {
      expense: { list: async () => listExpenses() }
    });
    export default mobigent.with(App);
${options.appDir ? `\nOptional app config files were also written to ${join(options.appDir, options.configFile)} and ${join(options.appDir, appConfigModuleFile ?? join("src", "mobigent-config.ts"))}.\n` : "\nNo app config file is required for the normal app/backend path.\n"}

Need sample files instead of hand-writing them?
  Run mobigent new my-demo --install. The app-side init command is only a generator for examples.

Run:
  npx tsx ${join(options.outDir, options.fileName)}

Then open:
  http://localhost:8788/inspect
`;
}

function resolveAppConfigModuleFile(options: Pick<MobigentBackendInitOptions, "appDir" | "appConfigModuleFile">) {
  return options.appConfigModuleFile ?? (options.appDir ? join("src", "mobigent-config.ts") : undefined);
}

function helpText() {
  return `mobigent-backend

Create a tiny backend entrypoint for @mobigent/backend.

Usage:
  mobigent-backend
  mobigent-backend --app com.example.app --app-name "Example App"
  mobigent-backend agent chatgpt --base-url https://your-public-backend.example
  mobigent-backend agent claude
  mobigent-backend agent openai --base-url http://localhost:8788 --format json

Options:
  --app-id, --app <id> App id shared by app and backend. Default: inferred from package or folder.
  --app-name <name>   Human-readable app name. Default: nearest package name or folder name.
  --out-dir <path>    Output directory. Default: src.
  --file <name>       Backend file name. Default: mobigent.ts.
  --env <path>        Env file path. Default: .env.mobigent.
  --config-file <path> Advanced: app config JSON name used with --app-dir. Default: mobigent.app.json.
  --app-dir <path>    Advanced: also write optional app config files into an app project.
  --app-config-module <path> Advanced: React Native config module inside --app-dir. Default: src/mobigent-config.ts.
  --connection-url <url> Advanced: app connection URL written when --app-dir is used. Default: ws://localhost:8787.
  --gateway-url <url> Backward-compatible alias for --connection-url.
  --auth-token <token> App auth token written to config. Default: no local app auth.
  --force             Overwrite generated files.
  --dry-run           Print generated files as JSON.
  agent <kind>        Print agent setup for chatgpt, claude, cursor, openai, openapi, or a provider id.
  --base-url <url>    Agent setup base URL. Default: http://localhost:8788.
  --auth <mode>       Agent setup auth mode: none, bearer, or api-key. Default: none.
  --format <format>   Agent setup output: guide or json. Default: guide.
  -h, --help          Show help.
`;
}

function normalizeAgentKind(kind: MobigentBackendAgentKind): ProviderKind {
  switch (kind) {
    case "chatgpt":
    case "openapi-actions":
      return "chatgpt-actions";
    case "claude":
      return "claude-desktop";
    case "openai":
      return "openai-responses";
    case "openapi-agent":
      return "openapi";
    default:
      return kind;
  }
}

function findProjectName(startDir = process.cwd()): string {
  let dir = startDir;

  while (true) {
    const packageJsonPath = join(dir, "package.json");
    if (existsSync(packageJsonPath)) {
      try {
        const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { name?: unknown };
        if (typeof parsed.name === "string" && parsed.name.trim()) {
          return parsed.name;
        }
      } catch {
        break;
      }
    }

    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  return basename(startDir) || "mobigent-app";
}

function inferAppName(projectName: string): string {
  return titleFromName(projectName);
}

function inferAppId(projectName: string): string {
  const withoutNpmScope = projectName.replace(/^@/, "");
  const segments = withoutNpmScope
    .split(/[/.]+/)
    .flatMap((segment) => segment.split(/[-_\s]+/))
    .map((segment) => segment.toLowerCase().replace(/[^a-z0-9]+/g, ""))
    .filter(Boolean);

  return ["app", ...(segments.length > 0 ? segments : ["mobigent"])].join(".");
}

function titleFromName(value: string): string {
  const name = value
    .replace(/^@[^/]+\//, "")
    .replace(/[-_.]+/g, " ")
    .trim();

  return (name || "Mobigent App").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isMainModule() {
  return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
}

if (isMainModule()) {
  process.exitCode = runMobigentBackendCli();
}
