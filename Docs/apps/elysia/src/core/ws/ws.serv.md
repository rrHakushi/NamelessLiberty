# ws.serv.ts

- **Source**: [`core/ws/ws.serv.ts`](../../../../../../apps/elysia/src/core/ws/ws.serv.ts)
- **Layer / Role**: Service (Business Logic)

## Exported Types, Methods & Algorithms

### `interface IrisWebSocket` (L6)

### `interface WsMessagePayload` (L15)

### `class WsServ` (L22)

#### `getInstance()`: `WsServ` (L38)

- **1.** `[If]` `!WsServ.instance`
  - **1.1.** `[Sequence]` Assign `WsServ.instance`
    ```typescript
    WsServ.instance = new WsServ()
    ```
- **2.** `[Return]`  — `WsServ.instance`

#### `hasConnection(ws)`: `boolean` (L45)

- **1.** `[Return]`  — `this.connectionUsers.has(ws)`

#### `getUserId(ws)`: `string | undefined` (L49)

- **1.** `[Return]`  — `this.connectionUsers.get(ws)`

#### `hasUserConnections(userId)`: `boolean` (L53)

- **1.** `[Sequence]` Calls `this.userConnections.get` and stores result as `sockets`
- **2.** `[Return]`  — `Boolean(sockets && sockets.size > 0)`

#### `onUserDisconnected(listener)`: `() => void` (L58)

- **1.** `[Sequence]` Calls `this.userDisconnectListeners.add`
- **2.** `[Return]`  — `() => { this.userDisconnectListeners.delete(listener) }`

#### `register(ws, userId)`: `void` (L68)
Registers a newly opened WebSocket connection.

- **1.** `[If]` `userId && typeofuserId === 'string' && userId.trim().length > 0`
  - **1.1.** `[Sequence]` Define `uid`
    ```typescript
    const uid = userId.trim()
    ```
  - **1.2.** `[Sequence]` Calls `this.connectionUsers.set`
  - **1.3.** `[Sequence]` Calls `this.userConnections.get` and stores result as `sockets`
  - **1.4.** `[If]` `!sockets`
    - **1.4.1.** `[Sequence]` Assign `sockets`
      ```typescript
      sockets = new Set()
      ```
    - **1.4.2.** `[Sequence]` Calls `this.userConnections.set`
  - **1.5.** `[Sequence]` Calls `sockets.add`
  - **1.6.** `[Sequence]` Calls `this.subscribe`
- **2.** `[If]` `!this.connectionChannels.has(ws)`
  - **2.1.** `[Sequence]` Calls `this.connectionChannels.set`

#### `unregister(ws)`: `void` (L91)
Unregisters and cleans up a closed WebSocket connection.

- **1.** `[Sequence]` Calls `this.connectionUsers.get` and stores result as `userId`
- **2.** `[If]` `userId`
  - **2.1.** `[Sequence]` Calls `this.userConnections.get` and stores result as `sockets`
  - **2.2.** `[If]` `sockets`
    - **2.2.1.** `[Sequence]` Calls `sockets.delete`
    - **2.2.2.** `[If]` `sockets.size === 0`
      - **2.2.2.1.** `[Sequence]` Calls `this.userConnections.delete`
      - **2.2.2.2.** `[Loop]` Iterate `const listener` over `this.userDisconnectListeners`
        - **2.2.2.2.1.** `[Try]` Try block
          - **2.2.2.2.1.1.** `[Sequence]` Calls `listener`
        - **2.2.2.2.2.** `[Catch]` Catch (`err`)
  - **2.3.** `[Sequence]` Calls `this.connectionUsers.delete`
- **3.** `[Sequence]` Calls `this.connectionChannels.get` and stores result as `channels`
- **4.** `[If]` `channels`
  - **4.1.** `[Loop]` Iterate `const channel` over `channels`
    - **4.1.1.** `[Sequence]` Calls `this.channelSubscriptions.get` and stores result as `subscribers`
    - **4.1.2.** `[If]` `subscribers`
      - **4.1.2.1.** `[Sequence]` Calls `subscribers.delete`
      - **4.1.2.2.** `[If]` `subscribers.size === 0`
        - **4.1.2.2.1.** `[Sequence]` Calls `this.channelSubscriptions.delete`
  - **4.2.** `[Sequence]` Calls `this.connectionChannels.delete`

#### `subscribe(ws, channel)`: `void` (L127)
Subscribes a WebSocket connection to a specific channel/topic.

- **1.** `[Sequence]` Calls `this.channelSubscriptions.get` and stores result as `subscribers`
- **2.** `[If]` `!subscribers`
  - **2.1.** `[Sequence]` Assign `subscribers`
    ```typescript
    subscribers = new Set()
    ```
  - **2.2.** `[Sequence]` Calls `this.channelSubscriptions.set`
- **3.** `[Sequence]` Calls `subscribers.add`
- **4.** `[Sequence]` Calls `this.connectionChannels.get` and stores result as `userChans`
- **5.** `[If]` `!userChans`
  - **5.1.** `[Sequence]` Assign `userChans`
    ```typescript
    userChans = new Set()
    ```
  - **5.2.** `[Sequence]` Calls `this.connectionChannels.set`
- **6.** `[Sequence]` Calls `userChans.add`

#### `unsubscribe(ws, channel)`: `void` (L146)
Unsubscribes a WebSocket connection from a channel.

- **1.** `[Sequence]` Calls `this.channelSubscriptions.get` and stores result as `subscribers`
- **2.** `[If]` `subscribers`
  - **2.1.** `[Sequence]` Calls `subscribers.delete`
  - **2.2.** `[If]` `subscribers.size === 0`
    - **2.2.1.** `[Sequence]` Calls `this.channelSubscriptions.delete`
- **3.** `[Sequence]` Calls `this.connectionChannels.get` and stores result as `userChans`
- **4.** `[If]` `userChans`
  - **4.1.** `[Sequence]` Calls `userChans.delete`

#### `send(ws, event, data, channel)`: `void` (L164)
Sends an event payload to a single specific WebSocket connection.

- **1.** `[Try]` Try block
  - **1.1.** `[Sequence]` Define `payload`
    ```typescript
    const payload: WsMessagePayload = { event, data, channel, timestamp: Date.now(), }
    ```
  - **1.2.** `[Sequence]` Calls `ws.send`
- **2.** `[Catch]` Catch (`err`)
  - **2.1.** `[Warning]` Logs warning — `Error sending message over WebSocket: ${err}`

#### `sendToUser(userId, event, data)`: `void` (L186)
Sends a targeted real-time event to all active sessions of a given user.

- **1.** `[Sequence]` Calls `this.userConnections.get` and stores result as `sockets`
- **2.** `[If]` `!sockets || sockets.size === 0`
  - **2.1.** `[Return]`  — `void`
- **3.** `[Loop]` Iterate `const ws` over `sockets`
  - **3.1.** `[Sequence]` Calls `this.send`

#### `broadcastChannel(channel, event, data, excludeWs)`: `void` (L198)
Broadcasts an event to all subscribers of a channel.

- **1.** `[Sequence]` Calls `this.channelSubscriptions.get` and stores result as `subscribers`
- **2.** `[If]` `!subscribers || subscribers.size === 0`
  - **2.1.** `[Return]`  — `void`
- **3.** `[Loop]` Iterate `const ws` over `subscribers`
  - **3.1.** `[If]` `excludeWs && ws === excludeWs`
  - **3.2.** `[Sequence]` Calls `this.send`

#### `broadcast(event, data)`: `void` (L216)
Broadcasts an event to all active WebSocket connections across all channels.

- **1.** `[Loop]` Iterate `const ws` over `this.connectionUsers.keys()`
  - **1.1.** `[Sequence]` Calls `this.send`
- **2.** `[Sequence]` Calls `this.broadcastChannel`

#### `handleMessage(ws, rawMessage)`: `Promise<void>` (L226)
Handles incoming message frames from clients.

- **1.** `[Try]` Try block
  - **1.1.** `[Sequence]` Define `parsed`
    ```typescript
    let parsed: unknown = rawMessage
    ```
  - **1.2.** `[If]` `typeofrawMessage === 'string'`
    - **1.2.1.** `[Sequence]` Assign `parsed`
      ```typescript
      parsed = JSON.parse(rawMessage)
      ```
  - **1.3.** `[If]` `!parsed || typeofparsed !== 'object'`
    - **1.3.1.** `[Return]`  — `void`
  - **1.4.** `[Sequence]` Define `msg`
    ```typescript
    const msg = parsed as Record<string, unknown>
    ```
  - **1.5.** `[If]` `msg.type === 'auth' && typeofmsg.userId === 'string' && Bun.env.BUN_ENV === 'test'`
    - **1.5.1.** `[Sequence]` Define `uid`, `conn`
      ```typescript
      const uid = msg.userId.trim()
      const conn = ws as any.raw ?? ws
      ```
    - **1.5.2.** `[Sequence]` Calls `this.register`
    - **1.5.3.** `[Sequence]` Calls `this.send`
    - **1.5.4.** `[Return]`  — `void`
  - **1.6.** `[If]` `msg.type === 'auth' && typeofmsg.token === 'string' && msg.token.trim().length > 0`
    - **1.6.1.** `[Sequence]` Define `secret`
      ```typescript
      const secret = Bun.env.JWT_SECRET
      ```
    - **1.6.2.** `[If]` `secret`
      - **1.6.2.1.** `[Try]` Try block
        - **1.6.2.1.1.** `[Sequence]` Calls `new TextEncoder().encode` and stores result as `secretKey`
        - **1.6.2.1.2.** `[Sequence]` Calls `jwtVerify` and stores result as `{ payload }`
        - **1.6.2.1.3.** `[If]` `payload && payload.id && typeofpayload.id === 'string'`
          - **1.6.2.1.3.1.** `[Sequence]` Define `uid`, `conn`, `alreadyRegistered`
            ```typescript
            const uid = payload.id.trim()
            const conn = ws as any.raw ?? ws
            const alreadyRegistered = this.connectionUsers.get(conn) === uid
            ```
          - **1.6.2.1.3.2.** `[Sequence]` Calls `this.register`
          - **1.6.2.1.3.3.** `[Sequence]` Calls `this.send`
          - **1.6.2.1.3.4.** `[If]` `!alreadyRegistered`
          - **1.6.2.1.3.5.** `[Return]`  — `void`
      - **1.6.2.2.** `[Catch]` Catch (`err`)
        - **1.6.2.2.1.** `[Sequence]` Calls `this.send`
        - **1.6.2.2.2.** `[Return]`  — `void`
  - **1.7.** `[If]` `msg.type === 'ping'`
    - **1.7.1.** `[Sequence]` Calls `this.send`
    - **1.7.2.** `[Return]`  — `void`
  - **1.8.** `[If]` `msg.type === 'subscribe' && typeofmsg.channel === 'string'`
    - **1.8.1.** `[Sequence]` Define `channel`
      ```typescript
      const channel = msg.channel.trim()
      ```
    - **1.8.2.** `[Sequence]` Calls `this.getUserId` and stores result as `currentUid`
    - **1.8.3.** `[If]` `channel.startsWith('user:')`
      - **1.8.3.1.** `[Sequence]` Define `targetUid`
        ```typescript
        const targetUid = channel.slice(5)
        ```
      - **1.8.3.2.** `[If]` `!currentUid || currentUid !== targetUid`
        - **1.8.3.2.1.** `[Sequence]` Calls `this.send`
        - **1.8.3.2.2.** `[Return]`  — `void`
    - **1.8.4.** `[Sequence]` Calls `this.subscribe`
    - **1.8.5.** `[Sequence]` Calls `this.send`
    - **1.8.6.** `[Return]`  — `void`
  - **1.9.** `[If]` `msg.type === 'unsubscribe' && typeofmsg.channel === 'string'`
    - **1.9.1.** `[Sequence]` Calls `this.unsubscribe`
    - **1.9.2.** `[Sequence]` Calls `this.send`
    - **1.9.3.** `[Return]`  — `void`
- **2.** `[Catch]` Catch (`err`)

### `const wsHub` (L310)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- _None_

### External / Workspace Packages
- `@NamelessLiberty/logger` — `LogFactory`
- `jose` — `jwtVerify`

### Called By / Imported By
- [apps/carina/notifications/notifications.serv.ts](../../apps/carina/notifications/notifications.serv.md) ([[apps/carina/notifications/notifications.serv]]) — `wsHub`
- [apps/servarr/realtime/servarr-realtime.serv.ts](../../apps/servarr/realtime/servarr-realtime.serv.md) ([[apps/servarr/realtime/servarr-realtime.serv]]) — `wsHub`
- [server.ts](../../server.md) ([[server]]) — `wsHub`
