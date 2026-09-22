# Vendored browser dependencies

The app serves dependencies locally. Visitors do not download executable code from a third-party CDN.

- `fflate.mjs`: the ZIP reader; see `fflate-LICENSE` and its source header.
- `supabase.mjs`: the ESM browser client built from the exact `@supabase/supabase-js` version in `package.json` and dependencies locked in `package-lock.json`. It is loaded only when cloud accounts are configured. Bundled notices are in `SUPABASE-LICENSES.txt`; the output SHA-256 is in `supabase.sha256`.

To rebuild the Supabase bundle with Node.js 22 or 24:

```sh
npm ci
npm run build:vendor
git diff -- vendor/
```

The build uses the pinned esbuild version and collects licenses for bundled packages. Review dependency changes and retain all notices when updating. CI rebuilds the committed bundle and checks for differences. PGlite is used only by database tests and is not shipped to browsers.

## ZIP reader provenance

fflate 0.8.3, MIT licensed, by Arjun Barrett. Unmodified `esm/browser.js` from the npm release, verified against its published SHA-512 integrity. Used to read only likes files from a local X archive ZIP.

Upstream: https://github.com/101arrowz/fflate

License: [fflate-LICENSE](fflate-LICENSE)

Integrity: `sha512-tbZNuJrLwGUp3zshBtdy4W+ORxZuIh8a5ilyIEQDC5rY1f3U20JMry0Ll3WBzU58EZKsEuJFXhb5gwv8CsPvgA==`
