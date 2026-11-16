# network.ts

- **Source**: [`core/utils/network.ts`](../../../../../../apps/elysia/src/core/utils/network.ts)
- **Layer / Role**: Core Infrastructure

## Exported Types, Methods & Algorithms

### `function isPrivateOrLoopbackIp` (L9)

Checks whether an IPv4 or IPv6 address belongs to loopback, private, link-local, carrier-grade NAT, or multicast ranges.

- **1.** `[If]` `!rawIp`
  - **1.1.** `[Return]`  — `false`
- **2.** `[Sequence]` Define `ip`
  ```typescript
  let ip = rawIp.trim().toLowerCase()
  ```
- **3.** `[If]` `!ip`
  - **3.1.** `[Return]`  — `false`
- **4.** `[If]` `ip.startsWith('::ffff:')`
  - **4.1.** `[Sequence]` Assign `ip`
    ```typescript
    ip = ip.slice(7)
    ```
- **5.** `[If]` `isIP(ip) === 4`
  - **5.1.** `[Sequence]` Define `parts`
    ```typescript
    const parts = ip.split('.').map(Number)
    ```
  - **5.2.** `[If]` `parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)`
    - **5.2.1.** `[Return]`  — `true`
  - **5.3.** `[Sequence]` Define `[a, b]`
    ```typescript
    const [a, b] = parts as [number, number, number, number]
    ```
  - **5.4.** `[If]` `a === 0 || a === 10 || a === 127`
    - **5.4.1.** `[Return]`  — `true`
  - **5.5.** `[If]` `a === 169 && b === 254`
    - **5.5.1.** `[Return]`  — `true`
  - **5.6.** `[If]` `a === 172 && b >= 16 && b <= 31`
    - **5.6.1.** `[Return]`  — `true`
  - **5.7.** `[If]` `a === 192 && b === 168`
    - **5.7.1.** `[Return]`  — `true`
  - **5.8.** `[If]` `a === 100 && b >= 64 && b <= 127`
    - **5.8.1.** `[Return]`  — `true`
  - **5.9.** `[If]` `a >= 224`
    - **5.9.1.** `[Return]`  — `true`
  - **5.10.** `[Return]`  — `false`
- **6.** `[If]` `isIP(ip) === 6`
  - **6.1.** `[If]` `ip === '::1' || ip === '::'`
    - **6.1.1.** `[Return]`  — `true`
  - **6.2.** `[If]` `ip.startsWith('fc') || ip.startsWith('fd')`
    - **6.2.1.** `[Return]`  — `true`
  - **6.3.** `[If]` `ip.startsWith('fe8') || ip.startsWith('fe9') || ip.startsWith('fea') || ip.startsWith('feb')`
    - **6.3.1.** `[Return]`  — `true`
  - **6.4.** `[If]` `ip.startsWith('ff')`
    - **6.4.1.** `[Return]`  — `true`
  - **6.5.** `[Return]`  — `false`
- **7.** `[Return]`  — `false`

### `function normalizeIpAddress` (L52)

Normalizes raw IP strings by stripping brackets, port suffixes, and IPv4-mapped prefixes.

- **1.** `[If]` `!raw`
  - **1.1.** `[Return]`  — `''`
- **2.** `[Sequence]` Define `ip`
  ```typescript
  let ip = raw.trim()
  ```
- **3.** `[If]` `ip.startsWith('[')`
  - **3.1.** `[Sequence]` Calls `ip.indexOf` and stores result as `endBracket`
  - **3.2.** `[If]` `endBracket !== -1`
    - **3.2.1.** `[Sequence]` Assign `ip`
      ```typescript
      ip = ip.slice(1, endBracket)
      ```
- **4.** `[Else]` Otherwise
  - **4.1.** `[If]` `ip.includes('.') && ip.includes(':')`
    - **4.1.1.** `[Sequence]` Assign `ip`
      ```typescript
      ip = ip.split(':')[0] || ip
      ```
- **5.** `[Sequence]` Calls `ip.indexOf` and stores result as `zoneIdx`
- **6.** `[If]` `zoneIdx !== -1`
  - **6.1.** `[Sequence]` Assign `ip`
    ```typescript
    ip = ip.slice(0, zoneIdx)
    ```
- **7.** `[If]` `ip.toLowerCase().startsWith('::ffff:')`
  - **7.1.** `[Sequence]` Assign `ip`
    ```typescript
    ip = ip.slice(7)
    ```
- **8.** `[Return]`  — `ip.trim()`

### `function extractTrustedClientIp` (L75)

Extracts client IP from forwarded headers ONLY when the immediate peer is a trusted proxy or `TRUST_PROXY=true` is explicitly configured.

- **1.** `[Sequence]` Calls `normalizeIpAddress` and stores result as `peerIp`
- **2.** `[Sequence]` Define `trustProxy`
  ```typescript
  const trustProxy = Bun.env.TRUST_PROXY === 'true' || peerIp.length > 0 && isPrivateOrLoopbackIp(peerIp)
  ```
- **3.** `[If]` `trustProxy`
  - **3.1.** `[Sequence]` Calls `request.headers.get` and stores result as `xff`
  - **3.2.** `[If]` `xff`
    - **3.2.1.** `[Sequence]` Calls `normalizeIpAddress` and stores result as `first`
    - **3.2.2.** `[If]` `first && isIP(first) !== 0`
      - **3.2.2.1.** `[Return]`  — `first`
  - **3.3.** `[Sequence]` Calls `normalizeIpAddress` and stores result as `cfIp`
  - **3.4.** `[If]` `cfIp && isIP(cfIp) !== 0`
    - **3.4.1.** `[Return]`  — `cfIp`
  - **3.5.** `[Sequence]` Calls `normalizeIpAddress` and stores result as `realIp`
  - **3.6.** `[If]` `realIp && isIP(realIp) !== 0`
    - **3.6.1.** `[Return]`  — `realIp`
- **4.** `[Return]`  — `peerIp || 'unknown'`

### `function assertSafeExternalUrl` (L104)

Validates that a target URL is a safe public HTTP(S) URL and does not resolve to loopback, link-local, metadata, or private RFC1918/ULA addresses (SSRF protection).

- **1.** `[Sequence]` Define `parsed`
  ```typescript
  let parsed: URL
  ```
- **2.** `[Try]` Try block
  - **2.1.** `[Sequence]` Assign `parsed`
    ```typescript
    parsed = new URL(rawUrl)
    ```
- **3.** `[Catch]` Catch (`err`)
  - **3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Invalid remote URL provided'
- **4.** `[If]` `parsed.protocol !== 'http:' && parsed.protocol !== 'https:'`
  - **4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Only HTTP and HTTPS remote URLs are permitted'
- **5.** `[If]` `parsed.username || parsed.password`
  - **5.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Embedded credentials in remote URLs are prohibited'
- **6.** `[Sequence]` Define `hostname`
  ```typescript
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  ```
- **7.** `[If]` `!hostname || hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.localhost')`
  - **7.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Access to local or internal network hosts is prohibited'
- **8.** `[If]` `isIP(hostname) !== 0`
  - **8.1.** `[If]` `isPrivateOrLoopbackIp(hostname)`
    - **8.1.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Access to private or loopback IP addresses is prohibited'
  - **8.2.** `[Return]`  — `parsed`
- **9.** `[Sequence]` Define `addresses`
  ```typescript
  let addresses: Array<{ address: string }>
  ```
- **10.** `[Try]` Try block
  - **10.1.** `[Sequence]` Assign `addresses`
    ```typescript
    addresses = await lookup(hostname, { all: true })
    ```
- **11.** `[Catch]` Catch (`err`)
  - **11.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Could not resolve remote hostname'
- **12.** `[If]` `!addresses.length || addresses.some((entry) => isPrivateOrLoopbackIp(entry.address))`
  - **12.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Remote hostname resolves to a restricted network address'
- **13.** `[Return]`  — `parsed`

### `function validateReturnToUrl` (L158)

Validates a `returnTo` redirect target against relative paths or allowlisted application origins. Prevents Open Redirect vulnerabilities on OAuth callbacks.

- **1.** `[If]` `!rawReturnTo || !rawReturnTo.trim()`
  - **1.1.** `[Return]`  — `new URL(fallbackUrl)`
- **2.** `[Sequence]` Define `trimmed`, `baseOrigin`
  ```typescript
  const trimmed = rawReturnTo.trim()
  const baseOrigin = new URL(fallbackUrl).origin
  ```
- **3.** `[If]` `trimmed.startsWith('/') && !trimmed.startsWith('//')`
  - **3.1.** `[Return]`  — `new URL(trimmed, baseOrigin)`
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Define `parsed`
    ```typescript
    const parsed = new URL(trimmed)
    ```
  - **4.2.** `[If]` `parsed.protocol !== 'http:' && parsed.protocol !== 'https:'`
    - **4.2.1.** `[Return]`  — `new URL(fallbackUrl)`
  - **4.3.** `[Sequence]` Define `allowedOrigins`
    ```typescript
    const allowedOrigins = new Set<string>([baseOrigin])
    ```
  - **4.4.** `[If]` `Bun.env.NEXT_PUBLIC_URL`
    - **4.4.1.** `[Try]` Try block
      - **4.4.1.1.** `[Sequence]` Calls `allowedOrigins.add`
    - **4.4.2.** `[Catch]` Catch (`err`)
  - **4.5.** `[If]` `Bun.env.CORS_ORIGINS`
    - **4.5.1.** `[Loop]` Iterate `const origin` over `Bun.env.CORS_ORIGINS.split(',')`
      - **4.5.1.1.** `[Sequence]` Define `clean`
        ```typescript
        const clean = origin.trim()
        ```
      - **4.5.1.2.** `[If]` `clean`
        - **4.5.1.2.1.** `[Try]` Try block
          - **4.5.1.2.1.1.** `[Sequence]` Calls `allowedOrigins.add`
        - **4.5.1.2.2.** `[Catch]` Catch (`err`)
  - **4.6.** `[If]` `Bun.env.NODE_ENV !== 'production'`
    - **4.6.1.** `[Sequence]` Calls `allowedOrigins.add`
    - **4.6.2.** `[Sequence]` Calls `allowedOrigins.add`
    - **4.6.3.** `[Sequence]` Calls `allowedOrigins.add`
    - **4.6.4.** `[Sequence]` Calls `allowedOrigins.add`
  - **4.7.** `[If]` `allowedOrigins.has(parsed.origin)`
    - **4.7.1.** `[Return]`  — `parsed`
- **5.** `[Catch]` Catch (`err`)
- **6.** `[Return]`  — `new URL(fallbackUrl)`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/errors/http-errors.ts](../errors/http-errors.md) ([[core/errors/http-errors]]) — `BadRequest`

### External / Workspace Packages
- `node:dns/promises` — `lookup`
- `node:net` — `isIP`

### Called By / Imported By
- [apps/borealis/lists/_base/base-list.serv.ts](../../apps/borealis/lists/_base/base-list.serv.md) ([[apps/borealis/lists/_base/base-list.serv]]) — `assertSafeExternalUrl`
- [apps/carina/connections/connections.ctrl.ts](../../apps/carina/connections/connections.ctrl.md) ([[apps/carina/connections/connections.ctrl]]) — `validateReturnToUrl`
- [apps/tesseract/signaling/tesseract.serv.ts](../../apps/tesseract/signaling/tesseract.serv.md) ([[apps/tesseract/signaling/tesseract.serv]]) — `extractTrustedClientIp`, `isPrivateOrLoopbackIp`, `normalizeIpAddress`
- [core/plugins/rate-limiter.ts](../plugins/rate-limiter.md) ([[core/plugins/rate-limiter]]) — `extractTrustedClientIp`
