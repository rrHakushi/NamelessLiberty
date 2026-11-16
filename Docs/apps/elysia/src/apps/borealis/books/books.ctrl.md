# books.ctrl.ts

- **Source**: [`apps/borealis/books/books.ctrl.ts`](../../../../../../../apps/elysia/src/apps/borealis/books/books.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Get books catalog | Borealis - Books | query: `BorealisBooksModel.catalogQuery` | `200`: `BorealisBooksModel.catalogResponse`<br>`422`: `BorealisBooksModel.validationError` | `BorealisBooksServ.getCatalog` |
| `GET` | `/filters` | Get available book catalog filters | Borealis - Books | — | `200`: `BorealisBooksModel.filtersResponse` | `BorealisBooksServ.getFilters` |
| `GET` | `/:bookId` | Get book overview by ID | Borealis - Books | params: `BorealisBooksModel.param` | `200`: `BorealisBooksModel.detailResponse`<br>`404`: `BorealisBooksModel.notFoundError`<br>`422`: `BorealisBooksModel.validationError` | `BorealisBooksServ.getById` |
| `POST` | `/:bookId/refresh` | Refresh book from external providers | Borealis - Books | params: `BorealisBooksModel.param` | `200`: `BorealisBooksModel.refreshResponse`<br>`404`: `BorealisBooksModel.notFoundError`<br>`422`: `BorealisBooksModel.validationError` | `BorealisBooksServ.refresh` |
| `GET` | `/:bookId/similar` | Get similar books | Borealis - Books | params: `BorealisBooksModel.param` | `200`: `BorealisBooksModel.similarResponse`<br>`404`: `BorealisBooksModel.notFoundError`<br>`422`: `BorealisBooksModel.validationError` | `BorealisBooksServ.getSimilar` |
| `GET` | `/:bookId/characters` | Get characters for book | Borealis - Books | params: `BorealisBooksModel.param` | `200`: `BorealisBooksModel.charactersResponse`<br>`404`: `BorealisBooksModel.notFoundError`<br>`422`: `BorealisBooksModel.validationError` | `BorealisBooksServ.getCharacters` |
| `GET` | `/:bookId/staff` | Get staff for book | Borealis - Books | params: `BorealisBooksModel.param` | `200`: `BorealisBooksModel.staffResponse`<br>`404`: `BorealisBooksModel.notFoundError`<br>`422`: `BorealisBooksModel.validationError` | `BorealisBooksServ.getStaff` |
| `GET` | `/:bookId/images` | Get images for book | Borealis - Books | params: `BorealisBooksModel.param` | `200`: `BorealisBooksModel.imagesResponse`<br>`404`: `BorealisBooksModel.notFoundError`<br>`422`: `BorealisBooksModel.validationError` | `BorealisBooksServ.getImages` |
| `GET` | `/:bookId/stats` | Get book statistics | Borealis - Books | params: `BorealisBooksModel.param` | `200`: `BorealisBooksModel.statsResponse`<br>`404`: `BorealisBooksModel.notFoundError`<br>`422`: `BorealisBooksModel.validationError` | `BorealisBooksServ.getStats` |
| `GET` | `/:bookId/friends` | Get friends tracking this book | Borealis - Books | params: `BorealisBooksModel.param` | `200`: `BorealisBooksModel.friendsResponse`<br>`404`: `BorealisBooksModel.notFoundError`<br>`422`: `BorealisBooksModel.validationError` | `BorealisBooksServ.getFriends` |
| `GET` | `/:bookId/people` | Get all public users tracking this book | Borealis - Books | params: `BorealisBooksModel.param`<br>query: `BorealisBooksModel.peopleQuery` | `200`: `BorealisBooksModel.peopleResponse`<br>`404`: `BorealisBooksModel.notFoundError`<br>`422`: `BorealisBooksModel.validationError` | `BorealisBooksServ.getPeople` |
| `GET` | `/:bookId/recommendations` | Get recommendations for this book | Borealis - Books | params: `BorealisBooksModel.param` | `200`: `BorealisBooksModel.recommendationsResponse`<br>`404`: `BorealisBooksModel.notFoundError`<br>`422`: `BorealisBooksModel.validationError` | `BorealisBooksServ.getRecommendations` |

### `GET /` (L7)
Returns 50 books per page with cursor or page pagination and filtering.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisBooksModel.catalogQuery`
- **2.** `[Return]`  — `await BorealisBooksServ.getCatalog(query)`

### `GET /filters` (L7)
Returns all available filters with counts for books.

- **1.** `[Return]`  — `await BorealisBooksServ.getFilters()`

### `GET /:bookId` (L7)
Retrieves overview metadata and characters for a book.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisBooksModel.param`
- **2.** `[Return]`  — `await BorealisBooksServ.getById(bookId)`

### `POST /:bookId/refresh` (L7)
Syncs or enqueues a background refresh for this book.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisBooksModel.param`
- **2.** `[Return]`  — `await BorealisBooksServ.refresh(bookId)`

### `GET /:bookId/similar` (L91)
Returns up to 24 similar books based on shared genres.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisBooksModel.param`
- **2.** `[Return]`  — `await BorealisBooksServ.getSimilar(bookId)`

### `GET /:bookId/characters` (L91)
Returns all characters associated with this book.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisBooksModel.param`
- **2.** `[Return]`  — `await BorealisBooksServ.getCharacters(bookId)`

### `GET /:bookId/staff` (L91)
Returns all staff members associated with this book.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisBooksModel.param`
- **2.** `[Return]`  — `await BorealisBooksServ.getStaff(bookId)`

### `GET /:bookId/images` (L158)
Returns cover, banner, and extra images for this book.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisBooksModel.param`
- **2.** `[Return]`  — `await BorealisBooksServ.getImages(bookId)`

### `GET /:bookId/stats` (L158)
Returns score and status distributions, favorites, and popularity.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisBooksModel.param`
- **2.** `[Return]`  — `await BorealisBooksServ.getStats(bookId)`

### `GET /:bookId/friends` (L158)
Returns public list entries for accepted friends tracking this book.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisBooksModel.param`
- **2.** `[Sequence]` Calls `userSession.getUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisBooksServ.getFriends(bookId, user?.id)`

### `GET /:bookId/people` (L158)
Paginated list of users tracking this book with primary and secondary progress.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisBooksModel.param`, query: `BorealisBooksModel.peopleQuery`
- **2.** `[Return]`  — `await BorealisBooksServ.getPeople(bookId, query)`

### `GET /:bookId/recommendations` (L248)
Returns community recommendations for this book.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisBooksModel.param`
- **2.** `[Return]`  — `await BorealisBooksServ.getRecommendations(bookId)`

## Exported Types, Methods & Algorithms

### `const borealisBooks` (L271)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/borealis/books/books.model.ts` — `BorealisBooksModel`
- [apps/borealis/books/books.serv.ts](./books.serv.md) ([[apps/borealis/books/books.serv]]) — `BorealisBooksServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_4`
