# tv.serv.ts

- **Source**: [`apps/borealis/tv/tv.serv.ts`](../../../../../../../apps/elysia/src/apps/borealis/tv/tv.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `BorealisTvServ extends BaseBorealisMediaService`

## Exported Types, Methods & Algorithms

### `interface TvCatalogQuery` (L10)

### `class BorealisTvServ` extends `BaseBorealisMediaService` (L41)

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
- **6.** `[Sequence]` Calls `parseList` and stores result as `formats`
- **7.** `[Sequence]` Calls `parseList` and stores result as `statuses`
- **8.** `[Sequence]` Define `years`
  ```typescript
  const years = parseList(query?.years).map((y) => Number(y)).filter((y) => !isNaN(y))
  ```
- **9.** `[Sequence]` Calls `parseList` and stores result as `networks`
- **10.** `[Sequence]` Define `sortBy`, `sortOrder`
  ```typescript
  const sortBy = query?.sortBy ?? 'popularity'
  const sortOrder = query?.sortOrder ?? sortBy === 'title' ? 'asc' : 'desc'
  ```
- **11.** `[Sequence]` Database `query` on `Tv` and stores it as `q`
- **12.** `[If]` `search`
  - **12.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => or( m.titlePrimary.ilike(`%${search}%`), m.titleSecondary.ilike(`%${search}%`), m.titleNative.ilike(`%${search}%`) ) )
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
- **15.** `[If]` `formats.length > 0`
  - **15.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.showType.in(formats as any))
    ```
- **16.** `[If]` `statuses.length > 0`
  - **16.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.status.in(statuses as any))
    ```
- **17.** `[If]` `years.length > 0`
  - **17.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.firstAiredYear.in(years))
    ```
- **18.** `[If]` `networks.length > 0`
  - **18.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.studios.some((s) => s.studio.some((st) => st.name.in(networks))) )
    ```
- **19.** `[If]` `query?.cursor`
  - **19.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => sortOrder === 'asc' ? m.id.gt(query.cursor!) : m.id.lt(query.cursor!) )
    ```
- **20.** `[Sequence]` Define `itemsQ`
  ```typescript
  let itemsQ = q
  ```
- **21.** `[If]` `sortBy === 'score'`
  - **21.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.averageScore.asc() : x.averageScore.desc() )
    ```
- **22.** `[Else]` Otherwise
  - **22.1.** `[If]` `sortBy === 'title'`
    - **22.1.1.** `[Sequence]` Assign `itemsQ`
      ```typescript
      itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.titlePrimary.asc() : x.titlePrimary.desc() )
      ```
  - **22.2.** `[Else]` Otherwise
    - **22.2.1.** `[If]` `sortBy === 'releaseDate'`
      - **22.2.1.1.** `[Sequence]` Assign `itemsQ`
        ```typescript
        itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.firstAiredYear.asc() : x.firstAiredYear.desc() )
        ```
    - **22.2.2.** `[Else]` Otherwise
      - **22.2.2.1.** `[If]` `sortBy === 'trending' || sortBy === 'favorites'`
        - **22.2.2.1.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.favorites.asc() : x.favorites.desc() )
          ```
      - **22.2.2.2.** `[Else]` Otherwise
        - **22.2.2.2.1.** `[If]` `sortBy === 'updatedAt'`
          - **22.2.2.2.1.1.** `[Sequence]` Assign `itemsQ`
            ```typescript
            itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.updatedAt.asc() : x.updatedAt.desc() )
            ```
        - **22.2.2.2.2.** `[Else]` Otherwise
          - **22.2.2.2.2.1.** `[Sequence]` Assign `itemsQ`
            ```typescript
            itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.popularity.asc() : x.popularity.desc() )
            ```
- **23.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawItems]`
- **24.** `[Sequence]` Define `items`, `hasMore`
  ```typescript
  const items = rawItems.map((x) => ({ id: x.id, titlePrimary: x.titlePrimary, titleSecondary: x.titleSecondary ?? null, titleNative: x.titleNative ?? null, coverImage: x.coverImage ?? null, bannerImage: x.bannerImage ?? null, ...)
  const hasMore = skip + items.length < total
  ```
- **25.** `[Return]` 
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

#### `getFilters()` (L192)

- **1.** `[Sequence]` Database `all` on `Tv` and stores it as `[allTv, allGenres]`
- **2.** `[Sequence]` Define `statusCounts`, `formatCounts`, `yearCounts`
  ```typescript
  const statusCounts: Record<string, number> = {}
  const formatCounts: Record<string, number> = {}
  const yearCounts: Record<number, number> = {}
  ```
- **3.** `[Loop]` Iterate `const t` over `allTv`
  - **3.1.** `[If]` `t.status`
    - **3.1.1.** `[Sequence]` Assign `statusCounts[t.status]`
      ```typescript
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1
      ```
  - **3.2.** `[If]` `t.showType`
    - **3.2.1.** `[Sequence]` Assign `formatCounts[t.showType]`
      ```typescript
      formatCounts[t.showType] = (formatCounts[t.showType] || 0) + 1
      ```
  - **3.3.** `[If]` `t.firstAiredYear`
    - **3.3.1.** `[Sequence]` Assign `yearCounts[t.firstAiredYear]`
      ```typescript
      yearCounts[t.firstAiredYear] = (yearCounts[t.firstAiredYear] || 0) + 1
      ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "statuses": "<Object.entries(statusCounts).map(([value, count]) => ({ value, count }))>",
    "formats": "<Object.entries(formatCounts).map(([value, count]) => ({ value, count }))>",
    "genres": "<allGenres.map((g: any) => ({ value: g.name, count: g.tv ?? 0 }))>",
    "tags": [],
    "years": "<Object.entries(yearCounts).map(([value, count]) => ({ value: Number(value), count })).sort((a, b) => b.value - a.value)>"
  }
  ```

#### `getById(id)` (L223)

- **1.** `[Sequence]` Database `first` on `Tv` and stores it as `load`
- **2.** `[Sequence]` Calls `load` and stores result as `tv`
- **3.** `[If]` `!tv`
  - **3.1.** `[Error]` Throws `NotFound` (HTTP 404) — `TV show with ID ${id} not found`
- **4.** `[If]` `tv.tvdbUpdatedAt == null && tv.tvDBId`
  - **4.1.** `[Sequence]` Calls `MediaEntitySyncer.syncTv(id, tv.tvDBId).catch`
  - **4.2.** `[Sequence]` Assign `tv`
    ```typescript
    tv = (await load()) ?? tv
    ```
- **5.** `[Sequence]` Calls `MediaQueueManager.queueIfStale`
- **6.** `[Sequence]` Calls `fetchTopCharacters` and stores result as `characters`
- **7.** `[Sequence]` Define `t`
  ```typescript
  const t: any = tv
  ```
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "media": {
      "...pick(t, [ 'id', 'titlePrimary', 'titleSecondary', 'titleNative', 'coverImage', 'bannerImage', 'description', 'originalLanguage', 'countryOfOrigin', 'episodeCount', 'seasonCount', 'broadcastTime', 'status', 'averageScore', 'favorites', 'popularity', 'isAdult', 'ageRating', 'ageRatingGuide', 'updatedAt', 'tvDBId', 'tmdbId', 'imdbId', 'simklId', 'tvmazeId', 'trailers', ])": "...",
      "episodeDuration": "<t.averageRuntime ?? null>",
      "startDateYear": "<t.firstAiredYear ?? null>",
      "startDateMonth": "<t.firstAiredMonth ?? null>",
      "startDateDay": "<t.firstAiredDay ?? null>",
      "endDateYear": "<t.lastAiredYear ?? null>",
      "endDateMonth": "<t.lastAiredMonth ?? null>",
      "endDateDay": "<t.lastAiredDay ?? null>",
      "broadcastDays": "<t.broadcastDays ?? []>",
      "format": "<t.showType ?? null>",
      "networks": "<t.networks ?? []>",
      "synonyms": "<t.synonyms ?? []>",
      "nextAiringEpisodeNumber": null,
      "nextAiringAt": null,
      "externalLinks": "<t.sources ?? null>",
      "sources": "<t.sources ?? null>",
      "genres": "<flattenGenres(t.genres)>",
      "tags": "<flattenTags(t.tags)>",
      "studios": "<t.studios || [].filter((s: any) => Boolean(s.studio)).map((s: any) => s.studio!)>",
      "characters": "<characters>"
    }
  }
  ```

#### `refresh(id)` (L277)

- **1.** `[Sequence]` Database `first` on `Tv` and stores it as `tv`
- **2.** `[If]` `!tv`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `TV show with ID ${id} not found`
- **3.** `[Sequence]` Database `update` on `Tv`
- **4.** `[Sequence]` Calls `MediaQueueManager.enqueueMediaUpdate('TV', id, { externalId: tv.tvDBId, priority: 1, depth: 0, maxDepth: 0, triggeredBy: 'manual', forceRefresh: true, ...).catch`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "<`Metadata refresh requested for \"${tv.titlePrimary}\"`>",
    "timestamp": "<new Date().toISOString()>"
  }
  ```

#### `getSimilar(id, limit = 24)` (L301)

- **1.** `[Sequence]` Database `first` on `Tv` and stores it as `source`
- **2.** `[If]` `!source`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `TV show with ID ${id} not found`
- **3.** `[Sequence]` Define `sourceGenres`, `sourceTags`, `sourceGenreIds`, `sourceTagIds`
  ```typescript
  const sourceGenres = source.genres || [].filter((g: any) => Boolean(g.genre)).map((g: any) => g.genre!)
  const sourceTags = source.tags || [].filter((t: any) => Boolean(t.tag)).map((t: any) => t.tag!)
  const sourceGenreIds = new Set(sourceGenres.map((g: any) => g.id))
  const sourceTagIds = new Set(sourceTags.map((t: any) => t.id))
  ```
- **4.** `[Sequence]` Database `query` on `Tv` and stores it as `candidatesQ`
- **5.** `[Sequence]` Define `conds`
  ```typescript
  const conds: any[] = []
  ```
- **6.** `[If]` `sourceGenreIds.size > 0`
- **7.** `[If]` `sourceTagIds.size > 0`
- **8.** `[If]` `source.showType`
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

#### `getRelations(id)` (L386)

- **1.** `[Sequence]` Calls `fetchMediaRelations` and stores result as `hydrated`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "relations": "<hydrated.map((r) => ({ id: r.id, sourceType: r.sourceType, sourceId: r.sourceId, targetType: r.targetType, targetId: r.targetId, type: r.type, ...)>"
  }
  ```

#### `getCharacters(id)` (L403)

- **1.** `[Sequence]` Database `all` on `MediaCharacter` and stores it as `raw`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "characters": "<raw.map((c: any) => ({ id: c.id, mediaId: c.mediaId, mediaType: c.mediaType, characterId: c.characterId, actorId: c.actorId ?? null, role: c.role, ...)>"
  }
  ```

#### `getStaff(id)` (L445)

- **1.** `[Sequence]` Database `all` on `MediaStaff` and stores it as `raw`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "staff": "<raw.map((s: any) => ({ id: s.id, mediaId: s.mediaId, mediaType: s.mediaType, personId: s.personId, role: s.role, customRole: s.customRole ?? null, ...)>"
  }
  ```

#### `getSeasons(tvId)` (L474)

- **1.** `[Sequence]` Database `all` on `TvSeason` and stores it as `seasons`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "seasons": "<seasons.map((s: any) => pick(s, [ 'id', 'tvId', 'seasonNumber', 'titlePrimary', 'titleSecondary', 'description', 'posterImage', 'airDateYear', 'airDateMonth', 'airDateDay', 'episodeCount', 'trailers', ]))>"
  }
  ```

#### `getEpisodes(tvId)` (L488)

- **1.** `[Sequence]` Database `all` on `TvEpisode` and stores it as `episodes`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "episodes": "<[...episodes].sort((a: any, b: any) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber).map((e: any) => ({ ...pick(e, [ 'id', 'tvId', 'seasonId', 'seasonNumber', 'episodeNumber', 'titlePrimary', 'titleSecondary', 'titleNative', 'description', 'duration', 'airDate', 'rating', 'thumbnail', 'opStart', 'opEnd', 'edStart', 'edEnd', 'recapStart', 'recapEnd', 'skipTimestamps', ]), isFiller: e.isFiller ?? false, ...)>"
  }
  ```

#### `getImages(id)` (L509)

- **1.** `[Sequence]` Database `first` on `Tv` and stores it as `tv`
- **2.** `[If]` `!tv`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `TV show with ID ${id} not found`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "images": {
      "thetvdb": "<imageSource(tv.images, 'thetvdb')>",
      "tmdb": "<imageSource(tv.images, 'tmdb')>",
      "imdb": "<imageSource(tv.images, 'imdb')>"
    }
  }
  ```

#### `getStats(id)` (L524)

- **1.** `[Sequence]` Database `first` on `Tv` and stores it as `tv`
- **2.** `[If]` `!tv`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `TV show with ID ${id} not found`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "stats": {
      "averageScore": "<tv.averageScore ?? null>",
      "favorites": "<tv.favorites ?? 0>",
      "popularity": "<tv.popularity ?? 0>",
      "scoreDistribution": "<tv.scoreDistribution ?? {}>",
      "statusDistribution": "<tv.statusDistribution ?? {}>",
      "...pick(tv, ['imdbRating', 'imdbVotes', 'tvmazeRating', 'rottenTomatoesScore'])": "..."
    }
  }
  ```

#### `getFriends(id, currentUserId)` (L541)

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
- **5.** `[Sequence]` Database `all` on `TvList` and stores it as `rawEntries`
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

#### `getPeople(id, query)` (L584)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `filterStatus`
  ```typescript
  const skip = page - 1 * limit
  const filterStatus = query?.status?.toUpperCase()?.trim()
  ```
- **4.** `[Sequence]` Database `query` on `TvList` and stores it as `q`
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
    "mediaType": "tv",
    "mediaId": "<id>",
    "total": "<total>",
    "page": "<page>",
    "limit": "<limit>",
    "totalPages": "<Math.ceil(total / limit) || 1>",
    "hasMore": "<page * limit < total>",
    "people": "<people>"
  }
  ```

#### `getRecommendations(id)` (L640)

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
- [apps/borealis/tv/tv.ctrl.ts](./tv.ctrl.md) ([[apps/borealis/tv/tv.ctrl]]) — `BorealisTvServ`
