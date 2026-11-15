# totp.ctrl.ts

- **Source**: [`apps/carina/totp/totp.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/totp/totp.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/carina/auth/twofactor/totp/setup` | Setup TOTP authenticator app | Carina Two-Factor TOTP | — | `200`: `CarinaTotpModel.setupResponse`<br>`401`: `CarinaTotpModel.unauthorizedError`<br>`404`: `CarinaTotpModel.notFoundError` | `CarinaTotpServ.setupTotp` |
| `POST` | `/carina/auth/twofactor/totp/verify` | Verify TOTP token | Carina Two-Factor TOTP | body: `CarinaTotpModel.verifyBody` | `200`: `CarinaTotpModel.verifyResponse`<br>`400`: `CarinaTotpModel.badRequestError`<br>`401`: `CarinaTotpModel.unauthorizedError`<br>`404`: `CarinaTotpModel.notFoundError`<br>`422`: `CarinaTotpModel.validationError` | `CarinaTotpServ.verifyTotp` |
| `DELETE` | `/carina/auth/twofactor/totp` | Remove TOTP authenticator | Carina Two-Factor TOTP | body: `CarinaTotpModel.deleteBody` | `200`: `CarinaTotpModel.deleteResponse`<br>`400`: `CarinaTotpModel.badRequestError`<br>`401`: `CarinaTotpModel.unauthorizedError`<br>`404`: `CarinaTotpModel.notFoundError`<br>`422`: `CarinaTotpModel.validationError` | `CarinaTotpServ.deleteTotp` |

### `POST /carina/auth/twofactor/totp/setup` (L7)

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await CarinaTotpServ.setupTotp(user.id)`

### `POST /carina/auth/twofactor/totp/verify` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaTotpModel.verifyBody`
- **2.** `[Sequence]` Calls `CarinaTotpServ.verifyTotp` and stores result as `res`
- **3.** `[If]` `res.token && sessionCookie`
  - **3.1.** `[Sequence]` Calls `getDomainConfig` and stores result as `{ isSecure, cookieDomain }`
  - **3.2.** `[Sequence]` Calls `sessionCookie.set`
- **4.** `[Return]`  — `res`

### `DELETE /carina/auth/twofactor/totp` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaTotpModel.deleteBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaTotpServ.deleteTotp(user.id, body)`

## Exported Types, Methods & Algorithms

### `const carinaTotp` (L7)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/carina/totp/totp.model.ts` — `CarinaTotpModel`
- [apps/carina/totp/totp.serv.ts](./totp.serv.md) ([[apps/carina/totp/totp.serv]]) — `CarinaTotpServ`
- [core/utils/domain.ts](../../../core/utils/domain.md) ([[core/utils/domain]]) — `getDomainConfig`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_33`
