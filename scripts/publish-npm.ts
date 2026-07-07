import { execFile } from 'node:child_process';
import { spawn } from 'node:child_process';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const packages = [
  { name: '@mobigent/core', path: 'packages/core/package.json' },
  { name: '@mobigent/providers', path: 'packages/providers/package.json' },
  { name: '@mobigent/gateway', path: 'packages/gateway/package.json' },
  { name: '@mobigent/backend', path: 'packages/backend/package.json' },
  { name: '@mobigent/react-native', path: 'packages/react-native/package.json' },
  { name: '@mobigent/app', path: 'packages/app/package.json' },
  { name: 'create-mobigent-app', path: 'packages/create-app/package.json' },
  { name: 'mobigent', path: 'packages/cli/package.json' },
];

const npmToken = process.env.NODE_AUTH_TOKEN || process.env.NPM_TOKEN || '';
const hasToken = Boolean(npmToken);
const usesTrustedPublishing = process.env.NPM_TRUSTED_PUBLISHING === 'true';
const npmUserConfig = npmToken ? await createTokenUserConfig(npmToken) : undefined;

if (!hasToken && !usesTrustedPublishing && !(await isLoggedIn())) {
  console.error('Cannot publish to npmjs.com.');
  console.error(
    'Set GitHub secret NPM_TOKEN, configure npm Trusted Publishing with NPM_TRUSTED_PUBLISHING=true, or run npm login locally.',
  );
  process.exit(1);
}

try {
  for (const item of packages) {
    const packageJson = JSON.parse(await readFile(item.path, 'utf8')) as { version: string };
    const version = packageJson.version;

    if (await isPublished(item.name, version)) {
      console.log(`published ${item.name}@${version} already exists, skipping`);
      continue;
    }

    const args = ['publish', '--workspace', item.name, '--access', 'public'];
    if (npmUserConfig) {
      args.push('--userconfig', npmUserConfig);
    }
    if (hasToken && process.env.GITHUB_ACTIONS === 'true') {
      args.push('--provenance');
    }

    console.log(`publishing ${item.name}@${version}`);
    await run('npm', args);
  }
} finally {
  if (npmUserConfig) {
    await rm(dirname(npmUserConfig), { force: true, recursive: true });
  }
}

async function isPublished(packageName: string, version: string) {
  try {
    await execFileAsync('npm', ['view', `${packageName}@${version}`, 'version'], {
      encoding: 'utf8',
    });
    return true;
  } catch {
    return false;
  }
}

async function isLoggedIn() {
  try {
    await execFileAsync('npm', ['whoami'], {
      encoding: 'utf8',
    });
    return true;
  } catch {
    return false;
  }
}

async function run(command: string, args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        ...(npmToken ? { NODE_AUTH_TOKEN: npmToken } : {}),
      },
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

async function createTokenUserConfig(token: string) {
  const dir = await mkdtemp(join(tmpdir(), 'mobigent-npm-'));
  const path = join(dir, '.npmrc');
  await writeFile(
    path,
    [
      'registry=https://registry.npmjs.org/',
      `//registry.npmjs.org/:_authToken=${token}`,
      'always-auth=true',
      '',
    ].join('\n'),
    'utf8',
  );
  await chmod(path, 0o600);
  return path;
}
