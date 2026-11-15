# backupcodes.serv.ts

- **Source**: [`apps/carina/backupcodes/backupcodes.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/backupcodes/backupcodes.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `CarinaBackupCodesServ extends BaseMfaService`

## Exported Types, Methods & Algorithms

### `class CarinaBackupCodesServ` extends `BaseMfaService` (L8)

#### `constructor()` (L11)

- _No executable statements_

#### `generateCodes(userId)` (L17)
Generate initial backup codes for an MFA-protected user account.

- **1.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **2.** `[If]` `!user`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User with ID '${userId}' was not found.`
- **3.** `[Sequence]` Define `hasMfaActive`
  ```typescript
  const hasMfaActive = user.TOTPEnabled || user.emailMfaEnabled || user.passkeys.length > 0
  ```
- **4.** `[If]` `!hasMfaActive`
  - **4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Multi-factor authentication must be enabled to generate backup codes.'
- **5.** `[If]` `user.backupCodes.length > 0`
  - **5.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Backup codes have already been generated for this account. Use regenerate to create new ones.'
- **6.** `[Sequence]` Calls `generateBackupCodes` and stores result as `{ plain, hashed }`
- **7.** `[Sequence]` Database `update` on `User`
- **8.** `[Sequence]` Cache `del`
- **9.** `[Sequence]` Cache `del`
- **10.** `[Return]` 
  ```json
  {
    "success": true,
    "backupCodes": "<plain>"
  }
  ```

#### `regenerateCodes(userId)` (L59)
Regenerate 10 new backup recovery codes, replacing all previous ones.

- **1.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **2.** `[If]` `!user`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User with ID '${userId}' was not found.`
- **3.** `[Sequence]` Define `hasMfaActive`
  ```typescript
  const hasMfaActive = user.TOTPEnabled || user.emailMfaEnabled || user.passkeys.length > 0
  ```
- **4.** `[If]` `!hasMfaActive`
  - **4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Multi-factor authentication must be enabled to generate backup codes.'
- **5.** `[Sequence]` Calls `generateBackupCodes` and stores result as `{ plain, hashed }`
- **6.** `[Sequence]` Database `update` on `User`
- **7.** `[Sequence]` Cache `del`
- **8.** `[Sequence]` Cache `del`
- **9.** `[Return]` 
  ```json
  {
    "success": true,
    "backupCodes": "<plain>"
  }
  ```

#### `verifyCode(userId, body)` (L96)
Verify and consume a single-use backup recovery code. Supports both active login challenges (via mfaTicket) and authenticated verification.

- **1.** `[If]` `body.mfaTicket`
  - **1.1.** `[Sequence]` Cache `get` -> `ticketData`
  - **1.2.** `[If]` `!ticketData?.userId`
    - **1.2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Invalid or expired MFA session ticket.'
  - **1.3.** `[Sequence]` Database `first` on `User` and stores it as `user`
  - **1.4.** `[If]` `!user`
    - **1.4.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User account not found.'
  - **1.5.** `[If]` `user.backupCodes.length === 0`
    - **1.5.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'No backup codes exist for this account.'
  - **1.6.** `[Sequence]` Calls `verifyBackupCode` and stores result as `matchedIndex`
  - **1.7.** `[If]` `matchedIndex === -1`
    - **1.7.1.** `[Sequence]` Define `attemptKey`
      ```typescript
      const attemptKey = `auth:mfa-ticket:attempts:${body.mfaTicket}`
      ```
    - **1.7.2.** `[Sequence]` Cache `get` -> `attempts`
    - **1.7.3.** `[If]` `attempts >= 4`
      - **1.7.3.1.** `[Sequence]` Cache `del`
      - **1.7.3.2.** `[Sequence]` Cache `del`
      - **1.7.3.3.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Too many failed verification attempts. Please log in again.'
    - **1.7.4.** `[Sequence]` Cache `set`
    - **1.7.5.** `[Error]` Throws `Unauthorized` (HTTP 401) — `Invalid or previously used backup recovery code. ${4 - attempts} attempt(s) remaining.`
  - **1.8.** `[Sequence]` Define `updatedCodes`
    ```typescript
    const updatedCodes = user.backupCodes.filter((_, idx) => idx !== matchedIndex)
    ```
  - **1.9.** `[Sequence]` Database `update` on `User`
  - **1.10.** `[Sequence]` Calls `CarinaBackupCodesServ.instance.clearMfaTicket`
  - **1.11.** `[Sequence]` Calls `CarinaBackupCodesServ.instance.invalidateUserMfaCache`
  - **1.12.** `[Sequence]` Calls `toDate` and stores result as `pwdChangedAt`
  - **1.13.** `[Sequence]` Calls `CarinaBackupCodesServ.instance.issueMfaSessionToken` and stores result as `token`
  - **1.14.** `[Return]` 
    ```json
    {
      "success": true,
      "message": "Backup code verified successfully",
      "remainingCount": "<updatedCodes.length>",
      "token": "<token>",
      "user": {
        "id": "<user.id>",
        "username": "<user.username.trim()>",
        "email": "<user.email>",
        "passwordChangedAt": "<pwdChangedAt ? Math.floor(pwdChangedAt.getTime() / 1000) : null>"
      }
    }
    ```
- **2.** `[If]` `!userId`
  - **2.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Authentication required or valid mfaTicket required.'
- **3.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **4.** `[If]` `!user`
  - **4.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User with ID '${userId}' was not found.`
- **5.** `[If]` `user.backupCodes.length === 0`
  - **5.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'No backup codes exist for this account.'
- **6.** `[Sequence]` Calls `verifyBackupCode` and stores result as `matchedIndex`
- **7.** `[If]` `matchedIndex === -1`
  - **7.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Invalid or previously used backup recovery code.'
- **8.** `[Sequence]` Define `updatedCodes`
  ```typescript
  const updatedCodes = user.backupCodes.filter((_, idx) => idx !== matchedIndex)
  ```
- **9.** `[Sequence]` Database `update` on `User`
- **10.** `[Sequence]` Cache `del`
- **11.** `[Sequence]` Cache `del`
- **12.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Backup code verified successfully",
    "remainingCount": "<updatedCodes.length>"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/carina/_shared/base-mfa.serv.ts](../_shared/base-mfa.serv.md) ([[apps/carina/_shared/base-mfa.serv]]) — `BaseMfaService`
- [core/utils/cache.ts](../../../core/utils/cache.md) ([[core/utils/cache]]) — `cache`
- [core/utils/auth-crypto.ts](../../../core/utils/auth-crypto.md) ([[core/utils/auth-crypto]]) — `generateBackupCodes`, `verifyBackupCode`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `BadRequest`, `NotFound`, `Unauthorized`
- `apps/carina/backupcodes/backupcodes.model.ts` — `CarinaBackupCodesModel`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `toDate`

### Called By / Imported By
- [apps/carina/backupcodes/backupcodes.ctrl.ts](./backupcodes.ctrl.md) ([[apps/carina/backupcodes/backupcodes.ctrl]]) — `CarinaBackupCodesServ`
