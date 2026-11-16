# books.serv.ts

- **Source**: [`apps/borealis/books/books.serv.ts`](../../../../../../../apps/elysia/src/apps/borealis/books/books.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `BorealisBooksServ extends BaseBorealisMediaService`

## Exported Types, Methods & Algorithms

### `interface BookCatalogQuery` (L10)

### `class BorealisBooksServ` extends `BaseBorealisMediaService` (L41)

#### `getCatalog(query)` (L42)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `search`
  ```typescript
  const skip = query?.cursor ? 0 : (page - 1) * limit
  const search = query?.search?.trim()
  ```
- **4.** `[Sequence]` Calls `parseList` and stores result as `genres`
- **5.** `[Sequence]` Calls `parseList` and stores result as `tags`
- **6.** `[Sequence]` Calls `parseList` and stores result as `statuses`
- **7.** `[Sequence]` Define `years`
  ```typescript
  const years = parseList(query?.years).map((y) => Number(y)).filter((y) => !isNaN(y))
  ```
- **8.** `[Sequence]` Calls `parseList` and stores result as `authors`
- **9.** `[Sequence]` Calls `parseList` and stores result as `publishers`
- **10.** `[Sequence]` Define `sortBy`, `sortOrder`
  ```typescript
  const sortBy = query?.sortBy ?? 'popularity'
  const sortOrder = query?.sortOrder ?? sortBy === 'title' ? 'asc' : 'desc'
  ```
- **11.** `[Sequence]` Database `query` on `Book` and stores it as `q`
- **12.** `[If]` `search`
  - **12.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => or( m.titlePrimary.ilike(`%${search}%`), m.titleSecondary.ilike(`%${search}%`), m.subtitle.ilike(`%${search}%`) ) )
    ```
- **13.** `[If]` `genres.length > 0`
  - **13.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.genres.some((g) => g.genre.some((ge) => ge.name.in(genres))) )
    ```
- **14.** `[If]` `tags.length > 0`
  - **14.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.tags.some((t) => t.tag.some((te) => te.name.in(tags))) )
    ```
- **15.** `[If]` `statuses.length > 0`
  - **15.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.status.in(statuses as any))
    ```
- **16.** `[If]` `years.length > 0`
  - **16.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.releaseDateYear.in(years))
    ```
- **17.** `[If]` `query?.cursor`
  - **17.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => sortOrder === 'asc' ? m.id.gt(query.cursor!) : m.id.lt(query.cursor!) )
    ```
- **18.** `[Sequence]` Define `itemsQ`
  ```typescript
  let itemsQ = q
  ```
- **19.** `[If]` `sortBy === 'score'`
  - **19.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.averageScore.asc() : x.averageScore.desc() )
    ```
- **20.** `[Else]` Otherwise
  - **20.1.** `[If]` `sortBy === 'title'`
    - **20.1.1.** `[Sequence]` Assign `itemsQ`
      ```typescript
      itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.titlePrimary.asc() : x.titlePrimary.desc() )
      ```
  - **20.2.** `[Else]` Otherwise
    - **20.2.1.** `[If]` `sortBy === 'releaseDate'`
      - **20.2.1.1.** `[Sequence]` Assign `itemsQ`
        ```typescript
        itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.releaseDateYear.asc() : x.releaseDateYear.desc() )
        ```
    - **20.2.2.** `[Else]` Otherwise
      - **20.2.2.1.** `[If]` `sortBy === 'favorites'`
        - **20.2.2.1.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.favorites.asc() : x.favorites.desc() )
          ```
      - **20.2.2.2.** `[Else]` Otherwise
        - **20.2.2.2.1.** `[If]` `sortBy === 'updatedAt'`
          - **20.2.2.2.1.1.** `[Sequence]` Assign `itemsQ`
            ```typescript
            itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.updatedAt.asc() : x.updatedAt.desc() )
            ```
        - **20.2.2.2.2.** `[Else]` Otherwise
          - **20.2.2.2.2.1.** `[Sequence]` Assign `itemsQ`
            ```typescript
            itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.popularity.asc() : x.popularity.desc() )
            ```
- **21.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawItems]`
- **22.** `[Sequence]` Define `items`, `nextCursor`, `hasMore`
  ```typescript
  const items = rawItems.map((m: any) => ({ id: m.id, titlePrimary: m.titlePrimary, titleSecondary: m.titleSecondary ?? null, titleNative: m.subtitle ?? null, coverImage: m.coverImage ?? null, bannerImage: m.bannerImage ?? null, ...)
  const nextCursor = items.length === limit ? items[items.length - 1]!.id : null
  const hasMore = query?.cursor ? nextCursor !== null : skip + limit < total
  ```
- **23.** `[Return]` 
  ```json
  {
    "success": true,
    "items": "<items>",
    "nextCursor": "<nextCursor>",
    "hasMore": "<hasMore>",
    "total": "<total>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<Math.ceil(total / limit)>",
      "hasMore": "<hasMore>"
    }
  }
  ```

#### `getFilters()` (L161)

- **1.** `[Sequence]` Database `all` on `Book` and stores it as `[allBooks, allGenres]`
- **2.** `[Sequence]` Define `statusCounts`, `formatCounts`, `yearCounts`
  ```typescript
  const statusCounts: Record<string, number> = {}
  const formatCounts: Record<string, number> = {}
  const yearCounts: Record<number, number> = {}
  ```
- **3.** `[Loop]` Iterate `const b` over `allBooks`
  - **3.1.** `[If]` `b.status`
    - **3.1.1.** `[Sequence]` Assign `statusCounts[b.status]`
      ```typescript
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1
      ```
  - **3.2.** `[If]` `b.format`
    - **3.2.1.** `[Sequence]` Assign `formatCounts[b.format]`
      ```typescript
      formatCounts[b.format] = (formatCounts[b.format] || 0) + 1
      ```
  - **3.3.** `[If]` `b.releaseDateYear`
    - **3.3.1.** `[Sequence]` Assign `yearCounts[b.releaseDateYear]`
      ```typescript
      yearCounts[b.releaseDateYear] = (yearCounts[b.releaseDateYear] || 0) + 1
      ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "statuses": "<Object.entries(statusCounts).map(([value, count]) => ({ value, count }))>",
    "formats": "<Object.entries(formatCounts).map(([value, count]) => ({ value, count }))>",
    "genres": "<allGenres.map((g: any) => ({ value: g.name, count: g.books ?? 0 }))>",
    "tags": [],
    "years": "<Object.entries(yearCounts).map(([value, count]) => ({ value: Number(value), count })).sort((a, b) => b.value - a.value)>"
  }
  ```

#### `getById(id)` (L192)

- **1.** `[Sequence]` Database `first` on `Book` and stores it as `raw`
- **2.** `[If]` `!raw`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Book with ID ${id} not found`
- **3.** `[Sequence]` Calls `MediaQueueManager.queueIfStale`
- **4.** `[Sequence]` Calls `fetchTopCharacters` and stores result as `characters`
- **5.** `[Sequence]` Define `media`
  ```typescript
  const media = { id: raw.id, characters, titlePrimary: raw.titlePrimary, titleSecondary: raw.titleSecondary ?? null, titleNative: raw.subtitle ?? null, subtitle: raw.subtitle ?? null, ...
  ```
- **6.** `[Return]` 
  ```json
  {
    "success": true,
    "media": "<media>"
  }
  ```

#### `refresh(id)` (L261)

- **1.** `[Sequence]` Database `first` on `Book` and stores it as `book`
- **2.** `[If]` `!book`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Book with ID ${id} not found`
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `MediaEntitySyncer.syncBook` and stores result as `synced`
  - **3.2.** `[If]` `synced`
    - **3.2.1.** `[Return]` 
      ```json
      {
        "success": true,
        "message": "Book refreshed successfully"
      }
      ```
- **4.** `[Catch]` Catch (`err`)
- **5.** `[Sequence]` Calls `MediaQueueManager.enqueueMediaUpdate`
- **6.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Book refresh enqueued"
  }
  ```

#### `getSimilar(id)` (L283)

- **1.** `[Sequence]` Database `first` on `Book` and stores it as `book`
- **2.** `[If]` `!book`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Book with ID ${id} not found`
- **3.** `[Sequence]` Define `genreIds`
  ```typescript
  const genreIds = book.genres || [].map((g: any) => g.genreId ?? g.genre?.id).filter(Boolean)
  ```
- **4.** `[Sequence]` Database `query` on `Book` and stores it as `q`
- **5.** `[If]` `genreIds.length > 0`
  - **5.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((b) => b.genres.some((bg) => bg.genreId.in(genreIds)) )
    ```
- **6.** `[Sequence]` Calls `q.orderBy((b) => b.popularity.desc()).limit(24).include('genres', (g) => g.include('genre')).include('tags', (t) => t.include('tag')).all` and stores result as `raw`
- **7.** `[Sequence]` Define `similar`
  ```typescript
  const similar = raw.map((m: any) => ({ id: m.id, titlePrimary: m.titlePrimary, titleSecondary: m.titleSecondary ?? null, titleNative: m.subtitle ?? null, coverImage: m.coverImage ?? null, bannerImage: m.bannerImage ?? null, ...)
  ```
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "similar": "<similar>"
  }
  ```

#### `getRelations(id)` (L326)

- **1.** `[Sequence]` Calls `fetchMediaRelations` and stores result as `raw`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "relations": "<raw.map((r) => ({ id: r.id, sourceType: r.sourceType, sourceId: r.sourceId, targetType: r.targetType, targetId: r.targetId, type: r.type, ...)>"
  }
  ```

#### `getCharacters(id)` (L358)

- **1.** `[Sequence]` Database `all` on `MediaCharacter` and stores it as `raw`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "characters": "<raw.map((c: any) => ({ id: c.id, mediaId: c.mediaId, mediaType: c.mediaType, characterId: c.characterId, actorId: c.actorId ?? null, role: c.role, ...)>"
  }
  ```

#### `getStaff(id)` (L389)

- **1.** `[Sequence]` Database `all` on `MediaStaff` and stores it as `raw`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "staff": "<raw.map((s: any) => ({ id: s.id, mediaId: s.mediaId, mediaType: s.mediaType, personId: s.personId, role: s.role, customRole: s.customRole ?? null, ...)>"
  }
  ```

#### `getImages(id)` (L418)

- **1.** `[Sequence]` Database `first` on `Book` and stores it as `book`
- **2.** `[If]` `!book`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Book with ID ${id} not found`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "images": {
      "googlebooks": "<imageSource(book.images, 'googlebooks')>",
      "openlibrary": "<imageSource(book.images, 'openlibrary')>"
    }
  }
  ```

#### `getStats(id)` (L431)

- **1.** `[Sequence]` Database `first` on `Book` and stores it as `book`
- **2.** `[If]` `!book`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Book with ID ${id} not found`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "stats": {
      "averageScore": "<book.averageScore ?? null>",
      "favorites": "<book.favorites ?? 0>",
      "popularity": "<book.popularity ?? 0>",
      "scoreDistribution": "<book.scoreDistribution ?? {}>",
      "statusDistribution": "<book.statusDistribution ?? {}>",
      "googleBooksRating": "<book.googleBooksRating ?? null>",
      "googleBooksRatingsCount": "<book.googleBooksRatingsCount ?? null>"
    }
  }
  ```

#### `getFriends(id, currentUserId)` (L459)

- **1.** `[If]` `!currentUserId`
  - **1.1.** `[Return]` 
    ```json
    {
      "success": true,
      "friends": []
    }
    ```
- **2.** `[Sequence]` Database `all` on `Friend` and stores it as `userFriends`
- **3.** `[Sequence]` Define `friendIds`
  ```typescript
  const friendIds = userFriends.map((f) => f.friendId)
  ```
- **4.** `[If]` `friendIds.length === 0`
  - **4.1.** `[Return]` 
    ```json
    {
      "success": true,
      "friends": []
    }
    ```
- **5.** `[Sequence]` Database `all` on `BookList` and stores it as `rawEntries`
- **6.** `[Sequence]` Define `friends`
  ```typescript
  const friends = rawEntries.map((raw: any) => { const profile = getProfileCustomization(raw.user?.customization) return { id: raw.id, userId: raw.userId, status: raw.status, score: raw.score, ...)
  ```
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "friends": "<friends>"
  }
  ```

#### `getPeople(id, query)` (L502)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `filterStatus`
  ```typescript
  const skip = page - 1 * limit
  const filterStatus = query?.status?.toUpperCase()?.trim()
  ```
- **4.** `[Sequence]` Database `query` on `BookList` and stores it as `q`
- **5.** `[If]` `filterStatus`
  - **5.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ status: filterStatus as any })
    ```
- **6.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawEntries]`
- **7.** `[Sequence]` Define `people`
  ```typescript
  const people = rawEntries.map((raw: any) => { const profile = getProfileCustomization(raw.user?.customization) return { id: raw.id, userId: raw.userId, status: raw.status, score: raw.score, ...)
  ```
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "mediaType": "book",
    "mediaId": "<id>",
    "total": "<total>",
    "page": "<page>",
    "limit": "<limit>",
    "totalPages": "<Math.ceil(total / limit)>",
    "people": "<people>"
  }
  ```

#### `getRecommendations(_id)` (L557)

- **1.** `[Return]` 
  ```json
  {
    "success": true,
    "recommendations": []
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/borealis/_shared/base-media.serv.ts](../_shared/base-media.serv.md) ([[apps/borealis/_shared/base-media.serv]]) — `BaseBorealisMediaService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `NotFound`
- [apps/borealis/sync/media.queue.ts](../sync/media.queue.md) ([[apps/borealis/sync/media.queue]]) — `MediaQueueManager`
- [apps/borealis/_shared/media-relations.helper.ts](../_shared/media-relations.helper.md) ([[apps/borealis/_shared/media-relations.helper]]) — `fetchMediaRelations`
- [apps/borealis/sync/media-entity.syncer.ts](../sync/media-entity.syncer.md) ([[apps/borealis/sync/media-entity.syncer]]) — `MediaEntitySyncer`
- [apps/borealis/_shared/media-overview.helper.ts](../_shared/media-overview.helper.md) ([[apps/borealis/_shared/media-overview.helper]]) — `fetchTopCharacters`, `flattenGenres`, `flattenTags`, `imageSource`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `countOf`, `or`, `and`, `toDate`, `MediaType`
- `@NamelessLiberty/shared` — `getProfileCustomization`

### Called By / Imported By
- [apps/borealis/books/books.ctrl.ts](./books.ctrl.md) ([[apps/borealis/books/books.ctrl]]) — `BorealisBooksServ`
