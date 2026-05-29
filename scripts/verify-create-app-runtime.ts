import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCreateMobigentAppCli } from "../packages/create-app/src/cli.js";

const dir = await mkdtemp(join(tmpdir(), "mobigent-create-app-runtime-"));
const target = join(dir, "runtime-demo");
const gatewayPort = 19877;
const httpPort = 19878;
const appPort = 19879;
let server: ChildProcessWithoutNullStreams | undefined;

function runCli(args: string[]) {
  let stdout = "";
  let stderr = "";
  const code = runCreateMobigentAppCli(
    args,
    { write: (chunk: string) => (stdout += chunk) } as NodeJS.WritableStream,
    { write: (chunk: string) => (stderr += chunk) } as NodeJS.WritableStream
  );

  return { code, stdout, stderr };
}

try {
  const init = runCli([
    target,
    "--app-id",
    "com.mobigent.runtime",
    "--app-name",
    "Runtime Demo",
    "--gateway-port",
    String(gatewayPort),
    "--http-port",
    String(httpPort),
    "--app-port",
    String(appPort),
    "--no-open",
    "--local-packages",
    process.cwd(),
    "--install"
  ]);
  assert.equal(init.code, 0, init.stderr);
  assert.match(init.stdout, /Installing dependencies/);

  server = spawn(join(target, "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx"), ["src/server.ts"], {
    cwd: target,
    env: {
      ...process.env,
      MOBIGENT_DEMO_OPEN: "0"
    },
    stdio: "pipe"
  });

  let serverOutput = "";
  server.stdout.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });

  await waitFor(async () => {
    const response = await fetch(`http://localhost:${httpPort}/tools`);
    if (!response.ok) {
      return false;
    }
    const body = (await response.json()) as { tools?: Array<{ name: string }> };
    return Boolean(body.tools?.some((tool) => tool.name === "com_mobigent_runtime.expense_create"));
  }, () => `starter did not expose tools in time.\n${serverOutput}`);

  const doctor = await run("npm", ["run", "doctor"], target);
  assert.match(doctor, /Mobigent starter doctor: PASS/);
  assert.match(doctor, /PASS Backend readiness: ready for agent startup/);
  assert.match(doctor, /PASS Expense tool: com_mobigent_runtime.expense_create/);

  const localAgent = await run("npm", ["run", "agent:local"], target);
  assert.match(localAgent, /Claude Desktop/);
  assert.match(localAgent, /mobigent-mcp/);

  const runResponse = await fetch(`http://localhost:${appPort}/agent/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      prompt: "Create a $33.20 travel expense at Runtime Cafe with notes: runtime smoke"
    })
  });
  if (!runResponse.ok) {
    assert.fail(await runResponse.text());
  }
  const runBody = (await runResponse.json()) as {
    response?: {
      merchant?: string;
      amount?: number;
    };
  };
  assert.equal(runBody.response?.merchant, "Runtime Cafe");
  assert.equal(runBody.response?.amount, 33.2);

  const stateResponse = await fetch(`http://localhost:${appPort}/state`);
  assert.equal(stateResponse.ok, true);
  const state = (await stateResponse.json()) as {
    expenses?: Array<{
      merchant?: string;
      amount?: number;
      notes?: string;
    }>;
  };
  assert.equal(state.expenses?.[0]?.merchant, "Runtime Cafe");
  assert.equal(state.expenses?.[0]?.amount, 33.2);
  assert.equal(state.expenses?.[0]?.notes, "runtime smoke");

  const metricsResponse = await fetch(`http://localhost:${httpPort}/metrics`);
  assert.equal(metricsResponse.ok, true);
  const metrics = (await metricsResponse.json()) as {
    metrics?: {
      toolCalls?: {
        succeeded?: number;
      };
    };
  };
  assert.equal(metrics.metrics?.toolCalls?.succeeded, 1);

  console.log("create-mobigent-app runtime smoke check passed.");
} finally {
  if (server) {
    await stop(server);
  }
  await rm(dir, { force: true, recursive: true });
}

function run(command: string, args: string[], cwd: string) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "pipe" });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve(output);
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with code ${code}\n${output}`));
    });
  });
}

async function waitFor(check: () => Promise<boolean>, message: () => string, timeoutMs = 30000) {
  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      if (await check()) {
        return;
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`${message()}${lastError ? `\nLast error: ${String(lastError)}` : ""}`);
}

function stop(child: ChildProcessWithoutNullStreams) {
  return new Promise<void>((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }

    const killTimer = setTimeout(() => {
      child.kill("SIGKILL");
    }, 3000);

    child.once("close", () => {
      clearTimeout(killTimer);
      resolve();
    });
    child.kill("SIGTERM");
  });
}
