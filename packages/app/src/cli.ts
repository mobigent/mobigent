#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runReactNativeInitCli } from "@mobigent/react-native/cli";

export { runReactNativeInitCli };

function isMainModule() {
  return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
}

if (isMainModule()) {
  process.exitCode = runReactNativeInitCli(process.argv.slice(2), process.stdout, process.stderr, "mobigent-app-init");
}
