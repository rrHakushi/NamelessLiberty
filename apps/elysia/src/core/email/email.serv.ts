import { BaseService } from '../base/base.serv'
import { addEmailJob } from './email.queue'

/**
 * Application service for queuing transactional emails (MFA codes, password resets, raw emails).
 * Worker lifecycle is managed exclusively by cluster primary (`src/index.ts`), never on module import.
 */
export class EmailServiceImpl extends BaseService {
  constructor() {
    super('EmailService')
  }

  /**
   * Enqueues an MFA verification email job.
   */
  public async sendMfaCodeEmail(email: string, code: string, expiryMinutes = 5): Promise<void> {
    // Step 1: Push MFA verification template job onto email-queue
    await addEmailJob({
      type: 'mfa-verification',
      to: email,
      code,
      expiryMinutes,
    })
  }

  /**
   * Enqueues a password reset link email job.
   */
  public async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
    expiryMinutes = 15
  ): Promise<void> {
    // Step 1: Push password reset template job onto email-queue
    await addEmailJob({
      type: 'password-reset',
      to: email,
      resetUrl,
      expiryMinutes,
    })
  }

  /**
   * Enqueues a custom HTML/text email job.
   */
  public async sendRawEmail(params: {
    to: string
    subject: string
    html: string
    text: string
  }): Promise<void> {
    // Step 1: Push raw email job onto email-queue
    await addEmailJob({
      type: 'raw',
      ...params,
    })
  }
}

export const emailServ = new EmailServiceImpl()

/**
 * Static compatibility facade preserving existing callers (`EmailService.send*`).
 */
export abstract class EmailService {
  static async sendMfaCodeEmail(email: string, code: string, expiryMinutes = 5): Promise<void> {
    return await emailServ.sendMfaCodeEmail(email, code, expiryMinutes)
  }

  static async sendMfaVerificationEmail(email: string, code: string, expiryMinutes = 5): Promise<void> {
    return await emailServ.sendMfaCodeEmail(email, code, expiryMinutes)
  }

  static async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
    expiryMinutes = 15
  ): Promise<void> {
    return await emailServ.sendPasswordResetEmail(email, resetUrl, expiryMinutes)
  }

  static async sendRawEmail(params: {
    to: string
    subject: string
    html: string
    text: string
  }): Promise<void> {
    return await emailServ.sendRawEmail(params)
  }
}
