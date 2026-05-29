# @mobigent/backend

Run Mobigent from normal Node code.

```bash
npm install @mobigent/backend
npx mobigent-backend init --app-dir ../mobile-app
```

That creates `src/mobigent.ts`, `.env.mobigent`, and `mobigent.app.json`.
When `--app-dir` is present, it also writes `../mobile-app/mobigent.app.json` so the app SDK can auto-detect the connection.
If your app is in a sibling folder and this backend folder is named `backend`, `server`, `api`, `agent-server`, or `mobigent-backend`, the app initializer can auto-detect the backend config without `--app-dir`.
Mobigent infers a starter app id and app name from the app project when `--app-dir` is present. Override them with `--app-id` and `--app-name` when you want exact production values.

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appDir: "../mobile-app"
});
await mobigent.ready();

console.log(mobigent.urls.inspector);
console.log(mobigent.urls.openapi);

const appConfig = mobigent.defaultApp;
```

With no options, Mobigent infers a starter app id and app name from the nearest `package.json` or folder. When `appDir` is set, it infers from that app project and writes `../mobile-app/mobigent.app.json` automatically. Pass `app` only when you want exact production values:

```ts
const mobigent = await startMobigent({
  appDir: "../mobile-app",
  app: {
    id: "com.example.app",
    name: "Example App"
  }
});
```

This starts:

- app connections
- agent HTTP API
- OpenAPI schema
- inspector
- tool routing
- readiness checks
- audit events

`mobigent.ready()` waits until at least one app has connected and exposed a function. Use it before backend-driven tests, demos, or server code that immediately calls app functions.

It also gives agent setup from the same object:

```ts
console.log(mobigent.agent("chatgpt").endpoints.openApi);
console.log(mobigent.agent("claude").guide);
console.log(mobigent.agent("openai").runtimeEnv);
```

For local MCP agents, this package ships the `mobigent-mcp` command too. That means a backend install is enough:

```bash
npx mobigent-backend agent claude
```

## App Config

Use `mobigent.defaultApp` to get the small config object your app SDK needs:

```ts
const mobigent = await startMobigent();

const appConfig = mobigent.defaultApp;
```

That config includes the app id, app name, connection URL, version, and app token when `appToken` or `MOBIGENT_AUTH_TOKEN` is configured.

If you did not pass `--app-dir`, put the generated `mobigent.app.json` in the app project, then run:

```bash
npx mobigent init --feature expense --out-dir src
```

For custom folder layouts, run the app initializer with:

```bash
npx mobigent init --feature expense --out-dir src --backend-dir ../server
```

Use `mobigent.copyAppConfig()` when you want a copy-paste TypeScript file for the mobile app:

```ts
console.log(mobigent.copyAppConfig());
```

It prints:

```ts
import { defineMobigentConfig } from "@mobigent/react-native";

export const mobigentConfig = defineMobigentConfig({
  "appId": "com.example.app",
  "appName": "Example App",
  "connectionUrl": "ws://localhost:8787"
});
```

## Call A Tool From Code

```ts
const result = await mobigent.call("expense.create", {
  merchant: "Airport Taxi",
  amount: 42.25
});
```

Use `feature.action` for writes and `feature.resource` for reads. Mobigent resolves the connected app prefix for you.

## Connect An Agent

```ts
const chatgpt = mobigent.agent("chatgpt", {
  publicUrl: "https://your-public-backend.example"
});

console.log(chatgpt.endpoints.openApi);
```

Use `"claude"` for local Claude Desktop setup, `"cursor"` for Cursor, and `"openai"` for a server-side OpenAI Responses loop. You can still list every supported integration with `mobigent.agents()`.

## Stop

```ts
await mobigent.stop();
```

Use this package when you want Mobigent to feel like backend plumbing, not a stack of separate gateway commands.
