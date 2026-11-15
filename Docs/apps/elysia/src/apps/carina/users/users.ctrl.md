# users.ctrl.ts

- **Source**: [`apps/carina/users/users.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/users/users.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/carina/users/` | Search and list public users (10 per page default) | Carina Users | query: `CarinaUsersModel.listUsersQuery` | `200`: `CarinaUsersModel.listUsersResponse`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.listUsers` |
| `GET` | `/carina/users/me` | Return full account information for authenticated user | Carina Users | — | `200`: `CarinaUsersModel.currentUserResponse`<br>`401`: `CarinaUsersModel.unauthorizedError`<br>`404`: `CarinaUsersModel.notFoundError` | `CarinaUsersServ.getMe` |
| `PATCH` | `/carina/users/me` | Update account info, profile customization, settings, and assets for authenticated user | Carina Users | body: `CarinaUsersModel.updateMeBody` | `200`: `CarinaUsersModel.updateMeResponse`<br>`400`: `CarinaUsersModel.badRequestError`<br>`401`: `CarinaUsersModel.unauthorizedError`<br>`404`: `CarinaUsersModel.notFoundError`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.updateMe` |
| `POST` | `/carina/users/me/assets` | Upload user profile asset (avatar, banner, frame, nameplate) to storage | Carina Users | body: `CarinaUsersModel.uploadAssetBody` | `200`: `CarinaUsersModel.uploadAssetResponse`<br>`400`: `CarinaUsersModel.badRequestError`<br>`401`: `CarinaUsersModel.unauthorizedError`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.uploadAsset` |
| `DELETE` | `/carina/users/me/assets` | Delete user profile asset from storage | Carina Users | body: `CarinaUsersModel.deleteAssetBody` | `200`: `CarinaUsersModel.deleteAssetResponse`<br>`401`: `CarinaUsersModel.unauthorizedError`<br>`403`: `CarinaUsersModel.forbiddenError`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.deleteAsset` |
| `DELETE` | `/carina/users/activity/:id` | Delete user activity log item by activity ID | Carina Users | params: `CarinaUsersModel.activityItemParam` | `200`: `CarinaUsersModel.deleteActivityResponse`<br>`401`: `CarinaUsersModel.unauthorizedError`<br>`403`: `CarinaUsersModel.forbiddenError`<br>`404`: `CarinaUsersModel.notFoundError`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.deleteActivity` |
| `POST` | `/carina/users/:userId/block` | Block a target user strictly by user ID | Carina Users | params: `CarinaUsersModel.userParam` | `200`: `CarinaUsersModel.blockUserResponse`<br>`400`: `CarinaUsersModel.badRequestError`<br>`401`: `CarinaUsersModel.unauthorizedError`<br>`404`: `CarinaUsersModel.notFoundError`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.blockUser` |
| `POST` | `/carina/users/:userId/unblock` | Unblock a target user strictly by user ID | Carina Users | params: `CarinaUsersModel.userParam` | `200`: `CarinaUsersModel.unblockUserResponse`<br>`401`: `CarinaUsersModel.unauthorizedError`<br>`404`: `CarinaUsersModel.notFoundError`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.unblockUser` |
| `GET` | `/carina/users/:userId/friendship` | Get friendship & social relationship status with target user by user ID | Carina Users | params: `CarinaUsersModel.userParam` | `200`: `CarinaUsersModel.friendshipResponse`<br>`401`: `CarinaUsersModel.unauthorizedError`<br>`404`: `CarinaUsersModel.notFoundError`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.getFriendshipStatus` |
| `GET` | `/carina/users/:userId/assets` | Get public user assets (avatar, banner, decor) strictly by user ID | Carina Users | params: `CarinaUsersModel.userParam` | `200`: `CarinaUsersModel.userAssetsResponse`<br>`404`: `CarinaUsersModel.notFoundError`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.getUserAssets` |
| `GET` | `/carina/users/:userId/badges` | Get user unlocked badges mapped with full metadata strictly by user ID | Carina Users | params: `CarinaUsersModel.userParam` | `200`: `CarinaUsersModel.userBadgesResponse`<br>`404`: `CarinaUsersModel.notFoundError`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.getUserBadges` |
| `POST` | `/carina/users/:userId/badges/evaluate` | Evaluate and award eligible badge achievements for user by user ID | Carina Users | params: `CarinaUsersModel.userParam` | `200`: `CarinaUsersModel.evaluateBadgesResponse`<br>`401`: `CarinaUsersModel.unauthorizedError`<br>`403`: `CarinaUsersModel.forbiddenError`<br>`404`: `CarinaUsersModel.notFoundError`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.evaluateBadges` |
| `GET` | `/carina/users/:userId/activity/:category` | Get user activity feed filtered by category strictly by user ID | Carina Users | params: `CarinaUsersModel.activityCategoryParam`<br>query: `CarinaUsersModel.activityPaginationQuery` | `200`: `CarinaUsersModel.activityResponse`<br>`400`: `CarinaUsersModel.badRequestError`<br>`404`: `CarinaUsersModel.notFoundError`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.getUserActivityByCategory` |
| `GET` | `/carina/users/:userId/activity` | Get user full activity stream (10 per page default) strictly by user ID | Carina Users | params: `CarinaUsersModel.userParam`<br>query: `CarinaUsersModel.activityPaginationQuery` | `200`: `CarinaUsersModel.activityResponse`<br>`404`: `CarinaUsersModel.notFoundError`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.getUserActivity` |
| `GET` | `/carina/users/:userId/favorites/all` | Get all user favorites in all categories at once strictly by user ID | Carina Users | params: `CarinaUsersModel.userParam`<br>query: `CarinaUsersModel.allFavoritesQuery` | `200`: `CarinaUsersModel.allFavoritesResponse`<br>`400`: `CarinaUsersModel.badRequestError`<br>`404`: `CarinaUsersModel.notFoundError`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.getAllUserFavorites` |
| `GET` | `/carina/users/:userId/favorites/:category` | Get user favorites filtered by category strictly by user ID | Carina Users | params: `CarinaUsersModel.favoritesCategoryParam`<br>query: `CarinaUsersModel.activityPaginationQuery` | `200`: `CarinaUsersModel.favoritesResponse`<br>`400`: `CarinaUsersModel.badRequestError`<br>`404`: `CarinaUsersModel.notFoundError`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.getUserFavoritesByCategory` |
| `GET` | `/carina/users/:userId/favorites` | Get user favorites (10 per page default) strictly by user ID | Carina Users | params: `CarinaUsersModel.userParam`<br>query: `CarinaUsersModel.activityPaginationQuery` | `200`: `CarinaUsersModel.favoritesResponse`<br>`404`: `CarinaUsersModel.notFoundError`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.getUserFavorites` |
| `GET` | `/carina/users/:userId` | Get public user profile information strictly by user ID | Carina Users | params: `CarinaUsersModel.userParam` | `200`: `CarinaUsersModel.userProfileResponse`<br>`404`: `CarinaUsersModel.notFoundError`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.getUserProfile` |
| `GET` | `/carina/users/:userId/friends` | Get public friends list of target user strictly by user ID | Carina Users | params: `CarinaUsersModel.userParam`<br>query: `CarinaFriendsModel.listFriendsQuery` | `200`: `CarinaFriendsModel.listFriendsResponse`<br>`404`: `CarinaUsersModel.notFoundError`<br>`422`: `CarinaUsersModel.validationError` | `CarinaUsersServ.getUserFriends` |

### `GET /carina/users/` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `CarinaUsersModel.listUsersQuery`
- **2.** `[Return]`  — `await CarinaUsersServ.listUsers(query)`

### `GET /carina/users/me` (L7)

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await CarinaUsersServ.getMe(user.id)`

### `PATCH /carina/users/me` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaUsersModel.updateMeBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaUsersServ.updateMe(user.id, body)`

### `POST /carina/users/me/assets` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaUsersModel.uploadAssetBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaUsersServ.uploadAsset(user.id, body)`

### `DELETE /carina/users/me/assets` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaUsersModel.deleteAssetBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaUsersServ.deleteAsset(user.id, body.key)`

### `DELETE /carina/users/activity/:id` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaUsersModel.activityItemParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaUsersServ.deleteActivity(user.id, user.permissions, params.id)`

### `POST /carina/users/:userId/block` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaUsersModel.userParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaUsersServ.blockUser(user.id, params.userId)`

### `POST /carina/users/:userId/unblock` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaUsersModel.userParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaUsersServ.unblockUser(user.id, params.userId)`

### `GET /carina/users/:userId/friendship` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaUsersModel.userParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaUsersServ.getFriendshipStatus(user.id, params.userId)`

### `GET /carina/users/:userId/assets` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaUsersModel.userParam`
- **2.** `[Return]`  — `await CarinaUsersServ.getUserAssets(params.userId)`

### `GET /carina/users/:userId/badges` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaUsersModel.userParam`
- **2.** `[Return]`  — `await CarinaUsersServ.getUserBadges(params.userId)`

### `POST /carina/users/:userId/badges/evaluate` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaUsersModel.userParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaUsersServ.evaluateBadges({ id: user.id, permissions: user.permissions }, params.userId)`

### `GET /carina/users/:userId/activity/:category` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaUsersModel.activityCategoryParam`, query: `CarinaUsersModel.activityPaginationQuery`
- **2.** `[Return]`  — `await CarinaUsersServ.getUserActivityByCategory(params.userId, params.category, query, ...)`

### `GET /carina/users/:userId/activity` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaUsersModel.userParam`, query: `CarinaUsersModel.activityPaginationQuery`
- **2.** `[Return]`  — `await CarinaUsersServ.getUserActivity(params.userId, query, userSession.getUser())`

### `GET /carina/users/:userId/favorites/all` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaUsersModel.userParam`, query: `CarinaUsersModel.allFavoritesQuery`
- **2.** `[Return]`  — `await CarinaUsersServ.getAllUserFavorites(params.userId, query)`

### `GET /carina/users/:userId/favorites/:category` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaUsersModel.favoritesCategoryParam`, query: `CarinaUsersModel.activityPaginationQuery`
- **2.** `[Return]`  — `await CarinaUsersServ.getUserFavoritesByCategory(params.userId, params.category, query)`

### `GET /carina/users/:userId/favorites` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaUsersModel.userParam`, query: `CarinaUsersModel.activityPaginationQuery`
- **2.** `[Return]`  — `await CarinaUsersServ.getUserFavorites(params.userId, query)`

### `GET /carina/users/:userId` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaUsersModel.userParam`
- **2.** `[Return]`  — `await CarinaUsersServ.getUserProfile(params.userId, userSession.user?.id)`

### `GET /carina/users/:userId/friends` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaUsersModel.userParam`, query: `CarinaFriendsModel.listFriendsQuery`
- **2.** `[Return]`  — `await CarinaUsersServ.getUserFriends(params.userId, query, userSession.user?.id)`

## Exported Types, Methods & Algorithms

### `const carinaUsers` (L7)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/carina/users/users.model.ts` — `CarinaUsersModel`
- `apps/carina/friends/friends.model.ts` — `CarinaFriendsModel`
- [apps/carina/users/users.serv.ts](./users.serv.md) ([[apps/carina/users/users.serv]]) — `CarinaUsersServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_34`
