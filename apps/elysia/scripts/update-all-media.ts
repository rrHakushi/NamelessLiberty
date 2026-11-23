import { prisma } from '@NamelessLiberty/db'
import { LogFactory, c } from '@NamelessLiberty/logger'
import {
  executeMediaUpdate,
  MediaQueueManager,
  type MediaType,
} from '../src/apps/borealis/sync/media.queue'

const logger = new LogFactory('Script:UpdateAllMedia')

type SyncTargetKey = 'books' | 'games' | 'tv' | 'movies' | 'manga' | 'anime'

interface MediaTargetConfig {
  key: SyncTargetKey
  mediaType: MediaType
  label: string
  fetchBatch: (
    cursorId: number,
    batchSize: number
  ) => Promise<Array<{ id: number; externalId: number | string | null; title: string }>>
}

/**
 * Canonical sequential update order requested:
 * books -> games -> tv -> movies -> manga -> anime
 */
const MEDIA_TARGETS: MediaTargetConfig[] = [
  {
    key: 'books',
    mediaType: 'BOOK',
    label: 'Books',
    fetchBatch: async (cursorId, batchSize) => {
      const rows = await prisma.orm.public.Book
        .where((b) => b.id.gt(cursorId))
        .orderBy((b) => b.id.asc())
        .select('id', 'googleBookId', 'titlePrimary')
        .limit(batchSize)
        .all()
      return rows.map((r) => ({
        id: r.id,
        externalId: r.googleBookId ?? null,
        title: r.titlePrimary,
      }))
    },
  },
  {
    key: 'games',
    mediaType: 'GAME',
    label: 'Games',
    fetchBatch: async (cursorId, batchSize) => {
      const rows = await prisma.orm.public.Game
        .where((g) => g.id.gt(cursorId))
        .orderBy((g) => g.id.asc())
        .select('id', 'igdbId', 'titlePrimary')
        .limit(batchSize)
        .all()
      return rows.map((r) => ({
        id: r.id,
        externalId: r.igdbId ?? null,
        title: r.titlePrimary,
      }))
    },
  },
  {
    key: 'tv',
    mediaType: 'TV',
    label: 'TV Shows',
    fetchBatch: async (cursorId, batchSize) => {
      const rows = await prisma.orm.public.Tv
        .where((t) => t.id.gt(cursorId))
        .orderBy((t) => t.id.asc())
        .select('id', 'tvDBId', 'titlePrimary')
        .limit(batchSize)
        .all()
      return rows.map((r) => ({
        id: r.id,
        externalId: r.tvDBId ?? null,
        title: r.titlePrimary,
      }))
    },
  },
  {
    key: 'movies',
    mediaType: 'MOVIE',
    label: 'Movies',
    fetchBatch: async (cursorId, batchSize) => {
      const rows = await prisma.orm.public.Movie
        .where((m) => m.id.gt(cursorId))
        .orderBy((m) => m.id.asc())
        .select('id', 'tvDBId', 'titlePrimary')
        .limit(batchSize)
        .all()
      return rows.map((r) => ({
        id: r.id,
        externalId: r.tvDBId ?? null,
        title: r.titlePrimary,
      }))
    },
  },
  {
    key: 'manga',
    mediaType: 'MANGA',
    label: 'Manga',
    fetchBatch: async (cursorId, batchSize) => {
      const rows = await prisma.orm.public.Manga
        .where((m) => m.id.gt(cursorId))
        .orderBy((m) => m.id.asc())
        .select('id', 'anilistId', 'titlePrimary')
        .limit(batchSize)
        .all()
      return rows.map((r) => ({
        id: r.id,
        externalId: r.anilistId ?? null,
        title: r.titlePrimary,
      }))
    },
  },
  {
    key: 'anime',
    mediaType: 'ANIME',
    label: 'Anime',
    fetchBatch: async (cursorId, batchSize) => {
      const rows = await prisma.orm.public.Anime
        .where((a) => a.id.gt(cursorId))
        .orderBy((a) => a.id.asc())
        .select('id', 'anilistId', 'titlePrimary')
        .limit(batchSize)
        .all()
      return rows.map((r) => ({
        id: r.id,
        externalId: r.anilistId ?? null,
        title: r.titlePrimary,
      }))
    },
  },
]

function getArgValue(prefix: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`${prefix}=`))
  return arg ? arg.slice(prefix.length + 1) : undefined
}

function parseIntArg(prefix: string, fallback: number): number {
  const raw = getArgValue(prefix)
  if (!raw) return fallback
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

let stopRequested = false
let lastProcessedTarget: SyncTargetKey | null = null
let lastProcessedId = 0

process.on('SIGINT', () => {
  if (stopRequested) process.exit(130)
  stopRequested = true
  logger.warn(
    `${c.yellow('🛑 [Interrupt Received]')} Stopping cleanly after current item...`
  )
})

process.on('SIGTERM', () => {
  stopRequested = true
  logger.warn(
    `${c.yellow('🛑 [SIGTERM Received]')} Stopping cleanly after current item...`
  )
})

async function loadAllItems(
  target: MediaTargetConfig,
  startAfterId: number,
  limit: number
) {
  const items: Array<{ id: number; externalId: number | string | null; title: string }> = []
  let cursorId = startAfterId
  const batchSize = 500

  while (true) {
    const remaining = limit > 0 ? limit - items.length : batchSize
    if (remaining <= 0) break
    const batch = await target.fetchBatch(cursorId, Math.min(batchSize, remaining))
    if (batch.length === 0) break
    items.push(...batch)
    cursorId = batch[batch.length - 1]!.id
    if (batch.length < batchSize) break
  }

  return items
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run')
  const useQueue = process.argv.includes('--queue')
  const delayMs = parseIntArg('--delay', 0)
  const limitPerType = parseIntArg('--limit', 0)
  const startIdArg = parseIntArg('--start-id', 0)
  const startFromArg = getArgValue('--start-from')?.toLowerCase() as SyncTargetKey | undefined
  const onlyArg = getArgValue('--only')

  let targets = [...MEDIA_TARGETS]

  if (onlyArg) {
    const allowed = new Set(
      onlyArg
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    )
    targets = targets.filter((t) => allowed.has(t.key) || allowed.has(t.mediaType.toLowerCase()))
    if (targets.length === 0) {
      throw new Error(
        `No valid media types matched --only=${onlyArg}. Valid keys: ${MEDIA_TARGETS.map((t) => t.key).join(', ')}`
      )
    }
  }

  if (startFromArg) {
    const idx = targets.findIndex(
      (t) => t.key === startFromArg || t.mediaType.toLowerCase() === startFromArg
    )
    if (idx === -1) {
      throw new Error(
        `Unknown --start-from=${startFromArg}. Valid keys: ${targets.map((t) => t.key).join(', ')}`
      )
    }
    targets = targets.slice(idx)
  }

  const runStamp = new Date().toISOString().replace(/[:.]/g, '-')
  const startedAt = Date.now()

  logger.info(
    `${c.cyan(c.bold('🚀 [Full Media Update]'))} Starting sequential update ` +
      `(${targets.map((t) => t.key).join(' -> ')}) | ` +
      `Mode: ${c.bold(isDryRun ? 'DRY RUN' : useQueue ? 'BULLMQ QUEUE' : 'DIRECT SEQUENTIAL')}` +
      (limitPerType > 0 ? ` | Limit/type: ${limitPerType}` : '') +
      (delayMs > 0 ? ` | Delay: ${delayMs}ms` : '')
  )

  const summary: Array<{
    key: SyncTargetKey
    label: string
    total: number
    synced: number
    skipped: number
    failed: number
    durationMs: number
  }> = []

  for (let tIdx = 0; tIdx < targets.length; tIdx++) {
    if (stopRequested) break

    const target = targets[tIdx]!
    const targetStart = Date.now()
    const startAfterId = tIdx === 0 && startIdArg > 0 ? startIdArg : 0
    const items = await loadAllItems(target, startAfterId, limitPerType)

    logger.info(
      `\n${c.blue(c.bold(`═══ [${tIdx + 1}/${targets.length}] ${target.label.toUpperCase()} (${items.length} items) ═══`))}`
    )

    let synced = 0
    let skipped = 0
    let failed = 0

    for (let i = 0; i < items.length; i++) {
      if (stopRequested) break

      const item = items[i]!
      lastProcessedTarget = target.key
      lastProcessedId = item.id

      if (!item.externalId) {
        skipped++
        continue
      }

      const progressTag = `[${target.mediaType} ${i + 1}/${items.length}]`

      if (isDryRun) {
        synced++
        if (i < 5 || i === items.length - 1) {
          logger.info(
            `  ${c.dim(progressTag)} Would ${useQueue ? 'enqueue' : 'sync'} #${item.id} ("${item.title}", ext=${item.externalId})`
          )
        }
        continue
      }

      try {
        if (useQueue) {
          const job = await MediaQueueManager.enqueueMediaUpdate(target.mediaType, item.id, {
            externalId: item.externalId,
            priority: 10 + tIdx,
            depth: 0,
            maxDepth: 0,
            triggeredBy: 'manual',
            forceRefresh: true,
            jobId: `full-update-${target.mediaType}-${item.id}-${runStamp}`,
          })
          if (job) synced++
          else failed++
        } else {
          logger.info(
            `  ${c.cyan(progressTag)} Updating #${item.id} "${item.title}" (ext=${item.externalId})...`
          )
          await executeMediaUpdate(target.mediaType, item.id, item.externalId, 0, 0)
          synced++
        }
      } catch (err: any) {
        failed++
        logger.error(
          `  ${c.red(`❌ ${progressTag}`)} Failed #${item.id} "${item.title}": ${err?.message || err}`
        )
      }

      if (delayMs > 0 && i < items.length - 1 && !stopRequested) {
        await new Promise((r) => setTimeout(r, delayMs))
      }
    }

    const durationMs = Date.now() - targetStart
    summary.push({
      key: target.key,
      label: target.label,
      total: items.length,
      synced,
      skipped,
      failed,
      durationMs,
    })

    logger.info(
      `${c.green(`✅ [${target.label} Complete]`)} total=${items.length}, ${useQueue ? 'enqueued' : 'synced'}=${synced}, skipped(no extId)=${skipped}, failed=${failed} (${formatDuration(durationMs)})`
    )
  }

  const totalElapsed = Date.now() - startedAt
  logger.info(`\n${c.green(c.bold('📊 [Full Media Update Summary]'))} (${formatDuration(totalElapsed)})`)
  for (const row of summary) {
    logger.info(
      `  • ${row.label.padEnd(10)} total=${String(row.total).padStart(5)} | ok=${String(row.synced).padStart(5)} | skipped=${String(row.skipped).padStart(4)} | failed=${String(row.failed).padStart(4)} | ${formatDuration(row.durationMs)}`
    )
  }

  if (stopRequested && lastProcessedTarget) {
    logger.warn(
      `\n${c.yellow('💡 [Resume Hint]')} To resume from where you stopped, run with: --start-from=${lastProcessedTarget} --start-id=${lastProcessedId}`
    )
  }

  if (useQueue) {
    await MediaQueueManager.shutdown().catch(() => {})
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    logger.error(`Fatal error in update-all-media script: ${err?.message || err}`)
    process.exit(1)
  })
