# @mobigent/backend

Run Mobigent from normal Node code.

```bash
npm install @mobigent/backend
npx mobigent-backend init --app-id com.example.app --app-name "Example App"
```

That creates `src/mobigent.ts` and `.env.mobigent`.

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

## Stop

```ts
await mobigent.stop();
```

Use this package when you want Mobigent to feel like backend plumbing, not a stack of separate gateway commands.
