# media-preview.syncer.ts

- **Source**: [`apps/borealis/sync/media-preview.syncer.ts`](../../../../../../../apps/elysia/src/apps/borealis/sync/media-preview.syncer.ts)
- **Layer / Role**: Media Syncer
- **Inheritance**: `MediaPreviewSyncer extends BaseMediaSyncer`

## Exported Types, Methods & Algorithms

### `interface PreviewResult` (L13)

### `function mapAnimeFormat` (L31)

- **1.** `[Sequence]` Define `map`
  ```typescript
  const map: Record<string, string> = { TV: 'TV', TV_SHORT: 'TV_SHORT', MOVIE: 'MOVIE', SPECIAL: 'SPECIAL', OVA: 'OVA', ONA: 'ONA', ...
  ```
- **2.** `[Return]`  — `fmt && map[fmt.toUpperCase()] || 'UNKNOWN'`

### `function mapMangaFormat` (L44)

- **1.** `[Sequence]` Define `map`
  ```typescript
  const map: Record<string, string> = { MANGA: 'MANGA', NOVEL: 'NOVEL', LIGHT_NOVEL: 'LIGHT_NOVEL', ONE_SHOT: 'ONE_SHOT', MANHWA: 'MANHWA', MANHUA: 'MANHUA', ...
  ```
- **2.** `[Return]`  — `fmt && map[fmt.toUpperCase()] || 'UNKNOWN'`

### `function mapTvStatus` (L56)

- **1.** `[Return]`  — `st ? normalizeMediaStatus(st) : 'UNKNOWN'`

### `function mapMovieStatus` (L60)

- **1.** `[Sequence]` Define `mapped`
  ```typescript
  const mapped = st ? normalizeMediaStatus(st) : 'UNKNOWN'
  ```
- **2.** `[Return]`  — `mapped === 'UNKNOWN' ? 'RELEASED' : mapped`

### `class MediaPreviewSyncer` extends `BaseMediaSyncer` (L65)

#### `upsertAnimeSearchPreview(item)`: `Promise<PreviewResult>` (L69)
Upserts lightweight search preview stub for Anime.

- **1.** `[Sequence]` Define `titlePrimary`, `titleSecondary`, `titleNative`, `coverImage`
  ```typescript
  const titlePrimary = item.title.english || item.title.userPreferred || item.title.romaji || 'Unknown Anime'
  const titleSecondary = item.title.romaji || item.title.english || null
  const titleNative = item.title.native || null
  const coverImage = item.coverImage?.extraLarge || item.coverImage?.large || item.coverImage?.medium || null
  ```
- **2.** `[Sequence]` Calls `mapAnimeFormat` and stores result as `format`
- **3.** `[Sequence]` Define `seasonSeason`
  ```typescript
  const seasonSeason = ( item.season && ['WINTER', 'SPRING', 'SUMMER', 'FALL'].includes(item.season) ? item.season : 'UNKNOWN' ) as any
  ```
- **4.** `[Sequence]` Database `first` on `Anime` and stores it as `existing`
- **5.** `[If]` `existing`
  - **5.1.** `[Sequence]` Calls `evaluateRecordFreshness` and stores result as `freshness`
  - **5.2.** `[Return]` 
    ```json
    {
      "...existing": "...",
      "mediaType": "anime",
      "externalId": "<item.id>",
      "queuedForFetch": "<!freshness.isFresh>"
    }
    ```
- **6.** `[Sequence]` Database `create` on `Anime` and stores it as `created`
- **7.** `[Return]` 
  ```json
  {
    "...created": "...",
    "mediaType": "anime",
    "externalId": "<item.id>",
    "queuedForFetch": true
  }
  ```

#### `upsertMangaSearchPreview(item)`: `Promise<PreviewResult>` (L143)
Upserts lightweight search preview stub for Manga.

- **1.** `[Sequence]` Define `titlePrimary`, `titleSecondary`, `titleNative`, `coverImage`
  ```typescript
  const titlePrimary = item.title.english || item.title.userPreferred || item.title.romaji || 'Unknown Manga'
  const titleSecondary = item.title.romaji || item.title.english || null
  const titleNative = item.title.native || null
  const coverImage = item.coverImage?.extraLarge || item.coverImage?.large || item.coverImage?.medium || null
  ```
- **2.** `[Sequence]` Calls `mapMangaFormat` and stores result as `format`
- **3.** `[Sequence]` Database `first` on `Manga` and stores it as `existing`
- **4.** `[If]` `existing`
  - **4.1.** `[Sequence]` Calls `evaluateRecordFreshness` and stores result as `freshness`
  - **4.2.** `[Return]` 
    ```json
    {
      "...existing": "...",
      "mediaType": "manga",
      "externalId": "<item.id>",
      "queuedForFetch": "<!freshness.isFresh>"
    }
    ```
- **5.** `[Sequence]` Database `create` on `Manga` and stores it as `created`
- **6.** `[Return]` 
  ```json
  {
    "...created": "...",
    "mediaType": "manga",
    "externalId": "<item.id>",
    "queuedForFetch": true
  }
  ```

#### `upsertTvSearchPreview(item)`: `Promise<PreviewResult>` (L210)
Upserts lightweight search preview stub for TV series.

- **1.** `[Sequence]` Define `rawId`, `tvdbId`, `engTitle`, `engOverview`, `titlePrimary`, `titleSecondary`, `titleNative`
  ```typescript
  const rawId = item.tvdb_id || item.id || item.objectID
  const tvdbId = typeof rawId === 'number' ? rawId : parseInt(String(rawId).replace(/\D/g, ''), 10)
  const engTitle = item.translations?.eng?.trim()
  const engOverview = item.overviews?.eng?.trim()
  const titlePrimary = engTitle || item.name || 'Unknown TV Series'
  const titleSecondary = engTitle && engTitle !== item.name ? item.name : undefined
  const titleNative = item.primary_language && ['kor', 'jpn', 'zho', 'zhtw', 'ko', 'ja', 'zh'].includes(item.primary_language.toLowerCase()) ? item.name : undefined
  ```
- **2.** `[Sequence]` Calls `normalizeTvdbImageUrl` and stores result as `coverImage`
- **3.** `[Sequence]` Define `firstAiredYear`
  ```typescript
  const firstAiredYear = item.year ? parseInt(String(item.year).slice(0, 4), 10) : undefined
  ```
- **4.** `[Sequence]` Calls `mapTvStatus` and stores result as `status`
- **5.** `[Sequence]` Define `description`
  ```typescript
  const description = engOverview || item.overview || undefined
  ```
- **6.** `[If]` `tvdbId`
  - **6.1.** `[Sequence]` Database `first` on `Tv` and stores it as `existing`
  - **6.2.** `[If]` `existing`
    - **6.2.1.** `[Sequence]` Calls `evaluateRecordFreshness` and stores result as `freshness`
    - **6.2.2.** `[Return]` 
      ```json
      {
        "...existing": "...",
        "mediaType": "tv",
        "releaseDateYear": "<existing.firstAiredYear>",
        "externalId": "<tvdbId>",
        "queuedForFetch": "<!freshness.isFresh>"
      }
      ```
- **7.** `[Sequence]` Database `create` on `Tv` and stores it as `created`
- **8.** `[Return]` 
  ```json
  {
    "...created": "...",
    "mediaType": "tv",
    "releaseDateYear": "<created.firstAiredYear>",
    "externalId": "<tvdbId>",
    "queuedForFetch": true
  }
  ```

#### `upsertMovieSearchPreview(item)`: `Promise<PreviewResult>` (L293)
Upserts lightweight search preview stub for Movie.

- **1.** `[Sequence]` Define `rawId`, `tvdbId`, `engTitle`, `engOverview`, `titlePrimary`, `titleSecondary`, `titleNative`
  ```typescript
  const rawId = item.tvdb_id || item.id || item.objectID
  const tvdbId = typeof rawId === 'number' ? rawId : parseInt(String(rawId).replace(/\D/g, ''), 10)
  const engTitle = item.translations?.eng?.trim()
  const engOverview = item.overviews?.eng?.trim()
  const titlePrimary = engTitle || item.name || 'Unknown Movie'
  const titleSecondary = engTitle && engTitle !== item.name ? item.name : undefined
  const titleNative = item.primary_language && ['kor', 'jpn', 'zho', 'zhtw', 'ko', 'ja', 'zh'].includes(item.primary_language.toLowerCase()) ? item.name : undefined
  ```
- **2.** `[Sequence]` Calls `normalizeTvdbImageUrl` and stores result as `coverImage`
- **3.** `[Sequence]` Define `releaseDateYear`
  ```typescript
  const releaseDateYear = item.year ? parseInt(String(item.year).slice(0, 4), 10) : undefined
  ```
- **4.** `[Sequence]` Calls `mapMovieStatus` and stores result as `status`
- **5.** `[Sequence]` Define `description`
  ```typescript
  const description = engOverview || item.overview || undefined
  ```
- **6.** `[If]` `tvdbId`
  - **6.1.** `[Sequence]` Database `first` on `Movie` and stores it as `existing`
  - **6.2.** `[If]` `existing`
    - **6.2.1.** `[Sequence]` Calls `evaluateRecordFreshness` and stores result as `freshness`
    - **6.2.2.** `[Return]` 
      ```json
      {
        "...existing": "...",
        "mediaType": "movie",
        "externalId": "<tvdbId>",
        "queuedForFetch": "<!freshness.isFresh>"
      }
      ```
- **7.** `[Sequence]` Database `create` on `Movie` and stores it as `created`
- **8.** `[Return]` 
  ```json
  {
    "...created": "...",
    "mediaType": "movie",
    "externalId": "<tvdbId>",
    "queuedForFetch": true
  }
  ```

#### `upsertBookSearchPreview(item)`: `Promise<PreviewResult>` (L373)
Upserts lightweight search preview stub for Book.

- **1.** `[Sequence]` Define `info`, `titlePrimary`, `titleSecondary`, `coverImage`
  ```typescript
  const info = item.volumeInfo || {}
  const titlePrimary = info.title || 'Unknown Book'
  const titleSecondary = info.subtitle || null
  let coverImage = info.imageLinks?.large || info.imageLinks?.medium || info.imageLinks?.thumbnail || null
  ```
- **2.** `[If]` `coverImage && coverImage.startsWith('http://')`
  - **2.1.** `[Sequence]` Assign `coverImage`
    ```typescript
    coverImage = coverImage.replace('http://', 'https://')
    ```
- **3.** `[Sequence]` Define `authors`, `releaseDateYear`
  ```typescript
  const authors = info.authors || []
  let releaseDateYear: number | undefined
  ```
- **4.** `[If]` `info.publishedDate`
  - **4.1.** `[Sequence]` Calls `parseInt` and stores result as `yr`
  - **4.2.** `[If]` `!isNaN(yr)`
    - **4.2.1.** `[Sequence]` Assign `releaseDateYear`
      ```typescript
      releaseDateYear = yr
      ```
- **5.** `[Sequence]` Database `first` on `Book` and stores it as `existing`
- **6.** `[If]` `existing`
  - **6.1.** `[Sequence]` Calls `evaluateRecordFreshness` and stores result as `freshness`
  - **6.2.** `[Return]` 
    ```json
    {
      "...existing": "...",
      "mediaType": "book",
      "externalId": "<item.id>",
      "queuedForFetch": "<!freshness.isFresh>"
    }
    ```
- **7.** `[Sequence]` Database `create` on `Book` and stores it as `created`
- **8.** `[Return]` 
  ```json
  {
    "...created": "...",
    "mediaType": "book",
    "externalId": "<item.id>",
    "queuedForFetch": true
  }
  ```

#### `upsertGameSearchPreview(item)`: `Promise<PreviewResult>` (L449)
Upserts lightweight search preview stub for Game.

- **1.** `[Sequence]` Define `titlePrimary`, `coverImage`, `releaseDateYear`
  ```typescript
  const titlePrimary = item.name || 'Unknown Game'
  const coverImage = item.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${item.cover.image_id}.jpg` : null
  let releaseDateYear: number | undefined
  ```
- **2.** `[If]` `item.first_release_date`
  - **2.1.** `[Sequence]` Assign `releaseDateYear`
    ```typescript
    releaseDateYear = new Date(item.first_release_date * 1000).getUTCFullYear()
    ```
- **3.** `[Sequence]` Database `first` on `Game` and stores it as `existing`
- **4.** `[If]` `existing`
  - **4.1.** `[Sequence]` Calls `evaluateRecordFreshness` and stores result as `freshness`
  - **4.2.** `[Return]` 
    ```json
    {
      "...existing": "...",
      "mediaType": "game",
      "externalId": "<item.id>",
      "queuedForFetch": "<!freshness.isFresh>"
    }
    ```
- **5.** `[Sequence]` Database `create` on `Game` and stores it as `created`
- **6.** `[Return]` 
  ```json
  {
    "...created": "...",
    "mediaType": "game",
    "externalId": "<item.id>",
    "queuedForFetch": true
  }
  ```

#### `upsertMusicTrackSearchPreview(item)`: `Promise<PreviewResult>` (L514)
Upserts lightweight search preview stub for Music Track.

- **1.** `[Sequence]` Define `titlePrimary`, `artist`
  ```typescript
  const titlePrimary = item.title?.trim() || 'Unknown Track'
  const artist = item.artist?.name?.trim() || null
  ```
- **2.** `[Sequence]` Calls `String` and stores result as `deezerIdStr`
- **3.** `[Sequence]` Define `coverImage`
  ```typescript
  const coverImage = item.album?.cover_big || item.album?.cover_medium || item.album?.cover || null
  ```
- **4.** `[Sequence]` Database `first` on `Music` and stores it as `existing`
- **5.** `[If]` `existing`
  - **5.1.** `[Sequence]` Calls `evaluateRecordFreshness` and stores result as `freshness`
  - **5.2.** `[Return]` 
    ```json
    {
      "...existing": "...",
      "mediaType": "music",
      "itemType": "TRACK",
      "type": "TRACK",
      "artist": "<existing.artistName>",
      "externalId": "<item.id>",
      "queuedForFetch": "<!freshness.isFresh>"
    }
    ```
- **6.** `[Sequence]` Database `upsert` on `Music` and stores it as `created`
- **7.** `[Return]` 
  ```json
  {
    "...created": "...",
    "mediaType": "music",
    "itemType": "TRACK",
    "type": "TRACK",
    "artist": "<created.artistName>",
    "externalId": "<item.id>",
    "queuedForFetch": true
  }
  ```

#### `upsertMusicAlbumSearchPreview(item)`: `Promise<PreviewResult>` (L588)
Upserts lightweight search preview stub for Music Album.

- **1.** `[Sequence]` Define `titlePrimary`, `artist`
  ```typescript
  const titlePrimary = item.title?.trim() || 'Unknown Album'
  const artist = item.artist?.name?.trim() || null
  ```
- **2.** `[Sequence]` Calls `String` and stores result as `deezerIdStr`
- **3.** `[Sequence]` Define `coverImage`, `releaseDateYear`
  ```typescript
  const coverImage = item.cover_big || item.cover_medium || item.cover || null
  let releaseDateYear: number | undefined
  ```
- **4.** `[If]` `item.release_date`
  - **4.1.** `[Sequence]` Calls `parseInt` and stores result as `yr`
  - **4.2.** `[If]` `!isNaN(yr)`
    - **4.2.1.** `[Sequence]` Assign `releaseDateYear`
      ```typescript
      releaseDateYear = yr
      ```
- **5.** `[Sequence]` Database `first` on `Music` and stores it as `existing`
- **6.** `[If]` `existing`
  - **6.1.** `[Sequence]` Calls `evaluateRecordFreshness` and stores result as `freshness`
  - **6.2.** `[Return]` 
    ```json
    {
      "...existing": "...",
      "mediaType": "music",
      "itemType": "ALBUM",
      "type": "ALBUM",
      "artist": "<existing.artistName>",
      "releaseDateYear": "<releaseDateYear>",
      "externalId": "<item.id>",
      "queuedForFetch": "<!freshness.isFresh>"
    }
    ```
- **7.** `[Sequence]` Database `upsert` on `Music` and stores it as `created`
- **8.** `[Return]` 
  ```json
  {
    "...created": "...",
    "mediaType": "music",
    "itemType": "ALBUM",
    "type": "ALBUM",
    "artist": "<created.artistName>",
    "releaseDateYear": "<releaseDateYear>",
    "externalId": "<item.id>",
    "queuedForFetch": true
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/borealis/_shared/base-syncer.ts](../_shared/base-syncer.md) ([[apps/borealis/_shared/base-syncer]]) — `BaseMediaSyncer`
- [apps/borealis/providers/tvdb.provider.ts](../providers/tvdb.provider.md) ([[apps/borealis/providers/tvdb.provider]]) — `normalizeTvdbImageUrl`, `TvdbSearchItem`
- [apps/borealis/providers/anilist.provider.ts](../providers/anilist.provider.md) ([[apps/borealis/providers/anilist.provider]]) — `AniListAnimeSearchPreview`, `AniListMangaSearchPreview`
- [apps/borealis/providers/google-books.provider.ts](../providers/google-books.provider.md) ([[apps/borealis/providers/google-books.provider]]) — `GoogleBookPayload`
- [apps/borealis/providers/igdb.provider.ts](../providers/igdb.provider.md) ([[apps/borealis/providers/igdb.provider]]) — `IgdbSearchPreview`
- [apps/borealis/providers/deezer.provider.ts](../providers/deezer.provider.md) ([[apps/borealis/providers/deezer.provider]]) — `DeezerTrackPayload`, `DeezerAlbumPayload`
- [apps/borealis/_shared/freshness.ts](../_shared/freshness.md) ([[apps/borealis/_shared/freshness]]) — `evaluateRecordFreshness`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `normalizeMediaStatus`
- `@NamelessLiberty/logger` — `LogFactory`, `c`

### Called By / Imported By
- [apps/borealis/search/external-search.serv.ts](../search/external-search.serv.md) ([[apps/borealis/search/external-search.serv]]) — `MediaPreviewSyncer`, `PreviewResult`
- [apps/borealis/search/search.serv.ts](../search/search.serv.md) ([[apps/borealis/search/search.serv]]) — `PreviewResult`
- [apps/borealis/sync/media-entity.syncer.ts](./media-entity.syncer.md) ([[apps/borealis/sync/media-entity.syncer]]) — `MediaPreviewSyncer`, `mapAnimeFormat`, `mapMangaFormat`, `mapMovieStatus`, `mapTvStatus`, `PreviewResult`
