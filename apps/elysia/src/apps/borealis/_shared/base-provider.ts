import { LogFactory } from '@NamelessLiberty/logger'

/**
 * Abstract base class for external metadata providers (AniList, TVDB, IGDB, Deezer, Google Books, AnimeMapping).
 * Provides unified structured logging, timeout-bounded HTTP JSON fetching, and normalized error handling.
 */
export abstract class BaseMediaProvider {
  protected readonly logger: LogFactory

  protected constructor(providerName: string) {
    this.logger = new LogFactory(`Provider:${providerName}`)
  }

  /**
   * Executes a timeout-bounded HTTP request and parses JSON, returning null on non-OK status when `allowNotFound` is set.
   */
  protected async requestJson<T>(
    url: string,
    init?: RequestInit & { timeoutMs?: number }
  ): Promise<{ ok: boolean; status: number; data: T | null }> {
    const { timeoutMs = 15_000, ...requestInit } = init ?? {}
    try {
      // Step 1: Execute fetch with AbortSignal timeout guard
      const response = await fetch(url, {
        ...requestInit,
        signal: requestInit.signal ?? AbortSignal.timeout(timeoutMs),
      })

      // Step 2: Parse JSON body safely
      if (!response.ok) {
        return { ok: false, status: response.status, data: null }
      }

      const data = (await response.json()) as T
      return { ok: true, status: response.status, data }
    } catch (err) {
      this.logger.warn(`HTTP request failed for ${url}: ${err instanceof Error ? err.message : String(err)}`)
      return { ok: false, status: 0, data: null }
    }
  }
}
