# base-mfa.serv.ts

- **Source**: [`apps/carina/_shared/base-mfa.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/_shared/base-mfa.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `BaseMfaService extends BaseService`
- **Extended By**: [`CarinaBackupCodesServ`](../backupcodes/backupcodes.serv.md) ([[apps/carina/backupcodes/backupcodes.serv]]), [`CarinaEmail2faServ`](../email-2fa/email-2fa.serv.md) ([[apps/carina/email-2fa/email-2fa.serv]]), [`CarinaPasskeysServ`](../passkeys/passkeys.serv.md) ([[apps/carina/passkeys/passkeys.serv]]), [`CarinaTotpServ`](../totp/totp.serv.md) ([[apps/carina/totp/totp.serv]])

## Exported Types, Methods & Algorithms

### `interface MfaTicketPayload` (L5)

### `class BaseMfaService` extends `BaseService` (L14)

Abstract base service for Carina Multi-Factor Authentication flows (TOTP, Email 2FA, Backup Codes, Passkeys). Centralizes MFA ticket validation, brute-force attempt throttling, ticket cleanup, user cache invalidation, and JWT session issuance.

#### `constructor(loggerName)` (L15)
Abstract base service for Carina Multi-Factor Authentication flows (TOTP, Email 2FA, Backup Codes, Passkeys). Centralizes MFA ticket validation, brute-force attempt throttling, ticket cleanup, user cache invalidation, and JWT session issuance.

- _No executable statements_

#### `resolveMfaTicket(mfaTicket)`: `Promise<MfaTicketPayload>` (L22)
Resolves an active MFA ticket payload from cache, or throws HTTP 401 when missing/expired.

- **1.** `[Sequence]` Cache `get` -> `ticketData`
- **2.** `[If]` `!ticketData?.userId`
  - **2.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'MFA challenge ticket is invalid or has expired. Please sign in again.'
- **3.** `[Return]`  — `ticketData`

#### `recordFailedMfaAttempt(mfaTicket, maxAttempts = 5)`: `Promise<void>` (L34)
Increments failed MFA verification attempts for a ticket and invalidates it after `maxAttempts`.

- **1.** `[Sequence]` Define `attemptKey`
  ```typescript
  const attemptKey = `auth:mfa-ticket:attempts:${mfaTicket}`
  ```
- **2.** `[Sequence]` Cache `get` -> `attempts`
- **3.** `[If]` `attempts + 1 >= maxAttempts`
  - **3.1.** `[Sequence]` Cache `del`
  - **3.2.** `[Sequence]` Cache `del`
  - **3.3.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Too many failed MFA verification attempts. Please sign in again.'
- **4.** `[Sequence]` Cache `set`

#### `clearMfaTicket(mfaTicket)`: `Promise<void>` (L53)
Deletes an MFA ticket and its attempt counter after successful verification.

- **1.** `[Sequence]` Cache `del`
- **2.** `[Sequence]` Cache `del`

#### `invalidateUserMfaCache(userId)`: `Promise<void>` (L62)
Invalidates cached user profile keys when MFA security state changes.

- **1.** `[Sequence]` Cache `del`
- **2.** `[Sequence]` Cache `del`

#### `issueMfaSessionToken(user)`: `Promise<string>` (L71)
Signs an authenticated user JWT with normalized username, permissions, and passwordChangedAt.

- **1.** `[Return]`  — `await signUserJwt({ id: user.id, username: user.username.trim(), email: user.email, permissions: [...user.permissions], passwordChangedAt: user.passwordChangedAt, })`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `BadRequest`, `Unauthorized`
- [core/utils/auth-crypto.ts](../../../core/utils/auth-crypto.md) ([[core/utils/auth-crypto]]) — `signUserJwt`

### External / Workspace Packages
- _None_

### Called By / Imported By
- [apps/carina/backupcodes/backupcodes.serv.ts](../backupcodes/backupcodes.serv.md) ([[apps/carina/backupcodes/backupcodes.serv]]) — `BaseMfaService`
- [apps/carina/email-2fa/email-2fa.serv.ts](../email-2fa/email-2fa.serv.md) ([[apps/carina/email-2fa/email-2fa.serv]]) — `BaseMfaService`
- [apps/carina/passkeys/passkeys.serv.ts](../passkeys/passkeys.serv.md) ([[apps/carina/passkeys/passkeys.serv]]) — `BaseMfaService`
- [apps/carina/totp/totp.serv.ts](../totp/totp.serv.md) ([[apps/carina/totp/totp.serv]]) — `BaseMfaService`
