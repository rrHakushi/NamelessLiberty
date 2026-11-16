# games.serv.ts

- **Source**: [`apps/borealis/games/games.serv.ts`](../../../../../../../apps/elysia/src/apps/borealis/games/games.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `BorealisGamesServ extends BaseBorealisMediaService`

## Exported Types, Methods & Algorithms

### `interface GameCatalogQuery` (L10)

### `class BorealisGamesServ` extends `BaseBorealisMediaService` (L42)

#### `getCatalog(query)` (L43)

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
- **8.** `[Sequence]` Calls `parseList` and stores result as `platforms`
- **9.** `[Sequence]` Calls `parseList` and stores result as `developers`
- **10.** `[Sequence]` Calls `parseList` and stores result as `publishers`
- **11.** `[Sequence]` Define `sortBy`, `sortOrder`
  ```typescript
  const sortBy = query?.sortBy ?? 'popularity'
  const sortOrder = query?.sortOrder ?? sortBy === 'title' ? 'asc' : 'desc'
  ```
- **12.** `[Sequence]` Database `query` on `Game` and stores it as `q`
- **13.** `[If]` `search`
  - **13.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => or( m.titlePrimary.ilike(`%${search}%`), m.titleSecondary.ilike(`%${search}%`), m.titleNative.ilike(`%${search}%`) ) )
    ```
- **14.** `[If]` `genres.length > 0`
  - **14.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.genres.some((g) => g.genre.some((ge) => ge.name.in(genres))) )
    ```
- **15.** `[If]` `tags.length > 0`
  - **15.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.tags.some((t) => t.tag.some((te) => te.name.in(tags))) )
    ```
- **16.** `[If]` `statuses.length > 0`
  - **16.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.status.in(statuses as any))
    ```
- **17.** `[If]` `years.length > 0`
  - **17.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.releaseDateYear.in(years))
    ```
- **18.** `[If]` `query?.cursor`
  - **18.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => sortOrder === 'asc' ? m.id.gt(query.cursor!) : m.id.lt(query.cursor!) )
    ```
- **19.** `[Sequence]` Define `itemsQ`
  ```typescript
  let itemsQ = q
  ```
- **20.** `[If]` `sortBy === 'score'`
  - **20.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.averageScore.asc() : x.averageScore.desc() )
    ```
- **21.** `[Else]` Otherwise
  - **21.1.** `[If]` `sortBy === 'title'`
    - **21.1.1.** `[Sequence]` Assign `itemsQ`
      ```typescript
      itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.titlePrimary.asc() : x.titlePrimary.desc() )
      ```
  - **21.2.** `[Else]` Otherwise
    - **21.2.1.** `[If]` `sortBy === 'releaseDate'`
      - **21.2.1.1.** `[Sequence]` Assign `itemsQ`
        ```typescript
        itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.releaseDateYear.asc() : x.releaseDateYear.desc() )
        ```
    - **21.2.2.** `[Else]` Otherwise
      - **21.2.2.1.** `[If]` `sortBy === 'trending' || sortBy === 'favorites'`
        - **21.2.2.1.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.favorites.asc() : x.favorites.desc() )
          ```
      - **21.2.2.2.** `[Else]` Otherwise
        - **21.2.2.2.1.** `[If]` `sortBy === 'updatedAt'`
          - **21.2.2.2.1.1.** `[Sequence]` Assign `itemsQ`
            ```typescript
            itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.updatedAt.asc() : x.updatedAt.desc() )
            ```
        - **21.2.2.2.2.** `[Else]` Otherwise
          - **21.2.2.2.2.1.** `[Sequence]` Assign `itemsQ`
            ```typescript
            itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.popularity.asc() : x.popularity.desc() )
            ```
- **22.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawItems]`
- **23.** `[Sequence]` Define `items`, `hasMore`
  ```typescript
  const items = rawItems.map((x) => ({ id: x.id, titlePrimary: x.titlePrimary, titleSecondary: x.titleSecondary ?? null, titleNative: x.titleNative ?? null, coverImage: x.coverImage ?? null, bannerImage: x.bannerImage ?? null, ...)
  const hasMore = skip + items.length < total
  ```
- **24.** `[Return]` 
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

#### `getFilters()` (L181)

- **1.** `[Sequence]` Database `all` on `Game` and stores it as `[allGames, allGenres]`
- **2.** `[Sequence]` Define `statusCounts`, `formatCounts`, `yearCounts`
  ```typescript
  const statusCounts: Record<string, number> = {}
  const formatCounts: Record<string, number> = {}
  const yearCounts: Record<number, number> = {}
  ```
- **3.** `[Loop]` Iterate `const g` over `allGames`
  - **3.1.** `[If]` `g.status`
    - **3.1.1.** `[Sequence]` Assign `statusCounts[g.status]`
      ```typescript
      statusCounts[g.status] = (statusCounts[g.status] || 0) + 1
      ```
  - **3.2.** `[If]` `g.releaseDateYear`
    - **3.2.1.** `[Sequence]` Assign `yearCounts[g.releaseDateYear]`
      ```typescript
      yearCounts[g.releaseDateYear] = (yearCounts[g.releaseDateYear] || 0) + 1
      ```
  - **3.3.** `[Loop]` Iterate `const p` over `g.platforms || []`
    - **3.3.1.** `[Sequence]` Assign `formatCounts[p]`
      ```typescript
      formatCounts[p] = (formatCounts[p] || 0) + 1
      ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "statuses": "<Object.entries(statusCounts).map(([value, count]) => ({ value, count }))>",
    "formats": "<Object.entries(formatCounts).map(([value, count]) => ({ value, count }))>",
    "genres": "<allGenres.map((g: any) => ({ value: g.name, count: g.games ?? 0 }))>",
    "tags": [],
    "years": "<Object.entries(yearCounts).map(([value, count]) => ({ value: Number(value), count })).sort((a, b) => b.value - a.value)>"
  }
  ```

#### `getById(id)` (L214)

- **1.** `[Sequence]` Database `first` on `Game` and stores it as `load`
- **2.** `[Sequence]` Calls `load` and stores result as `game`
- **3.** `[If]` `!game`
  - **3.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Game with ID ${id} not found`
- **4.** `[If]` `game.igdbUpdatedAt == null && game.igdbId`
  - **4.1.** `[Sequence]` Calls `MediaEntitySyncer.syncGame(id, game.igdbId).catch`
  - **4.2.** `[Sequence]` Assign `game`
    ```typescript
    game = (await load()) ?? game
    ```
- **5.** `[Sequence]` Calls `MediaQueueManager.queueIfStale`
- **6.** `[Sequence]` Calls `fetchTopCharacters` and stores result as `characters`
- **7.** `[Sequence]` Define `g`
  ```typescript
  const g: any = game
  ```
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "media": {
      "...pick(g, [ 'id', 'titlePrimary', 'titleSecondary', 'titleNative', 'coverImage', 'bannerImage', 'description', 'franchise', 'status', 'averageScore', 'favorites', 'popularity', 'isAdult', 'ageRating', 'ageRatingGuide', 'averagePlaytime', 'requirements', 'controllerSupport', 'steamDeckStatus', 'updatedAt', 'igdbId', 'steamAppId', 'rawgId', 'giantbombId', 'vndbId', 'trailers', ])": "...",
      "platforms": "<g.platforms ?? []>",
      "developers": "<g.developers ?? []>",
      "publishers": "<g.publishers ?? []>",
      "gameModes": "<g.gameModes ?? []>",
      "playerPerspectives": "<g.playerPerspectives ?? []>",
      "languages": "<g.languages ?? []>",
      "synonyms": "<g.synonyms ?? []>",
      "startDateYear": "<g.releaseDateYear ?? null>",
      "startDateMonth": "<g.releaseDateMonth ?? null>",
      "startDateDay": "<g.releaseDateDay ?? null>",
      "format": "<g.platforms && g.platforms.length > 0 ? g.platforms[0] : 'GAME'>",
      "externalLinks": "<g.sources ?? null>",
      "sources": "<g.sources ?? null>",
      "genres": "<flattenGenres(g.genres)>",
      "tags": "<flattenTags(g.tags)>",
      "studios": "<g.studios || [].filter((s: any) => Boolean(s.studio)).map((s: any) => s.studio!)>",
      "characters": "<characters>"
    }
  }
  ```

#### `refresh(id)` (L266)

- **1.** `[Sequence]` Database `first` on `Game` and stores it as `game`
- **2.** `[If]` `!game`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Game with ID ${id} not found`
- **3.** `[Sequence]` Database `update` on `Game`
- **4.** `[Sequence]` Calls `MediaQueueManager.enqueueMediaUpdate('GAME', id, { externalId: game.igdbId, priority: 1, depth: 0, maxDepth: 0, triggeredBy: 'manual', forceRefresh: true, ...).catch`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "<`Metadata refresh requested for \"${game.titlePrimary}\"`>",
    "timestamp": "<new Date().toISOString()>"
  }
  ```

#### `getSimilar(id, limit = 24)` (L290)

- **1.** `[Sequence]` Database `first` on `Game` and stores it as `source`
- **2.** `[If]` `!source`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Game with ID ${id} not found`
- **3.** `[Sequence]` Define `sourceGenres`, `sourceTags`, `sourceGenreIds`, `sourceTagIds`
  ```typescript
  const sourceGenres = source.genres || [].filter((g: any) => Boolean(g.genre)).map((g: any) => g.genre!)
  const sourceTags = source.tags || [].filter((t: any) => Boolean(t.tag)).map((t: any) => t.tag!)
  const sourceGenreIds = new Set(sourceGenres.map((g: any) => g.id))
  const sourceTagIds = new Set(sourceTags.map((t: any) => t.id))
  ```
- **4.** `[Sequence]` Database `query` on `Game` and stores it as `candidatesQ`
- **5.** `[Sequence]` Define `conds`
  ```typescript
  const conds: any[] = []
  ```
- **6.** `[If]` `sourceGenreIds.size > 0`
- **7.** `[If]` `sourceTagIds.size > 0`
- **8.** `[If]` `conds.length > 0`
  - **8.1.** `[Sequence]` Assign `candidatesQ`
    ```typescript
    candidatesQ = candidatesQ.where((m) => or(...conds.map((c) => c(m))))
    ```
- **9.** `[Sequence]` Calls `candidatesQ.limit(120).include('genres', (g) => g.include('genre', (ge) => ge.select('id', 'name'))).include('tags', (t) => t.include('tag', (te) => te.select('id', 'name'))).all` and stores result as `rawCandidates`
- **10.** `[Sequence]` Define `candidates`, `scored`, `items`
  ```typescript
  const candidates = rawCandidates.map((candidate: any) => ({ ...candidate, genres: (candidate.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => g.genre!), tags: (candidate.tags || []).filter((t: any) => Boolean(t.tag)).map((t: any) => t.tag!), }))
  const scored = candidates.map((candidate) => { let similarityScore = 0 const candGenreIds = new Set(candidate.genres.map((g) => g.id)) const genreIntersection = Array.from(sourceGenreIds).filter((gid) => candGenreIds.has(gid)) const genreUnion = new Set([...sourceGenreIds, ...candGenreIds]) if (genreUnion.size > 0 && genreIntersection.length > 0) { similarityScore += Math.round((genreIntersection.length / genreUnion.size) * 40) ...)
  const items = scored.filter((s) => s.similarityScore > 0).sort((a, b) => b.similarityScore - a.similarityScore).slice(0, limit).map(({ similarityScore, ...rest }) => rest)
  ```
- **11.** `[Return]` 
  ```json
  {
    "success": true,
    "sourceId": "<id>",
    "items": "<items>"
  }
  ```

#### `getRelations(id)` (L371)

- **1.** `[Sequence]` Calls `fetchMediaRelations` and stores result as `hydrated`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "relations": "<hydrated.map((r) => ({ id: r.id, sourceType: r.sourceType, sourceId: r.sourceId, targetType: r.targetType, targetId: r.targetId, type: r.type, ...)>"
  }
  ```

#### `getCharacters(id)` (L388)

- **1.** `[Sequence]` Database `all` on `MediaCharacter` and stores it as `raw`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "characters": "<raw.map((c: any) => ({ id: c.id, mediaId: c.mediaId, mediaType: c.mediaType, characterId: c.characterId, actorId: c.actorId ?? null, role: c.role, ...)>"
  }
  ```

#### `getStaff(id)` (L430)

- **1.** `[Sequence]` Database `all` on `MediaStaff` and stores it as `raw`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "staff": "<raw.map((s: any) => ({ id: s.id, mediaId: s.mediaId, mediaType: s.mediaType, personId: s.personId, role: s.role, customRole: s.customRole ?? null, ...)>"
  }
  ```

#### `getImages(id)` (L459)

- **1.** `[Sequence]` Database `first` on `Game` and stores it as `game`
- **2.** `[If]` `!game`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Game with ID ${id} not found`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "images": {
      "igdb": "<imageSource(game.images, 'igdb')>",
      "steam": "<imageSource(game.images, 'steam')>",
      "rawg": "<imageSource(game.images, 'rawg')>"
    }
  }
  ```

#### `getStats(id)` (L474)

- **1.** `[Sequence]` Database `first` on `Game` and stores it as `game`
- **2.** `[If]` `!game`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Game with ID ${id} not found`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "stats": {
      "averageScore": "<game.averageScore ?? null>",
      "favorites": "<game.favorites ?? 0>",
      "popularity": "<game.popularity ?? 0>",
      "scoreDistribution": "<game.scoreDistribution ?? {}>",
      "statusDistribution": "<game.statusDistribution ?? {}>",
      "igdbRating": "<game.igdbRating ?? null>",
      "igdbRatingCount": "<game.igdbRatingCount ?? null>",
      "averagePlaytime": "<game.averagePlaytime ?? null>"
    }
  }
  ```

#### `getFriends(id, currentUserId)` (L493)

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
- **5.** `[Sequence]` Database `all` on `GameList` and stores it as `rawEntries`
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

#### `getPeople(id, query)` (L536)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `filterStatus`
  ```typescript
  const skip = page - 1 * limit
  const filterStatus = query?.status?.toUpperCase()?.trim()
  ```
- **4.** `[Sequence]` Database `query` on `GameList` and stores it as `q`
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
    "mediaId": "<id>",
    "total": "<total>",
    "page": "<page>",
    "limit": "<limit>",
    "totalPages": "<Math.ceil(total / limit) || 1>",
    "hasMore": "<page * limit < total>",
    "people": "<people>"
  }
  ```

#### `getRecommendations(id)` (L591)

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
- [apps/borealis/games/games.ctrl.ts](./games.ctrl.md) ([[apps/borealis/games/games.ctrl]]) — `BorealisGamesServ`
