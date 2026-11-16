# media.queue.ts

- **Source**: [`apps/borealis/sync/media.queue.ts`](../../../../../../../apps/elysia/src/apps/borealis/sync/media.queue.ts)
- **Layer / Role**: BullMQ Queue Manager

## Exported Types, Methods & Algorithms

### `const MEDIA_QUEUE_NAME` (L20)

### `type MediaType` (L22)

### `interface MediaUpdateJobData` (L31)

### `interface WeeklyCronJobData` (L44)

### `type MediaJobData` (L49)

### `interface ActiveMediaSyncResult` (L51)

### `function getMediaQueue` (L81)

- **1.** `[If]` `!mediaQueueWrapper`
  - **1.1.** `[Sequence]` Assign `mediaQueueWrapper`
    ```typescript
    mediaQueueWrapper = new MediaUpdatesQueue()
    ```
- **2.** `[Return]`  — `mediaQueueWrapper.getQueue()`

### `function syncActiveMedia` (L111)

Scans all media entities currently in active/ongoing publication/broadcasting status (RELEASING, HIATUS, UPCOMING) and enqueues background refresh jobs into the reusable BullMQ media queue. For weekly updates, depth is strictly set to 0 so only this single media item updates without cascading to relations.

- **1.** `[Sequence]` Define `result`
  ```typescript
  const result: ActiveMediaSyncResult = { anime: 0, manga: 0, tv: 0, movie: 0, book: 0, game: 0, ...
  ```
- **2.** `[Sequence]` Calls `getWeekIdentifier` and stores result as `weekKey`
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Database `all` on `Anime` and stores it as `animes`
  - **3.2.** `[Loop]` Iterate `const anime` over `animes`
    - **3.2.1.** `[Sequence]` Calls `MediaQueueManager.enqueueMediaUpdate('ANIME', anime.id, { externalId: anime.anilistId, priority: 10, triggeredBy: 'cron', depth: 0, maxDepth: 0, jobId: `media-update-ANIME-${anime.id}-${weekKey}`, ...).catch`
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Sequence]` Calls `logger.error`
- **5.** `[Try]` Try block
  - **5.1.** `[Sequence]` Database `all` on `Manga` and stores it as `mangas`
  - **5.2.** `[Loop]` Iterate `const manga` over `mangas`
    - **5.2.1.** `[Sequence]` Calls `MediaQueueManager.enqueueMediaUpdate('MANGA', manga.id, { externalId: manga.anilistId, priority: 10, triggeredBy: 'cron', depth: 0, maxDepth: 0, jobId: `media-update-MANGA-${manga.id}-${weekKey}`, ...).catch`
- **6.** `[Catch]` Catch (`err`)
  - **6.1.** `[Sequence]` Calls `logger.error`
- **7.** `[Try]` Try block
  - **7.1.** `[Sequence]` Database `all` on `Tv` and stores it as `tvs`
  - **7.2.** `[Loop]` Iterate `const tv` over `tvs`
    - **7.2.1.** `[Sequence]` Calls `MediaQueueManager.enqueueMediaUpdate('TV', tv.id, { externalId: tv.tvDBId, priority: 10, triggeredBy: 'cron', depth: 0, jobId: `media-update-TV-${tv.id}-${weekKey}`, }).catch`
- **8.** `[Catch]` Catch (`err`)
  - **8.1.** `[Sequence]` Calls `logger.error`
- **9.** `[Try]` Try block
  - **9.1.** `[Sequence]` Database `all` on `Movie` and stores it as `movies`
  - **9.2.** `[Loop]` Iterate `const movie` over `movies`
    - **9.2.1.** `[Sequence]` Calls `MediaQueueManager.enqueueMediaUpdate('MOVIE', movie.id, { externalId: movie.tvDBId, priority: 10, triggeredBy: 'cron', depth: 0, jobId: `media-update-MOVIE-${movie.id}-${weekKey}`, }).catch`
- **10.** `[Catch]` Catch (`err`)
  - **10.1.** `[Sequence]` Calls `logger.error`
- **11.** `[Try]` Try block
  - **11.1.** `[Sequence]` Database `all` on `Book` and stores it as `books`
  - **11.2.** `[Loop]` Iterate `const book` over `books`
    - **11.2.1.** `[Sequence]` Calls `MediaQueueManager.enqueueMediaUpdate('BOOK', book.id, { externalId: book.googleBookId, priority: 10, triggeredBy: 'cron', depth: 0, jobId: `media-update-BOOK-${book.id}-${weekKey}`, }).catch`
- **12.** `[Catch]` Catch (`err`)
  - **12.1.** `[Sequence]` Calls `logger.error`
- **13.** `[Try]` Try block
  - **13.1.** `[Sequence]` Database `all` on `Game` and stores it as `games`
  - **13.2.** `[Loop]` Iterate `const game` over `games`
    - **13.2.1.** `[Sequence]` Calls `MediaQueueManager.enqueueMediaUpdate('GAME', game.id, { externalId: game.igdbId, priority: 10, triggeredBy: 'cron', depth: 0, jobId: `media-update-GAME-${game.id}-${weekKey}`, }).catch`
- **14.** `[Catch]` Catch (`err`)
  - **14.1.** `[Sequence]` Calls `logger.error`
- **15.** `[Sequence]` Assign `result.total`
  ```typescript
  result.total = result.anime + result.manga + result.tv + result.movie + result.book + result.game
  ```
- **16.** `[Return]`  — `result`

### `const MediaQueueManager` (L289)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/bullmq/base.queue.ts](../../../core/bullmq/base.queue.md) ([[core/bullmq/base.queue]]) — `BaseBullMQQueue`
- [apps/borealis/sync/media.wrk.ts](./media.wrk.md) ([[apps/borealis/sync/media.wrk]]) — `getMediaWorker`, `closeMediaWorker`, `executeMediaUpdate`
- [apps/borealis/_shared/freshness.ts](../_shared/freshness.md) ([[apps/borealis/_shared/freshness]]) — `getEntityFreshness`, `evaluateRecordFreshness`, `FreshnessRecord`

### External / Workspace Packages
- `bullmq` — `Queue`, `Job`, `JobsOptions`
- `@NamelessLiberty/db` — `prisma`, `and`, `or`, `not`, `toDate`
- `@NamelessLiberty/logger` — `LogFactory`, `c`

### Called By / Imported By
- [apps/borealis/_shared/freshness.ts](../_shared/freshness.md) ([[apps/borealis/_shared/freshness]]) — `MediaType`
- [apps/borealis/anime/anime.serv.ts](../anime/anime.serv.md) ([[apps/borealis/anime/anime.serv]]) — `MediaQueueManager`
- [apps/borealis/books/books.serv.ts](../books/books.serv.md) ([[apps/borealis/books/books.serv]]) — `MediaQueueManager`
- [apps/borealis/games/games.serv.ts](../games/games.serv.md) ([[apps/borealis/games/games.serv]]) — `MediaQueueManager`
- [apps/borealis/manga/manga.serv.ts](../manga/manga.serv.md) ([[apps/borealis/manga/manga.serv]]) — `MediaQueueManager`
- [apps/borealis/movies/movies.serv.ts](../movies/movies.serv.md) ([[apps/borealis/movies/movies.serv]]) — `MediaQueueManager`
- [apps/borealis/music/music.serv.ts](../music/music.serv.md) ([[apps/borealis/music/music.serv]]) — `MediaQueueManager`
- [apps/borealis/search/external-search.serv.ts](../search/external-search.serv.md) ([[apps/borealis/search/external-search.serv]]) — `MediaQueueManager`
- [apps/borealis/sync/media-entity.syncer.ts](./media-entity.syncer.md) ([[apps/borealis/sync/media-entity.syncer]]) — `MediaQueueManager`, `MediaType`
- [apps/borealis/sync/media.wrk.ts](./media.wrk.md) ([[apps/borealis/sync/media.wrk]]) — `MEDIA_QUEUE_NAME`, `syncActiveMedia`, `MediaQueueManager`, `MediaJobData`, `MediaType`
- [apps/borealis/tv/tv.serv.ts](../tv/tv.serv.md) ([[apps/borealis/tv/tv.serv]]) — `MediaQueueManager`
- [index.ts](../../../index.md) ([[index]]) — `MediaQueueManager`
