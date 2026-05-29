# create-mobigent-app

Create a runnable Mobigent starter with a visible app, backend, inspector, and agent playground.

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.8/create-mobigent-app-0.1.8.tgz \
  -- create-mobigent-app my-demo --install
cd my-demo
npm run dev
```

The starter opens a browser page where one click calls a Mobigent tool and updates app state.

Edit `src/capabilities.ts` first. That file contains the sample app state and one simple Mobigent feature:

```ts
feature("expense")
  .read("list", listExpenses)
  .write("create", createExpense, { input: { amount: "number", merchant: "string" } })
```

Replace the sample functions with your real app functions.

Run this in another terminal while the starter is running:

```bash
npm run doctor
```

It checks the visible app, backend health, readiness, and expected Mobigent tool.

Then print copy-paste agent setup:

```bash
npm run agent:local
npm run agent:openapi
npm run agent:chatgpt
```

Use `--no-open` when you do not want the browser to open automatically:

```bash
npm exec --yes \
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.8/create-mobigent-app-0.1.8.tgz \
  -- create-mobigent-app my-demo --no-open
```

Skip `--install` when you want to review files before installing dependencies.

Mobigent makes mobile apps agent-ready through safe, typed capabilities instead of brittle screen tapping.
