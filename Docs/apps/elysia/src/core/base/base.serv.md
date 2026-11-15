# base.serv.ts

- **Source**: [`core/base/base.serv.ts`](../../../../../../apps/elysia/src/core/base/base.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Extended By**: [`AkaromiCiphersServ`](../../apps/akaromi/ciphers/ciphers.serv.md) ([[apps/akaromi/ciphers/ciphers.serv]]), [`AkaromiEncryptionService`](../../apps/akaromi/encryption/encryption.serv.md) ([[apps/akaromi/encryption/encryption.serv]]), [`AkaromiVaultService`](../../apps/akaromi/vault/vault.serv.md) ([[apps/akaromi/vault/vault.serv]]), [`BaseBorealisMediaService`](../../apps/borealis/_shared/base-media.serv.md) ([[apps/borealis/_shared/base-media.serv]]), [`MediaStatsServ`](../../apps/borealis/_shared/media-stats.serv.md) ([[apps/borealis/_shared/media-stats.serv]]), [`BorealisCalendarServ`](../../apps/borealis/calendar/calendar.serv.md) ([[apps/borealis/calendar/calendar.serv]]), [`BorealisEntitiesServ`](../../apps/borealis/entities/entities.serv.md) ([[apps/borealis/entities/entities.serv]]), [`BaseBorealisListService`](../../apps/borealis/lists/_base/base-list.serv.md) ([[apps/borealis/lists/_base/base-list.serv]]), [`BaseMediaStatsService`](../../apps/borealis/lists/_base/base-stats.serv.md) ([[apps/borealis/lists/_base/base-stats.serv]]), [`BorealisPlaylistsServ`](../../apps/borealis/playlists/playlists.serv.md) ([[apps/borealis/playlists/playlists.serv]]), [`BorealisExternalSearchServ`](../../apps/borealis/search/external-search.serv.md) ([[apps/borealis/search/external-search.serv]]), [`BorealisSearchServ`](../../apps/borealis/search/search.serv.md) ([[apps/borealis/search/search.serv]]), [`BaseMfaService`](../../apps/carina/_shared/base-mfa.serv.md) ([[apps/carina/_shared/base-mfa.serv]]), [`ActivityServ`](../../apps/carina/activity/activity.serv.md) ([[apps/carina/activity/activity.serv]]), [`CarinaApiKeysServ`](../../apps/carina/apikeys/apikeys.serv.md) ([[apps/carina/apikeys/apikeys.serv]]), [`CarinaAuthServ`](../../apps/carina/auth/auth.serv.md) ([[apps/carina/auth/auth.serv]]), [`CarinaBookmarksServ`](../../apps/carina/bookmarks/bookmarks.serv.md) ([[apps/carina/bookmarks/bookmarks.serv]]), [`CarinaCommentsServ`](../../apps/carina/comments/comments.serv.md) ([[apps/carina/comments/comments.serv]]), [`CarinaConnectionsServ`](../../apps/carina/connections/connections.serv.md) ([[apps/carina/connections/connections.serv]]), [`CarinaFavoritesServ`](../../apps/carina/favorites/favorites.serv.md) ([[apps/carina/favorites/favorites.serv]]), [`CarinaFriendsServ`](../../apps/carina/friends/friends.serv.md) ([[apps/carina/friends/friends.serv]]), [`CarinaNotificationsServ`](../../apps/carina/notifications/notifications.serv.md) ([[apps/carina/notifications/notifications.serv]]), [`CarinaOAuthServ`](../../apps/carina/oauth/oauth.serv.md) ([[apps/carina/oauth/oauth.serv]]), [`PublicAssetsServ`](../../apps/carina/public/public.serv.md) ([[apps/carina/public/public.serv]]), [`CarinaQcServ`](../../apps/carina/qc/qc.serv.md) ([[apps/carina/qc/qc.serv]]), [`CarinaRecommendationsServ`](../../apps/carina/recommendations/recommendations.serv.md) ([[apps/carina/recommendations/recommendations.serv]]), [`CarinaUsersServ`](../../apps/carina/users/users.serv.md) ([[apps/carina/users/users.serv]]), [`KiroshiHistoryServ`](../../apps/kiroshi/history/history.serv.md) ([[apps/kiroshi/history/history.serv]]), [`KiroshiSearchServ`](../../apps/kiroshi/search/search.serv.md) ([[apps/kiroshi/search/search.serv]]), [`KiroshiSettingsService`](../../apps/kiroshi/settings/settings.serv.md) ([[apps/kiroshi/settings/settings.serv]]), [`ServarrServ`](../../apps/servarr/core/servarr.serv.md) ([[apps/servarr/core/servarr.serv]]), [`ServarrExtendedServ`](../../apps/servarr/extended/servarr-extended.serv.md) ([[apps/servarr/extended/servarr-extended.serv]]), [`ServarrRealtimeServ`](../../apps/servarr/realtime/servarr-realtime.serv.md) ([[apps/servarr/realtime/servarr-realtime.serv]]), [`EmailServiceImpl`](../email/email.serv.md) ([[core/email/email.serv]])

## Exported Types, Methods & Algorithms

### `class BaseService` (L11)

Abstract foundation for all IRIS Elysia application services. Provides structured logging, shared pagination clamping, authorization guards, and controlled access to the existing `@NamelessLiberty/cache` manager.

#### `constructor(loggerName)` (L15)

- **1.** `[Sequence]` Assign `this.logger`
  ```typescript
  this.logger = new LogFactory(loggerName)
  ```

#### `clampPagination(pageRaw, limitRaw, defaultLimit = 20, maxLimit = 100)`: `{ page: number; limit: number; skip: number }` (L23)
Clamps pagination query parameters into safe bounded integers.

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`
  ```typescript
  const skip = page - 1 * limit
  ```
- **4.** `[Return]` 
  ```json
  {
    "page": "<page>",
    "limit": "<limit>",
    "skip": "<skip>"
  }
  ```

#### `isAdmin(permissions)`: `boolean` (L39)
Checks whether a user's permission bitfield includes ADMINISTRATOR privileges.

- **1.** `[If]` `!permissions || permissions.length === 0`
  - **1.1.** `[Return]`  — `false`
- **2.** `[Return]`  — `new IRISBitField(permissions).has(IRISFlags.ADMINISTRATOR)`

#### `assertOwnerOrAdmin(ownerId, callerId, permissions, resourceLabel = 'resource')`: `void` (L47)
Verifies that the authenticated caller owns a resource or holds ADMINISTRATOR privileges.

- **1.** `[If]` `ownerId === callerId`
  - **1.1.** `[Return]`  — `void`
- **2.** `[If]` `this.isAdmin(permissions)`
  - **2.1.** `[Return]`  — `void`
- **3.** `[Error]` Throws `Forbidden` (HTTP 403) — `You do not have permission to modify this ${resourceLabel}.`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/errors/http-errors.ts](../errors/http-errors.md) ([[core/errors/http-errors]]) — `Forbidden`
- [core/utils/cache.ts](../utils/cache.md) ([[core/utils/cache]]) — `cache`

### External / Workspace Packages
- `@NamelessLiberty/logger` — `LogFactory`
- `@NamelessLiberty/permissions` — `IRISBitField`, `IRISFlags`

### Called By / Imported By
- [apps/akaromi/ciphers/ciphers.serv.ts](../../apps/akaromi/ciphers/ciphers.serv.md) ([[apps/akaromi/ciphers/ciphers.serv]]) — `BaseService`
- [apps/akaromi/encryption/encryption.serv.ts](../../apps/akaromi/encryption/encryption.serv.md) ([[apps/akaromi/encryption/encryption.serv]]) — `BaseService`
- [apps/akaromi/vault/vault.serv.ts](../../apps/akaromi/vault/vault.serv.md) ([[apps/akaromi/vault/vault.serv]]) — `BaseService`
- [apps/borealis/_shared/base-media.serv.ts](../../apps/borealis/_shared/base-media.serv.md) ([[apps/borealis/_shared/base-media.serv]]) — `BaseService`
- [apps/borealis/_shared/media-stats.serv.ts](../../apps/borealis/_shared/media-stats.serv.md) ([[apps/borealis/_shared/media-stats.serv]]) — `BaseService`
- [apps/borealis/calendar/calendar.serv.ts](../../apps/borealis/calendar/calendar.serv.md) ([[apps/borealis/calendar/calendar.serv]]) — `BaseService`
- [apps/borealis/entities/entities.serv.ts](../../apps/borealis/entities/entities.serv.md) ([[apps/borealis/entities/entities.serv]]) — `BaseService`
- [apps/borealis/lists/_base/base-list.serv.ts](../../apps/borealis/lists/_base/base-list.serv.md) ([[apps/borealis/lists/_base/base-list.serv]]) — `BaseService`
- [apps/borealis/lists/_base/base-stats.serv.ts](../../apps/borealis/lists/_base/base-stats.serv.md) ([[apps/borealis/lists/_base/base-stats.serv]]) — `BaseService`
- [apps/borealis/playlists/playlists.serv.ts](../../apps/borealis/playlists/playlists.serv.md) ([[apps/borealis/playlists/playlists.serv]]) — `BaseService`
- [apps/borealis/search/external-search.serv.ts](../../apps/borealis/search/external-search.serv.md) ([[apps/borealis/search/external-search.serv]]) — `BaseService`
- [apps/borealis/search/search.serv.ts](../../apps/borealis/search/search.serv.md) ([[apps/borealis/search/search.serv]]) — `BaseService`
- [apps/carina/_shared/base-mfa.serv.ts](../../apps/carina/_shared/base-mfa.serv.md) ([[apps/carina/_shared/base-mfa.serv]]) — `BaseService`
- [apps/carina/activity/activity.serv.ts](../../apps/carina/activity/activity.serv.md) ([[apps/carina/activity/activity.serv]]) — `BaseService`
- [apps/carina/apikeys/apikeys.serv.ts](../../apps/carina/apikeys/apikeys.serv.md) ([[apps/carina/apikeys/apikeys.serv]]) — `BaseService`
- [apps/carina/auth/auth.serv.ts](../../apps/carina/auth/auth.serv.md) ([[apps/carina/auth/auth.serv]]) — `BaseService`
- [apps/carina/bookmarks/bookmarks.serv.ts](../../apps/carina/bookmarks/bookmarks.serv.md) ([[apps/carina/bookmarks/bookmarks.serv]]) — `BaseService`
- [apps/carina/comments/comments.serv.ts](../../apps/carina/comments/comments.serv.md) ([[apps/carina/comments/comments.serv]]) — `BaseService`
- [apps/carina/connections/connections.serv.ts](../../apps/carina/connections/connections.serv.md) ([[apps/carina/connections/connections.serv]]) — `BaseService`
- [apps/carina/favorites/favorites.serv.ts](../../apps/carina/favorites/favorites.serv.md) ([[apps/carina/favorites/favorites.serv]]) — `BaseService`
- [apps/carina/friends/friends.serv.ts](../../apps/carina/friends/friends.serv.md) ([[apps/carina/friends/friends.serv]]) — `BaseService`
- [apps/carina/notifications/notifications.serv.ts](../../apps/carina/notifications/notifications.serv.md) ([[apps/carina/notifications/notifications.serv]]) — `BaseService`
- [apps/carina/oauth/oauth.serv.ts](../../apps/carina/oauth/oauth.serv.md) ([[apps/carina/oauth/oauth.serv]]) — `BaseService`
- [apps/carina/public/public.serv.ts](../../apps/carina/public/public.serv.md) ([[apps/carina/public/public.serv]]) — `BaseService`
- [apps/carina/qc/qc.serv.ts](../../apps/carina/qc/qc.serv.md) ([[apps/carina/qc/qc.serv]]) — `BaseService`
- [apps/carina/recommendations/recommendations.serv.ts](../../apps/carina/recommendations/recommendations.serv.md) ([[apps/carina/recommendations/recommendations.serv]]) — `BaseService`
- [apps/carina/users/users.serv.ts](../../apps/carina/users/users.serv.md) ([[apps/carina/users/users.serv]]) — `BaseService`
- [apps/kiroshi/history/history.serv.ts](../../apps/kiroshi/history/history.serv.md) ([[apps/kiroshi/history/history.serv]]) — `BaseService`
- [apps/kiroshi/search/search.serv.ts](../../apps/kiroshi/search/search.serv.md) ([[apps/kiroshi/search/search.serv]]) — `BaseService`
- [apps/kiroshi/settings/settings.serv.ts](../../apps/kiroshi/settings/settings.serv.md) ([[apps/kiroshi/settings/settings.serv]]) — `BaseService`
- [apps/servarr/core/servarr.serv.ts](../../apps/servarr/core/servarr.serv.md) ([[apps/servarr/core/servarr.serv]]) — `BaseService`
- [apps/servarr/extended/servarr-extended.serv.ts](../../apps/servarr/extended/servarr-extended.serv.md) ([[apps/servarr/extended/servarr-extended.serv]]) — `BaseService`
- [apps/servarr/realtime/servarr-realtime.serv.ts](../../apps/servarr/realtime/servarr-realtime.serv.md) ([[apps/servarr/realtime/servarr-realtime.serv]]) — `BaseService`
- [core/email/email.serv.ts](../email/email.serv.md) ([[core/email/email.serv]]) — `BaseService`
