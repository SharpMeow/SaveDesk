# Savedesk

A compact, searchable reading library for your X likes and bookmarks. Import your saves, filter by topic, and work through an unread queue.

## Run

Run `npm start`, then visit http://localhost:4173. Requires Python 3. No package installation or API credentials are needed. Run `npm test` with Node.js 18+.

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

This is an import-first prototype, not an automatic X backup. It cannot recover missing text, deleted posts, media, or entire threads. It cannot guarantee your export contains every historical save. Sample saves are fictional and are replaced by the first import. Tags and reading status on demo items are temporary.

Automatic sync is a future integration requiring X developer access and user authentication. See the official [bookmark documentation](https://docs.x.com/x-api/posts/bookmarks/introduction), [likes documentation](https://docs.x.com/x-api/posts/likes/introduction), and [archive instructions](https://help.x.com/en/managing-your-account/how-to-download-your-x-archive).

## Publish your collection

The app loads `collection.json` at startup. It starts empty, so visitors see clearly marked demo content until a collection is published.

1. Import your likes/bookmarks and organize their tags.
2. Choose **Export for publishing**. This exports the saves and tags without reading progress.
3. Replace `collection.json` in the repository with the downloaded file.
4. GitHub Pages serves the updated public collection. Visitor imports and reading progress remain local to each browser.

To host on GitHub Pages, choose **Settings → Pages → Deploy from a branch → main / (root)**. No build step is required.

## Getting your first export

In X, go to **Settings and privacy → Your account → Download an archive of your data** and request the archive. After X prepares it, extract it and look for `data/like.js`. Do not upload the entire archive here or to GitHub. Bookmarks require a separate export or a future authenticated API integration. See the official archive link above.

