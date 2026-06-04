import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

type PackEntry = {
  name: string;
  filename: string;
};

const packageDirs = [
  "packages/core",
  "packages/providers",
  "packages/gateway",
  "packages/backend",
  "packages/react-native",
  "packages/app",
  "packages/create-app",
  "packages/cli"
];

const root = process.cwd();
const dir = await mkdtemp(join(tmpdir(), "mobigent-packed-install-"));
const packDir = join(dir, "packs");
const appDir = join(dir, "consumer");

try {
  const tarballs: string[] = [];
  await mkdir(packDir, { recursive: true });

  for (const packageDir of packageDirs) {
    const output = await run("npm", ["pack", "--json", "--pack-destination", packDir], join(root, packageDir));
    const [entry] = JSON.parse(output) as PackEntry[];
    assert.ok(entry?.filename, `${packageDir} did not produce a package tarball.`);
    tarballs.push(join(packDir, entry.filename));
  }

  await run("npm", ["init", "-y"], appDir, { createCwd: true });
  await run("npm", ["install", "--ignore-scripts", ...tarballs], appDir);
  await assertNotInstalled(appDir, "react");
  await assertNotInstalled(appDir, "react-native");

  const smokeFile = join(appDir, "smoke.mjs");
  await writeFile(
    smokeFile,
    `import assert from "node:assert/strict";
import { startMobigent } from "@mobigent/backend";
import { feature, simpleSchema } from "@mobigent/app/simple";

const expenses = feature("expense").write("create", async (input) => ({ ok: true, ...input }), {
  input: { merchant: "string", amount: "number" }
});

assert.equal(expenses.actions[0].name, "expense_create");
assert.equal(simpleSchema({ amount: "number" }).properties.amount.type, "number");

const mobigent = await startMobigent("app.mobigent.local", "Mobigent App", {
  wsPort: 19081,
  httpPort: 19082,
  silent: true
});
assert.equal(mobigent.defaultApp.connectionUrl, "ws://localhost:19081");
assert.equal(mobigent.resolveFunctionName("expense.create"), "expense.create");
assert.equal(Array.isArray(mobigent.listFunctions()), true);
assert.equal(Array.isArray(mobigent.functions()), true);
assert.equal(typeof mobigent.use("expense").create, "function");
assert.equal(typeof mobigent.use({ createExpense: "expense.create" }).createExpense, "function");
assert.equal(typeof mobigent.fn("expense.create"), "function");
assert.equal(typeof mobigent.call, "function");
assert.equal(typeof mobigent.function("expense.create"), "function");
assert.equal(typeof mobigent.functions.expense.create, "function");
assert.equal(typeof mobigent.feature("expense").create, "function");
assert.equal(typeof mobigent.appFunctions("expense").create, "function");
await mobigent.stop();
`,
    "utf8"
  );

  await run("node", [smokeFile], appDir);

  const binDir = join(appDir, "node_modules", ".bin");
  assert.match(await run(join(binDir, "mobigent-backend"), ["--help"], appDir), /mobigent-backend/);
  assert.match(await run(join(binDir, "mobigent"), ["init", "--help"], appDir), /mobigent init/);
  assert.match(await run(join(binDir, "mobigent"), ["backend", "--help"], appDir), /mobigent-backend/);
  assert.match(await run(join(binDir, "mobigent"), ["new", "--help"], appDir), /create-mobigent-app/);
  assert.match(await run(join(binDir, "create-mobigent-app"), ["--help"], appDir), /create-mobigent-app/);
  assert.match(await run(join(binDir, "mobigent-install"), ["backend", "--dry-run"], appDir), /mobigent-backend-0\.1\.15\.tgz/);

  console.log("Mobigent packed install smoke check passed.");
} finally {
  await rm(dir, { force: true, recursive: true });
}

async function run(command: string, args: string[], cwd: string, options: { createCwd?: boolean } = {}) {
  if (options.createCwd) {
    await mkdtempParent(cwd);
  }

  return new Promise<string>((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "pipe"
    });

    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolveRun(output.trim());
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed in ${cwd}\n${output}`));
    });
  });
}

async function mkdtempParent(path: string) {
  await mkdir(path, { recursive: true });
}

async function assertNotInstalled(appDir: string, packageName: string) {
  try {
    await stat(join(appDir, "node_modules", packageName));
  } catch {
    return;
  }

  throw new Error(`Packed Mobigent install should not auto-install optional peer ${packageName}.`);
}
