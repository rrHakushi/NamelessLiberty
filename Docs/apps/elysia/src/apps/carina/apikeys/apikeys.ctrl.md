# apikeys.ctrl.ts

- **Source**: [`apps/carina/apikeys/apikeys.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/apikeys/apikeys.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/carina/auth/apikeys` | Get all API keys (10 per page) | Carina API Keys | query: `CarinaApiKeysModel.listQuery` | `200`: `CarinaApiKeysModel.listResponse`<br>`401`: `CarinaApiKeysModel.unauthorizedError`<br>`422`: `CarinaApiKeysModel.validationError` | `CarinaApiKeysServ.listKeys` |
| `POST` | `/carina/auth/apikeys` | Create API key | Carina API Keys | body: `CarinaApiKeysModel.createBody` | `200`: `CarinaApiKeysModel.createResponse`<br>`400`: `CarinaApiKeysModel.badRequestError`<br>`401`: `CarinaApiKeysModel.unauthorizedError`<br>`422`: `CarinaApiKeysModel.validationError` | `CarinaApiKeysServ.createKey` |
| `PATCH` | `/carina/auth/apikeys/:keyId` | Update API key | Carina API Keys | params: `CarinaApiKeysModel.keyParams`<br>body: `CarinaApiKeysModel.updateBody` | `200`: `CarinaApiKeysModel.updateResponse`<br>`400`: `CarinaApiKeysModel.badRequestError`<br>`401`: `CarinaApiKeysModel.unauthorizedError`<br>`404`: `CarinaApiKeysModel.notFoundError`<br>`422`: `CarinaApiKeysModel.validationError` | `CarinaApiKeysServ.updateKey` |
| `DELETE` | `/carina/auth/apikeys/:keyId` | Delete API key | Carina API Keys | params: `CarinaApiKeysModel.keyParams` | `200`: `CarinaApiKeysModel.deleteResponse`<br>`401`: `CarinaApiKeysModel.unauthorizedError`<br>`404`: `CarinaApiKeysModel.notFoundError`<br>`422`: `CarinaApiKeysModel.validationError` | `CarinaApiKeysServ.deleteKey` |
| `POST` | `/carina/auth/apikeys/:keyId/regenerate` | Regenerate API key | Carina API Keys | params: `CarinaApiKeysModel.keyParams` | `200`: `CarinaApiKeysModel.regenerateResponse`<br>`401`: `CarinaApiKeysModel.unauthorizedError`<br>`404`: `CarinaApiKeysModel.notFoundError`<br>`422`: `CarinaApiKeysModel.validationError` | `CarinaApiKeysServ.regenerateKey` |

### `GET /carina/auth/apikeys` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `CarinaApiKeysModel.listQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaApiKeysServ.listKeys(user.id, query)`

### `POST /carina/auth/apikeys` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaApiKeysModel.createBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaApiKeysServ.createKey(user.id, body)`

### `PATCH /carina/auth/apikeys/:keyId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaApiKeysModel.keyParams`, body: `CarinaApiKeysModel.updateBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaApiKeysServ.updateKey(user.id, keyId, body)`

### `DELETE /carina/auth/apikeys/:keyId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaApiKeysModel.keyParams`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaApiKeysServ.deleteKey(user.id, keyId)`

### `POST /carina/auth/apikeys/:keyId/regenerate` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaApiKeysModel.keyParams`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaApiKeysServ.regenerateKey(user.id, keyId)`

## Exported Types, Methods & Algorithms

### `const carinaApiKeys` (L6)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/carina/apikeys/apikeys.model.ts` — `CarinaApiKeysModel`
- [apps/carina/apikeys/apikeys.serv.ts](./apikeys.serv.md) ([[apps/carina/apikeys/apikeys.serv]]) — `CarinaApiKeysServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_17`
