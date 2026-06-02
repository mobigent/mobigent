import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runReactNativeInitCli } from "../packages/react-native/src/cli.js";

const dir = await mkdtemp(join(tmpdir(), "mobigent-rn-cli-"));

function run(args: string[]) {
  let stdout = "";
  let stderr = "";
  const code = runReactNativeInitCli(
    args,
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream
  );

  return { code, stdout, stderr };
}

try {
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify({
      dependencies: {
        "@mobigent/app": "0.1.12",
        "react-native": "0.74.0"
      }
    }),
    "utf8"
  );

  const init = run([
    "--app-id",
    "com.mobigent.smoke",
    "--app-name",
    "Mobigent Smoke",
    "--feature",
    "task",
    "--out-dir",
    dir,
    "--custom-confirmation"
  ]);
  assert.equal(init.code, 0, init.stderr);
  const rootFile = await readFile(join(dir, "mobigent.tsx"), "utf8");
  assert.match(rootFile, /MobigentRoot/);
  assert.match(rootFile, /@mobigent\/app/);
  assert.match(rootFile, /createApp/);
  assert.match(rootFile, /export const mobigent/);
  assert.match(rootFile, /withMobigentApp/);
  assert.match(rootFile, /mobigent\.with\(App\)/);
  assert.match(rootFile, /features: \[taskFeature\]/);
  assert.match(rootFile, /ConfirmationComponent: MobigentAgentApproval/);
  assert.match(await readFile(join(dir, "mobigent-confirmation.tsx"), "utf8"), /useMobigentConfirmation/);
  assert.match(
    await readFile(join(dir, "mobigent-features", "task.ts"), "utf8"),
    /defineFeature\("task", \{[\s\S]*list: read\([\s\S]*create: write\(/
  );

  await writeFile(
    join(dir, "mobigent.app.json"),
    JSON.stringify({
      appId: "com.mobigent.auto",
      appName: "Auto Config App",
      connectionUrl: "ws://localhost:8787",
      authToken: "dev-token"
    }),
    "utf8"
  );
  const previousCwd = process.cwd();
  process.chdir(dir);
  try {
    const autoConfigInit = run(["--feature", "auto", "--out-dir", join(dir, "auto-config")]);
    assert.equal(autoConfigInit.code, 0, autoConfigInit.stderr);
  } finally {
    process.chdir(previousCwd);
  }
  const autoConfigRoot = await readFile(join(dir, "auto-config", "mobigent.tsx"), "utf8");
  assert.match(await readFile(join(dir, "auto-config", "mobigent-config.ts"), "utf8"), /com.mobigent.auto/);
  assert.match(autoConfigRoot, /config: mobigentConfig/);
  assert.doesNotMatch(autoConfigRoot, /gatewayUrl: process\.env/);

  const backendDir = join(dir, "backend");
  await mkdir(backendDir);
  await writeFile(
    join(backendDir, "mobigent.app.json"),
    JSON.stringify({
      appId: "com.mobigent.backenddir",
      appName: "Backend Dir App",
      connectionUrl: "ws://localhost:8787"
    }),
    "utf8"
  );
  const backendDirInit = run([
    "--backend-dir",
    backendDir,
    "--feature",
    "backenddir",
    "--out-dir",
    join(dir, "backend-dir-config")
  ]);
  assert.equal(backendDirInit.code, 0, backendDirInit.stderr);
  assert.match(await readFile(join(dir, "backend-dir-config", "mobigent-config.ts"), "utf8"), /com.mobigent.backenddir/);

  const backendFirstDir = join(dir, "backend-first");
  await mkdir(backendFirstDir);
  await writeFile(
    join(backendFirstDir, "mobigent-config.ts"),
    `import { defineMobigentConfig } from "@mobigent/app";

export const mobigentConfig = defineMobigentConfig({
  appId: "com.mobigent.backendfirst",
  appName: "Backend First App",
  connectionUrl: "ws://localhost:8787"
});
`,
    "utf8"
  );
  const backendFirstInit = run([
    "--app-id",
    "com.mobigent.generated",
    "--app-name",
    "Generated App",
    "--feature",
    "backendfirst",
    "--out-dir",
    backendFirstDir
  ]);
  assert.equal(backendFirstInit.code, 0, backendFirstInit.stderr);
  assert.match(await readFile(join(backendFirstDir, "mobigent.tsx"), "utf8"), /config: mobigentConfig/);
  assert.match(await readFile(join(backendFirstDir, "mobigent-config.ts"), "utf8"), /com.mobigent.backendfirst/);
  assert.doesNotMatch(await readFile(join(backendFirstDir, "mobigent-config.ts"), "utf8"), /com.mobigent.generated/);

  const secondFeatureInit = run([
    "--app-id",
    "com.mobigent.backendfirst",
    "--app-name",
    "Backend First App",
    "--feature",
    "invoice",
    "--out-dir",
    backendFirstDir
  ]);
  assert.equal(secondFeatureInit.code, 0, secondFeatureInit.stderr);
  const backendFirstRoot = await readFile(join(backendFirstDir, "mobigent.tsx"), "utf8");
  assert.match(backendFirstRoot, /backendfirstFeature/);
  assert.match(backendFirstRoot, /invoiceFeature/);
  assert.match(
    await readFile(join(backendFirstDir, "mobigent-features", "invoice.ts"), "utf8"),
    /defineFeature\("invoice", \{[\s\S]*create: write\(/
  );

  const workspaceDir = join(dir, "workspace");
  const workspaceBackendDir = join(workspaceDir, "backend");
  const workspaceAppDir = join(workspaceDir, "mobile");
  await mkdir(workspaceBackendDir, { recursive: true });
  await mkdir(workspaceAppDir);
  await writeFile(
    join(workspaceBackendDir, "mobigent.app.json"),
    JSON.stringify({
      appId: "com.mobigent.sibling",
      appName: "Sibling Backend App",
      connectionUrl: "ws://localhost:8787"
    }),
    "utf8"
  );
  const previousSiblingCwd = process.cwd();
  process.chdir(workspaceAppDir);
  try {
    const siblingInit = run(["--feature", "sibling", "--out-dir", join(workspaceAppDir, "src")]);
    assert.equal(siblingInit.code, 0, siblingInit.stderr);
  } finally {
    process.chdir(previousSiblingCwd);
  }
  assert.match(await readFile(join(workspaceAppDir, "src", "mobigent-config.ts"), "utf8"), /com.mobigent.sibling/);

  const doctor = run([
    "--doctor",
    "--app-id",
    "com.mobigent.smoke",
    "--app-name",
    "Mobigent Smoke",
    "--feature",
    "task",
    "--app-root",
    dir,
    "--out-dir",
    dir,
    "--custom-confirmation"
  ]);
  assert.equal(doctor.code, 0, doctor.stderr);
  assert.match(doctor.stdout, /Mobigent React Native doctor: PASS/);

  const contractPath = join(dir, "mobigent-contract.json");
  const writeContract = run([
    "--write-contract",
    contractPath,
    "--app-id",
    "com.mobigent.smoke",
    "--app-name",
    "Mobigent Smoke",
    "--feature",
    "task"
  ]);
  assert.equal(writeContract.code, 0, writeContract.stderr);
  assert.match(await readFile(contractPath, "utf8"), /mobigent.react-native.capability-contract/);

  const validateContract = run(["--validate-contract", contractPath]);
  assert.equal(validateContract.code, 0, validateContract.stderr);
  assert.match(validateContract.stdout, /Mobigent React Native contract: PASS/);

  const manifestPath = join(dir, "mobigent-integration.json");
  const writeManifest = run([
    "--write-manifest",
    manifestPath,
    "--app-id",
    "com.mobigent.smoke",
    "--app-name",
    "Mobigent Smoke",
    "--feature",
    "task",
    "--out-dir",
    dir
  ]);
  assert.equal(writeManifest.code, 0, writeManifest.stderr);
  assert.equal(JSON.parse(await readFile(manifestPath, "utf8")).capabilities.actions[0], "task_create");

  const validateManifest = run(["--validate-manifest", manifestPath]);
  assert.equal(validateManifest.code, 0, validateManifest.stderr);
  assert.match(validateManifest.stdout, /Mobigent React Native integration manifest: PASS/);

  const envPath = join(dir, ".env.mobigent");
  const writeEnv = run(["--write-env", envPath, "--gateway-url", "ws://localhost:8787"]);
  assert.equal(writeEnv.code, 0, writeEnv.stderr);
  assert.match(await readFile(envPath, "utf8"), /EXPO_PUBLIC_MOBIGENT_GATEWAY_URL=ws:\/\/localhost:8787/);

  const manifest = run([
    "--manifest",
    "--app-id",
    "com.mobigent.smoke",
    "--app-name",
    "Mobigent Smoke",
    "--feature",
    "task",
    "--out-dir",
    dir
  ]);
  assert.equal(manifest.code, 0, manifest.stderr);
  assert.equal(JSON.parse(manifest.stdout).capabilities.actions[0], "task_create");

  console.log("Mobigent React Native CLI smoke check passed.");
} finally {
  await rm(dir, { force: true, recursive: true });
}
