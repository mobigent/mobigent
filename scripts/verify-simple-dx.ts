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
const backendPackageRoot = readFileSync("packages/backend/src/index.ts", "utf8");
const mobigentPackageRoot = readFileSync("packages/cli/src/index.ts", "utf8");
const mobigentCliSource = readFileSync("packages/cli/src/cli.ts", "utf8");
const reactNativeCliSource = readFileSync("packages/react-native/src/cli.ts", "utf8");
const mobigentCliReadme = readFileSync("packages/cli/README.md", "utf8");
const appBackendTargetType = appPackageRoot.match(/export type MobigentBackendConnectionTarget = \{[\s\S]*?^};/m)?.[0] ?? "";
const backendPublicType = backendPackageRoot.match(/export type MobigentBackend = \{[\s\S]*?^};/m)?.[0] ?? "";
const packageJsons = new Map(
  [
    "packages/app/package.json",
    "packages/backend/package.json",
    "packages/react-native/package.json",
    "packages/create-app/package.json",
    "packages/cli/package.json"
  ].map((path) => [path, JSON.parse(readFileSync(path, "utf8")) as { description?: string }])
);

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
assert.doesNotMatch(
  appPackageRoot,
  /export \{[^}]*\b(connectMobigent|defineFeature|defineFunctions|defineMobigent|defineMobigentConfig|feature|functions|setupMobigent|simpleSchema)\b[^}]*\} from "@mobigent\/react-native\/app"/,
  "@mobigent/app root should keep lower-level builders on @mobigent/app/app"
);
assert.doesNotMatch(
  appPackageRoot,
  /export \{[^}]*\b(mobigent|setupMobigent)\b[^}]*\} from "@mobigent\/react-native"/,
  "@mobigent/app root should not expose the lower-level singleton"
);
assert.doesNotMatch(appPackageRoot, /export const setup\b/, "@mobigent/app root should not expose setup aliases");
assert.match(appPackageRoot, /createApp/);
assert.match(appPackageRoot, /export function withMobigent/);
assert.match(appPackageRoot, /read/);
assert.match(appPackageRoot, /write/);
assert.match(appPackageRoot, /fromZod/);
for (const typeName of [
  "AppFunctions",
  "AppFunctionMap",
  "AppOptions",
  "AppPairing",
  "BackendPairing",
  "Pairing",
  "AppConnection",
  "AppConnectionSettings",
  "BackendConnection",
  "MobigentAppBackendSource",
  "MobigentApp"
]) {
  assert.match(appPackageRoot, new RegExp(`export type ${typeName}\\b`), `@mobigent/app should expose friendly ${typeName} type`);
}
assert.match(backendPackageRoot, /connection: MobigentBackendClient/, "@mobigent/backend should expose a clean backend.connection pairing object");
assert.match(backendPackageRoot, /agentUrl: string/, "@mobigent/backend should expose a friendly agentUrl alias");
assert.match(backendPackageRoot, /appConnectionUrl: string/, "@mobigent/backend should expose a friendly appConnectionUrl alias");
assert.match(backendPackageRoot, /functions: MobigentBackendFunctions/, "@mobigent/backend should expose backend.functions as the plain function-calling surface");
assert.match(backendPackageRoot, /setup: MobigentBackendSetupAccessor/, "@mobigent/backend should expose grouped backend.setup helpers for agent setup");
assert.match(backendPackageRoot, /connect: MobigentBackendSetupAccessor/, "@mobigent/backend should expose backend.connect helpers for agent setup");
assert.match(backendPackageRoot, /forApp\(\): MobigentBackendClient/, "@mobigent/backend should expose backend.forApp() as the clean app handoff");
assert.match(backendPackageRoot, /appSettings\(\): MobigentBackendClient/, "@mobigent/backend should keep backend.appSettings() compatibility");
assert.match(backendPackageRoot, /appClient\(\): MobigentBackendClient/, "@mobigent/backend should keep backend.appClient() compatibility");
assert.match(backendPackageRoot, /pairing\(\): MobigentBackendClient/, "@mobigent/backend should keep backend.pairing() compatibility");
assert.match(backendPackageRoot, /chatgpt\(options\?: MobigentAgentOptions\): ProviderBundle/, "@mobigent/backend should expose backend.chatgpt() for common ChatGPT setup");
assert.match(backendPackageRoot, /claude\(options\?: MobigentAgentOptions\): ProviderBundle/, "@mobigent/backend should expose backend.claude() for common Claude setup");
assert.match(backendPackageRoot, /openai\(options\?: MobigentAgentOptions\): ProviderBundle/, "@mobigent/backend should expose backend.openai() for common OpenAI setup");
for (const typeName of [
  "Backend",
  "BackendOptions",
  "BackendStartOptions",
  "BackendPairing",
  "BackendConnection",
  "BackendStatus",
  "AppFunction",
  "AppFunctionInfo",
  "AppSession",
  "CallOptions",
  "CallResult"
]) {
  assert.match(backendPackageRoot, new RegExp(`export type ${typeName}\\b`), `@mobigent/backend should expose friendly ${typeName} type`);
}
assert.match(appPackageRoot, /backend\?: MobigentAppBackendSource/, "@mobigent/app should accept a backend object as the clean app handoff");
assert.match(appPackageRoot, /normalizeBackendBackedAppInput/, "@mobigent/app should infer app identity and connection from a backend object");
assert.match(appPackageRoot, /appId: options\.appId \?\? backendSettings\.appId/, "@mobigent/app should use backend.appId when app code does not repeat one");
assert.match(appBackendTargetType, /pairing\?: MobigentAppPairingSource/, "@mobigent/app should keep backend pairing compatibility");
assert.match(appPackageRoot, /MobigentSimpleAppConfig \| \(\(\) => MobigentSimpleAppConfig\)/, "@mobigent/app should accept a pairing object or backend.pairing method");
assert.match(appBackendTargetType, /connection\?: MobigentSimpleConnectionSettings/, "@mobigent/app should keep backend.connection compatibility");
assert.doesNotMatch(
  appBackendTargetType,
  /urls|defaultApp|gatewayUrl/,
  "@mobigent/app public backend target type should not advertise legacy backend internals"
);
assert.match(backendPublicType, /connection: MobigentBackendClient/, "@mobigent/backend public type should expose backend.connection");
assert.doesNotMatch(
  backendPublicType,
  /^\s*(gateway|httpServer|urls|defaultApp|appConfig|appConfigModule|appConfigCode|copyAppConfig|tools|resolveToolName|callApp|invoke|function|appFunction|appFeature|appFunctions)\b/m,
  "@mobigent/backend root type should keep bridge/tool compatibility fields out of top-level autocomplete"
);
assert.doesNotMatch(
  backendPublicType,
  /BridgeGateway|ToolCallOptions|GatewayAppSession|ReturnType<|listTools|callTool|getStatus/,
  "@mobigent/backend public type should use product-facing backend names instead of lower-level gateway types"
);
assert.match(mobigentPackageRoot, /startMobigent/, "mobigent package root should re-export backend SDK helpers for tiny demos");
assert.match(mobigentPackageRoot, /write/, "mobigent package root should re-export common function metadata helpers");
assert.doesNotMatch(mobigentPackageRoot, /createApp|withMobigent/, "mobigent package root should not pull React-facing app setup into backend-only imports");
assert.doesNotMatch(
  mobigentPackageRoot,
  /BridgeGateway|createHttpApp|connectMobigent|defineMobigentConfig/,
  "mobigent package root should stay a curated convenience surface, not a lower-level internals barrel"
);
assert.doesNotMatch(
  backendPackageRoot,
  /App WebSocket|Agent HTTP/,
  "@mobigent/backend startup logs should use app/backend product language instead of transport-first labels"
);
assert.match(
  mobigentCliSource,
  /mobigent app --help/,
  "root CLI help should point app users to the app command, not the legacy init alias"
);
assert.match(
  mobigentCliSource,
  /startMobigent\(\)/,
  "root CLI help should teach the no-config backend start shape"
);
assert.doesNotMatch(
  mobigentCliSource.slice(mobigentCliSource.indexOf("function helpText")),
  /startMobigent\("com\.acme\.expenses", "Acme Expenses"\)/,
  "root CLI help should not require appName in the normal backend path"
);
assert.doesNotMatch(
  mobigentCliSource.slice(mobigentCliSource.indexOf("function helpText")),
  /mobigent init --help|init\s+Optional alias/,
  "root CLI help should not advertise the legacy app init alias"
);
assert.match(
  reactNativeCliSource,
  /Normal app integration does not need this command/,
  "React Native helper help should lead with the no-generator app path"
);
assert.doesNotMatch(
  reactNativeCliSource.slice(reactNativeCliSource.indexOf("function helpText")),
  /mobigent init --feature|mobigent-rn-init --feature expense --out-dir src/,
  "React Native helper help should not teach the old init/out-dir command as a visible adoption step"
);
assert.doesNotMatch(
  mobigentCliReadme,
  /mobigent app --feature expense --out-dir src/,
  "CLI README should not teach generated app files as a normal adoption command"
);
assert.match(backendPackageRoot, /export type MobigentFunctionInfo/);
assert.match(backendPackageRoot, /export type MobigentBackendStatus/);
assert.match(backendPackageRoot, /export type MobigentAppSession/);
for (const [path, packageJson] of packageJsons) {
  assert.match(packageJson.description ?? "", /app functions|backend SDK|starter|CLI/i, `${path} should describe the simple SDK model`);
  if (path !== "packages/cli/package.json") {
    assert.doesNotMatch(
      packageJson.description ?? "",
      /gateway|manifest|capabilities|protocol|MCP|OpenAPI/i,
      `${path} should not lead npm users with protocol internals`
    );
  }
}

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
assert.match(backendFile, /startMobigent\("com\.example\.app", \{/);
assert.doesNotMatch(backendFile, /startMobigent\("com\.example\.app", "Example App"/);
assert.doesNotMatch(backendFile, /appId: "com\.example\.app"/);
assert.doesNotMatch(backendFile, /appName: "Example App"/);
assert.doesNotMatch(backendFile, /app: \{/);
assert.doesNotMatch(backendFile, /defaultApp/);
assert.doesNotMatch(backendFile, /export const mobigentConfig/);
assert.match(backendFile, /export const waitForApp = mobigent\.waitForApp/);
assert.match(backendFile, /export const app = mobigent\.use\(\)/);
assert.match(backendFile, /export const use = mobigent\.use/);
assert.match(backendFile, /export const call = mobigent\.call/);
assert.match(backendFile, /export const listFunctions = mobigent\.listFunctions/);
assert.match(backendFile, /export const fn = mobigent\.fn/);
assert.match(backendFile, /mobigent\.inspectorUrl/);
assert.match(backendFile, /mobigent\.openApiUrl/);
assert.doesNotMatch(
  backendFile,
  /export const functions|mobigent\.functions|mobigent\.app|callApp|appFunction|appFunctions|mobigent\.appFunction|mobigent\.urls|mobigent\.feature|BridgeGateway|createHttpApp|appConfigPath|appConfigModulePath|mobigent\.appConfigModule\(|copyAppConfig|Copy this/
);

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
assert.match(backendWithAppDirFile, /appConfigModuleFile: "src\/mobigent-config\.ts"/);
assert.doesNotMatch(backendWithAppDirFile, /app: \{/);
assert.doesNotMatch(backendWithAppDirFile, /appConfigPath|appConfigModulePath|mobigent\.feature/);
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
}).find((file) => file.path === "src/app-functions.ts")?.contents ?? "";
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
assert.match(starterCapabilities, /export type MyAppFunctions = typeof expenseFunctions/);
assert.match(starterCapabilities, /async \(input: \{ amount: number; merchant: string; category: string; notes\?: string \}\)/);
assert.match(starterCapabilities, /list: async \(\) => \(\{ expenses \}\)/);
assert.match(starterCapabilities, /create: write\(/);
assert.doesNotMatch(starterCapabilities, /list: read\(/);
assert.doesNotMatch(starterCapabilities, /defineFeature|defineMobigent|import \{ defineFeature, mobigent \}/);
assert.match(starterServer, /createApp\(expenseFunctions, \{/);
assert.doesNotMatch(starterServer, /createApp\("com\.example\.app", expenseFunctions/);
assert.match(starterServer, /from "\.\/app-functions\.js"/);
assert.doesNotMatch(starterServer, /capabilities\.js|src\/capabilities\.ts/);
assert.doesNotMatch(starterServer, /functions: expenseFunctions/);
assert.doesNotMatch(starterServer, /connectMobigent/);
assert.doesNotMatch(starterServer, /const gatewayPort|const httpPort|wsPort: 8787|httpPort: 8788/);
assert.match(starterServer, /startMobigent\(\)/);
assert.doesNotMatch(starterServer, /startMobigent\("com\.example\.app"/);
assert.doesNotMatch(starterServer, /startMobigent\([^)]*"Example App"/);
assert.doesNotMatch(starterServer, /appId: "com\.example\.app"/);
assert.doesNotMatch(starterServer, /createApp\("com\.example\.app", expenseFunctions/);
assert.doesNotMatch(starterServer, /appName: "Example App"/);
assert.match(starterServer, /createApp\(expenseFunctions, \{/);
assert.doesNotMatch(starterServer, /app: \{/);
assert.match(starterServer, /backend,\n/);
assert.doesNotMatch(starterServer, /backend: backend\.appSettings\(\)/);
assert.doesNotMatch(starterServer, /pairing: backend\.pairing\(\)/);
assert.match(starterServer, /mobigent\.connect\(\)/);
assert.doesNotMatch(starterServer, /mobigent\.connect\(backend\)/);
assert.doesNotMatch(starterServer, /connectionUrl: backend\.urls\.websocket/);
assert.doesNotMatch(starterServer, /backend\.defaultApp/);
assert.doesNotMatch(starterServer, /const expense = backend\.feature\("expense"\)/);
assert.match(starterServer, /backend\.use<MyAppFunctions>\(\)/);
assert.match(starterServer, /appApi\.expense\.create\(input\)/);
assert.doesNotMatch(starterServer, /backend\.functions\.expense\.create\(input\)/);
assert.doesNotMatch(starterServer, /backend\.app\.expense\.create\(input\)/);
assert.doesNotMatch(starterServer, /backend\.appFunctions\(\{/);
assert.match(starterServer, /backend\.inspectorUrl/);
assert.doesNotMatch(starterServer, /backend\.urls/);
assert.match(starterDoctor, /ready\?minApps=1&minFunctions=1/);
assert.match(starterDoctor, /app_mobigent_local\.expense_create/);
assert.match(starterDoctor, /const backendUrl = "http:\/\/localhost:8788"/);
assert.doesNotMatch(starterDoctor, /const gatewayUrl|function toolName|app manifest\(s\)|minTools/);

for (const path of ["README.md", "docs/simple-integration.md", "docs/quickstart.md", "docs/react-native.md"]) {
  const contents = readFileSync(path, "utf8");
  assert.match(contents, /createApp/, `${path} should teach the app package createApp path`);
  assert.match(contents, /createApp\(\{|createApp\(functions|createApp\(appFunctions/, `${path} should teach the no-config app path`);
  assert.match(
    contents,
    /createApp\(\{\s+expense:|createApp\(appFunctions\)/,
    `${path} should teach direct function-map mode for local demos`
  );
  assert.match(
    contents,
    /mobigent\.use<MyAppFunctions>\(\)|backend\.use<MyAppFunctions>\(\)|mobigent\.use&lt;MyAppFunctions&gt;\(\)/,
    `${path} should teach the typed backend function path as the clean path`
  );
  assert.match(
    contents,
    /withMobigent\(App, \{/,
    `${path} should teach the no-config existing-app wrapper path`
  );
  assert.match(
    contents,
    /mobigent\.use\("expense", \{\s+createExpense: "create"/,
    `${path} should teach namespace-first backend function aliases through the simple use() API`
  );
  assert.match(contents, /startMobigent\(\)/, `${path} should teach the no-config backend start path`);
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
    `${path} should keep app ids out of object-options beginner examples`
  );
  assert.match(
    contents,
    /MOBIGENT_APP|EXPO_PUBLIC_MOBIGENT_APP/,
    `${path} should teach short env config instead of threading app ids through code`
  );
}

for (const path of ["docs/existing-react-native-app.md", "apps/docs/docs/existing-react-native-app.md"]) {
  const contents = readFileSync(path, "utf8");
  assert.match(contents, /You do not need a generator/, `${path} should answer the old init-command confusion directly`);
  assert.match(contents, /mobigent-rn-init --feature-only/, `${path} should frame the React Native CLI as optional sample-module generation only`);
  assert.doesNotMatch(contents, /mobigent-init/, `${path} should not preserve the broad legacy init command name`);
  assert.match(contents, /npm install @mobigent\/app[\s\S]{0,120}?npm install @mobigent\/backend/, `${path} should lead with normal package installs`);
  assert.match(contents, /appFunctions[\s\S]{0,240}?createApp\(appFunctions\)|createApp\(\{/, `${path} should teach createApp(functions)`);
  assert.match(contents, /withMobigent\(App, \{/, `${path} should teach the one-file existing-app wrapper`);
  assert.match(contents, /startMobigent\(\)/, `${path} should teach the no-config backend start path`);
  assert.match(contents, /EXPO_PUBLIC_MOBIGENT_APP[\s\S]{0,240}?MOBIGENT_APP|MOBIGENT_APP[\s\S]{0,240}?EXPO_PUBLIC_MOBIGENT_APP/, `${path} should teach matching short env identity for production`);
  assert.match(contents, /mobigent\.use<MyAppFunctions>\(\)[\s\S]{0,160}?app\.expense\.create|mobigent\.functions\.expense\.create/, `${path} should teach backend calls through app-owned functions`);
  assert.match(contents, /Most apps do not need that on day one/, `${path} should keep backend-friendly aliases optional`);
  assert.match(contents, /What Developers Should Care About/, `${path} should separate developer-owned concerns from SDK-owned plumbing`);
  assert.match(contents, /What Mobigent Handles/, `${path} should make SDK-owned work explicit`);
  assert.doesNotMatch(contents, /defineMobigentConfig|mobigent\.app\.json|appDir\b|backend\.defaultApp|backend\.appSettings\(\)|backend\.pairing\(\)/, `${path} should not pull generated config or legacy backend handoff into existing-app adoption`);
}

for (const path of ["packages/app/README.md", "packages/react-native/README.md"]) {
  const contents = readFileSync(path, "utf8");
  assert.match(contents, /createApp\(appFunctions\)|createApp\(\{/, `${path} should teach createApp(functions) first`);
  assert.match(
    contents,
    /No app-side init command is required|normal path does not require generated files/,
    `${path} should make setup commands unnecessary`
  );
  assert.doesNotMatch(contents, /npx mobigent-init|mobigent\.app\.json|appDir\b/, `${path} should not teach app init or generated app config`);
  assert.match(contents, /EXPO_PUBLIC_MOBIGENT_APP|MOBIGENT_APP/, `${path} should mention env-configured production identity`);
  assert.doesNotMatch(
    contents,
    /New apps should start with `defineFeature\(\)`|defineFeature\(\)[\s\S]{0,500}?withMobigent/,
    `${path} should not make defineFeature the first integration model`
  );
}

{
  const appReadme = readFileSync("packages/app/README.md", "utf8");
  assert.match(appReadme, /type AppFunctions/, "packages/app/README.md should teach the friendly AppFunctions type");
  assert.match(appReadme, /MobigentApp/, "packages/app/README.md should list the friendly MobigentApp type");
  assert.match(appReadme, /MobigentAppBackendSource/, "packages/app/README.md should teach the friendly app backend handoff type");
  assert.match(appReadme, /backend\.forApp\(\)/, "packages/app/README.md should teach backend.forApp() as the explicit app handoff");
  assert.match(appReadme, /createApp\(appFunctions, \{[\s\S]{0,120}?backend/, "packages/app/README.md should teach passing backend settings without repeating the app id");
  assert.doesNotMatch(appReadme, /backend\.appSettings\(\)/, "packages/app/README.md should not teach appSettings as the beginner handoff");
  assert.doesNotMatch(appReadme, /backend\.pairing\(\)/, "packages/app/README.md should not teach pairing as the beginner settings name");
}

{
  const backendReadme = readFileSync("packages/backend/README.md", "utf8");
  assert.match(backendReadme, /type Backend/, "packages/backend/README.md should teach the friendly Backend type");
  assert.match(backendReadme, /BackendOptions/, "packages/backend/README.md should list the friendly BackendOptions type");
  assert.match(backendReadme, /BackendStartOptions/, "packages/backend/README.md should list the friendly BackendStartOptions type");
  assert.match(backendReadme, /backend\.forApp\(\)/, "packages/backend/README.md should teach backend.forApp() as the clean explicit app handoff");
  assert.match(backendReadme, /createApp\(appFunctions, \{[\s\S]{0,120}?backend/, "packages/backend/README.md should teach passing backend settings without repeating the app id");
  assert.match(backendReadme, /mobigent\.connect\.chatgpt\(/, "packages/backend/README.md should teach ChatGPT setup through connect helpers");
  assert.match(backendReadme, /mobigent\.connect\.claude\(/, "packages/backend/README.md should teach Claude setup through connect helpers");
  assert.match(backendReadme, /mobigent\.connect\.openai\(/, "packages/backend/README.md should teach OpenAI setup through connect helpers");
  assert.match(backendReadme, /remain available for compatibility/, "packages/backend/README.md should mention compatibility without leading with it");
  assert.doesNotMatch(backendReadme, /backend\.appSettings\(\)|backend\.pairing\(\)|BackendPairing/, "packages/backend/README.md should not promote older setup names");
  assert.doesNotMatch(backendReadme, /mobigent\.functions\.expense\.create/, "packages/backend/README.md should not show the dynamic backend call as a product example");
  assert.match(backendReadme, /startMobigent\(\)/);
  assert.match(backendReadme, /import type \{ MyAppFunctions \}/, "packages/backend/README.md should teach type-only app function sharing");
  assert.match(backendReadme, /mobigent\.use<MyAppFunctions>\(\)/, "packages/backend/README.md should teach typed backend calls without importing app runtime code");
  assert.doesNotMatch(backendReadme, /mobigent\.app\.expense\.create/, "packages/backend/README.md should not teach the older backend.app dynamic style");
  assert.match(backendReadme, /mobigent\.use\("expense", \{\s+createExpense: "create"/);
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
  assert.match(contents, /createApp\(\{|createApp\(functions|createApp\(appFunctions/, `${path} should teach the no-config app path`);
  assert.match(contents, /startMobigent/, `${path} should teach startMobigent as the backend entrypoint`);
  assert.match(
    contents,
    /startMobigent\(\)/,
    `${path} should teach startMobigent() as the local backend path`
  );
  assert.doesNotMatch(contents, /startMobigent\(appId, appName\)/, `${path} should not require an app name in the beginner path`);
  assert.doesNotMatch(
    contents,
    /mobigent-core-0\.1\.15\.tgz/,
    `${path} should not expose internal package tarballs in beginner docs`
  );
  assert.match(contents, /mobigent\.use<MyAppFunctions>\(\)|backend\.use<MyAppFunctions>\(\)|mobigent\.use&lt;MyAppFunctions&gt;\(\)/, `${path} should teach the type-only backend function path`);
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

for (const path of ["docs/api/README.md", "apps/docs/docs/api.md"]) {
  const contents = readFileSync(path, "utf8");
  assert.match(contents, /createApp\(functions, \{ backend \}\)|createApp\(expenseFunctions, \{[\s\S]{0,80}?backend/, `${path} should teach app setup with backend settings`);
  assert.match(contents, /\.\s*connect\(\)/, `${path} should teach no-argument connect after setup`);
  assert.match(contents, /MobigentAppBackendSource/, `${path} should teach the friendly backend handoff type`);
  assert.doesNotMatch(contents, /mobigent\.connect\(backend\)/, `${path} should not teach backend-object connect as the beginner path`);
  assert.doesNotMatch(contents, /mobigent\.connect\(backend\.pairing\(\)\)/, `${path} should not teach connect-time pairing as the beginner path`);
}

for (const path of [
  "README.md",
  "docs/quickstart.md",
  "docs/react-native.md",
  "docs/api/README.md",
  "packages/app/README.md",
  "packages/backend/README.md",
  "packages/react-native/README.md",
  "apps/docs/docs/quickstart.md",
  "apps/docs/docs/react-native.md",
  "apps/docs/docs/api.md"
]) {
  const contents = readFileSync(path, "utf8");
  assert.match(contents, /backend: backend|backend,|backend\s*\n\s*\}/, `${path} should teach app setup with the backend object`);
  assert.match(contents, /backend\.forApp\(\)|backend: backend|backend,|backend\s*\n\s*\}/, `${path} should teach either backend.forApp() or direct backend object setup`);
  assert.doesNotMatch(contents, /createApp\("com\.acme\.expenses", (appFunctions|expenseFunctions), \{[\s\S]{0,80}?backend/, `${path} should not repeat app id when a backend object can provide it`);
  assert.match(contents, /\.\s*connect\(\)/, `${path} should teach no-argument connect after backend setup`);
  assert.doesNotMatch(contents, /backend: backend\.appSettings\(\)/, `${path} should not teach appSettings as the beginner handoff`);
  assert.doesNotMatch(contents, /pairing: backend\.pairing\(\)/, `${path} should not teach pairing as the beginner setup word`);
  assert.doesNotMatch(contents, /mobigent\.connect\(backend\)/, `${path} should not teach backend-object connect as the beginner path`);
  assert.doesNotMatch(contents, /mobigent\.connect\(backend\.pairing\(\)\)/, `${path} should not teach connect-time pairing as the beginner path`);
}

for (const path of [
  "README.md",
  "docs/quickstart.md",
  "docs/react-native.md",
  "docs/api/README.md",
  "docs/simple-integration.md",
  "docs/existing-react-native-app.md",
  "packages/app/README.md",
  "packages/backend/README.md",
  "packages/react-native/README.md",
  "apps/docs/docs/quickstart.md",
  "apps/docs/docs/react-native.md",
  "apps/docs/docs/api.md",
  "apps/docs/docs/simple-integration.md",
  "apps/docs/docs/existing-react-native-app.md"
]) {
  const contents = readFileSync(path, "utf8");
  assert.doesNotMatch(contents, /mobigent\.functions|functions\.expense|mobigent\.app\.expense/, `${path} should keep old dynamic backend surfaces out of beginner docs`);
}

for (const path of [
  "README.md",
  "docs/quickstart.md",
  "docs/simple-integration.md",
  "docs/react-native.md",
  "packages/app/README.md",
  "packages/backend/README.md",
  "packages/cli/README.md",
  "packages/react-native/README.md",
  "apps/docs/docs/quickstart.md",
  "apps/docs/docs/simple-integration.md",
  "apps/docs/docs/react-native.md",
  "apps/docs/src/main.tsx"
]) {
  const contents = readFileSync(path, "utf8");
  const beginnerSlice = contents.slice(0, Math.min(contents.length, 3500));
  assert.doesNotMatch(
    beginnerSlice,
    /\b(protocol|manifest|registerAction|registerResource|registerComponent|mobigent-init|out-dir|appDir)\b/i,
    `${path} should keep first-run integration copy free of low-level protocol/init vocabulary`
  );
  assert.doesNotMatch(
    beginnerSlice,
    /\bbridge\b/i,
    `${path} should describe the beginner path as app functions and connections, not a bridge`
  );
}

for (const path of [
  "apps/docs/docs/simple-integration.md",
  "apps/docs/docs/quickstart.md",
  "apps/docs/docs/react-native.md",
  "apps/docs/docs/api.md",
  "apps/docs/src/docs.tsx"
]) {
  const contents = readFileSync(path, "utf8");
  assert.match(contents, /mobigent\.use<MyAppFunctions>\(\)|mobigent\.use&lt;MyAppFunctions&gt;\(\)|app\.expense\.create/, `${path} should teach the typed shared-shape backend functions surface`);
  assert.match(
    contents,
    /withMobigent\(App, \{/,
    `${path} should teach the no-config existing-app wrapper path`
  );
}

for (const path of ["docs/api/README.md", "apps/docs/docs/api.md"]) {
  const contents = readFileSync(path, "utf8");
  assert.doesNotMatch(contents, /## Capability Types/, `${path} should frame beginner docs as app functions`);
  assert.doesNotMatch(contents, /defineFeature|defineMobigentConfig|connectMobigent|registerFeatures/, `${path} should not teach lower-level app lifecycle helpers in the package API docs`);
  assert.doesNotMatch(contents, /appSettings|pairing\(|BackendPairing|AppPairing|Pairing\b/, `${path} should not promote older setup names in package API docs`);
  assert.doesNotMatch(contents, /feature\("expense"\)|functions\.expense\.create|mobigent\.functions/, `${path} should not show older dynamic backend API examples`);
  assert.doesNotMatch(
    contents,
    /@mobigent\/core|@mobigent\/gateway|@mobigent\/providers/,
    `${path} should not list internal packages as part of the public API surface`
  );
}

{
  const docsPage = readFileSync("apps/docs/src/docs.tsx", "utf8");
  assert.match(docsPage, /Existing app path/, "website docs should include a dedicated existing-app adoption section");
  assert.match(docsPage, /No generator\. No copied config/, "website docs should make generator-free adoption visible");
  assert.match(docsPage, /sample generator is only for runnable demos/, "website docs should frame generators as demo helpers");
  assert.match(docsPage, /client\.functions\("expense"\)/, "website native examples should teach grouped native app functions");
  assert.match(docsPage, /expense\.write\(|write\(\s*"create"/, "website native examples should teach native writes inside grouped functions");
  assert.match(docsPage, /expense\.read\(|read\(\s*"list"/, "website native examples should teach native reads inside grouped functions");
  assert.doesNotMatch(
    docsPage,
    /registerAction|registerResource|MobigentAction|MobigentResource/,
    "website native examples should not lead with lower-level registration types"
  );
  assert.doesNotMatch(
    docsPage,
    /Define app capability|Register capabilities|typed agent capabilities|App capabilities|same capability contract|mobile capabilities|declared capability/,
    "website docs should use app-function language in beginner-facing copy"
  );
  assert.doesNotMatch(
    docsPage,
    /@mobigent\/gateway|@mobigent\/core|@mobigent\/providers|GET \/tools|POST \/tools|gateway protocol|capability manifest|raw gateway|your-gateway|gateway\.example/,
    "website docs should not lead with internal packages, raw tool endpoints, or gateway-first language"
  );
  assert.match(
    docsPage,
    /const chatgpt = mobigent\.connect\.chatgpt\(/,
    "website docs should route common agent setup through friendly backend connect helpers"
  );
}

{
  const homePage = readFileSync("apps/docs/src/main.tsx", "utf8");
  const homeQuickstart = homePage.slice(homePage.indexOf("const quickstart"), homePage.indexOf("function App"));
  assert.doesNotMatch(
    homePage,
    /real app capability|app capabilities|capability layer/,
    "homepage should lead with app functions instead of abstract capability language"
  );
  assert.match(
    homeQuickstart,
    /npm install @mobigent\/app[\s\S]{0,80}?npm install @mobigent\/backend/,
    "homepage hero quickstart should lead with normal SDK installs"
  );
  assert.match(
    homeQuickstart,
    /withMobigent\(App, \{/,
    "homepage hero quickstart should show direct existing-app wrapping"
  );
  assert.match(
    homeQuickstart,
    /startMobigent\(\)/,
    "homepage hero quickstart should show the no-config backend start path"
  );
  assert.doesNotMatch(
    homeQuickstart,
    /create-mobigent-app|mobigent-init|npm exec/,
    "homepage hero quickstart should not look generator-first"
  );
}

const cliReadme = readFileSync("packages/cli/README.md", "utf8");
assert.match(cliReadme, /startMobigent\(\)/);
assert.match(cliReadme, /mobigent install app/);
assert.match(cliReadme, /mobigent install backend/);
assert.doesNotMatch(cliReadme, /startMobigent\(appId, appName\)/);
assert.doesNotMatch(cliReadme, /mobigent-core|mobigent-gateway|mobigent-providers/);

const previewInstaller = readFileSync("packages/create-app/src/install.ts", "utf8");
assert.match(previewInstaller, /Backend SDK for servers and agent setup/);
assert.doesNotMatch(previewInstaller, /agent gateway packages|package set/);

const npmPublishingGuide = readFileSync("docs/npm-publishing.md", "utf8");
assert.match(npmPublishingGuide, /## Package Story/);
assert.match(npmPublishingGuide, /Developers should think about these packages/);
assert.match(npmPublishingGuide, /runtime dependency packages used by the SDKs/);
assert.doesNotMatch(npmPublishingGuide, /## Packages To Publish|eight packages/);

for (const path of ["scripts/check-npm-status.ts", "scripts/check-npm-publish-readiness.ts"]) {
  const contents = readFileSync(path, "utf8");
  assert.match(contents, /developer-facing packages/, `${path} should report SDK packages separately`);
  assert.match(contents, /runtime dependency packages/, `${path} should frame internal packages as runtime dependencies`);
}

for (const path of ["docs/ios.md", "docs/android.md", "packages/ios/README.md", "packages/android/README.md"]) {
  const contents = readFileSync(path, "utf8");
  assert.match(contents, /@mobigent\/backend/, `${path} should anchor native SDKs to the backend package`);
  assert.match(contents, /client\.functions\("expense"\)/, `${path} should teach grouped native app functions`);
  assert.doesNotMatch(
    contents,
    /gateway|gatewayURL|gatewayUrl|Register Capabilities|registerAction|registerResource|hello|manifest|protocol/i,
    `${path} should keep native docs package-first instead of exposing bridge internals`
  );
}

const iosGuide = readFileSync("docs/ios.md", "utf8");
assert.match(iosGuide, /MobigentClient\(\s*[\s\S]{0,120}?appId: "com\.example\.expenses"[\s\S]{0,120}?appName: "Expenses"[\s\S]{0,80}?\)/);
assert.match(iosGuide, /backendURL: URL\(string: "ws:\/\/YOUR_MAC_LAN_IP:8787"\)!/);
assert.match(iosGuide, /expense\.read\(/);
assert.doesNotMatch(
  iosGuide.slice(iosGuide.indexOf("## Create A Client"), iosGuide.indexOf("That default connects")),
  /gatewayURL:/,
  "docs/ios.md should not require gatewayURL in the first client snippet"
);

const androidGuide = readFileSync("docs/android.md", "utf8");
assert.match(androidGuide, /MobigentClient\.Builder\(context\)[\s\S]{0,160}?\.appId\("com\.example\.expenses"\)[\s\S]{0,80}?\.appName\("Expenses"\)[\s\S]{0,80}?\.build\(\)/);
assert.match(androidGuide, /\.backendUrl\("ws:\/\/YOUR_MAC_LAN_IP:8787"\)/);
assert.match(androidGuide, /read\(\s*"list"/);
assert.doesNotMatch(
  androidGuide.slice(androidGuide.indexOf("## Create A Client"), androidGuide.indexOf("That default connects")),
  /\.gatewayUrl\(/,
  "docs/android.md should not require gatewayUrl in the first client snippet"
);

const quickstart = readFileSync("docs/quickstart.md", "utf8");
assert.ok(
  quickstart.indexOf("## 1. Add App Functions To An Existing App") < quickstart.indexOf("## 5. Optional Starter"),
  "docs/quickstart.md should teach real existing-app integration before starter scaffolding"
);
assert.match(quickstart, /EXPO_PUBLIC_MOBIGENT_URL=ws:\/\/192\.168\.1\.20:8787/);
assert.match(quickstart, /EXPO_PUBLIC_MOBIGENT_URL=wss:\/\/your-backend\.example\.com/);
assert.doesNotMatch(
  quickstart,
  /set the app connection URL in `mobigent\.app\.json`/,
  "device setup should use public env config instead of generated config"
);

const rootReadme = readFileSync("README.md", "utf8");
const packageSection = rootReadme.slice(rootReadme.indexOf("## Packages"), rootReadme.indexOf("## Examples"));
assert.match(packageSection, /@mobigent\/app[\s\S]{0,200}?@mobigent\/backend/, "README packages should lead with the two public SDK packages");
assert.doesNotMatch(
  packageSection,
  /@mobigent\/core|@mobigent\/gateway|@mobigent\/providers/,
  "README package section should not advertise internal packages as adoption steps"
);

console.log("Mobigent simple DX guardrails passed.");
