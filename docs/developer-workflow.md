# Mobigent Developer Workflow

Use this workflow when you are turning a proof of concept into an SDK integration other people can trust.

## 1. Start With One Real Capability

Expose one read function and one confirmed write function from a real feature. Write this directly in your app code:

```ts
import { createApp } from '@mobigent/app';

export const mobigent = createApp({
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input),
  },
});
```

Then wrap the app once with `mobigent.with(App)`. Use `write(createExpense, { input, confirm })` when you want validation and custom approval copy. Set `EXPO_PUBLIC_MOBIGENT_APP` and `MOBIGENT_APP` before production.

Do not start an existing app with the old app-side init command. It makes sample files, and sample files are not the integration. The integration is the app function object above.

## 2. Inspect The Gateway

Run the HTTP gateway and open the inspector:

```bash
npm run dev:http
open http://localhost:8788/inspect
```

The inspector shows connected apps, discovered tools, metrics, recent audit events, and the raw gateway snapshot.

## 3. Run The Security Doctor

Before sharing a gateway with a hosted agent, check transport and confirmation defaults:

```bash
npx mobigent app \
  --security-doctor \
  --app-id com.example.app \
  --app-name "Example App" \
  --feature expense \
  --gateway-url wss://gateway.example.com \
  --custom-confirmation
```

Use `wss://` for hosted gateways. Keep medium and high risk actions behind app-owned confirmation UI.

## 4. Bring Your Existing Schemas

Use built-in helpers, Zod, or TypeBox-style JSON Schema:

```ts
import { fromZod, fromTypeBox, schema } from '@mobigent/app';
import { z } from 'zod';

const zodInput = fromZod(
  z.object({
    merchant: z.string(),
    amount: z.number(),
  }),
);

const typeBoxInput = fromTypeBox({
  type: 'object',
  properties: {
    title: { type: 'string' },
  },
  required: ['title'],
});

const nativeInput = schema.object(
  {
    note: schema.string(),
  },
  { required: 'all' },
);
```

## 5. Generate Native Assistant Bridge Plans

Use the same capability contract as a starting point for iOS App Intents and Android App Actions:

```bash
npx mobigent app --platform-actions json \
  --app-id com.example.app \
  --app-name "Example App" \
  --feature expense

npx mobigent app --platform-actions ios-swift \
  --app-id com.example.app \
  --app-name "Example App" \
  --feature expense

npx mobigent app --platform-actions android-xml \
  --app-id com.example.app \
  --app-name "Example App" \
  --feature expense
```

These outputs are bridge plans, not magic app-store configuration. Review them, connect them to your native entry points, and keep Mobigent as the app-owned execution layer.

## 6. Install Packages

```bash
npm install @mobigent/app
npm install @mobigent/backend
```

For a runnable starter, use the normal npm create flow:

```bash
npm create mobigent-app@latest my-demo -- --install
```
