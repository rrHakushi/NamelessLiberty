# history.serv.ts

- **Source**: [`apps/kiroshi/history/history.serv.ts`](../../../../../../../apps/elysia/src/apps/kiroshi/history/history.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `KiroshiHistoryServ extends BaseService`

## Exported Types, Methods & Algorithms

### `class KiroshiHistoryServ` extends `BaseService` (L6)

#### `constructor()` (L9)

- _No executable statements_

#### `recordClick(userId, data)` (L15)
Records a clicked site, image, or video in the user's search history.

- **1.** `[Sequence]` Database `first` on `User` and stores it as `dbUser`
- **2.** `[Sequence]` Define `userSettings`, `historyEnabled`
  ```typescript
  const userSettings = dbUser?.settings as any || {}
  const historyEnabled = userSettings?.search?.historyEnabled !== false
  ```
- **3.** `[If]` `!historyEnabled`
  - **3.1.** `[Return]` 
    ```json
    {
      "success": true,
      "id": ""
    }
    ```
- **4.** `[Sequence]` Define `encryptedQuery`
  ```typescript
  const encryptedQuery = data.query ? encryptConnectionData(data.query, userId) : null
  ```
- **5.** `[Sequence]` Database `create` on `SearchHistory` and stores it as `record`
- **6.** `[Sequence]` Define `thirtyDaysAgo`
  ```typescript
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ```
- **7.** `[Sequence]` Database `deleteAll` on `SearchHistory`
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "id": "<record.id>"
  }
  ```

#### `getHistory(userId, options)` (L65)
Retrieves decrypted search query and visited site history for the user, with 30-day retention and query deduplication.

- **1.** `[Sequence]` Calls `Math.min` and stores result as `limit`
- **2.** `[Sequence]` Define `thirtyDaysAgo`, `typeFilter`, `categoryFilter`
  ```typescript
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const typeFilter = options?.type
  const categoryFilter = options?.category
  ```
- **3.** `[Sequence]` Database `query` on `SearchHistory` and stores it as `query`
- **4.** `[If]` `typeFilter && typeFilter !== 'all'`
  - **4.1.** `[Sequence]` Assign `query`
    ```typescript
    query = query.where({ type: typeFilter })
    ```
- **5.** `[If]` `categoryFilter && categoryFilter !== 'all'`
  - **5.1.** `[Sequence]` Assign `query`
    ```typescript
    query = query.where({ category: categoryFilter })
    ```
- **6.** `[Sequence]` Calls `query.orderBy((s) => s.createdAt.desc()).limit(limit * 2).all` and stores result as `records`
- **7.** `[Sequence]` Define `seenQueries`, `history`
  ```typescript
  const seenQueries = new Set<string>()
  const history: Array<{ id: string type: string query: string category: string url?: string title?: string ... = []
  ```
- **8.** `[Loop]` Iterate `const rec` over `records`
  - **8.1.** `[Try]` Try block
    - **8.1.1.** `[Sequence]` Define `itemType`
      ```typescript
      const itemType = rec.type || 'query'
      ```
    - **8.1.2.** `[If]` `itemType === 'site'`
      - **8.1.2.1.** `[Sequence]` Define `plainQuery`
        ```typescript
        let plainQuery = ''
        ```
      - **8.1.2.2.** `[If]` `rec.encryptedQuery`
        - **8.1.2.2.1.** `[Try]` Try block
          - **8.1.2.2.1.1.** `[Sequence]` Assign `plainQuery`
            ```typescript
            plainQuery = decryptConnectionData<string>(rec.encryptedQuery, userId)
            ```
        - **8.1.2.2.2.** `[Catch]` Catch (`err`)
      - **8.1.2.3.** `[If]` `history.length >= limit`
    - **8.1.3.** `[Else]` Otherwise
      - **8.1.3.1.** `[If]` `!rec.encryptedQuery`
      - **8.1.3.2.** `[Sequence]` Calls `decryptConnectionData` and stores result as `plainQuery`
      - **8.1.3.3.** `[Sequence]` Define `normalized`
        ```typescript
        const normalized = plainQuery.trim().toLowerCase()
        ```
      - **8.1.3.4.** `[If]` `!seenQueries.has(normalized)`
        - **8.1.3.4.1.** `[Sequence]` Calls `seenQueries.add`
        - **8.1.3.4.2.** `[If]` `history.length >= limit`
  - **8.2.** `[Catch]` Catch (`err`)
- **9.** `[Return]` 
  ```json
  {
    "success": true,
    "history": "<history>"
  }
  ```

#### `clearHistory(userId, type)` (L161)
Deletes search history records for the user.

- **1.** `[Sequence]` Database `query` on `SearchHistory` and stores it as `query`
- **2.** `[If]` `type && type !== 'all'`
  - **2.1.** `[Sequence]` Assign `query`
    ```typescript
    query = query.where({ type })
    ```
- **3.** `[Sequence]` Calls `query.deleteAll`
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "History cleared successfully"
  }
  ```

#### `deleteHistoryItem(userId, id)` (L177)
Deletes an individual history record by ID.

- **1.** `[Sequence]` Database `query` on `SearchHistory` and stores it as `deletedCount`
- **2.** `[If]` `deletedCount === 0`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'History record not found.'
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "History item removed"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `NotFound`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `toDate`
- `@NamelessLiberty/connections` — `decryptConnectionData`, `encryptConnectionData`

### Called By / Imported By
- [apps/kiroshi/history/history.ctrl.ts](./history.ctrl.md) ([[apps/kiroshi/history/history.ctrl]]) — `KiroshiHistoryServ`
