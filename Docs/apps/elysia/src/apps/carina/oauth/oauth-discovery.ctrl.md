# oauth-discovery.ctrl.ts

- **Source**: [`apps/carina/oauth/oauth-discovery.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/oauth/oauth-discovery.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/.well-known/openid-configuration` | OpenID Connect discovery document | OAuth 2.0 Discovery | — | `200`: `CarinaOAuthModel.openidConfigResponse` | `CarinaOAuthServ.getOpenIdConfiguration` |
| `GET` | `/.well-known/oauth-authorization-server` | OAuth 2.0 authorization server metadata | OAuth 2.0 Discovery | — | `200`: `CarinaOAuthModel.oauthServerConfigResponse` | `CarinaOAuthServ.getOAuthAuthorizationServerMetadata` |

### `GET /.well-known/openid-configuration` (L5)
RFC 8414 & OpenID Connect 1.0 machine-readable discovery metadata.

- **1.** `[Return]`  — `CarinaOAuthServ.getOpenIdConfiguration()`

### `GET /.well-known/oauth-authorization-server` (L5)
RFC 8414 OAuth 2.0 authorization server configuration metadata.

- **1.** `[Return]`  — `CarinaOAuthServ.getOAuthAuthorizationServerMetadata()`

## Exported Types, Methods & Algorithms

### `const carinaOAuthDiscovery` (L5)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- `apps/carina/oauth/oauth.model.ts` — `CarinaOAuthModel`
- [apps/carina/oauth/oauth.serv.ts](./oauth.serv.md) ([[apps/carina/oauth/oauth.serv]]) — `CarinaOAuthServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_27`
