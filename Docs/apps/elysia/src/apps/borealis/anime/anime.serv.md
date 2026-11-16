# anime.serv.ts

- **Source**: [`apps/borealis/anime/anime.serv.ts`](../../../../../../../apps/elysia/src/apps/borealis/anime/anime.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `BorealisAnimeServ extends BaseBorealisMediaService`

## Exported Types, Methods & Algorithms

### `interface AnimeCatalogQuery` (L10)

### `class BorealisAnimeServ` extends `BaseBorealisMediaService` (L41)

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
- **8.** `[Sequence]` Define `years`, `season`, `sortBy`, `sortOrder`
  ```typescript
  const years = parseList(query?.years).map((y) => Number(y)).filter((y) => !isNaN(y))
  const season = query?.season?.trim()
  const sortBy = query?.sortBy ?? 'popularity'
  const sortOrder = query?.sortOrder ?? sortBy === 'title' ? 'asc' : 'desc'
  ```
- **9.** `[Sequence]` Database `query` on `Anime` and stores it as `q`
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
    q = q.where((m) => m.seasonYear.in(years))
    ```
- **16.** `[If]` `season`
  - **16.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ seasonSeason: season as any })
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
        itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.seasonYear.asc() : x.seasonYear.desc() )
        ```
    - **20.2.2.** `[Else]` Otherwise
      - **20.2.2.1.** `[If]` `sortBy === 'trending' || sortBy === 'favorites'`
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
- **22.** `[Sequence]` Define `items`, `hasMore`
  ```typescript
  const items = rawItems.map((x) => ({ id: x.id, titlePrimary: x.titlePrimary, titleSecondary: x.titleSecondary ?? null, titleNative: x.titleNative ?? null, coverImage: x.coverImage ?? null, bannerImage: x.bannerImage ?? null, ...)
  const hasMore = skip + items.length < total
  ```
- **23.** `[Return]` 
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

- **1.** `[Sequence]` Database `all` on `Anime` and stores it as `[allAnime, allGenres]`
- **2.** `[Sequence]` Define `statusCounts`, `formatCounts`, `yearCounts`, `seasonCounts`
  ```typescript
  const statusCounts: Record<string, number> = {}
  const formatCounts: Record<string, number> = {}
  const yearCounts: Record<number, number> = {}
  const seasonCounts: Record<string, number> = {}
  ```
- **3.** `[Loop]` Iterate `const a` over `allAnime`
  - **3.1.** `[If]` `a.status`
    - **3.1.1.** `[Sequence]` Assign `statusCounts[a.status]`
      ```typescript
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1
      ```
  - **3.2.** `[If]` `a.format`
    - **3.2.1.** `[Sequence]` Assign `formatCounts[a.format]`
      ```typescript
      formatCounts[a.format] = (formatCounts[a.format] || 0) + 1
      ```
  - **3.3.** `[If]` `a.seasonYear`
    - **3.3.1.** `[Sequence]` Assign `yearCounts[a.seasonYear]`
      ```typescript
      yearCounts[a.seasonYear] = (yearCounts[a.seasonYear] || 0) + 1
      ```
  - **3.4.** `[If]` `a.seasonSeason`
    - **3.4.1.** `[Sequence]` Assign `seasonCounts[a.seasonSeason]`
      ```typescript
      seasonCounts[a.seasonSeason] = (seasonCounts[a.seasonSeason] || 0) + 1
      ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "statuses": "<Object.entries(statusCounts).map(([value, count]) => ({ value, count }))>",
    "formats": "<Object.entries(formatCounts).map(([value, count]) => ({ value, count }))>",
    "genres": "<allGenres.map((g: any) => ({ value: g.name, count: g.anime ?? 0 }))>",
    "tags": [],
    "years": "<Object.entries(yearCounts).map(([value, count]) => ({ value: Number(value), count })).sort((a, b) => b.value - a.value)>",
    "seasons": "<Object.entries(seasonCounts).map(([value, count]) => ({ value, count }))>"
  }
  ```

#### `getById(id)` (L231)

- **1.** `[Sequence]` Database `first` on `Anime` and stores it as `load`
- **2.** `[Sequence]` Calls `load` and stores result as `anime`
- **3.** `[If]` `!anime`
  - **3.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Anime with ID ${id} not found`
- **4.** `[If]` `anime.alUpdatedAt == null && anime.anilistId`
  - **4.1.** `[Sequence]` Calls `MediaEntitySyncer.syncAnime(id, anime.anilistId).catch`
  - **4.2.** `[Sequence]` Assign `anime`
    ```typescript
    anime = (await load()) ?? anime
    ```
- **5.** `[Sequence]` Calls `MediaQueueManager.queueIfStale`
- **6.** `[Sequence]` Calls `fetchTopCharacters` and stores result as `characters`
- **7.** `[Sequence]` Define `a`
  ```typescript
  const a: any = anime
  ```
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "media": {
      "id": "<a.id>",
      "anilistId": "<a.anilistId ?? null>",
      "malId": "<a.malId ?? null>",
      "aniDBId": "<a.aniDBId ?? null>",
      "tvDBId": "<a.tvDBId ?? null>",
      "bangumiId": "<a.bangumiId ?? null>",
      "kitsuId": "<a.kitsuId ?? null>",
      "titlePrimary": "<a.titlePrimary>",
      "titleSecondary": "<a.titleSecondary ?? null>",
      "titleNative": "<a.titleNative ?? null>",
      "coverImage": "<a.coverImage ?? null>",
      "bannerImage": "<a.bannerImage ?? null>",
      "description": "<a.description ?? null>",
      "hashtag": "<a.hashtag ?? null>",
      "countryOfOrigin": "<a.countryOfOrigin ?? null>",
      "episodeCount": "<a.episodeCount ?? null>",
      "episodeDuration": "<a.episodeDuration ?? null>",
      "startDateYear": "<a.startDateYear ?? null>",
      "startDateMonth": "<a.startDateMonth ?? null>",
      "startDateDay": "<a.startDateDay ?? null>",
      "endDateYear": "<a.endDateYear ?? null>",
      "endDateMonth": "<a.endDateMonth ?? null>",
      "endDateDay": "<a.endDateDay ?? null>",
      "genres": "<a.genres || [].filter((g: any) => Boolean(g.genre)).map((g: any) => g.genre!)>",
      "tags": "<a.tags || [].filter((t: any) => Boolean(t.tag)).map((t: any) => t.tag!)>",
      "source": "<a.source>",
      "format": "<a.format>",
      "status": "<a.status>",
      "seasonSeason": "<a.seasonSeason>",
      "seasonYear": "<a.seasonYear ?? null>",
      "averageScore": "<a.averageScore ?? null>",
      "favorites": "<a.favorites>",
      "popularity": "<a.popularity>",
      "isAdult": "<a.isAdult>",
      "synonyms": "<a.synonyms ?? []>",
      "themeSongs": "<a.themeSongs ?? null>",
      "ageRating": "<a.ageRating ?? null>",
      "ageRatingGuide": "<a.ageRatingGuide ?? null>",
      "nextAiringEpisodeNumber": "<a.nextAiringEpisodeNumber ?? null>",
      "nextAiringAt": "<a.nextAiringAt ?? null>",
      "updatedAt": "<a.updatedAt>",
      "studios": "<a.studios || [].filter((s: any) => Boolean(s.studio)).map((s: any) => ({ id: s.id ?? s.studio!.id, isMain: Boolean(s.isMain), studio: s.studio!, }))>",
      "trailers": "<a.trailers ?? null>",
      "externalLinks": "<a.externalLinks ?? null>",
      "sources": "<a.sources ?? null>",
      "characters": "<characters>"
    }
  }
  ```

#### `refresh(id)` (L313)

- **1.** `[Sequence]` Database `first` on `Anime` and stores it as `anime`
- **2.** `[If]` `!anime`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Anime with ID ${id} not found`
- **3.** `[Sequence]` Database `update` on `Anime`
- **4.** `[Sequence]` Calls `MediaQueueManager.enqueueMediaUpdate('ANIME', id, { externalId: anime.anilistId, priority: 1, depth: 0, maxDepth: 0, triggeredBy: 'manual', forceRefresh: true, ...).catch`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "<`Metadata refresh requested for \"${anime.titlePrimary}\"`>",
    "timestamp": "<new Date().toISOString()>"
  }
  ```

#### `getSimilar(id, limit = 24)` (L337)

- **1.** `[Sequence]` Database `first` on `Anime` and stores it as `source`
- **2.** `[If]` `!source`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Anime with ID ${id} not found`
- **3.** `[Sequence]` Define `sourceGenres`, `sourceTags`, `sourceGenreIds`, `sourceTagIds`, `sourceStudioIds`
  ```typescript
  const sourceGenres = source.genres || [].filter((g: any) => Boolean(g.genre)).map((g: any) => g.genre!)
  const sourceTags = source.tags || [].filter((t: any) => Boolean(t.tag)).map((t: any) => t.tag!)
  const sourceGenreIds = new Set(sourceGenres.map((g: any) => g.id))
  const sourceTagIds = new Set(sourceTags.map((t: any) => t.id))
  const sourceStudioIds = new Set(source.studios.map((s) => s.studioId))
  ```
- **4.** `[Sequence]` Database `query` on `Anime` and stores it as `candidatesQ`
- **5.** `[Sequence]` Define `conds`
  ```typescript
  const conds: any[] = []
  ```
- **6.** `[If]` `sourceGenreIds.size > 0`
- **7.** `[If]` `sourceTagIds.size > 0`
- **8.** `[If]` `sourceStudioIds.size > 0`
- **9.** `[If]` `source.format`
- **10.** `[If]` `conds.length > 0`
  - **10.1.** `[Sequence]` Assign `candidatesQ`
    ```typescript
    candidatesQ = candidatesQ.where((a) => or(...conds.map((c) => c(a))))
    ```
- **11.** `[Sequence]` Calls `candidatesQ.limit(120).include('genres', (g) => g.include('genre', (ge) => ge.select('id', 'name'))).include('tags', (t) => t.include('tag', (te) => te.select('id', 'name'))).include('studios', (st) => st.include('studio', (s) => s.select('id', 'name'))).all` and stores result as `rawCandidates`
- **12.** `[Sequence]` Define `candidates`, `scored`, `items`
  ```typescript
  const candidates = rawCandidates.map((candidate: any) => ({ ...candidate, genres: (candidate.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => g.genre!), tags: (candidate.tags || []).filter((t: any) => Boolean(t.tag)).map((t: any) => t.tag!), }))
  const scored = candidates.map((candidate) => { let similarityScore = 0 const candGenreIds = new Set(candidate.genres.map((g) => g.id)) const genreIntersection = Array.from(sourceGenreIds).filter((gid) => candGenreIds.has(gid)) const genreUnion = new Set([...sourceGenreIds, ...candGenreIds]) if (genreUnion.size > 0 && genreIntersection.length > 0) { similarityScore += Math.round((genreIntersection.length / genreUnion.size) * 40) ...)
  const items = scored.filter((s) => s.similarityScore > 0).sort((a, b) => b.similarityScore - a.similarityScore).slice(0, limit).map((s: any) => ({ id: s.id, titlePrimary: s.titlePrimary, titleSecondary: s.titleSecondary ?? null, titleNative: s.titleNative ?? null, coverImage: s.coverImage ?? null, bannerImage: s.bannerImage ?? null, ...)
  ```
- **13.** `[Return]` 
  ```json
  {
    "success": true,
    "sourceId": "<id>",
    "items": "<items>"
  }
  ```

#### `getRelations(id)` (L440)

- **1.** `[Sequence]` Calls `fetchMediaRelations` and stores result as `hydrated`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "relations": "<hydrated.map((r) => ({ id: r.id, sourceType: r.sourceType, sourceId: r.sourceId, targetType: r.targetType, targetId: r.targetId, type: r.type, ...)>"
  }
  ```

#### `getCharacters(id)` (L457)

- **1.** `[Sequence]` Database `all` on `MediaCharacter` and stores it as `raw`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "characters": "<raw.map((c: any) => ({ id: c.id, mediaId: c.mediaId, mediaType: c.mediaType, characterId: c.characterId, actorId: c.actorId ?? null, role: c.role, ...)>"
  }
  ```

#### `getStaff(id)` (L499)

- **1.** `[Sequence]` Database `all` on `MediaStaff` and stores it as `raw`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "staff": "<raw.map((s: any) => ({ id: s.id, mediaId: s.mediaId, mediaType: s.mediaType, personId: s.personId, role: s.role, customRole: s.customRole ?? null, ...)>"
  }
  ```

#### `getEpisodes(id)` (L528)

- **1.** `[Sequence]` Database `all` on `AnimeEpisode` and stores it as `episodes`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "episodes": "<episodes>"
  }
  ```

#### `getImages(id)` (L536)

- **1.** `[Sequence]` Database `first` on `Anime` and stores it as `anime`
- **2.** `[If]` `!anime`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Anime with ID ${id} not found`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "images": {
      "mal": "<imageSource(anime.images, 'mal')>",
      "anilist": "<imageSource(anime.images, 'anilist')>",
      "thetvdb": "<imageSource(anime.images, 'thetvdb')>"
    }
  }
  ```

#### `getStats(id)` (L551)

- **1.** `[Sequence]` Database `first` on `Anime` and stores it as `anime`
- **2.** `[If]` `!anime`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Anime with ID ${id} not found`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "stats": {
      "averageScore": "<anime.averageScore ?? null>",
      "alAverageScore": "<anime.alAverageScore ?? null>",
      "alPopularity": "<anime.alPopularity ?? null>",
      "alFavorites": "<anime.alFavorites ?? null>",
      "malPopularity": "<anime.malPopularity ?? null>",
      "malFavorites": "<anime.malFavorites ?? null>",
      "malAverageScore": "<anime.malAverageScore ?? null>",
      "scoreDistribution": "<anime.scoreDistribution ?? {}>",
      "statusDistribution": "<anime.statusDistribution ?? {}>",
      "favorites": "<anime.favorites ?? 0>"
    }
  }
  ```

#### `getFriends(id, currentUserId)` (L572)

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
- **5.** `[Sequence]` Database `all` on `AnimeList` and stores it as `rawEntries`
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

#### `getPeople(id, query)` (L615)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `filterStatus`
  ```typescript
  const skip = page - 1 * limit
  const filterStatus = query?.status?.toUpperCase()?.trim()
  ```
- **4.** `[Sequence]` Database `query` on `AnimeList` and stores it as `q`
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
    "mediaType": "anime",
    "mediaId": "<id>",
    "total": "<total>",
    "page": "<page>",
    "limit": "<limit>",
    "totalPages": "<Math.ceil(total / limit) || 1>",
    "hasMore": "<page * limit < total>",
    "people": "<people>"
  }
  ```

#### `getRecommendations(id)` (L671)

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
- [apps/borealis/_shared/media-overview.helper.ts](../_shared/media-overview.helper.md) ([[apps/borealis/_shared/media-overview.helper]]) — `imageSource`, `fetchTopCharacters`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `countOf`, `or`, `and`, `toDate`, `MediaType`
- `@NamelessLiberty/shared` — `getProfileCustomization`

### Called By / Imported By
- [apps/borealis/anime/anime.ctrl.ts](./anime.ctrl.md) ([[apps/borealis/anime/anime.ctrl]]) — `BorealisAnimeServ`
