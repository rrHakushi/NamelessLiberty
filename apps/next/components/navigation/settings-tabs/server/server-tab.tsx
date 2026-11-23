"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  IconAlertTriangle,
  IconBook,
  IconBooks,
  IconCheck,
  IconClock,
  IconDeviceGamepad2,
  IconDeviceTv,
  IconMovie,
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
  IconServer,
  IconSparkles,
  IconTerminal2,
  IconX,
} from "@tabler/icons-react"
import { hasPermission, IRISFlags } from "@NamelessLiberty/permissions"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui/components/progress"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import { toast } from "sonner"
import { useUser } from "@/context/user-context"
import { elysia } from "@/lib/elysia"
import type { SettingsTabProps } from "../types"

type StageKey = "books" | "games" | "tv" | "movies" | "manga" | "anime"

interface StageProgress {
  key: StageKey
  mediaType: string
  label: string
  status: "pending" | "running" | "completed" | "skipped" | "cancelled"
  total: number
  processed: number
  synced: number
  skipped: number
  failed: number
  startedAt: string | null
  finishedAt: string | null
}

interface ProgressSnapshot {
  runId: string | null
  status: "idle" | "running" | "stopping" | "completed" | "cancelled" | "failed"
  startedAt: string | null
  finishedAt: string | null
  triggeredBy: string | null
  currentStageKey: StageKey | null
  currentItem: {
    mediaType: string
    id: number
    title: string
    externalId: string | null
    index: number
    stageTotal: number
  } | null
  totals: {
    total: number
    processed: number
    synced: number
    skipped: number
    failed: number
    percent: number
  }
  stages: StageProgress[]
  recentLogs: Array<{
    timestamp: string
    level: "info" | "warn" | "error"
    message: string
  }>
  error: string | null
}

const ALL_STAGES: Array<{
  key: StageKey
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { key: "books", label: "Books", icon: IconBook },
  { key: "games", label: "Games", icon: IconDeviceGamepad2 },
  { key: "tv", label: "TV Shows", icon: IconDeviceTv },
  { key: "movies", label: "Movies", icon: IconMovie },
  { key: "manga", label: "Manga", icon: IconBooks },
  { key: "anime", label: "Anime", icon: IconSparkles },
]

function formatElapsed(startIso: string | null, endIso: string | null): string | null {
  if (!startIso) return null
  const start = new Date(startIso).getTime()
  const end = endIso ? new Date(endIso).getTime() : Date.now()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null
  const totalSec = Math.floor((end - start) / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function getStatusBadge(status: ProgressSnapshot["status"]) {
  switch (status) {
    case "running":
      return (
        <Badge className="gap-1.5 border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
          <Spinner className="size-3" />
          <span>Running</span>
        </Badge>
      )
    case "stopping":
      return (
        <Badge className="gap-1.5 border-amber-500/30 bg-amber-500/15 text-amber-400">
          <Spinner className="size-3" />
          <span>Stopping…</span>
        </Badge>
      )
    case "completed":
      return (
        <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
          <IconCheck className="size-3" />
          <span>Completed</span>
        </Badge>
      )
    case "cancelled":
      return (
        <Badge className="gap-1 border-amber-500/30 bg-amber-500/15 text-amber-400">
          <IconX className="size-3" />
          <span>Cancelled</span>
        </Badge>
      )
    case "failed":
      return (
        <Badge className="gap-1 border-red-500/30 bg-red-500/15 text-red-400">
          <IconAlertTriangle className="size-3" />
          <span>Failed</span>
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          <IconClock className="size-3" />
          <span>Idle</span>
        </Badge>
      )
  }
}

export function ServerSettingsTab({
  setFooterContent,
}: SettingsTabProps): React.JSX.Element {
  const { user } = useUser()
  const isAdmin = hasPermission(user?.permissions ?? null, IRISFlags.ADMINISTRATOR)

  const [progress, setProgress] = useState<ProgressSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [selectedStages, setSelectedStages] = useState<StageKey[]>(
    ALL_STAGES.map((s) => s.key)
  )
  const [, setTick] = useState(0)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setFooterContent?.(null)
  }, [setFooterContent])

  const fetchStatus = useCallback(async (silent = false) => {
    if (!isAdmin) {
      setIsLoading(false)
      return
    }
    try {
      const res = await (elysia as any).borealis.admin["media-update"].status.get()
      if (res.error) {
        if (!silent) {
          toast.error("Failed to fetch server media update status")
        }
        return
      }
      if (res.data?.progress) {
        setProgress(res.data.progress as ProgressSnapshot)
      }
    } catch {
      if (!silent) {
        toast.error("Failed to connect to server")
      }
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin])

  // Initial fetch
  useEffect(() => {
    void fetchStatus(true)
  }, [fetchStatus])

  const isActive =
    progress?.status === "running" || progress?.status === "stopping"

  // Poll every 1.5s while active
  useEffect(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
    if (!isActive) return

    pollTimerRef.current = setInterval(() => {
      void fetchStatus(true)
      setTick((t) => t + 1)
    }, 1500)

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [isActive, fetchStatus])

  const toggleStage = (key: StageKey) => {
    if (isActive) return
    setSelectedStages((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleStart = async () => {
    if (selectedStages.length === 0) {
      toast.error("Select at least one media type to update")
      return
    }
    setIsStarting(true)
    try {
      const orderedSelection = ALL_STAGES.map((s) => s.key).filter((k) =>
        selectedStages.includes(k)
      )
      const body =
        orderedSelection.length === ALL_STAGES.length
          ? {}
          : { only: orderedSelection }

      const res = await (elysia as any).borealis.admin["media-update"].start.post(body)
      if (res.error) {
        const msg =
          (res.error?.value as { detail?: string; message?: string } | undefined)
            ?.detail ||
          (res.error?.value as { message?: string } | undefined)?.message ||
          "Failed to start media update"
        toast.error(msg)
        return
      }
      if (res.data?.progress) {
        setProgress(res.data.progress as ProgressSnapshot)
      }
      if (res.data?.started) {
        toast.success("Sequential media update started on server")
      } else {
        toast.info("A media update is already running")
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to start media update")
    } finally {
      setIsStarting(false)
    }
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      const res = await (elysia as any).borealis.admin["media-update"].cancel.post()
      if (res.error) {
        toast.error("Failed to cancel media update")
        return
      }
      if (res.data?.progress) {
        setProgress(res.data.progress as ProgressSnapshot)
      }
      toast.info("Stopping after current item finishes…")
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel media update")
    } finally {
      setIsCancelling(false)
    }
  }

  const elapsed = useMemo(
    () => formatElapsed(progress?.startedAt ?? null, progress?.finishedAt ?? null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress?.startedAt, progress?.finishedAt, progress?.totals.processed]
  )

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <IconAlertTriangle className="size-8 text-amber-500" />
        <p className="text-sm font-medium text-foreground">
          Administrator Access Required
        </p>
        <p className="text-xs text-muted-foreground">
          Only server administrators can view or trigger server maintenance tasks.
        </p>
      </div>
    )
  }

  const stagesByKey = new Map<StageKey, StageProgress>()
  for (const s of progress?.stages ?? []) {
    stagesByKey.set(s.key, s)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <IconServer className="size-4.5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Server</h3>
            <Badge
              variant="outline"
              className="h-5 border-primary/30 bg-primary/10 px-1.5 text-[10px] font-semibold text-primary"
            >
              Admin
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Trigger background server maintenance jobs and monitor live progress.
            Jobs run directly inside the Elysia server and continue even if you
            close this window.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 cursor-pointer gap-1.5 rounded-xl text-xs"
          onPress={() => void fetchStatus(false)}
          isDisabled={isLoading}
        >
          <IconRefresh className="size-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Full Media Update Card */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground">
                Full Media Metadata Update
              </h4>
              {progress && getStatusBadge(progress.status)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Sequentially refreshes every media record in order:{" "}
              <span className="font-medium text-foreground/85">
                Books → Games → TV Shows → Movies → Manga → Anime
              </span>
              .
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isActive ? (
              <Button
                variant="destructive"
                size="sm"
                className="cursor-pointer gap-1.5 rounded-xl text-xs"
                onPress={() => void handleCancel()}
                isDisabled={isCancelling || progress?.status === "stopping"}
              >
                <IconPlayerStop className="size-3.5" />
                <span>
                  {progress?.status === "stopping" ? "Stopping…" : "Stop Update"}
                </span>
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="cursor-pointer gap-1.5 rounded-xl text-xs"
                onPress={() => void handleStart()}
                isDisabled={isStarting || selectedStages.length === 0}
              >
                {isStarting ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <IconPlayerPlay className="size-3.5" />
                )}
                <span>
                  {selectedStages.length === ALL_STAGES.length
                    ? "Run Full Update"
                    : `Run Selected (${selectedStages.length})`}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Media Type Filter Pills (selectable when idle) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {ALL_STAGES.map((stage) => {
            const Icon = stage.icon
            const isSelected = selectedStages.includes(stage.key)
            return (
              <button
                key={stage.key}
                type="button"
                disabled={isActive}
                onClick={() => toggleStage(stage.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  isActive && "cursor-not-allowed opacity-70",
                  !isActive && "cursor-pointer",
                  isSelected
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60"
                )}
              >
                <Icon className="size-3.5" />
                <span>{stage.label}</span>
              </button>
            )
          })}
        </div>

        {/* Overall Progress Bar */}
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
            <Spinner className="size-4" />
            <span>Loading server sync status…</span>
          </div>
        ) : (
          progress &&
          progress.status !== "idle" && (
            <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background/60 p-3.5">
              <Progress
                value={progress.totals.percent}
                aria-label="Overall media update progress"
                className="gap-2"
              >
                <ProgressLabel className="text-xs font-medium text-foreground">
                  Overall Progress ({progress.totals.processed.toLocaleString()} /{" "}
                  {progress.totals.total.toLocaleString()})
                </ProgressLabel>
                <ProgressValue className="text-xs font-semibold text-foreground tabular-nums">
                  {() => `${progress.totals.percent.toFixed(1)}%`}
                </ProgressValue>
              </Progress>

              {/* Summary Counters */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground tabular-nums">
                <span>
                  Synced:{" "}
                  <strong className="text-emerald-400">
                    {progress.totals.synced.toLocaleString()}
                  </strong>
                </span>
                <span>
                  Skipped:{" "}
                  <strong className="text-foreground">
                    {progress.totals.skipped.toLocaleString()}
                  </strong>
                </span>
                <span>
                  Failed:{" "}
                  <strong
                    className={
                      progress.totals.failed > 0
                        ? "text-red-400"
                        : "text-foreground"
                    }
                  >
                    {progress.totals.failed.toLocaleString()}
                  </strong>
                </span>
                {elapsed && (
                  <span className="ms-auto">
                    Elapsed: <strong className="text-foreground">{elapsed}</strong>
                  </span>
                )}
              </div>

              {/* Active Item Banner */}
              {progress.currentItem && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
                  <Spinner className="size-3.5 shrink-0 text-primary" />
                  <span className="shrink-0 font-mono text-[11px] font-semibold text-primary">
                    [{progress.currentItem.mediaType} {progress.currentItem.index}/
                    {progress.currentItem.stageTotal}]
                  </span>
                  <span className="truncate font-medium text-foreground">
                    {progress.currentItem.title}
                  </span>
                  <span className="ms-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                    #{progress.currentItem.id}
                  </span>
                </div>
              )}

              {progress.error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span className="break-words">{progress.error}</span>
                </div>
              )}
            </div>
          )
        )}

        {/* Per-Stage Sequential Breakdown */}
        {progress && progress.status !== "idle" && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_STAGES.map((meta, idx) => {
              const Icon = meta.icon
              const stage = stagesByKey.get(meta.key)
              if (!stage) return null
              const pct =
                stage.total > 0
                  ? Math.min(100, Math.round((stage.processed / stage.total) * 100))
                  : stage.status === "completed"
                    ? 100
                    : 0

              return (
                <div
                  key={meta.key}
                  className={cn(
                    "flex flex-col gap-2 rounded-xl border p-3 transition-colors",
                    stage.status === "running"
                      ? "border-primary/40 bg-primary/5"
                      : stage.status === "completed"
                        ? "border-emerald-500/25 bg-emerald-500/5"
                        : "border-border/50 bg-background/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {idx + 1}.
                      </span>
                      <Icon className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate text-xs font-semibold text-foreground">
                        {meta.label}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground uppercase">
                      {stage.status}
                    </span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        stage.status === "completed"
                          ? "bg-emerald-500"
                          : stage.status === "cancelled"
                            ? "bg-amber-500"
                            : "bg-primary"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
                    <span>
                      {stage.processed.toLocaleString()} /{" "}
                      {stage.total.toLocaleString()}
                    </span>
                    <span>
                      {stage.synced} ok
                      {stage.failed > 0 ? ` · ${stage.failed} err` : ""}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Recent Server Logs */}
        {progress && progress.recentLogs.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              <IconTerminal2 className="size-3.5" />
              <span>Recent Activity</span>
            </div>
            <div className="max-h-44 overflow-y-auto rounded-xl border border-border/50 bg-zinc-950/80 p-3 font-mono text-[11px] leading-relaxed">
              {[...progress.recentLogs].reverse().map((entry, idx) => (
                <div
                  key={`${entry.timestamp}-${idx}`}
                  className={cn(
                    "flex items-start gap-2 py-0.5",
                    entry.level === "error"
                      ? "text-red-400"
                      : entry.level === "warn"
                        ? "text-amber-400"
                        : "text-zinc-300"
                  )}
                >
                  <span className="shrink-0 text-zinc-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="break-words">{entry.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
