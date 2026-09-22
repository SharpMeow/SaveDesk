# Connect X

X login is optional. The static demo and file imports work without it. OAuth is implemented and tested with simulated responses, but live account login and retrieval have not yet been verified.

## Create your developer app

1. Visit the [X Developer Console](https://developer.x.com/) and complete any required enrollment.
2. Create an app and enable OAuth 2.0 user authentication.
3. Select **Web App**, which is a confidential client.
4. Register `http://localhost:4173/auth/callback` as the local callback URL. It must match exactly.
5. Set the app's website URL to your own deployment or repository URL.
6. Select read-only permissions and obtain the **OAuth 2.0 Client ID and Client Secret**. OAuth 1.0 API keys are different credentials.

The app requests `tweet.read users.read like.read bookmark.read`. It does not request posting, direct messages, write permissions, or offline access. See [X's OAuth documentation](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code) for current settings and scopes.

Your developer account must have access and any required credits for user lookup, likes, and bookmarks. Check the console before syncing; successful login alone does not establish API entitlement or pricing.

## Local configuration

Use a supported Node.js LTS version, then run from the repository directory:

```sh
cp .env.example .env
```

Edit `.env` locally:

```dotenv
X_CLIENT_ID=your_oauth2_client_id
X_CLIENT_SECRET=your_oauth2_client_secret
APP_URL=http://localhost:4173
PORT=4173
HOST=127.0.0.1
```

Stop any server already using the port, then start:

```sh
node --env-file=.env server.mjs
```

`npm start` does not automatically load `.env`; use the command above, or supply environment variables through your process manager. Open **http://localhost:4173**, choose **Add your saves → Connect X instead**, authorize, then choose **Sync X saves**. Use `localhost` consistently. Opening `127.0.0.1` changes the origin and can break request validation or callback cookies.

The server uses S256 PKCE, one-use state, and an HttpOnly session cookie. Tokens stay in process memory. Sessions expire within two hours and are lost on restart; reconnect when needed. The app does not schedule syncs or refresh access tokens.

## Sync behavior

A sync reads up to 20 pages of likes and 20 pages of bookmarks, requesting up to 100 records per page. Click again to resume additional pages. Results already fetched stay in the local library if later requests fail. Cursors are only retained until reload, so a reload starts over and merges duplicates.

The end-of-results message means X returned no further page token. It does not guarantee every historical save is present. Missing/deleted posts, API limits, and partial responses can affect results. Sync does not download media or reconstruct full threads.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Connect X is not shown | You are on static hosting, or the Node server has no `X_CLIENT_ID`. File imports still work. |
| X rejects the callback | Match scheme, host, port, and `/auth/callback` exactly in both `APP_URL` and the developer app. |
| Connection not completed | Retry the flow once; check app type, Client ID, Client Secret, and callback. Do not share callback URLs containing codes. |
| Session expired / 401 | Reconnect; tokens expire and server restarts clear sessions. |
| API credits required / 402 | Check developer-account API credits and endpoint access. |
| Access denied / 403 | Check read scopes, account/app entitlement, and that the browser origin equals `APP_URL`. |
| Rate limited / 429 | Wait before retrying. Avoid repeated clicks or parallel sync sessions. |
| Port already in use | Stop the other process, or change `PORT`, `APP_URL`, and the registered callback consistently. |
| Missing posts | Compare source exports and API availability. Savedesk cannot recover content X does not return. |

**Disconnect X** clears Savedesk's server session; imported saves remain in the browser. To revoke the underlying grant, use X's connected-app settings.

For hosting, continue to [deployment](DEPLOYMENT.md).
