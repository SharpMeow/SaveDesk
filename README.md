# Savedesk

A compact, searchable reading library for your X likes and bookmarks. Import your saves, filter by topic, and work through an unread queue.

## Run

Run `npm start`, then visit http://localhost:4173. Requires Node.js 20+. No package installation is needed. File imports work without credentials. Run `npm test` to verify the parser and simulated OAuth/API integration.

## Import

- From an extracted X archive, select `data/like.js` (import each part if split).
- For bookmarks, import a JSON export with numeric post IDs and choose **Import bookmarks** in the source selector. This app does not obtain a bookmark export for you.
- Import a Savedesk backup to restore tags and reading state.

Example JSON:

```json
[{"id":"1234567890123456789","text":"An idea to revisit","author":"example","source":"bookmark","tags":["Research"]}]
```

The parser accepts arrays, `{ "items": [...] }`, and X API `{ "data": [...] }` responses. API author expansions are not currently resolved. Duplicate post IDs merge their sources and tags. Post ID ordering approximates post chronology, not the date you liked or bookmarked something.

## Privacy and limits

Imported data stays in browser localStorage. The app does not send imports to a server and does not load external embeds, fonts, analytics, or media. Export regularly: browser data can be cleared or storage can fill. Use a dedicated origin for deployment. Publish only the collection you intend to share. Original account archives can contain unrelated private data and should not be committed.

This is a reading library with file import and optional manual X sync, not an automatic X backup. It cannot recover missing text, deleted posts, media, or entire threads. It cannot guarantee your export contains every historical save. Sample saves are fictional and are replaced by the first import. Tags and reading status on demo items are temporary.

The optional Connect X integration uses read-only OAuth and manual sync. It requires X developer access and a running Node.js server. See the official [bookmark documentation](https://docs.x.com/x-api/posts/bookmarks/introduction), [likes documentation](https://docs.x.com/x-api/posts/likes/introduction), and [archive instructions](https://help.x.com/en/managing-your-account/how-to-download-your-x-archive).

## Publish your collection

The app loads `collection.json` at startup. It starts empty, so visitors see clearly marked demo content until a collection is published.

1. Import your likes/bookmarks and organize their tags.
2. Choose **Export for publishing**. This exports the saves and tags without reading progress.
3. Replace `collection.json` in the repository with the downloaded file.
4. GitHub Pages serves the updated public collection. Visitor imports and reading progress remain local to each browser.

To host on GitHub Pages, choose **Settings → Pages → Deploy from a branch → main / (root)**. No build step is required.

## Getting your first export

In X, go to **Settings and privacy → Your account → Download an archive of your data** and request the archive. After X prepares it, extract it and look for `data/like.js`. Do not upload the entire archive here or to GitHub. Bookmarks require a separate export or a future authenticated API integration. See the official archive link above.


## Connect X

The code includes **Connect X → authorize → Sync X saves**. Authentication uses OAuth 2.0 authorization code flow with S256 PKCE. X account login has not been verified live because developer credentials are not configured.

### 1. Create the X developer app

Open the [X Developer Console](https://developer.x.com/). Complete developer enrollment if needed, then create an app. In user authentication settings:

- Enable OAuth 2.0.
- Choose **Web App** (a confidential client).
- Set the callback URL to exactly `http://localhost:4173/auth/callback` for local use.
- Set the website URL to `https://sharpmeow.github.io/savedesk/`.
- Use read-only permissions. Savedesk requests `tweet.read users.read like.read bookmark.read`, with no posting, direct-message, or write scopes.
- Copy the **OAuth 2.0 Client ID** and **Client Secret** into your local environment, not the repository. These are different from the OAuth 1.0 API key and secret.

Your developer account must have access and any required API credits for user lookup, likes, and bookmarks. Check the Developer Console before syncing. Login alone does not grant free or unlimited API access.

### 2. Configure and start locally

Create an ignored `.env` file in the repository:

```dotenv
X_CLIENT_ID=your_oauth2_client_id
X_CLIENT_SECRET=your_oauth2_client_secret
APP_URL=http://localhost:4173
PORT=4173
```

Run:

```sh
node --env-file=.env server.mjs
```

Open **http://localhost:4173**, click **Connect X**, authorize the app, then click **Sync X saves**. Use `localhost` consistently; `127.0.0.1` is a different origin for callback and request validation.

Each sync processes up to 20 pages per source, with up to 100 saves per page. Click Sync again to continue. Successful pages are saved immediately. Rate limits, missing API credits, and denied permissions are reported without discarding imported saves. Resume cursors last until the page reloads. Rerunning starts from the beginning and deduplicates by post ID.

### 3. Publish your collection

Use **Export for publishing**, then replace the repo's `collection.json`. Login and syncing do not automatically publish data. The GitHub Pages site can serve the published collection while the authenticated importer runs locally.

### Optional hosted login

Deploy the repository to a Node.js host using `npm start`. Set `HOST=0.0.0.0`, `APP_URL=https://your-app-host.example`, and the two X credentials in the host's secret/environment settings. Register `https://your-app-host.example/auth/callback` in the X app. Use one server instance: sessions are in memory, expire within two hours, and are lost on restart. Reconnect when the session expires. No background sync or refresh tokens are configured.

GitHub Pages serves static files and cannot run this server. Its Connect X button displays setup instructions. Never add the client secret or user tokens to browser JavaScript, `collection.json`, or GitHub.

Disconnect clears the server session but keeps imported browser data. To revoke the app grant itself, use X's connected-app settings. Current sync retrieves available text and authors, not media files or complete threads. Reaching the final API page does not guarantee that X returned every historical save.

OAuth reference: [X authorization code flow](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code).
