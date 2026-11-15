# connections.ctrl.ts

- **Source**: [`apps/carina/connections/connections.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/connections/connections.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/carina/connections/` | Get paginated connected accounts for authenticated user (10 per page default) | Carina Connections | query: `CarinaConnectionsModel.listConnectionsQuery` | `200`: `CarinaConnectionsModel.listConnectionsResponse`<br>`401`: `CarinaConnectionsModel.unauthorizedError`<br>`422`: `CarinaConnectionsModel.validationError` | `CarinaConnectionsServ.listConnections` |
| `POST` | `/carina/connections/` | Create or update connected account with manual credentials or API Key | Carina Connections | body: `CarinaConnectionsModel.createConnectionBody` | `200`: `CarinaConnectionsModel.createConnectionResponse`<br>`400`: `CarinaConnectionsModel.badRequestError`<br>`401`: `CarinaConnectionsModel.unauthorizedError`<br>`422`: `CarinaConnectionsModel.validationError` | `CarinaConnectionsServ.createManualConnection` |
| `GET` | `/carina/connections/providers` | Get available third-party integration providers and capability matrix | Carina Connections | — | `200`: `CarinaConnectionsModel.listProvidersResponse` | `CarinaConnectionsServ.listProviders` |
| `GET` | `/carina/connections/search` | Search media or lookup external item ID via third-party provider proxy | Carina Connections | query: `CarinaConnectionsModel.searchQuery` | `200`: `CarinaConnectionsModel.searchResponse`<br>`400`: `CarinaConnectionsModel.badRequestError`<br>`401`: `CarinaConnectionsModel.unauthorizedError`<br>`422`: `CarinaConnectionsModel.validationError` | `CarinaConnectionsServ.searchProxy` |
| `GET` | `/carina/connections/:connectionId/auth` | Get OAuth initiation URL and CSRF state token for target connection or provider | Carina Connections | params: `CarinaConnectionsModel.connectionParam`<br>query: `CarinaConnectionsModel.getAuthUrlQuery` | `200`: `CarinaConnectionsModel.getAuthUrlResponse`<br>`400`: `CarinaConnectionsModel.badRequestError`<br>`401`: `CarinaConnectionsModel.unauthorizedError`<br>`404`: `CarinaConnectionsModel.notFoundError`<br>`422`: `CarinaConnectionsModel.validationError` | `CarinaConnectionsServ.getAuthUrl` |
| `GET` | `/carina/connections/:connectionId/callback` | OAuth callback handler to exchange code and persist encrypted tokens | Carina Connections | params: `CarinaConnectionsModel.connectionParam`<br>query: `CarinaConnectionsModel.callbackQuery` | — | `CarinaConnectionsServ.handleOAuthCallback` |
| `GET` | `/carina/connections/callback` | Fallback OAuth callback handler to exchange code and persist encrypted tokens | Carina Connections | query: `CarinaConnectionsModel.callbackQuery` | — | `CarinaConnectionsServ.handleOAuthCallback` |
| `POST` | `/carina/connections/:connectionId/sync` | Trigger immediate synchronization of library or watchlist from provider | Carina Connections | params: `CarinaConnectionsModel.connectionParam` | `200`: `CarinaConnectionsModel.syncResponse`<br>`401`: `CarinaConnectionsModel.unauthorizedError`<br>`404`: `CarinaConnectionsModel.notFoundError`<br>`422`: `CarinaConnectionsModel.validationError` | `CarinaConnectionsServ.syncConnection` |
| `POST` | `/carina/connections/:connectionId/test` | Test connection health and validity against external provider API | Carina Connections | params: `CarinaConnectionsModel.connectionParam` | `200`: `CarinaConnectionsModel.testConnectionResponse`<br>`401`: `CarinaConnectionsModel.unauthorizedError`<br>`404`: `CarinaConnectionsModel.notFoundError`<br>`422`: `CarinaConnectionsModel.validationError` | `CarinaConnectionsServ.testConnection` |
| `GET` | `/carina/connections/:connectionId` | Get single connected account info strictly by connection ID (UUID) | Carina Connections | params: `CarinaConnectionsModel.connectionParam` | `200`: `CarinaConnectionsModel.singleConnectionResponse`<br>`401`: `CarinaConnectionsModel.unauthorizedError`<br>`404`: `CarinaConnectionsModel.notFoundError`<br>`422`: `CarinaConnectionsModel.validationError` | `CarinaConnectionsServ.getConnection` |
| `PATCH` | `/carina/connections/:connectionId` | Update integration settings or profile info strictly by connection ID (UUID) | Carina Connections | params: `CarinaConnectionsModel.connectionParam`<br>body: `CarinaConnectionsModel.updateConnectionBody` | `200`: `CarinaConnectionsModel.updateConnectionResponse`<br>`401`: `CarinaConnectionsModel.unauthorizedError`<br>`404`: `CarinaConnectionsModel.notFoundError`<br>`422`: `CarinaConnectionsModel.validationError` | `CarinaConnectionsServ.updateConnection` |
| `DELETE` | `/carina/connections/:connectionId` | Disconnect and delete integration record strictly by connection ID (UUID) | Carina Connections | params: `CarinaConnectionsModel.connectionParam` | `200`: `CarinaConnectionsModel.deleteConnectionResponse`<br>`401`: `CarinaConnectionsModel.unauthorizedError`<br>`404`: `CarinaConnectionsModel.notFoundError`<br>`422`: `CarinaConnectionsModel.validationError` | `CarinaConnectionsServ.deleteConnection` |

### `GET /carina/connections/` (L9)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `CarinaConnectionsModel.listConnectionsQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaConnectionsServ.listConnections(user.id, query)`

### `POST /carina/connections/` (L9)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaConnectionsModel.createConnectionBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaConnectionsServ.createManualConnection(user.id, body)`

### `GET /carina/connections/providers` (L9)

- **1.** `[Return]`  — `CarinaConnectionsServ.listProviders()`

### `GET /carina/connections/search` (L9)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `CarinaConnectionsModel.searchQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaConnectionsServ.searchProxy(user.id, query)`

### `GET /carina/connections/:connectionId/auth` (L9)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaConnectionsModel.connectionParam`, query: `CarinaConnectionsModel.getAuthUrlQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Sequence]` Calls `CarinaConnectionsServ.getAuthUrl` and stores result as `authResult`
- **4.** `[If]` `authResult.state && (cookie as any)?.oauth_state`
  - **4.1.** `[Sequence]` Calls `cookie as any.oauth_state.set`
- **5.** `[Return]`  — `authResult`

### `GET /carina/connections/:connectionId/callback` (L9)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaConnectionsModel.connectionParam`, query: `CarinaConnectionsModel.callbackQuery`
- **2.** `[Sequence]` Define `cookieState`, `rawState`, `statePayload`
  ```typescript
  const cookieState = (cookie as any)?.oauth_state?.value
  const rawState = query.state || cookieState
  const statePayload = rawState ? verifyOAuthStateToken(rawState) : null
  ```
- **3.** `[If]` `query.error`
  - **3.1.** `[If]` `request.headers.get('accept')?.includes('text/html')`
    - **3.1.1.** `[Sequence]` Calls `validateReturnToUrl` and stores result as `redirectUrl`
    - **3.1.2.** `[Sequence]` Calls `redirectUrl.searchParams.set`
    - **3.1.3.** `[Sequence]` Calls `redirectUrl.searchParams.set`
    - **3.1.4.** `[Return]`  — `Response.redirect(redirectUrl.toString(), 302)`
  - **3.2.** `[Error]` Throws `BadRequest` (HTTP 400) — query.error_description || query.error
- **4.** `[Sequence]` Define `userId`
  ```typescript
  const userId = userSession.user?.id || statePayload?.userId
  ```
- **5.** `[If]` `!userId`
  - **5.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Authentication required'
- **6.** `[Sequence]` Define `effectiveQuery`
  ```typescript
  const effectiveQuery = { ...query, state: rawState || query.state, }
  ```
- **7.** `[Sequence]` Calls `CarinaConnectionsServ.handleOAuthCallback` and stores result as `result`
- **8.** `[If]` `(cookie as any)?.oauth_state`
  - **8.1.** `[Try]` Try block
    - **8.1.1.** `[Sequence]` Calls `cookie as any.oauth_state.remove`
  - **8.2.** `[Catch]` Catch (`err`)
- **9.** `[If]` `request.headers.get('accept')?.includes('text/html')`
  - **9.1.** `[Sequence]` Calls `validateReturnToUrl` and stores result as `redirectUrl`
  - **9.2.** `[Sequence]` Calls `redirectUrl.searchParams.set`
  - **9.3.** `[Sequence]` Calls `redirectUrl.searchParams.set`
  - **9.4.** `[Return]`  — `Response.redirect(redirectUrl.toString(), 302)`
- **10.** `[Return]`  — `result`

### `GET /carina/connections/callback` (L9)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `CarinaConnectionsModel.callbackQuery`
- **2.** `[Sequence]` Define `cookieState`, `rawState`, `statePayload`
  ```typescript
  const cookieState = (cookie as any)?.oauth_state?.value
  const rawState = query.state || cookieState
  const statePayload = rawState ? verifyOAuthStateToken(rawState) : null
  ```
- **3.** `[If]` `query.error`
  - **3.1.** `[If]` `request.headers.get('accept')?.includes('text/html')`
    - **3.1.1.** `[Sequence]` Calls `validateReturnToUrl` and stores result as `redirectUrl`
    - **3.1.2.** `[Sequence]` Calls `redirectUrl.searchParams.set`
    - **3.1.3.** `[Sequence]` Calls `redirectUrl.searchParams.set`
    - **3.1.4.** `[Return]`  — `Response.redirect(redirectUrl.toString(), 302)`
  - **3.2.** `[Error]` Throws `BadRequest` (HTTP 400) — query.error_description || query.error
- **4.** `[Sequence]` Define `userId`
  ```typescript
  const userId = userSession.user?.id || statePayload?.userId
  ```
- **5.** `[If]` `!userId`
  - **5.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Authentication required'
- **6.** `[Sequence]` Define `providerKey`, `effectiveQuery`
  ```typescript
  const providerKey = statePayload?.provider?.toLowerCase() || 'connection'
  const effectiveQuery = { ...query, state: rawState || query.state, }
  ```
- **7.** `[Sequence]` Calls `CarinaConnectionsServ.handleOAuthCallback` and stores result as `result`
- **8.** `[If]` `(cookie as any)?.oauth_state`
  - **8.1.** `[Try]` Try block
    - **8.1.1.** `[Sequence]` Calls `cookie as any.oauth_state.remove`
  - **8.2.** `[Catch]` Catch (`err`)
- **9.** `[If]` `request.headers.get('accept')?.includes('text/html')`
  - **9.1.** `[Sequence]` Calls `validateReturnToUrl` and stores result as `redirectUrl`
  - **9.2.** `[Sequence]` Calls `redirectUrl.searchParams.set`
  - **9.3.** `[Sequence]` Calls `redirectUrl.searchParams.set`
  - **9.4.** `[Return]`  — `Response.redirect(redirectUrl.toString(), 302)`
- **10.** `[Return]`  — `result`

### `POST /carina/connections/:connectionId/sync` (L9)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaConnectionsModel.connectionParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaConnectionsServ.syncConnection(user.id, params.connectionId)`

### `POST /carina/connections/:connectionId/test` (L9)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaConnectionsModel.connectionParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaConnectionsServ.testConnection(user.id, params.connectionId)`

### `GET /carina/connections/:connectionId` (L9)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaConnectionsModel.connectionParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaConnectionsServ.getConnection(user.id, params.connectionId)`

### `PATCH /carina/connections/:connectionId` (L9)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaConnectionsModel.connectionParam`, body: `CarinaConnectionsModel.updateConnectionBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaConnectionsServ.updateConnection(user.id, params.connectionId, body)`

### `DELETE /carina/connections/:connectionId` (L9)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaConnectionsModel.connectionParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaConnectionsServ.deleteConnection(user.id, params.connectionId)`

## Exported Types, Methods & Algorithms

### `const carinaConnections` (L9)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/carina/connections/connections.model.ts` — `CarinaConnectionsModel`
- [apps/carina/connections/connections.serv.ts](./connections.serv.md) ([[apps/carina/connections/connections.serv]]) — `CarinaConnectionsServ`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `Unauthorized`, `BadRequest`
- [core/utils/network.ts](../../../core/utils/network.md) ([[core/utils/network]]) — `validateReturnToUrl`

### External / Workspace Packages
- `elysia` — `Elysia`
- `@NamelessLiberty/connections` — `verifyOAuthStateToken`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_22`
