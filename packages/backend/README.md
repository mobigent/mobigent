# @mobigent/backend

Run Mobigent from normal Node code.

```ts
import { startMobigentBackend } from "@mobigent/backend";

const mobigent = await startMobigentBackend();

console.log(mobigent.urls.inspector);
console.log(mobigent.urls.openapi);
```

This starts:

- app connections
- agent HTTP API
- OpenAPI schema
- inspector
- tool routing
- readiness checks
- audit events

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
