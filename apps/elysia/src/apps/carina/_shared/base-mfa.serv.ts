import { BaseService } from '../../../core/base/base.serv'
import { BadRequest, Unauthorized } from '../../../core/errors/http-errors'
import { signUserJwt } from '../../../core/utils/auth-crypto'

export interface MfaTicketPayload {
  userId: string
}

/**
 * Abstract base service for Carina Multi-Factor Authentication flows (TOTP, Email 2FA, Backup Codes, Passkeys).
 * Centralizes MFA ticket validation, brute-force attempt throttling, ticket cleanup,
 * user cache invalidation, and JWT session issuance.
 */
export abstract class BaseMfaService extends BaseService {
  protected constructor(loggerName: string) {
    super(loggerName)
  }

  /**
   * Resolves an active MFA ticket payload from cache, or throws HTTP 401 when missing/expired.
   */
  protected async resolveMfaTicket(mfaTicket: string): Promise<MfaTicketPayload> {
    // Step 1: Look up ephemeral MFA ticket in Redis/memory cache
    const ticketData = await this.cache.get<MfaTicketPayload>(`auth:mfa-ticket:${mfaTicket}`)
    if (!ticketData?.userId) {
      throw new Unauthorized('MFA challenge ticket is invalid or has expired. Please sign in again.')
    }
    return ticketData
  }

  /**
   * Increments failed MFA verification attempts for a ticket and invalidates it after `maxAttempts`.
   */
  protected async recordFailedMfaAttempt(mfaTicket: string, maxAttempts = 5): Promise<void> {
    // Step 1: Read current attempt count for this ticket
    const attemptKey = `auth:mfa-ticket:attempts:${mfaTicket}`
    const attempts = (await this.cache.get<number>(attemptKey)) || 0

    // Step 2: Revoke ticket once threshold is reached
    if (attempts + 1 >= maxAttempts) {
      await this.cache.del(`auth:mfa-ticket:${mfaTicket}`)
      await this.cache.del(attemptKey)
      throw new BadRequest('Too many failed MFA verification attempts. Please sign in again.')
    }

    // Step 3: Persist updated attempt counter with 5-minute TTL
    await this.cache.set(attemptKey, attempts + 1, 300)
  }

  /**
   * Deletes an MFA ticket and its attempt counter after successful verification.
   */
  protected async clearMfaTicket(mfaTicket: string): Promise<void> {
    // Step 1: Remove ticket and attempt counter keys
    await this.cache.del(`auth:mfa-ticket:${mfaTicket}`)
    await this.cache.del(`auth:mfa-ticket:attempts:${mfaTicket}`)
  }

  /**
   * Invalidates cached user profile keys when MFA security state changes.
   */
  protected async invalidateUserMfaCache(userId: string): Promise<void> {
    // Step 1: Evict legacy user cache keys consistently across MFA providers
    await this.cache.del(`users:me:user:${userId}`)
    await this.cache.del(`user:${userId}`)
  }

  /**
   * Signs an authenticated user JWT with normalized username, permissions, and passwordChangedAt.
   */
  protected async issueMfaSessionToken(user: {
    id: string
    username: string
    email: string | null
    permissions: readonly number[]
    passwordChangedAt?: Date | null
  }): Promise<string> {
    // Step 1: Issue HS256 JWT token via shared auth-crypto helper
    return await signUserJwt({
      id: user.id,
      username: user.username.trim(),
      email: user.email,
      permissions: [...user.permissions],
      passwordChangedAt: user.passwordChangedAt,
    })
  }
}
