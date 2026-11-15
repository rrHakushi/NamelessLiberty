# session.ts

- **Source**: [`core/plugins/session.ts`](../../../../../../apps/elysia/src/core/plugins/session.ts)
- **Layer / Role**: Core Infrastructure

## Exported Types, Methods & Algorithms

### `type DatabaseClient` (L10)

### `interface SessionUser` (L12)

### `class Session` (L19)

#### `constructor(user, token = null)` (L24)

- **1.** `[Sequence]` Assign `this.user`
  ```typescript
  this.user = user
  ```
- **2.** `[Sequence]` Assign `this.isAuthenticated`
  ```typescript
  this.isAuthenticated = user !== null
  ```
- **3.** `[Sequence]` Assign `this.token`
  ```typescript
  this.token = token
  ```

#### `getUser()`: `SessionUser | null` (L30)

- **1.** `[Return]`  — `this.user`

#### `requireUser()`: `SessionUser` (L34)

- **1.** `[If]` `!this.user`
  - **1.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Authentication required'
- **2.** `[Return]`  — `this.user`

### `function resolveSessionFromRequest` (L51)

Resolves an authenticated user session from a Request. Supports: 1. Bearer Token (`Authorization: Bearer <jwt>`) 2. Session Cookie (`Cookie: session=<jwt>`) 3. OAuth 2.0 Access Token (`Authorization: Bearer <oauth_token>`) 4. API Key (`x-api-key`, `apikey`, `x-api`, `Authorization: ApiKey <key>`)

- **1.** `[Sequence]` Define `secret`
  ```typescript
  const secret = Bun.env.JWT_SECRET
  ```
- **2.** `[If]` `!secret`
  - **2.1.** `[Error]` Throws `Error` — 'JWT_SECRET environment variable is required'
- **3.** `[Sequence]` Calls `request.headers.get` and stores result as `authHeader`
- **4.** `[Sequence]` Define `rawToken`
  ```typescript
  let rawToken: string | null = null
  ```
- **5.** `[If]` `injectedBearer && injectedBearer.trim().length > 0`
  - **5.1.** `[Sequence]` Assign `rawToken`
    ```typescript
    rawToken = injectedBearer.trim()
    ```
- **6.** `[Else]` Otherwise
  - **6.1.** `[If]` `authHeader?.startsWith('Bearer ')`
    - **6.1.1.** `[Sequence]` Assign `rawToken`
      ```typescript
      rawToken = authHeader.slice(7).trim()
      ```
- **7.** `[If]` `!rawToken`
  - **7.1.** `[If]` `injectedSessionCookie && injectedSessionCookie.trim().length > 0`
    - **7.1.1.** `[Sequence]` Assign `rawToken`
      ```typescript
      rawToken = injectedSessionCookie.trim()
      ```
  - **7.2.** `[Else]` Otherwise
    - **7.2.1.** `[Sequence]` Calls `request.headers.get` and stores result as `cookieHeader`
    - **7.2.2.** `[If]` `cookieHeader`
      - **7.2.2.1.** `[Sequence]` Calls `Object.fromEntries` and stores result as `cookies`
      - **7.2.2.2.** `[If]` `cookies.session`
        - **7.2.2.2.1.** `[Sequence]` Assign `rawToken`
          ```typescript
          rawToken = cookies.session
          ```
- **8.** `[If]` `rawToken`
  - **8.1.** `[Try]` Try block
    - **8.1.1.** `[Sequence]` Calls `new TextEncoder().encode` and stores result as `secretKey`
    - **8.1.2.** `[Sequence]` Calls `jwtVerify` and stores result as `{ payload }`
    - **8.1.3.** `[If]` `payload && payload.id`
      - **8.1.3.1.** `[Sequence]` Database `first` on `User` and stores it as `dbUser`
      - **8.1.3.2.** `[If]` `dbUser`
        - **8.1.3.2.1.** `[Sequence]` Define `isRevoked`
          ```typescript
          let isRevoked = false
          ```
        - **8.1.3.2.2.** `[If]` `dbUser.passwordChangedAt && payload.iat`
          - **8.1.3.2.2.1.** `[Sequence]` Calls `Math.floor` and stores result as `pwdChangedSeconds`
          - **8.1.3.2.2.2.** `[If]` `payload.iat as number < pwdChangedSeconds`
            - **8.1.3.2.2.2.1.** `[Sequence]` Assign `isRevoked`
              ```typescript
              isRevoked = true
              ```
        - **8.1.3.2.3.** `[If]` `!isRevoked`
          - **8.1.3.2.3.1.** `[Return]` 
            ```json
            {
              "user": {
                "id": "<dbUser.id>",
                "username": "<dbUser.username>",
                "email": "<dbUser.email>",
                "permissions": [
                  "<...dbUser.permissions>"
                ]
              },
              "token": "<rawToken>"
            }
            ```
  - **8.2.** `[Catch]` Catch (`err`)
  - **8.3.** `[Try]` Try block
    - **8.3.1.** `[Sequence]` Database `first` on `OAuthAccessToken` and stores it as `oauthToken`
    - **8.3.2.** `[If]` `oauthToken && oauthToken.user && !oauthToken.revokedAt && toDate(oauthToken.expiresAt).getTime() > Date.now()`
      - **8.3.2.1.** `[Return]` 
        ```json
        {
          "user": {
            "id": "<oauthToken.user.id>",
            "username": "<oauthToken.user.username.trim()>",
            "email": "<oauthToken.user.email>",
            "permissions": [
              "<...oauthToken.user.permissions>"
            ]
          },
          "token": "<rawToken>"
        }
        ```
  - **8.4.** `[Catch]` Catch (`err`)
- **9.** `[Sequence]` Define `xApiKey`
  ```typescript
  const xApiKey = request.headers.get('x-api-key') || request.headers.get('apikey') || request.headers.get('x-api') || authHeader?.startsWith('ApiKey ') ? authHeader.slice(7).trim() : null
  ```
- **10.** `[If]` `xApiKey && xApiKey.trim().length > 0`
  - **10.1.** `[Try]` Try block
    - **10.1.1.** `[Sequence]` Calls `hashApiKey` and stores result as `keyHash`
    - **10.1.2.** `[Sequence]` Database `first` on `ApiKey` and stores it as `keyRecord`
    - **10.1.3.** `[If]` `keyRecord && keyRecord.user && !keyRecord.expiresAt || toDate(keyRecord.expiresAt).getTime() > Date.now()`
      - **10.1.3.1.** `[Sequence]` Database `update` on `ApiKey`
      - **10.1.3.2.** `[Return]` 
        ```json
        {
          "user": {
            "id": "<keyRecord.user.id>",
            "username": "<keyRecord.user.username.trim()>",
            "email": "<keyRecord.user.email>",
            "permissions": [
              "<...keyRecord.user.permissions>"
            ]
          },
          "token": null
        }
        ```
  - **10.2.** `[Catch]` Catch (`err`)
- **11.** `[Return]` 
  ```json
  {
    "user": null,
    "token": null
  }
  ```

### `interface SessionPluginOptions` (L202)

### `const session` (L209)

Elysia session plugin providing request-scoped session resolution.

- **1.** `[Sequence]` Define `secret`
  ```typescript
  const secret = Bun.env.JWT_SECRET
  ```
- **2.** `[If]` `!secret`
  - **2.1.** `[Error]` Throws `Error` — 'JWT_SECRET environment variable is required'
- **3.** `[Return]`  — `new Elysia({ name: 'iris-session' }).use(bearer()).use(jwt({ name: 'jwt', secret, exp: '365d' })).derive('global', async ({ request, bearer: bearerToken, cookie }) => { const { user, token } = await resolveSessionFromRequest( request, options?.prisma ?? defaultPrisma, bearerToken, cookie?.session?.value as string | undefined ) ...)`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [load-env.ts](../../load-env.md) ([[load-env]])
- [core/errors/http-errors.ts](../errors/http-errors.md) ([[core/errors/http-errors]]) — `Unauthorized`
- [core/utils/auth-crypto.ts](../utils/auth-crypto.md) ([[core/utils/auth-crypto]]) — `hashApiKey`

### External / Workspace Packages
- `elysia` — `Elysia`
- `@elysia/bearer` — `bearer`
- `@elysia/jwt` — `jwt`
- `jose` — `jwtVerify`
- `@NamelessLiberty/db` — `defaultPrisma`, `PrismaClient`, `toDate`

### Called By / Imported By
- [apps/akaromi/ciphers/ciphers.ctrl.ts](../../apps/akaromi/ciphers/ciphers.ctrl.md) ([[apps/akaromi/ciphers/ciphers.ctrl]]) — `session`
- [apps/akaromi/encryption/encryption.ctrl.ts](../../apps/akaromi/encryption/encryption.ctrl.md) ([[apps/akaromi/encryption/encryption.ctrl]]) — `session`
- [apps/akaromi/vault/vault.ctrl.ts](../../apps/akaromi/vault/vault.ctrl.md) ([[apps/akaromi/vault/vault.ctrl]]) — `session`
- [apps/borealis/anime/anime.ctrl.ts](../../apps/borealis/anime/anime.ctrl.md) ([[apps/borealis/anime/anime.ctrl]]) — `session`
- [apps/borealis/books/books.ctrl.ts](../../apps/borealis/books/books.ctrl.md) ([[apps/borealis/books/books.ctrl]]) — `session`
- [apps/borealis/calendar/calendar.ctrl.ts](../../apps/borealis/calendar/calendar.ctrl.md) ([[apps/borealis/calendar/calendar.ctrl]]) — `session`
- [apps/borealis/games/games.ctrl.ts](../../apps/borealis/games/games.ctrl.md) ([[apps/borealis/games/games.ctrl]]) — `session`
- [apps/borealis/lists/lists.ctrl.ts](../../apps/borealis/lists/lists.ctrl.md) ([[apps/borealis/lists/lists.ctrl]]) — `session`
- [apps/borealis/manga/manga.ctrl.ts](../../apps/borealis/manga/manga.ctrl.md) ([[apps/borealis/manga/manga.ctrl]]) — `session`
- [apps/borealis/movies/movies.ctrl.ts](../../apps/borealis/movies/movies.ctrl.md) ([[apps/borealis/movies/movies.ctrl]]) — `session`
- [apps/borealis/music/music.ctrl.ts](../../apps/borealis/music/music.ctrl.md) ([[apps/borealis/music/music.ctrl]]) — `session`
- [apps/borealis/other/other.ctrl.ts](../../apps/borealis/other/other.ctrl.md) ([[apps/borealis/other/other.ctrl]]) — `session`
- [apps/borealis/playlists/playlists.ctrl.ts](../../apps/borealis/playlists/playlists.ctrl.md) ([[apps/borealis/playlists/playlists.ctrl]]) — `session`
- [apps/borealis/tv/tv.ctrl.ts](../../apps/borealis/tv/tv.ctrl.md) ([[apps/borealis/tv/tv.ctrl]]) — `session`
- [apps/carina/activity/activity.ctrl.ts](../../apps/carina/activity/activity.ctrl.md) ([[apps/carina/activity/activity.ctrl]]) — `session`
- [apps/carina/apikeys/apikeys.ctrl.ts](../../apps/carina/apikeys/apikeys.ctrl.md) ([[apps/carina/apikeys/apikeys.ctrl]]) — `session`
- [apps/carina/auth/auth.ctrl.ts](../../apps/carina/auth/auth.ctrl.md) ([[apps/carina/auth/auth.ctrl]]) — `session`
- [apps/carina/backupcodes/backupcodes.ctrl.ts](../../apps/carina/backupcodes/backupcodes.ctrl.md) ([[apps/carina/backupcodes/backupcodes.ctrl]]) — `session`
- [apps/carina/bookmarks/bookmarks.ctrl.ts](../../apps/carina/bookmarks/bookmarks.ctrl.md) ([[apps/carina/bookmarks/bookmarks.ctrl]]) — `session`
- [apps/carina/comments/comments.ctrl.ts](../../apps/carina/comments/comments.ctrl.md) ([[apps/carina/comments/comments.ctrl]]) — `session`
- [apps/carina/connections/connections.ctrl.ts](../../apps/carina/connections/connections.ctrl.md) ([[apps/carina/connections/connections.ctrl]]) — `session`
- [apps/carina/email-2fa/email-2fa.ctrl.ts](../../apps/carina/email-2fa/email-2fa.ctrl.md) ([[apps/carina/email-2fa/email-2fa.ctrl]]) — `session`
- [apps/carina/favorites/favorites.ctrl.ts](../../apps/carina/favorites/favorites.ctrl.md) ([[apps/carina/favorites/favorites.ctrl]]) — `session`
- [apps/carina/friends/friends.ctrl.ts](../../apps/carina/friends/friends.ctrl.md) ([[apps/carina/friends/friends.ctrl]]) — `session`
- [apps/carina/notifications/notifications.ctrl.ts](../../apps/carina/notifications/notifications.ctrl.md) ([[apps/carina/notifications/notifications.ctrl]]) — `session`
- [apps/carina/oauth/oauth.ctrl.ts](../../apps/carina/oauth/oauth.ctrl.md) ([[apps/carina/oauth/oauth.ctrl]]) — `session`
- [apps/carina/oauth/oauth.serv.ts](../../apps/carina/oauth/oauth.serv.md) ([[apps/carina/oauth/oauth.serv]]) — `SessionUser`
- [apps/carina/passkeys/passkeys.ctrl.ts](../../apps/carina/passkeys/passkeys.ctrl.md) ([[apps/carina/passkeys/passkeys.ctrl]]) — `session`
- [apps/carina/qc/qc.ctrl.ts](../../apps/carina/qc/qc.ctrl.md) ([[apps/carina/qc/qc.ctrl]]) — `session`
- [apps/carina/recommendations/recommendations.ctrl.ts](../../apps/carina/recommendations/recommendations.ctrl.md) ([[apps/carina/recommendations/recommendations.ctrl]]) — `session`
- [apps/carina/totp/totp.ctrl.ts](../../apps/carina/totp/totp.ctrl.md) ([[apps/carina/totp/totp.ctrl]]) — `session`
- [apps/carina/users/users.ctrl.ts](../../apps/carina/users/users.ctrl.md) ([[apps/carina/users/users.ctrl]]) — `session`
- [apps/kiroshi/history/history.ctrl.ts](../../apps/kiroshi/history/history.ctrl.md) ([[apps/kiroshi/history/history.ctrl]]) — `session`
- [apps/kiroshi/search/search.ctrl.ts](../../apps/kiroshi/search/search.ctrl.md) ([[apps/kiroshi/search/search.ctrl]]) — `session`
- [apps/kiroshi/settings/settings.ctrl.ts](../../apps/kiroshi/settings/settings.ctrl.md) ([[apps/kiroshi/settings/settings.ctrl]]) — `session`
- [apps/servarr/core/servarr.ctrl.ts](../../apps/servarr/core/servarr.ctrl.md) ([[apps/servarr/core/servarr.ctrl]]) — `session`
- [apps/servarr/extended/servarr-extended.ctrl.ts](../../apps/servarr/extended/servarr-extended.ctrl.md) ([[apps/servarr/extended/servarr-extended.ctrl]]) — `session`
- [apps/tesseract/signaling/tesseract.ctrl.ts](../../apps/tesseract/signaling/tesseract.ctrl.md) ([[apps/tesseract/signaling/tesseract.ctrl]]) — `session`
- [apps/tesseract/signaling/tesseract.serv.ts](../../apps/tesseract/signaling/tesseract.serv.md) ([[apps/tesseract/signaling/tesseract.serv]]) — `resolveSessionFromRequest`
- [core/plugins/rate-limiter.ts](./rate-limiter.md) ([[core/plugins/rate-limiter]]) — `Session`
- [server.ts](../../server.md) ([[server]]) — `resolveSessionFromRequest`
