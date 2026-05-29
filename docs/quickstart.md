# Mobigent Quickstart

This guide gets you from an app with no agent interface to a working Mobigent loop: app SDK, backend SDK, discovered tools, confirmed action, and read resource.

## 1. Run The Starter

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.12/create-mobigent-app-0.1.12.tgz \
  -- create-mobigent-app my-demo --install
cd my-demo
npm run dev
```

Click **Run agent request** in the browser. That one click calls the app-owned `expense_create` action, asks for confirmation, and updates visible app state.

Run the starter doctor in another terminal:

```bash
npm run doctor
```

For this repository checkout:

```bash
npm install
npm run demo:app
```

The demo starts a Mobigent backend, connects a sample expense app, calls a confirmed write action, then reads the updated expense list.

## 2. Add One Feature To An Existing App

Install the app SDK and scaffold the small Mobigent folder from the backend config:

```bash
npm install @mobigent/react-native
npx mobigent init --feature expense --out-dir src
```

Create a feature file:

```ts
import { defineFeature } from "@mobigent/react-native";

export const expenses = defineFeature("expense")
  .read("list", async () => ({ items: await listExpenses() }))
  .write("create", async (input) => createExpense(input), {
    input: {
      merchant: "string",
      amount: "number",
      notes: "string"
    },
    confirm: true
  });
```

Put the backend-generated config in your app, then wrap your existing app once:

```tsx
import { setupMobigent } from "@mobigent/react-native";
import { mobigentConfig } from "./mobigent/config";
import { expenses } from "./mobigent/expenses";

const { Root } = setupMobigent({
  config: mobigentConfig,
  features: [expenses]
});

export default function App() {
  return (
    <Root>
      <YourExistingApp />
    </Root>
  );
}
```

For a non-React demo or test host, connect the same feature in one call:

```ts
import { startMobigent } from "@mobigent/backend";
import { connectMobigent } from "@mobigent/react-native";
import { expenses } from "./mobigent/expenses";

const backend = await startMobigent({
  app: {
    id: "com.example.app",
    name: "Example App"
  }
});
await connectMobigent({
  config: backend.defaultApp,
  features: [expenses]
});
```

## 3. Run The Backend

Generate the backend entrypoint and app config:

```bash
npm install @mobigent/backend
npx mobigent-backend init
```

Mobigent infers starter app identity from the project. Pass `--app-id` and `--app-name` only when you want exact production values.

That creates `mobigent.app.json` with a simple `connectionUrl`. Put that file in the app project, then the app init command auto-detects it:

```bash
npm install @mobigent/react-native
npx mobigent init --feature expense --out-dir src
```

If you run the app init command before copying `mobigent.app.json`, it still works: Mobigent infers a starter app id/name from the React Native app's `package.json` and uses the local connection URL.

In your server:

```ts
import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent();

console.log(mobigent.urls.inspector);

const appConfig = mobigent.defaultApp;

console.log(mobigent.copyAppConfig());
```

With no options, Mobigent infers a starter app id and app name from your project. Pass `app: { id, name }` when you want exact production values.

Need agent setup? Use the same backend object:

```ts
console.log(mobigent.agent("chatgpt").endpoints.openApi);
console.log(mobigent.agent("claude").guide);
```

For local checks:

```bash
curl http://localhost:8788/health
curl http://localhost:8788/tools
curl http://localhost:8788/openapi.json
```

## 4. Connect From A Device

Use the right WebSocket URL for the runtime:

- iOS simulator: `ws://localhost:8787`
- Android emulator: `ws://10.0.2.2:8787`
- physical device: `ws://YOUR_MAC_LAN_IP:8787`
- hosted gateway: `wss://your-gateway.example.com`

## 5. Verify The Loop

You know the first integration works when:

- `/health` reports one connected app
- `/tools` shows your resource and action
- the write action pauses for confirmation in the app
- the handler only runs after approval
- the resource returns the updated state
- `/audit` shows the call, approval, result, and any emitted app events

## Next Steps

After the first loop works, add more features by product area. Keep each feature small. Start with reads, then add confirmed writes for anything that can change user data, spend money, send messages, or expose sensitive information.
