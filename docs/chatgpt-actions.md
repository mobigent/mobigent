# Testing Mobigent From ChatGPT

ChatGPT Actions call HTTPS APIs described by an OpenAPI schema. Mobigent exposes an HTTP wrapper around the local gateway for this path.

## 1. Start the HTTP Gateway

```bash
npm run dev:http
```

This starts:

- WebSocket app bridge on `ws://localhost:8787`
- HTTP API on `http://localhost:8788`
- OpenAPI schema at `http://localhost:8788/openapi.json`

## 2. Start the Example App

```bash
npm run dev:app
```

## 3. Expose the HTTP Port

Use an HTTPS tunnel. For anything beyond local testing, set a shared app token first:

```bash
MOBIGENT_AUTH_TOKEN=dev-secret MOBIGENT_HTTP_API_KEY=http-secret npm run dev:http
MOBIGENT_AUTH_TOKEN=dev-secret npm run dev:app
```

Then expose the HTTP port:

```bash
ngrok http 8788
```

Copy the HTTPS URL.

## 4. Create a Custom GPT Action

In the Custom GPT builder:

1. Open Actions.
2. Import the OpenAPI schema from `https://YOUR-TUNNEL/openapi.json`.
3. Configure bearer auth with `http-secret` when `MOBIGENT_HTTP_API_KEY` is set.
4. Save and test one of the concrete tool operations.

Start the app before importing the schema. Mobigent generates one explicit OpenAPI operation per connected tool, for example:

```text
POST /tools/com_mobigent_expenses.create_expense/call
```

It also keeps the generic compatibility operation:

```text
POST /tools/{toolName}/call
```

## 5. Try A Prompt

```text
List the tools available in my Mobigent mobile app, then create an expense for Airport Taxi for 42.25 under Travel.
```

The current example app auto-approves confirmations in the terminal, but a real React Native integration should show a native confirmation modal.
