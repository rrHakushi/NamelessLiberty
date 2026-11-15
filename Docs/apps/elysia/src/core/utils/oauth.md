# oauth.ts

- **Source**: [`core/utils/oauth.ts`](../../../../../../apps/elysia/src/core/utils/oauth.ts)
- **Layer / Role**: Core Infrastructure

## Exported Types, Methods & Algorithms

### `const SUPPORTED_SCOPES` (L7)

Standard advertised OAuth 2.0 and OpenID Connect (OIDC) scopes. Note: Under the "allow everything" policy, all scopes are permitted without restriction.

### `type IrisScope` (L18)

### `function parseScopes` (L24)

Parses a space or comma separated scope string into an array of scopes. If empty or undefined, defaults to all supported scopes.

- **1.** `[If]` `!scopeString || !scopeString.trim()`
  - **1.1.** `[Return]`  — `[...SUPPORTED_SCOPES]`
- **2.** `[Sequence]` Define `list`
  ```typescript
  const list = scopeString.split(/[\s,]+/).map((s) => s.trim()).filter((s) => s.length > 0)
  ```
- **3.** `[Return]`  — `list.length > 0 ? Array.from(new Set(list)) : [...SUPPORTED_SCOPES]`

### `function generateClientId` (L40)

Generates a public Client ID for registered OAuth applications.

- **1.** `[Return]`  — ``iris_app_${randomBytes(16).toString('hex')}``

### `function generateClientSecret` (L47)

Generates a secure random Client Secret.

- **1.** `[Return]`  — ``iris_sec_${randomBytes(32).toString('base64url')}``

### `function hashClientSecret` (L54)

Computes a SHA-256 digest of the client secret for database storage.

- **1.** `[Return]`  — `createHash('sha256').update(secret.trim()).digest('hex')`

### `function verifyClientSecret` (L61)

Constant-time comparison to verify a submitted client secret against the stored hash.

- **1.** `[Try]` Try block
  - **1.1.** `[Sequence]` Calls `hashClientSecret` and stores result as `submittedHash`
  - **1.2.** `[Sequence]` Calls `Buffer.from` and stores result as `a`
  - **1.3.** `[Sequence]` Calls `Buffer.from` and stores result as `b`
  - **1.4.** `[If]` `a.length !== b.length`
    - **1.4.1.** `[Return]`  — `false`
  - **1.5.** `[Return]`  — `timingSafeEqual(a, b)`
- **2.** `[Catch]` Catch (`err`)
  - **2.1.** `[Return]`  — `false`

### `function verifyPkceChallenge` (L79)

Verifies RFC 7636 PKCE code verifier against code challenge.

- **1.** `[If]` `!codeVerifier || !codeChallenge`
  - **1.1.** `[Return]`  — `false`
- **2.** `[If]` `method === 'plain'`
  - **2.1.** `[Return]`  — `codeVerifier.trim() === codeChallenge.trim()`
- **3.** `[Sequence]` Define `hashed`
  ```typescript
  const hashed = createHash('sha256').update(codeVerifier.trim()).digest('base64url')
  ```
- **4.** `[Return]`  — `hashed === codeChallenge.trim()`

### `function generateSecureToken` (L100)

Generates an opaque, cryptographically secure bearer token or code with a custom prefix.

- **1.** `[Return]`  — ``${prefix}${randomBytes(bytes).toString('base64url')}``

### `function getIssuerUrl` (L107)

Resolves the server base URL for discovery metadata and issuer identification.

- **1.** `[Sequence]` Define `url`
  ```typescript
  const url = Bun.env.NEXT_PUBLIC_URL
  ```
- **2.** `[If]` `!url`
  - **2.1.** `[Error]` Throws `Error` — 'Missing required environment variable: NEXT_PUBLIC_URL'
- **3.** `[Return]`  — `url.replace(/\/+$/, '')`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- _None_

### External / Workspace Packages
- `node:crypto` — `createHash`, `randomBytes`, `timingSafeEqual`

### Called By / Imported By
- [apps/carina/oauth/oauth.serv.ts](../../apps/carina/oauth/oauth.serv.md) ([[apps/carina/oauth/oauth.serv]]) — `SUPPORTED_SCOPES`, `parseScopes`, `generateClientId`, `generateClientSecret`, `hashClientSecret`, `verifyClientSecret`, `verifyPkceChallenge`, `generateSecureToken`, `getIssuerUrl`
