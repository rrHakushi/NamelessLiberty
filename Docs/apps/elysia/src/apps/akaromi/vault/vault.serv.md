# vault.serv.ts

- **Source**: [`apps/akaromi/vault/vault.serv.ts`](../../../../../../../apps/elysia/src/apps/akaromi/vault/vault.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `AkaromiVaultService extends BaseService`

## Exported Types, Methods & Algorithms

### `interface ImportCipherItem` (L5)

### `interface ImportVaultBody` (L12)

### `class AkaromiVaultService` extends `BaseService` (L19)

Service handling Akaromi vault synchronization, backup export, and cipher import.

#### `constructor()` (L20)
Service handling Akaromi vault synchronization, backup export, and cipher import.

- _No executable statements_

#### `syncVault(userId, since)` (L27)
Synchronizes full or incremental vault state for the authenticated user.

- **1.** `[Sequence]` Define `now`, `sinceDate`, `hasValidSince`
  ```typescript
  const now = new Date()
  const sinceDate = since ? new Date(since) : null
  const hasValidSince = sinceDate !== null && !isNaN(sinceDate.getTime())
  ```
- **2.** `[Sequence]` Database `query` on `PassCipher` and stores it as `query`
- **3.** `[If]` `hasValidSince && sinceDate`
  - **3.1.** `[Sequence]` Assign `query`
    ```typescript
    query = query.where((c) => c.updatedAt.gte(sinceDate))
    ```
- **4.** `[Sequence]` Calls `query.orderBy((c) => c.updatedAt.desc()).all` and stores result as `rawCiphers`
- **5.** `[Sequence]` Define `deletedCipherIds`
  ```typescript
  const deletedCipherIds = rawCiphers.filter((c) => c.deletedAt !== null).map((c) => c.id)
  ```
- **6.** `[Return]` 
  ```json
  {
    "success": true,
    "serverTime": "<now.toISOString()>",
    "ciphers": "<rawCiphers.map((c) => AkaromiCiphersServ.formatCipher(c))>",
    "deletedCipherIds": "<deletedCipherIds>"
  }
  ```

#### `exportVault(userId)` (L59)
Exports full non-deleted vault data for backup or client migration.

- **1.** `[Sequence]` Database `all` on `PassCipher` and stores it as `ciphers`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "exportedAt": "<new Date().toISOString()>",
    "ciphers": "<ciphers.map((c) => ({ id: c.id, type: c.type as 'LOGIN' | 'SSH_KEY', favorite: c.favorite, encryptedTitle: c.encryptedTitle, encryptedData: c.encryptedData, createdAt: toDate(c.createdAt).toISOString(), ...)>"
  }
  ```

#### `importVault(userId, body)` (L87)
Imports ciphers into the user's vault.

- **1.** `[Sequence]` Define `importedCiphersCount`
  ```typescript
  let importedCiphersCount = 0
  ```
- **2.** `[Loop]` Iterate `const cipherItem` over `body.ciphers`
  - **2.1.** `[If]` `cipherItem.encryptedTitle?.trim() && cipherItem.encryptedData?.trim()`
    - **2.1.1.** `[Sequence]` Database `create` on `PassCipher`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "importedCiphersCount": "<importedCiphersCount>",
    "message": "<`Successfully imported ${importedCiphersCount} ciphers`>"
  }
  ```

### `const akaromiVaultServ` (L112)

### `class AkaromiVaultServ` (L117)

Static facade preserving legacy callers.

#### `syncVault(userId, since)` (L118)
Static facade preserving legacy callers.

- **1.** `[Return]`  — `await akaromiVaultServ.syncVault(userId, since)`

#### `exportVault(userId)` (L122)

- **1.** `[Return]`  — `await akaromiVaultServ.exportVault(userId)`

#### `importVault(userId, body)` (L126)

- **1.** `[Return]`  — `await akaromiVaultServ.importVault(userId, body)`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [apps/akaromi/ciphers/ciphers.serv.ts](../ciphers/ciphers.serv.md) ([[apps/akaromi/ciphers/ciphers.serv]]) — `AkaromiCiphersServ`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `toDate`, `PassCipherType`

### Called By / Imported By
- [apps/akaromi/vault/vault.ctrl.ts](./vault.ctrl.md) ([[apps/akaromi/vault/vault.ctrl]]) — `AkaromiVaultServ`
