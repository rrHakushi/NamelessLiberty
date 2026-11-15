# auth-crypto.ts

- **Source**: [`core/utils/auth-crypto.ts`](../../../../../../apps/elysia/src/core/utils/auth-crypto.ts)
- **Layer / Role**: Core Infrastructure

## Exported Types, Methods & Algorithms

### `function hashPassword` (L19)

Standard password hashing utilizing native Bun Argon2id.

- **1.** `[Return]`  — `await Bun.password.hash(password, { algorithm: "argon2id", memoryCost: 65536, timeCost: 2, })`

### `function hashApiKey` (L30)

Hashes an API key using SHA-256 for secure database persistence and lookup.

- **1.** `[Return]`  — `createHash('sha256').update(apiKey.trim()).digest('hex')`

### `function generateBackupCodes` (L37)

Generates an array of 10 cryptographic backup recovery codes and their hashes.

- **1.** `[Sequence]` Define `plain`, `hashed`, `CHARS`
  ```typescript
  const plain: string[] = []
  const hashed: string[] = []
  const CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  ```
- **2.** `[Loop]` Loop `i < 10`
  - **2.1.** `[Sequence]` Calls `randomBytes` and stores result as `bytes`
  - **2.2.** `[Sequence]` Define `code`
    ```typescript
    let code = ''
    ```
  - **2.3.** `[Loop]` Loop `b < 16`
    - **2.3.1.** `[Sequence]` Assign `code`
      ```typescript
      code += CHARS[bytes[b]! % CHARS.length]
      ```
  - **2.4.** `[Sequence]` Define `formatted`
    ```typescript
    const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}-${code.slice(12, 16)}`
    ```
- **3.** `[Return]` 
  ```json
  {
    "plain": "<plain>",
    "hashed": "<hashed>"
  }
  ```

### `function verifyBackupCode` (L63)

Verifies an entered backup code against an array of hashed backup codes. Returns the index of the matched code in `storedHashes`, or -1 if invalid.

- **1.** `[Sequence]` Define `cleanCode`
  ```typescript
  const cleanCode = inputCode.trim().toUpperCase()
  ```
- **2.** `[Sequence]` Calls `cleanCode.replaceAll` and stores result as `cleanNoDash`
- **3.** `[Sequence]` Define `reconstructedDash`
  ```typescript
  const reconstructedDash = cleanNoDash.length === 16 ? `${cleanNoDash.slice(0, 4)}-${cleanNoDash.slice(4, 8)}-${cleanNoDash.slice(8, 12)}-${cleanNoDash.slice(12, 16)}` : cleanCode
  ```
- **4.** `[Loop]` Loop `i < storedHashes.length`
  - **4.1.** `[Sequence]` Define `storedHash`
    ```typescript
    const storedHash = storedHashes[i]
    ```
  - **4.2.** `[If]` `!storedHash`
  - **4.3.** `[If]` `await verifyPassword(cleanCode, storedHash) || await verifyPassword(cleanNoDash, storedHash) || await verifyPassword(reconstructedDash, storedHash)`
    - **4.3.1.** `[Return]`  — `i`
- **5.** `[Return]`  — `-1`

### `function encryptSecret` (L117)

Encrypts sensitive credentials (such as TOTP base32 secrets) using AES-256-GCM with HKDF key separation (`enc:v2:`).

- **1.** `[Sequence]` Calls `getHkdfEncryptionKey` and stores result as `key`
- **2.** `[Sequence]` Calls `randomBytes` and stores result as `iv`
- **3.** `[Sequence]` Calls `createCipheriv` and stores result as `cipher`
- **4.** `[Sequence]` Calls `Buffer.concat` and stores result as `encrypted`
- **5.** `[Sequence]` Calls `cipher.getAuthTag` and stores result as `authTag`
- **6.** `[Return]`  — ``enc:v2:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}``

### `function decryptSecret` (L136)

Decrypts data encrypted with `encryptSecret` (supports both `enc:v2:` HKDF and legacy v1 `iv:tag:ct`).

- **1.** `[If]` `serialized.startsWith('enc:v2:')`
  - **1.1.** `[Sequence]` Define `parts`
    ```typescript
    const parts = serialized.slice(7).split(':')
    ```
  - **1.2.** `[If]` `parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]`
    - **1.2.1.** `[Error]` Throws `Error` — 'Malformed encrypted v2 secret payload'
  - **1.3.** `[Sequence]` Define `[ivHex, authTagHex, encryptedHex]`
    ```typescript
    const [ivHex, authTagHex, encryptedHex] = parts as [string, string, string]
    ```
  - **1.4.** `[Sequence]` Calls `createDecipheriv` and stores result as `decipher`
  - **1.5.** `[Sequence]` Calls `decipher.setAuthTag`
  - **1.6.** `[Return]`  — `Buffer.concat([ decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final(), ]).toString('utf8')`
- **2.** `[If]` `!serialized.includes(':')`
  - **2.1.** `[Return]`  — `serialized`
- **3.** `[Sequence]` Define `[ivHex, authTagHex, encryptedHex]`
  ```typescript
  const [ivHex, authTagHex, encryptedHex] = serialized.split(':')
  ```
- **4.** `[If]` `!ivHex || !authTagHex || !encryptedHex`
  - **4.1.** `[Error]` Throws `Error` — 'Malformed legacy encrypted secret payload'
- **5.** `[Sequence]` Calls `getLegacyEncryptionKey` and stores result as `key`
- **6.** `[Sequence]` Calls `Buffer.from` and stores result as `iv`
- **7.** `[Sequence]` Calls `Buffer.from` and stores result as `authTag`
- **8.** `[Sequence]` Calls `Buffer.from` and stores result as `encrypted`
- **9.** `[Sequence]` Calls `createDecipheriv` and stores result as `decipher`
- **10.** `[Sequence]` Calls `decipher.setAuthTag`
- **11.** `[Sequence]` Calls `Buffer.concat` and stores result as `decrypted`
- **12.** `[Return]`  — `decrypted.toString('utf8')`

### `function verifyPassword` (L187)

Password verification utilizing native Bun.password.

- **1.** `[If]` `!password || !storedHash`
  - **1.1.** `[Return]`  — `false`
- **2.** `[Try]` Try block
  - **2.1.** `[Return]`  — `await Bun.password.verify(password, storedHash)`
- **3.** `[Catch]` Catch (`err`)
  - **3.1.** `[Return]`  — `false`

### `interface UserSessionTokenData` (L202)

### `function signUserJwt` (L213)

Signs a standard JWT session token using HS256.

- **1.** `[Sequence]` Define `secret`
  ```typescript
  const secret = Bun.env.JWT_SECRET
  ```
- **2.** `[If]` `!secret`
  - **2.1.** `[Error]` Throws `Error` — 'JWT_SECRET environment variable is required'
- **3.** `[Sequence]` Define `pwdChangedSeconds`
  ```typescript
  const pwdChangedSeconds = user.passwordChangedAt ? Math.floor(user.passwordChangedAt.getTime() / 1000) : null
  ```
- **4.** `[Sequence]` Calls `new TextEncoder().encode` and stores result as `secretKey`
- **5.** `[Sequence]` Calls `Math.floor` and stores result as `now`
- **6.** `[Return]`  — `await new SignJWT({ id: user.id, username: user.username, email: user.email ?? "", passwordChangedAt: pwdChangedSeconds, permissions: user.permissions ?? [], }).setProtectedHeader({ alg: "HS256" }).setIssuedAt(now).setExpirationTime('365d').sign(secretKey)`

### `function encryptPrivateKey` (L243)

Encrypts a private key using AES-256-GCM with a key derived from the user's password via scrypt.

- **1.** `[Sequence]` Calls `randomBytes` and stores result as `salt`
- **2.** `[Sequence]` Define `key`
  ```typescript
  const key = (await scryptAsync(password, salt, 32)) as Buffer
  ```
- **3.** `[Sequence]` Calls `randomBytes` and stores result as `iv`
- **4.** `[Sequence]` Calls `createCipheriv` and stores result as `cipher`
- **5.** `[Sequence]` Define `secretBuffer`
  ```typescript
  const secretBuffer = typeof secretKey === "string" ? Buffer.from(secretKey, "utf8") : Buffer.from(secretKey)
  ```
- **6.** `[Sequence]` Calls `Buffer.concat` and stores result as `encrypted`
- **7.** `[Sequence]` Calls `cipher.getAuthTag` and stores result as `authTag`
- **8.** `[Return]`  — ``${salt.toString("hex")}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}``

### `function decryptPrivateKey` (L268)

Decrypts a private key previously encrypted with `encryptPrivateKey`.

- **1.** `[Sequence]` Define `[saltHex, ivHex, authTagHex, encryptedHex]`
  ```typescript
  const [saltHex, ivHex, authTagHex, encryptedHex] = encryptedPayload.split(':')
  ```
- **2.** `[If]` `!saltHex || !ivHex || !authTagHex || !encryptedHex`
  - **2.1.** `[Error]` Throws `Error` — 'Invalid encrypted private key format.'
- **3.** `[Sequence]` Calls `Buffer.from` and stores result as `salt`
- **4.** `[Sequence]` Calls `Buffer.from` and stores result as `iv`
- **5.** `[Sequence]` Calls `Buffer.from` and stores result as `authTag`
- **6.** `[Sequence]` Calls `Buffer.from` and stores result as `encrypted`
- **7.** `[Sequence]` Define `key`
  ```typescript
  const key = (await scryptAsync(password, salt, 32)) as Buffer
  ```
- **8.** `[Sequence]` Calls `createDecipheriv` and stores result as `decipher`
- **9.** `[Sequence]` Calls `decipher.setAuthTag`
- **10.** `[Sequence]` Calls `Buffer.concat` and stores result as `decrypted`
- **11.** `[Return]`  — `decrypted.toString('utf8')`

### `function generateUserKeypair` (L298)

Generates a standard RSA-OAEP 2048-bit keypair and encrypts the private key with the user's password using AES-256-GCM.

- **1.** `[Sequence]` Calls `generateKeyPairSync` and stores result as `{ publicKey, privateKey }`
- **2.** `[Sequence]` Calls `encryptPrivateKey` and stores result as `encryptedPrivateKey`
- **3.** `[Return]` 
  ```json
  {
    "publicKey": "<publicKey>",
    "encryptedPrivateKey": "<encryptedPrivateKey>"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- _None_

### External / Workspace Packages
- `node:crypto` — `createCipheriv`, `createDecipheriv`, `createHash`, `generateKeyPairSync`, `hkdfSync`, `randomBytes`, `scrypt`, `timingSafeEqual`
- `node:util` — `promisify`
- `jose` — `SignJWT`

### Called By / Imported By
- [apps/borealis/lists/lists.serv.ts](../../apps/borealis/lists/lists.serv.md) ([[apps/borealis/lists/lists.serv]]) — `hashPassword`
- [apps/carina/_shared/base-mfa.serv.ts](../../apps/carina/_shared/base-mfa.serv.md) ([[apps/carina/_shared/base-mfa.serv]]) — `signUserJwt`
- [apps/carina/apikeys/apikeys.serv.ts](../../apps/carina/apikeys/apikeys.serv.md) ([[apps/carina/apikeys/apikeys.serv]]) — `hashApiKey`
- [apps/carina/auth/auth.serv.ts](../../apps/carina/auth/auth.serv.md) ([[apps/carina/auth/auth.serv]]) — `hashPassword`, `verifyPassword`, `signUserJwt`, `generateUserKeypair`, `encryptPrivateKey`, `decryptPrivateKey`
- [apps/carina/backupcodes/backupcodes.serv.ts](../../apps/carina/backupcodes/backupcodes.serv.md) ([[apps/carina/backupcodes/backupcodes.serv]]) — `generateBackupCodes`, `verifyBackupCode`
- [apps/carina/email-2fa/email-2fa.serv.ts](../../apps/carina/email-2fa/email-2fa.serv.md) ([[apps/carina/email-2fa/email-2fa.serv]]) — `verifyPassword`, `generateBackupCodes`, `decryptSecret`, `verifyBackupCode`
- [apps/carina/passkeys/passkeys.serv.ts](../../apps/carina/passkeys/passkeys.serv.md) ([[apps/carina/passkeys/passkeys.serv]]) — `generateBackupCodes`
- [apps/carina/qc/qc.serv.ts](../../apps/carina/qc/qc.serv.md) ([[apps/carina/qc/qc.serv]]) — `signUserJwt`
- [apps/carina/totp/totp.serv.ts](../../apps/carina/totp/totp.serv.md) ([[apps/carina/totp/totp.serv]]) — `encryptSecret`, `decryptSecret`, `verifyPassword`, `generateBackupCodes`
- [core/plugins/session.ts](../plugins/session.md) ([[core/plugins/session]]) — `hashApiKey`
