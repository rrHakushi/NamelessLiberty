# servarr-extended.ctrl.ts

- **Source**: [`apps/servarr/extended/servarr-extended.ctrl.ts`](../../../../../../../apps/elysia/src/apps/servarr/extended/servarr-extended.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/realtime/connect` | Activate upstream SignalR relay | Servarr - Realtime | params: `appParam` | `200`: `t.Object({ success: t.Boolean(), connected: t.Boolean(), provider: t.String(), realtimeStatus: t.Union([t.Literal('connected'), t.Literal('disconnected')]), })` | `ServarrExtendedServ.connectRealtime` |
| `GET` | `/borealis-link` | Resolve Borealis internal href by external ID | Servarr - Media | params: `appParam`<br>query: `t.Object({ tmdbId: t.Optional(t.Numeric()), tvdbId: t.Optional(t.Numeric()), })` | `200`: `t.Object({ href: t.Nullable(t.String()) })` | `ServarrExtendedServ.resolveBorealisHref` |
| `GET` | `/mediacover/:mediaId/:filename` | Proxy *arr MediaCover image | Servarr - Proxy | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), mediaId: t.Numeric(), filename: t.String(), })` | — | `ServarrExtendedServ.proxyMediaCover` |
| `GET` | `/config/naming/examples` | Get naming token examples | Servarr - Settings | params: `appParam` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getNamingExamples` |
| `GET` | `/config/:section` | Get settings section | Servarr - Settings | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), section: configSectionUnion, })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getConfigSection` |
| `PUT` | `/config/:section` | Update settings section | Servarr - Settings | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), section: configSectionUnion, })`<br>body: `t.Record(t.String(), t.Any())` | `200`: `extendedEnvelope` | `ServarrExtendedServ.updateConfigSection` |
| `GET` | `/providers/:resource` | List schema-driven providers | Servarr - Settings | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: providerResourceUnion, })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.listProviderResources` |
| `GET` | `/providers/:resource/schema` | Get provider implementation schemas | Servarr - Settings | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: providerResourceUnion, })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getProviderSchema` |
| `POST` | `/providers/:resource` | Create provider resource | Servarr - Settings | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: providerResourceUnion, })`<br>body: `t.Record(t.String(), t.Any())` | `200`: `extendedEnvelope` | `ServarrExtendedServ.createProviderResource` |
| `PUT` | `/providers/:resource/:id` | Update provider resource | Servarr - Settings | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: providerResourceUnion, id: t.Numeric(), })`<br>body: `t.Record(t.String(), t.Any())` | `200`: `extendedEnvelope` | `ServarrExtendedServ.updateProviderResource` |
| `DELETE` | `/providers/:resource/:id` | Delete provider resource | Servarr - Settings | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: providerResourceUnion, id: t.Numeric(), })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.deleteProviderResource` |
| `POST` | `/providers/:resource/test` | Test provider configuration | Servarr - Settings | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: providerResourceUnion, })`<br>query: `t.Optional(t.Object({ forceTest: t.Optional(t.Boolean()) }))`<br>body: `t.Record(t.String(), t.Any())` | `200`: `extendedEnvelope` | `ServarrExtendedServ.testProviderResource` |
| `POST` | `/providers/:resource/testall` | Test all configured providers | Servarr - Settings | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: providerResourceUnion, })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.testAllProviderResources` |
| `POST` | `/providers/:resource/action/:name` | Run provider dynamic field action | Servarr - Settings | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: providerResourceUnion, name: t.String(), })`<br>body: `t.Record(t.String(), t.Any())` | `200`: `extendedEnvelope` | `ServarrExtendedServ.runProviderAction` |
| `GET` | `/dictionaries` | Get languages, flags, profiles, folders, tags | Servarr - Settings | params: `appParam` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getDictionaries` |
| `GET` | `/tags/detail` | Get tag usage details | Servarr - Settings | params: `appParam` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getTagsDetail` |
| `PUT` | `/rules/delayprofile/reorder/:id` | Reorder delay profile priority | Servarr - Settings | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })`<br>query: `t.Object({ moveTo: t.Numeric() })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.reorderDelayProfile` |
| `PUT` | `/rules/qualitydefinition/bulk` | Bulk update quality definitions | Servarr - Settings | params: `appParam`<br>body: `t.Array(t.Record(t.String(), t.Any()))` | `200`: `extendedEnvelope` | `ServarrExtendedServ.bulkUpdateQualityDefinitions` |
| `GET` | `/rules/qualitydefinition/limits` | Get Radarr quality definition limits | Servarr - Settings | params: `appParam` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getQualityDefinitionLimits` |
| `GET` | `/rules/:resource` | List rule/profile/filter resource | Servarr - Settings | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: ruleResourceUnion, })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.listGeneric` |
| `GET` | `/rules/:resource/schema` | Get rule/profile schema | Servarr - Settings | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: ruleResourceUnion, })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getSchemaGeneric` |
| `POST` | `/rules/:resource` | Create rule/profile/filter resource | Servarr - Settings | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: ruleResourceUnion, })`<br>body: `t.Record(t.String(), t.Any())` | `200`: `extendedEnvelope` | `ServarrExtendedServ.createGeneric` |
| `PUT` | `/rules/:resource/:id` | Update rule/profile/filter resource | Servarr - Settings | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: ruleResourceUnion, id: t.Numeric(), })`<br>body: `t.Record(t.String(), t.Any())` | `200`: `extendedEnvelope` | `ServarrExtendedServ.updateGeneric` |
| `DELETE` | `/rules/:resource/:id` | Delete rule/profile/filter resource | Servarr - Settings | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: ruleResourceUnion, id: t.Numeric(), })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.deleteGeneric` |
| `GET` | `/exclusions` | List import list exclusions | Servarr - Settings | params: `appParam` | `200`: `extendedEnvelope` | `ServarrExtendedServ.listExclusions` |
| `POST` | `/exclusions` | Add import list exclusion | Servarr - Settings | params: `appParam`<br>body: `t.Record(t.String(), t.Any())` | `200`: `extendedEnvelope` | `ServarrExtendedServ.createExclusion` |
| `DELETE` | `/exclusions/bulk` | Bulk delete import list exclusions | Servarr - Settings | params: `appParam`<br>body: `t.Object({ ids: t.Array(t.Number()) })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.bulkDeleteExclusions` |
| `DELETE` | `/exclusions/:id` | Delete import list exclusion | Servarr - Settings | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.deleteExclusion` |
| `POST` | `/import` | Bulk import existing library folders | Servarr - Media | params: `appParam`<br>body: `t.Array(t.Record(t.String(), t.Any()))` | `200`: `extendedEnvelope` | `ServarrExtendedServ.importMedia` |
| `PUT` | `/files/:id` | Update movie/episode file metadata | Servarr - Files | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })`<br>body: `t.Record(t.String(), t.Any())` | `200`: `extendedEnvelope` | `ServarrExtendedServ.updateMediaFile` |
| `DELETE` | `/files/bulk` | Bulk delete movie/episode files | Servarr - Files | params: `appParam`<br>body: `t.Object({ ids: t.Array(t.Number()) })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.bulkDeleteMediaFiles` |
| `GET` | `/parse` | Parse release title/path | Servarr - Tools | params: `appParam`<br>query: `t.Object({ title: t.Optional(t.String()), path: t.Optional(t.String()), })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.parseRelease` |
| `GET` | `/credits` | Get Radarr movie credits | Servarr - Radarr | params: `appParam`<br>query: `t.Optional(t.Object({ movieId: t.Optional(t.Numeric()) }))` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getCredits` |
| `GET` | `/extrafiles` | Get Radarr movie extra files | Servarr - Radarr | params: `appParam`<br>query: `t.Object({ movieId: t.Numeric() })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getExtraFiles` |
| `GET` | `/alttitles` | Get Radarr movie alternative titles | Servarr - Radarr | params: `appParam`<br>query: `t.Optional(t.Object({ movieId: t.Optional(t.Numeric()) }))` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getAltTitles` |
| `GET` | `/collections` | List Radarr collections | Servarr - Radarr | params: `appParam`<br>query: `t.Optional(t.Object({ tmdbId: t.Optional(t.Numeric()) }))` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getCollections` |
| `PUT` | `/collections/:id` | Update Radarr collection | Servarr - Radarr | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })`<br>body: `t.Record(t.String(), t.Any())` | `200`: `extendedEnvelope` | `ServarrExtendedServ.updateCollection` |
| `GET` | `/discover` | Get Radarr Discover movies | Servarr - Radarr | params: `appParam`<br>query: `t.Optional(t.Object({ includeRecommendations: t.Optional(t.Boolean()), includeTrending: t.Optional(t.Boolean()), includePopular: t.Optional(t.Boolean()), }))` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getDiscoverMovies` |
| `POST` | `/discover` | Add Radarr Discover movies | Servarr - Radarr | params: `appParam`<br>body: `t.Array(t.Record(t.String(), t.Any()))` | `200`: `extendedEnvelope` | `ServarrExtendedServ.addDiscoverMovies` |
| `PUT` | `/series/:id/season` | Update Sonarr v5 series season | Servarr - Sonarr | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })`<br>body: `t.Record(t.String(), t.Any())` | `200`: `extendedEnvelope` | `ServarrExtendedServ.updateSeriesSeason` |
| `POST` | `/seasonpass` | Run Sonarr v5 Season Pass bulk update | Servarr - Sonarr | params: `appParam`<br>body: `t.Record(t.String(), t.Any())` | `200`: `extendedEnvelope` | `ServarrExtendedServ.runSeasonPass` |
| `GET` | `/queue/details` | Get queue details | Servarr - Activity | params: `appParam`<br>query: `t.Optional(t.Object({ movieId: t.Optional(t.Numeric()), seriesId: t.Optional(t.Numeric()), }))` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getQueueDetails` |
| `POST` | `/queue/grab/bulk` | Bulk grab pending queue items | Servarr - Activity | params: `appParam`<br>body: `t.Object({ ids: t.Array(t.Number()) })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.grabQueueBulk` |
| `POST` | `/queue/grab/:id` | Grab pending queue item | Servarr - Activity | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.grabQueueItem` |
| `DELETE` | `/queue/bulk` | Bulk remove queue items | Servarr - Activity | params: `appParam`<br>body: `t.Object({ ids: t.Array(t.Number()), removeFromClient: t.Optional(t.Boolean()), blocklist: t.Optional(t.Boolean()), skipRedownload: t.Optional(t.Boolean()), changeCategory: t.Optional(t.Boolean()), })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.deleteQueueBulk` |
| `GET` | `/history/scoped` | Get scoped movie/series/season/episode history | Servarr - Activity | params: `appParam`<br>query: `t.Object({ movieId: t.Optional(t.Numeric()), seriesId: t.Optional(t.Numeric()), seasonNumber: t.Optional(t.Numeric()), episodeId: t.Optional(t.Numeric()), eventType: t.Optional(t.String()), })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getScopedHistory` |
| `POST` | `/history/failed/:id` | Mark history download as failed | Servarr - Activity | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.markHistoryFailed` |
| `GET` | `/system/overview` | Get system status, health, diskspace, tasks, updates, stats | Servarr - System | params: `appParam` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getSystemOverview` |
| `GET` | `/system/commands` | List active and recent commands | Servarr - System | params: `appParam` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getCommands` |
| `DELETE` | `/system/commands/:id` | Cancel running command | Servarr - System | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.cancelCommand` |
| `GET` | `/system/backups` | List system backups | Servarr - System | params: `appParam` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getBackups` |
| `POST` | `/system/backups/restore/upload` | Upload and restore backup archive | Servarr - System | params: `appParam`<br>body: `t.Object({ file: t.File() })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.uploadBackupRestore` |
| `POST` | `/system/backups/restore/:id` | Restore existing backup | Servarr - System | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.restoreBackup` |
| `GET` | `/system/backups/:id/download` | Download backup archive | Servarr - System | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })` | — | `ServarrExtendedServ.downloadBackup` |
| `DELETE` | `/system/backups/:id` | Delete backup archive | Servarr - System | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.deleteBackup` |
| `POST` | `/system/restart` | Restart *arr instance | Servarr - System | params: `appParam` | `200`: `extendedEnvelope` | `ServarrExtendedServ.restartSystem` |
| `POST` | `/system/shutdown` | Shutdown *arr instance | Servarr - System | params: `appParam` | `200`: `extendedEnvelope` | `ServarrExtendedServ.shutdownSystem` |
| `GET` | `/log` | Get paginated system event logs | Servarr - System | params: `appParam`<br>query: `t.Optional(t.Object({ page: t.Optional(t.Numeric()), pageSize: t.Optional(t.Numeric()), sortKey: t.Optional(t.String()), sortDirection: t.Optional(t.String()), level: t.Optional(t.String()), }))` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getLogs` |
| `GET` | `/log/file` | List log files | Servarr - System | params: `appParam`<br>query: `t.Optional(t.Object({ update: t.Optional(t.Boolean()) }))` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getLogFiles` |
| `GET` | `/log/file/:filename/download` | Download log file contents | Servarr - System | params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), filename: t.String(), })`<br>query: `t.Optional(t.Object({ update: t.Optional(t.Boolean()) }))` | — | `ServarrExtendedServ.downloadLogFile` |
| `GET` | `/filesystem` | Browse remote *arr server filesystem | Servarr - Tools | params: `appParam`<br>query: `t.Optional(t.Object({ path: t.Optional(t.String()), includeFiles: t.Optional(t.Boolean()), allowFoldersWithoutTrailingSlashes: t.Optional(t.Boolean()), }))` | `200`: `extendedEnvelope` | `ServarrExtendedServ.browseFilesystem` |
| `GET` | `/filesystem/mediafiles` | List media files in server directory | Servarr - Tools | params: `appParam`<br>query: `t.Object({ path: t.String() })` | `200`: `extendedEnvelope` | `ServarrExtendedServ.getFilesystemMediaFiles` |

### `POST /realtime/connect` (L66)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.connectRealtime(app, user.id)`

### `GET /borealis-link` (L66)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, query: `t.Object({ tmdbId: t.Optional(t.Numeric()), tvdbId: t.Optional(t.Numeric()), })`
- **2.** `[Sequence]` Calls `userSession.requireUser`
- **3.** `[Return]`  — `await ServarrExtendedServ.resolveBorealisHref({ tmdbId: query.tmdbId ? Number(query.tmdbId) : undefined, tvdbId: query.tvdbId ? Number(query.tvdbId) : undefined, mediaType: app === 'radarr' ? 'movie' : 'tv', })`

### `GET /mediacover/:mediaId/:filename` (L66)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), mediaId: t.Numeric(), filename: t.String(), })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.proxyMediaCover(app, user.id, Number(mediaId), ...)`

### `GET /config/naming/examples` (L132)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getNamingExamples(app, user.id)`

### `GET /config/:section` (L132)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), section: configSectionUnion, })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getConfigSection(app, user.id, section)`

### `PUT /config/:section` (L132)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), section: configSectionUnion, })`, body: `t.Record(t.String(), t.Any())`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.updateConfigSection(app, user.id, section, ...)`

### `GET /providers/:resource` (L132)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: providerResourceUnion, })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.listProviderResources(app, user.id, resource)`

### `GET /providers/:resource/schema` (L132)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: providerResourceUnion, })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getProviderSchema(app, user.id, resource)`

### `POST /providers/:resource` (L132)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: providerResourceUnion, })`, body: `t.Record(t.String(), t.Any())`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.createProviderResource(app, user.id, resource, ...)`

### `PUT /providers/:resource/:id` (L132)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: providerResourceUnion, id: t.Numeric(), })`, body: `t.Record(t.String(), t.Any())`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.updateProviderResource(app, user.id, resource, ...)`

### `DELETE /providers/:resource/:id` (L132)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: providerResourceUnion, id: t.Numeric(), })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.deleteProviderResource(app, user.id, resource, ...)`

### `POST /providers/:resource/test` (L132)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: providerResourceUnion, })`, query: `t.Optional(t.Object({ forceTest: t.Optional(t.Boolean()) }))`, body: `t.Record(t.String(), t.Any())`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.testProviderResource(app, user.id, resource, ...)`

### `POST /providers/:resource/testall` (L132)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: providerResourceUnion, })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.testAllProviderResources(app, user.id, resource)`

### `POST /providers/:resource/action/:name` (L132)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: providerResourceUnion, name: t.String(), })`, body: `t.Record(t.String(), t.Any())`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.runProviderAction(app, user.id, resource, ...)`

### `GET /dictionaries` (L329)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getDictionaries(app, user.id)`

### `GET /tags/detail` (L329)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getTagsDetail(app, user.id)`

### `PUT /rules/delayprofile/reorder/:id` (L329)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })`, query: `t.Object({ moveTo: t.Numeric() })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.reorderDelayProfile(app, user.id, Number(id), ...)`

### `PUT /rules/qualitydefinition/bulk` (L329)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, body: `t.Array(t.Record(t.String(), t.Any()))`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.bulkUpdateQualityDefinitions(app, user.id, body)`

### `GET /rules/qualitydefinition/limits` (L329)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getQualityDefinitionLimits(app, user.id)`

### `GET /rules/:resource` (L329)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: ruleResourceUnion, })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.listGeneric(app, user.id, resource)`

### `GET /rules/:resource/schema` (L329)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: ruleResourceUnion, })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getSchemaGeneric(app, user.id, resource)`

### `POST /rules/:resource` (L329)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: ruleResourceUnion, })`, body: `t.Record(t.String(), t.Any())`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.createGeneric(app, user.id, resource, ...)`

### `PUT /rules/:resource/:id` (L329)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: ruleResourceUnion, id: t.Numeric(), })`, body: `t.Record(t.String(), t.Any())`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.updateGeneric(app, user.id, resource, ...)`

### `DELETE /rules/:resource/:id` (L329)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), resource: ruleResourceUnion, id: t.Numeric(), })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.deleteGeneric(app, user.id, resource, ...)`

### `GET /exclusions` (L329)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.listExclusions(app, user.id)`

### `POST /exclusions` (L329)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, body: `t.Record(t.String(), t.Any())`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.createExclusion(app, user.id, body)`

### `DELETE /exclusions/bulk` (L329)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, body: `t.Object({ ids: t.Array(t.Number()) })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.bulkDeleteExclusions(app, user.id, body.ids)`

### `DELETE /exclusions/:id` (L329)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.deleteExclusion(app, user.id, Number(id))`

### `POST /import` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, body: `t.Array(t.Record(t.String(), t.Any()))`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.importMedia(app, user.id, body)`

### `PUT /files/:id` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })`, body: `t.Record(t.String(), t.Any())`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.updateMediaFile(app, user.id, Number(id), ...)`

### `DELETE /files/bulk` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, body: `t.Object({ ids: t.Array(t.Number()) })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.bulkDeleteMediaFiles(app, user.id, body.ids)`

### `GET /parse` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, query: `t.Object({ title: t.Optional(t.String()), path: t.Optional(t.String()), })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.parseRelease(app, user.id, query)`

### `GET /credits` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, query: `t.Optional(t.Object({ movieId: t.Optional(t.Numeric()) }))`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getCredits(user.id, query?.movieId ? Number(query.movieId) : undefined)`

### `GET /extrafiles` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, query: `t.Object({ movieId: t.Numeric() })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getExtraFiles(user.id, Number(query.movieId))`

### `GET /alttitles` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, query: `t.Optional(t.Object({ movieId: t.Optional(t.Numeric()) }))`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getAltTitles(user.id, query?.movieId ? Number(query.movieId) : undefined)`

### `GET /collections` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, query: `t.Optional(t.Object({ tmdbId: t.Optional(t.Numeric()) }))`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getCollections(user.id, query?.tmdbId ? Number(query.tmdbId) : undefined)`

### `PUT /collections/:id` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })`, body: `t.Record(t.String(), t.Any())`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.updateCollection(user.id, Number(id), body)`

### `GET /discover` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, query: `t.Optional(t.Object({ includeRecommendations: t.Optional(t.Boolean()), includeTrending: t.Optional(t.Boolean()), includePopular: t.Optional(t.Boolean()), }))`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getDiscoverMovies(user.id, query ?? {})`

### `POST /discover` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, body: `t.Array(t.Record(t.String(), t.Any()))`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.addDiscoverMovies(user.id, body)`

### `PUT /series/:id/season` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })`, body: `t.Record(t.String(), t.Any())`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.updateSeriesSeason(user.id, Number(id), body)`

### `POST /seasonpass` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, body: `t.Record(t.String(), t.Any())`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.runSeasonPass(user.id, body)`

### `GET /queue/details` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, query: `t.Optional(t.Object({ movieId: t.Optional(t.Numeric()), seriesId: t.Optional(t.Numeric()), }))`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getQueueDetails(app, user.id, query ?? {})`

### `POST /queue/grab/bulk` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, body: `t.Object({ ids: t.Array(t.Number()) })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.grabQueueBulk(app, user.id, body.ids)`

### `POST /queue/grab/:id` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.grabQueueItem(app, user.id, Number(id))`

### `DELETE /queue/bulk` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, body: `t.Object({ ids: t.Array(t.Number()), removeFromClient: t.Optional(t.Boolean()), blocklist: t.Optional(t.Boolean()), skipRedownload: t.Optional(t.Boolean()), changeCategory: t.Optional(t.Boolean()), })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.deleteQueueBulk(app, user.id, body.ids, ...)`

### `GET /history/scoped` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, query: `t.Object({ movieId: t.Optional(t.Numeric()), seriesId: t.Optional(t.Numeric()), seasonNumber: t.Optional(t.Numeric()), episodeId: t.Optional(t.Numeric()), eventType: t.Optional(t.String()), })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getScopedHistory(app, user.id, { movieId: query.movieId ? Number(query.movieId) : undefined, seriesId: query.seriesId ? Number(query.seriesId) : undefined, seasonNumber: query.seasonNumber !== undefined ? Number(query.seasonNumber) : undefined, episodeId: query.episodeId ? Number(query.episodeId) : undefined, eventType: query.eventType, ...)`

### `POST /history/failed/:id` (L540)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.markHistoryFailed(app, user.id, Number(id))`

### `GET /system/overview` (L845)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getSystemOverview(app, user.id)`

### `GET /system/commands` (L845)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getCommands(app, user.id)`

### `DELETE /system/commands/:id` (L845)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.cancelCommand(app, user.id, Number(id))`

### `GET /system/backups` (L845)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getBackups(app, user.id)`

### `POST /system/backups/restore/upload` (L845)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, body: `t.Object({ file: t.File() })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.uploadBackupRestore(app, user.id, body.file)`

### `POST /system/backups/restore/:id` (L845)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.restoreBackup(app, user.id, Number(id))`

### `GET /system/backups/:id/download` (L845)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.downloadBackup(app, user.id, Number(id))`

### `DELETE /system/backups/:id` (L845)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), id: t.Numeric(), })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.deleteBackup(app, user.id, Number(id))`

### `POST /system/restart` (L845)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.restartSystem(app, user.id)`

### `POST /system/shutdown` (L845)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.shutdownSystem(app, user.id)`

### `GET /log` (L845)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, query: `t.Optional(t.Object({ page: t.Optional(t.Numeric()), pageSize: t.Optional(t.Numeric()), sortKey: t.Optional(t.String()), sortDirection: t.Optional(t.String()), level: t.Optional(t.String()), }))`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getLogs(app, user.id, query ?? {})`

### `GET /log/file` (L845)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, query: `t.Optional(t.Object({ update: t.Optional(t.Boolean()) }))`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getLogFiles(app, user.id, Boolean(query?.update))`

### `GET /log/file/:filename/download` (L845)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]), filename: t.String(), })`, query: `t.Optional(t.Object({ update: t.Optional(t.Boolean()) }))`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.downloadLogFile(app, user.id, filename, ...)`

### `GET /filesystem` (L845)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, query: `t.Optional(t.Object({ path: t.Optional(t.String()), includeFiles: t.Optional(t.Boolean()), allowFoldersWithoutTrailingSlashes: t.Optional(t.Boolean()), }))`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.browseFilesystem(app, user.id, query ?? {})`

### `GET /filesystem/mediafiles` (L845)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `appParam`, query: `t.Object({ path: t.String() })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrExtendedServ.getFilesystemMediaFiles(app, user.id, query.path)`

## Exported Types, Methods & Algorithms

### `const servarrExtendedRouter` (L1074)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- [apps/servarr/extended/servarr-extended.serv.ts](./servarr-extended.serv.md) ([[apps/servarr/extended/servarr-extended.serv]]) — `ServarrExtendedServ`
- `apps/servarr/_shared/servarr.model.ts` — `ServarrModel`

### External / Workspace Packages
- `elysia` — `Elysia`, `t`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_39`
- [apps/servarr/core/servarr.ctrl.ts](../core/servarr.ctrl.md) ([[apps/servarr/core/servarr.ctrl]]) — `servarrExtendedRouter`
