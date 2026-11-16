# manga.ctrl.ts

- **Source**: [`apps/borealis/manga/manga.ctrl.ts`](../../../../../../../apps/elysia/src/apps/borealis/manga/manga.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Get manga catalog | Borealis - Manga | query: `BorealisMangaModel.catalogQuery` | `200`: `BorealisMangaModel.catalogResponse`<br>`422`: `BorealisMangaModel.validationError` | `BorealisMangaServ.getCatalog` |
| `GET` | `/filters` | Get manga catalog filters | Borealis - Manga | — | `200`: `BorealisMangaModel.filtersResponse` | `BorealisMangaServ.getFilters` |
| `GET` | `/:mangaId` | Get manga overview | Borealis - Manga | params: `BorealisMangaModel.param` | `200`: `BorealisMangaModel.detailResponse`<br>`404`: `BorealisMangaModel.notFoundError`<br>`422`: `BorealisMangaModel.validationError` | `BorealisMangaServ.getById` |
| `POST` | `/:mangaId/refresh` | Refresh manga metadata | Borealis - Manga | params: `BorealisMangaModel.param` | `200`: `BorealisMangaModel.refreshResponse`<br>`401`: `BorealisMangaModel.unauthorizedError`<br>`404`: `BorealisMangaModel.notFoundError`<br>`422`: `BorealisMangaModel.validationError` | `BorealisMangaServ.refresh` |
| `GET` | `/:mangaId/similar` | Get similar manga | Borealis - Manga | params: `BorealisMangaModel.param`<br>query: `BorealisMangaModel.similarQuery` | `200`: `BorealisMangaModel.similarResponse`<br>`404`: `BorealisMangaModel.notFoundError`<br>`422`: `BorealisMangaModel.validationError` | `BorealisMangaServ.getSimilar` |
| `GET` | `/:mangaId/relations` | Get manga relations | Borealis - Manga | params: `BorealisMangaModel.param` | `200`: `BorealisMangaModel.relationsResponse`<br>`404`: `BorealisMangaModel.notFoundError`<br>`422`: `BorealisMangaModel.validationError` | `BorealisMangaServ.getRelations` |
| `GET` | `/:mangaId/characters` | Get manga characters | Borealis - Manga | params: `BorealisMangaModel.param` | `200`: `BorealisMangaModel.charactersResponse`<br>`404`: `BorealisMangaModel.notFoundError`<br>`422`: `BorealisMangaModel.validationError` | `BorealisMangaServ.getCharacters` |
| `GET` | `/:mangaId/staff` | Get manga staff | Borealis - Manga | params: `BorealisMangaModel.param` | `200`: `BorealisMangaModel.staffResponse`<br>`404`: `BorealisMangaModel.notFoundError`<br>`422`: `BorealisMangaModel.validationError` | `BorealisMangaServ.getStaff` |
| `GET` | `/:mangaId/images` | Get manga images | Borealis - Manga | params: `BorealisMangaModel.param` | `200`: `BorealisMangaModel.imagesResponse`<br>`404`: `BorealisMangaModel.notFoundError`<br>`422`: `BorealisMangaModel.validationError` | `BorealisMangaServ.getImages` |
| `GET` | `/:mangaId/stats` | Get manga statistics | Borealis - Manga | params: `BorealisMangaModel.param` | `200`: `BorealisMangaModel.statsResponse`<br>`404`: `BorealisMangaModel.notFoundError`<br>`422`: `BorealisMangaModel.validationError` | `BorealisMangaServ.getStats` |
| `GET` | `/:mangaId/friends` | Get friends tracking manga | Borealis - Manga | params: `BorealisMangaModel.param` | `200`: `BorealisMangaModel.friendsResponse`<br>`404`: `BorealisMangaModel.notFoundError`<br>`422`: `BorealisMangaModel.validationError` | `BorealisMangaServ.getFriends` |
| `GET` | `/:mangaId/people` | Get public people tracking manga | Borealis - Manga | params: `BorealisMangaModel.param`<br>query: `BorealisMangaModel.peopleQuery` | `200`: `BorealisMangaModel.peopleResponse`<br>`404`: `BorealisMangaModel.notFoundError`<br>`422`: `BorealisMangaModel.validationError` | `BorealisMangaServ.getPeople` |
| `GET` | `/:mangaId/recommendations` | Get manga recommendations | Borealis - Manga | params: `BorealisMangaModel.param` | `200`: `BorealisMangaModel.recommendationsResponse`<br>`404`: `BorealisMangaModel.notFoundError`<br>`422`: `BorealisMangaModel.validationError` | `BorealisMangaServ.getRecommendations` |

### `GET /` (L7)
Retrieves paginated manga catalog with cursor or page, supporting comprehensive multi-field filtering.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisMangaModel.catalogQuery`
- **2.** `[Return]`  — `await BorealisMangaServ.getCatalog(query)`

### `GET /filters` (L7)
Returns available filter facets and value counts for manga catalog.

- **1.** `[Return]`  — `await BorealisMangaServ.getFilters()`

### `GET /:mangaId` (L7)
Retrieves complete metadata overview for a manga item by ID.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMangaModel.param`
- **2.** `[Return]`  — `await BorealisMangaServ.getById(mangaId)`

### `POST /:mangaId/refresh` (L7)
Enqueues background metadata refresh from external sources.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMangaModel.param`
- **2.** `[Sequence]` Calls `userSession.requireUser`
- **3.** `[Return]`  — `await BorealisMangaServ.refresh(mangaId)`

### `GET /:mangaId/similar` (L88)
Retrieves algorithmic similarity recommendations (default 24 items).

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMangaModel.param`, query: `BorealisMangaModel.similarQuery`
- **2.** `[Return]`  — `await BorealisMangaServ.getSimilar(mangaId, query?.limit)`

### `GET /:mangaId/relations` (L88)
Retrieves cross-media relations and franchise connections.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMangaModel.param`
- **2.** `[Return]`  — `await BorealisMangaServ.getRelations(mangaId)`

### `GET /:mangaId/characters` (L88)
Retrieves character cast members.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMangaModel.param`
- **2.** `[Return]`  — `await BorealisMangaServ.getCharacters(mangaId)`

### `GET /:mangaId/staff` (L88)
Retrieves author, illustrator, and publishing staff credits.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMangaModel.param`
- **2.** `[Return]`  — `await BorealisMangaServ.getStaff(mangaId)`

### `GET /:mangaId/images` (L172)
Retrieves cover, banner, and image gallery.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMangaModel.param`
- **2.** `[Return]`  — `await BorealisMangaServ.getImages(mangaId)`

### `GET /:mangaId/stats` (L172)
Retrieves score distribution, status counts, and aggregate metrics.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMangaModel.param`
- **2.** `[Return]`  — `await BorealisMangaServ.getStats(mangaId)`

### `GET /:mangaId/friends` (L172)
Retrieves friends tracking status and standardized primary (chapters) and secondary (volumes) progress.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMangaModel.param`
- **2.** `[Sequence]` Calls `userSession.getUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisMangaServ.getFriends(mangaId, user?.id)`

### `GET /:mangaId/people` (L172)
Retrieves paginated public user list entries for this manga item.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMangaModel.param`, query: `BorealisMangaModel.peopleQuery`
- **2.** `[Return]`  — `await BorealisMangaServ.getPeople(mangaId, query)`

### `GET /:mangaId/recommendations` (L257)
Retrieves user community recommendations.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMangaModel.param`
- **2.** `[Return]`  — `await BorealisMangaServ.getRecommendations(mangaId)`

## Exported Types, Methods & Algorithms

### `const borealisManga` (L280)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/borealis/manga/manga.model.ts` — `BorealisMangaModel`
- [apps/borealis/manga/manga.serv.ts](./manga.serv.md) ([[apps/borealis/manga/manga.serv]]) — `BorealisMangaServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_9`
