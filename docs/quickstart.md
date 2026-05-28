# Mobigent Quickstart

This guide gets you from an app with no agent interface to a working Mobigent loop: app SDK, gateway, discovered tools, confirmed action, and read resource.

## 1. Run The Starter

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.1/create-mobigent-app-0.1.1.tgz \
  -- create-mobigent-app my-demo --install
cd my-demo
npm run dev
```

Click **Run agent request** in the browser. That one click calls the Mobigent gateway, runs the app-owned `create_expense` action, asks for confirmation, and updates visible app state.

Run the starter doctor in another terminal:

```bash
npm run doctor
```

For this repository checkout:

```bash
npm install
npm run demo:app
```

The demo starts a gateway, connects a sample expense app, calls a confirmed write action, then reads the updated expense list.

## 2. Generate A Starter Module

```bash
npx mobigent-init \
  --app-id com.example.app \
  --app-name "Example App" \
  --feature expense \
  --out-dir src \
  --expo-router \
  --custom-confirmation
```

This creates:

- `src/mobigent.tsx`: app wrapper and gateway connection setup
- `src/mobigent-features/expense.ts`: one namespaced capability module
- `src/mobigent-confirmation.tsx`: editable native approval UI
- `app/_layout.tsx`: Expo Router wrapper when `--expo-router` is used

## 3. Register One Read And One Write

Start narrow. A good first integration exposes:

- one resource, such as `expense.list`
- one confirmed action, such as `expense.create`

```ts
import { createAgentModule, createAgentPolicy, schema } from "@mobigent/react-native/app";

export const expenseModule = createAgentModule({
  namespace: "expense",
  resources: [
    {
      name: "list",
      description: "Read the user's saved expenses.",
      outputSchema: schema.object({
        items: schema.array(schema.object({
          id: schema.string(),
          merchant: schema.string(),
          amount: schema.number()
        }))
      }),
      read: async () => ({ items: await listExpenses() })
    }
  ],
  actions: [
    {
      name: "create",
      description: "Create an expense after the user approves it.",
      inputSchema: schema.object({
        merchant: schema.string(),
        amount: schema.number()
      }, { required: "all" }),
      confirmation: {
        required: true,
        risk: "medium",
        title: "Create expense?"
      },
      policy: createAgentPolicy("user-required").policy,
      handler: async (input) => createExpense(input)
    }
  ]
});
```

## 4. Run The Gateway

For local HTTP/OpenAPI testing:

```bash
npx mobigent-http
curl http://localhost:8788/health
curl http://localhost:8788/tools
curl http://localhost:8788/openapi.json
```

For MCP clients:

```bash
npx mobigent-mcp
```

## 5. Connect From A Device

Use the right WebSocket URL for the runtime:

- iOS simulator: `ws://localhost:8787`
- Android emulator: `ws://10.0.2.2:8787`
- physical device: `ws://YOUR_MAC_LAN_IP:8787`
- hosted gateway: `wss://your-gateway.example.com`

## 6. Verify The Loop

You know the first integration works when:

- `/health` reports one connected app
- `/tools` shows your resource and action
- the write action pauses for confirmation in the app
- the handler only runs after approval
- the resource returns the updated state
- `/audit` shows the call, approval, result, and any emitted app events

## Next Steps

After the first loop works, add more modules by feature area. Keep each module small, with explicit schemas and approvals for any action that can change user data, spend money, send messages, or expose sensitive information.
