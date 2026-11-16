# email-2fa.ctrl.ts

- **Source**: [`apps/carina/email-2fa/email-2fa.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/email-2fa/email-2fa.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/carina/auth/twofactor/email/setup` | Setup 2FA email | Carina Two-Factor Email | — | `200`: `CarinaEmail2faModel.setupResponse`<br>`400`: `CarinaEmail2faModel.badRequestError`<br>`401`: `CarinaEmail2faModel.unauthorizedError`<br>`404`: `CarinaEmail2faModel.notFoundError`<br>`429`: `CarinaEmail2faModel.tooManyRequestsError` | `CarinaEmail2faServ.setupEmail2fa` |
| `POST` | `/carina/auth/twofactor/email/send` | Send 2FA verification email | Carina Two-Factor Email | body: `CarinaEmail2faModel.sendBody` | `200`: `CarinaEmail2faModel.sendResponse`<br>`400`: `CarinaEmail2faModel.badRequestError`<br>`401`: `CarinaEmail2faModel.unauthorizedError`<br>`404`: `CarinaEmail2faModel.notFoundError`<br>`422`: `CarinaEmail2faModel.validationError`<br>`429`: `CarinaEmail2faModel.tooManyRequestsError` | `CarinaEmail2faServ.sendEmail2fa` |
| `POST` | `/carina/auth/twofactor/email/verify` | Verify 2FA email code | Carina Two-Factor Email | body: `CarinaEmail2faModel.verifyBody` | `200`: `CarinaEmail2faModel.verifyResponse`<br>`400`: `CarinaEmail2faModel.badRequestError`<br>`401`: `CarinaEmail2faModel.unauthorizedError`<br>`404`: `CarinaEmail2faModel.notFoundError`<br>`422`: `CarinaEmail2faModel.validationError` | `CarinaEmail2faServ.verifyEmail2fa` |
| `DELETE` | `/carina/auth/twofactor/email` | Remove 2FA email | Carina Two-Factor Email | body: `CarinaEmail2faModel.deleteBody` | `200`: `CarinaEmail2faModel.deleteResponse`<br>`400`: `CarinaEmail2faModel.badRequestError`<br>`401`: `CarinaEmail2faModel.unauthorizedError`<br>`404`: `CarinaEmail2faModel.notFoundError`<br>`422`: `CarinaEmail2faModel.validationError` | `CarinaEmail2faServ.deleteEmail2fa` |

### `POST /carina/auth/twofactor/email/setup` (L7)
Initiates two-factor email verification by sending a 6-digit confirmation code to the user registered email address.

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await CarinaEmail2faServ.setupEmail2fa(user.id)`

### `POST /carina/auth/twofactor/email/send` (L7)
Dispatches a 2FA verification email for either an active login challenge (via mfaTicket) or an authenticated setup resend.

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaEmail2faModel.sendBody`
- **2.** `[Sequence]` Calls `userSession.getUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaEmail2faServ.sendEmail2fa(user?.id, body)`

### `POST /carina/auth/twofactor/email/verify` (L7)
Verifies a 6-digit email verification code to either complete Email 2FA setup or authenticate a login session.

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaEmail2faModel.verifyBody`
- **2.** `[Sequence]` Calls `userSession.getUser` and stores result as `user`
- **3.** `[Sequence]` Calls `CarinaEmail2faServ.verifyEmail2fa` and stores result as `res`
- **4.** `[If]` `res.token && sessionCookie`
  - **4.1.** `[Sequence]` Calls `getDomainConfig` and stores result as `{ isSecure, cookieDomain }`
  - **4.2.** `[Sequence]` Calls `sessionCookie.set`
- **5.** `[Return]`  — `res`

### `DELETE /carina/auth/twofactor/email` (L7)
Disables Email two-factor authentication on the authenticated account.

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaEmail2faModel.deleteBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaEmail2faServ.deleteEmail2fa(user.id, body)`

## Exported Types, Methods & Algorithms

### `const carinaEmail2fa` (L7)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/carina/email-2fa/email-2fa.model.ts` — `CarinaEmail2faModel`
- [apps/carina/email-2fa/email-2fa.serv.ts](./email-2fa.serv.md) ([[apps/carina/email-2fa/email-2fa.serv]]) — `CarinaEmail2faServ`
- [core/utils/domain.ts](../../../core/utils/domain.md) ([[core/utils/domain]]) — `getDomainConfig`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_23`
