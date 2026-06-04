# Mobigent Developer Workflow

Use this workflow when you are turning a proof of concept into an SDK integration other people can trust.

## 1. Start With One Real Capability

Expose one read function and one confirmed write function from a real feature. Write this directly in your app code:

```ts
import { createApp, read, write } from "@mobigent/app";

export const mobigent = createApp({
  functions: {
    expense: {
      list: read(async () => ({ items: await listExpenses() })),
      create: write(async (input) => createExpense(input), {
        input: { merchant: "string", amount: "number" },
        confirm: true
      })
    }
  }
});
```

Then wrap the app once with `mobigent.with(App)`. Use generators only when you want sample files.

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
npx mobigent-init \
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
import { fromZod, fromTypeBox, schema } from "@mobigent/app";
import { z } from "zod";

const zodInput = fromZod(z.object({
  merchant: z.string(),
  amount: z.number()
}));

const typeBoxInput = fromTypeBox({
  type: "object",
  properties: {
    title: { type: "string" }
  },
  required: ["title"]
});

const nativeInput = schema.object({
  note: schema.string()
}, { required: "all" });
```

## 5. Generate Native Assistant Bridge Plans

Use the same capability contract as a starting point for iOS App Intents and Android App Actions:

```bash
npx mobigent-init --platform-actions json \
  --app-id com.example.app \
  --app-name "Example App" \
  --feature expense

npx mobigent-init --platform-actions ios-swift \
  --app-id com.example.app \
  --app-name "Example App" \
  --feature expense

npx mobigent-init --platform-actions android-xml \
  --app-id com.example.app \
  --app-name "Example App" \
  --feature expense
```

These outputs are bridge plans, not magic app-store configuration. Review them, connect them to your native entry points, and keep Mobigent as the app-owned execution layer.

## 6. Install Public Tarballs

Tagged releases attach public package tarballs to GitHub Releases:

```bash
npm install \
  https://github.com/mobigent/mobigent/releases/download/v0.1.14/mobigent-core-0.1.14.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.14/mobigent-react-native-0.1.14.tgz \
  https://github.com/mobigent/mobigent/releases/download/v0.1.14/mobigent-app-0.1.14.tgz
```

Use the starter tarball for the easiest first run:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.14/create-mobigent-app-0.1.14.tgz \
  -- create-mobigent-app my-demo --package-source github-release --install
```

After npmjs publishing is connected, the same packages can be installed with normal npm names.
