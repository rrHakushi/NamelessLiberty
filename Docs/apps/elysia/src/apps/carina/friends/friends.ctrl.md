# friends.ctrl.ts

- **Source**: [`apps/carina/friends/friends.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/friends/friends.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/carina/friends/` | Get paginated friends list for authenticated user (10 per page default) | Carina Friends | query: `CarinaFriendsModel.listFriendsQuery` | `200`: `CarinaFriendsModel.listFriendsResponse`<br>`401`: `CarinaFriendsModel.unauthorizedError`<br>`422`: `CarinaFriendsModel.validationError` | `CarinaFriendsServ.listFriends` |
| `GET` | `/carina/friends/requests` | Get pending incoming or outgoing friend requests (10 per page default) | Carina Friends | query: `CarinaFriendsModel.listRequestsQuery` | `200`: `CarinaFriendsModel.listRequestsResponse`<br>`401`: `CarinaFriendsModel.unauthorizedError`<br>`422`: `CarinaFriendsModel.validationError` | `CarinaFriendsServ.listFriendRequests` |
| `POST` | `/carina/friends/requests` | Send friend request strictly by target user ID (UUID) | Carina Friends | body: `CarinaFriendsModel.sendRequestBody` | `200`: `CarinaFriendsModel.sendRequestResponse`<br>`400`: `CarinaFriendsModel.badRequestError`<br>`401`: `CarinaFriendsModel.unauthorizedError`<br>`404`: `CarinaFriendsModel.notFoundError`<br>`422`: `CarinaFriendsModel.validationError` | `CarinaFriendsServ.sendFriendRequest` |
| `POST` | `/carina/friends/requests/:requestId/accept` | Accept incoming friend request by request ID | Carina Friends | params: `CarinaFriendsModel.requestParam` | `200`: `CarinaFriendsModel.acceptRequestResponse`<br>`400`: `CarinaFriendsModel.badRequestError`<br>`401`: `CarinaFriendsModel.unauthorizedError`<br>`404`: `CarinaFriendsModel.notFoundError`<br>`422`: `CarinaFriendsModel.validationError` | `CarinaFriendsServ.acceptFriendRequest` |
| `POST` | `/carina/friends/requests/:requestId/decline` | Decline incoming friend request by request ID | Carina Friends | params: `CarinaFriendsModel.requestParam` | `200`: `CarinaFriendsModel.declineRequestResponse`<br>`401`: `CarinaFriendsModel.unauthorizedError`<br>`404`: `CarinaFriendsModel.notFoundError`<br>`422`: `CarinaFriendsModel.validationError` | `CarinaFriendsServ.declineFriendRequest` |
| `GET` | `/carina/friends/media/:mediaType/:id` | Get friends tracking status and score for a specific media item | Carina Friends | params: `CarinaFriendsModel.mediaTrackingParam` | `200`: `CarinaFriendsModel.mediaTrackingResponse`<br>`400`: `CarinaFriendsModel.badRequestError`<br>`401`: `CarinaFriendsModel.unauthorizedError`<br>`422`: `CarinaFriendsModel.validationError` | `CarinaFriendsServ.getFriendsMediaTracking` |
| `POST` | `/carina/friends/recommend` | Recommend a media title directly to selected friends strictly by user IDs | Carina Friends | body: `CarinaFriendsModel.recommendBody` | `200`: `CarinaFriendsModel.recommendResponse`<br>`400`: `CarinaFriendsModel.badRequestError`<br>`401`: `CarinaFriendsModel.unauthorizedError`<br>`422`: `CarinaFriendsModel.validationError` | `CarinaFriendsServ.recommendToFriends` |
| `DELETE` | `/carina/friends/:friendId` | Remove bilateral friendship strictly by friend user ID (UUID) | Carina Friends | params: `CarinaFriendsModel.friendParam` | `200`: `CarinaFriendsModel.deleteFriendResponse`<br>`401`: `CarinaFriendsModel.unauthorizedError`<br>`404`: `CarinaFriendsModel.notFoundError`<br>`422`: `CarinaFriendsModel.validationError` | `CarinaFriendsServ.removeFriend` |
| `PATCH` | `/carina/friends/:friendId` | Update friendship settings (privacy, nickname) | Carina Friends | params: `CarinaFriendsModel.friendParam`<br>body: `CarinaFriendsModel.updateFriendBody` | `200`: `CarinaFriendsModel.updateFriendResponse`<br>`401`: `CarinaFriendsModel.unauthorizedError`<br>`404`: `CarinaFriendsModel.notFoundError`<br>`422`: `CarinaFriendsModel.validationError` | `CarinaFriendsServ.updateFriend` |
| `POST` | `/carina/friends/requests/:requestId/respond` | Respond to friend request (ACCEPT, DECLINE, or BLOCK) | Carina Friends | params: `CarinaFriendsModel.requestParam`<br>body: `CarinaFriendsModel.respondRequestBody` | `200`: `CarinaFriendsModel.respondRequestResponse`<br>`400`: `CarinaFriendsModel.badRequestError`<br>`401`: `CarinaFriendsModel.unauthorizedError`<br>`404`: `CarinaFriendsModel.notFoundError`<br>`422`: `CarinaFriendsModel.validationError` | `CarinaFriendsServ.respondFriendRequest` |
| `DELETE` | `/carina/friends/requests/:requestId` | Cancel outgoing pending friend request | Carina Friends | params: `CarinaFriendsModel.requestParam` | `200`: `CarinaFriendsModel.cancelRequestResponse`<br>`401`: `CarinaFriendsModel.unauthorizedError`<br>`404`: `CarinaFriendsModel.notFoundError`<br>`422`: `CarinaFriendsModel.validationError` | `CarinaFriendsServ.cancelFriendRequest` |
| `POST` | `/carina/friends/block` | Block a user by target user ID or username | Carina Friends | body: `CarinaFriendsModel.blockUserBody` | `200`: `CarinaFriendsModel.blockUserResponse`<br>`400`: `CarinaFriendsModel.badRequestError`<br>`401`: `CarinaFriendsModel.unauthorizedError`<br>`404`: `CarinaFriendsModel.notFoundError`<br>`422`: `CarinaFriendsModel.validationError` | `CarinaFriendsServ.blockUser` |
| `DELETE` | `/carina/friends/block/:blockId` | Unblock user by block ID or blocked user ID | Carina Friends | params: `CarinaFriendsModel.blockParam` | `200`: `CarinaFriendsModel.unblockUserResponse`<br>`401`: `CarinaFriendsModel.unauthorizedError`<br>`404`: `CarinaFriendsModel.notFoundError`<br>`422`: `CarinaFriendsModel.validationError` | `CarinaFriendsServ.unblockUser` |

### `GET /carina/friends/` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `CarinaFriendsModel.listFriendsQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaFriendsServ.listFriends(user.id, query)`

### `GET /carina/friends/requests` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `CarinaFriendsModel.listRequestsQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaFriendsServ.listFriendRequests(user.id, query)`

### `POST /carina/friends/requests` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaFriendsModel.sendRequestBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaFriendsServ.sendFriendRequest(user.id, body)`

### `POST /carina/friends/requests/:requestId/accept` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaFriendsModel.requestParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaFriendsServ.acceptFriendRequest(user.id, params.requestId)`

### `POST /carina/friends/requests/:requestId/decline` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaFriendsModel.requestParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaFriendsServ.declineFriendRequest(user.id, params.requestId)`

### `GET /carina/friends/media/:mediaType/:id` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaFriendsModel.mediaTrackingParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaFriendsServ.getFriendsMediaTracking(user.id, params.mediaType, Number(params.id))`

### `POST /carina/friends/recommend` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaFriendsModel.recommendBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaFriendsServ.recommendToFriends(user.id, body)`

### `DELETE /carina/friends/:friendId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaFriendsModel.friendParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaFriendsServ.removeFriend(user.id, params.friendId)`

### `PATCH /carina/friends/:friendId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaFriendsModel.friendParam`, body: `CarinaFriendsModel.updateFriendBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaFriendsServ.updateFriend(user.id, params.friendId, body)`

### `POST /carina/friends/requests/:requestId/respond` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaFriendsModel.requestParam`, body: `CarinaFriendsModel.respondRequestBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaFriendsServ.respondFriendRequest(user.id, params.requestId, body.action)`

### `DELETE /carina/friends/requests/:requestId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaFriendsModel.requestParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaFriendsServ.cancelFriendRequest(user.id, params.requestId)`

### `POST /carina/friends/block` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaFriendsModel.blockUserBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaFriendsServ.blockUser(user.id, body)`

### `DELETE /carina/friends/block/:blockId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaFriendsModel.blockParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaFriendsServ.unblockUser(user.id, params.blockId)`

## Exported Types, Methods & Algorithms

### `const carinaFriends` (L6)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/carina/friends/friends.model.ts` — `CarinaFriendsModel`
- [apps/carina/friends/friends.serv.ts](./friends.serv.md) ([[apps/carina/friends/friends.serv]]) — `CarinaFriendsServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_25`
