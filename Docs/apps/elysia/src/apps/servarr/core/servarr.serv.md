# servarr.serv.ts

- **Source**: [`apps/servarr/core/servarr.serv.ts`](../../../../../../../apps/elysia/src/apps/servarr/core/servarr.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `ServarrServ extends BaseService`

## Exported Types, Methods & Algorithms

### `type ServarrApp` (L23)

### `interface ServarrConnectionContext` (L25)

### `interface SonarrAnimeConfig` (L34)

### `interface SonarrTvConfig` (L42)

### `interface RadarrMovieConfig` (L49)

### `interface RadarrAnimeConfig` (L56)

### `function getSourceExternalId` (L75)

- **1.** `[If]` `!Array.isArray(sources)`
  - **1.1.** `[Return]`  — `undefined`
- **2.** `[Sequence]` Calls `sources.find` and stores result as `match`
- **3.** `[Return]`  — `match?.externalId ? String(match.externalId) : undefined`

### `function resolveAnimeTvdbId` (L88)

- **1.** `[If]` `anime.tvDBId && anime.tvDBId > 0`
  - **1.1.** `[Return]`  — `anime.tvDBId`
- **2.** `[Sequence]` Define `rawId`
  ```typescript
  const rawId = getSourceExternalId(anime.sources, 'TVDB') ?? getSourceExternalId(anime.sources, 'THETVDB')
  ```
- **3.** `[If]` `rawId`
  - **3.1.** `[Sequence]` Calls `parseInt` and stores result as `parsed`
  - **3.2.** `[If]` `!isNaN(parsed) && parsed > 0`
    - **3.2.1.** `[Return]`  — `parsed`
- **4.** `[Return]`  — `undefined`

### `function resolveAnimeImdbId` (L103)

- **1.** `[Return]`  — `getSourceExternalId(anime.sources, 'IMDB')`

### `function resolveAnimeTmdbId` (L109)

- **1.** `[Sequence]` Calls `getSourceExternalId` and stores result as `rawId`
- **2.** `[If]` `rawId`
  - **2.1.** `[Sequence]` Calls `parseInt` and stores result as `parsed`
  - **2.2.** `[If]` `!isNaN(parsed) && parsed > 0`
    - **2.2.1.** `[Return]`  — `parsed`
- **3.** `[Return]`  — `undefined`

### `function resolveTvTvdbId` (L120)

- **1.** `[If]` `tv.tvDBId && tv.tvDBId > 0`
  - **1.1.** `[Return]`  — `tv.tvDBId`
- **2.** `[Sequence]` Define `rawId`
  ```typescript
  const rawId = getSourceExternalId(tv.sources, 'TVDB') ?? getSourceExternalId(tv.sources, 'THETVDB')
  ```
- **3.** `[If]` `rawId`
  - **3.1.** `[Sequence]` Calls `parseInt` and stores result as `parsed`
  - **3.2.** `[If]` `!isNaN(parsed) && parsed > 0`
    - **3.2.1.** `[Return]`  — `parsed`
- **4.** `[Return]`  — `undefined`

### `function resolveMovieTmdbId` (L135)

- **1.** `[If]` `movie.tmdbId && movie.tmdbId > 0`
  - **1.1.** `[Return]`  — `movie.tmdbId`
- **2.** `[Sequence]` Calls `getSourceExternalId` and stores result as `rawId`
- **3.** `[If]` `rawId`
  - **3.1.** `[Sequence]` Calls `parseInt` and stores result as `parsed`
  - **3.2.** `[If]` `!isNaN(parsed) && parsed > 0`
    - **3.2.1.** `[Return]`  — `parsed`
- **4.** `[Return]`  — `undefined`

### `function isSonarrEnabled` (L148)

- **1.** `[Sequence]` Define `servarr`
  ```typescript
  const servarr = (userSettings as any)?.servarr
  ```
- **2.** `[If]` `!servarr`
  - **2.1.** `[Return]`  — `true`
- **3.** `[If]` `typeofservarr.sonarrEnabled === 'boolean'`
  - **3.1.** `[Return]`  — `servarr.sonarrEnabled`
- **4.** `[If]` `typeofservarr.sonarr?.enabled === 'boolean'`
  - **4.1.** `[Return]`  — `servarr.sonarr.enabled`
- **5.** `[Return]`  — `true`

### `function isRadarrEnabled` (L157)

- **1.** `[Sequence]` Define `servarr`
  ```typescript
  const servarr = (userSettings as any)?.servarr
  ```
- **2.** `[If]` `!servarr`
  - **2.1.** `[Return]`  — `true`
- **3.** `[If]` `typeofservarr.radarrEnabled === 'boolean'`
  - **3.1.** `[Return]`  — `servarr.radarrEnabled`
- **4.** `[If]` `typeofservarr.radarr?.enabled === 'boolean'`
  - **4.1.** `[Return]`  — `servarr.radarr.enabled`
- **5.** `[Return]`  — `true`

### `function parseSonarrAnimeConfig` (L166)

- **1.** `[Sequence]` Define `servarr`, `cfg`
  ```typescript
  const servarr = (userSettings as any)?.servarr
  const cfg = servarr?.sonarrAnime ?? servarr?.sonarr?.anime
  ```
- **2.** `[Return]` 
  ```json
  {
    "enabled": "<cfg?.enabled ?? true>",
    "monitored": "<cfg?.monitored ?? true>",
    "listStatuses": "<listStatusesOr(cfg?.listStatuses, ['PLANNED', 'IN_PROGRESS'])>",
    "animeStatuses": "<mediaStatusesOr(cfg?.animeStatuses, ['RELEASED', 'RELEASING'])>",
    "animeFormats": "<Array.isArray(cfg?.animeFormats) && cfg.animeFormats.length > 0 ? cfg.animeFormats : (['TV', 'TV_SHORT'] as AnimeFormat[])>"
  }
  ```

### `function parseSonarrTvConfig` (L183)

- **1.** `[Sequence]` Define `servarr`, `cfg`
  ```typescript
  const servarr = (userSettings as any)?.servarr
  const cfg = servarr?.sonarrTv ?? servarr?.sonarr?.tv
  ```
- **2.** `[Return]` 
  ```json
  {
    "enabled": "<cfg?.enabled ?? true>",
    "monitored": "<cfg?.monitored ?? true>",
    "listStatuses": "<listStatusesOr(cfg?.listStatuses, ['PLANNED', 'IN_PROGRESS'])>",
    "tvStatuses": "<mediaStatusesOr(cfg?.tvStatuses, ['RELEASING', 'RELEASED'])>"
  }
  ```

### `function parseRadarrMovieConfig` (L194)

- **1.** `[Sequence]` Define `servarr`, `cfg`
  ```typescript
  const servarr = (userSettings as any)?.servarr
  const cfg = servarr?.radarrMovie ?? servarr?.radarr?.movie
  ```
- **2.** `[Return]` 
  ```json
  {
    "enabled": "<cfg?.enabled ?? true>",
    "monitored": "<cfg?.monitored ?? true>",
    "listStatuses": "<listStatusesOr(cfg?.listStatuses, ['PLANNED'])>",
    "movieStatuses": "<mediaStatusesOr(cfg?.movieStatuses, ['RELEASED'])>"
  }
  ```

### `function parseRadarrAnimeConfig` (L207)

- **1.** `[Sequence]` Define `servarr`, `cfg`
  ```typescript
  const servarr = (userSettings as any)?.servarr
  const cfg = servarr?.radarrAnime ?? servarr?.radarr?.anime
  ```
- **2.** `[Return]` 
  ```json
  {
    "enabled": "<cfg?.enabled ?? true>",
    "monitored": "<cfg?.monitored ?? true>",
    "listStatuses": "<listStatusesOr(cfg?.listStatuses, ['PLANNED'])>",
    "animeStatuses": "<mediaStatusesOr(cfg?.animeStatuses, ['RELEASED', 'RELEASING'])>",
    "animeMovieFormats": "<Array.isArray(cfg?.animeMovieFormats) && cfg.animeMovieFormats.length > 0 ? cfg.animeMovieFormats : (['MOVIE'] as AnimeFormat[])>"
  }
  ```

### `function findCoverUrl` (L224)

- **1.** `[If]` `!Array.isArray(images)`
  - **1.1.** `[Return]`  — `null`
- **2.** `[Sequence]` Calls `images.find` and stores result as `match`
- **3.** `[Return]`  — `match?.url || match?.remoteUrl || null`

### `function rewriteServarrImages` (L240)

Rewrites *arr `images[]` paths to authenticated Elysia proxy routes (`/elysia/servarr/:app/mediacover/:id/:filename`) so browsers never talk directly to the upstream *arr host.

- **1.** `[If]` `!item || !Array.isArray(item.images) || !item.id`
  - **1.1.** `[Return]`  — `item`
- **2.** `[Sequence]` Define `images`
  ```typescript
  const images = item.images.map((img: any) => { const rawUrl: string | undefined = img?.url let proxiedUrl = rawUrl if (rawUrl && typeof rawUrl === 'string') { const cleanPath = rawUrl.split('?')[0] ?? '' const filePart = cleanPath.split('/').pop() if (filePart && /\.(jpg|jpeg|png|gif|webp)$/i.test(filePart)) { ...)
  ```
- **3.** `[Return]` 
  ```json
  {
    "...item": "...",
    "images": "<images>"
  }
  ```

### `function formatServarrError` (L265)

- **1.** `[If]` `err instanceof ConnectionError`
  - **1.1.** `[If]` `typeoferr.rawError === 'string' && err.rawError.trim().startsWith('[')`
    - **1.1.1.** `[Try]` Try block
      - **1.1.1.1.** `[Sequence]` Define `parsed`
        ```typescript
        const parsed = JSON.parse(err.rawError) as Array<{ propertyName?: string errorMessage?: string }>
        ```
      - **1.1.1.2.** `[If]` `Array.isArray(parsed) && parsed.length > 0`
        - **1.1.1.2.1.** `[Return]`  — `parsed.map((e) => e.propertyName ? `${e.propertyName}: ${e.errorMessage}` : e.errorMessage).filter(Boolean).join('; ')`
    - **1.1.2.** `[Catch]` Catch (`err`)
  - **1.2.** `[Return]`  — `err.message || fallback`
- **2.** `[Return]`  — `(err as Error)?.message || fallback`

### `function extractServarrValidationErrors` (L288)

- **1.** `[If]` `err instanceof ConnectionError && typeoferr.rawError === 'string'`
  - **1.1.** `[Try]` Try block
    - **1.1.1.** `[Sequence]` Calls `JSON.parse` and stores result as `parsed`
    - **1.1.2.** `[If]` `Array.isArray(parsed)`
      - **1.1.2.1.** `[Return]`  — `parsed.map((item: any) => ({ propertyName: String(item.propertyName || ''), errorMessage: String(item.errorMessage || item.message || ''), severity: item.severity ? String(item.severity) : undefined, }))`
  - **1.2.** `[Catch]` Catch (`err`)
- **2.** `[Return]`  — `[]`

### `class ServarrServ` extends `BaseService` (L306)

#### `getConnectionContext(app, userId)`: `Promise<ServarrConnectionContext>` (L310)
Resolves active connection credentials and adapter for a given servarr app and user.

- **1.** `[Sequence]` Define `provider`
  ```typescript
  const provider = app.toUpperCase() as 'RADARR' | 'SONARR'
  ```
- **2.** `[Sequence]` Database `first` on `Connection` and stores it as `connection`
- **3.** `[If]` `!connection`
  - **3.1.** `[Return]` 
    ```json
    {
      "connected": false,
      "provider": "<provider>",
      "error": "<`No active ${provider} connection found`>"
    }
    ```
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Calls `decryptConnectionData` and stores result as `credentials`
  - **4.2.** `[Sequence]` Define `adapter`, `hostUrl`
    ```typescript
    const adapter = getConnectionAdapter(provider) as any
    const hostUrl = credentials.hostUrl || (connection.settings as any)?.hostUrl || connection.profileUrl || ''
    ```
  - **4.3.** `[Return]` 
    ```json
    {
      "connected": true,
      "provider": "<provider>",
      "adapter": "<adapter>",
      "credentials": "<credentials>",
      "hostUrl": "<hostUrl>"
    }
    ```
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[Return]` 
    ```json
    {
      "connected": true,
      "provider": "<provider>",
      "error": "<`Failed to decrypt ${provider} connection credentials`>"
    }
    ```

#### `getBlocklist(app, userId, query)` (L363)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": false,
      "provider": "<ctx.provider>",
      "records": [],
      "totalRecords": 0,
      "message": "<ctx.error>"
    }
    ```
- **3.** `[If]` `ctx.error || !ctx.adapter || !ctx.credentials`
  - **3.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "records": [],
      "totalRecords": 0,
      "message": "<ctx.error>"
    }
    ```
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Define `page`, `pageSize`, `sortKey`, `sortDirection`
    ```typescript
    const page = query?.page ? Number(query.page) : 1
    const pageSize = query?.pageSize ? Number(query.pageSize) : 50
    const sortKey = query?.sortKey || 'date'
    const sortDirection = query?.sortDirection || 'descending'
    ```
  - **4.2.** `[Sequence]` Calls `ctx.adapter.getBlocklist` and stores result as `data`
  - **4.3.** `[Sequence]` Define `records`, `totalRecords`
    ```typescript
    const records = Array.isArray(data) ? data : data?.records || []
    const totalRecords = typeof data?.totalRecords === 'number' ? data.totalRecords : records.length
    ```
  - **4.4.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "<ctx.provider>",
      "page": "<page>",
      "pageSize": "<pageSize>",
      "totalRecords": "<totalRecords>",
      "records": "<records>"
    }
    ```
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "records": [],
      "totalRecords": 0,
      "message": "<err.message || `Failed to fetch blocklist from ${ctx.provider}`>"
    }
    ```

#### `deleteBlocklist(app, userId, query, body)` (L435)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": "<!!ctx.connected>",
      "provider": "<ctx.provider>",
      "message": "<ctx.error>"
    }
    ```
- **3.** `[Try]` Try block
  - **3.1.** `[If]` `body?.ids && Array.isArray(body.ids) && body.ids.length > 0`
    - **3.1.1.** `[Sequence]` Calls `ctx.adapter.deleteBlocklistBulk`
  - **3.2.** `[Else]` Otherwise
    - **3.2.1.** `[If]` `query?.id`
      - **3.2.1.1.** `[Sequence]` Calls `ctx.adapter.deleteBlocklist`
    - **3.2.2.** `[Else]` Otherwise
      - **3.2.2.1.** `[Return]` 
        ```json
        {
          "success": false,
          "connected": true,
          "provider": "<ctx.provider>",
          "message": "No blocklist ID or ids array provided"
        }
        ```
  - **3.3.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "<ctx.provider>"
    }
    ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "message": "<err.message || 'Failed to remove item from blocklist'>"
    }
    ```

#### `executeCommand(app, userId, body)` (L483)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[Sequence]` Define `commandName`
  ```typescript
  const commandName = body.name || app === 'radarr' ? 'RefreshMovie' : 'RefreshSeries'
  ```
- **3.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **3.1.** `[Return]` 
    ```json
    {
      "success": false,
      "provider": "<ctx.provider>",
      "command": "<body.command || commandName>",
      "message": "<ctx.error || `No active ${ctx.provider} connection found`>"
    }
    ```
- **4.** `[Sequence]` Define `payload`
  ```typescript
  let payload: { name: string; [key: string]: unknown } = { name: commandName, ...body, }
  ```
- **5.** `[If]` `body.command === 'refresh'`
  - **5.1.** `[Sequence]` Assign `payload`
    ```typescript
    payload = { name: app === 'radarr' ? 'RefreshMovie' : 'RefreshSeries' }
    ```
- **6.** `[Else]` Otherwise
  - **6.1.** `[If]` `body.command === 'rssSync'`
    - **6.1.1.** `[Sequence]` Assign `payload`
      ```typescript
      payload = { name: 'RssSync' }
      ```
  - **6.2.** `[Else]` Otherwise
    - **6.2.1.** `[If]` `body.command === 'searchMissing'`
      - **6.2.1.1.** `[Sequence]` Assign `payload`
        ```typescript
        payload = { name: app === 'radarr' ? 'MissingMoviesSearch' : 'MissingEpisodeSearch', }
        ```
    - **6.2.2.** `[Else]` Otherwise
      - **6.2.2.1.** `[If]` `body.command === 'custom' && body.name`
        - **6.2.2.1.1.** `[Sequence]` Assign `payload`
          ```typescript
          payload = { name: body.name, ...(body.body || {}) }
          ```
- **7.** `[Try]` Try block
  - **7.1.** `[Sequence]` Calls `ctx.adapter.executeCommand` and stores result as `result`
  - **7.2.** `[Return]` 
    ```json
    {
      "success": true,
      "provider": "<ctx.provider>",
      "command": "<payload.name>",
      "message": "<`${ctx.provider} command '${payload.name}' executed successfully`>",
      "data": "<result>"
    }
    ```
- **8.** `[Catch]` Catch (`err`)
  - **8.1.** `[Return]` 
    ```json
    {
      "success": false,
      "provider": "<ctx.provider>",
      "command": "<payload.name>",
      "message": "<err?.message || `Failed to execute command on ${ctx.provider}`>"
    }
    ```

#### `getFiles(app, userId, query)` (L550)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[Sequence]` Define `movieId`, `seriesId`
  ```typescript
  const movieId = query?.movieId ? Number(query.movieId) : undefined
  const seriesId = query?.seriesId ? Number(query.seriesId) : undefined
  ```
- **3.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **3.1.** `[Return]` 
    ```json
    {
      "success": false,
      "provider": "<ctx.provider>",
      "movieId": "<movieId>",
      "seriesId": "<seriesId>",
      "files": [],
      "message": "<ctx.error || `No active ${ctx.provider} connection found`>"
    }
    ```
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Define `files`
    ```typescript
    let files: any[] = []
    ```
  - **4.2.** `[If]` `app === 'radarr'`
    - **4.2.1.** `[If]` `!movieId`
      - **4.2.1.1.** `[Return]` 
        ```json
        {
          "success": false,
          "provider": "<ctx.provider>",
          "movieId": "<movieId>",
          "seriesId": "<seriesId>",
          "files": [],
          "message": "movieId query parameter is required for Radarr"
        }
        ```
    - **4.2.2.** `[Sequence]` Assign `files`
      ```typescript
      files = await ctx.adapter.getMovieFiles(ctx.credentials, movieId)
      ```
  - **4.3.** `[Else]` Otherwise
    - **4.3.1.** `[If]` `!seriesId`
      - **4.3.1.1.** `[Return]` 
        ```json
        {
          "success": false,
          "provider": "<ctx.provider>",
          "movieId": "<movieId>",
          "seriesId": "<seriesId>",
          "files": [],
          "message": "seriesId query parameter is required for Sonarr"
        }
        ```
    - **4.3.2.** `[Sequence]` Assign `files`
      ```typescript
      files = await ctx.adapter.getEpisodeFiles(ctx.credentials, seriesId)
      ```
  - **4.4.** `[Return]` 
    ```json
    {
      "success": true,
      "provider": "<ctx.provider>",
      "movieId": "<movieId>",
      "seriesId": "<seriesId>",
      "files": "<Array.isArray(files) ? files : []>"
    }
    ```
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[Return]` 
    ```json
    {
      "success": false,
      "provider": "<ctx.provider>",
      "movieId": "<movieId>",
      "seriesId": "<seriesId>",
      "files": [],
      "message": "<err?.message || 'Failed to fetch media files'>"
    }
    ```

#### `deleteFile(app, userId, query, body)` (L617)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "message": "<ctx.error || `No active ${ctx.provider} connection found`>"
    }
    ```
- **3.** `[Sequence]` Define `rawFileId`, `fileId`
  ```typescript
  const rawFileId = query?.fileId ?? body?.fileId
  const fileId = rawFileId ? Number(rawFileId) : NaN
  ```
- **4.** `[If]` `!fileId || isNaN(fileId)`
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "message": "A valid fileId is required"
    }
    ```
- **5.** `[Try]` Try block
  - **5.1.** `[If]` `app === 'radarr'`
    - **5.1.1.** `[Sequence]` Calls `ctx.adapter.deleteMovieFile`
  - **5.2.** `[Else]` Otherwise
    - **5.2.1.** `[Sequence]` Calls `ctx.adapter.deleteEpisodeFile`
  - **5.3.** `[Return]` 
    ```json
    {
      "success": true,
      "message": "Media file deleted successfully"
    }
    ```
- **6.** `[Catch]` Catch (`err`)
  - **6.1.** `[Return]` 
    ```json
    {
      "success": false,
      "message": "<err?.message || 'Failed to delete media file'>"
    }
    ```

#### `getHistory(app, userId, query)` (L662)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": false,
      "provider": "<ctx.provider>",
      "records": [],
      "totalRecords": 0,
      "message": "<ctx.error>"
    }
    ```
- **3.** `[If]` `ctx.error || !ctx.adapter || !ctx.credentials`
  - **3.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "records": [],
      "totalRecords": 0,
      "message": "<ctx.error>"
    }
    ```
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Define `page`, `pageSize`, `sortKey`, `sortDirection`
    ```typescript
    const page = query?.page ? Number(query.page) : 1
    const pageSize = query?.pageSize ? Number(query.pageSize) : 50
    const sortKey = query?.sortKey || 'date'
    const sortDirection = query?.sortDirection || 'descending'
    ```
  - **4.2.** `[Sequence]` Calls `ctx.adapter.getHistory` and stores result as `data`
  - **4.3.** `[Sequence]` Define `records`, `totalRecords`
    ```typescript
    const records = Array.isArray(data) ? data : data?.records || []
    const totalRecords = typeof data?.totalRecords === 'number' ? data.totalRecords : records.length
    ```
  - **4.4.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "<ctx.provider>",
      "page": "<page>",
      "pageSize": "<pageSize>",
      "totalRecords": "<totalRecords>",
      "records": "<records>"
    }
    ```
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "records": [],
      "totalRecords": 0,
      "message": "<err.message || `Failed to fetch history from ${ctx.provider}`>"
    }
    ```

#### `getIndexers(app, userId)` (L747)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "provider": "<ctx.provider>",
      "indexers": [],
      "message": "<ctx.error || `${ctx.provider} not connected`>"
    }
    ```
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `ctx.adapter.getIndexers` and stores result as `indexers`
  - **3.2.** `[Return]` 
    ```json
    {
      "success": true,
      "provider": "<ctx.provider>",
      "indexers": "<Array.isArray(indexers) ? indexers : []>"
    }
    ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "provider": "<ctx.provider>",
      "indexers": [],
      "message": "<err?.message || 'Failed to fetch indexers'>"
    }
    ```

#### `getLibrary(app, userId)` (L778)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": false,
      "provider": "<ctx.provider>",
      "items": [],
      "totalCount": 0,
      "message": "<ctx.error>"
    }
    ```
- **3.** `[If]` `ctx.error || !ctx.adapter || !ctx.credentials`
  - **3.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "items": [],
      "totalCount": 0,
      "message": "<ctx.error>"
    }
    ```
- **4.** `[If]` `app === 'radarr'`
  - **4.1.** `[Try]` Try block
    - **4.1.1.** `[Sequence]` Calls `Promise.all` and stores result as `[rawMovies, rawProfiles]`
    - **4.1.2.** `[Sequence]` Define `profileMap`
      ```typescript
      const profileMap = new Map<number, string>()
      ```
    - **4.1.3.** `[If]` `Array.isArray(rawProfiles)`
      - **4.1.3.1.** `[Sequence]` Calls `rawProfiles.forEach`
    - **4.1.4.** `[Sequence]` Define `mapped`
      ```typescript
      const mapped = Array.isArray(rawMovies) ? rawMovies : [].map((m: any) => { const rewritten = rewriteServarrImages(m, 'radarr') const poster = findCoverUrl(rewritten.images, 'poster') const fanart = findCoverUrl(rewritten.images, 'fanart') const banner = findCoverUrl(rewritten.images, 'banner') const qualityName = (m.qualityProfileId ? profileMap.get(m.qualityProfileId) : null) || ...)
      ```
    - **4.1.5.** `[Return]` 
      ```json
      {
        "success": true,
        "connected": true,
        "provider": "<ctx.provider>",
        "hostUrl": "<ctx.hostUrl>",
        "items": "<mapped>",
        "totalCount": "<mapped.length>"
      }
      ```
  - **4.2.** `[Catch]` Catch (`err`)
    - **4.2.1.** `[Return]` 
      ```json
      {
        "success": false,
        "connected": true,
        "provider": "<ctx.provider>",
        "hostUrl": "<ctx.hostUrl>",
        "items": [],
        "totalCount": 0,
        "message": "<formatServarrError(err, 'Failed to fetch movies from Radarr')>"
      }
      ```
- **5.** `[Else]` Otherwise
  - **5.1.** `[Try]` Try block
    - **5.1.1.** `[Sequence]` Calls `Promise.all` and stores result as `[rawSeries, rawProfiles]`
    - **5.1.2.** `[Sequence]` Define `profileMap`
      ```typescript
      const profileMap = new Map<number, string>()
      ```
    - **5.1.3.** `[If]` `Array.isArray(rawProfiles)`
      - **5.1.3.1.** `[Sequence]` Calls `rawProfiles.forEach`
    - **5.1.4.** `[Sequence]` Define `mapped`
      ```typescript
      const mapped = Array.isArray(rawSeries) ? rawSeries : [].map((s: any) => { const rewritten = rewriteServarrImages(s, 'sonarr') const poster = findCoverUrl(rewritten.images, 'poster') const fanart = findCoverUrl(rewritten.images, 'fanart') const banner = findCoverUrl(rewritten.images, 'banner') const qualityName = (s.qualityProfileId ? profileMap.get(s.qualityProfileId) : null) || ...)
      ```
    - **5.1.5.** `[Return]` 
      ```json
      {
        "success": true,
        "connected": true,
        "provider": "<ctx.provider>",
        "hostUrl": "<ctx.hostUrl>",
        "items": "<mapped>",
        "totalCount": "<mapped.length>"
      }
      ```
  - **5.2.** `[Catch]` Catch (`err`)
    - **5.2.1.** `[Return]` 
      ```json
      {
        "success": false,
        "connected": true,
        "provider": "<ctx.provider>",
        "hostUrl": "<ctx.hostUrl>",
        "items": [],
        "totalCount": 0,
        "message": "<formatServarrError(err, 'Failed to fetch series from Sonarr')>"
      }
      ```

#### `lookup(app, userId, query)` (L958)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": false,
      "provider": "<ctx.provider>",
      "records": [],
      "message": "<ctx.error>"
    }
    ```
- **3.** `[If]` `ctx.error || !ctx.adapter || !ctx.credentials`
  - **3.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "records": [],
      "message": "<ctx.error>"
    }
    ```
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Calls `Promise.all` and stores result as `[rootFolders, qualityProfiles]`
  - **4.2.** `[Sequence]` Define `records`
    ```typescript
    let records: any[] = []
    ```
  - **4.3.** `[If]` `query?.term && query.term.trim()`
    - **4.3.1.** `[Sequence]` Define `term`
      ```typescript
      const term = query.term.trim()
      ```
    - **4.3.2.** `[Sequence]` Assign `records`
      ```typescript
      records = app === 'radarr' ? await ctx.adapter.lookupMovies(ctx.credentials, term) : await ctx.adapter.lookupSeries(ctx.credentials, term)
      ```
  - **4.4.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "<ctx.provider>",
      "records": "<Array.isArray(records) ? records : []>",
      "rootFolders": "<Array.isArray(rootFolders) ? rootFolders : []>",
      "qualityProfiles": "<Array.isArray(qualityProfiles) ? qualityProfiles : []>"
    }
    ```
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "records": [],
      "message": "<err.message || `Failed to lookup items in ${ctx.provider}`>"
    }
    ```

#### `addMedia(app, userId, body)` (L1017)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": "<!!ctx.connected>",
      "provider": "<ctx.provider>",
      "message": "<ctx.error || `No active ${ctx.provider} connection found`>"
    }
    ```
- **3.** `[Try]` Try block
  - **3.1.** `[If]` `app === 'radarr'`
    - **3.1.1.** `[Sequence]` Calls `ctx.adapter.addMovie` and stores result as `movie`
    - **3.1.2.** `[Return]` 
      ```json
      {
        "success": true,
        "connected": true,
        "provider": "<ctx.provider>",
        "movie": "<movie>",
        "data": "<movie>"
      }
      ```
  - **3.2.** `[Else]` Otherwise
    - **3.2.1.** `[Sequence]` Calls `ctx.adapter.addSeries` and stores result as `series`
    - **3.2.2.** `[Return]` 
      ```json
      {
        "success": true,
        "connected": true,
        "provider": "<ctx.provider>",
        "series": "<series>",
        "data": "<series>"
      }
      ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "message": "<err.message || `Failed to add media in ${ctx.provider}`>"
    }
    ```

#### `bulkUpdate(app, userId, body)` (L1061)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "message": "<ctx.error || `No active ${ctx.provider} connection found`>"
    }
    ```
- **3.** `[Try]` Try block
  - **3.1.** `[If]` `app === 'radarr'`
    - **3.1.1.** `[Sequence]` Define `movieIds`
      ```typescript
      const movieIds = body.movieIds || body.ids || []
      ```
    - **3.1.2.** `[Sequence]` Calls `ctx.adapter.bulkUpdateMovies` and stores result as `result`
    - **3.1.3.** `[Return]` 
      ```json
      {
        "success": true,
        "message": "<`Successfully updated ${movieIds.length} movies`>",
        "data": "<result>"
      }
      ```
  - **3.2.** `[Else]` Otherwise
    - **3.2.1.** `[Sequence]` Define `seriesIds`
      ```typescript
      const seriesIds = body.seriesIds || body.ids || []
      ```
    - **3.2.2.** `[Sequence]` Calls `ctx.adapter.bulkUpdateSeries` and stores result as `result`
    - **3.2.3.** `[Return]` 
      ```json
      {
        "success": true,
        "message": "<`Successfully updated ${seriesIds.length} series`>",
        "data": "<result>"
      }
      ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "message": "<err?.message || 'Failed to update library items'>"
    }
    ```

#### `bulkDelete(app, userId, body)` (L1123)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "message": "<ctx.error || `No active ${ctx.provider} connection found`>"
    }
    ```
- **3.** `[Try]` Try block
  - **3.1.** `[If]` `app === 'radarr'`
    - **3.1.1.** `[Sequence]` Define `movieIds`
      ```typescript
      const movieIds = body.movieIds || body.ids || []
      ```
    - **3.1.2.** `[Sequence]` Calls `ctx.adapter.bulkDeleteMovies`
    - **3.1.3.** `[Return]` 
      ```json
      {
        "success": true,
        "message": "<`Successfully deleted ${movieIds.length} movies`>"
      }
      ```
  - **3.2.** `[Else]` Otherwise
    - **3.2.1.** `[Sequence]` Define `seriesIds`
      ```typescript
      const seriesIds = body.seriesIds || body.ids || []
      ```
    - **3.2.2.** `[Sequence]` Calls `ctx.adapter.bulkDeleteSeries`
    - **3.2.3.** `[Return]` 
      ```json
      {
        "success": true,
        "message": "<`Successfully deleted ${seriesIds.length} series`>"
      }
      ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "message": "<err?.message || 'Failed to delete library items'>"
    }
    ```

#### `getManualImport(app, userId, query)` (L1177)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "provider": "<ctx.provider>",
      "items": [],
      "message": "<ctx.error || `No active ${ctx.provider} connection found`>"
    }
    ```
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `ctx.adapter.getManualImport` and stores result as `items`
  - **3.2.** `[Return]` 
    ```json
    {
      "success": true,
      "provider": "<ctx.provider>",
      "items": "<Array.isArray(items) ? items : []>"
    }
    ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "provider": "<ctx.provider>",
      "items": [],
      "message": "<err?.message || 'Failed to scan manual import'>"
    }
    ```

#### `executeManualImport(app, userId, body)` (L1222)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "message": "<ctx.error || `No active ${ctx.provider} connection found`>"
    }
    ```
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `ctx.adapter.executeManualImport` and stores result as `result`
  - **3.2.** `[Return]` 
    ```json
    {
      "success": true,
      "message": "Manual import initiated successfully",
      "data": "<result>"
    }
    ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "message": "<err?.message || 'Failed to execute manual import'>"
    }
    ```

#### `getQueue(app, userId, query)` (L1256)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": false,
      "provider": "<ctx.provider>",
      "records": [],
      "totalRecords": 0,
      "message": "<ctx.error>"
    }
    ```
- **3.** `[If]` `ctx.error || !ctx.adapter || !ctx.credentials`
  - **3.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "records": [],
      "totalRecords": 0,
      "message": "<ctx.error>"
    }
    ```
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Define `page`, `pageSize`, `sortKey`, `sortDirection`
    ```typescript
    const page = query?.page ? Number(query.page) : 1
    const pageSize = query?.pageSize ? Number(query.pageSize) : 50
    const sortKey = query?.sortKey
    const sortDirection = query?.sortDirection
    ```
  - **4.2.** `[Sequence]` Calls `ctx.adapter.getQueue` and stores result as `data`
  - **4.3.** `[Sequence]` Define `records`, `totalRecords`
    ```typescript
    const records = Array.isArray(data) ? data : data?.records || []
    const totalRecords = typeof data?.totalRecords === 'number' ? data.totalRecords : records.length
    ```
  - **4.4.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "<ctx.provider>",
      "page": "<page>",
      "pageSize": "<pageSize>",
      "totalRecords": "<totalRecords>",
      "records": "<records>"
    }
    ```
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "records": [],
      "totalRecords": 0,
      "message": "<err?.message || `Failed to fetch ${ctx.provider} queue`>"
    }
    ```

#### `deleteQueue(app, userId, query, body)` (L1331)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "message": "<ctx.error || `No active ${ctx.provider} connection found`>"
    }
    ```
- **3.** `[Sequence]` Define `rawId`, `itemId`
  ```typescript
  const rawId = query?.id ?? body?.id
  const itemId = rawId ? Number(rawId) : NaN
  ```
- **4.** `[If]` `!itemId || isNaN(itemId)`
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "message": "A valid queue item ID is required"
    }
    ```
- **5.** `[Sequence]` Define `removeFromClient`, `blocklist`, `skipRedownload`
  ```typescript
  const removeFromClient = query?.removeFromClient === 'true' || query?.removeFromClient === true || body?.removeFromClient === true || query?.removeFromClient === undefined && body?.removeFromClient === undefined
  const blocklist = query?.blocklist === 'true' || query?.blocklist === true || body?.blocklist === true
  const skipRedownload = query?.skipRedownload === 'true' || query?.skipRedownload === true || body?.skipRedownload === true
  ```
- **6.** `[Try]` Try block
  - **6.1.** `[Sequence]` Calls `ctx.adapter.deleteQueueItem`
  - **6.2.** `[Return]` 
    ```json
    {
      "success": true,
      "message": "Download removed from queue successfully"
    }
    ```
- **7.** `[Catch]` Catch (`err`)
  - **7.1.** `[Return]` 
    ```json
    {
      "success": false,
      "message": "<err?.message || 'Failed to remove item from queue'>"
    }
    ```

#### `getReleases(app, userId, query)` (L1400)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "provider": "<ctx.provider>",
      "releases": [],
      "message": "<ctx.error || `No active ${ctx.provider} connection found`>"
    }
    ```
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `ctx.adapter.getReleases` and stores result as `releases`
  - **3.2.** `[Return]` 
    ```json
    {
      "success": true,
      "provider": "<ctx.provider>",
      "releases": "<Array.isArray(releases) ? releases : []>"
    }
    ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "provider": "<ctx.provider>",
      "releases": [],
      "message": "<err?.message || 'Failed to fetch releases'>"
    }
    ```

#### `grabRelease(app, userId, body)` (L1450)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "message": "<ctx.error || `No active ${ctx.provider} connection found`>"
    }
    ```
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `ctx.adapter.downloadRelease` and stores result as `result`
  - **3.2.** `[Return]` 
    ```json
    {
      "success": true,
      "message": "Release grabbed and queued for download",
      "data": "<result>"
    }
    ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "message": "<err?.message || 'Failed to grab release'>"
    }
    ```

#### `getRenamePreview(app, userId, query)` (L1489)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": false,
      "provider": "<ctx.provider>",
      "records": [],
      "message": "<ctx.error>"
    }
    ```
- **3.** `[If]` `ctx.error || !ctx.adapter || !ctx.credentials`
  - **3.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "records": [],
      "message": "<ctx.error>"
    }
    ```
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Calls `ctx.adapter.getRenamePreview` and stores result as `records`
  - **4.2.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "<ctx.provider>",
      "records": "<Array.isArray(records) ? records : []>"
    }
    ```
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "records": [],
      "message": "<err.message || `Failed to preview ${ctx.provider} file rename`>"
    }
    ```

#### `executeRename(app, userId, body)` (L1541)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": "<!!ctx.connected>",
      "provider": "<ctx.provider>",
      "message": "<ctx.error>"
    }
    ```
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `ctx.adapter.executeCommand`
  - **3.2.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "<ctx.provider>"
    }
    ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "message": "<err.message || `Failed to execute ${ctx.provider} file rename`>"
    }
    ```

#### `getWantedCutoff(app, userId, query)` (L1582)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": false,
      "provider": "<ctx.provider>",
      "records": [],
      "totalRecords": 0,
      "message": "<ctx.error>"
    }
    ```
- **3.** `[If]` `ctx.error || !ctx.adapter || !ctx.credentials`
  - **3.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "records": [],
      "totalRecords": 0,
      "message": "<ctx.error>"
    }
    ```
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Define `page`, `pageSize`, `sortKey`, `sortDirection`, `monitored`
    ```typescript
    const page = query?.page ? Number(query.page) : 1
    const pageSize = query?.pageSize ? Number(query.pageSize) : 50
    const sortKey = query?.sortKey || 'title'
    const sortDirection = query?.sortDirection || 'ascending'
    const monitored = query?.monitored !== undefined ? query.monitored === 'true' || query.monitored === true : true
    ```
  - **4.2.** `[Sequence]` Calls `ctx.adapter.getWantedCutoff` and stores result as `data`
  - **4.3.** `[Sequence]` Define `records`, `totalRecords`
    ```typescript
    const records = Array.isArray(data) ? data : data?.records || []
    const totalRecords = typeof data?.totalRecords === 'number' ? data.totalRecords : records.length
    ```
  - **4.4.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "<ctx.provider>",
      "page": "<page>",
      "pageSize": "<pageSize>",
      "totalRecords": "<totalRecords>",
      "records": "<records>"
    }
    ```
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "records": [],
      "totalRecords": 0,
      "message": "<err.message || `Failed to fetch cutoff unmet items from ${ctx.provider}`>"
    }
    ```

#### `getWantedMissing(app, userId, query)` (L1661)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": false,
      "provider": "<ctx.provider>",
      "records": [],
      "totalRecords": 0,
      "message": "<ctx.error>"
    }
    ```
- **3.** `[If]` `ctx.error || !ctx.adapter || !ctx.credentials`
  - **3.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "records": [],
      "totalRecords": 0,
      "message": "<ctx.error>"
    }
    ```
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Define `page`, `pageSize`, `sortKey`, `sortDirection`, `monitored`
    ```typescript
    const page = query?.page ? Number(query.page) : 1
    const pageSize = query?.pageSize ? Number(query.pageSize) : 50
    const sortKey = query?.sortKey || 'title'
    const sortDirection = query?.sortDirection || 'ascending'
    const monitored = query?.monitored !== undefined ? query.monitored === 'true' || query.monitored === true : true
    ```
  - **4.2.** `[Sequence]` Calls `ctx.adapter.getWantedMissing` and stores result as `data`
  - **4.3.** `[Sequence]` Define `records`, `totalRecords`
    ```typescript
    const records = Array.isArray(data) ? data : data?.records || []
    const totalRecords = typeof data?.totalRecords === 'number' ? data.totalRecords : records.length
    ```
  - **4.4.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "<ctx.provider>",
      "page": "<page>",
      "pageSize": "<pageSize>",
      "totalRecords": "<totalRecords>",
      "records": "<records>"
    }
    ```
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "records": [],
      "totalRecords": 0,
      "message": "<err.message || `Failed to fetch missing items from ${ctx.provider}`>"
    }
    ```

#### `getRadarrMoviesFeed(userId)` (L1743)

- **1.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **2.** `[Sequence]` Calls `parseRadarrMovieConfig` and stores result as `config`
- **3.** `[If]` `!isRadarrEnabled(user?.settings) || !config.enabled`
  - **3.1.** `[Return]`  — `[]`
- **4.** `[Sequence]` Database `all` on `MovieList` and stores it as `movieEntries`
- **5.** `[Sequence]` Define `filteredEntries`, `results`
  ```typescript
  const filteredEntries = movieEntries.filter((e) => !!e.movie && config.movieStatuses.includes(e.movie.status))
  const results: Array<{ title: string tmdbId: number imdbId?: string year?: number monitored: boolean hasFile: boolean ... = []
  ```
- **6.** `[Loop]` Iterate `const entry` over `filteredEntries`
  - **6.1.** `[If]` `!entry.movie`
  - **6.2.** `[Sequence]` Calls `resolveMovieTmdbId` and stores result as `tmdbId`
  - **6.3.** `[If]` `!tmdbId`
- **7.** `[Return]`  — `results`

#### `getRadarrAnimeMoviesFeed(userId)` (L1802)

- **1.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **2.** `[Sequence]` Calls `parseRadarrAnimeConfig` and stores result as `config`
- **3.** `[If]` `!isRadarrEnabled(user?.settings) || !config.enabled`
  - **3.1.** `[Return]`  — `[]`
- **4.** `[Sequence]` Database `all` on `AnimeList` and stores it as `animeEntries`
- **5.** `[Sequence]` Define `filteredEntries`, `results`
  ```typescript
  const filteredEntries = animeEntries.filter((e) => !!e.anime && config.animeMovieFormats.includes(e.anime.format) && config.animeStatuses.includes(e.anime.status))
  const results: Array<{ title: string tmdbId?: number imdbId?: string year?: number monitored: boolean hasFile: boolean ... = []
  ```
- **6.** `[Loop]` Iterate `const entry` over `filteredEntries`
  - **6.1.** `[If]` `!entry.anime`
  - **6.2.** `[Sequence]` Calls `resolveAnimeTmdbId` and stores result as `tmdbId`
  - **6.3.** `[Sequence]` Calls `resolveAnimeImdbId` and stores result as `imdbId`
  - **6.4.** `[If]` `!tmdbId && !imdbId`
- **7.** `[Return]`  — `results`

#### `getRadarrMovieById(userId, id)` (L1865)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": false,
      "provider": "RADARR",
      "message": "<ctx.error>"
    }
    ```
- **3.** `[If]` `ctx.error || !ctx.adapter || !ctx.credentials`
  - **3.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "RADARR",
      "message": "<ctx.error>"
    }
    ```
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Calls `Number` and stores result as `movieId`
  - **4.2.** `[Sequence]` Calls `Promise.all` and stores result as `[movie, files]`
  - **4.3.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "RADARR",
      "movie": "<rewriteServarrImages(movie, 'radarr')>",
      "files": "<Array.isArray(files) ? files : []>"
    }
    ```
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "RADARR",
      "message": "<err.message || 'Failed to fetch Radarr movie details'>"
    }
    ```

#### `updateRadarrMovie(userId, id, body)` (L1908)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": "<!!ctx.connected>",
      "provider": "RADARR",
      "message": "<ctx.error>"
    }
    ```
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `Number` and stores result as `movieId`
  - **3.2.** `[Sequence]` Calls `ctx.adapter.updateMovie` and stores result as `updated`
  - **3.3.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "RADARR",
      "movie": "<updated>"
    }
    ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "RADARR",
      "message": "<err.message || 'Failed to update Radarr movie'>"
    }
    ```

#### `deleteRadarrMovie(userId, id, options)` (L1941)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": "<!!ctx.connected>",
      "provider": "RADARR",
      "message": "<ctx.error>"
    }
    ```
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `Number` and stores result as `movieId`
  - **3.2.** `[Sequence]` Calls `ctx.adapter.deleteMovie`
  - **3.3.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "RADARR"
    }
    ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "RADARR",
      "message": "<err.message || 'Failed to delete Radarr movie'>"
    }
    ```

#### `getQualityProfiles()` (L1979)

- **1.** `[Return]`  — `SERVARR_QUALITY_PROFILES`

#### `getSystemStatus()` (L1983)

- **1.** `[Return]`  — `SERVARR_SYSTEM_STATUS`

#### `getSonarrAnimeFeed(userId)` (L1990)

- **1.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **2.** `[Sequence]` Calls `parseSonarrAnimeConfig` and stores result as `config`
- **3.** `[If]` `!isSonarrEnabled(user?.settings) || !config.enabled`
  - **3.1.** `[Return]`  — `[]`
- **4.** `[Sequence]` Database `all` on `AnimeList` and stores it as `animeEntries`
- **5.** `[Sequence]` Define `filteredEntries`, `results`
  ```typescript
  const filteredEntries = animeEntries.filter((e) => !!e.anime && config.animeFormats.includes(e.anime.format) && config.animeStatuses.includes(e.anime.status))
  const results: Array<{ title: string tvdbId: number imdbId?: string year?: number monitored: boolean seriesType: 'anime' | 'standard' ... = []
  ```
- **6.** `[Loop]` Iterate `const entry` over `filteredEntries`
  - **6.1.** `[If]` `!entry.anime`
  - **6.2.** `[Sequence]` Calls `resolveAnimeTvdbId` and stores result as `tvdbId`
  - **6.3.** `[If]` `!tvdbId`
  - **6.4.** `[Sequence]` Calls `resolveAnimeImdbId` and stores result as `imdbId`
- **7.** `[Return]`  — `results`

#### `getSonarrTvFeed(userId)` (L2056)

- **1.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **2.** `[Sequence]` Calls `parseSonarrTvConfig` and stores result as `config`
- **3.** `[If]` `!isSonarrEnabled(user?.settings) || !config.enabled`
  - **3.1.** `[Return]`  — `[]`
- **4.** `[Sequence]` Database `all` on `TvList` and stores it as `tvEntries`
- **5.** `[Sequence]` Define `filteredEntries`, `results`
  ```typescript
  const filteredEntries = tvEntries.filter((e) => !!e.tv && config.tvStatuses.includes(e.tv.status))
  const results: Array<{ title: string tvdbId: number imdbId?: string year?: number monitored: boolean seriesType: 'anime' | 'standard' ... = []
  ```
- **6.** `[Loop]` Iterate `const entry` over `filteredEntries`
  - **6.1.** `[If]` `!entry.tv`
  - **6.2.** `[Sequence]` Calls `resolveTvTvdbId` and stores result as `tvdbId`
  - **6.3.** `[If]` `!tvdbId`
- **7.** `[Return]`  — `results`

#### `getSonarrSeriesById(userId, id)` (L2117)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": false,
      "provider": "SONARR",
      "message": "<ctx.error>"
    }
    ```
- **3.** `[If]` `ctx.error || !ctx.adapter || !ctx.credentials`
  - **3.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "SONARR",
      "message": "<ctx.error>"
    }
    ```
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Calls `Number` and stores result as `seriesId`
  - **4.2.** `[Sequence]` Calls `Promise.all` and stores result as `[series, episodes, files]`
  - **4.3.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "SONARR",
      "series": "<rewriteServarrImages(series, 'sonarr')>",
      "episodes": "<Array.isArray(episodes) ? episodes : []>",
      "files": "<Array.isArray(files) ? files : []>"
    }
    ```
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "SONARR",
      "message": "<err.message || 'Failed to fetch Sonarr series details'>"
    }
    ```

#### `updateSonarrSeries(userId, id, body)` (L2162)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": "<!!ctx.connected>",
      "provider": "SONARR",
      "message": "<ctx.error>"
    }
    ```
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `Number` and stores result as `seriesId`
  - **3.2.** `[Sequence]` Calls `ctx.adapter.updateSeries` and stores result as `updated`
  - **3.3.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "SONARR",
      "series": "<updated>"
    }
    ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "SONARR",
      "message": "<err.message || 'Failed to update Sonarr series'>"
    }
    ```

#### `deleteSonarrSeries(userId, id, options)` (L2195)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": "<!!ctx.connected>",
      "provider": "SONARR",
      "message": "<ctx.error>"
    }
    ```
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `Number` and stores result as `seriesId`
  - **3.2.** `[Sequence]` Calls `ctx.adapter.deleteSeries`
  - **3.3.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "SONARR"
    }
    ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "SONARR",
      "message": "<err.message || 'Failed to delete Sonarr series'>"
    }
    ```

#### `updateSonarrEpisode(userId, id, body)` (L2233)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": "<!!ctx.connected>",
      "provider": "SONARR",
      "message": "<ctx.error>"
    }
    ```
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `Number` and stores result as `episodeId`
  - **3.2.** `[Sequence]` Calls `ctx.adapter.updateEpisode` and stores result as `updated`
  - **3.3.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "SONARR",
      "episode": "<updated>"
    }
    ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "SONARR",
      "message": "<err.message || 'Failed to update Sonarr episode'>"
    }
    ```

#### `setEpisodeMonitoring(userId, episodeIds, monitored)` (L2266)

- **1.** `[Sequence]` Calls `this.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || ctx.error || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": "<!!ctx.connected>",
      "provider": "SONARR",
      "message": "<ctx.error>"
    }
    ```
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `ctx.adapter.setEpisodeMonitoring`
  - **3.2.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "SONARR"
    }
    ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "SONARR",
      "message": "<err.message || 'Failed to update episode monitoring'>"
    }
    ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- `apps/servarr/_shared/servarr.model.ts` — `SERVARR_QUALITY_PROFILES`, `SERVARR_SYSTEM_STATUS`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `and`, `toDate`, `normalizeListStatus`, `normalizeMediaStatus`, `AnimeFormat`, `ListStatus`, `MediaStatus`
- `@NamelessLiberty/connections` — `getConnectionAdapter`, `decryptConnectionData`, `ConnectionError`, `ConnectionCredentials`

### Called By / Imported By
- [apps/servarr/core/servarr.ctrl.ts](./servarr.ctrl.md) ([[apps/servarr/core/servarr.ctrl]]) — `ServarrServ`
- [apps/servarr/extended/servarr-extended.serv.ts](../extended/servarr-extended.serv.md) ([[apps/servarr/extended/servarr-extended.serv]]) — `ServarrServ`, `extractServarrValidationErrors`, `formatServarrError`, `rewriteServarrImages`, `ServarrApp`, `ServarrConnectionContext`
