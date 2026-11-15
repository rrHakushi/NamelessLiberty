# email.wrk.ts

- **Source**: [`core/email/email.wrk.ts`](../../../../../../apps/elysia/src/core/email/email.wrk.ts)
- **Layer / Role**: BullMQ Background Worker
- **Inheritance**: `EmailWorker extends BaseBullMQWorker`

## Exported Types, Methods & Algorithms

### `class EmailWorker` extends `BaseBullMQWorker` (L13)

BullMQ worker processing outbound transactional email jobs on cluster primary.

#### `constructor()` (L14)
BullMQ worker processing outbound transactional email jobs on cluster primary.

- _No executable statements_

#### `processJob(job)`: `Promise<{ delivered: boolean; to: string }>` (L24)
Dispatches each email job by template type via Nodemailer.

- **1.** `[Sequence]` Define `data`
  ```typescript
  const data = job.data
  ```
- **2.** `[If]` `data.type === 'mfa-verification'`
  - **2.1.** `[Sequence]` Calls `sendMfaVerificationEmail`
- **3.** `[Else]` Otherwise
  - **3.1.** `[If]` `data.type === 'password-reset'`
    - **3.1.1.** `[Sequence]` Calls `sendPasswordResetEmail`
  - **3.2.** `[Else]` Otherwise
    - **3.2.1.** `[If]` `data.type === 'raw'`
      - **3.2.1.1.** `[Sequence]` Calls `sendEmail`
    - **3.2.2.** `[Else]` Otherwise
      - **3.2.2.1.** `[Error]` Throws `Error` — `Unknown email job type: ${(data as any)?.type}`
- **4.** `[Return]` 
  ```json
  {
    "delivered": true,
    "to": "<data.to>"
  }
  ```

### `const emailWorker` (L56)

### `function getEmailWorker` (L58)

- **1.** `[Return]`  — `emailWorker.start()`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/bullmq/base.wrk.ts](../bullmq/base.wrk.md) ([[core/bullmq/base.wrk]]) — `BaseBullMQWorker`
- [core/email/email.queue.ts](./email.queue.md) ([[core/email/email.queue]]) — `EMAIL_QUEUE_NAME`, `EmailJobData`
- [core/email/mailer.ts](./mailer.md) ([[core/email/mailer]]) — `sendEmail`, `sendMfaVerificationEmail`, `sendPasswordResetEmail`

### External / Workspace Packages
- `bullmq` — `Job`

### Called By / Imported By
- [index.ts](../../index.md) ([[index]]) — `emailWorker`
