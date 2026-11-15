# encryption.ctrl.ts

- **Source**: [`apps/akaromi/encryption/encryption.ctrl.ts`](../../../../../../../apps/elysia/src/apps/akaromi/encryption/encryption.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/akaromi/encryption/keys` | Get user post-quantum encryption keys and cryptographic salt | Akaromi Encryption | — | `200`: `AkaromiEncryptionModel.encryptionKeysResponse`<br>`400`: `AkaromiEncryptionModel.badRequestError`<br>`401`: `AkaromiEncryptionModel.unauthorizedError`<br>`404`: `AkaromiEncryptionModel.notFoundError`<br>`422`: `AkaromiEncryptionModel.validationError` | `AkaromiEncryptionServ.getEncryptionKeys` |

### `GET /akaromi/encryption/keys` (L6)

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await AkaromiEncryptionServ.getEncryptionKeys(user.id)`

## Exported Types, Methods & Algorithms

### `const akaromiEncryption` (L6)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/akaromi/encryption/encryption.model.ts` — `AkaromiEncryptionModel`
- [apps/akaromi/encryption/encryption.serv.ts](./encryption.serv.md) ([[apps/akaromi/encryption/encryption.serv]]) — `AkaromiEncryptionServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_1`
