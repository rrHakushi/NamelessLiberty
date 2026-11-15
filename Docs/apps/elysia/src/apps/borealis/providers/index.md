# index.ts

- **Source**: [`apps/borealis/providers/index.ts`](../../../../../../../apps/elysia/src/apps/borealis/providers/index.ts)
- **Layer / Role**: Module / Helper

## Exported Types, Methods & Algorithms

### `const anilistProvider` (L15)

### `const tvdbProvider` (L16)

### `const igdbProvider` (L17)

### `const googleBooksProvider` (L18)

### `const deezerProvider` (L19)

### `const animeMappingProvider` (L20)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/borealis/providers/anilist.provider.ts](./anilist.provider.md) ([[apps/borealis/providers/anilist.provider]]) — `AniListProvider`
- [apps/borealis/providers/tvdb.provider.ts](./tvdb.provider.md) ([[apps/borealis/providers/tvdb.provider]]) — `TheTVDBProvider`
- [apps/borealis/providers/igdb.provider.ts](./igdb.provider.md) ([[apps/borealis/providers/igdb.provider]]) — `IGDBProvider`
- [apps/borealis/providers/google-books.provider.ts](./google-books.provider.md) ([[apps/borealis/providers/google-books.provider]]) — `GoogleBooksProvider`
- [apps/borealis/providers/deezer.provider.ts](./deezer.provider.md) ([[apps/borealis/providers/deezer.provider]]) — `DeezerProvider`
- [apps/borealis/providers/anime-mapping.provider.ts](./anime-mapping.provider.md) ([[apps/borealis/providers/anime-mapping.provider]]) — `AnimeMappingProvider`

### External / Workspace Packages
- _None_

### Called By / Imported By
- [apps/borealis/search/external-search.serv.ts](../search/external-search.serv.md) ([[apps/borealis/search/external-search.serv]]) — `anilistProvider`, `tvdbProvider`, `igdbProvider`, `googleBooksProvider`, `deezerProvider`
- [apps/borealis/sync/media-entity.syncer.ts](../sync/media-entity.syncer.md) ([[apps/borealis/sync/media-entity.syncer]]) — `anilistProvider`, `AniListAnimePayload`, `AniListMangaPayload`, `tvdbProvider`, `normalizeTvdbImageUrl`, `TvdbCharacter`, `TvdbEpisode`, `igdbProvider`, `googleBooksProvider`, `deezerProvider`, `animeMappingProvider`
