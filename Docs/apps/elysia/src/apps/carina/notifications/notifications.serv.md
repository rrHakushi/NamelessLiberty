# notifications.serv.ts

- **Source**: [`apps/carina/notifications/notifications.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/notifications/notifications.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `CarinaNotificationsServ extends BaseService`

## Exported Types, Methods & Algorithms

### `interface ActionInputDefinition` (L17)

### `interface ActionSelectOption` (L26)

### `interface ActionSelectDefinition` (L33)

### `interface ActionConfirmDefinition` (L42)

### `interface NotificationContent` (L49)

### `interface EncryptedNotificationPayload` (L62)

### `interface SendNotificationParams` (L67)

### `interface ListNotificationsQuery` (L79)

### `type NotificationSendListener` (L89)

### `class CarinaNotificationsServ` extends `BaseService` (L93)

#### `encryptNotificationPayload(content, recipientPublicKeyPem)`: `EncryptedNotificationPayload` (L97)
Encrypts arbitrary notification content using standard RSA-OAEP (2048-bit) and AES-256-GCM.

- **1.** `[Sequence]` Define `targetPublicKey`
  ```typescript
  let targetPublicKey = recipientPublicKeyPem?.trim()
  ```
- **2.** `[If]` `!targetPublicKey || !targetPublicKey.includes('BEGIN')`
  - **2.1.** `[Sequence]` Calls `crypto.generateKeyPairSync` and stores result as `{ publicKey }`
  - **2.2.** `[Sequence]` Assign `targetPublicKey`
    ```typescript
    targetPublicKey = publicKey
    ```
- **3.** `[Sequence]` Calls `crypto.randomBytes` and stores result as `aesKey`
- **4.** `[Sequence]` Calls `crypto.randomBytes` and stores result as `iv`
- **5.** `[Sequence]` Calls `crypto.createCipheriv` and stores result as `cipher`
- **6.** `[Sequence]` Calls `JSON.stringify` and stores result as `plaintext`
- **7.** `[Sequence]` Calls `Buffer.concat` and stores result as `encrypted`
- **8.** `[Sequence]` Calls `cipher.getAuthTag` and stores result as `authTag`
- **9.** `[Sequence]` Define `encryptedData`, `encryptedKeyBuffer`
  ```typescript
  const encryptedData = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
  let encryptedKeyBuffer: Buffer
  ```
- **10.** `[Try]` Try block
  - **10.1.** `[Sequence]` Assign `encryptedKeyBuffer`
    ```typescript
    encryptedKeyBuffer = crypto.publicEncrypt( { key: targetPublicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256', }, aesKey ...
    ```
- **11.** `[Catch]` Catch (`err`)
  - **11.1.** `[Sequence]` Calls `crypto.generateKeyPairSync` and stores result as `{ publicKey }`
  - **11.2.** `[Sequence]` Assign `encryptedKeyBuffer`
    ```typescript
    encryptedKeyBuffer = crypto.publicEncrypt( { key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256', }, aesKey ...
    ```
- **12.** `[Sequence]` Define `encryptedKey`
  ```typescript
  const encryptedKey = encryptedKeyBuffer.toString('base64')
  ```
- **13.** `[Return]` 
  ```json
  {
    "encryptedKey": "<encryptedKey>",
    "encryptedData": "<encryptedData>"
  }
  ```

#### `decryptNotificationPayload(encryptedKeyBase64, encryptedData, privateKeyPem)`: `NotificationContent` (L156)
Decrypts an encrypted notification payload using an RSA-OAEP private key.

- **1.** `[Sequence]` Define `parts`
  ```typescript
  const parts = encryptedData.split(':')
  ```
- **2.** `[If]` `parts.length !== 3`
  - **2.1.** `[Error]` Throws `Error` — 'Invalid encrypted notification format (expected iv:authTag:cipher)'
- **3.** `[Sequence]` Define `[ivHex, authTagHex, cipherHex]`
  ```typescript
  const [ivHex, authTagHex, cipherHex] = parts
  ```
- **4.** `[Sequence]` Calls `Buffer.from` and stores result as `iv`
- **5.** `[Sequence]` Calls `Buffer.from` and stores result as `authTag`
- **6.** `[Sequence]` Calls `Buffer.from` and stores result as `cipherBytes`
- **7.** `[Sequence]` Calls `crypto.privateDecrypt` and stores result as `aesKey`
- **8.** `[Sequence]` Calls `crypto.createDecipheriv` and stores result as `decipher`
- **9.** `[Sequence]` Calls `decipher.setAuthTag`
- **10.** `[Sequence]` Calls `Buffer.concat` and stores result as `decrypted`
- **11.** `[Return]`  — `JSON.parse(decrypted.toString('utf8'))`

#### `createNotification(params)` (L192)
Helper to create, encrypt, persist, and send a new encrypted notification.

- **1.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **2.** `[Sequence]` Define `userPublicKey`
  ```typescript
  const userPublicKey = user?.publicKey?.trim()
  ```
- **3.** `[If]` `!userPublicKey || !userPublicKey.includes('BEGIN')`
  - **3.1.** `[Sequence]` Define `msg`
    ```typescript
    const msg = `User ${params.userId} does not have a valid RSA public key (found: ${userPublicKey ? 'legacy/invalid' : 'none'}).`
    ```
  - **3.2.** `[Warning]` Logs warning — `[CarinaNotifications] ${msg}`
  - **3.3.** `[Error]` Throws `Error` — msg
- **4.** `[Sequence]` Calls `this.encryptNotificationPayload` and stores result as `{ encryptedKey, encryptedData }`
- **5.** `[Sequence]` Database `create` on `Notification` and stores it as `notification`
- **6.** `[Loop]` Iterate `const listener` over `sendListeners`
  - **6.1.** `[Try]` Try block
    - **6.1.1.** `[Sequence]` Calls `listener`
  - **6.2.** `[Catch]` Catch (`err`)
    - **6.2.1.** `[Warning]` Logs warning — `Error in notification send listener: ${err}`
- **7.** `[Try]` Try block
  - **7.1.** `[Sequence]` Calls `wsHub.sendToUser`
- **8.** `[Catch]` Catch (`err`)
  - **8.1.** `[Warning]` Logs warning — `Failed to dispatch real-time notification over WebSocket: ${err}`
- **9.** `[Return]`  — `notification`

#### `listNotifications(userId, query)` (L254)
Get notifications for authenticated user (10 per page default).

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`
  ```typescript
  const skip = page - 1 * limit
  ```
- **4.** `[Sequence]` Database `query` on `Notification` and stores it as `notifQuery`
- **5.** `[If]` `query?.isRead !== undefined`
  - **5.1.** `[Sequence]` Define `isReadVal`
    ```typescript
    const isReadVal = typeof query.isRead === 'string' ? query.isRead === 'true' : Boolean(query.isRead)
    ```
  - **5.2.** `[Sequence]` Assign `notifQuery`
    ```typescript
    notifQuery = notifQuery.where({ isRead: isReadVal })
    ```
- **6.** `[If]` `query?.app`
  - **6.1.** `[Sequence]` Assign `notifQuery`
    ```typescript
    notifQuery = notifQuery.where({ app: query.app })
    ```
- **7.** `[If]` `query?.category`
  - **7.1.** `[Sequence]` Assign `notifQuery`
    ```typescript
    notifQuery = notifQuery.where({ category: query.category })
    ```
- **8.** `[If]` `query?.priority`
  - **8.1.** `[Sequence]` Assign `notifQuery`
    ```typescript
    notifQuery = notifQuery.where({ priority: query.priority as NotificationPriority })
    ```
- **9.** `[If]` `query?.type`
  - **9.1.** `[Sequence]` Assign `notifQuery`
    ```typescript
    notifQuery = notifQuery.where({ type: query.type as NotificationType })
    ```
- **10.** `[Sequence]` Database `all` on `Notification` and stores it as `[total, unreadCount, rawNotifications]`
- **11.** `[Sequence]` Calls `Math.max` and stores result as `totalPages`
- **12.** `[Sequence]` Define `hasMore`, `notifications`
  ```typescript
  const hasMore = page < totalPages
  const notifications = rawNotifications.map((n) => ({ id: n.id, userId: n.userId, app: n.app, category: n.category, type: n.type, priority: n.priority, ...)
  ```
- **13.** `[Return]` 
  ```json
  {
    "success": true,
    "total": "<total>",
    "unreadCount": "<unreadCount>",
    "notifications": "<notifications>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<totalPages>",
      "hasMore": "<hasMore>"
    }
  }
  ```

#### `deleteAllNotifications(userId, query)` (L331)
Delete all notifications for authenticated user.

- **1.** `[Sequence]` Database `query` on `Notification` and stores it as `delQuery`
- **2.** `[Sequence]` Define `onlyRead`
  ```typescript
  const onlyRead = typeof query?.onlyRead === 'string' ? query.onlyRead === 'true' : Boolean(query?.onlyRead)
  ```
- **3.** `[If]` `onlyRead`
  - **3.1.** `[Sequence]` Assign `delQuery`
    ```typescript
    delQuery = delQuery.where({ isRead: true })
    ```
- **4.** `[Sequence]` Calls `delQuery.deleteAndCount` and stores result as `deletedCount`
- **5.** `[Sequence]` Database `query` on `Notification` and stores it as `unreadCount`
- **6.** `[Try]` Try block
  - **6.1.** `[Sequence]` Calls `wsHub.sendToUser`
- **7.** `[Catch]` Catch (`err`)
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "deletedCount": "<deletedCount>",
    "unreadCount": "<unreadCount>",
    "message": "Notifications deleted successfully"
  }
  ```

#### `getNotification(userId, notificationId, secretKey)` (L360)
Get single notification details strictly by notification ID. If secretKey is provided, optionally decrypts and returns content.

- **1.** `[Sequence]` Database `first` on `Notification` and stores it as `notification`
- **2.** `[If]` `!notification || notification.userId !== userId`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Notification not found'
- **3.** `[Sequence]` Define `decryptedContent`
  ```typescript
  let decryptedContent: NotificationContent | undefined
  ```
- **4.** `[If]` `secretKey`
  - **4.1.** `[Try]` Try block
    - **4.1.1.** `[Sequence]` Assign `decryptedContent`
      ```typescript
      decryptedContent = this.decryptNotificationPayload( notification.encryptedKey, notification.encryptedData, typeof secretKey === 'string' ? secretKey : Buffer.from(secretKey).toString('utf8') )
      ```
  - **4.2.** `[Catch]` Catch (`err`)
    - **4.2.1.** `[Warning]` Logs warning — `Failed to decrypt notification ${notification.id}: ${err}`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "notification": {
      "id": "<notification.id>",
      "userId": "<notification.userId>",
      "app": "<notification.app>",
      "category": "<notification.category>",
      "type": "<notification.type>",
      "priority": "<notification.priority>",
      "isRead": "<notification.isRead>",
      "readAt": "<notification.readAt ? toDate(notification.readAt).toISOString() : null>",
      "actionStatus": "<notification.actionStatus>",
      "actionPayload": "<notification.actionPayload>",
      "actionHandler": "<notification.actionHandler>",
      "encryptedKey": "<notification.encryptedKey>",
      "encryptedData": "<notification.encryptedData>",
      "expiresAt": "<notification.expiresAt ? toDate(notification.expiresAt).toISOString() : null>",
      "createdAt": "<toDate(notification.createdAt).toISOString()>",
      "updatedAt": "<toDate(notification.updatedAt).toISOString()>",
      "...decryptedContent ? { content: decryptedContent } : {}": "..."
    }
  }
  ```

#### `deleteNotification(userId, notificationId)` (L411)
Delete single notification strictly by notification ID.

- **1.** `[Sequence]` Database `first` on `Notification` and stores it as `notification`
- **2.** `[If]` `!notification || notification.userId !== userId`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Notification not found'
- **3.** `[Sequence]` Database `delete` on `Notification`
- **4.** `[Sequence]` Database `query` on `Notification` and stores it as `unreadCount`
- **5.** `[Try]` Try block
  - **5.1.** `[Sequence]` Calls `wsHub.sendToUser`
- **6.** `[Catch]` Catch (`err`)
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "id": "<notification.id>",
    "unreadCount": "<unreadCount>",
    "message": "Notification deleted successfully"
  }
  ```

#### `executeNotificationAction(userId, notificationId, body)` (L437)
Execute an interactive action on a notification.

- **1.** `[Sequence]` Database `first` on `Notification` and stores it as `notification`
- **2.** `[If]` `!notification || notification.userId !== userId`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Notification not found'
- **3.** `[Sequence]` Define `normAction`, `actionStatus`
  ```typescript
  const normAction = body.action.toUpperCase().trim()
  let actionStatus: NotificationActionStatus = 'CONFIRMED'
  ```
- **4.** `[If]` `normAction === 'REJECT' || normAction === 'DECLINE'`
  - **4.1.** `[Sequence]` Assign `actionStatus`
    ```typescript
    actionStatus = 'REJECTED'
    ```
- **5.** `[Else]` Otherwise
  - **5.1.** `[If]` `normAction === 'SUBMIT'`
    - **5.1.1.** `[Sequence]` Assign `actionStatus`
      ```typescript
      actionStatus = 'SUBMITTED'
      ```
- **6.** `[Sequence]` Database `update` on `Notification` and stores it as `updated`
- **7.** `[If]` `!updated`
  - **7.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Notification not found'
- **8.** `[Sequence]` Database `query` on `Notification` and stores it as `unreadCount`
- **9.** `[If]` `actionStatus === 'CONFIRMED' && notification.actionHandler === 'borealis.other.fork'`
  - **9.1.** `[Sequence]` Define `otherId`
    ```typescript
    const otherId = (notification.actionPayload as any)?.otherId
    ```
  - **9.2.** `[If]` `otherId`
    - **9.2.1.** `[Try]` Try block
      - **9.2.1.1.** `[Sequence]` Database `first` on `User` and stores it as `userRecord`
      - **9.2.1.2.** `[Sequence]` Calls `import` and stores result as `{ hasPermission, IRISFlags }`
      - **9.2.1.3.** `[Sequence]` Calls `hasPermission` and stores result as `isAdmin`
      - **9.2.1.4.** `[Sequence]` Calls `import` and stores result as `{ BorealisOtherServ }`
      - **9.2.1.5.** `[Sequence]` Calls `BorealisOtherServ.forkItem`
    - **9.2.2.** `[Catch]` Catch (`forkErr`)
      - **9.2.2.1.** `[Warning]` Logs warning — `Failed to fork item on notification action: ${forkErr}`
- **10.** `[Try]` Try block
  - **10.1.** `[Sequence]` Calls `wsHub.sendToUser`
- **11.** `[Catch]` Catch (`err`)
- **12.** `[Return]` 
  ```json
  {
    "success": true,
    "id": "<updated.id>",
    "actionStatus": "<updated.actionStatus || actionStatus>",
    "actionPayload": "<updated.actionPayload>",
    "isRead": true,
    "unreadCount": "<unreadCount>",
    "message": "Notification action executed successfully"
  }
  ```

#### `markNotificationRead(userId, notificationId)` (L508)
Mark single notification as read strictly by notification ID.

- **1.** `[Sequence]` Database `first` on `Notification` and stores it as `notification`
- **2.** `[If]` `!notification || notification.userId !== userId`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Notification not found'
- **3.** `[Sequence]` Define `now`, `readAtDate`
  ```typescript
  const now = new Date()
  let readAtDate = notification.readAt ? toDate(notification.readAt) : now
  ```
- **4.** `[If]` `!notification.isRead`
  - **4.1.** `[Sequence]` Database `update` on `Notification` and stores it as `updated`
  - **4.2.** `[Sequence]` Assign `readAtDate`
    ```typescript
    readAtDate = updated?.readAt ? toDate(updated.readAt) : now
    ```
- **5.** `[Sequence]` Database `query` on `Notification` and stores it as `unreadCount`
- **6.** `[Try]` Try block
  - **6.1.** `[Sequence]` Calls `wsHub.sendToUser`
- **7.** `[Catch]` Catch (`err`)
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "id": "<notification.id>",
    "isRead": true,
    "readAt": "<readAtDate.toISOString()>",
    "unreadCount": "<unreadCount>",
    "message": "Notification marked as read"
  }
  ```

#### `markAllRead(userId)` (L549)
Mark all notifications as read for authenticated user.

- **1.** `[Sequence]` Database `query` on `Notification` and stores it as `markedCount`
- **2.** `[Try]` Try block
  - **2.1.** `[Sequence]` Calls `wsHub.sendToUser`
- **3.** `[Catch]` Catch (`err`)
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "markedCount": "<markedCount>",
    "unreadCount": "<0 as const>",
    "message": "All notifications marked as read"
  }
  ```

#### `countUnread(userId)`: `Promise<number>` (L575)
Count unread notifications for a user.

- **1.** `[Return]`  — `await countOf(prisma.orm.public.Notification.where({ userId, isRead: false, }))`

#### `onSend(listener)`: `() => void` (L585)
Subscribe to new notification send events.

- **1.** `[Sequence]` Calls `sendListeners.add`
- **2.** `[Return]`  — `() => sendListeners.delete(listener)`

### `const NotificationService` (L603)

Convenience alias

### `const notificationService` (L604)

Convenience alias

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `NotFound`
- [core/ws/ws.serv.ts](../../../core/ws/ws.serv.md) ([[core/ws/ws.serv]]) — `wsHub`

### External / Workspace Packages
- `node:crypto` — `crypto`
- `@NamelessLiberty/db` — `prisma`, `countOf`, `toDate`, `NotificationType`, `NotificationPriority`, `NotificationActionStatus`
- `@NamelessLiberty/logger` — `LogFactory`

### Called By / Imported By
- [apps/borealis/other/other.serv.ts](../../borealis/other/other.serv.md) ([[apps/borealis/other/other.serv]]) — `CarinaNotificationsServ`
- [apps/carina/connections/connection-sync.wrk.ts](../connections/connection-sync.wrk.md) ([[apps/carina/connections/connection-sync.wrk]]) — `CarinaNotificationsServ`
- [apps/carina/notifications/notifications.ctrl.ts](./notifications.ctrl.md) ([[apps/carina/notifications/notifications.ctrl]]) — `CarinaNotificationsServ`
