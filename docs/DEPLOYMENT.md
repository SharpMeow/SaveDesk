# Deployment

## Static site or GitHub Pages

Static hosting supports file imports, search, tags, the reading queue, and exports. It cannot run the X OAuth server.

1. Fork this repository.
2. Keep `collection.json` empty for a demo, or replace it with your reviewed **Download website data** file.
3. In your fork, choose **Settings → Pages → Deploy from a branch → main → / (root)**.
4. Wait for the Pages deployment to succeed, then open the reported site URL.

The app uses relative asset paths and works at a Pages project path. `collection.json` is fetched on page load. Importing a file or editing tags in the browser does not update GitHub; publish a new export to change the shared collection. Reader progress stays in each browser.

The default Node server's file allowlist does not serve repository documentation or artwork. These are rendered on GitHub and are not required for the app UI.

## Node.js hosting with X login

Use a supported Node.js LTS release on a host that can keep a single Node process running. There are no dependencies or build steps. The start command is `npm start`.

Configure environment variables in the host's secret settings:

| Variable | Purpose |
| --- | --- |
| `X_CLIENT_ID` | Your OAuth 2.0 app Client ID. |
| `X_CLIENT_SECRET` | Your Web App's OAuth 2.0 secret. |
| `APP_URL` | Exact external origin, such as `https://savedesk.example.com`. |
| `HOST` | `0.0.0.0` when the hosting platform needs access to the process. |
| `PORT` | The platform-provided port, or 4173. |

Register `https://savedesk.example.com/auth/callback` in your X developer app, using your actual hostname. Keep frontend, OAuth callback, and API on the same origin. The server expects to live at the origin root; path-prefixed OAuth deployments are not supported.

Terminate HTTPS at the host or reverse proxy. `APP_URL` must use the external HTTPS origin even if the internal Node listener uses HTTP. The server uses that value for callback construction, Secure cookies, and origin checks. Do not cache `/auth/*` or `/api/*`, and do not record query strings containing authorization codes.

Use a **single instance**. Sessions are in memory, expire within two hours, and disappear on restart. Horizontal scaling, durable sessions, background sync, and public-service abuse protection are not included. Read [SECURITY.md](../SECURITY.md) before operating a shared server. A public service also needs an operator-specific privacy statement and appropriate controls for API usage.

## Updating and validating

Back up your published collection and any browser library you need to retain. Pull the desired version, run `npm test`, and restart the Node process. Server users will need to reconnect after a restart.

For a smoke check, open the site, search the demo collection, inspect **Get started**, import a fictional ZIP, and verify that X sign-in appears only when the server is configured. Do not claim live sync works based only on automated tests. A real account test requires your app credentials and entitlement.
