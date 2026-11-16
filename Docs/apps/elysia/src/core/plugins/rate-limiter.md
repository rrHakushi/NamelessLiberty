# rate-limiter.ts

- **Source**: [`core/plugins/rate-limiter.ts`](../../../../../../apps/elysia/src/core/plugins/rate-limiter.ts)
- **Layer / Role**: Core Infrastructure

## Exported Types, Methods & Algorithms

### `interface RateLimitContext` (L15)

### `function getClientIp` (L32)

Extracts the real client IP address from incoming request headers, inspecting Cloudflare, X-Forwarded-For, and X-Real-IP reverse proxy headers. @param request - Optional Request instance @returns Client IP address string (defaults to '127.0.0.1' if absent)

- **1.** `[If]` `!request?.headers?.get`
  - **1.1.** `[Return]`  — `DEFAULT_IP`
- **2.** `[Sequence]` Calls `extractTrustedClientIp` and stores result as `resolved`
- **3.** `[Return]`  — `resolved === "unknown" ? DEFAULT_IP : resolved`

### `function isContextAuthenticated` (L41)

Checks if the request context indicates an authenticated (logged-in) user or client.

- **1.** `[If]` `!ctx`
  - **1.1.** `[Return]`  — `false`
- **2.** `[Sequence]` Define `session`
  ```typescript
  const session = ctx.session as any
  ```
- **3.** `[If]` `session?.getUser?.()?.id || session?.user?.id || session?.apiKeyId`
  - **3.1.** `[Return]`  — `true`
- **4.** `[Sequence]` Define `request`
  ```typescript
  const request = ctx.request
  ```
- **5.** `[If]` `!request?.headers?.get`
  - **5.1.** `[Return]`  — `false`
- **6.** `[If]` `request.headers.get('x-api-key') || request.headers.get('apikey') || request.headers.get("authorization")?.startsWith("ApiKey ") || request.headers.get("authorization")?.startsWith("Bearer ")`
  - **6.1.** `[Return]`  — `true`
- **7.** `[Sequence]` Calls `request.headers.get` and stores result as `cookieHeader`
- **8.** `[If]` `cookieHeader && /(?:^|;\s*)session=/.test(cookieHeader)`
  - **8.1.** `[Return]`  — `true`
- **9.** `[Return]`  — `false`

### `function resolveRateLimitKey` (L78)

Resolves a rate-limit key in strict multi-tier hierarchy: 1. Authenticated User ID (`usr:<userId>`) 2. API Key ID or SHA-256 hash (`key:<hash>`) 3. Client IP + Device ID (`dev:<ip>:<deviceId>`) 4. Anonymous IP + User-Agent fingerprint (`ip:<ip>:<uaHash>`) @param ctx - Request route execution context @returns Unique string identifying the client quota bucket

- **1.** `[Sequence]` Define `request`, `session`, `userId`
  ```typescript
  const request = ctx?.request
  const session = ctx?.session as any
  const userId = session?.getUser?.()?.id ?? session?.user?.id
  ```
- **2.** `[If]` `userId`
  - **2.1.** `[Return]`  — ``usr:${userId}``
- **3.** `[If]` `session?.apiKeyId`
  - **3.1.** `[Return]`  — ``key:${session.apiKeyId}``
- **4.** `[If]` `request?.headers`
  - **4.1.** `[Sequence]` Define `rawApiKey`
    ```typescript
    const rawApiKey = request.headers.get('x-api-key') || request.headers.get('apikey') || request.headers.get("authorization")?.startsWith("ApiKey ") ? request.headers.get("authorization")?.slice(7).trim() : null
    ```
  - **4.2.** `[If]` `rawApiKey`
    - **4.2.1.** `[Sequence]` Define `hash`
      ```typescript
      const hash = createHash('sha256').update(rawApiKey.trim()).digest('hex').slice(0, 16)
      ```
    - **4.2.2.** `[Return]`  — ``key:${hash}``
  - **4.3.** `[Sequence]` Calls `request.headers.get` and stores result as `authHeader`
  - **4.4.** `[If]` `authHeader?.startsWith("Bearer ")`
    - **4.4.1.** `[Sequence]` Define `token`, `tokenHash`
      ```typescript
      const token = authHeader.slice(7).trim()
      const tokenHash = createHash('sha256').update(token).digest('hex').slice(0, 16)
      ```
    - **4.4.2.** `[Return]`  — ``tok:${tokenHash}``
  - **4.5.** `[Sequence]` Calls `request.headers.get` and stores result as `cookieHeader`
  - **4.6.** `[If]` `cookieHeader && cookieHeader.includes('session=')`
    - **4.6.1.** `[Sequence]` Calls `cookieHeader.match` and stores result as `sessionMatch`
    - **4.6.2.** `[If]` `sessionMatch && sessionMatch[1]`
      - **4.6.2.1.** `[Sequence]` Define `cookieHash`
        ```typescript
        const cookieHash = createHash('sha256').update(sessionMatch[1]).digest('hex').slice(0, 16)
        ```
      - **4.6.2.2.** `[Return]`  — ``ses:${cookieHash}``
- **5.** `[Sequence]` Calls `getClientIp` and stores result as `ip`
- **6.** `[Sequence]` Define `deviceId`
  ```typescript
  const deviceId = request?.headers?.get("x-device-id") || request?.headers?.get("device-id") || request?.headers?.get("x-client-id")
  ```
- **7.** `[If]` `deviceId`
  - **7.1.** `[Return]`  — ``dev:${ip}:${deviceId.trim()}``
- **8.** `[Sequence]` Define `userAgent`
  ```typescript
  const userAgent = request?.headers?.get("user-agent")
  ```
- **9.** `[If]` `userAgent`
  - **9.1.** `[Sequence]` Define `uaHash`
    ```typescript
    const uaHash = createHash('md5').update(userAgent).digest('hex').slice(0, 8)
    ```
  - **9.2.** `[Return]`  — ``ip:${ip}:${uaHash}``
- **10.** `[Return]`  — ``ip:${ip}``

### `function createRateLimiter` (L164)

Creates an in-memory Token Bucket rate limiter function. Implements smooth token replenishment over time at a constant rate while allowing bursts up to the bucket's maximum capacity. @param config - Rate limiter configuration options (capacity, duration, cost, refillRate) @returns A limiter middleware function accepting request Context and returning a 429 error payload or null @example ```typescript const limiter = createRateLimiter({ capacity: 10, duration: 60000 }); const err = limiter(ctx); if (err) return err; ```

- **1.** `[Sequence]` Define `duration`, `cost`, `store`
  ```typescript
  const duration = config.duration ?? DEFAULT_DURATION
  const cost = config.cost ?? DEFAULT_COST
  const store = new Map<string, TokenBucketRecord>()
  ```
- **2.** `[Sequence]` Calls `setInterval` and stores result as `timer`
- **3.** `[If]` `typeoftimer === 'object' && timer !== null && 'unref' in timer`
  - **3.1.** `[Sequence]` Calls `timer as { unref: () => void }.unref`
- **4.** `[Return]`  — `( ctx: RateLimitContext | Context ): RateLimitErrorResponse | null => { const set = ctx?.set if (config.skip && config.skip(ctx as any)) { return null ...`

### `function rateLimiter` (L362)

- **1.** `[Sequence]` Calls `createRateLimiter` and stores result as `limiter`
- **2.** `[Sequence]` Define `duration`, `cost`
  ```typescript
  const duration = options.duration ?? DEFAULT_DURATION
  const cost = options.cost ?? DEFAULT_COST
  ```
- **3.** `[Return]`  — `new Elysia({ name: "iris-rate-limiter" }).onBeforeHandle('global', async (ctx) => { const rateCtx = ctx as unknown as RateLimitContext const redis = getRateLimitRedis() if (redis && !options.skip?.(rateCtx)) { try { if (redis.status === "wait") { ...)`

### `interface RateLimitErrorResponse` (L449)

### `interface RateLimitConfig` (L455)

### `interface TokenBucketRecord` (L518)

Internal state record for a single token bucket in memory.

### `type ClientRecord` (L538)

Backward-compatible alias for TokenBucketRecord.

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](./session.md) ([[core/plugins/session]]) — `Session`
- [core/utils/network.ts](../utils/network.md) ([[core/utils/network]]) — `extractTrustedClientIp`

### External / Workspace Packages
- `node:crypto` — `createHash`
- `elysia` — `Elysia`, `Context`
- `ioredis` — `Redis`

### Called By / Imported By
- _None_
