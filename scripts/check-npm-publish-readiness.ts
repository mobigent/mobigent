import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type NpmView = {
  name?: string;
  version?: string;
  repository?: string | { type?: string; url?: string; directory?: string };
};

const packageGroups = [
  {
    label: "developer-facing packages",
    packages: ["@mobigent/app", "@mobigent/backend", "create-mobigent-app", "mobigent"]
  },
  {
    label: "runtime dependency packages",
    packages: ["@mobigent/core", "@mobigent/react-native", "@mobigent/providers", "@mobigent/gateway"]
  }
];

const expectedRepository = "https://github.com/mobigent/mobigent";
const hasToken = Boolean(process.env.NODE_AUTH_TOKEN || process.env.NPM_TOKEN);
const trustedPublishing = process.env.NPM_TRUSTED_PUBLISHING === "true";
const loggedInUser = await npmWhoami();
let failures = 0;
let missing = 0;

console.log("Mobigent npm publish readiness");
console.log(`registry: ${(await npmConfig("registry")) || "unknown"}`);
console.log(`auth: ${hasToken ? "token present" : loggedInUser ? `logged in as ${loggedInUser}` : "not logged in"}`);
console.log(`trusted publishing: ${trustedPublishing ? "enabled" : "disabled"}`);
console.log("");

if (!hasToken && !trustedPublishing && !loggedInUser) {
  failures += 1;
  console.log("fail auth: run npm login, set NODE_AUTH_TOKEN/NPM_TOKEN, or configure npm Trusted Publishing.");
}

for (const group of packageGroups) {
  console.log(`${group.label}:`);

  for (const packageName of group.packages) {
    const view = await npmView(packageName);

    if (!view) {
      missing += 1;
      console.log(`  empty ${packageName}: not published yet`);
      continue;
    }

    const repository = repositoryUrl(view.repository);
    if (!repository?.includes(expectedRepository)) {
      failures += 1;
      console.log(`  fail ${packageName}: repository is ${repository ?? "missing"}, expected ${expectedRepository}`);
      continue;
    }

    console.log(`  ok   ${packageName}@${view.version ?? "unknown"}: published with expected repository`);
  }

  console.log("");
}

if (trustedPublishing && missing > 0 && !hasToken && !loggedInUser) {
  failures += 1;
  console.log("");
  console.log("fail trusted publishing: npm requires the packages to exist before Trusted Publishing can publish them.");
  console.log("Use npm login or NPM_TOKEN for the first publish, then enable Trusted Publishing for future releases.");
}

if (missing > 0 && (hasToken || loggedInUser)) {
  console.log("");
  console.log(`${missing} package(s) are ready for first publish from this authenticated environment.`);
}

if (failures > 0) {
  process.exitCode = 1;
}

async function npmWhoami() {
  try {
    const { stdout } = await execFileAsync("npm", ["whoami"], { encoding: "utf8" });
    return stdout.trim();
  } catch {
    return "";
  }
}

async function npmConfig(key: string) {
  try {
    const { stdout } = await execFileAsync("npm", ["config", "get", key], { encoding: "utf8" });
    return stdout.trim();
  } catch {
    return "";
  }
}

async function npmView(packageName: string) {
  try {
    const { stdout } = await execFileAsync("npm", ["view", packageName, "--json"], { encoding: "utf8" });
    return JSON.parse(stdout) as NpmView;
  } catch {
    return undefined;
  }
}

function repositoryUrl(repository: NpmView["repository"]) {
  if (typeof repository === "string") {
    return repository;
  }
  return repository?.url;
}
