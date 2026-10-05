# Git providers: GitLab, Bitbucket and Codeberg alongside GitHub

Date: 2026-10-05
Status: implemented

## Goal

Users who keep their code on GitLab, Bitbucket or Codeberg can do what GitHub
users already can: connect their account, browse repositories, branches and
folders, open a file into the editor, and save the editor's content back as a
commit.

## Decisions

| Topic | Decision |
|---|---|
| Providers | GitHub, GitLab, Bitbucket, Codeberg |
| Hosts | Public hosts only: github.com, gitlab.com, bitbucket.org, codeberg.org. Self-hosted servers are out of scope. |
| Connections | Several at once. Each provider connects and disconnects on its own. |
| Entry points | File menu: "Open from repository…" (Ctrl+Shift+O) and "Save to repository…" (Ctrl+Shift+S). The dialog has a provider switcher. |
| Session length | 30 days from sign-in for every provider, with silent token refresh where tokens expire. |
| Architecture | Own adapter per provider behind one `/api/[provider]/…` API. No auth library, no new runtime dependency. |
| Logos | Brand-coloured marks: GitLab `#FC6D26`, Bitbucket `#0052CC`, Codeberg `#2185D0`, GitHub black or white by theme. |
| Testing | No unit-test framework. Adapters are exercised end to end through Playwright with Next's experimental test proxy. |
| Credentials | Client ID and secret per provider come from environment variables, so each environment has its own OAuth app. GitHub keeps its existing constants. |

## Server

### Provider adapters

`apps/client/lib/git-providers/`:

- `types.ts`: `ProviderId = "github" | "gitlab" | "bitbucket" | "codeberg"`,
  the normalised shapes, and the `GitProvider` interface.
- `github.ts`, `gitlab.ts`, `bitbucket.ts`, `codeberg.ts`: one adapter each.
- `registry.ts`: `getProvider(id)` and `PROVIDER_IDS`. No barrel file.
- `tokens.ts`: cookie read and write plus `getAccessToken(provider)`.
- `validate.ts`: the repo, branch and path validators moved out of `lib/github.ts`.
  Repository names accept 2 to 21 segments (GitLab subgroups) and reject `.`
  and `..` segments.
- `http.ts`: request helpers, `ProviderError`, the OAuth token request.
- `provider.ts`: the `GitProvider` interface.
- `route.ts`: provider lookup and error responses for the route handlers.

Normalised shapes:

```ts
interface GitUser { username: string; avatarUrl: string | null }
interface GitRepo { id: string; name: string; fullName: string }
interface GitBranch { name: string }
interface GitEntry { name: string; path: string; type: "file" | "dir" }
interface CommitResult { url: string }
```

`fullName` is the only handle a repository needs: `owner/repo` on GitHub and
Codeberg, `workspace/slug` on Bitbucket, and the `group/subgroup/project` path
on GitLab (URL-encoded by the adapter when calling the API).

```ts
interface GitProvider {
  id: ProviderId;
  label: string;                    // "GitLab"
  isConfigured(): boolean;          // client ID and secret present
  authorizeUrl(state: string, redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<TokenSet>;
  refresh(refreshToken: string): Promise<TokenSet>;
  getUser(token: string): Promise<GitUser>;
  listRepos(token: string, query?: string): Promise<GitRepo[]>;
  listBranches(token: string, repo: string): Promise<GitBranch[]>;
  listDirectory(token: string, repo: string, ref: string, path: string): Promise<GitEntry[]>;
  readFile(token: string, repo: string, ref: string, path: string): Promise<string>;
  commitFile(token: string, input: CommitInput): Promise<CommitResult>;
}

interface TokenSet { accessToken: string; refreshToken?: string; expiresAt?: number }
interface CommitInput { repo: string; branch: string; path: string; content: string; message: string }
```

Adapters throw a `ProviderError` with an HTTP status and a readable message.
Routes turn it into `{ error }` (see Errors).

### Routes

`app/api/[provider]/` replaces `app/api/github/`. Putting the dynamic segment
directly under `/api` keeps GitHub's callback at `/api/github/auth`, so the
existing GitHub OAuth apps keep working. `/api/status` is a static route and
still wins. Every route returns 404 for an unknown provider and 503 with
"Not configured" when the provider has no client ID or secret.

| Route | Method | Purpose |
|---|---|---|
| `auth?login` | GET | Create `state`, set the state cookie, redirect to the provider |
| `auth?code&state` | GET | Verify `state`, exchange the code, set the token cookie, redirect to `/oauth/<provider>?status=…` |
| `auth` | GET | Return `GitUser` or 401. Refreshes a token that expires within 5 minutes. |
| `auth` | DELETE | Clear the token cookie |
| `repos?q=` | GET | `GitRepo[]`, up to 100, most recently updated first |
| `branches?repo=` | GET | `GitBranch[]` |
| `tree?repo=&ref=&path=` | GET | `GitEntry[]` for one folder |
| `file?repo=&ref=&path=` | GET | `{ content }` |
| `commit` | POST | Body `CommitInput`, returns `CommitResult` |

`redirectUri` is `<request origin>/api/<provider>/auth`. It is sent on both the
authorize and the token requests, which GitLab requires.

### Tokens and sessions

- One cookie per provider: `git_<provider>`, httpOnly, `Secure` outside
  development, `SameSite=Lax`, `Path=/api/<provider>`. Its value is JSON:
  `{ accessToken, refreshToken?, expiresAt?, sessionExpiresAt }`.
- `sessionExpiresAt` is set at sign-in to now + 30 days. Every rewrite keeps
  it and sets `Max-Age` to the time remaining, so a session ends 30 days after
  sign-in whatever the provider.
- OAuth state cookie: `oauth_state`, `Path=/api/<provider>/auth`, 10 minutes,
  deleted on callback. This generalises the state check added during the code
  review.
- `getAccessToken(provider)`:
  - no cookie, or session over: 401
  - `expiresAt` passed (data routes) or within 5 minutes (auth route):
    call `refresh`, write the new token set including the new refresh token,
    return the new access token
  - refresh fails: clear the cookie, 401
- GitLab and Bitbucket rotate refresh tokens on every use, so two refreshes at
  once would fail the second. The client loads the auth route first and only
  then requests data (the current dialog flow already does this), so data
  routes normally find a fresh token. A rare lost race ends with a 401 and the
  "Connect" prompt, never a half-working state.
- The existing GitHub `access_token` cookie is no longer read. Current GitHub
  users connect once more after release.

### Provider details

| | Sign-in | Repositories | Folder and file | Save |
|---|---|---|---|---|
| GitHub | `github.com/login/oauth`, scope `repo`, token does not expire | `GET /user/repos?sort=updated&per_page=100`; with a query, `GET /search/repositories?q=<q>+in:name+user:@me` | `GET /repos/{o}/{r}/contents/{path}?ref=`; raw with `Accept: application/vnd.github.v3.raw` | `PUT /repos/{o}/{r}/contents/{path}`, with `sha` when the file exists |
| GitLab | `gitlab.com/oauth/authorize` and `/oauth/token`, scope `api` (writing files through the API needs it), 2-hour tokens, rotating refresh | `GET /api/v4/projects?membership=true&order_by=last_activity_at&per_page=100&search=` | `GET /projects/{id}/repository/tree?path=&ref=&per_page=100`; `GET /projects/{id}/repository/files/{path}/raw?ref=` | `HEAD …/repository/files/{path}?ref=` decides `POST` (create) or `PUT` (update) on `…/repository/files/{path}` with `branch`, `content`, `commit_message` |
| Bitbucket | `bitbucket.org/site/oauth2/authorize` and `/access_token` (client ID and secret as Basic auth), OAuth client with account and repository read and write permissions, 2-hour tokens, rotating refresh, token only in the `Authorization: Bearer` header | `GET /2.0/repositories?role=member&sort=-updated_on&pagelen=100&q=name~"<q>"` | Resolve the branch to its commit with `GET /refs/branches/{name}` so names containing `/` work, then `GET /src/{hash}/{path}/` for a folder (`commit_file` or `commit_directory`) or `GET /src/{hash}/{path}` for raw content | multipart `POST /2.0/repositories/{ws}/{slug}/src` with field `<path>` = content, `message`, `branch`; commit hash read from the `Location` header |
| Codeberg | `codeberg.org/login/oauth/authorize` and `/access_token`; no scopes exist, so the token has full account rights; 1-hour tokens with refresh | `GET /api/v1/user/repos?limit=50` (two pages), filtered by name inside the adapter | `GET /api/v1/repos/{o}/{r}/contents/{path}?ref=`; `GET /api/v1/repos/{o}/{r}/raw/{path}?ref=` | `POST` (create) or `PUT` (update, with `sha`) `/api/v1/repos/{o}/{r}/contents/{path}` |

Usernames come from `GET /user` (GitHub), `GET /api/v4/user` (GitLab),
`GET /2.0/user` `nickname` (Bitbucket) and `GET /api/v1/user` (Codeberg).
The "View on <provider>" link opens the saved file at its branch, as the
GitHub link did before. GitLab's files API returns no commit ID, so a file
link is the one URL every provider can give.

## Client

### Connection state

`hooks/use-git-connections.ts` replaces `useGithubAuth`:

- On demand, when a repository dialog or Settings opens, it requests
  `GET /api/<provider>/auth` for all four providers.
- It returns `Record<ProviderId, { user: GitUser | null; configured: boolean }>`,
  `isLoading`, `connect(provider)` and `disconnect(provider)`.
- `connect` opens the popup at `/api/<provider>/auth?login`; `lib/utils.ts`
  `loginWithGithub` becomes `connectProvider(provider)`.
- The popup page moves from `app/oauth/github` to `app/oauth/[provider]` and
  posts `{ type: "git-oauth", provider, success }` to `window.location.origin`.
  `isGitOAuthSuccess(event)` keeps the origin check and also returns the
  provider. Failed sign-ins keep showing the error page added in the review.

### Settings

"GitHub Connection" becomes **Repository connections**: four rows, each with
the brand logo and name, then either the avatar, username and Disconnect, or a
Connect button. Unconfigured providers show a disabled "Not available" button.

### Dialogs

- `open-from-github-dialog` becomes `open-from-repository-dialog`;
  `save-to-github-dialog` becomes `save-to-repository-dialog`.
- A Tabs row at the top lists GitHub, GitLab, Bitbucket and Codeberg.
- The first tab shown is the last provider used (localStorage key
  `codex-git-provider`), otherwise the first connected one, otherwise GitHub.
- A connected tab shows the repository browser. An unconnected tab shows the
  sign-in prompt, which is `github-auth-prompt` made generic
  (`git-auth-prompt`, with logo and provider name).
- The save form keeps its fields (repository, branch, folder, file name,
  commit message) and validation. Its success link reads "View on <provider>".
- `github-footer-info` becomes a generic footer showing the connected
  account for the active tab.

### Repository browser

- Selecting a branch, folder or file sets the repository and branch from that
  item's own parents. Before, expanding repo A then repo B and picking a file
  in A targeted repo B.
- Takes a `provider` prop. Fetch helpers call `/api/<provider>/repos`,
  `branches` and `tree`; the GitHub response types in `repo-browser/types`
  are replaced by the normalised ones.
- Switching tabs remounts the browser, which resets the tree, the search and
  the selection.

### Menu and logos

- `menu-config.tsx`: labels "Open from repository…" and "Save to repository…";
  actions `openRepository` and `saveRepository` replace `openGitHub` and
  `saveGitHub`.
- `components/shared/git/provider-logo.tsx` renders inline SVG marks from
  Simple Icons (CC0) in brand colour; GitHub uses `currentColor`. The
  octocat images stay because the About dialog's GitHub link uses them.

### Avatars

The custom image loader passes remote URLs through unchanged, so no image
config is needed for the providers' avatar hosts. Settings shows a 16 px
avatar next to the username and hides it if the image fails to load.

## Errors

- Routes return `{ error }` and keep the provider's status:
  - 401: the token is missing, expired or revoked; the UI shows the sign-in prompt.
  - 403: "You don't have permission to do that in this repository."
  - 404: "Not found. It may have been moved or deleted."
  - 409 or 422: the provider's message, such as a protected branch or a file
    changed since it was read.
  - Network failure or an unexpected response: 502 "Couldn't reach <provider>."
- The dialogs already show route errors inline; nothing new is needed there.

## Security

- Tokens never reach page scripts: httpOnly cookies scoped to their provider's path.
- Codeberg and GitLab tokens are broad (full account, full API). This is the
  main reason they stay server-side; the live-preview sandbox fix from the
  review matters here too.
- Each sign-in is bound to the browser by the `state` cookie.
- Inputs pass the existing validators before any provider call. Hosts are
  fixed per provider, so user input never chooses where the server sends
  requests.

## Configuration and setup

- Environment (`.env` locally, Worker secrets in production, listed in
  `.env.example`): `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`,
  `BITBUCKET_CLIENT_ID`, `BITBUCKET_CLIENT_SECRET`, `CODEBERG_CLIENT_ID`,
  `CODEBERG_CLIENT_SECRET`. Each environment points at its own OAuth app.
- GitHub is unchanged: client IDs in `lib/constants.ts`, secrets in
  `GITHUB_CLIENT_SECRET_DEV` and `_PROD`.
- OAuth apps you register, each with callback `<site>/api/<provider>/auth`:
  - GitLab: one application with both redirect URIs, scope `api`.
  - Bitbucket: an OAuth client (workspace settings) with account read and
    repository read and write; one per environment if it accepts only one
    callback URL.
  - Codeberg: one OAuth2 application with both redirect URIs.
- A provider without credentials stays visible but shows "Not available", so
  the feature ships safely before every app exists.

## Testing

- **Playwright with Next's test proxy.** `experimental.testProxy` is on only
  when `NEXT_TEST_PROXY=true`, which the Playwright web server sets along with
  fake OAuth credentials. It must stay off in production, where a request
  header could otherwise redirect the server's outgoing fetches.
  Tests import `test` from `next/experimental/testmode/playwright` and answer
  the server's outgoing provider requests with canned JSON through
  `next.onFetch`, so the real routes and adapters run. Covered per provider:
  - list and search repositories, branches, a nested folder
  - open a file into the editor
  - save a new file (create) and an existing file (update), including the
    "View on <provider>" link
  - an expired token that refreshes, and a failed refresh that shows Connect
- Tests set the token cookie directly for a connected state. The OAuth
  redirect itself is covered for `state` handling only.
- **Manual (you):** a real sign-in, open and save on each provider once the
  OAuth apps exist.
- The suite (`tests/e2e/repository`) passes under both `next dev` and
  `next start`, on desktop and mobile.

## Out of scope

- Self-hosted GitLab, Gitea or Bitbucket Data Center.
- Pull or merge requests, creating branches, committing several files at once.
- Binary files: open and save stay text-only, as today.
