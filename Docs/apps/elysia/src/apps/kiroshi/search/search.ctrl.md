# search.ctrl.ts

- **Source**: [`apps/kiroshi/search/search.ctrl.ts`](../../../../../../../apps/elysia/src/apps/kiroshi/search/search.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/kiroshi/search` | Web search proxying upstream SearXNG with encrypted history and caching | Kiroshi Search | query: `KiroshiSearchModel.searchQuery` | `200`: `KiroshiSearchModel.searchResponse`<br>`400`: `KiroshiSearchModel.badRequestError`<br>`401`: `KiroshiSearchModel.unauthorizedError`<br>`422`: `KiroshiSearchModel.validationError`<br>`429`: `KiroshiSearchModel.tooManyRequestsError`<br>`502`: `KiroshiSearchModel.badGatewayError` | `KiroshiSearchServ.search` |
| `GET` | `/kiroshi/suggestions` | Get web search autocomplete suggestions from SearXNG | Kiroshi Search | query: `KiroshiSearchModel.suggestionsQuery` | `200`: `KiroshiSearchModel.suggestionsResponse`<br>`400`: `KiroshiSearchModel.badRequestError`<br>`422`: `KiroshiSearchModel.validationError` | `KiroshiSearchServ.getSuggestions` |

### `GET /kiroshi/search` (L9)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `KiroshiSearchModel.searchQuery`
- **2.** `[Sequence]` Define `authenticatedUserId`
  ```typescript
  let authenticatedUserId: string | null = null
  ```
- **3.** `[If]` `userSession.isAuthenticated && userSession.user`
  - **3.1.** `[Sequence]` Assign `authenticatedUserId`
    ```typescript
    authenticatedUserId = userSession.user.id
    ```
- **4.** `[Else]` Otherwise
  - **4.1.** `[Sequence]` Define `authHeader`, `xApiKey`, `apiKey`
    ```typescript
    const authHeader = request.headers.get('authorization') || ''
    const xApiKey = request.headers.get('x-api-key') || request.headers.get('api-key')
    const apiKey = xApiKey || authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
    ```
  - **4.2.** `[If]` `apiKey`
    - **4.2.1.** `[Sequence]` Calls `createHash('sha256').update(apiKey).digest` and stores result as `hash`
    - **4.2.2.** `[Sequence]` Database `first` on `ApiKey` and stores it as `keyRecord`
    - **4.2.3.** `[If]` `keyRecord && !keyRecord.expiresAt || toDate(keyRecord.expiresAt).getTime() > Date.now()`
      - **4.2.3.1.** `[Sequence]` Assign `authenticatedUserId`
        ```typescript
        authenticatedUserId = keyRecord.userId
        ```
- **5.** `[If]` `!authenticatedUserId`
  - **5.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Authentication required via IRIS session or header (x-api-key / Authorization).'
- **6.** `[Return]`  — `await KiroshiSearchServ.search(authenticatedUserId, query)`

### `GET /kiroshi/suggestions` (L9)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `KiroshiSearchModel.suggestionsQuery`
- **2.** `[Return]`  — `await KiroshiSearchServ.getSuggestions(query)`

## Exported Types, Methods & Algorithms

### `const kiroshiSearch` (L9)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/kiroshi/search/search.model.ts` — `KiroshiSearchModel`
- [apps/kiroshi/search/search.serv.ts](./search.serv.md) ([[apps/kiroshi/search/search.serv]]) — `KiroshiSearchServ`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `Unauthorized`

### External / Workspace Packages
- `node:crypto` — `createHash`
- `elysia` — `Elysia`
- `@NamelessLiberty/db` — `prisma`, `toDate`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_36`
