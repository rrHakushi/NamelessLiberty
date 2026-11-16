# notifications.ctrl.ts

- **Source**: [`apps/carina/notifications/notifications.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/notifications/notifications.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/carina/notifications/` | Get paginated encrypted notifications for authenticated user (10 per page default) | Carina Notifications | query: `CarinaNotificationsModel.listNotificationsQuery` | `200`: `CarinaNotificationsModel.listNotificationsResponse`<br>`401`: `CarinaNotificationsModel.unauthorizedError`<br>`422`: `CarinaNotificationsModel.validationError` | `CarinaNotificationsServ.listNotifications` |
| `DELETE` | `/carina/notifications/` | Delete all (or only read) notifications for authenticated user | Carina Notifications | query: `CarinaNotificationsModel.deleteNotificationsQuery` | `200`: `CarinaNotificationsModel.deleteNotificationsResponse`<br>`401`: `CarinaNotificationsModel.unauthorizedError`<br>`422`: `CarinaNotificationsModel.validationError` | `CarinaNotificationsServ.deleteAllNotifications` |
| `POST` | `/carina/notifications/read` | Mark all unread notifications as read for authenticated user | Carina Notifications | — | `200`: `CarinaNotificationsModel.readAllResponse`<br>`401`: `CarinaNotificationsModel.unauthorizedError` | `CarinaNotificationsServ.markAllRead` |
| `POST` | `/carina/notifications/:notificationId/read` | Mark a single notification as read strictly by notification ID (UUID) | Carina Notifications | params: `CarinaNotificationsModel.notificationParam` | `200`: `CarinaNotificationsModel.readSingleResponse`<br>`401`: `CarinaNotificationsModel.unauthorizedError`<br>`404`: `CarinaNotificationsModel.notFoundError`<br>`422`: `CarinaNotificationsModel.validationError` | `CarinaNotificationsServ.markNotificationRead` |
| `POST` | `/carina/notifications/:notificationId/action` | Execute an interactive action on a notification strictly by notification ID (UUID) | Carina Notifications | params: `CarinaNotificationsModel.notificationParam`<br>body: `CarinaNotificationsModel.actionBody` | `200`: `CarinaNotificationsModel.actionResponse`<br>`400`: `CarinaNotificationsModel.badRequestError`<br>`401`: `CarinaNotificationsModel.unauthorizedError`<br>`404`: `CarinaNotificationsModel.notFoundError`<br>`422`: `CarinaNotificationsModel.validationError` | `CarinaNotificationsServ.executeNotificationAction` |
| `GET` | `/carina/notifications/:notificationId` | Get single encrypted notification details strictly by notification ID (UUID) | Carina Notifications | params: `CarinaNotificationsModel.notificationParam` | `200`: `CarinaNotificationsModel.singleNotificationResponse`<br>`401`: `CarinaNotificationsModel.unauthorizedError`<br>`404`: `CarinaNotificationsModel.notFoundError`<br>`422`: `CarinaNotificationsModel.validationError` | `CarinaNotificationsServ.getNotification` |
| `DELETE` | `/carina/notifications/:notificationId` | Delete single notification strictly by notification ID (UUID) | Carina Notifications | params: `CarinaNotificationsModel.notificationParam` | `200`: `CarinaNotificationsModel.deleteSingleNotificationResponse`<br>`401`: `CarinaNotificationsModel.unauthorizedError`<br>`404`: `CarinaNotificationsModel.notFoundError`<br>`422`: `CarinaNotificationsModel.validationError` | `CarinaNotificationsServ.deleteNotification` |

### `GET /carina/notifications/` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `CarinaNotificationsModel.listNotificationsQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaNotificationsServ.listNotifications(user.id, query)`

### `DELETE /carina/notifications/` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `CarinaNotificationsModel.deleteNotificationsQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaNotificationsServ.deleteAllNotifications(user.id, query)`

### `POST /carina/notifications/read` (L6)

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await CarinaNotificationsServ.markAllRead(user.id)`

### `POST /carina/notifications/:notificationId/read` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaNotificationsModel.notificationParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaNotificationsServ.markNotificationRead(user.id, params.notificationId)`

### `POST /carina/notifications/:notificationId/action` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaNotificationsModel.notificationParam`, body: `CarinaNotificationsModel.actionBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaNotificationsServ.executeNotificationAction(user.id, params.notificationId, body)`

### `GET /carina/notifications/:notificationId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaNotificationsModel.notificationParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaNotificationsServ.getNotification(user.id, params.notificationId)`

### `DELETE /carina/notifications/:notificationId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaNotificationsModel.notificationParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaNotificationsServ.deleteNotification(user.id, params.notificationId)`

## Exported Types, Methods & Algorithms

### `const carinaNotifications` (L6)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/carina/notifications/notifications.model.ts` — `CarinaNotificationsModel`
- [apps/carina/notifications/notifications.serv.ts](./notifications.serv.md) ([[apps/carina/notifications/notifications.serv]]) — `CarinaNotificationsServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_26`
