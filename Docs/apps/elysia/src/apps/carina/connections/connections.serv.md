# connections.serv.ts

- **Source**: [`apps/carina/connections/connections.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/connections/connections.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `CarinaConnectionsServ extends BaseService`

## Exported Types, Methods & Algorithms

### `class CarinaConnectionsServ` extends `BaseService` (L29)

#### `formatConnection(conn)` (L54)
Helper to format a Prisma connection record for API responses (safely omitting raw tokens).

- **1.** `[Return]` 
  ```json
  {
    "id": "<conn.id>",
    "userId": "<conn.userId>",
    "provider": "<conn.provider>",
    "authType": "<conn.authType>",
    "externalId": "<conn.externalId>",
    "displayName": "<conn.displayName>",
    "avatarUrl": "<conn.avatarUrl>",
    "profileUrl": "<conn.profileUrl>",
    "status": "<conn.status>",
    "errorMessage": "<conn.errorMessage>",
    "settings": "<conn.settings>",
    "lastSyncedAt": "<conn.lastSyncedAt ? toDate(conn.lastSyncedAt).toISOString() : null>",
    "expiresAt": "<conn.expiresAt ? toDate(conn.expiresAt).toISOString() : null>",
    "createdAt": "<toDate(conn.createdAt).toISOString()>",
    "updatedAt": "<toDate(conn.updatedAt).toISOString()>"
  }
  ```

#### `listConnections(userId, query)` (L93)
Lists connected accounts for authenticated user (10 per page default).

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`
  ```typescript
  const skip = page - 1 * limit
  ```
- **4.** `[Sequence]` Database `query` on `Connection` and stores it as `queryBuilder`
- **5.** `[If]` `query?.provider?.trim()`
  - **5.1.** `[Sequence]` Define `p`
    ```typescript
    const p = query.provider.trim().toUpperCase() as ConnectionProvider
    ```
  - **5.2.** `[Sequence]` Assign `queryBuilder`
    ```typescript
    queryBuilder = queryBuilder.where((c) => c.provider.eq(p))
    ```
- **6.** `[If]` `query?.status?.trim()`
  - **6.1.** `[Sequence]` Define `s`
    ```typescript
    const s = query.status.trim().toUpperCase() as ConnectionStatus
    ```
  - **6.2.** `[Sequence]` Assign `queryBuilder`
    ```typescript
    queryBuilder = queryBuilder.where((c) => c.status.eq(s))
    ```
- **7.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawConnections]`
- **8.** `[Sequence]` Calls `Math.max` and stores result as `totalPages`
- **9.** `[Sequence]` Define `hasMore`, `connections`
  ```typescript
  const hasMore = page < totalPages
  const connections = rawConnections.map((c) => this.formatConnection(c))
  ```
- **10.** `[Return]` 
  ```json
  {
    "success": true,
    "total": "<total>",
    "connections": "<connections>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<totalPages>",
      "hasMore": "<hasMore>"
    }
  }
  ```

#### `listProviders()` (L148)
Lists all available third-party providers with capabilities and configuration state.

- **1.** `[Sequence]` Calls `getSupportedProviders` and stores result as `providers`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "total": "<providers.length>",
    "providers": "<providers>"
  }
  ```

#### `createManualConnection(userId, body)` (L160)
Manually creates or updates a connected account with API key or credentials.

- **1.** `[Sequence]` Define `provider`, `adapter`
  ```typescript
  const provider = body.provider.trim().toUpperCase() as ConnectionProvider
  let adapter
  ```
- **2.** `[Try]` Try block
  - **2.1.** `[Sequence]` Assign `adapter`
    ```typescript
    adapter = getConnectionAdapter(provider)
    ```
- **3.** `[Catch]` Catch (`err`)
  - **3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — `Unsupported provider: ${body.provider}`
- **4.** `[Sequence]` Define `credentials`
  ```typescript
  const credentials: ConnectionCredentials = { apiKey: body.apiKey, hostUrl: body.hostUrl, username: body.username, password: body.password, }
  ```
- **5.** `[Sequence]` Calls `adapter.testConnection` and stores result as `testResult`
- **6.** `[If]` `!testResult.ok`
  - **6.1.** `[Error]` Throws `BadRequest` (HTTP 400) — testResult.message || 'Failed to authenticate with provider'
- **7.** `[Sequence]` Define `finalCredentials`
  ```typescript
  const finalCredentials = testResult.credentials || credentials
  ```
- **8.** `[Sequence]` Calls `encryptConnectionData` and stores result as `encryptedData`
- **9.** `[Sequence]` Define `profile`, `externalId`
  ```typescript
  const profile = testResult.profile
  const externalId = profile?.id || body.username || 'default'
  ```
- **10.** `[Sequence]` Database `first` on `Connection` and stores it as `existing`
- **11.** `[Sequence]` Define `connection`
  ```typescript
  let connection
  ```
- **12.** `[If]` `existing`
  - **12.1.** `[Sequence]` Assign `connection`
    ```typescript
    connection = await prisma.orm.public.Connection.where((c) => c.id.eq(existing.id)).update({ displayName: profile?.displayName || profile?.username || body.username || provider, avatarUrl: profile?.avatarUrl ?? null, ...
    ```
- **13.** `[Else]` Otherwise
  - **13.1.** `[Sequence]` Assign `connection`
    ```typescript
    connection = await prisma.orm.public.Connection.create({ userId, provider, authType: (body.authType?.toUpperCase() as any) || (adapter.authType as any) || 'API_KEY', ...
    ```
- **14.** `[If]` `!connection`
  - **14.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Failed to save connection'
- **15.** `[Return]` 
  ```json
  {
    "success": true,
    "connection": {
      "id": "<connection.id>",
      "provider": "<connection.provider>",
      "displayName": "<connection.displayName>",
      "status": "<connection.status>"
    }
  }
  ```

#### `getConnection(userId, connectionId)` (L272)
Retrieves single connected account details strictly by connection ID.

- **1.** `[Sequence]` Database `first` on `Connection` and stores it as `connection`
- **2.** `[If]` `!connection || connection.userId !== userId`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Connection not found'
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "connection": "<this.formatConnection(connection)>"
  }
  ```

#### `updateConnection(userId, connectionId, body)` (L290)
Updates settings or custom profile fields for a connected account.

- **1.** `[Sequence]` Database `first` on `Connection` and stores it as `connection`
- **2.** `[If]` `!connection || connection.userId !== userId`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Connection not found'
- **3.** `[Sequence]` Define `mergedSettings`
  ```typescript
  let mergedSettings = connection.settings
  ```
- **4.** `[If]` `body.settings !== undefined`
  - **4.1.** `[Sequence]` Define `current`
    ```typescript
    const current = typeof connection.settings === 'object' && connection.settings !== null ? connection.settings : {}
    ```
  - **4.2.** `[Sequence]` Assign `mergedSettings`
    ```typescript
    mergedSettings = { ...current, ...body.settings }
    ```
- **5.** `[Sequence]` Database `update` on `Connection` and stores it as `updated`
- **6.** `[If]` `!updated`
  - **6.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Connection not found'
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "connection": "<this.formatConnection(updated)>",
    "message": "Connection updated successfully"
  }
  ```

#### `deleteConnection(userId, connectionId)` (L337)
Disconnects / deletes a connected account strictly by connection ID.

- **1.** `[Sequence]` Database `first` on `Connection` and stores it as `connection`
- **2.** `[If]` `!connection || connection.userId !== userId`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Connection not found'
- **3.** `[Sequence]` Database `deleteAll` on `Connection`
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "id": "<connection.id>",
    "message": "Connection disconnected successfully"
  }
  ```

#### `getAuthUrl(userId, connectionIdOrProvider, query)` (L358)
Generates OAuth authorization initiation URL for target connection or provider.

- **1.** `[Sequence]` Define `normalized`, `provider`, `registeredProviders`
  ```typescript
  const normalized = connectionIdOrProvider.trim().toUpperCase()
  let provider: ConnectionProvider | null = null
  const registeredProviders: readonly string[] = [ 'ANILIST', 'MAL', 'SIMKL', 'BANGUMI', 'RIOT_GAMES', 'RADARR', ...
  ```
- **2.** `[If]` `registeredProviders.includes(normalized)`
  - **2.1.** `[Sequence]` Assign `provider`
    ```typescript
    provider = normalized as ConnectionProvider
    ```
- **3.** `[Else]` Otherwise
  - **3.1.** `[Sequence]` Database `first` on `Connection` and stores it as `existing`
  - **3.2.** `[If]` `existing && existing.userId === userId`
    - **3.2.1.** `[Sequence]` Assign `provider`
      ```typescript
      provider = existing.provider
      ```
- **4.** `[If]` `!provider`
  - **4.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Provider or connection not found'
- **5.** `[Sequence]` Calls `getConnectionAdapter` and stores result as `adapter`
- **6.** `[If]` `!adapter.capabilities.supportsOAuth`
  - **6.1.** `[Error]` Throws `BadRequest` (HTTP 400) — `Provider ${provider} does not support OAuth authentication`
- **7.** `[If]` `!Bun.env.NEXT_PUBLIC_URL`
  - **7.1.** `[Error]` Throws `Error` — 'Missing required environment variable: NEXT_PUBLIC_URL'
- **8.** `[Sequence]` Define `apiBaseUrl`, `redirectUri`, `codeVerifier`
  ```typescript
  const apiBaseUrl = `${Bun.env.NEXT_PUBLIC_URL.replace(/\/+$/, '')}/elysia`
  const redirectUri = query?.redirectUri?.trim() || `${apiBaseUrl}/carina/connections/${provider.toLowerCase()}/callback`
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  ```
- **9.** `[Sequence]` Calls `createOAuthStateToken` and stores result as `stateToken`
- **10.** `[Sequence]` Calls `adapter.getAuthUrl` and stores result as `authResult`
- **11.** `[Return]` 
  ```json
  {
    "success": true,
    "url": "<authResult.url>",
    "state": "<stateToken>",
    "provider": "<provider>"
  }
  ```

#### `handleOAuthCallback(userId, connectionIdOrProvider, query)` (L450)
Handles OAuth authorization code exchange callback and securely persists encrypted tokens.

- **1.** `[If]` `query.error`
  - **1.1.** `[Error]` Throws `BadRequest` (HTTP 400) — query.error_description || query.error
- **2.** `[Sequence]` Define `authCode`
  ```typescript
  const authCode = query.code || query.request_reference || query.reference
  ```
- **3.** `[If]` `!authCode`
  - **3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Missing required OAuth code or state parameter'
- **4.** `[If]` `!Bun.env.NEXT_PUBLIC_URL`
  - **4.1.** `[Error]` Throws `Error` — 'Missing required environment variable: NEXT_PUBLIC_URL'
- **5.** `[Sequence]` Define `apiBaseUrl`, `provider`, `redirectUri`, `codeVerifier`, `hostUrl`
  ```typescript
  const apiBaseUrl = `${Bun.env.NEXT_PUBLIC_URL.replace(/\/+$/, '')}/elysia`
  let provider: ConnectionProvider | null = null
  let redirectUri: string
  let codeVerifier: string | undefined
  let hostUrl: string | undefined
  ```
- **6.** `[If]` `query.state`
  - **6.1.** `[Sequence]` Calls `verifyOAuthStateToken` and stores result as `statePayload`
  - **6.2.** `[If]` `!statePayload`
    - **6.2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Invalid or expired OAuth state token'
  - **6.3.** `[If]` `statePayload.userId !== userId`
    - **6.3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'OAuth state user mismatch'
  - **6.4.** `[Sequence]` Assign `provider`
    ```typescript
    provider = statePayload.provider
    ```
  - **6.5.** `[Sequence]` Assign `redirectUri`
    ```typescript
    redirectUri = statePayload.redirectUri
    ```
  - **6.6.** `[Sequence]` Assign `codeVerifier`
    ```typescript
    codeVerifier = statePayload.codeVerifier
    ```
  - **6.7.** `[Sequence]` Assign `hostUrl`
    ```typescript
    hostUrl = statePayload.hostUrl
    ```
- **7.** `[Else]` Otherwise
  - **7.1.** `[Sequence]` Define `normalized`, `registeredProviders`
    ```typescript
    const normalized = connectionIdOrProvider.trim().toUpperCase()
    const registeredProviders: readonly string[] = [ 'ANILIST', 'MAL', 'SIMKL', 'BANGUMI', 'RIOT_GAMES', 'RADARR', ...
    ```
  - **7.2.** `[If]` `registeredProviders.includes(normalized)`
    - **7.2.1.** `[Sequence]` Assign `provider`
      ```typescript
      provider = normalized as ConnectionProvider
      ```
  - **7.3.** `[Else]` Otherwise
    - **7.3.1.** `[Sequence]` Database `first` on `Connection` and stores it as `existing`
    - **7.3.2.** `[If]` `existing && existing.userId === userId`
      - **7.3.2.1.** `[Sequence]` Assign `provider`
        ```typescript
        provider = existing.provider
        ```
  - **7.4.** `[If]` `!provider`
    - **7.4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Missing OAuth state parameter and provider could not be resolved'
  - **7.5.** `[Sequence]` Assign `redirectUri`
    ```typescript
    redirectUri = `${apiBaseUrl}/carina/connections/${provider.toLowerCase()}/callback`
    ```
- **8.** `[If]` `!provider`
  - **8.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Missing OAuth provider'
- **9.** `[Sequence]` Define `resolvedProvider`
  ```typescript
  const resolvedProvider: ConnectionProvider = provider
  ```
- **10.** `[Sequence]` Calls `getConnectionAdapter` and stores result as `adapter`
- **11.** `[Sequence]` Calls `adapter.exchangeAuthCode` and stores result as `tokens`
- **12.** `[Sequence]` Calls `adapter.getProfile` and stores result as `profile`
- **13.** `[Sequence]` Calls `encryptConnectionData` and stores result as `encryptedData`
- **14.** `[Sequence]` Define `externalId`, `displayName`, `avatarUrl`, `profileUrl`, `expiresAt`
  ```typescript
  const externalId = profile.id || profile.username || null
  const displayName = profile.displayName || profile.username || null
  const avatarUrl = profile.avatarUrl || null
  const profileUrl = profile.profileUrl || null
  const expiresAt = tokens.expiresAt ? new Date(tokens.expiresAt) : null
  ```
- **15.** `[Sequence]` Database `first` on `Connection` and stores it as `target`
- **16.** `[If]` `target && target.userId === userId`
  - **16.1.** `[Sequence]` Assign `target`
    ```typescript
    target = await prisma.orm.public.Connection.where((c) => c.id.eq(target!.id)).update({ encryptedData, status: 'CONNECTED', errorMessage: null, externalId, displayName, avatarUrl, ...
    ```
- **17.** `[Else]` Otherwise
  - **17.1.** `[Sequence]` Database `query` on `Connection` and stores it as `existingQuery`
  - **17.2.** `[If]` `externalId`
    - **17.2.1.** `[Sequence]` Assign `existingQuery`
      ```typescript
      existingQuery = existingQuery.where((c) => c.externalId.eq(externalId))
      ```
  - **17.3.** `[Sequence]` Calls `existingQuery.first` and stores result as `existing`
  - **17.4.** `[If]` `existing`
    - **17.4.1.** `[Sequence]` Assign `target`
      ```typescript
      target = await prisma.orm.public.Connection.where((c) => c.id.eq(existing.id)).update({ encryptedData, status: 'CONNECTED', errorMessage: null, displayName, avatarUrl, profileUrl, ...
      ```
  - **17.5.** `[Else]` Otherwise
    - **17.5.1.** `[Sequence]` Assign `target`
      ```typescript
      target = await prisma.orm.public.Connection.create({ userId, provider, authType: adapter.authType ?? 'OAUTH2', encryptedData, status: 'CONNECTED', externalId, ...
      ```
- **18.** `[If]` `!target`
  - **18.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Failed to connect account'
- **19.** `[Return]` 
  ```json
  {
    "success": true,
    "connection": "<this.formatConnection(target)>",
    "message": "Account connected successfully"
  }
  ```

#### `syncConnection(userId, connectionId)` (L631)
Triggers immediate synchronization of library, watchlist, or games from provider.

- **1.** `[Sequence]` Database `first` on `Connection` and stores it as `connection`
- **2.** `[If]` `!connection || connection.userId !== userId`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Connection not found'
- **3.** `[Sequence]` Calls `decryptConnectionData` and stores result as `credentials`
- **4.** `[Sequence]` Calls `getConnectionAdapter` and stores result as `adapter`
- **5.** `[Sequence]` Define `syncedItemsCount`, `rawItems`
  ```typescript
  let syncedItemsCount = 0
  const rawItems: any[] = []
  ```
- **6.** `[If]` `adapter.getLibrary`
  - **6.1.** `[Sequence]` Calls `adapter.getLibrary(credentials).catch` and stores result as `items`
  - **6.2.** `[If]` `Array.isArray(items)`
- **7.** `[Else]` Otherwise
  - **7.1.** `[If]` `adapter.getGames`
    - **7.1.1.** `[Sequence]` Calls `adapter.getGames(credentials).catch` and stores result as `games`
    - **7.1.2.** `[If]` `Array.isArray(games)`
      - **7.1.2.1.** `[Loop]` Iterate `const game` over `games`
- **8.** `[Sequence]` Assign `syncedItemsCount`
  ```typescript
  syncedItemsCount = rawItems.length
  ```
- **9.** `[If]` `rawItems.length > 0`
  - **9.1.** `[Try]` Try block
    - **9.1.1.** `[Sequence]` Define `mappedItems`
      ```typescript
      const mappedItems = rawItems.map((item: any) => { const prov = (item.provider || connection.provider || '').toUpperCase() const externalIds: Record<string, any> = { ...(item.externalIds || {}), } if (prov.includes('ANILIST')) externalIds.anilistId = item.externalId else if (prov.includes('MAL')) externalIds.malId = item.externalId ...)
      ```
    - **9.1.2.** `[Sequence]` Calls `BorealisListsServ.importUserLists` and stores result as `importSummary`
    - **9.1.3.** `[Sequence]` Calls `Array.from` and stores result as `touchedTypes`
    - **9.1.4.** `[Sequence]` Calls `ActivityServ.recordImportOrSyncSummaryActivity`
    - **9.1.5.** `[Sequence]` Calls `CarinaUsersServ.evaluateBadgesNonBlocking`
  - **9.2.** `[Catch]` Catch (`err`)
    - **9.2.1.** `[Sequence]` Calls `console.error`
- **10.** `[Sequence]` Database `update` on `Connection` and stores it as `updated`
- **11.** `[If]` `!updated`
  - **11.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Connection not found'
- **12.** `[Return]` 
  ```json
  {
    "success": true,
    "id": "<updated.id>",
    "lastSyncedAt": "<toDate(updated.lastSyncedAt!).toISOString()>",
    "syncedItemsCount": "<syncedItemsCount>",
    "message": "Library synced successfully"
  }
  ```

#### `testConnection(userId, connectionId)` (L760)
Tests connection health and validity against external provider API.

- **1.** `[Sequence]` Database `first` on `Connection` and stores it as `connection`
- **2.** `[If]` `!connection || connection.userId !== userId`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Connection not found'
- **3.** `[Sequence]` Calls `decryptConnectionData` and stores result as `credentials`
- **4.** `[Sequence]` Calls `getConnectionAdapter` and stores result as `adapter`
- **5.** `[Sequence]` Calls `adapter.testConnection` and stores result as `testResult`
- **6.** `[Sequence]` Define `newStatus`, `newErrorMessage`
  ```typescript
  const newStatus: ConnectionStatus = testResult.ok ? 'CONNECTED' : 'ERROR'
  const newErrorMessage = testResult.ok ? null : (testResult.message || 'Health check failed')
  ```
- **7.** `[Sequence]` Database `update` on `Connection`
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "ok": "<testResult.ok>",
    "status": "<newStatus>",
    "message": "<testResult.message || testResult.ok ? 'Connection active' : 'Connection failed'>",
    "profile": "<testResult.profile ?? null>"
  }
  ```

#### `searchProxy(userId, query)` (L797)
Dispatches media search query or direct ID lookup via third-party provider proxy.

- **1.** `[Sequence]` Define `rawProvider`, `provider`
  ```typescript
  const rawProvider = query.provider.trim().toUpperCase()
  const provider = rawProvider as ConnectionProvider
  ```
- **2.** `[If]` `rawProvider === 'LASTFM'`
  - **2.1.** `[Sequence]` Define `apiKey`, `searchQuery`
    ```typescript
    const apiKey = Bun.env.LASTFM_API_KEY?.trim()
    const searchQuery = query.q || query.id || ''.trim()
    ```
  - **2.2.** `[If]` `!apiKey || !searchQuery`
    - **2.2.1.** `[Return]` 
      ```json
      {
        "success": true,
        "provider": "LASTFM",
        "results": []
      }
      ```
  - **2.3.** `[Try]` Try block
    - **2.3.1.** `[Sequence]` Define `rawType`, `isAlbum`, `baseUrl`, `idCandidate`
      ```typescript
      const rawType = query.type?.toUpperCase()
      const isAlbum = rawType === 'ALBUM' || rawType === 'MUSIC_ALBUM'
      const baseUrl = 'https://ws.audioscrobbler.com/2.0/'
      const idCandidate = query.id || searchQuery.trim()
      ```
    - **2.3.2.** `[Sequence]` Calls `idCandidate.match` and stores result as `mbidMatch`
    - **2.3.3.** `[If]` `mbidMatch && mbidMatch[1]`
      - **2.3.3.1.** `[Sequence]` Define `mbid`, `method`
        ```typescript
        const mbid = mbidMatch[1]
        const method = isAlbum ? 'album.getInfo' : 'track.getInfo'
        ```
      - **2.3.3.2.** `[Sequence]` Calls `fetch` and stores result as `res`
      - **2.3.3.3.** `[If]` `res.ok`
        - **2.3.3.3.1.** `[Sequence]` Define `data`, `item`
          ```typescript
          const data = (await res.json()) as any
          const item = data?.album || data?.track
          ```
        - **2.3.3.3.2.** `[If]` `item`
          - **2.3.3.3.2.1.** `[Sequence]` Define `img`, `artistName`
            ```typescript
            const img = (item.image || item.album?.image) ?.slice() ?.reverse() ?.find((i: any) => i['#text']?.trim())?.['#text'] || null
            const artistName = typeof item.artist === 'string' ? item.artist : item.artist?.name || ''
            ```
          - **2.3.3.3.2.2.** `[Return]` 
            ```json
            {
              "success": true,
              "provider": "LASTFM",
              "results": [
                {
                  "id": "<item.mbid || item.url || mbid>",
                  "externalId": "<item.url || item.mbid || mbid>",
                  "provider": "LASTFM",
                  "mediaType": "<isAlbum ? 'MUSIC_ALBUM' : 'MUSIC_TRACK'>",
                  "format": "<isAlbum ? 'ALBUM' : 'TRACK'>",
                  "title": {
                    "userPreferred": "<`${item.name}${artistName ? ` - ${artistName}` : ''}`.trim()>",
                    "english": "<item.name>"
                  },
                  "coverImage": "<img ? { large: img, medium: img } : undefined>",
                  "url": "<item.url>"
                }
              ]
            }
            ```
    - **2.3.4.** `[If]` `query.id || idCandidate.includes('/music/')`
      - **2.3.4.1.** `[Sequence]` Calls `idCandidate.match` and stores result as `trackMatch`
      - **2.3.4.2.** `[Sequence]` Calls `idCandidate.match` and stores result as `albumMatch`
      - **2.3.4.3.** `[If]` `trackMatch && trackMatch[1] && trackMatch[2]`
        - **2.3.4.3.1.** `[Sequence]` Calls `decodeURIComponent` and stores result as `artist`
        - **2.3.4.3.2.** `[Sequence]` Calls `decodeURIComponent` and stores result as `trackTitle`
        - **2.3.4.3.3.** `[Sequence]` Calls `fetch` and stores result as `res`
        - **2.3.4.3.4.** `[If]` `res.ok`
          - **2.3.4.3.4.1.** `[Sequence]` Define `data`
            ```typescript
            const data = (await res.json()) as any
            ```
          - **2.3.4.3.4.2.** `[If]` `data?.track`
            - **2.3.4.3.4.2.1.** `[Sequence]` Define `tr`, `img`
              ```typescript
              const tr = data.track
              const img = tr.album?.image?.reverse()?.find((i: any) => i['#text']?.trim())?.['#text'] || null
              ```
            - **2.3.4.3.4.2.2.** `[Return]` 
              ```json
              {
                "success": true,
                "provider": "LASTFM",
                "results": [
                  {
                    "id": "<tr.mbid || tr.url || idCandidate>",
                    "externalId": "<tr.url || idCandidate>",
                    "provider": "LASTFM",
                    "mediaType": "MUSIC_TRACK",
                    "format": "TRACK",
                    "title": {
                      "userPreferred": "<`${tr.name} - ${tr.artist?.name || ''}`.trim()>",
                      "english": "<tr.name>"
                    },
                    "coverImage": "<img ? { large: img, medium: img } : undefined>",
                    "url": "<tr.url || idCandidate>"
                  }
                ]
              }
              ```
      - **2.3.4.4.** `[Else]` Otherwise
        - **2.3.4.4.1.** `[If]` `albumMatch && albumMatch[1] && albumMatch[2] && albumMatch[2] !== '_'`
          - **2.3.4.4.1.1.** `[Sequence]` Calls `decodeURIComponent` and stores result as `artist`
          - **2.3.4.4.1.2.** `[Sequence]` Calls `decodeURIComponent` and stores result as `albumTitle`
          - **2.3.4.4.1.3.** `[Sequence]` Calls `fetch` and stores result as `res`
          - **2.3.4.4.1.4.** `[If]` `res.ok`
            - **2.3.4.4.1.4.1.** `[Sequence]` Define `data`
              ```typescript
              const data = (await res.json()) as any
              ```
            - **2.3.4.4.1.4.2.** `[If]` `data?.album`
              - **2.3.4.4.1.4.2.1.** `[Sequence]` Define `al`, `img`
                ```typescript
                const al = data.album
                const img = al.image?.reverse()?.find((i: any) => i['#text']?.trim())?.['#text'] || null
                ```
              - **2.3.4.4.1.4.2.2.** `[Return]` 
                ```json
                {
                  "success": true,
                  "provider": "LASTFM",
                  "results": [
                    {
                      "id": "<al.mbid || al.url || idCandidate>",
                      "externalId": "<al.url || idCandidate>",
                      "provider": "LASTFM",
                      "mediaType": "MUSIC_ALBUM",
                      "format": "ALBUM",
                      "title": {
                        "userPreferred": "<`${al.name} - ${al.artist}`.trim()>",
                        "english": "<al.name>"
                      },
                      "coverImage": "<img ? { large: img, medium: img } : undefined>",
                      "url": "<al.url || idCandidate>"
                    }
                  ]
                }
                ```
    - **2.3.5.** `[Sequence]` Define `method`, `paramKey`
      ```typescript
      const method = isAlbum ? 'album.search' : 'track.search'
      const paramKey = isAlbum ? 'album' : 'track'
      ```
    - **2.3.6.** `[Sequence]` Calls `Math.min` and stores result as `limit`
    - **2.3.7.** `[Sequence]` Calls `fetch` and stores result as `res`
    - **2.3.8.** `[If]` `res.ok`
      - **2.3.8.1.** `[Sequence]` Define `data`, `list`, `normalized`, `results`
        ```typescript
        const data = (await res.json()) as any
        const list = isAlbum ? data?.results?.albummatches?.album : data?.results?.trackmatches?.track
        const normalized = Array.isArray(list) ? list : list ? [list] : []
        const results = normalized.map((item: any) => { const img = item.image?.reverse()?.find((i: any) => i['#text']?.trim())?.['#text'] || null return { id: item.mbid || item.url, externalId: item.url || item.mbid || `${item.artist} - ${item.name}`, provider: 'LASTFM', mediaType: isAlbum ? 'MUSIC_ALBUM' : 'MUSIC_TRACK', ...)
        ```
      - **2.3.8.2.** `[Return]` 
        ```json
        {
          "success": true,
          "provider": "LASTFM",
          "results": "<results>"
        }
        ```
  - **2.4.** `[Catch]` Catch (`err`)
    - **2.4.1.** `[Return]` 
      ```json
      {
        "success": true,
        "provider": "LASTFM",
        "results": []
      }
      ```
- **3.** `[Sequence]` Database `first` on `Connection` and stores it as `userConnRaw`
- **4.** `[Sequence]` Define `userConnection`, `searchQuery`, `isExplicitIdOnly`, `directItem`
  ```typescript
  const userConnection = userConnRaw ? { ...userConnRaw, expiresAt: userConnRaw.expiresAt ? toDate(userConnRaw.expiresAt) : null, } : null
  const searchQuery = query.q || ''.trim()
  const isExplicitIdOnly = Boolean(query.id) && !searchQuery || /^(?:id:|#|[a-z]+:|https?:\/\/|tt\d+$)/i.test(searchQuery)
  let directItem: any = null
  ```
- **5.** `[If]` `query.id`
  - **5.1.** `[Try]` Try block
    - **5.1.1.** `[Sequence]` Calls `SearchProxyManager.getById` and stores result as `direct`
    - **5.1.2.** `[If]` `direct`
      - **5.1.2.1.** `[Sequence]` Define `hasValidExt`, `hasValidId`, `finalId`
        ```typescript
        const hasValidExt = Boolean(direct.externalId) && direct.externalId !== 'undefined' && direct.externalId !== 'null'
        const hasValidId = Boolean(direct.id) && direct.id !== 'undefined' && direct.id !== 'null'
        const finalId = hasValidExt ? direct.externalId : hasValidId ? direct.id : query.id
        ```
      - **5.1.2.2.** `[Sequence]` Assign `directItem`
        ```typescript
        directItem = { ...direct, id: hasValidId ? direct.id : finalId, externalId: finalId, }
        ```
      - **5.1.2.3.** `[If]` `isExplicitIdOnly`
        - **5.1.2.3.1.** `[Return]` 
          ```json
          {
            "success": true,
            "provider": "<provider>",
            "results": [
              "<directItem>"
            ]
          }
          ```
  - **5.2.** `[Catch]` Catch (`err`)
- **6.** `[If]` `!searchQuery`
  - **6.1.** `[Return]` 
    ```json
    {
      "success": true,
      "provider": "<provider>",
      "results": "<directItem ? [directItem] : []>"
    }
    ```
- **7.** `[Sequence]` Calls `SearchProxyManager.search` and stores result as `results`
- **8.** `[Sequence]` Define `buildFallbackUrl`, `combinedRaw`, `cleanedResults`
  ```typescript
  const buildFallbackUrl = (prov: string, extId: string, mType?: string): string => { const isManga = mType === 'MANGA' || mType === 'BOOK' const isMovie = mType === 'MOVIE' const isTv = mType === 'TV' switch (prov) { case 'ANILIST': return `https://anilist.co/${isManga ? 'manga' : 'anime'}/${extId}` ...
  const combinedRaw = directItem ? [ directItem, ...(results || []).filter( (r) => String(r.externalId || r.id) !== String(directItem.externalId || directItem.id) ), ] ...
  const cleanedResults = combinedRaw.map((r, idx: number) => { const hasValidExt = Boolean(r.externalId) && r.externalId !== 'undefined' && r.externalId !== 'null' const hasValidId = Boolean(r.id) && r.id !== 'undefined' && r.id !== 'null' ...)
  ```
- **9.** `[Return]` 
  ```json
  {
    "success": true,
    "provider": "<provider>",
    "results": "<cleanedResults>"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `NotFound`, `BadRequest`
- [apps/borealis/lists/lists.serv.ts](../../borealis/lists/lists.serv.md) ([[apps/borealis/lists/lists.serv]]) — `BorealisListsServ`
- [apps/carina/activity/activity.serv.ts](../activity/activity.serv.md) ([[apps/carina/activity/activity.serv]]) — `ActivityServ`
- [apps/carina/users/users.serv.ts](../users/users.serv.md) ([[apps/carina/users/users.serv]]) — `CarinaUsersServ`

### External / Workspace Packages
- `node:crypto` — `crypto`
- `@NamelessLiberty/db` — `prisma`, `and`, `toDate`, `countOf`, `ConnectionProvider`, `ConnectionStatus`, `ConnectionAuthType`
- `@NamelessLiberty/connections` — `encryptConnectionData`, `decryptConnectionData`, `createOAuthStateToken`, `verifyOAuthStateToken`, `getConnectionAdapter`, `getSupportedProviders`, `SearchProxyManager`, `MediaType`, `OAuthTokens`, `ConnectionCredentials`

### Called By / Imported By
- [apps/carina/connections/connections.ctrl.ts](./connections.ctrl.md) ([[apps/carina/connections/connections.ctrl]]) — `CarinaConnectionsServ`
