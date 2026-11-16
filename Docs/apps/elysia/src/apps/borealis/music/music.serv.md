# music.serv.ts

- **Source**: [`apps/borealis/music/music.serv.ts`](../../../../../../../apps/elysia/src/apps/borealis/music/music.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `BorealisMusicServ extends BaseBorealisMediaService`

## Exported Types, Methods & Algorithms

### `interface MusicCatalogQuery` (L9)

### `class BorealisMusicServ` extends `BaseBorealisMediaService` (L38)

#### `getCatalog(query)` (L39)

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
- **7.** `[Sequence]` Define `years`, `sortBy`, `sortOrder`
  ```typescript
  const years = parseList(query?.years).map((y) => Number(y)).filter((y) => !isNaN(y))
  const sortBy = query?.sortBy ?? 'popularity'
  const sortOrder = query?.sortOrder ?? sortBy === 'title' ? 'asc' : 'desc'
  ```
- **8.** `[Sequence]` Database `query` on `Music` and stores it as `q`
- **9.** `[If]` `search`
  - **9.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => or( m.titlePrimary.ilike(`%${search}%`), m.titleSecondary.ilike(`%${search}%`), m.titleNative.ilike(`%${search}%`) ) )
    ```
- **10.** `[If]` `genres.length > 0`
  - **10.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.genres.some((g) => g.genre.some((ge) => ge.name.in(genres))) )
    ```
- **11.** `[If]` `tags.length > 0`
  - **11.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.tags.some((t) => t.tag.some((te) => te.name.in(tags))) )
    ```
- **12.** `[If]` `formats.length > 0`
  - **12.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.type.in(formats as any))
    ```
- **13.** `[If]` `years.length > 0`
  - **13.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.releaseDateYear.in(years))
    ```
- **14.** `[If]` `query?.cursor`
  - **14.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => sortOrder === 'asc' ? m.id.gt(query.cursor!) : m.id.lt(query.cursor!) )
    ```
- **15.** `[Sequence]` Define `itemsQ`
  ```typescript
  let itemsQ = q
  ```
- **16.** `[If]` `sortBy === 'title'`
  - **16.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.titlePrimary.asc() : x.titlePrimary.desc() )
    ```
- **17.** `[Else]` Otherwise
  - **17.1.** `[If]` `sortBy === 'releaseDate'`
    - **17.1.1.** `[Sequence]` Assign `itemsQ`
      ```typescript
      itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.releaseDateYear.asc() : x.releaseDateYear.desc() )
      ```
  - **17.2.** `[Else]` Otherwise
    - **17.2.1.** `[If]` `sortBy === 'trending' || sortBy === 'favorites'`
      - **17.2.1.1.** `[Sequence]` Assign `itemsQ`
        ```typescript
        itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.favorites.asc() : x.favorites.desc() )
        ```
    - **17.2.2.** `[Else]` Otherwise
      - **17.2.2.1.** `[If]` `sortBy === 'updatedAt'`
        - **17.2.2.1.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.updatedAt.asc() : x.updatedAt.desc() )
          ```
      - **17.2.2.2.** `[Else]` Otherwise
        - **17.2.2.2.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.popularity.asc() : x.popularity.desc() )
          ```
- **18.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawItems]`
- **19.** `[Sequence]` Define `items`, `hasMore`
  ```typescript
  const items = rawItems.map((x) => ({ id: x.id, titlePrimary: x.titlePrimary, titleSecondary: x.titleSecondary ?? null, titleNative: x.titleNative ?? null, coverImage: x.coverImage ?? null, bannerImage: null, ...)
  const hasMore = skip + items.length < total
  ```
- **20.** `[Return]` 
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

#### `getFilters()` (L170)

- **1.** `[Sequence]` Database `all` on `Music` and stores it as `[allMusic, allGenres]`
- **2.** `[Sequence]` Define `statusCounts`, `formatCounts`, `yearCounts`
  ```typescript
  const statusCounts: Record<string, number> = {}
  const formatCounts: Record<string, number> = {}
  const yearCounts: Record<number, number> = {}
  ```
- **3.** `[Loop]` Iterate `const m` over `allMusic`
  - **3.1.** `[If]` `m.status`
    - **3.1.1.** `[Sequence]` Assign `statusCounts[m.status]`
      ```typescript
      statusCounts[m.status] = (statusCounts[m.status] || 0) + 1
      ```
  - **3.2.** `[If]` `m.type`
    - **3.2.1.** `[Sequence]` Assign `formatCounts[m.type]`
      ```typescript
      formatCounts[m.type] = (formatCounts[m.type] || 0) + 1
      ```
  - **3.3.** `[If]` `m.releaseDateYear`
    - **3.3.1.** `[Sequence]` Assign `yearCounts[m.releaseDateYear]`
      ```typescript
      yearCounts[m.releaseDateYear] = (yearCounts[m.releaseDateYear] || 0) + 1
      ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "statuses": "<Object.entries(statusCounts).map(([value, count]) => ({ value, count }))>",
    "formats": "<Object.entries(formatCounts).map(([value, count]) => ({ value, count }))>",
    "genres": "<allGenres.map((g: any) => ({ value: g.name, count: g.music ?? 0 }))>",
    "tags": [],
    "years": "<Object.entries(yearCounts).map(([value, count]) => ({ value: Number(value), count })).sort((a, b) => b.value - a.value)>"
  }
  ```

#### `getById(id)` (L201)

- **1.** `[Sequence]` Database `first` on `Music` and stores it as `music`
- **2.** `[If]` `!music`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Music with ID ${id} not found`
- **3.** `[Sequence]` Calls `MediaQueueManager.queueIfStale`
- **4.** `[Sequence]` Define `artist`
  ```typescript
  const artist = Array.isArray(music.artist) ? music.artist[0] : music.artist
  ```
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "media": {
      "...pick(music, [ 'id', 'type', 'titlePrimary', 'titleSecondary', 'titleNative', 'titleVersion', 'coverImage', 'description', 'duration', 'trackPosition', 'diskNumber', 'status', 'label', 'nbTracks', 'audioPreviewUrl', 'bpm', 'artistId', 'artistName', 'albumId', 'favorites', 'popularity', 'listeners', 'playCount', 'updatedAt', 'deezerId', 'isrc', 'upc', ...)": "...",
      "bannerImage": null,
      "averageScore": null,
      "format": "<music.type ? String(music.type) : null>",
      "explicitLyrics": "<music.explicitLyrics ?? false>",
      "isAdult": false,
      "startDateYear": "<music.releaseDateYear ?? null>",
      "startDateMonth": "<music.releaseDateMonth ?? null>",
      "startDateDay": "<music.releaseDateDay ?? null>",
      "artist": "<artist ? { id: artist.id, namePrimary: artist.namePrimary, nameNative: artist.nameNative ?? null, image: artist.image ?? null, description: artist.description ?? null, ...>",
      "spotifyId": "<(music.sources as any)?.spotify?.id ?? null>",
      "externalLinks": "<music.sources ?? null>",
      "sources": "<music.sources ?? null>",
      "genres": "<flattenGenres(music.genres)>",
      "tags": "<flattenTags(music.tags)>"
    }
  }
  ```

#### `refresh(id)` (L251)

- **1.** `[Sequence]` Database `first` on `Music` and stores it as `music`
- **2.** `[If]` `!music`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Music with ID ${id} not found`
- **3.** `[Sequence]` Database `update` on `Music`
- **4.** `[Sequence]` Calls `MediaQueueManager.enqueueMediaUpdate('MUSIC', id, { externalId: music.deezerId, priority: 1, depth: 0, maxDepth: 0, triggeredBy: 'manual', forceRefresh: true, ...).catch`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "<`Metadata refresh requested for \"${music.titlePrimary}\"`>",
    "timestamp": "<new Date().toISOString()>"
  }
  ```

#### `getSimilar(id, limit = 24)` (L275)

- **1.** `[Sequence]` Database `first` on `Music` and stores it as `source`
- **2.** `[If]` `!source`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Music with ID ${id} not found`
- **3.** `[Sequence]` Define `sourceGenres`, `sourceTags`, `sourceGenreIds`, `sourceTagIds`
  ```typescript
  const sourceGenres = source.genres || [].filter((g: any) => Boolean(g.genre)).map((g: any) => g.genre!)
  const sourceTags = source.tags || [].filter((t: any) => Boolean(t.tag)).map((t: any) => t.tag!)
  const sourceGenreIds = new Set(sourceGenres.map((g: any) => g.id))
  const sourceTagIds = new Set(sourceTags.map((t: any) => t.id))
  ```
- **4.** `[Sequence]` Database `query` on `Music` and stores it as `candidatesQ`
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

#### `getRelations(id)` (L356)

- **1.** `[Sequence]` Calls `fetchMediaRelations` and stores result as `hydrated`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "relations": "<hydrated.map((r) => ({ id: r.id, sourceType: r.sourceType, sourceId: r.sourceId, targetType: r.targetType, targetId: r.targetId, type: r.type, ...)>"
  }
  ```

#### `getTracks(musicId)` (L373)

- **1.** `[Sequence]` Database `all` on `Music` and stores it as `tracks`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "tracks": "<tracks.map((t: any) => ({ ...pick(t, ['id', 'trackPosition', 'diskNumber', 'titlePrimary', 'titleSecondary', 'duration', 'audioPreviewUrl', 'artistName']), explicitLyrics: t.explicitLyrics ?? false, }))>"
  }
  ```

#### `getLyrics(musicId)` (L386)

- **1.** `[Sequence]` Database `first` on `Music` and stores it as `music`
- **2.** `[If]` `!music`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Music with ID ${musicId} not found`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "id": "<music.id>",
    "lyrics": "<music.lyrics ?? null>",
    "syncedLyrics": "<music.syncedLyrics ?? null>",
    "lyricsSource": "<music.lyricsSource ?? null>"
  }
  ```

#### `getStaff(id)` (L403)

- **1.** `[Sequence]` Database `all` on `MediaStaff` and stores it as `raw`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "staff": "<raw.map((s: any) => ({ id: s.id, mediaId: s.mediaId, mediaType: s.mediaType, personId: s.personId, role: s.role, customRole: s.customRole ?? null, ...)>"
  }
  ```

#### `getImages(id)` (L432)

- **1.** `[Sequence]` Database `first` on `Music` and stores it as `music`
- **2.** `[If]` `!music`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Music with ID ${id} not found`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "images": {
      "deezer": "<imageSource(music.images, 'deezer')>",
      "spotify": "<imageSource(music.images, 'spotify')>"
    }
  }
  ```

#### `getStats(id)` (L446)

- **1.** `[Sequence]` Database `first` on `Music` and stores it as `music`
- **2.** `[If]` `!music`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Music with ID ${id} not found`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "stats": {
      "averageScore": null,
      "favorites": "<music.favorites ?? 0>",
      "popularity": "<music.popularity ?? 0>",
      "scoreDistribution": {},
      "statusDistribution": {},
      "playCount": "<music.playCount ?? 0>",
      "listeners": "<music.listeners ?? 0>"
    }
  }
  ```

#### `getFriends(id, currentUserId)` (L464)

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
- **5.** `[Sequence]` Database `all` on `MusicList` and stores it as `rawEntries`
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

#### `getPeople(id, query)` (L507)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `filterStatus`
  ```typescript
  const skip = page - 1 * limit
  const filterStatus = query?.status?.toUpperCase()?.trim()
  ```
- **4.** `[Sequence]` Database `query` on `MusicList` and stores it as `q`
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
    "mediaType": "music",
    "mediaId": "<id>",
    "total": "<total>",
    "page": "<page>",
    "limit": "<limit>",
    "totalPages": "<Math.ceil(total / limit) || 1>",
    "hasMore": "<page * limit < total>",
    "people": "<people>"
  }
  ```

#### `getRecommendations(id)` (L563)

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
- [apps/borealis/_shared/media-overview.helper.ts](../_shared/media-overview.helper.md) ([[apps/borealis/_shared/media-overview.helper]]) — `pick`, `flattenGenres`, `flattenTags`, `imageSource`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `countOf`, `or`, `and`, `toDate`, `MediaType`
- `@NamelessLiberty/shared` — `getProfileCustomization`

### Called By / Imported By
- [apps/borealis/music/music.ctrl.ts](./music.ctrl.md) ([[apps/borealis/music/music.ctrl]]) — `BorealisMusicServ`
