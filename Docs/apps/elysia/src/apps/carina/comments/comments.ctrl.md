# comments.ctrl.ts

- **Source**: [`apps/carina/comments/comments.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/comments/comments.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/carina/comments/user/:userId` | Get comments on user profile strictly by user ID (10 per page default) | Carina Comments | params: `CarinaCommentsModel.userParam`<br>query: `CarinaCommentsModel.listCommentsQuery` | `200`: `CarinaCommentsModel.listCommentsResponse`<br>`404`: `CarinaCommentsModel.notFoundError`<br>`422`: `CarinaCommentsModel.validationError` | `CarinaCommentsServ.getProfileComments` |
| `POST` | `/carina/comments/user/:userId` | Post comment on user profile strictly by target user ID | Carina Comments | params: `CarinaCommentsModel.userParam`<br>body: `CarinaCommentsModel.createCommentBody` | `200`: `CarinaCommentsModel.createCommentResponse`<br>`400`: `CarinaCommentsModel.badRequestError`<br>`401`: `CarinaCommentsModel.unauthorizedError`<br>`404`: `CarinaCommentsModel.notFoundError`<br>`422`: `CarinaCommentsModel.validationError` | `CarinaCommentsServ.createProfileComment` |
| `GET` | `/carina/comments/lists/:userId/:mediaType` | Get comments on user media list strictly by user ID and media domain (10 per page default) | Carina Comments | params: `CarinaCommentsModel.listUserParam`<br>query: `CarinaCommentsModel.listCommentsQuery` | `200`: `CarinaCommentsModel.listCommentsResponse`<br>`400`: `CarinaCommentsModel.badRequestError`<br>`404`: `CarinaCommentsModel.notFoundError`<br>`422`: `CarinaCommentsModel.validationError` | `CarinaCommentsServ.getListComments` |
| `POST` | `/carina/comments/lists/:userId/:mediaType` | Post comment on user media list strictly by target user ID and media domain | Carina Comments | params: `CarinaCommentsModel.listUserParam`<br>body: `CarinaCommentsModel.createCommentBody` | `200`: `CarinaCommentsModel.createCommentResponse`<br>`400`: `CarinaCommentsModel.badRequestError`<br>`401`: `CarinaCommentsModel.unauthorizedError`<br>`404`: `CarinaCommentsModel.notFoundError`<br>`422`: `CarinaCommentsModel.validationError` | `CarinaCommentsServ.createListComment` |
| `DELETE` | `/carina/comments/:commentId/reply/:replyId` | Delete reply to comment strictly by reply ID | Carina Comments | params: `CarinaCommentsModel.replyParam` | `200`: `CarinaCommentsModel.deleteReplyResponse`<br>`401`: `CarinaCommentsModel.unauthorizedError`<br>`403`: `CarinaCommentsModel.forbiddenError`<br>`404`: `CarinaCommentsModel.notFoundError`<br>`422`: `CarinaCommentsModel.validationError` | `CarinaCommentsServ.deleteReply` |
| `PATCH` | `/carina/comments/:commentId/reply/:replyId` | Update reply to comment strictly by reply ID | Carina Comments | params: `CarinaCommentsModel.replyParam`<br>body: `CarinaCommentsModel.createReplyBody` | `200`: `CarinaCommentsModel.createReplyResponse`<br>`400`: `CarinaCommentsModel.badRequestError`<br>`401`: `CarinaCommentsModel.unauthorizedError`<br>`403`: `CarinaCommentsModel.forbiddenError`<br>`404`: `CarinaCommentsModel.notFoundError`<br>`422`: `CarinaCommentsModel.validationError` | `CarinaCommentsServ.updateReply` |
| `POST` | `/carina/comments/:commentId/reply` | Post owner reply to comment strictly by comment ID | Carina Comments | params: `CarinaCommentsModel.commentParam`<br>body: `CarinaCommentsModel.createReplyBody` | `200`: `CarinaCommentsModel.createReplyResponse`<br>`400`: `CarinaCommentsModel.badRequestError`<br>`401`: `CarinaCommentsModel.unauthorizedError`<br>`403`: `CarinaCommentsModel.forbiddenError`<br>`404`: `CarinaCommentsModel.notFoundError`<br>`422`: `CarinaCommentsModel.validationError` | `CarinaCommentsServ.createReply` |
| `DELETE` | `/carina/comments/:commentId` | Delete comment strictly by comment ID (UUID) | Carina Comments | params: `CarinaCommentsModel.commentParam` | `200`: `CarinaCommentsModel.deleteCommentResponse`<br>`401`: `CarinaCommentsModel.unauthorizedError`<br>`403`: `CarinaCommentsModel.forbiddenError`<br>`404`: `CarinaCommentsModel.notFoundError`<br>`422`: `CarinaCommentsModel.validationError` | `CarinaCommentsServ.deleteComment` |

### `GET /carina/comments/user/:userId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaCommentsModel.userParam`, query: `CarinaCommentsModel.listCommentsQuery`
- **2.** `[Return]`  — `await CarinaCommentsServ.getProfileComments(params.userId, query)`

### `POST /carina/comments/user/:userId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaCommentsModel.userParam`, body: `CarinaCommentsModel.createCommentBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaCommentsServ.createProfileComment(user.id, params.userId, body)`

### `GET /carina/comments/lists/:userId/:mediaType` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaCommentsModel.listUserParam`, query: `CarinaCommentsModel.listCommentsQuery`
- **2.** `[Return]`  — `await CarinaCommentsServ.getListComments(params.userId, params.mediaType, query)`

### `POST /carina/comments/lists/:userId/:mediaType` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaCommentsModel.listUserParam`, body: `CarinaCommentsModel.createCommentBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaCommentsServ.createListComment(user.id, params.userId, params.mediaType, ...)`

### `DELETE /carina/comments/:commentId/reply/:replyId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaCommentsModel.replyParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaCommentsServ.deleteReply(user, params.commentId, params.replyId)`

### `PATCH /carina/comments/:commentId/reply/:replyId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaCommentsModel.replyParam`, body: `CarinaCommentsModel.createReplyBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaCommentsServ.updateReply(user, params.commentId, params.replyId, ...)`

### `POST /carina/comments/:commentId/reply` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaCommentsModel.commentParam`, body: `CarinaCommentsModel.createReplyBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaCommentsServ.createReply(user.id, params.commentId, body)`

### `DELETE /carina/comments/:commentId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaCommentsModel.commentParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaCommentsServ.deleteComment(user, params.commentId)`

## Exported Types, Methods & Algorithms

### `const carinaComments` (L6)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/carina/comments/comments.model.ts` — `CarinaCommentsModel`
- [apps/carina/comments/comments.serv.ts](./comments.serv.md) ([[apps/carina/comments/comments.serv]]) — `CarinaCommentsServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_21`
