# lists.serv.ts

- **Source**: [`apps/borealis/lists/lists.serv.ts`](../../../../../../../apps/elysia/src/apps/borealis/lists/lists.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `BorealisListsServ extends BaseBorealisListService`

## Exported Types, Methods & Algorithms

### `interface ListQuery` (L16)

### `class BorealisListsServ` extends `BaseBorealisListService` (L503)

#### `getAnimeList(userId, query)` (L508)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `order`
  ```typescript
  const skip = page - 1 * limit
  const order = query?.order === 'asc' ? 'asc' : 'desc'
  ```
- **4.** `[Sequence]` Database `query` on `AnimeList` and stores it as `q`
- **5.** `[If]` `query?.status`
  - **5.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ status: query.status.trim().toUpperCase() as any })
    ```
- **6.** `[If]` `query?.q`
  - **6.1.** `[Sequence]` Define `qPattern`
    ```typescript
    const qPattern = `%${query.q.trim()}%`
    ```
  - **6.2.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((al) => al.anime.some((a) => or(a.titlePrimary.ilike(qPattern), a.titleSecondary.ilike(qPattern))))
    ```
- **7.** `[Sequence]` Define `formatStr`
  ```typescript
  const formatStr = query?.format || query?.mediaFormat
  ```
- **8.** `[If]` `formatStr`
  - **8.1.** `[Sequence]` Define `formats`
    ```typescript
    const formats = formatStr.split(',').map((f) => f.trim().toUpperCase()).filter(Boolean)
    ```
  - **8.2.** `[If]` `formats.length > 0`
    - **8.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((al) => al.anime.some((a) => a.format.in(formats as any)))
      ```
- **9.** `[If]` `query?.mediaStatus`
  - **9.1.** `[Sequence]` Define `statuses`
    ```typescript
    const statuses = query.mediaStatus.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    ```
  - **9.2.** `[If]` `statuses.length > 0`
    - **9.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((al) => al.anime.some((a) => a.status.in(statuses as any)))
      ```
- **10.** `[If]` `query?.genre`
  - **10.1.** `[Sequence]` Define `genres`
    ```typescript
    const genres = query.genre.split(',').map((g) => g.trim()).filter(Boolean)
    ```
  - **10.2.** `[If]` `genres.length > 0`
    - **10.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((al) => al.anime.some((a) => a.genres.some((g) => g.genre.some((ge) => ge.name.in(genres)))))
      ```
- **11.** `[If]` `query?.year`
  - **11.1.** `[Sequence]` Define `years`
    ```typescript
    const years = query.year.split(',').map((y) => Number(y.trim())).filter((n) => !isNaN(n))
    ```
  - **11.2.** `[If]` `years.length > 0`
    - **11.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((al) => al.anime.some((a) => a.startDateYear.in(years)))
      ```
- **12.** `[Sequence]` Define `itemsQ`
  ```typescript
  let itemsQ = q
  ```
- **13.** `[If]` `query?.sortBy === 'title'`
  - **13.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((al) => (order === 'asc' ? al.anime.titlePrimary.asc() : al.anime.titlePrimary.desc()))
    ```
- **14.** `[Else]` Otherwise
  - **14.1.** `[If]` `query?.sortBy === 'score'`
    - **14.1.1.** `[Sequence]` Assign `itemsQ`
      ```typescript
      itemsQ = itemsQ.orderBy((al) => (order === 'asc' ? al.score.asc() : al.score.desc()))
      ```
  - **14.2.** `[Else]` Otherwise
    - **14.2.1.** `[If]` `query?.sortBy === 'progress'`
      - **14.2.1.1.** `[Sequence]` Assign `itemsQ`
        ```typescript
        itemsQ = itemsQ.orderBy((al) => (order === 'asc' ? al.progress.asc() : al.progress.desc()))
        ```
    - **14.2.2.** `[Else]` Otherwise
      - **14.2.2.1.** `[If]` `query?.sortBy === 'createdAt'`
        - **14.2.2.1.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((al) => (order === 'asc' ? al.createdAt.asc() : al.createdAt.desc()))
          ```
      - **14.2.2.2.** `[Else]` Otherwise
        - **14.2.2.2.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((al) => (order === 'asc' ? al.updatedAt.asc() : al.updatedAt.desc()))
          ```
- **15.** `[Sequence]` Calls `Promise.all` and stores result as `[total, entries]`
- **16.** `[Return]` 
  ```json
  {
    "success": true,
    "items": "<entries.map((e) => { const { anime, ...entryData } = e const formattedMedia = anime ? { ...anime, genres: (anime.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => ({ id: g.genre!.id, name: g.genre!.name })), } ...)>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<Math.ceil(total / limit) || 1>",
      "hasMore": "<page * limit < total>"
    }
  }
  ```

#### `getAnimeEntry(userId, animeId)` (L614)

- **1.** `[Sequence]` Database `first` on `AnimeList` and stores it as `entry`
- **2.** `[If]` `!entry`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "inList": false,
      "entry": null
    }
    ```
- **3.** `[Sequence]` Define `{ anime, ...entryData }`, `formattedMedia`
  ```typescript
  const { anime, ...entryData } = entry
  const formattedMedia = anime ? { ...anime, genres: (anime.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => ({ id: g.genre!.id, name: g.genre!.name })), } : null
  ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "inList": true,
    "entry": "<formatEntry(entryData)>",
    "media": "<formattedMedia>"
  }
  ```

#### `upsertAnimeEntry(userId, animeId, body)` (L661)

- **1.** `[Sequence]` Database `first` on `Anime` and stores it as `anime`
- **2.** `[If]` `!anime`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Anime with ID ${animeId} does not exist`
- **3.** `[Sequence]` Database `first` on `AnimeList` and stores it as `existing`
- **4.** `[Sequence]` Define `progress`
  ```typescript
  let progress = body.progress !== undefined ? Number(body.progress) : undefined
  ```
- **5.** `[If]` `progress !== undefined && anime.episodeCount && anime.episodeCount > 0`
  - **5.1.** `[Sequence]` Assign `progress`
    ```typescript
    progress = Math.min(progress, anime.episodeCount)
    ```
- **6.** `[Sequence]` Define `startedAt`, `completedAt`, `updateData`
  ```typescript
  const startedAt = body.startedAt !== undefined ? (body.startedAt ? new Date(body.startedAt) : null) : undefined
  const completedAt = body.completedAt !== undefined ? (body.completedAt ? new Date(body.completedAt) : null) : undefined
  const updateData: any = { ...(body.status ? { status: body.status } : {}), ...(body.priority ? { priority: body.priority } : {}), ...(progress !== undefined ? { progress } : {}), ...(body.score !== undefined ? { score: body.score } : {}), ...(body.notes !== undefined ? { notes: body.notes } : {}), ...(body.rewatched !== undefined ? { rewatched: Number(body.rewatched) } : {}), ...
  ```
- **7.** `[Sequence]` Database `update` on `AnimeList` and stores it as `entry`
- **8.** `[If]` `!entry`
  - **8.1.** `[Error]` Throws `Error` — 'Failed to update anime list entry'
- **9.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **10.** `[Sequence]` Calls `emitListActivity`
- **11.** `[Sequence]` Define `connectionsToSync`
  ```typescript
  const connectionsToSync = body.connections ?? entry.connections
  ```
- **12.** `[If]` `connectionsToSync`
  - **12.1.** `[Sequence]` Calls `ConnectionSyncQueueManager.enqueueSyncJobs({ userId, mediaType: 'ANIME', mediaId: animeId, mediaTitle: anime.titlePrimary || anime.titleSecondary || 'Anime', entry: { status: entry.status, ...).catch`
- **13.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Anime list entry updated successfully",
    "entry": "<formatEntry(entry)>"
  }
  ```

#### `deleteAnimeEntry(userId, animeId)` (L762)

- **1.** `[Sequence]` Database `first` on `AnimeList` and stores it as `existing`
- **2.** `[If]` `!existing`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Anime with ID ${animeId} is not in user list`
- **3.** `[Sequence]` Database `first` on `Anime` and stores it as `anime`
- **4.** `[Sequence]` Database `delete` on `AnimeList`
- **5.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **6.** `[If]` `anime`
  - **6.1.** `[Sequence]` Calls `emitListActivity`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Anime removed from list successfully"
  }
  ```

#### `incrementAnime(userId, animeId, body)` (L794)

- **1.** `[Sequence]` Database `first` on `Anime` and stores it as `anime`
- **2.** `[If]` `!anime`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Anime with ID ${animeId} does not exist`
- **3.** `[Sequence]` Database `first` on `AnimeList` and stores it as `existing`
- **4.** `[Sequence]` Calls `Math.max` and stores result as `count`
- **5.** `[Sequence]` Define `currentProgress`, `newProgress`, `newStatus`, `completedAt`
  ```typescript
  const currentProgress = existing?.progress ?? 0
  let newProgress = currentProgress + count
  let newStatus = body?.status ?? existing?.status ?? 'IN_PROGRESS'
  let completedAt = existing?.completedAt ?? null
  ```
- **6.** `[If]` `newStatus !== 'IN_PROGRESS'`
  - **6.1.** `[Sequence]` Assign `newStatus`
    ```typescript
    newStatus = 'IN_PROGRESS'
    ```
- **7.** `[If]` `anime.episodeCount && anime.episodeCount > 0 && newProgress >= anime.episodeCount`
  - **7.1.** `[Sequence]` Assign `newProgress`
    ```typescript
    newProgress = anime.episodeCount
    ```
  - **7.2.** `[Sequence]` Assign `newStatus`
    ```typescript
    newStatus = 'COMPLETED'
    ```
  - **7.3.** `[If]` `!completedAt`
    - **7.3.1.** `[Sequence]` Assign `completedAt`
      ```typescript
      completedAt = new Date()
      ```
- **8.** `[Else]` Otherwise
  - **8.1.** `[Sequence]` Assign `completedAt`
    ```typescript
    completedAt = null
    ```
- **9.** `[Sequence]` Database `update` on `AnimeList` and stores it as `entry`
- **10.** `[If]` `!entry`
  - **10.1.** `[Error]` Throws `Error` — 'Failed to increment anime list entry'
- **11.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **12.** `[Sequence]` Calls `emitListActivity`
- **13.** `[Sequence]` Define `connectionsToSync`
  ```typescript
  const connectionsToSync = (body as any)?.connections ?? entry.connections ?? existing?.connections
  ```
- **14.** `[If]` `connectionsToSync`
  - **14.1.** `[Sequence]` Calls `ConnectionSyncQueueManager.enqueueSyncJobs({ userId, mediaType: 'ANIME', mediaId: animeId, mediaTitle: anime.titlePrimary || anime.titleSecondary || 'Anime', entry: { status: entry.status, ...).catch`
- **15.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "<`Episode progress incremented to ${entry.progress}`>",
    "entry": "<formatEntry(entry)>"
  }
  ```

#### `getAnimeStats(userId, query, isOwner = true)` (L893)

- **1.** `[Sequence]` Database `query` on `AnimeList` and stores it as `q`
- **2.** `[If]` `!isOwner`
  - **2.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ private: false })
    ```
- **3.** `[Sequence]` Calls `q.select('status', 'progress', 'score', ...).all` and stores result as `items`
- **4.** `[Sequence]` Calls `mediaStatsService.getAnimeStats` and stores result as `data`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "data": "<data>",
    "stats": "<computeStats(items, 'progress')>"
  }
  ```

#### `getAnimeFilters(userId)` (L911)

- **1.** `[Sequence]` Database `all` on `AnimeList` and stores it as `rawItems`
- **2.** `[Sequence]` Define `items`
  ```typescript
  const items = rawItems.map((item) => ({ status: item.status, priority: item.priority, private: item.private, notes: item.notes, connections: item.connections, anime: item.anime ...)
  ```
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "...computeFilters(items, 'anime', 'startDateYear')": "..."
  }
  ```

#### `getMangaList(userId, query)` (L947)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `order`
  ```typescript
  const skip = page - 1 * limit
  const order = query?.order === 'asc' ? 'asc' : 'desc'
  ```
- **4.** `[Sequence]` Database `query` on `MangaList` and stores it as `q`
- **5.** `[If]` `query?.status`
  - **5.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ status: query.status.trim().toUpperCase() as any })
    ```
- **6.** `[If]` `query?.q`
  - **6.1.** `[Sequence]` Define `qPattern`
    ```typescript
    const qPattern = `%${query.q.trim()}%`
    ```
  - **6.2.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((ml) => ml.manga.some((m) => or(m.titlePrimary.ilike(qPattern), m.titleSecondary.ilike(qPattern))))
    ```
- **7.** `[Sequence]` Define `formatStr`
  ```typescript
  const formatStr = query?.format || query?.mediaFormat
  ```
- **8.** `[If]` `formatStr`
  - **8.1.** `[Sequence]` Define `formats`
    ```typescript
    const formats = formatStr.split(',').map((f) => f.trim().toUpperCase()).filter(Boolean)
    ```
  - **8.2.** `[If]` `formats.length > 0`
    - **8.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((ml) => ml.manga.some((m) => m.format.in(formats as any)))
      ```
- **9.** `[If]` `query?.mediaStatus`
  - **9.1.** `[Sequence]` Define `statuses`
    ```typescript
    const statuses = query.mediaStatus.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    ```
  - **9.2.** `[If]` `statuses.length > 0`
    - **9.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((ml) => ml.manga.some((m) => m.status.in(statuses as any)))
      ```
- **10.** `[If]` `query?.genre`
  - **10.1.** `[Sequence]` Define `genres`
    ```typescript
    const genres = query.genre.split(',').map((g) => g.trim()).filter(Boolean)
    ```
  - **10.2.** `[If]` `genres.length > 0`
    - **10.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((ml) => ml.manga.some((m) => m.genres.some((g) => g.genre.some((ge) => ge.name.in(genres)))))
      ```
- **11.** `[If]` `query?.year`
  - **11.1.** `[Sequence]` Define `years`
    ```typescript
    const years = query.year.split(',').map((y) => Number(y.trim())).filter((n) => !isNaN(n))
    ```
  - **11.2.** `[If]` `years.length > 0`
    - **11.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((ml) => ml.manga.some((m) => m.startDateYear.in(years)))
      ```
- **12.** `[Sequence]` Define `itemsQ`
  ```typescript
  let itemsQ = q
  ```
- **13.** `[If]` `query?.sortBy === 'title'`
  - **13.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((ml) => (order === 'asc' ? ml.manga.titlePrimary.asc() : ml.manga.titlePrimary.desc()))
    ```
- **14.** `[Else]` Otherwise
  - **14.1.** `[If]` `query?.sortBy === 'score'`
    - **14.1.1.** `[Sequence]` Assign `itemsQ`
      ```typescript
      itemsQ = itemsQ.orderBy((ml) => (order === 'asc' ? ml.score.asc() : ml.score.desc()))
      ```
  - **14.2.** `[Else]` Otherwise
    - **14.2.1.** `[If]` `query?.sortBy === 'progress'`
      - **14.2.1.1.** `[Sequence]` Assign `itemsQ`
        ```typescript
        itemsQ = itemsQ.orderBy((ml) => (order === 'asc' ? ml.chaptersProgress.asc() : ml.chaptersProgress.desc()))
        ```
    - **14.2.2.** `[Else]` Otherwise
      - **14.2.2.1.** `[If]` `query?.sortBy === 'createdAt'`
        - **14.2.2.1.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((ml) => (order === 'asc' ? ml.createdAt.asc() : ml.createdAt.desc()))
          ```
      - **14.2.2.2.** `[Else]` Otherwise
        - **14.2.2.2.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((ml) => (order === 'asc' ? ml.updatedAt.asc() : ml.updatedAt.desc()))
          ```
- **15.** `[Sequence]` Calls `Promise.all` and stores result as `[total, entries]`
- **16.** `[Return]` 
  ```json
  {
    "success": true,
    "items": "<entries.map((e) => { const { manga, ...entryData } = e const formattedMedia = manga ? { ...manga, genres: (manga.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => ({ id: g.genre!.id, name: g.genre!.name })), } ...)>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<Math.ceil(total / limit) || 1>",
      "hasMore": "<page * limit < total>"
    }
  }
  ```

#### `getMangaEntry(userId, mangaId)` (L1054)

- **1.** `[Sequence]` Database `first` on `MangaList` and stores it as `entry`
- **2.** `[If]` `!entry`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "inList": false,
      "entry": null
    }
    ```
- **3.** `[Sequence]` Define `{ manga, ...entryData }`, `formattedMedia`
  ```typescript
  const { manga, ...entryData } = entry
  const formattedMedia = manga ? { ...manga, genres: (manga.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => ({ id: g.genre!.id, name: g.genre!.name })), } : null
  ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "inList": true,
    "entry": "<formatEntry(entryData)>",
    "media": "<formattedMedia>"
  }
  ```

#### `upsertMangaEntry(userId, mangaId, body)` (L1102)

- **1.** `[Sequence]` Database `first` on `Manga` and stores it as `manga`
- **2.** `[If]` `!manga`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Manga with ID ${mangaId} does not exist`
- **3.** `[Sequence]` Database `first` on `MangaList` and stores it as `existing`
- **4.** `[Sequence]` Define `chaptersProgress`
  ```typescript
  let chaptersProgress = body.chaptersProgress !== undefined ? Number(body.chaptersProgress) : undefined
  ```
- **5.** `[If]` `chaptersProgress !== undefined && manga.chapterCount && manga.chapterCount > 0`
  - **5.1.** `[Sequence]` Assign `chaptersProgress`
    ```typescript
    chaptersProgress = Math.min(chaptersProgress, manga.chapterCount)
    ```
- **6.** `[Sequence]` Define `volumesProgress`, `startedAt`, `completedAt`, `updateData`
  ```typescript
  const volumesProgress = body.volumesProgress !== undefined ? Number(body.volumesProgress) : undefined
  const startedAt = body.startedAt !== undefined ? (body.startedAt ? new Date(body.startedAt) : null) : undefined
  const completedAt = body.completedAt !== undefined ? (body.completedAt ? new Date(body.completedAt) : null) : undefined
  const updateData: any = { ...(body.status ? { status: body.status } : {}), ...(body.priority ? { priority: body.priority } : {}), ...(chaptersProgress !== undefined ? { chaptersProgress } : {}), ...(volumesProgress !== undefined ? { volumesProgress } : {}), ...(body.score !== undefined ? { score: body.score } : {}), ...(body.notes !== undefined ? { notes: body.notes } : {}), ...
  ```
- **7.** `[Sequence]` Database `update` on `MangaList` and stores it as `entry`
- **8.** `[If]` `!entry`
  - **8.1.** `[Error]` Throws `Error` — 'Failed to update manga list entry'
- **9.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **10.** `[Sequence]` Calls `emitListActivity`
- **11.** `[Sequence]` Define `connectionsToSync`
  ```typescript
  const connectionsToSync = body.connections ?? entry.connections
  ```
- **12.** `[If]` `connectionsToSync`
  - **12.1.** `[Sequence]` Calls `ConnectionSyncQueueManager.enqueueSyncJobs({ userId, mediaType: 'MANGA', mediaId: mangaId, mediaTitle: manga.titlePrimary || manga.titleSecondary || 'Manga', entry: { status: entry.status, ...).catch`
- **13.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Manga list entry updated successfully",
    "entry": "<formatEntry(entry)>"
  }
  ```

#### `deleteMangaEntry(userId, mangaId)` (L1206)

- **1.** `[Sequence]` Database `first` on `MangaList` and stores it as `existing`
- **2.** `[If]` `!existing`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Manga with ID ${mangaId} is not in user list`
- **3.** `[Sequence]` Database `first` on `Manga` and stores it as `manga`
- **4.** `[Sequence]` Database `delete` on `MangaList`
- **5.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **6.** `[If]` `manga`
  - **6.1.** `[Sequence]` Calls `emitListActivity`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Manga removed from list successfully"
  }
  ```

#### `incrementManga(userId, mangaId, body)` (L1238)

- **1.** `[Sequence]` Database `first` on `Manga` and stores it as `manga`
- **2.** `[If]` `!manga`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Manga with ID ${mangaId} does not exist`
- **3.** `[Sequence]` Database `first` on `MangaList` and stores it as `existing`
- **4.** `[Sequence]` Calls `Math.max` and stores result as `count`
- **5.** `[Sequence]` Define `isVolume`, `chaptersProgress`, `volumesProgress`, `newStatus`, `completedAt`
  ```typescript
  const isVolume = body?.type === 'volume'
  let chaptersProgress = existing?.chaptersProgress ?? 0
  let volumesProgress = existing?.volumesProgress ?? 0
  let newStatus = body?.status ?? existing?.status ?? 'IN_PROGRESS'
  let completedAt = existing?.completedAt ?? null
  ```
- **6.** `[If]` `newStatus !== 'IN_PROGRESS'`
  - **6.1.** `[Sequence]` Assign `newStatus`
    ```typescript
    newStatus = 'IN_PROGRESS'
    ```
- **7.** `[If]` `isVolume`
  - **7.1.** `[Sequence]` Assign `volumesProgress`
    ```typescript
    volumesProgress += count
    ```
  - **7.2.** `[If]` `manga.volumeCount && manga.volumeCount > 0 && volumesProgress >= manga.volumeCount`
    - **7.2.1.** `[Sequence]` Assign `volumesProgress`
      ```typescript
      volumesProgress = manga.volumeCount
      ```
    - **7.2.2.** `[Sequence]` Assign `newStatus`
      ```typescript
      newStatus = 'COMPLETED'
      ```
    - **7.2.3.** `[If]` `!completedAt`
      - **7.2.3.1.** `[Sequence]` Assign `completedAt`
        ```typescript
        completedAt = new Date()
        ```
  - **7.3.** `[Else]` Otherwise
    - **7.3.1.** `[Sequence]` Assign `completedAt`
      ```typescript
      completedAt = null
      ```
- **8.** `[Else]` Otherwise
  - **8.1.** `[Sequence]` Assign `chaptersProgress`
    ```typescript
    chaptersProgress += count
    ```
  - **8.2.** `[If]` `manga.chapterCount && manga.chapterCount > 0 && chaptersProgress >= manga.chapterCount`
    - **8.2.1.** `[Sequence]` Assign `chaptersProgress`
      ```typescript
      chaptersProgress = manga.chapterCount
      ```
    - **8.2.2.** `[Sequence]` Assign `newStatus`
      ```typescript
      newStatus = 'COMPLETED'
      ```
    - **8.2.3.** `[If]` `!completedAt`
      - **8.2.3.1.** `[Sequence]` Assign `completedAt`
        ```typescript
        completedAt = new Date()
        ```
  - **8.3.** `[Else]` Otherwise
    - **8.3.1.** `[Sequence]` Assign `completedAt`
      ```typescript
      completedAt = null
      ```
- **9.** `[Sequence]` Database `update` on `MangaList` and stores it as `entry`
- **10.** `[If]` `!entry`
  - **10.1.** `[Error]` Throws `Error` — 'Failed to increment manga list entry'
- **11.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **12.** `[Sequence]` Calls `emitListActivity`
- **13.** `[Sequence]` Define `connectionsToSync`
  ```typescript
  const connectionsToSync = (body as any)?.connections ?? entry.connections ?? existing?.connections
  ```
- **14.** `[If]` `connectionsToSync`
  - **14.1.** `[Sequence]` Calls `ConnectionSyncQueueManager.enqueueSyncJobs({ userId, mediaType: 'MANGA', mediaId: mangaId, mediaTitle: manga.titlePrimary || manga.titleSecondary || 'Manga', entry: { status: entry.status, ...).catch`
- **15.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "<`Progress incremented to ${isVolume ? `${volumesProgress} volumes` : `${chaptersProgress} chapters`}`>",
    "entry": "<formatEntry(entry)>"
  }
  ```

#### `getMangaStats(userId, query, isOwner = true)` (L1358)

- **1.** `[Sequence]` Database `query` on `MangaList` and stores it as `q`
- **2.** `[If]` `!isOwner`
  - **2.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ private: false })
    ```
- **3.** `[Sequence]` Calls `q.select('status', 'chaptersProgress', 'volumesProgress', ...).all` and stores result as `items`
- **4.** `[Sequence]` Calls `mediaStatsService.getMangaStats` and stores result as `data`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "data": "<data>",
    "stats": "<computeStats(items, 'chaptersProgress')>"
  }
  ```

#### `getMangaFilters(userId)` (L1376)

- **1.** `[Sequence]` Database `all` on `MangaList` and stores it as `rawItems`
- **2.** `[Sequence]` Define `items`
  ```typescript
  const items = rawItems.map((item) => ({ status: item.status, priority: item.priority, private: item.private, notes: item.notes, connections: item.connections, manga: item.manga ...)
  ```
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "...computeFilters(items, 'manga', 'startDateYear')": "..."
  }
  ```

#### `getMovieList(userId, query)` (L1412)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `order`
  ```typescript
  const skip = page - 1 * limit
  const order = query?.order === 'asc' ? 'asc' : 'desc'
  ```
- **4.** `[Sequence]` Database `query` on `MovieList` and stores it as `q`
- **5.** `[If]` `query?.status`
  - **5.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ status: query.status.trim().toUpperCase() as any })
    ```
- **6.** `[If]` `query?.q`
  - **6.1.** `[Sequence]` Define `qPattern`
    ```typescript
    const qPattern = `%${query.q.trim()}%`
    ```
  - **6.2.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((ml) => ml.movie.some((m) => or(m.titlePrimary.ilike(qPattern), m.titleSecondary.ilike(qPattern))))
    ```
- **7.** `[If]` `query?.mediaStatus`
  - **7.1.** `[Sequence]` Define `statuses`
    ```typescript
    const statuses = query.mediaStatus.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    ```
  - **7.2.** `[If]` `statuses.length > 0`
    - **7.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((ml) => ml.movie.some((m) => m.status.in(statuses as any)))
      ```
- **8.** `[If]` `query?.genre`
  - **8.1.** `[Sequence]` Define `genres`
    ```typescript
    const genres = query.genre.split(',').map((g) => g.trim()).filter(Boolean)
    ```
  - **8.2.** `[If]` `genres.length > 0`
    - **8.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((ml) => ml.movie.some((m) => m.genres.some((g) => g.genre.some((ge) => ge.name.in(genres)))))
      ```
- **9.** `[If]` `query?.year`
  - **9.1.** `[Sequence]` Define `years`
    ```typescript
    const years = query.year.split(',').map((y) => Number(y.trim())).filter((n) => !isNaN(n))
    ```
  - **9.2.** `[If]` `years.length > 0`
    - **9.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((ml) => ml.movie.some((m) => m.releaseDateYear.in(years)))
      ```
- **10.** `[Sequence]` Define `itemsQ`
  ```typescript
  let itemsQ = q
  ```
- **11.** `[If]` `query?.sortBy === 'title'`
  - **11.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((ml) => (order === 'asc' ? ml.movie.titlePrimary.asc() : ml.movie.titlePrimary.desc()))
    ```
- **12.** `[Else]` Otherwise
  - **12.1.** `[If]` `query?.sortBy === 'score'`
    - **12.1.1.** `[Sequence]` Assign `itemsQ`
      ```typescript
      itemsQ = itemsQ.orderBy((ml) => (order === 'asc' ? ml.score.asc() : ml.score.desc()))
      ```
  - **12.2.** `[Else]` Otherwise
    - **12.2.1.** `[If]` `query?.sortBy === 'createdAt'`
      - **12.2.1.1.** `[Sequence]` Assign `itemsQ`
        ```typescript
        itemsQ = itemsQ.orderBy((ml) => (order === 'asc' ? ml.createdAt.asc() : ml.createdAt.desc()))
        ```
    - **12.2.2.** `[Else]` Otherwise
      - **12.2.2.1.** `[Sequence]` Assign `itemsQ`
        ```typescript
        itemsQ = itemsQ.orderBy((ml) => (order === 'asc' ? ml.updatedAt.asc() : ml.updatedAt.desc()))
        ```
- **13.** `[Sequence]` Calls `Promise.all` and stores result as `[total, entries]`
- **14.** `[Return]` 
  ```json
  {
    "success": true,
    "items": "<entries.map((e) => { const { movie, ...entryData } = e const formattedMedia = movie ? { ...movie, genres: (movie.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => ({ id: g.genre!.id, name: g.genre!.name })), } ...)>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<Math.ceil(total / limit) || 1>",
      "hasMore": "<page * limit < total>"
    }
  }
  ```

#### `getMovieEntry(userId, movieId)` (L1507)

- **1.** `[Sequence]` Database `first` on `MovieList` and stores it as `entry`
- **2.** `[If]` `!entry`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "inList": false,
      "entry": null
    }
    ```
- **3.** `[Sequence]` Define `{ movie, ...entryData }`, `formattedMedia`
  ```typescript
  const { movie, ...entryData } = entry
  const formattedMedia = movie ? { ...movie, genres: (movie.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => ({ id: g.genre!.id, name: g.genre!.name })), } : null
  ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "inList": true,
    "entry": "<formatEntry(entryData)>",
    "media": "<formattedMedia>"
  }
  ```

#### `upsertMovieEntry(userId, movieId, body)` (L1552)

- **1.** `[Sequence]` Database `first` on `Movie` and stores it as `movie`
- **2.** `[If]` `!movie`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Movie with ID ${movieId} does not exist`
- **3.** `[Sequence]` Database `first` on `MovieList` and stores it as `existing`
- **4.** `[Sequence]` Define `startedAt`, `completedAt`, `updateData`
  ```typescript
  const startedAt = body.startedAt !== undefined ? (body.startedAt ? new Date(body.startedAt) : null) : undefined
  const completedAt = body.completedAt !== undefined ? (body.completedAt ? new Date(body.completedAt) : null) : undefined
  const updateData: any = { ...(body.status ? { status: body.status } : {}), ...(body.priority ? { priority: body.priority } : {}), ...(body.score !== undefined ? { score: body.score } : {}), ...(body.notes !== undefined ? { notes: body.notes } : {}), ...(body.rewatched !== undefined ? { rewatched: Number(body.rewatched) } : {}), ...(body.private !== undefined ? { private: Boolean(body.private) } : {}), ...
  ```
- **5.** `[Sequence]` Database `update` on `MovieList` and stores it as `entry`
- **6.** `[If]` `!entry`
  - **6.1.** `[Error]` Throws `Error` — 'Failed to update movie list entry'
- **7.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **8.** `[Sequence]` Calls `emitListActivity`
- **9.** `[Sequence]` Define `connectionsToSync`
  ```typescript
  const connectionsToSync = body.connections ?? entry.connections
  ```
- **10.** `[If]` `connectionsToSync`
  - **10.1.** `[Sequence]` Calls `ConnectionSyncQueueManager.enqueueSyncJobs({ userId, mediaType: 'MOVIE', mediaId: movieId, mediaTitle: movie.titlePrimary || movie.titleSecondary || 'Movie', entry: { status: entry.status, ...).catch`
- **11.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Movie list entry updated successfully",
    "entry": "<formatEntry(entry)>"
  }
  ```

#### `deleteMovieEntry(userId, movieId)` (L1637)

- **1.** `[Sequence]` Database `first` on `MovieList` and stores it as `existing`
- **2.** `[If]` `!existing`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Movie with ID ${movieId} is not in user list`
- **3.** `[Sequence]` Database `first` on `Movie` and stores it as `movie`
- **4.** `[Sequence]` Database `delete` on `MovieList`
- **5.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **6.** `[If]` `movie`
  - **6.1.** `[Sequence]` Calls `emitListActivity`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Movie removed from list successfully"
  }
  ```

#### `incrementMovie(userId, movieId, body)` (L1669)

- **1.** `[Sequence]` Database `first` on `Movie` and stores it as `movie`
- **2.** `[If]` `!movie`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Movie with ID ${movieId} does not exist`
- **3.** `[Sequence]` Database `first` on `MovieList` and stores it as `existing`
- **4.** `[Sequence]` Calls `Math.max` and stores result as `count`
- **5.** `[Sequence]` Define `newRewatched`
  ```typescript
  const newRewatched = existing?.rewatched ?? 0 + count
  ```
- **6.** `[Sequence]` Database `update` on `MovieList` and stores it as `entry`
- **7.** `[If]` `!entry`
  - **7.1.** `[Error]` Throws `Error` — 'Failed to increment movie list entry'
- **8.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **9.** `[Sequence]` Calls `emitListActivity`
- **10.** `[Sequence]` Define `connectionsToSync`
  ```typescript
  const connectionsToSync = (body as any)?.connections ?? entry.connections ?? existing?.connections
  ```
- **11.** `[If]` `connectionsToSync`
  - **11.1.** `[Sequence]` Calls `ConnectionSyncQueueManager.enqueueSyncJobs({ userId, mediaType: 'MOVIE', mediaId: movieId, mediaTitle: movie.titlePrimary || movie.titleSecondary || 'Movie', entry: { status: entry.status, ...).catch`
- **12.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "<`Rewatch count incremented to ${entry.rewatched}`>",
    "entry": "<formatEntry(entry)>"
  }
  ```

#### `getMovieStats(userId, query, isOwner = true)` (L1740)

- **1.** `[Sequence]` Database `query` on `MovieList` and stores it as `q`
- **2.** `[If]` `!isOwner`
  - **2.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ private: false })
    ```
- **3.** `[Sequence]` Calls `q.select('status', 'score', 'rewatched').all` and stores result as `items`
- **4.** `[Sequence]` Calls `mediaStatsService.getMovieStats` and stores result as `data`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "data": "<data>",
    "stats": "<computeStats(items, 'rewatched')>"
  }
  ```

#### `getMovieFilters(userId)` (L1758)

- **1.** `[Sequence]` Database `all` on `MovieList` and stores it as `rawItems`
- **2.** `[Sequence]` Define `items`
  ```typescript
  const items = rawItems.map((item) => ({ status: item.status, priority: item.priority, private: item.private, notes: item.notes, connections: item.connections, movie: item.movie ...)
  ```
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "...computeFilters(items, 'movie', 'releaseDateYear')": "..."
  }
  ```

#### `getTvList(userId, query)` (L1794)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `order`
  ```typescript
  const skip = page - 1 * limit
  const order = query?.order === 'asc' ? 'asc' : 'desc'
  ```
- **4.** `[Sequence]` Database `query` on `TvList` and stores it as `q`
- **5.** `[If]` `query?.status`
  - **5.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ status: query.status.trim().toUpperCase() as any })
    ```
- **6.** `[If]` `query?.q`
  - **6.1.** `[Sequence]` Define `qPattern`
    ```typescript
    const qPattern = `%${query.q.trim()}%`
    ```
  - **6.2.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((tl) => tl.tv.some((t) => or(t.titlePrimary.ilike(qPattern), t.titleSecondary.ilike(qPattern))))
    ```
- **7.** `[If]` `query?.mediaStatus`
  - **7.1.** `[Sequence]` Define `statuses`
    ```typescript
    const statuses = query.mediaStatus.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    ```
  - **7.2.** `[If]` `statuses.length > 0`
    - **7.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((tl) => tl.tv.some((t) => t.status.in(statuses as any)))
      ```
- **8.** `[If]` `query?.genre`
  - **8.1.** `[Sequence]` Define `genres`
    ```typescript
    const genres = query.genre.split(',').map((g) => g.trim()).filter(Boolean)
    ```
  - **8.2.** `[If]` `genres.length > 0`
    - **8.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((tl) => tl.tv.some((t) => t.genres.some((g) => g.genre.some((ge) => ge.name.in(genres)))))
      ```
- **9.** `[If]` `query?.year`
  - **9.1.** `[Sequence]` Define `years`
    ```typescript
    const years = query.year.split(',').map((y) => Number(y.trim())).filter((n) => !isNaN(n))
    ```
  - **9.2.** `[If]` `years.length > 0`
    - **9.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((tl) => tl.tv.some((t) => t.firstAiredYear.in(years)))
      ```
- **10.** `[Sequence]` Define `itemsQ`
  ```typescript
  let itemsQ = q
  ```
- **11.** `[If]` `query?.sortBy === 'title'`
  - **11.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((tl) => (order === 'asc' ? tl.tv.titlePrimary.asc() : tl.tv.titlePrimary.desc()))
    ```
- **12.** `[Else]` Otherwise
  - **12.1.** `[If]` `query?.sortBy === 'score'`
    - **12.1.1.** `[Sequence]` Assign `itemsQ`
      ```typescript
      itemsQ = itemsQ.orderBy((tl) => (order === 'asc' ? tl.score.asc() : tl.score.desc()))
      ```
  - **12.2.** `[Else]` Otherwise
    - **12.2.1.** `[If]` `query?.sortBy === 'progress'`
      - **12.2.1.1.** `[Sequence]` Assign `itemsQ`
        ```typescript
        itemsQ = itemsQ.orderBy((tl) => (order === 'asc' ? tl.progress.asc() : tl.progress.desc()))
        ```
    - **12.2.2.** `[Else]` Otherwise
      - **12.2.2.1.** `[If]` `query?.sortBy === 'createdAt'`
        - **12.2.2.1.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((tl) => (order === 'asc' ? tl.createdAt.asc() : tl.createdAt.desc()))
          ```
      - **12.2.2.2.** `[Else]` Otherwise
        - **12.2.2.2.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((tl) => (order === 'asc' ? tl.updatedAt.asc() : tl.updatedAt.desc()))
          ```
- **13.** `[Sequence]` Calls `Promise.all` and stores result as `[total, entries]`
- **14.** `[Return]` 
  ```json
  {
    "success": true,
    "items": "<entries.map((e) => { const { tv, ...entryData } = e const formattedMedia = tv ? { ...tv, genres: (tv.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => ({ id: g.genre!.id, name: g.genre!.name })), } ...)>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<Math.ceil(total / limit) || 1>",
      "hasMore": "<page * limit < total>"
    }
  }
  ```

#### `getTvEntry(userId, tvId)` (L1903)

- **1.** `[Sequence]` Database `first` on `TvList` and stores it as `entry`
- **2.** `[If]` `!entry`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "inList": false,
      "entry": null
    }
    ```
- **3.** `[Sequence]` Define `{ tv, ...entryData }`, `formattedMedia`
  ```typescript
  const { tv, ...entryData } = entry
  const formattedMedia = tv ? { ...tv, genres: (tv.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => ({ id: g.genre!.id, name: g.genre!.name })), } : null
  ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "inList": true,
    "entry": "<formatEntry(entryData)>",
    "media": "<formattedMedia>"
  }
  ```

#### `upsertTvEntry(userId, tvId, body)` (L1960)

- **1.** `[Sequence]` Database `first` on `Tv` and stores it as `tv`
- **2.** `[If]` `!tv`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `TV series with ID ${tvId} does not exist`
- **3.** `[Sequence]` Database `first` on `TvList` and stores it as `existing`
- **4.** `[Sequence]` Define `progress`
  ```typescript
  let progress = body.progress !== undefined ? Number(body.progress) : undefined
  ```
- **5.** `[If]` `progress !== undefined && tv.episodeCount && tv.episodeCount > 0`
  - **5.1.** `[Sequence]` Assign `progress`
    ```typescript
    progress = Math.min(progress, tv.episodeCount)
    ```
- **6.** `[Sequence]` Define `startedAt`, `completedAt`, `updateData`
  ```typescript
  const startedAt = body.startedAt !== undefined ? (body.startedAt ? new Date(body.startedAt) : null) : undefined
  const completedAt = body.completedAt !== undefined ? (body.completedAt ? new Date(body.completedAt) : null) : undefined
  const updateData: any = { ...(body.status ? { status: body.status } : {}), ...(body.priority ? { priority: body.priority } : {}), ...(progress !== undefined ? { progress } : {}), ...(body.score !== undefined ? { score: body.score } : {}), ...(body.notes !== undefined ? { notes: body.notes } : {}), ...(body.rewatched !== undefined ? { rewatched: Number(body.rewatched) } : {}), ...
  ```
- **7.** `[Sequence]` Database `update` on `TvList` and stores it as `entry`
- **8.** `[If]` `!entry`
  - **8.1.** `[Error]` Throws `Error` — 'Failed to update TV list entry'
- **9.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **10.** `[Sequence]` Calls `emitListActivity`
- **11.** `[Sequence]` Define `connectionsToSync`
  ```typescript
  const connectionsToSync = body.connections ?? entry.connections
  ```
- **12.** `[If]` `connectionsToSync`
  - **12.1.** `[Sequence]` Calls `ConnectionSyncQueueManager.enqueueSyncJobs({ userId, mediaType: 'TV', mediaId: tvId, mediaTitle: tv.titlePrimary || (tv as any).titleSecondary || 'TV', entry: { status: entry.status, ...).catch`
- **13.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "TV list entry updated successfully",
    "entry": "<formatEntry(entry)>"
  }
  ```

#### `deleteTvEntry(userId, tvId)` (L2052)

- **1.** `[Sequence]` Database `first` on `TvList` and stores it as `existing`
- **2.** `[If]` `!existing`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `TV show with ID ${tvId} is not in user list`
- **3.** `[Sequence]` Database `first` on `Tv` and stores it as `tv`
- **4.** `[Sequence]` Database `delete` on `TvList`
- **5.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **6.** `[If]` `tv`
  - **6.1.** `[Sequence]` Calls `emitListActivity`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "TV show removed from list successfully"
  }
  ```

#### `incrementTv(userId, tvId, body)` (L2084)

- **1.** `[Sequence]` Database `first` on `Tv` and stores it as `tv`
- **2.** `[If]` `!tv`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `TV series with ID ${tvId} does not exist`
- **3.** `[Sequence]` Database `first` on `TvList` and stores it as `existing`
- **4.** `[Sequence]` Calls `Math.max` and stores result as `count`
- **5.** `[Sequence]` Define `currentProgress`, `newProgress`, `newStatus`, `completedAt`
  ```typescript
  const currentProgress = existing?.progress ?? 0
  let newProgress = currentProgress + count
  let newStatus = body?.status ?? existing?.status ?? 'IN_PROGRESS'
  let completedAt = existing?.completedAt ?? null
  ```
- **6.** `[If]` `newStatus !== 'IN_PROGRESS'`
  - **6.1.** `[Sequence]` Assign `newStatus`
    ```typescript
    newStatus = 'IN_PROGRESS'
    ```
- **7.** `[If]` `tv.episodeCount && tv.episodeCount > 0 && newProgress >= tv.episodeCount`
  - **7.1.** `[Sequence]` Assign `newProgress`
    ```typescript
    newProgress = tv.episodeCount
    ```
  - **7.2.** `[Sequence]` Assign `newStatus`
    ```typescript
    newStatus = 'COMPLETED'
    ```
  - **7.3.** `[If]` `!completedAt`
    - **7.3.1.** `[Sequence]` Assign `completedAt`
      ```typescript
      completedAt = new Date()
      ```
- **8.** `[Else]` Otherwise
  - **8.1.** `[Sequence]` Assign `completedAt`
    ```typescript
    completedAt = null
    ```
- **9.** `[Sequence]` Database `update` on `TvList` and stores it as `entry`
- **10.** `[If]` `!entry`
  - **10.1.** `[Error]` Throws `Error` — 'Failed to increment TV list entry'
- **11.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **12.** `[Sequence]` Calls `emitListActivity`
- **13.** `[Sequence]` Define `connectionsToSync`
  ```typescript
  const connectionsToSync = (body as any)?.connections ?? entry.connections ?? existing?.connections
  ```
- **14.** `[If]` `connectionsToSync`
  - **14.1.** `[Sequence]` Calls `ConnectionSyncQueueManager.enqueueSyncJobs({ userId, mediaType: 'TV', mediaId: tvId, mediaTitle: tv.titlePrimary || (tv as any).titleSecondary || 'TV', entry: { status: entry.status, ...).catch`
- **15.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "<`Episode progress incremented to ${entry.progress}`>",
    "entry": "<formatEntry(entry)>"
  }
  ```

#### `getTvStats(userId, query, isOwner = true)` (L2174)

- **1.** `[Sequence]` Database `query` on `TvList` and stores it as `q`
- **2.** `[If]` `!isOwner`
  - **2.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ private: false })
    ```
- **3.** `[Sequence]` Calls `q.select('status', 'progress', 'score', ...).all` and stores result as `items`
- **4.** `[Sequence]` Calls `mediaStatsService.getTvStats` and stores result as `data`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "data": "<data>",
    "stats": "<computeStats(items, 'progress')>"
  }
  ```

#### `getTvFilters(userId)` (L2192)

- **1.** `[Sequence]` Database `all` on `TvList` and stores it as `rawItems`
- **2.** `[Sequence]` Define `items`
  ```typescript
  const items = rawItems.map((item) => ({ status: item.status, priority: item.priority, private: item.private, notes: item.notes, connections: item.connections, tv: item.tv ...)
  ```
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "...computeFilters(items, 'tv', 'firstAiredYear')": "..."
  }
  ```

#### `getGameList(userId, query)` (L2228)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `order`
  ```typescript
  const skip = page - 1 * limit
  const order = query?.order === 'asc' ? 'asc' : 'desc'
  ```
- **4.** `[Sequence]` Database `query` on `GameList` and stores it as `q`
- **5.** `[If]` `query?.status`
  - **5.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ status: query.status.trim().toUpperCase() as any })
    ```
- **6.** `[If]` `query?.q`
  - **6.1.** `[Sequence]` Define `qPattern`
    ```typescript
    const qPattern = `%${query.q.trim()}%`
    ```
  - **6.2.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((gl) => gl.game.some((g) => or( g.titlePrimary.ilike(qPattern), g.titleSecondary.ilike(qPattern), g.titleNative.ilike(qPattern) ) ...
    ```
- **7.** `[If]` `query?.mediaStatus`
  - **7.1.** `[Sequence]` Define `statuses`
    ```typescript
    const statuses = query.mediaStatus.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    ```
  - **7.2.** `[If]` `statuses.length > 0`
    - **7.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((gl) => gl.game.some((g) => g.status.in(statuses as any)))
      ```
- **8.** `[If]` `query?.genre`
  - **8.1.** `[Sequence]` Define `genres`
    ```typescript
    const genres = query.genre.split(',').map((g) => g.trim()).filter(Boolean)
    ```
  - **8.2.** `[If]` `genres.length > 0`
    - **8.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((gl) => gl.game.some((g) => g.genres.some((ge) => ge.genre.some((gn) => gn.name.in(genres)))))
      ```
- **9.** `[If]` `query?.year`
  - **9.1.** `[Sequence]` Define `years`
    ```typescript
    const years = query.year.split(',').map((y) => Number(y.trim())).filter((n) => !isNaN(n))
    ```
  - **9.2.** `[If]` `years.length > 0`
    - **9.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((gl) => gl.game.some((g) => g.releaseDateYear.in(years)))
      ```
- **10.** `[Sequence]` Define `itemsQ`
  ```typescript
  let itemsQ = q
  ```
- **11.** `[If]` `query?.sortBy === 'title'`
  - **11.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((gl) => (order === 'asc' ? gl.game.titlePrimary.asc() : gl.game.titlePrimary.desc()))
    ```
- **12.** `[Else]` Otherwise
  - **12.1.** `[If]` `query?.sortBy === 'score'`
    - **12.1.1.** `[Sequence]` Assign `itemsQ`
      ```typescript
      itemsQ = itemsQ.orderBy((gl) => (order === 'asc' ? gl.score.asc() : gl.score.desc()))
      ```
  - **12.2.** `[Else]` Otherwise
    - **12.2.1.** `[If]` `query?.sortBy === 'progress'`
      - **12.2.1.1.** `[Sequence]` Assign `itemsQ`
        ```typescript
        itemsQ = itemsQ.orderBy((gl) => (order === 'asc' ? gl.progress.asc() : gl.progress.desc()))
        ```
    - **12.2.2.** `[Else]` Otherwise
      - **12.2.2.1.** `[If]` `query?.sortBy === 'createdAt'`
        - **12.2.2.1.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((gl) => (order === 'asc' ? gl.createdAt.asc() : gl.createdAt.desc()))
          ```
      - **12.2.2.2.** `[Else]` Otherwise
        - **12.2.2.2.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((gl) => (order === 'asc' ? gl.updatedAt.asc() : gl.updatedAt.desc()))
          ```
- **13.** `[Sequence]` Calls `Promise.all` and stores result as `[total, entries]`
- **14.** `[Return]` 
  ```json
  {
    "success": true,
    "items": "<entries.map((e) => { const { game, ...entryData } = e const formattedMedia = game ? { ...game, genres: (game.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => ({ id: g.genre!.id, name: g.genre!.name })), } ...)>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<Math.ceil(total / limit) || 1>",
      "hasMore": "<page * limit < total>"
    }
  }
  ```

#### `getGameEntry(userId, gameId)` (L2335)

- **1.** `[Sequence]` Database `first` on `GameList` and stores it as `entry`
- **2.** `[If]` `!entry`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "inList": false,
      "entry": null
    }
    ```
- **3.** `[Sequence]` Define `{ game, ...entryData }`, `formattedMedia`
  ```typescript
  const { game, ...entryData } = entry
  const formattedMedia = game ? { ...game, genres: (game.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => ({ id: g.genre!.id, name: g.genre!.name })), } : null
  ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "inList": true,
    "entry": "<formatEntry(entryData)>",
    "media": "<formattedMedia>"
  }
  ```

#### `upsertGameEntry(userId, gameId, body)` (L2382)

- **1.** `[Sequence]` Database `first` on `Game` and stores it as `game`
- **2.** `[If]` `!game`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Game with ID ${gameId} does not exist`
- **3.** `[Sequence]` Database `first` on `GameList` and stores it as `existing`
- **4.** `[Sequence]` Define `progress`, `startedAt`, `completedAt`, `updateData`
  ```typescript
  const progress = body.progress !== undefined ? Number(body.progress) : undefined
  const startedAt = body.startedAt !== undefined ? (body.startedAt ? new Date(body.startedAt) : null) : undefined
  const completedAt = body.completedAt !== undefined ? (body.completedAt ? new Date(body.completedAt) : null) : undefined
  const updateData: any = { ...(body.status ? { status: body.status } : {}), ...(body.priority ? { priority: body.priority } : {}), ...(progress !== undefined ? { progress } : {}), ...(body.score !== undefined ? { score: body.score } : {}), ...(body.notes !== undefined ? { notes: body.notes } : {}), ...(body.replayed !== undefined ? { replayed: Number(body.replayed) } : {}), ...
  ```
- **5.** `[Sequence]` Database `update` on `GameList` and stores it as `entry`
- **6.** `[If]` `!entry`
  - **6.1.** `[Error]` Throws `Error` — 'Failed to update game list entry'
- **7.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **8.** `[Sequence]` Calls `emitListActivity`
- **9.** `[Sequence]` Define `connectionsToSync`
  ```typescript
  const connectionsToSync = body.connections ?? entry.connections
  ```
- **10.** `[If]` `connectionsToSync`
  - **10.1.** `[Sequence]` Calls `ConnectionSyncQueueManager.enqueueSyncJobs({ userId, mediaType: 'GAME', mediaId: gameId, mediaTitle: game.titlePrimary || game.titleSecondary || 'Game', entry: { status: entry.status, ...).catch`
- **11.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Game list entry updated successfully",
    "entry": "<formatEntry(entry)>"
  }
  ```

#### `deleteGameEntry(userId, gameId)` (L2470)

- **1.** `[Sequence]` Database `first` on `GameList` and stores it as `existing`
- **2.** `[If]` `!existing`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Game with ID ${gameId} is not in user list`
- **3.** `[Sequence]` Database `first` on `Game` and stores it as `game`
- **4.** `[Sequence]` Database `delete` on `GameList`
- **5.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **6.** `[If]` `game`
  - **6.1.** `[Sequence]` Calls `emitListActivity`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Game removed from list successfully"
  }
  ```

#### `incrementGame(userId, gameId, body)` (L2502)

- **1.** `[Sequence]` Database `first` on `Game` and stores it as `game`
- **2.** `[If]` `!game`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Game with ID ${gameId} does not exist`
- **3.** `[Sequence]` Database `first` on `GameList` and stores it as `existing`
- **4.** `[Sequence]` Calls `Math.max` and stores result as `count`
- **5.** `[Sequence]` Define `currentProgress`, `newProgress`, `newStatus`
  ```typescript
  const currentProgress = existing?.progress ?? 0
  const newProgress = currentProgress + count
  let newStatus = body?.status ?? existing?.status ?? 'IN_PROGRESS'
  ```
- **6.** `[If]` `newStatus !== 'IN_PROGRESS'`
  - **6.1.** `[Sequence]` Assign `newStatus`
    ```typescript
    newStatus = 'IN_PROGRESS'
    ```
- **7.** `[Sequence]` Database `update` on `GameList` and stores it as `entry`
- **8.** `[If]` `!entry`
  - **8.1.** `[Error]` Throws `Error` — 'Failed to increment game list entry'
- **9.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **10.** `[Sequence]` Calls `emitListActivity`
- **11.** `[Sequence]` Define `connectionsToSync`
  ```typescript
  const connectionsToSync = (body as any)?.connections ?? entry.connections ?? existing?.connections
  ```
- **12.** `[If]` `connectionsToSync`
  - **12.1.** `[Sequence]` Calls `ConnectionSyncQueueManager.enqueueSyncJobs({ userId, mediaType: 'GAME', mediaId: gameId, mediaTitle: game.titlePrimary || game.titleSecondary || 'Game', entry: { status: entry.status, ...).catch`
- **13.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "<`Playtime progress incremented to ${entry.progress} hours`>",
    "entry": "<formatEntry(entry)>"
  }
  ```

#### `getGameStats(userId, query, isOwner = true)` (L2579)

- **1.** `[Sequence]` Database `query` on `GameList` and stores it as `q`
- **2.** `[If]` `!isOwner`
  - **2.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ private: false })
    ```
- **3.** `[Sequence]` Calls `q.select('status', 'progress', 'score', ...).all` and stores result as `items`
- **4.** `[Sequence]` Calls `mediaStatsService.getGameStats` and stores result as `data`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "data": "<data>",
    "stats": "<computeStats(items, 'progress')>"
  }
  ```

#### `getGameFilters(userId)` (L2597)

- **1.** `[Sequence]` Database `all` on `GameList` and stores it as `rawItems`
- **2.** `[Sequence]` Define `items`
  ```typescript
  const items = rawItems.map((item) => ({ status: item.status, priority: item.priority, private: item.private, notes: item.notes, connections: item.connections, game: item.game ...)
  ```
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "...computeFilters(items, 'game', 'releaseDateYear')": "..."
  }
  ```

#### `getBookList(userId, query)` (L2633)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `order`
  ```typescript
  const skip = page - 1 * limit
  const order = query?.order === 'asc' ? 'asc' : 'desc'
  ```
- **4.** `[Sequence]` Database `query` on `BookList` and stores it as `q`
- **5.** `[If]` `query?.status`
  - **5.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ status: query.status.trim().toUpperCase() as any })
    ```
- **6.** `[If]` `query?.q`
  - **6.1.** `[Sequence]` Define `qPattern`
    ```typescript
    const qPattern = `%${query.q.trim()}%`
    ```
  - **6.2.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((bl) => bl.book.some((b) => or(b.titlePrimary.ilike(qPattern), b.titleSecondary.ilike(qPattern))))
    ```
- **7.** `[Sequence]` Define `formatStr`
  ```typescript
  const formatStr = query?.format || query?.mediaFormat
  ```
- **8.** `[If]` `formatStr`
  - **8.1.** `[Sequence]` Define `formats`
    ```typescript
    const formats = formatStr.split(',').map((f) => f.trim()).filter(Boolean)
    ```
  - **8.2.** `[If]` `formats.length > 0`
    - **8.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((bl) => bl.book.some((b) => b.format.in(formats as any)))
      ```
- **9.** `[If]` `query?.mediaStatus`
  - **9.1.** `[Sequence]` Define `statuses`
    ```typescript
    const statuses = query.mediaStatus.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    ```
  - **9.2.** `[If]` `statuses.length > 0`
    - **9.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((bl) => bl.book.some((b) => b.status.in(statuses as any)))
      ```
- **10.** `[If]` `query?.genre`
  - **10.1.** `[Sequence]` Define `genres`
    ```typescript
    const genres = query.genre.split(',').map((g) => g.trim()).filter(Boolean)
    ```
  - **10.2.** `[If]` `genres.length > 0`
    - **10.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((bl) => bl.book.some((b) => b.genres.some((ge) => ge.genre.some((gn) => gn.name.in(genres)))))
      ```
- **11.** `[If]` `query?.year`
  - **11.1.** `[Sequence]` Define `years`
    ```typescript
    const years = query.year.split(',').map((y) => Number(y.trim())).filter((n) => !isNaN(n))
    ```
  - **11.2.** `[If]` `years.length > 0`
    - **11.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((bl) => bl.book.some((b) => b.releaseDateYear.in(years)))
      ```
- **12.** `[Sequence]` Define `itemsQ`
  ```typescript
  let itemsQ = q
  ```
- **13.** `[If]` `query?.sortBy === 'title'`
  - **13.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((bl) => (order === 'asc' ? bl.book.titlePrimary.asc() : bl.book.titlePrimary.desc()))
    ```
- **14.** `[Else]` Otherwise
  - **14.1.** `[If]` `query?.sortBy === 'score'`
    - **14.1.1.** `[Sequence]` Assign `itemsQ`
      ```typescript
      itemsQ = itemsQ.orderBy((bl) => (order === 'asc' ? bl.score.asc() : bl.score.desc()))
      ```
  - **14.2.** `[Else]` Otherwise
    - **14.2.1.** `[If]` `query?.sortBy === 'progress'`
      - **14.2.1.1.** `[Sequence]` Assign `itemsQ`
        ```typescript
        itemsQ = itemsQ.orderBy((bl) => (order === 'asc' ? bl.progressChapters.asc() : bl.progressChapters.desc()))
        ```
    - **14.2.2.** `[Else]` Otherwise
      - **14.2.2.1.** `[If]` `query?.sortBy === 'createdAt'`
        - **14.2.2.1.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((bl) => (order === 'asc' ? bl.createdAt.asc() : bl.createdAt.desc()))
          ```
      - **14.2.2.2.** `[Else]` Otherwise
        - **14.2.2.2.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((bl) => (order === 'asc' ? bl.updatedAt.asc() : bl.updatedAt.desc()))
          ```
- **15.** `[Sequence]` Calls `Promise.all` and stores result as `[total, entries]`
- **16.** `[Return]` 
  ```json
  {
    "success": true,
    "items": "<entries.map((e) => { const { book, ...entryData } = e const formattedMedia = book ? { ...book, genres: (book.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => ({ id: g.genre!.id, name: g.genre!.name })), } ...)>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<Math.ceil(total / limit) || 1>",
      "hasMore": "<page * limit < total>"
    }
  }
  ```

#### `getBookEntry(userId, bookId)` (L2741)

- **1.** `[Sequence]` Database `first` on `BookList` and stores it as `entry`
- **2.** `[If]` `!entry`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "inList": false,
      "entry": null
    }
    ```
- **3.** `[Sequence]` Define `{ book, ...entryData }`, `formattedMedia`
  ```typescript
  const { book, ...entryData } = entry
  const formattedMedia = book ? { ...book, genres: (book.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => ({ id: g.genre!.id, name: g.genre!.name })), } : null
  ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "inList": true,
    "entry": "<formatEntry(entryData)>",
    "media": "<formattedMedia>"
  }
  ```

#### `upsertBookEntry(userId, bookId, body)` (L2790)

- **1.** `[Sequence]` Database `first` on `Book` and stores it as `book`
- **2.** `[If]` `!book`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Book with ID ${bookId} does not exist`
- **3.** `[Sequence]` Database `first` on `BookList` and stores it as `existing`
- **4.** `[Sequence]` Define `progressPages`
  ```typescript
  let progressPages = body.progressPages !== undefined ? Number(body.progressPages) : undefined
  ```
- **5.** `[If]` `progressPages !== undefined && book.pageCount && book.pageCount > 0`
  - **5.1.** `[Sequence]` Assign `progressPages`
    ```typescript
    progressPages = Math.min(progressPages, book.pageCount)
    ```
- **6.** `[Sequence]` Define `progressChapters`, `progressVolumes`, `startedAt`, `completedAt`, `updateData`
  ```typescript
  const progressChapters = body.progressChapters !== undefined ? Number(body.progressChapters) : undefined
  const progressVolumes = body.progressVolumes !== undefined ? Number(body.progressVolumes) : undefined
  const startedAt = body.startedAt !== undefined ? (body.startedAt ? new Date(body.startedAt) : null) : undefined
  const completedAt = body.completedAt !== undefined ? (body.completedAt ? new Date(body.completedAt) : null) : undefined
  const updateData: any = { ...(body.status ? { status: body.status } : {}), ...(body.priority ? { priority: body.priority } : {}), ...(progressPages !== undefined ? { progressPages } : {}), ...(progressChapters !== undefined ? { progressChapters } : {}), ...(progressVolumes !== undefined ? { progressVolumes } : {}), ...(body.score !== undefined ? { score: body.score } : {}), ...
  ```
- **7.** `[Sequence]` Database `update` on `BookList` and stores it as `entry`
- **8.** `[If]` `!entry`
  - **8.1.** `[Error]` Throws `Error` — 'Failed to update book list entry'
- **9.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **10.** `[Sequence]` Calls `emitListActivity`
- **11.** `[Sequence]` Define `connectionsToSync`
  ```typescript
  const connectionsToSync = body.connections ?? entry.connections
  ```
- **12.** `[If]` `connectionsToSync`
  - **12.1.** `[Sequence]` Calls `ConnectionSyncQueueManager.enqueueSyncJobs({ userId, mediaType: 'BOOK', mediaId: bookId, mediaTitle: book.titlePrimary || book.titleSecondary || 'Book', entry: { status: entry.status, ...).catch`
- **13.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Book list entry updated successfully",
    "entry": "<formatEntry(entry)>"
  }
  ```

#### `deleteBookEntry(userId, bookId)` (L2888)

- **1.** `[Sequence]` Database `first` on `BookList` and stores it as `existing`
- **2.** `[If]` `!existing`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Book with ID ${bookId} is not in user list`
- **3.** `[Sequence]` Database `first` on `Book` and stores it as `book`
- **4.** `[Sequence]` Database `delete` on `BookList`
- **5.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **6.** `[Sequence]` Calls `emitListActivity`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Book removed from list successfully"
  }
  ```

#### `incrementBook(userId, bookId, body)` (L2917)

- **1.** `[Sequence]` Database `first` on `Book` and stores it as `book`
- **2.** `[If]` `!book`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Book with ID ${bookId} does not exist`
- **3.** `[Sequence]` Database `first` on `BookList` and stores it as `existing`
- **4.** `[Sequence]` Calls `Math.max` and stores result as `count`
- **5.** `[Sequence]` Define `type`, `progressPages`, `progressChapters`, `progressVolumes`, `newStatus`, `completedAt`
  ```typescript
  const type = body?.type ?? 'chapter'
  let progressPages = existing?.progressPages ?? 0
  let progressChapters = existing?.progressChapters ?? 0
  let progressVolumes = existing?.progressVolumes ?? 0
  let newStatus = body?.status ?? existing?.status ?? 'IN_PROGRESS'
  let completedAt = existing?.completedAt ?? null
  ```
- **6.** `[If]` `newStatus !== 'IN_PROGRESS'`
  - **6.1.** `[Sequence]` Assign `newStatus`
    ```typescript
    newStatus = 'IN_PROGRESS'
    ```
- **7.** `[If]` `type === 'chapter'`
  - **7.1.** `[Sequence]` Assign `progressChapters`
    ```typescript
    progressChapters += count
    ```
  - **7.2.** `[If]` `book.chapterCount && book.chapterCount > 0 && progressChapters >= book.chapterCount`
    - **7.2.1.** `[Sequence]` Assign `progressChapters`
      ```typescript
      progressChapters = book.chapterCount
      ```
    - **7.2.2.** `[Sequence]` Assign `newStatus`
      ```typescript
      newStatus = 'COMPLETED'
      ```
    - **7.2.3.** `[If]` `!completedAt`
      - **7.2.3.1.** `[Sequence]` Assign `completedAt`
        ```typescript
        completedAt = new Date()
        ```
  - **7.3.** `[Else]` Otherwise
    - **7.3.1.** `[Sequence]` Assign `completedAt`
      ```typescript
      completedAt = null
      ```
- **8.** `[Else]` Otherwise
  - **8.1.** `[If]` `type === 'volume'`
    - **8.1.1.** `[Sequence]` Assign `progressVolumes`
      ```typescript
      progressVolumes += count
      ```
    - **8.1.2.** `[If]` `book.volumeCount && book.volumeCount > 0 && progressVolumes >= book.volumeCount`
      - **8.1.2.1.** `[Sequence]` Assign `progressVolumes`
        ```typescript
        progressVolumes = book.volumeCount
        ```
      - **8.1.2.2.** `[Sequence]` Assign `newStatus`
        ```typescript
        newStatus = 'COMPLETED'
        ```
      - **8.1.2.3.** `[If]` `!completedAt`
        - **8.1.2.3.1.** `[Sequence]` Assign `completedAt`
          ```typescript
          completedAt = new Date()
          ```
    - **8.1.3.** `[Else]` Otherwise
      - **8.1.3.1.** `[Sequence]` Assign `completedAt`
        ```typescript
        completedAt = null
        ```
  - **8.2.** `[Else]` Otherwise
    - **8.2.1.** `[Sequence]` Assign `progressPages`
      ```typescript
      progressPages += count
      ```
    - **8.2.2.** `[If]` `book.pageCount && book.pageCount > 0 && progressPages >= book.pageCount`
      - **8.2.2.1.** `[Sequence]` Assign `progressPages`
        ```typescript
        progressPages = book.pageCount
        ```
      - **8.2.2.2.** `[Sequence]` Assign `newStatus`
        ```typescript
        newStatus = 'COMPLETED'
        ```
      - **8.2.2.3.** `[If]` `!completedAt`
        - **8.2.2.3.1.** `[Sequence]` Assign `completedAt`
          ```typescript
          completedAt = new Date()
          ```
    - **8.2.3.** `[Else]` Otherwise
      - **8.2.3.1.** `[Sequence]` Assign `completedAt`
        ```typescript
        completedAt = null
        ```
- **9.** `[Sequence]` Database `update` on `BookList` and stores it as `entry`
- **10.** `[If]` `!entry`
  - **10.1.** `[Error]` Throws `Error` — 'Failed to increment book list entry'
- **11.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **12.** `[Sequence]` Calls `emitListActivity`
- **13.** `[Sequence]` Define `connectionsToSync`
  ```typescript
  const connectionsToSync = (body as any)?.connections ?? entry.connections ?? existing?.connections
  ```
- **14.** `[If]` `connectionsToSync`
  - **14.1.** `[Sequence]` Calls `ConnectionSyncQueueManager.enqueueSyncJobs({ userId, mediaType: 'BOOK', mediaId: bookId, mediaTitle: book.titlePrimary || book.titleSecondary || 'Book', entry: { status: entry.status, ...).catch`
- **15.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "<`Progress incremented to ${type === 'chapter' ? `${progressChapters} chapters` : type === 'volume' ? `${progressVolumes} volumes` : `${progressPages} pages`}`>",
    "entry": "<formatEntry(entry)>"
  }
  ```

#### `getBookStats(userId, query, isOwner = true)` (L3047)

- **1.** `[Sequence]` Database `query` on `BookList` and stores it as `q`
- **2.** `[If]` `!isOwner`
  - **2.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ private: false })
    ```
- **3.** `[Sequence]` Calls `q.select('status', 'progressPages', 'progressChapters', ...).all` and stores result as `items`
- **4.** `[Sequence]` Calls `mediaStatsService.getBookStats` and stores result as `data`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "data": "<data>",
    "stats": "<computeStats(items, 'progressChapters')>"
  }
  ```

#### `getBookFilters(userId)` (L3065)

- **1.** `[Sequence]` Database `all` on `BookList` and stores it as `rawItems`
- **2.** `[Sequence]` Define `items`
  ```typescript
  const items = rawItems.map((item) => ({ status: item.status, priority: item.priority, private: item.private, notes: item.notes, connections: item.connections, book: item.book ...)
  ```
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "...computeFilters(items, 'book', 'releaseDateYear')": "..."
  }
  ```

#### `getMusicList(userId, query)` (L3101)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `order`
  ```typescript
  const skip = page - 1 * limit
  const order = query?.order === 'asc' ? 'asc' : 'desc'
  ```
- **4.** `[Sequence]` Database `query` on `MusicList` and stores it as `q`
- **5.** `[If]` `query?.status`
  - **5.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ status: query.status.trim().toUpperCase() as any })
    ```
- **6.** `[If]` `query?.q`
  - **6.1.** `[Sequence]` Define `qPattern`
    ```typescript
    const qPattern = `%${query.q.trim()}%`
    ```
  - **6.2.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((ml) => ml.music.some((m) => or(m.titlePrimary.ilike(qPattern), m.titleSecondary.ilike(qPattern), m.artistName.ilike(qPattern))))
    ```
- **7.** `[Sequence]` Define `formatStr`
  ```typescript
  const formatStr = query?.format || query?.mediaFormat
  ```
- **8.** `[If]` `formatStr`
  - **8.1.** `[Sequence]` Define `formats`
    ```typescript
    const formats = formatStr.split(',').map((f) => f.trim().toUpperCase()).filter(Boolean)
    ```
  - **8.2.** `[If]` `formats.length > 0`
    - **8.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((ml) => ml.music.some((m) => m.type.in(formats as any)))
      ```
- **9.** `[If]` `query?.mediaStatus`
  - **9.1.** `[Sequence]` Define `statuses`
    ```typescript
    const statuses = query.mediaStatus.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    ```
  - **9.2.** `[If]` `statuses.length > 0`
    - **9.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((ml) => ml.music.some((m) => m.status.in(statuses as any)))
      ```
- **10.** `[If]` `query?.genre`
  - **10.1.** `[Sequence]` Define `genres`
    ```typescript
    const genres = query.genre.split(',').map((g) => g.trim()).filter(Boolean)
    ```
  - **10.2.** `[If]` `genres.length > 0`
    - **10.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((ml) => ml.music.some((m) => m.genres.some((ge) => ge.genre.some((gn) => gn.name.in(genres)))))
      ```
- **11.** `[If]` `query?.year`
  - **11.1.** `[Sequence]` Define `years`
    ```typescript
    const years = query.year.split(',').map((y) => Number(y.trim())).filter((n) => !isNaN(n))
    ```
  - **11.2.** `[If]` `years.length > 0`
    - **11.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((ml) => ml.music.some((m) => m.releaseDateYear.in(years)))
      ```
- **12.** `[Sequence]` Define `itemsQ`
  ```typescript
  let itemsQ = q
  ```
- **13.** `[If]` `query?.sortBy === 'title'`
  - **13.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((ml) => (order === 'asc' ? ml.music.titlePrimary.asc() : ml.music.titlePrimary.desc()))
    ```
- **14.** `[Else]` Otherwise
  - **14.1.** `[If]` `query?.sortBy === 'score'`
    - **14.1.1.** `[Sequence]` Assign `itemsQ`
      ```typescript
      itemsQ = itemsQ.orderBy((ml) => (order === 'asc' ? ml.score.asc() : ml.score.desc()))
      ```
  - **14.2.** `[Else]` Otherwise
    - **14.2.1.** `[If]` `query?.sortBy === 'progress' || query?.sortBy === 'playCount'`
      - **14.2.1.1.** `[Sequence]` Assign `itemsQ`
        ```typescript
        itemsQ = itemsQ.orderBy((ml) => (order === 'asc' ? ml.playCount.asc() : ml.playCount.desc()))
        ```
    - **14.2.2.** `[Else]` Otherwise
      - **14.2.2.1.** `[If]` `query?.sortBy === 'createdAt'`
        - **14.2.2.1.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((ml) => (order === 'asc' ? ml.createdAt.asc() : ml.createdAt.desc()))
          ```
      - **14.2.2.2.** `[Else]` Otherwise
        - **14.2.2.2.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((ml) => (order === 'asc' ? ml.updatedAt.asc() : ml.updatedAt.desc()))
          ```
- **15.** `[Sequence]` Calls `Promise.all` and stores result as `[total, entries]`
- **16.** `[Return]` 
  ```json
  {
    "success": true,
    "items": "<entries.map((e) => { const { music, ...entryData } = e const formattedMedia = music ? { ...music, genres: (music.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => ({ id: g.genre!.id, name: g.genre!.name })), } ...)>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<Math.ceil(total / limit) || 1>",
      "hasMore": "<page * limit < total>"
    }
  }
  ```

#### `getMusicEntry(userId, musicId)` (L3206)

- **1.** `[Sequence]` Database `first` on `MusicList` and stores it as `entry`
- **2.** `[If]` `!entry`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "inList": false,
      "entry": null
    }
    ```
- **3.** `[Sequence]` Define `{ music, ...entryData }`, `formattedMedia`
  ```typescript
  const { music, ...entryData } = entry
  const formattedMedia = music ? { ...music, genres: (music.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => ({ id: g.genre!.id, name: g.genre!.name })), } : null
  ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "inList": true,
    "entry": "<formatEntry(entryData)>",
    "media": "<formattedMedia>"
  }
  ```

#### `upsertMusicEntry(userId, musicId, body)` (L3252)

- **1.** `[Sequence]` Database `first` on `Music` and stores it as `music`
- **2.** `[If]` `!music`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Music with ID ${musicId} does not exist`
- **3.** `[Sequence]` Database `first` on `MusicList` and stores it as `existing`
- **4.** `[Sequence]` Define `startedAt`, `completedAt`, `updateData`
  ```typescript
  const startedAt = body.startedAt !== undefined ? (body.startedAt ? new Date(body.startedAt) : null) : undefined
  const completedAt = body.completedAt !== undefined ? (body.completedAt ? new Date(body.completedAt) : null) : undefined
  const updateData: any = { ...(body.status ? { status: body.status } : {}), ...(body.priority ? { priority: body.priority } : {}), ...(body.score !== undefined ? { score: body.score } : {}), ...(body.playCount !== undefined ? { playCount: Number(body.playCount) } : {}), ...(body.notes !== undefined ? { notes: body.notes } : {}), ...(body.private !== undefined ? { private: Boolean(body.private) } : {}), ...
  ```
- **5.** `[Sequence]` Database `update` on `MusicList` and stores it as `entry`
- **6.** `[If]` `!entry`
  - **6.1.** `[Error]` Throws `Error` — 'Failed to update music list entry'
- **7.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **8.** `[Sequence]` Calls `emitListActivity`
- **9.** `[Sequence]` Define `connectionsToSync`
  ```typescript
  const connectionsToSync = body.connections ?? entry.connections
  ```
- **10.** `[If]` `connectionsToSync`
  - **10.1.** `[Sequence]` Calls `ConnectionSyncQueueManager.enqueueSyncJobs({ userId, mediaType: 'MUSIC', mediaId: musicId, mediaTitle: music.titlePrimary || music.titleSecondary || 'Music', entry: { status: entry.status, ...).catch`
- **11.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Music list entry updated successfully",
    "entry": "<formatEntry(entry)>"
  }
  ```

#### `deleteMusicEntry(userId, musicId)` (L3343)

- **1.** `[Sequence]` Database `first` on `MusicList` and stores it as `existing`
- **2.** `[If]` `!existing`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Music with ID ${musicId} is not in user list`
- **3.** `[Sequence]` Database `first` on `Music` and stores it as `music`
- **4.** `[Sequence]` Database `delete` on `MusicList`
- **5.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **6.** `[Sequence]` Calls `emitListActivity`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Music removed from list successfully"
  }
  ```

#### `incrementMusic(userId, musicId, body)` (L3378)

- **1.** `[Sequence]` Database `first` on `Music` and stores it as `music`
- **2.** `[If]` `!music`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Music with ID ${musicId} does not exist`
- **3.** `[Sequence]` Database `first` on `MusicList` and stores it as `existing`
- **4.** `[Sequence]` Calls `Math.max` and stores result as `count`
- **5.** `[Sequence]` Define `newPlayCount`, `newStatus`
  ```typescript
  const newPlayCount = existing?.playCount ?? 0 + count
  let newStatus = existing?.status ?? 'IN_PROGRESS'
  ```
- **6.** `[If]` `newStatus !== 'IN_PROGRESS'`
  - **6.1.** `[Sequence]` Assign `newStatus`
    ```typescript
    newStatus = 'IN_PROGRESS'
    ```
- **7.** `[Sequence]` Database `update` on `MusicList` and stores it as `entry`
- **8.** `[If]` `!entry`
  - **8.1.** `[Error]` Throws `Error` — 'Failed to increment music list entry'
- **9.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **10.** `[Sequence]` Calls `emitListActivity`
- **11.** `[Sequence]` Define `connectionsToSync`
  ```typescript
  const connectionsToSync = (body as any)?.connections ?? entry.connections ?? existing?.connections
  ```
- **12.** `[If]` `connectionsToSync`
  - **12.1.** `[Sequence]` Calls `ConnectionSyncQueueManager.enqueueSyncJobs({ userId, mediaType: 'MUSIC', mediaId: musicId, mediaTitle: music.titlePrimary || music.titleSecondary || 'Music', entry: { status: entry.status, ...).catch`
- **13.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "<`Listen count incremented to ${entry.playCount}`>",
    "entry": "<formatEntry(entry)>"
  }
  ```

#### `getMusicStats(userId, query, isOwner = true)` (L3461)

- **1.** `[Sequence]` Database `query` on `MusicList` and stores it as `q`
- **2.** `[If]` `!isOwner`
  - **2.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ private: false })
    ```
- **3.** `[Sequence]` Calls `q.select('status', 'playCount', 'score').all` and stores result as `items`
- **4.** `[Sequence]` Calls `mediaStatsService.getMusicStats` and stores result as `data`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "data": "<data>",
    "stats": "<computeStats(items, 'playCount')>"
  }
  ```

#### `getMusicFilters(userId)` (L3479)

- **1.** `[Sequence]` Database `all` on `MusicList` and stores it as `rawItems`
- **2.** `[Sequence]` Define `items`
  ```typescript
  const items = rawItems.map((item) => ({ status: item.status, priority: item.priority, private: item.private, notes: item.notes, connections: item.connections, music: item.music ...)
  ```
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "...computeFilters(items, 'music', 'releaseDateYear')": "..."
  }
  ```

#### `getOtherList(userId, query)` (L3517)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`
  ```typescript
  const skip = page - 1 * limit
  ```
- **4.** `[Sequence]` Database `query` on `OtherList` and stores it as `q`
- **5.** `[If]` `query?.status && query.status !== 'ALL'`
  - **5.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ status: query.status as ListStatus })
    ```
- **6.** `[If]` `query?.q`
  - **6.1.** `[Sequence]` Define `qPattern`
    ```typescript
    const qPattern = `%${query.q.trim()}%`
    ```
  - **6.2.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((ol) => ol.other.some((o) => o.titlePrimary.ilike(qPattern)))
    ```
- **7.** `[Sequence]` Define `formatStr`
  ```typescript
  const formatStr = query?.format || query?.mediaFormat
  ```
- **8.** `[If]` `formatStr`
  - **8.1.** `[Sequence]` Define `formats`
    ```typescript
    const formats = formatStr.split(',').map((f) => f.trim().toLowerCase()).filter(Boolean)
    ```
  - **8.2.** `[If]` `formats.length > 0`
    - **8.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((ol) => ol.other.some((o) => o.format.in(formats as any)))
      ```
- **9.** `[If]` `query?.year`
  - **9.1.** `[Sequence]` Define `years`
    ```typescript
    const years = query.year.split(',').map((y) => Number(y.trim())).filter((n) => !isNaN(n))
    ```
  - **9.2.** `[If]` `years.length > 0`
    - **9.2.1.** `[Sequence]` Assign `q`
      ```typescript
      q = q.where((ol) => ol.other.some((o) => or( ...years.map((y) => and(o.startDate.gte(new Date(y, 0, 1)), o.startDate.lte(new Date(y, 11, 31, 23, 59, 59, 999))) ) ) ...
      ```
- **10.** `[Sequence]` Define `itemsQ`, `sortField`, `sortOrder`
  ```typescript
  let itemsQ = q
  const sortField = query?.sortBy ?? 'updatedAt'
  const sortOrder = query?.order ?? 'desc'
  ```
- **11.** `[If]` `sortField === 'score'`
  - **11.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((ol) => (sortOrder === 'asc' ? ol.score.asc() : ol.score.desc()))
    ```
- **12.** `[Else]` Otherwise
  - **12.1.** `[If]` `sortField === 'createdAt'`
    - **12.1.1.** `[Sequence]` Assign `itemsQ`
      ```typescript
      itemsQ = itemsQ.orderBy((ol) => (sortOrder === 'asc' ? ol.createdAt.asc() : ol.createdAt.desc()))
      ```
  - **12.2.** `[Else]` Otherwise
    - **12.2.1.** `[If]` `sortField === 'title'`
      - **12.2.1.1.** `[Sequence]` Assign `itemsQ`
        ```typescript
        itemsQ = itemsQ.orderBy((ol) => (sortOrder === 'asc' ? ol.other.titlePrimary.asc() : ol.other.titlePrimary.desc()))
        ```
    - **12.2.2.** `[Else]` Otherwise
      - **12.2.2.1.** `[Sequence]` Assign `itemsQ`
        ```typescript
        itemsQ = itemsQ.orderBy((ol) => (sortOrder === 'asc' ? ol.updatedAt.asc() : ol.updatedAt.desc()))
        ```
- **13.** `[Sequence]` Calls `Promise.all` and stores result as `[total, entries]`
- **14.** `[Sequence]` Define `totalPages`, `items`
  ```typescript
  const totalPages = Math.ceil(total / limit) || 1
  const items = entries.map((e) => { const incKey = e.other?.incrementFieldKey const prog = incKey && (e.progressValues as any)?.[incKey] !== undefined ? Number((e.progressValues as any)[incKey]) : 0 return { ...)
  ```
- **15.** `[Return]` 
  ```json
  {
    "success": true,
    "items": "<items>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<totalPages>",
      "hasMore": "<page < totalPages>"
    }
  }
  ```

#### `getOtherEntry(userId, otherId)` (L3603)

- **1.** `[Sequence]` Database `first` on `OtherList` and stores it as `existing`
- **2.** `[If]` `existing`
  - **2.1.** `[Sequence]` Define `incKey`, `prog`
    ```typescript
    const incKey = existing.other?.incrementFieldKey
    const prog = incKey && (existing.progressValues as any)?.[incKey] !== undefined ? Number((existing.progressValues as any)[incKey]) : 0
    ```
  - **2.2.** `[Return]` 
    ```json
    {
      "success": true,
      "inList": true,
      "entry": {
        "...existing": "...",
        "progress": "<prog>"
      },
      "media": "<existing.other>"
    }
    ```
- **3.** `[Sequence]` Database `first` on `Other` and stores it as `item`
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "inList": false,
    "entry": null,
    "media": "<item>"
  }
  ```

#### `upsertOtherEntry(userId, otherId, body)` (L3635)

- **1.** `[Sequence]` Database `first` on `Other` and stores it as `item`
- **2.** `[If]` `!item`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Custom item with ID ${otherId} does not exist`
- **3.** `[Sequence]` Database `first` on `OtherList` and stores it as `existing`
- **4.** `[Sequence]` Define `status`, `incKey`, `progressValues`
  ```typescript
  const status = body?.status ?? existing?.status ?? 'PLANNED'
  const incKey = item.incrementFieldKey || 'progress'
  let progressValues: any = body?.progressValues !== undefined ? body.progressValues : (existing?.progressValues as any) || {}
  ```
- **5.** `[If]` `body?.progress !== undefined`
  - **5.1.** `[Sequence]` Assign `progressValues`
    ```typescript
    progressValues = { ...progressValues, [incKey]: Number(body.progress), }
    ```
- **6.** `[Sequence]` Define `startedAt`, `completedAt`
  ```typescript
  const startedAt = body?.startedAt !== undefined ? body.startedAt ? new Date(body.startedAt) : null : status === 'IN_PROGRESS' && !existing?.startedAt ? new Date() : existing?.startedAt ?? null
  const completedAt = body?.completedAt !== undefined ? body.completedAt ? new Date(body.completedAt) : null : status === 'COMPLETED' && !existing?.completedAt ? new Date() : existing?.completedAt ?? null
  ```
- **7.** `[Sequence]` Database `update` on `OtherList` and stores it as `entry`
- **8.** `[If]` `!entry`
  - **8.1.** `[Error]` Throws `Error` — 'Failed to update other list entry'
- **9.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **10.** `[Sequence]` Define `prog`
  ```typescript
  const prog = (entry.progressValues as any)?.[incKey] ?? 0
  ```
- **11.** `[Sequence]` Calls `item.progressFields as any[] || [].find` and stores result as `incFieldSpec`
- **12.** `[Sequence]` Calls `emitListActivity`
- **13.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Other list entry updated successfully",
    "entry": {
      "...entry": "...",
      "progress": "<Number(prog)>"
    }
  }
  ```

#### `deleteOtherEntry(userId, otherId)` (L3745)

- **1.** `[Sequence]` Database `first` on `OtherList` and stores it as `existing`
- **2.** `[Sequence]` Database `deleteAll` on `OtherList`
- **3.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **4.** `[If]` `existing`
  - **4.1.** `[Sequence]` Define `incKey`
    ```typescript
    const incKey = existing.other?.incrementFieldKey || 'progress'
    ```
  - **4.2.** `[Sequence]` Calls `emitListActivity`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Item removed from other list successfully"
  }
  ```

#### `incrementOther(userId, otherId, body)` (L3781)

- **1.** `[Sequence]` Database `first` on `Other` and stores it as `item`
- **2.** `[If]` `!item`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Custom item with ID ${otherId} does not exist`
- **3.** `[Sequence]` Database `first` on `OtherList` and stores it as `existing`
- **4.** `[Sequence]` Define `incKey`
  ```typescript
  const incKey = item.incrementFieldKey || (item.progressFields as any[])?.[0]?.key || 'progress'
  ```
- **5.** `[Sequence]` Calls `item.progressFields as any[] || [].find` and stores result as `fieldSpec`
- **6.** `[Sequence]` Define `maxVal`
  ```typescript
  const maxVal = fieldSpec?.max ?? null
  ```
- **7.** `[Sequence]` Calls `Math.max` and stores result as `count`
- **8.** `[Sequence]` Define `currentProgValues`
  ```typescript
  const currentProgValues = existing?.progressValues as Record<string, number> || {}
  ```
- **9.** `[Sequence]` Calls `Number` and stores result as `currentVal`
- **10.** `[Sequence]` Define `newVal`, `newStatus`, `completedAt`
  ```typescript
  let newVal = currentVal + count
  let newStatus = (body?.status ?? existing?.status ?? 'IN_PROGRESS') as ListStatus
  let completedAt = existing?.completedAt ?? null
  ```
- **11.** `[If]` `newStatus !== 'IN_PROGRESS'`
  - **11.1.** `[Sequence]` Assign `newStatus`
    ```typescript
    newStatus = 'IN_PROGRESS'
    ```
- **12.** `[If]` `maxVal && maxVal > 0 && newVal >= maxVal`
  - **12.1.** `[Sequence]` Assign `newVal`
    ```typescript
    newVal = maxVal
    ```
  - **12.2.** `[Sequence]` Assign `newStatus`
    ```typescript
    newStatus = 'COMPLETED'
    ```
  - **12.3.** `[If]` `!completedAt`
    - **12.3.1.** `[Sequence]` Assign `completedAt`
      ```typescript
      completedAt = new Date()
      ```
- **13.** `[Else]` Otherwise
  - **13.1.** `[Sequence]` Assign `completedAt`
    ```typescript
    completedAt = null
    ```
- **14.** `[Sequence]` Define `updatedProgValues`
  ```typescript
  const updatedProgValues = { ...currentProgValues, [incKey]: newVal, }
  ```
- **15.** `[Sequence]` Database `update` on `OtherList` and stores it as `entry`
- **16.** `[If]` `!entry`
  - **16.1.** `[Error]` Throws `Error` — 'Failed to increment other list entry'
- **17.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
- **18.** `[Sequence]` Calls `emitListActivity`
- **19.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "<`Custom progress incremented by ${count}`>",
    "entry": {
      "...entry": "...",
      "progress": "<newVal>"
    }
  }
  ```

#### `getOtherStats(userId)` (L3882)

- **1.** `[Sequence]` Database `all` on `OtherList` and stores it as `entries`
- **2.** `[Sequence]` Define `total`, `statusCounts`, `totalScore`, `scoredCount`, `totalProgress`, `scoreBuckets`
  ```typescript
  const total = entries.length
  const statusCounts: Record<string, number> = {}
  let totalScore = 0
  let scoredCount = 0
  let totalProgress = 0
  const scoreBuckets: Record<number, number> = {}
  ```
- **3.** `[Loop]` Loop `i <= 10`
  - **3.1.** `[Sequence]` Assign `scoreBuckets[i]`
    ```typescript
    scoreBuckets[i] = 0
    ```
- **4.** `[Loop]` Iterate `const e` over `entries`
  - **4.1.** `[If]` `e.status`
    - **4.1.1.** `[Sequence]` Assign `statusCounts[e.status]`
      ```typescript
      statusCounts[e.status] = (statusCounts[e.status] || 0) + 1
      ```
  - **4.2.** `[If]` `e.score !== null && e.score !== undefined && e.score > 0`
    - **4.2.1.** `[Sequence]` Assign `totalScore`
      ```typescript
      totalScore += e.score
      ```
    - **4.2.2.** `[Sequence]` Calls `Math.min` and stores result as `rounded`
    - **4.2.3.** `[Sequence]` Assign `scoreBuckets[rounded]`
      ```typescript
      scoreBuckets[rounded] = (scoreBuckets[rounded] || 0) + 1
      ```
  - **4.3.** `[Sequence]` Define `incKey`, `val`
    ```typescript
    const incKey = e.other?.incrementFieldKey
    const val = incKey && (e.progressValues as any)?.[incKey] ? Number((e.progressValues as any)[incKey]) : 0
    ```
  - **4.4.** `[Sequence]` Assign `totalProgress`
    ```typescript
    totalProgress += val
    ```
- **5.** `[Sequence]` Define `meanScore`, `scoreDistribution`
  ```typescript
  const meanScore = scoredCount > 0 ? Number((totalScore / scoredCount).toFixed(2)) : 0
  const scoreDistribution = Object.entries(scoreBuckets).map(([score, count]) => ({ score: Number(score), count, }))
  ```
- **6.** `[Return]` 
  ```json
  {
    "success": true,
    "stats": {
      "total": "<total>",
      "statusCounts": "<statusCounts>",
      "meanScore": "<meanScore>",
      "totalProgress": "<totalProgress>",
      "scoreDistribution": "<scoreDistribution>"
    }
  }
  ```

#### `getOtherFilters(userId)` (L3935)

- **1.** `[Sequence]` Database `all` on `OtherList` and stores it as `entries`
- **2.** `[Sequence]` Define `statusCounts`, `formatCounts`, `yearCounts`, `priorityCounts`, `publicCount`, `privateCount`, `withNotesCount`, `withoutNotesCount`
  ```typescript
  const statusCounts: Record<string, number> = {}
  const formatCounts: Record<string, number> = {}
  const yearCounts: Record<number, number> = {}
  const priorityCounts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, ULTRA: 0 }
  let publicCount = 0
  let privateCount = 0
  let withNotesCount = 0
  let withoutNotesCount = 0
  ```
- **3.** `[Loop]` Iterate `const item` over `entries`
  - **3.1.** `[If]` `item.status`
    - **3.1.1.** `[Sequence]` Assign `statusCounts[item.status]`
      ```typescript
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1
      ```
  - **3.2.** `[Sequence]` Define `prio`
    ```typescript
    const prio = item.priority || 'LOW'.toUpperCase()
    ```
  - **3.3.** `[Sequence]` Assign `priorityCounts[prio]`
    ```typescript
    priorityCounts[prio] = (priorityCounts[prio] || 0) + 1
    ```
  - **3.4.** `[If]` `item.private`
  - **3.5.** `[Else]` Otherwise
  - **3.6.** `[If]` `item.notes && item.notes.trim()`
  - **3.7.** `[Else]` Otherwise
  - **3.8.** `[If]` `item.other?.format`
    - **3.8.1.** `[Sequence]` Define `fmt`
      ```typescript
      const fmt = item.other.format.trim().toLowerCase()
      ```
    - **3.8.2.** `[Sequence]` Assign `formatCounts[fmt]`
      ```typescript
      formatCounts[fmt] = (formatCounts[fmt] || 0) + 1
      ```
  - **3.9.** `[If]` `item.other?.startDate`
    - **3.9.1.** `[Sequence]` Calls `new Date(item.other.startDate).getFullYear` and stores result as `yr`
    - **3.9.2.** `[If]` `!isNaN(yr)`
      - **3.9.2.1.** `[Sequence]` Assign `yearCounts[yr]`
        ```typescript
        yearCounts[yr] = (yearCounts[yr] || 0) + 1
        ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "statuses": "<Object.entries(statusCounts).map(([value, count]) => ({ value, count }))>",
    "formats": "<Object.entries(formatCounts).map(([value, count]) => ({ value, count }))>",
    "genres": [],
    "years": "<Object.entries(yearCounts).map(([value, count]) => ({ value: Number(value), count, }))>",
    "priorities": "<Object.entries(priorityCounts).map(([value, count]) => ({ value, count }))>",
    "connections": [],
    "companies": [],
    "seasons": [],
    "countries": [],
    "privacyCounts": {
      "public": "<publicCount>",
      "private": "<privateCount>"
    },
    "notesCounts": {
      "withNotes": "<withNotesCount>",
      "withoutNotes": "<withoutNotesCount>"
    },
    "adultCounts": {
      "sfw": "<entries.length>",
      "nsfw": 0
    }
  }
  ```

#### `exportUserLists(userId, query)` (L4001)

- **1.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **2.** `[If]` `!user`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User not found'
- **3.** `[Sequence]` Define `requestedTypes`, `exportData`
  ```typescript
  const requestedTypes = query?.types ? query.types .split(',') .map((s) => s.trim().toLowerCase()) .filter(Boolean) : [ 'anime', ...
  const exportData: any = { success: true, version: '1.0', exportedAt: new Date().toISOString(), source: 'IRIS', username: user.username, lists: {}, ...
  ```
- **4.** `[If]` `requestedTypes.includes('anime')`
  - **4.1.** `[Sequence]` Database `all` on `AnimeList` and stores it as `items`
  - **4.2.** `[Sequence]` Assign `exportData.lists.anime`
    ```typescript
    exportData.lists.anime = items.map((item: any) => ({ externalIds: { anilistId: item.anime?.anilistId, malId: item.anime?.malId, aniDBId: item.anime?.aniDBId, tvDBId: item.anime?.tvDBId, bangumiId: item.anime?.bangumiId, ...
    ```
- **5.** `[If]` `requestedTypes.includes('manga')`
  - **5.1.** `[Sequence]` Database `all` on `MangaList` and stores it as `items`
  - **5.2.** `[Sequence]` Assign `exportData.lists.manga`
    ```typescript
    exportData.lists.manga = items.map((item: any) => ({ externalIds: { anilistId: item.manga?.anilistId, malId: item.manga?.malId, mangaUpdatesId: item.manga?.mangaUpdatesId, bangumiId: item.manga?.bangumiId, kitsuId: item.manga?.kitsuId, ...
    ```
- **6.** `[If]` `requestedTypes.includes('tv')`
  - **6.1.** `[Sequence]` Database `all` on `TvList` and stores it as `items`
  - **6.2.** `[Sequence]` Assign `exportData.lists.tv`
    ```typescript
    exportData.lists.tv = items.map((item: any) => ({ externalIds: { tvDBId: item.tv?.tvDBId, tmdbId: item.tv?.tmdbId, imdbId: item.tv?.imdbId, simklId: item.tv?.simklId, tvmazeId: item.tv?.tvmazeId, ...
    ```
- **7.** `[If]` `requestedTypes.includes('movie')`
  - **7.1.** `[Sequence]` Database `all` on `MovieList` and stores it as `items`
  - **7.2.** `[Sequence]` Assign `exportData.lists.movie`
    ```typescript
    exportData.lists.movie = items.map((item: any) => ({ externalIds: { tvDBId: item.movie?.tvDBId, tmdbId: item.movie?.tmdbId, imdbId: item.movie?.imdbId, simklId: item.movie?.simklId, }, ...
    ```
- **8.** `[If]` `requestedTypes.includes('game')`
  - **8.1.** `[Sequence]` Database `all` on `GameList` and stores it as `items`
  - **8.2.** `[Sequence]` Assign `exportData.lists.game`
    ```typescript
    exportData.lists.game = items.map((item: any) => ({ externalIds: { igdbId: item.game?.igdbId, steamAppId: item.game?.steamAppId, rawgId: item.game?.rawgId, giantbombId: item.game?.giantbombId, vndbId: item.game?.vndbId, ...
    ```
- **9.** `[If]` `requestedTypes.includes('book')`
  - **9.1.** `[Sequence]` Database `all` on `BookList` and stores it as `items`
  - **9.2.** `[Sequence]` Assign `exportData.lists.book`
    ```typescript
    exportData.lists.book = items.map((item: any) => ({ externalIds: { googleBookId: item.book?.googleBookId, isbn10: item.book?.isbn10, isbn13: item.book?.isbn13, openLibraryId: item.book?.openLibraryId, }, ...
    ```
- **10.** `[If]` `requestedTypes.includes('music')`
  - **10.1.** `[Sequence]` Database `all` on `MusicList` and stores it as `items`
  - **10.2.** `[Sequence]` Assign `exportData.lists.music`
    ```typescript
    exportData.lists.music = items.map((item: any) => ({ externalIds: { deezerId: item.music?.deezerId, isrc: item.music?.isrc, upc: item.music?.upc, deezerArtistId: item.music?.deezerArtistId, }, ...
    ```
- **11.** `[If]` `requestedTypes.includes('custom_lists') || requestedTypes.includes('customlists')`
  - **11.1.** `[Sequence]` Database `all` on `CustomList` and stores it as `customLists`
  - **11.2.** `[Sequence]` Assign `exportData.lists.customLists`
    ```typescript
    exportData.lists.customLists = customLists.map((list: any) => ({ id: list.id, name: list.name, description: list.description, isPrivate: list.isPrivate, coverImage: list.coverImage, order: list.order, ...
    ```
- **12.** `[Return]`  — `exportData`

#### `importUserLists(userId, body)` (L4296)

- **1.** `[Sequence]` Define `items`
  ```typescript
  let items: any[] = []
  ```
- **2.** `[If]` `Array.isArray(body?.items)`
  - **2.1.** `[Sequence]` Assign `items`
    ```typescript
    items = [...body.items]
    ```
- **3.** `[If]` `body?.lists && typeofbody.lists === 'object'`
  - **3.1.** `[Sequence]` Define `lists`
    ```typescript
    const lists = body.lists
    ```
  - **3.2.** `[If]` `Array.isArray(lists.anime)`
  - **3.3.** `[If]` `Array.isArray(lists.manga)`
  - **3.4.** `[If]` `Array.isArray(lists.tv)`
  - **3.5.** `[If]` `Array.isArray(lists.movie)`
  - **3.6.** `[If]` `Array.isArray(lists.game)`
  - **3.7.** `[If]` `Array.isArray(lists.book)`
  - **3.8.** `[If]` `Array.isArray(lists.music)`
  - **3.9.** `[If]` `Array.isArray(lists.customLists)`
- **4.** `[Sequence]` Calls `Boolean` and stores result as `skipExisting`
- **5.** `[Sequence]` Define `touchedMedia`, `imported`, `updated`, `skipped`, `queued`
  ```typescript
  const touchedMedia = new Map<string, { type: string; id: number }>()
  let imported = 0
  let updated = 0
  let skipped = 0
  let queued = 0
  ```
- **6.** `[Loop]` Iterate `const item` over `items`
  - **6.1.** `[Sequence]` Define `mediaType`, `title`
    ```typescript
    const mediaType = item.mediaType || ''.toLowerCase()
    const title = item.title || 'Untitled'
    ```
  - **6.2.** `[Sequence]` Calls `normalizeListStatus` and stores result as `status`
  - **6.3.** `[Sequence]` Define `rawScore`, `score`
    ```typescript
    const rawScore = item.score !== undefined && item.score !== null ? Number(item.score) : null
    let score: number | null = null
    ```
  - **6.4.** `[If]` `rawScore !== null && !isNaN(rawScore)`
    - **6.4.1.** `[Sequence]` Define `s`
      ```typescript
      let s = rawScore
      ```
    - **6.4.2.** `[If]` `s > 10`
      - **6.4.2.1.** `[Sequence]` Assign `s`
        ```typescript
        s = s / 10
        ```
    - **6.4.3.** `[If]` `s < 0`
      - **6.4.3.1.** `[Sequence]` Assign `s`
        ```typescript
        s = 0
        ```
    - **6.4.4.** `[If]` `s > 10`
      - **6.4.4.1.** `[Sequence]` Assign `s`
        ```typescript
        s = 10
        ```
    - **6.4.5.** `[Sequence]` Assign `score`
      ```typescript
      score = Math.round(s * 10) / 10
      ```
  - **6.5.** `[Sequence]` Define `notes`
    ```typescript
    const notes = item.notes ?? null
    ```
  - **6.6.** `[Sequence]` Calls `Boolean` and stores result as `isPrivate`
  - **6.7.** `[Sequence]` Define `startedAt`, `completedAt`
    ```typescript
    const startedAt = item.startedAt ? new Date(item.startedAt) : null
    const completedAt = item.completedAt ? new Date(item.completedAt) : null
    ```
  - **6.8.** `[Try]` Try block
    - **6.8.1.** `[Switch]` Branch on `mediaType`
      - **6.8.1.1.** `[Case]` Case `'anime'`
      - **6.8.1.2.** `[Case]` Case `'manga'`
      - **6.8.1.3.** `[Case]` Case `'movie'`
      - **6.8.1.4.** `[Case]` Case `'tv'`
      - **6.8.1.5.** `[Case]` Case `'game'`
      - **6.8.1.6.** `[Case]` Case `'book'`
      - **6.8.1.7.** `[Case]` Case `'music'`
      - **6.8.1.8.** `[Case]` Case `'custom_lists'`
      - **6.8.1.9.** `[Case]` Default
  - **6.9.** `[Catch]` Catch (`err`)
- **7.** `[Loop]` Iterate `const item` over `touchedMedia.values()`
  - **7.1.** `[Try]` Try block
    - **7.1.1.** `[Sequence]` Calls `MediaStatsServ.recalculateMediaStats`
  - **7.2.** `[Catch]` Catch (`err`)
    - **7.2.1.** `[Sequence]` Calls `console.error`
- **8.** `[If]` `!body?.suppressSummaryActivity && imported + updated > 0`
  - **8.1.** `[Sequence]` Calls `Array.from` and stores result as `touchedTypes`
  - **8.2.** `[Sequence]` Calls `ActivityServ.recordImportOrSyncSummaryActivity`
  - **8.3.** `[Sequence]` Calls `CarinaUsersServ.evaluateBadgesNonBlocking`
- **9.** `[Return]` 
  ```json
  {
    "success": true,
    "imported": "<imported>",
    "updated": "<updated>",
    "skipped": "<skipped>",
    "queued": "<queued>",
    "total": "<items.length>"
  }
  ```

#### `fetchRemoteExport(rawUrl, password)` (L4799)

- **1.** `[Sequence]` Define `targetUrl`
  ```typescript
  let targetUrl = rawUrl.trim()
  ```
- **2.** `[If]` `!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')`
  - **2.1.** `[Sequence]` Assign `targetUrl`
    ```typescript
    targetUrl = `https://${targetUrl}`
    ```
- **3.** `[Sequence]` Calls `BorealisListsServ.validateRemoteImportUrl` and stores result as `validatedUrl`
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Calls `fetch` and stores result as `res`
  - **4.2.** `[If]` `!res.ok`
    - **4.2.1.** `[Sequence]` Calls `res.text` and stores result as `text`
    - **4.2.2.** `[Sequence]` Define `errMessage`
      ```typescript
      let errMessage = 'Failed to fetch from remote URL'
      ```
    - **4.2.3.** `[Try]` Try block
      - **4.2.3.1.** `[Sequence]` Calls `JSON.parse` and stores result as `json`
      - **4.2.3.2.** `[If]` `json.message`
        - **4.2.3.2.1.** `[Sequence]` Assign `errMessage`
          ```typescript
          errMessage = json.message
          ```
    - **4.2.4.** `[Catch]` Catch (`err`)
    - **4.2.5.** `[Error]` Throws `BadRequest` (HTTP 400) — errMessage
  - **4.3.** `[Sequence]` Calls `res.json` and stores result as `json`
  - **4.4.** `[Return]` 
    ```json
    {
      "success": true,
      "data": "<json.data || json>"
    }
    ```
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[If]` `err instanceof BadRequest`
    - **5.1.1.** `[Error]` Throws `err`
  - **5.2.** `[Error]` Throws `BadRequest` (HTTP 400) — err.message || 'Network error fetching remote export'

#### `getGlobalListStats(userId, query)` (L4842)

- **1.** `[Sequence]` Calls `Boolean` and stores result as `isPeriodFiltered`
- **2.** `[Sequence]` Calls `new Date().getUTCFullYear` and stores result as `currentYear`
- **3.** `[Sequence]` Define `filterYear`, `filterQuarter`, `filterMonth`, `startDate`, `endDate`
  ```typescript
  const filterYear = query?.year ? Number(query.year) : (isPeriodFiltered ? currentYear : undefined)
  const filterQuarter = query?.quarter ? Number(query.quarter) : undefined
  const filterMonth = query?.month ? Number(query.month) : undefined
  let startDate: Date | null = null
  let endDate: Date | null = null
  ```
- **4.** `[If]` `filterYear`
  - **4.1.** `[If]` `filterMonth`
    - **4.1.1.** `[Sequence]` Assign `startDate`
      ```typescript
      startDate = new Date(Date.UTC(filterYear, filterMonth - 1, 1))
      ```
    - **4.1.2.** `[Sequence]` Assign `endDate`
      ```typescript
      endDate = new Date(Date.UTC(filterYear, filterMonth, 1))
      ```
  - **4.2.** `[Else]` Otherwise
    - **4.2.1.** `[If]` `filterQuarter`
      - **4.2.1.1.** `[Sequence]` Define `startM`
        ```typescript
        const startM = filterQuarter - 1 * 3
        ```
      - **4.2.1.2.** `[Sequence]` Assign `startDate`
        ```typescript
        startDate = new Date(Date.UTC(filterYear, startM, 1))
        ```
      - **4.2.1.3.** `[Sequence]` Assign `endDate`
        ```typescript
        endDate = new Date(Date.UTC(filterYear, startM + 3, 1))
        ```
    - **4.2.2.** `[Else]` Otherwise
      - **4.2.2.1.** `[Sequence]` Assign `startDate`
        ```typescript
        startDate = new Date(Date.UTC(filterYear, 0, 1))
        ```
      - **4.2.2.2.** `[Sequence]` Assign `endDate`
        ```typescript
        endDate = new Date(Date.UTC(filterYear + 1, 0, 1))
        ```
- **5.** `[Sequence]` Define `inRange`
  ```typescript
  const inRange = (d: Date | null) => { if (!startDate && !endDate) return true if (!d) return false const t = d.getTime() if (startDate && t < startDate.getTime()) return false if (endDate && t >= endDate.getTime()) return false return true ...
  ```
- **6.** `[Sequence]` Database `all` on `AnimeList` and stores it as `[animeRaw, mangaRaw, tvRaw, movieRaw, gameRaw, bookRaw, musicRaw]`
- **7.** `[Sequence]` Define `normalizeGenres`
  ```typescript
  const normalizeGenres = (items: any[], mediaKey: string) => items.map((item) => { const media = item[mediaKey] if (!media) return item return { ...item, [mediaKey]: { ...
  ```
- **8.** `[Sequence]` Calls `normalizeGenres` and stores result as `animeList`
- **9.** `[Sequence]` Calls `normalizeGenres` and stores result as `mangaList`
- **10.** `[Sequence]` Calls `normalizeGenres` and stores result as `tvList`
- **11.** `[Sequence]` Calls `normalizeGenres` and stores result as `movieList`
- **12.** `[Sequence]` Calls `normalizeGenres` and stores result as `gameList`
- **13.** `[Sequence]` Calls `normalizeGenres` and stores result as `bookList`
- **14.** `[Sequence]` Calls `normalizeGenres` and stores result as `musicList`
- **15.** `[Sequence]` Define `filterEntries`
  ```typescript
  const filterEntries = (arr: any[]) => isPeriodFiltered ? arr.filter((e) => inRange(e.completedAt ?? e.startedAt ?? e.createdAt)) : arr
  ```
- **16.** `[Sequence]` Calls `filterEntries` and stores result as `fAnime`
- **17.** `[Sequence]` Calls `filterEntries` and stores result as `fManga`
- **18.** `[Sequence]` Calls `filterEntries` and stores result as `fTv`
- **19.** `[Sequence]` Calls `filterEntries` and stores result as `fMovie`
- **20.** `[Sequence]` Calls `filterEntries` and stores result as `fGame`
- **21.** `[Sequence]` Calls `filterEntries` and stores result as `fBook`
- **22.** `[Sequence]` Calls `filterEntries` and stores result as `fMusic`
- **23.** `[Sequence]` Define `allEntries`, `totalTitles`, `completedTitles`, `planningCount`, `totalScoreSum`, `scoredCount`, `scoresList`, `statusCounts`, `scoreBuckets`, `unratedCount`, `genreMap`, `yearActivityMap`, `monthlyActivityMap`, `animeMinutes`
  ```typescript
  const allEntries = [...fAnime, ...fManga, ...fTv, ...fMovie, ...fGame, ...fBook, ...fMusic]
  const totalTitles = allEntries.length
  let completedTitles = 0
  let planningCount = 0
  let totalScoreSum = 0
  let scoredCount = 0
  const scoresList: number[] = []
  const statusCounts: Record<string, number> = {}
  const scoreBuckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 }
  let unratedCount = 0
  const genreMap: Record<string, { count: number; scoreSum: number; scoredCount: number }> = {}
  const yearActivityMap: Record<number, number> = {}
  const monthlyActivityMap: Record<string, { year: number; month: number; count: number }> = {}
  let animeMinutes = 0
  ```
- **24.** `[Loop]` Iterate `const e` over `fAnime`
  - **24.1.** `[Sequence]` Assign `animeMinutes`
    ```typescript
    animeMinutes += (e.progress ?? 0) * 24
    ```
  - **24.2.** `[If]` `e.status === 'COMPLETED'`
  - **24.3.** `[If]` `e.status === 'PLANNED'`
- **25.** `[Sequence]` Define `mangaMinutes`
  ```typescript
  let mangaMinutes = 0
  ```
- **26.** `[Loop]` Iterate `const e` over `fManga`
  - **26.1.** `[Sequence]` Assign `mangaMinutes`
    ```typescript
    mangaMinutes += (e.chaptersProgress ?? 0) * 8
    ```
  - **26.2.** `[If]` `e.status === 'COMPLETED'`
  - **26.3.** `[If]` `e.status === 'PLANNED'`
- **27.** `[Sequence]` Define `tvMinutes`
  ```typescript
  let tvMinutes = 0
  ```
- **28.** `[Loop]` Iterate `const e` over `fTv`
  - **28.1.** `[Sequence]` Assign `tvMinutes`
    ```typescript
    tvMinutes += (e.progress ?? 0) * 45
    ```
  - **28.2.** `[If]` `e.status === 'COMPLETED'`
  - **28.3.** `[If]` `e.status === 'PLANNED'`
- **29.** `[Sequence]` Define `movieMinutes`
  ```typescript
  let movieMinutes = 0
  ```
- **30.** `[Loop]` Iterate `const e` over `fMovie`
  - **30.1.** `[Sequence]` Assign `movieMinutes`
    ```typescript
    movieMinutes += (e.status === 'COMPLETED' ? 1 : 0) * (e.movie?.runtime ?? 110)
    ```
  - **30.2.** `[If]` `e.status === 'COMPLETED'`
  - **30.3.** `[If]` `e.status === 'PLANNED'`
- **31.** `[Sequence]` Define `gameMinutes`
  ```typescript
  let gameMinutes = 0
  ```
- **32.** `[Loop]` Iterate `const e` over `fGame`
  - **32.1.** `[Sequence]` Assign `gameMinutes`
    ```typescript
    gameMinutes += (e.progress ?? 0) * 60
    ```
  - **32.2.** `[If]` `e.status === 'COMPLETED'`
  - **32.3.** `[If]` `e.status === 'PLANNED'`
- **33.** `[Sequence]` Define `bookMinutes`
  ```typescript
  let bookMinutes = 0
  ```
- **34.** `[Loop]` Iterate `const e` over `fBook`
  - **34.1.** `[Sequence]` Assign `bookMinutes`
    ```typescript
    bookMinutes += (e.progressPages ?? 0) * 1.5
    ```
  - **34.2.** `[If]` `e.status === 'COMPLETED'`
  - **34.3.** `[If]` `e.status === 'PLANNED'`
- **35.** `[Sequence]` Define `musicMinutes`
  ```typescript
  let musicMinutes = 0
  ```
- **36.** `[Loop]` Iterate `const e` over `fMusic`
  - **36.1.** `[Sequence]` Define `dur`
    ```typescript
    const dur = e.music?.duration ? e.music.duration / 60 : 3.5
    ```
  - **36.2.** `[Sequence]` Assign `musicMinutes`
    ```typescript
    musicMinutes += (e.playCount ?? 0) * dur
    ```
  - **36.3.** `[If]` `e.status === 'COMPLETED'`
  - **36.4.** `[If]` `e.status === 'PLANNED'`
- **37.** `[Sequence]` Calls `Math.round` and stores result as `totalTimeMinutes`
- **38.** `[Sequence]` Define `daysConsumed`, `daysPlanned`
  ```typescript
  const daysConsumed = Math.round(totalTimeMinutes / 1440 * 10) / 10
  const daysPlanned = Math.round(planningCount * 120 / 1440 * 10) / 10
  ```
- **39.** `[Loop]` Iterate `const e` over `allEntries`
  - **39.1.** `[Sequence]` Define `st`
    ```typescript
    const st = e.status || 'UNKNOWN'
    ```
  - **39.2.** `[Sequence]` Assign `statusCounts[st]`
    ```typescript
    statusCounts[st] = (statusCounts[st] || 0) + 1
    ```
  - **39.3.** `[If]` `e.score != null && e.score > 0`
    - **39.3.1.** `[Sequence]` Calls `Math.max` and stores result as `sc`
    - **39.3.2.** `[Sequence]` Assign `scoreBuckets[sc]`
      ```typescript
      scoreBuckets[sc] = (scoreBuckets[sc] || 0) + 1
      ```
    - **39.3.3.** `[Sequence]` Assign `totalScoreSum`
      ```typescript
      totalScoreSum += Number(e.score)
      ```
  - **39.4.** `[Else]` Otherwise
  - **39.5.** `[Sequence]` Define `date`
    ```typescript
    const date = e.completedAt ?? e.startedAt ?? e.createdAt
    ```
  - **39.6.** `[If]` `date`
    - **39.6.1.** `[Sequence]` Calls `new Date(date).getUTCFullYear` and stores result as `y`
    - **39.6.2.** `[Sequence]` Define `m`
      ```typescript
      const m = new Date(date).getUTCMonth() + 1
      ```
    - **39.6.3.** `[Sequence]` Assign `yearActivityMap[y]`
      ```typescript
      yearActivityMap[y] = (yearActivityMap[y] || 0) + 1
      ```
    - **39.6.4.** `[Sequence]` Define `key`
      ```typescript
      const key = `${y}-${m}`
      ```
    - **39.6.5.** `[If]` `!monthlyActivityMap[key]`
      - **39.6.5.1.** `[Sequence]` Assign `monthlyActivityMap[key]`
        ```typescript
        monthlyActivityMap[key] = { year: y, month: m, count: 0 }
        ```
  - **39.7.** `[Sequence]` Define `mediaObj`
    ```typescript
    const mediaObj = e.anime || e.manga || e.tv || e.movie || e.game || e.book || e.music
    ```
  - **39.8.** `[If]` `mediaObj?.genres && Array.isArray(mediaObj.genres)`
    - **39.8.1.** `[Loop]` Iterate `const g` over `mediaObj.genres`
      - **39.8.1.1.** `[Sequence]` Define `gName`
        ```typescript
        const gName = g.name || 'General'
        ```
      - **39.8.1.2.** `[If]` `!genreMap[gName]`
        - **39.8.1.2.1.** `[Sequence]` Assign `genreMap[gName]`
          ```typescript
          genreMap[gName] = { count: 0, scoreSum: 0, scoredCount: 0 }
          ```
      - **39.8.1.3.** `[If]` `e.score != null && e.score > 0`
        - **39.8.1.3.1.** `[Sequence]` Assign `genreMap[gName].scoreSum`
          ```typescript
          genreMap[gName].scoreSum += Number(e.score)
          ```
- **40.** `[Sequence]` Define `meanScore`, `standardDeviation`
  ```typescript
  const meanScore = scoredCount > 0 ? Math.round((totalScoreSum / scoredCount) * 10) / 10 : 0
  let standardDeviation = 0
  ```
- **41.** `[If]` `scoredCount > 1`
  - **41.1.** `[Sequence]` Define `variance`
    ```typescript
    const variance = scoresList.reduce((acc, val) => acc + Math.pow(val - meanScore, 2), 0) / scoredCount
    ```
  - **41.2.** `[Sequence]` Assign `standardDeviation`
    ```typescript
    standardDeviation = Math.round(Math.sqrt(variance) * 10) / 10
    ```
- **42.** `[Sequence]` Define `mediaMinutesMap`, `mediaBreakdown`, `statusDistribution`, `scoreDistribution`, `activityYearGraph`, `topGenres`
  ```typescript
  const mediaMinutesMap = [ { mediaType: 'ANIME', count: fAnime.length, mins: animeMinutes }, { mediaType: 'MANGA', count: fManga.length, mins: mangaMinutes }, { mediaType: 'TV', count: fTv.length, mins: tvMinutes }, { mediaType: 'MOVIE', count: fMovie.length, mins: movieMinutes }, { mediaType: 'GAME', count: fGame.length, mins: gameMinutes }, { mediaType: 'BOOK', count: fBook.length, mins: bookMinutes }, ...
  const mediaBreakdown = mediaMinutesMap.map((m) => ({ mediaType: m.mediaType, count: m.count, hours: Math.round((m.mins / 60) * 10) / 10, percentage: totalTitles > 0 ? Math.round((m.count / totalTitles) * 1000) / 10 : 0, }))
  const statusDistribution = Object.entries(statusCounts).map(([name, count]) => ({ name, count, percentage: totalTitles > 0 ? Math.round((count / totalTitles) * 1000) / 10 : 0, }))
  const scoreDistribution = { scores: Object.entries(scoreBuckets).map(([score, count]) => ({ score: Number(score), count, })), unratedCount, }
  const activityYearGraph = Object.entries(yearActivityMap).map(([year, titles]) => ({ year: Number(year), titles, meanScore, hours: Math.round((totalTimeMinutes / 60) * 10) / 10, }))
  const topGenres = Object.entries(genreMap).map(([genre, data]) => ({ genre, count: data.count, meanScore: data.scoredCount > 0 ? Math.round((data.scoreSum / data.scoredCount) * 10) / 10 : 0, hours: 0, })).sort((a, b) => b.count - a.count).slice(0, 10)
  ```
- **43.** `[Sequence]` Calls `Object.values(monthlyActivityMap).sort` and stores result as `monthlyActivity`
- **44.** `[Return]` 
  ```json
  {
    "success": true,
    "data": {
      "isPeriodFiltered": "<isPeriodFiltered>",
      "period": "<isPeriodFiltered ? { year: filterYear, quarter: filterQuarter, month: filterMonth, } : null>",
      "overview": {
        "totalTitles": "<totalTitles>",
        "completedTitles": "<completedTitles>",
        "planningCount": "<planningCount>",
        "totalTimeMinutes": "<totalTimeMinutes>",
        "daysConsumed": "<daysConsumed>",
        "daysPlanned": "<daysPlanned>",
        "meanScore": "<meanScore>",
        "standardDeviation": "<standardDeviation>",
        "scoredCount": "<scoredCount>"
      },
      "mediaBreakdown": "<mediaBreakdown>",
      "statusDistribution": "<statusDistribution>",
      "scoreDistribution": "<scoreDistribution>",
      "activityYearGraph": "<activityYearGraph>",
      "topGenres": "<topGenres>",
      "monthlyActivity": "<monthlyActivity>"
    }
  }
  ```

#### `listExportShares(userId)` (L5157)

- **1.** `[Sequence]` Database `all` on `ListExportShare` and stores it as `shares`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "shares": "<shares.map((s) => ({ id: s.id, description: s.description, mediaTypes: s.mediaTypes, createdAt: s.createdAt.toISOString(), expiresAt: s.expiresAt?.toISOString() ?? null, lastUsedAt: s.lastUsedAt?.toISOString() ?? null, ...)>"
  }
  ```

#### `createExportShare(userId, params)` (L5176)

- **1.** `[If]` `!params.password || params.password.length < 4`
  - **1.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Export password must be at least 4 characters'
- **2.** `[If]` `!params.mediaTypes || params.mediaTypes.length === 0`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Please select at least one media type to export'
- **3.** `[Sequence]` Calls `hashPassword` and stores result as `passwordHash`
- **4.** `[Sequence]` Define `expiresAt`
  ```typescript
  let expiresAt: Date | null = null
  ```
- **5.** `[If]` `params.expiresInHours && params.expiresInHours > 0`
  - **5.1.** `[Sequence]` Assign `expiresAt`
    ```typescript
    expiresAt = new Date(Date.now() + params.expiresInHours * 3600 * 1000)
    ```
- **6.** `[Sequence]` Database `create` on `ListExportShare` and stores it as `share`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "shareId": "<share.id>",
    "expiresAt": "<share.expiresAt?.toISOString() ?? null>"
  }
  ```

#### `revokeExportShare(userId, shareId)` (L5215)

- **1.** `[Sequence]` Database `first` on `ListExportShare` and stores it as `share`
- **2.** `[If]` `!share`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Export share link not found'
- **3.** `[Sequence]` Database `delete` on `ListExportShare`
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Export share link revoked successfully"
  }
  ```

#### `getAllWatchingMedia(userId, limit = 50)` (L5233)
Get all watching / in-progress media across all 7 lists at once (excludes music).

- **1.** `[Sequence]` Calls `Math.max` and stores result as `lim`
- **2.** `[Sequence]` Define `q`
  ```typescript
  const q = { status: 'IN_PROGRESS', limit: lim, sortBy: 'updatedAt' as const, order: 'desc' as const }
  ```
- **3.** `[Sequence]` Calls `Promise.all` and stores result as `[animeRes, tvRes, movieRes, mangaRes, gameRes, bookRes, otherRes]`
- **4.** `[Sequence]` Define `counts`
  ```typescript
  const counts = { anime: animeRes.pagination.total, tv: tvRes.pagination.total, movie: movieRes.pagination.total, manga: mangaRes.pagination.total, game: gameRes.pagination.total, book: bookRes.pagination.total, ...
  ```
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "lists": {
      "anime": "<animeRes.items>",
      "tv": "<tvRes.items>",
      "movie": "<movieRes.items>",
      "manga": "<mangaRes.items>",
      "game": "<gameRes.items>",
      "book": "<bookRes.items>",
      "other": "<otherRes.items>"
    },
    "counts": "<counts>"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/borealis/lists/_base/base-list.serv.ts](./_base/base-list.serv.md) ([[apps/borealis/lists/_base/base-list.serv]]) — `BaseBorealisListService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `NotFound`, `BadRequest`
- [core/utils/auth-crypto.ts](../../../core/utils/auth-crypto.md) ([[core/utils/auth-crypto]]) — `hashPassword`
- [apps/carina/connections/connection-sync.queue.ts](../../carina/connections/connection-sync.queue.md) ([[apps/carina/connections/connection-sync.queue]]) — `ConnectionSyncQueueManager`
- [apps/carina/activity/activity.serv.ts](../../carina/activity/activity.serv.md) ([[apps/carina/activity/activity.serv]]) — `ActivityServ`, `normalizeDisplayScore`, `ActivityDiffChange`, `MediaListAction`
- [apps/carina/users/users.serv.ts](../../carina/users/users.serv.md) ([[apps/carina/users/users.serv]]) — `CarinaUsersServ`
- [apps/borealis/_shared/media-stats.serv.ts](../_shared/media-stats.serv.md) ([[apps/borealis/_shared/media-stats.serv]]) — `MediaStatsServ`
- [apps/borealis/lists/user-stats.serv.ts](./user-stats.serv.md) ([[apps/borealis/lists/user-stats.serv]]) — `mediaStatsService`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `countOf`, `toDate`, `and`, `or`, `normalizeListStatus`, `MediaType`, `ListStatus`

### Called By / Imported By
- [apps/borealis/lists/lists.ctrl.ts](./lists.ctrl.md) ([[apps/borealis/lists/lists.ctrl]]) — `BorealisListsServ`
- [apps/carina/connections/connections.serv.ts](../../carina/connections/connections.serv.md) ([[apps/carina/connections/connections.serv]]) — `BorealisListsServ`
