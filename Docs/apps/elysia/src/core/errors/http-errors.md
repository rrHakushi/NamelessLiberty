# http-errors.ts

- **Source**: [`core/errors/http-errors.ts`](../../../../../../apps/elysia/src/core/errors/http-errors.ts)
- **Layer / Role**: Core Infrastructure
- **Inheritance**: `HttpError extends ElysiaError`, `BadRequest extends HttpError`, `Unauthorized extends HttpError`, `PaymentRequired extends HttpError`, `Forbidden extends HttpError`, `NotFound extends HttpError`, `MethodNotAllowed extends HttpError`, `NotAcceptable extends HttpError`, `ProxyAuthenticationRequired extends HttpError`, `RequestTimeout extends HttpError`, `Conflict extends HttpError`, `Gone extends HttpError`, `LengthRequired extends HttpError`, `PreconditionFailed extends HttpError`, `PayloadTooLarge extends HttpError`, `UriTooLong extends HttpError`, `UnsupportedMediaType extends HttpError`, `RangeNotSatisfiable extends HttpError`, `ExpectationFailed extends HttpError`, `ImATeapot extends HttpError`, `MisdirectedRequest extends HttpError`, `UnprocessableContent extends HttpError`, `Locked extends HttpError`, `FailedDependency extends HttpError`, `TooEarly extends HttpError`, `UpgradeRequired extends HttpError`, `PreconditionRequired extends HttpError`, `TooManyRequests extends HttpError`, `RequestHeaderFieldsTooLarge extends HttpError`, `UnavailableForLegalReasons extends HttpError`, `InternalServerError extends HttpError`, `NotImplemented extends HttpError`, `BadGateway extends HttpError`, `ServiceUnavailable extends HttpError`, `GatewayTimeout extends HttpError`, `HttpVersionNotSupported extends HttpError`, `VariantAlsoNegotiates extends HttpError`, `InsufficientStorage extends HttpError`, `LoopDetected extends HttpError`, `NotExtended extends HttpError`, `NetworkAuthenticationRequired extends HttpError`
- **Extended By**: [`BadRequest`](./http-errors.md) ([[core/errors/http-errors]]), [`Unauthorized`](./http-errors.md) ([[core/errors/http-errors]]), [`PaymentRequired`](./http-errors.md) ([[core/errors/http-errors]]), [`Forbidden`](./http-errors.md) ([[core/errors/http-errors]]), [`NotFound`](./http-errors.md) ([[core/errors/http-errors]]), [`MethodNotAllowed`](./http-errors.md) ([[core/errors/http-errors]]), [`NotAcceptable`](./http-errors.md) ([[core/errors/http-errors]]), [`ProxyAuthenticationRequired`](./http-errors.md) ([[core/errors/http-errors]]), [`RequestTimeout`](./http-errors.md) ([[core/errors/http-errors]]), [`Conflict`](./http-errors.md) ([[core/errors/http-errors]]), [`Gone`](./http-errors.md) ([[core/errors/http-errors]]), [`LengthRequired`](./http-errors.md) ([[core/errors/http-errors]]), [`PreconditionFailed`](./http-errors.md) ([[core/errors/http-errors]]), [`PayloadTooLarge`](./http-errors.md) ([[core/errors/http-errors]]), [`UriTooLong`](./http-errors.md) ([[core/errors/http-errors]]), [`UnsupportedMediaType`](./http-errors.md) ([[core/errors/http-errors]]), [`RangeNotSatisfiable`](./http-errors.md) ([[core/errors/http-errors]]), [`ExpectationFailed`](./http-errors.md) ([[core/errors/http-errors]]), [`ImATeapot`](./http-errors.md) ([[core/errors/http-errors]]), [`MisdirectedRequest`](./http-errors.md) ([[core/errors/http-errors]]), [`UnprocessableContent`](./http-errors.md) ([[core/errors/http-errors]]), [`Locked`](./http-errors.md) ([[core/errors/http-errors]]), [`FailedDependency`](./http-errors.md) ([[core/errors/http-errors]]), [`TooEarly`](./http-errors.md) ([[core/errors/http-errors]]), [`UpgradeRequired`](./http-errors.md) ([[core/errors/http-errors]]), [`PreconditionRequired`](./http-errors.md) ([[core/errors/http-errors]]), [`TooManyRequests`](./http-errors.md) ([[core/errors/http-errors]]), [`RequestHeaderFieldsTooLarge`](./http-errors.md) ([[core/errors/http-errors]]), [`UnavailableForLegalReasons`](./http-errors.md) ([[core/errors/http-errors]]), [`InternalServerError`](./http-errors.md) ([[core/errors/http-errors]]), [`NotImplemented`](./http-errors.md) ([[core/errors/http-errors]]), [`BadGateway`](./http-errors.md) ([[core/errors/http-errors]]), [`ServiceUnavailable`](./http-errors.md) ([[core/errors/http-errors]]), [`GatewayTimeout`](./http-errors.md) ([[core/errors/http-errors]]), [`HttpVersionNotSupported`](./http-errors.md) ([[core/errors/http-errors]]), [`VariantAlsoNegotiates`](./http-errors.md) ([[core/errors/http-errors]]), [`InsufficientStorage`](./http-errors.md) ([[core/errors/http-errors]]), [`LoopDetected`](./http-errors.md) ([[core/errors/http-errors]]), [`NotExtended`](./http-errors.md) ([[core/errors/http-errors]]), [`NetworkAuthenticationRequired`](./http-errors.md) ([[core/errors/http-errors]])

## Exported Types, Methods & Algorithms

### `const ProblemDetailsSchema` (L6)

RFC 9457 Problem Details Response Schema for OpenAPI & Eden Treaty

### `type ProblemDetails` (L15)

### `interface HttpErrorOptions` (L17)

### `class HttpError` extends `ElysiaError` (L26)

Base class for HTTP problem errors in Elysia, adhering to RFC 9457 / RFC 7807. Extends `ElysiaError` so Elysia automatically handles `.toResponse()` when returned or thrown.

#### `constructor(status, code, title, response = title, options)` (L35)

- **1.** `[Sequence]` Define `opts`
  ```typescript
  const opts = options instanceof Error ? { cause: options } : options
  ```
- **2.** `[Sequence]` Assign `this.name`
  ```typescript
  this.name = this.constructor.name
  ```
- **3.** `[Sequence]` Assign `this.status`
  ```typescript
  this.status = status
  ```
- **4.** `[Sequence]` Assign `this.code`
  ```typescript
  this.code = code
  ```
- **5.** `[Sequence]` Assign `this.title`
  ```typescript
  this.title = title
  ```
- **6.** `[Sequence]` Assign `this.problemType`
  ```typescript
  this.problemType = code
  ```
- **7.** `[Sequence]` Assign `this.problemTitle`
  ```typescript
  this.problemTitle = title
  ```
- **8.** `[Sequence]` Assign `this.response`
  ```typescript
  this.response = response
  ```
- **9.** `[Sequence]` Assign `this.instance`
  ```typescript
  this.instance = opts?.instance
  ```

#### `toResponse(headers)`: `Response` (L58)
Generates an RFC 9457 compliant Problem Details Response (`application/problem+json`).

- **1.** `[Sequence]` Define `body`
  ```typescript
  const body: Record<string, unknown> = { type: this.problemType, title: this.problemTitle, status: this.status, code: this.code, }
  ```
- **2.** `[If]` `this.response && this.response !== this.problemTitle`
  - **2.1.** `[Sequence]` Assign `body.detail`
    ```typescript
    body.detail = this.response
    ```
- **3.** `[If]` `this.instance`
  - **3.1.** `[Sequence]` Assign `body.instance`
    ```typescript
    body.instance = this.instance
    ```
- **4.** `[Return]`  — `new Response(JSON.stringify(body), { status: this.status, headers: { ...headers, "content-type": "application/problem+json", }, })`

### `class BadRequest` extends `HttpError` (L89)

400 Bad Request

#### `constructor(response = 'Bad Request', options)` (L90)
400 Bad Request

- _No executable statements_

### `class Unauthorized` extends `HttpError` (L96)

401 Unauthorized

#### `constructor(response = 'Unauthorized', options)` (L97)
401 Unauthorized

- _No executable statements_

### `class PaymentRequired` extends `HttpError` (L103)

402 Payment Required

#### `constructor(response = 'Payment Required', options)` (L104)
402 Payment Required

- _No executable statements_

### `class Forbidden` extends `HttpError` (L110)

403 Forbidden

#### `constructor(response = 'Forbidden', options)` (L111)
403 Forbidden

- _No executable statements_

### `class NotFound` extends `HttpError` (L117)

404 Not Found

#### `constructor(response = 'Not Found', options)` (L118)
404 Not Found

- _No executable statements_

### `class MethodNotAllowed` extends `HttpError` (L124)

405 Method Not Allowed

#### `constructor(response = 'Method Not Allowed', options)` (L125)
405 Method Not Allowed

- _No executable statements_

### `class NotAcceptable` extends `HttpError` (L131)

406 Not Acceptable

#### `constructor(response = 'Not Acceptable', options)` (L132)
406 Not Acceptable

- _No executable statements_

### `class ProxyAuthenticationRequired` extends `HttpError` (L138)

407 Proxy Authentication Required

#### `constructor(response = 'Proxy Authentication Required', options)` (L139)
407 Proxy Authentication Required

- _No executable statements_

### `class RequestTimeout` extends `HttpError` (L145)

408 Request Timeout

#### `constructor(response = 'Request Timeout', options)` (L146)
408 Request Timeout

- _No executable statements_

### `class Conflict` extends `HttpError` (L152)

409 Conflict

#### `constructor(response = 'Conflict', options)` (L153)
409 Conflict

- _No executable statements_

### `class Gone` extends `HttpError` (L159)

410 Gone

#### `constructor(response = 'Gone', options)` (L160)
410 Gone

- _No executable statements_

### `class LengthRequired` extends `HttpError` (L166)

411 Length Required

#### `constructor(response = 'Length Required', options)` (L167)
411 Length Required

- _No executable statements_

### `class PreconditionFailed` extends `HttpError` (L173)

412 Precondition Failed

#### `constructor(response = 'Precondition Failed', options)` (L174)
412 Precondition Failed

- _No executable statements_

### `class PayloadTooLarge` extends `HttpError` (L180)

413 Payload Too Large

#### `constructor(response = 'Payload Too Large', options)` (L181)
413 Payload Too Large

- _No executable statements_

### `class UriTooLong` extends `HttpError` (L187)

414 URI Too Long

#### `constructor(response = 'URI Too Long', options)` (L188)
414 URI Too Long

- _No executable statements_

### `class UnsupportedMediaType` extends `HttpError` (L194)

415 Unsupported Media Type

#### `constructor(response = 'Unsupported Media Type', options)` (L195)
415 Unsupported Media Type

- _No executable statements_

### `class RangeNotSatisfiable` extends `HttpError` (L201)

416 Range Not Satisfiable

#### `constructor(response = 'Range Not Satisfiable', options)` (L202)
416 Range Not Satisfiable

- _No executable statements_

### `class ExpectationFailed` extends `HttpError` (L208)

417 Expectation Failed

#### `constructor(response = 'Expectation Failed', options)` (L209)
417 Expectation Failed

- _No executable statements_

### `class ImATeapot` extends `HttpError` (L215)

418 I'm a Teapot

#### `constructor(response = 'I'm a teapot', options)` (L216)
418 I'm a Teapot

- _No executable statements_

### `class MisdirectedRequest` extends `HttpError` (L222)

421 Misdirected Request

#### `constructor(response = 'Misdirected Request', options)` (L223)
421 Misdirected Request

- _No executable statements_

### `class UnprocessableContent` extends `HttpError` (L229)

422 Unprocessable Content

#### `constructor(response = 'Unprocessable Content', options)` (L230)
422 Unprocessable Content

- _No executable statements_

### `class Locked` extends `HttpError` (L237)

423 Locked

#### `constructor(response = 'Locked', options)` (L238)
423 Locked

- _No executable statements_

### `class FailedDependency` extends `HttpError` (L244)

424 Failed Dependency

#### `constructor(response = 'Failed Dependency', options)` (L245)
424 Failed Dependency

- _No executable statements_

### `class TooEarly` extends `HttpError` (L251)

425 Too Early

#### `constructor(response = 'Too Early', options)` (L252)
425 Too Early

- _No executable statements_

### `class UpgradeRequired` extends `HttpError` (L258)

426 Upgrade Required

#### `constructor(response = 'Upgrade Required', options)` (L259)
426 Upgrade Required

- _No executable statements_

### `class PreconditionRequired` extends `HttpError` (L265)

428 Precondition Required

#### `constructor(response = 'Precondition Required', options)` (L266)
428 Precondition Required

- _No executable statements_

### `class TooManyRequests` extends `HttpError` (L272)

429 Too Many Requests

#### `constructor(response = 'Too Many Requests', options)` (L273)
429 Too Many Requests

- _No executable statements_

### `class RequestHeaderFieldsTooLarge` extends `HttpError` (L279)

431 Request Header Fields Too Large

#### `constructor(response = 'Request Header Fields Too Large', options)` (L280)
431 Request Header Fields Too Large

- _No executable statements_

### `class UnavailableForLegalReasons` extends `HttpError` (L286)

451 Unavailable For Legal Reasons

#### `constructor(response = 'Unavailable For Legal Reasons', options)` (L287)
451 Unavailable For Legal Reasons

- _No executable statements_

### `class InternalServerError` extends `HttpError` (L297)

500 Internal Server Error

#### `constructor(response = 'Internal Server Error', options)` (L298)
500 Internal Server Error

- _No executable statements_

### `class NotImplemented` extends `HttpError` (L304)

501 Not Implemented

#### `constructor(response = 'Not Implemented', options)` (L305)
501 Not Implemented

- _No executable statements_

### `class BadGateway` extends `HttpError` (L311)

502 Bad Gateway

#### `constructor(response = 'Bad Gateway', options)` (L312)
502 Bad Gateway

- _No executable statements_

### `class ServiceUnavailable` extends `HttpError` (L318)

503 Service Unavailable

#### `constructor(response = 'Service Unavailable', options)` (L319)
503 Service Unavailable

- _No executable statements_

### `class GatewayTimeout` extends `HttpError` (L325)

504 Gateway Timeout

#### `constructor(response = 'Gateway Timeout', options)` (L326)
504 Gateway Timeout

- _No executable statements_

### `class HttpVersionNotSupported` extends `HttpError` (L332)

505 HTTP Version Not Supported

#### `constructor(response = 'HTTP Version Not Supported', options)` (L333)
505 HTTP Version Not Supported

- _No executable statements_

### `class VariantAlsoNegotiates` extends `HttpError` (L339)

506 Variant Also Negotiates

#### `constructor(response = 'Variant Also Negotiates', options)` (L340)
506 Variant Also Negotiates

- _No executable statements_

### `class InsufficientStorage` extends `HttpError` (L346)

507 Insufficient Storage

#### `constructor(response = 'Insufficient Storage', options)` (L347)
507 Insufficient Storage

- _No executable statements_

### `class LoopDetected` extends `HttpError` (L353)

508 Loop Detected

#### `constructor(response = 'Loop Detected', options)` (L354)
508 Loop Detected

- _No executable statements_

### `class NotExtended` extends `HttpError` (L360)

510 Not Extended

#### `constructor(response = 'Not Extended', options)` (L361)
510 Not Extended

- _No executable statements_

### `class NetworkAuthenticationRequired` extends `HttpError` (L367)

511 Network Authentication Required

#### `constructor(response = 'Network Authentication Required', options)` (L368)
511 Network Authentication Required

- _No executable statements_

### `function isHttpError` (L374)

Type guard to test whether an unknown error is an ElysiaError / HttpError

- **1.** `[Return]`  — `error instanceof ElysiaError`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- _None_

### External / Workspace Packages
- `elysia` — `ElysiaError`, `t`, `UnwrapSchema`

### Called By / Imported By
- [apps/akaromi/ciphers/ciphers.serv.ts](../../apps/akaromi/ciphers/ciphers.serv.md) ([[apps/akaromi/ciphers/ciphers.serv]]) — `NotFound`, `BadRequest`
- [apps/akaromi/encryption/encryption.serv.ts](../../apps/akaromi/encryption/encryption.serv.md) ([[apps/akaromi/encryption/encryption.serv]]) — `NotFound`
- [apps/borealis/anime/anime.serv.ts](../../apps/borealis/anime/anime.serv.md) ([[apps/borealis/anime/anime.serv]]) — `NotFound`
- [apps/borealis/books/books.serv.ts](../../apps/borealis/books/books.serv.md) ([[apps/borealis/books/books.serv]]) — `NotFound`
- [apps/borealis/entities/entities.serv.ts](../../apps/borealis/entities/entities.serv.md) ([[apps/borealis/entities/entities.serv]]) — `NotFound`
- [apps/borealis/games/games.serv.ts](../../apps/borealis/games/games.serv.md) ([[apps/borealis/games/games.serv]]) — `NotFound`
- [apps/borealis/lists/lists.serv.ts](../../apps/borealis/lists/lists.serv.md) ([[apps/borealis/lists/lists.serv]]) — `NotFound`, `BadRequest`
- [apps/borealis/manga/manga.serv.ts](../../apps/borealis/manga/manga.serv.md) ([[apps/borealis/manga/manga.serv]]) — `NotFound`
- [apps/borealis/movies/movies.serv.ts](../../apps/borealis/movies/movies.serv.md) ([[apps/borealis/movies/movies.serv]]) — `NotFound`
- [apps/borealis/music/music.serv.ts](../../apps/borealis/music/music.serv.md) ([[apps/borealis/music/music.serv]]) — `NotFound`
- [apps/borealis/other/other.serv.ts](../../apps/borealis/other/other.serv.md) ([[apps/borealis/other/other.serv]]) — `BadRequest`, `Forbidden`, `NotFound`, `Conflict`
- [apps/borealis/playlists/playlists.ctrl.ts](../../apps/borealis/playlists/playlists.ctrl.md) ([[apps/borealis/playlists/playlists.ctrl]]) — `BadRequest`
- [apps/borealis/playlists/playlists.serv.ts](../../apps/borealis/playlists/playlists.serv.md) ([[apps/borealis/playlists/playlists.serv]]) — `NotFound`, `BadRequest`, `Forbidden`
- [apps/borealis/search/search.serv.ts](../../apps/borealis/search/search.serv.md) ([[apps/borealis/search/search.serv]]) — `BadRequest`
- [apps/borealis/tv/tv.serv.ts](../../apps/borealis/tv/tv.serv.md) ([[apps/borealis/tv/tv.serv]]) — `NotFound`
- [apps/carina/_shared/base-mfa.serv.ts](../../apps/carina/_shared/base-mfa.serv.md) ([[apps/carina/_shared/base-mfa.serv]]) — `BadRequest`, `Unauthorized`
- [apps/carina/activity/activity.serv.ts](../../apps/carina/activity/activity.serv.md) ([[apps/carina/activity/activity.serv]]) — `BadRequest`, `Forbidden`, `NotFound`
- [apps/carina/apikeys/apikeys.serv.ts](../../apps/carina/apikeys/apikeys.serv.md) ([[apps/carina/apikeys/apikeys.serv]]) — `BadRequest`, `NotFound`
- [apps/carina/auth/auth.serv.ts](../../apps/carina/auth/auth.serv.md) ([[apps/carina/auth/auth.serv]]) — `BadRequest`, `Conflict`, `NotFound`, `Unauthorized`
- [apps/carina/backupcodes/backupcodes.serv.ts](../../apps/carina/backupcodes/backupcodes.serv.md) ([[apps/carina/backupcodes/backupcodes.serv]]) — `BadRequest`, `NotFound`, `Unauthorized`
- [apps/carina/bookmarks/bookmarks.serv.ts](../../apps/carina/bookmarks/bookmarks.serv.md) ([[apps/carina/bookmarks/bookmarks.serv]]) — `NotFound`, `BadRequest`, `Forbidden`
- [apps/carina/comments/comments.serv.ts](../../apps/carina/comments/comments.serv.md) ([[apps/carina/comments/comments.serv]]) — `NotFound`, `BadRequest`, `Forbidden`
- [apps/carina/connections/connections.ctrl.ts](../../apps/carina/connections/connections.ctrl.md) ([[apps/carina/connections/connections.ctrl]]) — `Unauthorized`, `BadRequest`
- [apps/carina/connections/connections.serv.ts](../../apps/carina/connections/connections.serv.md) ([[apps/carina/connections/connections.serv]]) — `NotFound`, `BadRequest`
- [apps/carina/email-2fa/email-2fa.serv.ts](../../apps/carina/email-2fa/email-2fa.serv.md) ([[apps/carina/email-2fa/email-2fa.serv]]) — `BadRequest`, `NotFound`, `Unauthorized`, `TooManyRequests`
- [apps/carina/favorites/favorites.serv.ts](../../apps/carina/favorites/favorites.serv.md) ([[apps/carina/favorites/favorites.serv]]) — `NotFound`, `BadRequest`
- [apps/carina/friends/friends.serv.ts](../../apps/carina/friends/friends.serv.md) ([[apps/carina/friends/friends.serv]]) — `BadRequest`, `NotFound`
- [apps/carina/notifications/notifications.serv.ts](../../apps/carina/notifications/notifications.serv.md) ([[apps/carina/notifications/notifications.serv]]) — `NotFound`
- [apps/carina/oauth/oauth.serv.ts](../../apps/carina/oauth/oauth.serv.md) ([[apps/carina/oauth/oauth.serv]]) — `BadRequest`, `Forbidden`, `NotFound`, `Unauthorized`
- [apps/carina/passkeys/passkeys.serv.ts](../../apps/carina/passkeys/passkeys.serv.md) ([[apps/carina/passkeys/passkeys.serv]]) — `BadRequest`, `NotFound`
- [apps/carina/public/public.serv.ts](../../apps/carina/public/public.serv.md) ([[apps/carina/public/public.serv]]) — `NotFound`, `BadRequest`
- [apps/carina/qc/qc.serv.ts](../../apps/carina/qc/qc.serv.md) ([[apps/carina/qc/qc.serv]]) — `BadRequest`
- [apps/carina/recommendations/recommendations.serv.ts](../../apps/carina/recommendations/recommendations.serv.md) ([[apps/carina/recommendations/recommendations.serv]]) — `NotFound`, `BadRequest`, `Forbidden`
- [apps/carina/totp/totp.serv.ts](../../apps/carina/totp/totp.serv.md) ([[apps/carina/totp/totp.serv]]) — `BadRequest`, `NotFound`, `Unauthorized`
- [apps/carina/users/users.serv.ts](../../apps/carina/users/users.serv.md) ([[apps/carina/users/users.serv]]) — `BadRequest`, `Forbidden`, `NotFound`
- [apps/kiroshi/history/history.serv.ts](../../apps/kiroshi/history/history.serv.md) ([[apps/kiroshi/history/history.serv]]) — `NotFound`
- [apps/kiroshi/search/search.ctrl.ts](../../apps/kiroshi/search/search.ctrl.md) ([[apps/kiroshi/search/search.ctrl]]) — `Unauthorized`
- [apps/kiroshi/search/search.serv.ts](../../apps/kiroshi/search/search.serv.md) ([[apps/kiroshi/search/search.serv]]) — `BadRequest`, `BadGateway`, `TooManyRequests`
- [apps/kiroshi/settings/settings.serv.ts](../../apps/kiroshi/settings/settings.serv.md) ([[apps/kiroshi/settings/settings.serv]]) — `NotFound`
- [apps/tesseract/signaling/tesseract.ctrl.ts](../../apps/tesseract/signaling/tesseract.ctrl.md) ([[apps/tesseract/signaling/tesseract.ctrl]]) — `Unauthorized`
- [core/base/base.serv.ts](../base/base.serv.md) ([[core/base/base.serv]]) — `Forbidden`
- [core/plugins/session.ts](../plugins/session.md) ([[core/plugins/session]]) — `Unauthorized`
- [core/utils/network.ts](../utils/network.md) ([[core/utils/network]]) — `BadRequest`
- [server.ts](../../server.md) ([[server]]) — `isHttpError`
