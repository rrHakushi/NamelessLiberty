# google-books.provider.ts

- **Source**: [`apps/borealis/providers/google-books.provider.ts`](../../../../../../../apps/elysia/src/apps/borealis/providers/google-books.provider.ts)
- **Layer / Role**: External Metadata Provider
- **Inheritance**: `GoogleBooksProvider extends BaseMediaProvider`

## Exported Types, Methods & Algorithms

### `interface GoogleBookPayload` (L6)

### `class GoogleBooksProvider` extends `BaseMediaProvider` (L27)

#### `constructor()` (L28)

- _No executable statements_

#### `getApiKey()`: `string` (L35)

- **1.** `[Sequence]` Define `key`
  ```typescript
  const key = Bun.env.GOOGLE_BOOKS_API_KEY
  ```
- **2.** `[If]` `!key`
  - **2.1.** `[Error]` Throws `Error` — '[GoogleBooksProvider] Missing required environment variable: GOOGLE_BOOKS_API_KEY'
- **3.** `[Return]`  — `key`

#### `waitForRateLimit()`: `Promise<void>` (L43)

- **1.** `[Sequence]` Calls `Date.now` and stores result as `now`
- **2.** `[Sequence]` Define `elapsed`
  ```typescript
  const elapsed = now - this.lastRequestTime
  ```
- **3.** `[If]` `elapsed < this.minDelayMs`
- **4.** `[Sequence]` Assign `this.lastRequestTime`
  ```typescript
  this.lastRequestTime = Date.now()
  ```

#### `searchBooks(query, limit = 25)`: `Promise<GoogleBookPayload[]>` (L55)
Searches Google Books by title/query.

- **1.** `[Sequence]` Define `clean`
  ```typescript
  const clean = query.trim()
  ```
- **2.** `[If]` `!clean`
  - **2.1.** `[Return]`  — `[]`
- **3.** `[Sequence]` Calls `this.waitForRateLimit`
- **4.** `[Sequence]` Calls `this.getApiKey` and stores result as `apiKey`
- **5.** `[Sequence]` Calls `Math.min` and stores result as `maxResults`
- **6.** `[Sequence]` Define `url`
  ```typescript
  const url = `${this.baseUrl}?q=${encodeURIComponent(clean)}&maxResults=${maxResults}${apiKey ? `&key=${apiKey}` : ''}`
  ```
- **7.** `[Try]` Try block
  - **7.1.** `[Sequence]` Calls `fetch` and stores result as `res`
  - **7.2.** `[If]` `res.status === 429`
    - **7.2.1.** `[Sequence]` Define `retryAfter`
      ```typescript
      const retryAfter = Number(res.headers.get('Retry-After')) || 5
      ```
    - **7.2.2.** `[Warning]` Logs warning — `Google Books HTTP 429. Backing off for ${retryAfter}s...`
    - **7.2.3.** `[Return]`  — `this.searchBooks(query, limit)`
  - **7.3.** `[If]` `!res.ok`
    - **7.3.1.** `[Return]`  — `[]`
  - **7.4.** `[Sequence]` Define `searchJson`
    ```typescript
    const searchJson = (await res.json()) as { items?: GoogleBookPayload[] }
    ```
  - **7.5.** `[If]` `!searchJson.items || !Array.isArray(searchJson.items)`
    - **7.5.1.** `[Return]`  — `[]`
  - **7.6.** `[Return]`  — `searchJson.items.filter((b) => Boolean(b && b.id))`
- **8.** `[Catch]` Catch (`err`)
  - **8.1.** `[Sequence]` Calls `logger.error`
  - **8.2.** `[Return]`  — `[]`

#### `fetchBook(volumeId)`: `Promise<GoogleBookPayload | null>` (L89)
Fetches book details by Google Books volume ID.

- **1.** `[Sequence]` Calls `this.waitForRateLimit`
- **2.** `[Sequence]` Calls `this.getApiKey` and stores result as `apiKey`
- **3.** `[Sequence]` Define `url`
  ```typescript
  const url = `${this.baseUrl}/${encodeURIComponent(volumeId)}${apiKey ? `?key=${apiKey}` : ''}`
  ```
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Calls `fetch` and stores result as `res`
  - **4.2.** `[If]` `!res.ok`
    - **4.2.1.** `[Return]`  — `null`
  - **4.3.** `[Return]`  — `(await res.json()) as GoogleBookPayload`
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[Sequence]` Calls `logger.error`
  - **5.2.** `[Return]`  — `null`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/borealis/_shared/base-provider.ts](../_shared/base-provider.md) ([[apps/borealis/_shared/base-provider]]) — `BaseMediaProvider`

### External / Workspace Packages
- `@NamelessLiberty/logger` — `LogFactory`

### Called By / Imported By
- [apps/borealis/providers/index.ts](./index.md) ([[apps/borealis/providers/index]]) — `GoogleBooksProvider`
- [apps/borealis/sync/media-preview.syncer.ts](../sync/media-preview.syncer.md) ([[apps/borealis/sync/media-preview.syncer]]) — `GoogleBookPayload`
