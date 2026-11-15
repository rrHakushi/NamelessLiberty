# music.ctrl.ts

- **Source**: [`apps/borealis/music/music.ctrl.ts`](../../../../../../../apps/elysia/src/apps/borealis/music/music.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Get music catalog | Borealis - Music | query: `BorealisMusicModel.catalogQuery` | `200`: `BorealisMusicModel.catalogResponse`<br>`422`: `BorealisMusicModel.validationError` | `BorealisMusicServ.getCatalog` |
| `GET` | `/filters` | Get music catalog filters | Borealis - Music | — | `200`: `BorealisMusicModel.filtersResponse` | `BorealisMusicServ.getFilters` |
| `GET` | `/:musicId` | Get music overview | Borealis - Music | params: `BorealisMusicModel.param` | `200`: `BorealisMusicModel.detailResponse`<br>`404`: `BorealisMusicModel.notFoundError`<br>`422`: `BorealisMusicModel.validationError` | `BorealisMusicServ.getById` |
| `POST` | `/:musicId/refresh` | Refresh music metadata | Borealis - Music | params: `BorealisMusicModel.param` | `200`: `BorealisMusicModel.refreshResponse`<br>`401`: `BorealisMusicModel.unauthorizedError`<br>`404`: `BorealisMusicModel.notFoundError`<br>`422`: `BorealisMusicModel.validationError` | `BorealisMusicServ.refresh` |
| `GET` | `/:musicId/similar` | Get similar music | Borealis - Music | params: `BorealisMusicModel.param`<br>query: `BorealisMusicModel.similarQuery` | `200`: `BorealisMusicModel.similarResponse`<br>`404`: `BorealisMusicModel.notFoundError`<br>`422`: `BorealisMusicModel.validationError` | `BorealisMusicServ.getSimilar` |
| `GET` | `/:musicId/tracks` | Get album tracks | Borealis - Music | params: `BorealisMusicModel.param` | `200`: `BorealisMusicModel.tracksResponse`<br>`404`: `BorealisMusicModel.notFoundError`<br>`422`: `BorealisMusicModel.validationError` | `BorealisMusicServ.getTracks` |
| `GET` | `/:musicId/lyrics` | Get track lyrics | Borealis - Music | params: `BorealisMusicModel.param` | `200`: `BorealisMusicModel.lyricsResponse`<br>`404`: `BorealisMusicModel.notFoundError`<br>`422`: `BorealisMusicModel.validationError` | `BorealisMusicServ.getLyrics` |
| `GET` | `/:musicId/staff` | Get music staff | Borealis - Music | params: `BorealisMusicModel.param` | `200`: `BorealisMusicModel.staffResponse`<br>`404`: `BorealisMusicModel.notFoundError`<br>`422`: `BorealisMusicModel.validationError` | `BorealisMusicServ.getStaff` |
| `GET` | `/:musicId/images` | Get music images | Borealis - Music | params: `BorealisMusicModel.param` | `200`: `BorealisMusicModel.imagesResponse`<br>`404`: `BorealisMusicModel.notFoundError`<br>`422`: `BorealisMusicModel.validationError` | `BorealisMusicServ.getImages` |
| `GET` | `/:musicId/stats` | Get music statistics | Borealis - Music | params: `BorealisMusicModel.param` | `200`: `BorealisMusicModel.statsResponse`<br>`404`: `BorealisMusicModel.notFoundError`<br>`422`: `BorealisMusicModel.validationError` | `BorealisMusicServ.getStats` |
| `GET` | `/:musicId/friends` | Get friends tracking music | Borealis - Music | params: `BorealisMusicModel.param` | `200`: `BorealisMusicModel.friendsResponse`<br>`404`: `BorealisMusicModel.notFoundError`<br>`422`: `BorealisMusicModel.validationError` | `BorealisMusicServ.getFriends` |
| `GET` | `/:musicId/people` | Get public people tracking music | Borealis - Music | params: `BorealisMusicModel.param`<br>query: `BorealisMusicModel.peopleQuery` | `200`: `BorealisMusicModel.peopleResponse`<br>`404`: `BorealisMusicModel.notFoundError`<br>`422`: `BorealisMusicModel.validationError` | `BorealisMusicServ.getPeople` |
| `GET` | `/:musicId/recommendations` | Get music recommendations | Borealis - Music | params: `BorealisMusicModel.param` | `200`: `BorealisMusicModel.recommendationsResponse`<br>`404`: `BorealisMusicModel.notFoundError`<br>`422`: `BorealisMusicModel.validationError` | `BorealisMusicServ.getRecommendations` |

### `GET /` (L7)
Retrieves paginated music tracks and albums with cursor or page, supporting comprehensive multi-field filtering.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisMusicModel.catalogQuery`
- **2.** `[Return]`  — `await BorealisMusicServ.getCatalog(query)`

### `GET /filters` (L7)
Returns available filter facets and value counts for music catalog.

- **1.** `[Return]`  — `await BorealisMusicServ.getFilters()`

### `GET /:musicId` (L7)
Retrieves complete metadata overview for a track or album by ID.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMusicModel.param`
- **2.** `[Return]`  — `await BorealisMusicServ.getById(musicId)`

### `POST /:musicId/refresh` (L7)
Enqueues background metadata refresh from external sources.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMusicModel.param`
- **2.** `[Sequence]` Calls `userSession.requireUser`
- **3.** `[Return]`  — `await BorealisMusicServ.refresh(musicId)`

### `GET /:musicId/similar` (L88)
Retrieves algorithmic similarity recommendations (default 24 items).

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMusicModel.param`, query: `BorealisMusicModel.similarQuery`
- **2.** `[Return]`  — `await BorealisMusicServ.getSimilar(musicId, query?.limit)`

### `GET /:musicId/tracks` (L88)
Retrieves tracklist of a music album.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMusicModel.param`
- **2.** `[Return]`  — `await BorealisMusicServ.getTracks(musicId)`

### `GET /:musicId/lyrics` (L88)
Retrieves plain and synchronized lyrics for a track.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMusicModel.param`
- **2.** `[Return]`  — `await BorealisMusicServ.getLyrics(musicId)`

### `GET /:musicId/staff` (L152)
Retrieves artists, composers, lyricists, and producers.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMusicModel.param`
- **2.** `[Return]`  — `await BorealisMusicServ.getStaff(musicId)`

### `GET /:musicId/images` (L152)
Retrieves cover artwork and image variations.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMusicModel.param`
- **2.** `[Return]`  — `await BorealisMusicServ.getImages(musicId)`

### `GET /:musicId/stats` (L152)
Retrieves listeners, play counts, and popularity metrics.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMusicModel.param`
- **2.** `[Return]`  — `await BorealisMusicServ.getStats(musicId)`

### `GET /:musicId/friends` (L152)
Retrieves friends tracking status and standardized primary progress (playCount).

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMusicModel.param`
- **2.** `[Sequence]` Calls `userSession.getUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisMusicServ.getFriends(musicId, user?.id)`

### `GET /:musicId/people` (L236)
Retrieves paginated public user list entries for this music item.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMusicModel.param`, query: `BorealisMusicModel.peopleQuery`
- **2.** `[Return]`  — `await BorealisMusicServ.getPeople(musicId, query)`

### `GET /:musicId/recommendations` (L236)
Retrieves user community recommendations.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisMusicModel.param`
- **2.** `[Return]`  — `await BorealisMusicServ.getRecommendations(musicId)`

## Exported Types, Methods & Algorithms

### `const borealisMusic` (L280)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/borealis/music/music.model.ts` — `BorealisMusicModel`
- [apps/borealis/music/music.serv.ts](./music.serv.md) ([[apps/borealis/music/music.serv]]) — `BorealisMusicServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_11`
