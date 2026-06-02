#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import { runMobigentBackendCli } from "@mobigent/backend/cli";
import { runCreateMobigentAppCli } from "create-mobigent-app/cli";
import { runReactNativeInitCli } from "@mobigent/react-native/cli";

export function runMobigentCli(
  argv = process.argv.slice(2),
  output = process.stdout,
  errorOutput = process.stderr
) {
  const [command, ...rest] = argv;

  if (!command || command === "--help" || command === "-h" || command === "help") {
    output.write(helpText());
    return 0;
  }

  switch (command) {
    case "new":
    case "create":
      return runCreateMobigentAppCli(rest, output, errorOutput);
    case "backend":
    case "server":
      return runMobigentBackendCli(rest, output, errorOutput, "mobigent-backend");
    case "agent":
      return runMobigentBackendCli(["agent", ...rest], output, errorOutput, "mobigent-backend");
    case "app":
      return runReactNativeInitCli(rest, output, errorOutput, "mobigent");
    case "init":
    case "doctor":
    case "security-doctor":
    case "manifest":
    case "contract":
    case "env":
    case "env-template":
      return runReactNativeInitCli([command, ...rest], output, errorOutput, "mobigent");
    default:
      errorOutput.write(`Unknown mobigent command ${command}\n\n${helpText()}`);
      return 1;
  }
}

function helpText() {
  return `mobigent

One command for the common Mobigent workflow.

Usage:
  mobigent new my-demo --install
  mobigent agent chatgpt --base-url https://your-backend.example

Commands:
  new, create          Create a runnable starter app.
  init                Optionally scaffold React Native app integration files.
  app                 Run optional React Native app integration commands.
  doctor              Check React Native integration files.
  security-doctor     Check transport and confirmation defaults.
  manifest            Print a React Native integration manifest.
  contract            Print a capability contract.
  env                 Print a React Native environment template.
  backend, server     Optionally scaffold a backend entrypoint.
  agent               Print setup for ChatGPT, Claude, OpenAI, or OpenAPI agents.

Examples:
  npm install @mobigent/app
  # Create app functions, then createApp({ functions }).with(App).
  # Optional scaffold: npx mobigent init --feature expense --out-dir src

  npm install @mobigent/backend
  # Start Mobigent in server code with startMobigent({ appDir: "../mobile-app" }).
  # Optional scaffold: npx mobigent backend --app-dir ../mobile-app

  npx mobigent new my-demo --install

Use command-specific help for details:
  mobigent init --help
  mobigent backend --help
  mobigent new --help
`;
}

function isMainModule() {
  return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
}

if (isMainModule()) {
  process.exitCode = runMobigentCli(process.argv.slice(2), process.stdout, process.stderr);
}
