# oauth.serv.ts

- **Source**: [`apps/carina/oauth/oauth.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/oauth/oauth.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `CarinaOAuthServ extends BaseService`

## Exported Types, Methods & Algorithms

### `class CarinaOAuthServ` extends `BaseService` (L36)

#### `getOpenIdConfiguration()` (L40)
RFC 8414 & OpenID Connect Discovery document.

- **1.** `[Sequence]` Calls `getIssuerUrl` and stores result as `issuer`
- **2.** `[Return]` 
  ```json
  {
    "issuer": "<issuer>",
    "authorization_endpoint": "<`${issuer}/carina/oauth/authorize`>",
    "token_endpoint": "<`${issuer}/carina/oauth/token`>",
    "userinfo_endpoint": "<`${issuer}/carina/oauth/userinfo`>",
    "revocation_endpoint": "<`${issuer}/carina/oauth/revoke`>",
    "introspection_endpoint": "<`${issuer}/carina/oauth/introspect`>",
    "registration_endpoint": "<`${issuer}/carina/oauth/register`>",
    "scopes_supported": [
      "<...SUPPORTED_SCOPES>"
    ],
    "response_types_supported": [
      "code"
    ],
    "grant_types_supported": [
      "authorization_code"
    ],
    "token_endpoint_auth_methods_supported": [
      "client_secret_basic"
    ],
    "code_challenge_methods_supported": [
      "S256"
    ]
  }
  ```

#### `getOAuthAuthorizationServerMetadata()` (L69)
RFC 8414 OAuth 2.0 Authorization Server Metadata.

- **1.** `[Sequence]` Calls `getIssuerUrl` and stores result as `issuer`
- **2.** `[Return]` 
  ```json
  {
    "issuer": "<issuer>",
    "authorization_endpoint": "<`${issuer}/carina/oauth/authorize`>",
    "token_endpoint": "<`${issuer}/carina/oauth/token`>",
    "revocation_endpoint": "<`${issuer}/carina/oauth/revoke`>",
    "introspection_endpoint": "<`${issuer}/carina/oauth/introspect`>",
    "registration_endpoint": "<`${issuer}/carina/oauth/register`>",
    "scopes_supported": [
      "<...SUPPORTED_SCOPES>"
    ],
    "response_types_supported": [
      "code"
    ],
    "grant_types_supported": [
      "authorization_code"
    ],
    "code_challenge_methods_supported": [
      "S256"
    ]
  }
  ```

#### `getAuthorize(query, sessionUser)` (L92)
Validate and retrieve client details for authorization prompt.

- **1.** `[Sequence]` Define `{ client_id, redirect_uri, scope, state }`
  ```typescript
  const { client_id, redirect_uri, scope, state } = query
  ```
- **2.** `[Sequence]` Calls `assertSafeOAuthRedirectUri`
- **3.** `[Sequence]` Database `first` on `OAuthClient` and stores it as `client`
- **4.** `[If]` `!client`
  - **4.1.** `[Error]` Throws `NotFound` (HTTP 404) — `OAuth application '${client_id}' was not found.`
- **5.** `[If]` `client.redirectUris.length > 0 && !client.redirectUris.includes(redirect_uri)`
  - **5.1.** `[Error]` Throws `BadRequest` (HTTP 400) — `The redirect URI '${redirect_uri}' is not registered for this client application.`
- **6.** `[Sequence]` Calls `parseScopes` and stores result as `requestedScopes`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "client": {
      "id": "<client.id>",
      "clientId": "<client.clientId>",
      "name": "<client.name>",
      "description": "<client.description>",
      "logoUrl": "<client.logoUrl>",
      "websiteUrl": "<client.websiteUrl>",
      "isPublic": "<client.isPublic>",
      "isTrusted": "<client.isTrusted>"
    },
    "requestedScopes": "<requestedScopes>",
    "redirectUri": "<redirect_uri>",
    "state": "<state || null>",
    "currentUser": "<sessionUser ? { id: sessionUser.id, username: sessionUser.username, email: sessionUser.email, } : null>"
  }
  ```

#### `postAuthorize(body, sessionUser)` (L144)
Process user consent and issue a single-use authorization code.

- **1.** `[Sequence]` Define `{ client_id, redirect_uri, scope, state, code_challenge, code_challenge_method }`
  ```typescript
  const { client_id, redirect_uri, scope, state, code_challenge, code_challenge_method } = body
  ```
- **2.** `[Sequence]` Calls `assertSafeOAuthRedirectUri` and stores result as `parsedUrl`
- **3.** `[Sequence]` Database `first` on `OAuthClient` and stores it as `client`
- **4.** `[If]` `!client`
  - **4.1.** `[Error]` Throws `NotFound` (HTTP 404) — `OAuth application '${client_id}' was not found.`
- **5.** `[If]` `client.redirectUris.length > 0 && !client.redirectUris.includes(redirect_uri)`
  - **5.1.** `[Error]` Throws `BadRequest` (HTTP 400) — `The redirect URI '${redirect_uri}' is not registered for this client application.`
- **6.** `[Sequence]` Calls `parseScopes` and stores result as `requestedScopes`
- **7.** `[Sequence]` Database `first` on `OAuthConsent` and stores it as `existingConsent`
- **8.** `[If]` `existingConsent`
  - **8.1.** `[Sequence]` Database `update` on `OAuthConsent`
- **9.** `[Else]` Otherwise
  - **9.1.** `[Sequence]` Database `create` on `OAuthConsent`
- **10.** `[Sequence]` Calls `generateSecureToken` and stores result as `authCode`
- **11.** `[Sequence]` Define `expiresAt`
  ```typescript
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
  ```
- **12.** `[Sequence]` Database `create` on `OAuthAuthorizationCode`
- **13.** `[Sequence]` Calls `parsedUrl.searchParams.set`
- **14.** `[If]` `state`
  - **14.1.** `[Sequence]` Calls `parsedUrl.searchParams.set`
- **15.** `[Sequence]` Define `redirectUrl`
  ```typescript
  const redirectUrl = parsedUrl.toString()
  ```
- **16.** `[Return]` 
  ```json
  {
    "success": true,
    "code": "<authCode>",
    "redirectUrl": "<redirectUrl>",
    "state": "<state || null>"
  }
  ```

#### `postToken(body, authHeader)` (L218)
RFC 6749 Token Endpoint: Exchange authorization code or refresh token.

- **1.** `[Sequence]` Define `effectiveClientId`, `effectiveClientSecret`
  ```typescript
  let effectiveClientId = body.client_id
  let effectiveClientSecret = body.client_secret
  ```
- **2.** `[If]` `authHeader && authHeader.startsWith('Basic ')`
  - **2.1.** `[Try]` Try block
    - **2.1.1.** `[Sequence]` Define `decoded`, `[u, p]`
      ```typescript
      const decoded = Buffer.from(authHeader.slice(6).trim(), 'base64').toString('utf-8')
      const [u, p] = decoded.split(':')
      ```
    - **2.1.2.** `[If]` `u && !effectiveClientId`
      - **2.1.2.1.** `[Sequence]` Assign `effectiveClientId`
        ```typescript
        effectiveClientId = u
        ```
    - **2.1.3.** `[If]` `p && !effectiveClientSecret`
      - **2.1.3.1.** `[Sequence]` Assign `effectiveClientSecret`
        ```typescript
        effectiveClientSecret = p
        ```
  - **2.2.** `[Catch]` Catch (`err`)
- **3.** `[Sequence]` Define `{ grant_type }`
  ```typescript
  const { grant_type } = body
  ```
- **4.** `[If]` `grant_type === 'authorization_code'`
  - **4.1.** `[Sequence]` Define `{ code, redirect_uri, code_verifier }`
    ```typescript
    const { code, redirect_uri, code_verifier } = body
    ```
  - **4.2.** `[If]` `!code`
    - **4.2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Missing required 'code' parameter.'
  - **4.3.** `[Sequence]` Database `first` on `OAuthAuthorizationCode` and stores it as `authCode`
  - **4.4.** `[If]` `!authCode`
    - **4.4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Invalid or expired authorization code.'
  - **4.5.** `[If]` `authCode.usedAt !== null`
    - **4.5.1.** `[Sequence]` Database `updateAll` on `OAuthAccessToken`
    - **4.5.2.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Authorization code already used. Potential replay detected.'
  - **4.6.** `[If]` `toDate(authCode.expiresAt).getTime() < Date.now()`
    - **4.6.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Authorization code has expired.'
  - **4.7.** `[If]` `authCode.redirectUri && authCode.redirectUri !== redirect_uri`
    - **4.7.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'The redirect_uri provided does not match the authorization request.'
  - **4.8.** `[If]` `authCode.codeChallenge`
    - **4.8.1.** `[If]` `!code_verifier`
      - **4.8.1.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Missing 'code_verifier' required for PKCE verification.'
    - **4.8.2.** `[Sequence]` Define `method`
      ```typescript
      const method = authCode.codeChallengeMethod as 'S256' | 'plain' || 'S256'
      ```
    - **4.8.3.** `[Sequence]` Calls `verifyPkceChallenge` and stores result as `isPkceValid`
    - **4.8.4.** `[If]` `!isPkceValid`
      - **4.8.4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'PKCE verification failed: code_verifier does not match challenge.'
  - **4.9.** `[If]` `!authCode.client.isPublic && authCode.client.clientSecret`
    - **4.9.1.** `[If]` `!effectiveClientSecret || !verifyClientSecret(effectiveClientSecret, authCode.client.clientSecret)`
      - **4.9.1.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Client authentication failed.'
  - **4.10.** `[Sequence]` Database `update` on `OAuthAuthorizationCode`
  - **4.11.** `[Sequence]` Calls `generateSecureToken` and stores result as `accessToken`
  - **4.12.** `[Sequence]` Calls `generateSecureToken` and stores result as `refreshToken`
  - **4.13.** `[Sequence]` Define `accessExpiresAt`, `refreshExpiresAt`
    ```typescript
    const accessExpiresAt = new Date(Date.now() + 30 * 86400 * 1000)
    const refreshExpiresAt = new Date(Date.now() + 90 * 86400 * 1000)
    ```
  - **4.14.** `[Sequence]` Database `all` on `OAuthAccessToken`
  - **4.15.** `[Return]` 
    ```json
    {
      "access_token": "<accessToken>",
      "token_type": "<'Bearer' as const>",
      "expires_in": "<30 * 86400>",
      "refresh_token": "<refreshToken>",
      "scope": "<authCode.scopes.join(' ')>"
    }
    ```
- **5.** `[If]` `grant_type === 'refresh_token'`
  - **5.1.** `[Sequence]` Define `{ refresh_token }`
    ```typescript
    const { refresh_token } = body
    ```
  - **5.2.** `[If]` `!refresh_token`
    - **5.2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Missing 'refresh_token' parameter.'
  - **5.3.** `[Sequence]` Database `first` on `OAuthRefreshToken` and stores it as `tokenRecord`
  - **5.4.** `[If]` `!tokenRecord || tokenRecord.revokedAt || toDate(tokenRecord.expiresAt).getTime() < Date.now()`
    - **5.4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Invalid, expired, or revoked refresh token.'
  - **5.5.** `[Sequence]` Calls `generateSecureToken` and stores result as `newAccessToken`
  - **5.6.** `[Sequence]` Calls `generateSecureToken` and stores result as `newRefreshToken`
  - **5.7.** `[Sequence]` Define `accessExpiresAt`, `refreshExpiresAt`
    ```typescript
    const accessExpiresAt = new Date(Date.now() + 30 * 86400 * 1000)
    const refreshExpiresAt = new Date(Date.now() + 90 * 86400 * 1000)
    ```
  - **5.8.** `[Sequence]` Database `update` on `OAuthRefreshToken`
  - **5.9.** `[Sequence]` Database `all` on `OAuthAccessToken`
  - **5.10.** `[Return]` 
    ```json
    {
      "access_token": "<newAccessToken>",
      "token_type": "<'Bearer' as const>",
      "expires_in": "<30 * 86400>",
      "refresh_token": "<newRefreshToken>",
      "scope": "<tokenRecord.scopes.join(' ')>"
    }
    ```
- **6.** `[If]` `grant_type === 'client_credentials'`
  - **6.1.** `[If]` `!effectiveClientId || !effectiveClientSecret`
    - **6.1.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Client ID and Client Secret are required.'
  - **6.2.** `[Sequence]` Database `first` on `OAuthClient` and stores it as `client`
  - **6.3.** `[If]` `!client || !client.clientSecret || !verifyClientSecret(effectiveClientSecret, client.clientSecret)`
    - **6.3.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Invalid client credentials.'
  - **6.4.** `[Sequence]` Calls `generateSecureToken` and stores result as `accessToken`
  - **6.5.** `[Sequence]` Define `accessExpiresAt`
    ```typescript
    const accessExpiresAt = new Date(Date.now() + 30 * 86400 * 1000)
    ```
  - **6.6.** `[Sequence]` Calls `parseScopes` and stores result as `scopes`
  - **6.7.** `[Sequence]` Database `create` on `OAuthAccessToken`
  - **6.8.** `[Return]` 
    ```json
    {
      "access_token": "<accessToken>",
      "token_type": "<'Bearer' as const>",
      "expires_in": "<30 * 86400>",
      "scope": "<scopes.join(' ')>"
    }
    ```
- **7.** `[Error]` Throws `BadRequest` (HTTP 400) — `Unsupported grant_type '${grant_type}'.`

#### `getUserinfo(sessionUser)` (L424)
OIDC UserInfo endpoint: returns identity claims for the authenticated subject.

- **1.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **2.** `[If]` `!user`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User profile not found.'
- **3.** `[Return]` 
  ```json
  {
    "sub": "<user.id>",
    "id": "<user.id>",
    "username": "<user.username>",
    "name": "<user.username>",
    "email": "<user.email>",
    "email_verified": "<Boolean(user.email)>",
    "permissions": [
      "<...user.permissions>"
    ]
  }
  ```

#### `postRevoke(body)` (L447)
RFC 7009 Token Revocation endpoint.

- **1.** `[Sequence]` Define `{ token }`
  ```typescript
  const { token } = body
  ```
- **2.** `[If]` `token`
  - **2.1.** `[Sequence]` Database `all` on `OAuthAccessToken`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Token has been revoked"
  }
  ```

#### `postIntrospect(body)` (L469)
RFC 7662 Token Introspection endpoint.

- **1.** `[Sequence]` Define `{ token }`
  ```typescript
  const { token } = body
  ```
- **2.** `[If]` `!token`
  - **2.1.** `[Return]` 
    ```json
    {
      "active": false
    }
    ```
- **3.** `[Sequence]` Database `first` on `OAuthAccessToken` and stores it as `accessToken`
- **4.** `[If]` `accessToken && !accessToken.revokedAt && toDate(accessToken.expiresAt).getTime() > Date.now()`
  - **4.1.** `[Return]` 
    ```json
    {
      "active": true,
      "client_id": "<accessToken.client.clientId>",
      "sub": "<accessToken.userId>",
      "scope": "<accessToken.scopes.join(' ')>",
      "exp": "<Math.floor(toDate(accessToken.expiresAt).getTime() / 1000)>"
    }
    ```
- **5.** `[Sequence]` Database `first` on `OAuthRefreshToken` and stores it as `refreshToken`
- **6.** `[If]` `refreshToken && !refreshToken.revokedAt && toDate(refreshToken.expiresAt).getTime() > Date.now()`
  - **6.1.** `[Return]` 
    ```json
    {
      "active": true,
      "client_id": "<refreshToken.client.clientId>",
      "sub": "<refreshToken.userId>",
      "scope": "<refreshToken.scopes.join(' ')>",
      "exp": "<Math.floor(toDate(refreshToken.expiresAt).getTime() / 1000)>"
    }
    ```
- **7.** `[Return]` 
  ```json
  {
    "active": false
  }
  ```

#### `postRegisterClient(body, sessionUser)` (L511)
RFC 7591 Dynamic Client Registration endpoint.

- **1.** `[If]` `!sessionUser?.id`
  - **1.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Authentication required to register an OAuth application.'
- **2.** `[Sequence]` Define `ownerUserId`
  ```typescript
  const ownerUserId = sessionUser.id
  ```
- **3.** `[Sequence]` Calls `generateClientId` and stores result as `clientId`
- **4.** `[Sequence]` Calls `Boolean` and stores result as `isPublic`
- **5.** `[Sequence]` Define `rawSecret`, `hashedSecret`
  ```typescript
  let rawSecret: string | undefined = undefined
  let hashedSecret: string | null = null
  ```
- **6.** `[If]` `!isPublic`
  - **6.1.** `[Sequence]` Assign `rawSecret`
    ```typescript
    rawSecret = generateClientSecret()
    ```
  - **6.2.** `[Sequence]` Assign `hashedSecret`
    ```typescript
    hashedSecret = hashClientSecret(rawSecret)
    ```
- **7.** `[Sequence]` Calls `parseScopes` and stores result as `scopes`
- **8.** `[Sequence]` Database `create` on `OAuthClient` and stores it as `client`
- **9.** `[Return]` 
  ```json
  {
    "client_id": "<client.clientId>",
    "client_secret": "<rawSecret>",
    "client_name": "<client.name>",
    "redirect_uris": [
      "<...client.redirectUris>"
    ],
    "scopes": [
      "<...client.allowedScopes>"
    ]
  }
  ```

#### `listApps(userId)` (L557)

- **1.** `[Sequence]` Database `all` on `OAuthClient` and stores it as `clients`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "clients": "<clients.map((c) => ({ id: c.id, clientId: c.clientId, name: c.name, description: c.description, logoUrl: c.logoUrl, websiteUrl: c.websiteUrl, ...)>"
  }
  ```

#### `createApp(userId, body)` (L579)

- **1.** `[Sequence]` Calls `generateClientId` and stores result as `clientId`
- **2.** `[Sequence]` Calls `Boolean` and stores result as `isPublic`
- **3.** `[Sequence]` Define `rawSecret`, `hashedSecret`
  ```typescript
  let rawSecret: string | undefined = undefined
  let hashedSecret: string | null = null
  ```
- **4.** `[If]` `!isPublic`
  - **4.1.** `[Sequence]` Assign `rawSecret`
    ```typescript
    rawSecret = generateClientSecret()
    ```
  - **4.2.** `[Sequence]` Assign `hashedSecret`
    ```typescript
    hashedSecret = hashClientSecret(rawSecret)
    ```
- **5.** `[Sequence]` Database `create` on `OAuthClient` and stores it as `client`
- **6.** `[Return]` 
  ```json
  {
    "success": true,
    "client": {
      "id": "<client.id>",
      "clientId": "<client.clientId>",
      "clientSecret": "<rawSecret>",
      "name": "<client.name>",
      "description": "<client.description>",
      "logoUrl": "<client.logoUrl>",
      "websiteUrl": "<client.websiteUrl>",
      "redirectUris": [
        "<...client.redirectUris>"
      ],
      "isPublic": "<client.isPublic>",
      "isTrusted": "<client.isTrusted>",
      "createdAt": "<toDate(client.createdAt).toISOString()>"
    }
  }
  ```

#### `getApp(userId, idOrClientId)` (L624)

- **1.** `[Sequence]` Database `first` on `OAuthClient` and stores it as `client`
- **2.** `[If]` `!client`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `OAuth application '${idOrClientId}' was not found.`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "client": {
      "id": "<client.id>",
      "clientId": "<client.clientId>",
      "name": "<client.name>",
      "description": "<client.description>",
      "logoUrl": "<client.logoUrl>",
      "websiteUrl": "<client.websiteUrl>",
      "redirectUris": [
        "<...client.redirectUris>"
      ],
      "isPublic": "<client.isPublic>",
      "isTrusted": "<client.isTrusted>",
      "createdAt": "<toDate(client.createdAt).toISOString()>",
      "updatedAt": "<toDate(client.updatedAt).toISOString()>"
    }
  }
  ```

#### `updateApp(userId, idOrClientId, body)` (L651)

- **1.** `[Sequence]` Database `first` on `OAuthClient` and stores it as `client`
- **2.** `[If]` `!client`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `OAuth application '${idOrClientId}' was not found.`
- **3.** `[Sequence]` Database `update` on `OAuthClient` and stores it as `updated`
- **4.** `[If]` `!updated`
  - **4.1.** `[Error]` Throws `NotFound` (HTTP 404) — `OAuth application '${idOrClientId}' was not found.`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "client": {
      "id": "<updated.id>",
      "clientId": "<updated.clientId>",
      "name": "<updated.name>",
      "description": "<updated.description>",
      "logoUrl": "<updated.logoUrl>",
      "websiteUrl": "<updated.websiteUrl>",
      "redirectUris": [
        "<...updated.redirectUris>"
      ],
      "isPublic": "<updated.isPublic>",
      "isTrusted": "<updated.isTrusted>",
      "createdAt": "<toDate(updated.createdAt).toISOString()>",
      "updatedAt": "<toDate(updated.updatedAt).toISOString()>"
    }
  }
  ```

#### `deleteApp(userId, idOrClientId)` (L695)

- **1.** `[Sequence]` Database `first` on `OAuthClient` and stores it as `client`
- **2.** `[If]` `!client`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `OAuth application '${idOrClientId}' was not found.`
- **3.** `[Sequence]` Database `delete` on `OAuthClient`
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "<`OAuth application '${client.name}' deleted successfully.`>"
  }
  ```

#### `regenerateSecret(userId, idOrClientId)` (L712)

- **1.** `[Sequence]` Database `first` on `OAuthClient` and stores it as `client`
- **2.** `[If]` `!client`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `OAuth application '${idOrClientId}' was not found.`
- **3.** `[Sequence]` Calls `generateClientSecret` and stores result as `newSecret`
- **4.** `[Sequence]` Calls `hashClientSecret` and stores result as `hashed`
- **5.** `[Sequence]` Database `update` on `OAuthClient`
- **6.** `[Return]` 
  ```json
  {
    "success": true,
    "clientSecret": "<newSecret>"
  }
  ```

#### `listAuthorizations(userId)` (L738)

- **1.** `[Sequence]` Database `all` on `OAuthConsent` and stores it as `consents`
- **2.** `[Return]` 
  ```json
  {
    "success": true,
    "authorizations": "<consents.map((c) => ({ id: c.id, clientId: c.client.clientId, appName: c.client.name, appLogo: c.client.logoUrl, websiteUrl: c.client.websiteUrl, scopes: [...c.scopes], ...)>"
  }
  ```

#### `revokeAuthorization(userId, idOrClientId)` (L758)

- **1.** `[Sequence]` Database `first` on `OAuthClient` and stores it as `targetClient`
- **2.** `[Sequence]` Database `first` on `OAuthConsent` and stores it as `consent`
- **3.** `[If]` `!consent`
  - **3.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User authorization grant not found.'
- **4.** `[Sequence]` Database `all` on `OAuthConsent`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Authorization grant and associated tokens have been revoked."
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/utils/oauth.ts](../../../core/utils/oauth.md) ([[core/utils/oauth]]) — `SUPPORTED_SCOPES`, `parseScopes`, `generateClientId`, `generateClientSecret`, `hashClientSecret`, `verifyClientSecret`, `verifyPkceChallenge`, `generateSecureToken`, `getIssuerUrl`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `BadRequest`, `Forbidden`, `NotFound`, `Unauthorized`
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `SessionUser`
- `apps/carina/oauth/oauth.model.ts` — `CarinaOAuthModel`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `or`, `toDate`

### Called By / Imported By
- [apps/carina/oauth/oauth-discovery.ctrl.ts](./oauth-discovery.ctrl.md) ([[apps/carina/oauth/oauth-discovery.ctrl]]) — `CarinaOAuthServ`
- [apps/carina/oauth/oauth.ctrl.ts](./oauth.ctrl.md) ([[apps/carina/oauth/oauth.ctrl]]) — `CarinaOAuthServ`
