#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defaultMobigentVersion, releaseTarballSpec } from './index.js';

type InstallTarget = 'app' | 'backend' | 'both';

type ParsedOptions = {
  target: InstallTarget;
  version: string;
  dryRun: boolean;
  help?: boolean;
};

const installTargetLabels: Record<InstallTarget, string> = {
  app: 'app SDK',
  backend: 'backend SDK',
  both: 'app and backend SDKs',
};

const installTargets: Record<InstallTarget, string[]> = {
  app: ['mobigent-core', 'mobigent-react-native', 'mobigent-app'],
  backend: ['mobigent-core', 'mobigent-providers', 'mobigent-gateway', 'mobigent-backend'],
  both: [
    'mobigent-core',
    'mobigent-react-native',
    'mobigent-app',
    'mobigent-providers',
    'mobigent-gateway',
    'mobigent-backend',
  ],
};

export function runMobigentInstallCli(
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

    const specs = installTargets[options.target].map((name) =>
      releaseTarballSpec(name, options.version),
    );
    const command = ['npm', 'install', ...specs];

    if (options.dryRun) {
      output.write(`${friendlyInstallCommand(options.target)}\n`);
      if (options.version === defaultMobigentVersion) {
        output.write(
          'Mobigent installs the matching runtime packages for this public release behind the scenes.\n',
        );
      }
      return 0;
    }

    output.write(`Installing Mobigent ${installTargetLabels[options.target]}...\n`);
    const result = spawnSync(command[0], command.slice(1), {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    if (result.stdout) {
      output.write(result.stdout);
    }
    if (result.stderr) {
      errorOutput.write(result.stderr);
    }
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(`npm install failed with exit code ${result.status}`);
    }

    output.write('Mobigent packages installed.\n');
    return 0;
  } catch (error) {
    errorOutput.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

function friendlyInstallCommand(target: InstallTarget) {
  switch (target) {
    case 'app':
      return 'npm install @mobigent/app';
    case 'backend':
      return 'npm install @mobigent/backend';
    case 'both':
      return 'npm install @mobigent/app @mobigent/backend';
  }
}

function parseArgs(argv: string[]): ParsedOptions {
  const options: ParsedOptions = {
    target: 'both',
    version: defaultMobigentVersion,
    dryRun: false,
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
      case '--version':
      case '--package-version':
        options.version = next();
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
        options.target = parseTarget(arg);
        targetSeen = true;
    }
  }

  return options;
}

function parseTarget(value: string): InstallTarget {
  if (value === 'app' || value === 'backend' || value === 'both') {
    return value;
  }
  throw new Error('Install target must be app, backend, or both.');
}

function helpText() {
  return `mobigent-install

Install Mobigent packages from the public GitHub release while npmjs packages are being connected.

Usage:
  mobigent-install app
  mobigent-install backend
  mobigent-install both

Targets:
  app      App SDK for React Native and Expo apps
  backend  Backend SDK for servers and agent setup
  both     App and backend SDKs. Default.

Options:
  --version <version>  Mobigent release version. Default: ${defaultMobigentVersion}
  --dry-run           Print the npm install command without running it.
  -h, --help          Show help.
`;
}

function isMainModule() {
  return (
    Boolean(process.argv[1]) &&
    realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
  );
}

if (isMainModule()) {
  process.exitCode = runMobigentInstallCli();
}
