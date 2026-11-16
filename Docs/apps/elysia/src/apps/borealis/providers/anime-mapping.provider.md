# anime-mapping.provider.ts

- **Source**: [`apps/borealis/providers/anime-mapping.provider.ts`](../../../../../../../apps/elysia/src/apps/borealis/providers/anime-mapping.provider.ts)
- **Layer / Role**: External Metadata Provider
- **Inheritance**: `AnimeMappingProvider extends BaseMediaProvider`

## Exported Types, Methods & Algorithms

### `interface AnimeMappingEntry` (L7)

### `interface MangaMappingEntry` (L20)

### `class AnimeMappingProvider` extends `BaseMediaProvider` (L26)

#### `constructor()` (L27)

- _No executable statements_

#### `ensureLoaded()`: `Promise<void>` (L40)
Loads mapping databases from cache or remote repositories (Fribb/anime-lists & bangumi-data).

- **1.** `[If]` `this.isLoaded`
  - **1.1.** `[Return]`  — `void`
- **2.** `[If]` `this.loadPromise`
  - **2.1.** `[Return]`  — `this.loadPromise`
- **3.** `[Sequence]` Assign `this.loadPromise`
  ```typescript
  this.loadPromise = this.loadData()
  ```
- **4.** `[Sequence]` Assign `this.isLoaded`
  ```typescript
  this.isLoaded = true
  ```
- **5.** `[Sequence]` Assign `this.loadPromise`
  ```typescript
  this.loadPromise = null
  ```

#### `loadData()`: `Promise<void>` (L50)

- **1.** `[Try]` Try block
  - **1.1.** `[Sequence]` Define `CACHE_KEY_FRIBB`, `CACHE_KEY_BANGUMI`
    ```typescript
    const CACHE_KEY_FRIBB = 'media-mapping:anime:fribb:v1'
    const CACHE_KEY_BANGUMI = 'media-mapping:anime:bangumi:v1'
    ```
  - **1.2.** `[Sequence]` Cache `get` -> `fribbData`
  - **1.3.** `[Sequence]` Cache `get` -> `bangumiItems`
  - **1.4.** `[If]` `!fribbData`
    - **1.4.1.** `[Sequence]` Calls `fetch` and stores result as `res`
    - **1.4.2.** `[If]` `res.ok`
      - **1.4.2.1.** `[Sequence]` Assign `fribbData`
        ```typescript
        fribbData = (await res.json()) as any[]
        ```
      - **1.4.2.2.** `[If]` `Array.isArray(fribbData)`
        - **1.4.2.2.1.** `[Sequence]` Cache `set`
  - **1.5.** `[If]` `!bangumiItems`
    - **1.5.1.** `[Sequence]` Calls `fetch` and stores result as `res`
    - **1.5.2.** `[If]` `res.ok`
      - **1.5.2.1.** `[Sequence]` Define `bgmJson`
        ```typescript
        const bgmJson = (await res.json()) as { items?: any[] }
        ```
      - **1.5.2.2.** `[Sequence]` Assign `bangumiItems`
        ```typescript
        bangumiItems = bgmJson.items || []
        ```
      - **1.5.2.3.** `[If]` `Array.isArray(bangumiItems)`
        - **1.5.2.3.1.** `[Sequence]` Cache `set`
  - **1.6.** `[If]` `Array.isArray(fribbData)`
    - **1.6.1.** `[Loop]` Iterate `const item` over `fribbData`
      - **1.6.1.1.** `[If]` `item.anilist_id`
        - **1.6.1.1.1.** `[Sequence]` Calls `this.anilistMap.set`
      - **1.6.1.2.** `[If]` `item.mal_id`
        - **1.6.1.2.1.** `[Sequence]` Calls `this.malMap.set`
  - **1.7.** `[If]` `Array.isArray(bangumiItems)`
    - **1.7.1.** `[Loop]` Iterate `const item` over `bangumiItems`
      - **1.7.1.1.** `[Sequence]` Define `bgmSite`, `bgmId`
        ```typescript
        const bgmSite = item.sites?.find((s: any) => s.site === 'bangumi')
        const bgmId = bgmSite?.id ? parseInt(bgmSite.id, 10) : undefined
        ```
      - **1.7.1.2.** `[If]` `!bgmId`
      - **1.7.1.3.** `[Sequence]` Define `alSite`
        ```typescript
        const alSite = item.sites?.find( (s: any) => s.site === 'aniList' || s.site === 'anilist' )
        ```
      - **1.7.1.4.** `[If]` `alSite?.id`
        - **1.7.1.4.1.** `[Sequence]` Calls `this.bangumiAnilistMap.set`
      - **1.7.1.5.** `[Sequence]` Define `malSite`
        ```typescript
        const malSite = item.sites?.find((s: any) => s.site === 'mal')
        ```
      - **1.7.1.6.** `[If]` `malSite?.id`
        - **1.7.1.6.1.** `[Sequence]` Calls `this.bangumiMalMap.set`
- **2.** `[Catch]` Catch (`err`)
  - **2.1.** `[Warning]` Logs warning — `Failed to load remote mappings: ${err?.message || err}`

#### `lookup(identifiers)`: `Promise<AnimeMappingEntry>` (L123)
Fast O(1) identifier resolution across AniDB, TheTVDB, Bangumi, Kitsu, IMDb, TMDB for Anime.

- **1.** `[Sequence]` Calls `this.ensureLoaded`
- **2.** `[Sequence]` Define `entry`, `bangumiId`, `imdbId`, `tmdbId`, `anilistId`, `malId`
  ```typescript
  const entry = identifiers.anilistId ? this.anilistMap.get(identifiers.anilistId) : null || identifiers.malId ? this.malMap.get(identifiers.malId) : null
  const bangumiId = identifiers.anilistId ? this.bangumiAnilistMap.get(identifiers.anilistId) : null || identifiers.malId ? this.bangumiMalMap.get(identifiers.malId) : null
  const imdbId = Array.isArray(entry?.imdb_id) ? entry.imdb_id[0] : entry?.imdb_id
  const tmdbId = typeof entry?.themoviedb_id === 'object' ? entry.themoviedb_id?.tv || entry.themoviedb_id?.movie : entry?.themoviedb_id
  const anilistId = identifiers.anilistId || entry?.anilist_id ? parseInt(entry.anilist_id, 10) : undefined
  const malId = identifiers.malId || entry?.mal_id ? parseInt(entry.mal_id, 10) : undefined
  ```
- **3.** `[Return]` 
  ```json
  {
    "anilistId": "<anilistId>",
    "malId": "<malId>",
    "anidbId": "<entry?.anidb_id ? Number(entry.anidb_id) : undefined>",
    "tvdbId": "<entry?.tvdb_id ? Number(entry.tvdb_id) : undefined>",
    "bangumiId": "<bangumiId || undefined>",
    "kitsuId": "<entry?.kitsu_id ? Number(entry.kitsu_id) : undefined>",
    "imdbId": "<imdbId || undefined>",
    "tmdbId": "<tmdbId ? Number(tmdbId) : undefined>",
    "livechartId": "<entry?.livechart_id ? Number(entry.livechart_id) : undefined>",
    "animePlanetId": "<entry?.['anime-planet_id'] || undefined>"
  }
  ```

#### `lookupManga(identifiers)`: `Promise<MangaMappingEntry>` (L173)
Resolves Manga cross-site identifiers (MangaUpdates, Kitsu, Bangumi) via remote APIs with 7-day Redis caching.

- **1.** `[Sequence]` Define `keyPart`, `cacheKey`
  ```typescript
  const keyPart = identifiers.anilistId || identifiers.malId || encodeURIComponent(identifiers.title)
  const cacheKey = `media-mapping:manga:${keyPart}`
  ```
- **2.** `[Sequence]` Cache `get` -> `cached`
- **3.** `[If]` `cached`
  - **3.1.** `[Return]`  — `cached`
- **4.** `[Sequence]` Define `result`, `searchTitle`
  ```typescript
  const result: MangaMappingEntry = {}
  const searchTitle = identifiers.title.trim()
  ```
- **5.** `[If]` `!searchTitle && !identifiers.titleNative`
  - **5.1.** `[Return]`  — `result`
- **6.** `[Sequence]` Calls `async () => { if (!searchTitle) return try { const res = await fetch( 'https://api.mangaupdates.com/v1/series/search', { method: 'POST', ...` and stores result as `muPromise`
- **7.** `[Sequence]` Calls `async () => { if (!searchTitle) return try { const res = await fetch( `https://kitsu.app/api/edge/manga?filter[text]=${encodeURIComponent(searchTitle)}&page[limit]=1`, { headers: { Accept: 'application/vnd.api+json' } } ) ...` and stores result as `kitsuPromise`
- **8.** `[Sequence]` Define `bangumiPromise`
  ```typescript
  const bangumiPromise = async () => { try { const bgmKeyword = identifiers.titleNative?.trim() || searchTitle if (!bgmKeyword) return const res = await fetch('https://api.bgm.tv/v0/search/subjects', { method: 'POST', headers: { ...()
  ```
- **9.** `[Sequence]` Calls `Promise.all`
- **10.** `[If]` `result.mangaUpdatesId || result.kitsuId || result.bangumiId`
  - **10.1.** `[Sequence]` Cache `set`
- **11.** `[Return]`  — `result`

### `const animeMappingProvider` (L271)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/utils/cache.ts](../../../core/utils/cache.md) ([[core/utils/cache]]) — `cache`
- [apps/borealis/_shared/base-provider.ts](../_shared/base-provider.md) ([[apps/borealis/_shared/base-provider]]) — `BaseMediaProvider`

### External / Workspace Packages
- `@NamelessLiberty/logger` — `LogFactory`, `c`

### Called By / Imported By
- [apps/borealis/providers/index.ts](./index.md) ([[apps/borealis/providers/index]]) — `AnimeMappingProvider`
