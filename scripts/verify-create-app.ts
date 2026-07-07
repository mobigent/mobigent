import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCreateMobigentAppCli } from '../packages/create-app/src/cli.js';
import { runMobigentInstallCli } from '../packages/create-app/src/install.js';

const dir = await mkdtemp(join(tmpdir(), 'mobigent-create-app-'));

function run(args: string[]) {
  let stdout = '';
  let stderr = '';
  const code = runCreateMobigentAppCli(
    args,
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream,
  );

  return { code, stdout, stderr };
}

function runInstall(args: string[]) {
  let stdout = '';
  let stderr = '';
  const code = runMobigentInstallCli(
    args,
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream,
  );

  return { code, stdout, stderr };
}

try {
  const target = join(dir, 'expense-demo');

  const dryRun = run([target, '--no-open', '--dry-run']);
  assert.equal(dryRun.code, 0, dryRun.stderr);
  const dryRunFiles = JSON.parse(dryRun.stdout).files as Array<{ path: string; contents: string }>;
  assert.ok(dryRunFiles.some((file) => file.path === 'src/server.ts'));
  assert.ok(dryRunFiles.some((file) => file.path === 'src/app-functions.ts'));
  assert.equal(
    dryRunFiles.some((file) => file.path === 'src/capabilities.ts'),
    false,
  );
  assert.match(dryRun.stdout, /app_mobigent_local.expense_create/);

  const init = run([target, '--no-open']);
  assert.equal(init.code, 0, init.stderr);
  assert.match(init.stdout, /Created Mobigent starter/);
  assert.match(init.stdout, /npm install/);
  assert.match(init.stdout, /npm run dev/);

  const packageJson = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'));
  assert.equal(packageJson.name, 'expense-demo');
  assert.equal(packageJson.scripts.dev, 'tsx src/server.ts');
  assert.equal(packageJson.scripts.doctor, 'tsx src/doctor.ts');
  assert.equal(packageJson.scripts['agent:local'], 'mobigent-backend agent claude --format guide');
  assert.equal(
    packageJson.scripts['agent:openapi'],
    'mobigent-backend agent openapi --base-url http://localhost:8788 --format guide',
  );
  assert.equal(
    packageJson.scripts['agent:chatgpt'],
    'mobigent-backend agent chatgpt --base-url https://your-public-backend.example --format guide',
  );
  assert.equal(
    packageJson.dependencies['@mobigent/backend'],
    'https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-backend-0.1.15.tgz',
  );
  assert.equal(
    packageJson.dependencies['@mobigent/app'],
    'https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-app-0.1.15.tgz',
  );
  assert.equal('@mobigent/core' in packageJson.dependencies, false);
  assert.equal('@mobigent/gateway' in packageJson.dependencies, false);
  assert.equal('@mobigent/providers' in packageJson.dependencies, false);
  assert.match(
    packageJson.overrides['@mobigent/core'],
    /https:\/\/github\.com\/mobigent\/mobigent\/releases\/download\/v0\.1\.15\/mobigent-core-0\.1\.15\.tgz/,
  );
  assert.equal(packageJson.devDependencies['@types/express'], '^5.0.6');

  const server = await readFile(join(target, 'src', 'server.ts'), 'utf8');
  assert.doesNotMatch(server, /appId: "com.mobigent.expense"/);
  assert.doesNotMatch(server, /app: \{/);
  assert.match(server, /Run agent request/);
  assert.match(server, /How this demo works/);
  assert.match(server, /You edit one file/);
  assert.match(server, /src\/app-functions\.ts/);
  assert.doesNotMatch(server, /src\/capabilities\.ts/);
  assert.match(server, /startMobigent/);
  assert.match(server, /startMobigent\(\)/);
  assert.doesNotMatch(server, /startMobigent\("com\.mobigent\.expense"/);
  assert.doesNotMatch(server, /startMobigent\("com\.mobigent\.demo"/);
  assert.doesNotMatch(server, /appId: "com\.mobigent\.expense"/);
  assert.doesNotMatch(server, /const expense = backend\.feature\("expense"\)/);
  assert.match(server, /backend\.app<MyAppFunctions>\(\)/);
  assert.doesNotMatch(server, /backend\.use<MyAppFunctions>\(\)/);
  assert.match(server, /appApi\.expense\.create\(input\)/);
  assert.doesNotMatch(server, /backend\.functions\.expense\.create\(input\)/);
  assert.doesNotMatch(server, /backend\.app\.expense\.create\(input\)/);
  assert.match(server, /createApp\(expenseFunctions, \{/);
  assert.doesNotMatch(server, /createApp\("com\.mobigent\.expense", expenseFunctions/);
  assert.doesNotMatch(server, /appName: "Expense Demo"/);
  assert.match(server, /backend,\n/);
  assert.doesNotMatch(server, /backend: backend\.appSettings\(\)/);
  assert.doesNotMatch(server, /pairing: backend\.pairing\(\)/);
  assert.doesNotMatch(server, /functions: expenseFunctions/);
  assert.match(server, /mobigent\.connect\(\)/);
  assert.doesNotMatch(server, /mobigent\.connect\(backend\)/);
  assert.doesNotMatch(server, /backend\.defaultApp/);
  assert.doesNotMatch(server, /connectionUrl: backend\.urls\.websocket/);
  assert.match(server, /MOBIGENT_DEMO_OPEN/);

  const capabilities = await readFile(join(target, 'src', 'app-functions.ts'), 'utf8');
  assert.match(capabilities, /export const expenseFunctions = \{/);
  assert.match(capabilities, /export type MyAppFunctions = typeof expenseFunctions/);
  assert.match(
    capabilities,
    /async \(input: \{ amount: number; merchant: string; category: string; notes\?: string \}\)/,
  );
  assert.match(capabilities, /list: async \(\) => \(\{ expenses \}\)/);
  assert.match(capabilities, /create: write\(/);
  assert.match(capabilities, /amount: "number"/);
  assert.match(capabilities, /createExpense/);
  assert.doesNotMatch(capabilities, /list: read\(/);
  assert.doesNotMatch(capabilities, /defineFeature/);

  const doctor = await readFile(join(target, 'src', 'doctor.ts'), 'utf8');
  assert.match(doctor, /Mobigent starter doctor/);
  assert.match(doctor, /app_mobigent_local.expense_create/);
  assert.match(doctor, /ready\?minApps=1&minFunctions=1/);
  assert.match(doctor, /const backendUrl = "http:\/\/localhost:8788"/);
  assert.doesNotMatch(doctor, /const gatewayUrl|function toolName|app manifest\(s\)/);

  const duplicate = run([target, '--no-open']);
  assert.equal(duplicate.code, 1);
  assert.match(duplicate.stderr, /already exists/);

  const forced = run([target, '--force', '--no-open']);
  assert.equal(forced.code, 0, forced.stderr);

  const help = run(['--help']);
  assert.equal(help.code, 0, help.stderr);
  assert.match(help.stdout, /--install/);
  assert.match(help.stdout, /--package-source/);
  assert.match(help.stdout, /Default: github-release until npmjs packages are live/);
  assert.match(help.stdout, /--connection-port/);
  assert.match(help.stdout, /Optional production-style app id shared by app and backend/);
  assert.doesNotMatch(help.stdout, /App id for the Mobigent manifest/);
  assert.doesNotMatch(help.stdout, /HTTP\/OpenAPI\/inspector backend port/);

  const installHelp = runInstall(['--help']);
  assert.equal(installHelp.code, 0, installHelp.stderr);
  assert.match(installHelp.stdout, /mobigent-install/);
  assert.match(installHelp.stdout, /App SDK for React Native and Expo apps/);
  assert.match(installHelp.stdout, /Backend SDK for servers and agent setup/);
  assert.doesNotMatch(installHelp.stdout, /gateway packages/);

  const appInstall = runInstall(['app', '--dry-run']);
  assert.equal(appInstall.code, 0, appInstall.stderr);
  assert.match(appInstall.stdout, /npm install/);
  assert.match(appInstall.stdout, /@mobigent\/app/);
  assert.doesNotMatch(
    appInstall.stdout,
    /mobigent-core-0\.1\.15\.tgz|mobigent-react-native-0\.1\.15\.tgz|mobigent-backend-0\.1\.15\.tgz/,
  );

  const backendInstall = runInstall(['backend', '--dry-run']);
  assert.equal(backendInstall.code, 0, backendInstall.stderr);
  assert.match(backendInstall.stdout, /@mobigent\/backend/);
  assert.doesNotMatch(
    backendInstall.stdout,
    /mobigent-core-0\.1\.15\.tgz|mobigent-providers-0\.1\.15\.tgz|mobigent-gateway-0\.1\.15\.tgz|mobigent-app-0\.1\.15\.tgz/,
  );

  const releaseTarget = join(dir, 'release-demo');
  const releaseInit = run([releaseTarget, '--no-open']);
  assert.equal(releaseInit.code, 0, releaseInit.stderr);
  const releasePackageJson = JSON.parse(
    await readFile(join(releaseTarget, 'package.json'), 'utf8'),
  );
  assert.equal(
    releasePackageJson.dependencies['@mobigent/backend'],
    'https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-backend-0.1.15.tgz',
  );
  assert.equal(
    releasePackageJson.dependencies['@mobigent/app'],
    'https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-app-0.1.15.tgz',
  );
  assert.equal(
    releasePackageJson.overrides['@mobigent/core'],
    'https://github.com/mobigent/mobigent/releases/download/v0.1.15/mobigent-core-0.1.15.tgz',
  );
  assert.match(await readFile(join(releaseTarget, 'README.md'), 'utf8'), /GitHub release tarballs/);

  const npmTarget = join(dir, 'npm-demo');
  const npmInit = run([
    npmTarget,
    '--no-open',
    '--package-source',
    'npm',
    '--package-version',
    '1.2.3',
  ]);
  assert.equal(npmInit.code, 0, npmInit.stderr);
  const npmPackageJson = JSON.parse(await readFile(join(npmTarget, 'package.json'), 'utf8'));
  assert.equal(npmPackageJson.dependencies['@mobigent/backend'], '^1.2.3');
  assert.equal(npmPackageJson.dependencies['@mobigent/app'], '^1.2.3');
  assert.equal(npmPackageJson.overrides, undefined);
  assert.equal('@mobigent/core' in npmPackageJson.dependencies, false);
  assert.equal('@mobigent/gateway' in npmPackageJson.dependencies, false);
  assert.equal('@mobigent/providers' in npmPackageJson.dependencies, false);
  assert.equal(
    npmPackageJson.scripts['agent:local'],
    'mobigent-backend agent claude --format guide',
  );
  assert.doesNotMatch(
    JSON.stringify(npmPackageJson.scripts),
    /mobigent-provider|@mobigent\/providers/,
  );

  const installMessage = run([
    join(dir, 'install-message-demo'),
    '--install',
    '--no-open',
    '--dry-run',
  ]);
  assert.equal(installMessage.code, 0, installMessage.stderr);

  const localTarget = join(dir, 'local-demo');
  const localInit = run([
    localTarget,
    '--app-id',
    'com.mobigent.local',
    '--app-name',
    'Local Demo',
    '--no-open',
    '--local-packages',
    process.cwd(),
  ]);
  assert.equal(localInit.code, 0, localInit.stderr);
  const localPackageJson = JSON.parse(await readFile(join(localTarget, 'package.json'), 'utf8'));
  assert.match(localPackageJson.dependencies['@mobigent/backend'], /^file:/);
  assert.match(localPackageJson.dependencies['@mobigent/app'], /^file:/);
  assert.equal('@mobigent/core' in localPackageJson.dependencies, false);
  assert.equal('@mobigent/gateway' in localPackageJson.dependencies, false);
  assert.equal('@mobigent/providers' in localPackageJson.dependencies, false);
  assert.match(localPackageJson.overrides['@mobigent/core'], /^file:/);
  assert.match(localPackageJson.overrides['@mobigent/providers'], /^file:/);
  assert.match(localPackageJson.overrides['@mobigent/gateway'], /^file:/);
  assert.match(localPackageJson.overrides['@mobigent/react-native'], /^file:/);
  assert.match(
    await readFile(join(localTarget, 'README.md'), 'utf8'),
    /linked to local Mobigent packages/,
  );
  assert.match(await readFile(join(localTarget, 'README.md'), 'utf8'), /npm run agent:local/);

  console.log('create-mobigent-app smoke check passed.');
} finally {
  await rm(dir, { force: true, recursive: true });
}
