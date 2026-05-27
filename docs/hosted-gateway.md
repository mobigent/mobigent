# Hosted Gateway And Tunnel Setup

Use localhost while building. Use a hosted gateway or tunnel when a cloud agent needs to call your app.

## Local Development Tunnel

Start the gateway:

```bash
npm run dev:http
```

Expose the HTTP port with a tunnel:

```bash
cloudflared tunnel --url http://localhost:8788
```

or:

```bash
ngrok http 8788
```

Use the public HTTPS URL for OpenAPI providers:

```text
https://your-tunnel.example/openapi.json
```

Use the matching WSS URL in the mobile app:

```text
wss://your-tunnel.example
```

## Production Gateway Checklist

- Run `mobigent-http` behind HTTPS/WSS.
- Require a Mobigent HTTP API key or per-agent API keys.
- Restrict CORS origins for browser-based tools.
- Keep signed manifests enabled for app sessions that need stronger provenance.
- Monitor `/health`, `/ready`, `/metrics`, `/metrics/prometheus`, `/apps`, and `/audit`.
- Use `/inspect` only for trusted development or protected internal environments.

## ChatGPT Actions

Point ChatGPT Actions at:

```text
https://your-gateway.example.com/openapi.json
```

Then pass the configured bearer token or API key in the action authentication settings.
