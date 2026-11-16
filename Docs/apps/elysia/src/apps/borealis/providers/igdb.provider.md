# igdb.provider.ts

- **Source**: [`apps/borealis/providers/igdb.provider.ts`](../../../../../../../apps/elysia/src/apps/borealis/providers/igdb.provider.ts)
- **Layer / Role**: External Metadata Provider
- **Inheritance**: `IGDBProvider extends BaseMediaProvider`

## Exported Types, Methods & Algorithms

### `interface IgdbSearchPreview` (L6)

### `interface IgdbGamePayload` (L13)

### `class IGDBProvider` extends `BaseMediaProvider` (L43)

#### `constructor()` (L44)

- _No executable statements_

#### `getClientId()`: `string` (L53)

- **1.** `[Sequence]` Define `id`
  ```typescript
  const id = Bun.env.IGDB_CLIENT_ID
  ```
- **2.** `[If]` `!id`
  - **2.1.** `[Error]` Throws `Error` — '[IGDBProvider] Missing required environment variable: IGDB_CLIENT_ID'
- **3.** `[Return]`  — `id`

#### `getClientSecret()`: `string` (L61)

- **1.** `[Sequence]` Define `secret`
  ```typescript
  const secret = Bun.env.IGDB_CLIENT_SECRET
  ```
- **2.** `[If]` `!secret`
  - **2.1.** `[Error]` Throws `Error` — '[IGDBProvider] Missing required environment variable: IGDB_CLIENT_SECRET'
- **3.** `[Return]`  — `secret`

#### `waitForRateLimit()`: `Promise<void>` (L69)

- **1.** `[Sequence]` Calls `Date.now` and stores result as `now`
- **2.** `[Sequence]` Define `elapsed`
  ```typescript
  const elapsed = now - this.lastRequestTime
  ```
- **3.** `[If]` `elapsed < this.minDelayMs`
- **4.** `[Sequence]` Assign `this.lastRequestTime`
  ```typescript
  this.lastRequestTime = Date.now()
  ```

#### `getValidToken()`: `Promise<string>` (L78)

- **1.** `[Sequence]` Calls `Date.now` and stores result as `now`
- **2.** `[If]` `this.accessToken && this.tokenExpiresAt > now + 60000`
  - **2.1.** `[Return]`  — `this.accessToken`
- **3.** `[Sequence]` Calls `this.getClientId` and stores result as `clientId`
- **4.** `[Sequence]` Calls `this.getClientSecret` and stores result as `clientSecret`
- **5.** `[If]` `!clientId || !clientSecret`
  - **5.1.** `[Error]` Throws `Error` — '[IGDBProvider] IGDB_CLIENT_ID or IGDB_CLIENT_SECRET is missing in environment'
- **6.** `[Sequence]` Define `tokenUrl`
  ```typescript
  const tokenUrl = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
  ```
- **7.** `[Sequence]` Calls `fetch` and stores result as `res`
- **8.** `[If]` `!res.ok`
  - **8.1.** `[Sequence]` Calls `res.text().catch` and stores result as `errText`
  - **8.2.** `[Error]` Throws `Error` — `[IGDBProvider] Twitch OAuth token failed HTTP ${res.status}: ${errText}`
- **9.** `[Sequence]` Define `json`
  ```typescript
  const json = (await res.json()) as { access_token: string; expires_in: number }
  ```
- **10.** `[Sequence]` Assign `this.accessToken`
  ```typescript
  this.accessToken = json.access_token
  ```
- **11.** `[Sequence]` Assign `this.tokenExpiresAt`
  ```typescript
  this.tokenExpiresAt = now + (json.expires_in - 300) * 1000
  ```
- **12.** `[Return]`  — `this.accessToken`

#### `searchGames(query, limit = 25)`: `Promise<IgdbSearchPreview[]>` (L108)
Searches IGDB for games by title/query.

- **1.** `[Sequence]` Define `clean`
  ```typescript
  const clean = query.trim()
  ```
- **2.** `[If]` `!clean`
  - **2.1.** `[Return]`  — `[]`
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `this.waitForRateLimit`
  - **3.2.** `[Sequence]` Calls `this.getValidToken` and stores result as `token`
  - **3.3.** `[Sequence]` Calls `this.getClientId` and stores result as `clientId`
  - **3.4.** `[Sequence]` Calls `Math.min` and stores result as `maxResults`
  - **3.5.** `[Sequence]` Define `sanitized`, `igdbQuery`
    ```typescript
    const sanitized = clean.replace(/"/g, '\"')
    const igdbQuery = ` search "${sanitized}"; fields id, name, cover.image_id, first_release_date; limit ${maxResults}; `
    ```
  - **3.6.** `[Sequence]` Calls `fetch` and stores result as `res`
  - **3.7.** `[If]` `res.status === 429`
    - **3.7.1.** `[Sequence]` Define `retryAfter`
      ```typescript
      const retryAfter = Number(res.headers.get('Retry-After')) || 5
      ```
    - **3.7.2.** `[Warning]` Logs warning — `IGDB HTTP 429. Backing off for ${retryAfter}s...`
    - **3.7.3.** `[Return]`  — `this.searchGames(query, limit)`
  - **3.8.** `[If]` `!res.ok`
    - **3.8.1.** `[Return]`  — `[]`
  - **3.9.** `[Sequence]` Define `items`
    ```typescript
    const items = (await res.json()) as IgdbSearchPreview[]
    ```
  - **3.10.** `[If]` `!Array.isArray(items)`
    - **3.10.1.** `[Return]`  — `[]`
  - **3.11.** `[Return]`  — `items.filter((g) => Boolean(g && typeof g.id === 'number'))`
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Sequence]` Calls `logger.error`
  - **4.2.** `[Return]`  — `[]`

#### `fetchGame(igdbId)`: `Promise<IgdbGamePayload | null>` (L158)
Fetches game details by IGDB Game ID.

- **1.** `[Sequence]` Calls `this.waitForRateLimit`
- **2.** `[Sequence]` Calls `this.getValidToken` and stores result as `token`
- **3.** `[Sequence]` Calls `this.getClientId` and stores result as `clientId`
- **4.** `[Sequence]` Define `query`
  ```typescript
  const query = ` fields name, slug, summary, storyline, cover.image_id, screenshots.image_id, artworks.image_id, first_release_date, release_dates.date, release_dates.human, release_dates.region, genres.name, platforms.name, platforms.abbreviation, ...
  ```
- **5.** `[Sequence]` Calls `fetch` and stores result as `res`
- **6.** `[If]` `!res.ok`
  - **6.1.** `[Return]`  — `null`
- **7.** `[Sequence]` Define `items`
  ```typescript
  const items = (await res.json()) as IgdbGamePayload[]
  ```
- **8.** `[Return]`  — `items?.[0] ?? null`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/borealis/_shared/base-provider.ts](../_shared/base-provider.md) ([[apps/borealis/_shared/base-provider]]) — `BaseMediaProvider`

### External / Workspace Packages
- `@NamelessLiberty/logger` — `LogFactory`

### Called By / Imported By
- [apps/borealis/providers/index.ts](./index.md) ([[apps/borealis/providers/index]]) — `IGDBProvider`
- [apps/borealis/sync/media-preview.syncer.ts](../sync/media-preview.syncer.md) ([[apps/borealis/sync/media-preview.syncer]]) — `IgdbSearchPreview`
