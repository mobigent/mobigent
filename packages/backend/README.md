# @mobigent/backend

Run Mobigent from normal Node code.

```bash
npm install @mobigent/backend
npx mobigent-backend init --app-id com.example.app
```

That creates `src/mobigent.ts`, `.env.mobigent`, and `mobigent.app.json`.

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  app: {
    id: "com.example.app",
    name: "Example App"
  }
});

console.log(mobigent.urls.inspector);
console.log(mobigent.urls.openapi);

const appConfig = mobigent.defaultApp;
```

This starts:

- app connections
- agent HTTP API
- OpenAPI schema
- inspector
- tool routing
- readiness checks
- audit events

It also gives agent setup from the same object:

```ts
console.log(mobigent.agent("chatgpt").endpoints.openApi);
console.log(mobigent.agent("claude").guide);
console.log(mobigent.agent("openai").runtimeEnv);
```

## App Config

Pass `app` to `startMobigent()` to create the small config object your app SDK needs:

```ts
const mobigent = await startMobigent({
  app: {
    id: "com.example.app",
    name: "Example App"
  }
});

const appConfig = mobigent.defaultApp;
```

That config includes the app id, app name, WebSocket URL, version, and app token when `appToken` or `MOBIGENT_AUTH_TOKEN` is configured.

Put the generated `mobigent.app.json` in the app project, then run:

```bash
npx mobigent init --feature expense --out-dir src
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
  "gatewayUrl": "ws://localhost:8787"
});
```

## Call A Tool From Code

```ts
const result = await mobigent.call("com_example_app.expense_create", {
  merchant: "Airport Taxi",
  amount: 42.25
});
```

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
