# Sign-in and cross-device libraries

SaveDesk supports Google, GitHub, Microsoft, and Apple sign-in through an optional Supabase project. The repository ships with sign-in **disabled**, because it does not include a shared backend or provider credentials. File imports work without an account.

For someone using a configured site: choose **Sign in & sync**, choose a provider, and return to SaveDesk. Your account starts with its own private library. Choose **My account → Add this device’s saves** if you want to copy your existing device-only library into it. New imports and edits in the account library sync automatically. Open the same site and sign in to the same account on another device. **Sync now** retries immediately; returning to the page also checks for changes.

Account sign-in identifies you to SaveDesk. It does not read your Google, GitHub, Microsoft, or Apple saved content. **Connect X** is a separate read-only connection for importing X likes and bookmarks. Publishing a collection is also a separate choice.

## Set up your own site

You need permission to administer a Supabase project and the providers you enable. There is no command-line work required for these dashboard steps. Hosting and provider plans can have costs; review them before enabling a public service.

1. Create a project at [Supabase](https://supabase.com/dashboard). Keep its database password private.
2. Open the project's **SQL Editor**. Copy the entire contents of [supabase/schema.sql](../supabase/schema.sql) into a new query and run it. This creates the library table, per-user read policy, and revision-checked write function. Do this before turning on sign-in.
3. In **Authentication → URL Configuration**, set **Site URL** to your exact site address, including the project path and trailing slash, for example `https://YOUR-NAME.github.io/SaveDesk/`. Add that exact address to **Redirect URLs**. For local testing with this hosted project, also add `http://localhost:4173/`. Avoid broad wildcard production redirects. See [Supabase's redirect guide](https://supabase.com/docs/guides/auth/redirect-urls).
4. Configure at least one provider using the table below. Put provider client secrets only in Supabase's provider settings, never in this repository.
5. Find the project's HTTPS URL and **publishable key** in its connection/API settings. Edit [cloud-config.json](../cloud-config.json) in your own fork:

```json
{
  "url": "https://YOUR-PROJECT-REF.supabase.co",
  "publishableKey": "sb_publishable_YOUR_PUBLIC_KEY",
  "providers": ["google", "github", "azure", "apple"]
}
```

6. Remove providers you have not configured from the array. `azure` is Microsoft's provider identifier. Publish the changed file with the rest of the site. It is intentionally public. A legacy `anon` JWT key is also accepted; **secret keys and service-role keys are not**.
7. Reload your site and choose **Sign in & sync**. Only enabled providers appear. If the disabled message remains, check the JSON, deployment, and browser console without sharing tokens or callback URLs.

This configuration supports hosted `*.supabase.co` projects. Custom domains and local Supabase instances need an explicit configuration/CSP change and are not enabled by default. The static Pages site can sync directly with Supabase; it still cannot run the X OAuth server.

## Configure providers

All four providers return to your Supabase Auth callback first: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`. Copy the exact callback shown in Supabase rather than using the SaveDesk site URL in that field. Supabase then redirects to the allowed SaveDesk URL above.

| Provider | Setup |
| --- | --- |
| Google | Create a Web application OAuth client in Google Cloud, configure its consent screen and authorized origins, and register the Supabase callback. Add its client ID and secret to the Google provider in Supabase. Request identity scopes only. During testing, add permitted test users. [Official guide](https://supabase.com/docs/guides/auth/social-login/auth-google). |
| GitHub | Create a GitHub OAuth App with your site's homepage and the Supabase authorization callback. Put its client ID and client secret into Supabase's GitHub provider and enable it. [Official guide](https://supabase.com/docs/guides/auth/social-login/auth-github). |
| Microsoft | Register an application in Microsoft Entra, choose the supported account types, add the Supabase web redirect URI, and create a client secret. Configure Supabase's Azure provider, including the intended tenant. SaveDesk requests the `email` scope required by this flow. [Official guide](https://supabase.com/docs/guides/auth/social-login/auth-azure). |
| Apple | Configure Sign in with Apple for the web using your Apple Developer identifiers, Services ID, registered domain/return URL, and signing key. Generate the client secret and configure Supabase's Apple provider. Track and rotate that secret before it expires. Do not commit the private signing key. [Official guide](https://supabase.com/docs/guides/auth/social-login/auth-apple). |

Use the same provider/account when testing two devices. Different identities are not guaranteed to share a library. Identity linking follows your Supabase configuration; SaveDesk does not offer an account-linking or account-merging screen.

## Validate before inviting users

1. Sign in as a test account on two browser profiles or devices. Import a small fictional backup in the first. Use **Sync now** on the second and check the same saves, topics, and reading state.
2. Edit different topics or reading states on both devices, sync, and confirm both edits survive. A simultaneous edit to the same field uses the pending local edit when it retries.
3. Go offline, edit, then reconnect and sync. A failed request must leave edits on that device. Keep a downloaded backup if browser storage is full.
4. Sign out and use a second test account. The first account's saves must not appear. Check that the database has row-level security enabled and anonymous clients cannot read libraries or invoke the write function.
5. Cancel a provider login, use an unlisted redirect URL, and disable a provider. Verify understandable failures without publishing credentials in logs or screenshots.

The automated suite tests actual PostgreSQL row policies and write permissions using PGlite, plus mocked session changes, requests in flight, stale revisions, and offline failure. It does **not** substitute for this deployment's real OAuth and cross-device checks.

## Storage and limits

- The cloud stores normalized saves, topics, sources, and reading state in one row per Supabase user. Whole-library sync is intended for modest personal libraries: 100,000 records and 10 MB of JSON at the database boundary, with browser storage usually imposing a smaller practical limit.
- Sync uses a revision check and three-way merge. Independent edits survive; topic removals and mark-as-unread changes are preserved. Save deletion is not implemented. The app retries conflicts up to three times and keeps unsynced edits locally on failure.
- Automatic sync runs after edits and on focus/reconnection while the page is open. This is not a background service or instant live collaboration. X imports remain manual.
- Browser caches are separate for each account and for device-only use. Signing out returns to the device library. It does not erase cached saves; clear site data on a shared device after downloading any needed backups.
- Supabase access/refresh tokens are managed by its browser SDK in browser storage. X tokens remain in the optional Node server's memory. See [privacy](../PRIVACY.md) and [security](../SECURITY.md).
- Operators can delete an account in Supabase Auth; its cloud library is removed by the database foreign key. This does not erase browser caches, exports, or backups. There is no self-service account deletion screen yet. Explain your support/deletion process and retention policy to users before offering a public service.

Keep row-level security and the supplied write function intact. Never expose a service-role key as a shortcut for a policy error. Provider setup, backend capacity, abuse controls, and deployment-specific privacy notices belong to the site operator.
