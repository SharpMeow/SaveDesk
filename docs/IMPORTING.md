# Importing and organizing saves

## X archive likes

Request an archive from **X → Settings and privacy → Your account → Download an archive of your data**. Once it is ready, extract it and look for `data/like.js`. Import each part separately if the archive is split. Archive contents vary; do not assume bookmarks are included. [Official archive instructions](https://help.x.com/en/managing-your-account/how-to-download-your-x-archive).

Choose **Import saves** and select the file. Savedesk strips the standard `window.YTD.…partN =` wrapper and parses JSON. It never executes the JavaScript file. The first successful import replaces the fictional demo collection.

Do not upload the entire account archive to an issue, a public repository, or the app. It may contain unrelated private data. Files above 50 MB are rejected; use smaller source export parts or prepare smaller JSON arrays locally.

## JSON exports

Accepted top-level shapes are an array, `{ "items": [...] }`, or an X API-style `{ "data": [...] }` object. File extensions are `.json` or `.js`.

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
| `sources` | Optional array of `like` and/or `bookmark`, used by Savedesk backups. |
| `tags` | Optional array of strings. |
| `read` | Optional boolean; only `true` marks it reviewed. |
| `created_at` | Optional timestamp string, preserved for export. Sorting currently uses post IDs. |

Archive records wrapped in `like` or `bookmark` are also recognized. Records with invalid or missing IDs are skipped; if none are valid, the import fails. Other unknown fields are ignored. Post links are rebuilt as `https://x.com/i/status/<id>` rather than trusting imported URLs. Missing original content is not fetched by the file importer.

## Merging and organization

Duplicates merge by post ID. Sources and tags are combined, a previous reviewed state is preserved, and missing incoming author/text metadata can retain existing values. Importing an older backup is a merge, not an exact replacement or deletion operation.

Search matches text, authors, and tags. The sidebar filters all, unread, likes, bookmarks, and reviewed items. Topic and search filters combine. Lists show 24 results per page. **Tags** edits a post's topics; **Mark read** moves it out of the unread queue. Marking a reviewed item again makes it unread.

## Backup and restore

**Export library** downloads `savedesk-backup.json`, including tags and reading state. Import that file to restore or merge it. A backup does not include credentials, images, or missing full threads. Local browser data can be cleared, and storage space is finite. If a save operation reports a storage problem, export immediately before closing the page.

**Export for publishing** downloads `collection.json` without reading progress. Review its contents before committing it to a public fork. Nothing is uploaded by the export button. See [deployment](DEPLOYMENT.md) and [privacy](../PRIVACY.md).
