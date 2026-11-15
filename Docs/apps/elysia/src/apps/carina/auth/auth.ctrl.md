# auth.ctrl.ts

- **Source**: [`apps/carina/auth/auth.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/auth/auth.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/carina/auth/login` | User login (JWT / session) | Carina Auth | body: `CarinaAuthModel.loginBody` | `200`: `CarinaAuthModel.loginResponse`<br>`401`: `CarinaAuthModel.unauthorizedError`<br>`422`: `CarinaAuthModel.validationError` | `CarinaAuthServ.login` |
| `POST` | `/carina/auth/logout` | User logout (clears session cookie) | Carina Auth | — | `200`: `CarinaAuthModel.logoutResponse` | — |
| `POST` | `/carina/auth/register` | User registration | Carina Auth | body: `CarinaAuthModel.registerBody` | `200`: `CarinaAuthModel.registerResponse`<br>`400`: `CarinaAuthModel.badRequestError`<br>`409`: `CarinaAuthModel.conflictError`<br>`422`: `CarinaAuthModel.validationError` | `CarinaAuthServ.register` |
| `POST` | `/carina/auth/password/change` | Change user password | Carina Auth | body: `CarinaAuthModel.changePasswordBody` | `200`: `CarinaAuthModel.changePasswordResponse`<br>`400`: `CarinaAuthModel.badRequestError`<br>`401`: `CarinaAuthModel.unauthorizedError`<br>`404`: `CarinaAuthModel.notFoundError`<br>`422`: `CarinaAuthModel.validationError` | `CarinaAuthServ.changePassword` |
| `POST` | `/carina/auth/password/forgot` | Request password reset email | Carina Auth | body: `CarinaAuthModel.forgotPasswordBody` | `200`: `CarinaAuthModel.forgotPasswordResponse`<br>`422`: `CarinaAuthModel.validationError` | `CarinaAuthServ.forgotPassword` |
| `POST` | `/carina/auth/password/reset` | Reset password with token | Carina Auth | body: `CarinaAuthModel.resetPasswordBody` | `200`: `CarinaAuthModel.resetPasswordResponse`<br>`400`: `CarinaAuthModel.badRequestError`<br>`422`: `CarinaAuthModel.validationError` | `CarinaAuthServ.resetPassword` |

### `POST /carina/auth/login` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaAuthModel.loginBody`
- **2.** `[Sequence]` Calls `CarinaAuthServ.login` and stores result as `response`
- **3.** `[If]` `response.token && sessionCookie`
  - **3.1.** `[Sequence]` Calls `getDomainConfig` and stores result as `{ isSecure, cookieDomain }`
  - **3.2.** `[Sequence]` Calls `sessionCookie.set`
- **4.** `[Return]`  — `response`

### `POST /carina/auth/logout` (L7)

- **1.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### `POST /carina/auth/register` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaAuthModel.registerBody`
- **2.** `[Return]`  — `await CarinaAuthServ.register(body)`

### `POST /carina/auth/password/change` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaAuthModel.changePasswordBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaAuthServ.changePassword(user.id, body)`

### `POST /carina/auth/password/forgot` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaAuthModel.forgotPasswordBody`
- **2.** `[Return]`  — `await CarinaAuthServ.forgotPassword(body)`

### `POST /carina/auth/password/reset` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaAuthModel.resetPasswordBody`
- **2.** `[Return]`  — `await CarinaAuthServ.resetPassword(body)`

## Exported Types, Methods & Algorithms

### `const carinaAuth` (L7)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/carina/auth/auth.model.ts` — `CarinaAuthModel`
- [apps/carina/auth/auth.serv.ts](./auth.serv.md) ([[apps/carina/auth/auth.serv]]) — `CarinaAuthServ`
- [core/utils/domain.ts](../../../core/utils/domain.md) ([[core/utils/domain]]) — `getDomainConfig`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_18`
