# vault.ctrl.ts

- **Source**: [`apps/akaromi/vault/vault.ctrl.ts`](../../../../../../../apps/elysia/src/apps/akaromi/vault/vault.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/akaromi/sync` | Full or incremental vault synchronization state | Akaromi Vault | query: `AkaromiVaultModel.syncQuery` | `200`: `AkaromiVaultModel.syncResponse`<br>`400`: `AkaromiVaultModel.badRequestError`<br>`401`: `AkaromiVaultModel.unauthorizedError`<br>`422`: `AkaromiVaultModel.validationError` | `AkaromiVaultServ.syncVault` |
| `GET` | `/akaromi/export` | Export complete non-deleted vault data for backup | Akaromi Vault | — | `200`: `AkaromiVaultModel.exportResponse`<br>`401`: `AkaromiVaultModel.unauthorizedError` | `AkaromiVaultServ.exportVault` |
| `POST` | `/akaromi/import` | Import vault folders and ciphers with tempId remapping | Akaromi Vault | body: `AkaromiVaultModel.importBody` | `200`: `AkaromiVaultModel.importResponse`<br>`400`: `AkaromiVaultModel.badRequestError`<br>`401`: `AkaromiVaultModel.unauthorizedError`<br>`422`: `AkaromiVaultModel.validationError` | `AkaromiVaultServ.importVault` |

### `GET /akaromi/sync` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `AkaromiVaultModel.syncQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await AkaromiVaultServ.syncVault(user.id, query?.since)`

### `GET /akaromi/export` (L6)

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await AkaromiVaultServ.exportVault(user.id)`

### `POST /akaromi/import` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `AkaromiVaultModel.importBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await AkaromiVaultServ.importVault(user.id, body)`

## Exported Types, Methods & Algorithms

### `const akaromiVault` (L6)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/akaromi/vault/vault.model.ts` — `AkaromiVaultModel`
- [apps/akaromi/vault/vault.serv.ts](./vault.serv.md) ([[apps/akaromi/vault/vault.serv]]) — `AkaromiVaultServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_2`
