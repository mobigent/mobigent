# @mobigent/backend

Run Mobigent from normal Node code.

```ts
import { startMobigentBackend } from "@mobigent/backend";

const mobigent = await startMobigentBackend();

console.log(mobigent.urls.inspector);
console.log(mobigent.urls.openapi);

const appConfig = mobigent.app({
  appId: "com.example.app",
  appName: "Example App"
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

## App Config

Use `mobigent.app()` to create the small config object your app SDK needs:

```ts
const appConfig = mobigent.app({
  appId: "com.example.app",
  appName: "Example App"
});
```

That config includes the app id, app name, WebSocket URL, version, and app token when `appToken` or `MOBIGENT_AUTH_TOKEN` is configured.

Use `mobigent.appConfigModule()` when you want a copy-paste TypeScript file for the mobile app:

```ts
console.log(mobigent.appConfigModule({
  appId: "com.example.app",
  appName: "Example App"
}));
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
