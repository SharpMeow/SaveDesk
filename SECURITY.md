# Security

## Support status

Savedesk is an early prototype. Security fixes target the current `main` branch. There is no dedicated security team, response-time guarantee, or independent security audit.

## Report a vulnerability

If the repository's Security tab offers **Report a vulnerability**, use that private reporting channel. If private reporting is unavailable, open an issue titled **Request for a private security contact**, containing no vulnerability details, proof of concept, personal data, or credentials. Wait for a private channel before sharing technical details. Do not post secrets or exploit details publicly.

Include the affected commit, impact, minimal reproduction with fictional data, and any suggested fix once a private channel is available.

## Deployment boundaries

- Client secrets and access tokens belong on the server. `.env` is ignored by Git.
- The server uses PKCE, expiring one-use OAuth state, HttpOnly cookies, SameSite=Lax, and origin checks for sync/disconnect requests. HTTPS deployments set Secure cookies.
- Sessions and tokens are in memory and expire within two hours. Restarting loses them. Disconnect removes the local server session; revoke the app in X to remove its authorization grant.
- The Node server exposes an explicit file allowlist. Static hosting can expose committed source files, so never commit secrets anywhere in the repository.
- Imported text is rendered as text and archive assignments are parsed as JSON, not executed.
- Browser storage is not encrypted by Savedesk. Use a dedicated origin, a trusted browser profile, and a trusted server operator.

The server is intended for local use or a small deployment you control. It has no durable sessions, application-level rate limiting, multi-instance session sharing, or production abuse controls. Review and add those before offering unrestricted public OAuth access. Server operators must avoid logging authorization codes, cookies, tokens, or imported data in proxies and monitoring tools.
