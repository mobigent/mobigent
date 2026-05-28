import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chmod, mkdir, mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const dir = await mkdtemp(join(tmpdir(), "mobigent-bin-"));
const binDir = join(dir, "node_modules", ".bin");

try {
  await mkdir(binDir, { recursive: true });

  await linkBin("create-mobigent-app", "packages/create-app/dist/cli.js");
  await linkBin("mobigent-provider", "packages/providers/dist/cli.js");
  await linkBin("mobigent-init", "packages/react-native/dist/cli.js");

  const createApp = await run(join(binDir, "create-mobigent-app"), ["--help"]);
  assert.match(createApp, /create-mobigent-app/);

  const provider = await run(join(binDir, "mobigent-provider"), [
    "--provider",
    "claude-desktop",
    "--command",
    "mobigent-mcp",
    "--format",
    "guide"
  ]);
  assert.match(provider, /Claude Desktop/);
  assert.match(provider, /mobigent-mcp/);

  const rn = await run(join(binDir, "mobigent-init"), ["--help"]);
  assert.match(rn, /Mobigent React Native init/);

  console.log("Mobigent bin entrypoint smoke check passed.");
} finally {
  await rm(dir, { force: true, recursive: true });
}

async function linkBin(name: string, target: string) {
  const path = join(binDir, name);
  await symlink(resolve(target), path);
  await chmod(path, 0o755);
}

function run(command: string, args: string[]) {
  return new Promise<string>((resolveRun, reject) => {
    const child = spawn(command, args, { cwd: process.cwd(), stdio: "pipe" });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolveRun(output);
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with code ${code}\n${output}`));
    });
  });
}
