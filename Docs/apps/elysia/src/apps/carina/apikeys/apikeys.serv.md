# apikeys.serv.ts

- **Source**: [`apps/carina/apikeys/apikeys.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/apikeys/apikeys.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `CarinaApiKeysServ extends BaseService`

## Exported Types, Methods & Algorithms

### `class CarinaApiKeysServ` extends `BaseService` (L28)

#### `listKeys(userId, query = {})` (L32)
List API keys for the authenticated user with pagination (10 per page default).

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`
  ```typescript
  const skip = page - 1 * limit
  ```
- **4.** `[Sequence]` Database `all` on `ApiKey` and stores it as `[total, keys]`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "total": "<total>",
    "page": "<page>",
    "limit": "<limit>",
    "apiKeys": "<keys.map(serializeApiKey)>"
  }
  ```

#### `createKey(userId, body)` (L63)
Create a new API key for the user. Generates a 24-byte entropy key (`iris-key-...`), stores SHA-256 hash, and returns raw token once.

- **1.** `[Sequence]` Define `rawName`
  ```typescript
  const rawName = body.name || ''.trim()
  ```
- **2.** `[If]` `!rawName`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'API key name cannot be empty or contain only whitespace.'
- **3.** `[Sequence]` Define `entropy`, `rawKey`, `prefix`
  ```typescript
  const entropy = randomBytes(24).toString('hex')
  const rawKey = `iris-key-${entropy}`
  const prefix = rawKey.slice(0, 17)
  ```
- **4.** `[Sequence]` Calls `hashApiKey` and stores result as `hash`
- **5.** `[Sequence]` Define `expiresAt`
  ```typescript
  let expiresAt: Date | null = null
  ```
- **6.** `[If]` `typeofbody.expirationDays === 'number' && body.expirationDays > 0`
  - **6.1.** `[Sequence]` Assign `expiresAt`
    ```typescript
    expiresAt = new Date( Date.now() + body.expirationDays * 24 * 60 * 60 * 1000 )
    ```
- **7.** `[Sequence]` Database `create` on `ApiKey` and stores it as `created`
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "rawKey": "<rawKey>",
    "apiKey": "<serializeApiKey(created)>"
  }
  ```

#### `updateKey(userId, keyId, body)` (L102)
Update display name of an existing API key.

- **1.** `[Sequence]` Define `rawName`
  ```typescript
  const rawName = body.name || ''.trim()
  ```
- **2.** `[If]` `!rawName`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'API key name cannot be empty or contain only whitespace.'
- **3.** `[Sequence]` Database `first` on `ApiKey` and stores it as `existing`
- **4.** `[If]` `!existing`
  - **4.1.** `[Error]` Throws `NotFound` (HTTP 404) — `API key with ID '${keyId}' was not found.`
- **5.** `[Sequence]` Database `update` on `ApiKey` and stores it as `updated`
- **6.** `[If]` `!updated`
  - **6.1.** `[Error]` Throws `NotFound` (HTTP 404) — `API key with ID '${keyId}' was not found.`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "apiKey": "<serializeApiKey(updated)>"
  }
  ```

#### `deleteKey(userId, keyId)` (L137)
Delete an existing API key.

- **1.** `[Sequence]` Database `first` on `ApiKey` and stores it as `existing`
- **2.** `[If]` `!existing`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `API key with ID '${keyId}' was not found.`
- **3.** `[Sequence]` Database `delete` on `ApiKey`
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "<`API key '${keyId}' was deleted successfully.`>"
  }
  ```

#### `regenerateKey(userId, keyId)` (L160)
Regenerate an API key token. Generates a new secret, updates database hash and prefix, resets lastUsedAt.

- **1.** `[Sequence]` Database `first` on `ApiKey` and stores it as `existing`
- **2.** `[If]` `!existing`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `API key with ID '${keyId}' was not found.`
- **3.** `[Sequence]` Define `entropy`, `rawKey`, `prefix`
  ```typescript
  const entropy = randomBytes(24).toString('hex')
  const rawKey = `iris-key-${entropy}`
  const prefix = rawKey.slice(0, 17)
  ```
- **4.** `[Sequence]` Calls `hashApiKey` and stores result as `hash`
- **5.** `[Sequence]` Database `update` on `ApiKey` and stores it as `updated`
- **6.** `[If]` `!updated`
  - **6.1.** `[Error]` Throws `NotFound` (HTTP 404) — `API key with ID '${keyId}' was not found.`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "rawKey": "<rawKey>",
    "apiKey": "<serializeApiKey(updated)>"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/utils/auth-crypto.ts](../../../core/utils/auth-crypto.md) ([[core/utils/auth-crypto]]) — `hashApiKey`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `BadRequest`, `NotFound`
- `apps/carina/apikeys/apikeys.model.ts` — `CarinaApiKeysModel`

### External / Workspace Packages
- `node:crypto` — `randomBytes`
- `@NamelessLiberty/db` — `prisma`, `countOf`, `toDate`

### Called By / Imported By
- [apps/carina/apikeys/apikeys.ctrl.ts](./apikeys.ctrl.md) ([[apps/carina/apikeys/apikeys.ctrl]]) — `CarinaApiKeysServ`
