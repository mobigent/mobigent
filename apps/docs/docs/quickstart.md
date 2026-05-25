---
sidebar_position: 2
---

# Quickstart

Install dependencies and run the local demo:

```bash
npm install
npm run demo
```

The demo starts a gateway, connects the example expense app, discovers its tools, creates an expense, runs confirmation, and reads the expense list.

For app and provider setup, generate reviewable integration artifacts:

```bash
npx mobigent-rn-init --write-manifest ./mobigent-integration.json --app-id com.example.expenses --app-name "Example Expenses" --feature expense --out-dir src
npx mobigent-rn-init --write-contract ./mobigent-contract.json --app-id com.example.expenses --app-name "Example Expenses" --feature expense
npx mobigent-provider --write-matrix ./mobigent-providers.json --base-url http://localhost:8788
```

See [Integration Artifacts](./integration-artifacts.md) for the CI workflow and what each file proves.

Run the offline agent-side demo:

```bash
npm run demo -w @mobigent/example-agent-server
```

It shows the same app capability mapped into OpenAI, Anthropic, Gemini, AWS Bedrock Converse, and Vercel AI SDK tool shapes, then executes the tool through the Mobigent HTTP client.

Run the provider runtime starter against a live HTTP gateway:

```bash
MOBIGENT_PROVIDER=anthropic-tool-use \
MOBIGENT_MIN_APPS=1 \
MOBIGENT_MIN_TOOLS=1 \
MOBIGENT_HTTP_URL=http://localhost:8788 \
npm run runtime -w @mobigent/example-agent-server
```

For a live HTTP/OpenAPI demo:

```bash
npm run dev:http
npm run dev:app
```

Then call:

```bash
curl http://localhost:8788/tools
curl -X POST http://localhost:8788/tools/com_mobigent_expenses.create_expense/call \
  -H "content-type: application/json" \
  -d '{"amount":42.25,"merchant":"Airport Taxi","category":"Travel"}'
```
