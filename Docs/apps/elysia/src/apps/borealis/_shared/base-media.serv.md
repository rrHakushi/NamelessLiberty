# base-media.serv.ts

- **Source**: [`apps/borealis/_shared/base-media.serv.ts`](../../../../../../../apps/elysia/src/apps/borealis/_shared/base-media.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `BaseBorealisMediaService extends BaseService`
- **Extended By**: [`BorealisAnimeServ`](../anime/anime.serv.md) ([[apps/borealis/anime/anime.serv]]), [`BorealisBooksServ`](../books/books.serv.md) ([[apps/borealis/books/books.serv]]), [`BorealisGamesServ`](../games/games.serv.md) ([[apps/borealis/games/games.serv]]), [`BorealisMangaServ`](../manga/manga.serv.md) ([[apps/borealis/manga/manga.serv]]), [`BorealisMoviesServ`](../movies/movies.serv.md) ([[apps/borealis/movies/movies.serv]]), [`BorealisMusicServ`](../music/music.serv.md) ([[apps/borealis/music/music.serv]]), [`BorealisOtherServ`](../other/other.serv.md) ([[apps/borealis/other/other.serv]]), [`BorealisTvServ`](../tv/tv.serv.md) ([[apps/borealis/tv/tv.serv]])

## Exported Types, Methods & Algorithms

### `interface PaginationMeta` (L5)

### `class BaseBorealisMediaService` extends `BaseService` (L20)

Abstract base service for Borealis media domain services (`anime`, `manga`, `tv`, `movies`, `books`, `games`, `music`, `other`). Centralizes list-query parsing, cursor/page pagination math, accepted-friend resolution, and common user summary formatting.

#### `constructor(loggerName)` (L21)
Abstract base service for Borealis media domain services (`anime`, `manga`, `tv`, `movies`, `books`, `games`, `music`, `other`). Centralizes list-query parsing, cursor/page pagination math, accepted-friend resolution, and common user summary formatting.

- _No executable statements_

#### `parseCsvList(val)`: `string[]` (L28)
Parses a comma-separated query parameter into trimmed non-empty strings.

- **1.** `[If]` `!val || typeofval !== 'string'`
  - **1.1.** `[Return]`  — `[]`
- **2.** `[Return]`  — `val.split(',').map((s) => s.trim()).filter(Boolean)`

#### `parseCsvNumbers(val)`: `number[]` (L39)
Parses a comma-separated numeric query parameter into finite numbers.

- **1.** `[Return]`  — `this.parseCsvList(val).map((v) => Number(v)).filter((n) => Number.isFinite(n))`

#### `resolveCatalogPagination(query, defaultLimit = 50, maxLimit = 100)` (L48)
Resolves catalog pagination parameters supporting both cursor and page/limit modes.

- **1.** `[Sequence]` Calls `this.clampPagination` and stores result as `{ page, limit }`
- **2.** `[Sequence]` Define `skip`
  ```typescript
  const skip = query?.cursor ? 0 : (page - 1) * limit
  ```
- **3.** `[Return]` 
  ```json
  {
    "page": "<page>",
    "limit": "<limit>",
    "skip": "<skip>"
  }
  ```

#### `buildPaginationMeta(items, total, page, limit, hasCursor)`: `PaginationMeta` (L63)
Builds standardized catalog pagination metadata from queried items.

- **1.** `[Sequence]` Calls `Math.max` and stores result as `totalPages`
- **2.** `[Sequence]` Define `nextCursor`
  ```typescript
  const nextCursor = items.length === limit ? (items[items.length - 1]?.id ?? null) : null
  ```
- **3.** `[Return]` 
  ```json
  {
    "page": "<page>",
    "limit": "<limit>",
    "total": "<total>",
    "totalPages": "<totalPages>",
    "hasNextPage": "<hasCursor ? nextCursor !== null : page < totalPages>",
    "hasPrevPage": "<page > 1>",
    "nextCursor": "<nextCursor>"
  }
  ```

#### `getAcceptedFriendIds(userId)`: `Promise<string[]>` (L86)
Resolves accepted friend user IDs for the authenticated caller.

- **1.** `[If]` `!userId`
  - **1.1.** `[Return]`  — `[]`
- **2.** `[Sequence]` Database `all` on `Friend` and stores it as `friendships`
- **3.** `[Return]`  — `friendships.map((f) => (f.userId === userId ? f.friendId : f.userId))`

#### `formatPublicUserSummary(user)` (L103)
Formats a minimal public user header (id, username, displayName, avatarUrl).

- **1.** `[Sequence]` Calls `getProfileCustomization` and stores result as `profile`
- **2.** `[Sequence]` Define `displayName`
  ```typescript
  const displayName = typeof profile.displayName === 'string' && profile.displayName.trim().length > 0 ? profile.displayName.trim() : null
  ```
- **3.** `[Return]` 
  ```json
  {
    "id": "<user.id>",
    "username": "<user.username.trim()>",
    "displayName": "<displayName>",
    "avatarUrl": "<profile.avatarUrl ?? null>"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `and`, `or`
- `@NamelessLiberty/shared` — `getProfileCustomization`

### Called By / Imported By
- [apps/borealis/anime/anime.serv.ts](../anime/anime.serv.md) ([[apps/borealis/anime/anime.serv]]) — `BaseBorealisMediaService`
- [apps/borealis/books/books.serv.ts](../books/books.serv.md) ([[apps/borealis/books/books.serv]]) — `BaseBorealisMediaService`
- [apps/borealis/games/games.serv.ts](../games/games.serv.md) ([[apps/borealis/games/games.serv]]) — `BaseBorealisMediaService`
- [apps/borealis/manga/manga.serv.ts](../manga/manga.serv.md) ([[apps/borealis/manga/manga.serv]]) — `BaseBorealisMediaService`
- [apps/borealis/movies/movies.serv.ts](../movies/movies.serv.md) ([[apps/borealis/movies/movies.serv]]) — `BaseBorealisMediaService`
- [apps/borealis/music/music.serv.ts](../music/music.serv.md) ([[apps/borealis/music/music.serv]]) — `BaseBorealisMediaService`
- [apps/borealis/other/other.serv.ts](../other/other.serv.md) ([[apps/borealis/other/other.serv]]) — `BaseBorealisMediaService`
- [apps/borealis/tv/tv.serv.ts](../tv/tv.serv.md) ([[apps/borealis/tv/tv.serv]]) — `BaseBorealisMediaService`
