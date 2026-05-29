# npm Publishing

Mobigent is designed to be installed like normal npm packages:

```bash
npm create mobigent-app@latest my-demo
npm install @mobigent/react-native
npm install @mobigent/backend
```

Current public fallback before npmjs publishing is connected:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.6/create-mobigent-app-0.1.6.tgz \
  -- create-mobigent-app my-demo --install
```

## Packages To Publish

- `@mobigent/core`
- `@mobigent/gateway`
- `@mobigent/backend`
- `@mobigent/providers`
- `@mobigent/react-native`
- `create-mobigent-app`

## Option A: Token Publishing

Add an npm automation token as the GitHub secret `NPM_TOKEN`.

The release workflow publishes all npm packages on SemVer tags.

## Option B: npm Trusted Publishing

npm Trusted Publishing uses GitHub Actions OIDC instead of a long-lived token. npm requires:

- npm CLI `11.10.0` or newer for `npm trust`
- package write access
- account-level 2FA
- the package must already exist on npm

After the first package versions exist on npm, configure trust for the release workflow:

```bash
npm install -g npm@^11.10.0

npm trust github @mobigent/core --repo mobigent/mobigent --file release.yml --allow-publish
npm trust github @mobigent/gateway --repo mobigent/mobigent --file release.yml --allow-publish
npm trust github @mobigent/backend --repo mobigent/mobigent --file release.yml --allow-publish
npm trust github @mobigent/providers --repo mobigent/mobigent --file release.yml --allow-publish
npm trust github @mobigent/react-native --repo mobigent/mobigent --file release.yml --allow-publish
npm trust github create-mobigent-app --repo mobigent/mobigent --file release.yml --allow-publish
```

Then set the GitHub repository variable:

```txt
NPM_TRUSTED_PUBLISHING=true
```

The release workflow will publish through OIDC when `NPM_TOKEN` is absent and `NPM_TRUSTED_PUBLISHING=true`.

## Verify

After release:

```bash
npm run npm:status
npm view @mobigent/react-native version
npm view @mobigent/backend version
npm view create-mobigent-app version
```

Then test the real npm path:

```bash
npm create mobigent-app@latest my-demo -- --install
cd my-demo
npm run check
npm run dev
```
