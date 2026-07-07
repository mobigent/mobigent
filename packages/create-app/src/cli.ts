#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createMobigentAppFiles,
  formatSuccessMessage,
  installMobigentAppDependencies,
  writeMobigentApp,
  type CreateMobigentAppOptions,
} from './index.js';

export function runCreateMobigentAppCli(
  argv = process.argv.slice(2),
  output = process.stdout,
  errorOutput = process.stderr,
) {
  try {
    const options = parseArgs(argv);

    if (options.help) {
      output.write(helpText());
      return 0;
    }

    if (options.dryRun) {
      output.write(`${JSON.stringify({ files: createMobigentAppFiles(options) }, null, 2)}\n`);
      return 0;
    }

    writeMobigentApp(options);
    if (options.installDependencies) {
      output.write('Installing dependencies...\n');
      const install = installMobigentAppDependencies(options);
      if (install.stdout) {
        output.write(install.stdout);
      }
      if (install.stderr) {
        errorOutput.write(install.stderr);
      }
      if (install.error) {
        throw install.error;
      }
      if (install.status !== 0) {
        throw new Error(`npm install failed with exit code ${install.status}`);
      }
    }
    output.write(formatSuccessMessage(options));
    return 0;
  } catch (error) {
    errorOutput.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

type ParsedOptions = CreateMobigentAppOptions & { help?: boolean };

function parseArgs(argv: string[]): ParsedOptions {
  const options: ParsedOptions = {
    targetDir: 'mobigent-demo',
    appId: 'com.mobigent.demo',
    appName: 'Mobigent Demo',
    gatewayPort: 8787,
    httpPort: 8788,
    appPort: 8790,
    openBrowser: true,
    force: false,
    dryRun: false,
    packageSource: defaultPackageSource(),
  };

  let targetSeen = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for ${arg}`);
      }
      index += 1;
      return value;
    };

    switch (arg) {
      case '--app-id':
        options.appId = next();
        options.stableAppIdentity = true;
        break;
      case '--app-name':
        options.appName = next();
        options.stableAppIdentity = true;
        break;
      case '--package-name':
        options.packageName = next();
        break;
      case '--gateway-port':
      case '--connection-port':
        options.gatewayPort = parsePort(arg, next());
        break;
      case '--http-port':
        options.httpPort = parsePort(arg, next());
        break;
      case '--app-port':
        options.appPort = parsePort(arg, next());
        break;
      case '--no-open':
        options.openBrowser = false;
        break;
      case '--local-packages':
        options.localPackages = next();
        break;
      case '--package-source':
        options.packageSource = parsePackageSource(next());
        break;
      case '--package-version':
        options.packageVersion = next();
        break;
      case '--install':
        options.installDependencies = true;
        break;
      case '--force':
        options.force = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unknown option ${arg}\n\n${helpText()}`);
        }
        if (targetSeen) {
          throw new Error(`Unexpected extra argument ${arg}\n\n${helpText()}`);
        }
        options.targetDir = arg;
        options.packageName ??= basename(arg);
        targetSeen = true;
    }
  }

  return options;
}

function parsePort(name: string, value: string) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be a TCP port between 1 and 65535.`);
  }
  return port;
}

function parsePackageSource(value: string) {
  if (value === 'github-release' || value === 'npm') {
    return value;
  }
  throw new Error('--package-source must be github-release or npm.');
}

function defaultPackageSource(): CreateMobigentAppOptions['packageSource'] {
  return process.env.MOBIGENT_PACKAGE_SOURCE === 'npm' ? 'npm' : 'github-release';
}

function helpText() {
  return `create-mobigent-app

Create a runnable Mobigent starter with a visible app, backend, inspector, and agent playground.

Usage:
  npm create mobigent-app my-demo -- --install
  npm exec --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz -- create-mobigent-app my-demo --install

Options:
  --app-id <id>          Optional production-style app id shared by app and backend.
  --app-name <name>     Visible app name. Also enables production-style app identity.
  --package-name <name> package.json name. Default: target folder name
  --connection-port <port> App connection port. Default: 8787
  --gateway-port <port> Backward-compatible alias for --connection-port.
  --http-port <port>    Backend API and inspector port. Default: 8788
  --app-port <port>     Visible app playground port. Default: 8790
  --no-open             Do not open the browser automatically.
  --local-packages <dir> Link generated app to local Mobigent packages in this repo.
  --package-source <source> Use npm or github-release package specs. Default: github-release until npmjs packages are live.
  --package-version <version> Mobigent package version. Default: latest starter version
  --install             Run npm install after files are created.
  --force               Overwrite generated files if they already exist.
  --dry-run             Print generated files as JSON without writing.
  -h, --help            Show help.
`;
}

function isMainModule() {
  return (
    Boolean(process.argv[1]) &&
    realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
  );
}

if (isMainModule()) {
  process.exitCode = runCreateMobigentAppCli();
}
