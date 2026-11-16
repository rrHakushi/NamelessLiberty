import { BaseBullMQQueue } from '../bullmq/base.queue'
import { getBullMQConnectionOptions } from '../bullmq/redis'

export const EMAIL_QUEUE_NAME = 'email-queue'

export type EmailJobData =
  | {
      type: 'mfa-verification'
      to: string
      code: string
      expiryMinutes?: number
    }
  | {
      type: 'password-reset'
      to: string
      resetUrl: string
      expiryMinutes?: number
    }
  | {
      type: 'raw'
      to: string
      subject: string
      html: string
      text: string
    }

/**
 * Re-exported for compatibility with BullMQ queue consumers.
 */
export const getRedisConnectionOptions = getBullMQConnectionOptions

/**
 * BullMQ queue manager for outbound transactional emails.
 */
export class EmailQueue extends BaseBullMQQueue<EmailJobData> {
  constructor() {
    super({
      queueName: EMAIL_QUEUE_NAME,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    })
  }

  /**
   * Enqueues an email delivery job onto the `email-queue`.
   */
  public async addEmailJob(data: EmailJobData) {
    // Step 1: Enqueue typed email job with queue-wide exponential retry defaults
    return await this.enqueue(data.type, data)
  }
}

export const emailQueue = new EmailQueue()

export function getEmailQueue() {
  return emailQueue.getQueue()
}

export async function addEmailJob(data: EmailJobData) {
  return await emailQueue.addEmailJob(data)
}
