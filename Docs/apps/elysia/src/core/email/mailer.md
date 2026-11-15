# mailer.ts

- **Source**: [`core/email/mailer.ts`](../../../../../../apps/elysia/src/core/email/mailer.ts)
- **Layer / Role**: Core Infrastructure

## Exported Types, Methods & Algorithms

### `interface SendMailParams` (L9)

### `function getTransporter` (L18)

- **1.** `[If]` `transporter`
  - **1.1.** `[Return]`  — `transporter`
- **2.** `[Sequence]` Define `host`, `port`, `user`, `pass`
  ```typescript
  const host = Bun.env.SMTP_HOST
  const port = Bun.env.SMTP_PORT
  const user = Bun.env.SMTP_USER
  const pass = Bun.env.SMTP_PASS
  ```
- **3.** `[If]` `!host || !port || !user || !pass`
  - **3.1.** `[Error]` Throws `Error` — 'Missing required SMTP environment variable(s): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS'
- **4.** `[Sequence]` Assign `transporter`
  ```typescript
  transporter = nodemailer.createTransport({ host, port: parseInt(port, 10), secure: port === '465', auth: { user, pass }, })
  ```
- **5.** `[Return]`  — `transporter`

### `function sendDirectMail` (L51)

Sends an email using SMTP or logs to console outbox in development. Rules: - In production: Always sends via SMTP. - In development: If `SEND_EMAIL_IN_DEV === "true"`, sends via SMTP. Otherwise, logs to the dev console outbox.

- **1.** `[Sequence]` Define `isDev`, `sendEmailInDev`, `shouldSendRealMail`, `from`
  ```typescript
  const isDev = Bun.env.BUN_ENV === 'development' || !Bun.env.BUN_ENV
  const sendEmailInDev = Bun.env.SEND_EMAIL_IN_DEV === 'true'
  const shouldSendRealMail = !isDev || sendEmailInDev
  const from = Bun.env.SMTP_FROM
  ```
- **2.** `[If]` `!from`
  - **2.1.** `[Error]` Throws `Error` — 'Missing required environment variable: SMTP_FROM'
- **3.** `[Sequence]` Define `activeTransporter`
  ```typescript
  const activeTransporter = shouldSendRealMail ? getTransporter() : null
  ```
- **4.** `[If]` `shouldSendRealMail && activeTransporter`
  - **4.1.** `[Try]` Try block
    - **4.1.1.** `[Sequence]` Calls `activeTransporter.sendMail`
    - **4.1.2.** `[Return]`  — `true`
  - **4.2.** `[Catch]` Catch (`error`)
    - **4.2.1.** `[Sequence]` Calls `logger.error`
    - **4.2.2.** `[Return]`  — `false`
- **5.** `[Return]`  — `true`

### `function sendMfaVerificationEmailDirect` (L102)

Direct renderer and dispatcher for Multi-Factor Authentication login/setup verification email.

- **1.** `[Sequence]` Calls `React.createElement` and stores result as `emailElement`
- **2.** `[Sequence]` Calls `Promise.all` and stores result as `[html, text]`
- **3.** `[Return]`  — `await sendDirectMail({ to, subject: `${appName} - Verification Code (${code})`, html, text, })`

### `function sendPasswordResetEmailDirect` (L135)

Direct renderer and dispatcher for Password Reset email with reset link.

- **1.** `[Sequence]` Calls `React.createElement` and stores result as `emailElement`
- **2.** `[Sequence]` Calls `Promise.all` and stores result as `[html, text]`
- **3.** `[Return]`  — `await sendDirectMail({ to, subject: `${appName} - Password Reset Request`, html, text, })`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/email/templates/index.ts](./templates/index.md) ([[core/email/templates/index]]) — `MfaVerificationEmail`, `PasswordResetEmail`

### External / Workspace Packages
- `react` — `React`
- `nodemailer` — `nodemailer`, `Transporter`
- `@react-email/render` — `render`
- `@NamelessLiberty/logger` — `LogFactory`, `c`

### Called By / Imported By
- [core/email/email.wrk.ts](./email.wrk.md) ([[core/email/email.wrk]]) — `sendEmail`, `sendMfaVerificationEmail`, `sendPasswordResetEmail`
