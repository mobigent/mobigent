import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chmod, mkdir, mkdtemp, rm, stat, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const dir = await mkdtemp(join(tmpdir(), "mobigent-bin-"));
const binDir = join(dir, "node_modules", ".bin");

try {
  await mkdir(binDir, { recursive: true });

  await linkBin("create-mobigent-app", "packages/create-app/dist/cli.js");
  await linkBin("mobigent-install", "packages/create-app/dist/install.js");
  await linkBin("mobigent-backend", "packages/backend/dist/cli.js");
  await linkBin("mobigent-mcp", "packages/backend/dist/mcp.js");
  await linkBin("mobigent-provider", "packages/providers/dist/cli.js");
  await linkBin("mobigent", "packages/cli/dist/cli.js");
  await linkBin("mobigent-init", "packages/react-native/dist/cli.js");

  const createApp = await run(join(binDir, "create-mobigent-app"), ["--help"]);
  assert.match(createApp, /create-mobigent-app/);
  assert.match(createApp, /Stable app id shared by app and backend/);
  assert.doesNotMatch(createApp, /App id for the Mobigent manifest/);

  const installer = await run(join(binDir, "mobigent-install"), ["app", "--dry-run"]);
  assert.match(installer, /npm install/);
  assert.match(installer, /mobigent-app-0\.1\.15\.tgz/);
  assert.doesNotMatch(installer, /mobigent-backend-0\.1\.15\.tgz/);

  const backend = await run(join(binDir, "mobigent-backend"), ["--help"]);
  assert.match(backend, /mobigent-backend/);
  assert.match(backend, /App id shared by app and backend/);
  assert.match(backend, /Advanced: also write optional app config files/);

  const backendMcp = await stat(join(binDir, "mobigent-mcp"));
  assert.equal(Boolean(backendMcp.mode & 0o111), true, "mobigent-mcp should be executable.");

  const provider = await run(join(binDir, "mobigent-provider"), [
    "--provider",
    "claude-desktop",
    "--command",
    "mobigent-mcp",
    "--format",
    "guide"
  ]);
  assert.match(provider, /Claude Desktop/);
  assert.match(provider, /mobigent-mcp/);

  const rn = await run(join(binDir, "mobigent-init"), ["--help"]);
  assert.match(rn, /Mobigent React Native developer tools/);
  assert.match(rn, /npm install @mobigent\/app/);
  assert.match(rn, /Normal app integration does not need this command/);
  assert.doesNotMatch(rn, /mobigent init --feature/);
  assert.doesNotMatch(rn, /mobigent-rn-init --feature expense --out-dir src/);

  const mobigentApp = await run(join(binDir, "mobigent"), ["app", "--help"]);
  assert.match(mobigentApp, /Mobigent React Native developer tools/);
  assert.match(mobigentApp, /createApp\(appId, functions\)\.with\(App\)/);
  assert.doesNotMatch(mobigentApp, /mobigent init --feature/);
  assert.doesNotMatch(mobigentApp, /mobigent-rn-init --feature expense --out-dir src/);
  const mobigentBackendHelp = await run(join(binDir, "mobigent"), ["backend", "--help"]);
  assert.match(mobigentBackendHelp, /mobigent-backend/);
  assert.doesNotMatch(mobigentBackendHelp, /--app-dir \.\.\/mobile-app/);
  const rootHelp = await run(join(binDir, "mobigent"), ["--help"]);
  assert.match(rootHelp, /backend --app com\.acme\.expenses/);
  assert.match(rootHelp, /mobigent app --help/);
  assert.doesNotMatch(rootHelp, /mobigent init --help/);
  assert.match(await run(join(binDir, "mobigent"), ["new", "--help"]), /create-mobigent-app/);

  console.log("Mobigent bin entrypoint smoke check passed.");
} finally {
  await rm(dir, { force: true, recursive: true });
}

async function linkBin(name: string, target: string) {
  const path = join(binDir, name);
  await symlink(resolve(target), path);
  await chmod(path, 0o755);
}

function run(command: string, args: string[]) {
  return new Promise<string>((resolveRun, reject) => {
    const child = spawn(process.execPath, [command, ...args], { cwd: process.cwd(), stdio: "pipe" });
    let output = "";
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${command} ${args.join(" ")} timed out\n${output}`));
    }, 15000);
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolveRun(output);
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with code ${code}\n${output}`));
    });
  });
}
