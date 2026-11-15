# bookmarks.ctrl.ts

- **Source**: [`apps/carina/bookmarks/bookmarks.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/bookmarks/bookmarks.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/carina/bookmarks/` | Get user bookmarks with pagination (10 per page default) | Carina Bookmarks | query: `CarinaBookmarksModel.listBookmarksQuery` | `200`: `CarinaBookmarksModel.listBookmarksResponse`<br>`401`: `CarinaBookmarksModel.unauthorizedError`<br>`422`: `CarinaBookmarksModel.validationError` | `CarinaBookmarksServ.getBookmarks` |
| `PUT` | `/carina/bookmarks/` | Reorder and batch-update bookmarks for current user | Carina Bookmarks | body: `CarinaBookmarksModel.putBookmarksBody` | `200`: `CarinaBookmarksModel.putBookmarksResponse`<br>`401`: `CarinaBookmarksModel.unauthorizedError`<br>`422`: `CarinaBookmarksModel.validationError` | `CarinaBookmarksServ.putBookmarks` |
| `POST` | `/carina/bookmarks/` | Create bookmark for current user | Carina Bookmarks | body: `CarinaBookmarksModel.createBookmarkBody` | `200`: `CarinaBookmarksModel.createBookmarkResponse`<br>`400`: `CarinaBookmarksModel.badRequestError`<br>`401`: `CarinaBookmarksModel.unauthorizedError`<br>`422`: `CarinaBookmarksModel.validationError` | `CarinaBookmarksServ.createBookmark` |
| `PATCH` | `/carina/bookmarks/:bookmarkId` | Update bookmark strictly by bookmark ID (UUID) | Carina Bookmarks | params: `CarinaBookmarksModel.bookmarkParam`<br>body: `CarinaBookmarksModel.updateBookmarkBody` | `200`: `CarinaBookmarksModel.updateBookmarkResponse`<br>`400`: `CarinaBookmarksModel.badRequestError`<br>`401`: `CarinaBookmarksModel.unauthorizedError`<br>`403`: `CarinaBookmarksModel.forbiddenError`<br>`404`: `CarinaBookmarksModel.notFoundError`<br>`422`: `CarinaBookmarksModel.validationError` | `CarinaBookmarksServ.updateBookmark` |
| `DELETE` | `/carina/bookmarks/:bookmarkId` | Delete bookmark strictly by bookmark ID (UUID) | Carina Bookmarks | params: `CarinaBookmarksModel.bookmarkParam` | `200`: `CarinaBookmarksModel.deleteBookmarkResponse`<br>`401`: `CarinaBookmarksModel.unauthorizedError`<br>`403`: `CarinaBookmarksModel.forbiddenError`<br>`404`: `CarinaBookmarksModel.notFoundError`<br>`422`: `CarinaBookmarksModel.validationError` | `CarinaBookmarksServ.deleteBookmark` |

### `GET /carina/bookmarks/` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `CarinaBookmarksModel.listBookmarksQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaBookmarksServ.getBookmarks(user.id, query)`

### `PUT /carina/bookmarks/` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaBookmarksModel.putBookmarksBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaBookmarksServ.putBookmarks(user.id, body)`

### `POST /carina/bookmarks/` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaBookmarksModel.createBookmarkBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaBookmarksServ.createBookmark(user.id, body)`

### `PATCH /carina/bookmarks/:bookmarkId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaBookmarksModel.bookmarkParam`, body: `CarinaBookmarksModel.updateBookmarkBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaBookmarksServ.updateBookmark(user, params.bookmarkId, body)`

### `DELETE /carina/bookmarks/:bookmarkId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaBookmarksModel.bookmarkParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaBookmarksServ.deleteBookmark(user, params.bookmarkId)`

## Exported Types, Methods & Algorithms

### `const carinaBookmarks` (L6)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/carina/bookmarks/bookmarks.model.ts` — `CarinaBookmarksModel`
- [apps/carina/bookmarks/bookmarks.serv.ts](./bookmarks.serv.md) ([[apps/carina/bookmarks/bookmarks.serv]]) — `CarinaBookmarksServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_20`
