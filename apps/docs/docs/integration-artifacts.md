---
sidebar_position: 4
---

# Integration Artifacts

Mobigent integrations should start in code: install `@mobigent/app`, expose functions, and wrap the app once.

Artifacts are optional review files for teams that want CI checks around app identity, capability names, and provider setup. They should not create or own your app code.

## Recommended Files

After your app functions exist, generate and commit only the JSON contract files you want to review:

```bash
npx mobigent-rn-init \
  --write-contract ./mobigent-contract.json \
  --app-id com.example.expenses \
  --app-name "Example Expenses" \
  --feature expense

npx mobigent-rn-init \
  --write-manifest ./mobigent-integration.json \
  --app-id com.example.expenses \
  --app-name "Example Expenses" \
  --feature expense
```

For provider setup, generate and commit:

```bash
npx mobigent-provider \
  --write-matrix ./mobigent-providers.json \
  --base-url http://localhost:8788

npx mobigent-provider \
  --write-compatibility ./mobigent-provider-compatibility.json \
  --base-url http://localhost:8788

npx mobigent-provider \
  --write-setup-plan ./mobigent-provider-setup.json \
  --base-url http://localhost:8788 \
  --query anthropic
```

## What They Prove

`mobigent-integration.json` records the app identity, gateway URL, installed module metadata, and expected capability names. Use it to review whether an app exposes the expected namespace and package setup.

`mobigent-contract.json` records the protocol-level action and resource contract. Use it to validate the agent-visible capability shape before wiring a provider.

`mobigent-provider-compatibility.json` records pass/warn/fail setup validation for every built-in provider using the selected gateway URL. Use it as a CI gate before publishing provider support claims.

`mobigent-providers.json` records every built-in provider, transport type, dynamic tool support, public URL requirements, runtime support, and generated setup command. Use it to choose between MCP, OpenAPI, and HTTP runtime integrations without guessing.

`mobigent-provider-setup.json` records one recommended provider path with preset metadata, validation, provider bundle, useful endpoints, and runtime environment defaults. Use it when onboarding or deployment should follow one reviewed provider setup.

## CI Checks

Add these commands to pull request checks:

```bash
npx mobigent-rn-init \
  --doctor \
  --app-id com.example.expenses \
  --app-name "Example Expenses" \
  --feature expense \
  --app-root .

npx mobigent-rn-init --validate-contract ./mobigent-contract.json
npx mobigent-rn-init --validate-manifest ./mobigent-integration.json
npx mobigent-provider --validate-setup-plan ./mobigent-provider-setup.json

npm run verify
```

`--doctor` checks app identity, gateway URL shape, package dependencies, and the expected feature namespace. `--validate-contract` checks the saved capability contract against the Mobigent protocol. `--validate-manifest` checks the saved app integration metadata shape. `--validate-setup-plan` checks the saved provider onboarding artifact. `npm run verify` runs typecheck, tests, React Native CLI smoke checks, package checks, and the Vite build.

## Refresh Flow

When a capability changes:

```bash
npx mobigent-rn-init --write-contract ./mobigent-contract.json --app-id com.example.expenses --app-name "Example Expenses" --feature expense --force
npx mobigent-rn-init --validate-contract ./mobigent-contract.json
npx mobigent-rn-init --validate-manifest ./mobigent-integration.json
```

When provider support changes:

```bash
npx mobigent-provider --write-matrix ./mobigent-providers.json --base-url http://localhost:8788 --force
npx mobigent-provider --write-setup-plan ./mobigent-provider-setup.json --base-url http://localhost:8788 --query anthropic --force
npx mobigent-provider --validate-setup-plan ./mobigent-provider-setup.json
```

Treat changes to these JSON files like API changes: review the diff before shipping.
