# @mobigent/backend

Run the Mobigent backend from normal Node code.

```ts
import { startMobigentBackend } from "@mobigent/backend";

const mobigent = await startMobigentBackend();

console.log(mobigent.urls.inspector);
console.log(await mobigent.tools());
```

This starts:

- the app WebSocket endpoint
- the agent HTTP API
- OpenAPI schema
- inspector
- gateway routing

Use this when you want Mobigent to feel like normal backend plumbing instead of a stack of separate gateway commands.
