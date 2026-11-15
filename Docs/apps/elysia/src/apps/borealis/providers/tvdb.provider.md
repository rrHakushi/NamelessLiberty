# tvdb.provider.ts

- **Source**: [`apps/borealis/providers/tvdb.provider.ts`](../../../../../../../apps/elysia/src/apps/borealis/providers/tvdb.provider.ts)
- **Layer / Role**: External Metadata Provider
- **Inheritance**: `TheTVDBProvider extends BaseMediaProvider`

## Exported Types, Methods & Algorithms

### `function normalizeTvdbImageUrl` (L6)

- **1.** `[If]` `!url`
  - **1.1.** `[Return]`  — `null`
- **2.** `[Sequence]` Define `trimmed`
  ```typescript
  const trimmed = url.trim()
  ```
- **3.** `[If]` `!trimmed`
  - **3.1.** `[Return]`  — `null`
- **4.** `[If]` `trimmed.startsWith('http://') || trimmed.startsWith('https://')`
  - **4.1.** `[Return]`  — `trimmed`
- **5.** `[If]` `trimmed.startsWith('/')`
  - **5.1.** `[Return]`  — ``https://artworks.thetvdb.com${trimmed}``
- **6.** `[Return]`  — ``https://artworks.thetvdb.com/${trimmed}``

### `interface TvdbCharacter` (L15)

### `interface TvdbEpisode` (L28)

### `interface TvdbCompany` (L41)

### `interface TvdbSearchItem` (L47)

### `interface TvdbSeriesPayload` (L62)

### `interface TvdbMoviePayload` (L127)

### `class TheTVDBProvider` extends `BaseMediaProvider` (L181)

#### `constructor()` (L182)

- _No executable statements_

#### `getApiKey()`: `string` (L191)

- **1.** `[Sequence]` Define `key`
  ```typescript
  const key = Bun.env.TVDB_API_KEY
  ```
- **2.** `[If]` `!key`
  - **2.1.** `[Error]` Throws `Error` — '[TheTVDBProvider] Missing required environment variable: TVDB_API_KEY'
- **3.** `[Return]`  — `key`

#### `waitForRateLimit()`: `Promise<void>` (L199)

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

#### `getValidToken()`: `Promise<string>` (L208)

- **1.** `[Sequence]` Calls `Date.now` and stores result as `now`
- **2.** `[If]` `this.token && this.tokenExpiresAt > now + 60000`
  - **2.1.** `[Return]`  — `this.token`
- **3.** `[Sequence]` Calls `this.getApiKey` and stores result as `apiKey`
- **4.** `[Sequence]` Define `body`
  ```typescript
  const body: Record<string, string> = { apikey: apiKey }
  ```
- **5.** `[Sequence]` Calls `fetch` and stores result as `res`
- **6.** `[If]` `!res.ok`
  - **6.1.** `[Sequence]` Calls `res.text().catch` and stores result as `errText`
  - **6.2.** `[Error]` Throws `Error` — `[TheTVDBProvider] Login failed HTTP ${res.status}: ${errText}`
- **7.** `[Sequence]` Define `json`
  ```typescript
  const json = (await res.json()) as { data?: { token?: string } }
  ```
- **8.** `[If]` `!json.data?.token`
  - **8.1.** `[Error]` Throws `Error` — '[TheTVDBProvider] No token received from login'
- **9.** `[Sequence]` Assign `this.token`
  ```typescript
  this.token = json.data.token
  ```
- **10.** `[Sequence]` Assign `this.tokenExpiresAt`
  ```typescript
  this.tokenExpiresAt = now + 28 * 24 * 60 * 60 * 1000
  ```
- **11.** `[Return]`  — `this.token`

#### `fetchJson(endpoint)`: `Promise<T | null>` (L241)

- **1.** `[Sequence]` Calls `this.waitForRateLimit`
- **2.** `[Sequence]` Calls `this.getValidToken` and stores result as `token`
- **3.** `[Sequence]` Define `url`
  ```typescript
  const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`
  ```
- **4.** `[Sequence]` Calls `fetch` and stores result as `res`
- **5.** `[If]` `!res.ok`
  - **5.1.** `[If]` `res.status === 404`
    - **5.1.1.** `[Return]`  — `null`
  - **5.2.** `[Error]` Throws `Error` — `[TheTVDBProvider] Request to ${endpoint} failed HTTP ${res.status}`
- **6.** `[Sequence]` Define `json`
  ```typescript
  const json = (await res.json()) as { data?: T }
  ```
- **7.** `[Return]`  — `json.data ?? null`

#### `searchTvSeries(query, limit = 25)`: `Promise<TvdbSearchItem[]>` (L265)
Searches TVDB specifically for TV Series and returns search preview items.

- **1.** `[Sequence]` Define `clean`
  ```typescript
  const clean = query.trim()
  ```
- **2.** `[If]` `!clean`
  - **2.1.** `[Return]`  — `[]`
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `Math.min` and stores result as `maxLimit`
  - **3.2.** `[Sequence]` Define `url`
    ```typescript
    const url = `/search?query=${encodeURIComponent(clean)}&type=series&limit=${maxLimit}`
    ```
  - **3.3.** `[Sequence]` Calls `this.fetchJson` and stores result as `results`
  - **3.4.** `[Return]`  — `Array.isArray(results) ? results : []`
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Sequence]` Calls `logger.error`
  - **4.2.** `[Return]`  — `[]`

#### `searchMovies(query, limit = 25)`: `Promise<TvdbSearchItem[]>` (L283)
Searches TVDB specifically for Movies and returns search preview items.

- **1.** `[Sequence]` Define `clean`
  ```typescript
  const clean = query.trim()
  ```
- **2.** `[If]` `!clean`
  - **2.1.** `[Return]`  — `[]`
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `Math.min` and stores result as `maxLimit`
  - **3.2.** `[Sequence]` Define `url`
    ```typescript
    const url = `/search?query=${encodeURIComponent(clean)}&type=movie&limit=${maxLimit}`
    ```
  - **3.3.** `[Sequence]` Calls `this.fetchJson` and stores result as `results`
  - **3.4.** `[Return]`  — `Array.isArray(results) ? results : []`
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Sequence]` Calls `logger.error`
  - **4.2.** `[Return]`  — `[]`

#### `fetchMovieTranslation(tvdbId, language = 'eng')`: `Promise<{ name?: string overview?: string language?: string aliases?: string[] } | null>` (L301)
Fetches translation for a Movie (e.g. English name & overview).

- **1.** `[Try]` Try block
  - **1.1.** `[Return]`  — `await this.fetchJson(`/movies/${tvdbId}/translations/${language}`)`
- **2.** `[Catch]` Catch (`err`)
  - **2.1.** `[Return]`  — `null`

#### `fetchTvSeriesTranslation(tvdbId, language = 'eng')`: `Promise<{ name?: string overview?: string language?: string aliases?: string[] } | null>` (L325)
Fetches translation for a TV series (e.g. English name & overview).

- **1.** `[Try]` Try block
  - **1.1.** `[Return]`  — `await this.fetchJson(`/series/${tvdbId}/translations/${language}`)`
- **2.** `[Catch]` Catch (`err`)
  - **2.1.** `[Return]`  — `null`

#### `fetchTvCharacters(tvdbId)`: `Promise<TvdbCharacter[]>` (L349)
Fetches all characters & cast for a TV series.

- **1.** `[Try]` Try block
  - **1.1.** `[Sequence]` Calls `this.fetchJson` and stores result as `chars`
  - **1.2.** `[Return]`  — `Array.isArray(chars) ? chars : []`
- **2.** `[Catch]` Catch (`err`)
  - **2.1.** `[Return]`  — `[]`

#### `fetchTvEpisodes(tvdbId, language = 'eng')`: `Promise<TvdbEpisode[]>` (L361)
Fetches all episodes across all seasons for a TV series (paginated).

- **1.** `[Sequence]` Define `allEpisodes`, `page`, `hasMore`
  ```typescript
  const allEpisodes: TvdbEpisode[] = []
  let page = 0
  let hasMore = true
  ```
- **2.** `[Loop]` While `hasMore && page < 20`
  - **2.1.** `[Try]` Try block
    - **2.1.1.** `[Sequence]` Define `res`
      ```typescript
      let res: { episodes?: TvdbEpisode[] } | null = null
      ```
    - **2.1.2.** `[If]` `language`
      - **2.1.2.1.** `[Try]` Try block
        - **2.1.2.1.1.** `[Sequence]` Assign `res`
          ```typescript
          res = await this.fetchJson<{ episodes?: TvdbEpisode[] }>(`/series/${tvdbId}/episodes/default/${language}?page=${page}`)
          ```
      - **2.1.2.2.** `[Catch]` Catch (`err`)
        - **2.1.2.2.1.** `[Sequence]` Assign `res`
          ```typescript
          res = null
          ```
    - **2.1.3.** `[If]` `!res || !res.episodes || res.episodes.length === 0`
      - **2.1.3.1.** `[Sequence]` Assign `res`
        ```typescript
        res = await this.fetchJson<{ episodes?: TvdbEpisode[] }>(`/series/${tvdbId}/episodes/default?page=${page}`)
        ```
    - **2.1.4.** `[Sequence]` Define `episodes`
      ```typescript
      const episodes = res?.episodes || []
      ```
    - **2.1.5.** `[If]` `episodes.length === 0`
      - **2.1.5.1.** `[Sequence]` Assign `hasMore`
        ```typescript
        hasMore = false
        ```
    - **2.1.6.** `[Else]` Otherwise
  - **2.2.** `[Catch]` Catch (`err`)
    - **2.2.1.** `[Sequence]` Assign `hasMore`
      ```typescript
      hasMore = false
      ```
- **3.** `[Return]`  — `allEpisodes`

#### `fetchTvSeries(tvdbId)`: `Promise<TvdbSeriesPayload | null>` (L406)
Fetches full details for a TV Series.

- **1.** `[Sequence]` Calls `this.fetchJson` and stores result as `series`
- **2.** `[If]` `series && series.originalLanguage?.toLowerCase() !== 'eng' || series.nameTranslations?.includes('eng') || series.overviewTranslations?.includes('eng')`
  - **2.1.** `[Sequence]` Calls `this.fetchTvSeriesTranslation(tvdbId, 'eng').catch` and stores result as `eng`
  - **2.2.** `[If]` `eng`
    - **2.2.1.** `[Sequence]` Assign `series.engTranslation`
      ```typescript
      series.engTranslation = eng
      ```
- **3.** `[Return]`  — `series`

#### `fetchMovie(tvdbId)`: `Promise<TvdbMoviePayload | null>` (L425)
Fetches full details for a Movie.

- **1.** `[Sequence]` Calls `this.fetchJson` and stores result as `movie`
- **2.** `[If]` `movie && movie.originalLanguage?.toLowerCase() !== 'eng' || movie.nameTranslations?.includes('eng') || movie.overviewTranslations?.includes('eng')`
  - **2.1.** `[Sequence]` Calls `this.fetchMovieTranslation(tvdbId, 'eng').catch` and stores result as `eng`
  - **2.2.** `[If]` `eng`
    - **2.2.1.** `[Sequence]` Assign `movie.engTranslation`
      ```typescript
      movie.engTranslation = eng
      ```
- **3.** `[Return]`  — `movie`

#### `fetchTvSeriesArtworks(tvdbId)`: `Promise<string[]>` (L444)
Fetches all discovered artwork/image URLs for a series.

- **1.** `[Sequence]` Define `urls`
  ```typescript
  const urls = new Set<string>()
  ```
- **2.** `[Try]` Try block
  - **2.1.** `[Sequence]` Calls `this.fetchTvSeries` and stores result as `series`
  - **2.2.** `[If]` `series?.image`
    - **2.2.1.** `[Sequence]` Calls `normalizeTvdbImageUrl` and stores result as `img`
    - **2.2.2.** `[If]` `img`
      - **2.2.2.1.** `[Sequence]` Calls `urls.add`
  - **2.3.** `[If]` `series?.artworks && Array.isArray(series.artworks)`
    - **2.3.1.** `[Loop]` Iterate `const art` over `series.artworks`
      - **2.3.1.1.** `[Sequence]` Calls `normalizeTvdbImageUrl` and stores result as `img`
      - **2.3.1.2.** `[If]` `img`
        - **2.3.1.2.1.** `[Sequence]` Calls `urls.add`
  - **2.4.** `[If]` `series?.seasons && Array.isArray(series.seasons)`
    - **2.4.1.** `[Loop]` Iterate `const s` over `series.seasons`
      - **2.4.1.1.** `[If]` `s.image`
        - **2.4.1.1.1.** `[Sequence]` Calls `normalizeTvdbImageUrl` and stores result as `img`
        - **2.4.1.1.2.** `[If]` `img`
          - **2.4.1.1.2.1.** `[Sequence]` Calls `urls.add`
- **3.** `[Catch]` Catch (`err`)
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Calls `this.fetchJson` and stores result as `res`
  - **4.2.** `[If]` `res?.artworks && Array.isArray(res.artworks)`
    - **4.2.1.** `[Loop]` Iterate `const art` over `res.artworks`
      - **4.2.1.1.** `[Sequence]` Calls `normalizeTvdbImageUrl` and stores result as `img`
      - **4.2.1.2.** `[If]` `img`
        - **4.2.1.2.1.** `[Sequence]` Calls `urls.add`
- **5.** `[Catch]` Catch (`err`)
- **6.** `[Return]`  — `Array.from(urls)`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/borealis/_shared/base-provider.ts](../_shared/base-provider.md) ([[apps/borealis/_shared/base-provider]]) — `BaseMediaProvider`

### External / Workspace Packages
- `@NamelessLiberty/logger` — `LogFactory`

### Called By / Imported By
- [apps/borealis/providers/index.ts](./index.md) ([[apps/borealis/providers/index]]) — `TheTVDBProvider`
- [apps/borealis/sync/media-preview.syncer.ts](../sync/media-preview.syncer.md) ([[apps/borealis/sync/media-preview.syncer]]) — `normalizeTvdbImageUrl`, `TvdbSearchItem`
