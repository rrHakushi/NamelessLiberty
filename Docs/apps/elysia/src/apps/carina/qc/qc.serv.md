# qc.serv.ts

- **Source**: [`apps/carina/qc/qc.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/qc/qc.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `CarinaQcServ extends BaseService`

## Exported Types, Methods & Algorithms

### `class CarinaQcServ` extends `BaseService` (L17)

#### `generateSession(body)` (L21)
Generate an 8-character human-readable pairing code and 256-bit polling session token.

- **1.** `[Sequence]` Define `CHARS`
  ```typescript
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  ```
- **2.** `[Sequence]` Calls `randomBytes` and stores result as `bytes`
- **3.** `[Sequence]` Define `rawCode`
  ```typescript
  let rawCode = ''
  ```
- **4.** `[Loop]` Loop `i < 8`
  - **4.1.** `[Sequence]` Assign `rawCode`
    ```typescript
    rawCode += CHARS[bytes[i]! % CHARS.length]
    ```
- **5.** `[Sequence]` Define `code`, `sessionToken`, `baseUrl`, `qrPayload`, `sessionData`
  ```typescript
  const code = `${rawCode.slice(0, 4)}-${rawCode.slice(4, 8)}`
  const sessionToken = randomBytes(32).toString('hex')
  const baseUrl = getDomainConfig().url
  const qrPayload = `${baseUrl.replace(/\/$/, '')}/qc?code=${code}`
  const sessionData: QuickConnectSessionData = { status: 'pending', code, deviceName: body?.deviceName ?? 'Device', userId: null, }
  ```
- **6.** `[Sequence]` Cache `set`
- **7.** `[Return]` 
  ```json
  {
    "code": "<code>",
    "sessionToken": "<sessionToken>",
    "qrPayload": "<qrPayload>",
    "expiresIn": 300
  }
  ```

#### `approveSession(userId, body)` (L60)
Approve a device pairing session using an authenticated user session.

- **1.** `[Sequence]` Define `raw`
  ```typescript
  const raw = body.code || ''.trim().toUpperCase()
  ```
- **2.** `[Sequence]` Calls `raw.replaceAll` and stores result as `cleanNoDash`
- **3.** `[Sequence]` Define `formattedCode`
  ```typescript
  const formattedCode = cleanNoDash.length === 8 ? `${cleanNoDash.slice(0, 4)}-${cleanNoDash.slice(4, 8)}` : raw
  ```
- **4.** `[Sequence]` Cache `get` -> `sessionToken`
- **5.** `[If]` `!sessionToken`
  - **5.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Invalid or expired device pairing code.'
- **6.** `[Sequence]` Cache `get` -> `sessionData`
- **7.** `[If]` `!sessionData`
  - **7.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Device pairing session expired.'
- **8.** `[Sequence]` Cache `set`
- **9.** `[Sequence]` Cache `del`
- **10.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Device approved successfully"
  }
  ```

#### `checkStatus(sessionToken)` (L115)
Poll quick connect pairing session status and retrieve JWT once approved.

- **1.** `[Sequence]` Cache `get` -> `sessionData`
- **2.** `[If]` `!sessionData`
  - **2.1.** `[Return]` 
    ```json
    {
      "status": "<'expired' as const>",
      "user": null,
      "token": null
    }
    ```
- **3.** `[If]` `sessionData.status === 'pending' || !sessionData.userId`
  - **3.1.** `[Return]` 
    ```json
    {
      "status": "<'pending' as const>",
      "user": null,
      "token": null
    }
    ```
- **4.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **5.** `[If]` `!user`
  - **5.1.** `[Sequence]` Cache `del`
  - **5.2.** `[Return]` 
    ```json
    {
      "status": "<'expired' as const>",
      "user": null,
      "token": null
    }
    ```
- **6.** `[Sequence]` Cache `set`
- **7.** `[Sequence]` Define `passwordChangedDate`
  ```typescript
  const passwordChangedDate = user.passwordChangedAt ? toDate(user.passwordChangedAt) : null
  ```
- **8.** `[Sequence]` Calls `signUserJwt` and stores result as `token`
- **9.** `[Return]` 
  ```json
  {
    "status": "<'approved' as const>",
    "user": {
      "id": "<user.id>",
      "username": "<user.username.trim()>",
      "email": "<user.email>",
      "passwordChangedAt": "<passwordChangedDate ? Math.floor(passwordChangedDate.getTime() / 1000) : null>"
    },
    "token": "<token>"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/utils/cache.ts](../../../core/utils/cache.md) ([[core/utils/cache]]) — `cache`
- [core/utils/auth-crypto.ts](../../../core/utils/auth-crypto.md) ([[core/utils/auth-crypto]]) — `signUserJwt`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `BadRequest`
- `apps/carina/qc/qc.model.ts` — `CarinaQcModel`
- [core/utils/domain.ts](../../../core/utils/domain.md) ([[core/utils/domain]]) — `getDomainConfig`

### External / Workspace Packages
- `node:crypto` — `randomBytes`
- `@NamelessLiberty/db` — `prisma`, `toDate`

### Called By / Imported By
- [apps/carina/qc/qc.ctrl.ts](./qc.ctrl.md) ([[apps/carina/qc/qc.ctrl]]) — `CarinaQcServ`
