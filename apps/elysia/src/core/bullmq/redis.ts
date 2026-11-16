import type { ConnectionOptions } from 'bullmq'
import { LogFactory } from '@NamelessLiberty/logger'

const logger = new LogFactory('BullMQ:Redis')

/**
 * Parses and validates Redis environment variables for BullMQ queues and workers.
 * Enforces `maxRetriesPerRequest: null` as required by BullMQ blocking commands.
 */
export function getBullMQConnectionOptions(): ConnectionOptions {
  // Step 1: Read required Redis host and port from Bun environment
  const host = Bun.env.REDIS_HOST
  const portRaw = Bun.env.REDIS_PORT

  if (!host || !portRaw) {
    throw new Error('Missing required Redis environment variable(s): REDIS_HOST and/or REDIS_PORT')
  }

  const port = Number(portRaw)
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid REDIS_PORT value: ${portRaw}`)
  }

  // Step 2: Build BullMQ-compliant IORedis connection options
  const dbRaw = Bun.env.REDIS_DB
  const db = dbRaw !== undefined && dbRaw !== '' ? Number(dbRaw) : 0

  return {
    host,
    port,
    ...(Bun.env.REDIS_PASSWORD ? { password: Bun.env.REDIS_PASSWORD } : {}),
    db: Number.isFinite(db) ? db : 0,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times: number) => Math.min(times * 250, 5000),
  }
}

/**
 * Checks whether a Redis/BullMQ error is a transient socket reset that BullMQ reconnects automatically.
 */
export function isTransientSocketError(err: unknown): boolean {
  const message = (err as Error)?.message || String(err || '')
  return (
    message.includes('ECONNRESET') ||
    message.includes('EPIPE') ||
    message.includes('ETIMEDOUT') ||
    message.includes('Connection is closed') ||
    message.includes('Socket closed unexpectedly')
  )
}

/**
 * Attaches standard error logging to any BullMQ Queue, Worker, or QueueEvents emitter.
 */
export function attachBullMQErrorHandler(
  emitter: { on: (event: 'error', listener: (err: Error) => void) => unknown },
  scope: string
): void {
  emitter.on('error', (err: Error) => {
    if (isTransientSocketError(err)) {
      logger.warn(`[${scope}] Transient Redis socket error (auto-reconnecting): ${err.message}`)
      return
    }
    logger.error(`[${scope}] BullMQ error:`, err)
  })
}
