#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCapabilityManifest, type CapabilityManifest } from "@mobigent/core";
import { createMobigentGatewayUrl } from "./gatewayUrl.js";
import {
  createAndroidAppActionsPlan,
  createAppleAppIntentsPlan,
  renderAndroidAppActionsXml,
  renderAppleAppIntentsSwift
} from "./platformActions.js";

const defaultAppConfigFile = "mobigent.app.json";

export type ReactNativeInitCliOptions = {
  appId: string;
  appName: string;
  appVersion?: string;
  appConfig?: ReactNativeAppConfigFile;
  configPath?: string;
  backendDir?: string;
  feature: string;
  appRoot?: string;
  outDir: string;
  dryRun: boolean;
  force: boolean;
  doctor: boolean;
  securityDoctor?: boolean;
  manifest: boolean;
  contract: boolean;
  platformActions?: "json" | "ios-swift" | "android-xml";
  featureOnly?: boolean;
  customConfirmation: boolean;
  envTemplate?: boolean;
  writeManifestPath?: string;
  validateManifestPath?: string;
  writeContractPath?: string;
  validateContractPath?: string;
  writeEnvPath?: string;
  gatewayUrl?: string;
  expo?: boolean;
  expoRouter?: boolean;
};

export type ReactNativeGeneratedFile = {
  path: string;
  contents: string;
  preserveExisting?: boolean;
  updateExisting?: (contents: string) => string | undefined;
};

export type ReactNativeAppConfigFile = {
  appId: string;
  appName: string;
  connectionUrl?: string;
  gatewayUrl?: string;
  version?: string;
  authToken?: string;
};

export type ReactNativeDoctorCheck = {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
};

export type ReactNativeDoctorReport = {
  status: "pass" | "warn" | "fail";
  outDir: string;
  checks: ReactNativeDoctorCheck[];
};

export type ReactNativeSecurityDoctorReport = ReactNativeDoctorReport & {
  kind: "mobigent.react-native.security-doctor";
};

export type ReactNativeIntegrationManifest = {
  kind: "mobigent.react-native.integration";
  app: {
    id: string;
    name: string;
    version?: string;
  };
  feature: string;
  gatewayUrl: string;
  files: {
    root: string;
    feature: string;
    confirmation?: string;
  };
  capabilities: {
    actions: string[];
    resources: string[];
    components: string[];
    events: string[];
  };
  modules: Array<{
    id: string;
    name: string;
    feature: string;
    file: string;
    actions: string[];
    resources: string[];
    components: string[];
  }>;
  commands: {
    generate: string;
    doctor: string;
  };
};

export type ReactNativeCapabilityContract = CapabilityManifest & {
  kind: "mobigent.react-native.capability-contract";
};

export type ReactNativeContractValidationReport = {
  status: "pass" | "fail";
  path: string;
  errors: string[];
};

export type ReactNativeIntegrationManifestValidationReport = {
  status: "pass" | "fail";
  path: string;
  errors: string[];
};

export function createReactNativeStarterFiles(options: ReactNativeInitCliOptions): ReactNativeGeneratedFile[] {
  assertIdentifier("feature", options.feature);

  if (options.featureOnly) {
    return createReactNativeFeatureFiles(options);
  }

  const files: ReactNativeGeneratedFile[] = [
    {
      path: join(options.outDir, "mobigent-config.ts"),
      contents: createMobigentConfigFile(options),
      preserveExisting: true
    },
    {
      path: join(options.outDir, "mobigent.tsx"),
      contents: createMobigentRootFile(options),
      updateExisting: (contents) => addFeatureToMobigentRoot(contents, options.feature)
    },
    {
      path: join(options.outDir, "mobigent-features", `${options.feature}.ts`),
      contents: createFeatureFile(options.feature),
      preserveExisting: true
    }
  ];

  if (options.customConfirmation) {
    files.push({
      path: join(options.outDir, "mobigent-confirmation.tsx"),
      contents: createConfirmationFile()
    });
  }

  if (options.expoRouter) {
    files.push({
      path: join("app", "_layout.tsx"),
      contents: createExpoRouterLayoutFile(options)
    });
  }

  return files;
}

export function createReactNativeFeatureFiles(
  options: Pick<ReactNativeInitCliOptions, "feature" | "outDir">
): ReactNativeGeneratedFile[] {
  assertIdentifier("feature", options.feature);

  return [
    {
      path: join(options.outDir, "mobigent-features", `${options.feature}.ts`),
      contents: createFeatureFile(options.feature)
    }
  ];
}

export function validateReactNativeCapabilityContractFile(path: string): ReactNativeContractValidationReport {
  let parsed: unknown;

  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    return {
      status: "fail",
      path,
      errors: [`Could not read or parse contract JSON: ${error instanceof Error ? error.message : String(error)}`]
    };
  }

  const result = validateCapabilityManifest(parsed);

  return result.ok
    ? {
        status: "pass",
        path,
        errors: []
      }
    : {
        status: "fail",
        path,
        errors: result.errors
      };
}

export function validateReactNativeIntegrationManifestFile(
  path: string
): ReactNativeIntegrationManifestValidationReport {
  let parsed: unknown;

  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    return {
      status: "fail",
      path,
      errors: [`Could not read or parse integration manifest JSON: ${error instanceof Error ? error.message : String(error)}`]
    };
  }

  const errors = validateReactNativeIntegrationManifest(parsed);

  return errors.length === 0
    ? {
        status: "pass",
        path,
        errors: []
      }
    : {
        status: "fail",
        path,
        errors
      };
}

export function createReactNativeCapabilityContract(options: ReactNativeInitCliOptions): ReactNativeCapabilityContract {
  assertIdentifier("feature", options.feature);

  return {
    kind: "mobigent.react-native.capability-contract",
    appId: options.appId,
    appName: options.appName,
    sdk: "react-native",
    version: options.appVersion ?? "0.1.12",
    actions: [
      {
        name: `${options.feature}_create`,
        description: `Create a ${options.feature}.`,
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Human-readable title."
            }
          },
          required: ["title"]
        },
        confirmation: {
          required: true,
          risk: "medium"
        }
      }
    ],
    resources: [
      {
        name: `${options.feature}_list`,
        description: `List ${options.feature} records.`,
        outputSchema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {}
              }
            }
          },
          required: ["items"]
        },
        policy: {
          readOnly: true
        }
      }
    ],
    components: []
  };
}

export function createReactNativeIntegrationManifest(
  options: ReactNativeInitCliOptions
): ReactNativeIntegrationManifest {
  assertIdentifier("feature", options.feature);

  const root = join(options.outDir, "mobigent.tsx");
  const featureFile = join(options.outDir, "mobigent-features", `${options.feature}.ts`);
  const confirmationFile = join(options.outDir, "mobigent-confirmation.tsx");
  const appVersion = options.appVersion ? ` --app-version ${shellQuote(options.appVersion)}` : "";
  const customConfirmation = options.customConfirmation ? " --custom-confirmation" : "";
  const command = options.expo ? "mobigent-init" : "mobigent-rn-init";
  const expo = options.expo && command !== "mobigent-init" ? " --expo" : "";
  const baseCommand =
    `${command} --app-id ${shellQuote(options.appId)} --app-name ${shellQuote(options.appName)}` +
    `${appVersion} --feature ${shellQuote(options.feature)} --out-dir ${shellQuote(options.outDir)}${customConfirmation}${expo}`;

  return {
    kind: "mobigent.react-native.integration",
    app: {
      id: options.appId,
      name: options.appName,
      version: options.appVersion
    },
    feature: options.feature,
    gatewayUrl: options.gatewayUrl ?? createMobigentGatewayUrl(),
    files: {
      root,
      feature: featureFile,
      ...(options.customConfirmation ? { confirmation: confirmationFile } : {})
    },
    capabilities: {
      actions: [`${options.feature}_create`],
      resources: [`${options.feature}_list`],
      components: [],
      events: [`${options.feature}.created`]
    },
    modules: [
      {
        id: `mobigent.${options.feature}`,
        name: `${options.feature} feature`,
        feature: options.feature,
        file: featureFile,
        actions: [`${options.feature}_create`],
        resources: [`${options.feature}_list`],
        components: []
      }
    ],
    commands: {
      generate: baseCommand,
      doctor: `${baseCommand} --doctor`
    }
  };
}

export function createReactNativeDoctorReport(options: ReactNativeInitCliOptions): ReactNativeDoctorReport {
  const checks: ReactNativeDoctorCheck[] = [];
  const appRoot = options.appRoot ?? ".";
  const rootPath = join(options.outDir, "mobigent.tsx");
  const featurePath = join(options.outDir, "mobigent-features", `${options.feature}.ts`);
  const packageJsonPath = join(appRoot, "package.json");
  const gatewayUrl = options.gatewayUrl ?? createMobigentGatewayUrl();

  pushCheck(
    checks,
    Boolean(options.appId && options.appName),
    "app_identity",
    "App identity is configured.",
    "Pass --app-id and --app-name so the mobile manifest is identifiable."
  );

  try {
    assertIdentifier("feature", options.feature);
    checks.push({
      name: "feature_name",
      status: "pass",
      message: `Feature namespace "${options.feature}" is valid.`
    });
  } catch (error) {
    checks.push({
      name: "feature_name",
      status: "fail",
      message: error instanceof Error ? error.message : String(error)
    });
  }

  pushCheck(
    checks,
    isWebSocketUrl(gatewayUrl),
    "gateway_url",
    `Gateway URL looks valid: ${gatewayUrl}`,
    `Gateway URL should use ws:// or wss://, received ${gatewayUrl}.`
  );

  pushPackageJsonCheck(checks, packageJsonPath);

  pushFileCheck(checks, rootPath, "root_file", (contents) =>
    contents.includes("setupMobigent") &&
    contents.includes("features:") &&
    contents.includes("MobigentRoot")
      ? "Root file exports a MobigentRoot with simple feature registration."
      : "Root file exists but does not look like the standard MobigentRoot scaffold."
  );
  pushFileCheck(checks, featurePath, "feature_file", (contents) =>
    contents.includes(`defineFeature("${options.feature}")`) &&
    contents.includes(`export const ${options.feature}Feature`) &&
    contents.includes(".write(")
      ? `Feature file exposes ${options.feature}Feature with defineFeature().`
      : "Feature file exists but does not look like the standard feature scaffold."
  );
  if (options.customConfirmation) {
    pushFileCheck(checks, join(options.outDir, "mobigent-confirmation.tsx"), "confirmation_file", (contents) =>
      contents.includes("MobigentAgentApproval") && contents.includes("useMobigentConfirmation")
        ? "Confirmation file exposes an editable MobigentAgentApproval component."
        : "Confirmation file exists but does not look like the standard custom confirmation scaffold."
    );
  }

  return {
    status: summarizeChecks(checks),
    outDir: options.outDir,
    checks
  };
}

export function createReactNativeSecurityDoctorReport(
  options: ReactNativeInitCliOptions
): ReactNativeSecurityDoctorReport {
  const checks: ReactNativeDoctorCheck[] = [];
  const gatewayUrl = options.gatewayUrl ?? createMobigentGatewayUrl();
  const contract = createReactNativeCapabilityContract(options);

  pushCheck(
    checks,
    isSecureOrLocalWebSocketUrl(gatewayUrl),
    "gateway_transport",
    `Gateway transport is acceptable for development or production: ${gatewayUrl}`,
    `Use wss:// for hosted gateways. ws:// is only acceptable for localhost, simulator, or emulator hosts.`
  );

  const riskyActions = contract.actions.filter((action) => (action.confirmation?.risk ?? "low") !== "low");
  pushCheck(
    checks,
    riskyActions.every((action) => action.confirmation?.required),
    "risky_action_confirmation",
    "All medium/high risk actions require confirmation.",
    "Every medium/high risk action should set confirmation.required=true."
  );

  pushCheck(
    checks,
    options.customConfirmation,
    "host_approval_ui",
    "Custom confirmation UI is requested for host-owned approvals.",
    "Use --custom-confirmation or wire your own on-device approval UI before shipping write actions."
  );

  pushCheck(
    checks,
    Boolean(options.appId && options.appName),
    "app_identity",
    "App identity is stable and visible in manifests.",
    "Pass --app-id and --app-name before sharing contracts with agents."
  );

  return {
    kind: "mobigent.react-native.security-doctor",
    status: summarizeChecks(checks),
    outDir: options.outDir,
    checks
  };
}

export function runReactNativeInitCli(
  argv = process.argv.slice(2),
  output = process.stdout,
  errorOutput = process.stderr,
  commandName = basename(process.argv[1] ?? "mobigent-rn-init")
) {
  try {
    const normalized = normalizeMobigentCommand(argv, commandName);
    const options = parseArgs(normalized.argv, { expo: isExpoFirstCommand(normalized.commandName) });

    if (options.help) {
      output.write(helpText());
      return 0;
    }

    if (options.doctor) {
      const report = createReactNativeDoctorReport(options);
      output.write(`${formatDoctorReport(report)}\n`);
      return report.status === "fail" ? 1 : 0;
    }

    if (options.securityDoctor) {
      const report = createReactNativeSecurityDoctorReport(options);
      output.write(`${formatSecurityDoctorReport(report)}\n`);
      return report.status === "fail" ? 1 : 0;
    }

    if (options.validateContractPath) {
      const report = validateReactNativeCapabilityContractFile(options.validateContractPath);
      output.write(`${formatContractValidationReport(report)}\n`);
      return report.status === "fail" ? 1 : 0;
    }

    if (options.validateManifestPath) {
      const report = validateReactNativeIntegrationManifestFile(options.validateManifestPath);
      output.write(`${formatIntegrationManifestValidationReport(report)}\n`);
      return report.status === "fail" ? 1 : 0;
    }

    if (options.manifest) {
      output.write(`${JSON.stringify(createReactNativeIntegrationManifest(options), null, 2)}\n`);
      return 0;
    }

    if (options.writeManifestPath) {
      writeGeneratedFile(
        {
          path: options.writeManifestPath,
          contents: `${JSON.stringify(createReactNativeIntegrationManifest(options), null, 2)}\n`
        },
        options.force
      );
      output.write(`Created Mobigent integration manifest at ${options.writeManifestPath}\n`);
      return 0;
    }

    if (options.contract) {
      output.write(`${JSON.stringify(createReactNativeCapabilityContract(options), null, 2)}\n`);
      return 0;
    }

    if (options.platformActions) {
      const contract = createReactNativeCapabilityContract(options);
      const iosPlan = createAppleAppIntentsPlan(contract);
      const androidPlan = createAndroidAppActionsPlan(contract);
      const result =
        options.platformActions === "ios-swift"
          ? renderAppleAppIntentsSwift(iosPlan)
          : options.platformActions === "android-xml"
            ? renderAndroidAppActionsXml(androidPlan)
            : JSON.stringify({ ios: iosPlan, android: androidPlan }, null, 2);
      output.write(`${result}${result.endsWith("\n") ? "" : "\n"}`);
      return 0;
    }

    if (options.writeContractPath) {
      writeGeneratedFile(
        {
          path: options.writeContractPath,
          contents: `${JSON.stringify(createReactNativeCapabilityContract(options), null, 2)}\n`
        },
        options.force
      );
      output.write(`Created Mobigent capability contract at ${options.writeContractPath}\n`);
      return 0;
    }

    if (options.envTemplate) {
      output.write(createReactNativeEnvTemplate(options));
      return 0;
    }

    if (options.writeEnvPath) {
      writeGeneratedFile(
        {
          path: options.writeEnvPath,
          contents: createReactNativeEnvTemplate(options)
        },
        options.force
      );
      output.write(`Created Mobigent React Native environment template at ${options.writeEnvPath}\n`);
      return 0;
    }

    const files = createReactNativeStarterFiles(options);

    if (options.dryRun) {
      output.write(`${JSON.stringify({ files: toPublicGeneratedFiles(files) }, null, 2)}\n`);
      return 0;
    }

    for (const file of files) {
      writeGeneratedFile(file, options.force);
    }

    output.write(formatCreatedFilesMessage(options));
    return 0;
  } catch (error) {
    errorOutput.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

function normalizeMobigentCommand(argv: string[], commandName: string) {
  if (commandName !== "mobigent") {
    return { argv, commandName };
  }

  const [command, ...rest] = argv;
  if (!command || command.startsWith("-")) {
    return { argv, commandName };
  }

  switch (command) {
    case "init":
      return { argv: rest, commandName };
    case "doctor":
      return { argv: ["--doctor", ...rest], commandName };
    case "security-doctor":
      return { argv: ["--security-doctor", ...rest], commandName };
    case "manifest":
      return { argv: ["--manifest", ...rest], commandName };
    case "contract":
      return { argv: ["--contract", ...rest], commandName };
    case "env":
    case "env-template":
      return { argv: ["--env-template", ...rest], commandName };
    case "help":
      return { argv: ["--help"], commandName };
    default:
      throw new Error(`Unknown mobigent command ${command}\n\n${helpText()}`);
  }
}

function parseArgs(
  argv: string[],
  defaults: Pick<ReactNativeInitCliOptions, "expo"> = { expo: false }
): ReactNativeInitCliOptions & { help?: boolean } {
  const options: ReactNativeInitCliOptions & { help?: boolean } = {
    appId: "",
    appName: "",
    feature: "expense",
    outDir: "src",
    dryRun: false,
    force: false,
    doctor: false,
    securityDoctor: false,
    manifest: false,
    contract: false,
    featureOnly: false,
    customConfirmation: false,
    envTemplate: false,
    expo: defaults.expo,
    expoRouter: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      index += 1;
      return value;
    };

    switch (arg) {
      case "--app-id":
        options.appId = next();
        break;
      case "--app-name":
        options.appName = next();
        break;
      case "--app-version":
        options.appVersion = next();
        break;
      case "--config":
        options.configPath = next();
        break;
      case "--backend-dir":
        options.backendDir = next();
        break;
      case "--feature":
        options.feature = next();
        break;
      case "--app-root":
        options.appRoot = next();
        break;
      case "--out-dir":
        options.outDir = next();
        break;
      case "--gateway-url":
        options.gatewayUrl = next();
        break;
      case "--custom-confirmation":
        options.customConfirmation = true;
        break;
      case "--expo":
        options.expo = true;
        break;
      case "--react-native":
      case "--bare":
        options.expo = false;
        options.expoRouter = false;
        break;
      case "--expo-router":
        options.expo = true;
        options.expoRouter = true;
        break;
      case "--feature-only":
        options.featureOnly = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--force":
        options.force = true;
        break;
      case "--doctor":
        options.doctor = true;
        break;
      case "--security-doctor":
        options.securityDoctor = true;
        break;
      case "--manifest":
        options.manifest = true;
        break;
      case "--write-manifest":
        options.writeManifestPath = next();
        break;
      case "--validate-manifest":
        options.validateManifestPath = next();
        break;
      case "--contract":
        options.contract = true;
        break;
      case "--platform-actions":
        options.platformActions = readPlatformActionsFormat(next());
        break;
      case "--write-contract":
        options.writeContractPath = next();
        break;
      case "--validate-contract":
        options.validateContractPath = next();
        break;
      case "--env-template":
        options.envTemplate = true;
        break;
      case "--write-env":
        options.writeEnvPath = next();
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`Unknown option ${arg}\n\n${helpText()}`);
    }
  }

  if (options.help) {
    return options;
  }

  if (!options.configPath) {
    options.configPath = findDefaultReactNativeAppConfig(options.appRoot ?? process.cwd(), options.backendDir);
  }

  if (options.configPath) {
    options.appConfig = readReactNativeAppConfig(options.configPath);
    options.appId ||= options.appConfig.appId;
    options.appName ||= options.appConfig.appName;
    options.appVersion ||= options.appConfig.version;
    options.gatewayUrl ||= options.appConfig.connectionUrl ?? options.appConfig.gatewayUrl;
  }

  const shouldInferIdentity =
    !options.validateManifestPath &&
    !options.validateContractPath &&
    !options.envTemplate &&
    !options.writeEnvPath &&
    !options.featureOnly;

  if (shouldInferIdentity && (!options.appId || !options.appName)) {
    const inferred = inferReactNativeAppIdentity(options.appRoot ?? process.cwd());
    options.appId ||= inferred.appId;
    options.appName ||= inferred.appName;
  }

  if (
    (options.manifest ||
      options.writeManifestPath ||
      options.contract ||
      options.writeContractPath ||
      options.securityDoctor ||
      options.platformActions) &&
    (!options.appId || !options.appName)
  ) {
    throw new Error(
      "--app-id and --app-name are required for --manifest, --write-manifest, --contract, --write-contract, --security-doctor, and --platform-actions.\n\n" +
        helpText()
    );
  }

  return options;
}

function createMobigentRootFile(options: ReactNativeInitCliOptions) {
  if (options.expo) {
    return createMobigentExpoRootFile(options);
  }

  const versionLine = options.appVersion ? `,\n  version: ${JSON.stringify(options.appVersion)}` : "";
  const confirmationImport = options.customConfirmation
    ? `import { MobigentAgentApproval } from "./mobigent-confirmation";\n`
    : "";
  const confirmationOption = options.customConfirmation
    ? ",\n  ConfirmationComponent: MobigentAgentApproval"
    : "";

return `import type { ReactNode } from "react";
import { setupMobigent, type MobigentAppRootProps } from "@mobigent/react-native";
import { ${options.feature}Feature } from "./mobigent-features/${options.feature}";
import { mobigentConfig } from "./mobigent-config";
${confirmationImport}

const { Root } = setupMobigent({
  config: mobigentConfig${versionLine},
  reconnect: { enabled: true, maxAttempts: 20 },
  heartbeat: true,
  features: [${options.feature}Feature]${confirmationOption}
});

export type MobigentRootProps = Omit<MobigentAppRootProps, "children"> & {
  children: ReactNode;
};

export function MobigentRoot(props: MobigentRootProps) {
  return <Root {...props} />;
}
`;
}

function createMobigentExpoRootFile(options: ReactNativeInitCliOptions) {
  const versionLine = options.appVersion ? `,\n  version: ${JSON.stringify(options.appVersion)}` : "";
  const confirmationImport = options.customConfirmation
    ? `import { MobigentAgentApproval } from "./mobigent-confirmation";\n`
    : "";
  const confirmationOption = options.customConfirmation
    ? ",\n  ConfirmationComponent: MobigentAgentApproval"
    : "";

return `import type { ReactNode } from "react";
import { setupMobigent, type MobigentAppRootProps } from "@mobigent/react-native";
import { ${options.feature}Feature } from "./mobigent-features/${options.feature}";
import { mobigentConfig } from "./mobigent-config";
${confirmationImport}

const { Root } = setupMobigent({
  config: mobigentConfig${versionLine},
  reconnect: { enabled: true, maxAttempts: 20 },
  heartbeat: true,
  features: [${options.feature}Feature]${confirmationOption}
});

export type MobigentRootProps = Omit<MobigentAppRootProps, "children"> & {
  children: ReactNode;
};

export function MobigentRoot(props: MobigentRootProps) {
  return <Root {...props} />;
}
`;
}

function createExpoRouterLayoutFile(options: ReactNativeInitCliOptions) {
  const rootImport = createRelativeImportPath("app", join(options.outDir, "mobigent"));

  return `import { Stack } from "expo-router";
import { MobigentRoot } from "${rootImport}";

export default function RootLayout() {
  return (
    <MobigentRoot>
      <Stack />
    </MobigentRoot>
  );
}
`;
}

function createRelativeImportPath(fromDir: string, toPathWithoutExtension: string) {
  const fromSegments = fromDir.split(/[\\/]+/).filter(Boolean);
  const toSegments = toPathWithoutExtension.split(/[\\/]+/).filter(Boolean);

  while (fromSegments.length > 0 && toSegments.length > 0 && fromSegments[0] === toSegments[0]) {
    fromSegments.shift();
    toSegments.shift();
  }

  const segments = [...fromSegments.map(() => ".."), ...toSegments];
  const relativePath = segments.length > 0 ? segments.join("/") : ".";

  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
}

function createMobigentConfigFile(options: ReactNativeInitCliOptions) {
  if (options.appConfig) {
    return `import { defineMobigentConfig } from "@mobigent/react-native";

export const mobigentConfig = defineMobigentConfig(${JSON.stringify(options.appConfig, null, 2)});
`;
  }

  return `import { defineMobigentConfig } from "@mobigent/react-native";

export const mobigentConfig = defineMobigentConfig({
  appId: ${JSON.stringify(options.appId)},
  appName: ${JSON.stringify(options.appName)},
  connectionUrl:
    process.env.EXPO_PUBLIC_MOBIGENT_CONNECTION_URL ??
    process.env.EXPO_PUBLIC_MOBIGENT_GATEWAY_URL ??
    ${JSON.stringify(options.gatewayUrl ?? "ws://localhost:8787")}${options.appVersion ? `,\n  version: ${JSON.stringify(options.appVersion)}` : ""}
});
`;
}

function readReactNativeAppConfig(path: string): ReactNativeAppConfigFile {
  let parsed: unknown;

  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Could not read Mobigent config from ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!isReactNativeAppConfig(parsed)) {
    throw new Error(`Mobigent config ${path} must include appId, appName, and connectionUrl.`);
  }

  return parsed;
}

function findDefaultReactNativeAppConfig(startDir = process.cwd(), backendDir?: string): string | undefined {
  if (backendDir) {
    const candidate = join(backendDir, defaultAppConfigFile);
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  let dir = startDir;

  while (true) {
    const candidate = join(dir, defaultAppConfigFile);
    if (existsSync(candidate)) {
      return candidate;
    }

    const sibling = findSiblingBackendConfig(dir);
    if (sibling) {
      return sibling;
    }

    const parent = dirname(dir);
    if (parent === dir) {
      return undefined;
    }

    dir = parent;
  }
}

function findSiblingBackendConfig(dir: string) {
  const parent = dirname(dir);
  const siblingNames = ["backend", "server", "api", "agent-server", "mobigent-backend"];

  for (const siblingName of siblingNames) {
    const candidate = join(parent, siblingName, defaultAppConfigFile);
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

export function inferReactNativeAppIdentity(startDir = process.cwd()): Pick<ReactNativeInitCliOptions, "appId" | "appName"> {
  const projectName = findReactNativeProjectName(startDir);

  return {
    appId: inferReactNativeAppId(projectName),
    appName: inferReactNativeAppName(projectName)
  };
}

function findReactNativeProjectName(startDir: string): string {
  let dir = startDir;

  while (true) {
    const packageJsonPath = join(dir, "package.json");
    if (existsSync(packageJsonPath)) {
      try {
        const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { name?: unknown };
        if (typeof parsed.name === "string" && parsed.name.trim()) {
          return parsed.name;
        }
      } catch {
        break;
      }
    }

    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  return basename(startDir) || "mobigent-app";
}

function inferReactNativeAppId(projectName: string): string {
  const withoutNpmScope = projectName.replace(/^@/, "");
  const segments = withoutNpmScope
    .split(/[/.]+/)
    .flatMap((segment) => segment.split(/[-_\s]+/))
    .map((segment) => segment.toLowerCase().replace(/[^a-z0-9]+/g, ""))
    .filter(Boolean);

  return ["app", ...(segments.length > 0 ? segments : ["mobigent"])].join(".");
}

function inferReactNativeAppName(projectName: string): string {
  const name = projectName
    .replace(/^@[^/]+\//, "")
    .replace(/[-_.]+/g, " ")
    .trim();

  return (name || "Mobigent App").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isReactNativeAppConfig(value: unknown): value is ReactNativeAppConfigFile {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const config = value as Record<string, unknown>;
  return (
    typeof config.appId === "string" &&
    typeof config.appName === "string" &&
    (typeof config.connectionUrl === "string" || typeof config.gatewayUrl === "string") &&
    (config.version === undefined || typeof config.version === "string") &&
    (config.authToken === undefined || typeof config.authToken === "string")
  );
}

export function createReactNativeEnvTemplate(options: Pick<ReactNativeInitCliOptions, "gatewayUrl"> = {}) {
  const gatewayUrl = options.gatewayUrl ?? "ws://localhost:8787";

  return `# Mobigent React Native environment
# Mobigent reads MOBIGENT_*, EXPO_PUBLIC_MOBIGENT_*, and REACT_NATIVE_MOBIGENT_*.
# MODE can be local, device, hosted, or disabled.
EXPO_PUBLIC_MOBIGENT_MODE=local
EXPO_PUBLIC_MOBIGENT_CONNECTION_URL=${gatewayUrl}
EXPO_PUBLIC_MOBIGENT_GATEWAY_URL=${gatewayUrl}

# Physical device example:
# EXPO_PUBLIC_MOBIGENT_MODE=device
# EXPO_PUBLIC_MOBIGENT_DEVICE_HOST=192.168.1.20
# EXPO_PUBLIC_MOBIGENT_PORT=8787

# Hosted gateway example:
# EXPO_PUBLIC_MOBIGENT_MODE=hosted
# EXPO_PUBLIC_MOBIGENT_HOST=gateway.example.com
# EXPO_PUBLIC_MOBIGENT_SECURE=true
# EXPO_PUBLIC_MOBIGENT_AUTH_TOKEN=replace-me

# Disable bridge without removing code:
# EXPO_PUBLIC_MOBIGENT_ENABLED=false
`;
}

function createConfirmationFile() {
  return `import { Button, Modal, StyleSheet, Text, View } from "react-native";
import { useMobigentConfirmation, type MobigentConfirmationComponentProps } from "@mobigent/react-native";

export function MobigentAgentApproval({
  approveLabel = "Approve",
  rejectLabel = "Reject"
}: MobigentConfirmationComponentProps) {
  const { request, approve, reject } = useMobigentConfirmation();

  return (
    <Modal visible={Boolean(request)} transparent animationType="fade" onRequestClose={reject}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>
            {request?.action.confirmation?.title ?? request?.action.description ?? "Approve agent action?"}
          </Text>
          {request?.action.confirmation?.message ? (
            <Text style={styles.message}>{request.action.confirmation.message}</Text>
          ) : null}
          <Text style={styles.payload}>{JSON.stringify(request?.input ?? {}, null, 2)}</Text>
          <View style={styles.actions}>
            <Button title={rejectLabel} onPress={reject} />
            <Button title={approveLabel} onPress={approve} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    padding: 24
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 8,
    backgroundColor: "white",
    padding: 18
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827"
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    color: "#374151"
  },
  payload: {
    marginTop: 12,
    padding: 12,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
    color: "#111827",
    fontFamily: "Courier"
  },
  actions: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12
  }
});
`;
}

function createFeatureFile(feature: string) {
  return `import { defineFeature } from "@mobigent/react-native";

type ${feature}Record = {
  id: string;
  title: string;
  createdAt: string;
};

const ${feature}Records = new Map<string, ${feature}Record>();

export const ${feature}Feature = defineFeature(${JSON.stringify(feature)})
  .read("list", async () => ({ items: Array.from(${feature}Records.values()) }), {
    description: "List ${feature} records.",
    output: {
      items: ["object"]
    }
  })
  .write("create", async (input) => {
    const record = {
      id: \`${feature}-\${Date.now()}\`,
      title: String(input.title),
      createdAt: new Date().toISOString()
    };

    ${feature}Records.set(record.id, record);
    return record;
  }, {
    description: "Create a ${feature}.",
    input: {
      title: "string"
    },
    output: {
      id: "string",
      title: "string",
      createdAt: "string"
    },
    confirm: true,
    risk: "medium"
  });
`;
}

function writeGeneratedFile(file: ReactNativeGeneratedFile, force: boolean) {
  if (!force && existsSync(file.path)) {
    if (file.updateExisting) {
      const nextContents = file.updateExisting(readFileSync(file.path, "utf8"));
      if (nextContents !== undefined) {
        writeFileSync(file.path, nextContents, "utf8");
        return;
      }
    }

    if (file.preserveExisting) {
      return;
    }
    throw new Error(`${file.path} already exists. Re-run with --force to overwrite it.`);
  }

  mkdirSync(dirname(file.path), { recursive: true });
  writeFileSync(file.path, file.contents, "utf8");
}

function toPublicGeneratedFiles(files: ReactNativeGeneratedFile[]) {
  return files.map(({ path, contents }) => ({ path, contents }));
}

function addFeatureToMobigentRoot(contents: string, feature: string) {
  const featureBinding = `${feature}Feature`;
  if (new RegExp(`\\b${escapeRegExp(featureBinding)}\\b`).test(contents)) {
    return contents;
  }

  if (!/setupMobigent\(\{/.test(contents) || !/features:\s*\[/.test(contents)) {
    return undefined;
  }

  const importLine = `import { ${featureBinding} } from "./mobigent-features/${feature}";`;
  const lines = contents.split("\n");
  const lastFeatureImportIndex = findLastFeatureImportIndex(lines);
  const fallbackImportIndex = lines.findIndex((line) => line.includes("@mobigent/react-native"));
  const insertIndex = lastFeatureImportIndex >= 0 ? lastFeatureImportIndex + 1 : fallbackImportIndex + 1;

  if (insertIndex <= 0) {
    return undefined;
  }

  lines.splice(insertIndex, 0, importLine);
  const withImport = lines.join("\n");

  return withImport.replace(/features:\s*\[([^\]]*)\]/s, (_match, rawFeatures: string) => {
    const existingFeatures = rawFeatures
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const features = [...existingFeatures, featureBinding];
    return `features: [${features.join(", ")}]`;
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findLastFeatureImportIndex(lines: string[]) {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (/from "\.\/mobigent-features\/[^"]+";/.test(lines[index])) {
      return index;
    }
  }

  return -1;
}

function formatCreatedFilesMessage(options: ReactNativeInitCliOptions) {
  if (options.featureOnly) {
    return (
      `Created Mobigent React Native feature ${options.feature} in ${join(options.outDir, "mobigent-features")}.\n` +
      `Pass ${options.feature}Feature to setupMobigent(${options.feature}Feature) or MobigentRoot features.\n`
    );
  }

  return (
    `Created Mobigent ${options.expo ? "Expo" : "React Native"} starter in ${options.outDir}\n` +
    (options.expoRouter
      ? `Expo Router layout created at ${join("app", "_layout.tsx")}.\n`
      : `Wrap your app with MobigentRoot from ${join(options.outDir, "mobigent.tsx")}.\n`)
  );
}

function pushCheck(
  checks: ReactNativeDoctorCheck[],
  condition: boolean,
  name: string,
  passMessage: string,
  failMessage: string
) {
  checks.push({
    name,
    status: condition ? "pass" : "fail",
    message: condition ? passMessage : failMessage
  });
}

function pushFileCheck(
  checks: ReactNativeDoctorCheck[],
  path: string,
  name: string,
  inspect: (contents: string) => string
) {
  if (!existsSync(path)) {
    checks.push({
      name,
      status: "warn",
      message: `${path} does not exist yet. Run mobigent-rn-init to generate it.`
    });
    return;
  }

  const contents = readFileSync(path, "utf8");
  const message = inspect(contents);
  checks.push({
    name,
    status: message.includes("does not look") ? "warn" : "pass",
    message
  });
}

function pushPackageJsonCheck(checks: ReactNativeDoctorCheck[], path: string) {
  if (!existsSync(path)) {
    checks.push({
      name: "package_json",
      status: "warn",
      message: `${path} does not exist. Run doctor from the app root or pass --app-root.`
    });
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    checks.push({
      name: "package_json",
      status: "fail",
      message: `Could not parse ${path}: ${error instanceof Error ? error.message : String(error)}`
    });
    return;
  }

  if (!isPackageJson(parsed)) {
    checks.push({
      name: "package_json",
      status: "fail",
      message: `${path} is not a valid package.json object.`
    });
    return;
  }

  const dependencies = {
    ...parsed.dependencies,
    ...parsed.devDependencies,
    ...parsed.peerDependencies
  };
  const hasMobigent = Boolean(dependencies["@mobigent/react-native"]);
  const hasReactNative = Boolean(dependencies["react-native"] || dependencies["expo"]);

  if (!hasMobigent) {
    checks.push({
      name: "package_json",
      status: "warn",
      message: `${path} is missing @mobigent/react-native. Install it before running the app.`
    });
    return;
  }

  checks.push({
    name: "package_json",
    status: hasReactNative ? "pass" : "warn",
    message: hasReactNative
      ? `${path} includes @mobigent/react-native and a React Native runtime dependency.`
      : `${path} includes @mobigent/react-native but does not list react-native or expo.`
  });
}

function validateReactNativeIntegrationManifest(value: unknown) {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return ["Integration manifest must be a JSON object."];
  }

  if (value.kind !== "mobigent.react-native.integration") {
    errors.push('kind must be "mobigent.react-native.integration".');
  }

  if (!isRecord(value.app)) {
    errors.push("app must be an object.");
  } else {
    if (!isNonEmptyString(value.app.id)) {
      errors.push("app.id must be a non-empty string.");
    }
    if (!isNonEmptyString(value.app.name)) {
      errors.push("app.name must be a non-empty string.");
    }
    if (value.app.version !== undefined && typeof value.app.version !== "string") {
      errors.push("app.version must be a string when present.");
    }
  }

  if (!isNonEmptyString(value.feature)) {
    errors.push("feature must be a non-empty string.");
  } else {
    try {
      assertIdentifier("feature", value.feature);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (!isNonEmptyString(value.gatewayUrl) || !isWebSocketUrl(value.gatewayUrl)) {
    errors.push("gatewayUrl must be a ws:// or wss:// URL.");
  }

  if (!isRecord(value.files)) {
    errors.push("files must be an object.");
  } else {
    if (!isNonEmptyString(value.files.root)) {
      errors.push("files.root must be a non-empty string.");
    }
    if (!isNonEmptyString(value.files.feature)) {
      errors.push("files.feature must be a non-empty string.");
    }
    if (value.files.confirmation !== undefined && !isNonEmptyString(value.files.confirmation)) {
      errors.push("files.confirmation must be a non-empty string when present.");
    }
  }

  if (!isRecord(value.capabilities)) {
    errors.push("capabilities must be an object.");
  } else {
    for (const key of ["actions", "resources", "components", "events"] as const) {
      if (!isStringArray(value.capabilities[key])) {
        errors.push(`capabilities.${key} must be an array of strings.`);
      }
    }
  }

  if (!Array.isArray(value.modules)) {
    errors.push("modules must be an array.");
  } else {
    value.modules.forEach((module, index) => {
      if (!isRecord(module)) {
        errors.push(`modules.${index} must be an object.`);
        return;
      }
      for (const key of ["id", "name", "feature", "file"] as const) {
        if (!isNonEmptyString(module[key])) {
          errors.push(`modules.${index}.${key} must be a non-empty string.`);
        }
      }
      for (const key of ["actions", "resources", "components"] as const) {
        if (!isStringArray(module[key])) {
          errors.push(`modules.${index}.${key} must be an array of strings.`);
        }
      }
    });
  }

  if (!isRecord(value.commands)) {
    errors.push("commands must be an object.");
  } else {
    if (!isNonEmptyString(value.commands.generate)) {
      errors.push("commands.generate must be a non-empty string.");
    }
    if (!isNonEmptyString(value.commands.doctor)) {
      errors.push("commands.doctor must be a non-empty string.");
    }
  }

  return errors;
}

function isPackageJson(value: unknown): value is {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
} {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function summarizeChecks(checks: ReactNativeDoctorCheck[]): ReactNativeDoctorReport["status"] {
  if (checks.some((check) => check.status === "fail")) {
    return "fail";
  }

  if (checks.some((check) => check.status === "warn")) {
    return "warn";
  }

  return "pass";
}

function formatDoctorReport(report: ReactNativeDoctorReport) {
  const lines = [`Mobigent React Native doctor: ${report.status.toUpperCase()}`];
  for (const check of report.checks) {
    lines.push(`${check.status.toUpperCase()} ${check.name}: ${check.message}`);
  }
  return lines.join("\n");
}

function formatSecurityDoctorReport(report: ReactNativeSecurityDoctorReport) {
  const lines = [`Mobigent security doctor: ${report.status.toUpperCase()}`];
  for (const check of report.checks) {
    lines.push(`${check.status.toUpperCase()} ${check.name}: ${check.message}`);
  }
  return lines.join("\n");
}

function formatContractValidationReport(report: ReactNativeContractValidationReport) {
  const lines = [`Mobigent React Native contract: ${report.status.toUpperCase()}`];
  lines.push(`PATH ${report.path}`);
  for (const error of report.errors) {
    lines.push(`ERROR ${error}`);
  }
  return lines.join("\n");
}

function formatIntegrationManifestValidationReport(report: ReactNativeIntegrationManifestValidationReport) {
  const lines = [`Mobigent React Native integration manifest: ${report.status.toUpperCase()}`];
  lines.push(`PATH ${report.path}`);
  for (const error of report.errors) {
    lines.push(`ERROR ${error}`);
  }
  return lines.join("\n");
}

function isWebSocketUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "ws:" || url.protocol === "wss:";
  } catch {
    return false;
  }
}

function isSecureOrLocalWebSocketUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "wss:") {
      return true;
    }
    return (
      url.protocol === "ws:" &&
      ["localhost", "127.0.0.1", "10.0.2.2", "0.0.0.0", "::1", "[::1]"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

function readPlatformActionsFormat(value: string): ReactNativeInitCliOptions["platformActions"] {
  if (value === "json" || value === "ios-swift" || value === "android-xml") {
    return value;
  }

  throw new Error("--platform-actions must be one of: json, ios-swift, android-xml.");
}

function shellQuote(value: string) {
  if (/^[a-zA-Z0-9_./:@-]+$/.test(value)) {
    return value;
  }

  return JSON.stringify(value);
}

function assertIdentifier(label: string, value: string) {
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
    throw new Error(`Invalid ${label} "${value}". Use letters, numbers, and underscores, starting with a letter.`);
  }
}

function helpText() {
  return `Mobigent React Native initializer

Usage:
  mobigent init --feature expense --out-dir src
  mobigent init --feature expense --out-dir src --expo-router
  mobigent init --app-id com.example.app --app-name "Example App" --feature expense --out-dir src
  mobigent doctor --feature expense --out-dir src --app-root .
  mobigent-rn-init --feature expense --out-dir src --dry-run
  mobigent-rn-init --feature expense --out-dir src --custom-confirmation
  mobigent-rn-init --feature invoice --out-dir src --feature-only
  mobigent-rn-init --security-doctor --feature expense --custom-confirmation
  mobigent-rn-init --manifest --feature expense --out-dir src
  mobigent-rn-init --write-manifest ./mobigent-integration.json --feature expense --out-dir src
  mobigent-rn-init --validate-manifest ./mobigent-integration.json
  mobigent-rn-init --contract --feature expense
  mobigent-rn-init --platform-actions json --feature expense
  mobigent-rn-init --write-contract ./mobigent-contract.json --feature expense
  mobigent-rn-init --validate-contract ./mobigent-contract.json
  mobigent-rn-init --env-template --gateway-url ws://localhost:8787
  mobigent-rn-init --write-env ./.env.mobigent --gateway-url ws://localhost:8787

Options:
  --app-id <id>          Mobile app identifier. Default: inferred from package.json.
  --app-name <name>      Human-readable app name. Default: inferred from package.json.
  --app-version <value>  App version to publish in the capability manifest.
  --config <path>        Read a backend-generated app config. Default: auto-detect mobigent.app.json.
  --backend-dir <path>   Read mobigent.app.json from a backend project directory.
  --feature <name>       Feature module name. Default: expense.
  --app-root <path>      React Native app root for package.json doctor checks. Default: current directory.
  --out-dir <path>       Output directory. Default: src.
  --gateway-url <url>    WebSocket gateway URL for doctor checks.
  --expo                 Generate an Expo-friendly root.
  --react-native, --bare Generate a bare React Native root from an Expo-first command.
  --expo-router          Also generate app/_layout.tsx for Expo Router.
  --custom-confirmation  Generate and wire an editable confirmation component.
  --feature-only         Generate only the feature module for an existing capability registry.
  --doctor               Check local React Native integration files.
  --security-doctor      Check transport, confirmation, and manifest safety defaults.
  --manifest             Print a machine-readable integration manifest.
  --write-manifest <path>
                         Write a machine-readable integration manifest JSON file.
  --validate-manifest <path>
                         Validate a saved integration manifest JSON file.
  --contract             Print a protocol-native capability contract.
  --platform-actions <format>
                         Print native assistant bridge plans. Formats: json, ios-swift, android-xml.
  --write-contract <path>
                         Write a protocol-native capability contract JSON file.
  --validate-contract <path>
                         Validate a saved capability contract JSON file.
  --env-template          Print an Expo/React Native environment template.
  --write-env <path>      Write an Expo/React Native environment template.
  --dry-run              Print generated files as JSON without writing.
  --force                Overwrite existing files.
`;
}

function isExpoFirstCommand(commandName: string) {
  return commandName === "mobigent-init" || commandName === "mobigent-expo-init";
}

function isMainModule() {
  return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
}

if (isMainModule()) {
  process.exitCode = runReactNativeInitCli();
}
