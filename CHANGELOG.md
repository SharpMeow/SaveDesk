# Changelog

Changes are recorded here for readers and contributors. Versions below describe repository development; they are not claims of published release artifacts.

## Unreleased

- Add optional Google, GitHub, Microsoft, and Apple sign-in with Supabase, private cross-device libraries, account-isolated caches, and revision-checked merges.
- Add backend/provider setup instructions, PostgreSQL policy tests, and account-switching regressions. Account hosting remains unconfigured by default.
- Document official saved-content routes for GitHub, Reddit, TikTok, Instagram, and other candidates; X remains the implemented default source.

- Improve phone, tablet, foldable-width, and desktop layouts, touch controls, enlarged text, safe-area spacing, short-screen dialogs, and long-post expansion.
- Process imports in a time-limited worker; validate exact IDs, duplicate records, field limits, and ZIP size metadata.
- Harden OAuth state handling, session expiry, concurrent sync, login capacity, and browser security headers.
- Add adversarial import, worker, and server regression tests plus device/testing documentation.

- Add guided onboarding, a plain-language user guide, and a simpler toolbar.
- Read X archive ZIPs locally, skipping unrelated entries, with a vendored MIT-licensed ZIP reader.
- Add searchable standalone HTML sharing, author filters, @author/#topic search, a search shortcut, and copying selected saves for an AI chat.
- Show X sign-in only on configured servers and keep developer publishing instructions under advanced options.

- Add a community README, MIT license, setup and deployment guides, architecture notes, privacy and security documentation, and contribution guidelines.
- Add a generated project banner and artwork provenance.
- Add issue/PR templates, a safe environment template, package metadata, and CI for supported Node.js versions.

## 0.2.0 - 2026-09-22

- Add optional read-only X OAuth login with PKCE, session cookies, disconnect, and manual paginated likes/bookmarks sync.
- Add simulated OAuth/API tests. Live account verification remains outstanding.

## 0.1.0 - 2026-09-22

- Introduce the static library, fictional demo saves, search, topics, reading queue, file imports, duplicate merging, backups, and public collection export.
