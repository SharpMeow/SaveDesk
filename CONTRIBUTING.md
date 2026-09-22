# Contributing to SaveDesk

Small, focused contributions are welcome. This is an experimental community project with no guaranteed response time. Open an issue before starting a large change so others can discuss the scope.

## Development

1. Fork the repository and clone your fork.
2. Create a branch for your change.
3. Use Node.js 22 or 24 LTS and run `npm start`.
4. Open http://localhost:4173. File import development does not need X credentials.
5. Run `npm test` and `git diff --check` before opening a pull request.

There are no dependencies to install or build artifacts to generate. The vendored ZIP reader has its own license and provenance in `vendor/`; retain both when updating it. `npm test` runs the built-in Node test runner. OAuth tests mock X; they must not call live APIs or require secrets. Tests start loopback servers on available ports.

## What to include

Explain the problem, the resulting behavior, and how you checked the change. Add regression tests for parsing, persistence, authentication, or sync behavior when appropriate. For UI changes, check a narrow and wide browser window and include a screenshot using synthetic data. Keep docs consistent with what the code actually does.

Preserve safe text rendering, numeric post IDs as strings, read-only OAuth scopes, and the explicit separation between importing and publishing. Avoid adding dependencies without explaining the need. There is no enforced formatter yet; keep edits focused and readable.

## Data and credentials

Never include real archives, tokens, cookies, `.env` files, private saves, or authorization callback URLs in issues, screenshots, or commits. Use small fictional fixtures. Do not replace upstream `collection.json` with your personal collection; publish it in your own fork instead.

Report vulnerabilities using [SECURITY.md](SECURITY.md), not a public issue. Participate according to the [community guidelines](CODE_OF_CONDUCT.md).

By submitting a contribution, you agree to make it available under this repository's [MIT license](LICENSE). Only submit work you have the right to contribute.
