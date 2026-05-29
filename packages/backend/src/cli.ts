#!/usr/bin/env node
import { existsSync, mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type MobigentBackendInitOptions = {
  appId: string;
  appName: string;
  outDir: string;
  fileName: string;
  envFile: string;
  configFile: string;
  gatewayUrl: string;
  authToken: string;
  force: boolean;
  dryRun: boolean;
};

export type MobigentBackendGeneratedFile = {
  path: string;
  contents: string;
};

export function createMobigentBackendFiles(options: MobigentBackendInitOptions): MobigentBackendGeneratedFile[] {
  return [
    {
      path: join(options.outDir, options.fileName),
      contents: createBackendFile(options)
    },
    {
      path: options.envFile,
      contents: createEnvFile()
    },
    {
      path: options.configFile,
      contents: createAppConfigFile(options)
    }
  ];
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
      options: defaultOptions()
    };
  }

  if (rest.includes("--help") || rest.includes("-h")) {
    return {
      command,
      help: true,
      options: defaultOptions()
    };
  }

  if (commandName === "mobigent-backend" && command === "backend") {
    return {
      command: "init",
      help: false,
      options: parseArgs(rest)
    };
  }

  return {
    command,
    help: false,
    options: parseArgs(args)
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
      case "--gateway-url":
        options.gatewayUrl = next();
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

  if (!options.appId || !options.appName) {
    throw new Error("--app-id and --app-name are required.\n\n" + helpText());
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
    gatewayUrl: "ws://localhost:8787",
    authToken: "dev-token",
    force: false,
    dryRun: false
  };
}

function createBackendFile(options: MobigentBackendInitOptions) {
  return `import { startMobigent } from "@mobigent/backend";

export const mobigent = await startMobigent({
  appToken: process.env.MOBIGENT_AUTH_TOKEN,
  apiKey: process.env.MOBIGENT_HTTP_API_KEY,
  app: {
    id: ${JSON.stringify(options.appId)},
    name: ${JSON.stringify(options.appName)}
  }
});

export const mobigentConfig = mobigent.defaultApp;

console.log("Mobigent inspector:", mobigent.urls.inspector);
console.log("Mobigent OpenAPI:", mobigent.urls.openapi);
console.log("Copy this into your app when you need a static config file:");
console.log(mobigent.copyAppConfig());
`;
}

function createEnvFile() {
  return `# Mobigent backend
# Use the same token in your mobile app config when app auth is enabled.
MOBIGENT_AUTH_TOKEN=dev-token

# Require this key before exposing the agent HTTP API publicly.
MOBIGENT_HTTP_API_KEY=dev-agent-key
`;
}

function createAppConfigFile(options: MobigentBackendInitOptions) {
  return `${JSON.stringify(
    {
      appId: options.appId,
      appName: options.appName,
      gatewayUrl: options.gatewayUrl,
      authToken: options.authToken
    },
    null,
    2
  )}\n`;
}

function formatSuccessMessage(options: MobigentBackendInitOptions, files: MobigentBackendGeneratedFile[]) {
  return `Created Mobigent backend files:
${files.map((file) => `  ${file.path}`).join("\n")}

Use this config in your app:
  npx mobigent init --config ${options.configFile} --feature expense --out-dir src

Run:
  node --env-file=${options.envFile} --import tsx ${join(options.outDir, options.fileName)}

Then open:
  http://localhost:8788/inspect
`;
}

function helpText() {
  return `mobigent-backend

Create a tiny backend entrypoint for @mobigent/backend.

Usage:
  mobigent-backend init --app-id com.example.app --app-name "Example App"
  mobigent-backend --app-id com.example.app --app-name "Example App"

Options:
  --app-id <id>       App id used by the mobile SDK config. Required.
  --app-name <name>   Human-readable app name. Required.
  --out-dir <path>    Output directory. Default: src.
  --file <name>       Backend file name. Default: mobigent.ts.
  --env <path>        Env file path. Default: .env.mobigent.
  --config-file <path> App config JSON for mobile init. Default: mobigent.app.json.
  --gateway-url <url> App WebSocket URL written to config. Default: ws://localhost:8787.
  --auth-token <token> App auth token written to config. Default: dev-token.
  --force             Overwrite generated files.
  --dry-run           Print generated files as JSON.
  -h, --help          Show help.
`;
}

function isMainModule() {
  return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
}

if (isMainModule()) {
  process.exitCode = runMobigentBackendCli();
}
