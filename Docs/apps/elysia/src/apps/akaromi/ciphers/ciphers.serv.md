# ciphers.serv.ts

- **Source**: [`apps/akaromi/ciphers/ciphers.serv.ts`](../../../../../../../apps/elysia/src/apps/akaromi/ciphers/ciphers.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `AkaromiCiphersServ extends BaseService`

## Exported Types, Methods & Algorithms

### `interface ListCiphersFilter` (L5)

### `interface CreateCipherDto` (L11)

### `interface UpdateCipherDto` (L19)

### `class AkaromiCiphersServ` extends `BaseService` (L27)

#### `constructor()` (L30)

- _No executable statements_

#### `formatCipher(cipher)` (L36)
Formats a PassCipher database entity into a client-safe response payload.

- **1.** `[Return]` 
  ```json
  {
    "id": "<cipher.id>",
    "type": "<cipher.type as 'LOGIN' | 'SSH_KEY'>",
    "favorite": "<cipher.favorite>",
    "reprompt": "<cipher.reprompt as 'NONE' | 'REQUIRE_MASTER_PASSWORD'>",
    "encryptedTitle": "<cipher.encryptedTitle>",
    "encryptedData": "<cipher.encryptedData>",
    "deletedAt": "<cipher.deletedAt ? toDate(cipher.deletedAt).toISOString() : null>",
    "createdAt": "<toDate(cipher.createdAt).toISOString()>",
    "updatedAt": "<toDate(cipher.updatedAt).toISOString()>"
  }
  ```

#### `listCiphers(userId, filter)` (L63)
List vault ciphers with optional filtering by type, favorite, and trash status.

- **1.** `[Sequence]` Database `query` on `PassCipher` and stores it as `query`
- **2.** `[If]` `typeoffilter?.trash === 'boolean'`
  - **2.1.** `[If]` `filter.trash`
    - **2.1.1.** `[Sequence]` Assign `query`
      ```typescript
      query = query.where((c) => c.deletedAt.isNotNull())
      ```
  - **2.2.** `[Else]` Otherwise
    - **2.2.1.** `[Sequence]` Assign `query`
      ```typescript
      query = query.where((c) => c.deletedAt.isNull())
      ```
- **3.** `[If]` `filter?.type`
  - **3.1.** `[Sequence]` Assign `query`
    ```typescript
    query = query.where({ type: filter.type })
    ```
- **4.** `[If]` `typeoffilter?.favorite === 'boolean'`
  - **4.1.** `[Sequence]` Assign `query`
    ```typescript
    query = query.where({ favorite: filter.favorite })
    ```
- **5.** `[Sequence]` Calls `query.orderBy((c) => c.updatedAt.desc()).all` and stores result as `ciphers`
- **6.** `[Sequence]` Define `sortedCiphers`
  ```typescript
  const sortedCiphers = ciphers.slice().sort((a, b) => Number(b.favorite) - Number(a.favorite))
  ```
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "ciphers": "<sortedCiphers.map((c) => this.formatCipher(c))>"
  }
  ```

#### `createCipher(userId, data)` (L97)
Create a new cipher entry (login credentials or ssh key).

- **1.** `[If]` `!data.encryptedTitle || !data.encryptedTitle.trim()`
  - **1.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Encrypted title is required and cannot be empty.'
- **2.** `[If]` `!data.encryptedData || !data.encryptedData.trim()`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Encrypted data payload is required and cannot be empty.'
- **3.** `[Sequence]` Database `create` on `PassCipher` and stores it as `cipher`
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "cipher": "<this.formatCipher(cipher)>",
    "message": "Cipher created successfully"
  }
  ```

#### `getCipher(userId, cipherId)` (L124)
Retrieve a single cipher by ID.

- **1.** `[Sequence]` Database `first` on `PassCipher` and stores it as `cipher`
- **2.** `[If]` `!cipher`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Cipher not found.'
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "cipher": "<this.formatCipher(cipher)>"
  }
  ```

#### `updateCipher(userId, cipherId, data)` (L143)
Update an existing cipher entry. Strictly overwrites ciphertext - NEVER retains password history.

- **1.** `[Sequence]` Database `first` on `PassCipher` and stores it as `existing`
- **2.** `[If]` `!existing`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Cipher not found.'
- **3.** `[If]` `data.encryptedTitle !== undefined && !data.encryptedTitle.trim()`
  - **3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Encrypted title cannot be empty.'
- **4.** `[If]` `data.encryptedData !== undefined && !data.encryptedData.trim()`
  - **4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Encrypted data payload cannot be empty.'
- **5.** `[Sequence]` Database `update` on `PassCipher` and stores it as `updated`
- **6.** `[If]` `!updated`
  - **6.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Cipher not found.'
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "cipher": "<this.formatCipher(updated)>",
    "message": "Cipher updated successfully"
  }
  ```

#### `deleteCipher(userId, cipherId, permanent = false)` (L187)
Delete a cipher by ID (moves to trash by default, or hard deletes when permanent=true).

- **1.** `[Sequence]` Database `first` on `PassCipher` and stores it as `existing`
- **2.** `[If]` `!existing`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Cipher not found.'
- **3.** `[If]` `permanent`
  - **3.1.** `[Sequence]` Database `delete` on `PassCipher`
  - **3.2.** `[Return]` 
    ```json
    {
      "success": true,
      "id": "<cipherId>",
      "permanent": true,
      "message": "Cipher permanently deleted"
    }
    ```
- **4.** `[Else]` Otherwise
  - **4.1.** `[Sequence]` Database `update` on `PassCipher`
  - **4.2.** `[Return]` 
    ```json
    {
      "success": true,
      "id": "<cipherId>",
      "permanent": false,
      "message": "Cipher moved to trash"
    }
    ```

#### `restoreCipher(userId, cipherId)` (L226)
Restore a cipher from trash bin.

- **1.** `[Sequence]` Database `first` on `PassCipher` and stores it as `existing`
- **2.** `[If]` `!existing`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Cipher not found.'
- **3.** `[Sequence]` Database `update` on `PassCipher`
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "id": "<cipherId>",
    "message": "Cipher restored from trash"
  }
  ```

#### `emptyTrash(userId)` (L249)
Permanently purge all trashed ciphers for the user.

- **1.** `[Sequence]` Database `query` on `PassCipher` and stores it as `deletedCount`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "count": "<deletedCount>",
    "message": "<`Permanently deleted ${deletedCount} ciphers from trash`>"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `NotFound`, `BadRequest`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `toDate`, `PassCipherType`, `PassRepromptType`

### Called By / Imported By
- [apps/akaromi/ciphers/ciphers.ctrl.ts](./ciphers.ctrl.md) ([[apps/akaromi/ciphers/ciphers.ctrl]]) — `AkaromiCiphersServ`
- [apps/akaromi/vault/vault.serv.ts](../vault/vault.serv.md) ([[apps/akaromi/vault/vault.serv]]) — `AkaromiCiphersServ`
