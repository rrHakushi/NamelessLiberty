# anime.ctrl.ts

- **Source**: [`apps/borealis/anime/anime.ctrl.ts`](../../../../../../../apps/elysia/src/apps/borealis/anime/anime.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Get anime catalog | Borealis - Anime | query: `BorealisAnimeModel.catalogQuery` | `200`: `BorealisAnimeModel.catalogResponse`<br>`422`: `BorealisAnimeModel.validationError` | `BorealisAnimeServ.getCatalog` |
| `GET` | `/filters` | Get anime catalog filters | Borealis - Anime | — | `200`: `BorealisAnimeModel.filtersResponse` | `BorealisAnimeServ.getFilters` |
| `GET` | `/:animeId` | Get anime overview | Borealis - Anime | params: `BorealisAnimeModel.param` | `200`: `BorealisAnimeModel.detailResponse`<br>`404`: `BorealisAnimeModel.notFoundError`<br>`422`: `BorealisAnimeModel.validationError` | `BorealisAnimeServ.getById` |
| `POST` | `/:animeId/refresh` | Refresh anime metadata | Borealis - Anime | params: `BorealisAnimeModel.param` | `200`: `BorealisAnimeModel.refreshResponse`<br>`401`: `BorealisAnimeModel.unauthorizedError`<br>`404`: `BorealisAnimeModel.notFoundError`<br>`422`: `BorealisAnimeModel.validationError` | `BorealisAnimeServ.refresh` |
| `GET` | `/:animeId/similar` | Get similar anime | Borealis - Anime | params: `BorealisAnimeModel.param`<br>query: `BorealisAnimeModel.similarQuery` | `200`: `BorealisAnimeModel.similarResponse`<br>`404`: `BorealisAnimeModel.notFoundError`<br>`422`: `BorealisAnimeModel.validationError` | `BorealisAnimeServ.getSimilar` |
| `GET` | `/:animeId/relations` | Get anime relations | Borealis - Anime | params: `BorealisAnimeModel.param` | `200`: `BorealisAnimeModel.relationsResponse`<br>`404`: `BorealisAnimeModel.notFoundError`<br>`422`: `BorealisAnimeModel.validationError` | `BorealisAnimeServ.getRelations` |
| `GET` | `/:animeId/characters` | Get anime characters | Borealis - Anime | params: `BorealisAnimeModel.param` | `200`: `BorealisAnimeModel.charactersResponse`<br>`404`: `BorealisAnimeModel.notFoundError`<br>`422`: `BorealisAnimeModel.validationError` | `BorealisAnimeServ.getCharacters` |
| `GET` | `/:animeId/staff` | Get anime staff | Borealis - Anime | params: `BorealisAnimeModel.param` | `200`: `BorealisAnimeModel.staffResponse`<br>`404`: `BorealisAnimeModel.notFoundError`<br>`422`: `BorealisAnimeModel.validationError` | `BorealisAnimeServ.getStaff` |
| `GET` | `/:animeId/episodes` | Get anime episodes | Borealis - Anime | params: `BorealisAnimeModel.param` | `200`: `BorealisAnimeModel.episodesResponse`<br>`404`: `BorealisAnimeModel.notFoundError`<br>`422`: `BorealisAnimeModel.validationError` | `BorealisAnimeServ.getEpisodes` |
| `GET` | `/:animeId/images` | Get anime images | Borealis - Anime | params: `BorealisAnimeModel.param` | `200`: `BorealisAnimeModel.imagesResponse`<br>`404`: `BorealisAnimeModel.notFoundError`<br>`422`: `BorealisAnimeModel.validationError` | `BorealisAnimeServ.getImages` |
| `GET` | `/:animeId/stats` | Get anime statistics | Borealis - Anime | params: `BorealisAnimeModel.param` | `200`: `BorealisAnimeModel.statsResponse`<br>`404`: `BorealisAnimeModel.notFoundError`<br>`422`: `BorealisAnimeModel.validationError` | `BorealisAnimeServ.getStats` |
| `GET` | `/:animeId/friends` | Get friends tracking anime | Borealis - Anime | params: `BorealisAnimeModel.param` | `200`: `BorealisAnimeModel.friendsResponse`<br>`404`: `BorealisAnimeModel.notFoundError`<br>`422`: `BorealisAnimeModel.validationError` | `BorealisAnimeServ.getFriends` |
| `GET` | `/:animeId/people` | Get public people tracking anime | Borealis - Anime | params: `BorealisAnimeModel.param`<br>query: `BorealisAnimeModel.peopleQuery` | `200`: `BorealisAnimeModel.peopleResponse`<br>`404`: `BorealisAnimeModel.notFoundError`<br>`422`: `BorealisAnimeModel.validationError` | `BorealisAnimeServ.getPeople` |
| `GET` | `/:animeId/recommendations` | Get anime recommendations | Borealis - Anime | params: `BorealisAnimeModel.param` | `200`: `BorealisAnimeModel.recommendationsResponse`<br>`404`: `BorealisAnimeModel.notFoundError`<br>`422`: `BorealisAnimeModel.validationError` | `BorealisAnimeServ.getRecommendations` |

### `GET /` (L7)
Retrieves paginated anime catalog with cursor or page, supporting comprehensive multi-field filtering.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisAnimeModel.catalogQuery`
- **2.** `[Return]`  — `await BorealisAnimeServ.getCatalog(query)`

### `GET /filters` (L7)
Returns available filter facets and value counts for anime catalog.

- **1.** `[Return]`  — `await BorealisAnimeServ.getFilters()`

### `GET /:animeId` (L7)
Retrieves complete metadata overview for an anime item by ID.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisAnimeModel.param`
- **2.** `[Return]`  — `await BorealisAnimeServ.getById(animeId)`

### `POST /:animeId/refresh` (L7)
Enqueues background metadata refresh from external sources.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisAnimeModel.param`
- **2.** `[Sequence]` Calls `userSession.requireUser`
- **3.** `[Return]`  — `await BorealisAnimeServ.refresh(animeId)`

### `GET /:animeId/similar` (L88)
Retrieves algorithmic similarity recommendations (default 24 items).

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisAnimeModel.param`, query: `BorealisAnimeModel.similarQuery`
- **2.** `[Return]`  — `await BorealisAnimeServ.getSimilar(animeId, query?.limit)`

### `GET /:animeId/relations` (L88)
Retrieves cross-media relations and franchise connections.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisAnimeModel.param`
- **2.** `[Return]`  — `await BorealisAnimeServ.getRelations(animeId)`

### `GET /:animeId/characters` (L88)
Retrieves character cast and voice actor mappings.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisAnimeModel.param`
- **2.** `[Return]`  — `await BorealisAnimeServ.getCharacters(animeId)`

### `GET /:animeId/staff` (L88)
Retrieves production staff and credits.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisAnimeModel.param`
- **2.** `[Return]`  — `await BorealisAnimeServ.getStaff(animeId)`

### `GET /:animeId/episodes` (L172)
Retrieves list of anime episodes.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisAnimeModel.param`
- **2.** `[Return]`  — `await BorealisAnimeServ.getEpisodes(animeId)`

### `GET /:animeId/images` (L172)
Retrieves poster, banner, and image gallery.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisAnimeModel.param`
- **2.** `[Return]`  — `await BorealisAnimeServ.getImages(animeId)`

### `GET /:animeId/stats` (L172)
Retrieves score distribution, status counts, and aggregate metrics.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisAnimeModel.param`
- **2.** `[Return]`  — `await BorealisAnimeServ.getStats(animeId)`

### `GET /:animeId/friends` (L172)
Retrieves friends tracking status and standardized primary/secondary progress.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisAnimeModel.param`
- **2.** `[Sequence]` Calls `userSession.getUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisAnimeServ.getFriends(animeId, user?.id)`

### `GET /:animeId/people` (L256)
Retrieves paginated public user list entries for this anime item.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisAnimeModel.param`, query: `BorealisAnimeModel.peopleQuery`
- **2.** `[Return]`  — `await BorealisAnimeServ.getPeople(animeId, query)`

### `GET /:animeId/recommendations` (L256)
Retrieves user community recommendations.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisAnimeModel.param`
- **2.** `[Return]`  — `await BorealisAnimeServ.getRecommendations(animeId)`

## Exported Types, Methods & Algorithms

### `const borealisAnime` (L300)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/borealis/anime/anime.model.ts` — `BorealisAnimeModel`
- [apps/borealis/anime/anime.serv.ts](./anime.serv.md) ([[apps/borealis/anime/anime.serv]]) — `BorealisAnimeServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_3`
