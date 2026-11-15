# backupcodes.ctrl.ts

- **Source**: [`apps/carina/backupcodes/backupcodes.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/backupcodes/backupcodes.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/carina/auth/twofactor/backupcodes/generate` | Generate initial backup codes | Carina Two-Factor Backup Codes | — | `200`: `CarinaBackupCodesModel.generateResponse`<br>`400`: `CarinaBackupCodesModel.badRequestError`<br>`401`: `CarinaBackupCodesModel.unauthorizedError`<br>`404`: `CarinaBackupCodesModel.notFoundError` | `CarinaBackupCodesServ.generateCodes` |
| `POST` | `/carina/auth/twofactor/backupcodes/regenerate` | Regenerate backup codes | Carina Two-Factor Backup Codes | — | `200`: `CarinaBackupCodesModel.regenerateResponse`<br>`400`: `CarinaBackupCodesModel.badRequestError`<br>`401`: `CarinaBackupCodesModel.unauthorizedError`<br>`404`: `CarinaBackupCodesModel.notFoundError` | `CarinaBackupCodesServ.regenerateCodes` |
| `POST` | `/carina/auth/twofactor/backupcodes/verify` | Verify backup code | Carina Two-Factor Backup Codes | body: `CarinaBackupCodesModel.verifyBody` | `200`: `CarinaBackupCodesModel.verifyResponse`<br>`400`: `CarinaBackupCodesModel.badRequestError`<br>`401`: `CarinaBackupCodesModel.unauthorizedError`<br>`404`: `CarinaBackupCodesModel.notFoundError`<br>`422`: `CarinaBackupCodesModel.validationError` | `CarinaBackupCodesServ.verifyCode` |

### `POST /carina/auth/twofactor/backupcodes/generate` (L7)

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await CarinaBackupCodesServ.generateCodes(user.id)`

### `POST /carina/auth/twofactor/backupcodes/regenerate` (L7)

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await CarinaBackupCodesServ.regenerateCodes(user.id)`

### `POST /carina/auth/twofactor/backupcodes/verify` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaBackupCodesModel.verifyBody`
- **2.** `[Sequence]` Calls `CarinaBackupCodesServ.verifyCode` and stores result as `res`
- **3.** `[If]` `res.token && sessionCookie`
  - **3.1.** `[Sequence]` Calls `getDomainConfig` and stores result as `{ isSecure, cookieDomain }`
  - **3.2.** `[Sequence]` Calls `sessionCookie.set`
- **4.** `[Return]`  — `res`

## Exported Types, Methods & Algorithms

### `const carinaBackupCodes` (L7)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/carina/backupcodes/backupcodes.model.ts` — `CarinaBackupCodesModel`
- [apps/carina/backupcodes/backupcodes.serv.ts](./backupcodes.serv.md) ([[apps/carina/backupcodes/backupcodes.serv]]) — `CarinaBackupCodesServ`
- [core/utils/domain.ts](../../../core/utils/domain.md) ([[core/utils/domain]]) — `getDomainConfig`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_19`
