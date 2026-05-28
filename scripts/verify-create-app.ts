import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCreateMobigentAppCli } from "../packages/create-app/src/cli.js";

const dir = await mkdtemp(join(tmpdir(), "mobigent-create-app-"));

function run(args: string[]) {
  let stdout = "";
  let stderr = "";
  const code = runCreateMobigentAppCli(
    args,
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream
  );

  return { code, stdout, stderr };
}

try {
  const target = join(dir, "expense-demo");

  const dryRun = run([
    target,
    "--app-id",
    "com.mobigent.expense",
    "--app-name",
    "Expense Demo",
    "--no-open",
    "--dry-run"
  ]);
  assert.equal(dryRun.code, 0, dryRun.stderr);
  const dryRunFiles = JSON.parse(dryRun.stdout).files as Array<{ path: string; contents: string }>;
  assert.ok(dryRunFiles.some((file) => file.path === "src/server.ts"));
  assert.ok(dryRunFiles.some((file) => file.path === "src/capabilities.ts"));
  assert.match(dryRun.stdout, /com_mobigent_expense.create_expense/);

  const init = run([
    target,
    "--app-id",
    "com.mobigent.expense",
    "--app-name",
    "Expense Demo",
    "--no-open"
  ]);
  assert.equal(init.code, 0, init.stderr);
  assert.match(init.stdout, /Created Mobigent starter/);
  assert.match(init.stdout, /npm install/);
  assert.match(init.stdout, /npm run dev/);

  const packageJson = JSON.parse(await readFile(join(target, "package.json"), "utf8"));
  assert.equal(packageJson.name, "expense-demo");
  assert.equal(packageJson.scripts.dev, "tsx src/server.ts");
  assert.equal(packageJson.scripts.doctor, "tsx src/doctor.ts");
  assert.equal(packageJson.scripts["agent:local"], "mobigent-provider --provider claude-desktop --command mobigent-mcp --format guide");
  assert.equal(packageJson.scripts["agent:openapi"], "mobigent-provider --provider openapi --base-url http://localhost:8788 --format guide");
  assert.equal(
    packageJson.scripts["agent:chatgpt"],
    "mobigent-provider --provider chatgpt-actions --base-url https://your-public-gateway.example --format guide"
  );
  assert.equal(packageJson.dependencies["@mobigent/gateway"], "^0.1.0");
  assert.equal(packageJson.dependencies["@mobigent/providers"], "^0.1.0");
  assert.equal(packageJson.dependencies["@mobigent/react-native"], "^0.1.0");
  assert.equal(packageJson.devDependencies["@types/express"], "^5.0.6");

  const server = await readFile(join(target, "src", "server.ts"), "utf8");
  assert.match(server, /appId: "com.mobigent.expense"/);
  assert.match(server, /appName: "Expense Demo"/);
  assert.match(server, /Run agent request/);
  assert.match(server, /How this demo works/);
  assert.match(server, /You edit one file/);
  assert.match(server, /src\/capabilities\.ts/);
  assert.doesNotMatch(server, /mobigent\.registerAction/);
  assert.match(server, /MOBIGENT_DEMO_OPEN/);

  const capabilities = await readFile(join(target, "src", "capabilities.ts"), "utf8");
  assert.match(capabilities, /registerMobigentCapabilities/);
  assert.match(capabilities, /mobigent\.registerAction/);
  assert.match(capabilities, /create_expense/);
  assert.match(capabilities, /createExpense/);

  const doctor = await readFile(join(target, "src", "doctor.ts"), "utf8");
  assert.match(doctor, /Mobigent starter doctor/);
  assert.match(doctor, /com_mobigent_expense.create_expense/);
  assert.match(doctor, /ready\?minApps=1&minTools=1/);

  const duplicate = run([target, "--no-open"]);
  assert.equal(duplicate.code, 1);
  assert.match(duplicate.stderr, /already exists/);

  const forced = run([target, "--force", "--no-open"]);
  assert.equal(forced.code, 0, forced.stderr);

  const help = run(["--help"]);
  assert.equal(help.code, 0, help.stderr);
  assert.match(help.stdout, /--install/);

  const installMessage = run([join(dir, "install-message-demo"), "--install", "--no-open", "--dry-run"]);
  assert.equal(installMessage.code, 0, installMessage.stderr);

  const localTarget = join(dir, "local-demo");
  const localInit = run([
    localTarget,
    "--app-id",
    "com.mobigent.local",
    "--app-name",
    "Local Demo",
    "--no-open",
    "--local-packages",
    process.cwd()
  ]);
  assert.equal(localInit.code, 0, localInit.stderr);
  const localPackageJson = JSON.parse(await readFile(join(localTarget, "package.json"), "utf8"));
  assert.match(localPackageJson.dependencies["@mobigent/core"], /^file:/);
  assert.match(localPackageJson.dependencies["@mobigent/providers"], /^file:/);
  assert.match(localPackageJson.dependencies["@mobigent/gateway"], /^file:/);
  assert.match(localPackageJson.dependencies["@mobigent/react-native"], /^file:/);
  assert.match(await readFile(join(localTarget, "README.md"), "utf8"), /linked to local Mobigent packages/);
  assert.match(await readFile(join(localTarget, "README.md"), "utf8"), /npm run agent:local/);

  console.log("create-mobigent-app smoke check passed.");
} finally {
  await rm(dir, { force: true, recursive: true });
}
