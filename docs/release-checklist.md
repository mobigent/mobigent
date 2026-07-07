# Release Checklist

Use this checklist for every Mobigent release. If a step cannot be completed, document the reason and create a follow-up issue.

## Pre-Release

- [ ] Decide version and release channel (patch/minor/major)
- [ ] Update version in root `package.json` and workspace packages
- [ ] Update `CHANGELOG.md` with all changes since last release
- [ ] Add migration notes for any breaking changes
- [ ] Update compatibility notes in `docs/compatibility-policy.md` if needed
- [ ] Verify no stale references to old versions in docs

## Quality Gates

Run all checks:

```bash
# Full verification
npm run verify

# Native checks
npm run verify:ios
npm run verify:android

# Docs build
npm run docs:build

# Package checks
npm run pack:check
npm run packed-install:smoke
npm run npm:preflight

# Docker (if Docker available)
docker build -t mobigent-gateway:local .
npm run docker:smoke
```

- [ ] `npm run verify` passes (Node 20 + 22 in CI)
- [ ] `npm run verify:ios` passes
- [ ] `npm run verify:android` passes (or documented blocker)
- [ ] `npm run docs:build` passes
- [ ] Package contents look correct (`npm run pack:check`)
- [ ] Packed install smoke tests pass (`npm run packed-install:smoke`)
- [ ] npm preflight passes (`npm run npm:preflight`)
- [ ] Docker image builds and smoke test passes (if Docker available)

## Package Inspection

- [ ] Inspect tarball contents for each published package
- [ ] Verify no extraneous files in packages (`files` allowlists)
- [ ] Verify package.json fields: `main`, `types`, `exports`, `files`, `engines`
- [ ] Verify all packages have correct `"type": "module"`

## Documentation

- [ ] Docs site builds without errors
- [ ] README examples are current
- [ ] Quickstart works from a clean install
- [ ] Production gateway guide references correct env names
- [ ] Security doc reflects current auth options
- [ ] Compatibility matrix is up to date
- [ ] Provider setup guides are current

## Starter App

- [ ] `npm create mobigent-app@latest my-demo -- --install` works
- [ ] Generated app boots without errors
- [ ] Demo runs end-to-end (if mobile runtime available)

## Publish

- [ ] Tag release: `git tag v0.1.X`
- [ ] Push tag: `git push origin v0.1.X`
- [ ] CI release workflow succeeds
- [ ] Packages appear on npm registry
- [ ] GitHub Release created with release notes

## Post-Publish Verification

- [ ] Install `@mobigent/app@latest` in a clean temp directory
- [ ] Install `@mobigent/backend@latest` in a clean temp directory
- [ ] Run starter from npm: `npm create mobigent-app@latest test-release -- --install`
- [ ] Verify package pages on npmjs.com show correct README
- [ ] Verify GitHub release has correct artifacts

## Native Verification

- [ ] Swift Package can be consumed from the new Git tag
- [ ] Android library source is accessible from the Git tag
- [ ] Native examples build against new release

## Monitoring

- [ ] Monitor npm download counts for first 24h
- [ ] Check for GitHub issues filed against new release
- [ ] Verify docs site deployed correctly
- [ ] Check CI status for the release tag

## Rollback Plan

If the release has a critical issue:

1. **DO NOT unpublish npm packages.** Users may have already installed them.
2. Publish a patch release (`0.1.X+1`) with the fix.
3. Update release notes with known issues.
4. If a security issue, follow `SECURITY.md` and publish patched versions.
5. Keep previous Docker image available.
6. Keep previous Git tag and release artifacts.
7. Document downgrade steps if needed.

## Release Captain Notes

- Release captain: _______________
- Release date: _______________
- Version: _______________
- Any deviations from checklist:
  _______________________________________________
  _______________________________________________
