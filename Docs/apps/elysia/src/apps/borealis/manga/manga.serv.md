# manga.serv.ts

- **Source**: [`apps/borealis/manga/manga.serv.ts`](../../../../../../../apps/elysia/src/apps/borealis/manga/manga.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `BorealisMangaServ extends BaseBorealisMediaService`

## Exported Types, Methods & Algorithms

### `interface MangaCatalogQuery` (L10)

### `class BorealisMangaServ` extends `BaseBorealisMediaService` (L40)

#### `getCatalog(query)` (L41)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `search`
  ```typescript
  const skip = query?.cursor ? 0 : (page - 1) * limit
  const search = query?.search?.trim()
  ```
- **4.** `[Sequence]` Calls `parseList` and stores result as `genres`
- **5.** `[Sequence]` Calls `parseList` and stores result as `tags`
- **6.** `[Sequence]` Calls `parseList` and stores result as `formats`
- **7.** `[Sequence]` Calls `parseList` and stores result as `statuses`
- **8.** `[Sequence]` Define `years`, `sortBy`, `sortOrder`
  ```typescript
  const years = parseList(query?.years).map((y) => Number(y)).filter((y) => !isNaN(y))
  const sortBy = query?.sortBy ?? 'popularity'
  const sortOrder = query?.sortOrder ?? sortBy === 'title' ? 'asc' : 'desc'
  ```
- **9.** `[Sequence]` Database `query` on `Manga` and stores it as `q`
- **10.** `[If]` `search`
  - **10.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => or( m.titlePrimary.ilike(`%${search}%`), m.titleSecondary.ilike(`%${search}%`), m.titleNative.ilike(`%${search}%`) ) )
    ```
- **11.** `[If]` `genres.length > 0`
  - **11.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.genres.some((g) => g.genre.some((ge) => ge.name.in(genres))) )
    ```
- **12.** `[If]` `tags.length > 0`
  - **12.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.tags.some((t) => t.tag.some((te) => te.name.in(tags))) )
    ```
- **13.** `[If]` `formats.length > 0`
  - **13.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.format.in(formats as any))
    ```
- **14.** `[If]` `statuses.length > 0`
  - **14.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.status.in(statuses as any))
    ```
- **15.** `[If]` `years.length > 0`
  - **15.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.startDateYear.in(years))
    ```
- **16.** `[If]` `query?.cursor`
  - **16.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => sortOrder === 'asc' ? m.id.gt(query.cursor!) : m.id.lt(query.cursor!) )
    ```
- **17.** `[Sequence]` Define `itemsQ`
  ```typescript
  let itemsQ = q
  ```
- **18.** `[If]` `sortBy === 'score'`
  - **18.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.averageScore.asc() : x.averageScore.desc() )
    ```
- **19.** `[Else]` Otherwise
  - **19.1.** `[If]` `sortBy === 'title'`
    - **19.1.1.** `[Sequence]` Assign `itemsQ`
      ```typescript
      itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.titlePrimary.asc() : x.titlePrimary.desc() )
      ```
  - **19.2.** `[Else]` Otherwise
    - **19.2.1.** `[If]` `sortBy === 'releaseDate'`
      - **19.2.1.1.** `[Sequence]` Assign `itemsQ`
        ```typescript
        itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.startDateYear.asc() : x.startDateYear.desc() )
        ```
    - **19.2.2.** `[Else]` Otherwise
      - **19.2.2.1.** `[If]` `sortBy === 'trending' || sortBy === 'favorites'`
        - **19.2.2.1.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.favorites.asc() : x.favorites.desc() )
          ```
      - **19.2.2.2.** `[Else]` Otherwise
        - **19.2.2.2.1.** `[If]` `sortBy === 'updatedAt'`
          - **19.2.2.2.1.1.** `[Sequence]` Assign `itemsQ`
            ```typescript
            itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.updatedAt.asc() : x.updatedAt.desc() )
            ```
        - **19.2.2.2.2.** `[Else]` Otherwise
          - **19.2.2.2.2.1.** `[Sequence]` Assign `itemsQ`
            ```typescript
            itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.popularity.asc() : x.popularity.desc() )
            ```
- **20.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawItems]`
- **21.** `[Sequence]` Define `items`, `hasMore`
  ```typescript
  const items = rawItems.map((x) => ({ id: x.id, titlePrimary: x.titlePrimary, titleSecondary: x.titleSecondary ?? null, titleNative: x.titleNative ?? null, coverImage: x.coverImage ?? null, bannerImage: x.bannerImage ?? null, ...)
  const hasMore = skip + items.length < total
  ```
- **22.** `[Return]` 
  ```json
  {
    "success": true,
    "items": "<items>",
    "nextCursor": "<hasMore ? (items[items.length - 1]?.id ?? null) : null>",
    "hasMore": "<hasMore>",
    "total": "<total>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<Math.ceil(total / limit) || 1>",
      "hasMore": "<hasMore>"
    }
  }
  ```

#### `getFilters()` (L183)

- **1.** `[Sequence]` Database `all` on `Manga` and stores it as `[allManga, allGenres]`
- **2.** `[Sequence]` Define `statusCounts`, `formatCounts`, `yearCounts`
  ```typescript
  const statusCounts: Record<string, number> = {}
  const formatCounts: Record<string, number> = {}
  const yearCounts: Record<number, number> = {}
  ```
- **3.** `[Loop]` Iterate `const m` over `allManga`
  - **3.1.** `[If]` `m.status`
    - **3.1.1.** `[Sequence]` Assign `statusCounts[m.status]`
      ```typescript
      statusCounts[m.status] = (statusCounts[m.status] || 0) + 1
      ```
  - **3.2.** `[If]` `m.format`
    - **3.2.1.** `[Sequence]` Assign `formatCounts[m.format]`
      ```typescript
      formatCounts[m.format] = (formatCounts[m.format] || 0) + 1
      ```
  - **3.3.** `[If]` `m.startDateYear`
    - **3.3.1.** `[Sequence]` Assign `yearCounts[m.startDateYear]`
      ```typescript
      yearCounts[m.startDateYear] = (yearCounts[m.startDateYear] || 0) + 1
      ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "statuses": "<Object.entries(statusCounts).map(([value, count]) => ({ value, count }))>",
    "formats": "<Object.entries(formatCounts).map(([value, count]) => ({ value, count }))>",
    "genres": "<allGenres.map((g: any) => ({ value: g.name, count: g.manga ?? 0 }))>",
    "tags": [],
    "years": "<Object.entries(yearCounts).map(([value, count]) => ({ value: Number(value), count })).sort((a, b) => b.value - a.value)>"
  }
  ```

#### `getById(id)` (L214)

- **1.** `[Sequence]` Database `first` on `Manga` and stores it as `load`
- **2.** `[Sequence]` Calls `load` and stores result as `manga`
- **3.** `[If]` `!manga`
  - **3.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Manga with ID ${id} not found`
- **4.** `[If]` `manga.alUpdatedAt == null && manga.anilistId`
  - **4.1.** `[Sequence]` Calls `MediaEntitySyncer.syncManga(id, manga.anilistId).catch`
  - **4.2.** `[Sequence]` Assign `manga`
    ```typescript
    manga = (await load()) ?? manga
    ```
- **5.** `[Sequence]` Calls `MediaQueueManager.queueIfStale`
- **6.** `[Sequence]` Calls `fetchTopCharacters` and stores result as `characters`
- **7.** `[Sequence]` Define `m`
  ```typescript
  const m: any = manga
  ```
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "media": {
      "...pick(m, [ 'id', 'titlePrimary', 'titleSecondary', 'titleNative', 'coverImage', 'bannerImage', 'description', 'countryOfOrigin', 'chapterCount', 'volumeCount', 'startDateYear', 'startDateMonth', 'startDateDay', 'endDateYear', 'endDateMonth', 'endDateDay', 'source', 'format', 'status', 'averageScore', 'favorites', 'popularity', 'isAdult', 'ageRating', 'ageRatingGuide', 'updatedAt', 'anilistId', 'bangumiId', 'kitsuId', 'malId', 'mangaUpdatesId', 'externalLinks', 'sources', ...)": "...",
      "synonyms": "<m.synonyms ?? []>",
      "genres": "<flattenGenres(m.genres)>",
      "tags": "<flattenTags(m.tags)>",
      "characters": "<characters>"
    }
  }
  ```

#### `refresh(id)` (L253)

- **1.** `[Sequence]` Database `first` on `Manga` and stores it as `manga`
- **2.** `[If]` `!manga`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Manga with ID ${id} not found`
- **3.** `[Sequence]` Database `update` on `Manga`
- **4.** `[Sequence]` Calls `MediaQueueManager.enqueueMediaUpdate('MANGA', id, { externalId: manga.anilistId, priority: 1, depth: 0, maxDepth: 0, triggeredBy: 'manual', forceRefresh: true, ...).catch`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "<`Metadata refresh requested for \"${manga.titlePrimary}\"`>",
    "timestamp": "<new Date().toISOString()>"
  }
  ```

#### `getSimilar(id, limit = 24)` (L277)

- **1.** `[Sequence]` Database `first` on `Manga` and stores it as `source`
- **2.** `[If]` `!source`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Manga with ID ${id} not found`
- **3.** `[Sequence]` Define `sourceGenres`, `sourceTags`, `sourceGenreIds`, `sourceTagIds`
  ```typescript
  const sourceGenres = source.genres || [].filter((g: any) => Boolean(g.genre)).map((g: any) => g.genre!)
  const sourceTags = source.tags || [].filter((t: any) => Boolean(t.tag)).map((t: any) => t.tag!)
  const sourceGenreIds = new Set(sourceGenres.map((g: any) => g.id))
  const sourceTagIds = new Set(sourceTags.map((t: any) => t.id))
  ```
- **4.** `[Sequence]` Database `query` on `Manga` and stores it as `candidatesQ`
- **5.** `[Sequence]` Define `conds`
  ```typescript
  const conds: any[] = []
  ```
- **6.** `[If]` `sourceGenreIds.size > 0`
- **7.** `[If]` `sourceTagIds.size > 0`
- **8.** `[If]` `source.format`
- **9.** `[If]` `conds.length > 0`
  - **9.1.** `[Sequence]` Assign `candidatesQ`
    ```typescript
    candidatesQ = candidatesQ.where((m) => or(...conds.map((c) => c(m))))
    ```
- **10.** `[Sequence]` Calls `candidatesQ.limit(120).include('genres', (g) => g.include('genre', (ge) => ge.select('id', 'name'))).include('tags', (t) => t.include('tag', (te) => te.select('id', 'name'))).all` and stores result as `rawCandidates`
- **11.** `[Sequence]` Define `candidates`, `scored`, `items`
  ```typescript
  const candidates = rawCandidates.map((candidate: any) => ({ ...candidate, genres: (candidate.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => g.genre!), tags: (candidate.tags || []).filter((t: any) => Boolean(t.tag)).map((t: any) => t.tag!), }))
  const scored = candidates.map((candidate) => { let similarityScore = 0 const candGenreIds = new Set(candidate.genres.map((g) => g.id)) const genreIntersection = Array.from(sourceGenreIds).filter((gid) => candGenreIds.has(gid)) const genreUnion = new Set([...sourceGenreIds, ...candGenreIds]) if (genreUnion.size > 0 && genreIntersection.length > 0) { similarityScore += Math.round((genreIntersection.length / genreUnion.size) * 40) ...)
  const items = scored.filter((s) => s.similarityScore > 0).sort((a, b) => b.similarityScore - a.similarityScore).slice(0, limit).map(({ similarityScore, ...rest }) => rest)
  ```
- **12.** `[Return]` 
  ```json
  {
    "success": true,
    "sourceId": "<id>",
    "items": "<items>"
  }
  ```

#### `getRelations(id)` (L362)

- **1.** `[Sequence]` Calls `fetchMediaRelations` and stores result as `hydrated`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "relations": "<hydrated.map((r) => ({ id: r.id, sourceType: r.sourceType, sourceId: r.sourceId, targetType: r.targetType, targetId: r.targetId, type: r.type, ...)>"
  }
  ```

#### `getCharacters(id)` (L379)

- **1.** `[Sequence]` Database `all` on `MediaCharacter` and stores it as `raw`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "characters": "<raw.map((c: any) => ({ id: c.id, mediaId: c.mediaId, mediaType: c.mediaType, characterId: c.characterId, actorId: c.actorId ?? null, role: c.role, ...)>"
  }
  ```

#### `getStaff(id)` (L421)

- **1.** `[Sequence]` Database `all` on `MediaStaff` and stores it as `raw`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "staff": "<raw.map((s: any) => ({ id: s.id, mediaId: s.mediaId, mediaType: s.mediaType, personId: s.personId, role: s.role, customRole: s.customRole ?? null, ...)>"
  }
  ```

#### `getImages(id)` (L450)

- **1.** `[Sequence]` Database `first` on `Manga` and stores it as `manga`
- **2.** `[If]` `!manga`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Manga with ID ${id} not found`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "images": {
      "mal": "<imageSource(manga.images, 'mal')>",
      "anilist": "<imageSource(manga.images, 'anilist')>"
    }
  }
  ```

#### `getStats(id)` (L464)

- **1.** `[Sequence]` Database `first` on `Manga` and stores it as `manga`
- **2.** `[If]` `!manga`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Manga with ID ${id} not found`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "stats": {
      "...pick(manga, ['averageScore', 'alAverageScore', 'alPopularity', 'alFavorites', 'malPopularity', 'malFavorites', 'malAverageScore'])": "...",
      "scoreDistribution": "<manga.scoreDistribution ?? {}>",
      "statusDistribution": "<manga.statusDistribution ?? {}>",
      "favorites": "<manga.favorites ?? 0>"
    }
  }
  ```

#### `getFriends(id, currentUserId)` (L479)

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
- **5.** `[Sequence]` Database `all` on `MangaList` and stores it as `rawEntries`
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

#### `getPeople(id, query)` (L522)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `filterStatus`
  ```typescript
  const skip = page - 1 * limit
  const filterStatus = query?.status?.toUpperCase()?.trim()
  ```
- **4.** `[Sequence]` Database `query` on `MangaList` and stores it as `q`
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
    "mediaType": "manga",
    "mediaId": "<id>",
    "total": "<total>",
    "page": "<page>",
    "limit": "<limit>",
    "totalPages": "<Math.ceil(total / limit) || 1>",
    "hasMore": "<page * limit < total>",
    "people": "<people>"
  }
  ```

#### `getRecommendations(id)` (L578)

- **1.** `[Sequence]` Database `all` on `MediaRecommendation` and stores it as `recs`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "recommendations": "<recs.map((r: any) => { const profile = getProfileCustomization(r.user?.customization) return { id: r.id, sourceType: r.sourceType, sourceId: r.sourceId, targetType: r.targetType, ...)>"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/borealis/_shared/base-media.serv.ts](../_shared/base-media.serv.md) ([[apps/borealis/_shared/base-media.serv]]) — `BaseBorealisMediaService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `NotFound`
- [apps/borealis/sync/media.queue.ts](../sync/media.queue.md) ([[apps/borealis/sync/media.queue]]) — `MediaQueueManager`
- [apps/borealis/_shared/media-relations.helper.ts](../_shared/media-relations.helper.md) ([[apps/borealis/_shared/media-relations.helper]]) — `fetchMediaRelations`
- [apps/borealis/sync/media-entity.syncer.ts](../sync/media-entity.syncer.md) ([[apps/borealis/sync/media-entity.syncer]]) — `MediaEntitySyncer`
- [apps/borealis/_shared/media-overview.helper.ts](../_shared/media-overview.helper.md) ([[apps/borealis/_shared/media-overview.helper]]) — `fetchTopCharacters`, `pick`, `flattenGenres`, `flattenTags`, `imageSource`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `countOf`, `or`, `and`, `toDate`, `MediaType`
- `@NamelessLiberty/shared` — `getProfileCustomization`

### Called By / Imported By
- [apps/borealis/manga/manga.ctrl.ts](./manga.ctrl.md) ([[apps/borealis/manga/manga.ctrl]]) — `BorealisMangaServ`
