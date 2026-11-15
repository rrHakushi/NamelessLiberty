# activity.ctrl.ts

- **Source**: [`apps/carina/activity/activity.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/activity/activity.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/carina/activity` | Create a status post on your Carina activity feed | Carina Activity | body: `CarinaActivityModel.createStatusPostBody` | `200`: `CarinaActivityModel.createStatusPostResponse`<br>`400`: `CarinaActivityModel.badRequestError`<br>`401`: `CarinaActivityModel.unauthorizedError`<br>`404`: `CarinaActivityModel.notFoundError`<br>`422`: `CarinaActivityModel.validationError` | `ActivityServ.createStatusPost` |
| `POST` | `/carina/activity/:id/like` | Toggle like on an activity entry | Carina Activity | params: `CarinaActivityModel.activityParam` | `200`: `CarinaActivityModel.toggleLikeResponse`<br>`401`: `CarinaActivityModel.unauthorizedError`<br>`403`: `CarinaActivityModel.forbiddenError`<br>`404`: `CarinaActivityModel.notFoundError`<br>`422`: `CarinaActivityModel.validationError` | `ActivityServ.toggleLike` |
| `GET` | `/carina/activity/:id/replies` | List replies for an activity entry | Carina Activity | params: `CarinaActivityModel.activityParam`<br>query: `CarinaActivityModel.repliesQuery` | `200`: `CarinaActivityModel.repliesResponse`<br>`403`: `CarinaActivityModel.forbiddenError`<br>`404`: `CarinaActivityModel.notFoundError`<br>`422`: `CarinaActivityModel.validationError` | `ActivityServ.getReplies` |
| `POST` | `/carina/activity/:id/replies` | Add a reply to an activity entry | Carina Activity | params: `CarinaActivityModel.activityParam`<br>body: `CarinaActivityModel.createReplyBody` | `200`: `CarinaActivityModel.createReplyResponse`<br>`400`: `CarinaActivityModel.badRequestError`<br>`401`: `CarinaActivityModel.unauthorizedError`<br>`403`: `CarinaActivityModel.forbiddenError`<br>`404`: `CarinaActivityModel.notFoundError`<br>`422`: `CarinaActivityModel.validationError` | `ActivityServ.createReply` |
| `DELETE` | `/carina/activity/:id/replies/:replyId` | Delete an activity reply | Carina Activity | params: `CarinaActivityModel.replyParam` | `200`: `CarinaActivityModel.deleteReplyResponse`<br>`401`: `CarinaActivityModel.unauthorizedError`<br>`403`: `CarinaActivityModel.forbiddenError`<br>`404`: `CarinaActivityModel.notFoundError`<br>`422`: `CarinaActivityModel.validationError` | `ActivityServ.deleteReply` |

### `POST /carina/activity` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaActivityModel.createStatusPostBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ActivityServ.createStatusPost(user.id, body)`

### `POST /carina/activity/:id/like` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaActivityModel.activityParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ActivityServ.toggleLike(user.id, user.permissions, params.id)`

### `GET /carina/activity/:id/replies` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaActivityModel.activityParam`, query: `CarinaActivityModel.repliesQuery`
- **2.** `[Return]`  — `await ActivityServ.getReplies(params.id, query, userSession.getUser())`

### `POST /carina/activity/:id/replies` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaActivityModel.activityParam`, body: `CarinaActivityModel.createReplyBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ActivityServ.createReply(user.id, user.permissions, params.id, ...)`

### `DELETE /carina/activity/:id/replies/:replyId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaActivityModel.replyParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await ActivityServ.deleteReply(user.id, user.permissions, params.id, ...)`

## Exported Types, Methods & Algorithms

### `const carinaActivity` (L6)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/carina/activity/activity.model.ts` — `CarinaActivityModel`
- [apps/carina/activity/activity.serv.ts](./activity.serv.md) ([[apps/carina/activity/activity.serv]]) — `ActivityServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_16`
