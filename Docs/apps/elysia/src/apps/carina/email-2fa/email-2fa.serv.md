# email-2fa.serv.ts

- **Source**: [`apps/carina/email-2fa/email-2fa.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/email-2fa/email-2fa.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `CarinaEmail2faServ extends BaseMfaService`

## Exported Types, Methods & Algorithms

### `function maskEmail` (L24)

Mask an email address for privacy in API responses (e.g. `al***e@example.com`).

- **1.** `[Sequence]` Define `[localPart, domain]`
  ```typescript
  const [localPart, domain] = email.split('@')
  ```
- **2.** `[If]` `!domain || !localPart`
  - **2.1.** `[Return]`  — `'***@***'`
- **3.** `[If]` `localPart.length <= 2`
  - **3.1.** `[Return]`  — ``${localPart[0]}***@${domain}``
- **4.** `[Sequence]` Define `firstChar`, `lastChar`
  ```typescript
  const firstChar = localPart[0]
  const lastChar = localPart[localPart.length - 1]
  ```
- **5.** `[Return]`  — ``${firstChar}***${lastChar}@${domain}``

### `class CarinaEmail2faServ` extends `BaseMfaService` (L37)

#### `constructor()` (L40)

- _No executable statements_

#### `setupEmail2fa(userId)` (L47)
Initiate Email 2FA setup for the authenticated user by generating and emailing a 6-digit confirmation code.

- **1.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **2.** `[If]` `!user`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User with ID '${userId}' was not found.`
- **3.** `[If]` `!user.email`
  - **3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'An email address must be associated with your account before enabling Email 2FA.'
- **4.** `[If]` `user.emailMfaEnabled`
  - **4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Email two-factor authentication is already enabled on this account.'
- **5.** `[Sequence]` Cache `get` -> `cooldownActive`
- **6.** `[If]` `cooldownActive`
  - **6.1.** `[Error]` Throws `TooManyRequests` (HTTP 429) — 'Please wait a moment before requesting another verification code.'
- **7.** `[Sequence]` Define `code`
  ```typescript
  const code = randomInt(100000, 1000000).toString()
  ```
- **8.** `[Sequence]` Cache `set`
- **9.** `[Sequence]` Cache `set`
- **10.** `[Sequence]` Calls `EmailService.sendMfaVerificationEmail`
- **11.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Verification code sent to registered email",
    "email": "<maskEmail(user.email)>"
  }
  ```

#### `sendEmail2fa(userId, body)` (L103)
Send or resend an email verification code. Supports either: 1. Login challenge: unauthenticated, provides `mfaTicket` in body. 2. Logged-in setup resend: authenticated session.

- **1.** `[If]` `body?.mfaTicket`
  - **1.1.** `[Sequence]` Cache `get` -> `ticketData`
  - **1.2.** `[If]` `!ticketData || !ticketData.userId`
    - **1.2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Invalid or expired MFA session ticket.'
  - **1.3.** `[Sequence]` Database `first` on `User` and stores it as `user`
  - **1.4.** `[If]` `!user || !user.email`
    - **1.4.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User account or email address not found.'
  - **1.5.** `[If]` `!user.emailMfaEnabled`
    - **1.5.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Email MFA is not enabled on this account.'
  - **1.6.** `[Sequence]` Cache `get` -> `cooldown`
  - **1.7.** `[If]` `cooldown`
    - **1.7.1.** `[Error]` Throws `TooManyRequests` (HTTP 429) — 'Please wait a moment before requesting another verification code.'
  - **1.8.** `[Sequence]` Define `code`
    ```typescript
    const code = randomInt(100000, 1000000).toString()
    ```
  - **1.9.** `[Sequence]` Cache `set`
  - **1.10.** `[Sequence]` Cache `set`
  - **1.11.** `[Sequence]` Calls `EmailService.sendMfaVerificationEmail`
  - **1.12.** `[Return]` 
    ```json
    {
      "success": true,
      "message": "Verification code sent to registered email",
      "email": "<maskEmail(user.email)>"
    }
    ```
- **2.** `[If]` `userId`
  - **2.1.** `[Sequence]` Database `first` on `User` and stores it as `user`
  - **2.2.** `[If]` `!user`
    - **2.2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User with ID '${userId}' was not found.`
  - **2.3.** `[If]` `!user.email`
    - **2.3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'No email address registered for this account.'
  - **2.4.** `[If]` `user.emailMfaEnabled`
    - **2.4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Email two-factor authentication is already enabled on this account.'
  - **2.5.** `[Sequence]` Cache `get` -> `cooldown`
  - **2.6.** `[If]` `cooldown`
    - **2.6.1.** `[Error]` Throws `TooManyRequests` (HTTP 429) — 'Please wait a moment before requesting another verification code.'
  - **2.7.** `[Sequence]` Define `code`
    ```typescript
    const code = randomInt(100000, 1000000).toString()
    ```
  - **2.8.** `[Sequence]` Cache `set`
  - **2.9.** `[Sequence]` Cache `set`
  - **2.10.** `[Sequence]` Calls `EmailService.sendMfaVerificationEmail`
  - **2.11.** `[Return]` 
    ```json
    {
      "success": true,
      "message": "Verification code sent to registered email",
      "email": "<maskEmail(user.email)>"
    }
    ```
- **3.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Authentication required or valid mfaTicket required.'

#### `verifyEmail2fa(userId, body)` (L203)
Verify 2FA email code. Supports either: 1. Login challenge: unauthenticated, provides `mfaTicket` and `code`. 2. Setup verification: authenticated session, provides `code`.

- **1.** `[If]` `!body || !body.code`
  - **1.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Verification code is required.'
- **2.** `[Sequence]` Define `cleanCode`
  ```typescript
  const cleanCode = body.code.trim()
  ```
- **3.** `[If]` `body.mfaTicket`
  - **3.1.** `[Sequence]` Cache `get` -> `ticketData`
  - **3.2.** `[If]` `!ticketData || !ticketData.userId`
    - **3.2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Invalid or expired MFA session ticket.'
  - **3.3.** `[Sequence]` Database `first` on `User` and stores it as `user`
  - **3.4.** `[If]` `!user`
    - **3.4.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User account not found.'
  - **3.5.** `[Sequence]` Define `hasMfaActive`
    ```typescript
    const hasMfaActive = user.emailMfaEnabled || user.TOTPEnabled || user.backupCodes.length > 0
    ```
  - **3.6.** `[If]` `!hasMfaActive`
    - **3.6.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Multi-factor authentication is not active on this account.'
  - **3.7.** `[Sequence]` Define `isVerified`
    ```typescript
    let isVerified = false
    ```
  - **3.8.** `[If]` `user.TOTPEnabled && user.TOTPSecret`
    - **3.8.1.** `[Try]` Try block
      - **3.8.1.1.** `[Sequence]` Calls `decryptSecret` and stores result as `secret`
      - **3.8.1.2.** `[Sequence]` Calls `verifyTotpCode` and stores result as `totpResult`
      - **3.8.1.3.** `[If]` `totpResult?.valid`
        - **3.8.1.3.1.** `[Sequence]` Assign `isVerified`
          ```typescript
          isVerified = true
          ```
    - **3.8.2.** `[Catch]` Catch (`err`)
  - **3.9.** `[If]` `!isVerified && user.emailMfaEnabled`
    - **3.9.1.** `[Sequence]` Cache `get` -> `cachedCode`
    - **3.9.2.** `[If]` `cachedCode && cachedCode === cleanCode`
      - **3.9.2.1.** `[Sequence]` Assign `isVerified`
        ```typescript
        isVerified = true
        ```
      - **3.9.2.2.** `[Sequence]` Cache `del`
  - **3.10.** `[If]` `!isVerified && user.backupCodes && user.backupCodes.length > 0`
    - **3.10.1.** `[Sequence]` Calls `verifyBackupCode` and stores result as `matchedIndex`
    - **3.10.2.** `[If]` `matchedIndex !== -1`
      - **3.10.2.1.** `[Sequence]` Assign `isVerified`
        ```typescript
        isVerified = true
        ```
      - **3.10.2.2.** `[Sequence]` Define `updatedCodes`
        ```typescript
        const updatedCodes = [...user.backupCodes]
        ```
      - **3.10.2.3.** `[Sequence]` Calls `updatedCodes.splice`
      - **3.10.2.4.** `[Sequence]` Database `update` on `User`
  - **3.11.** `[If]` `!isVerified`
    - **3.11.1.** `[Sequence]` Define `attemptKey`
      ```typescript
      const attemptKey = `auth:mfa-ticket:attempts:${body.mfaTicket}`
      ```
    - **3.11.2.** `[Sequence]` Cache `get` -> `attempts`
    - **3.11.3.** `[If]` `attempts >= 4`
      - **3.11.3.1.** `[Sequence]` Cache `del`
      - **3.11.3.2.** `[Sequence]` Cache `del`
      - **3.11.3.3.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Too many failed verification attempts. Please log in again.'
    - **3.11.4.** `[Sequence]` Cache `set`
    - **3.11.5.** `[Error]` Throws `Unauthorized` (HTTP 401) — `Invalid verification code. ${4 - attempts} attempt(s) remaining.`
  - **3.12.** `[Sequence]` Calls `CarinaEmail2faServ.instance.clearMfaTicket`
  - **3.13.** `[Sequence]` Calls `toDate` and stores result as `pwdChangedAt`
  - **3.14.** `[Sequence]` Calls `CarinaEmail2faServ.instance.issueMfaSessionToken` and stores result as `token`
  - **3.15.** `[Return]` 
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
- **4.** `[If]` `userId`
  - **4.1.** `[Sequence]` Database `first` on `User` and stores it as `user`
  - **4.2.** `[If]` `!user`
    - **4.2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User with ID '${userId}' was not found.`
  - **4.3.** `[Sequence]` Cache `get` -> `cachedSetup`
  - **4.4.** `[If]` `!cachedSetup`
    - **4.4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Email 2FA setup session expired or was not initiated. Please request a new verification code.'
  - **4.5.** `[If]` `cachedSetup.code !== cleanCode`
    - **4.5.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Invalid verification code.'
  - **4.6.** `[Sequence]` Define `plainBackupCodes`, `hashedBackupCodes`, `otherMfaActive`
    ```typescript
    let plainBackupCodes: string[] | undefined = undefined
    let hashedBackupCodes: string[] | undefined = undefined
    const otherMfaActive = user.TOTPEnabled || user.passkeys.length > 0
    ```
  - **4.7.** `[If]` `!otherMfaActive && user.backupCodes.length === 0`
    - **4.7.1.** `[Sequence]` Calls `generateBackupCodes` and stores result as `generated`
    - **4.7.2.** `[Sequence]` Assign `plainBackupCodes`
      ```typescript
      plainBackupCodes = generated.plain
      ```
    - **4.7.3.** `[Sequence]` Assign `hashedBackupCodes`
      ```typescript
      hashedBackupCodes = generated.hashed
      ```
  - **4.8.** `[Sequence]` Database `update` on `User`
  - **4.9.** `[Sequence]` Cache `del`
  - **4.10.** `[Sequence]` Cache `del`
  - **4.11.** `[Sequence]` Cache `del`
  - **4.12.** `[Return]` 
    ```json
    {
      "success": true,
      "message": "Email two-factor authentication has been enabled",
      "backupCodes": "<plainBackupCodes>"
    }
    ```
- **5.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Authentication required or valid mfaTicket required.'

#### `deleteEmail2fa(userId, body)` (L370)
Remove Email 2FA from account. Requires an authenticated session. Optionally accepts a confirmation password or verification code.

- **1.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **2.** `[If]` `!user`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User with ID '${userId}' was not found.`
- **3.** `[If]` `!user.emailMfaEnabled`
  - **3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Email two-factor authentication is not currently enabled on this account.'
- **4.** `[If]` `user.passwordHash`
  - **4.1.** `[If]` `!body?.password`
    - **4.1.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Account password confirmation is required to disable Email 2FA.'
  - **4.2.** `[Sequence]` Calls `verifyPassword` and stores result as `isPasswordValid`
  - **4.3.** `[If]` `!isPasswordValid`
    - **4.3.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Incorrect password confirmation.'
- **5.** `[Sequence]` Define `remainingMfa`
  ```typescript
  const remainingMfa = user.TOTPEnabled || user.passkeys.length > 0
  ```
- **6.** `[Sequence]` Database `update` on `User`
- **7.** `[Sequence]` Cache `del`
- **8.** `[Sequence]` Cache `del`
- **9.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Email two-factor authentication has been disabled"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/carina/_shared/base-mfa.serv.ts](../_shared/base-mfa.serv.md) ([[apps/carina/_shared/base-mfa.serv]]) — `BaseMfaService`
- [core/utils/cache.ts](../../../core/utils/cache.md) ([[core/utils/cache]]) — `cache`
- [core/utils/auth-crypto.ts](../../../core/utils/auth-crypto.md) ([[core/utils/auth-crypto]]) — `verifyPassword`, `generateBackupCodes`, `decryptSecret`, `verifyBackupCode`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `BadRequest`, `NotFound`, `Unauthorized`, `TooManyRequests`
- [core/email/email.serv.ts](../../../core/email/email.serv.md) ([[core/email/email.serv]]) — `EmailService`
- `apps/carina/email-2fa/email-2fa.model.ts` — `CarinaEmail2faModel`

### External / Workspace Packages
- `node:crypto` — `randomInt`
- `otplib` — `verifyTotpCode`
- `@NamelessLiberty/db` — `prisma`, `toDate`

### Called By / Imported By
- [apps/carina/email-2fa/email-2fa.ctrl.ts](./email-2fa.ctrl.md) ([[apps/carina/email-2fa/email-2fa.ctrl]]) — `CarinaEmail2faServ`
