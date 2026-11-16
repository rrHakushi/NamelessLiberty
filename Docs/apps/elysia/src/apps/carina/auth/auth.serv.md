# auth.serv.ts

- **Source**: [`apps/carina/auth/auth.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/auth/auth.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `CarinaAuthServ extends BaseService`

## Exported Types, Methods & Algorithms

### `class CarinaAuthServ` extends `BaseService` (L23)

#### `constructor()` (L26)

- _No executable statements_

#### `login(body)` (L33)
Authenticate a user via username/email and password. Returns JWT session token or MFA challenge ticket if 2FA is active.

- **1.** `[Sequence]` Define `rawIdentifier`, `lowerIdentifier`
  ```typescript
  const rawIdentifier = body.identifier.trim()
  const lowerIdentifier = rawIdentifier.toLowerCase()
  ```
- **2.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **3.** `[If]` `!user`
  - **3.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'No account was found with the provided identifier.'
- **4.** `[Sequence]` Calls `verifyPassword` and stores result as `isPasswordValid`
- **5.** `[If]` `!isPasswordValid`
  - **5.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'The password provided is incorrect for this account.'
- **6.** `[Sequence]` Define `hasTotp`, `hasEmail`, `hasPasskeys`, `isMfaActive`
  ```typescript
  const hasTotp = user.TOTPEnabled && Boolean(user.TOTPSecret)
  const hasEmail = user.emailMfaEnabled
  const hasPasskeys = user.passkeys.length > 0
  const isMfaActive = hasTotp || hasEmail || hasPasskeys
  ```
- **7.** `[If]` `isMfaActive`
  - **7.1.** `[Sequence]` Define `mfaTicket`
    ```typescript
    const mfaTicket = `mfa_${randomBytes(24).toString('hex')}`
    ```
  - **7.2.** `[Sequence]` Cache `set`
  - **7.3.** `[Sequence]` Define `allowedMfaTypes`
    ```typescript
    const allowedMfaTypes: ('totp' | 'email' | 'passkey')[] = []
    ```
  - **7.4.** `[If]` `hasTotp`
  - **7.5.** `[If]` `hasEmail`
  - **7.6.** `[If]` `hasPasskeys`
  - **7.7.** `[Return]` 
    ```json
    {
      "success": true,
      "mfaRequired": true,
      "mfaTicket": "<mfaTicket>",
      "allowedMfaTypes": "<allowedMfaTypes>",
      "user": null,
      "token": null
    }
    ```
- **8.** `[If]` `!user.publicKey || !user.publicKey.startsWith('-----BEGIN PUBLIC KEY-----') || !user.encryptedPrivateKey`
  - **8.1.** `[Sequence]` Database `first` on `PassCipher` and stores it as `hasCiphers`
  - **8.2.** `[If]` `!hasCiphers`
    - **8.2.1.** `[Try]` Try block
      - **8.2.1.1.** `[Sequence]` Calls `generateUserKeypair` and stores result as `{ publicKey, encryptedPrivateKey }`
      - **8.2.1.2.** `[Sequence]` Database `update` on `User`
      - **8.2.1.3.** `[Sequence]` Calls `CarinaAuthServ.instance.logger.info`
    - **8.2.2.** `[Catch]` Catch (`keyErr`)
      - **8.2.2.1.** `[Warning]` Logs warning — `Failed to auto-upgrade keys for ${user.username}: ${keyErr}`
- **9.** `[Sequence]` Calls `signUserJwt` and stores result as `token`
- **10.** `[Return]` 
  ```json
  {
    "success": true,
    "mfaRequired": false,
    "mfaTicket": null,
    "allowedMfaTypes": null,
    "user": {
      "id": "<user.id>",
      "username": "<user.username.trim()>",
      "email": "<user.email>",
      "passwordChangedAt": "<user.passwordChangedAt ? Math.floor(toDate(user.passwordChangedAt).getTime() / 1000) : null>"
    },
    "token": "<token>"
  }
  ```

#### `register(body)` (L130)
Register a new user account with scrypt password and post-quantum keys.

- **1.** `[Sequence]` Define `cleanUsername`, `sanitizedUsername`, `lowerUsername`, `lowerEmail`
  ```typescript
  const cleanUsername = body.username.trim()
  const sanitizedUsername = cleanUsername.replace(/[^a-zA-Z0-9_]/g, '')
  const lowerUsername = sanitizedUsername.toLowerCase()
  const lowerEmail = body.email.trim().toLowerCase()
  ```
- **2.** `[If]` `sanitizedUsername.length < 3`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Username must contain at least 3 characters and only consist of alphanumeric characters or underscores.'
- **3.** `[If]` `isReservedKeyword(lowerUsername)`
  - **3.1.** `[Error]` Throws `Conflict` (HTTP 409) — `The username '${sanitizedUsername}' is a reserved system or language keyword and cannot be registered.`
- **4.** `[Sequence]` Database `all` on `User` and stores it as `conflicts`
- **5.** `[If]` `conflicts.length > 0`
  - **5.1.** `[Error]` Throws `Conflict` (HTTP 409) — 'An account with the provided username or email address already exists. Please choose another username or sign in.'
- **6.** `[Sequence]` Calls `hashPassword` and stores result as `passwordHash`
- **7.** `[Sequence]` Calls `generateUserKeypair` and stores result as `{ publicKey, encryptedPrivateKey }`
- **8.** `[Sequence]` Define `createUserWithAdminCheck`, `txFn`, `user`
  ```typescript
  const createUserWithAdminCheck = async (dbClient: typeof prisma) => { const userCount = await countOf(dbClient.orm.public.User) const permissions: number[] = [] if (userCount === 0) { permissions.push(Number(IRISFlags.ADMINISTRATOR)) } ...
  const txFn = prisma as unknown as { $transaction?: <T>(fn: (tx: any) => Promise<T>, opts?: unknown) => Promise<T> }.$transaction
  const user = (typeof txFn === 'function' ? await txFn.call( prisma, async (tx: any) => createUserWithAdminCheck(tx?.orm ? tx : prisma), { isolationLevel: 'Serializable' } ) : await createUserWithAdminCheck(prisma)) as Awaited<ReturnType<typeof createUserWithAdminCheck>>
  ```
- **9.** `[Return]` 
  ```json
  {
    "success": true,
    "user": {
      "id": "<user.id>",
      "username": "<user.username>",
      "email": "<user.email>",
      "passwordChangedAt": null,
      "publicKey": "<user.publicKey ?? null>"
    }
  }
  ```

#### `changePassword(userId, body)` (L207)
Change user password for an authenticated session.

- **1.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **2.** `[If]` `!user`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User account with ID '${userId}' could not be found.`
- **3.** `[Sequence]` Calls `verifyPassword` and stores result as `isCurrentValid`
- **4.** `[If]` `!isCurrentValid`
  - **4.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'The current password entered is incorrect. Please verify and try again.'
- **5.** `[If]` `body.currentPassword === body.newPassword`
  - **5.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'The new password cannot be identical to the current password.'
- **6.** `[Sequence]` Define `updatedEncryptedPrivateKey`, `updatedPublicKey`
  ```typescript
  let updatedEncryptedPrivateKey = user.encryptedPrivateKey
  let updatedPublicKey = user.publicKey
  ```
- **7.** `[If]` `user.encryptedPrivateKey`
  - **7.1.** `[Try]` Try block
    - **7.1.1.** `[Sequence]` Calls `decryptPrivateKey` and stores result as `decryptedSecret`
    - **7.1.2.** `[Sequence]` Assign `updatedEncryptedPrivateKey`
      ```typescript
      updatedEncryptedPrivateKey = await encryptPrivateKey( decryptedSecret, body.newPassword )
      ```
  - **7.2.** `[Catch]` Catch (`err`)
- **8.** `[Else]` Otherwise
  - **8.1.** `[Sequence]` Calls `generateUserKeypair` and stores result as `keypair`
  - **8.2.** `[Sequence]` Assign `updatedPublicKey`
    ```typescript
    updatedPublicKey = keypair.publicKey
    ```
  - **8.3.** `[Sequence]` Assign `updatedEncryptedPrivateKey`
    ```typescript
    updatedEncryptedPrivateKey = keypair.encryptedPrivateKey
    ```
- **9.** `[Sequence]` Calls `hashPassword` and stores result as `newHash`
- **10.** `[Sequence]` Define `now`
  ```typescript
  const now = new Date()
  ```
- **11.** `[Sequence]` Database `update` on `User`
- **12.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Password changed successfully"
  }
  ```

#### `forgotPassword(body)` (L282)
Request a password reset token. Generates and caches the reset token for 15 minutes. Email delivery service is intentionally empty as requested.

- **1.** `[Sequence]` Define `lowerEmail`
  ```typescript
  const lowerEmail = body.email.trim().toLowerCase()
  ```
- **2.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **3.** `[If]` `user && user.email`
  - **3.1.** `[Sequence]` Define `resetToken`
    ```typescript
    const resetToken = randomBytes(32).toString('hex')
    ```
  - **3.2.** `[Sequence]` Cache `set`
  - **3.3.** `[Sequence]` Calls `this.sendPasswordResetEmail`
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Password recovery instructions sent to email"
  }
  ```

#### `sendPasswordResetEmail(email, resetToken)`: `Promise<void>` (L312)
Email delivery service for password resets via BullMQ queue.

- **1.** `[Sequence]` Define `baseUrl`, `resetUrl`
  ```typescript
  const baseUrl = getDomainConfig().url
  const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`
  ```
- **2.** `[Sequence]` Calls `EmailService.sendPasswordResetEmail`

#### `resetPassword(body)` (L324)
Reset user password using a verified reset token from cache.

- **1.** `[Sequence]` Cache `get` -> `userId`
- **2.** `[If]` `!userId`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'The password reset token is either invalid, has expired, or has already been used. Please request a new reset link.'
- **3.** `[Sequence]` Calls `hashPassword` and stores result as `newHash`
- **4.** `[Sequence]` Calls `generateUserKeypair` and stores result as `{ publicKey, encryptedPrivateKey }`
- **5.** `[Sequence]` Define `now`
  ```typescript
  const now = new Date()
  ```
- **6.** `[Sequence]` Database `update` on `User`
- **7.** `[Sequence]` Cache `del`
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Password reset successfully"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/utils/cache.ts](../../../core/utils/cache.md) ([[core/utils/cache]]) — `cache`
- [core/utils/auth-crypto.ts](../../../core/utils/auth-crypto.md) ([[core/utils/auth-crypto]]) — `hashPassword`, `verifyPassword`, `signUserJwt`, `generateUserKeypair`, `encryptPrivateKey`, `decryptPrivateKey`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `BadRequest`, `Conflict`, `NotFound`, `Unauthorized`
- [core/email/email.serv.ts](../../../core/email/email.serv.md) ([[core/email/email.serv]]) — `EmailService`
- `apps/carina/auth/auth.model.ts` — `CarinaAuthModel`
- [core/utils/domain.ts](../../../core/utils/domain.md) ([[core/utils/domain]]) — `getDomainConfig`

### External / Workspace Packages
- `node:crypto` — `randomBytes`
- `@NamelessLiberty/db` — `prisma`, `or`, `toDate`, `countOf`
- `@NamelessLiberty/shared` — `isReservedKeyword`
- `@NamelessLiberty/permissions` — `IRISFlags`

### Called By / Imported By
- [apps/carina/auth/auth.ctrl.ts](./auth.ctrl.md) ([[apps/carina/auth/auth.ctrl]]) — `CarinaAuthServ`
