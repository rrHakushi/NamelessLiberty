# passkeys.serv.ts

- **Source**: [`apps/carina/passkeys/passkeys.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/passkeys/passkeys.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `CarinaPasskeysServ extends BaseMfaService`

## Exported Types, Methods & Algorithms

### `class CarinaPasskeysServ` extends `BaseMfaService` (L40)

#### `constructor()` (L43)

- _No executable statements_

#### `listPasskeys(userId, query = {})` (L49)
List registered passkeys for the user with pagination (10 per page default).

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`
  ```typescript
  const skip = page - 1 * limit
  ```
- **4.** `[Sequence]` Database `all` on `Passkey` and stores it as `[total, passkeys]`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "total": "<total>",
    "page": "<page>",
    "limit": "<limit>",
    "passkeys": "<passkeys.map((pk) => ({ id: pk.id, name: pk.name, createdAt: toDate(pk.createdAt).toISOString(), transports: [...pk.transports], }))>"
  }
  ```

#### `createRegistrationChallenge(userId, request)` (L84)
Generate WebAuthn passkey registration options challenge.

- **1.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **2.** `[If]` `!user`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User with ID '${userId}' was not found.`
- **3.** `[Sequence]` Calls `getOriginAndRpId` and stores result as `{ rpID }`
- **4.** `[Sequence]` Calls `generateRegistrationOptions` and stores result as `options`
- **5.** `[Sequence]` Cache `set`
- **6.** `[Return]`  — `options`

#### `createLoginChallenge(body, request)` (L122)
Generate WebAuthn passkey authentication/login options challenge.

- **1.** `[Sequence]` Calls `getOriginAndRpId` and stores result as `{ rpID }`
- **2.** `[Sequence]` Define `allowCredentials`
  ```typescript
  let allowCredentials: any[] | undefined = undefined
  ```
- **3.** `[If]` `body?.identifier`
  - **3.1.** `[Sequence]` Define `rawIdentifier`, `lowerIdentifier`
    ```typescript
    const rawIdentifier = body.identifier.trim()
    const lowerIdentifier = rawIdentifier.toLowerCase()
    ```
  - **3.2.** `[Sequence]` Database `first` on `User` and stores it as `user`
  - **3.3.** `[If]` `user && user.passkeys.length > 0`
    - **3.3.1.** `[Sequence]` Assign `allowCredentials`
      ```typescript
      allowCredentials = user.passkeys.map((pk) => ({ id: pk.id, type: 'public-key' as const, transports: pk.transports as any, }))
      ```
- **4.** `[Sequence]` Calls `generateAuthenticationOptions` and stores result as `options`
- **5.** `[Sequence]` Cache `set`
- **6.** `[Return]` 
  ```json
  {
    "challenge": "<options.challenge>",
    "rpId": "<options.rpId ?? rpID>",
    "allowCredentials": "<options.allowCredentials?.map((cred) => ({ id: cred.id, type: 'public-key' as const, transports: cred.transports, }))>",
    "timeout": "<options.timeout ?? 60000>",
    "userVerification": "<options.userVerification>"
  }
  ```

#### `verifyLogin(body, request)` (L177)
Verify WebAuthn passkey authentication/login assertion response.

- **1.** `[If]` `!body?.passkeyResponse`
  - **1.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Missing passkey response payload.'
- **2.** `[Sequence]` Define `resp`, `credentialId`
  ```typescript
  const resp = body.passkeyResponse
  const credentialId = resp.id || resp.rawId
  ```
- **3.** `[If]` `!credentialId`
  - **3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Missing passkey credential ID.'
- **4.** `[Sequence]` Database `first` on `Passkey` and stores it as `passkey`
- **5.** `[If]` `!passkey || !passkey.user`
  - **5.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Passkey credential not recognized on this server.'
- **6.** `[Sequence]` Define `clientDataJSONB64`
  ```typescript
  const clientDataJSONB64 = resp.response?.clientDataJSON
  ```
- **7.** `[If]` `!clientDataJSONB64`
  - **7.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Missing clientDataJSON in passkey assertion.'
- **8.** `[Sequence]` Define `clientDataJSONString`
  ```typescript
  let clientDataJSONString = ''
  ```
- **9.** `[Try]` Try block
  - **9.1.** `[Sequence]` Assign `clientDataJSONString`
    ```typescript
    clientDataJSONString = Buffer.from(clientDataJSONB64, 'base64url').toString('utf8')
    ```
- **10.** `[Catch]` Catch (`err`)
  - **10.1.** `[Sequence]` Assign `clientDataJSONString`
    ```typescript
    clientDataJSONString = Buffer.from(clientDataJSONB64, 'base64').toString('utf8')
    ```
- **11.** `[Sequence]` Define `clientDataObj`
  ```typescript
  let clientDataObj: any
  ```
- **12.** `[Try]` Try block
  - **12.1.** `[Sequence]` Assign `clientDataObj`
    ```typescript
    clientDataObj = JSON.parse(clientDataJSONString)
    ```
- **13.** `[Catch]` Catch (`err`)
  - **13.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Invalid clientDataJSON format.'
- **14.** `[Sequence]` Define `challenge`
  ```typescript
  const challenge = clientDataObj.challenge
  ```
- **15.** `[If]` `!challenge`
  - **15.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Missing challenge in clientDataJSON.'
- **16.** `[Sequence]` Cache `get` -> `expectedChallenge`
- **17.** `[If]` `!expectedChallenge`
  - **17.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Passkey authentication challenge expired or not found. Please try again.'
- **18.** `[Sequence]` Calls `getOriginAndRpId` and stores result as `{ expectedOrigin, rpID }`
- **19.** `[Sequence]` Define `verification`
  ```typescript
  let verification: any
  ```
- **20.** `[Try]` Try block
  - **20.1.** `[Sequence]` Assign `verification`
    ```typescript
    verification = await verifyAuthenticationResponse({ response: resp, expectedChallenge, expectedOrigin, expectedRPID: rpID, credential: { id: passkey.id, ...
    ```
- **21.** `[Catch]` Catch (`err`)
  - **21.1.** `[If]` `err instanceof Error && err.message.includes('was lower than expected')`
    - **21.1.1.** `[Try]` Try block
      - **21.1.1.1.** `[Sequence]` Assign `verification`
        ```typescript
        verification = await verifyAuthenticationResponse({ response: resp, expectedChallenge, expectedOrigin, expectedRPID: rpID, credential: { id: passkey.id, ...
        ```
    - **21.1.2.** `[Catch]` Catch (`retryErr`)
      - **21.1.2.1.** `[Sequence]` Define `msg`
        ```typescript
        const msg = retryErr instanceof Error ? retryErr.message : 'Passkey assertion verification failed'
        ```
      - **21.1.2.2.** `[Error]` Throws `BadRequest` (HTTP 400) — msg
  - **21.2.** `[Else]` Otherwise
    - **21.2.1.** `[Sequence]` Define `msg`
      ```typescript
      const msg = err instanceof Error ? err.message : 'Passkey assertion verification failed'
      ```
    - **21.2.2.** `[Error]` Throws `BadRequest` (HTTP 400) — msg
- **22.** `[If]` `!verification.verified`
  - **22.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Passkey authentication verification failed.'
- **23.** `[Sequence]` Define `newCounter`
  ```typescript
  const newCounter = verification.authenticationInfo?.newCounter ?? passkey.counter
  ```
- **24.** `[Sequence]` Database `update` on `Passkey`
- **25.** `[Sequence]` Cache `del`
- **26.** `[Sequence]` Calls `toDate` and stores result as `pwdChangedAt`
- **27.** `[Sequence]` Calls `CarinaPasskeysServ.instance.issueMfaSessionToken` and stores result as `token`
- **28.** `[Return]` 
  ```json
  {
    "success": true,
    "token": "<token>",
    "user": {
      "id": "<passkey.user.id>",
      "username": "<passkey.user.username>",
      "email": "<passkey.user.email>",
      "passwordChangedAt": "<pwdChangedAt ? Math.floor(pwdChangedAt.getTime() / 1000) : null>"
    }
  }
  ```

#### `verifyRegistration(userId, body, request)` (L307)
Verify WebAuthn registration response and save new passkey.

- **1.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **2.** `[If]` `!user`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User with ID '${userId}' was not found.`
- **3.** `[Sequence]` Cache `get` -> `expectedChallenge`
- **4.** `[If]` `!expectedChallenge`
  - **4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Passkey registration challenge expired or not initiated.'
- **5.** `[Sequence]` Calls `getOriginAndRpId` and stores result as `{ expectedOrigin, rpID }`
- **6.** `[Sequence]` Define `verification`
  ```typescript
  let verification
  ```
- **7.** `[Try]` Try block
  - **7.1.** `[Sequence]` Assign `verification`
    ```typescript
    verification = await verifyRegistrationResponse({ response: body.passkeyResponse as any, expectedChallenge, expectedOrigin, expectedRPID: rpID, })
    ```
- **8.** `[Catch]` Catch (`err`)
  - **8.1.** `[Sequence]` Define `msg`
    ```typescript
    const msg = err instanceof Error ? err.message : 'Passkey registration verification error'
    ```
  - **8.2.** `[Error]` Throws `BadRequest` (HTTP 400) — msg
- **9.** `[If]` `!verification.verified || !verification.registrationInfo`
  - **9.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Passkey registration verification failed.'
- **10.** `[Sequence]` Define `{ id: credentialID, publicKey: credentialPublicKey, counter, transports, }`, `backupCodes`, `isOtherMfaActive`
  ```typescript
  const { id: credentialID, publicKey: credentialPublicKey, counter, transports, } = verification.registrationInfo.credential
  let backupCodes: string[] | undefined = undefined
  const isOtherMfaActive = user.TOTPEnabled || user.emailMfaEnabled
  ```
- **11.** `[If]` `!isOtherMfaActive && user.backupCodes.length === 0`
  - **11.1.** `[Sequence]` Calls `generateBackupCodes` and stores result as `generated`
  - **11.2.** `[Sequence]` Database `update` on `User`
  - **11.3.** `[Sequence]` Assign `backupCodes`
    ```typescript
    backupCodes = generated.plain
    ```
- **12.** `[Sequence]` Database `create` on `Passkey`
- **13.** `[Sequence]` Cache `del`
- **14.** `[Sequence]` Cache `del`
- **15.** `[Sequence]` Cache `del`
- **16.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Passkey registered successfully",
    "backupCodes": "<backupCodes>"
  }
  ```

#### `deletePasskey(userId, passkeyId)` (L390)
Delete a registered passkey belonging to the user.

- **1.** `[Sequence]` Database `first` on `Passkey` and stores it as `passkey`
- **2.** `[If]` `!passkey`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Passkey with ID '${passkeyId}' was not found.`
- **3.** `[Sequence]` Database `delete` on `Passkey`
- **4.** `[Sequence]` Database `first` on `User` and stores it as `remainingUser`
- **5.** `[If]` `remainingUser`
  - **5.1.** `[Sequence]` Define `remainingMfa`
    ```typescript
    const remainingMfa = remainingUser.TOTPEnabled || remainingUser.emailMfaEnabled || remainingUser.passkeys.length > 0
    ```
  - **5.2.** `[If]` `!remainingMfa && remainingUser.backupCodes.length > 0`
    - **5.2.1.** `[Sequence]` Database `update` on `User`
- **6.** `[Sequence]` Cache `del`
- **7.** `[Sequence]` Cache `del`
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "<`Passkey '${passkeyId}' deleted successfully.`>"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/carina/_shared/base-mfa.serv.ts](../_shared/base-mfa.serv.md) ([[apps/carina/_shared/base-mfa.serv]]) — `BaseMfaService`
- [core/utils/cache.ts](../../../core/utils/cache.md) ([[core/utils/cache]]) — `cache`
- [core/utils/auth-crypto.ts](../../../core/utils/auth-crypto.md) ([[core/utils/auth-crypto]]) — `generateBackupCodes`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `BadRequest`, `NotFound`
- `apps/carina/passkeys/passkeys.model.ts` — `CarinaPasskeysModel`
- [core/utils/domain.ts](../../../core/utils/domain.md) ([[core/utils/domain]]) — `getDomainConfig`

### External / Workspace Packages
- `@simplewebauthn/server` — `generateRegistrationOptions`, `generateAuthenticationOptions`, `verifyRegistrationResponse`, `verifyAuthenticationResponse`
- `@NamelessLiberty/db` — `prisma`, `countOf`, `or`, `toDate`

### Called By / Imported By
- [apps/carina/passkeys/passkeys.ctrl.ts](./passkeys.ctrl.md) ([[apps/carina/passkeys/passkeys.ctrl]]) — `CarinaPasskeysServ`
