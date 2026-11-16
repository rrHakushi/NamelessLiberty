# qc.ctrl.ts

- **Source**: [`apps/carina/qc/qc.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/qc/qc.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/carina/auth/qc/generate` | Generate quick connect session/code | Carina Quick Connect | body: `CarinaQcModel.generateBody` | `200`: `CarinaQcModel.generateResponse`<br>`422`: `CarinaQcModel.validationError` | `CarinaQcServ.generateSession` |
| `POST` | `/carina/auth/qc/approve` | Approve quick connect login | Carina Quick Connect | body: `CarinaQcModel.approveBody` | `200`: `CarinaQcModel.approveResponse`<br>`400`: `CarinaQcModel.badRequestError`<br>`401`: `CarinaQcModel.unauthorizedError`<br>`422`: `CarinaQcModel.validationError` | `CarinaQcServ.approveSession` |
| `GET` | `/carina/auth/qc/status` | Get quick connect session status | Carina Quick Connect | query: `CarinaQcModel.statusQuery` | `200`: `CarinaQcModel.statusResponse`<br>`422`: `CarinaQcModel.validationError` | `CarinaQcServ.checkStatus` |

### `POST /carina/auth/qc/generate` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaQcModel.generateBody`
- **2.** `[Return]`  — `await CarinaQcServ.generateSession(body)`

### `POST /carina/auth/qc/approve` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaQcModel.approveBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaQcServ.approveSession(user.id, body)`

### `GET /carina/auth/qc/status` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `CarinaQcModel.statusQuery`
- **2.** `[Sequence]` Calls `CarinaQcServ.checkStatus` and stores result as `res`
- **3.** `[If]` `res.status === 'approved' && res.token && sessionCookie`
  - **3.1.** `[Sequence]` Calls `getDomainConfig` and stores result as `{ isSecure, cookieDomain }`
  - **3.2.** `[Sequence]` Calls `sessionCookie.set`
- **4.** `[Return]`  — `res`

## Exported Types, Methods & Algorithms

### `const carinaQc` (L7)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/carina/qc/qc.model.ts` — `CarinaQcModel`
- [apps/carina/qc/qc.serv.ts](./qc.serv.md) ([[apps/carina/qc/qc.serv]]) — `CarinaQcServ`
- [core/utils/domain.ts](../../../core/utils/domain.md) ([[core/utils/domain]]) — `getDomainConfig`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_31`
