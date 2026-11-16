# tesseract.serv.ts

- **Source**: [`apps/tesseract/signaling/tesseract.serv.ts`](../../../../../../../apps/elysia/src/apps/tesseract/signaling/tesseract.serv.ts)
- **Layer / Role**: Service (Business Logic)

## Exported Types, Methods & Algorithms

### `interface TesseractPeerTransport` (L30)

### `function isPrivateLanOrigin` (L42)

- **1.** `[Try]` Try block
  - **1.1.** `[Sequence]` Define `parsed`, `host`
    ```typescript
    const parsed = new URL(originUrl)
    const host = parsed.hostname.toLowerCase()
    ```
  - **1.2.** `[If]` `host === 'localhost' || host.endsWith('.local')`
    - **1.2.1.** `[Return]`  — `true`
  - **1.3.** `[Return]`  — `isPrivateOrLoopbackIp(host)`
- **2.** `[Catch]` Catch (`err`)
  - **2.1.** `[Return]`  — `false`

### `function extractClientIp` (L58)

Extracts client IP from forwarded headers only when the immediate peer is a trusted proxy.

- **1.** `[Sequence]` Calls `extractTrustedClientIp` and stores result as `resolved`
- **2.** `[Return]`  — `resolved === 'unknown' ? '' : resolved`

### `function resolveLanLobbyId` (L86)

- **1.** `[Sequence]` Calls `normalizeIpAddress` and stores result as `ip`
- **2.** `[If]` `!ip`
  - **2.1.** `[Return]` 
    ```json
    {
      "roomId": "<`lan:isolated:${crypto.randomUUID()}`>",
      "lanScope": "nat"
    }
    ```
- **3.** `[If]` `isPrivateOrLoopbackIp(ip)`
  - **3.1.** `[Return]` 
    ```json
    {
      "roomId": "lan:local",
      "lanScope": "lan"
    }
    ```
- **4.** `[If]` `ip.includes(':')`
  - **4.1.** `[Return]` 
    ```json
    {
      "roomId": "<`lan:nat:${getIpv6Prefix64(ip)}`>",
      "lanScope": "nat"
    }
    ```
- **5.** `[Return]` 
  ```json
  {
    "roomId": "<`lan:nat:${ip}`>",
    "lanScope": "nat"
  }
  ```

### `class TesseractServ` (L412)

#### `getInstance()`: `TesseractServ` (L423)

- **1.** `[If]` `!TesseractServ.instance`
  - **1.1.** `[Sequence]` Assign `TesseractServ.instance`
    ```typescript
    TesseractServ.instance = new TesseractServ()
    ```
- **2.** `[Return]`  — `TesseractServ.instance`

#### `getStore()`: `TesseractStore` (L430)

- **1.** `[If]` `this.store`
  - **1.1.** `[Return]`  — `this.store`
- **2.** `[Sequence]` Define `onBus`, `isTest`, `redisHost`, `redisPort`
  ```typescript
  const onBus = (envelope: BusEnvelope) => this.handleBusEnvelope(envelope)
  const isTest = Bun.env.BUN_ENV === 'test' || Bun.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'test'
  const redisHost = Bun.env.REDIS_HOST
  const redisPort = Bun.env.REDIS_PORT
  ```
- **3.** `[If]` `!isTest && redisHost && redisPort`
  - **3.1.** `[Sequence]` Assign `this.store`
    ```typescript
    this.store = new RedisTesseractStore( { host: redisHost, port: Number(redisPort), password: Bun.env.REDIS_PASSWORD || undefined, db: Bun.env.REDIS_DB ? Number(Bun.env.REDIS_DB) : 0, }, ...
    ```
- **4.** `[Else]` Otherwise
  - **4.1.** `[Sequence]` Assign `this.store`
    ```typescript
    this.store = new MemoryTesseractStore(onBus)
    ```
- **5.** `[If]` `!this.cleanupTimer && !isTest`
  - **5.1.** `[Sequence]` Assign `this.cleanupTimer`
    ```typescript
    this.cleanupTimer = setInterval(() => { void this.pruneActiveRooms() }, 20_000)
    ```
- **6.** `[Return]`  — `this.store`

#### `shutdown()`: `Promise<void>` (L464)

- **1.** `[If]` `this.cleanupTimer`
  - **1.1.** `[Sequence]` Calls `clearInterval`
  - **1.2.** `[Sequence]` Assign `this.cleanupTimer`
    ```typescript
    this.cleanupTimer = null
    ```
- **2.** `[If]` `this.store instanceof RedisTesseractStore`
  - **2.1.** `[Sequence]` Calls `this.store.disconnect`
- **3.** `[Sequence]` Assign `this.store`
  ```typescript
  this.store = null
  ```

#### `resetForTests()`: `void` (L475)

- **1.** `[Loop]` Iterate `const [peerId, session]` over `this.localPeers.entries()`
  - **1.1.** `[Try]` Try block
  - **1.2.** `[Catch]` Catch (`err`)
  - **1.3.** `[Sequence]` Calls `this.localPeers.delete`
- **2.** `[Sequence]` Calls `this.tabIdToPeerId.clear`
- **3.** `[Sequence]` Calls `this.peerIdToTabId.clear`
- **4.** `[If]` `this.store instanceof MemoryTesseractStore`
  - **4.1.** `[Sequence]` Calls `this.store.reset`
- **5.** `[Else]` Otherwise
  - **5.1.** `[Sequence]` Assign `this.store`
    ```typescript
    this.store = null
    ```

#### `handleBusEnvelope(envelope)`: `void` (L491)

- **1.** `[If]` `envelope.event.event === 'peer:updated'`
  - **1.1.** `[Sequence]` Define `updatedPeer`
    ```typescript
    const updatedPeer = envelope.event.data.peer
    ```
  - **1.2.** `[Sequence]` Calls `this.localPeers.get` and stores result as `localSession`
  - **1.3.** `[If]` `localSession`
    - **1.3.1.** `[Sequence]` Assign `localSession.peer`
      ```typescript
      localSession.peer = updatedPeer
      ```
- **2.** `[Else]` Otherwise
  - **2.1.** `[If]` `envelope.event.event === 'peer:left'`
    - **2.1.1.** `[Sequence]` Define `leftPeerId`
      ```typescript
      const leftPeerId = envelope.event.data.peerId
      ```
    - **2.1.2.** `[Sequence]` Calls `this.localPeers.get` and stores result as `localSession`
    - **2.1.3.** `[If]` `localSession`
      - **2.1.3.1.** `[Sequence]` Calls `this.localPeers.delete`
      - **2.1.3.2.** `[Try]` Try block
      - **2.1.3.3.** `[Catch]` Catch (`err`)
- **3.** `[Sequence]` Calls `JSON.stringify` and stores result as `serialized`
- **4.** `[If]` `envelope.targetPeerId`
  - **4.1.** `[Sequence]` Calls `this.localPeers.get` and stores result as `session`
  - **4.2.** `[If]` `session`
    - **4.2.1.** `[Try]` Try block
      - **4.2.1.1.** `[Sequence]` Calls `session.transport.send`
    - **4.2.2.** `[Catch]` Catch (`err`)
      - **4.2.2.1.** `[Warning]` Logs warning — `Failed sending to peer ${envelope.targetPeerId}: ${err}`
  - **4.3.** `[Return]`  — `void`
- **5.** `[If]` `envelope.targetRoomId`
  - **5.1.** `[Loop]` Iterate `const session` over `this.localPeers.values()`
    - **5.1.1.** `[If]` `session.roomId !== envelope.targetRoomId`
    - **5.1.2.** `[If]` `envelope.excludePeerId && session.peer.peerId === envelope.excludePeerId`
    - **5.1.3.** `[Try]` Try block
      - **5.1.3.1.** `[Sequence]` Calls `session.transport.send`
    - **5.1.4.** `[Catch]` Catch (`err`)
      - **5.1.4.1.** `[Warning]` Logs warning — `Failed broadcasting to peer ${session.peer.peerId}: ${err}`

#### `pruneActiveRooms()`: `Promise<void>` (L539)

- **1.** `[Sequence]` Calls `this.getStore` and stores result as `store`
- **2.** `[Sequence]` Define `roomIds`
  ```typescript
  const roomIds = new Set<string>()
  ```
- **3.** `[Loop]` Iterate `const session` over `this.localPeers.values()`
  - **3.1.** `[Sequence]` Calls `roomIds.add`
- **4.** `[Loop]` Iterate `const roomId` over `roomIds`
  - **4.1.** `[Try]` Try block
    - **4.1.1.** `[Sequence]` Calls `store.listAlivePeers` and stores result as `{ prunedPeerIds }`
    - **4.1.2.** `[Loop]` Iterate `const prunedId` over `prunedPeerIds`
      - **4.1.2.1.** `[Sequence]` Calls `store.publishBus`
  - **4.2.** `[Catch]` Catch (`err`)

#### `resolveAuthenticatedPeerUser(request)`: `Promise<TesseractPeerUser | null>` (L563)

- **1.** `[Try]` Try block
  - **1.1.** `[Sequence]` Calls `resolveSessionFromRequest` and stores result as `{ user }`
  - **1.2.** `[If]` `!user`
    - **1.2.1.** `[Return]`  — `null`
  - **1.3.** `[Sequence]` Define `displayName`, `avatarUrl`
    ```typescript
    let displayName = user.username
    let avatarUrl: string | null = null
    ```
  - **1.4.** `[Try]` Try block
    - **1.4.1.** `[Sequence]` Database `first` on `User` and stores it as `dbUser`
    - **1.4.2.** `[If]` `dbUser`
      - **1.4.2.1.** `[Sequence]` Calls `getProfileCustomization` and stores result as `profile`
      - **1.4.2.2.** `[Sequence]` Assign `displayName`
        ```typescript
        displayName = profile.displayName || dbUser.username
        ```
      - **1.4.2.3.** `[Sequence]` Assign `avatarUrl`
        ```typescript
        avatarUrl = profile.avatarUrl ?? null
        ```
  - **1.5.** `[Catch]` Catch (`err`)
  - **1.6.** `[Return]` 
    ```json
    {
      "id": "<user.id>",
      "username": "<user.username>",
      "displayName": "<displayName>",
      "avatarUrl": "<avatarUrl>"
    }
    ```
- **2.** `[Catch]` Catch (`err`)
  - **2.1.** `[Return]`  — `null`

#### `getIdentity(request, remoteAddress)` (L597)

- **1.** `[Sequence]` Calls `extractClientIp` and stores result as `clientIp`
- **2.** `[Sequence]` Calls `resolveLanLobbyId` and stores result as `{ roomId, lanScope }`
- **3.** `[Sequence]` Calls `this.resolveAuthenticatedPeerUser` and stores result as `user`
- **4.** `[Return]` 
  ```json
  {
    "isAuthenticated": "<user !== null>",
    "user": "<user>",
    "lanRoomId": "<roomId>",
    "lanScope": "<lanScope>"
  }
  ```

#### `connectPeer(params)`: `Promise<{ peerId: string; sseSecret?: string } | null>` (L610)

- **1.** `[Sequence]` Define `isCancelled`
  ```typescript
  const isCancelled = () => Boolean( params.isAborted?.() || (params.transportKey && this.closedTransportKeys.has(params.transportKey)) )
  ```
- **2.** `[If]` `isCancelled()`
  - **2.1.** `[Return]`  — `null`
- **3.** `[Sequence]` Calls `this.getStore` and stores result as `store`
- **4.** `[Sequence]` Calls `this.resolveAuthenticatedPeerUser` and stores result as `verifiedUser`
- **5.** `[If]` `isCancelled()`
  - **5.1.** `[Return]`  — `null`
- **6.** `[Sequence]` Calls `extractClientIp` and stores result as `clientIp`
- **7.** `[Sequence]` Calls `resolveLanLobbyId` and stores result as `{ roomId, lanScope }`
- **8.** `[Sequence]` Define `roomInfo`
  ```typescript
  const roomInfo: TesseractRoomInfo = { roomId, lanScope, }
  ```
- **9.** `[Sequence]` Calls `sanitizeClientId` and stores result as `tabId`
- **10.** `[If]` `tabId`
  - **10.1.** `[Sequence]` Calls `this.tabIdToPeerId.get` and stores result as `previousPeerId`
  - **10.2.** `[If]` `previousPeerId`
    - **10.2.1.** `[Sequence]` Calls `this.disconnectPeer`
- **11.** `[If]` `isCancelled()`
  - **11.1.** `[Return]`  — `null`
- **12.** `[Sequence]` Calls `crypto.randomUUID` and stores result as `peerId`
- **13.** `[Sequence]` Calls `sanitizeClientId` and stores result as `deviceId`
- **14.** `[Sequence]` Define `defaultAlias`, `peer`
  ```typescript
  const defaultAlias = verifiedUser?.displayName ? `${verifiedUser.displayName}'s ${params.os || 'Device'}` : `${params.os || 'Local'} ${params.browser || 'Browser'}`
  const peer: TesseractPeer = { peerId, deviceId, alias: sanitizeAlias(params.alias, defaultAlias), deviceType: normalizeDeviceType(params.deviceType), os: (params.os || 'Unknown OS').slice(0, 32), browser: (params.browser || 'Browser').slice(0, 32), ...
  ```
- **15.** `[Sequence]` Calls `store.putPeer`
- **16.** `[Sequence]` Define `sseSecret`
  ```typescript
  let sseSecret: string | undefined
  ```
- **17.** `[If]` `params.issueSseSecret`
  - **17.1.** `[Sequence]` Assign `sseSecret`
    ```typescript
    sseSecret = randomBytes(24).toString('hex')
    ```
  - **17.2.** `[Sequence]` Calls `store.setSseSecret`
- **18.** `[If]` `isCancelled()`
  - **18.1.** `[Sequence]` Calls `store.removePeer`
  - **18.2.** `[Return]`  — `null`
- **19.** `[Sequence]` Calls `this.localPeers.set`
- **20.** `[If]` `params.transportKey`
  - **20.1.** `[Sequence]` Calls `this.socketKeyToPeerId.set`
- **21.** `[If]` `tabId`
  - **21.1.** `[Sequence]` Calls `this.tabIdToPeerId.set`
  - **21.2.** `[Sequence]` Calls `this.peerIdToTabId.set`
- **22.** `[Sequence]` Calls `store.listAlivePeers` and stores result as `{ alive, prunedPeerIds }`
- **23.** `[Loop]` Iterate `const prunedId` over `prunedPeerIds`
  - **23.1.** `[Sequence]` Calls `store.publishBus`
- **24.** `[Sequence]` Define `existingPeers`, `joinedEvent`
  ```typescript
  const existingPeers = alive.filter((p) => p.peerId !== peerId)
  const joinedEvent: TesseractServerEvent = { event: 'room:joined', data: { selfPeerId: peerId, selfPeer: peer, room: roomInfo, peers: existingPeers, ...
  ```
- **25.** `[Sequence]` Calls `params.transport.send`
- **26.** `[Sequence]` Calls `store.publishBus`
- **27.** `[Return]` 
  ```json
  {
    "peerId": "<peerId>",
    "sseSecret": "<sseSecret>"
  }
  ```

#### `getPeerIdByTransportKey(key)`: `string | undefined` (L742)

- **1.** `[Return]`  — `this.socketKeyToPeerId.get(key)`

#### `verifySseSignalAccess(peerId, secret)`: `Promise<boolean>` (L746)

- **1.** `[If]` `!peerId || !secret`
  - **1.1.** `[Return]`  — `false`
- **2.** `[Sequence]` Calls `this.getStore` and stores result as `store`
- **3.** `[Sequence]` Calls `store.getSseSecret` and stores result as `expected`
- **4.** `[If]` `!expected`
  - **4.1.** `[Return]`  — `false`
- **5.** `[Sequence]` Calls `Buffer.from` and stores result as `a`
- **6.** `[Sequence]` Calls `Buffer.from` and stores result as `b`
- **7.** `[If]` `a.length !== b.length`
  - **7.1.** `[Return]`  — `false`
- **8.** `[Return]`  — `timingSafeEqual(a, b)`

#### `handleClientSignal(peerId, rawMessage)`: `Promise<void>` (L757)

- **1.** `[Sequence]` Calls `this.getStore` and stores result as `store`
- **2.** `[Sequence]` Calls `this.localPeers.get` and stores result as `session`
- **3.** `[Sequence]` Define `peer`, `roomId`
  ```typescript
  let peer: TesseractPeer | null = session?.peer ?? null
  let roomId: string | null = session?.roomId ?? null
  ```
- **4.** `[If]` `!session`
  - **4.1.** `[Sequence]` Assign `roomId`
    ```typescript
    roomId = await store.getPeerRoomId(peerId)
    ```
  - **4.2.** `[If]` `!roomId`
    - **4.2.1.** `[Return]`  — `void`
  - **4.3.** `[Sequence]` Assign `peer`
    ```typescript
    peer = await store.getPeer(roomId, peerId)
    ```
  - **4.4.** `[If]` `!peer`
    - **4.4.1.** `[Return]`  — `void`
- **5.** `[If]` `!peer || !roomId`
  - **5.1.** `[Return]`  — `void`
- **6.** `[Sequence]` Define `parsed`
  ```typescript
  let parsed: unknown = rawMessage
  ```
- **7.** `[If]` `typeofrawMessage === 'string'`
  - **7.1.** `[Try]` Try block
    - **7.1.1.** `[Sequence]` Assign `parsed`
      ```typescript
      parsed = JSON.parse(rawMessage)
      ```
  - **7.2.** `[Catch]` Catch (`err`)
    - **7.2.1.** `[Return]`  — `void`
- **8.** `[If]` `!parsed || typeofparsed !== 'object'`
  - **8.1.** `[Return]`  — `void`
- **9.** `[Sequence]` Define `msg`, `sendToSelf`
  ```typescript
  const msg = parsed as TesseractClientSignal
  const sendToSelf = async (event: TesseractServerEvent) => { if (session) { session.transport.send(JSON.stringify(event)) } else { await store.publishBus({ targetPeerId: peerId, event }) } }
  ```
- **10.** `[Switch]` Branch on `msg.type`
  - **10.1.** `[Case]` Case `'ping'`
  - **10.2.** `[Case]` Case `'leave'`
  - **10.3.** `[Case]` Case `'peer:update'`
  - **10.4.** `[Case]` Case `'rtc:offer'`
  - **10.5.** `[Case]` Case `'rtc:answer'`
  - **10.6.** `[Case]` Case `'rtc:ice'`
  - **10.7.** `[Case]` Case `'direct:offer'`
  - **10.8.** `[Case]` Case `'direct:response'`

#### `disconnectPeer(peerIdOrTransportKey)`: `Promise<void>` (L929)

- **1.** `[Sequence]` Define `peerId`
  ```typescript
  let peerId: string | undefined
  ```
- **2.** `[If]` `typeofpeerIdOrTransportKey === 'string'`
  - **2.1.** `[Sequence]` Assign `peerId`
    ```typescript
    peerId = peerIdOrTransportKey
    ```
- **3.** `[Else]` Otherwise
  - **3.1.** `[Sequence]` Calls `this.closedTransportKeys.add`
  - **3.2.** `[Sequence]` Assign `peerId`
    ```typescript
    peerId = this.socketKeyToPeerId.get(peerIdOrTransportKey)
    ```
  - **3.3.** `[Sequence]` Calls `this.socketKeyToPeerId.delete`
- **4.** `[If]` `!peerId`
  - **4.1.** `[Return]`  — `void`
- **5.** `[Sequence]` Calls `this.peerIdToTabId.get` and stores result as `tabId`
- **6.** `[If]` `tabId`
  - **6.1.** `[Sequence]` Calls `this.peerIdToTabId.delete`
  - **6.2.** `[If]` `this.tabIdToPeerId.get(tabId) === peerId`
    - **6.2.1.** `[Sequence]` Calls `this.tabIdToPeerId.delete`
- **7.** `[Sequence]` Calls `this.getStore` and stores result as `store`
- **8.** `[Sequence]` Calls `this.localPeers.get` and stores result as `session`
- **9.** `[Sequence]` Define `roomId`
  ```typescript
  let roomId = session?.roomId ?? null
  ```
- **10.** `[If]` `!roomId`
  - **10.1.** `[Sequence]` Assign `roomId`
    ```typescript
    roomId = await store.getPeerRoomId(peerId)
    ```
- **11.** `[If]` `!roomId`
  - **11.1.** `[Return]`  — `void`
- **12.** `[Sequence]` Calls `this.localPeers.delete`
- **13.** `[Sequence]` Calls `store.removePeer`
- **14.** `[Sequence]` Calls `store.publishBus`

### `const tesseractServ` (L970)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `resolveSessionFromRequest`
- [core/utils/network.ts](../../../core/utils/network.md) ([[core/utils/network]]) — `extractTrustedClientIp`, `isPrivateOrLoopbackIp`, `normalizeIpAddress`

### External / Workspace Packages
- `node:crypto` — `randomBytes`, `timingSafeEqual`
- `node:events` — `EventEmitter`
- `ioredis` — `Redis`
- `@NamelessLiberty/db` — `prisma`
- `@NamelessLiberty/shared` — `getProfileCustomization`, `TesseractClientSignal`, `TesseractDeviceType`, `TesseractPeer`, `TesseractPeerUser`, `TesseractRoomInfo`, `TesseractServerEvent`
- `@NamelessLiberty/logger` — `LogFactory`

### Called By / Imported By
- [apps/tesseract/signaling/tesseract.ctrl.ts](./tesseract.ctrl.md) ([[apps/tesseract/signaling/tesseract.ctrl]]) — `tesseractServ`
- [server.ts](../../../server.md) ([[server]]) — `isPrivateLanOrigin`, `tesseractServ`
