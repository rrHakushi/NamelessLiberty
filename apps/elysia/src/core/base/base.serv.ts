import { LogFactory } from '@NamelessLiberty/logger'
import { IRISBitField, IRISFlags } from '@NamelessLiberty/permissions'
import { Forbidden } from '../errors/http-errors'
import { cache } from '../utils/cache'

/**
 * Abstract foundation for all IRIS Elysia application services.
 * Provides structured logging, shared pagination clamping, authorization guards,
 * and controlled access to the existing `@NamelessLiberty/cache` manager.
 */
export abstract class BaseService {
  protected readonly logger: LogFactory
  protected readonly cache = cache

  protected constructor(loggerName: string) {
    // Step 1: Bind a scoped LogFactory instance for the concrete service
    this.logger = new LogFactory(loggerName)
  }

  /**
   * Clamps pagination query parameters into safe bounded integers.
   */
  protected clampPagination(
    pageRaw?: number | string,
    limitRaw?: number | string,
    defaultLimit = 20,
    maxLimit = 100
  ): { page: number; limit: number; skip: number } {
    // Step 1: Parse and normalize page (>= 1) and limit ([1, maxLimit])
    const page = Math.max(1, Number(pageRaw ?? 1) || 1)
    const limit = Math.max(1, Math.min(maxLimit, Number(limitRaw ?? defaultLimit) || defaultLimit))
    const skip = (page - 1) * limit
    return { page, limit, skip }
  }

  /**
   * Checks whether a user's permission bitfield includes ADMINISTRATOR privileges.
   */
  protected isAdmin(permissions?: number[] | null): boolean {
    if (!permissions || permissions.length === 0) return false
    return new IRISBitField(permissions).has(IRISFlags.ADMINISTRATOR)
  }

  /**
   * Verifies that the authenticated caller owns a resource or holds ADMINISTRATOR privileges.
   */
  protected assertOwnerOrAdmin(
    ownerId: string,
    callerId: string,
    permissions?: number[] | null,
    resourceLabel = 'resource'
  ): void {
    // Step 1: Permit exact resource owner
    if (ownerId === callerId) return

    // Step 2: Permit administrators, otherwise reject with HTTP 403
    if (this.isAdmin(permissions)) return
    throw new Forbidden(`You do not have permission to modify this ${resourceLabel}.`)
  }
}
