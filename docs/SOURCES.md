# Saved-content sources beyond X

Research checked September 22, 2026. **X remains SaveDesk's default source.** The current importer and card model support X likes/bookmarks only. The other sources below are researched options, not working connectors in this release. Account sign-in is separate from permission to read content on a source service.

## Practical expansion order

Start with public GitHub stars and portable browser-bookmark files, then validate user-provided exports for Reddit, Instagram, and TikTok. Add account-connected imports only where the provider permits a general-purpose application to access that data. This order is a product recommendation based on the interfaces below, not a claim that all exports already share one format.

| Source | Official route and constraints | Suggested SaveDesk approach |
| --- | --- | --- |
| X | Existing archive/compatible JSON import and optional read-only OAuth for likes/bookmarks. Endpoint access and returned history vary. [Current setup](X_SETUP.md). | Keep X first in onboarding and source selection. |
| GitHub stars | GitHub's REST API lists starred repositories for a user. Public stars can be listed without asking for repository-write permission; authenticated/private data needs the appropriate access. [Starring API](https://docs.github.com/en/rest/activity/starring). | First additional connected source: public stars by username, with pagination and rate-limit handling. GitHub sign-in alone does not import stars. |
| Browser bookmarks | Chrome can export bookmarks to HTML. [Chrome instructions](https://support.google.com/chrome/answer/96816?hl=en). | A local HTML importer makes arbitrary websites useful without each website needing OAuth. Preserve folders as topics and validate every URL. |
| Raindrop.io | Official export supports HTML, CSV, and TXT; its HTML uses the widely supported Netscape bookmark format. [Export guide](https://help.raindrop.io/export/). | Reuse the browser-bookmark route, then add explicit metadata support with fixtures. |
| Reddit saved/upvoted | Reddit documents saved and upvoted user listings. Its builder policy requires approval for API access. Users can also request an archive. [API](https://www.reddit.com/dev/api/), [access policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy), [data access](https://support.reddithelp.com/hc/en-us/articles/360043483511-Where-and-how-can-I-access-my-Reddit-data-and-information). | Start with verified export samples for saved posts/comments and upvoted posts. Do not promise every historical vote or upvoted comment. An API connector needs approval and user authorization. |
| TikTok likes/favorites | Data Portability documents Like List and Favorite Videos with dates and video links. Approved applications can request portability data for users in the EEA/UK. This is not unrestricted global access. [Data types](https://developers.tiktok.com/doc/data-portability-data-types/), [product eligibility](https://developers.tiktok.com/products/data-portability-api/). | Validate user-download formats first. Consider the approved portability route later. Expect link-only records when an export supplies no post text. Do not use the restricted Research API as a consumer-app workaround. |
| Instagram saved/liked | Meta provides account-information download controls. No suitable general personal saved/liked-content API was verified in this research. [Official account-information announcement](https://about.fb.com/news/2023/10/manage-your-information-across-apps/). | Check current user exports with consent and sanitized fixtures before implementing an adapter. Do not advertise an Instagram login as saved-content access. |
| Mastodon bookmarks/favorites | Authenticated APIs expose bookmarks and favorites, with per-user permissions and pagination. The user chooses their instance. [Bookmarks](https://docs.joinmastodon.org/methods/bookmarks/), [favorites](https://docs.joinmastodon.org/methods/favourites/). | A promising later API connector. Validate instance URLs and server-side network destinations before making requests. |
| YouTube playlists | The Data API can list accessible playlist items, with authorization when required and pagination. [Playlist items API](https://developers.google.com/youtube/v3/docs/playlistItems/list). | Research specific liked/private playlist availability before promising it. Google identity sign-in does not grant video-library access. |

Other services can be considered once there is a documented API or a user-controlled export. A universal URL/bookmark importer is likely to cover more useful material than a long list of incomplete sign-in buttons.

## Implementation requirements

Before adding another source, change the X-specific model and UI deliberately:

- Use source-qualified IDs, such as `github:repository:123`, so records cannot collide. Existing X backups need a migration and compatibility tests.
- Store a validated HTTP(S) URL and source kind. Replace X-specific links and numeric-ID sorting with appropriate source labels and dates.
- Keep actions distinct: Reddit saved versus upvoted, TikTok liked versus favorite, GitHub starred. Do not flatten them into misleading labels.
- Import only the requested categories. Archives may contain messages, contacts, searches, and unrelated personal information.
- Accept link-only records and explain unavailable content. Do not scrape private pages, request passwords/session cookies, or promise recovery of removed posts.
- Test pagination, duplicate imports, source collisions, dates, malformed files, hostile HTML/URLs, inaccessible items, and backups across schema versions.
- Update cloud validation, sharing, privacy notices, and migration tests together. Adding an OAuth provider is not enough to add a content source.

The existing numeric X model intentionally rejects unrelated exports. Until adapters ship, use the current supported formats rather than renaming another service's export to JSON and expecting it to work.
