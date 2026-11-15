# servarr.ctrl.ts

- **Source**: [`apps/servarr/core/servarr.ctrl.ts`](../../../../../../../apps/elysia/src/apps/servarr/core/servarr.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/blocklist` | — | — | query: `ServarrModel.blocklistQuery` | `200`: `ServarrModel.blocklistResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getBlocklist` |
| `DELETE` | `/blocklist` | — | — | query: `ServarrModel.deleteBlocklistQuery`<br>body: `ServarrModel.deleteBlocklistBody` | `200`: `ServarrModel.deleteBlocklistResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.deleteBlocklist` |
| `POST` | `/command` | — | — | body: `ServarrModel.commandBody` | `200`: `ServarrModel.commandResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.executeCommand` |
| `GET` | `/files` | — | — | query: `ServarrModel.filesQuery` | `200`: `ServarrModel.filesResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getFiles` |
| `DELETE` | `/files` | — | — | query: `ServarrModel.deleteFileQuery`<br>body: `ServarrModel.deleteFileBody` | `200`: `ServarrModel.deleteFileResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.deleteFile` |
| `GET` | `/history` | — | — | query: `ServarrModel.historyQuery` | `200`: `ServarrModel.historyResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getHistory` |
| `GET` | `/indexer` | — | — | — | `200`: `ServarrModel.indexerResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getIndexers` |
| `GET` | `/library` | — | — | — | `200`: `ServarrModel.libraryResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getLibrary` |
| `GET` | `/lookup` | — | — | query: `ServarrModel.lookupQuery` | `200`: `ServarrModel.lookupResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.lookup` |
| `POST` | `/lookup` | — | — | body: `ServarrModel.addLookupBody` | `200`: `ServarrModel.addLookupResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.addMedia` |
| `PUT` | `/manage` | — | — | body: `ServarrModel.managePutBody` | `200`: `ServarrModel.managePutResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.bulkUpdate` |
| `DELETE` | `/manage` | — | — | body: `ServarrModel.manageDeleteBody` | `200`: `ServarrModel.manageDeleteResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.bulkDelete` |
| `GET` | `/manualimport` | — | — | query: `ServarrModel.manualImportQuery` | `200`: `ServarrModel.manualImportResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getManualImport` |
| `POST` | `/manualimport` | — | — | body: `ServarrModel.manualImportBody` | `200`: `ServarrModel.executeManualImportResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.executeManualImport` |
| `GET` | `/queue` | — | — | query: `ServarrModel.queueQuery` | `200`: `ServarrModel.queueResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getQueue` |
| `DELETE` | `/queue` | — | — | query: `ServarrModel.deleteQueueQuery`<br>body: `ServarrModel.deleteQueueBody` | `200`: `ServarrModel.deleteQueueResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.deleteQueue` |
| `GET` | `/release` | — | — | query: `ServarrModel.releaseQuery` | `200`: `ServarrModel.releaseResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getReleases` |
| `POST` | `/release` | — | — | body: `ServarrModel.grabReleaseBody` | `200`: `ServarrModel.grabReleaseResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.grabRelease` |
| `GET` | `/rename` | — | — | query: `ServarrModel.renameQuery` | `200`: `ServarrModel.renameResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getRenamePreview` |
| `POST` | `/rename` | — | — | body: `ServarrModel.renameBody` | `200`: `ServarrModel.executeRenameResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.executeRename` |
| `GET` | `/wanted/cutoff` | — | — | query: `ServarrModel.wantedQuery` | `200`: `ServarrModel.wantedResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getWantedCutoff` |
| `GET` | `/wanted/missing` | — | — | query: `ServarrModel.wantedQuery` | `200`: `ServarrModel.wantedResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getWantedMissing` |
| `GET` | `/:app/blocklist` | Get blocklist entries | Servarr - Blocklist | params: `ServarrModel.appParam`<br>query: `ServarrModel.blocklistQuery` | `200`: `ServarrModel.blocklistResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getBlocklist` |
| `DELETE` | `/:app/blocklist` | Clear blocklist entries | Servarr - Blocklist | params: `ServarrModel.appParam`<br>query: `ServarrModel.deleteBlocklistQuery`<br>body: `ServarrModel.deleteBlocklistBody` | `200`: `ServarrModel.deleteBlocklistResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.deleteBlocklist` |
| `POST` | `/:app/command` | Trigger backend command/task | Servarr - Command | params: `ServarrModel.appParam`<br>body: `ServarrModel.commandBody` | `200`: `ServarrModel.commandResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.executeCommand` |
| `GET` | `/:app/files` | List downloaded media files | Servarr - Files | params: `ServarrModel.appParam`<br>query: `ServarrModel.filesQuery` | `200`: `ServarrModel.filesResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getFiles` |
| `DELETE` | `/:app/files` | Delete downloaded file | Servarr - Files | params: `ServarrModel.appParam`<br>query: `ServarrModel.deleteFileQuery`<br>body: `ServarrModel.deleteFileBody` | `200`: `ServarrModel.deleteFileResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.deleteFile` |
| `GET` | `/:app/history` | Get activity history | Servarr - History | params: `ServarrModel.appParam`<br>query: `ServarrModel.historyQuery` | `200`: `ServarrModel.historyResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getHistory` |
| `GET` | `/:app/indexer` | List indexers | Servarr - Indexer | params: `ServarrModel.appParam` | `200`: `ServarrModel.indexerResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getIndexers` |
| `GET` | `/:app/library` | Get full media library | Servarr - Library | params: `ServarrModel.appParam` | `200`: `ServarrModel.libraryResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getLibrary` |
| `GET` | `/:app/lookup` | Lookup media details (?term=...) | Servarr - Lookup | params: `ServarrModel.appParam`<br>query: `ServarrModel.lookupQuery` | `200`: `ServarrModel.lookupResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.lookup` |
| `POST` | `/:app/lookup` | Lookup media by external ID / Add media | Servarr - Lookup | params: `ServarrModel.appParam`<br>body: `ServarrModel.addLookupBody` | `200`: `ServarrModel.addLookupResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.addMedia` |
| `PUT` | `/:app/manage` | Update library items in batch | Servarr - Manage | params: `ServarrModel.appParam`<br>body: `ServarrModel.managePutBody` | `200`: `ServarrModel.managePutResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.bulkUpdate` |
| `DELETE` | `/:app/manage` | Delete library items in batch | Servarr - Manage | params: `ServarrModel.appParam`<br>body: `ServarrModel.manageDeleteBody` | `200`: `ServarrModel.manageDeleteResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.bulkDelete` |
| `GET` | `/:app/manualimport` | Preview files for manual import | Servarr - Manual Import | params: `ServarrModel.appParam`<br>query: `ServarrModel.manualImportQuery` | `200`: `ServarrModel.manualImportResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getManualImport` |
| `POST` | `/:app/manualimport` | Execute manual import | Servarr - Manual Import | params: `ServarrModel.appParam`<br>body: `ServarrModel.manualImportBody` | `200`: `ServarrModel.executeManualImportResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.executeManualImport` |
| `GET` | `/:app/queue` | Get active download queue | Servarr - Queue | params: `ServarrModel.appParam`<br>query: `ServarrModel.queueQuery` | `200`: `ServarrModel.queueResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getQueue` |
| `DELETE` | `/:app/queue` | Remove item from download queue | Servarr - Queue | params: `ServarrModel.appParam`<br>query: `ServarrModel.deleteQueueQuery`<br>body: `ServarrModel.deleteQueueBody` | `200`: `ServarrModel.deleteQueueResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.deleteQueue` |
| `GET` | `/:app/release` | Search releases for media | Servarr - Release | params: `ServarrModel.appParam`<br>query: `ServarrModel.releaseQuery` | `200`: `ServarrModel.releaseResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getReleases` |
| `POST` | `/:app/release` | Grab specific release | Servarr - Release | params: `ServarrModel.appParam`<br>body: `ServarrModel.grabReleaseBody` | `200`: `ServarrModel.grabReleaseResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.grabRelease` |
| `GET` | `/:app/rename` | Preview file rename operations | Servarr - Rename | params: `ServarrModel.appParam`<br>query: `ServarrModel.renameQuery` | `200`: `ServarrModel.renameResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getRenamePreview` |
| `POST` | `/:app/rename` | Execute file rename | Servarr - Rename | params: `ServarrModel.appParam`<br>body: `ServarrModel.renameBody` | `200`: `ServarrModel.executeRenameResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.executeRename` |
| `GET` | `/:app/wanted/cutoff` | List media not meeting cutoff profile | Servarr - Wanted | params: `ServarrModel.appParam`<br>query: `ServarrModel.wantedQuery` | `200`: `ServarrModel.wantedResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getWantedCutoff` |
| `GET` | `/:app/wanted/missing` | List missing media items | Servarr - Wanted | params: `ServarrModel.appParam`<br>query: `ServarrModel.wantedQuery` | `200`: `ServarrModel.wantedResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getWantedMissing` |
| `GET` | `/radarr/movies` | List managed movies | Servarr - Radarr | — | `200`: `ServarrModel.radarrMoviesFeedResponse`<br>`401`: `ServarrModel.unauthorizedError` | `ServarrServ.getRadarrMoviesFeed` |
| `GET` | `/radarr/movies/anime` | List managed anime movies | Servarr - Radarr | — | `200`: `ServarrModel.radarrMoviesFeedResponse`<br>`401`: `ServarrModel.unauthorizedError` | `ServarrServ.getRadarrAnimeMoviesFeed` |
| `GET` | `/radarr/movies/anime/api/v3/movie` | Raw Radarr Anime v3 movie API proxy | Servarr - Radarr | — | `200`: `ServarrModel.radarrMoviesFeedResponse`<br>`401`: `ServarrModel.unauthorizedError` | `ServarrServ.getRadarrAnimeMoviesFeed` |
| `GET` | `/radarr/movies/anime/api/v3/qualityprofile` | Raw Radarr Anime v3 quality profile proxy | Servarr - Radarr | — | `200`: `ServarrModel.qualityProfileResponse` | `ServarrServ.getQualityProfiles` |
| `GET` | `/radarr/movies/anime/api/v3/system/status` | Raw Radarr Anime v3 system status proxy | Servarr - Radarr | — | `200`: `ServarrModel.systemStatusResponse` | `ServarrServ.getSystemStatus` |
| `GET` | `/radarr/movies/api/v3/movie` | Raw Radarr Standard v3 movie API proxy | Servarr - Radarr | — | `200`: `ServarrModel.radarrMoviesFeedResponse`<br>`401`: `ServarrModel.unauthorizedError` | `ServarrServ.getRadarrMoviesFeed` |
| `GET` | `/radarr/movies/api/v3/qualityprofile` | Raw Radarr Standard v3 quality profile proxy | Servarr - Radarr | — | `200`: `ServarrModel.qualityProfileResponse` | `ServarrServ.getQualityProfiles` |
| `GET` | `/radarr/movies/api/v3/system/status` | Raw Radarr Standard v3 system status proxy | Servarr - Radarr | — | `200`: `ServarrModel.systemStatusResponse` | `ServarrServ.getSystemStatus` |
| `GET` | `/radarr/movies/:id` | Get movie details by ID | Servarr - Radarr | params: `ServarrModel.idParam` | `200`: `ServarrModel.radarrMovieDetailResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getRadarrMovieById` |
| `PUT` | `/radarr/movies/:id` | Update movie details | Servarr - Radarr | params: `ServarrModel.idParam`<br>body: `ServarrModel.radarrMovieUpdateBody` | `200`: `ServarrModel.radarrMovieUpdateResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.updateRadarrMovie` |
| `DELETE` | `/radarr/movies/:id` | Delete movie from library | Servarr - Radarr | params: `ServarrModel.idParam`<br>query: `ServarrModel.deleteItemQuery`<br>body: `ServarrModel.deleteItemBody` | `200`: `ServarrModel.deleteItemResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.deleteRadarrMovie` |
| `GET` | `/sonarr/anime` | List managed anime series | Servarr - Sonarr | — | `200`: `ServarrModel.sonarrSeriesFeedResponse`<br>`401`: `ServarrModel.unauthorizedError` | `ServarrServ.getSonarrAnimeFeed` |
| `GET` | `/sonarr/anime/api/v3/series` | Raw Sonarr Anime v3 series API proxy | Servarr - Sonarr | — | `200`: `ServarrModel.sonarrSeriesFeedResponse`<br>`401`: `ServarrModel.unauthorizedError` | `ServarrServ.getSonarrAnimeFeed` |
| `GET` | `/sonarr/anime/api/v3/qualityprofile` | Raw Sonarr Anime v3 quality profile proxy | Servarr - Sonarr | — | `200`: `ServarrModel.qualityProfileResponse` | `ServarrServ.getQualityProfiles` |
| `GET` | `/sonarr/anime/api/v3/system/status` | Raw Sonarr Anime v3 system status proxy | Servarr - Sonarr | — | `200`: `ServarrModel.systemStatusResponse` | `ServarrServ.getSystemStatus` |
| `GET` | `/sonarr/tv` | List managed TV series | Servarr - Sonarr | — | `200`: `ServarrModel.sonarrSeriesFeedResponse`<br>`401`: `ServarrModel.unauthorizedError` | `ServarrServ.getSonarrTvFeed` |
| `GET` | `/sonarr/tv/api/v3/series` | Raw Sonarr TV v3 series API proxy | Servarr - Sonarr | — | `200`: `ServarrModel.sonarrSeriesFeedResponse`<br>`401`: `ServarrModel.unauthorizedError` | `ServarrServ.getSonarrTvFeed` |
| `GET` | `/sonarr/tv/api/v3/qualityprofile` | Raw Sonarr TV v3 quality profile proxy | Servarr - Sonarr | — | `200`: `ServarrModel.qualityProfileResponse` | `ServarrServ.getQualityProfiles` |
| `GET` | `/sonarr/tv/api/v3/system/status` | Raw Sonarr TV v3 system status proxy | Servarr - Sonarr | — | `200`: `ServarrModel.systemStatusResponse` | `ServarrServ.getSystemStatus` |
| `GET` | `/sonarr/series/:id` | Get series details by ID | Servarr - Sonarr | params: `ServarrModel.idParam` | `200`: `ServarrModel.sonarrSeriesDetailResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.getSonarrSeriesById` |
| `PUT` | `/sonarr/series/:id` | Update series details | Servarr - Sonarr | params: `ServarrModel.idParam`<br>body: `ServarrModel.sonarrSeriesUpdateBody` | `200`: `ServarrModel.sonarrSeriesUpdateResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.updateSonarrSeries` |
| `DELETE` | `/sonarr/series/:id` | Delete series from library | Servarr - Sonarr | params: `ServarrModel.idParam`<br>query: `ServarrModel.deleteItemQuery`<br>body: `ServarrModel.deleteItemBody` | `200`: `ServarrModel.deleteItemResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.deleteSonarrSeries` |
| `PUT` | `/sonarr/episode/monitor` | Batch toggle episode monitor state | Servarr - Sonarr | body: `ServarrModel.episodeMonitorBody` | `200`: `ServarrModel.episodeMonitorResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.setEpisodeMonitoring` |
| `PUT` | `/sonarr/episode/:id` | Update episode details | Servarr - Sonarr | params: `ServarrModel.idParam`<br>body: `ServarrModel.sonarrEpisodeUpdateBody` | `200`: `ServarrModel.sonarrEpisodeUpdateResponse`<br>`401`: `ServarrModel.unauthorizedError`<br>`422`: `ServarrModel.validationError` | `ServarrServ.updateSonarrEpisode` |

### `GET /blocklist` (L8)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `ServarrModel.blocklistQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getBlocklist(app, user.id, query)`

### `DELETE /blocklist` (L8)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `ServarrModel.deleteBlocklistQuery`, body: `ServarrModel.deleteBlocklistBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.deleteBlocklist(app, user.id, query, ...)`

### `POST /command` (L8)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `ServarrModel.commandBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.executeCommand(app, user.id, body)`

### `GET /files` (L8)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `ServarrModel.filesQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getFiles(app, user.id, query)`

### `DELETE /files` (L8)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `ServarrModel.deleteFileQuery`, body: `ServarrModel.deleteFileBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.deleteFile(app, user.id, query, ...)`

### `GET /history` (L8)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `ServarrModel.historyQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getHistory(app, user.id, query)`

### `GET /indexer` (L8)

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await ServarrServ.getIndexers(app, user.id)`

### `GET /library` (L8)

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await ServarrServ.getLibrary(app, user.id)`

### `GET /lookup` (L8)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `ServarrModel.lookupQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.lookup(app, user.id, query)`

### `POST /lookup` (L8)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `ServarrModel.addLookupBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.addMedia(app, user.id, body)`

### `PUT /manage` (L8)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `ServarrModel.managePutBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.bulkUpdate(app, user.id, body)`

### `DELETE /manage` (L8)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `ServarrModel.manageDeleteBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.bulkDelete(app, user.id, body)`

### `GET /manualimport` (L205)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `ServarrModel.manualImportQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getManualImport(app, user.id, query)`

### `POST /manualimport` (L205)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `ServarrModel.manualImportBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.executeManualImport(app, user.id, body)`

### `GET /queue` (L205)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `ServarrModel.queueQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getQueue(app, user.id, query)`

### `DELETE /queue` (L205)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `ServarrModel.deleteQueueQuery`, body: `ServarrModel.deleteQueueBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.deleteQueue(app, user.id, query, ...)`

### `GET /release` (L205)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `ServarrModel.releaseQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getReleases(app, user.id, query)`

### `POST /release` (L205)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `ServarrModel.grabReleaseBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.grabRelease(app, user.id, body)`

### `GET /rename` (L205)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `ServarrModel.renameQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getRenamePreview(app, user.id, query)`

### `POST /rename` (L205)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `ServarrModel.renameBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.executeRename(app, user.id, body)`

### `GET /wanted/cutoff` (L205)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `ServarrModel.wantedQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getWantedCutoff(app, user.id, query)`

### `GET /wanted/missing` (L205)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `ServarrModel.wantedQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getWantedMissing(app, user.id, query)`

### `GET /:app/blocklist` (L370)
Fetches blacklisted releases that failed or were manually rejected.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, query: `ServarrModel.blocklistQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getBlocklist(app, user.id, query)`

### `DELETE /:app/blocklist` (L370)
Removes one or more releases from the blocklist to allow re-downloading.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, query: `ServarrModel.deleteBlocklistQuery`, body: `ServarrModel.deleteBlocklistBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.deleteBlocklist(app, user.id, query, ...)`

### `POST /:app/command` (L370)
Triggers maintenance commands (Refresh, RssSync, MissingSearch, RenameFiles, etc.).

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, body: `ServarrModel.commandBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.executeCommand(app, user.id, body)`

### `GET /:app/files` (L370)
Fetches downloaded media files and media info for a movie or TV series.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, query: `ServarrModel.filesQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getFiles(app, user.id, query)`

### `DELETE /:app/files` (L370)
Deletes a specific movie or episode media file from disk.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, query: `ServarrModel.deleteFileQuery`, body: `ServarrModel.deleteFileBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.deleteFile(app, user.id, query, ...)`

### `GET /:app/history` (L370)
Fetches audit log of grab, import, upgrade, and file deletion events.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, query: `ServarrModel.historyQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getHistory(app, user.id, query)`

### `GET /:app/indexer` (L370)
Returns configured torrent/usenet indexers.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getIndexers(app, user.id)`

### `GET /:app/library` (L370)
Fetches added media library directly from the connected instance with local database fallback.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getLibrary(app, user.id)`

### `GET /:app/lookup` (L370)
Searches for new media items to add, including root folders and quality profiles.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, query: `ServarrModel.lookupQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.lookup(app, user.id, query)`

### `POST /:app/lookup` (L370)
Adds a new media item to library.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, body: `ServarrModel.addLookupBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.addMedia(app, user.id, body)`

### `PUT /:app/manage` (L370)
Mass edits media items (monitored, profile, series type, root folder).

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, body: `ServarrModel.managePutBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.bulkUpdate(app, user.id, body)`

### `DELETE /:app/manage` (L370)
Mass deletes media items from library.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, body: `ServarrModel.manageDeleteBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.bulkDelete(app, user.id, body)`

### `GET /:app/manualimport` (L694)
Scans a folder or download for manual importing.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, query: `ServarrModel.manualImportQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getManualImport(app, user.id, query)`

### `POST /:app/manualimport` (L694)
Imports selected files into library.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, body: `ServarrModel.manualImportBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.executeManualImport(app, user.id, body)`

### `GET /:app/queue` (L694)
Fetches active and queued downloads.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, query: `ServarrModel.queueQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getQueue(app, user.id, query)`

### `DELETE /:app/queue` (L694)
Cancels or removes a queued download item.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, query: `ServarrModel.deleteQueueQuery`, body: `ServarrModel.deleteQueueBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.deleteQueue(app, user.id, query, ...)`

### `GET /:app/release` (L694)
Searches indexers for available releases (interactive search).

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, query: `ServarrModel.releaseQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getReleases(app, user.id, query)`

### `POST /:app/release` (L694)
Instructs the application to download a specific release.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, body: `ServarrModel.grabReleaseBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.grabRelease(app, user.id, body)`

### `GET /:app/rename` (L694)
Returns preview diff of proposed filename changes for media files.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, query: `ServarrModel.renameQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getRenamePreview(app, user.id, query)`

### `POST /:app/rename` (L694)
Applies standard naming conventions to selected files.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, body: `ServarrModel.renameBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.executeRename(app, user.id, body)`

### `GET /:app/wanted/cutoff` (L900)
Fetches media whose file quality is below the profile cutoff.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, query: `ServarrModel.wantedQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getWantedCutoff(app, user.id, query)`

### `GET /:app/wanted/missing` (L900)
Fetches monitored media that is missing from disk.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.appParam`, query: `ServarrModel.wantedQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getWantedMissing(app, user.id, query)`

### `GET /radarr/movies` (L900)
Fetches Radarr movie import feed based on user settings and library.

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await ServarrServ.getRadarrMoviesFeed(user.id)`

### `GET /radarr/movies/anime` (L900)
Fetches Radarr anime movie import feed based on user settings and library.

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await ServarrServ.getRadarrAnimeMoviesFeed(user.id)`

### `GET /radarr/movies/anime/api/v3/movie` (L900)
Emulates Radarr movie endpoint for anime movie import lists.

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await ServarrServ.getRadarrAnimeMoviesFeed(user.id)`

### `GET /radarr/movies/anime/api/v3/qualityprofile` (L900)
Returns mock quality profiles for Radarr list validation.

- **1.** `[Return]` Returns expression — `ServarrServ.getQualityProfiles()`

### `GET /radarr/movies/anime/api/v3/system/status` (L900)
Returns mock system status for Radarr list validation.

- **1.** `[Return]` Returns expression — `ServarrServ.getSystemStatus()`

### `GET /radarr/movies/api/v3/movie` (L900)
Emulates Radarr movie endpoint for standard movie import lists.

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await ServarrServ.getRadarrMoviesFeed(user.id)`

### `GET /radarr/movies/api/v3/qualityprofile` (L900)
Returns mock quality profiles for Radarr list validation.

- **1.** `[Return]` Returns expression — `ServarrServ.getQualityProfiles()`

### `GET /radarr/movies/api/v3/system/status` (L900)
Returns mock system status for Radarr list validation.

- **1.** `[Return]` Returns expression — `ServarrServ.getSystemStatus()`

### `GET /radarr/movies/:id` (L900)
Fetches full movie data, media info, and disk files.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.idParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getRadarrMovieById(user.id, Number(id))`

### `PUT /radarr/movies/:id` (L900)
Updates movie metadata, monitoring, or profile configuration.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.idParam`, body: `ServarrModel.radarrMovieUpdateBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.updateRadarrMovie(user.id, Number(id), body)`

### `DELETE /radarr/movies/:id` (L900)
Removes movie and optionally deletes files from disk.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.idParam`, query: `ServarrModel.deleteItemQuery`, body: `ServarrModel.deleteItemBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Sequence]` Define `deleteFiles`, `addExclusion`
  ```typescript
  const deleteFiles = query?.deleteFiles === 'true' || query?.deleteFiles === true || body?.deleteFiles === true
  const addExclusion = query?.addImportListExclusion === 'true' || query?.addImportListExclusion === true || body?.addImportListExclusion === true
  ```
- **4.** `[Return]`  — `await ServarrServ.deleteRadarrMovie(user.id, Number(id), { deleteFiles, addImportListExclusion: addExclusion, })`

### `GET /sonarr/anime` (L1188)
Fetches Sonarr anime series import feed based on user settings and library.

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await ServarrServ.getSonarrAnimeFeed(user.id)`

### `GET /sonarr/anime/api/v3/series` (L1188)
Emulates Sonarr series endpoint for anime series import lists.

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await ServarrServ.getSonarrAnimeFeed(user.id)`

### `GET /sonarr/anime/api/v3/qualityprofile` (L1188)
Returns mock quality profiles for Sonarr list validation.

- **1.** `[Return]` Returns expression — `ServarrServ.getQualityProfiles()`

### `GET /sonarr/anime/api/v3/system/status` (L1188)
Returns mock system status for Sonarr list validation.

- **1.** `[Return]` Returns expression — `ServarrServ.getSystemStatus()`

### `GET /sonarr/tv` (L1188)
Fetches Sonarr TV series import feed based on user settings and library.

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await ServarrServ.getSonarrTvFeed(user.id)`

### `GET /sonarr/tv/api/v3/series` (L1188)
Emulates Sonarr series endpoint for TV series import lists.

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await ServarrServ.getSonarrTvFeed(user.id)`

### `GET /sonarr/tv/api/v3/qualityprofile` (L1188)
Returns mock quality profiles for Sonarr list validation.

- **1.** `[Return]` Returns expression — `ServarrServ.getQualityProfiles()`

### `GET /sonarr/tv/api/v3/system/status` (L1188)
Returns mock system status for Sonarr list validation.

- **1.** `[Return]` Returns expression — `ServarrServ.getSystemStatus()`

### `GET /sonarr/series/:id` (L1188)
Fetches full series data, season/episode list, and episode files.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.idParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.getSonarrSeriesById(user.id, Number(id))`

### `PUT /sonarr/series/:id` (L1188)
Updates series metadata, monitoring, or profile configuration.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.idParam`, body: `ServarrModel.sonarrSeriesUpdateBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.updateSonarrSeries(user.id, Number(id), body)`

### `DELETE /sonarr/series/:id` (L1188)
Removes series and optionally deletes files from disk.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.idParam`, query: `ServarrModel.deleteItemQuery`, body: `ServarrModel.deleteItemBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Sequence]` Define `deleteFiles`, `addExclusion`
  ```typescript
  const deleteFiles = query?.deleteFiles === 'true' || query?.deleteFiles === true || body?.deleteFiles === true
  const addExclusion = query?.addImportListExclusion === 'true' || query?.addImportListExclusion === true || body?.addImportListExclusion === true
  ```
- **4.** `[Return]`  — `await ServarrServ.deleteSonarrSeries(user.id, Number(id), { deleteFiles, addImportListExclusion: addExclusion, })`

### `PUT /sonarr/episode/monitor` (L1188)
Enables or disables monitoring for a list of episode IDs.

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `ServarrModel.episodeMonitorBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.setEpisodeMonitoring(user.id, body.episodeIds, body.monitored)`

### `PUT /sonarr/episode/:id` (L1188)
Updates episode properties, including monitoring status.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `ServarrModel.idParam`, body: `ServarrModel.sonarrEpisodeUpdateBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ServarrServ.updateSonarrEpisode(user.id, Number(id), body)`

## Exported Types, Methods & Algorithms

### `const servarrController` (L1472)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/servarr/_shared/servarr.model.ts` — `ServarrModel`
- [apps/servarr/core/servarr.serv.ts](./servarr.serv.md) ([[apps/servarr/core/servarr.serv]]) — `ServarrServ`
- [apps/servarr/extended/servarr-extended.ctrl.ts](../extended/servarr-extended.ctrl.md) ([[apps/servarr/extended/servarr-extended.ctrl]]) — `servarrExtendedRouter`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_38`
