# connection-sync.wrk.ts

- **Source**: [`apps/carina/connections/connection-sync.wrk.ts`](../../../../../../../apps/elysia/src/apps/carina/connections/connection-sync.wrk.ts)
- **Layer / Role**: BullMQ Background Worker
- **Inheritance**: `ConnectionProviderWorker extends BaseBullMQWorker`

## Exported Types, Methods & Algorithms

### `interface ConnectionSyncJobData` (L24)

### `const PROVIDER_DISPLAY_NAMES` (L46)

### `const PROVIDER_WORKER_CONFIGS` (L60)

Provider-specific rate limits and concurrency limits

### `interface ProcessConnectionSyncJobDeps` (L77)

### `function processConnectionSyncJob` (L88)

Core processor for connection sync jobs. Fetches latest encrypted credentials, handles proactive and reactive token refresh, rate limit pausing, and updates connection lastSyncedAt on success.

- **1.** `[Sequence]` Define `{ userId, provider, providerMediaId, mediaType, mediaTitle, payload, autoInjected }`, `displayName`, `decryptFn`, `encryptFn`, `adapter`
  ```typescript
  const { userId, provider, providerMediaId, mediaType, mediaTitle, payload, autoInjected } = job.data
  const displayName = PROVIDER_DISPLAY_NAMES[provider] || provider
  const decryptFn = deps?.decrypt ?? decryptConnectionData
  const encryptFn = deps?.encrypt ?? encryptConnectionData
  let adapter = deps?.adapter
  ```
- **2.** `[If]` `!adapter`
  - **2.1.** `[Try]` Try block
    - **2.1.1.** `[Sequence]` Assign `adapter`
      ```typescript
      adapter = getConnectionAdapter(provider)
      ```
  - **2.2.** `[Catch]` Catch (`err`)
    - **2.2.1.** `[Warning]` Logs warning — `[Worker:${provider}] Unsupported connection provider: ${provider}`
    - **2.2.2.** `[Error]` Throws `UnrecoverableError` — `Unsupported connection provider: ${provider}`
- **3.** `[If]` `!adapter.updateMediaEntry`
  - **3.1.** `[Warning]` Logs warning — `[Worker:${provider}] Adapter does not support updateMediaEntry`
  - **3.2.** `[Error]` Throws `UnrecoverableError` — `Provider ${displayName} does not support syncing media entries`
- **4.** `[Sequence]` Database `first` on `Connection` and stores it as `userConn`
- **5.** `[If]` `!userConn`
  - **5.1.** `[If]` `!autoInjected`
    - **5.1.1.** `[Warning]` Logs warning — await CarinaNotificationsServ.createNotification({ userId, app: 'Borealis', category: 'Connections', type: 'INFO', priority: 'NORMAL', content: { ...).catch((notifErr) => { logger.warn(`Failed to dispatch not connected notification: ${notifErr?.message || notifErr}`) })
  - **5.2.** `[Return]`  — `false`
- **6.** `[Sequence]` Define `credentials`
  ```typescript
  let credentials: ConnectionCredentials
  ```
- **7.** `[Try]` Try block
  - **7.1.** `[Sequence]` Assign `credentials`
    ```typescript
    credentials = decryptFn<ConnectionCredentials>( userConn.encryptedData, userId )
    ```
- **8.** `[Catch]` Catch (`decryptErr`)
  - **8.1.** `[Error]` Throws `UnrecoverableError` — `Failed to decrypt credentials for ${displayName}. Please reconnect your account.`
- **9.** `[Sequence]` Define `isExpiring`
  ```typescript
  const isExpiring = userConn.expiresAt && toDate(userConn.expiresAt).getTime() - Date.now() < 300000
  ```
- **10.** `[If]` `isExpiring && credentials.refreshToken && adapter.refreshAccessToken`
  - **10.1.** `[Try]` Try block
    - **10.1.1.** `[Sequence]` Calls `adapter.refreshAccessToken` and stores result as `refreshed`
    - **10.1.2.** `[Sequence]` Assign `credentials`
      ```typescript
      credentials = { ...credentials, ...refreshed }
      ```
    - **10.1.3.** `[Sequence]` Calls `encryptFn` and stores result as `updatedEncrypted`
    - **10.1.4.** `[Sequence]` Database `update` on `Connection`
  - **10.2.** `[Catch]` Catch (`refreshErr`)
    - **10.2.1.** `[Warning]` Logs warning — `[Worker:${provider}] Proactive token refresh failed: ${refreshErr?.message || refreshErr}`
- **11.** `[Sequence]` Define `updatePayload`
  ```typescript
  const updatePayload: UpdateMediaPayload = { mediaId: providerMediaId, mediaType: mediaType as any, status: payload.status, progress: payload.progress, score: payload.score, notes: payload.notes, ...
  ```
- **12.** `[Try]` Try block
  - **12.1.** `[Sequence]` Calls `adapter.updateMediaEntry`
- **13.** `[Catch]` Catch (`firstErr`)
  - **13.1.** `[Sequence]` Define `isRateLimit`
    ```typescript
    const isRateLimit = firstErr instanceof ConnectionRateLimitError || firstErr?.statusCode === 429 || /rate limit|too many requests/i.test(firstErr?.message || '')
    ```
  - **13.2.** `[If]` `isRateLimit`
    - **13.2.1.** `[Sequence]` Define `retryAfterSec`
      ```typescript
      const retryAfterSec = firstErr?.retryAfterSeconds || 60
      ```
    - **13.2.2.** `[Warning]` Logs warning — `${c.yellow('⏳ [Rate Limited]')}: ${provider} rate limit hit. Pausing worker for ${retryAfterSec}s...`
    - **13.2.3.** `[If]` `worker && typeofworker as any.rateLimit === 'function'`
      - **13.2.3.1.** `[Try]` Try block
        - **13.2.3.1.1.** `[Sequence]` Calls `worker as any.rateLimit`
      - **13.2.3.2.** `[Catch]` Catch (`err`)
    - **13.2.4.** `[Error]` Throws `firstErr`
  - **13.3.** `[Sequence]` Define `is404`
    ```typescript
    const is404 = firstErr?.statusCode === 404 || /status 404|404 (page not found|not found)|"status":\s*404/i.test(firstErr?.message || '')
    ```
  - **13.4.** `[If]` `is404`
    - **13.4.1.** `[Warning]` Logs warning — `[Worker:${provider}] Media #${providerMediaId} not found (404) on ${provider}. Skipping retries.`
    - **13.4.2.** `[Error]` Throws `UnrecoverableError` — `Media not found (404) on ${provider}: ${firstErr?.message || firstErr}`
  - **13.5.** `[Sequence]` Define `isAuthErr`
    ```typescript
    const isAuthErr = firstErr instanceof ConnectionAuthError || firstErr?.statusCode === 401 || /unauthorized|token/i.test(firstErr?.message || '')
    ```
  - **13.6.** `[If]` `isAuthErr && credentials.refreshToken && adapter.refreshAccessToken`
    - **13.6.1.** `[Try]` Try block
      - **13.6.1.1.** `[Sequence]` Calls `adapter.refreshAccessToken` and stores result as `refreshed`
      - **13.6.1.2.** `[Sequence]` Assign `credentials`
        ```typescript
        credentials = { ...credentials, ...refreshed }
        ```
      - **13.6.1.3.** `[Sequence]` Calls `encryptFn` and stores result as `updatedEncrypted`
      - **13.6.1.4.** `[Sequence]` Database `update` on `Connection`
      - **13.6.1.5.** `[Sequence]` Calls `adapter.updateMediaEntry`
    - **13.6.2.** `[Catch]` Catch (`retryErr`)
      - **13.6.2.1.** `[Sequence]` Define `isRetryRateLimit`
        ```typescript
        const isRetryRateLimit = retryErr instanceof ConnectionRateLimitError || retryErr?.statusCode === 429 || /rate limit|too many requests/i.test(retryErr?.message || '')
        ```
      - **13.6.2.2.** `[If]` `isRetryRateLimit`
        - **13.6.2.2.1.** `[Error]` Throws `retryErr`
      - **13.6.2.3.** `[Error]` Throws `UnrecoverableError` — retryErr?.message || String(retryErr)
  - **13.7.** `[Else]` Otherwise
    - **13.7.1.** `[Error]` Throws `UnrecoverableError` — firstErr?.message || String(firstErr)
- **14.** `[Sequence]` Database `update` on `Connection`
- **15.** `[Return]`  — `true`

### `function handleJobFailure` (L282)

Handles failed connection sync attempts and complete exhaustion notifications.

- **1.** `[If]` `!job`
  - **1.1.** `[Return]`  — `void`
- **2.** `[Sequence]` Define `maxAttempts`, `isRateLimit`, `is404`, `isUnrecoverable`
  ```typescript
  const maxAttempts = job.opts.attempts ?? 4
  const isRateLimit = err instanceof ConnectionRateLimitError || err?.statusCode === 429 || /rate limit|too many requests/i.test(err?.message || '')
  const is404 = err?.statusCode === 404 || /status 404|404 (page not found|not found)|"status":\s*404/i.test(err?.message || '')
  const isUnrecoverable = err instanceof UnrecoverableError || err?.name === 'UnrecoverableError' || is404 || !isRateLimit
  ```
- **3.** `[If]` `isUnrecoverable && typeofjob as any.discard === 'function'`
  - **3.1.** `[Try]` Try block
    - **3.1.1.** `[Sequence]` Calls `job as any.discard`
  - **3.2.** `[Catch]` Catch (`err`)
- **4.** `[Sequence]` Define `isExhausted`, `isTerminal`
  ```typescript
  const isExhausted = job.attemptsMade >= maxAttempts
  const isTerminal = isUnrecoverable || isExhausted
  ```
- **5.** `[If]` `is404`
  - **5.1.** `[Warning]` Logs warning — `${c.red(c.bold('❌ [Job Dropped (404 Not Found)]'))}: [${provider}] "${job.data.mediaTitle}" was not found on ${provider}. Discarding job without retrying.`
- **6.** `[Else]` Otherwise
  - **6.1.** `[Warning]` Logs warning — `${c.red(c.bold('❌ [Job Attempt Failed]'))}: [${provider}] Attempt ${job.attemptsMade}/${maxAttempts} failed: ${err?.message || err}`
- **7.** `[If]` `isTerminal`
  - **7.1.** `[Sequence]` Define `displayName`, `errMsg`
    ```typescript
    const displayName = PROVIDER_DISPLAY_NAMES[provider] || provider
    const errMsg = err?.message || String(err)
    ```
  - **7.2.** `[Sequence]` Calls `logger.error`
  - **7.3.** `[Sequence]` Define `adapter`
    ```typescript
    let adapter
    ```
  - **7.4.** `[Try]` Try block
    - **7.4.1.** `[Sequence]` Assign `adapter`
      ```typescript
      adapter = getConnectionAdapter(provider)
      ```
  - **7.5.** `[Catch]` Catch (`err`)
  - **7.6.** `[Warning]` Logs warning — await CarinaNotificationsServ.createNotification({ userId: job.data.userId, app: 'Borealis', category: 'Connections', type: 'INFO', priority: 'HIGH', content: { ...).catch((notifErr) => { logger.warn(`Failed to dispatch failure notification: ${notifErr?.message || notifErr}`) })
  - **7.7.** `[Sequence]` Database `query` on `Connection`

### `class ConnectionProviderWorker` extends `BaseBullMQWorker` (L372)

BullMQ worker subclass handling connection sync jobs for a single external provider.

#### `constructor(provider)` (L375)

- **1.** `[Sequence]` Define `config`
  ```typescript
  const config = PROVIDER_WORKER_CONFIGS[provider] || { concurrency: 2, max: 30, duration: 60000, }
  ```
- **2.** `[Sequence]` Assign `this.provider`
  ```typescript
  this.provider = provider
  ```

#### `processJob(job)`: `Promise<unknown>` (L395)
Executes a single connection sync job with provider-specific rate-limit & auth handling.

- **1.** `[Return]`  — `await processConnectionSyncJob(job, workerInstances.get(this.provider))`

### `function createConnectionProviderWorker` (L404)

Creates and initializes a production-ready BullMQ worker for a specific connection provider.

- **1.** `[Sequence]` Define `instance`
  ```typescript
  const instance = new ConnectionProviderWorker(provider)
  ```
- **2.** `[Sequence]` Calls `instance.start` and stores result as `worker`
- **3.** `[Sequence]` Calls `worker.on`
- **4.** `[Sequence]` Calls `managedWorkers.set`
- **5.** `[Sequence]` Calls `workerInstances.set`
- **6.** `[Return]`  — `worker`

### `function getConnectionWorker` (L424)

Returns worker instance for a provider, instantiating it if not yet running.

- **1.** `[Sequence]` Calls `workerInstances.get` and stores result as `worker`
- **2.** `[If]` `!worker && !isShuttingDown`
  - **2.1.** `[Sequence]` Assign `worker`
    ```typescript
    worker = createConnectionProviderWorker(provider)
    ```
- **3.** `[Return]`  — `worker!`

### `function initConnectionWorkers` (L437)

Initializes all provider workers simultaneously.

- **1.** `[Sequence]` Define `providers`
  ```typescript
  const providers: ConnectionProvider[] = [ 'ANILIST', 'MAL', 'SIMKL', 'BANGUMI', 'HIKKA', 'MANGAUPDATES', ...
  ```
- **2.** `[Loop]` Iterate `const provider` over `providers`
  - **2.1.** `[Sequence]` Calls `getConnectionWorker`

### `function closeConnectionWorkers` (L456)

Gracefully shuts down all active provider workers.

- **1.** `[If]` `isShuttingDown`
  - **1.1.** `[Return]`  — `void`
- **2.** `[Sequence]` Assign `isShuttingDown`
  ```typescript
  isShuttingDown = true
  ```
- **3.** `[Loop]` Iterate `const [provider, worker]` over `workerInstances.entries()`
  - **3.1.** `[Try]` Try block
    - **3.1.1.** `[Sequence]` Calls `worker.pause`
    - **3.1.2.** `[Sequence]` Calls `worker.close`
  - **3.2.** `[Catch]` Catch (`err`)
    - **3.2.1.** `[Warning]` Logs warning — `Error closing worker for ${provider}: ${err?.message || err}`
- **4.** `[Sequence]` Calls `workerInstances.clear`
- **5.** `[Sequence]` Assign `isShuttingDown`
  ```typescript
  isShuttingDown = false
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/bullmq/base.wrk.ts](../../../core/bullmq/base.wrk.md) ([[core/bullmq/base.wrk]]) — `BaseBullMQWorker`
- [apps/carina/notifications/notifications.serv.ts](../notifications/notifications.serv.md) ([[apps/carina/notifications/notifications.serv]]) — `CarinaNotificationsServ`

### External / Workspace Packages
- `bullmq` — `Worker`, `UnrecoverableError`, `Job`
- `@NamelessLiberty/db` — `prisma`, `and`, `toDate`, `ConnectionProvider`, `MediaType`
- `@NamelessLiberty/logger` — `LogFactory`, `c`
- `@NamelessLiberty/connections` — `getConnectionAdapter`, `decryptConnectionData`, `encryptConnectionData`, `ConnectionAuthError`, `ConnectionRateLimitError`, `ConnectionCredentials`, `UpdateMediaPayload`

### Called By / Imported By
- [apps/carina/connections/connection-sync.queue.ts](./connection-sync.queue.md) ([[apps/carina/connections/connection-sync.queue]]) — `initConnectionWorkers`, `closeConnectionWorkers`, `ConnectionSyncJobData`
