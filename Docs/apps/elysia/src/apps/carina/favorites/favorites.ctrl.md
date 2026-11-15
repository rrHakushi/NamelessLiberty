# favorites.ctrl.ts

- **Source**: [`apps/carina/favorites/favorites.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/favorites/favorites.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/carina/favorites/all` | Get all user favorites in all categories at once | Carina Favorites | query: `CarinaUsersModel.allFavoritesQuery` | `200`: `CarinaUsersModel.allFavoritesResponse`<br>`401`: `CarinaFavoritesModel.unauthorizedError` | `CarinaUsersServ.getAllUserFavorites` |
| `POST` | `/carina/favorites/` | Add media or entity to user favorites strictly by IDs | Carina Favorites | body: `CarinaFavoritesModel.addFavoriteBody` | `200`: `CarinaFavoritesModel.addFavoriteResponse`<br>`400`: `CarinaFavoritesModel.badRequestError`<br>`401`: `CarinaFavoritesModel.unauthorizedError`<br>`422`: `CarinaFavoritesModel.validationError` | `CarinaFavoritesServ.addFavorite` |
| `GET` | `/carina/favorites/:category/:targetId` | Check if target is in user favorites strictly by category and target ID | Carina Favorites | params: `CarinaFavoritesModel.favoriteParam` | `200`: `CarinaFavoritesModel.checkFavoriteResponse`<br>`400`: `CarinaFavoritesModel.badRequestError`<br>`401`: `CarinaFavoritesModel.unauthorizedError`<br>`422`: `CarinaFavoritesModel.validationError` | `CarinaFavoritesServ.checkFavorite` |
| `DELETE` | `/carina/favorites/:category/:targetId` | Remove target from user favorites strictly by category and target ID | Carina Favorites | params: `CarinaFavoritesModel.favoriteParam` | `200`: `CarinaFavoritesModel.removeFavoriteResponse`<br>`400`: `CarinaFavoritesModel.badRequestError`<br>`401`: `CarinaFavoritesModel.unauthorizedError`<br>`404`: `CarinaFavoritesModel.notFoundError`<br>`422`: `CarinaFavoritesModel.validationError` | `CarinaFavoritesServ.removeFavorite` |

### `GET /carina/favorites/all` (L8)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `CarinaUsersModel.allFavoritesQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaUsersServ.getAllUserFavorites(user.id, query)`

### `POST /carina/favorites/` (L8)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaFavoritesModel.addFavoriteBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaFavoritesServ.addFavorite(user.id, body)`

### `GET /carina/favorites/:category/:targetId` (L8)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaFavoritesModel.favoriteParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaFavoritesServ.checkFavorite(user.id, params.category, params.targetId)`

### `DELETE /carina/favorites/:category/:targetId` (L8)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaFavoritesModel.favoriteParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaFavoritesServ.removeFavorite(user.id, params.category, params.targetId)`

## Exported Types, Methods & Algorithms

### `const carinaFavorites` (L8)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/carina/favorites/favorites.model.ts` — `CarinaFavoritesModel`
- `apps/carina/users/users.model.ts` — `CarinaUsersModel`
- [apps/carina/favorites/favorites.serv.ts](./favorites.serv.md) ([[apps/carina/favorites/favorites.serv]]) — `CarinaFavoritesServ`
- [apps/carina/users/users.serv.ts](../users/users.serv.md) ([[apps/carina/users/users.serv]]) — `CarinaUsersServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_24`
