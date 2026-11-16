# ciphers.ctrl.ts

- **Source**: [`apps/akaromi/ciphers/ciphers.ctrl.ts`](../../../../../../../apps/elysia/src/apps/akaromi/ciphers/ciphers.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/akaromi/ciphers/` | Get vault ciphers with optional filters (folder, type, favorite, trash) | Akaromi Ciphers | query: `AkaromiCiphersModel.listCiphersQuery` | `200`: `AkaromiCiphersModel.listCiphersResponse`<br>`400`: `AkaromiCiphersModel.badRequestError`<br>`401`: `AkaromiCiphersModel.unauthorizedError`<br>`422`: `AkaromiCiphersModel.validationError` | `AkaromiCiphersServ.listCiphers` |
| `POST` | `/akaromi/ciphers/` | Create new vault cipher entry (login credentials or ssh key) | Akaromi Ciphers | body: `AkaromiCiphersModel.createCipherBody` | `200`: `AkaromiCiphersModel.createCipherResponse`<br>`400`: `AkaromiCiphersModel.badRequestError`<br>`401`: `AkaromiCiphersModel.unauthorizedError`<br>`404`: `AkaromiCiphersModel.notFoundError`<br>`422`: `AkaromiCiphersModel.validationError` | `AkaromiCiphersServ.createCipher` |
| `DELETE` | `/akaromi/ciphers/trash` | Permanently empty all trashed ciphers for the user | Akaromi Ciphers | — | `200`: `AkaromiCiphersModel.emptyTrashResponse`<br>`401`: `AkaromiCiphersModel.unauthorizedError` | `AkaromiCiphersServ.emptyTrash` |
| `GET` | `/akaromi/ciphers/:cipherId` | Get cipher details and encrypted payload by ID | Akaromi Ciphers | params: `AkaromiCiphersModel.cipherParam` | `200`: `AkaromiCiphersModel.singleCipherResponse`<br>`400`: `AkaromiCiphersModel.badRequestError`<br>`401`: `AkaromiCiphersModel.unauthorizedError`<br>`404`: `AkaromiCiphersModel.notFoundError`<br>`422`: `AkaromiCiphersModel.validationError` | `AkaromiCiphersServ.getCipher` |
| `PATCH` | `/akaromi/ciphers/:cipherId` | Update cipher entry (strictly overwrites ciphertext, zero password history) | Akaromi Ciphers | params: `AkaromiCiphersModel.cipherParam`<br>body: `AkaromiCiphersModel.updateCipherBody` | `200`: `AkaromiCiphersModel.updateCipherResponse`<br>`400`: `AkaromiCiphersModel.badRequestError`<br>`401`: `AkaromiCiphersModel.unauthorizedError`<br>`404`: `AkaromiCiphersModel.notFoundError`<br>`422`: `AkaromiCiphersModel.validationError` | `AkaromiCiphersServ.updateCipher` |
| `PUT` | `/akaromi/ciphers/:cipherId` | Update cipher entry via PUT (strictly overwrites ciphertext) | Akaromi Ciphers | params: `AkaromiCiphersModel.cipherParam`<br>body: `AkaromiCiphersModel.updateCipherBody` | `200`: `AkaromiCiphersModel.updateCipherResponse`<br>`400`: `AkaromiCiphersModel.badRequestError`<br>`401`: `AkaromiCiphersModel.unauthorizedError`<br>`404`: `AkaromiCiphersModel.notFoundError`<br>`422`: `AkaromiCiphersModel.validationError` | `AkaromiCiphersServ.updateCipher` |
| `DELETE` | `/akaromi/ciphers/:cipherId` | Move cipher to trash (or permanently delete if permanent=true) | Akaromi Ciphers | params: `AkaromiCiphersModel.cipherParam`<br>query: `AkaromiCiphersModel.deleteCipherQuery` | `200`: `AkaromiCiphersModel.deleteCipherResponse`<br>`400`: `AkaromiCiphersModel.badRequestError`<br>`401`: `AkaromiCiphersModel.unauthorizedError`<br>`404`: `AkaromiCiphersModel.notFoundError`<br>`422`: `AkaromiCiphersModel.validationError` | `AkaromiCiphersServ.deleteCipher` |
| `POST` | `/akaromi/ciphers/:cipherId/restore` | Restore cipher from trash bin | Akaromi Ciphers | params: `AkaromiCiphersModel.cipherParam` | `200`: `AkaromiCiphersModel.restoreCipherResponse`<br>`400`: `AkaromiCiphersModel.badRequestError`<br>`401`: `AkaromiCiphersModel.unauthorizedError`<br>`404`: `AkaromiCiphersModel.notFoundError`<br>`422`: `AkaromiCiphersModel.validationError` | `AkaromiCiphersServ.restoreCipher` |

### `GET /akaromi/ciphers/` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `AkaromiCiphersModel.listCiphersQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await AkaromiCiphersServ.listCiphers(user.id, query)`

### `POST /akaromi/ciphers/` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `AkaromiCiphersModel.createCipherBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await AkaromiCiphersServ.createCipher(user.id, body)`

### `DELETE /akaromi/ciphers/trash` (L6)

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await AkaromiCiphersServ.emptyTrash(user.id)`

### `GET /akaromi/ciphers/:cipherId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `AkaromiCiphersModel.cipherParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await AkaromiCiphersServ.getCipher(user.id, params.cipherId)`

### `PATCH /akaromi/ciphers/:cipherId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `AkaromiCiphersModel.cipherParam`, body: `AkaromiCiphersModel.updateCipherBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await AkaromiCiphersServ.updateCipher(user.id, params.cipherId, body)`

### `PUT /akaromi/ciphers/:cipherId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `AkaromiCiphersModel.cipherParam`, body: `AkaromiCiphersModel.updateCipherBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await AkaromiCiphersServ.updateCipher(user.id, params.cipherId, body)`

### `DELETE /akaromi/ciphers/:cipherId` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `AkaromiCiphersModel.cipherParam`, query: `AkaromiCiphersModel.deleteCipherQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await AkaromiCiphersServ.deleteCipher(user.id, params.cipherId, query?.permanent ?? false)`

### `POST /akaromi/ciphers/:cipherId/restore` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `AkaromiCiphersModel.cipherParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await AkaromiCiphersServ.restoreCipher(user.id, params.cipherId)`

## Exported Types, Methods & Algorithms

### `const akaromiCiphers` (L6)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/akaromi/ciphers/ciphers.model.ts` — `AkaromiCiphersModel`
- [apps/akaromi/ciphers/ciphers.serv.ts](./ciphers.serv.md) ([[apps/akaromi/ciphers/ciphers.serv]]) — `AkaromiCiphersServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_0`
