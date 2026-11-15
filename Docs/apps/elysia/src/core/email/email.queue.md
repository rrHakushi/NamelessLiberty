# email.queue.ts

- **Source**: [`core/email/email.queue.ts`](../../../../../../apps/elysia/src/core/email/email.queue.ts)
- **Layer / Role**: BullMQ Queue Manager
- **Inheritance**: `EmailQueue extends BaseBullMQQueue`

## Exported Types, Methods & Algorithms

### `const EMAIL_QUEUE_NAME` (L4)

### `type EmailJobData` (L6)

### `const getRedisConnectionOptions` (L30)

Re-exported for compatibility with BullMQ queue consumers.

### `class EmailQueue` extends `BaseBullMQQueue` (L35)

BullMQ queue manager for outbound transactional emails.

#### `constructor()` (L36)
BullMQ queue manager for outbound transactional emails.

- _No executable statements_

#### `addEmailJob(data)` (L51)
Enqueues an email delivery job onto the `email-queue`.

- **1.** `[Return]`  — `await this.enqueue(data.type, data)`

### `const emailQueue` (L57)

### `function getEmailQueue` (L59)

- **1.** `[Return]`  — `emailQueue.getQueue()`

### `function addEmailJob` (L63)

- **1.** `[Return]`  — `await emailQueue.addEmailJob(data)`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/bullmq/base.queue.ts](../bullmq/base.queue.md) ([[core/bullmq/base.queue]]) — `BaseBullMQQueue`
- [core/bullmq/redis.ts](../bullmq/redis.md) ([[core/bullmq/redis]]) — `getBullMQConnectionOptions`

### External / Workspace Packages
- _None_

### Called By / Imported By
- [core/email/email.serv.ts](./email.serv.md) ([[core/email/email.serv]]) — `addEmailJob`
- [core/email/email.wrk.ts](./email.wrk.md) ([[core/email/email.wrk]]) — `EMAIL_QUEUE_NAME`, `EmailJobData`
