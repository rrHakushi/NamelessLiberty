# media-overview.helper.ts

- **Source**: [`apps/borealis/_shared/media-overview.helper.ts`](../../../../../../../apps/elysia/src/apps/borealis/_shared/media-overview.helper.ts)
- **Layer / Role**: Module / Helper

## Exported Types, Methods & Algorithms

### `function fetchTopCharacters` (L4)

Top 16 characters for a media overview (MAIN first).

- **1.** `[Sequence]` Define `BATCH`, `seen`, `result`
  ```typescript
  const BATCH = 100
  const seen = new Set<number>()
  const result: any[] = []
  ```
- **2.** `[Sequence]` Database `query` on `MediaCharacter` and stores it as `collect`
- **3.** `[Sequence]` Calls `collect`
- **4.** `[If]` `result.length < limit`
  - **4.1.** `[Sequence]` Calls `collect`
- **5.** `[Return]`  — `result.map((c: any) => ({ id: c.id, mediaId: c.mediaId, mediaType: c.mediaType, characterId: c.characterId, actorId: c.actorId ?? null, role: c.role, ...)`

### `function pick` (L74)

Pick listed keys from a record, defaulting missing values to null.

- **1.** `[Sequence]` Define `out`
  ```typescript
  const out: Record<string, any> = {}
  ```
- **2.** `[Loop]` Iterate `const k` over `keys`
  - **2.1.** `[Sequence]` Assign `out[k]`
    ```typescript
    out[k] = src?.[k] ?? null
    ```
- **3.** `[Return]`  — `out`

### `function flattenGenres` (L84)

- **1.** `[Return]`  — `rows || [].flatMap((g: any) => unwrap(g.genre)).map((ge: any) => ({ id: ge.id, name: ge.name }))`

### `function flattenTags` (L88)

- **1.** `[Return]`  — `rows || [].flatMap((t: any) => unwrap(t.tag)).map((te: any) => ({ id: te.id, name: te.name }))`

### `function similarItem` (L93)

Normalised similar/catalog item (spec fields only).

- **1.** `[Return]` 
  ```json
  {
    "id": "<c.id>",
    "titlePrimary": "<c.titlePrimary>",
    "titleSecondary": "<c.titleSecondary ?? null>",
    "titleNative": "<c.titleNative ?? null>",
    "coverImage": "<c.coverImage ?? null>",
    "bannerImage": "<c.bannerImage ?? null>",
    "averageScore": "<c.averageScore ?? null>",
    "format": "<format ? String(format) : null>",
    "status": "<c.status ? String(c.status) : null>",
    "startDateYear": "<year ?? null>",
    "description": "<c.description ?? null>",
    "genres": "<c.genres>",
    "tags": "<c.tags>"
  }
  ```

### `function imageSource` (L112)

Read a key out of a Jsonb `images` blob (object keyed by provider).

- **1.** `[If]` `!images || typeofimages !== 'object'`
  - **1.1.** `[Return]`  — `null`
- **2.** `[Return]`  — `images[key] ?? null`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- _None_

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `and`, `MediaType`

### Called By / Imported By
- [apps/borealis/anime/anime.serv.ts](../anime/anime.serv.md) ([[apps/borealis/anime/anime.serv]]) — `imageSource`, `fetchTopCharacters`
- [apps/borealis/books/books.serv.ts](../books/books.serv.md) ([[apps/borealis/books/books.serv]]) — `fetchTopCharacters`, `flattenGenres`, `flattenTags`, `imageSource`
- [apps/borealis/games/games.serv.ts](../games/games.serv.md) ([[apps/borealis/games/games.serv]]) — `fetchTopCharacters`, `pick`, `flattenGenres`, `flattenTags`, `imageSource`
- [apps/borealis/manga/manga.serv.ts](../manga/manga.serv.md) ([[apps/borealis/manga/manga.serv]]) — `fetchTopCharacters`, `pick`, `flattenGenres`, `flattenTags`, `imageSource`
- [apps/borealis/movies/movies.serv.ts](../movies/movies.serv.md) ([[apps/borealis/movies/movies.serv]]) — `fetchTopCharacters`, `pick`, `flattenGenres`, `flattenTags`, `imageSource`
- [apps/borealis/music/music.serv.ts](../music/music.serv.md) ([[apps/borealis/music/music.serv]]) — `pick`, `flattenGenres`, `flattenTags`, `imageSource`
- [apps/borealis/tv/tv.serv.ts](../tv/tv.serv.md) ([[apps/borealis/tv/tv.serv]]) — `fetchTopCharacters`, `pick`, `flattenGenres`, `flattenTags`, `imageSource`
