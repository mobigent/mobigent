# Security Policy

Mobigent lets agents call mobile app capabilities, so security issues are taken seriously.

## Supported Versions

The project is pre-1.0. Security fixes are applied to the latest published version.

## Reporting A Vulnerability

Please do not open a public issue for sensitive reports.

For now, report vulnerabilities privately to the project maintainer once a public repository is created. Include:

- affected package and version
- reproduction steps
- expected and actual behavior
- possible impact
- suggested fix, if known

## Security Defaults

- Consequential actions should require app-side confirmation.
- Use `MOBIGENT_AUTH_TOKEN` whenever exposing the gateway outside localhost.
- Use `MOBIGENT_HTTP_API_KEY` whenever exposing the HTTP API outside localhost.
- Do not expose the local gateway directly to the public internet without TLS and authentication.
- Prefer least-privilege capability schemas.
- Use `allowedAgents` to restrict sensitive actions to known provider ids.
- Use `rateLimitPerMinute` for actions that can create cost, mutate state, or trigger external effects.
- Pass `x-mobigent-agent` from HTTP/OpenAPI providers so gateway policies can distinguish callers.
- Subscribe to `gateway.onAudit()` and persist production audit events outside the gateway process.
