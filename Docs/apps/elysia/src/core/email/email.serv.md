# email.serv.ts

- **Source**: [`core/email/email.serv.ts`](../../../../../../apps/elysia/src/core/email/email.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `EmailServiceImpl extends BaseService`

## Exported Types, Methods & Algorithms

### `class EmailServiceImpl` extends `BaseService` (L8)

Application service for queuing transactional emails (MFA codes, password resets, raw emails). Worker lifecycle is managed exclusively by cluster primary (`src/index.ts`), never on module import.

#### `constructor()` (L9)
Application service for queuing transactional emails (MFA codes, password resets, raw emails). Worker lifecycle is managed exclusively by cluster primary (`src/index.ts`), never on module import.

- _No executable statements_

#### `sendMfaCodeEmail(email, code, expiryMinutes = 5)`: `Promise<void>` (L16)
Enqueues an MFA verification email job.

- **1.** `[Sequence]` Calls `addEmailJob`

#### `sendPasswordResetEmail(email, resetUrl, expiryMinutes = 15)`: `Promise<void>` (L29)
Enqueues a password reset link email job.

- **1.** `[Sequence]` Calls `addEmailJob`

#### `sendRawEmail(params)`: `Promise<void>` (L46)
Enqueues a custom HTML/text email job.

- **1.** `[Sequence]` Calls `addEmailJob`

### `const emailServ` (L60)

### `class EmailService` (L65)

Static compatibility facade preserving existing callers (`EmailService.send*`).

#### `sendMfaCodeEmail(email, code, expiryMinutes = 5)`: `Promise<void>` (L66)
Static compatibility facade preserving existing callers (`EmailService.send*`).

- **1.** `[Return]`  — `await emailServ.sendMfaCodeEmail(email, code, expiryMinutes)`

#### `sendMfaVerificationEmail(email, code, expiryMinutes = 5)`: `Promise<void>` (L70)

- **1.** `[Return]`  — `await emailServ.sendMfaCodeEmail(email, code, expiryMinutes)`

#### `sendPasswordResetEmail(email, resetUrl, expiryMinutes = 15)`: `Promise<void>` (L74)

- **1.** `[Return]`  — `await emailServ.sendPasswordResetEmail(email, resetUrl, expiryMinutes)`

#### `sendRawEmail(params)`: `Promise<void>` (L82)

- **1.** `[Return]`  — `await emailServ.sendRawEmail(params)`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/email/email.queue.ts](./email.queue.md) ([[core/email/email.queue]]) — `addEmailJob`

### External / Workspace Packages
- _None_

### Called By / Imported By
- [apps/carina/auth/auth.serv.ts](../../apps/carina/auth/auth.serv.md) ([[apps/carina/auth/auth.serv]]) — `EmailService`
- [apps/carina/email-2fa/email-2fa.serv.ts](../../apps/carina/email-2fa/email-2fa.serv.md) ([[apps/carina/email-2fa/email-2fa.serv]]) — `EmailService`
