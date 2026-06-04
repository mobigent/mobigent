import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

type PackageJson = {
  name: string;
  version: string;
  private?: boolean;
  publishConfig?: {
    access?: string;
  };
  repository?: {
    url?: string;
  };
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  bin?: Record<string, string>;
  exports?: Record<string, unknown>;
};

const publicPackages = [
  { name: "@mobigent/core", path: "packages/core/package.json", internalDependencies: [] },
  { name: "@mobigent/providers", path: "packages/providers/package.json", internalDependencies: [] },
  { name: "@mobigent/gateway", path: "packages/gateway/package.json", internalDependencies: ["@mobigent/core", "@mobigent/providers"] },
  { name: "@mobigent/backend", path: "packages/backend/package.json", internalDependencies: ["@mobigent/core", "@mobigent/gateway", "@mobigent/providers"] },
  { name: "@mobigent/react-native", path: "packages/react-native/package.json", internalDependencies: ["@mobigent/core"] },
  { name: "@mobigent/app", path: "packages/app/package.json", internalDependencies: ["@mobigent/react-native"] },
  { name: "create-mobigent-app", path: "packages/create-app/package.json", internalDependencies: [] },
  { name: "mobigent", path: "packages/cli/package.json", internalDependencies: ["@mobigent/backend", "@mobigent/react-native", "create-mobigent-app"] }
];

const rootPackage = await readJson<PackageJson>("package.json");
const packageJsons = new Map<string, PackageJson>();

for (const item of publicPackages) {
  const packageJson = await readJson<PackageJson>(item.path);
  packageJsons.set(item.name, packageJson);

  assert.equal(packageJson.name, item.name, `${item.path} package name should be ${item.name}.`);
  assert.equal(packageJson.version, rootPackage.version, `${item.name} version should match root ${rootPackage.version}.`);
  assert.equal(
    packageJson.repository?.url,
    "https://github.com/mobigent/mobigent",
    `${item.name} repository.url must match the GitHub repository for npm trusted publishing.`
  );
  assert.equal(packageJson.private, undefined, `${item.name} must not be private.`);
  assert.equal(packageJson.publishConfig?.access, "public", `${item.name} must publish with public access.`);

  for (const dependency of item.internalDependencies) {
    assert.equal(
      packageJson.dependencies?.[dependency],
      rootPackage.version,
      `${item.name} must depend on ${dependency}@${rootPackage.version}.`
    );
  }

  for (const [dependency, spec] of Object.entries(packageJson.dependencies ?? {})) {
    assert.equal(spec.startsWith("workspace:"), false, `${item.name} must not publish workspace dependency ${dependency}.`);
    assert.equal(spec.startsWith("file:"), false, `${item.name} must not publish file dependency ${dependency}.`);
  }
}

assert.ok(packageJsons.get("@mobigent/backend")?.bin?.["mobigent-backend"], "@mobigent/backend must ship mobigent-backend bin.");
assert.ok(packageJsons.get("@mobigent/backend")?.bin?.["mobigent-mcp"], "@mobigent/backend must ship mobigent-mcp bin.");
assert.ok(packageJsons.get("@mobigent/react-native")?.bin?.["mobigent-init"], "@mobigent/react-native must ship mobigent-init bin.");
assert.equal(packageJsons.get("@mobigent/app")?.bin, undefined, "@mobigent/app should stay SDK-only and must not ship init bins.");
assert.equal(
  Boolean(packageJsons.get("@mobigent/app")?.exports?.["./cli"]),
  false,
  "@mobigent/app should stay SDK-only and must not export CLI internals."
);
assert.ok(packageJsons.get("create-mobigent-app")?.bin?.["create-mobigent-app"], "create-mobigent-app must ship create-mobigent-app bin.");
assert.ok(packageJsons.get("create-mobigent-app")?.bin?.["mobigent-install"], "create-mobigent-app must ship mobigent-install bin.");
assert.ok(packageJsons.get("mobigent")?.bin?.mobigent, "mobigent must ship the friendly mobigent bin.");

const releaseWorkflow = await readFile(".github/workflows/release.yml", "utf8");
const publishScript = await readFile("scripts/publish-npm.ts", "utf8");
assert.match(releaseWorkflow, /tags:\s*\n\s+- "v\*\.\*\.\*"/, "release workflow must run on SemVer tags.");
assert.doesNotMatch(
  releaseWorkflow,
  /workflow_dispatch:/,
  "release workflow must stay tag-only so manual branch runs cannot create or publish non-tag releases."
);
assert.match(releaseWorkflow, /id-token: write/, "release workflow must request OIDC id-token permission.");
assert.match(releaseWorkflow, /node-version: 24/, "release workflow must use Node 24 for npm trusted publishing.");
assert.match(
  releaseWorkflow,
  /npm install -g npm@\^11\.10\.0/,
  "release workflow must install an npm version with trusted publishing support."
);
assert.match(releaseWorkflow, /registry-url: https:\/\/registry\.npmjs\.org/, "release workflow must target npmjs.org.");
assert.match(releaseWorkflow, /Check npmjs publishing configuration/, "release workflow must check npm publishing configuration.");
assert.match(releaseWorkflow, /configured=false/, "release workflow must explicitly skip npm publishing when credentials are absent.");
assert.match(releaseWorkflow, /if: steps\.npm-config\.outputs\.configured == 'true'/, "npm publish steps must run only when npm credentials are configured.");
assert.match(releaseWorkflow, /npm run verify/, "release workflow must run full verification before publish.");
assert.match(releaseWorkflow, /npm run npm:publish-ready/, "release workflow must check npm publish readiness before publish.");
assert.match(releaseWorkflow, /npm run npm:publish/, "release workflow must publish npm packages.");
assert.match(releaseWorkflow, /npm run npm:status/, "release workflow must verify npm visibility after publish.");
assert.match(publishScript, /process\.env\.NODE_AUTH_TOKEN \|\| process\.env\.NPM_TOKEN/, "publish script must accept NODE_AUTH_TOKEN or NPM_TOKEN.");
assert.match(publishScript, /--userconfig/, "publish script must use an explicit npm userconfig for token publishing.");
assert.match(publishScript, /_authToken=\$\{token\}/, "publish script must write the token into a temporary npm config, not command args.");

console.log("Mobigent npm release preflight passed.");

async function readJson<T>(path: string) {
  return JSON.parse(await readFile(path, "utf8")) as T;
}
