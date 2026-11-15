# totp.serv.ts

- **Source**: [`apps/carina/totp/totp.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/totp/totp.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `CarinaTotpServ extends BaseMfaService`

## Exported Types, Methods & Algorithms

### `class CarinaTotpServ` extends `BaseMfaService` (L15)

#### `constructor()` (L18)

- _No executable statements_

#### `setupTotp(userId)` (L24)
Generate a new TOTP secret and QR code for authenticator setup.

- **1.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **2.** `[If]` `!user`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User with ID '${userId}' was not found.`
- **3.** `[Sequence]` Calls `generateSecret` and stores result as `secret`
- **4.** `[Sequence]` Define `isDev`, `issuer`, `label`
  ```typescript
  const isDev = Bun.env.BUN_ENV === 'development'
  const issuer = isDev ? 'Carina Dev' : 'Carina'
  const label = user.email ? `${user.username} (${user.email})` : user.username
  ```
- **5.** `[Sequence]` Calls `generateURI` and stores result as `otpauthUrl`
- **6.** `[Sequence]` Calls `QRCode.toDataURL` and stores result as `qrCodeDataUrl`
- **7.** `[Sequence]` Cache `set`
- **8.** `[Return]` 
  ```json
  {
    "secret": "<secret>",
    "otpauthUrl": "<otpauthUrl>",
    "qrCodeDataUrl": "<qrCodeDataUrl>"
  }
  ```

#### `verifyTotp(userId, body)` (L65)
Verify the TOTP code. Handles either an active login challenge (via mfaTicket) or setup verification (authenticated).

- **1.** `[If]` `body.mfaTicket`
  - **1.1.** `[Sequence]` Cache `get` -> `ticketData`
  - **1.2.** `[If]` `!ticketData?.userId`
    - **1.2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Invalid or expired MFA session ticket.'
  - **1.3.** `[Sequence]` Database `first` on `User` and stores it as `user`
  - **1.4.** `[If]` `!user || !user.TOTPSecret || !user.TOTPEnabled`
    - **1.4.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'TOTP is not configured or active on this account.'
  - **1.5.** `[Sequence]` Calls `decryptSecret` and stores result as `decryptedSecret`
  - **1.6.** `[Sequence]` Define `isCodeValid`
    ```typescript
    let isCodeValid = false
    ```
  - **1.7.** `[Try]` Try block
    - **1.7.1.** `[Sequence]` Calls `verifyTotpCode` and stores result as `verifyResult`
    - **1.7.2.** `[Sequence]` Assign `isCodeValid`
      ```typescript
      isCodeValid = verifyResult.valid
      ```
  - **1.8.** `[Catch]` Catch (`err`)
    - **1.8.1.** `[Sequence]` Assign `isCodeValid`
      ```typescript
      isCodeValid = false
      ```
  - **1.9.** `[If]` `!isCodeValid`
    - **1.9.1.** `[Sequence]` Define `attemptKey`
      ```typescript
      const attemptKey = `auth:mfa-ticket:attempts:${body.mfaTicket}`
      ```
    - **1.9.2.** `[Sequence]` Cache `get` -> `attempts`
    - **1.9.3.** `[If]` `attempts >= 4`
      - **1.9.3.1.** `[Sequence]` Cache `del`
      - **1.9.3.2.** `[Sequence]` Cache `del`
      - **1.9.3.3.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Too many failed verification attempts. Please log in again.'
    - **1.9.4.** `[Sequence]` Cache `set`
    - **1.9.5.** `[Error]` Throws `Unauthorized` (HTTP 401) — `Invalid verification code. ${4 - attempts} attempt(s) remaining.`
  - **1.10.** `[Sequence]` Calls `CarinaTotpServ.instance.clearMfaTicket`
  - **1.11.** `[Sequence]` Calls `toDate` and stores result as `pwdChangedAt`
  - **1.12.** `[Sequence]` Calls `CarinaTotpServ.instance.issueMfaSessionToken` and stores result as `token`
  - **1.13.** `[Return]` 
    ```json
    {
      "success": true,
      "message": "Successfully verified and logged in",
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
- **5.** `[Sequence]` Cache `get` -> `secretToVerify`
- **6.** `[If]` `!secretToVerify`
  - **6.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'TOTP setup session expired or was not initiated. Please generate a new QR code.'
- **7.** `[Sequence]` Define `isCodeValid`
  ```typescript
  let isCodeValid = false
  ```
- **8.** `[Try]` Try block
  - **8.1.** `[Sequence]` Calls `verifyTotpCode` and stores result as `verifyResult`
  - **8.2.** `[Sequence]` Assign `isCodeValid`
    ```typescript
    isCodeValid = verifyResult.valid
    ```
- **9.** `[Catch]` Catch (`err`)
  - **9.1.** `[Sequence]` Assign `isCodeValid`
    ```typescript
    isCodeValid = false
    ```
- **10.** `[If]` `!isCodeValid`
  - **10.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Invalid verification code. Check that the time on your authenticator device is synchronized.'
- **11.** `[Sequence]` Calls `encryptSecret` and stores result as `encryptedSecret`
- **12.** `[Sequence]` Define `plainBackupCodes`, `hashedBackupCodes`
  ```typescript
  let plainBackupCodes: string[] | undefined = undefined
  let hashedBackupCodes: string[] | undefined = undefined
  ```
- **13.** `[If]` `user.backupCodes.length === 0`
  - **13.1.** `[Sequence]` Calls `generateBackupCodes` and stores result as `generated`
  - **13.2.** `[Sequence]` Assign `plainBackupCodes`
    ```typescript
    plainBackupCodes = generated.plain
    ```
  - **13.3.** `[Sequence]` Assign `hashedBackupCodes`
    ```typescript
    hashedBackupCodes = generated.hashed
    ```
- **14.** `[Sequence]` Database `update` on `User`
- **15.** `[Sequence]` Cache `del`
- **16.** `[Sequence]` Cache `del`
- **17.** `[Sequence]` Cache `del`
- **18.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "TOTP has been enabled",
    "backupCodes": "<plainBackupCodes>"
  }
  ```

#### `deleteTotp(userId, body)` (L203)
Remove TOTP authenticator from user account.

- **1.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **2.** `[If]` `!user`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User with ID '${userId}' was not found.`
- **3.** `[If]` `!user.TOTPEnabled || !user.TOTPSecret`
  - **3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'TOTP is not currently enabled on this account.'
- **4.** `[Sequence]` Define `isAuthorized`
  ```typescript
  let isAuthorized = false
  ```
- **5.** `[If]` `body?.code`
  - **5.1.** `[Sequence]` Calls `decryptSecret` and stores result as `decryptedSecret`
  - **5.2.** `[Sequence]` Define `isCodeValid`
    ```typescript
    let isCodeValid = false
    ```
  - **5.3.** `[Try]` Try block
    - **5.3.1.** `[Sequence]` Calls `verifyTotpCode` and stores result as `verifyResult`
    - **5.3.2.** `[Sequence]` Assign `isCodeValid`
      ```typescript
      isCodeValid = verifyResult.valid
      ```
  - **5.4.** `[Catch]` Catch (`err`)
    - **5.4.1.** `[Sequence]` Assign `isCodeValid`
      ```typescript
      isCodeValid = false
      ```
  - **5.5.** `[If]` `isCodeValid`
    - **5.5.1.** `[Sequence]` Assign `isAuthorized`
      ```typescript
      isAuthorized = true
      ```
  - **5.6.** `[Else]` Otherwise
    - **5.6.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Invalid authenticator verification code.'
- **6.** `[Else]` Otherwise
  - **6.1.** `[If]` `body?.password`
    - **6.1.1.** `[If]` `user.passwordHash`
      - **6.1.1.1.** `[Sequence]` Calls `verifyPassword` and stores result as `isPasswordValid`
      - **6.1.1.2.** `[If]` `isPasswordValid`
        - **6.1.1.2.1.** `[Sequence]` Assign `isAuthorized`
          ```typescript
          isAuthorized = true
          ```
      - **6.1.1.3.** `[Else]` Otherwise
        - **6.1.1.3.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Incorrect password confirmation.'
    - **6.1.2.** `[Else]` Otherwise
      - **6.1.2.1.** `[Sequence]` Assign `isAuthorized`
        ```typescript
        isAuthorized = true
        ```
  - **6.2.** `[Else]` Otherwise
    - **6.2.1.** `[If]` `!user.passwordHash`
      - **6.2.1.1.** `[Sequence]` Assign `isAuthorized`
        ```typescript
        isAuthorized = true
        ```
- **7.** `[If]` `!isAuthorized`
  - **7.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Please enter a 6-digit authenticator code or your account password to disable TOTP.'
- **8.** `[Sequence]` Define `remainingMfa`
  ```typescript
  const remainingMfa = user.emailMfaEnabled || user.passkeys.length > 0
  ```
- **9.** `[Sequence]` Database `update` on `User`
- **10.** `[Sequence]` Cache `del`
- **11.** `[Sequence]` Cache `del`
- **12.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "TOTP has been disabled"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/carina/_shared/base-mfa.serv.ts](../_shared/base-mfa.serv.md) ([[apps/carina/_shared/base-mfa.serv]]) — `BaseMfaService`
- [core/utils/cache.ts](../../../core/utils/cache.md) ([[core/utils/cache]]) — `cache`
- [core/utils/auth-crypto.ts](../../../core/utils/auth-crypto.md) ([[core/utils/auth-crypto]]) — `encryptSecret`, `decryptSecret`, `verifyPassword`, `generateBackupCodes`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `BadRequest`, `NotFound`, `Unauthorized`
- `apps/carina/totp/totp.model.ts` — `CarinaTotpModel`

### External / Workspace Packages
- `otplib` — `generateSecret`, `generateURI`, `verifyTotpCode`
- `qrcode` — `QRCode`
- `@NamelessLiberty/db` — `prisma`, `toDate`

### Called By / Imported By
- [apps/carina/totp/totp.ctrl.ts](./totp.ctrl.md) ([[apps/carina/totp/totp.ctrl]]) — `CarinaTotpServ`
