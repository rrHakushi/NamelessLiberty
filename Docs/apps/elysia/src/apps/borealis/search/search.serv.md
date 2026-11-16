# search.serv.ts

- **Source**: [`apps/borealis/search/search.serv.ts`](../../../../../../../apps/elysia/src/apps/borealis/search/search.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `BorealisSearchServ extends BaseService`

## Exported Types, Methods & Algorithms

### `interface SearchQuery` (L7)

### `class BorealisSearchServ` extends `BaseService` (L65)

#### `search(query)` (L69)
Unified catalog search across media formats and entities.

- **1.** `[Sequence]` Define `rawQuery`
  ```typescript
  const rawQuery = query.q
  ```
- **2.** `[If]` `!rawQuery || rawQuery.trim().length === 0`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Query parameter "q" cannot be empty.'
- **3.** `[Sequence]` Define `cleanQuery`, `category`
  ```typescript
  const cleanQuery = rawQuery.trim()
  const category = query.category || 'media'
  ```
- **4.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **5.** `[Sequence]` Calls `Math.min` and stores result as `limit`
- **6.** `[Sequence]` Define `skip`, `isExternal`, `externalStubs`
  ```typescript
  const skip = page - 1 * limit
  const isExternal = query.external === true || query.external === 'true' || query.external === '1'
  let externalStubs: PreviewResult[] = []
  ```
- **7.** `[If]` `isExternal && [ 'anime', 'manga', 'movies', 'tv', 'games', 'books', ....includes(category)`
  - **7.1.** `[Sequence]` Assign `externalStubs`
    ```typescript
    externalStubs = await BorealisExternalSearchServ.enqueueSearchFetch( category, cleanQuery, limit )
    ```
- **8.** `[Switch]` Branch on `category`
  - **8.1.** `[Case]` Case `'anime'`
  - **8.2.** `[Case]` Case `'manga'`
  - **8.3.** `[Case]` Case `'movie'`
  - **8.4.** `[Case]` Case `'movies'`
  - **8.5.** `[Case]` Case `'tv'`
  - **8.6.** `[Case]` Case `'game'`
  - **8.7.** `[Case]` Case `'games'`
  - **8.8.** `[Case]` Case `'music'`
  - **8.9.** `[Case]` Case `'book'`
  - **8.10.** `[Case]` Case `'books'`
  - **8.11.** `[Case]` Case `'character'`
  - **8.12.** `[Case]` Case `'characters'`
  - **8.13.** `[Case]` Case `'staff'`
  - **8.14.** `[Case]` Case `'people'`
  - **8.15.** `[Case]` Case `'studio'`
  - **8.16.** `[Case]` Case `'studios'`
  - **8.17.** `[Case]` Case `'media'`
  - **8.18.** `[Case]` Default
  - **8.19.** `[Case]` Case `'other'`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `BadRequest`
- [apps/borealis/search/external-search.serv.ts](./external-search.serv.md) ([[apps/borealis/search/external-search.serv]]) — `BorealisExternalSearchServ`
- [apps/borealis/sync/media-preview.syncer.ts](../sync/media-preview.syncer.md) ([[apps/borealis/sync/media-preview.syncer]]) — `PreviewResult`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `countOf`, `or`

### Called By / Imported By
- [apps/borealis/search/search.ctrl.ts](./search.ctrl.md) ([[apps/borealis/search/search.ctrl]]) — `BorealisSearchServ`
