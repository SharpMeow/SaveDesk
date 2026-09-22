<p align="center">
  <img src="docs/assets/savedesk-banner.png" alt="Savedesk: Your saved internet. Saved ideas arranged into an organized library." width="100%">
</p>

# Savedesk

**A calmer home for your X likes and bookmarks.** Search a compact card grid, organize ideas with topics, and work through an unread queue at your own pace.

[Try the demo](https://sharpmeow.github.io/savedesk/) · [Get started](#quick-start) · [Connect X](#connect-x) · [Contribute](CONTRIBUTING.md)

[![CI](https://github.com/SharpMeow/savedesk/actions/workflows/ci.yml/badge.svg)](https://github.com/SharpMeow/savedesk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-47734f.svg)](LICENSE)

## What it does

- Import X archive likes, compatible JSON exports, or a Savedesk backup.
- Search post text, authors, and tags. Filter likes, bookmarks, topics, and reading status.
- Merge duplicate posts while preserving their sources, tags, and reviewed status.
- Connect your own X developer app for read-only, manual likes and bookmarks sync.
- Export a backup, or publish a collection as a static site.

No build step, runtime packages, database, analytics, or external post embeds. Imported saves and reading progress live in your browser. OAuth tokens, when used, stay in the Node.js server's memory.

**Status: early prototype.** The demo contains fictional saves. Import and OAuth/API behavior have automated tests, but X login and retrieval have not been validated against a live account. Bring your own developer app and API access to use sync. This project has no promised release schedule or hosted login service.

## Choose how to use it

| Mode | What you need | What works |
| --- | --- | --- |
| [Public demo](https://sharpmeow.github.io/savedesk/) or static hosting | A modern browser | File import, search, tags, reading queue, export |
| Local Node.js server | Node.js 22 or 24 LTS recommended | All file features; optional X login with credentials |
| Hosted Node.js server | HTTPS host, your X app, environment secrets | X login and sync on your own deployment |

GitHub Pages cannot run the OAuth server. On the demo, **Connect X** explains the setup rather than signing you in.

## Quick start

```sh
git clone https://github.com/SharpMeow/savedesk.git
cd savedesk
npm start
```

Open **http://localhost:4173**. No `npm install` or credentials are needed for file imports. The code requires Node.js 20+; use a supported LTS version for deployment. Python 3 users can run `npm run start:static` if Node is available, or `python3 -m http.server 4173 --bind 127.0.0.1` directly for static mode.

Choose **Import saves** to bring in your file. Use **Import likes / Import bookmarks** to choose the source for unlabelled records. [See formats and examples](docs/IMPORTING.md).

## Connect X

1. Create an app in the [X Developer Console](https://developer.x.com/) and enable OAuth 2.0 as a **Web App**.
2. Register the exact local callback URL: `http://localhost:4173/auth/callback`.
3. Copy `.env.example` to `.env` and fill in your OAuth 2.0 Client ID and Client Secret locally.
4. Stop any existing Savedesk server, then run `node --env-file=.env server.mjs`.
5. Open **http://localhost:4173**, choose **Connect X**, authorize, then choose **Sync X saves**.

[Full X setup, permissions, and troubleshooting](docs/X_SETUP.md). Your X account needs access and any required credits for the requested API endpoints. Do not put credentials in GitHub or browser code.

## Publish your collection

Import and organize your saves, choose **Export for publishing**, then replace `collection.json` in **your own fork** with that file. Enable GitHub Pages from `main` and `/ (root)`. Reading progress is excluded from the public export.

Publishing makes post text, authors, IDs, and tags public. Do not submit your collection to this upstream repository. Keep full X archives and private exports out of Git history. [Deployment instructions](docs/DEPLOYMENT.md) explain static and server hosting.

## Limits to know

- No guarantee of every historical like or bookmark. X and export files can omit data.
- Text and author retrieval only; no media downloads, deleted-post recovery, full-thread reconstruction, or automatic background sync.
- Each sync handles up to 20 pages per source, with up to 100 records per page. Click again to resume; reloading resets cursors and duplicates are merged.
- OAuth sessions expire within two hours and disappear when the server restarts. Reconnect to continue.
- Browser storage has limits. Export backups regularly; imports above 50 MB are rejected.
- Post ID ordering approximates post chronology, not when you saved it. There is no cross-device reading-state sync.

## Documentation

- [Import formats and backups](docs/IMPORTING.md)
- [X authentication and troubleshooting](docs/X_SETUP.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Architecture and development](docs/ARCHITECTURE.md)
- [Privacy and data handling](PRIVACY.md)
- [Security reporting](SECURITY.md)
- [Contributing](CONTRIBUTING.md) and [community guidelines](CODE_OF_CONDUCT.md)
- [Changelog](CHANGELOG.md)

## License and attribution

Savedesk's code and documentation are [MIT licensed](LICENSE). Imported posts and media remain subject to their respective owners' rights; the software license does not relicense them. Savedesk is an independent project, not affiliated with or endorsed by X.

The README banner is an AI-generated illustration, not a screenshot. [Artwork provenance and prompt](docs/assets/README.md).
