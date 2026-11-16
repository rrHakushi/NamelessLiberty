# media-relations.helper.ts

- **Source**: [`apps/borealis/_shared/media-relations.helper.ts`](../../../../../../../apps/elysia/src/apps/borealis/_shared/media-relations.helper.ts)
- **Layer / Role**: Module / Helper

## Exported Types, Methods & Algorithms

### `interface HydratedMediaTarget` (L3)

### `interface HydratedMediaRelationItem` (L18)

### `function fetchMediaRelations` (L45)

- **1.** `[Sequence]` Database `all` on `MediaRelation` and stores it as `rawRelations`
- **2.** `[If]` `!rawRelations || rawRelations.length === 0`
  - **2.1.** `[Return]`  — `[]`
- **3.** `[Sequence]` Define `relationMap`
  ```typescript
  const relationMap = new Map< string, { id: number sourceType: string sourceId: number targetType: string ...
  ```
- **4.** `[Loop]` Iterate `const rel` over `rawRelations`
  - **4.1.** `[If]` `rel.sourceType === sourceType && rel.sourceId === sourceId`
    - **4.1.1.** `[Sequence]` Define `key`
      ```typescript
      const key = `${rel.targetType}:${rel.targetId}:${rel.type}`
      ```
    - **4.1.2.** `[Sequence]` Calls `relationMap.set`
  - **4.2.** `[Else]` Otherwise
    - **4.2.1.** `[If]` `rel.targetType === sourceType && rel.targetId === sourceId`
      - **4.2.1.1.** `[Sequence]` Calls `invertRelationType` and stores result as `invertedType`
      - **4.2.1.2.** `[Sequence]` Define `key`
        ```typescript
        const key = `${rel.sourceType}:${rel.sourceId}:${invertedType}`
        ```
      - **4.2.1.3.** `[If]` `!relationMap.has(key)`
        - **4.2.1.3.1.** `[Sequence]` Calls `relationMap.set`
- **5.** `[Sequence]` Calls `Array.from` and stores result as `relations`
- **6.** `[If]` `relations.length === 0`
  - **6.1.** `[Return]`  — `[]`
- **7.** `[Sequence]` Define `animeIds`, `mangaIds`, `movieIds`, `tvIds`, `gameIds`, `bookIds`, `musicIds`
  ```typescript
  const animeIds: number[] = []
  const mangaIds: number[] = []
  const movieIds: number[] = []
  const tvIds: number[] = []
  const gameIds: number[] = []
  const bookIds: number[] = []
  const musicIds: number[] = []
  ```
- **8.** `[Loop]` Iterate `const r` over `relations`
  - **8.1.** `[Switch]` Branch on `r.targetType`
    - **8.1.1.** `[Case]` Case `'ANIME'`
    - **8.1.2.** `[Case]` Case `'MANGA'`
    - **8.1.3.** `[Case]` Case `'MOVIE'`
    - **8.1.4.** `[Case]` Case `'TV'`
    - **8.1.5.** `[Case]` Case `'GAME'`
    - **8.1.6.** `[Case]` Case `'BOOK'`
    - **8.1.7.** `[Case]` Case `'MUSIC'`
    - **8.1.8.** `[Case]` Case `'MUSIC_TRACK'`
    - **8.1.9.** `[Case]` Case `'MUSIC_ALBUM'`
- **9.** `[Sequence]` Define `targetMap`, `queries`
  ```typescript
  const targetMap = new Map<string, HydratedMediaTarget>()
  const queries: PromiseLike<void>[] = []
  ```
- **10.** `[If]` `animeIds.length > 0`
- **11.** `[If]` `mangaIds.length > 0`
- **12.** `[If]` `movieIds.length > 0`
- **13.** `[If]` `tvIds.length > 0`
- **14.** `[If]` `gameIds.length > 0`
- **15.** `[If]` `bookIds.length > 0`
- **16.** `[If]` `musicIds.length > 0`
  - **16.1.** `[Sequence]` Calls `Array.from` and stores result as `uniqueMusicIds`
- **17.** `[Sequence]` Calls `Promise.all`
- **18.** `[Return]`  — `relations.map((r) => ({ ...r, target: targetMap.get(`${r.targetType}:${r.targetId}`) ?? null, }))`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- _None_

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `and`, `or`, `MediaType`

### Called By / Imported By
- [apps/borealis/anime/anime.serv.ts](../anime/anime.serv.md) ([[apps/borealis/anime/anime.serv]]) — `fetchMediaRelations`
- [apps/borealis/books/books.serv.ts](../books/books.serv.md) ([[apps/borealis/books/books.serv]]) — `fetchMediaRelations`
- [apps/borealis/games/games.serv.ts](../games/games.serv.md) ([[apps/borealis/games/games.serv]]) — `fetchMediaRelations`
- [apps/borealis/manga/manga.serv.ts](../manga/manga.serv.md) ([[apps/borealis/manga/manga.serv]]) — `fetchMediaRelations`
- [apps/borealis/movies/movies.serv.ts](../movies/movies.serv.md) ([[apps/borealis/movies/movies.serv]]) — `fetchMediaRelations`
- [apps/borealis/music/music.serv.ts](../music/music.serv.md) ([[apps/borealis/music/music.serv]]) — `fetchMediaRelations`
- [apps/borealis/tv/tv.serv.ts](../tv/tv.serv.md) ([[apps/borealis/tv/tv.serv]]) — `fetchMediaRelations`
