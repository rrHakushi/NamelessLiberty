# lists.ctrl.ts

- **Source**: [`apps/borealis/lists/lists.ctrl.ts`](../../../../../../../apps/elysia/src/apps/borealis/lists/lists.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/anime` | Get anime list (40 per page) | Borealis Lists - Anime | query: `BorealisListsModel.listQuery` | `200`: `BorealisListsModel.listResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.getAnimeList` |
| `GET` | `/anime/stats` | Get anime list statistics | Borealis Lists - Anime | query: `BorealisListsModel.statsQuery` | `200`: `BorealisListsModel.statsResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getAnimeStats` |
| `GET` | `/anime/filters` | Get available anime list filters | Borealis Lists - Anime | query: `BorealisListsModel.statsQuery` | `200`: `BorealisListsModel.filtersResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getAnimeFilters` |
| `GET` | `/anime/:animeId` | Check / get anime in user list | Borealis Lists - Anime | params: `BorealisListsModel.animeParam` | `200`: `BorealisListsModel.singleResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.getAnimeEntry` |
| `POST` | `/anime/:animeId` | Add or update anime in list | Borealis Lists - Anime | params: `BorealisListsModel.animeParam`<br>body: `BorealisListsModel.animeBody` | `200`: `BorealisListsModel.upsertResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.upsertAnimeEntry` |
| `DELETE` | `/anime/:animeId` | Remove anime from list | Borealis Lists - Anime | params: `BorealisListsModel.animeParam` | `200`: `BorealisListsModel.deleteResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.deleteAnimeEntry` |
| `POST` | `/anime/:animeId/increment` | Increment episode progress | Borealis Lists - Anime | params: `BorealisListsModel.animeParam`<br>body: `BorealisListsModel.animeIncrementBody` | `200`: `BorealisListsModel.upsertResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.incrementAnime` |
| `GET` | `/manga` | Get manga list (40 per page) | Borealis Lists - Manga | query: `BorealisListsModel.listQuery` | `200`: `BorealisListsModel.listResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.getMangaList` |
| `GET` | `/manga/stats` | Get manga list statistics | Borealis Lists - Manga | query: `BorealisListsModel.statsQuery` | `200`: `BorealisListsModel.statsResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getMangaStats` |
| `GET` | `/manga/filters` | Get available manga list filters | Borealis Lists - Manga | query: `BorealisListsModel.statsQuery` | `200`: `BorealisListsModel.filtersResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getMangaFilters` |
| `GET` | `/manga/:mangaId` | Check / get manga in user list | Borealis Lists - Manga | params: `BorealisListsModel.mangaParam` | `200`: `BorealisListsModel.singleResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.getMangaEntry` |
| `POST` | `/manga/:mangaId` | Add or update manga in list | Borealis Lists - Manga | params: `BorealisListsModel.mangaParam`<br>body: `BorealisListsModel.mangaBody` | `200`: `BorealisListsModel.upsertResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.upsertMangaEntry` |
| `DELETE` | `/manga/:mangaId` | Remove manga from list | Borealis Lists - Manga | params: `BorealisListsModel.mangaParam` | `200`: `BorealisListsModel.deleteResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.deleteMangaEntry` |
| `POST` | `/manga/:mangaId/increment` | Increment chapter/volume progress | Borealis Lists - Manga | params: `BorealisListsModel.mangaParam`<br>body: `BorealisListsModel.mangaIncrementBody` | `200`: `BorealisListsModel.upsertResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.incrementManga` |
| `GET` | `/movies` | Get movies list (40 per page) | Borealis Lists - Movies | query: `BorealisListsModel.listQuery` | `200`: `BorealisListsModel.listResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.getMovieList` |
| `GET` | `/movies/stats` | Get movies list statistics | Borealis Lists - Movies | query: `BorealisListsModel.statsQuery` | `200`: `BorealisListsModel.statsResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getMovieStats` |
| `GET` | `/movies/filters` | Get available movies list filters | Borealis Lists - Movies | query: `BorealisListsModel.statsQuery` | `200`: `BorealisListsModel.filtersResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getMovieFilters` |
| `GET` | `/movies/:movieId` | Check / get movie in user list | Borealis Lists - Movies | params: `BorealisListsModel.movieParam` | `200`: `BorealisListsModel.singleResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.getMovieEntry` |
| `POST` | `/movies/:movieId` | Add or update movie in list | Borealis Lists - Movies | params: `BorealisListsModel.movieParam`<br>body: `BorealisListsModel.movieBody` | `200`: `BorealisListsModel.upsertResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.upsertMovieEntry` |
| `DELETE` | `/movies/:movieId` | Remove movie from list | Borealis Lists - Movies | params: `BorealisListsModel.movieParam` | `200`: `BorealisListsModel.deleteResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.deleteMovieEntry` |
| `POST` | `/movies/:movieId/increment` | Increment rewatch progress | Borealis Lists - Movies | params: `BorealisListsModel.movieParam`<br>body: `BorealisListsModel.movieIncrementBody` | `200`: `BorealisListsModel.upsertResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.incrementMovie` |
| `GET` | `/tv` | Get TV list (40 per page) | Borealis Lists - TV | query: `BorealisListsModel.listQuery` | `200`: `BorealisListsModel.listResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.getTvList` |
| `GET` | `/tv/stats` | Get TV list statistics | Borealis Lists - TV | query: `BorealisListsModel.statsQuery` | `200`: `BorealisListsModel.statsResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getTvStats` |
| `GET` | `/tv/filters` | Get available TV list filters | Borealis Lists - TV | query: `BorealisListsModel.statsQuery` | `200`: `BorealisListsModel.filtersResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getTvFilters` |
| `GET` | `/tv/:tvId` | Check / get TV series in user list | Borealis Lists - TV | params: `BorealisListsModel.tvParam` | `200`: `BorealisListsModel.singleResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.getTvEntry` |
| `POST` | `/tv/:tvId` | Add or update TV series in list | Borealis Lists - TV | params: `BorealisListsModel.tvParam`<br>body: `BorealisListsModel.tvBody` | `200`: `BorealisListsModel.upsertResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.upsertTvEntry` |
| `DELETE` | `/tv/:tvId` | Remove TV series from list | Borealis Lists - TV | params: `BorealisListsModel.tvParam` | `200`: `BorealisListsModel.deleteResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.deleteTvEntry` |
| `POST` | `/tv/:tvId/increment` | Increment episode progress | Borealis Lists - TV | params: `BorealisListsModel.tvParam`<br>body: `BorealisListsModel.tvIncrementBody` | `200`: `BorealisListsModel.upsertResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.incrementTv` |
| `GET` | `/games` | Get games list (40 per page) | Borealis Lists - Games | query: `BorealisListsModel.listQuery` | `200`: `BorealisListsModel.listResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.getGameList` |
| `GET` | `/games/stats` | Get games list statistics | Borealis Lists - Games | query: `BorealisListsModel.statsQuery` | `200`: `BorealisListsModel.statsResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getGameStats` |
| `GET` | `/games/filters` | Get available games list filters | Borealis Lists - Games | query: `BorealisListsModel.statsQuery` | `200`: `BorealisListsModel.filtersResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getGameFilters` |
| `GET` | `/games/:gameId` | Check / get game in user list | Borealis Lists - Games | params: `BorealisListsModel.gameParam` | `200`: `BorealisListsModel.singleResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.getGameEntry` |
| `POST` | `/games/:gameId` | Add or update game in list | Borealis Lists - Games | params: `BorealisListsModel.gameParam`<br>body: `BorealisListsModel.gameBody` | `200`: `BorealisListsModel.upsertResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.upsertGameEntry` |
| `DELETE` | `/games/:gameId` | Remove game from list | Borealis Lists - Games | params: `BorealisListsModel.gameParam` | `200`: `BorealisListsModel.deleteResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.deleteGameEntry` |
| `POST` | `/games/:gameId/increment` | Increment playtime / hours progress | Borealis Lists - Games | params: `BorealisListsModel.gameParam`<br>body: `BorealisListsModel.gameIncrementBody` | `200`: `BorealisListsModel.upsertResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.incrementGame` |
| `GET` | `/books` | Get books list (40 per page) | Borealis Lists - Books | query: `BorealisListsModel.listQuery` | `200`: `BorealisListsModel.listResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.getBookList` |
| `GET` | `/books/stats` | Get books list statistics | Borealis Lists - Books | query: `BorealisListsModel.statsQuery` | `200`: `BorealisListsModel.statsResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getBookStats` |
| `GET` | `/books/filters` | Get available books list filters | Borealis Lists - Books | query: `BorealisListsModel.statsQuery` | `200`: `BorealisListsModel.filtersResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getBookFilters` |
| `GET` | `/books/:bookId` | Check / get book in user list | Borealis Lists - Books | params: `BorealisListsModel.bookParam` | `200`: `BorealisListsModel.singleResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.getBookEntry` |
| `POST` | `/books/:bookId` | Add or update book in list | Borealis Lists - Books | params: `BorealisListsModel.bookParam`<br>body: `BorealisListsModel.bookBody` | `200`: `BorealisListsModel.upsertResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.upsertBookEntry` |
| `DELETE` | `/books/:bookId` | Remove book from list | Borealis Lists - Books | params: `BorealisListsModel.bookParam` | `200`: `BorealisListsModel.deleteResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.deleteBookEntry` |
| `POST` | `/books/:bookId/increment` | Increment page / chapter progress | Borealis Lists - Books | params: `BorealisListsModel.bookParam`<br>body: `BorealisListsModel.bookIncrementBody` | `200`: `BorealisListsModel.upsertResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.incrementBook` |
| `GET` | `/music` | Get music list (40 per page) | Borealis Lists - Music | query: `BorealisListsModel.listQuery` | `200`: `BorealisListsModel.listResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.getMusicList` |
| `GET` | `/music/stats` | Get music list statistics | Borealis Lists - Music | query: `BorealisListsModel.statsQuery` | `200`: `BorealisListsModel.statsResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getMusicStats` |
| `GET` | `/music/filters` | Get available music list filters | Borealis Lists - Music | query: `BorealisListsModel.statsQuery` | `200`: `BorealisListsModel.filtersResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getMusicFilters` |
| `GET` | `/music/:musicId` | Check / get album/track in user list | Borealis Lists - Music | params: `BorealisListsModel.musicParam` | `200`: `BorealisListsModel.singleResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.getMusicEntry` |
| `POST` | `/music/:musicId` | Add or update music in list | Borealis Lists - Music | params: `BorealisListsModel.musicParam`<br>body: `BorealisListsModel.musicBody` | `200`: `BorealisListsModel.upsertResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.upsertMusicEntry` |
| `DELETE` | `/music/:musicId` | Remove music from list | Borealis Lists - Music | params: `BorealisListsModel.musicParam` | `200`: `BorealisListsModel.deleteResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.deleteMusicEntry` |
| `POST` | `/music/:musicId/increment` | Increment listen count progress | Borealis Lists - Music | params: `BorealisListsModel.musicParam`<br>body: `BorealisListsModel.musicIncrementBody` | `200`: `BorealisListsModel.upsertResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.incrementMusic` |
| `GET` | `/other` | Get custom/other list (40 per page) | Borealis Lists - Other | query: `BorealisListsModel.listQuery` | `200`: `BorealisListsModel.listResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.getOtherList` |
| `GET` | `/other/stats` | Get other list statistics | Borealis Lists - Other | query: `BorealisListsModel.statsQuery` | `200`: `BorealisListsModel.statsResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getOtherStats` |
| `GET` | `/other/filters` | Get available other list filters | Borealis Lists - Other | query: `BorealisListsModel.statsQuery` | `200`: `BorealisListsModel.filtersResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getOtherFilters` |
| `GET` | `/other/:otherId` | Check / get item in other list | Borealis Lists - Other | params: `BorealisListsModel.otherParam` | `200`: `BorealisListsModel.singleResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.getOtherEntry` |
| `POST` | `/other/:otherId` | Add or update item in other list | Borealis Lists - Other | params: `BorealisListsModel.otherParam`<br>body: `BorealisListsModel.otherBody` | `200`: `BorealisListsModel.upsertResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.upsertOtherEntry` |
| `DELETE` | `/other/:otherId` | Remove item from other list | Borealis Lists - Other | params: `BorealisListsModel.otherParam` | `200`: `BorealisListsModel.deleteResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.deleteOtherEntry` |
| `POST` | `/other/:otherId/increment` | Increment custom progress | Borealis Lists - Other | params: `BorealisListsModel.otherParam`<br>body: `BorealisListsModel.otherIncrementBody` | `200`: `BorealisListsModel.upsertResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.incrementOther` |
| `GET` | `/export` | Export user lists to JSON | Borealis Lists - Global | query: `BorealisListsModel.exportQuery` | `200`: `BorealisListsModel.exportResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.exportUserLists` |
| `GET` | `/export/shares` | List active export shares | Borealis Lists - Global | — | `200`: `BorealisListsModel.listSharesResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.listExportShares` |
| `POST` | `/export/shares` | Create password-protected export share link | Borealis Lists - Global | body: `BorealisListsModel.createShareBody` | `200`: `BorealisListsModel.createShareResponse`<br>`400`: `BorealisListsModel.badRequestError`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.createExportShare` |
| `DELETE` | `/export/shares/:shareId` | Revoke export share link | Borealis Lists - Global | params: `BorealisListsModel.revokeShareParam` | `200`: `BorealisListsModel.revokeShareResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`404`: `BorealisListsModel.notFoundError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.revokeExportShare` |
| `POST` | `/import` | Import lists from JSON / external backups | Borealis Lists - Global | body: `BorealisListsModel.importBody` | `200`: `BorealisListsModel.importResponse`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.importUserLists` |
| `POST` | `/import/fetch-remote` | Fetch and preview remote IRIS export URL with password | Borealis Lists - Global | body: `BorealisListsModel.fetchRemoteBody` | `200`: `BorealisListsModel.fetchRemoteResponse`<br>`400`: `BorealisListsModel.badRequestError`<br>`401`: `BorealisListsModel.unauthorizedError`<br>`422`: `BorealisListsModel.validationError` | `BorealisListsServ.fetchRemoteExport` |
| `GET` | `/stats` | Get aggregated multi-media list statistics | Borealis Lists - Global | query: `BorealisListsModel.globalStatsQuery` | `200`: `BorealisListsModel.globalStatsResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getGlobalListStats` |
| `GET` | `/watching` | Get all watching media in all lists at once | Borealis Lists - Global | query: `BorealisListsModel.watchingQuery` | `200`: `BorealisListsModel.watchingResponse`<br>`401`: `BorealisListsModel.unauthorizedError` | `BorealisListsServ.getAllWatchingMedia` |

### `GET /anime` (L7)
Retrieves user anime list with pagination and optional filters.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.listQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getAnimeList(targetUserId, query)`

### `GET /anime/stats` (L7)
Aggregates statistics for the user anime list.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.statsQuery`
- **2.** `[Sequence]` Define `targetUserId`, `callerId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  const callerId = userSession.user?.id
  ```
- **3.** `[Sequence]` Calls `Boolean` and stores result as `isOwner`
- **4.** `[Return]`  — `await BorealisListsServ.getAnimeStats(targetUserId, query, isOwner)`

### `GET /anime/filters` (L7)
Returns available filter facets from the user anime list.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.statsQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getAnimeFilters(targetUserId)`

### `GET /anime/:animeId` (L7)
Retrieves a single anime list entry for the user if present.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.animeParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.getAnimeEntry(user.id, animeId)`

### `POST /anime/:animeId` (L7)
Upserts an anime entry in the user list.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.animeParam`, body: `BorealisListsModel.animeBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.upsertAnimeEntry(user.id, animeId, body)`

### `DELETE /anime/:animeId` (L123)
Deletes an anime entry from the user list.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.animeParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.deleteAnimeEntry(user.id, animeId)`

### `POST /anime/:animeId/increment` (L123)
Increments the episodes watched count for an anime entry.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.animeParam`, body: `BorealisListsModel.animeIncrementBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.incrementAnime(user.id, animeId, body)`

### `GET /manga` (L123)
Retrieves user manga list with pagination and optional filters.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.listQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getMangaList(targetUserId, query)`

### `GET /manga/stats` (L123)
Aggregates statistics for the user manga list.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.statsQuery`
- **2.** `[Sequence]` Define `targetUserId`, `callerId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  const callerId = userSession.user?.id
  ```
- **3.** `[Sequence]` Calls `Boolean` and stores result as `isOwner`
- **4.** `[Return]`  — `await BorealisListsServ.getMangaStats(targetUserId, query, isOwner)`

### `GET /manga/filters` (L123)
Returns available filter facets from the user manga list.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.statsQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getMangaFilters(targetUserId)`

### `GET /manga/:mangaId` (L244)
Retrieves a single manga list entry for the user if present.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.mangaParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.getMangaEntry(user.id, mangaId)`

### `POST /manga/:mangaId` (L244)
Upserts a manga entry in the user list.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.mangaParam`, body: `BorealisListsModel.mangaBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.upsertMangaEntry(user.id, mangaId, body)`

### `DELETE /manga/:mangaId` (L244)
Deletes a manga entry from the user list.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.mangaParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.deleteMangaEntry(user.id, mangaId)`

### `POST /manga/:mangaId/increment` (L244)
Increments the chapters or volumes read count for a manga entry.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.mangaParam`, body: `BorealisListsModel.mangaIncrementBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.incrementManga(user.id, mangaId, body)`

### `GET /movies` (L244)
Retrieves user movies list with pagination and optional filters.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.listQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getMovieList(targetUserId, query)`

### `GET /movies/stats` (L367)
Aggregates statistics for the user movie list.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.statsQuery`
- **2.** `[Sequence]` Define `targetUserId`, `callerId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  const callerId = userSession.user?.id
  ```
- **3.** `[Sequence]` Calls `Boolean` and stores result as `isOwner`
- **4.** `[Return]`  — `await BorealisListsServ.getMovieStats(targetUserId, query, isOwner)`

### `GET /movies/filters` (L367)
Returns available filter facets from the user movie list.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.statsQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getMovieFilters(targetUserId)`

### `GET /movies/:movieId` (L367)
Retrieves a single movie list entry for the user if present.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.movieParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.getMovieEntry(user.id, movieId)`

### `POST /movies/:movieId` (L367)
Upserts a movie entry in the user list.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.movieParam`, body: `BorealisListsModel.movieBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.upsertMovieEntry(user.id, movieId, body)`

### `DELETE /movies/:movieId` (L367)
Deletes a movie entry from the user list.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.movieParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.deleteMovieEntry(user.id, movieId)`

### `POST /movies/:movieId/increment` (L484)
Increments the rewatched count for a movie entry.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.movieParam`, body: `BorealisListsModel.movieIncrementBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.incrementMovie(user.id, movieId, body)`

### `GET /tv` (L484)
Retrieves user TV series list with pagination and optional filters.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.listQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getTvList(targetUserId, query)`

### `GET /tv/stats` (L484)
Aggregates statistics for the user TV list.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.statsQuery`
- **2.** `[Sequence]` Define `targetUserId`, `callerId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  const callerId = userSession.user?.id
  ```
- **3.** `[Sequence]` Calls `Boolean` and stores result as `isOwner`
- **4.** `[Return]`  — `await BorealisListsServ.getTvStats(targetUserId, query, isOwner)`

### `GET /tv/filters` (L484)
Returns available filter facets from the user TV list.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.statsQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getTvFilters(targetUserId)`

### `GET /tv/:tvId` (L484)
Retrieves a single TV series list entry for the user if present.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.tvParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.getTvEntry(user.id, tvId)`

### `POST /tv/:tvId` (L604)
Upserts a TV series entry in the user list.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.tvParam`, body: `BorealisListsModel.tvBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.upsertTvEntry(user.id, tvId, body)`

### `DELETE /tv/:tvId` (L604)
Deletes a TV series entry from the user list.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.tvParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.deleteTvEntry(user.id, tvId)`

### `POST /tv/:tvId/increment` (L604)
Increments the episodes watched count for a TV series entry.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.tvParam`, body: `BorealisListsModel.tvIncrementBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.incrementTv(user.id, tvId, body)`

### `GET /games` (L604)
Retrieves user games list with pagination and optional filters.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.listQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getGameList(targetUserId, query)`

### `GET /games/stats` (L604)
Aggregates statistics for the user game list.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.statsQuery`
- **2.** `[Sequence]` Define `targetUserId`, `callerId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  const callerId = userSession.user?.id
  ```
- **3.** `[Sequence]` Calls `Boolean` and stores result as `isOwner`
- **4.** `[Return]`  — `await BorealisListsServ.getGameStats(targetUserId, query, isOwner)`

### `GET /games/filters` (L728)
Returns available filter facets from the user game list.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.statsQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getGameFilters(targetUserId)`

### `GET /games/:gameId` (L728)
Retrieves a single game list entry for the user if present.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.gameParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.getGameEntry(user.id, gameId)`

### `POST /games/:gameId` (L728)
Upserts a game entry in the user list.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.gameParam`, body: `BorealisListsModel.gameBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.upsertGameEntry(user.id, gameId, body)`

### `DELETE /games/:gameId` (L728)
Deletes a game entry from the user list.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.gameParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.deleteGameEntry(user.id, gameId)`

### `POST /games/:gameId/increment` (L728)
Increments the playtime progress for a game entry.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.gameParam`, body: `BorealisListsModel.gameIncrementBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.incrementGame(user.id, gameId, body)`

### `GET /books` (L850)
Retrieves user books list with pagination and optional filters.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.listQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getBookList(targetUserId, query)`

### `GET /books/stats` (L850)
Aggregates statistics for the user book list.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.statsQuery`
- **2.** `[Sequence]` Define `targetUserId`, `callerId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  const callerId = userSession.user?.id
  ```
- **3.** `[Sequence]` Calls `Boolean` and stores result as `isOwner`
- **4.** `[Return]`  — `await BorealisListsServ.getBookStats(targetUserId, query, isOwner)`

### `GET /books/filters` (L850)
Returns available filter facets from the user book list.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.statsQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getBookFilters(targetUserId)`

### `GET /books/:bookId` (L850)
Retrieves a single book list entry for the user if present.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.bookParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.getBookEntry(user.id, bookId)`

### `POST /books/:bookId` (L850)
Upserts a book entry in the user list.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.bookParam`, body: `BorealisListsModel.bookBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.upsertBookEntry(user.id, bookId, body)`

### `DELETE /books/:bookId` (L966)
Deletes a book entry from the user list.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.bookParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.deleteBookEntry(user.id, bookId)`

### `POST /books/:bookId/increment` (L966)
Increments the pages or chapters read count for a book entry.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.bookParam`, body: `BorealisListsModel.bookIncrementBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.incrementBook(user.id, bookId, body)`

### `GET /music` (L966)
Retrieves user music list with pagination and optional filters.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.listQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getMusicList(targetUserId, query)`

### `GET /music/stats` (L966)
Aggregates statistics for the user music list.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.statsQuery`
- **2.** `[Sequence]` Define `targetUserId`, `callerId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  const callerId = userSession.user?.id
  ```
- **3.** `[Sequence]` Calls `Boolean` and stores result as `isOwner`
- **4.** `[Return]`  — `await BorealisListsServ.getMusicStats(targetUserId, query, isOwner)`

### `GET /music/filters` (L966)
Returns available filter facets from the user music list.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.statsQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getMusicFilters(targetUserId)`

### `GET /music/:musicId` (L1087)
Retrieves a single music list entry for the user if present.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.musicParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.getMusicEntry(user.id, musicId)`

### `POST /music/:musicId` (L1087)
Upserts a music entry in the user list.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.musicParam`, body: `BorealisListsModel.musicBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.upsertMusicEntry(user.id, musicId, body)`

### `DELETE /music/:musicId` (L1087)
Deletes a music entry from the user list.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.musicParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.deleteMusicEntry(user.id, musicId)`

### `POST /music/:musicId/increment` (L1087)
Increments the listen count for a music entry.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.musicParam`, body: `BorealisListsModel.musicIncrementBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.incrementMusic(user.id, musicId, body)`

### `GET /other` (L1087)
Retrieves custom/other list items with pagination.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.listQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getOtherList(targetUserId, query)`

### `GET /other/stats` (L1209)
Aggregates statistics for the user other list.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.statsQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getOtherStats(targetUserId)`

### `GET /other/filters` (L1209)
Returns available filter facets from the user other list.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.statsQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getOtherFilters(targetUserId)`

### `GET /other/:otherId` (L1209)
Retrieves a single entry in other list if present.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.otherParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.getOtherEntry(user.id, otherId)`

### `POST /other/:otherId` (L1209)
Upserts an item in the other list.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.otherParam`, body: `BorealisListsModel.otherBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.upsertOtherEntry(user.id, otherId, body)`

### `DELETE /other/:otherId` (L1209)
Deletes an item from the other list.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.otherParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.deleteOtherEntry(user.id, otherId)`

### `POST /other/:otherId/increment` (L1324)
Increments the progress value for an item in the other list.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.otherParam`, body: `BorealisListsModel.otherIncrementBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.incrementOther(user.id, otherId, body)`

### `GET /export` (L1324)
Exports all user media lists and custom lists as canonical IRIS JSON backup.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.exportQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.exportUserLists(user.id, query)`

### `GET /export/shares` (L1324)

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await BorealisListsServ.listExportShares(user.id)`

### `POST /export/shares` (L1324)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `BorealisListsModel.createShareBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.createExportShare(user.id, body)`

### `DELETE /export/shares/:shareId` (L1324)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisListsModel.revokeShareParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.revokeExportShare(user.id, shareId)`

### `POST /import` (L1440)
Imports or synchronizes user media lists from IRIS JSON backup or list items.

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `BorealisListsModel.importBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisListsServ.importUserLists(user.id, body)`

### `POST /import/fetch-remote` (L1440)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `BorealisListsModel.fetchRemoteBody`
- **2.** `[Sequence]` Calls `userSession.requireUser`
- **3.** `[Return]`  — `await BorealisListsServ.fetchRemoteExport(body.url, body.password)`

### `GET /stats` (L1440)
Calculates overarching statistics across all 7 media types with optional period filtering.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.globalStatsQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getGlobalListStats(targetUserId, query)`

### `GET /watching` (L1440)
Retrieves all currently in-progress items across anime, tv, movie, manga, game, book, music, and other lists at once.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisListsModel.watchingQuery`
- **2.** `[Sequence]` Define `targetUserId`
  ```typescript
  const targetUserId = query?.userId || userSession.requireUser().id
  ```
- **3.** `[Return]`  — `await BorealisListsServ.getAllWatchingMedia(targetUserId, query?.limit)`

## Exported Types, Methods & Algorithms

### `const borealisLists` (L1528)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/borealis/lists/lists.model.ts` — `BorealisListsModel`
- [apps/borealis/lists/lists.serv.ts](./lists.serv.md) ([[apps/borealis/lists/lists.serv]]) — `BorealisListsServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_8`
