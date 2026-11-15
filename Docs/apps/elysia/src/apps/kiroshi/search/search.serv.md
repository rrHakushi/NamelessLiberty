# search.serv.ts

- **Source**: [`apps/kiroshi/search/search.serv.ts`](../../../../../../../apps/elysia/src/apps/kiroshi/search/search.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `KiroshiSearchServ extends BaseService`

## Exported Types, Methods & Algorithms

### `interface SearchOptions` (L7)

### `interface SuggestionOptions` (L17)

### `class KiroshiSearchServ` extends `BaseService` (L25)

#### `constructor()` (L28)

- _No executable statements_

#### `search(userId, query)` (L35)
Dispatches web search to upstream SearXNG core, normalizes results, caches responses, and persists encrypted search history for the user.

- **1.** `[Sequence]` Define `q`
  ```typescript
  const q = query.q || ''.trim()
  ```
- **2.** `[If]` `!q`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Query string 'q' is required.'
- **3.** `[Sequence]` Define `category`
  ```typescript
  const category = query.category || 'general'.toLowerCase()
  ```
- **4.** `[Sequence]` Calls `Math.max` and stores result as `pageno`
- **5.** `[Sequence]` Define `timeRange`, `language`, `safeSearch`, `isPrivateWindow`, `cacheKey`
  ```typescript
  const timeRange = query.time_range || ''
  const language = query.language || 'auto'
  const safeSearch = query.safesearch || '0'
  const isPrivateWindow = query.isPrivate === 'true' || query.isPrivate === '1'
  const cacheKey = `${category}:${language}:${safeSearch}:${timeRange}:${pageno}:${q.toLowerCase()}`
  ```
- **6.** `[Sequence]` Calls `searchCache.get` and stores result as `cached`
- **7.** `[If]` `cached`
  - **7.1.** `[If]` `!isPrivateWindow`
    - **7.1.1.** `[Sequence]` Calls `KiroshiSearchServ.recordSearchHistoryAsync(userId, q, category).catch`
  - **7.2.** `[Return]`  — `cached`
- **8.** `[If]` `!isPrivateWindow`
  - **8.1.** `[Sequence]` Calls `KiroshiSearchServ.recordSearchHistoryAsync(userId, q, category).catch`
- **9.** `[Sequence]` Define `searxBase`
  ```typescript
  const searxBase = Bun.env.SEARXNG_URL
  ```
- **10.** `[If]` `!searxBase`
  - **10.1.** `[Error]` Throws `Error` — 'Missing required environment variable: SEARXNG_URL'
- **11.** `[Sequence]` Define `url`
  ```typescript
  const url = new URL('/search', searxBase)
  ```
- **12.** `[Sequence]` Calls `url.searchParams.set`
- **13.** `[Sequence]` Calls `url.searchParams.set`
- **14.** `[If]` `category && category !== 'general'`
  - **14.1.** `[Sequence]` Define `searxCategory`
    ```typescript
    const searxCategory = category === 'social_media' ? 'social media' : category
    ```
  - **14.2.** `[Sequence]` Calls `url.searchParams.set`
- **15.** `[If]` `pageno > 1`
  - **15.1.** `[Sequence]` Calls `url.searchParams.set`
- **16.** `[If]` `timeRange && timeRange !== 'anytime'`
  - **16.1.** `[Sequence]` Calls `url.searchParams.set`
- **17.** `[If]` `language && language !== 'auto'`
  - **17.1.** `[Sequence]` Calls `url.searchParams.set`
- **18.** `[If]` `safeSearch`
  - **18.1.** `[Sequence]` Calls `url.searchParams.set`
- **19.** `[Sequence]` Calls `performance.now` and stores result as `startTime`
- **20.** `[Sequence]` Define `searxResponse`
  ```typescript
  let searxResponse: Response
  ```
- **21.** `[Try]` Try block
  - **21.1.** `[Sequence]` Assign `searxResponse`
    ```typescript
    searxResponse = await fetch(url.toString(), { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 IRIS-Search/1.0', }, })
    ```
- **22.** `[Catch]` Catch (`fetchErr`)
  - **22.1.** `[Error]` Throws `BadGateway` — `Could not reach SearXNG instance at ${searxBase}: ${fetchErr?.message || 'connection failed'}`
- **23.** `[If]` `searxResponse.status === 403`
  - **23.1.** `[Error]` Throws `BadGateway` — 'SearXNG JSON output is disabled. Please ensure 'json' is included in search.formats in SearXNG settings.yml.'
- **24.** `[If]` `searxResponse.status === 429`
  - **24.1.** `[Error]` Throws `TooManyRequests` (HTTP 429) — 'SearXNG rate limit exceeded. Please wait a few moments before searching again.'
- **25.** `[If]` `!searxResponse.ok`
  - **25.1.** `[Sequence]` Calls `searxResponse.text().catch` and stores result as `text`
  - **25.2.** `[Error]` Throws `BadGateway` — `SearXNG returned error ${searxResponse.status}: ${text.slice(0, 150)}`
- **26.** `[Sequence]` Define `json`
  ```typescript
  const json = (await searxResponse.json().catch(() => null)) as any
  ```
- **27.** `[If]` `!json`
  - **27.1.** `[Error]` Throws `BadGateway` — 'Failed to parse SearXNG JSON response'
- **28.** `[Sequence]` Calls `Math.round` and stores result as `durationMs`
- **29.** `[Sequence]` Define `rawResults`, `results`, `rawInfoboxes`, `infoboxes`, `responsePayload`
  ```typescript
  const rawResults = Array.isArray(json.results) ? json.results : []
  const results = rawResults.map((item: any) => { let contentStr = typeof item.content === 'string' ? item.content : item.snippet || '' if (!contentStr && item.address && typeof item.address === 'object') { contentStr = Object.values(item.address).filter(Boolean).join(', ') } let urlStr = item.url || '' if (!urlStr && item.latitude && item.longitude) { ...)
  const rawInfoboxes = Array.isArray(json.infoboxes) ? json.infoboxes : []
  const infoboxes = rawInfoboxes.map((ib: any) => ({ infobox: String(ib.infobox || 'Information'), id: ib.id ? String(ib.id) : undefined, content: typeof ib.content === 'string' ? ib.content : null, img_src: ib.img_src || null, urls: Array.isArray(ib.urls) ? ib.urls.map((u: any) => ({ ...)
  const responsePayload = { success: true, query: json.query || q, category, page: pageno, numberOfResults: typeof json.number_of_results === 'number' ? json.number_of_results : results.length, ...
  ```
- **30.** `[Sequence]` Calls `searchCache.set`
- **31.** `[Return]`  — `responsePayload`

#### `getSuggestions(query)` (L207)
Fetches search autocomplete suggestions from upstream SearXNG autocompleter.

- **1.** `[Sequence]` Define `q`
  ```typescript
  const q = query.q || ''.trim()
  ```
- **2.** `[If]` `!q`
  - **2.1.** `[Return]`  — `query.format === 'opensearch' ? [q, []] : { suggestions: [] }`
- **3.** `[Sequence]` Define `cacheKey`
  ```typescript
  const cacheKey = q.toLowerCase()
  ```
- **4.** `[Sequence]` Calls `suggestionCache.get` and stores result as `cached`
- **5.** `[If]` `cached`
  - **5.1.** `[If]` `query.format === 'opensearch'`
    - **5.1.1.** `[Return]`  — `[q, cached]`
  - **5.2.** `[Return]` 
    ```json
    {
      "suggestions": "<cached>"
    }
    ```
- **6.** `[Sequence]` Define `searxBase`
  ```typescript
  const searxBase = Bun.env.SEARXNG_URL
  ```
- **7.** `[If]` `!searxBase`
  - **7.1.** `[Error]` Throws `Error` — 'Missing required environment variable: SEARXNG_URL'
- **8.** `[Sequence]` Define `url`
  ```typescript
  const url = new URL('/autocompleter', searxBase)
  ```
- **9.** `[Sequence]` Calls `url.searchParams.set`
- **10.** `[Try]` Try block
  - **10.1.** `[Sequence]` Calls `fetch` and stores result as `res`
  - **10.2.** `[If]` `!res.ok`
    - **10.2.1.** `[Return]`  — `query.format === 'opensearch' ? [q, []] : { suggestions: [] }`
  - **10.3.** `[Sequence]` Define `data`, `suggestions`
    ```typescript
    const data = (await res.json().catch(() => null)) as any
    let suggestions: string[] = []
    ```
  - **10.4.** `[If]` `Array.isArray(data)`
    - **10.4.1.** `[If]` `Array.isArray(data[1])`
      - **10.4.1.1.** `[Sequence]` Assign `suggestions`
        ```typescript
        suggestions = data[1].filter((s: unknown) => typeof s === 'string')
        ```
    - **10.4.2.** `[Else]` Otherwise
      - **10.4.2.1.** `[Sequence]` Assign `suggestions`
        ```typescript
        suggestions = data.filter((s: unknown) => typeof s === 'string')
        ```
  - **10.5.** `[Else]` Otherwise
    - **10.5.1.** `[If]` `data && Array.isArray(data.suggestions)`
      - **10.5.1.1.** `[Sequence]` Assign `suggestions`
        ```typescript
        suggestions = data.suggestions
        ```
  - **10.6.** `[Sequence]` Calls `suggestionCache.set`
  - **10.7.** `[If]` `query.format === 'opensearch'`
    - **10.7.1.** `[Return]`  — `[q, suggestions]`
  - **10.8.** `[Return]` 
    ```json
    {
      "suggestions": "<suggestions>"
    }
    ```
- **11.** `[Catch]` Catch (`err`)
  - **11.1.** `[Return]`  — `query.format === 'opensearch' ? [q, []] : { suggestions: [] }`

#### `recordSearchHistoryAsync(userId, q, category)`: `Promise<void>` (L271)
Non-blocking background worker to encrypt and persist search history for the user, keeping 30-day retention pruned without blocking search query completion.

- **1.** `[Try]` Try block
  - **1.1.** `[Sequence]` Database `first` on `User` and stores it as `dbUser`
  - **1.2.** `[Sequence]` Define `userSettings`, `historyEnabled`
    ```typescript
    const userSettings = dbUser?.settings as any || {}
    const historyEnabled = userSettings?.search?.historyEnabled !== false
    ```
  - **1.3.** `[If]` `!historyEnabled`
    - **1.3.1.** `[Return]`  — `void`
  - **1.4.** `[Sequence]` Calls `encryptConnectionData` and stores result as `encrypted`
  - **1.5.** `[Sequence]` Database `create` on `SearchHistory`
  - **1.6.** `[Sequence]` Define `thirtyDaysAgo`
    ```typescript
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ```
  - **1.7.** `[Sequence]` Database `deleteAll` on `SearchHistory`
- **2.** `[Catch]` Catch (`err`)
  - **2.1.** `[Warning]` Logs warning — '[Kiroshi] Background search history persistence failed:', err

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/utils/cache.ts](../../../core/utils/cache.md) ([[core/utils/cache]]) — `cache`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `BadRequest`, `BadGateway`, `TooManyRequests`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`
- `@NamelessLiberty/connections` — `encryptConnectionData`

### Called By / Imported By
- [apps/kiroshi/search/search.ctrl.ts](./search.ctrl.md) ([[apps/kiroshi/search/search.ctrl]]) — `KiroshiSearchServ`
