# other.ctrl.ts

- **Source**: [`apps/borealis/other/other.ctrl.ts`](../../../../../../../apps/elysia/src/apps/borealis/other/other.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Get public custom items catalog | Borealis - Other | query: `BorealisOtherModel.catalogQuery` | `200`: `BorealisOtherModel.catalogResponse`<br>`422`: `BorealisOtherModel.validationError` | `BorealisOtherServ.getCatalog` |
| `GET` | `/filters` | Get catalog filters for custom items | Borealis - Other | — | `200`: `BorealisOtherModel.filtersResponse` | `BorealisOtherServ.getFilters` |
| `POST` | `/upload` | Upload cover or banner image asset (max 1MB) | Borealis - Other | body: `BorealisOtherModel.uploadAssetBody` | `200`: `BorealisOtherModel.uploadAssetResponse`<br>`400`: `BorealisOtherModel.validationError`<br>`401`: `BorealisOtherModel.unauthorizedError` | `BorealisOtherServ.uploadAsset` |
| `POST` | `/` | Create custom trackable item | Borealis - Other | body: `BorealisOtherModel.createOtherBody` | `200`: `BorealisOtherModel.itemResponse`<br>`400`: `BorealisOtherModel.validationError`<br>`401`: `BorealisOtherModel.unauthorizedError`<br>`403`: `BorealisOtherModel.forbiddenError`<br>`422`: `BorealisOtherModel.validationError` | `BorealisOtherServ.createItem` |
| `GET` | `/:otherId` | Get custom item details | Borealis - Other | params: `BorealisOtherModel.otherParam` | `200`: `BorealisOtherModel.itemResponse`<br>`404`: `BorealisOtherModel.notFoundError`<br>`422`: `BorealisOtherModel.validationError` | `BorealisOtherServ.getItem` |
| `PUT` | `/:otherId` | Update custom item | Borealis - Other | params: `BorealisOtherModel.otherParam`<br>body: `BorealisOtherModel.updateOtherBody` | `200`: `BorealisOtherModel.itemResponse`<br>`400`: `BorealisOtherModel.validationError`<br>`401`: `BorealisOtherModel.unauthorizedError`<br>`403`: `BorealisOtherModel.forbiddenError`<br>`404`: `BorealisOtherModel.notFoundError`<br>`422`: `BorealisOtherModel.validationError` | `BorealisOtherServ.updateItem` |
| `DELETE` | `/:otherId` | Delete custom item | Borealis - Other | params: `BorealisOtherModel.otherParam` | `200`: `BorealisOtherModel.deleteResponse`<br>`401`: `BorealisOtherModel.unauthorizedError`<br>`403`: `BorealisOtherModel.forbiddenError`<br>`404`: `BorealisOtherModel.notFoundError`<br>`409`: `BorealisOtherModel.conflictError`<br>`422`: `BorealisOtherModel.validationError` | `BorealisOtherServ.deleteItem` |
| `POST` | `/:otherId/fork` | Fork pre-update copy into private item | Borealis - Other | params: `BorealisOtherModel.otherParam` | `200`: `BorealisOtherModel.forkResponse`<br>`401`: `BorealisOtherModel.unauthorizedError`<br>`403`: `BorealisOtherModel.forbiddenError`<br>`404`: `BorealisOtherModel.notFoundError`<br>`422`: `BorealisOtherModel.validationError` | `BorealisOtherServ.forkItem` |
| `GET` | `/:otherId/stats` | Get stats for custom item | Borealis - Other | params: `BorealisOtherModel.otherParam` | `200`: `BorealisOtherModel.statsResponse`<br>`404`: `BorealisOtherModel.notFoundError`<br>`422`: `BorealisOtherModel.validationError` | `BorealisOtherServ.getStats` |
| `GET` | `/:otherId/friends` | Get friends tracking this custom item | Borealis - Other | params: `BorealisOtherModel.otherParam` | `200`: `BorealisOtherModel.friendsResponse`<br>`404`: `BorealisOtherModel.notFoundError`<br>`422`: `BorealisOtherModel.validationError` | `BorealisOtherServ.getFriends` |
| `GET` | `/:otherId/people` | Get all public users tracking this custom item | Borealis - Other | params: `BorealisOtherModel.otherParam`<br>query: `BorealisOtherModel.peopleQuery` | `200`: `BorealisOtherModel.peopleResponse`<br>`404`: `BorealisOtherModel.notFoundError`<br>`422`: `BorealisOtherModel.validationError` | `BorealisOtherServ.getPeople` |
| `GET` | `/:otherId/recommendations` | Get recommendations for this custom item | Borealis - Other | params: `BorealisOtherModel.otherParam` | `200`: `BorealisOtherModel.recommendationsResponse`<br>`404`: `BorealisOtherModel.notFoundError`<br>`422`: `BorealisOtherModel.validationError` | `BorealisOtherServ.getRecommendations` |

### `GET /` (L8)
Returns 50 published custom items per page with cursor/page pagination.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisOtherModel.catalogQuery`
- **2.** `[Return]`  — `await BorealisOtherServ.getCatalog(query)`

### `GET /filters` (L8)
Returns available formats and statuses for custom items.

- **1.** `[Return]`  — `await BorealisOtherServ.getFilters()`

### `POST /upload` (L8)
Uploads and converts an image to WebP format. Maximum file size is 1MB.

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `BorealisOtherModel.uploadAssetBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisOtherServ.uploadAsset(user.id, body.file, body.type)`

### `POST /` (L8)
Creates a new custom item in the catalog. Normal users have a limit of 500 items, while administrators have unlimited creations.

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `BorealisOtherModel.createOtherBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Sequence]` Calls `hasPermission` and stores result as `isAdmin`
- **4.** `[Return]`  — `await BorealisOtherServ.createItem(user.id, body, isAdmin)`

### `GET /:otherId` (L98)
Retrieves custom item details by ID.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisOtherModel.otherParam`
- **2.** `[Sequence]` Calls `userSession.getUser` and stores result as `user`
- **3.** `[Sequence]` Calls `hasPermission` and stores result as `isAdmin`
- **4.** `[Return]`  — `await BorealisOtherServ.getItem(otherId, user?.id, isAdmin)`

### `PUT /:otherId` (L98)
Updates custom item details. If the item is published and tracked by other users, creates a pre-update snapshot and dispatches in-app notifications with a one-click fork action.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisOtherModel.otherParam`, body: `BorealisOtherModel.updateOtherBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Sequence]` Calls `hasPermission` and stores result as `isAdmin`
- **4.** `[Return]`  — `await BorealisOtherServ.updateItem(user.id, otherId, body, ...)`

### `DELETE /:otherId` (L98)
Deletes custom item if no other users have it tracked or favorited. Strict deletion integrity is enforced even for administrators.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisOtherModel.otherParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Sequence]` Calls `hasPermission` and stores result as `isAdmin`
- **4.** `[Return]`  — `await BorealisOtherServ.deleteItem(user.id, otherId, isAdmin)`

### `POST /:otherId/fork` (L98)
Clones pre-update snapshot into a new private item for the requesting user and repoints their list entry.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisOtherModel.otherParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Sequence]` Calls `hasPermission` and stores result as `isAdmin`
- **4.** `[Return]`  — `await BorealisOtherServ.forkItem(user.id, otherId, isAdmin)`

### `GET /:otherId/stats` (L206)
Returns score and status distributions, favorites, and popularity.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisOtherModel.otherParam`
- **2.** `[Return]`  — `await BorealisOtherServ.getStats(otherId)`

### `GET /:otherId/friends` (L206)
Returns public list entries for accepted friends tracking this custom item.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisOtherModel.otherParam`
- **2.** `[Sequence]` Calls `userSession.getUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisOtherServ.getFriends(otherId, user?.id)`

### `GET /:otherId/people` (L206)
Paginated list of users tracking this item with primary and secondary progress.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisOtherModel.otherParam`, query: `BorealisOtherModel.peopleQuery`
- **2.** `[Return]`  — `await BorealisOtherServ.getPeople(otherId, query)`

### `GET /:otherId/recommendations` (L206)
Returns community recommendations for this custom item.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisOtherModel.otherParam`
- **2.** `[Return]`  — `await BorealisOtherServ.getRecommendations(otherId)`

## Exported Types, Methods & Algorithms

### `const borealisOther` (L294)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/borealis/other/other.model.ts` — `BorealisOtherModel`
- [apps/borealis/other/other.serv.ts](./other.serv.md) ([[apps/borealis/other/other.serv]]) — `BorealisOtherServ`

### External / Workspace Packages
- `elysia` — `Elysia`
- `@NamelessLiberty/permissions` — `hasPermission`, `IRISFlags`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_12`
