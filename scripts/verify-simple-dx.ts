import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createMobigentAppFiles } from "../packages/create-app/src/index.js";
import { createMobigentBackendFiles } from "../packages/backend/src/cli.js";
import { createReactNativeStarterFiles } from "../packages/react-native/src/cli.js";

const starterPackage = JSON.parse(
  createMobigentAppFiles({
    targetDir: "demo",
    appId: "com.example.app",
    appName: "Example App",
    gatewayPort: 8787,
    httpPort: 8788,
    appPort: 8790,
    openBrowser: false,
    force: false,
    dryRun: true,
    packageSource: "npm",
    packageVersion: "1.2.3"
  }).find((file) => file.path === "package.json")?.contents ?? "{}"
);

assert.deepEqual(
  Object.keys(starterPackage.dependencies).filter((name) => name.startsWith("@mobigent/")).sort(),
  ["@mobigent/app", "@mobigent/backend"],
  "npm starter should expose only the app and backend SDK packages"
);
assert.equal(starterPackage.overrides, undefined, "npm starter should not need internal Mobigent package overrides");
assert.equal(starterPackage.scripts["agent:local"], "mobigent-backend agent claude --format guide");
assert.doesNotMatch(JSON.stringify(starterPackage.scripts), /mobigent-provider|@mobigent\/providers/);

const backendFile = createMobigentBackendFiles({
  appId: "com.example.app",
  appName: "Example App",
  outDir: "src",
  fileName: "mobigent.ts",
  envFile: ".env.mobigent",
  configFile: "mobigent.app.json",
  connectionUrl: "ws://localhost:8787",
  authToken: "dev-token",
  force: false,
  dryRun: true
}).find((file) => file.path === "src/mobigent.ts")?.contents ?? "";

assert.match(backendFile, /startMobigent/);
assert.match(backendFile, /appId: "com\.example\.app"/);
assert.match(backendFile, /appName: "Example App"/);
assert.doesNotMatch(backendFile, /app: \{/);
assert.doesNotMatch(backendFile, /defaultApp/);
assert.doesNotMatch(backendFile, /export const mobigentConfig/);
assert.match(backendFile, /export const waitForApp = mobigent\.waitForApp/);
assert.match(backendFile, /export const callApp = mobigent\.callApp/);
assert.match(backendFile, /export const appFunction = mobigent\.appFunction/);
assert.match(backendFile, /export const feature = mobigent\.feature/);
assert.match(backendFile, /export const appFunctions = mobigent\.appFunctions/);
assert.doesNotMatch(backendFile, /BridgeGateway|createHttpApp|mobigent\.appConfigModule\(|copyAppConfig|Copy this/);

const backendWithAppDir = createMobigentBackendFiles({
  appId: "com.example.app",
  appName: "Example App",
  outDir: "src",
  fileName: "mobigent.ts",
  envFile: ".env.mobigent",
  configFile: "mobigent.app.json",
  appDir: "../mobile-app",
  connectionUrl: "ws://localhost:8787",
  authToken: "dev-token",
  force: false,
  dryRun: true
});
const backendWithAppDirFile = backendWithAppDir.find((file) => file.path === "src/mobigent.ts")?.contents ?? "";
assert.match(backendWithAppDirFile, /appDir: "\.\.\/mobile-app"/);
assert.match(backendWithAppDirFile, /mobigent\.appConfigPath/);
assert.match(backendWithAppDirFile, /appConfigModuleFile: "src\/mobigent-config\.ts"/);
assert.doesNotMatch(backendWithAppDirFile, /app: \{/);
assert.equal(
  backendWithAppDir.some((file) => file.path === "mobigent.app.json"),
  false,
  "backend helper should not write a root app config file by default"
);
assert.ok(
  backendWithAppDir.some((file) => file.path === "../mobile-app/src/mobigent-config.ts"),
  "backend appDir flow should write the React Native config module too"
);

const rnFiles = createReactNativeStarterFiles({
  appId: "com.example.app",
  appName: "Example App",
  feature: "expense",
  outDir: "src",
  dryRun: true,
  force: false,
  doctor: false,
  manifest: false,
  contract: false
});
const rnRoot = rnFiles.find((file) => file.path === "src/mobigent.tsx")?.contents ?? "";
const rnFeature = rnFiles.find((file) => file.path === "src/mobigent-functions/expense.ts")?.contents ?? "";
const starterCapabilities = createMobigentAppFiles({
  targetDir: "demo",
  appId: "com.example.app",
  appName: "Example App",
  gatewayPort: 8787,
  httpPort: 8788,
  appPort: 8790,
  openBrowser: false,
  force: false,
  dryRun: true,
  packageSource: "npm",
  packageVersion: "1.2.3"
}).find((file) => file.path === "src/capabilities.ts")?.contents ?? "";
const starterServer = createMobigentAppFiles({
  targetDir: "demo",
  appId: "com.example.app",
  appName: "Example App",
  gatewayPort: 8787,
  httpPort: 8788,
  appPort: 8790,
  openBrowser: false,
  force: false,
  dryRun: true,
  packageSource: "npm",
  packageVersion: "1.2.3"
}).find((file) => file.path === "src/server.ts")?.contents ?? "";

assert.match(rnRoot, /createApp/);
assert.match(rnRoot, /config: mobigentConfig/);
assert.match(rnRoot, /functions: \{ \.\.\.expenseFunctions \}/);
assert.doesNotMatch(rnRoot, /MobigentProvider|createAgentApp|createAgentModule/);
assert.doesNotMatch(rnRoot, /reconnect|heartbeat/);
assert.match(rnFeature, /export const expenseFunctions = \{/);
assert.match(rnFeature, /expense: \{/);
assert.match(rnFeature, /list: read\(/);
assert.match(rnFeature, /create: write\(/);
assert.doesNotMatch(rnFeature, /defineFeature|defineMobigentAction|createAgentModule|registerAction/);
assert.match(starterCapabilities, /emitMobigentEvent/);
assert.match(starterCapabilities, /export const expenseFunctions = \{/);
assert.match(starterCapabilities, /create: write\(/);
assert.doesNotMatch(starterCapabilities, /defineFeature|defineMobigent|import \{ defineFeature, mobigent \}/);
assert.match(starterServer, /createApp\(\{/);
assert.match(starterServer, /functions: expenseFunctions/);
assert.doesNotMatch(starterServer, /connectMobigent/);
assert.doesNotMatch(starterServer, /const gatewayPort|const httpPort|wsPort: 8787|httpPort: 8788/);
assert.match(starterServer, /startMobigent\(\{/);
assert.match(starterServer, /appId: "com\.example\.app"/);
assert.match(starterServer, /appName: "Example App"/);
assert.doesNotMatch(starterServer, /app: \{/);
assert.match(starterServer, /mobigent\.connect\(backend\)/);
assert.doesNotMatch(starterServer, /connectionUrl: backend\.urls\.websocket/);
assert.doesNotMatch(starterServer, /backend\.defaultApp/);
assert.match(starterServer, /const expense = backend\.feature\("expense"\)/);
assert.match(starterServer, /expense\.create\(input\)/);
assert.doesNotMatch(starterServer, /backend\.appFunctions\(\{/);

for (const path of ["README.md", "docs/simple-integration.md", "docs/quickstart.md"]) {
  const contents = readFileSync(path, "utf8");
  assert.match(contents, /createApp/, `${path} should teach the app package createApp path`);
  assert.doesNotMatch(
    contents,
    /npm install @mobigent\/app[\s\S]{0,600}?npx mobigent-init/,
    `${path} should not make mobigent-init part of the app install path`
  );
  assert.doesNotMatch(
    contents,
    /npm install @mobigent\/backend\s+```[\s\S]{0,120}?```[\s\S]{0,80}?npx mobigent-backend --app-dir/,
    `${path} should not make mobigent-backend the required backend setup path`
  );
  assert.doesNotMatch(
    contents,
    /npm install @mobigent\/backend[\s\S]{0,900}?startMobigent\(\{[\s\S]{0,120}?appDir:/,
    `${path} should not make startMobigent({ appDir }) the required backend setup path`
  );
}

console.log("Mobigent simple DX guardrails passed.");
