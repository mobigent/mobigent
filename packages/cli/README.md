# mobigent

One friendly CLI for Mobigent.

Use this package when you want a single command to remember:

```bash
npx mobigent new my-demo --install
npx mobigent-backend --app-dir ../mobile-app
npx mobigent agent chatgpt --base-url https://your-backend.example
```

The runtime SDKs are still the two normal packages:

- `@mobigent/app` in the app
- `@mobigent/backend` in the backend

This CLI simply routes common commands so developers do not need to learn separate binary names on day one. App-side scaffolding is optional; the normal app path is `npm install @mobigent/app`, `defineFeature()`, and `withMobigent()`.

## Commands

```bash
mobigent new my-demo --install
mobigent create my-demo --install
```

Create a runnable starter with an app, backend, inspector, and agent playground.

```bash
mobigent init --feature expense --out-dir src
mobigent doctor --feature expense --out-dir src
mobigent security-doctor --feature expense
```

Optionally generate or check React Native app integration files.

```bash
mobigent backend --app-dir ../mobile-app
mobigent backend init --app-dir ../mobile-app
```

Create a backend entrypoint with `@mobigent/backend`.

```bash
mobigent agent claude
mobigent agent chatgpt --base-url https://your-backend.example
```

Print agent setup using the backend package.
