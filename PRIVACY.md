# Privacy and data handling

This document describes the code in this repository. A third-party deployment's operator and hosting provider can have additional practices.

## File imports and reading state

Files are parsed in the browser. ZIP imports read likes entries only and skip unrelated archive entries; no archive is uploaded. Imported saves, tags, and reading status are stored in localStorage under `savedesk-v1` for that origin. In device-only mode, the app does not upload imported saves. In account mode, extracted saves sync to the configured Supabase project as described below. Neither mode uploads the original archive, loads post embeds, or includes analytics. Clearing site data deletes the local library. Export a backup first if you want to keep it.

The public demo is served by GitHub Pages, whose provider may log ordinary HTTP requests. Opening a post on X sends you to X. README badge images are external resources on GitHub's README page; they are not included in the app.

## X connection

X handles account sign-in. SaveDesk requests read-only profile, post, like, and bookmark access. The server receives the OAuth authorization code and exchanges it for an access token. It keeps that token, account details, and session expiry in process memory. The browser receives an opaque HttpOnly session cookie, not the token.

Sync sends authenticated API requests from the server to X and returns available post text and authors to your browser. Imported results are stored in the current library: locally in device-only mode, or locally and in Supabase when signed into a cloud account. Sessions expire within two hours or on restart. The X connection has no refresh tokens or scheduled sync. Its Node server does not store your collection.

Disconnect clears the server session and cookie. It does not erase imported browser data or revoke the app's grant at X. You can revoke that separately in X's connected-app settings.

## Publishing and backups

**Download backup** downloads saves, tags, sources, and reading status. **Download website data** omits reading status, but includes the saved content and tags. Neither button uploads the download automatically.

Replacing a public repository's `collection.json` publishes that content to repository visitors and the site. The app fetches this file at startup. Removing a file later does not erase Git history, forks, caches, or downloaded copies. Only publish content you intend to share and have the right to share. The repository license does not cover third-party posts.

## Your controls

- Export a local backup before clearing site data.
- Clear site storage to remove the local collection, then disconnect or revoke X access as appropriate.
- A hosted public collection will load again on a new visit unless removed by its publisher.
- For questions about a deployment's data handling, contact that deployment's operator. Use [SECURITY.md](SECURITY.md) for vulnerabilities in this code.

## Sharing a file and copying to a chat

**Download shareable page** creates an HTML file containing all saved text, authors, topics, and source links, without reading state. Anyone with the file can read it. It works locally, and does not load remote content automatically. The app does not send this file for you.

**Copy for an AI chat** puts selected posts and source links on your clipboard, or shows the text for manual copying. Nothing is sent to an AI service by Savedesk. If you paste it into another service, that service's data policies apply. Treat imported posts as untrusted quoted content.

## Optional accounts and cloud storage

When configured by a site operator, Supabase handles Google, GitHub, Microsoft, and Apple sign-in and stores each account's library. Identity information follows the selected provider's consent and Supabase settings. Account sign-in does not import that provider's saved content. The Supabase SDK manages access and refresh tokens in browser storage. These tokens are accessible to scripts on the same origin, unlike the X server's HttpOnly session cookie.

Signing in opens a separate account library. **Add this device’s saves** explicitly copies device-only saves into it. New imports, topics, sources, and reading state in this account library are uploaded to the configured project. Row-level security restricts ordinary users to their own rows; the project operator and privileged infrastructure still have administrative access. Data is not end-to-end encrypted by SaveDesk.

Local account caches use `savedesk-account-<user-id>` and remain after sign-out for offline recovery. Sign-out returns to the device-only library and ends the current browser's account session; it does not sign out all other devices, erase caches, or revoke a provider grant. Clear site data on a shared device. A cloud library can reload after signing in again.

The operator can delete your Supabase Auth account, which deletes its database library, but copies in browser caches, exports, and provider backups require separate handling. SaveDesk has no self-service account deletion screen yet. Contact the deployment operator for deletion and retention details. Optional cloud storage does not publish a collection; sharing/exporting remain explicit actions. [Setup and limits](docs/ACCOUNTS.md).
