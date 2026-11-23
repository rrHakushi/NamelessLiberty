import { prisma } from '@NamelessLiberty/db'
import { LogFactory, c } from '@NamelessLiberty/logger'
import { executeMediaUpdate, type MediaType } from './media.queue'

const logger = new LogFactory('Borealis:FullUpdate')

export type FullUpdateStageKey =
  | 'books'
  | 'games'
  | 'tv'
  | 'movies'
  | 'manga'
  | 'anime'

export type FullUpdateRunStatus =
  | 'idle'
  | 'running'
  | 'stopping'
  | 'completed'
  | 'cancelled'
  | 'failed'

export type FullUpdateStageStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'skipped'
  | 'cancelled'

export interface FullUpdateStageProgress {
  key: FullUpdateStageKey
  mediaType: MediaType
  label: string
  status: FullUpdateStageStatus
  total: number
  processed: number
  synced: number
  skipped: number
  failed: number
  startedAt: string | null
  finishedAt: string | null
}

export interface FullUpdateCurrentItem {
  mediaType: string
  id: number
  title: string
  externalId: string | null
  index: number
  stageTotal: number
}

export interface FullUpdateLogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
}

export interface FullUpdateProgressSnapshot {
  runId: string | null
  status: FullUpdateRunStatus
  startedAt: string | null
  finishedAt: string | null
  triggeredBy: string | null
  currentStageKey: FullUpdateStageKey | null
  currentItem: FullUpdateCurrentItem | null
  totals: {
    total: number
    processed: number
    synced: number
    skipped: number
    failed: number
    percent: number
  }
  stages: FullUpdateStageProgress[]
  recentLogs: FullUpdateLogEntry[]
  error: string | null
}

interface MediaTargetConfig {
  key: FullUpdateStageKey
  mediaType: MediaType
  label: string
  fetchBatch: (
    cursorId: number,
    batchSize: number
  ) => Promise<Array<{ id: number; externalId: number | string | null; title: string }>>
}

/**
 * Canonical sequential update order:
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

const MAX_RECENT_LOGS = 50

function createInitialStages(): FullUpdateStageProgress[] {
  return MEDIA_TARGETS.map((t) => ({
    key: t.key,
    mediaType: t.mediaType,
    label: t.label,
    status: 'pending',
    total: 0,
    processed: 0,
    synced: 0,
    skipped: 0,
    failed: 0,
    startedAt: null,
    finishedAt: null,
  }))
}

async function loadAllItems(target: MediaTargetConfig) {
  const items: Array<{ id: number; externalId: number | string | null; title: string }> = []
  let cursorId = 0
  const batchSize = 500

  while (true) {
    const batch = await target.fetchBatch(cursorId, batchSize)
    if (batch.length === 0) break
    items.push(...batch)
    cursorId = batch[batch.length - 1]!.id
    if (batch.length < batchSize) break
  }

  return items
}

class BorealisFullUpdateManager {
  private runId: string | null = null
  private status: FullUpdateRunStatus = 'idle'
  private startedAt: string | null = null
  private finishedAt: string | null = null
  private triggeredBy: string | null = null
  private currentStageKey: FullUpdateStageKey | null = null
  private currentItem: FullUpdateCurrentItem | null = null
  private stages: FullUpdateStageProgress[] = createInitialStages()
  private recentLogs: FullUpdateLogEntry[] = []
  private error: string | null = null
  private stopRequested = false

  private pushLog(level: FullUpdateLogEntry['level'], message: string) {
    this.recentLogs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
    })
    if (this.recentLogs.length > MAX_RECENT_LOGS) {
      this.recentLogs.splice(0, this.recentLogs.length - MAX_RECENT_LOGS)
    }
  }

  public getStatus(): FullUpdateProgressSnapshot {
    let total = 0
    let processed = 0
    let synced = 0
    let skipped = 0
    let failed = 0

    for (const s of this.stages) {
      total += s.total
      processed += s.processed
      synced += s.synced
      skipped += s.skipped
      failed += s.failed
    }

    const percent =
      total > 0
        ? Math.min(100, Math.round((processed / total) * 1000) / 10)
        : this.status === 'completed'
          ? 100
          : 0

    return {
      runId: this.runId,
      status: this.status,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      triggeredBy: this.triggeredBy,
      currentStageKey: this.currentStageKey,
      currentItem: this.currentItem ? { ...this.currentItem } : null,
      totals: {
        total,
        processed,
        synced,
        skipped,
        failed,
        percent,
      },
      stages: this.stages.map((s) => ({ ...s })),
      recentLogs: [...this.recentLogs],
      error: this.error,
    }
  }

  public start(
    triggeredBy: string,
    options?: { only?: FullUpdateStageKey[] }
  ): { started: boolean; status: FullUpdateProgressSnapshot } {
    if (this.status === 'running' || this.status === 'stopping') {
      return { started: false, status: this.getStatus() }
    }

    const allowedSet =
      options?.only && options.only.length > 0 ? new Set(options.only) : null

    this.runId = `full-update-${Date.now()}`
    this.status = 'running'
    this.startedAt = new Date().toISOString()
    this.finishedAt = null
    this.triggeredBy = triggeredBy
    this.currentStageKey = null
    this.currentItem = null
    this.error = null
    this.stopRequested = false
    this.recentLogs = []
    this.stages = MEDIA_TARGETS.map((t) => ({
      key: t.key,
      mediaType: t.mediaType,
      label: t.label,
      status: allowedSet && !allowedSet.has(t.key) ? 'skipped' : 'pending',
      total: 0,
      processed: 0,
      synced: 0,
      skipped: 0,
      failed: 0,
      startedAt: null,
      finishedAt: null,
    }))

    this.pushLog(
      'info',
      `Full media update triggered by ${triggeredBy} (${MEDIA_TARGETS.filter((t) => !allowedSet || allowedSet.has(t.key)).map((t) => t.key).join(' → ')})`
    )

    void this.executeRun(allowedSet)

    return { started: true, status: this.getStatus() }
  }

  public cancel(): { cancelled: boolean; status: FullUpdateProgressSnapshot } {
    if (this.status !== 'running') {
      return { cancelled: false, status: this.getStatus() }
    }
    this.stopRequested = true
    this.status = 'stopping'
    this.pushLog('warn', 'Cancellation requested. Stopping after current item finishes...')
    logger.warn(`${c.yellow('🛑 [FullUpdate]')} Cancellation requested by admin`)
    return { cancelled: true, status: this.getStatus() }
  }

  private async executeRun(allowedSet: Set<FullUpdateStageKey> | null): Promise<void> {
    try {
      const selectedTargets = MEDIA_TARGETS.filter(
        (t) => !allowedSet || allowedSet.has(t.key)
      )

      // Pre-load items for all selected stages so overall total/progress is accurate immediately
      const stageItems = new Map<
        FullUpdateStageKey,
        Array<{ id: number; externalId: number | string | null; title: string }>
      >()

      for (const target of selectedTargets) {
        const items = await loadAllItems(target)
        stageItems.set(target.key, items)
        const stage = this.stages.find((s) => s.key === target.key)
        if (stage) {
          stage.total = items.length
        }
      }

      logger.info(
        `${c.cyan('🚀 [FullUpdate]')} Loaded counts across ${selectedTargets.length} media types; starting sequential execution...`
      )

      for (const target of selectedTargets) {
        const stage = this.stages.find((s) => s.key === target.key)!
        if (this.stopRequested) {
          stage.status = 'cancelled'
          continue
        }

        const items = stageItems.get(target.key) ?? []
        this.currentStageKey = target.key
        stage.status = 'running'
        stage.startedAt = new Date().toISOString()
        this.pushLog('info', `Started ${target.label} (${items.length} items)`)

        for (let i = 0; i < items.length; i++) {
          if (this.stopRequested) break

          const item = items[i]!
          this.currentItem = {
            mediaType: target.mediaType,
            id: item.id,
            title: item.title,
            externalId: item.externalId !== null ? String(item.externalId) : null,
            index: i + 1,
            stageTotal: items.length,
          }

          if (!item.externalId) {
            stage.skipped++
            stage.processed++
            continue
          }

          try {
            await executeMediaUpdate(target.mediaType, item.id, item.externalId, 0, 0)
            stage.synced++
          } catch (err: any) {
            stage.failed++
            this.pushLog(
              'error',
              `[${target.mediaType}] #${item.id} "${item.title}" failed: ${err?.message || String(err)}`
            )
          }

          stage.processed++
        }

        stage.finishedAt = new Date().toISOString()
        if (this.stopRequested) {
          stage.status = 'cancelled'
          this.pushLog(
            'warn',
            `${target.label} stopped early (${stage.processed}/${stage.total} processed)`
          )
        } else {
          stage.status = 'completed'
          this.pushLog(
            'info',
            `Completed ${target.label}: ${stage.synced} synced, ${stage.skipped} skipped, ${stage.failed} failed`
          )
        }
      }

      this.currentItem = null
      this.currentStageKey = null
      this.finishedAt = new Date().toISOString()

      if (this.stopRequested) {
        this.status = 'cancelled'
        this.pushLog('warn', 'Full media update cancelled.')
      } else {
        this.status = 'completed'
        this.pushLog('info', 'Full media update finished successfully.')
      }
    } catch (err: any) {
      this.currentItem = null
      this.currentStageKey = null
      this.finishedAt = new Date().toISOString()
      this.status = 'failed'
      this.error = err?.message || String(err)
      this.pushLog('error', `Fatal error: ${this.error}`)
      logger.error(`${c.red('❌ [FullUpdate Fatal]')}: ${this.error}`)
    }
  }
}

export const BorealisFullUpdateServ = new BorealisFullUpdateManager()
