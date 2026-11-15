# media-stats.serv.ts

- **Source**: [`apps/borealis/_shared/media-stats.serv.ts`](../../../../../../../apps/elysia/src/apps/borealis/_shared/media-stats.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `MediaStatsServ extends BaseService`

## Exported Types, Methods & Algorithms

### `function initScoreDistribution` (L7)

- **1.** `[Sequence]` Define `dist`
  ```typescript
  const dist: Record<string, number> = {}
  ```
- **2.** `[Loop]` Loop `i <= 10`
  - **2.1.** `[Sequence]` Assign `dist[String(i)]`
    ```typescript
    dist[String(i)] = 0
    ```
- **3.** `[Return]`  — `dist`

### `interface EntryItem` (L15)

### `function computeMediaStats` (L20)

- **1.** `[Sequence]` Define `popularity`, `statusDistribution`
  ```typescript
  const popularity = entries.length
  const statusDistribution: Record<string, number> = {}
  ```
- **2.** `[Sequence]` Calls `initScoreDistribution` and stores result as `scoreDistribution`
- **3.** `[Sequence]` Define `scoredCount`, `rawScoreSum`
  ```typescript
  let scoredCount = 0
  let rawScoreSum = 0
  ```
- **4.** `[Loop]` Iterate `const item` over `entries`
  - **4.1.** `[Sequence]` Define `status`
    ```typescript
    const status = item.status || 'PLANNED'
    ```
  - **4.2.** `[Sequence]` Assign `statusDistribution[status]`
    ```typescript
    statusDistribution[status] = (statusDistribution[status] || 0) + 1
    ```
  - **4.3.** `[If]` `item.score !== null && item.score !== undefined && item.score > 0`
    - **4.3.1.** `[Sequence]` Calls `Number` and stores result as `normalized`
    - **4.3.2.** `[If]` `normalized > 10`
      - **4.3.2.1.** `[Sequence]` Assign `normalized`
        ```typescript
        normalized = normalized / 10
        ```
    - **4.3.3.** `[Sequence]` Assign `normalized`
      ```typescript
      normalized = Math.min(10, Math.max(0, normalized))
      ```
    - **4.3.4.** `[Sequence]` Assign `rawScoreSum`
      ```typescript
      rawScoreSum += normalized
      ```
    - **4.3.5.** `[Sequence]` Calls `Math.min` and stores result as `bucket`
    - **4.3.6.** `[Sequence]` Assign `scoreDistribution[String(bucket)]`
      ```typescript
      scoreDistribution[String(bucket)] = (scoreDistribution[String(bucket)] || 0) + 1
      ```
- **5.** `[Sequence]` Define `totalScoreSum`, `averageScore`
  ```typescript
  const totalScoreSum = scoredCount > 0 ? Math.round(rawScoreSum) : null
  const averageScore = scoredCount > 0 ? Math.round((rawScoreSum / scoredCount) * 10) / 10 : null
  ```
- **6.** `[Return]` 
  ```json
  {
    "popularity": "<popularity>",
    "statusDistribution": "<statusDistribution>",
    "scoreDistribution": "<scoreDistribution>",
    "scoredCount": "<scoredCount > 0 ? scoredCount : null>",
    "totalScoreSum": "<totalScoreSum>",
    "averageScore": "<averageScore>"
  }
  ```

### `class MediaStatsServ` extends `BaseService` (L59)

#### `recalculateMediaStats(mediaType, mediaId)`: `Promise<void>` (L64)
Recalculates community statistics (averageScore, popularity, totalScoreSum, scoredCount, statusDistribution, scoreDistribution) for a single media item.

- **1.** `[Sequence]` Define `normType`
  ```typescript
  const normType = String(mediaType).toUpperCase()
  ```
- **2.** `[Try]` Try block
  - **2.1.** `[Switch]` Branch on `normType`
    - **2.1.1.** `[Case]` Case `'ANIME'`
    - **2.1.2.** `[Case]` Case `'MANGA'`
    - **2.1.3.** `[Case]` Case `'MOVIE'`
    - **2.1.4.** `[Case]` Case `'TV'`
    - **2.1.5.** `[Case]` Case `'GAME'`
    - **2.1.6.** `[Case]` Case `'BOOK'`
    - **2.1.7.** `[Case]` Case `'MUSIC'`
    - **2.1.8.** `[Case]` Case `'OTHER'`
    - **2.1.9.** `[Case]` Default
      - **2.1.9.1.** `[Warning]` Logs warning — `Unknown media type for stats recalculation: ${mediaType}`
- **3.** `[Catch]` Catch (`err`)
  - **3.1.** `[Sequence]` Calls `logger.error`

#### `recalculateFavoritesCount(favoriteType, targetId)`: `Promise<void>` (L157)
Recalculates the exact favorite count for a target entity from the Favorite table.

- **1.** `[Sequence]` Define `normType`
  ```typescript
  const normType = String(favoriteType).toUpperCase() as FavoriteType
  ```
- **2.** `[Try]` Try block
  - **2.1.** `[Sequence]` Database `query` on `Favorite` and stores it as `count`
  - **2.2.** `[Switch]` Branch on `normType`
    - **2.2.1.** `[Case]` Case `'ANIME'`
      - **2.2.1.1.** `[Sequence]` Database `update` on `Anime`
    - **2.2.2.** `[Case]` Case `'MANGA'`
      - **2.2.2.1.** `[Sequence]` Database `update` on `Manga`
    - **2.2.3.** `[Case]` Case `'MOVIE'`
      - **2.2.3.1.** `[Sequence]` Database `update` on `Movie`
    - **2.2.4.** `[Case]` Case `'TV'`
      - **2.2.4.1.** `[Sequence]` Database `update` on `Tv`
    - **2.2.5.** `[Case]` Case `'GAME'`
      - **2.2.5.1.** `[Sequence]` Database `update` on `Game`
    - **2.2.6.** `[Case]` Case `'BOOK'`
      - **2.2.6.1.** `[Sequence]` Database `update` on `Book`
    - **2.2.7.** `[Case]` Case `'MUSIC_ALBUM'`
    - **2.2.8.** `[Case]` Case `'MUSIC_TRACK'`
      - **2.2.8.1.** `[Sequence]` Database `update` on `Music`
    - **2.2.9.** `[Case]` Case `'CHARACTER'`
      - **2.2.9.1.** `[Sequence]` Database `update` on `Character`
    - **2.2.10.** `[Case]` Case `'PERSON'`
      - **2.2.10.1.** `[Sequence]` Database `update` on `Person`
    - **2.2.11.** `[Case]` Case `'STUDIO'`
      - **2.2.11.1.** `[Sequence]` Database `update` on `Studio`
    - **2.2.12.** `[Case]` Case `'OTHER'`
      - **2.2.12.1.** `[Sequence]` Database `update` on `Other`
    - **2.2.13.** `[Case]` Default
- **3.** `[Catch]` Catch (`err`)
  - **3.1.** `[Sequence]` Calls `logger.error`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `countOf`, `FavoriteType`, `MediaType`
- `@NamelessLiberty/logger` — `LogFactory`, `c`

### Called By / Imported By
- [apps/borealis/lists/lists.serv.ts](../lists/lists.serv.md) ([[apps/borealis/lists/lists.serv]]) — `MediaStatsServ`
- [apps/carina/favorites/favorites.serv.ts](../../carina/favorites/favorites.serv.md) ([[apps/carina/favorites/favorites.serv]]) — `MediaStatsServ`
