# games.ctrl.ts

- **Source**: [`apps/borealis/games/games.ctrl.ts`](../../../../../../../apps/elysia/src/apps/borealis/games/games.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Get game catalog | Borealis - Games | query: `BorealisGamesModel.catalogQuery` | `200`: `BorealisGamesModel.catalogResponse`<br>`422`: `BorealisGamesModel.validationError` | `BorealisGamesServ.getCatalog` |
| `GET` | `/filters` | Get game catalog filters | Borealis - Games | — | `200`: `BorealisGamesModel.filtersResponse` | `BorealisGamesServ.getFilters` |
| `GET` | `/:gameId` | Get game overview | Borealis - Games | params: `BorealisGamesModel.param` | `200`: `BorealisGamesModel.detailResponse`<br>`404`: `BorealisGamesModel.notFoundError`<br>`422`: `BorealisGamesModel.validationError` | `BorealisGamesServ.getById` |
| `POST` | `/:gameId/refresh` | Refresh game metadata | Borealis - Games | params: `BorealisGamesModel.param` | `200`: `BorealisGamesModel.refreshResponse`<br>`401`: `BorealisGamesModel.unauthorizedError`<br>`404`: `BorealisGamesModel.notFoundError`<br>`422`: `BorealisGamesModel.validationError` | `BorealisGamesServ.refresh` |
| `GET` | `/:gameId/similar` | Get similar games | Borealis - Games | params: `BorealisGamesModel.param`<br>query: `BorealisGamesModel.similarQuery` | `200`: `BorealisGamesModel.similarResponse`<br>`404`: `BorealisGamesModel.notFoundError`<br>`422`: `BorealisGamesModel.validationError` | `BorealisGamesServ.getSimilar` |
| `GET` | `/:gameId/characters` | Get game characters | Borealis - Games | params: `BorealisGamesModel.param` | `200`: `BorealisGamesModel.charactersResponse`<br>`404`: `BorealisGamesModel.notFoundError`<br>`422`: `BorealisGamesModel.validationError` | `BorealisGamesServ.getCharacters` |
| `GET` | `/:gameId/staff` | Get game staff | Borealis - Games | params: `BorealisGamesModel.param` | `200`: `BorealisGamesModel.staffResponse`<br>`404`: `BorealisGamesModel.notFoundError`<br>`422`: `BorealisGamesModel.validationError` | `BorealisGamesServ.getStaff` |
| `GET` | `/:gameId/images` | Get game images | Borealis - Games | params: `BorealisGamesModel.param` | `200`: `BorealisGamesModel.imagesResponse`<br>`404`: `BorealisGamesModel.notFoundError`<br>`422`: `BorealisGamesModel.validationError` | `BorealisGamesServ.getImages` |
| `GET` | `/:gameId/stats` | Get game statistics | Borealis - Games | params: `BorealisGamesModel.param` | `200`: `BorealisGamesModel.statsResponse`<br>`404`: `BorealisGamesModel.notFoundError`<br>`422`: `BorealisGamesModel.validationError` | `BorealisGamesServ.getStats` |
| `GET` | `/:gameId/friends` | Get friends tracking game | Borealis - Games | params: `BorealisGamesModel.param` | `200`: `BorealisGamesModel.friendsResponse`<br>`404`: `BorealisGamesModel.notFoundError`<br>`422`: `BorealisGamesModel.validationError` | `BorealisGamesServ.getFriends` |
| `GET` | `/:gameId/people` | Get public people tracking game | Borealis - Games | params: `BorealisGamesModel.param`<br>query: `BorealisGamesModel.peopleQuery` | `200`: `BorealisGamesModel.peopleResponse`<br>`404`: `BorealisGamesModel.notFoundError`<br>`422`: `BorealisGamesModel.validationError` | `BorealisGamesServ.getPeople` |
| `GET` | `/:gameId/recommendations` | Get game recommendations | Borealis - Games | params: `BorealisGamesModel.param` | `200`: `BorealisGamesModel.recommendationsResponse`<br>`404`: `BorealisGamesModel.notFoundError`<br>`422`: `BorealisGamesModel.validationError` | `BorealisGamesServ.getRecommendations` |

### `GET /` (L8)
Retrieves paginated game catalog with cursor or page, supporting comprehensive multi-field filtering.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisGamesModel.catalogQuery`
- **2.** `[Return]`  — `await BorealisGamesServ.getCatalog(query)`

### `GET /filters` (L8)
Returns available filter facets and value counts for game catalog.

- **1.** `[Return]`  — `await BorealisGamesServ.getFilters()`

### `GET /:gameId` (L8)
Retrieves complete metadata overview for a game by ID.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisGamesModel.param`
- **2.** `[Return]`  — `await BorealisGamesServ.getById(gameId)`

### `POST /:gameId/refresh` (L8)
Enqueues background metadata refresh from external sources.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisGamesModel.param`
- **2.** `[Sequence]` Calls `userSession.requireUser`
- **3.** `[Return]`  — `await BorealisGamesServ.refresh(gameId)`

### `GET /:gameId/similar` (L8)
Retrieves algorithmic similarity recommendations (default 24 items).

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisGamesModel.param`, query: `BorealisGamesModel.similarQuery`
- **2.** `[Return]`  — `await BorealisGamesServ.getSimilar(gameId, query?.limit)`

### `GET /:gameId/characters` (L110)
Retrieves character cast members.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisGamesModel.param`
- **2.** `[Return]`  — `await BorealisGamesServ.getCharacters(gameId)`

### `GET /:gameId/staff` (L110)
Retrieves developer, publisher, and design staff credits.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisGamesModel.param`
- **2.** `[Return]`  — `await BorealisGamesServ.getStaff(gameId)`

### `GET /:gameId/images` (L110)
Retrieves box art, cover, banner, and image gallery.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisGamesModel.param`
- **2.** `[Return]`  — `await BorealisGamesServ.getImages(gameId)`

### `GET /:gameId/stats` (L110)
Retrieves score distribution, status counts, and aggregate metrics.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisGamesModel.param`
- **2.** `[Return]`  — `await BorealisGamesServ.getStats(gameId)`

### `GET /:gameId/friends` (L193)
Retrieves friends tracking status and standardized primary progress (hours/completion).

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisGamesModel.param`
- **2.** `[Sequence]` Calls `userSession.getUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisGamesServ.getFriends(gameId, user?.id)`

### `GET /:gameId/people` (L193)
Retrieves paginated public user list entries for this game item.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisGamesModel.param`, query: `BorealisGamesModel.peopleQuery`
- **2.** `[Return]`  — `await BorealisGamesServ.getPeople(gameId, query)`

### `GET /:gameId/recommendations` (L193)
Retrieves user community recommendations.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisGamesModel.param`
- **2.** `[Return]`  — `await BorealisGamesServ.getRecommendations(gameId)`

## Exported Types, Methods & Algorithms

### `const borealisGames` (L258)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/borealis/games/games.model.ts` — `BorealisGamesModel`
- [apps/borealis/games/games.serv.ts](./games.serv.md) ([[apps/borealis/games/games.serv]]) — `BorealisGamesServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_7`
