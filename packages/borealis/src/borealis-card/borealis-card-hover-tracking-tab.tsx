"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  IconActivity,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconX,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { getBackendMediaId } from "./borealis-card-hover-tabs"

interface TrackedEntry {
  mediaType: string
  mediaId: number
  title: string
  executables: string[]
  accumulatedSeconds: number
  pendingSyncHours: number
  isPaused: boolean
  isRunning: boolean
}

interface RunningProcessInfo {
  pid: number
  name: string
  exePath: string
}

interface TauriGlobal {
  core?: {
    invoke?: <T = unknown>(cmd: string, args?: Record<string, unknown>) => Promise<T>
  }
  event?: {
    listen?: <T = unknown>(
      event: string,
      handler: (event: { payload: T }) => void
    ) => Promise<() => void>
  }
}

function getTauri(): TauriGlobal | null {
  if (typeof window === "undefined") return null
  return (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__ ?? null
}

function formatDuration(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(clamped / 60)
  const secs = clamped % 60
  return `${mins}m ${secs.toString().padStart(2, "0")}s`
}

export interface BorealisCardHoverTrackingTabProps {
  data: any
  isHoverCardEditing?: boolean
}

export function BorealisCardHoverTrackingTab({
  data,
  isHoverCardEditing = false,
}: BorealisCardHoverTrackingTabProps): React.JSX.Element {
  const mediaId = getBackendMediaId(data)
  const mediaType = data?.type === "other" ? "other" : "game"
  const title = data?.title || data?.raw?.title || "Untitled"

  const [entry, setEntry] = useState<TrackedEntry | null>(null)
  const [globalPaused, setGlobalPaused] = useState(false)
  const [processes, setProcesses] = useState<RunningProcessInfo[]>([])
  const [processError, setProcessError] = useState<string | null>(null)
  const [loadingProcesses, setLoadingProcesses] = useState(false)
  const [showProcessPicker, setShowProcessPicker] = useState(false)
  const [processFilter, setProcessFilter] = useState("")
  const [manualExe, setManualExe] = useState("")
  const [saving, setSaving] = useState(false)

  const refreshEntry = useCallback(async () => {
    const invoke = getTauri()?.core?.invoke
    if (!invoke || !mediaId) return
    try {
      const res = await invoke<TrackedEntry | null>("tracker_get_entry", {
        mediaType,
        mediaId,
      })
      setEntry(res)
    } catch {
      // Ignore invoke failures outside Tauri
    }
  }, [mediaId, mediaType])

  useEffect(() => {
    void refreshEntry()
    const tauri = getTauri()
    const invoke = tauri?.core?.invoke
    const listen = tauri?.event?.listen

    if (invoke) {
      invoke<boolean>("tracker_get_global_paused")
        .then(setGlobalPaused)
        .catch(() => {})
    }

    if (!listen) return

    let unlistenState: (() => void) | undefined
    let unlistenGlobalPause: (() => void) | undefined
    void listen<TrackedEntry[]>("tracker-state", (ev) => {
      const match = ev.payload?.find(
        (item) => item.mediaType === mediaType && item.mediaId === mediaId
      )
      if (match) {
        setEntry(match)
      }
    }).then((fn) => {
      unlistenState = fn
    })

    void listen<boolean>("tracker-global-paused", (ev) => {
      setGlobalPaused(Boolean(ev.payload))
    }).then((fn) => {
      unlistenGlobalPause = fn
    })

    return () => {
      unlistenState?.()
      unlistenGlobalPause?.()
    }
  }, [mediaId, mediaType, refreshEntry])

  const loadRunningProcesses = useCallback(async () => {
    const invoke = getTauri()?.core?.invoke
    if (!invoke) {
      setProcessError("Tauri invoke API unavailable.")
      return
    }
    setLoadingProcesses(true)
    setProcessError(null)
    try {
      const list = await invoke<RunningProcessInfo[]>("tracker_get_running_processes")
      setProcesses(list ?? [])
    } catch (err) {
      setProcesses([])
      setProcessError(typeof err === "string" ? err : "Failed to detect processes.")
    } finally {
      setLoadingProcesses(false)
    }
  }, [])

  const updateExecutables = useCallback(
    async (nextExecutables: string[]) => {
      const invoke = getTauri()?.core?.invoke
      if (!invoke || !mediaId) return
      setSaving(true)
      try {
        const updated = await invoke<TrackedEntry>("tracker_set_executables", {
          mediaType,
          mediaId,
          title,
          executables: nextExecutables,
        })
        setEntry(updated)
      } finally {
        setSaving(false)
      }
    },
    [mediaId, mediaType, title]
  )

  const handleAddExe = async (exeName: string) => {
    const trimmed = exeName.trim()
    if (!trimmed) return
    const current = entry?.executables ?? []
    if (current.some((e) => e.toLowerCase() === trimmed.toLowerCase())) {
      setManualExe("")
      return
    }
    await updateExecutables([...current, trimmed])
    setManualExe("")
  }

  const handleRemoveExe = async (exeName: string) => {
    const current = entry?.executables ?? []
    await updateExecutables(
      current.filter((e) => e.toLowerCase() !== exeName.toLowerCase())
    )
  }

  const handleTogglePause = async () => {
    const invoke = getTauri()?.core?.invoke
    if (!invoke || !mediaId) return
    const updated = await invoke<TrackedEntry>("tracker_toggle_pause", {
      mediaType,
      mediaId,
      title,
    })
    setEntry(updated)
  }

  const accumulatedSeconds = entry?.accumulatedSeconds ?? 0
  const progressPct = Math.min(100, Math.round((accumulatedSeconds / 3600) * 100))
  const isPaused = globalPaused || (entry?.isPaused ?? false)
  const isEntryPaused = entry?.isPaused ?? false
  const isRunning = entry?.isRunning ?? false
  const linkedExecutables = entry?.executables ?? []
  const pendingSyncHours = entry?.pendingSyncHours ?? 0

  const statusLabel = isPaused ? "PAUSED" : isRunning ? "TRACKING" : "STOPPED"
  const statusClasses = isPaused
    ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
    : isRunning
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
      : "border-zinc-700 bg-zinc-800/70 text-zinc-400"

  const filteredProcesses = useMemo(() => {
    const q = processFilter.trim().toLowerCase()
    if (!q) return processes.slice(0, 40)
    return processes
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.exePath.toLowerCase().includes(q)
      )
      .slice(0, 40)
  }, [processFilter, processes])

  return (
    <div className="flex flex-col gap-3 p-3 text-xs">
      {/* Status + Pause/Resume */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
              statusClasses
            )}
          >
            <IconActivity className="size-3" />
            {statusLabel}
          </span>
          {pendingSyncHours > 0 && (
            <span className="rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              +{pendingSyncHours}h queued
            </span>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void handleTogglePause()}
          className="h-7 gap-1.5 px-2.5 text-xs"
        >
          {isEntryPaused ? (
            <>
              <IconPlayerPlay className="size-3.5" />
              Resume
            </>
          ) : (
            <>
              <IconPlayerPause className="size-3.5" />
              Pause
            </>
          )}
        </Button>
      </div>

      {/* 1-Hour Progress */}
      <div className="rounded-lg border border-border bg-zinc-900/60 p-2.5">
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Next +1h progress</span>
          <span className="font-mono font-medium text-foreground">
            {formatDuration(accumulatedSeconds)} / 60m ({progressPct}%)
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isPaused ? "bg-amber-500/80" : "bg-primary"
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Linked Executables (Multiple) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-muted-foreground">
            Linked Processes ({linkedExecutables.length})
          </span>
          {isHoverCardEditing && (
            <button
              type="button"
              onClick={() => {
                const next = !showProcessPicker
                setShowProcessPicker(next)
                if (next) void loadRunningProcesses()
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
            >
              <IconRefresh className={cn("size-3", loadingProcesses && "animate-spin")} />
              {showProcessPicker ? "Hide running" : "Detect running"}
            </button>
          )}
        </div>

        {linkedExecutables.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {linkedExecutables.map((exe) => (
              <span
                key={exe}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-zinc-900 px-2 py-0.5 font-mono text-[11px] text-foreground"
              >
                <span className="max-w-[160px] truncate">{exe}</span>
                {isHoverCardEditing && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleRemoveExe(exe)}
                    aria-label={`Remove ${exe}`}
                    className="text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <IconX className="size-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            {isHoverCardEditing
              ? "No processes linked yet. Add an executable or pick a running app below."
              : "No processes linked yet. Click edit to link an executable."}
          </p>
        )}

        {/* Manual Executable Input & Running Process Picker (Edit mode only) */}
        {isHoverCardEditing && (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void handleAddExe(manualExe)
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={manualExe}
                onChange={(e) => setManualExe(e.target.value)}
                placeholder="e.g. eldenring.exe"
                className="h-7 flex-1 rounded-md border border-border bg-zinc-950 px-2 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={saving || !manualExe.trim()}
                className="h-7 gap-1 px-2 text-xs"
              >
                <IconPlus className="size-3.5" />
                Add
              </Button>
            </form>

            {showProcessPicker && (
              <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-zinc-950/90 p-2">
                <input
                  type="text"
                  value={processFilter}
                  onChange={(e) => setProcessFilter(e.target.value)}
                  placeholder="Filter running processes..."
                  className="h-7 w-full rounded-md border border-border bg-zinc-900 px-2 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {loadingProcesses ? (
                    <div className="py-2 text-center text-[11px] text-muted-foreground">
                      Scanning processes...
                    </div>
                  ) : processError ? (
                    <div className="py-2 text-center text-[11px] text-destructive">
                      {processError}
                    </div>
                  ) : filteredProcesses.length === 0 ? (
                    <div className="py-2 text-center text-[11px] text-muted-foreground">
                      No matching processes found.
                    </div>
                  ) : (
                    filteredProcesses.map((proc) => {
                      const alreadyLinked = linkedExecutables.some(
                        (e) => e.toLowerCase() === proc.name.toLowerCase()
                      )
                      return (
                        <button
                          key={`${proc.pid}-${proc.name}`}
                          type="button"
                          disabled={saving || alreadyLinked}
                          onClick={() => void handleAddExe(proc.name)}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-start text-[11px] transition-colors",
                            alreadyLinked
                              ? "cursor-default bg-primary/10 text-primary"
                              : "cursor-pointer hover:bg-zinc-800/80 text-foreground"
                          )}
                        >
                          <span className="truncate font-mono">{proc.name}</span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {alreadyLinked ? "Linked" : "+ Link"}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
