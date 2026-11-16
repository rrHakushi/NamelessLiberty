import type { Job } from 'bullmq'
import { BaseBullMQWorker } from '../bullmq/base.wrk'
import { EMAIL_QUEUE_NAME, type EmailJobData } from './email.queue'
import {
  sendDirectMail as sendEmail,
  sendMfaVerificationEmailDirect as sendMfaVerificationEmail,
  sendPasswordResetEmailDirect as sendPasswordResetEmail,
} from './mailer'

/**
 * BullMQ worker processing outbound transactional email jobs on cluster primary.
 */
export class EmailWorker extends BaseBullMQWorker<EmailJobData, { delivered: boolean; to: string }> {
  constructor() {
    super({
      queueName: EMAIL_QUEUE_NAME,
      concurrency: 5,
    })
  }

  /**
   * Dispatches each email job by template type via Nodemailer.
   */
  protected async processJob(job: Job<EmailJobData>): Promise<{ delivered: boolean; to: string }> {
    const data = job.data

    // Step 1: Route job payload to the corresponding React Email / raw mailer helper
    if (data.type === 'mfa-verification') {
      await sendMfaVerificationEmail({
        to: data.to,
        code: data.code,
        validityMinutes: data.expiryMinutes ?? 5,
      })
    } else if (data.type === 'password-reset') {
      await sendPasswordResetEmail({
        to: data.to,
        resetUrl: data.resetUrl,
        validityMinutes: data.expiryMinutes ?? 15,
      })
    } else if (data.type === 'raw') {
      await sendEmail({
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
      })
    } else {
      throw new Error(`Unknown email job type: ${(data as any)?.type}`)
    }

    // Step 2: Return structured delivery confirmation
    return { delivered: true, to: data.to }
  }
}

export const emailWorker = new EmailWorker()

export function getEmailWorker() {
  return emailWorker.start()
}
