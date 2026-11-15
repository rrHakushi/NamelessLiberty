# servarr-realtime.serv.ts

- **Source**: [`apps/servarr/realtime/servarr-realtime.serv.ts`](../../../../../../../apps/elysia/src/apps/servarr/realtime/servarr-realtime.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `ServarrRealtimeServ extends BaseService`

## Exported Types, Methods & Algorithms

### `type ServarrRealtimeApp` (L8)

### `class ServarrRealtimeServ` extends `BaseService` (L35)

Bridges Radarr v3 and Sonarr v5 ASP.NET Core SignalR `/signalr/messages` streams to authenticated browser sessions via `wsHub` without emitting UI notifications/toasts (silent state/query synchronization only).

#### `ensureInitialized()` (L39)

- **1.** `[If]` `this.initialized`
  - **1.1.** `[Return]`  — `void`
- **2.** `[Sequence]` Assign `this.initialized`
  ```typescript
  this.initialized = true
  ```
- **3.** `[Sequence]` Calls `wsHub.onUserDisconnected`

#### `makeKey(userId, app)`: `string` (L47)

- **1.** `[Return]`  — ``${userId}:${app}``

#### `getStatus(userId, app)` (L51)

- **1.** `[Sequence]` Calls `this.hubs.get` and stores result as `entry`
- **2.** `[Return]`  — `entry?.status ?? 'disconnected'`

#### `ensureConnected(userId, app, credentials)`: `Promise<'connected' | 'disconnected'>` (L56)

- **1.** `[Sequence]` Calls `this.ensureInitialized`
- **2.** `[Sequence]` Calls `this.makeKey` and stores result as `key`
- **3.** `[Sequence]` Define `normalizedHost`
  ```typescript
  const normalizedHost = credentials.hostUrl.replace(/\/+$/, '')
  ```
- **4.** `[Sequence]` Calls `this.hubs.get` and stores result as `existing`
- **5.** `[If]` `existing && !existing.stopped && existing.hostUrl === normalizedHost && existing.apiKey === credentials.apiKey && existing.ws && existing.ws.readyState === WebSocket.OPEN || existing.ws.readyState === WebSocket.CONNECTING`
  - **5.1.** `[Return]`  — `existing.status`
- **6.** `[If]` `existing`
  - **6.1.** `[Sequence]` Calls `this.teardownEntry`
- **7.** `[Sequence]` Define `entry`
  ```typescript
  const entry: ActiveHubEntry = { key, userId, app, provider: app === 'radarr' ? 'RADARR' : 'SONARR', hostUrl: normalizedHost, apiKey: credentials.apiKey, ...
  ```
- **8.** `[Sequence]` Calls `this.hubs.set`
- **9.** `[Return]`  — `entry.status`

#### `disconnectUser(userId, app)`: `void` (L100)

- **1.** `[Loop]` Iterate `const [key, entry]` over `this.hubs.entries()`
  - **1.1.** `[If]` `entry.userId === userId && !app || entry.app === app`
    - **1.1.1.** `[Sequence]` Calls `this.teardownEntry`
    - **1.1.2.** `[Sequence]` Calls `this.hubs.delete`

#### `teardownEntry(entry)`: `void` (L109)

- **1.** `[Sequence]` Assign `entry.stopped`
  ```typescript
  entry.stopped = true
  ```
- **2.** `[If]` `entry.reconnectTimer`
  - **2.1.** `[Sequence]` Calls `clearTimeout`
  - **2.2.** `[Sequence]` Assign `entry.reconnectTimer`
    ```typescript
    entry.reconnectTimer = null
    ```
- **3.** `[If]` `entry.ws`
  - **3.1.** `[Try]` Try block
    - **3.1.1.** `[Sequence]` Calls `entry.ws.close`
  - **3.2.** `[Catch]` Catch (`err`)
  - **3.3.** `[Sequence]` Assign `entry.ws`
    ```typescript
    entry.ws = null
    ```
- **4.** `[Sequence]` Assign `entry.status`
  ```typescript
  entry.status = 'disconnected'
  ```

#### `emitStatus(entry, status)` (L124)

- **1.** `[If]` `entry.status === status`
  - **1.1.** `[Return]`  — `void`
- **2.** `[Sequence]` Assign `entry.status`
  ```typescript
  entry.status = status
  ```
- **3.** `[Sequence]` Calls `wsHub.sendToUser`

#### `connectEntry(entry)`: `Promise<void>` (L137)

- **1.** `[If]` `entry.stopped`
  - **1.1.** `[Return]`  — `void`
- **2.** `[If]` `!wsHub.hasUserConnections(entry.userId)`
  - **2.1.** `[Sequence]` Calls `this.teardownEntry`
  - **2.2.** `[Sequence]` Calls `this.hubs.delete`
  - **2.3.** `[Return]`  — `void`
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Define `negotiateUrl`
    ```typescript
    const negotiateUrl = `${entry.hostUrl}/signalr/messages/negotiate?negotiateVersion=1`
    ```
  - **3.2.** `[Sequence]` Calls `fetch` and stores result as `negRes`
  - **3.3.** `[If]` `!negRes.ok`
    - **3.3.1.** `[Error]` Throws `Error` — `SignalR negotiate failed (${negRes.status})`
  - **3.4.** `[Sequence]` Define `negData`, `token`
    ```typescript
    const negData = (await negRes.json()) as { connectionToken?: string connectionId?: string }
    const token = negData.connectionToken || negData.connectionId
    ```
  - **3.5.** `[If]` `!token`
    - **3.5.1.** `[Error]` Throws `Error` — 'SignalR negotiate returned no connectionToken'
  - **3.6.** `[Sequence]` Define `wsBase`, `wsUrl`, `ws`
    ```typescript
    const wsBase = entry.hostUrl.replace(/^http/i, 'ws')
    const wsUrl = `${wsBase}/signalr/messages?id=${encodeURIComponent(token)}&access_token=${encodeURIComponent(entry.apiKey)}`
    const ws = new WebSocket(wsUrl, { headers: { 'X-Api-Key': entry.apiKey, }, } as any)
    ```
  - **3.7.** `[Sequence]` Assign `entry.ws`
    ```typescript
    entry.ws = ws
    ```
  - **3.8.** `[Sequence]` Assign `ws.onopen`
    ```typescript
    ws.onopen = () => { if (entry.stopped || entry.ws !== ws) return entry.attempts = 0 ws.send( JSON.stringify({ protocol: 'json', version: 1 }) + RECORD_SEPARATOR ) this.emitStatus(entry, 'connected') ...
    ```
  - **3.9.** `[Sequence]` Assign `ws.onmessage`
    ```typescript
    ws.onmessage = (event) => { if (entry.stopped || entry.ws !== ws) return const raw = typeof event.data === 'string' ? event.data : String(event.data) const frames = raw.split(RECORD_SEPARATOR).filter(Boolean) for (const frame of frames) { try { const msg = JSON.parse(frame) as { ...
    ```
  - **3.10.** `[Sequence]` Assign `ws.onclose`
    ```typescript
    ws.onclose = () => { if (entry.ws !== ws) return entry.ws = null this.emitStatus(entry, 'disconnected') if (!entry.stopped && wsHub.hasUserConnections(entry.userId)) { this.scheduleReconnect(entry) } ...
    ```
  - **3.11.** `[Sequence]` Assign `ws.onerror`
    ```typescript
    ws.onerror = () => { // onclose handles reconnect }
    ```
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Sequence]` Calls `this.emitStatus`
  - **4.2.** `[If]` `!entry.stopped && wsHub.hasUserConnections(entry.userId)`
    - **4.2.1.** `[Sequence]` Calls `this.scheduleReconnect`

#### `scheduleReconnect(entry)` (L252)

- **1.** `[If]` `entry.stopped || entry.reconnectTimer`
  - **1.1.** `[Return]`  — `void`
- **2.** `[Sequence]` Calls `Math.min` and stores result as `delay`
- **3.** `[Sequence]` Assign `entry.attempts`
  ```typescript
  entry.attempts += 1
  ```
- **4.** `[Sequence]` Assign `entry.reconnectTimer`
  ```typescript
  entry.reconnectTimer = setTimeout(() => { entry.reconnectTimer = null void this.connectEntry(entry) }, delay)
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/ws/ws.serv.ts](../../../core/ws/ws.serv.md) ([[core/ws/ws.serv]]) — `wsHub`

### External / Workspace Packages
- `@NamelessLiberty/logger` — `LogFactory`

### Called By / Imported By
- [apps/servarr/extended/servarr-extended.serv.ts](../extended/servarr-extended.serv.md) ([[apps/servarr/extended/servarr-extended.serv]]) — `ServarrRealtimeServ`
