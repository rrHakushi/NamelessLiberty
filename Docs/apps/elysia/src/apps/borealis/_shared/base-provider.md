# base-provider.ts

- **Source**: [`apps/borealis/_shared/base-provider.ts`](../../../../../../../apps/elysia/src/apps/borealis/_shared/base-provider.ts)
- **Layer / Role**: Module / Helper
- **Extended By**: [`AniListProvider`](../providers/anilist.provider.md) ([[apps/borealis/providers/anilist.provider]]), [`AnimeMappingProvider`](../providers/anime-mapping.provider.md) ([[apps/borealis/providers/anime-mapping.provider]]), [`DeezerProvider`](../providers/deezer.provider.md) ([[apps/borealis/providers/deezer.provider]]), [`GoogleBooksProvider`](../providers/google-books.provider.md) ([[apps/borealis/providers/google-books.provider]]), [`IGDBProvider`](../providers/igdb.provider.md) ([[apps/borealis/providers/igdb.provider]]), [`TheTVDBProvider`](../providers/tvdb.provider.md) ([[apps/borealis/providers/tvdb.provider]])

## Exported Types, Methods & Algorithms

### `class BaseMediaProvider` (L7)

Abstract base class for external metadata providers (AniList, TVDB, IGDB, Deezer, Google Books, AnimeMapping). Provides unified structured logging, timeout-bounded HTTP JSON fetching, and normalized error handling.

#### `constructor(providerName)` (L10)

- **1.** `[Sequence]` Assign `this.logger`
  ```typescript
  this.logger = new LogFactory(`Provider:${providerName}`)
  ```

#### `requestJson(url, init)`: `Promise<{ ok: boolean; status: number; data: T | null }>` (L17)
Executes a timeout-bounded HTTP request and parses JSON, returning null on non-OK status when `allowNotFound` is set.

- **1.** `[Sequence]` Define `{ timeoutMs = 15_000, ...requestInit }`
  ```typescript
  const { timeoutMs = 15_000, ...requestInit } = init ?? {}
  ```
- **2.** `[Try]` Try block
  - **2.1.** `[Sequence]` Calls `fetch` and stores result as `response`
  - **2.2.** `[If]` `!response.ok`
    - **2.2.1.** `[Return]` 
      ```json
      {
        "ok": false,
        "status": "<response.status>",
        "data": null
      }
      ```
  - **2.3.** `[Sequence]` Define `data`
    ```typescript
    const data = (await response.json()) as T
    ```
  - **2.4.** `[Return]` 
    ```json
    {
      "ok": true,
      "status": "<response.status>",
      "data": "<data>"
    }
    ```
- **3.** `[Catch]` Catch (`err`)
  - **3.1.** `[Warning]` Logs warning — `HTTP request failed for ${url}: ${err instanceof Error ? err.message : String(err)}`
  - **3.2.** `[Return]` 
    ```json
    {
      "ok": false,
      "status": 0,
      "data": null
    }
    ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- _None_

### External / Workspace Packages
- `@NamelessLiberty/logger` — `LogFactory`

### Called By / Imported By
- [apps/borealis/providers/anilist.provider.ts](../providers/anilist.provider.md) ([[apps/borealis/providers/anilist.provider]]) — `BaseMediaProvider`
- [apps/borealis/providers/anime-mapping.provider.ts](../providers/anime-mapping.provider.md) ([[apps/borealis/providers/anime-mapping.provider]]) — `BaseMediaProvider`
- [apps/borealis/providers/deezer.provider.ts](../providers/deezer.provider.md) ([[apps/borealis/providers/deezer.provider]]) — `BaseMediaProvider`
- [apps/borealis/providers/google-books.provider.ts](../providers/google-books.provider.md) ([[apps/borealis/providers/google-books.provider]]) — `BaseMediaProvider`
- [apps/borealis/providers/igdb.provider.ts](../providers/igdb.provider.md) ([[apps/borealis/providers/igdb.provider]]) — `BaseMediaProvider`
- [apps/borealis/providers/tvdb.provider.ts](../providers/tvdb.provider.md) ([[apps/borealis/providers/tvdb.provider]]) — `BaseMediaProvider`
