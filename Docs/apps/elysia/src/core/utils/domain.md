# domain.ts

- **Source**: [`core/utils/domain.ts`](../../../../../../apps/elysia/src/core/utils/domain.ts)
- **Layer / Role**: Core Infrastructure

## Exported Types, Methods & Algorithms

### `function getDomainConfig` (L6)

Canonical domain, origin, and cookie configuration derived strictly from `NEXT_PUBLIC_URL`. Eliminates redundant environment variables (RP_ID, COOKIE_DOMAIN, NEXTAUTH_URL).

- **1.** `[Sequence]` Define `urlStr`
  ```typescript
  const urlStr = Bun.env.NEXT_PUBLIC_URL
  ```
- **2.** `[If]` `!urlStr`
  - **2.1.** `[Error]` Throws `Error` — 'NEXT_PUBLIC_URL environment variable is required'
- **3.** `[Sequence]` Define `url`, `hostname`, `isLocalhost`
  ```typescript
  const url = new URL(urlStr)
  const hostname = url.hostname
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
  ```
- **4.** `[Sequence]` Define `rpId`
  ```typescript
  const rpId = hostname
  ```
- **5.** `[Sequence]` Define `cookieDomain`
  ```typescript
  let cookieDomain: string | undefined = undefined
  ```
- **6.** `[If]` `!isLocalhost`
  - **6.1.** `[Sequence]` Define `parts`
    ```typescript
    const parts = hostname.split('.')
    ```
  - **6.2.** `[Sequence]` Assign `cookieDomain`
    ```typescript
    cookieDomain = parts.length >= 2 ? `.${parts.slice(-2).join('.')}` : `.${hostname}`
    ```
- **7.** `[Sequence]` Define `isSecure`
  ```typescript
  const isSecure = Bun.env.BUN_ENV === 'production' && !isLocalhost
  ```
- **8.** `[Return]` 
  ```json
  {
    "url": "<urlStr>",
    "origin": "<url.origin>",
    "hostname": "<hostname>",
    "rpId": "<rpId>",
    "cookieDomain": "<cookieDomain>",
    "isSecure": "<isSecure>"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- _None_

### External / Workspace Packages
- _None_

### Called By / Imported By
- [apps/carina/auth/auth.ctrl.ts](../../apps/carina/auth/auth.ctrl.md) ([[apps/carina/auth/auth.ctrl]]) — `getDomainConfig`
- [apps/carina/auth/auth.serv.ts](../../apps/carina/auth/auth.serv.md) ([[apps/carina/auth/auth.serv]]) — `getDomainConfig`
- [apps/carina/backupcodes/backupcodes.ctrl.ts](../../apps/carina/backupcodes/backupcodes.ctrl.md) ([[apps/carina/backupcodes/backupcodes.ctrl]]) — `getDomainConfig`
- [apps/carina/email-2fa/email-2fa.ctrl.ts](../../apps/carina/email-2fa/email-2fa.ctrl.md) ([[apps/carina/email-2fa/email-2fa.ctrl]]) — `getDomainConfig`
- [apps/carina/passkeys/passkeys.ctrl.ts](../../apps/carina/passkeys/passkeys.ctrl.md) ([[apps/carina/passkeys/passkeys.ctrl]]) — `getDomainConfig`
- [apps/carina/passkeys/passkeys.serv.ts](../../apps/carina/passkeys/passkeys.serv.md) ([[apps/carina/passkeys/passkeys.serv]]) — `getDomainConfig`
- [apps/carina/qc/qc.ctrl.ts](../../apps/carina/qc/qc.ctrl.md) ([[apps/carina/qc/qc.ctrl]]) — `getDomainConfig`
- [apps/carina/qc/qc.serv.ts](../../apps/carina/qc/qc.serv.md) ([[apps/carina/qc/qc.serv]]) — `getDomainConfig`
- [apps/carina/totp/totp.ctrl.ts](../../apps/carina/totp/totp.ctrl.md) ([[apps/carina/totp/totp.ctrl]]) — `getDomainConfig`
