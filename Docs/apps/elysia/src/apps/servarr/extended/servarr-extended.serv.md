# servarr-extended.serv.ts

- **Source**: [`apps/servarr/extended/servarr-extended.serv.ts`](../../../../../../../apps/elysia/src/apps/servarr/extended/servarr-extended.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `ServarrExtendedServ extends BaseService`

## Exported Types, Methods & Algorithms

### `class ServarrExtendedServ` extends `BaseService` (L20)

#### `withConnection(app, userId, fallbackMsg, fn)` (L21)

- **1.** `[Sequence]` Calls `ServarrServ.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": false,
      "provider": "<ctx.provider>",
      "message": "<ctx.error || `No active ${ctx.provider} connection found`>",
      "data": "<null as T | null>",
      "validationErrors": "<[] as Array<{ propertyName: string errorMessage: string severity?: string }>>"
    }
    ```
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `fn` and stores result as `data`
  - **3.2.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": true,
      "provider": "<ctx.provider>",
      "data": "<data>",
      "validationErrors": "<[] as Array<{ propertyName: string errorMessage: string severity?: string }>>"
    }
    ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]` 
    ```json
    {
      "success": false,
      "connected": true,
      "provider": "<ctx.provider>",
      "message": "<formatServarrError(err, fallbackMsg)>",
      "data": "<null as T | null>",
      "validationErrors": "<extractServarrValidationErrors(err)>"
    }
    ```

#### `connectRealtime(app, userId)` (L71)

- **1.** `[Sequence]` Calls `ServarrServ.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || !ctx.credentials?.hostUrl || !ctx.credentials?.apiKey`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "connected": false,
      "provider": "<ctx.provider>",
      "realtimeStatus": "<'disconnected' as const>"
    }
    ```
- **3.** `[Sequence]` Calls `ServarrRealtimeServ.ensureConnected` and stores result as `realtimeStatus`
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "connected": true,
    "provider": "<ctx.provider>",
    "realtimeStatus": "<realtimeStatus>"
  }
  ```

#### `resolveBorealisHref(params)`: `Promise<{ href: string | null }>` (L102)

- **1.** `[Try]` Try block
  - **1.1.** `[If]` `params.mediaType === 'movie' && params.tmdbId`
    - **1.1.1.** `[Sequence]` Database `first` on `Movie` and stores it as `movie`
    - **1.1.2.** `[If]` `movie?.id`
      - **1.1.2.1.** `[Return]` 
        ```json
        {
          "href": "<`/borealis/movie/${movie.id}`>"
        }
        ```
  - **1.2.** `[If]` `params.mediaType === 'tv'`
    - **1.2.1.** `[If]` `params.tvdbId`
      - **1.2.1.1.** `[Sequence]` Database `first` on `Tv` and stores it as `tv`
      - **1.2.1.2.** `[If]` `tv?.id`
        - **1.2.1.2.1.** `[Return]` 
          ```json
          {
            "href": "<`/borealis/tv/${tv.id}`>"
          }
          ```
    - **1.2.2.** `[If]` `params.tmdbId`
      - **1.2.2.1.** `[Sequence]` Database `first` on `Tv` and stores it as `tv`
      - **1.2.2.2.** `[If]` `tv?.id`
        - **1.2.2.2.1.** `[Return]` 
          ```json
          {
            "href": "<`/borealis/tv/${tv.id}`>"
          }
          ```
- **2.** `[Catch]` Catch (`err`)
- **3.** `[Return]` 
  ```json
  {
    "href": null
  }
  ```

#### `getConfigSection(app, userId, section)` (L150)

- **1.** `[Return]`  — `this.withConnection(app, userId, `Failed to fetch ${section} settings`, ...)`

#### `updateConfigSection(app, userId, section, body)` (L160)

- **1.** `[Return]`  — `this.withConnection(app, userId, `Failed to update ${section} settings`, ...)`

#### `getNamingExamples(app, userId)` (L171)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to fetch naming examples', ...)`

#### `listProviderResources(app, userId, resource)` (L180)

- **1.** `[Return]`  — `this.withConnection(app, userId, `Failed to list ${resource}`, ...)`

#### `getProviderSchema(app, userId, resource)` (L190)

- **1.** `[Return]`  — `this.withConnection(app, userId, `Failed to fetch ${resource} schema`, ...)`

#### `createProviderResource(app, userId, resource, body)` (L200)

- **1.** `[Return]`  — `this.withConnection(app, userId, `Failed to create ${resource}`, ...)`

#### `updateProviderResource(app, userId, resource, id, body)` (L211)

- **1.** `[Return]`  — `this.withConnection(app, userId, `Failed to update ${resource}`, ...)`

#### `deleteProviderResource(app, userId, resource, id)` (L223)

- **1.** `[Return]`  — `this.withConnection(app, userId, `Failed to delete ${resource}`, ...)`

#### `bulkUpdateProviderResources(app, userId, resource, body)` (L234)

- **1.** `[Return]`  — `this.withConnection(app, userId, `Failed to bulk update ${resource}`, ...)`

#### `bulkDeleteProviderResources(app, userId, resource, ids)` (L245)

- **1.** `[Return]`  — `this.withConnection(app, userId, `Failed to bulk delete ${resource}`, ...)`

#### `testProviderResource(app, userId, resource, body, forceTest = false)` (L256)

- **1.** `[Return]`  — `this.withConnection(app, userId, `Failed to test ${resource}`, ...)`

#### `testAllProviderResources(app, userId, resource)` (L268)

- **1.** `[Return]`  — `this.withConnection(app, userId, `Failed to test all ${resource}`, ...)`

#### `runProviderAction(app, userId, resource, actionName, body)` (L278)

- **1.** `[Return]`  — `this.withConnection(app, userId, `Failed to run ${resource} action`, ...)`

#### `listGeneric(app, userId, resource, query)` (L293)

- **1.** `[Return]`  — `this.withConnection(app, userId, `Failed to list ${resource}`, ...)`

#### `getSchemaGeneric(app, userId, resource)` (L304)

- **1.** `[Return]`  — `this.withConnection(app, userId, `Failed to fetch ${resource} schema`, ...)`

#### `createGeneric(app, userId, resource, body)` (L314)

- **1.** `[Return]`  — `this.withConnection(app, userId, `Failed to create ${resource}`, ...)`

#### `updateGeneric(app, userId, resource, id, body)` (L325)

- **1.** `[Return]`  — `this.withConnection(app, userId, `Failed to update ${resource}`, ...)`

#### `deleteGeneric(app, userId, resource, id)` (L337)

- **1.** `[Return]`  — `this.withConnection(app, userId, `Failed to delete ${resource}`, ...)`

#### `bulkUpdateQualityDefinitions(app, userId, definitions)` (L348)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to update quality definitions', ...)`

#### `getQualityDefinitionLimits(app, userId)` (L358)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to fetch quality definition limits', ...)`

#### `reorderDelayProfile(app, userId, id, moveTo)` (L366)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to reorder delay profile', ...)`

#### `listExclusions(app, userId)` (L377)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to fetch import list exclusions', ...)`

#### `createExclusion(app, userId, body)` (L383)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to create exclusion', ...)`

#### `deleteExclusion(app, userId, id)` (L393)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to delete exclusion', ...)`

#### `bulkDeleteExclusions(app, userId, ids)` (L399)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to bulk delete exclusions', ...)`

#### `getTagsDetail(app, userId)` (L409)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to fetch tag details', ...)`

#### `getDictionaries(app, userId)` (L415)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to fetch dictionaries', ...)`

#### `importMedia(app, userId, items)` (L432)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to import media', ...)`

#### `getCredits(userId, movieId)` (L444)

- **1.** `[Return]`  — `this.withConnection('radarr', userId, 'Failed to fetch credits', ...)`

#### `getExtraFiles(userId, movieId)` (L450)

- **1.** `[Return]`  — `this.withConnection('radarr', userId, 'Failed to fetch extra files', ...)`

#### `getAltTitles(userId, movieId)` (L456)

- **1.** `[Return]`  — `this.withConnection('radarr', userId, 'Failed to fetch alternate titles', ...)`

#### `getCollections(userId, tmdbId)` (L462)

- **1.** `[Return]`  — `this.withConnection('radarr', userId, 'Failed to fetch collections', ...)`

#### `updateCollection(userId, id, body)` (L471)

- **1.** `[Return]`  — `this.withConnection('radarr', userId, 'Failed to update collection', ...)`

#### `getDiscoverMovies(userId, params)` (L481)

- **1.** `[Return]`  — `this.withConnection('radarr', userId, 'Failed to fetch discover movies', ...)`

#### `addDiscoverMovies(userId, movies)` (L487)

- **1.** `[Return]`  — `this.withConnection('radarr', userId, 'Failed to add discover movies', ...)`

#### `updateSeriesSeason(userId, seriesId, body)` (L496)

- **1.** `[Return]`  — `this.withConnection('sonarr', userId, 'Failed to update season', ...)`

#### `runSeasonPass(userId, body)` (L506)

- **1.** `[Return]`  — `this.withConnection('sonarr', userId, 'Failed to execute Season Pass', ...)`

#### `updateMediaFile(app, userId, id, body)` (L512)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to update media file', ...)`

#### `bulkDeleteMediaFiles(app, userId, fileIds)` (L525)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to delete media files', ...)`

#### `parseRelease(app, userId, params)` (L537)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to parse release', ...)`

#### `getQueueDetails(app, userId, params)` (L550)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to fetch queue details', ...)`

#### `grabQueueItem(app, userId, id)` (L560)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to grab queue item', ...)`

#### `grabQueueBulk(app, userId, ids)` (L566)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to grab queue items', ...)`

#### `deleteQueueBulk(app, userId, ids, options)` (L572)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to remove queue items', ...)`

#### `markHistoryFailed(app, userId, id)` (L588)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to mark download as failed', ...)`

#### `getScopedHistory(app, userId, params)` (L594)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to fetch scoped history', ...)`

#### `pushRelease(app, userId, release)` (L632)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to push release', ...)`

#### `getSystemOverview(app, userId)` (L645)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to fetch system overview', ...)`

#### `getCommands(app, userId)` (L671)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to fetch commands', ...)`

#### `cancelCommand(app, userId, id)` (L677)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to cancel command', ...)`

#### `getBackups(app, userId)` (L683)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to fetch backups', ...)`

#### `restoreBackup(app, userId, id)` (L689)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to restore backup', ...)`

#### `deleteBackup(app, userId, id)` (L695)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to delete backup', ...)`

#### `uploadBackupRestore(app, userId, file)` (L701)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to upload backup', ...)`

#### `downloadBackup(app, userId, id)`: `Promise<Response>` (L713)

- **1.** `[Sequence]` Calls `ServarrServ.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]`  — `new Response('Connection not found', { status: 404 })`
- **3.** `[Sequence]` Calls `ctx.adapter.getBackups` and stores result as `backups`
- **4.** `[Sequence]` Define `target`
  ```typescript
  const target = Array.isArray(backups) ? backups.find((b: any) => Number(b.id) === Number(id)) : null
  ```
- **5.** `[If]` `!target?.path`
  - **5.1.** `[Return]`  — `new Response('Backup not found', { status: 404 })`
- **6.** `[Sequence]` Calls `ctx.adapter.servarrFetchRaw` and stores result as `upstream`
- **7.** `[Return]`  — `new Response(upstream.body, { status: 200, headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/zip', 'Content-Disposition': `attachment; filename="${encodeURIComponent(target.name || `backup-${id}.zip`)}"`, }, ...`

#### `restartSystem(app, userId)` (L745)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to restart system', ...)`

#### `shutdownSystem(app, userId)` (L751)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to shutdown system', ...)`

#### `getLogs(app, userId, params)` (L757)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to fetch logs', ...)`

#### `getLogFiles(app, userId, update = false)` (L767)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to fetch log files', ...)`

#### `downloadLogFile(app, userId, filename, update = false)`: `Promise<Response>` (L777)

- **1.** `[Sequence]` Calls `ServarrServ.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]`  — `new Response('Connection not found', { status: 404 })`
- **3.** `[Sequence]` Calls `ctx.adapter.downloadLogFile` and stores result as `upstream`
- **4.** `[Return]`  — `new Response(upstream.body, { status: 200, headers: { 'Content-Type': upstream.headers.get('content-type') || 'text/plain; charset=utf-8', 'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`, }, ...`

#### `browseFilesystem(app, userId, params)` (L802)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to browse filesystem', ...)`

#### `getFilesystemMediaFiles(app, userId, path)` (L816)

- **1.** `[Return]`  — `this.withConnection(app, userId, 'Failed to list media files', ...)`

#### `proxyMediaCover(app, userId, mediaId, filename)`: `Promise<Response>` (L826)

- **1.** `[Sequence]` Calls `ServarrServ.getConnectionContext` and stores result as `ctx`
- **2.** `[If]` `!ctx.connected || !ctx.adapter || !ctx.credentials`
  - **2.1.** `[Return]`  — `new Response('Connection not found', { status: 404 })`
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `ctx.adapter.getMediaCover` and stores result as `upstream`
  - **3.2.** `[Return]`  — `new Response(upstream.body, { status: 200, headers: { 'Content-Type': upstream.headers.get('content-type') || 'image/jpeg', 'Cache-Control': 'private, max-age=86400', }, ...`
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Return]`  — `new Response('Image not found', { status: 404 })`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [apps/servarr/core/servarr.serv.ts](../core/servarr.serv.md) ([[apps/servarr/core/servarr.serv]]) — `ServarrServ`, `extractServarrValidationErrors`, `formatServarrError`, `rewriteServarrImages`, `ServarrApp`, `ServarrConnectionContext`
- [apps/servarr/realtime/servarr-realtime.serv.ts](../realtime/servarr-realtime.serv.md) ([[apps/servarr/realtime/servarr-realtime.serv]]) — `ServarrRealtimeServ`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`

### Called By / Imported By
- [apps/servarr/extended/servarr-extended.ctrl.ts](./servarr-extended.ctrl.md) ([[apps/servarr/extended/servarr-extended.ctrl]]) — `ServarrExtendedServ`
