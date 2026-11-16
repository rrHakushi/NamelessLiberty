"use client"

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

import {
  IconCalendar,
  IconCheck,
  IconClock,
  IconDeviceTv,
  IconFileText,
  IconFlag,
  IconFolder,
  IconLayoutGrid,
  IconLink,
  IconLoader2,
  IconLock,
  IconMicrophone,
  IconPencil,
  IconRotate2,
  IconStar,
  IconX,
} from "@tabler/icons-react"

import { cn } from "@workspace/ui/lib/utils"

import { Button } from "@workspace/ui/components/button"

import { useBorealisCard } from "../borealis-card-context"
import {
  getRepeatLabel,
  BorealisCardHoverEditForm,
  getBackendMediaId,
  toBackendMediaType,
  BorealisCardHoverEpisodesTab,
  BorealisCardHoverRewatchesTab,
  BorealisCardHoverConnectionsTab,
  BorealisCardHoverWatchlistsTab,
} from "./borealis-card-hover-tabs"
import { BorealisFormattedText } from "../formatted-text"

import { MediaStatusBadge } from "../media-status-badge"
import { MediaListStatusBadge } from "../media-list-status-badge"
import { FavoriteButton, type FavoriteType } from "../media/favorite-button"

import { normalizeListStatus, type ListStatus } from "../media-list-status-text"
import type { BorealisCardHoverContentProps, BorealisCardSavePayload } from "../types"

import { formatDateToYmd, synthesizeWatchedEpisodes } from "./shared"

// 5. BorealisCard.HoverContent

// -----------------------------------------------------------------------------
export function BorealisCardHoverContent({
  className,
  placement,
}: BorealisCardHoverContentProps) {
  const {
    data,
    config,
    isHovered,
    popoverPlacement,
    containerRef,
    popoverRef: contextPopoverRef,
    handleMouseEnter,
    handleMouseLeave,
    setLocalScore,
    setLocalStatus,
    setLocalProgress,
    isHoverCardEditing,
    setIsHoverCardEditing,
  } = useBorealisCard()

  const [activeTab, setActiveTab] = useState<
    "general" | "episodes" | "repeats" | "connections" | "watchlists"
  >("general")

  const rawEntry = data.raw?.entry ?? data.raw?.listEntry ?? data.raw
  const rawMedia = data.raw?.media ?? data.raw

  // Central Draft State shared across General, Episodes, and Rewatches tabs
  const [draftStatus, setDraftStatus] = useState<ListStatus>(() => {
    return normalizeListStatus(rawEntry?.status ?? data.hoverDetails?.listStatus) ?? "IN_PROGRESS"
  })

  const [draftScore, setDraftScore] = useState<number | null>(() => {
    const s = rawEntry?.score ?? data.hoverDetails?.userScore
    return typeof s === "number" && s > 0 ? (s > 10 ? s / 10 : s) : null
  })

  const maxUnits =
    typeof data.progress?.max === "number" && data.progress.max > 0
      ? data.progress.max
      : typeof data.hoverDetails?.episodeCount === "number" && data.hoverDetails.episodeCount > 0
        ? data.hoverDetails.episodeCount
        : null

  const maxChapters =
    typeof data.progress?.chapterMax === "number" && data.progress.chapterMax > 0
      ? data.progress.chapterMax
      : typeof data.hoverDetails?.chapterCount === "number" && data.hoverDetails.chapterCount > 0
        ? data.hoverDetails.chapterCount
        : null

  const maxVolumes =
    typeof data.progress?.volumeMax === "number" && data.progress.volumeMax > 0
      ? data.progress.volumeMax
      : typeof data.hoverDetails?.volumeCount === "number" && data.hoverDetails.volumeCount > 0
        ? data.hoverDetails.volumeCount
        : null

  const [draftProgress, setDraftProgress] = useState<number>(() => {
    const p = data.progress?.current ?? rawEntry?.progress ?? 0
    return maxUnits ? Math.min(maxUnits, p) : p
  })

  const [draftChaptersProgress, setDraftChaptersProgress] = useState<number>(() => {
    const cp = data.progress?.chapterCurrent ?? rawEntry?.chaptersProgress ?? rawEntry?.progressChapters ?? 0
    return maxChapters ? Math.min(maxChapters, cp) : cp
  })

  const [draftVolumesProgress, setDraftVolumesProgress] = useState<number>(() => {
    const vp = data.progress?.volumeCurrent ?? rawEntry?.volumesProgress ?? rawEntry?.progressVolumes ?? 0
    return maxVolumes ? Math.min(maxVolumes, vp) : vp
  })

  const initialHistory = useMemo(() => {
    const raw =
      rawEntry?.rereadHistory ??
      rawEntry?.rewatchHistory ??
      rawEntry?.replayHistory ??
      []
    let list: any[] = []
    if (Array.isArray(raw)) {
      list = raw
    } else if (typeof raw === "string") {
      try {
        let parsed = JSON.parse(raw)
        if (typeof parsed === "string") {
          try {
            parsed = JSON.parse(parsed)
          } catch { }
        }
        if (Array.isArray(parsed)) list = parsed
      } catch { }
    }
    return list.map((item: any) => ({
      ...item,
      startedAt: formatDateToYmd(item.startedAt),
      completedAt: formatDateToYmd(item.completedAt),
    }))
  }, [rawEntry])

  const [draftHistory, setDraftHistory] = useState<any[]>(() => initialHistory)

  const [draftRewatched, setDraftRewatched] = useState<number>(() => {
    const r = rawEntry?.rewatched ?? rawEntry?.reread ?? rawEntry?.replayed ?? rawEntry?.playCount ?? 0
    return Math.max(Number(r) || 0, initialHistory.length)
  })

  const [draftStartedAt, setDraftStartedAt] = useState<string>(() => {
    return formatDateToYmd(rawEntry?.startedAt)
  })

  const [draftCompletedAt, setDraftCompletedAt] = useState<string>(() => {
    return formatDateToYmd(rawEntry?.completedAt)
  })

  const [draftIsPrivate, setDraftIsPrivate] = useState<boolean>(() => {
    return Boolean(rawEntry?.private ?? rawEntry?.isPrivate ?? false)
  })

  const [draftPriority, setDraftPriority] = useState<string>(() => {
    return (rawEntry?.priority ?? "LOW").toUpperCase()
  })

  const [draftNotes, setDraftNotes] = useState<string>(() => {
    return rawEntry?.notes ?? ""
  })

  const [draftWatchedEpisodes, setDraftWatchedEpisodes] = useState<any[]>(() => {
    if (Array.isArray(rawEntry?.watchedEpisodes) && rawEntry.watchedEpisodes.length > 0) {
      return rawEntry.watchedEpisodes
    }
    const seasonsList: any[] = Array.isArray(rawMedia?.seasons)
      ? rawMedia.seasons
      : Array.isArray(data.hoverDetails?.seasons)
        ? data.hoverDetails.seasons
        : []
    const curProg = Number(data.progress?.current ?? rawEntry?.progress ?? 0)
    return synthesizeWatchedEpisodes(seasonsList, curProg)
  })

  const [draftConnections, setDraftConnections] = useState<Record<string, any>>(() => {
    const c = rawEntry?.connections ?? data.hoverDetails?.connections
    if (c && typeof c === "object" && !Array.isArray(c)) {
      return { ...c }
    }
    return {}
  })

  const [draftListChanges, setDraftListChanges] = useState<Record<string, boolean>>({})
  const [draftNewLists, setDraftNewLists] = useState<string[]>([])
  const [playlistRefreshKey, setPlaylistRefreshKey] = useState<number>(0)

  const [isSaving, setIsSaving] = useState(false)

  // Only auto-complete when progress is actively increased by the user to reach or exceed maxCount
  const prevProgRef = useRef({ progress: draftProgress, chapters: draftChaptersProgress })
  useEffect(() => {
    const prev = prevProgRef.current
    const progIncreased = draftProgress > prev.progress || draftChaptersProgress > prev.chapters
    prevProgRef.current = { progress: draftProgress, chapters: draftChaptersProgress }

    if (progIncreased) {
      if (
        ((maxUnits && draftProgress >= maxUnits) ||
          (maxChapters && draftChaptersProgress >= maxChapters)) &&
        draftStatus !== "COMPLETED"
      ) {
        setDraftStatus("COMPLETED")
        const today = new Date().toISOString().slice(0, 10)
        if (!draftCompletedAt) setDraftCompletedAt(today)
        if (!draftStartedAt) setDraftStartedAt(today)
      }
    }
  }, [draftProgress, draftChaptersProgress, maxUnits, maxChapters, draftStatus, draftCompletedAt, draftStartedAt])

  useEffect(() => {
    if (!isHoverCardEditing) {
      setDraftNotes(rawEntry?.notes ?? "")
      setDraftStartedAt(formatDateToYmd(rawEntry?.startedAt))
      setDraftCompletedAt(formatDateToYmd(rawEntry?.completedAt))
      setDraftIsPrivate(Boolean(rawEntry?.private ?? rawEntry?.isPrivate ?? false))
      setDraftPriority((rawEntry?.priority ?? "LOW").toUpperCase())
    }
  }, [
    isHoverCardEditing,
    rawEntry?.notes,
    rawEntry?.startedAt,
    rawEntry?.completedAt,
    rawEntry?.private,
    rawEntry?.isPrivate,
    rawEntry?.priority,
  ])

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const payload: BorealisCardSavePayload = {
        status: draftStatus,
        priority: draftPriority,
        score: draftScore !== null && draftScore > 0 ? Math.round(Number(draftScore) * 10) / 10 : null,
        progress: draftProgress,
        chaptersProgress: draftChaptersProgress,
        volumesProgress: draftVolumesProgress,
        startedAt: draftStartedAt || null,
        completedAt: draftCompletedAt || null,
        rewatched: draftRewatched,
        isPrivate: draftIsPrivate,
        notes: draftNotes || null,
        watchedEpisodes: draftWatchedEpisodes,
        rewatchHistory: draftHistory,
        rereadHistory: draftHistory,
        connections: Object.keys(draftConnections).length > 0 ? draftConnections : null,
      }

      if (config.onSaveEntry) {
        await config.onSaveEntry(payload)
      }

      setDraftListChanges({})
      setDraftNewLists([])
      setPlaylistRefreshKey((k) => k + 1)


      setLocalScore?.(payload.score)
      setLocalStatus?.(payload.status)
      setLocalProgress?.(payload.progress)
      setIsHoverCardEditing?.(false)
    } catch (err: any) {
      console.error("Failed to save entry from hover card:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setDraftStatus(normalizeListStatus(rawEntry?.status ?? data.hoverDetails?.listStatus) ?? "IN_PROGRESS")
    const s = rawEntry?.score ?? data.hoverDetails?.userScore
    setDraftScore(typeof s === "number" && s > 0 ? (s > 10 ? s / 10 : s) : null)
    setDraftProgress(data.progress?.current ?? rawEntry?.progress ?? 0)
    setDraftChaptersProgress(data.progress?.chapterCurrent ?? rawEntry?.chaptersProgress ?? rawEntry?.progressChapters ?? 0)
    setDraftVolumesProgress(data.progress?.volumeCurrent ?? rawEntry?.volumesProgress ?? rawEntry?.progressVolumes ?? 0)
    setDraftHistory(initialHistory)
    setDraftRewatched(Math.max(Number(rawEntry?.rewatched ?? rawEntry?.reread ?? rawEntry?.replayed ?? 0), initialHistory.length))
    setDraftStartedAt(formatDateToYmd(rawEntry?.startedAt))
    setDraftCompletedAt(formatDateToYmd(rawEntry?.completedAt))
    setDraftIsPrivate(Boolean(rawEntry?.private ?? rawEntry?.isPrivate ?? false))
    setDraftNotes(rawEntry?.notes ?? "")
    setDraftWatchedEpisodes(Array.isArray(rawEntry?.watchedEpisodes) ? rawEntry.watchedEpisodes : [])
    const c = rawEntry?.connections ?? data.hoverDetails?.connections
    setDraftConnections(c && typeof c === "object" && !Array.isArray(c) ? { ...c } : {})
    setDraftListChanges({})
    setDraftNewLists([])
    setIsHoverCardEditing?.(false)
  }

  const mediaId = Number(
    rawMedia?.id ||
    data.id ||
    (rawEntry as any)?.animeId ||
    (rawEntry as any)?.mangaId ||
    (rawEntry as any)?.movieId ||
    (rawEntry as any)?.tvId ||
    (rawEntry as any)?.gameId ||
    (rawEntry as any)?.bookId ||
    (rawEntry as any)?.musicId ||
    (rawEntry as any)?.otherId
  )

  const effectiveDescription =
    data.hoverDetails?.description || rawMedia?.description || data.description || null
  const effectiveGender =
    data.hoverDetails?.gender || (data as any)?.gender || rawMedia?.gender || null
  const effectiveAge =
    data.hoverDetails?.age || (data as any)?.age || rawMedia?.age || null

  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState<{
    top: number
    left: number
    maxHeight: number
    placement: "left" | "right"
  } | null>(null)
  const localPopoverRef = useRef<HTMLDivElement>(null)
  const popoverRef = contextPopoverRef ?? localPopoverRef

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if ((!isHovered && !isHoverCardEditing) || !containerRef?.current || typeof window === "undefined") {
      if (!isHoverCardEditing) {
        setCoords(null)
      }
      return
    }

    const updatePosition = () => {
      if (!containerRef?.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      const popoverWidth = Math.min(384, viewportWidth - 24)
      const gap = 14

      const spaceRight = viewportWidth - rect.right
      const spaceLeft = rect.left

      const requestedPlacement = placement ?? popoverPlacement
      let chosenPlacement: "left" | "right" =
        requestedPlacement === "left" ? "left" : "right"

      // Automatically place on the side that has sufficient space, avoiding clipping
      if (
        chosenPlacement === "right" &&
        spaceRight < popoverWidth + gap &&
        spaceLeft >= popoverWidth + gap
      ) {
        chosenPlacement = "left"
      } else if (
        chosenPlacement === "left" &&
        spaceLeft < popoverWidth + gap &&
        spaceRight >= popoverWidth + gap
      ) {
        chosenPlacement = "right"
      }

      let left = 0
      if (chosenPlacement === "right") {
        left = rect.right + gap
      } else {
        left = rect.left - popoverWidth - gap
      }

      // Clamp left within viewport bounds
      left = Math.max(12, Math.min(left, viewportWidth - popoverWidth - 12))

      // Vertical placement: measure popover if available, else conservative fallback
      const measuredHeight = popoverRef.current?.offsetHeight ?? 480
      const maxAllowedHeight = Math.max(180, viewportHeight - 32)
      const targetHeight = Math.min(measuredHeight, maxAllowedHeight)

      let top = rect.top
      // If hovering near the bottom of the viewport, shift up so popover is 100% visible
      if (top + targetHeight > viewportHeight - 16) {
        top = viewportHeight - targetHeight - 16
      }
      top = Math.max(16, top)
      const maxHeight = Math.max(180, viewportHeight - top - 16)

      setCoords({ top, left, maxHeight, placement: chosenPlacement })
    }

    updatePosition()
    window.addEventListener("scroll", updatePosition, true)
    window.addEventListener("resize", updatePosition)

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined" && popoverRef.current) {
      observer = new ResizeObserver(() => {
        updatePosition()
      })
      observer.observe(popoverRef.current)
    }

    return () => {
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
      observer?.disconnect()
    }
  }, [isHovered, isHoverCardEditing, containerRef, placement, popoverPlacement])

  // Synchronously adjust coords if popover DOM height shifts after render
  useEffect(() => {
    if ((isHovered || isHoverCardEditing) && popoverRef.current && containerRef?.current && typeof window !== "undefined") {
      const rect = containerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const measuredHeight = popoverRef.current.offsetHeight
      const maxAllowedHeight = Math.max(180, viewportHeight - 32)
      const targetHeight = Math.min(measuredHeight, maxAllowedHeight)

      let top = rect.top
      if (top + targetHeight > viewportHeight - 16) {
        top = viewportHeight - targetHeight - 16
      }
      top = Math.max(16, top)
      const maxHeight = Math.max(180, viewportHeight - top - 16)

      setCoords((prev) => {
        if (!prev) return null
        if (Math.abs(prev.top - top) < 1 && Math.abs(prev.maxHeight - maxHeight) < 1) {
          return prev
        }
        return { ...prev, top, maxHeight }
      })
    }
  })

  if (!config.showHoverCard || (!isHovered && !isHoverCardEditing) || !mounted || !coords) {
    return null
  }

  const details = data.hoverDetails
  // Remove subtitle from hoverCard by default as requested
  const shouldShowSubtitle = config.showHoverSubtitle === true

  const showEpisodesTab = data.type === "tv" || data.type === "anime"
  const showRepeatsTab = data.type !== "music"
  const showConnectionsTab = data.type !== "other"
  const repeatLabel = getRepeatLabel(data.type)

  const relationsCount = Array.isArray(rawMedia?.relations)
    ? rawMedia.relations.length
    : Array.isArray(data.hoverDetails?.relations)
      ? data.hoverDetails.relations.length
      : 0
  const watchlists: any[] = Array.isArray(rawEntry?.watchlists)
    ? rawEntry.watchlists
    : Array.isArray(rawEntry?.customLists)
      ? rawEntry.customLists
      : []
  const watchlistsCount = watchlists.length

  const totalEpisodeCount = data.hoverDetails?.episodeCount ?? rawMedia?.episodeCount ?? data.progress?.max

  const editActions = (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={isSaving}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleSave()
        }}
        className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
        aria-label="Save"
        title="Save"
      >
        {isSaving ? (
          <IconLoader2 className="size-3.5 animate-spin" />
        ) : (
          <IconCheck className="size-3.5 stroke-[2.5]" />
        )}
      </button>
      <button
        type="button"
        disabled={isSaving}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleCancel()
        }}
        className="flex size-7 items-center justify-center rounded-lg border border-frost bg-frost/80 text-primary/80 hover:border-primary/50 hover:bg-zinc-800 hover:text-primary transition-colors cursor-pointer disabled:opacity-50 backdrop-blur-md"
        aria-label="Cancel"
        title="Cancel"
      >
        <IconX className="size-3.5" />
      </button>
    </div>
  )

  const content = (
    <div
      ref={popoverRef}
      role="tooltip"
      onClick={(e) => {
        e.stopPropagation()
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => {
        if (!isHoverCardEditing) {
          handleMouseLeave()
        }
      }}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        maxHeight: `${coords.maxHeight}px`,
        zIndex: 9999,
      }}
      className={cn(
        "flex w-80 max-w-[calc(100vw-24px)] sm:w-96 h-auto min-h-0 flex-col overflow-y-auto overscroll-contain rounded-2xl border border-frost bg-frost text-primary shadow-2xl backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-150 select-text cursor-auto pointer-events-auto [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]",
        className
      )}
    >
      {/* Invisible Hover Bridge spanning the 14px gap between card & popover - strictly outside popover */}
      <div
        className={cn(
          "absolute top-0 bottom-0 pointer-events-auto bg-transparent z-0",
          coords.placement === "right" ? "-left-[14px] w-[14px]" : "-right-[14px] w-[14px]"
        )}
        aria-hidden="true"
      />

      {/* Banner Backdrop or blurred scaled coverImage fallback */}
      {(() => {
        const isPersonOrCharacter =
          data.type === "character" ||
          data.type === "characters" ||
          data.type === "staff" ||
          data.type === "people"
        if (isPersonOrCharacter) return null

        const heroBanner = details?.bannerImage
        const heroCover =
          data.image ||
          details?.coverImage ||
          (rawMedia as any)?.coverImage ||
          (rawMedia as any)?.posterImage
        const activeHero = heroBanner || heroCover

        if (!activeHero) return null

        return (
          <div className="relative h-28 w-full shrink-0 overflow-hidden bg-muted rounded-t-2xl">
            <img
              src={activeHero}
              alt=""
              className={cn(
                "size-full object-cover",
                !heroBanner && "scale-125 blur-md brightness-60"
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent dark:from-zinc-950 dark:via-zinc-950/50" />
          </div>
        )
      })()}

      {/* Tabs Icon Navigation Bar - Active tab expands icon with text label (only visible when showTabNav is true) */}
      {config.showTabNav && (
        <div className="relative z-20 flex items-center justify-between gap-1 border-b border-frost bg-frost/80 px-2.5 py-1.5 shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] min-w-0">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              title="General"
              aria-label="General"
              className={cn(
                "relative z-20 flex h-7 items-center gap-1.5 rounded-lg text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer border select-none backdrop-blur-md",
                activeTab === "general"
                  ? "border-primary/50 bg-primary/15 text-foreground shadow-xs px-2.5 [&_svg]:text-primary"
                  : "border-transparent text-foreground/80 hover:bg-muted/70 hover:text-primary px-2 dark:text-foreground/80 dark:hover:bg-zinc-800/60 dark:hover:text-primary"
              )}
            >
              <IconLayoutGrid className="size-4 shrink-0" />
              {activeTab === "general" && <span className="whitespace-nowrap">General</span>}
            </button>
            {showEpisodesTab && (
              <button
                type="button"
                onClick={() => setActiveTab("episodes")}
                title="Episodes"
                aria-label="Episodes"
                className={cn(
                  "relative z-20 flex h-7 items-center gap-1.5 rounded-lg text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer border select-none backdrop-blur-md",
                  activeTab === "episodes"
                    ? "border-primary/50 bg-primary/15 text-foreground shadow-xs px-2.5 [&_svg]:text-primary"
                    : "border-transparent text-foreground/80 hover:bg-muted/70 hover:text-primary px-2 dark:text-foreground/80 dark:hover:bg-zinc-800/60 dark:hover:text-primary"
                )}
              >
                <IconDeviceTv className="size-4 shrink-0" />
                {activeTab === "episodes" && <span className="whitespace-nowrap">Episodes</span>}
              </button>
            )}
            {showRepeatsTab && (
              <button
                type="button"
                onClick={() => setActiveTab("repeats")}
                title={repeatLabel.plural}
                aria-label={repeatLabel.plural}
                className={cn(
                  "relative z-20 flex h-7 items-center gap-1.5 rounded-lg text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer border select-none backdrop-blur-md",
                  activeTab === "repeats"
                    ? "border-primary/50 bg-primary/15 text-foreground shadow-xs px-2.5 [&_svg]:text-primary"
                    : "border-transparent text-foreground/80 hover:bg-muted/70 hover:text-primary px-2 dark:text-foreground/80 dark:hover:bg-zinc-800/60 dark:hover:text-primary"
                )}
              >
                <IconRotate2 className="size-4 shrink-0" />
                {activeTab === "repeats" && <span className="whitespace-nowrap">{repeatLabel.plural}</span>}
              </button>
            )}
            {showConnectionsTab && (
              <button
                type="button"
                onClick={() => setActiveTab("connections")}
                title="Connections"
                aria-label="Connections"
                className={cn(
                  "relative z-20 flex h-7 items-center gap-1.5 rounded-lg text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer border select-none backdrop-blur-md",
                  activeTab === "connections"
                    ? "border-primary/50 bg-primary/15 text-foreground shadow-xs px-2.5 [&_svg]:text-primary"
                    : "border-transparent text-foreground/80 hover:bg-muted/70 hover:text-primary px-2 dark:text-foreground/80 dark:hover:bg-zinc-800/60 dark:hover:text-primary"
                )}
              >
                <IconLink className="size-4 shrink-0" />
                {activeTab === "connections" && <span className="whitespace-nowrap">Connections</span>}
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab("watchlists")}
              title="Custom Lists"
              aria-label="Custom Lists"
              className={cn(
                "relative z-20 flex h-7 items-center gap-1.5 rounded-lg text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer border select-none backdrop-blur-md",
                activeTab === "watchlists"
                  ? "border-primary/50 bg-primary/15 text-foreground shadow-xs px-2.5 [&_svg]:text-primary"
                  : "border-transparent text-foreground/80 hover:bg-muted/70 hover:text-primary px-2 dark:text-foreground/80 dark:hover:bg-zinc-800/60 dark:hover:text-primary"
              )}
            >
              <IconFolder className="size-4 shrink-0" />
              {activeTab === "watchlists" && <span className="whitespace-nowrap">Custom Lists</span>}
            </button>
          </div>

          {/* Edit button (pencil) -> save + cancel icons while editing */}
          {config.canEdit && !isHoverCardEditing && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsHoverCardEditing?.(true)
              }}
              className="relative z-20 ms-auto flex size-7 items-center justify-center rounded-lg border border-frost bg-frost/80 text-foreground/80 hover:border-primary/50 hover:bg-muted hover:text-primary dark:text-foreground/80 dark:hover:border-primary/50 dark:hover:bg-zinc-800 dark:hover:text-primary transition-colors cursor-pointer shrink-0 backdrop-blur-md"
              aria-label="Edit list entry"
              title="Edit list entry"
            >
              <IconPencil className="size-3.5" />
            </button>
          )}
          {config.canEdit && isHoverCardEditing && (
            <div className="relative z-20 ms-auto">{editActions}</div>
          )}
        </div>
      )}

      {/* Tab 1: General */}
      {activeTab === "general" && (
        isHoverCardEditing ? (
          <BorealisCardHoverEditForm
            data={data}
            config={config}
            draftStatus={draftStatus}
            setDraftStatus={setDraftStatus}
            draftScore={draftScore}
            setDraftScore={setDraftScore}
            draftPriority={draftPriority}
            setDraftPriority={setDraftPriority}
            draftProgress={draftProgress}
            setDraftProgress={setDraftProgress}
            draftChaptersProgress={draftChaptersProgress}
            setDraftChaptersProgress={setDraftChaptersProgress}
            draftVolumesProgress={draftVolumesProgress}
            setDraftVolumesProgress={setDraftVolumesProgress}
            draftRewatched={draftRewatched}
            setDraftRewatched={setDraftRewatched}
            draftStartedAt={draftStartedAt}
            setDraftStartedAt={setDraftStartedAt}
            draftCompletedAt={draftCompletedAt}
            setDraftCompletedAt={setDraftCompletedAt}
            draftIsPrivate={draftIsPrivate}
            setDraftIsPrivate={setDraftIsPrivate}
            draftNotes={draftNotes}
            setDraftNotes={setDraftNotes}
          />
        ) : (
          <div className="flex flex-col gap-3 p-4 shrink-0">
            {/* Title Header */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-start justify-between gap-2">
                <h4 className="line-clamp-2 text-sm sm:text-base font-extrabold text-foreground font-mono">
                  {data.href && data.href !== "#" ? (
                    <a
                      href={data.href}
                      className="text-foreground hover:text-primary transition-colors hover:underline"
                    >
                      {data.title}
                    </a>
                  ) : (
                    data.title
                  )}
                </h4>
                <div className="flex shrink-0 items-center gap-1.5">
                  {(() => {
                    const isEpisodeType = data.type === "episode" || data.type === "episodes"
                    const favId = getBackendMediaId(data)
                    if (isEpisodeType || !favId) return null
                    const favType: FavoriteType =
                      data.type === "character" || data.type === "characters"
                        ? "CHARACTER"
                        : data.type === "staff" || data.type === "people"
                          ? "PERSON"
                          : data.type === "studio" || data.type === "studios"
                            ? "STUDIO"
                            : (toBackendMediaType(data.type) as FavoriteType)
                    return (
                      <FavoriteButton
                        targetId={favId}
                        type={favType}
                        title={data.title}
                        size="icon-sm"
                        variant="secondary"
                        className="size-7 rounded-lg border border-frost backdrop-blur-md"
                      />
                    )
                  })()}
                  {config.canEdit && !config.showTabNav && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIsHoverCardEditing?.(true)
                      }}
                      className="flex size-7 items-center justify-center rounded-lg border border-frost bg-frost/80 text-foreground/80 hover:border-primary/50 hover:bg-muted hover:text-primary dark:text-foreground/80 dark:hover:border-primary/50 dark:hover:bg-zinc-800 dark:hover:text-primary transition-colors cursor-pointer shrink-0 backdrop-blur-md"
                      aria-label="Edit list entry"
                      title="Edit list entry"
                    >
                      <IconPencil className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {shouldShowSubtitle && (data.titleNative || data.titleSecondary) && (
                <span className="font-mono text-xs text-muted-foreground font-medium">
                  {data.titleNative ?? data.titleSecondary}
                </span>
              )}

              {Boolean((rawMedia as any)?.episodeTitle || (data.raw as any)?.episodeTitle) && (
                <p className="text-xs text-muted-foreground italic line-clamp-2 mt-0.5 text-start">
                  &ldquo;{(rawMedia as any)?.episodeTitle || (data.raw as any)?.episodeTitle}&rdquo;
                </p>
              )}
            </div>

            {/* Quick Meta Stats Row */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
              {details?.format && (
                <span className="inline-flex items-center rounded-md border border-frost bg-frost px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground uppercase">
                  {details.format}
                </span>
              )}

              {details?.isQueued && (
                <span className="inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-300 uppercase shadow-xs">
                  Queued
                </span>
              )}

              {/* Score next to format badge */}
              {details?.scoreFormatted && (
                <div className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-frost px-1.5 py-0.5 font-mono text-[10px] font-black text-foreground hover:border-primary hover:bg-black/60 shadow-md backdrop-blur-md transition-colors">
                  <IconStar className="size-3 text-primary" />
                  <span>{details.scoreFormatted}</span>
                </div>
              )}

              {/* Media Release Status Badge */}
              {details?.status && (
                <MediaStatusBadge
                  status={details.status}
                  showIcon
                />
              )}

              {/* User Personal List Status Badge */}
              {details?.listStatus && (
                <MediaListStatusBadge
                  status={details.listStatus}
                  mediaType={data.type}
                  showIcon
                />
              )}

              {/* Air Date / Year or Release Period */}
              {(details?.airDate || details?.year) && (
                <div className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground hover:text-primary transition-colors">
                  <IconCalendar className="size-3 text-primary" />
                  <span>{details.airDate ?? details.year}</span>
                </div>
              )}

              {/* Duration */}
              {details?.duration && (
                <div className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground hover:text-primary transition-colors">
                  <IconClock className="size-3 text-primary" />
                  <span>{typeof details.duration === "number" ? `${details.duration}m` : details.duration}</span>
                </div>
              )}

              {/* Gender badge for characters/people */}
              {effectiveGender && (
                <span className="inline-flex items-center rounded-md border border-frost bg-frost px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground hover:text-primary transition-colors uppercase">
                  {effectiveGender}
                </span>
              )}

              {/* Age badge for characters/people */}
              {effectiveAge && (
                <span className="inline-flex items-center rounded-md border border-frost bg-frost px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground hover:text-primary transition-colors">
                  {effectiveAge.toLowerCase().includes("age") ? effectiveAge : `Age: ${effectiveAge}`}
                </span>
              )}
            </div>

            {/* User List Entry Details: Dates, Private, Notes (Owner only) */}
            {config.canEdit && (draftStartedAt || draftCompletedAt || draftIsPrivate || draftNotes) && (
              <div className="flex flex-col gap-2 rounded-xl border border-frost bg-frost/70 p-2.5 text-xs backdrop-blur-md">
                <div className="flex items-center justify-between gap-2">
                  {(draftStartedAt || draftCompletedAt) ? (
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground hover:text-primary transition-colors">
                      <IconCalendar className="size-3.5 text-primary shrink-0" />
                      <span>
                        {draftStartedAt || "—"} {draftCompletedAt ? `→ ${draftCompletedAt}` : ""}
                      </span>
                    </div>
                  ) : <span />}

                  <div className="flex items-center gap-1.5">
                    {draftPriority && draftPriority !== "LOW" && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold backdrop-blur-md",
                          draftPriority === "ULTRA" && "border-purple-500/50 bg-purple-500/15 text-purple-600 dark:text-purple-300",
                          draftPriority === "HIGH" && "border-rose-500/50 bg-rose-500/15 text-rose-600 dark:text-rose-300",
                          draftPriority === "MEDIUM" && "border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-300"
                        )}
                      >
                        <IconFlag className="size-3" />
                        <span>{draftPriority === "MEDIUM" ? "Med" : draftPriority.charAt(0) + draftPriority.slice(1).toLowerCase()}</span>
                      </span>
                    )}

                    {draftIsPrivate && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-frost bg-frost/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground hover:text-primary transition-colors backdrop-blur-md">
                        <IconLock className="size-3 text-primary" />
                        Private
                      </span>
                    )}
                  </div>
                </div>

                {draftNotes && (
                  <div className="flex flex-col gap-0.5 border-t border-border/60 pt-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-foreground">
                      <IconFileText className="size-3 text-primary" />
                      Notes
                    </span>
                    <p className="whitespace-pre-wrap font-sans text-xs text-foreground/90 line-clamp-3 select-text">
                      {draftNotes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Formatted Description (only render if user is not the owner) */}
            {!config.canEdit && effectiveDescription ? (
              <BorealisFormattedText
                text={effectiveDescription}
                className="select-text font-mono text-xs text-foreground/90 leading-relaxed"
              />
            ) : null}

            {/* Voice Actor Spotlight for Characters */}
            {details?.actor && (
              <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/60 p-2.5 select-text">
                {details.actor.image ? (
                  <img
                    src={details.actor.image}
                    alt={details.actor.namePrimary}
                    className="size-9 shrink-0 rounded-full object-cover ring-1 ring-border/50"
                  />
                ) : (
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-primary">
                    <IconMicrophone className="size-4" />
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    Voice Actor ({details.actor.language ?? "VA"})
                  </span>
                  <a
                    href={`/borealis/people/${details.actor.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="truncate text-xs font-bold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 hover:underline cursor-pointer"
                  >
                    {details.actor.namePrimary}
                  </a>
                  {details.actor.nameNative && (
                    <span className="font-mono truncate text-[10px] text-muted-foreground">
                      {details.actor.nameNative}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Genres Pill List */}
            {details?.genres && details.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-border/60 pt-2.5">
                {details.genres.map((genre, idx) => (
                  <span
                    key={idx}
                    className="rounded-md border border-border/60 bg-muted/70 px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground hover:text-primary hover:border-primary/40 transition-colors shadow-xs"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {/* Tab 2: Episodes */}
      {activeTab === "episodes" && (
        <BorealisCardHoverEpisodesTab
          data={data}
          config={config}
          draftWatchedEpisodes={draftWatchedEpisodes}
          setDraftWatchedEpisodes={setDraftWatchedEpisodes}
          draftProgress={draftProgress}
          setDraftProgress={setDraftProgress}
          setDraftStatus={setDraftStatus}
          isHoverCardEditing={isHoverCardEditing}
          onEditStart={() => setIsHoverCardEditing?.(true)}
        />
      )}

      {/* Tab 3: Rewatches */}
      {activeTab === "repeats" && (
        <BorealisCardHoverRewatchesTab
          data={data}
          config={config}
          draftHistory={draftHistory}
          setDraftHistory={setDraftHistory}
          draftRewatched={draftRewatched}
          setDraftRewatched={setDraftRewatched}
          isHoverCardEditing={isHoverCardEditing}
          onEditStart={() => setIsHoverCardEditing?.(true)}
        />
      )}

      {/* Tab 4: Connections */}
      {activeTab === "connections" && (
        <BorealisCardHoverConnectionsTab
          data={data}
          config={config}
          connections={draftConnections}
          onConnectionsChange={setDraftConnections}
          isHoverCardEditing={isHoverCardEditing}
          onEditStart={() => setIsHoverCardEditing?.(true)}
        />
      )}

      {/* Tab 5: Custom Lists */}
      {activeTab === "watchlists" && (
        <BorealisCardHoverWatchlistsTab
          data={data}
          config={config}
          isHoverCardEditing={isHoverCardEditing}
          onEditStart={() => setIsHoverCardEditing?.(true)}
          listChanges={draftListChanges}
          setListChanges={setDraftListChanges}
          newLists={draftNewLists}
          setNewLists={setDraftNewLists}
          refreshKey={playlistRefreshKey}
        />
      )}

      {/* Edit mode actions: replace pencil with save (check) + cancel (x) */}
      {isHoverCardEditing && !config.showTabNav && (
        <div className="flex items-center justify-end border-b border-frost/60 bg-frost/60 px-3 py-2 backdrop-blur-md">
          {editActions}
        </div>
      )}
    </div>
  )

  return createPortal(content, document.body)
}

// -----------------------------------------------------------------------------
