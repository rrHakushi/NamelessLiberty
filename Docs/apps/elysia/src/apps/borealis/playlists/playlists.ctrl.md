# playlists.ctrl.ts

- **Source**: [`apps/borealis/playlists/playlists.ctrl.ts`](../../../../../../../apps/elysia/src/apps/borealis/playlists/playlists.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Get user custom playlists | Borealis Playlists | query: `BorealisPlaylistsModel.listPlaylistsQuery` | `200`: `BorealisPlaylistsModel.listPlaylistsResponse`<br>`401`: `BorealisPlaylistsModel.unauthorizedError`<br>`422`: `BorealisPlaylistsModel.validationError` | `BorealisPlaylistsServ.listPlaylists` |
| `POST` | `/` | Create new playlist | Borealis Playlists | body: `BorealisPlaylistsModel.createPlaylistBody` | `200`: `BorealisPlaylistsModel.createPlaylistResponse`<br>`400`: `BorealisPlaylistsModel.badRequestError`<br>`401`: `BorealisPlaylistsModel.unauthorizedError`<br>`422`: `BorealisPlaylistsModel.validationError` | `BorealisPlaylistsServ.createPlaylist` |
| `GET` | `/:playlistId/entries` | Get playlist entries | Borealis Playlist Entries | params: `BorealisPlaylistsModel.playlistParam`<br>query: `BorealisPlaylistsModel.getEntriesQuery` | `200`: `BorealisPlaylistsModel.getEntriesResponse`<br>`401`: `BorealisPlaylistsModel.unauthorizedError`<br>`403`: `BorealisPlaylistsModel.forbiddenError`<br>`404`: `BorealisPlaylistsModel.notFoundError`<br>`422`: `BorealisPlaylistsModel.validationError` | `BorealisPlaylistsServ.getPlaylistEntries` |
| `POST` | `/:playlistId/entries` | Add entry to playlist | Borealis Playlist Entries | params: `BorealisPlaylistsModel.playlistParam`<br>body: `BorealisPlaylistsModel.addEntryBody` | `200`: `BorealisPlaylistsModel.addEntryResponse`<br>`400`: `BorealisPlaylistsModel.badRequestError`<br>`401`: `BorealisPlaylistsModel.unauthorizedError`<br>`403`: `BorealisPlaylistsModel.forbiddenError`<br>`404`: `BorealisPlaylistsModel.notFoundError`<br>`422`: `BorealisPlaylistsModel.validationError` | `BorealisPlaylistsServ.addPlaylistEntry` |
| `PATCH` | `/:playlistId/entries` | Update entry in playlist | Borealis Playlist Entries | params: `BorealisPlaylistsModel.playlistParam`<br>body: `BorealisPlaylistsModel.updateEntryBody` | `200`: `BorealisPlaylistsModel.updateEntryResponse`<br>`400`: `BorealisPlaylistsModel.badRequestError`<br>`401`: `BorealisPlaylistsModel.unauthorizedError`<br>`403`: `BorealisPlaylistsModel.forbiddenError`<br>`404`: `BorealisPlaylistsModel.notFoundError`<br>`422`: `BorealisPlaylistsModel.validationError` | `BorealisPlaylistsServ.updatePlaylistEntry` |
| `DELETE` | `/:playlistId/entries` | Remove entry from playlist | Borealis Playlist Entries | params: `BorealisPlaylistsModel.playlistParam`<br>query: `BorealisPlaylistsModel.removeEntryQuery`<br>body: `BorealisPlaylistsModel.removeEntryBody` | `200`: `BorealisPlaylistsModel.removeEntryResponse`<br>`400`: `BorealisPlaylistsModel.badRequestError`<br>`401`: `BorealisPlaylistsModel.unauthorizedError`<br>`403`: `BorealisPlaylistsModel.forbiddenError`<br>`404`: `BorealisPlaylistsModel.notFoundError`<br>`422`: `BorealisPlaylistsModel.validationError` | `BorealisPlaylistsServ.removePlaylistEntry` |
| `PUT` | `/:playlistId/reorder` | Reorder playlist entries | Borealis Playlist Entries | params: `BorealisPlaylistsModel.playlistParam`<br>body: `BorealisPlaylistsModel.reorderEntriesBody` | `200`: `BorealisPlaylistsModel.reorderEntriesResponse`<br>`400`: `BorealisPlaylistsModel.badRequestError`<br>`401`: `BorealisPlaylistsModel.unauthorizedError`<br>`403`: `BorealisPlaylistsModel.forbiddenError`<br>`404`: `BorealisPlaylistsModel.notFoundError`<br>`422`: `BorealisPlaylistsModel.validationError` | `BorealisPlaylistsServ.reorderEntries` |
| `GET` | `/:playlistId/collaborators` | List playlist collaborators | Borealis Playlist Collaborators | params: `BorealisPlaylistsModel.playlistParam` | `200`: `BorealisPlaylistsModel.listCollaboratorsResponse`<br>`401`: `BorealisPlaylistsModel.unauthorizedError`<br>`403`: `BorealisPlaylistsModel.forbiddenError`<br>`404`: `BorealisPlaylistsModel.notFoundError`<br>`422`: `BorealisPlaylistsModel.validationError` | `BorealisPlaylistsServ.listCollaborators` |
| `POST` | `/:playlistId/collaborators` | Add playlist collaborator | Borealis Playlist Collaborators | params: `BorealisPlaylistsModel.playlistParam`<br>body: `BorealisPlaylistsModel.addCollaboratorBody` | `200`: `BorealisPlaylistsModel.addCollaboratorResponse`<br>`400`: `BorealisPlaylistsModel.badRequestError`<br>`401`: `BorealisPlaylistsModel.unauthorizedError`<br>`403`: `BorealisPlaylistsModel.forbiddenError`<br>`404`: `BorealisPlaylistsModel.notFoundError`<br>`422`: `BorealisPlaylistsModel.validationError` | `BorealisPlaylistsServ.addCollaborator` |
| `PATCH` | `/:playlistId/collaborators/:collaboratorId` | Update collaborator role | Borealis Playlist Collaborators | params: `BorealisPlaylistsModel.collaboratorParam`<br>body: `BorealisPlaylistsModel.updateCollaboratorBody` | `200`: `BorealisPlaylistsModel.updateCollaboratorResponse`<br>`400`: `BorealisPlaylistsModel.badRequestError`<br>`401`: `BorealisPlaylistsModel.unauthorizedError`<br>`403`: `BorealisPlaylistsModel.forbiddenError`<br>`404`: `BorealisPlaylistsModel.notFoundError`<br>`422`: `BorealisPlaylistsModel.validationError` | `BorealisPlaylistsServ.updateCollaborator` |
| `DELETE` | `/:playlistId/collaborators/:collaboratorId` | Remove collaborator | Borealis Playlist Collaborators | params: `BorealisPlaylistsModel.collaboratorParam` | `200`: `BorealisPlaylistsModel.removeCollaboratorResponse`<br>`401`: `BorealisPlaylistsModel.unauthorizedError`<br>`403`: `BorealisPlaylistsModel.forbiddenError`<br>`404`: `BorealisPlaylistsModel.notFoundError`<br>`422`: `BorealisPlaylistsModel.validationError` | `BorealisPlaylistsServ.removeCollaborator` |
| `GET` | `/:playlistId/comments` | List custom list comments | Borealis Playlist Comments | params: `BorealisPlaylistsModel.playlistParam`<br>query: `BorealisPlaylistsModel.listCommentsQuery` | `200`: `BorealisPlaylistsModel.listCommentsResponse`<br>`401`: `BorealisPlaylistsModel.unauthorizedError`<br>`403`: `BorealisPlaylistsModel.forbiddenError`<br>`404`: `BorealisPlaylistsModel.notFoundError`<br>`422`: `BorealisPlaylistsModel.validationError` | `BorealisPlaylistsServ.listComments` |
| `POST` | `/:playlistId/comments` | Post comment on custom list | Borealis Playlist Comments | params: `BorealisPlaylistsModel.playlistParam`<br>body: `BorealisPlaylistsModel.createCommentBody` | `200`: `BorealisPlaylistsModel.createCommentResponse`<br>`400`: `BorealisPlaylistsModel.badRequestError`<br>`401`: `BorealisPlaylistsModel.unauthorizedError`<br>`403`: `BorealisPlaylistsModel.forbiddenError`<br>`404`: `BorealisPlaylistsModel.notFoundError`<br>`422`: `BorealisPlaylistsModel.validationError` | `BorealisPlaylistsServ.createComment` |
| `DELETE` | `/:playlistId/comments/:commentId` | Delete comment on custom list | Borealis Playlist Comments | params: `BorealisPlaylistsModel.commentParam` | `200`: `BorealisPlaylistsModel.deleteCommentResponse`<br>`401`: `BorealisPlaylistsModel.unauthorizedError`<br>`403`: `BorealisPlaylistsModel.forbiddenError`<br>`404`: `BorealisPlaylistsModel.notFoundError`<br>`422`: `BorealisPlaylistsModel.validationError` | `BorealisPlaylistsServ.deleteComment` |
| `GET` | `/:playlistId/activity` | Get playlist activity trail | Borealis Playlists | params: `BorealisPlaylistsModel.playlistParam`<br>query: `BorealisPlaylistsModel.activityQuery` | `200`: `BorealisPlaylistsModel.activityResponse`<br>`401`: `BorealisPlaylistsModel.unauthorizedError`<br>`403`: `BorealisPlaylistsModel.forbiddenError`<br>`404`: `BorealisPlaylistsModel.notFoundError`<br>`422`: `BorealisPlaylistsModel.validationError` | `BorealisPlaylistsServ.listActivity` |
| `PATCH` | `/:playlistId` | Update playlist details | Borealis Playlists | params: `BorealisPlaylistsModel.playlistParam`<br>body: `BorealisPlaylistsModel.updatePlaylistBody` | `200`: `BorealisPlaylistsModel.updatePlaylistResponse`<br>`400`: `BorealisPlaylistsModel.badRequestError`<br>`401`: `BorealisPlaylistsModel.unauthorizedError`<br>`403`: `BorealisPlaylistsModel.forbiddenError`<br>`404`: `BorealisPlaylistsModel.notFoundError`<br>`422`: `BorealisPlaylistsModel.validationError` | `BorealisPlaylistsServ.updatePlaylist` |
| `DELETE` | `/:playlistId` | Delete playlist | Borealis Playlists | params: `BorealisPlaylistsModel.playlistParam` | `200`: `BorealisPlaylistsModel.deletePlaylistResponse`<br>`401`: `BorealisPlaylistsModel.unauthorizedError`<br>`403`: `BorealisPlaylistsModel.forbiddenError`<br>`404`: `BorealisPlaylistsModel.notFoundError`<br>`422`: `BorealisPlaylistsModel.validationError` | `BorealisPlaylistsServ.deletePlaylist` |

### `GET /` (L8)
Lists all custom playlists belonging to the user or where user is a collaborator.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisPlaylistsModel.listPlaylistsQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisPlaylistsServ.listPlaylists(user.id, query)`

### `POST /` (L8)
Creates a custom playlist for the authenticated user.

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `BorealisPlaylistsModel.createPlaylistBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisPlaylistsServ.createPlaylist(user.id, body)`

### `GET /:playlistId/entries` (L8)
Retrieves entries within a custom playlist with catalog media details.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisPlaylistsModel.playlistParam`, query: `BorealisPlaylistsModel.getEntriesQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisPlaylistsServ.getPlaylistEntries(user.id, playlistId, query)`

### `POST /:playlistId/entries` (L8)
Appends a media item to the specified playlist.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisPlaylistsModel.playlistParam`, body: `BorealisPlaylistsModel.addEntryBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisPlaylistsServ.addPlaylistEntry(user.id, playlistId, body)`

### `PATCH /:playlistId/entries` (L8)
Updates notes, position, or reorders entries within a playlist.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisPlaylistsModel.playlistParam`, body: `BorealisPlaylistsModel.updateEntryBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisPlaylistsServ.updatePlaylistEntry(user.id, playlistId, body)`

### `DELETE /:playlistId/entries` (L138)
Removes a media item from the specified playlist.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisPlaylistsModel.playlistParam`, query: `BorealisPlaylistsModel.removeEntryQuery`, body: `BorealisPlaylistsModel.removeEntryBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Sequence]` Define `targetId`, `targetMediaType`, `targetMediaId`
  ```typescript
  const targetId = body?.id || query?.id
  const targetMediaType = body?.mediaType || query?.mediaType
  const targetMediaId = body?.mediaId !== undefined ? body.mediaId : query?.mediaId
  ```
- **4.** `[If]` `!targetId && !targetMediaType || targetMediaId === undefined`
  - **4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Target entry id or mediaType and mediaId is required'
- **5.** `[Return]`  — `await BorealisPlaylistsServ.removePlaylistEntry(user.id, playlistId, { id: targetId, mediaType: targetMediaType, mediaId: targetMediaId, })`

### `PUT /:playlistId/reorder` (L138)
Applies new sequential order to entries in the playlist.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisPlaylistsModel.playlistParam`, body: `BorealisPlaylistsModel.reorderEntriesBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisPlaylistsServ.reorderEntries(user.id, playlistId, body.entryIds)`

### `GET /:playlistId/collaborators` (L138)
Lists all users collaborating on this playlist with their roles.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisPlaylistsModel.playlistParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisPlaylistsServ.listCollaborators(user.id, playlistId)`

### `POST /:playlistId/collaborators` (L138)
Invites a user by username as Editor or Viewer to this playlist.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisPlaylistsModel.playlistParam`, body: `BorealisPlaylistsModel.addCollaboratorBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisPlaylistsServ.addCollaborator(user.id, playlistId, body)`

### `PATCH /:playlistId/collaborators/:collaboratorId` (L138)
Updates a collaborator role between EDITOR and VIEWER.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisPlaylistsModel.collaboratorParam`, body: `BorealisPlaylistsModel.updateCollaboratorBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisPlaylistsServ.updateCollaborator(user.id, playlistId, collaboratorId, ...)`

### `DELETE /:playlistId/collaborators/:collaboratorId` (L290)
Removes a collaborator from the playlist.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisPlaylistsModel.collaboratorParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisPlaylistsServ.removeCollaborator(user.id, playlistId, collaboratorId)`

### `GET /:playlistId/comments` (L290)
Retrieves comments and replies for the specified custom playlist.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisPlaylistsModel.playlistParam`, query: `BorealisPlaylistsModel.listCommentsQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisPlaylistsServ.listComments(user.id, playlistId, query)`

### `POST /:playlistId/comments` (L290)
Submits a new discussion comment on the specified custom playlist.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisPlaylistsModel.playlistParam`, body: `BorealisPlaylistsModel.createCommentBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisPlaylistsServ.createComment(user.id, playlistId, body)`

### `DELETE /:playlistId/comments/:commentId` (L290)
Deletes a comment (allowed for comment author, list owner, or admin).

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisPlaylistsModel.commentParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisPlaylistsServ.deleteComment(user, playlistId, commentId)`

### `GET /:playlistId/activity` (L290)
Chronological activity stream of changes and interactions in this playlist.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisPlaylistsModel.playlistParam`, query: `BorealisPlaylistsModel.activityQuery`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisPlaylistsServ.listActivity(user.id, playlistId, query, ...)`

### `PATCH /:playlistId` (L429)
Updates metadata, privacy, or cover image of an owned playlist.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisPlaylistsModel.playlistParam`, body: `BorealisPlaylistsModel.updatePlaylistBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisPlaylistsServ.updatePlaylist(user.id, playlistId, body)`

### `DELETE /:playlistId` (L429)
Permanently removes a playlist and its entry associations (owner only).

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisPlaylistsModel.playlistParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisPlaylistsServ.deletePlaylist(user.id, playlistId)`

## Exported Types, Methods & Algorithms

### `const borealisPlaylists` (L481)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/borealis/playlists/playlists.model.ts` — `BorealisPlaylistsModel`
- [apps/borealis/playlists/playlists.serv.ts](./playlists.serv.md) ([[apps/borealis/playlists/playlists.serv]]) — `BorealisPlaylistsServ`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `BadRequest`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_13`
