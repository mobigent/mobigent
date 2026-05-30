import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const packages = [
  "@mobigent/core",
  "@mobigent/gateway",
  "@mobigent/backend",
  "@mobigent/providers",
  "@mobigent/react-native",
  "create-mobigent-app",
  "mobigent"
];

let missing = 0;

for (const packageName of packages) {
  try {
    const { stdout } = await execFileAsync("npm", ["view", packageName, "version"], {
      encoding: "utf8"
    });
    console.log(`published ${packageName}@${stdout.trim()}`);
  } catch (error) {
    missing += 1;
    const message = error instanceof Error ? error.message : String(error);
    const shortMessage = message.includes("E404") ? "not published" : message.split("\n")[0];
    console.log(`missing   ${packageName} (${shortMessage})`);
  }
}

if (missing > 0) {
  console.log(`\n${missing} package(s) are not available on npmjs.com yet.`);
  console.log("See docs/npm-publishing.md to enable token or Trusted Publishing releases.");
  process.exitCode = 1;
}
