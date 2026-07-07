# Compatibility Policy

Mobigent is pre-1.0 (currently `0.1.15`). Breaking changes may occur in minor versions before 1.0, but they will be documented and include migration notes.

## Compatibility Commitments

### Package Exports (npm)

| Package | Stability | Notes |
|---|---|---|
| `@mobigent/core` | Stable | Protocol types, validation, canonical JSON, tool naming |
| `@mobigent/app` | Stable | `createApp`, `withMobigent`, `write()`, app function types |
| `@mobigent/backend` | Stable | `startMobigent`, app proxy, agent setup |
| `@mobigent/gateway` | Stable | Server entrypoints, HTTP API shape, OpenAPI schema |
| `@mobigent/providers` | Preview | Provider adapters may change shape as upstream APIs evolve |
| `@mobigent/react-native` | Stable | Transport, hooks, confirmation, diagnostics |
| `mobigent` (CLI) | Preview | CLI commands may change before 1.0 |
| `create-mobigent-app` | Preview | Generated starter may change before 1.0 |

**ESM-only:** All packages are ESM only (`"type": "module"`). CJS wrappers are not provided and will not be added.

### Protocol Version

The gateway and SDKs use a protocol version field (`currentProtocolVersion = 1`). 

- **Current supported versions:** `[1]`
- **Version window:** The gateway will support the current and previous protocol version after 1.0.
- **Breaking protocol changes** will bump the protocol version and require both gateway and SDK updates.

### HTTP API & OpenAPI

- `/openapi.json` schema: backward-compatible additions (new endpoints, optional fields) are non-breaking.
- Removing or renaming endpoints: breaking, requires migration notes.
- Error response shape (`{code, error, retryable}`): stable since 0.1.15.
- Custom headers (`x-mobigent-*`): stable, new headers added as optional.

### Native SDKs

| Platform | Stability | Target |
|---|---|---|
| iOS (Swift Package) | Preview | iOS 15+, Swift 5.9+ |
| Android (Kotlin/Gradle) | Preview | API 23+, JVM 17 |

Native SDKs may change their public API before 1.0. Breaking changes will be noted in release notes.

### Provider Adapters

Provider adapters in `@mobigent/providers` are **Preview**. They may change:
- Constructor signatures
- Integration guide format
- Tool name mapping behavior

### CLI Commands

CLI commands in `mobigent` and `create-mobigent-app` are **Preview**. Command names and flags may change. Deprecation warnings will be added before removal where practical.

### Starter Templates

Generated project structure from `create-mobigent-app` is **Preview**. Generated files may change between versions.

## Breaking Change Process

Before 1.0:

1. **Changelog entry** describing the change and migration path
2. **Migration notes** in the release or docs
3. **Deprecation warning** in code where practical (one minor version before removal for CLI/programmatic APIs)
4. **Compatibility tests** for protocol changes

After 1.0:
- Semantic versioning: major version bump for breaking changes
- Deprecation cycle: deprecate → warn for one major version → remove
- Migration guides for each major version

## Supported Runtimes

| Runtime | Minimum Version | Notes |
|---|---|---|
| Node.js | 20 | Required by all packages |
| React Native | 0.76+ | Required by `@mobigent/react-native` and `@mobigent/app` |
| Expo | SDK 52+ | Supported via `@mobigent/app` Expo plugin |
| iOS | 15.0+ | Required by Swift Package |
| Android | API 23+ | Required by Kotlin library |
| TypeScript | 5.5+ | Type declarations provided for all packages |

## Package Manager Support

| Manager | Status |
|---|---|
| npm | Supported and tested |
| yarn | Expected to work (not tested in CI) |
| pnpm | Expected to work (not tested in CI) |

## Deprecation Policy

1. **Pre-1.0:** Functionality may be removed without a deprecation cycle, but will be documented in release notes.
2. **Post-1.0:** Deprecated APIs will emit console warnings and be documented for at least one major version before removal.
3. **Protocol changes:** Will include a compatibility window (current + previous version).

## Versioning (SemVer)

- **MAJOR** (`1.0.0`): Breaking changes to public API, protocol, or supported runtimes.
- **MINOR** (`0.2.0`): New features, non-breaking additions.
- **PATCH** (`0.1.16`): Bug fixes, security patches, docs-only changes.

Pre-1.0 breaking changes may appear in MINOR bumps with clear migration notes.
