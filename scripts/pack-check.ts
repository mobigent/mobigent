import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";

type PackEntry = {
  id: string;
  name: string;
  version: string;
  filename: string;
  files: Array<{ path: string; mode: number }>;
};

type PackageExpectation = {
  path: string;
  requiredFiles: string[];
  requiredBins?: string[];
};

const packages: PackageExpectation[] = [
  {
    path: "packages/core",
    requiredFiles: ["README.md", "package.json", "dist/index.js", "dist/index.d.ts"]
  },
  {
    path: "packages/gateway",
    requiredFiles: ["README.md", "package.json", "dist/index.js", "dist/server.js", "dist/http-server.js", "dist/mcp-server.js"],
    requiredBins: ["dist/server.js", "dist/http-server.js", "dist/mcp-server.js"]
  },
  {
    path: "packages/backend",
    requiredFiles: ["README.md", "package.json", "dist/index.js", "dist/index.d.ts", "dist/cli.js", "dist/cli.d.ts", "dist/mcp.js", "dist/mcp.d.ts"],
    requiredBins: ["dist/cli.js", "dist/mcp.js"]
  },
  {
    path: "packages/providers",
    requiredFiles: ["README.md", "package.json", "dist/index.js", "dist/index.d.ts", "dist/cli.js", "dist/cli.d.ts"],
    requiredBins: ["dist/cli.js"]
  },
  {
    path: "packages/react-native",
    requiredFiles: ["README.md", "package.json", "dist/index.js", "dist/index.d.ts", "dist/cli.js", "dist/cli.d.ts", "dist/expo.js", "dist/expo.d.ts", "dist/simple.js", "dist/simple.d.ts", "dist/ui.js", "dist/ui.d.ts"],
    requiredBins: ["dist/cli.js"]
  },
  {
    path: "packages/create-app",
    requiredFiles: ["README.md", "package.json", "dist/index.js", "dist/index.d.ts", "dist/cli.js", "dist/cli.d.ts"],
    requiredBins: ["dist/cli.js"]
  },
  {
    path: "packages/cli",
    requiredFiles: ["README.md", "package.json", "dist/index.js", "dist/index.d.ts", "dist/cli.js", "dist/cli.d.ts"],
    requiredBins: ["dist/cli.js"]
  }
];

for (const pkg of packages) {
  const cwd = join(process.cwd(), pkg.path);
  const outDir = await mkdtemp(join(tmpdir(), "mobigent-pack-"));

  try {
    const output = await run("npm", ["pack", "--dry-run", "--json", "--pack-destination", outDir], cwd);
    const [entry] = JSON.parse(output) as PackEntry[];
    assertPackEntry(pkg, entry);
    console.log(`Mobigent pack check passed for ${entry.name}@${entry.version} (${entry.files.length} files)`);
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
}

function run(command: string, args: string[], cwd: string) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "pipe"
    });

    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim());
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed in ${cwd}\n${output}`));
    });
  });
}

function assertPackEntry(expectation: PackageExpectation, entry: PackEntry | undefined) {
  assert.ok(entry, `${expectation.path} did not produce npm pack metadata.`);
  assert.equal(typeof entry.name, "string", `${expectation.path} pack metadata is missing name.`);
  assert.equal(typeof entry.version, "string", `${expectation.path} pack metadata is missing version.`);
  assert.match(entry.filename, /\.tgz$/, `${entry.name} pack filename should be a tarball.`);

  const files = new Map(entry.files.map((file) => [file.path, file]));
  for (const file of expectation.requiredFiles) {
    assert.ok(files.has(file), `${entry.name} package is missing ${file}.`);
  }

  for (const bin of expectation.requiredBins ?? []) {
    assert.equal(files.get(bin)?.mode, 493, `${entry.name} bin ${bin} must be executable in the package.`);
  }

  for (const file of files.keys()) {
    assert.equal(file.startsWith("src/"), false, `${entry.name} package should not include source file ${file}.`);
    assert.equal(file.startsWith("tests/"), false, `${entry.name} package should not include test file ${file}.`);
    assert.equal(file.includes(".tsbuildinfo"), false, `${entry.name} package should not include ${file}.`);
  }
}
