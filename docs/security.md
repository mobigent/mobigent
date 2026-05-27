# Security Model

Mobigent is designed around one rule: the app stays in charge. Agents can only see and call capabilities the app explicitly declares.

## Layers

1. App SDK registration defines the possible actions, resources, components, and events.
2. JSON schemas validate inputs before handlers run.
3. Confirmation policies pause risky actions inside the app.
4. Gateway policy filters discovery and calls per agent.
5. HTTP auth protects hosted gateway endpoints.
6. Audit logs record calls, approvals, denials, errors, and app events.

## App-Side Rules

Production apps should:

- register the smallest useful capabilities
- require confirmation for medium and high risk writes
- show native approval UI with the action name, input summary, and risk
- never put secrets in event payloads or action results
- keep business authorization inside the app's existing service layer
- use signed manifests when connecting to a shared or hosted gateway

If no confirmation handler is configured, native SDKs allow confirmed actions by default for developer ergonomics. Production apps should always install a handler before enabling write actions.

## Gateway Rules

Production gateways should enable:

```bash
MOBIGENT_AUTH_TOKEN=app-session-secret
MOBIGENT_HTTP_API_KEY=agent-http-secret
MOBIGENT_ALLOWED_APP_IDS=com.example.app
MOBIGENT_MANIFEST_SIGNING_SECRET=manifest-secret
MOBIGENT_AUDIT_LOG_PATH=/data/mobigent-audit.jsonl
MOBIGENT_HTTP_CORS_ORIGINS=https://your-admin.example.com
MOBIGENT_HTTP_JSON_LIMIT=256kb
npx mobigent-http
```

For multiple providers, use per-agent keys:

```bash
MOBIGENT_HTTP_AGENT_API_KEYS='{"chatgpt-actions":"chatgpt-secret","cursor":"cursor-secret"}' npx mobigent-http
```

Per-agent keys bind discovery, calls, metrics, idempotency, and audit entries to a trusted agent id.

## Agent Profiles

Agent profiles let the gateway narrow what each provider can discover or call:

```bash
MOBIGENT_AGENT_PROFILES='{
  "chatgpt-actions": {
    "readOnly": true,
    "maxRisk": "low",
    "allowedTools": ["com_example_expenses.*"]
  },
  "cursor": {
    "allowedTools": ["com_example_expenses.*"],
    "deniedTools": ["com_example_expenses.delete_*"]
  },
  "*": {
    "readOnly": true,
    "maxRisk": "low"
  }
}' npx mobigent-http
```

## Confirmation Policy

Use risk levels consistently:

- `low`: reversible app-local changes
- `medium`: user-visible writes, updates, or drafts
- `high`: irreversible writes, money movement, messages, deletion, account changes, private data export

High risk actions should include a clear title and message. The approval UI should show the important input fields and require an explicit user decision.

## Audit And Privacy

Audit logs are useful for debugging and compliance, but they can become sensitive. Mobigent redacts common secret keys by default. Add app-specific redaction keys for personal data:

```bash
MOBIGENT_AUDIT_REDACT_KEYS=email,ssn,cardNumber npx mobigent-http
```

Store audit files in private infrastructure and rotate them like application logs.

## Threats To Avoid

- exposing one broad `execute` action
- letting hosted agents call a local gateway without auth
- importing OpenAPI schemas without agent scoping
- returning entire user records when a summary is enough
- using confirmations as the only authorization check
- treating UI automation as equivalent to declared capabilities

Mobigent should make agent access explicit, typed, reviewable, and auditable.
