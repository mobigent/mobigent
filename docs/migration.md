# Migration & Deprecation Guide

This guide covers how to upgrade between Mobigent versions and what to expect when APIs change.

## Pre-1.0 Policy

Mobigent is pre-1.0 (currently `0.1.15`). Breaking changes may occur in minor version bumps. We follow these rules to minimize disruption:

1. **Breaking changes are documented** in the changelog and these migration notes.
2. **Deprecation warnings** are logged at runtime for at least one minor version before removal, where practical.
3. **Compatibility tests** gate protocol changes against previous supported versions.
4. **Migration notes** ship in the same release as the breaking change.

After 1.0, we will adopt strict Semantic Versioning with a deprecation → warn → remove cycle spanning at least one major version.

## Version Support Window

| Component                | Current Version | Supported Versions | Policy                                                         |
| ------------------------ | --------------- | ------------------ | -------------------------------------------------------------- |
| Gateway ↔ App protocol   | 1               | [1]                | Gateways support current + previous protocol version after 1.0 |
| `@mobigent/core`         | 0.1.15          | Latest only        | Breaking changes in minor versions before 1.0                  |
| `@mobigent/app`          | 0.1.15          | Latest only        | Breaking changes in minor versions before 1.0                  |
| `@mobigent/backend`      | 0.1.15          | Latest only        | Breaking changes in minor versions before 1.0                  |
| `@mobigent/gateway`      | 0.1.15          | Latest only        | Breaking changes in minor versions before 1.0                  |
| `@mobigent/providers`    | 0.1.15          | Latest only        | Preview — shape may change with upstream API evolution         |
| `@mobigent/react-native` | 0.1.15          | Latest only        | Breaking changes in minor versions before 1.0                  |
| `mobigent` (CLI)         | 0.1.15          | Latest only        | Preview — commands may change before 1.0                       |
| `create-mobigent-app`    | 0.1.15          | Latest only        | Preview — generated starter may change before 1.0              |
| iOS Swift Package        | 0.1.15          | Latest only        | Preview — public API may change before 1.0                     |
| Android Kotlin/Gradle    | 0.1.15          | Latest only        | Preview — public API may change before 1.0                     |

## Upgrading From 0.1.x

### Package Installation

All packages are ESM-only (`"type": "module"`). CJS wrappers are not provided.

```bash
npm install @mobigent/app@latest @mobigent/backend@latest @mobigent/gateway@latest
```

For the CLI and starter:

```bash
npm install -g mobigent@latest
npm create mobigent-app@latest my-app
```

### API Compatibility Notes

**0.1.x → 0.1.y** (current window):

- No known breaking changes between 0.1.x releases at this time.
- Check the [changelog](https://github.com/mobigent/mobigent/releases) for per-release notes.

### Gateway Configuration

Gateway env vars may be added in minor releases. New vars follow these patterns:

- `MOBIGENT_*` prefix for all gateway configuration
- New optional vars have sensible defaults and do not break existing deployments
- Production safety checks (`MOBIGENT_ENV=production`) may warn on new recommended vars

### Protocol Version

The current protocol version is `1`. Gateways support version `[1]`. After 1.0:

- Protocol version `2` gateways will support `[1, 2]`
- Protocol version `1` apps will connect to version `2` gateways
- Protocol version `2` apps connecting to version `1` gateways will receive an unsupported-protocol-version rejection

### Native SDKs

iOS (Swift Package) and Android (Kotlin/Gradle) packages are in Preview. Their public API may change before 1.0:

- Breaking changes will be noted in release notes
- Native package version numbers track the npm release version
- Consume native packages via Git tags (Swift PM) or source/jitpack (Android) until Maven Central is available

### Provider Adapters

`@mobigent/providers` tool-name mapping and result formatting may change:

- Provider-safe tool-name sanitization may evolve (max length, character rules)
- Result-format shapes may adjust to match upstream provider API changes
- New providers are added in minor releases without breaking existing adapters

## Deprecation Process

When an API is deprecated:

1. **Announce**: Changelog and migration notes document the deprecation, the replacement API, and the removal timeline.
2. **Warn**: Runtime logs a deprecation warning (single warning per process, rate-limited for per-call paths).
3. **Remove**: After at least one minor version (pre-1.0) or one major version (post-1.0), the deprecated API is removed.

Example deprecation warning:

```
[Mobigent] DEPRECATED: BridgeGateway({ port }) — use new BridgeGateway({ port: 8787 }) instead.
This API will be removed in a future release.
```

## Template: Migration Note

Use this template when writing a migration note for a breaking change:

```markdown
## Migrating from 0.1.X to 0.1.Y

### <Feature/API name>

**What changed:** <Brief description of the change.>

**Why:** <Reason for the breaking change.>

**Before (0.1.X):**

\`\`\`typescript
// Old code
\`\`\`

**After (0.1.Y):**

\`\`\`typescript
// New code
\`\`\`

**Migration path:** <Steps to migrate, in order.>

**Affected packages:** <List of packages that need updates.>

**Rollback:** <How to revert if the migration causes issues.>
```
