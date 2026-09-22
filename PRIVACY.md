# Privacy and data handling

This document describes the code in this repository. A third-party deployment's operator and hosting provider can have additional practices.

## File imports and reading state

Files are parsed in the browser. ZIP imports read likes entries only and skip unrelated archive entries; no archive is uploaded. Imported saves, tags, and reading status are stored in localStorage under `savedesk-v1` for that origin. The app does not upload file imports to its server, load post embeds, or include analytics. Clearing site data deletes the local library. Export a backup first if you want to keep it.

The public demo is served by GitHub Pages, whose provider may log ordinary HTTP requests. Opening a post on X sends you to X. README badge images are external resources on GitHub's README page; they are not included in the app.

## X connection

X handles account sign-in. Savedesk requests read-only profile, post, like, and bookmark access. The server receives the OAuth authorization code and exchanges it for an access token. It keeps that token, account details, and session expiry in process memory. The browser receives an opaque HttpOnly session cookie, not the token.

Sync sends authenticated API requests from the server to X and returns available post text and authors to your browser. Imported results are then stored locally. Sessions expire within two hours or on restart. There are no refresh tokens, scheduled syncs, or server-side collection databases.

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
