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
- ZIP parsing uses a locally bundled, MIT-licensed fflate release. Compressed archives are limited to 200 MB and selected likes entries to 50 MB and 100 parts. Other entries are skipped. Updates must preserve the upstream license.
- Imports run in a dedicated worker with a 30-second deadline. Record and field limits also bound content before rendering; they do not guarantee a large collection will fit browser storage.
- The Node server sends a Content Security Policy and denies framing. The static app includes a meta policy restricting executable content, but static hosts must configure their own framing headers.
- Pending logins and sessions each have a 256-entry cap. Only one upstream sync request can run per session at a time. These bounds do not replace production rate limiting.
- Shared HTML escapes imported text and includes no reading-state data. Copying selected posts never submits them to an AI service.
- Imported text is rendered as text and archive assignments are parsed as JSON, not executed.
- Browser storage is not encrypted by Savedesk. Use a dedicated origin, a trusted browser profile, and a trusted server operator.

The server is intended for local use or a small deployment you control. It has no durable sessions, application-level rate limiting, multi-instance session sharing, or production abuse controls. Review and add those before offering unrestricted public OAuth access. Server operators must avoid logging authorization codes, cookies, tokens, or imported data in proxies and monitoring tools.
