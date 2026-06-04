# mobigent

One friendly CLI for Mobigent.

Use this package when you want a single command to remember:

```bash
npx mobigent new my-demo --install
npx mobigent agent chatgpt --base-url https://your-backend.example
```

The runtime SDKs are still the two normal packages:

- `@mobigent/app` in the app
- `@mobigent/backend` in the backend

This CLI simply routes common commands so developers do not need to learn separate binary names on day one. App-side and backend scaffolding are optional; the normal SDK path is `npm install @mobigent/app`, `npm install @mobigent/backend`, `createApp(appId, functions).with(App)`, and `startMobigent(appId)`.

You do not need the app-side init command for a real integration. Write the functions directly in your app code. The generator exists only when you want sample files.

## Common Commands

```bash
mobigent new my-demo --install
mobigent create my-demo --install
```

Create a runnable starter with an app, backend, inspector, and agent playground.

```bash
mobigent agent claude
mobigent agent chatgpt --base-url https://your-backend.example
```

Print agent setup using the backend package.

## Optional Scaffolding

```bash
mobigent backend --app com.acme.expenses
```

Generate a backend entrypoint if you do not want to write it by hand.

```bash
mobigent app --feature expense --out-dir src
mobigent app --doctor --feature expense --out-dir src
mobigent app --security-doctor --feature expense
```

Generate or check React Native sample integration files. This is demo scaffolding, not the main SDK path.
