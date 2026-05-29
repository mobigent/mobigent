import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
        "@mobigent/react-native": "0.1.11",
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
  assert.match(rootFile, /@mobigent\/react-native/);
  assert.match(rootFile, /setupMobigent/);
  assert.match(rootFile, /features: \[taskFeature\]/);
  assert.match(rootFile, /ConfirmationComponent: MobigentAgentApproval/);
  assert.match(await readFile(join(dir, "mobigent-confirmation.tsx"), "utf8"), /useMobigentConfirmation/);
  assert.match(
    await readFile(join(dir, "mobigent-features", "task.ts"), "utf8"),
    /defineFeature\("task"\)/
  );

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
