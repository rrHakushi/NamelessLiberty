# history.ctrl.ts

- **Source**: [`apps/kiroshi/history/history.ctrl.ts`](../../../../../../../apps/elysia/src/apps/kiroshi/history/history.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/kiroshi/history/` | Get decrypted web search history for the authenticated user | Kiroshi History | query: `KiroshiHistoryModel.historyQuery` | `200`: `KiroshiHistoryModel.historyResponse`<br>`401`: `KiroshiHistoryModel.unauthorizedError`<br>`422`: `KiroshiHistoryModel.validationError` | `KiroshiHistoryServ.getHistory` |
| `POST` | `/kiroshi/history/track` | Track clicked site or media link in search history | Kiroshi History | body: `KiroshiHistoryModel.trackClickBody` | `200`: `KiroshiHistoryModel.trackClickResponse`<br>`401`: `KiroshiHistoryModel.unauthorizedError`<br>`422`: `KiroshiHistoryModel.validationError` | `KiroshiHistoryServ.recordClick` |
| `DELETE` | `/kiroshi/history/` | Clear all user search history or delete specific entry if query ?id is provided | Kiroshi History | query: `KiroshiHistoryModel.historyDeleteQuery` | `200`: `KiroshiHistoryModel.deleteHistoryResponse`<br>`401`: `KiroshiHistoryModel.unauthorizedError`<br>`404`: `KiroshiHistoryModel.notFoundError`<br>`422`: `KiroshiHistoryModel.validationError` | `KiroshiHistoryServ.deleteHistoryItem`<br>`KiroshiHistoryServ.clearHistory` |
| `DELETE` | `/kiroshi/history/:id` | Delete individual search history item by ID | Kiroshi History | params: `KiroshiHistoryModel.historyParam` | `200`: `KiroshiHistoryModel.deleteHistoryResponse`<br>`401`: `KiroshiHistoryModel.unauthorizedError`<br>`404`: `KiroshiHistoryModel.notFoundError`<br>`422`: `KiroshiHistoryModel.validationError` | `KiroshiHistoryServ.deleteHistoryItem` |

### `GET /kiroshi/history/` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `KiroshiHistoryModel.historyQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await KiroshiHistoryServ.getHistory(user.id, query)`

### `POST /kiroshi/history/track` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `KiroshiHistoryModel.trackClickBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await KiroshiHistoryServ.recordClick(user.id, body)`

### `DELETE /kiroshi/history/` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `KiroshiHistoryModel.historyDeleteQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[If]` `query?.id`
  - **3.1.** `[Return]`  — `await KiroshiHistoryServ.deleteHistoryItem(user.id, query.id)`
- **4.** `[Return]`  — `await KiroshiHistoryServ.clearHistory(user.id)`

### `DELETE /kiroshi/history/:id` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `KiroshiHistoryModel.historyParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await KiroshiHistoryServ.deleteHistoryItem(user.id, params.id)`

## Exported Types, Methods & Algorithms

### `const kiroshiHistory` (L6)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/kiroshi/history/history.model.ts` — `KiroshiHistoryModel`
- [apps/kiroshi/history/history.serv.ts](./history.serv.md) ([[apps/kiroshi/history/history.serv]]) — `KiroshiHistoryServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_35`
