# oauth.ctrl.ts

- **Source**: [`apps/carina/oauth/oauth.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/oauth/oauth.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/carina/oauth/authorize` | OAuth authorization endpoint (consent / prompt) | Carina OAuth Provider | query: `CarinaOAuthModel.authorizeQuery` | `200`: `CarinaOAuthModel.authorizeGetResponse`<br>`400`: `CarinaOAuthModel.badRequestError`<br>`404`: `CarinaOAuthModel.notFoundError`<br>`422`: `CarinaOAuthModel.validationError` | `CarinaOAuthServ.getAuthorize` |
| `POST` | `/carina/oauth/authorize` | Process OAuth authorization grant | Carina OAuth Provider | body: `CarinaOAuthModel.authorizeBody` | `200`: `CarinaOAuthModel.authorizePostResponse`<br>`400`: `CarinaOAuthModel.badRequestError`<br>`401`: `CarinaOAuthModel.unauthorizedError`<br>`404`: `CarinaOAuthModel.notFoundError`<br>`422`: `CarinaOAuthModel.validationError` | `CarinaOAuthServ.postAuthorize` |
| `POST` | `/carina/oauth/token` | Exchange authorization code for token | Carina OAuth Provider | body: `CarinaOAuthModel.tokenBody` | `200`: `CarinaOAuthModel.tokenResponse`<br>`400`: `CarinaOAuthModel.badRequestError`<br>`401`: `CarinaOAuthModel.unauthorizedError`<br>`422`: `CarinaOAuthModel.validationError` | `CarinaOAuthServ.postToken` |
| `GET` | `/carina/oauth/userinfo` | Get userinfo profile for access token | Carina OAuth Provider | — | `200`: `CarinaOAuthModel.userinfoResponse`<br>`401`: `CarinaOAuthModel.unauthorizedError`<br>`404`: `CarinaOAuthModel.notFoundError` | `CarinaOAuthServ.getUserinfo` |
| `POST` | `/carina/oauth/revoke` | Revoke OAuth token | Carina OAuth Provider | body: `CarinaOAuthModel.revokeBody` | `200`: `CarinaOAuthModel.revokeResponse`<br>`400`: `CarinaOAuthModel.badRequestError`<br>`422`: `CarinaOAuthModel.validationError` | `CarinaOAuthServ.postRevoke` |
| `POST` | `/carina/oauth/introspect` | Introspect OAuth token | Carina OAuth Provider | body: `CarinaOAuthModel.introspectBody` | `200`: `CarinaOAuthModel.introspectResponse`<br>`422`: `CarinaOAuthModel.validationError` | `CarinaOAuthServ.postIntrospect` |
| `POST` | `/carina/oauth/register` | Dynamic client registration | Carina OAuth Provider | body: `CarinaOAuthModel.registerClientBody` | `200`: `CarinaOAuthModel.registerClientResponse`<br>`400`: `CarinaOAuthModel.badRequestError`<br>`422`: `CarinaOAuthModel.validationError` | `CarinaOAuthServ.postRegisterClient` |
| `GET` | `/carina/oauth/apps` | List registered OAuth applications | Carina OAuth Apps | — | `200`: `CarinaOAuthModel.listAppsResponse`<br>`401`: `CarinaOAuthModel.unauthorizedError` | `CarinaOAuthServ.listApps` |
| `POST` | `/carina/oauth/apps` | Create new OAuth application | Carina OAuth Apps | body: `CarinaOAuthModel.createAppBody` | `200`: `CarinaOAuthModel.createAppResponse`<br>`400`: `CarinaOAuthModel.badRequestError`<br>`401`: `CarinaOAuthModel.unauthorizedError`<br>`422`: `CarinaOAuthModel.validationError` | `CarinaOAuthServ.createApp` |
| `GET` | `/carina/oauth/apps/:id` | Get OAuth application details | Carina OAuth Apps | params: `t.Object({ id: t.String({ description: 'Application database ID or Client ID' }), })` | `200`: `CarinaOAuthModel.appDetailsResponse`<br>`401`: `CarinaOAuthModel.unauthorizedError`<br>`404`: `CarinaOAuthModel.notFoundError` | `CarinaOAuthServ.getApp` |
| `PATCH` | `/carina/oauth/apps/:id` | Update OAuth application | Carina OAuth Apps | params: `t.Object({ id: t.String({ description: 'Application database ID or Client ID' }), })`<br>body: `CarinaOAuthModel.updateAppBody` | `200`: `CarinaOAuthModel.appDetailsResponse`<br>`400`: `CarinaOAuthModel.badRequestError`<br>`401`: `CarinaOAuthModel.unauthorizedError`<br>`404`: `CarinaOAuthModel.notFoundError`<br>`422`: `CarinaOAuthModel.validationError` | `CarinaOAuthServ.updateApp` |
| `PUT` | `/carina/oauth/apps/:id` | Update OAuth application | Carina OAuth Apps | params: `t.Object({ id: t.String({ description: 'Application database ID or Client ID' }), })`<br>body: `CarinaOAuthModel.updateAppBody` | `200`: `CarinaOAuthModel.appDetailsResponse`<br>`400`: `CarinaOAuthModel.badRequestError`<br>`401`: `CarinaOAuthModel.unauthorizedError`<br>`404`: `CarinaOAuthModel.notFoundError`<br>`422`: `CarinaOAuthModel.validationError` | `CarinaOAuthServ.updateApp` |
| `DELETE` | `/carina/oauth/apps/:id` | Delete OAuth application | Carina OAuth Apps | params: `t.Object({ id: t.String({ description: 'Application database ID or Client ID' }), })` | `200`: `CarinaOAuthModel.deleteAppResponse`<br>`401`: `CarinaOAuthModel.unauthorizedError`<br>`404`: `CarinaOAuthModel.notFoundError` | `CarinaOAuthServ.deleteApp` |
| `POST` | `/carina/oauth/apps/:id/regenerate-secret` | Regenerate OAuth application client secret | Carina OAuth Apps | params: `t.Object({ id: t.String({ description: 'Application database ID or Client ID' }), })` | `200`: `CarinaOAuthModel.regenerateSecretResponse`<br>`401`: `CarinaOAuthModel.unauthorizedError`<br>`404`: `CarinaOAuthModel.notFoundError` | `CarinaOAuthServ.regenerateSecret` |
| `GET` | `/carina/oauth/authorizations` | List user authorized OAuth applications | Carina OAuth Grants | — | `200`: `CarinaOAuthModel.listAuthorizationsResponse`<br>`401`: `CarinaOAuthModel.unauthorizedError` | `CarinaOAuthServ.listAuthorizations` |
| `DELETE` | `/carina/oauth/authorizations/:id` | Revoke authorized OAuth application | Carina OAuth Grants | params: `t.Object({ id: t.String({ description: 'Authorization ID or Client ID to revoke' }), })` | `200`: `CarinaOAuthModel.revokeAuthorizationResponse`<br>`401`: `CarinaOAuthModel.unauthorizedError`<br>`404`: `CarinaOAuthModel.notFoundError` | `CarinaOAuthServ.revokeAuthorization` |

### `GET /carina/oauth/authorize` (L6)
Validates client application credentials and returns details for the user consent screen.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `CarinaOAuthModel.authorizeQuery`
- **2.** `[Sequence]` Calls `userSession.getUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaOAuthServ.getAuthorize(query, user)`

### `POST /carina/oauth/authorize` (L6)
Records user approval and issues an authorization code redirecting to the application callback.

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaOAuthModel.authorizeBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaOAuthServ.postAuthorize(body, user)`

### `POST /carina/oauth/token` (L6)
RFC 6749 Token endpoint supporting authorization_code, refresh_token, and client_credentials grants.

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaOAuthModel.tokenBody`
- **2.** `[Sequence]` Calls `request.headers.get` and stores result as `authHeader`
- **3.** `[Return]`  — `await CarinaOAuthServ.postToken(body, authHeader)`

### `GET /carina/oauth/userinfo` (L6)
OpenID Connect UserInfo endpoint returning identity profile claims.

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await CarinaOAuthServ.getUserinfo(user)`

### `POST /carina/oauth/revoke` (L6)
RFC 7009 Token Revocation endpoint to invalidate access or refresh tokens.

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaOAuthModel.revokeBody`
- **2.** `[Return]`  — `await CarinaOAuthServ.postRevoke(body)`

### `POST /carina/oauth/introspect` (L6)
RFC 7662 Token Introspection endpoint returning token active state, scopes, and identity metadata.

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaOAuthModel.introspectBody`
- **2.** `[Return]`  — `await CarinaOAuthServ.postIntrospect(body)`

### `POST /carina/oauth/register` (L6)
RFC 7591 Dynamic Client Registration endpoint for automated application registration.

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaOAuthModel.registerClientBody`
- **2.** `[Sequence]` Calls `userSession.getUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaOAuthServ.postRegisterClient(body, user)`

### `GET /carina/oauth/apps` (L6)
Lists all OAuth client applications registered by the authenticated user.

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await CarinaOAuthServ.listApps(user.id)`

### `POST /carina/oauth/apps` (L6)
Registers a new OAuth client application and returns its credentials.

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaOAuthModel.createAppBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaOAuthServ.createApp(user.id, body)`

### `GET /carina/oauth/apps/:id` (L6)
Retrieves metadata for an application owned by the authenticated user.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ id: t.String({ description: 'Application database ID or Client ID' }), })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaOAuthServ.getApp(user.id, id)`

### `PATCH /carina/oauth/apps/:id` (L6)
Modifies application configuration, redirect URIs, or display information.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ id: t.String({ description: 'Application database ID or Client ID' }), })`, body: `CarinaOAuthModel.updateAppBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaOAuthServ.updateApp(user.id, id, body)`

### `PUT /carina/oauth/apps/:id` (L6)
Modifies application configuration, redirect URIs, or display information.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ id: t.String({ description: 'Application database ID or Client ID' }), })`, body: `CarinaOAuthModel.updateAppBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaOAuthServ.updateApp(user.id, id, body)`

### `DELETE /carina/oauth/apps/:id` (L6)
Permanently deletes an OAuth application and revokes all issued tokens.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ id: t.String({ description: 'Application database ID or Client ID' }), })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaOAuthServ.deleteApp(user.id, id)`

### `POST /carina/oauth/apps/:id/regenerate-secret` (L6)
Invalidates existing client secret and generates a new secret.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ id: t.String({ description: 'Application database ID or Client ID' }), })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaOAuthServ.regenerateSecret(user.id, id)`

### `GET /carina/oauth/authorizations` (L6)
Lists all third-party applications the authenticated user has granted access to.

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await CarinaOAuthServ.listAuthorizations(user.id)`

### `DELETE /carina/oauth/authorizations/:id` (L6)
Revokes access for a third-party application and invalidates all associated tokens.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `t.Object({ id: t.String({ description: 'Authorization ID or Client ID to revoke' }), })`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaOAuthServ.revokeAuthorization(user.id, id)`

## Exported Types, Methods & Algorithms

### `const carinaOAuth` (L6)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/carina/oauth/oauth.model.ts` — `CarinaOAuthModel`
- [apps/carina/oauth/oauth.serv.ts](./oauth.serv.md) ([[apps/carina/oauth/oauth.serv]]) — `CarinaOAuthServ`

### External / Workspace Packages
- `elysia` — `Elysia`, `t`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_28`
