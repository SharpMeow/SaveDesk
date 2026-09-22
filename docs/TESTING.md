# Testing and device support

SaveDesk adapts to the space available, including phones, tablets, laptop and desktop windows, split-screen windows, and folded or unfolded phone viewports. Use an updated browser with JavaScript, module workers, and file downloads enabled. Device-only libraries are stored per browser; use a backup to move them. Optional account mode syncs a private library across devices.

## Automated checks

Run `npm ci`, then `npm test`. No credentials or network access to X are required. CI runs the suite on Node.js 22 and 24.

The suite covers import normalization, exact post IDs, duplicate merging, backup round trips, search, escaped exports, ZIP selection and limits, and worker completion, errors, and termination. A real worker test checks ZIP parsing through its message boundary and confirms that a worker stuck in a CPU loop is terminated. Node's worker adapter supplies the browser-style message and File APIs for those integration tests.

The adversarial cases include 2,000 reproducible malformed record mutations, 500 randomized merge/backup round trips, and 200 malformed ZIPs. Security regressions exercise forged ZIP sizes, oversized fields, hostile HTML, prototype-shaped input, path traversal, forged sessions, cross-origin writes, replayed and non-ASCII OAuth state, session expiry, invalid provider lifetimes, upstream errors, pending-login capacity, and overlapping sync calls. OAuth and X API responses are mocked.

## Browser checks performed

The September 2026 pass used Chromium through the desktop browser, with fixed-size iframe viewports for responsive checks. Sizes below are CSS pixels; desktop scrollbars can reduce usable content width. These are layout tests, not physical-device or all-browser certification.

| Layout | Viewports checked |
| --- | --- |
| Narrow/folded phones | 280 × 653, 320 × 568 |
| Phone portrait/landscape | 390 × 844, 844 × 390 |
| Wider/unfolded layouts | 540 × 720, 720 × 540 |
| Tablet portrait/landscape | 768 × 1024, 820 × 1180, 1024 × 768 |
| Laptop and desktop | 1280 × 800, 1440 × 900, 1920 × 1080, 2560 × 1440 |

The library and standalone shared page were checked for horizontal overflow, including long authors and topics. Library checks also covered 200% text at narrow, phone, and tablet sizes, short landscape dialogs, 44-pixel-high primary controls, and preserving search and selection when the viewport changes. Long posts expand in place rather than requiring a nested scrolling area.

Browser interactions covered an actual file-picker import containing hostile HTML, literal rendering and canonical X links, topic validation, search/filter sequences, empty results, pagination, reading state and topics after reload, keyboard dialog dismissal and restored focus, backup downloads, and opening/searching a downloaded shared page. All browser fixtures contained fictional data.

## Repeat before shipping UI changes

1. Test the first-use examples and a library with at least 25 saves. Include a long post, long author, long topic, duplicate ID, and literal HTML text.
2. Resize through the table, rotate between portrait and landscape, and enlarge text to 200%. Check for clipped content and horizontal page scrolling.
3. Open every dialog, including on a short landscape screen. Verify close controls, keyboard focus, Escape, and file selection.
4. Import JSON and ZIP fixtures; try a corrupt file and an imprecise numeric ID. Failed imports must preserve the existing library.
5. Search, filter, sort, select, edit topics, toggle read state, change pages, and reload. Resize while filters and selections are active.
6. Download a backup and shareable page. Restore the backup in a separate browser profile and check shared-page search and literal hostile text.
7. Check browser console errors and run `npm test`, syntax checks, and `git diff --check`.

## Remaining validation

Real X sign-in and retrieval require a configured developer app and endpoint access. Simulated API tests do not establish that a particular account has that access. Physical iOS/Android devices, Safari/Firefox/Edge, on-screen keyboard behavior, screen readers, and hardware hinges spanning two displays still need direct testing. Foldable coverage here means responsive viewport resizing; it does not claim special hinge-aware or dual-display behavior.

This is a focused engineering security test pass, not an independent penetration-test certification. Keep the deployment boundaries in [SECURITY.md](../SECURITY.md), especially for a publicly accessible OAuth server.

## Account and database checks

The suite also tests three-way merges, removed topics, mark-as-unread changes, bounded conflict retries, offline failures, edits during sync, provider redirects, refreshed tokens, and account switching with requests in flight. Cloud-controller tests use a simulated SDK. Database tests execute the real schema in PGlite PostgreSQL and verify account isolation, anonymous denial, direct-write denial, stale revisions, payload bounds, and invalid calls. CI rebuilds the vendored SDK and checks it matches the committed output.

No hosted Supabase project or provider credentials ship with this repository. Live Google/GitHub/Microsoft/Apple OAuth, backend configuration, and two-device cloud syncing still need the [deployment validation steps](ACCOUNTS.md#validate-before-inviting-users).

The account dialog and expanded header were checked again after the account feature at all 13 widths above, including a 280-pixel viewport with enlarged text. The dialog stayed inside the viewport with a 44-pixel close control and no horizontal overflow. These checks used the unconfigured account state; real provider redirects remain unverified.
