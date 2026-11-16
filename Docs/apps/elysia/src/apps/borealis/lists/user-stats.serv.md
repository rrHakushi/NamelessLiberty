# user-stats.serv.ts

- **Source**: [`apps/borealis/lists/user-stats.serv.ts`](../../../../../../../apps/elysia/src/apps/borealis/lists/user-stats.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `MediaStatsService extends BaseMediaStatsService`

## Exported Types, Methods & Algorithms

### `interface PeriodFilter` (L5)

### `interface ScoreDistributionItem` (L11)

### `interface DistributionItem` (L16)

### `interface YearGraphItem` (L22)

### `interface LengthBucketItem` (L29)

### `interface TopGenreItem` (L35)

### `interface TopCreatorItem` (L42)

### `interface MonthlyActivityItem` (L48)

### `interface WeeklyActivityItem` (L54)

### `interface DayOfWeekItem` (L60)

### `interface RewindHighlights` (L66)

### `interface MediaStatsResponse` (L80)

### `interface CombinedStatsResponse` (L117)

### `function normalizeScoreTo10` (L201)

- **1.** `[If]` `s === null || s === undefined || s <= 0`
  - **1.1.** `[Return]`  — `null`
- **2.** `[Sequence]` Define `normalized`
  ```typescript
  const normalized = s > 10 ? s / 10 : s
  ```
- **3.** `[Return]`  — `Math.min(10, Math.max(0.1, Math.round(normalized * 100) / 100))`

### `class MediaStatsService` extends `BaseMediaStatsService` (L310)

#### `constructor()` (L313)

- _No executable statements_

#### `getInstance()`: `MediaStatsService` (L317)

- **1.** `[If]` `!MediaStatsService.instance`
  - **1.1.** `[Sequence]` Assign `MediaStatsService.instance`
    ```typescript
    MediaStatsService.instance = new MediaStatsService()
    ```
- **2.** `[Return]`  — `MediaStatsService.instance`

#### `getAnimeStats(userId, isOwner, period)`: `Promise<MediaStatsResponse>` (L327)
Calculates comprehensive stats for user's anime list.

- **1.** `[Sequence]` Define `cacheKey`
  ```typescript
  const cacheKey = `iris:stats:${userId}:anime:${period?.year ?? "all"}:${period?.quarter ?? "all"}:${period?.month ?? "all"}:${isOwner ? "1" : "0"}`
  ```
- **2.** `[Return]`  — `cache.getOrSet(cacheKey, async () => { const { start, end } = resolveDateRange(period) const isPeriodFiltered = Boolean(start || end) let q = prisma.orm.public.AnimeList.where({ userId }) if (!isOwner) { q = q.where({ private: false }) ..., STATS_CACHE_TTL_SECONDS)`

#### `getMangaStats(userId, isOwner, period)`: `Promise<MediaStatsResponse>` (L752)
Calculates comprehensive stats for user's manga list. Rates: 7m Manga, 4m Manhwa, 20m Light Novel / ch; 1.5h Manga, 1h Manhwa, 3h Light Novel / vol.

- **1.** `[Sequence]` Define `cacheKey`
  ```typescript
  const cacheKey = `iris:stats:${userId}:manga:${period?.year ?? "all"}:${period?.quarter ?? "all"}:${period?.month ?? "all"}:${isOwner ? "1" : "0"}`
  ```
- **2.** `[Return]`  — `cache.getOrSet(cacheKey, async () => { const { start, end } = resolveDateRange(period) const isPeriodFiltered = Boolean(start || end) let q = prisma.orm.public.MangaList.where({ userId }) if (!isOwner) { q = q.where({ private: false }) ..., STATS_CACHE_TTL_SECONDS)`

#### `getMovieStats(userId, isOwner, period)`: `Promise<MediaStatsResponse>` (L1185)
Calculates comprehensive stats for user's movie list.

- **1.** `[Sequence]` Define `cacheKey`
  ```typescript
  const cacheKey = `iris:stats:${userId}:movie:${period?.year ?? "all"}:${period?.quarter ?? "all"}:${period?.month ?? "all"}:${isOwner ? "1" : "0"}`
  ```
- **2.** `[Return]`  — `cache.getOrSet(cacheKey, async () => { const { start, end } = resolveDateRange(period) const isPeriodFiltered = Boolean(start || end) let q = prisma.orm.public.MovieList.where({ userId }) if (!isOwner) { q = q.where({ private: false }) ..., STATS_CACHE_TTL_SECONDS)`

#### `getTvStats(userId, isOwner, period)`: `Promise<MediaStatsResponse>` (L1499)
Calculates comprehensive stats for user's tv list.

- **1.** `[Sequence]` Define `cacheKey`
  ```typescript
  const cacheKey = `iris:stats:${userId}:tv:${period?.year ?? "all"}:${period?.quarter ?? "all"}:${period?.month ?? "all"}:${isOwner ? "1" : "0"}`
  ```
- **2.** `[Return]`  — `cache.getOrSet(cacheKey, async () => { const { start, end } = resolveDateRange(period) const isPeriodFiltered = Boolean(start || end) let q = prisma.orm.public.TvList.where({ userId }) if (!isOwner) { q = q.where({ private: false }) ..., STATS_CACHE_TTL_SECONDS)`

#### `getGameStats(userId, isOwner, period)`: `Promise<MediaStatsResponse>` (L1824)
Calculates comprehensive stats for user's game list.

- **1.** `[Sequence]` Define `cacheKey`
  ```typescript
  const cacheKey = `iris:stats:${userId}:game:${period?.year ?? "all"}:${period?.quarter ?? "all"}:${period?.month ?? "all"}:${isOwner ? "1" : "0"}`
  ```
- **2.** `[Return]`  — `cache.getOrSet(cacheKey, async () => { const { start, end } = resolveDateRange(period) const isPeriodFiltered = Boolean(start || end) let q = prisma.orm.public.GameList.where({ userId }) if (!isOwner) { q = q.where({ private: false }) ..., STATS_CACHE_TTL_SECONDS)`

#### `getBookStats(userId, isOwner, period)`: `Promise<MediaStatsResponse>` (L2136)
Calculates comprehensive stats for user's book list.

- **1.** `[Sequence]` Define `cacheKey`
  ```typescript
  const cacheKey = `iris:stats:${userId}:book:${period?.year ?? "all"}:${period?.quarter ?? "all"}:${period?.month ?? "all"}:${isOwner ? "1" : "0"}`
  ```
- **2.** `[Return]`  — `cache.getOrSet(cacheKey, async () => { const { start, end } = resolveDateRange(period) const isPeriodFiltered = Boolean(start || end) let q = prisma.orm.public.BookList.where({ userId }) if (!isOwner) { q = q.where({ private: false }) ..., STATS_CACHE_TTL_SECONDS)`

#### `getMusicStats(userId, isOwner, period)`: `Promise<MediaStatsResponse>` (L2455)
Calculates comprehensive stats for user's music list.

- **1.** `[Sequence]` Define `cacheKey`
  ```typescript
  const cacheKey = `iris:stats:${userId}:music:${period?.year ?? "all"}:${period?.quarter ?? "all"}:${period?.month ?? "all"}:${isOwner ? "1" : "0"}`
  ```
- **2.** `[Return]`  — `cache.getOrSet(cacheKey, async () => { const { start, end } = resolveDateRange(period) const isPeriodFiltered = Boolean(start || end) let q = prisma.orm.public.MusicList.where({ userId }) if (!isOwner) { q = q.where({ private: false }) ..., STATS_CACHE_TTL_SECONDS)`

#### `getCombinedStats(userId, isOwner, period)`: `Promise<CombinedStatsResponse>` (L2597)
Calculates overarching combined stats across all 7 media types.

- **1.** `[Sequence]` Define `cacheKey`
  ```typescript
  const cacheKey = `iris:stats:v2:${userId}:combined:${period?.year ?? "all"}:${period?.quarter ?? "all"}:${period?.month ?? "all"}:${isOwner ? "1" : "0"}`
  ```
- **2.** `[Return]`  — `cache.getOrSet(cacheKey, async () => { const [anime, manga, movie, tv, game, book, music] = await Promise.all([ this.getAnimeStats(userId, isOwner, period), this.getMangaStats(userId, isOwner, period), this.getMovieStats(userId, isOwner, period), this.getTvStats(userId, isOwner, period), this.getGameStats(userId, isOwner, period), ..., STATS_CACHE_TTL_SECONDS)`

#### `invalidateUserStats(userId)`: `Promise<void>` (L2891)
Invalidate stats cache for a user.

- **1.** `[Sequence]` Calls `cache.clear`
- **2.** `[Sequence]` Calls `cache.clear`

### `const mediaStatsService` (L2897)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/borealis/lists/_base/base-stats.serv.ts](./_base/base-stats.serv.md) ([[apps/borealis/lists/_base/base-stats.serv]]) — `BaseMediaStatsService`
- [core/utils/cache.ts](../../../core/utils/cache.md) ([[core/utils/cache]]) — `cache`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`

### Called By / Imported By
- [apps/borealis/lists/lists.serv.ts](./lists.serv.md) ([[apps/borealis/lists/lists.serv]]) — `mediaStatsService`
