# anilist.provider.ts

- **Source**: [`apps/borealis/providers/anilist.provider.ts`](../../../../../../../apps/elysia/src/apps/borealis/providers/anilist.provider.ts)
- **Layer / Role**: External Metadata Provider
- **Inheritance**: `AniListProvider extends BaseMediaProvider`

## Exported Types, Methods & Algorithms

### `interface AniListMediaRelationNode` (L6)

### `interface AniListMediaRelationEdge` (L24)

### `interface AniListAnimePayload` (L29)

### `interface AniListMangaPayload` (L143)

### `interface AniListAnimeSearchPreview` (L226)

### `interface AniListMangaSearchPreview` (L245)

### `interface AniListCharacterPayload` (L265)

### `interface AniListStaffPayload` (L285)

### `class AniListProvider` extends `BaseMediaProvider` (L304)

#### `constructor()` (L305)

- _No executable statements_

#### `getAppToken()`: `Promise<string | null>` (L319)

- **1.** `[Sequence]` Define `clientId`, `clientSecret`
  ```typescript
  const clientId = Bun.env.ANILIST_CLIENT_ID
  const clientSecret = Bun.env.ANILIST_CLIENT_SECRET
  ```
- **2.** `[If]` `!clientId || !clientSecret`
  - **2.1.** `[Return]`  — `null`
- **3.** `[Sequence]` Calls `Date.now` and stores result as `now`
- **4.** `[If]` `this.appToken && this.tokenExpiresAt > now + 60000`
  - **4.1.** `[Return]`  — `this.appToken`
- **5.** `[Try]` Try block
  - **5.1.** `[Sequence]` Calls `fetch` and stores result as `res`
  - **5.2.** `[If]` `res.ok`
    - **5.2.1.** `[Sequence]` Define `data`
      ```typescript
      const data = (await res.json()) as { access_token: string; expires_in: number }
      ```
    - **5.2.2.** `[If]` `data.access_token`
      - **5.2.2.1.** `[Sequence]` Assign `this.appToken`
        ```typescript
        this.appToken = data.access_token
        ```
      - **5.2.2.2.** `[Sequence]` Assign `this.tokenExpiresAt`
        ```typescript
        this.tokenExpiresAt = now + (data.expires_in || 31536000) * 1000
        ```
      - **5.2.2.3.** `[Return]`  — `this.appToken`
- **6.** `[Catch]` Catch (`err`)
- **7.** `[Return]`  — `null`

#### `waitForRateLimit()`: `Promise<void>` (L358)

- **1.** `[Sequence]` Calls `Date.now` and stores result as `now`
- **2.** `[If]` `this.pauseUntil > now`
  - **2.1.** `[Sequence]` Define `waitMs`
    ```typescript
    const waitMs = this.pauseUntil - now
    ```
  - **2.2.** `[If]` `waitMs > 0`
- **3.** `[Sequence]` Calls `Date.now` and stores result as `currentNow`
- **4.** `[If]` `this.rateLimitRemaining <= 2 && this.rateLimitResetTimestamp > 0`
  - **4.1.** `[Sequence]` Calls `Math.max` and stores result as `waitMs`
  - **4.2.** `[If]` `waitMs > 0 && waitMs < 120000`
    - **4.2.1.** `[Sequence]` Calls `waitMs / 1000.toFixed` and stores result as `sec`
    - **4.2.2.** `[Sequence]` Calls `Date.now` and stores result as `now2`
    - **4.2.3.** `[If]` `now2 - this.last429LogTime > 4000`
      - **4.2.3.1.** `[Sequence]` Assign `this.last429LogTime`
        ```typescript
        this.last429LogTime = now2
        ```
      - **4.2.3.2.** `[Warning]` Logs warning — `AniList threshold reached (remaining: ${this.rateLimitRemaining}). Pausing for ${sec}s...`
- **5.** `[Sequence]` Define `elapsed`
  ```typescript
  const elapsed = Date.now() - this.lastRequestTime
  ```
- **6.** `[If]` `elapsed < this.minDelayMs`

#### `executeGraphQL(query, variables)`: `Promise<T>` (L387)

- **1.** `[Sequence]` Calls `this.requestQueue.then` and stores result as `queuePromise`
- **2.** `[Sequence]` Assign `this.requestQueue`
  ```typescript
  this.requestQueue = queuePromise.then(() => {}).catch(() => {})
  ```
- **3.** `[Return]`  — `queuePromise`

#### `performGraphQLRequest(query, variables)`: `Promise<T>` (L395)

- **1.** `[Sequence]` Calls `this.waitForRateLimit`
- **2.** `[Sequence]` Define `headers`
  ```typescript
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'IRIS-Platform/1.0 (https://iris.app)', }
  ```
- **3.** `[Sequence]` Calls `this.getAppToken` and stores result as `token`
- **4.** `[If]` `token`
  - **4.1.** `[Sequence]` Assign `headers['Authorization']`
    ```typescript
    headers['Authorization'] = `Bearer ${token}`
    ```
- **5.** `[Sequence]` Calls `fetch` and stores result as `res`
- **6.** `[Sequence]` Assign `this.lastRequestTime`
  ```typescript
  this.lastRequestTime = Date.now()
  ```
- **7.** `[Sequence]` Calls `res.headers.get` and stores result as `remainingHeader`
- **8.** `[Sequence]` Calls `res.headers.get` and stores result as `resetHeader`
- **9.** `[If]` `remainingHeader !== null`
  - **9.1.** `[Sequence]` Calls `parseInt` and stores result as `parsedRemaining`
  - **9.2.** `[If]` `!isNaN(parsedRemaining)`
    - **9.2.1.** `[Sequence]` Assign `this.rateLimitRemaining`
      ```typescript
      this.rateLimitRemaining = parsedRemaining
      ```
- **10.** `[If]` `resetHeader !== null`
  - **10.1.** `[Sequence]` Calls `parseInt` and stores result as `parsedReset`
  - **10.2.** `[If]` `!isNaN(parsedReset)`
    - **10.2.1.** `[Sequence]` Assign `this.rateLimitResetTimestamp`
      ```typescript
      this.rateLimitResetTimestamp = parsedReset
      ```
- **11.** `[If]` `res.status === 429`
  - **11.1.** `[Sequence]` Define `retryAfter`
    ```typescript
    const retryAfter = Number(res.headers.get('Retry-After')) || 60
    ```
  - **11.2.** `[Sequence]` Assign `this.pauseUntil`
    ```typescript
    this.pauseUntil = Date.now() + retryAfter * 1000
    ```
  - **11.3.** `[Warning]` Logs warning — `AniList HTTP 429. Pausing for ${retryAfter}s...`
  - **11.4.** `[Return]`  — `this.performGraphQLRequest(query, variables)`
- **12.** `[If]` `!res.ok`
  - **12.1.** `[Sequence]` Calls `res.text` and stores result as `text`
  - **12.2.** `[Error]` Throws `Error` — `AniList GraphQL failed HTTP ${res.status}: ${text}`
- **13.** `[Sequence]` Define `json`
  ```typescript
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> }
  ```
- **14.** `[If]` `json.errors && json.errors.length > 0`
  - **14.1.** `[Error]` Throws `Error` — `AniList GraphQL Error: ${json.errors[0]?.message || 'Unknown error'}`
- **15.** `[If]` `!json.data`
  - **15.1.** `[Error]` Throws `Error` — 'AniList GraphQL response contained no data payload'
- **16.** `[Return]`  — `json.data`

#### `searchAnime(query, limit = 25)`: `Promise<AniListAnimeSearchPreview[]>` (L456)
Searches AniList for anime by title/query and returns minimal search preview items.

- **1.** `[Sequence]` Define `clean`
  ```typescript
  const clean = query.trim()
  ```
- **2.** `[If]` `!clean`
  - **2.1.** `[Return]`  — `[]`
- **3.** `[Sequence]` Define `gqlQuery`
  ```typescript
  const gqlQuery = ` query SearchAnime($search: String, $perPage: Int) { Page(page: 1, perPage: $perPage) { media(search: $search, type: ANIME, sort: SEARCH_MATCH) { id title { userPreferred ...
  ```
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Calls `this.executeGraphQL` and stores result as `data`
  - **4.2.** `[Return]`  — `data.Page?.media || []`
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[Sequence]` Calls `logger.error`
  - **5.2.** `[Return]`  — `[]`

#### `searchManga(query, limit = 25)`: `Promise<AniListMangaSearchPreview[]>` (L500)
Searches AniList for manga by title/query and returns minimal search preview items.

- **1.** `[Sequence]` Define `clean`
  ```typescript
  const clean = query.trim()
  ```
- **2.** `[If]` `!clean`
  - **2.1.** `[Return]`  — `[]`
- **3.** `[Sequence]` Define `gqlQuery`
  ```typescript
  const gqlQuery = ` query SearchManga($search: String, $perPage: Int) { Page(page: 1, perPage: $perPage) { media(search: $search, type: MANGA, sort: SEARCH_MATCH) { id title { userPreferred ...
  ```
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Calls `this.executeGraphQL` and stores result as `data`
  - **4.2.** `[Return]`  — `data.Page?.media || []`
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[Sequence]` Calls `logger.error`
  - **5.2.** `[Return]`  — `[]`

#### `fetchAnime(anilistId)`: `Promise<AniListAnimePayload>` (L545)
Fetches rich anime details from AniList by ID.

- **1.** `[Sequence]` Define `query`
  ```typescript
  const query = ` query GetAnimeDetails($id: Int) { Media(id: $id, type: ANIME) { id idMal updatedAt title { ...
  ```
- **2.** `[Sequence]` Calls `this.executeGraphQL` and stores result as `data`
- **3.** `[Return]`  — `data.Media`

#### `fetchManga(anilistId)`: `Promise<AniListMangaPayload>` (L725)
Fetches rich manga details from AniList by ID.

- **1.** `[Sequence]` Define `query`
  ```typescript
  const query = ` query GetMangaDetails($id: Int) { Media(id: $id, type: MANGA) { id idMal updatedAt title { ...
  ```
- **2.** `[Sequence]` Calls `this.executeGraphQL` and stores result as `data`
- **3.** `[Return]`  — `data.Media`

#### `fetchCharacter(anilistId)`: `Promise<AniListCharacterPayload | null>` (L850)
Fetches character details from AniList by ID with medium & large images.

- **1.** `[Sequence]` Define `query`
  ```typescript
  const query = ` query GetCharacterDetails($id: Int) { Character(id: $id) { id name { full native ...
  ```
- **2.** `[Try]` Try block
  - **2.1.** `[Sequence]` Calls `this.executeGraphQL` and stores result as `data`
  - **2.2.** `[Return]`  — `data.Character || null`
- **3.** `[Catch]` Catch (`err`)
  - **3.1.** `[Sequence]` Calls `logger.error`
  - **3.2.** `[Return]`  — `null`

#### `searchCharacters(query, limit = 25)`: `Promise<AniListCharacterPayload[]>` (L891)
Searches AniList for characters by name/query with medium & large images.

- **1.** `[Sequence]` Define `clean`
  ```typescript
  const clean = query.trim()
  ```
- **2.** `[If]` `!clean`
  - **2.1.** `[Return]`  — `[]`
- **3.** `[Sequence]` Define `gqlQuery`
  ```typescript
  const gqlQuery = ` query SearchCharacters($search: String, $perPage: Int) { Page(page: 1, perPage: $perPage) { characters(search: $search, sort: SEARCH_MATCH) { id name { full ...
  ```
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Calls `this.executeGraphQL` and stores result as `data`
  - **4.2.** `[Return]`  — `data.Page?.characters || []`
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[Sequence]` Calls `logger.error`
  - **5.2.** `[Return]`  — `[]`

#### `fetchStaff(anilistId)`: `Promise<AniListStaffPayload | null>` (L933)
Fetches staff details from AniList by ID with medium & large images.

- **1.** `[Sequence]` Define `query`
  ```typescript
  const query = ` query GetStaffDetails($id: Int) { Staff(id: $id) { id name { full native ...
  ```
- **2.** `[Try]` Try block
  - **2.1.** `[Sequence]` Calls `this.executeGraphQL` and stores result as `data`
  - **2.2.** `[Return]`  — `data.Staff || null`
- **3.** `[Catch]` Catch (`err`)
  - **3.1.** `[Sequence]` Calls `logger.error`
  - **3.2.** `[Return]`  — `null`

#### `searchStaff(query, limit = 25)`: `Promise<AniListStaffPayload[]>` (L973)
Searches AniList for staff/people by name/query with medium & large images.

- **1.** `[Sequence]` Define `clean`
  ```typescript
  const clean = query.trim()
  ```
- **2.** `[If]` `!clean`
  - **2.1.** `[Return]`  — `[]`
- **3.** `[Sequence]` Define `gqlQuery`
  ```typescript
  const gqlQuery = ` query SearchStaff($search: String, $perPage: Int) { Page(page: 1, perPage: $perPage) { staff(search: $search, sort: SEARCH_MATCH) { id name { full ...
  ```
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Calls `this.executeGraphQL` and stores result as `data`
  - **4.2.** `[Return]`  — `data.Page?.staff || []`
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[Sequence]` Calls `logger.error`
  - **5.2.** `[Return]`  — `[]`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/borealis/_shared/base-provider.ts](../_shared/base-provider.md) ([[apps/borealis/_shared/base-provider]]) — `BaseMediaProvider`

### External / Workspace Packages
- `@NamelessLiberty/logger` — `LogFactory`, `c`

### Called By / Imported By
- [apps/borealis/providers/index.ts](./index.md) ([[apps/borealis/providers/index]]) — `AniListProvider`
- [apps/borealis/sync/media-preview.syncer.ts](../sync/media-preview.syncer.md) ([[apps/borealis/sync/media-preview.syncer]]) — `AniListAnimeSearchPreview`, `AniListMangaSearchPreview`
