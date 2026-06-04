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
const appPackageRoot = readFileSync("packages/app/src/index.ts", "utf8");

assert.deepEqual(
  Object.keys(starterPackage.dependencies).filter((name) => name.startsWith("@mobigent/")).sort(),
  ["@mobigent/app", "@mobigent/backend"],
  "npm starter should expose only the app and backend SDK packages"
);
assert.equal(starterPackage.overrides, undefined, "npm starter should not need internal Mobigent package overrides");
assert.equal(starterPackage.scripts["agent:local"], "mobigent-backend agent claude --format guide");
assert.doesNotMatch(JSON.stringify(starterPackage.scripts), /mobigent-provider|@mobigent\/providers/);
assert.doesNotMatch(
  appPackageRoot,
  /export \* from "@mobigent\/react-native"/,
  "@mobigent/app root should stay a curated app SDK surface, not a full advanced React Native re-export"
);
assert.doesNotMatch(
  appPackageRoot,
  /AgentBridge|BridgeGateway|createMobigentGatewayUrl|createAgentModule|defineAgentAction|MobigentProvider/,
  "@mobigent/app root should not expose bridge/gateway/provider internals in the normal import path"
);
assert.match(appPackageRoot, /createApp/);
assert.match(appPackageRoot, /read/);
assert.match(appPackageRoot, /write/);
assert.match(appPackageRoot, /fromZod/);

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
assert.match(backendFile, /startMobigent\("com\.example\.app", "Example App", \{/);
assert.doesNotMatch(backendFile, /appId: "com\.example\.app"/);
assert.doesNotMatch(backendFile, /appName: "Example App"/);
assert.doesNotMatch(backendFile, /app: \{/);
assert.doesNotMatch(backendFile, /defaultApp/);
assert.doesNotMatch(backendFile, /export const mobigentConfig/);
assert.match(backendFile, /export const waitForApp = mobigent\.waitForApp/);
assert.match(backendFile, /export const app = mobigent\.app/);
assert.match(backendFile, /export const call = mobigent\.call/);
assert.match(backendFile, /export const listFunctions = mobigent\.listFunctions/);
assert.match(backendFile, /export const functions = mobigent\.functions/);
assert.match(backendFile, /export const fn = mobigent\.fn/);
assert.match(backendFile, /export const feature = mobigent\.feature/);
assert.match(backendFile, /mobigent\.inspectorUrl/);
assert.match(backendFile, /mobigent\.openApiUrl/);
assert.doesNotMatch(backendFile, /callApp|appFunction|appFunctions|mobigent\.appFunction|mobigent\.urls|BridgeGateway|createHttpApp|mobigent\.appConfigModule\(|copyAppConfig|Copy this/);

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
const starterDoctor = createMobigentAppFiles({
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
}).find((file) => file.path === "src/doctor.ts")?.contents ?? "";

assert.match(rnRoot, /createApp/);
assert.match(rnRoot, /createApp\("com\.example\.app", \{ \.\.\.expenseFunctions \}, \{/);
assert.match(rnRoot, /appName: "Example App"/);
assert.doesNotMatch(rnRoot, /config: mobigentConfig/);
assert.doesNotMatch(rnRoot, /defineMobigentConfig|mobigent-config/);
assert.doesNotMatch(rnRoot, /MobigentProvider|createAgentApp|createAgentModule/);
assert.doesNotMatch(rnRoot, /reconnect|heartbeat/);
assert.equal(
  rnFiles.some((file) => file.path === "src/mobigent-config.ts"),
  false,
  "React Native sample helper should not create app config as the default path"
);
assert.match(rnFeature, /export const expenseFunctions = \{/);
assert.match(rnFeature, /expense: \{/);
assert.match(rnFeature, /list: read\(/);
assert.match(rnFeature, /create: write\(/);
assert.doesNotMatch(rnFeature, /defineFeature|defineMobigentAction|createAgentModule|registerAction/);
assert.match(starterCapabilities, /emitMobigentEvent/);
assert.match(starterCapabilities, /export const expenseFunctions = \{/);
assert.match(starterCapabilities, /list: async \(\) => \(\{ expenses \}\)/);
assert.match(starterCapabilities, /create: write\(/);
assert.doesNotMatch(starterCapabilities, /list: read\(/);
assert.doesNotMatch(starterCapabilities, /defineFeature|defineMobigent|import \{ defineFeature, mobigent \}/);
assert.match(starterServer, /createApp\("com\.example\.app", expenseFunctions/);
assert.doesNotMatch(starterServer, /functions: expenseFunctions/);
assert.doesNotMatch(starterServer, /connectMobigent/);
assert.doesNotMatch(starterServer, /const gatewayPort|const httpPort|wsPort: 8787|httpPort: 8788/);
assert.match(starterServer, /startMobigent\("com\.example\.app", "Example App"\)/);
assert.doesNotMatch(starterServer, /appId: "com\.example\.app"/);
assert.doesNotMatch(starterServer, /app: \{/);
assert.match(starterServer, /mobigent\.connect\(backend\)/);
assert.doesNotMatch(starterServer, /connectionUrl: backend\.urls\.websocket/);
assert.doesNotMatch(starterServer, /backend\.defaultApp/);
assert.doesNotMatch(starterServer, /const expense = backend\.feature\("expense"\)/);
assert.match(starterServer, /backend\.app\.expense\.create\(input\)/);
assert.doesNotMatch(starterServer, /backend\.functions\.expense\.create\(input\)/);
assert.doesNotMatch(starterServer, /backend\.appFunctions\(\{/);
assert.match(starterServer, /backend\.inspectorUrl/);
assert.doesNotMatch(starterServer, /backend\.urls/);
assert.match(starterDoctor, /ready\?minApps=1&minFunctions=1/);
assert.match(starterDoctor, /const backendUrl = "http:\/\/localhost:8788"/);
assert.doesNotMatch(starterDoctor, /const gatewayUrl|function toolName|app manifest\(s\)|minTools/);

for (const path of ["README.md", "docs/simple-integration.md", "docs/quickstart.md", "docs/react-native.md"]) {
  const contents = readFileSync(path, "utf8");
  assert.match(contents, /createApp/, `${path} should teach the app package createApp path`);
  assert.match(contents, /createApp\("com\.acme\.expenses"|createApp\(appId, functions/, `${path} should teach the short app identity path`);
  assert.match(
    contents,
    /createApp\(\{\s+expense:/,
    `${path} should teach direct function-map mode for local demos`
  );
  assert.match(contents, /mobigent\.app\.expense\.create|backend\.app\.expense\.create/, `${path} should teach the clean backend app function path`);
  assert.match(
    contents,
    /mobigent\.functions\(\{\s+createExpense: "expense\.create"/,
    `${path} should teach backend-friendly function aliases`
  );
  assert.match(contents, /startMobigent\("com\.acme\.expenses", "Acme Expenses"\)/, `${path} should teach the short backend start path`);
  assert.doesNotMatch(
    contents,
    /npm install @mobigent\/app[\s\S]{0,600}?npx mobigent-init/,
    `${path} should not make mobigent-init part of the app install path`
  );
  assert.doesNotMatch(contents, /npx mobigent-init/, `${path} should not teach the legacy app init binary`);
  assert.match(
    contents,
    /mobigent-install app/,
    `${path} should hide preview app tarball details behind mobigent-install`
  );
  assert.match(
    contents,
    /mobigent-install backend/,
    `${path} should hide preview backend tarball details behind mobigent-install`
  );
  assert.doesNotMatch(
    contents,
    /mobigent-core-0\.1\.15\.tgz/,
    `${path} should not expose internal package tarballs in beginner docs`
  );
  assert.doesNotMatch(
    contents,
    /package-source github-release/,
    `${path} should not expose package-source flags in the public starter path`
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
  assert.doesNotMatch(
    contents,
    /backend\.defaultApp|connectionUrl: backend|mobigent\.app\.json|appDir\b|npx mobigent-backend|mobigent-backend --app/,
    `${path} should not teach generated config, backend.defaultApp, or init scaffolds as the beginner path`
  );
  assert.doesNotMatch(
    contents,
    /startMobigent\(\{[\s\S]{0,160}?appId: "com\.acme\.expenses"/,
    `${path} should teach startMobigent(appId, appName) before object options`
  );
}

for (const path of ["packages/app/README.md", "packages/react-native/README.md"]) {
  const contents = readFileSync(path, "utf8");
  assert.match(contents, /createApp\("com\.acme\.expenses"/, `${path} should teach createApp(appId, functions) first`);
  assert.match(
    contents,
    /No app-side init command is required|normal path does not require generated files/,
    `${path} should make setup commands unnecessary`
  );
  assert.doesNotMatch(contents, /npx mobigent-init|mobigent\.app\.json|appDir\b/, `${path} should not teach app init or generated app config`);
  assert.doesNotMatch(
    contents,
    /New apps should start with `defineFeature\(\)`|defineFeature\(\)[\s\S]{0,500}?withMobigent/,
    `${path} should not make defineFeature the first integration model`
  );
}

{
  const backendReadme = readFileSync("packages/backend/README.md", "utf8");
  assert.match(backendReadme, /startMobigent\("com\.acme\.expenses", "Acme Expenses"\)/);
  assert.match(backendReadme, /mobigent\.app\.expense\.create/);
  assert.match(backendReadme, /mobigent\.functions\(\{\s+createExpense: "expense\.create"/);
  assert.doesNotMatch(
    backendReadme,
    /backend\.defaultApp|mobigent\.app\.json|appDir\b|npx mobigent-backend|mobigent-backend --app/,
    "packages/backend/README.md should keep the package path as install plus code"
  );
}

for (const path of [
  "apps/docs/docs/simple-integration.md",
  "apps/docs/docs/quickstart.md",
  "apps/docs/docs/react-native.md",
  "apps/docs/docs/api.md",
  "apps/docs/src/docs.tsx",
  "apps/docs/src/main.tsx"
]) {
  const contents = readFileSync(path, "utf8");
  assert.match(contents, /createApp/, `${path} should teach createApp as the app-side entrypoint`);
  assert.match(contents, /createApp\("com\.acme\.expenses"|createApp\(appId, functions/, `${path} should teach the short app identity path`);
  assert.match(contents, /startMobigent/, `${path} should teach startMobigent as the backend entrypoint`);
  assert.match(
    contents,
    /startMobigent\("com\.acme\.expenses", "Acme Expenses"\)|startMobigent\(appId, appName\)/,
    `${path} should teach startMobigent(appId, appName) as the short backend path`
  );
  assert.doesNotMatch(contents, /startMobigent\(appId\)/, `${path} should not teach startMobigent(appId)`);
  assert.doesNotMatch(
    contents,
    /mobigent-core-0\.1\.15\.tgz/,
    `${path} should not expose internal package tarballs in beginner docs`
  );
  assert.match(contents, /mobigent\.app\.expense\.create|backend\.app\.expense\.create/, `${path} should teach the clean backend app function path`);
  assert.doesNotMatch(
    contents,
    /backend\.defaultApp|connectionUrl: backend|mobigent\.app\.json|appDir\b|npx mobigent-backend|mobigent-backend --app/,
    `${path} should not teach generated config, backend.defaultApp, or init scaffolds as the beginner path`
  );
  assert.doesNotMatch(
    contents,
    /defineFeature[\s\S]{0,500}?withMobigent|withMobigent[\s\S]{0,500}?defineFeature/,
    `${path} should not present defineFeature + withMobigent as the beginner integration`
  );
}

const cliReadme = readFileSync("packages/cli/README.md", "utf8");
assert.match(cliReadme, /startMobigent\(appId, appName\)/);
assert.doesNotMatch(cliReadme, /startMobigent\(appId\)/);

for (const path of ["docs/ios.md", "docs/android.md", "packages/ios/README.md", "packages/android/README.md"]) {
  const contents = readFileSync(path, "utf8");
  assert.match(contents, /@mobigent\/backend/, `${path} should anchor native SDKs to the backend package`);
  assert.doesNotMatch(
    contents,
    /through the Mobigent gateway/,
    `${path} should not introduce native SDKs as gateway-first`
  );
}

const iosGuide = readFileSync("docs/ios.md", "utf8");
assert.match(iosGuide, /MobigentClient\(\s*[\s\S]{0,120}?appId: "com\.example\.expenses"[\s\S]{0,120}?appName: "Expenses"[\s\S]{0,80}?\)/);
assert.doesNotMatch(
  iosGuide.slice(iosGuide.indexOf("## Create A Client"), iosGuide.indexOf("That default connects")),
  /gatewayURL:/,
  "docs/ios.md should not require gatewayURL in the first client snippet"
);

const androidGuide = readFileSync("docs/android.md", "utf8");
assert.match(androidGuide, /MobigentClient\.Builder\(context\)[\s\S]{0,160}?\.appId\("com\.example\.expenses"\)[\s\S]{0,80}?\.appName\("Expenses"\)[\s\S]{0,80}?\.build\(\)/);
assert.doesNotMatch(
  androidGuide.slice(androidGuide.indexOf("## Create A Client"), androidGuide.indexOf("That default connects")),
  /\.gatewayUrl\(/,
  "docs/android.md should not require gatewayUrl in the first client snippet"
);

const quickstart = readFileSync("docs/quickstart.md", "utf8");
assert.match(quickstart, /connection: \{ host: "192\.168\.1\.20" \}/);
assert.match(quickstart, /connection: "wss:\/\/your-backend\.example\.com"/);
assert.doesNotMatch(
  quickstart,
  /set the app connection URL in `mobigent\.app\.json`/,
  "device setup should use createApp(appId, functions, { connection }) instead of generated config"
);

console.log("Mobigent simple DX guardrails passed.");
