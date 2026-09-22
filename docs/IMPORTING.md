# Importing and organizing saves

## X archive likes

Request an archive from **X → Settings and privacy → Your account → Download an archive of your data**. Once it is ready, select the downloaded ZIP in SaveDesk, or extract it and look for `data/like.js`. Import each part separately if the archive is split. Archive contents vary; do not assume bookmarks are included. [Official archive instructions](https://help.x.com/en/managing-your-account/how-to-download-your-x-archive).

Choose **Add your saves → Choose a file** and select the file. ZIP imports read only `like.js` and `like-partN.js` entries and skip unrelated entries. SaveDesk strips the standard `window.YTD.…partN =` wrapper and parses JSON. It never executes the JavaScript file. The first successful import replaces the fictional demo collection.

Do not post an account archive to an issue or public repository. Selecting it in SaveDesk reads it locally without uploading it. ZIPs above 200 MB are rejected; unzip those on your device and select the likes files. Extracted likes are limited to 50 MB and 100 parts per ZIP. Individual JSON/JS imports are limited to 50 MB. File processing runs in a worker and stops after 30 seconds; if an import times out, choose a smaller file or archive part.

Imports and libraries are limited to 100,000 records/saves. Each save supports up to 100,000 text characters, 500 author characters, and 100 topics of up to 200 characters each. Exceeding these limits rejects the import instead of truncating its contents. Post IDs must be positive numeric strings of up to 20 digits. Small safe integer IDs are accepted, but large JSON numbers are rejected because their digits may already be rounded. Duplicate IDs, including zero-padded equivalents, merge into one save.

## JSON exports

Accepted top-level shapes are an array, `{ "items": [...] }`, or an X API-style `{ "data": [...] }` object. JSON exports use `.json` or `.js`; X archive files can also use `.zip`.

```json
[
  {
    "id": "1234567890123456789",
    "text": "A fictional idea to revisit",
    "author": "example",
    "source": "bookmark",
    "tags": ["Research", "Tools"],
    "read": false,
    "created_at": "2026-09-22T12:00:00Z"
  }
]
```

| Field | Behavior |
| --- | --- |
| `id` or `tweetId` | Required numeric post ID. Export it as a string so JavaScript does not lose precision. |
| `text` or `fullText` | Post text. Missing text gets an unavailable-text placeholder. |
| `author` | Optional display text. Raw API file imports do not resolve `includes.users`; authenticated sync does. |
| `source` | `like` or `bookmark`. Otherwise the import selector supplies the default. |
| `sources` | Optional array of `like` and/or `bookmark`, used by SaveDesk backups. |
| `tags` | Optional array of strings. |
| `read` | Optional boolean; only `true` marks it reviewed. |
| `created_at` | Optional timestamp string, preserved for export. Sorting currently uses post IDs. |

Archive records wrapped in `like` or `bookmark` are also recognized. Records with invalid or missing IDs are skipped; if none are valid, the import fails. Other unknown fields are ignored. Post links are rebuilt as `https://x.com/i/status/<id>` rather than trusting imported URLs. Missing original content is not fetched by the file importer.

## Merging and organization

Duplicates merge by post ID. Sources and tags are combined, a previous reviewed state is preserved, and missing incoming author/text metadata can retain existing values. Importing an older backup is a merge, not an exact replacement or deletion operation.

Search matches text, authors, and tags. Space-separated search terms are combined; `@` targets authors and `#` targets topics. A separate author dropdown filters exact author names. Press ⌘/Ctrl+K to focus search. The sidebar filters all, unread, likes, bookmarks, and reviewed items. Topic and search filters combine. Lists show 24 results per page. **Topics** edits a post's topics; **Mark read** moves it out of the unread queue. Marking a reviewed item again makes it unread.

## Backup and restore

**Backup & share → Download backup** downloads `savedesk-backup.json`, including tags and reading state. Import that file to restore or merge it. A backup does not include credentials, images, or missing full threads. Local browser data can be cleared, and storage space is finite. If a save operation reports a storage problem, export immediately before closing the page.

**Backup & share → Advanced: publish a website → Download website data** downloads `collection.json` without reading progress. Review its contents before committing it to a public fork. Nothing is uploaded by the export button. See [deployment](DEPLOYMENT.md) and [privacy](../PRIVACY.md).

## Share or copy selected context

**Backup & share → Download shareable page** creates a standalone searchable HTML file containing all saves and tags, excluding reading status. Open it to review, then send it yourself. Readers can open it locally in a browser without an account. The page does not make requests until a reader opens an external link.

Select cards and choose **Copy for an AI chat** to copy only the selection, with author names and source links. Clipboard access can be unavailable; in that case a dialog offers selectable text. SaveDesk does not contact an AI provider. Selection is temporary and is cleared on reload or import.
