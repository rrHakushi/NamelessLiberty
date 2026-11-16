# external-search.serv.ts

- **Source**: [`apps/borealis/search/external-search.serv.ts`](../../../../../../../apps/elysia/src/apps/borealis/search/external-search.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `BorealisExternalSearchServ extends BaseService`

## Exported Types, Methods & Algorithms

### `class BorealisExternalSearchServ` extends `BaseService` (L18)

#### `enqueueSearchFetch(category, query, limit = 20, forceRefresh = false)`: `Promise<PreviewResult[]>` (L25)
Queries external providers for media matching the query string, creates/retrieves initial search preview stubs in Prisma, enqueues background BullMQ update jobs with deterministic IDs, and returns preview items immediately tagged with queuedForFetch: true.

- **1.** `[Sequence]` Define `cleanQuery`
  ```typescript
  const cleanQuery = query.trim()
  ```
- **2.** `[If]` `!cleanQuery`
  - **2.1.** `[Return]`  — `[]`
- **3.** `[Sequence]` Define `normalizedCategory`, `throttleKey`
  ```typescript
  const normalizedCategory = category.toLowerCase()
  const throttleKey = `iris:search-throttle:${normalizedCategory}:${cleanQuery.toLowerCase()}`
  ```
- **4.** `[If]` `!forceRefresh`
  - **4.1.** `[Sequence]` Cache `get` -> `isThrottled`
  - **4.2.** `[If]` `isThrottled`
    - **4.2.1.** `[Return]`  — `[]`
- **5.** `[Sequence]` Cache `set`
- **6.** `[Sequence]` Define `results`
  ```typescript
  const results: PreviewResult[] = []
  ```
- **7.** `[Switch]` Branch on `normalizedCategory`
  - **7.1.** `[Case]` Case `'anime'`
  - **7.2.** `[Case]` Case `'manga'`
  - **7.3.** `[Case]` Case `'tv'`
  - **7.4.** `[Case]` Case `'movies'`
  - **7.5.** `[Case]` Case `'games'`
  - **7.6.** `[Case]` Case `'books'`
  - **7.7.** `[Case]` Case `'music'`
  - **7.8.** `[Case]` Case `'characters'`
  - **7.9.** `[Case]` Case `'people'`
  - **7.10.** `[Case]` Case `'staff'`
  - **7.11.** `[Case]` Default
- **8.** `[Return]`  — `results`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/utils/cache.ts](../../../core/utils/cache.md) ([[core/utils/cache]]) — `cache`
- [apps/borealis/sync/media.queue.ts](../sync/media.queue.md) ([[apps/borealis/sync/media.queue]]) — `MediaQueueManager`
- [apps/borealis/providers/index.ts](../providers/index.md) ([[apps/borealis/providers/index]]) — `anilistProvider`, `tvdbProvider`, `igdbProvider`, `googleBooksProvider`, `deezerProvider`
- [apps/borealis/sync/media-preview.syncer.ts](../sync/media-preview.syncer.md) ([[apps/borealis/sync/media-preview.syncer]]) — `MediaPreviewSyncer`, `PreviewResult`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`
- `@NamelessLiberty/logger` — `LogFactory`, `c`

### Called By / Imported By
- [apps/borealis/search/search.serv.ts](./search.serv.md) ([[apps/borealis/search/search.serv]]) — `BorealisExternalSearchServ`
