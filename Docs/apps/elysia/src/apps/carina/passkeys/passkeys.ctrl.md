# passkeys.ctrl.ts

- **Source**: [`apps/carina/passkeys/passkeys.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/passkeys/passkeys.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/carina/auth/twofactor/passkeys` | Get all passkeys (10 per page) | Carina Passkeys | query: `CarinaPasskeysModel.listQuery` | `200`: `CarinaPasskeysModel.listResponse`<br>`401`: `CarinaPasskeysModel.unauthorizedError`<br>`422`: `CarinaPasskeysModel.validationError` | `CarinaPasskeysServ.listPasskeys` |
| `POST` | `/carina/auth/twofactor/passkeys` | Create new passkey registration challenge | Carina Passkeys | — | `200`: `CarinaPasskeysModel.createChallengeResponse`<br>`401`: `CarinaPasskeysModel.unauthorizedError`<br>`404`: `CarinaPasskeysModel.notFoundError` | `CarinaPasskeysServ.createRegistrationChallenge` |
| `POST` | `/carina/auth/twofactor/passkeys/login` | Generate passkey authentication/login challenge | Carina Passkeys | body: `CarinaPasskeysModel.loginBody` | `200`: `CarinaPasskeysModel.loginResponse` | `CarinaPasskeysServ.createLoginChallenge` |
| `POST` | `/carina/auth/twofactor/passkeys/login/verify` | Verify passkey authentication assertion for passwordless login | Carina Passkeys | body: `CarinaPasskeysModel.verifyLoginBody` | `200`: `CarinaPasskeysModel.verifyLoginResponse`<br>`400`: `CarinaPasskeysModel.badRequestError`<br>`404`: `CarinaPasskeysModel.notFoundError`<br>`422`: `CarinaPasskeysModel.validationError` | `CarinaPasskeysServ.verifyLogin` |
| `POST` | `/carina/auth/twofactor/passkeys/verify` | Verify passkey registration | Carina Passkeys | body: `CarinaPasskeysModel.verifyBody` | `200`: `CarinaPasskeysModel.verifyResponse`<br>`400`: `CarinaPasskeysModel.badRequestError`<br>`401`: `CarinaPasskeysModel.unauthorizedError`<br>`404`: `CarinaPasskeysModel.notFoundError`<br>`422`: `CarinaPasskeysModel.validationError` | `CarinaPasskeysServ.verifyRegistration` |
| `DELETE` | `/carina/auth/twofactor/passkeys/:passkeyId` | Delete passkey | Carina Passkeys | params: `CarinaPasskeysModel.passkeyParams` | `200`: `CarinaPasskeysModel.deleteResponse`<br>`401`: `CarinaPasskeysModel.unauthorizedError`<br>`404`: `CarinaPasskeysModel.notFoundError`<br>`422`: `CarinaPasskeysModel.validationError` | `CarinaPasskeysServ.deletePasskey` |

### `GET /carina/auth/twofactor/passkeys` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `CarinaPasskeysModel.listQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaPasskeysServ.listPasskeys(user.id, query)`

### `POST /carina/auth/twofactor/passkeys` (L7)

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await CarinaPasskeysServ.createRegistrationChallenge(user.id, request)`

### `POST /carina/auth/twofactor/passkeys/login` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaPasskeysModel.loginBody`
- **2.** `[Return]`  — `await CarinaPasskeysServ.createLoginChallenge(body ?? undefined, request)`

### `POST /carina/auth/twofactor/passkeys/login/verify` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaPasskeysModel.verifyLoginBody`
- **2.** `[Sequence]` Calls `CarinaPasskeysServ.verifyLogin` and stores result as `res`
- **3.** `[If]` `res.token && sessionCookie`
  - **3.1.** `[Sequence]` Calls `getDomainConfig` and stores result as `{ isSecure, cookieDomain }`
  - **3.2.** `[Sequence]` Calls `sessionCookie.set`
- **4.** `[Return]`  — `res`

### `POST /carina/auth/twofactor/passkeys/verify` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaPasskeysModel.verifyBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaPasskeysServ.verifyRegistration(user.id, body, request)`

### `DELETE /carina/auth/twofactor/passkeys/:passkeyId` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaPasskeysModel.passkeyParams`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaPasskeysServ.deletePasskey(user.id, passkeyId)`

## Exported Types, Methods & Algorithms

### `const carinaPasskeys` (L7)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/carina/passkeys/passkeys.model.ts` — `CarinaPasskeysModel`
- [apps/carina/passkeys/passkeys.serv.ts](./passkeys.serv.md) ([[apps/carina/passkeys/passkeys.serv]]) — `CarinaPasskeysServ`
- [core/utils/domain.ts](../../../core/utils/domain.md) ([[core/utils/domain]]) — `getDomainConfig`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_29`
