# movies.ctrl.ts

- **Source**: [`apps/borealis/movies/movies.ctrl.ts`](../../../../../../../apps/elysia/src/apps/borealis/movies/movies.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Get movie catalog | Borealis - Movies | query: `BorealisMoviesModel.catalogQuery` | `200`: `BorealisMoviesModel.catalogResponse`<br>`422`: `BorealisMoviesModel.validationError` | `BorealisMoviesServ.getCatalog` |
| `GET` | `/filters` | Get movie catalog filters | Borealis - Movies | — | `200`: `BorealisMoviesModel.filtersResponse` | `BorealisMoviesServ.getFilters` |
| `GET` | `/:movieId` | Get movie overview | Borealis - Movies | params: `BorealisMoviesModel.param` | `200`: `BorealisMoviesModel.detailResponse`<br>`404`: `BorealisMoviesModel.notFoundError`<br>`422`: `BorealisMoviesModel.validationError` | `BorealisMoviesServ.getById` |
| `POST` | `/:movieId/refresh` | Refresh movie metadata | Borealis - Movies | params: `BorealisMoviesModel.param` | `200`: `BorealisMoviesModel.refreshResponse`<br>`401`: `BorealisMoviesModel.unauthorizedError`<br>`404`: `BorealisMoviesModel.notFoundError`<br>`422`: `BorealisMoviesModel.validationError` | `BorealisMoviesServ.refresh` |
| `GET` | `/:movieId/similar` | Get similar movies | Borealis - Movies | params: `BorealisMoviesModel.param`<br>query: `BorealisMoviesModel.similarQuery` | `200`: `BorealisMoviesModel.similarResponse`<br>`404`: `BorealisMoviesModel.notFoundError`<br>`422`: `BorealisMoviesModel.validationError` | `BorealisMoviesServ.getSimilar` |
| `GET` | `/:movieId/characters` | Get movie characters | Borealis - Movies | params: `BorealisMoviesModel.param` | `200`: `BorealisMoviesModel.charactersResponse`<br>`404`: `BorealisMoviesModel.notFoundError`<br>`422`: `BorealisMoviesModel.validationError` | `BorealisMoviesServ.getCharacters` |
| `GET` | `/:movieId/staff` | Get movie staff | Borealis - Movies | params: `BorealisMoviesModel.param` | `200`: `BorealisMoviesModel.staffResponse`<br>`404`: `BorealisMoviesModel.notFoundError`<br>`422`: `BorealisMoviesModel.validationError` | `BorealisMoviesServ.getStaff` |
| `GET` | `/:movieId/images` | Get movie images | Borealis - Movies | params: `BorealisMoviesModel.param` | `200`: `BorealisMoviesModel.imagesResponse`<br>`404`: `BorealisMoviesModel.notFoundError`<br>`422`: `BorealisMoviesModel.validationError` | `BorealisMoviesServ.getImages` |
| `GET` | `/:movieId/stats` | Get movie statistics | Borealis - Movies | params: `BorealisMoviesModel.param` | `200`: `BorealisMoviesModel.statsResponse`<br>`404`: `BorealisMoviesModel.notFoundError`<br>`422`: `BorealisMoviesModel.validationError` | `BorealisMoviesServ.getStats` |
| `GET` | `/:movieId/friends` | Get friends tracking movie | Borealis - Movies | params: `BorealisMoviesModel.param` | `200`: `BorealisMoviesModel.friendsResponse`<br>`404`: `BorealisMoviesModel.notFoundError`<br>`422`: `BorealisMoviesModel.validationError` | `BorealisMoviesServ.getFriends` |
| `GET` | `/:movieId/people` | Get public people tracking movie | Borealis - Movies | params: `BorealisMoviesModel.param`<br>query: `BorealisMoviesModel.peopleQuery` | `200`: `BorealisMoviesModel.peopleResponse`<br>`404`: `BorealisMoviesModel.notFoundError`<br>`422`: `BorealisMoviesModel.validationError` | `BorealisMoviesServ.getPeople` |
| `GET` | `/:movieId/recommendations` | Get movie recommendations | Borealis - Movies | params: `BorealisMoviesModel.param` | `200`: `BorealisMoviesModel.recommendationsResponse`<br>`404`: `BorealisMoviesModel.notFoundError`<br>`422`: `BorealisMoviesModel.validationError` | `BorealisMoviesServ.getRecommendations` |

### `GET /` (L7)
Retrieves paginated movie catalog with cursor or page, supporting comprehensive multi-field filtering.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisMoviesModel.catalogQuery`
- **2.** `[Return]`  — `await BorealisMoviesServ.getCatalog(query)`

### `GET /filters` (L7)
Returns available filter facets and value counts for movie catalog.

- **1.** `[Return]`  — `await BorealisMoviesServ.getFilters()`

### `GET /:movieId` (L7)
Retrieves complete metadata overview for a movie by ID.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMoviesModel.param`
- **2.** `[Return]`  — `await BorealisMoviesServ.getById(movieId)`

### `POST /:movieId/refresh` (L7)
Enqueues background metadata refresh from external sources.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMoviesModel.param`
- **2.** `[Sequence]` Calls `userSession.requireUser`
- **3.** `[Return]`  — `await BorealisMoviesServ.refresh(movieId)`

### `GET /:movieId/similar` (L88)
Retrieves algorithmic similarity recommendations (default 24 items).

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMoviesModel.param`, query: `BorealisMoviesModel.similarQuery`
- **2.** `[Return]`  — `await BorealisMoviesServ.getSimilar(movieId, query?.limit)`

### `GET /:movieId/characters` (L88)
Retrieves character cast members and actors.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMoviesModel.param`
- **2.** `[Return]`  — `await BorealisMoviesServ.getCharacters(movieId)`

### `GET /:movieId/staff` (L88)
Retrieves directors, writers, and production credits.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMoviesModel.param`
- **2.** `[Return]`  — `await BorealisMoviesServ.getStaff(movieId)`

### `GET /:movieId/images` (L152)
Retrieves poster, backdrop, and image gallery.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMoviesModel.param`
- **2.** `[Return]`  — `await BorealisMoviesServ.getImages(movieId)`

### `GET /:movieId/stats` (L152)
Retrieves score distribution, status counts, and aggregate metrics.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMoviesModel.param`
- **2.** `[Return]`  — `await BorealisMoviesServ.getStats(movieId)`

### `GET /:movieId/friends` (L152)
Retrieves friends tracking status (primary/secondary progress are null for movies).

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMoviesModel.param`
- **2.** `[Sequence]` Calls `userSession.getUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisMoviesServ.getFriends(movieId, user?.id)`

### `GET /:movieId/people` (L152)
Retrieves paginated public user list entries for this movie.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMoviesModel.param`, query: `BorealisMoviesModel.peopleQuery`
- **2.** `[Return]`  — `await BorealisMoviesServ.getPeople(movieId, query)`

### `GET /:movieId/recommendations` (L237)
Retrieves user community recommendations.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMoviesModel.param`
- **2.** `[Return]`  — `await BorealisMoviesServ.getRecommendations(movieId)`

## Exported Types, Methods & Algorithms

### `const borealisMovies` (L260)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/borealis/movies/movies.model.ts` — `BorealisMoviesModel`
- [apps/borealis/movies/movies.serv.ts](./movies.serv.md) ([[apps/borealis/movies/movies.serv]]) — `BorealisMoviesServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_10`
