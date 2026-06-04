import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

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

let missing = 0;

for (const group of packageGroups) {
  console.log(`${group.label}:`);

  for (const packageName of group.packages) {
    try {
      const { stdout } = await execFileAsync("npm", ["view", packageName, "version"], {
        encoding: "utf8"
      });
      console.log(`  published ${packageName}@${stdout.trim()}`);
    } catch (error) {
      missing += 1;
      const message = error instanceof Error ? error.message : String(error);
      const shortMessage = message.includes("E404") ? "not published" : message.split("\n")[0];
      console.log(`  missing   ${packageName} (${shortMessage})`);
    }
  }

  console.log("");
}

if (missing > 0) {
  console.log(`${missing} package(s) are not available on npmjs.com yet.`);
  console.log("See docs/npm-publishing.md to enable token or Trusted Publishing releases.");
  process.exitCode = 1;
}
