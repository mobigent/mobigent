# npm Publishing

Mobigent is designed to be installed like normal npm packages:

```bash
npm create mobigent-app@latest my-demo
npm install -D mobigent
npm install @mobigent/app
npm install @mobigent/backend
```

Current public fallback before npmjs publishing is connected:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \
  -- create-mobigent-app my-demo --package-source github-release --install
```

## Packages To Publish

- `@mobigent/core`
- `@mobigent/gateway`
- `@mobigent/backend`
- `@mobigent/providers`
- `@mobigent/app`
- `@mobigent/react-native`
- `create-mobigent-app`
- `mobigent`

## Option A: Token Publishing

Use this for the first public publish, because npm Trusted Publishing can only be configured after each package exists on npmjs.com.

1. Create or join the `@mobigent` npm organization.
2. Create an npm automation token with publish access for the eight packages.
3. Add that token as the GitHub secret `NPM_TOKEN`.
4. Rerun the existing tag release workflow or push the next SemVer tag.

The release workflow publishes all npm packages on SemVer tags.

### Fastest First Publish

After the `@mobigent` npm organization exists and you are logged in locally, the current unpublished version can be published without waiting for another tag:

```bash
npm login
npm run npm:publish-ready
npm run verify
npm run npm:publish
npm run npm:status
```

This should make the real install path work:

```bash
npm install @mobigent/app
npm install @mobigent/backend
npm create mobigent-app@latest my-demo -- --install
```

If you prefer GitHub Actions for the first publish, add `NPM_TOKEN`, then rerun the release workflow for the latest `v*.*.*` tag. The release workflow intentionally runs only on SemVer tags so it cannot accidentally publish or create a release named after a branch.

## Option B: npm Trusted Publishing

npm Trusted Publishing uses GitHub Actions OIDC instead of a long-lived token. npm requires:

- npm CLI `11.10.0` or newer for `npm trust`
- npm CLI `11.5.1` or newer and Node `22.14.0` or newer inside the publishing workflow
- package write access
- account-level 2FA
- the package must already exist on npm
- each package's `repository.url` must match `https://github.com/mobigent/mobigent`

After the first package versions exist on npm, configure trust for the release workflow:

```bash
npm install -g npm@^11.10.0

npm trust github @mobigent/core --repo mobigent/mobigent --file release.yml --allow-publish
npm trust github @mobigent/gateway --repo mobigent/mobigent --file release.yml --allow-publish
npm trust github @mobigent/backend --repo mobigent/mobigent --file release.yml --allow-publish
npm trust github @mobigent/providers --repo mobigent/mobigent --file release.yml --allow-publish
npm trust github @mobigent/app --repo mobigent/mobigent --file release.yml --allow-publish
npm trust github @mobigent/react-native --repo mobigent/mobigent --file release.yml --allow-publish
npm trust github create-mobigent-app --repo mobigent/mobigent --file release.yml --allow-publish
npm trust github mobigent --repo mobigent/mobigent --file release.yml --allow-publish
```

Then set the GitHub repository variable:

```txt
NPM_TRUSTED_PUBLISHING=true
```

The release workflow will publish through OIDC when `NPM_TOKEN` is absent and `NPM_TRUSTED_PUBLISHING=true`.
The workflow pins Node 24 and installs `npm@^11.10.0` before publishing so the OIDC path has the npm features it needs.

## Release Behavior

The release workflow always builds GitHub release tarballs. If neither `NPM_TOKEN` nor `NPM_TRUSTED_PUBLISHING=true` is configured, the npmjs publish job logs that npm publishing was skipped and the GitHub release still completes.

When npm credentials are configured, the same workflow runs `npm run verify`, checks publish readiness, publishes all public packages, and verifies package visibility on npmjs.com.

The publish script is idempotent per version: if `@mobigent/app@0.1.15` already exists, it skips that package and continues. This makes reruns safer after a partial publish.

For local maintainer publishing after `npm login`:

```bash
npm run verify
npm run npm:publish-ready
npm run npm:publish
npm run npm:status
```

If you prefer token-based local publishing, set either `NPM_TOKEN` or `NODE_AUTH_TOKEN` before `npm run npm:publish`. The publish script creates a temporary private npm config for that run, then removes it.

`npm:publish-ready` explains the current npm state before you publish:

- whether the machine is authenticated
- whether the eight package names already exist
- whether any existing package points at the wrong repository
- whether Trusted Publishing can work yet

For the very first publish, `npm:publish-ready` should show the packages as empty and auth as either `token present` or `logged in as ...`.

## Verify

After release:

```bash
npm run npm:status
npm view @mobigent/app version
npm view @mobigent/backend version
npm view create-mobigent-app version
npm view mobigent version
```

Then test the real npm path:

```bash
npm create mobigent-app@latest my-demo -- --install
cd my-demo
npm run check
npm run dev
```
