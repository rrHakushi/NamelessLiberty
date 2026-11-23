import { t, type UnwrapSchema } from 'elysia'

const stageKeySchema = t.Union([
  t.Literal('books'),
  t.Literal('games'),
  t.Literal('tv'),
  t.Literal('movies'),
  t.Literal('manga'),
  t.Literal('anime'),
])

const stageProgressSchema = t.Object({
  key: stageKeySchema,
  mediaType: t.String(),
  label: t.String(),
  status: t.Union([
    t.Literal('pending'),
    t.Literal('running'),
    t.Literal('completed'),
    t.Literal('skipped'),
    t.Literal('cancelled'),
  ]),
  total: t.Number(),
  processed: t.Number(),
  synced: t.Number(),
  skipped: t.Number(),
  failed: t.Number(),
  startedAt: t.Nullable(t.String()),
  finishedAt: t.Nullable(t.String()),
})

const progressSnapshotSchema = t.Object({
  runId: t.Nullable(t.String()),
  status: t.Union([
    t.Literal('idle'),
    t.Literal('running'),
    t.Literal('stopping'),
    t.Literal('completed'),
    t.Literal('cancelled'),
    t.Literal('failed'),
  ]),
  startedAt: t.Nullable(t.String()),
  finishedAt: t.Nullable(t.String()),
  triggeredBy: t.Nullable(t.String()),
  currentStageKey: t.Nullable(stageKeySchema),
  currentItem: t.Nullable(
    t.Object({
      mediaType: t.String(),
      id: t.Number(),
      title: t.String(),
      externalId: t.Nullable(t.String()),
      index: t.Number(),
      stageTotal: t.Number(),
    })
  ),
  totals: t.Object({
    total: t.Number(),
    processed: t.Number(),
    synced: t.Number(),
    skipped: t.Number(),
    failed: t.Number(),
    percent: t.Number(),
  }),
  stages: t.Array(stageProgressSchema),
  recentLogs: t.Array(
    t.Object({
      timestamp: t.String(),
      level: t.Union([t.Literal('info'), t.Literal('warn'), t.Literal('error')]),
      message: t.String(),
    })
  ),
  error: t.Nullable(t.String()),
})

export const BorealisFullUpdateModel = {
  startBody: t.Optional(
    t.Object({
      only: t.Optional(t.Array(stageKeySchema)),
    })
  ),

  statusResponse: t.Object({
    success: t.Boolean(),
    progress: progressSnapshotSchema,
  }),

  startResponse: t.Object({
    success: t.Boolean(),
    started: t.Boolean(),
    progress: progressSnapshotSchema,
  }),

  cancelResponse: t.Object({
    success: t.Boolean(),
    cancelled: t.Boolean(),
    progress: progressSnapshotSchema,
  }),
} as const

export type BorealisFullUpdateModel = {
  [k in keyof typeof BorealisFullUpdateModel]: UnwrapSchema<
    (typeof BorealisFullUpdateModel)[k]
  >
}
