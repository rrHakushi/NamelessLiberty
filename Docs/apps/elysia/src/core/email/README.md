# src/core/email

## Subdirectories

- [templates/](./templates/README.md) ([[core/email/templates/README]])

## Modules

| Module | Role | Routes | Exports |
| :--- | :--- | :--- | :--- |
| [email.queue.ts](./email.queue.md) ([[core/email/email.queue]]) | BullMQ Queue Manager | 0 | `EMAIL_QUEUE_NAME`, `EmailJobData`, `getRedisConnectionOptions`, `EmailQueue` |
| [email.serv.ts](./email.serv.md) ([[core/email/email.serv]]) | Service (Business Logic) | 0 | `EmailServiceImpl`, `emailServ`, `EmailService` |
| [email.wrk.ts](./email.wrk.md) ([[core/email/email.wrk]]) | BullMQ Background Worker | 0 | `EmailWorker`, `emailWorker`, `getEmailWorker` |
| [mailer.ts](./mailer.md) ([[core/email/mailer]]) | Core Infrastructure | 0 | `SendMailParams`, `getTransporter`, `sendDirectMail`, `sendMfaVerificationEmailDirect` |
