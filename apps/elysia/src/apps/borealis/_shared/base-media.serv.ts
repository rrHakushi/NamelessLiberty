import { prisma, and, or } from '@NamelessLiberty/db'
import { getProfileCustomization } from '@NamelessLiberty/shared'
import { BaseService } from '../../../core/base/base.serv'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  nextCursor: number | null
}

/**
 * Abstract base service for Borealis media domain services (`anime`, `manga`, `tv`, `movies`, `books`, `games`, `music`, `other`).
 * Centralizes list-query parsing, cursor/page pagination math, accepted-friend resolution,
 * and common user summary formatting.
 */
export abstract class BaseBorealisMediaService extends BaseService {
  protected constructor(loggerName: string) {
    super(loggerName)
  }

  /**
   * Parses a comma-separated query parameter into trimmed non-empty strings.
   */
  protected parseCsvList(val?: unknown): string[] {
    if (!val || typeof val !== 'string') return []
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  /**
   * Parses a comma-separated numeric query parameter into finite numbers.
   */
  protected parseCsvNumbers(val?: unknown): number[] {
    return this.parseCsvList(val)
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n))
  }

  /**
   * Resolves catalog pagination parameters supporting both cursor and page/limit modes.
   */
  protected resolveCatalogPagination(
    query?: { cursor?: number; page?: number; limit?: number },
    defaultLimit = 50,
    maxLimit = 100
  ) {
    // Step 1: Normalize page and clamp limit
    const { page, limit } = this.clampPagination(query?.page, query?.limit, defaultLimit, maxLimit)
    // Step 2: Disable offset skip when cursor pagination is active
    const skip = query?.cursor ? 0 : (page - 1) * limit
    return { page, limit, skip }
  }

  /**
   * Builds standardized catalog pagination metadata from queried items.
   */
  protected buildPaginationMeta<T extends { id: number }>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    hasCursor?: boolean
  ): PaginationMeta {
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const nextCursor = items.length === limit ? (items[items.length - 1]?.id ?? null) : null
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: hasCursor ? nextCursor !== null : page < totalPages,
      hasPrevPage: page > 1,
      nextCursor,
    }
  }

  /**
   * Resolves accepted friend user IDs for the authenticated caller.
   */
  protected async getAcceptedFriendIds(userId?: string | null): Promise<string[]> {
    if (!userId) return []

    // Step 1: Query friendships in either direction
    const friendships = await prisma.orm.public.Friend.where((f) =>
      or(f.userId.eq(userId), f.friendId.eq(userId))
    )
      .select('userId', 'friendId')
      .all()

    // Step 2: Return the opposite participant IDs
    return friendships.map((f) => (f.userId === userId ? f.friendId : f.userId))
  }

  /**
   * Formats a minimal public user header (id, username, displayName, avatarUrl).
   */
  protected formatPublicUserSummary(user: {
    id: string
    username: string
    customization?: unknown
  }) {
    const profile = getProfileCustomization(user.customization)
    const displayName =
      typeof profile.displayName === 'string' && profile.displayName.trim().length > 0
        ? profile.displayName.trim()
        : null

    return {
      id: user.id,
      username: user.username.trim(),
      displayName,
      avatarUrl: profile.avatarUrl ?? null,
    }
  }
}
