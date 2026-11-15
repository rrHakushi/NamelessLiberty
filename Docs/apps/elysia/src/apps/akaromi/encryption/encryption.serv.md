# encryption.serv.ts

- **Source**: [`apps/akaromi/encryption/encryption.serv.ts`](../../../../../../../apps/elysia/src/apps/akaromi/encryption/encryption.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `AkaromiEncryptionService extends BaseService`

## Exported Types, Methods & Algorithms

### `class AkaromiEncryptionService` extends `BaseService` (L8)

Service managing user post-quantum encryption keys and cryptographic salts for Akaromi.

#### `constructor()` (L9)
Service managing user post-quantum encryption keys and cryptographic salts for Akaromi.

- _No executable statements_

#### `getEncryptionKeys(userId)` (L16)
Retrieves the authenticated user's post-quantum encryption keys and cryptographic salt.

- **1.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **2.** `[If]` `!user`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User not found.'
- **3.** `[Sequence]` Define `salt`
  ```typescript
  let salt: string | null = null
  ```
- **4.** `[If]` `user.encryptedPrivateKey && user.encryptedPrivateKey.includes(':')`
  - **4.1.** `[Sequence]` Assign `salt`
    ```typescript
    salt = user.encryptedPrivateKey.split(':')[0] || null
    ```
- **5.** `[Else]` Otherwise
  - **5.1.** `[If]` `user.passwordHash && user.passwordHash.includes(':')`
    - **5.1.1.** `[Sequence]` Assign `salt`
      ```typescript
      salt = user.passwordHash.split(':')[0] || null
      ```
- **6.** `[Return]` 
  ```json
  {
    "success": true,
    "userId": "<user.id>",
    "publicKey": "<user.publicKey ?? null>",
    "encryptedPrivateKey": "<user.encryptedPrivateKey ?? null>",
    "salt": "<salt>",
    "hasEncryptionKeys": "<Boolean(user.publicKey && user.encryptedPrivateKey)>"
  }
  ```

### `const akaromiEncryptionServ` (L46)

### `class AkaromiEncryptionServ` (L51)

Static facade preserving legacy callers.

#### `getEncryptionKeys(userId)` (L52)
Static facade preserving legacy callers.

- **1.** `[Return]`  — `await akaromiEncryptionServ.getEncryptionKeys(userId)`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `NotFound`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`

### Called By / Imported By
- [apps/akaromi/encryption/encryption.ctrl.ts](./encryption.ctrl.md) ([[apps/akaromi/encryption/encryption.ctrl]]) — `AkaromiEncryptionServ`
