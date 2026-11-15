# tv.ctrl.ts

- **Source**: [`apps/borealis/tv/tv.ctrl.ts`](../../../../../../../apps/elysia/src/apps/borealis/tv/tv.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Get TV show catalog | Borealis - TV | query: `BorealisTvModel.catalogQuery` | `200`: `BorealisTvModel.catalogResponse`<br>`422`: `BorealisTvModel.validationError` | `BorealisTvServ.getCatalog` |
| `GET` | `/filters` | Get TV catalog filters | Borealis - TV | — | `200`: `BorealisTvModel.filtersResponse` | `BorealisTvServ.getFilters` |
| `GET` | `/:tvId` | Get TV show overview | Borealis - TV | params: `BorealisTvModel.param` | `200`: `BorealisTvModel.detailResponse`<br>`404`: `BorealisTvModel.notFoundError`<br>`422`: `BorealisTvModel.validationError` | `BorealisTvServ.getById` |
| `POST` | `/:tvId/refresh` | Refresh TV show metadata | Borealis - TV | params: `BorealisTvModel.param` | `200`: `BorealisTvModel.refreshResponse`<br>`401`: `BorealisTvModel.unauthorizedError`<br>`404`: `BorealisTvModel.notFoundError`<br>`422`: `BorealisTvModel.validationError` | `BorealisTvServ.refresh` |
| `GET` | `/:tvId/similar` | Get similar TV shows | Borealis - TV | params: `BorealisTvModel.param`<br>query: `BorealisTvModel.similarQuery` | `200`: `BorealisTvModel.similarResponse`<br>`404`: `BorealisTvModel.notFoundError`<br>`422`: `BorealisTvModel.validationError` | `BorealisTvServ.getSimilar` |
| `GET` | `/:tvId/characters` | Get TV show characters | Borealis - TV | params: `BorealisTvModel.param` | `200`: `BorealisTvModel.charactersResponse`<br>`404`: `BorealisTvModel.notFoundError`<br>`422`: `BorealisTvModel.validationError` | `BorealisTvServ.getCharacters` |
| `GET` | `/:tvId/staff` | Get TV show staff | Borealis - TV | params: `BorealisTvModel.param` | `200`: `BorealisTvModel.staffResponse`<br>`404`: `BorealisTvModel.notFoundError`<br>`422`: `BorealisTvModel.validationError` | `BorealisTvServ.getStaff` |
| `GET` | `/:tvId/seasons` | Get TV show seasons | Borealis - TV | params: `BorealisTvModel.param` | `200`: `BorealisTvModel.seasonsResponse`<br>`404`: `BorealisTvModel.notFoundError`<br>`422`: `BorealisTvModel.validationError` | `BorealisTvServ.getSeasons` |
| `GET` | `/:tvId/episodes` | Get TV show episodes | Borealis - TV | params: `BorealisTvModel.param` | `200`: `BorealisTvModel.episodesResponse`<br>`404`: `BorealisTvModel.notFoundError`<br>`422`: `BorealisTvModel.validationError` | `BorealisTvServ.getEpisodes` |
| `GET` | `/:tvId/images` | Get TV show images | Borealis - TV | params: `BorealisTvModel.param` | `200`: `BorealisTvModel.imagesResponse`<br>`404`: `BorealisTvModel.notFoundError`<br>`422`: `BorealisTvModel.validationError` | `BorealisTvServ.getImages` |
| `GET` | `/:tvId/stats` | Get TV show statistics | Borealis - TV | params: `BorealisTvModel.param` | `200`: `BorealisTvModel.statsResponse`<br>`404`: `BorealisTvModel.notFoundError`<br>`422`: `BorealisTvModel.validationError` | `BorealisTvServ.getStats` |
| `GET` | `/:tvId/friends` | Get friends tracking TV show | Borealis - TV | params: `BorealisTvModel.param` | `200`: `BorealisTvModel.friendsResponse`<br>`404`: `BorealisTvModel.notFoundError`<br>`422`: `BorealisTvModel.validationError` | `BorealisTvServ.getFriends` |
| `GET` | `/:tvId/people` | Get public people tracking TV show | Borealis - TV | params: `BorealisTvModel.param`<br>query: `BorealisTvModel.peopleQuery` | `200`: `BorealisTvModel.peopleResponse`<br>`404`: `BorealisTvModel.notFoundError`<br>`422`: `BorealisTvModel.validationError` | `BorealisTvServ.getPeople` |
| `GET` | `/:tvId/recommendations` | Get TV show recommendations | Borealis - TV | params: `BorealisTvModel.param` | `200`: `BorealisTvModel.recommendationsResponse`<br>`404`: `BorealisTvModel.notFoundError`<br>`422`: `BorealisTvModel.validationError` | `BorealisTvServ.getRecommendations` |

### `GET /` (L7)
Retrieves paginated TV catalog with cursor or page, supporting comprehensive multi-field filtering.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisTvModel.catalogQuery`
- **2.** `[Return]`  — `await BorealisTvServ.getCatalog(query)`

### `GET /filters` (L7)
Returns available filter facets and value counts for TV catalog.

- **1.** `[Return]`  — `await BorealisTvServ.getFilters()`

### `GET /:tvId` (L7)
Retrieves complete metadata overview for a TV show by ID.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisTvModel.param`
- **2.** `[Return]`  — `await BorealisTvServ.getById(tvId)`

### `POST /:tvId/refresh` (L7)
Enqueues background metadata refresh from external sources.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisTvModel.param`
- **2.** `[Sequence]` Calls `userSession.requireUser`
- **3.** `[Return]`  — `await BorealisTvServ.refresh(tvId)`

### `GET /:tvId/similar` (L88)
Retrieves algorithmic similarity recommendations (default 24 items).

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisTvModel.param`, query: `BorealisTvModel.similarQuery`
- **2.** `[Return]`  — `await BorealisTvServ.getSimilar(tvId, query?.limit)`

### `GET /:tvId/characters` (L88)
Retrieves character cast members and actors.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisTvModel.param`
- **2.** `[Return]`  — `await BorealisTvServ.getCharacters(tvId)`

### `GET /:tvId/staff` (L88)
Retrieves creators, directors, and production credits.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisTvModel.param`
- **2.** `[Return]`  — `await BorealisTvServ.getStaff(tvId)`

### `GET /:tvId/seasons` (L152)
Retrieves list of seasons.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisTvModel.param`
- **2.** `[Return]`  — `await BorealisTvServ.getSeasons(tvId)`

### `GET /:tvId/episodes` (L152)
Retrieves list of episodes.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisTvModel.param`
- **2.** `[Return]`  — `await BorealisTvServ.getEpisodes(tvId)`

### `GET /:tvId/images` (L152)
Retrieves poster, backdrop, and image gallery.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisTvModel.param`
- **2.** `[Return]`  — `await BorealisTvServ.getImages(tvId)`

### `GET /:tvId/stats` (L152)
Retrieves score distribution, status counts, and aggregate metrics.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisTvModel.param`
- **2.** `[Return]`  — `await BorealisTvServ.getStats(tvId)`

### `GET /:tvId/friends` (L235)
Retrieves friends tracking status and standardized primary progress.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisTvModel.param`
- **2.** `[Sequence]` Calls `userSession.getUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisTvServ.getFriends(tvId, user?.id)`

### `GET /:tvId/people` (L235)
Retrieves paginated public user list entries for this TV show.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisTvModel.param`, query: `BorealisTvModel.peopleQuery`
- **2.** `[Return]`  — `await BorealisTvServ.getPeople(tvId, query)`

### `GET /:tvId/recommendations` (L235)
Retrieves user community recommendations.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisTvModel.param`
- **2.** `[Return]`  — `await BorealisTvServ.getRecommendations(tvId)`

## Exported Types, Methods & Algorithms

### `const borealisTv` (L300)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/borealis/tv/tv.model.ts` — `BorealisTvModel`
- [apps/borealis/tv/tv.serv.ts](./tv.serv.md) ([[apps/borealis/tv/tv.serv]]) — `BorealisTvServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_15`
