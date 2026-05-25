# Contributing To Mobigent

Mobigent is early, energetic, and wide open for builders. The most valuable contributions are small, tested improvements to the SDK shape, gateway behavior, docs, examples, and provider integrations.

If you are new here, start with issues labeled `good first issue` or `help wanted`.

## Local Setup

```bash
npm install
npm run verify
npm run demo
```

## Development Commands

```bash
npm run dev:gateway
npm run dev:app
npm run dev:http
npm run demo:http
npm run dev:mcp
npm run verify
```

## How To Contribute

1. Open an issue or discussion for larger changes.
2. Fork the repo and create a focused branch.
3. Keep the PR small enough to review in one sitting.
4. Add tests when behavior changes.
5. Update docs when developer experience changes.
6. Run `npm run verify` before opening the PR.

## Design Principles

- Apps own execution. Agents call capabilities, not UI coordinates.
- Consequential actions require clear confirmation.
- Capability schemas should be explicit and readable.
- The gateway should be transport-flexible: HTTP, MCP, and local dev should all map to the same core bridge.
- Mobile constraints are real: foreground state, permissions, background execution, and app lifecycle matter.

## Commit Style

Use short, direct commit messages. Conventional prefixes are welcome:

- `feat: add provider runtime helper`
- `fix: validate action output schema`
- `docs: clarify ChatGPT Actions setup`
- `test: cover gateway readiness`

## Pull Request Checklist

- Run `npm run verify`; CI runs the same gate.
- Run `npm run demo` when touching gateway, SDK, or examples.
- Update docs or examples when behavior changes.
- Keep examples simple enough for a new developer to understand in one pass.

## Continuous Integration

GitHub Actions runs `npm ci` and `npm run verify` on pull requests and pushes to `main`. The verification gate includes SDK typechecks, tests, package packing checks, and the Vite docs production build.

## Releases

Before publishing any package, make sure versions and `CHANGELOG.md` are updated, then run:

```bash
npm run verify
```

The release workflow publishes the public packages when a `v*.*.*` tag is pushed. It runs `npm ci`, `npm run verify`, then publishes:

- `@mobigent/core`
- `@mobigent/providers`
- `@mobigent/react-native`
- `@mobigent/gateway`

Repository maintainers must configure an `NPM_TOKEN` repository secret with publish access. The workflow uses npm provenance, so GitHub Actions also needs the default OIDC token permissions left enabled.

Manual release dry runs should use:

```bash
npm run pack:check
```

`pack:check` runs `npm pack --dry-run` for every publishable package and fails if required `dist` files are missing, CLI bins are not executable, or source/test files leak into the tarball. Each publishable package also has `prepublishOnly` guards that run package-local build and typecheck.

## Security

Do not open public issues for vulnerabilities. Use GitHub private security advisories from the Security tab. See [SECURITY.md](./SECURITY.md).
