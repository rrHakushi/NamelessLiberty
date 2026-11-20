"use client"

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import {
  IconActivity,
  IconAlertCircle,
  IconBook,
  IconBook2,
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconClock,
  IconDeviceTv,
  IconExternalLink,
  IconFileText,
  IconFlag,
  IconFolder,
  IconLink,
  IconLoader2,
  IconLock,
  IconPhotoOff,
  IconPlus,
  IconRotate2,
  IconSearch,
  IconStar,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { BorealisDatePicker } from "../date-picker"
import { cn } from "@workspace/ui/lib/utils"
import { elysia } from "@/lib/elysia"
import { Button } from "@workspace/ui/components/button"

import { getMediaListStatusIcon } from "../media-list-status-badge"

import { getMediaListStatusColor } from "../status"
import { getMediaListStatusText, type ListStatus } from "../media-list-status-text"

import { STATUS_DROPDOWN_OPTIONS, synthesizeWatchedEpisodes } from "./shared"

// -----------------------------------------------------------------------------
// Helper: Custom Progress Increment Input
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Helper: getRepeatLabel for canonical categories
// -----------------------------------------------------------------------------
export function getRepeatLabel(category: string): { singular: string; plural: string } {
  const norm = (category || "").toLowerCase()
  switch (norm) {
    case "manga":
    case "book":
    case "books":
      return { singular: "Reread", plural: "Rereads" }
    case "game":
    case "games":
      return { singular: "Replay", plural: "Replays" }
    case "music":
      return { singular: "Relisten", plural: "Relistens" }
    case "other":
      return { singular: "Repeat", plural: "Repeats" }
    case "anime":
    case "tv":
    case "movie":
    case "movies":
    default:
      return { singular: "Rewatch", plural: "Rewatches" }
  }
}

export function toBackendMediaType(type: string): string {
  switch (type) {
    case "anime":
      return "ANIME"
    case "manga":
      return "MANGA"
    case "movie":
    case "movies":
      return "MOVIE"
    case "tv":
      return "TV"
    case "game":
    case "games":
      return "GAME"
    case "book":
    case "books":
      return "BOOK"
    case "music":
      return "MUSIC"
    default:
      return "OTHER"
  }
}

export function getBackendMediaId(data: any): number {
  if (!data) return 0
  const raw = data.raw ?? {}
  const rawMedia = raw.media ?? raw
  const possible =
    data.media?.id ??
    data.entry?.mediaId ??
    data.entry?.animeId ??
    data.entry?.mangaId ??
    data.entry?.tvId ??
    data.entry?.movieId ??
    data.entry?.gameId ??
    data.entry?.bookId ??
    data.entry?.musicId ??
    rawMedia?.id ??
    raw.mediaId ??
    raw.entry?.mediaId ??
    raw.entry?.animeId ??
    raw.entry?.mangaId ??
    raw.entry?.tvId ??
    raw.entry?.movieId ??
    raw.entry?.gameId ??
    raw.entry?.bookId ??
    raw.entry?.musicId ??
    raw.animeId ??
    raw.mangaId ??
    raw.tvId ??
    raw.movieId ??
    raw.gameId ??
    raw.bookId ??
    raw.musicId ??
    data.mediaId ??
    data.animeId ??
    data.mangaId ??
    data.tvId ??
    data.movieId ??
    data.gameId ??
    data.bookId ??
    data.musicId ??
    data.id

  if (typeof possible === "number") return possible
  if (typeof possible === "string") {
    // If string is e.g. "anime-17" or "17"
    const cleaned = possible.includes("-") ? possible.split("-").pop()! : possible
    const num = parseInt(cleaned, 10)
    return isNaN(num) ? 0 : num
  }
  return 0
}

interface CachedEpisodesData {
  episodes: any[]
  seasons: any[]
  timestamp: number
}

export const HOVER_EPISODES_CACHE = new Map<string, CachedEpisodesData>()
export const HOVER_EPISODES_INFLIGHT = new Map<string, Promise<{ episodes: any[]; seasons: any[] }>>()
export const HOVER_EPISODES_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface MediaHoverExtra {
  relations?: any[]
  similar?: any[]
  description?: string
  gender?: string | null
  age?: string | null
}

export const mediaHoverExtraCache = new Map<string, MediaHoverExtra>()
export const inFlightMediaHoverExtra = new Map<string, Promise<MediaHoverExtra>>()

export function getMediaApiPath(type?: string): string {
  if (!type) return "anime"
  const norm = type.toLowerCase()
  if (norm === "movie" || norm === "movies") return "movies"
  if (norm === "book" || norm === "books") return "books"
  if (norm === "game" || norm === "games") return "games"
  if (norm === "anime") return "anime"
  if (norm === "manga") return "manga"
  if (norm === "tv") return "tv"
  if (norm === "music") return "music"
  return norm
}

export function formatEpisodeTitle(
  title: string | null | undefined,
  epNum: number
): string | null {
  if (!title) return null
  const trimmed = title.trim()
  if (!trimmed) return null
  const prefixRegex = new RegExp(
    `^(?:Episode|Ep\\.?|#|s\\d+e|\\d+x)\\s*0*${epNum}\\s*[:\\-–—.]\\s*`,
    "i"
  )
  let cleaned = trimmed.replace(prefixRegex, "").trim()
  const numPrefixRegex = new RegExp(`^0*${epNum}\\s*[:\\-–—.]\\s*`)
  cleaned = cleaned.replace(numPrefixRegex, "").trim()
  const exactRegex = new RegExp(
    `^(?:(?:Episode|Ep\\.?|#|s\\d+e|\\d+x)\\s*)?0*${epNum}$`,
    "i"
  )
  if (exactRegex.test(cleaned) || exactRegex.test(trimmed)) {
    return null
  }
  return cleaned || null
}

export function getEpisodeDisplayTitle(
  ep: any,
  epNum: number,
  titlePreference?: "primary" | "secondary" | "native"
): string | null {
  if (!ep) return null

  const candidates: (string | null | undefined)[] = []
  if (titlePreference === "native") {
    candidates.push(ep.titleNative, ep.titleSecondary, ep.titlePrimary, ep.title, ep.name)
  } else if (titlePreference === "secondary") {
    candidates.push(ep.titleSecondary, ep.titlePrimary, ep.titleNative, ep.title, ep.name)
  } else {
    candidates.push(ep.titlePrimary, ep.titleSecondary, ep.titleNative, ep.title, ep.name)
  }

  const validStrings = candidates
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .map((t) => t.trim())

  // 1. Try to find a distinct/meaningful title (stripping redundant "Episode 1:" prefix)
  for (const raw of validStrings) {
    const formatted = formatEpisodeTitle(raw, epNum)
    if (formatted) {
      return formatted
    }
  }

  // 2. Fallback: if all matched "Episode X" or similar, use the raw title unless purely numeric
  for (const raw of validStrings) {
    if (/^#?\s*0*\d+$/.test(raw)) continue
    return raw
  }

  return null
}

// -----------------------------------------------------------------------------
// 5b. BorealisCardHoverEditForm
// -----------------------------------------------------------------------------
export function BorealisCardHoverEditForm({
  data,
  config,
  draftStatus,
  setDraftStatus,
  draftScore,
  setDraftScore,
  draftPriority,
  setDraftPriority,
  draftProgress,
  setDraftProgress,
  draftChaptersProgress,
  setDraftChaptersProgress,
  draftVolumesProgress,
  setDraftVolumesProgress,
  draftRewatched,
  setDraftRewatched,
  draftStartedAt,
  setDraftStartedAt,
  draftCompletedAt,
  setDraftCompletedAt,
  draftIsPrivate,
  setDraftIsPrivate,
  draftNotes,
  setDraftNotes,
}: {
  data: any
  config: any
  draftStatus: ListStatus
  setDraftStatus: (st: ListStatus) => void
  draftScore: number | null
  setDraftScore: (sc: number | null) => void
  draftPriority: string
  setDraftPriority: (pr: string) => void
  draftProgress: number
  setDraftProgress: (pr: number) => void
  draftChaptersProgress: number
  setDraftChaptersProgress: (cp: number) => void
  draftVolumesProgress: number
  setDraftVolumesProgress: (vp: number) => void
  draftRewatched: number
  setDraftRewatched: (rw: number) => void
  draftStartedAt: string
  setDraftStartedAt: (dt: string) => void
  draftCompletedAt: string
  setDraftCompletedAt: (dt: string) => void
  draftIsPrivate: boolean
  setDraftIsPrivate: (pr: boolean) => void
  draftNotes: string
  setDraftNotes: (nt: string) => void
}) {
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const statusContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!statusDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (statusContainerRef.current && !statusContainerRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setStatusDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [statusDropdownOpen])

  const isMangaOrBook = data.type === "manga" || data.type === "book" || data.type === "books"
  const isGame = data.type === "game" || data.type === "games"
  const isMusic = data.type === "music"
  const isTvOrAnime = data.type === "tv" || data.type === "anime"

  const repeatLabel = getRepeatLabel(data.type).plural

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

  const handleStatusChange = (newStatus: ListStatus) => {
    setDraftStatus(newStatus)
    const today = new Date().toISOString().slice(0, 10)

    if (newStatus === "IN_PROGRESS" || newStatus === "ON_HOLD") {
      // IN_PROGRESS then remove endDate, set startDate (if it doesnt exists) same for ON_HOLD
      setDraftCompletedAt("")
      if (!draftStartedAt) {
        setDraftStartedAt(today)
      }
    } else if (newStatus === "DROPPED") {
      // DROPPED then set end date
      if (!draftCompletedAt) {
        setDraftCompletedAt(today)
      }
    } else if (newStatus === "PLANNED" || newStatus === "MAYBE") {
      // PLANNED, MAYBE remove both dates
      setDraftStartedAt("")
      setDraftCompletedAt("")
    } else if (newStatus === "COMPLETED") {
      if (!draftCompletedAt) setDraftCompletedAt(today)
      if (!draftStartedAt) setDraftStartedAt(today)
      if (maxUnits && draftProgress < maxUnits) setDraftProgress(maxUnits)
      if (maxChapters && draftChaptersProgress < maxChapters) setDraftChaptersProgress(maxChapters)
      if (maxVolumes && draftVolumesProgress < maxVolumes) setDraftVolumesProgress(maxVolumes)
    }
  }

  const CurrentStatusIcon = getMediaListStatusIcon(draftStatus)
  const currentStatusColor = getMediaListStatusColor(draftStatus)
  const currentStatusLabel = getMediaListStatusText(draftStatus, data.type)

  return (
    <div className="flex flex-col gap-3 p-4 shrink-0 select-none">
      {/* Row 1: STATUS (Dropdown) | SCORE (with steppers) | REWATCHES (with steppers) */}
      <div className={cn("grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-1.5", statusDropdownOpen ? "relative z-50" : "relative z-20")}>
        {/* Status Dropdown - High Z-index with frosted blur surface */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider truncate">
            <IconActivity className="size-3 shrink-0" />
            <span className="truncate">Status</span>
          </label>
          <div ref={statusContainerRef} className={cn("relative", statusDropdownOpen && "z-50")}>
            <button
              type="button"
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              className="flex h-8 w-full items-center justify-between gap-1 rounded-lg border border-frost bg-frost px-2 text-xs font-semibold text-foreground transition-colors hover:border-zinc-500 cursor-pointer backdrop-blur-md"
            >
              <div className="flex items-center gap-1.5 truncate">
                <CurrentStatusIcon className={cn("size-3.5 shrink-0", currentStatusColor)} />
                <span className="truncate text-[11px]">{currentStatusLabel}</span>
              </div>
              <IconChevronDown className="size-3 shrink-0 text-zinc-400" />
            </button>
            {statusDropdownOpen && (
              <div
                style={{
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  zIndex: 99999,
                }}
                className="absolute top-full left-0 z-[99999] mt-1 w-48 rounded-2xl border border-frost bg-zinc-950/80 p-1.5 text-zinc-100 shadow-2xl backdrop-blur-2xl"
              >
                {STATUS_DROPDOWN_OPTIONS.map((st) => {
                  const IconComp = getMediaListStatusIcon(st)
                  const stColor = getMediaListStatusColor(st)
                  const label = getMediaListStatusText(st, data.type)
                  const isSelected = draftStatus === st
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        handleStatusChange(st)
                        setStatusDropdownOpen(false)
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer",
                        isSelected
                          ? "bg-primary/25 font-bold text-white shadow-xs"
                          : "text-zinc-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <IconComp className={cn("size-3.5 shrink-0", stColor)} />
                        <span className="truncate">{label}</span>
                      </div>
                      {isSelected && <IconCheck className="size-3 text-primary shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Score (0-10) with Increment/Decrement Chevrons - Neutral color matching everything else */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider truncate">
            <IconStar className="size-3 text-primary shrink-0" />
            <span className="truncate">Score</span>
          </label>
          <div className="flex h-8 items-center justify-between rounded-lg border border-frost bg-frost/80 px-2 backdrop-blur-md">
            <input
              type="number"
              min={0}
              max={10}
              step={0.5}
              placeholder="0"
              value={draftScore !== null ? draftScore : ""}
              onChange={(e) => {
                const val = e.target.value === "" ? null : Number(e.target.value)
                if (val === null || isNaN(val)) setDraftScore(null)
                else setDraftScore(Math.min(10, Math.max(0, Math.round(val * 10) / 10)))
              }}
              className="w-full bg-transparent font-mono text-xs font-semibold text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[10px] font-bold text-primary pe-1 shrink-0">/10</span>
            <div className="flex flex-col gap-0.5 text-zinc-400 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const cur = draftScore !== null ? draftScore : 0
                  const next = Math.min(10, cur + 0.5)
                  setDraftScore(Math.round(next * 10) / 10)
                }}
                className="cursor-pointer hover:text-white"
                aria-label="Increment score"
              >
                <IconChevronUp className="size-2.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const cur = draftScore !== null ? draftScore : 0
                  const next = Math.max(0, cur - 0.5)
                  setDraftScore(Math.round(next * 10) / 10)
                }}
                className="cursor-pointer hover:text-white"
                aria-label="Decrement score"
              >
                <IconChevronDown className="size-2.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Rewatches / Repeats with Increment/Decrement Chevrons */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider truncate" title={repeatLabel}>
            <IconRotate2 className="size-3 text-primary shrink-0" />
            <span className="truncate">{repeatLabel}</span>
          </label>
          <div className="flex h-8 items-center justify-between rounded-lg border border-frost bg-frost/80 px-2 backdrop-blur-md">
            <input
              type="number"
              min={0}
              value={draftRewatched}
              onChange={(e) => setDraftRewatched(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-transparent font-mono text-xs font-semibold text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div className="flex flex-col gap-0.5 text-zinc-400 shrink-0">
              <button
                type="button"
                onClick={() => setDraftRewatched(draftRewatched + 1)}
                className="cursor-pointer hover:text-white"
                aria-label="Increment repeats"
              >
                <IconChevronUp className="size-2.5" />
              </button>
              <button
                type="button"
                onClick={() => setDraftRewatched(Math.max(0, draftRewatched - 1))}
                className="cursor-pointer hover:text-white"
                aria-label="Decrement repeats"
              >
                <IconChevronDown className="size-2.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Primary progress | Secondary progress (if only 1 exists then stretch it) */}
      {isMangaOrBook ? (
        <div className="grid grid-cols-2 gap-2 relative z-10">
          {/* Primary: Chapters */}
          <div className="flex flex-col gap-1 min-w-0">
            <label className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider truncate">
              <IconBook className="size-3 shrink-0" />
              <span className="truncate">Chapters</span>
            </label>
            <div className="flex h-8 items-center justify-between rounded-lg border border-frost bg-frost/80 px-2 backdrop-blur-md">
              <input
                type="number"
                min={0}
                max={maxChapters || undefined}
                value={draftChaptersProgress}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value) || 0)
                  const next = maxChapters ? Math.min(maxChapters, val) : val
                  setDraftChaptersProgress(next)
                  if (maxChapters && next >= maxChapters) {
                    handleStatusChange("COMPLETED")
                  }
                }}
                className="w-full bg-transparent font-mono text-xs font-semibold text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              {maxChapters ? (
                <span className="text-[10px] font-bold text-primary pe-1 shrink-0">/ {maxChapters}</span>
              ) : null}
              <div className="flex flex-col gap-0.5 text-zinc-400 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const next = draftChaptersProgress + 1
                    const clamped = maxChapters ? Math.min(maxChapters, next) : next
                    setDraftChaptersProgress(clamped)
                    if (maxChapters && clamped >= maxChapters) {
                      handleStatusChange("COMPLETED")
                    }
                  }}
                  className="cursor-pointer hover:text-white"
                  aria-label="Increment chapters"
                >
                  <IconChevronUp className="size-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDraftChaptersProgress(Math.max(0, draftChaptersProgress - 1))}
                  className="cursor-pointer hover:text-white"
                  aria-label="Decrement chapters"
                >
                  <IconChevronDown className="size-2.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Secondary: Volumes */}
          <div className="flex flex-col gap-1 min-w-0">
            <label className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider truncate">
              <IconBook2 className="size-3 shrink-0" />
              <span className="truncate">Volumes</span>
            </label>
            <div className="flex h-8 items-center justify-between rounded-lg border border-frost bg-frost/80 px-2 backdrop-blur-md">
              <input
                type="number"
                min={0}
                max={maxVolumes || undefined}
                value={draftVolumesProgress}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value) || 0)
                  setDraftVolumesProgress(maxVolumes ? Math.min(maxVolumes, val) : val)
                }}
                className="w-full bg-transparent font-mono text-xs font-semibold text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              {maxVolumes ? (
                <span className="text-[10px] font-bold text-primary pe-1 shrink-0">/ {maxVolumes}</span>
              ) : null}
              <div className="flex flex-col gap-0.5 text-zinc-400 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const next = draftVolumesProgress + 1
                    setDraftVolumesProgress(maxVolumes ? Math.min(maxVolumes, next) : next)
                  }}
                  className="cursor-pointer hover:text-white"
                  aria-label="Increment volumes"
                >
                  <IconChevronUp className="size-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDraftVolumesProgress(Math.max(0, draftVolumesProgress - 1))}
                  className="cursor-pointer hover:text-white"
                  aria-label="Decrement volumes"
                >
                  <IconChevronDown className="size-2.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : isGame ? (
        <div className="flex flex-col gap-1 w-full relative z-10">
          <label className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider">
            <IconClock className="size-3" />
            <span>Playtime (Hours)</span>
          </label>
          <div className="flex h-8 items-center justify-between rounded-lg border border-frost bg-frost/80 px-2 backdrop-blur-md">
            <input
              type="number"
              min={0}
              placeholder="0"
              value={draftProgress}
              onChange={(e) => setDraftProgress(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-transparent font-mono text-xs font-semibold text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[10px] font-bold text-primary pe-1 shrink-0">hrs</span>
            <div className="flex flex-col gap-0.5 text-zinc-400 shrink-0">
              <button
                type="button"
                onClick={() => setDraftProgress(draftProgress + 1)}
                className="cursor-pointer hover:text-white"
                aria-label="Increment playtime"
              >
                <IconChevronUp className="size-2.5" />
              </button>
              <button
                type="button"
                onClick={() => setDraftProgress(Math.max(0, draftProgress - 1))}
                className="cursor-pointer hover:text-white"
                aria-label="Decrement playtime"
              >
                <IconChevronDown className="size-2.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1 w-full relative z-10">
          <label className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider">
            <IconDeviceTv className="size-3" />
            <span>{isTvOrAnime ? "Episodes" : "Progress"}</span>
          </label>
          <div className="flex h-8 items-center justify-between rounded-lg border border-frost bg-frost/80 px-2 backdrop-blur-md">
            <input
              type="number"
              min={0}
              max={maxUnits || undefined}
              placeholder="0"
              value={draftProgress}
              onChange={(e) => {
                const val = Math.max(0, Number(e.target.value) || 0)
                const next = maxUnits ? Math.min(maxUnits, val) : val
                setDraftProgress(next)
                if (maxUnits && next >= maxUnits) {
                  handleStatusChange("COMPLETED")
                }
              }}
              className="w-full bg-transparent font-mono text-xs font-semibold text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {maxUnits ? (
              <span className="text-[10px] font-bold text-primary pe-1 shrink-0">/ {maxUnits}</span>
            ) : null}
            <div className="flex flex-col gap-0.5 text-zinc-400 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const next = draftProgress + 1
                  const clamped = maxUnits ? Math.min(maxUnits, next) : next
                  setDraftProgress(clamped)
                  if (maxUnits && clamped >= maxUnits) {
                    handleStatusChange("COMPLETED")
                  }
                }}
                className="cursor-pointer hover:text-white"
                aria-label="Increment episodes"
              >
                <IconChevronUp className="size-2.5" />
              </button>
              <button
                type="button"
                onClick={() => setDraftProgress(Math.max(0, draftProgress - 1))}
                className="cursor-pointer hover:text-white"
                aria-label="Decrement episodes"
              >
                <IconChevronDown className="size-2.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Row 3: StartDate | End Date with BorealisDatePicker (Calendar component with constraints) */}
      <div className="grid grid-cols-2 gap-2 relative z-0">
        <div className="flex flex-col gap-1 min-w-0">
          <label className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider">
            <IconCalendar className="size-3 shrink-0" />
            <span>Start Date</span>
          </label>
          <BorealisDatePicker
            value={draftStartedAt}
            maxValue={draftCompletedAt || undefined}
            onChange={(val) => setDraftStartedAt(val || "")}
            placeholder="Pick date"
          />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <label className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider">
            <IconCalendar className="size-3 shrink-0" />
            <span>End Date</span>
          </label>
          <BorealisDatePicker
            value={draftCompletedAt}
            minValue={draftStartedAt || undefined}
            onChange={(val) => setDraftCompletedAt(val || "")}
            placeholder="Pick date"
          />
        </div>
      </div>

      {/* Row 4: Privacy Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-frost bg-frost/80 px-2.5 py-1.5 relative z-0 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <IconLock className="size-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-primary">Private Entry</span>
        </div>
        <input
          type="checkbox"
          checked={draftIsPrivate}
          onChange={(e) => setDraftIsPrivate(e.target.checked)}
          className="size-4 rounded border-zinc-700 bg-zinc-900 text-primary accent-primary cursor-pointer"
        />
      </div>

      {/* Row 4b: Priority Segmented Control */}
      <div className="flex flex-col gap-1 relative z-0">
        <label className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider">
          <IconFlag className="size-3" />
          <span>Priority</span>
        </label>
        <div className="grid grid-cols-4 gap-1 rounded-xl border border-frost bg-frost/80 p-1 backdrop-blur-md">
          {(["LOW", "MEDIUM", "HIGH", "ULTRA"] as const).map((p) => {
            const isSelected = (draftPriority || "LOW").toUpperCase() === p
            const label = p === "MEDIUM" ? "Med" : p.charAt(0) + p.slice(1).toLowerCase()
            return (
              <button
                key={p}
                type="button"
                onClick={() => setDraftPriority(p)}
                className={cn(
                  "flex items-center justify-center rounded-lg py-1 text-[11px] font-semibold transition-all cursor-pointer select-none border",
                  isSelected
                    ? "border-primary/50 bg-primary/15 text-foreground shadow-xs"
                    : "border-transparent text-foreground/75 hover:bg-muted/70 hover:text-primary dark:hover:bg-zinc-800/60"
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Row 5: Notes */}
      <div className="flex flex-col gap-1 relative z-0">
        <label className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider">
          <IconFileText className="size-3" />
          <span>Notes</span>
        </label>
        <textarea
          value={draftNotes}
          onChange={(e) => setDraftNotes(e.target.value)}
          placeholder="Personal thoughts or notes..."
          rows={2}
          className="w-full resize-none rounded-lg border border-frost bg-frost/80 p-2 text-xs text-foreground placeholder:text-zinc-500 focus:border-primary focus:outline-none backdrop-blur-md"
        />
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// 5c. BorealisCardHoverEpisodesTab
// -----------------------------------------------------------------------------
export const EMPTY_ARRAY: any[] = []

/**
 * Fetches /borealis/anime/:animeId/episodes (cached + deduped) and reports the
 * result through `onData`. Returns a cancel function.
 */


export function loadHoverEpisodes(
  mediaId: number,
  backendMediaType: string,
  cacheKey: string,
  onData: (result: { episodes: any[]; seasons: any[] }) => void
): () => void {
  let cancelled = false
  const emit = (result: { episodes: any[]; seasons: any[] }) => {
    if (!cancelled) onData(result)
  }

  const cached = HOVER_EPISODES_CACHE.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < HOVER_EPISODES_CACHE_TTL) {
    emit({ episodes: cached.episodes, seasons: cached.seasons })
    return () => {
      cancelled = true
    }
  }

  let promise = HOVER_EPISODES_INFLIGHT.get(cacheKey)
  if (!promise) {
    promise = (async () => {
      if (backendMediaType === "TV") {
        const [seasonsRes, epsRes] = await Promise.all([
          (elysia as any).borealis.tv({ tvId: mediaId }).seasons.get(),
          (elysia as any).borealis.tv({ tvId: mediaId }).episodes.get(),
        ])
        if (seasonsRes?.error && epsRes?.error) throw seasonsRes.error
        const seasons = ((seasonsRes?.data as any)?.seasons ?? []) as any[]
        const episodes = ((epsRes?.data as any)?.episodes ?? []) as any[]
        return { episodes, seasons }
      }

      const { data: res, error } = await (elysia as any).borealis
        .anime({ animeId: mediaId })
        .episodes.get()
      if (error) throw error
      return { episodes: ((res as any)?.episodes ?? []) as any[], seasons: [] as any[] }
    })().finally(() => {
      HOVER_EPISODES_INFLIGHT.delete(cacheKey)
    })
    HOVER_EPISODES_INFLIGHT.set(cacheKey, promise)
  }

  promise
    .then((result) => {
      HOVER_EPISODES_CACHE.set(cacheKey, { ...result, timestamp: Date.now() })
      emit(result)
    })
    .catch(() => { })

  return () => {
    cancelled = true
  }
}

export function BorealisCardHoverEpisodesTab({
  data,
  config,
  draftWatchedEpisodes,
  setDraftWatchedEpisodes,
  draftProgress,
  setDraftProgress,
  setDraftStatus,
  isHoverCardEditing,
  onEditStart,
}: {
  data: any
  config: any
  draftWatchedEpisodes: any[]
  setDraftWatchedEpisodes: (list: any[]) => void
  draftProgress: number
  setDraftProgress: (prog: number) => void
  setDraftStatus?: (st: ListStatus) => void
  isHoverCardEditing?: boolean
  onEditStart?: () => void
}) {
  const mediaId = getBackendMediaId(data)
  const backendMediaType = toBackendMediaType(data.type)
  const cacheKey = `${backendMediaType}:${mediaId || 0}`

  const rawMedia = data.raw?.media ?? data.raw
  const initialSeasons: any[] = useMemo(() => {
    if (Array.isArray(rawMedia?.seasons)) return rawMedia.seasons
    if (Array.isArray(data.hoverDetails?.seasons)) return data.hoverDetails.seasons
    return EMPTY_ARRAY
  }, [rawMedia?.seasons, data.hoverDetails?.seasons])

  const initialEpisodes: any[] = useMemo(() => {
    if (Array.isArray(rawMedia?.episodes)) return rawMedia.episodes
    if (Array.isArray(data.hoverDetails?.episodes)) return data.hoverDetails.episodes
    return EMPTY_ARRAY
  }, [rawMedia?.episodes, data.hoverDetails?.episodes])

  const [fetchedData, setFetchedData] = useState<{ episodes: any[]; seasons: any[] } | null>(() => {
    const cached = HOVER_EPISODES_CACHE.get(cacheKey)
    return cached ? { episodes: cached.episodes, seasons: cached.seasons } : null
  })

  useEffect(() => {
    if ((backendMediaType !== "ANIME" && backendMediaType !== "TV") || !mediaId) return
    return loadHoverEpisodes(mediaId, backendMediaType, cacheKey, setFetchedData)
  }, [cacheKey, mediaId, backendMediaType])

  const seasons: any[] =
    initialSeasons.length > 0
      ? initialSeasons
      : fetchedData?.seasons && fetchedData.seasons.length > 0
        ? fetchedData.seasons
        : EMPTY_ARRAY
  const episodes: any[] =
    fetchedData?.episodes && fetchedData.episodes.length > 0
      ? fetchedData.episodes
      : initialEpisodes

  const regularSeasons = seasons.filter((s) => s.seasonNumber > 0)
  const candidateSeasons = regularSeasons.length > 0 ? regularSeasons : seasons
  const hasMultipleSeasons =
    backendMediaType === "TV"
      ? candidateSeasons.length > 0
      : candidateSeasons.length > 1

  const isEpisodeWatched = (seasonNum: number, epNum: number) => {
    return draftWatchedEpisodes.some(
      (w) => (w.seasonNumber ?? 1) === seasonNum && (w.episodeNumber ?? w.number) === epNum
    )
  }

  // Auto-expand last or currently watched season by default
  const [expandedSeasonNum, setExpandedSeasonNum] = useState<number | null>(() => {
    if (candidateSeasons.length === 0) return null
    if (data.progress?.seasonNumber) {
      const match = candidateSeasons.find((s) => s.seasonNumber === data.progress.seasonNumber)
      if (match) return match.seasonNumber
    }
    // Find first season that has unwatched episodes (in progress)
    for (const s of candidateSeasons) {
      const sNum = s.seasonNumber
      const count = Math.max(s.episodeCount || 0, s.episodes?.length || 0, 0)
      const watched = draftWatchedEpisodes.filter((w) => (w.seasonNumber ?? 1) === sNum).length
      if (count > 0 && watched < count) {
        return sNum
      }
    }
    // If all completed, open the last season
    if (draftWatchedEpisodes.length > 0) {
      return candidateSeasons[candidateSeasons.length - 1].seasonNumber
    }
    return candidateSeasons[0]?.seasonNumber ?? 1
  })

  const hasAutoExpandedRef = useRef(candidateSeasons.length > 0)

  useEffect(() => {
    if (candidateSeasons.length === 0) return

    const effectiveWatched =
      draftWatchedEpisodes.length > 0
        ? draftWatchedEpisodes
        : draftProgress > 0
          ? synthesizeWatchedEpisodes(candidateSeasons, draftProgress)
          : EMPTY_ARRAY

    if (draftWatchedEpisodes.length === 0 && effectiveWatched.length > 0) {
      setDraftWatchedEpisodes(effectiveWatched)
    }

    if (hasAutoExpandedRef.current) return
    hasAutoExpandedRef.current = true

    if (data.progress?.seasonNumber) {
      const match = candidateSeasons.find((s) => s.seasonNumber === data.progress.seasonNumber)
      if (match) {
        setExpandedSeasonNum(match.seasonNumber)
        return
      }
    }
    for (const s of candidateSeasons) {
      const sNum = s.seasonNumber
      const count = Math.max(s.episodeCount || 0, s.episodes?.length || 0, 0)
      const watched = effectiveWatched.filter((w) => (w.seasonNumber ?? 1) === sNum).length
      if (count > 0 && watched < count) {
        setExpandedSeasonNum(sNum)
        return
      }
    }
    if (effectiveWatched.length > 0) {
      setExpandedSeasonNum(candidateSeasons[candidateSeasons.length - 1].seasonNumber)
      return
    }
    setExpandedSeasonNum(candidateSeasons[0]?.seasonNumber ?? 1)
  }, [candidateSeasons, data.progress?.seasonNumber, draftWatchedEpisodes, draftProgress, setDraftWatchedEpisodes])

  const toggleSeasonExpanded = (sNum: number) => {
    // Only 1 season modal/accordion can be open at a time
    setExpandedSeasonNum((prev) => (prev === sNum ? null : sNum))
  }

  const totalEpisodeCount =
    typeof data.progress?.max === "number" && data.progress.max > 0
      ? data.progress.max
      : typeof data.hoverDetails?.episodeCount === "number" && data.hoverDetails.episodeCount > 0
        ? data.hoverDetails.episodeCount
        : episodes.length > 0
          ? episodes.length
          : null

  const canEditEpisodes = Boolean(config.canEdit && isHoverCardEditing)

  const handleToggleWatched = (seasonNum: number, epNum: number) => {
    if (!canEditEpisodes) return

    const watched = isEpisodeWatched(seasonNum, epNum)
    let updated: any[]
    if (watched) {
      updated = draftWatchedEpisodes.filter(
        (w) => !((w.seasonNumber ?? 1) === seasonNum && (w.episodeNumber ?? w.number) === epNum)
      )
    } else {
      updated = [
        ...draftWatchedEpisodes,
        { seasonNumber: seasonNum, episodeNumber: epNum, watchedAt: new Date().toISOString() },
      ]
    }
    setDraftWatchedEpisodes(updated)
    const newCount = updated.length
    setDraftProgress(newCount)

    if (totalEpisodeCount && newCount >= totalEpisodeCount) {
      setDraftStatus?.("COMPLETED")
    }
  }

  const handleAnimeToggle = (epNum: number) => {
    if (!canEditEpisodes) return
    const next = epNum === draftProgress ? epNum - 1 : epNum
    setDraftProgress(next)
    if (totalEpisodeCount && next >= totalEpisodeCount) {
      setDraftStatus?.("COMPLETED")
    }
  }

  const titlePreference = config.titlePreference ?? data.titlePreference ?? "primary"

  const episodeMap = useMemo(() => {
    const map = new Map<number, any>()
    for (const ep of episodes) {
      const num = Number(ep.number ?? ep.episodeNumber)
      if (!isNaN(num) && num > 0) {
        map.set(num, ep)
      }
    }
    return map
  }, [episodes])

  return (
    <div className="flex flex-col gap-2 p-3 shrink-0">
      {hasMultipleSeasons ? (
        <div className="max-h-[380px] overflow-y-auto flex flex-col gap-2 pe-1 [scrollbar-width:thin]">
          {candidateSeasons.map((season) => {
            const seasonNum = season.seasonNumber
            const isExpanded = expandedSeasonNum === seasonNum
            const seasonEps = episodes.filter(
              (ep) => (ep.seasonNumber ?? ep.season ?? 1) === seasonNum
            )
            const count = Math.max(
              season.episodeCount || 0,
              season.episodes?.length || 0,
              seasonEps.length || 0
            )
            const watchedInSeason = draftWatchedEpisodes.filter(
              (w) => (w.seasonNumber ?? 1) === seasonNum
            ).length

            const rawTitle = season.title || season.name || season.titlePrimary
            const seasonTitle =
              rawTitle && rawTitle.trim().toLowerCase() !== `season ${seasonNum}`.toLowerCase()
                ? rawTitle.trim()
                : null

            return (
              <div
                key={seasonNum}
                className="shrink-0 min-h-[42px] overflow-hidden rounded-xl border border-border/60 bg-muted/40 dark:border-frost dark:bg-zinc-900/60 transition-all"
              >
                {/* Season Header Accordion Trigger */}
                <div
                  onClick={() => toggleSeasonExpanded(seasonNum)}
                  className="flex cursor-pointer items-center justify-between gap-2 p-2.5 transition-colors hover:bg-muted/70 dark:hover:bg-zinc-800/60 select-none"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-muted-foreground">
                      {isExpanded ? (
                        <IconChevronDown className="size-4 shrink-0" />
                      ) : (
                        <IconChevronRight className="size-4 shrink-0" />
                      )}
                    </span>
                    <span className="truncate text-xs font-semibold text-foreground">
                      Season {seasonNum}
                      {seasonTitle ? ` • ${seasonTitle}` : ""}
                    </span>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-bold text-foreground/80 dark:bg-zinc-800 dark:text-zinc-300 tabular-nums shrink-0">
                    {watchedInSeason} / {count}
                  </span>
                </div>

                {/* Episodes inside expanded season - Scrollable list */}
                {isExpanded && (
                  count > 0 ? (
                    <div className="max-h-64 overflow-y-auto flex flex-col gap-1.5 border-t border-border/60 bg-background/40 dark:border-frost dark:bg-zinc-950/40 p-2 pe-1 [scrollbar-width:thin]">
                      {Array.from({ length: count }, (_, idx) => {
                        const epNum = idx + 1
                        const ep =
                          season.episodes?.find(
                            (e: any) => Number(e.episodeNumber ?? e.number) === epNum
                          ) ||
                          seasonEps.find(
                            (e: any) => Number(e.number ?? e.episodeNumber) === epNum
                          ) ||
                          episodeMap.get(epNum)
                        const watched = isEpisodeWatched(seasonNum, epNum)
                        const cleanTitle = getEpisodeDisplayTitle(ep, epNum, titlePreference)

                        return (
                          <button
                            key={epNum}
                            type="button"
                            onClick={() => handleToggleWatched(seasonNum, epNum)}
                            className={cn(
                              "flex w-full items-center justify-between gap-2 rounded-lg border p-2 text-xs font-medium transition-colors select-none text-start",
                              canEditEpisodes ? "cursor-pointer" : "cursor-default",
                              watched
                                ? "border-primary/40 bg-primary/10"
                                : "border-border/60 bg-background/60 hover:border-border hover:bg-muted/70 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/40"
                            )}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={cn(
                                  "truncate font-mono text-xs",
                                  watched ? "font-bold text-primary" : "font-semibold text-foreground"
                                )}
                                title={`#${epNum}${cleanTitle ? ` - ${cleanTitle}` : ""}`}
                              >
                                #{epNum}{cleanTitle ? ` - ${cleanTitle}` : ""}
                              </span>
                            </div>
                            <div
                              className={cn(
                                "flex size-4.5 shrink-0 items-center justify-center rounded-md border transition-colors",
                                watched
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background text-transparent hover:border-foreground/40 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-500"
                              )}
                            >
                              {watched && <IconCheck className="size-3 stroke-[2.5]" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No episodes listed
                    </div>
                  )
                )}
              </div>
            )
          })}
        </div>
      ) : totalEpisodeCount && totalEpisodeCount > 0 ? (
        <div className="max-h-[380px] overflow-y-auto flex flex-col gap-1.5 pe-1 [scrollbar-width:thin]">
          {Array.from({ length: totalEpisodeCount }, (_, idx) => {
            const epNum = idx + 1
            const watched = epNum <= draftProgress
            const epItem = episodeMap.get(epNum)
            const cleanTitle = getEpisodeDisplayTitle(epItem, epNum, titlePreference)

            return (
              <button
                key={epNum}
                type="button"
                onClick={() => handleAnimeToggle(epNum)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg border p-2 text-xs font-medium transition-colors select-none text-start",
                  canEditEpisodes ? "cursor-pointer" : "cursor-default",
                  watched
                    ? "border-primary/40 bg-primary/10"
                    : "border-border/60 bg-background/60 hover:border-border hover:bg-muted/70 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/40"
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "truncate font-mono text-xs",
                      watched ? "font-bold text-primary" : "font-semibold text-foreground"
                    )}
                    title={`#${epNum}${cleanTitle ? ` - ${cleanTitle}` : ""}`}
                  >
                    #{epNum}{cleanTitle ? ` - ${cleanTitle}` : ""}
                  </span>
                </div>
                <div
                  className={cn(
                    "flex size-4.5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    watched
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-transparent hover:border-foreground/40 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-500"
                  )}
                >
                  {watched && <IconCheck className="size-3 stroke-[2.5]" />}
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <IconDeviceTv className="size-6 text-muted-foreground/70 mb-1" />
          <span className="text-xs">No episode list available</span>
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// 5d. BorealisCardHoverRewatchesTab
// -----------------------------------------------------------------------------
export function BorealisCardHoverRewatchesTab({
  data,
  config,
  draftHistory,
  setDraftHistory,
  draftRewatched,
  setDraftRewatched,
  isHoverCardEditing = false,
  onEditStart,
}: {
  data: any
  config: any
  draftHistory: any[]
  setDraftHistory: (h: any[]) => void
  draftRewatched: number
  setDraftRewatched: (rw: number) => void
  isHoverCardEditing?: boolean
  onEditStart?: () => void
}) {
  const repeatLabel = getRepeatLabel(data.type)

  // Ensure sessions list has items up to draftRewatched
  const sessions = useMemo(() => {
    const list = [...draftHistory]
    while (list.length < draftRewatched) {
      list.push({ startedAt: null, completedAt: null, notes: "" })
    }
    return list
  }, [draftHistory, draftRewatched])

  const handleUpdateSession = (idx: number, updates: any) => {
    onEditStart?.()
    const updated = [...sessions]
    updated[idx] = { ...updated[idx], ...updates }
    setDraftHistory(updated)
  }

  const handleRemoveSession = (idx: number) => {
    if (!config.canEdit) return
    onEditStart?.()
    const updated = sessions.filter((_: any, i: number) => i !== idx)
    setDraftHistory(updated)
    setDraftRewatched(updated.length)
  }

  return (
    <div className="flex flex-col gap-3 p-4 shrink-0">
      {sessions.length > 0 ? (
        <div className="max-h-60 overflow-y-auto overscroll-contain flex flex-col gap-2 pe-1 [scrollbar-width:thin]">
          {sessions.map((item: any, idx: number) => (
            <div
              key={idx}
              className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  {repeatLabel.singular} #{idx + 1}
                  {idx === sessions.length - 1 ? (
                    <span className="ms-1.5 text-[10px] font-normal text-primary">
                      (Latest)
                    </span>
                  ) : null}
                </span>
                {isHoverCardEditing && config.canEdit && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSession(idx)}
                    className="cursor-pointer text-zinc-500 hover:text-red-400 transition-colors p-0.5"
                    aria-label={`Remove ${repeatLabel.singular} ${idx + 1}`}
                  >
                    <IconTrash className="size-3.5" />
                  </button>
                )}
              </div>

              {isHoverCardEditing ? (
                <>
                  {/* Start Date & End Date Pickers */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-zinc-400">Start Date</span>
                      <BorealisDatePicker
                        value={item.startedAt}
                        maxValue={item.completedAt || undefined}
                        onChange={(d) => handleUpdateSession(idx, { startedAt: d || null })}
                        placeholder="Start date"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-zinc-400">End Date</span>
                      <BorealisDatePicker
                        value={item.completedAt}
                        minValue={item.startedAt || undefined}
                        onChange={(d) => handleUpdateSession(idx, { completedAt: d || null })}
                        placeholder="End date"
                      />
                    </div>
                  </div>

                  {/* Session notes */}
                  <input
                    type="text"
                    value={item.notes || ""}
                    onChange={(e) => handleUpdateSession(idx, { notes: e.target.value })}
                    placeholder="Optional notes for this session..."
                    className="w-full rounded-lg border border-frost bg-frost/80 px-2 py-1 text-xs text-white placeholder:text-zinc-500 backdrop-blur-md focus:border-primary focus:outline-none"
                  />
                </>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-300">
                    <IconCalendar className="size-3.5 text-zinc-400 shrink-0" />
                    <span>
                      {item.startedAt || "—"} {item.completedAt ? `→ ${item.completedAt}` : ""}
                    </span>
                  </div>
                  {item.notes ? (
                    <p className="text-xs text-zinc-300 font-sans italic line-clamp-2">
                      {item.notes}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <IconRotate2 className="size-6 text-primary mb-1" />
          <span className="text-xs font-medium text-foreground">
            No {repeatLabel.plural.toLowerCase()} recorded yet
          </span>
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// 5e. BorealisCardHoverConnectionsTab
// -----------------------------------------------------------------------------
export function BorealisCardHoverConnectionsTab({
  data,
  config,
  connections = {},
  onConnectionsChange,
  isHoverCardEditing = false,
  onEditStart,
}: {
  data: any
  config: any
  connections?: Record<string, any>
  onConnectionsChange?: (connections: Record<string, any>) => void
  isHoverCardEditing?: boolean
  onEditStart?: () => void
}) {
  const rawMedia = data.raw?.media ?? data.raw ?? {}

  const availableProviders = useMemo(() => {
    const list: Array<{
      key: string
      name: string
      badgeColor: string
      detectedId: string | number | null
      externalUrl: string | null
    }> = []
    const cat =
      data.type === "movies"
        ? "movie"
        : data.type === "books"
          ? "book"
          : data.type === "games"
            ? "game"
            : data.type

    if (cat === "anime") {
      list.push(
        {
          key: "anilist",
          name: "AniList",
          badgeColor: "bg-sky-500/20 text-sky-400 border-sky-500/30",
          detectedId: rawMedia.anilistId ?? null,
          externalUrl: rawMedia.anilistId ? `https://anilist.co/anime/${rawMedia.anilistId}` : null,
        },
        {
          key: "mal",
          name: "MyAnimeList",
          badgeColor: "bg-blue-600/20 text-blue-400 border-blue-600/30",
          detectedId: rawMedia.malId ?? null,
          externalUrl: rawMedia.malId ? `https://myanimelist.net/anime/${rawMedia.malId}` : null,
        },
        {
          key: "simkl",
          name: "Simkl",
          badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
          detectedId: rawMedia.simklId ?? null,
          externalUrl: rawMedia.simklId ? `https://simkl.com/anime/${rawMedia.simklId}` : null,
        },
        {
          key: "bangumi",
          name: "Bangumi",
          badgeColor: "bg-pink-500/20 text-pink-400 border-pink-500/30",
          detectedId: rawMedia.bangumiId ?? null,
          externalUrl: rawMedia.bangumiId ? `https://bgm.tv/subject/${rawMedia.bangumiId}` : null,
        },
        {
          key: "hikka",
          name: "Hikka",
          badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
          detectedId: rawMedia.hikkaId ?? null,
          externalUrl: rawMedia.hikkaId ? `https://hikka.io/anime/${rawMedia.hikkaId}` : null,
        }
      )
    } else if (cat === "manga" || cat === "book" || cat === "novel" || cat === "light_novel") {
      list.push(
        {
          key: "anilist",
          name: "AniList",
          badgeColor: "bg-sky-500/20 text-sky-400 border-sky-500/30",
          detectedId: rawMedia.anilistId ?? null,
          externalUrl: rawMedia.anilistId ? `https://anilist.co/manga/${rawMedia.anilistId}` : null,
        },
        {
          key: "mal",
          name: "MyAnimeList",
          badgeColor: "bg-blue-600/20 text-blue-400 border-blue-600/30",
          detectedId: rawMedia.malId ?? null,
          externalUrl: rawMedia.malId ? `https://myanimelist.net/manga/${rawMedia.malId}` : null,
        },
        {
          key: "bangumi",
          name: "Bangumi",
          badgeColor: "bg-pink-500/20 text-pink-400 border-pink-500/30",
          detectedId: rawMedia.bangumiId ?? null,
          externalUrl: rawMedia.bangumiId ? `https://bgm.tv/subject/${rawMedia.bangumiId}` : null,
        },
        {
          key: "hikka",
          name: "Hikka",
          badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
          detectedId: rawMedia.hikkaId ?? null,
          externalUrl: rawMedia.hikkaId ? `https://hikka.io/manga/${rawMedia.hikkaId}` : null,
        },
        {
          key: "mangaupdates",
          name: "MangaUpdates",
          badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
          detectedId: rawMedia.mangaupdatesId ?? null,
          externalUrl: rawMedia.mangaupdatesId ? `https://www.mangaupdates.com/series/${rawMedia.mangaupdatesId}` : null,
        },
        {
          key: "mangabaka",
          name: "MangaBaka",
          badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          detectedId: rawMedia.mangabakaId ?? null,
          externalUrl: rawMedia.mangabakaId ? `https://mangabaka.org/series/${rawMedia.mangabakaId}` : null,
        }
      )
    } else if (cat === "tv" || cat === "movie") {
      list.push(
        {
          key: "simkl",
          name: "Simkl",
          badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
          detectedId: rawMedia.simklId ?? null,
          externalUrl: rawMedia.simklId ? `https://simkl.com/${cat === "tv" ? "tv" : "movies"}/${rawMedia.simklId}` : null,
        },
        {
          key: "trakt",
          name: "Trakt",
          badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
          detectedId: rawMedia.traktId ?? null,
          externalUrl: rawMedia.traktId ? `https://trakt.tv/${cat === "tv" ? "shows" : "movies"}/${rawMedia.traktId}` : null,
        }
      )
    } else if (cat === "game") {
      list.push(
        {
          key: "bangumi",
          name: "Bangumi",
          badgeColor: "bg-pink-500/20 text-pink-400 border-pink-500/30",
          detectedId: rawMedia.bangumiId ?? null,
          externalUrl: rawMedia.bangumiId ? `https://bgm.tv/subject/${rawMedia.bangumiId}` : null,
        }
      )
    } else if (cat === "music") {
      const lastFmUrl = rawMedia.lastFmUrl ?? null
      const lastFmSlug = lastFmUrl ? lastFmUrl.replace(/^https?:\/\/(www\.)?last\.fm\/music\//i, "") : null
      list.push(
        {
          key: "lastfm",
          name: "Last.fm",
          badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
          detectedId: lastFmSlug || rawMedia.musicBrainzId || null,
          externalUrl: lastFmUrl,
        },
        {
          key: "spotify",
          name: "Spotify",
          badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          detectedId: rawMedia.spotifyId ?? null,
          externalUrl: rawMedia.spotifyId ? `https://open.spotify.com/album/${rawMedia.spotifyId}` : null,
        }
      )
    }
    return list
  }, [data.type, rawMedia])

  // Connected providers list
  const connectedProviders = useMemo(() => {
    const map = new Map<string, any>()
    for (const p of availableProviders) {
      if (connections[p.key]) {
        map.set(p.key, {
          ...p,
          connData: connections[p.key],
          url: connections[p.key]?.externalUrl || p.externalUrl,
        })
      }
    }
    // Also include any unknown keys present in connections
    for (const [k, v] of Object.entries(connections)) {
      if (v && !map.has(k)) {
        map.set(k, {
          key: k,
          name: k.charAt(0).toUpperCase() + k.slice(1),
          badgeColor: "bg-zinc-700/40 text-zinc-300 border-zinc-600/40",
          detectedId: (v as any).id ?? null,
          externalUrl: (v as any).externalUrl ?? null,
          connData: v,
          url: (v as any).externalUrl ?? null,
        })
      }
    }
    return Array.from(map.values())
  }, [availableProviders, connections])

  // Unconnected providers list
  const unconnectedProviders = useMemo(() => {
    return availableProviders.filter((p) => !connections[p.key])
  }, [availableProviders, connections])

  // Inline provider search state
  const [searchProvider, setSearchProvider] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const searchCategoryType = useMemo(() => {
    switch (data.type) {
      case "manga":
      case "book":
      case "books":
      case "novel":
      case "light_novel":
        return "MANGA"
      case "tv":
        return "TV"
      case "movie":
      case "movies":
        return "MOVIE"
      case "game":
      case "games":
        return "GAME"
      case "music":
        return rawMedia.format === "TRACK" ? "TRACK" : "ALBUM"
      default:
        return "ANIME"
    }
  }, [data.type, rawMedia.format])

  const executeSearch = useCallback(
    async (provider: any, queryText: string) => {
      const q = queryText.trim()
      if (!q) return
      setIsSearching(true)
      setSearchError(null)
      try {
        // Explicit ID / URL detection (title search is the default)
        const prefixMatch = q.match(
          /^(?:id:|anilist:|al:|mal:|simkl:|bgm:|bangumi:|hikka:|mu:|mangaupdates:|mb:|mangabaka:|trakt:|lastfm:|mbid:|#)\s*([^\s/#?]+)$/i
        )
        const urlMatch =
          q.match(/(?:anilist\.co|myanimelist\.net|simkl\.com|hikka\.io|trakt\.tv)\/(?:anime|manga|tv|movies|shows)\/([^/?#\s]+)/i) ||
          q.match(/(?:bgm|bangumi|chii)\.(?:tv|in)\/subject\/(\d+)/i) ||
          q.match(/(?:mangaupdates\.com|mangabaka\.org)\/series\/(\d+)/i)
        const explicitId =
          prefixMatch?.[1] ||
          urlMatch?.[1] ||
          (/^\d+$/.test(q) || /^tt\d+$/i.test(q) ? q : undefined)

        const params = new URLSearchParams({
          provider: provider.key.toUpperCase(),
          q,
          type: searchCategoryType,
        })
        if (explicitId) params.set("id", explicitId)

        let raw: any[] = []
        if ((config as any).onSearchConnections) {
          raw = await (config as any).onSearchConnections(provider.key, q, searchCategoryType)
        } else {
          const res = await elysia.carina.connections.search.get({
            query: {
              provider: provider.key.toUpperCase(),
              q,
              id: explicitId,
              type: searchCategoryType,
            },
          })
          if (res.data?.success && Array.isArray(res.data?.results)) {
            raw = res.data.results
          }
        }

        const mapped = raw
          .map((r: any, idx: number) => {
            const resolved = r.externalId ?? r.id
            const extId =
              resolved != null && !["", "undefined", "null"].includes(String(resolved).trim())
                ? String(resolved)
                : String(idx)
            const t = r.title
            const title =
              (typeof t === "string" ? t : t?.userPreferred || t?.english || t?.romaji) || "Untitled"
            return {
              externalId: extId,
              title,
              titleSecondary:
                typeof t === "object" && t?.english && t.english !== title
                  ? t.english
                  : typeof t === "object"
                    ? (t?.romaji ?? null)
                    : null,
              coverImage:
                r.coverImage?.extraLarge ||
                r.coverImage?.large ||
                r.coverImage?.medium ||
                (typeof r.coverImage === "string" ? r.coverImage : null),
              releaseYear: r.releaseYear ?? r.year ?? null,
              format: r.format ?? null,
              episodes: r.episodes ?? r.chapters ?? null,
              url: r.url ?? null,
            }
          })
          .filter((r) => r.externalId !== "undefined")

        setSearchResults(mapped)
        if (mapped.length === 0) setSearchError(`No results found on ${provider.name} for "${q}".`)
      } catch (err: any) {
        setSearchResults([])
        setSearchError(err?.message || "Failed to search provider.")
      } finally {
        setIsSearching(false)
      }
    },
    [searchCategoryType]
  )

  const openSearch = (provider: any) => {
    onEditStart?.()
    const initial =
      connections[provider.key]?.title || rawMedia.titlePrimary || data.title || ""
    setSearchProvider(provider)
    setSearchQuery(initial)
    setSearchResults([])
    setSearchError(null)
    if (initial) void executeSearch(provider, initial)
  }

  const handleSelectResult = (provider: any, result: any) => {
    const current = connections[provider.key] || {}
    const coverUrl =
      result.coverImage || current.cover || current.coverImage || data.image || null
    onConnectionsChange?.({
      ...connections,
      [provider.key]: {
        ...current,
        id: result.externalId,
        title: result.title,
        cover: coverUrl,
        coverImage: coverUrl,
        year: result.releaseYear ?? current.year ?? data.hoverDetails?.year ?? null,
        format: result.format ?? current.format ?? rawMedia.format ?? data.hoverDetails?.format ?? null,
        externalUrl: result.url || provider.externalUrl,
        extra: {
          ...(current.extra || {}),
          fetchedExternally: true,
        },
      },
    })
    setSearchProvider(null)
  }

  const handleDisconnect = (key: string) => {
    onEditStart?.()
    const next = { ...connections }
    delete next[key]
    onConnectionsChange?.(next)
  }

  if (searchProvider) {
    const activeId = connections[searchProvider.key]?.id
    return (
      <div className="flex flex-col gap-3 p-4 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchProvider(null)}
            className="flex size-7 items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-800/80 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Back"
          >
            <IconChevronLeft className="size-3.5" />
          </button>
          <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase shrink-0", searchProvider.badgeColor)}>
            {searchProvider.name}
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void executeSearch(searchProvider, searchQuery)
          }}
          className="flex items-center gap-2"
        >
          <div className="relative min-w-0 flex-1">
            <IconSearch className="absolute top-1/2 start-2.5 size-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, ID (id:123) or URL..."
              className="h-8 w-full rounded-lg border border-frost bg-frost/80 ps-8 pe-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/60 backdrop-blur-md"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="h-8 shrink-0 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            {isSearching ? <IconLoader2 className="size-3.5 animate-spin" /> : "Search"}
          </button>
        </form>

        <div className="max-h-64 overflow-y-auto flex flex-col gap-1.5 pe-1 [scrollbar-width:thin]">
          {isSearching && (
            <div className="flex items-center justify-center py-6 text-zinc-400">
              <IconLoader2 className="size-5 animate-spin text-primary" />
            </div>
          )}
          {!isSearching && searchError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
              <IconAlertCircle className="size-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}
          {!isSearching &&
            searchResults.map((result, idx) => {
              const isCurrent =
                activeId != null && String(activeId) === String(result.externalId)
              return (
                <div
                  key={`${result.externalId}-${idx}`}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl border p-2",
                    isCurrent ? "border-primary/50 bg-primary/10" : "border-zinc-800 bg-zinc-900/60"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {result.coverImage ? (
                      <img
                        src={result.coverImage}
                        alt={result.title}
                        loading="lazy"
                        className="h-12 w-8 shrink-0 rounded-md border border-zinc-700 bg-zinc-800 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-zinc-500">
                        <IconPhotoOff className="size-3.5" />
                      </div>
                    )}
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-xs font-semibold text-zinc-100">{result.title}</span>
                      {result.titleSecondary && (
                        <span className="truncate text-[10px] text-zinc-400">{result.titleSecondary}</span>
                      )}
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-[10px] font-medium text-zinc-300">
                        {result.format && <span className="uppercase text-zinc-300">{result.format}</span>}
                        {result.releaseYear && <span className="text-zinc-300">{result.releaseYear}</span>}
                        <span className="text-zinc-400">#{result.externalId}</span>
                      </div>
                    </div>
                  </div>
                  {isCurrent ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-primary">
                      <IconCheck className="size-3" />
                      Linked
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectResult(searchProvider, result)}
                      className="shrink-0 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    >
                      Select
                    </button>
                  )}
                </div>
              )
            })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4 min-h-0">
      {/* View mode: Render currently connected ones with full details */}
      {!isHoverCardEditing && (
        <div className="max-h-[380px] overflow-y-auto overscroll-contain flex flex-col gap-2 pe-1 [scrollbar-width:thin]">
          {connectedProviders.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {connectedProviders.map((prov) => (
                <div
                  key={prov.key}
                  className="flex items-center justify-between gap-2.5 rounded-xl border border-primary/40 bg-primary/10 p-2.5 transition-colors backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {(prov.connData?.cover || prov.connData?.coverImage) && (
                      <img
                        src={prov.connData.cover || prov.connData.coverImage}
                        alt=""
                        loading="lazy"
                        className="h-9 w-6 shrink-0 rounded border border-zinc-700 object-cover"
                      />
                    )}
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className={cn("inline-flex w-fit items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase shrink-0", prov.badgeColor)}>
                        {prov.name}
                      </span>
                      <span className="truncate text-xs font-semibold text-zinc-100">
                        {prov.connData?.title || (prov.detectedId ? `ID: ${prov.connData?.id || prov.detectedId}` : "Connected")}
                      </span>
                      {((prov.connData?.id && prov.connData.id !== "linked") || prov.detectedId || prov.connData?.year || prov.connData?.format) && (
                        <span className="truncate font-mono text-[10px] font-medium text-zinc-300">
                          {[prov.connData?.format, prov.connData?.year, prov.connData?.id && prov.connData.id !== "linked" ? `#${prov.connData.id}` : (prov.detectedId ? `#${prov.detectedId}` : null)].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {prov.url && (
                    <a
                      href={prov.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex size-7 items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-800/80 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors shrink-0 cursor-pointer"
                      title={`Open ${prov.name}`}
                      aria-label={`Open ${prov.name}`}
                    >
                      <IconExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IconLink className="size-6 text-primary mb-1" />
              <span className="text-xs font-medium text-foreground">No active connections</span>
            </div>
          )}
        </div>
      )}

      {/* Edit mode: Render currently connected ones + all available ones with Connect/Disconnect options */}
      {isHoverCardEditing && (
        <div className="max-h-[380px] overflow-y-auto overscroll-contain flex flex-col gap-2.5 pe-1 [scrollbar-width:thin]">
          {connectedProviders.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {connectedProviders.map((prov) => (
                <div
                  key={prov.key}
                  className="flex items-center justify-between gap-2.5 rounded-xl border border-primary/40 bg-primary/10 p-2.5 transition-colors backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {(prov.connData?.cover || prov.connData?.coverImage) && (
                      <img
                        src={prov.connData.cover || prov.connData.coverImage}
                        alt=""
                        loading="lazy"
                        className="h-9 w-6 shrink-0 rounded border border-zinc-700 object-cover"
                      />
                    )}
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className={cn("inline-flex w-fit items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase shrink-0", prov.badgeColor)}>
                        {prov.name}
                      </span>
                      <span className="truncate text-xs font-semibold text-foreground">
                        {prov.connData?.title || (prov.detectedId ? `ID: ${prov.connData?.id || prov.detectedId}` : "Linked")}
                      </span>
                      {((prov.connData?.id && prov.connData.id !== "linked") || prov.detectedId || prov.connData?.year || prov.connData?.format) && (
                        <span className="truncate font-mono text-[10px] font-medium text-foreground/70">
                          {[prov.connData?.format, prov.connData?.year, prov.connData?.id && prov.connData.id !== "linked" ? `#${prov.connData.id}` : (prov.detectedId ? `#${prov.detectedId}` : null)].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openSearch(prov)}
                      className="flex size-7 items-center justify-center rounded-lg border border-frost bg-frost/80 text-foreground/80 hover:border-primary/50 hover:text-primary transition-colors cursor-pointer backdrop-blur-md"
                      title={`Change ${prov.name} link`}
                      aria-label={`Change ${prov.name} link`}
                    >
                      <IconSearch className="size-3.5" />
                    </button>
                    {prov.url && (
                      <a
                        href={prov.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex size-7 items-center justify-center rounded-lg border border-frost bg-frost/80 text-foreground/80 hover:border-primary/50 hover:text-primary transition-colors shrink-0 backdrop-blur-md"
                        title={`Open ${prov.name}`}
                        aria-label={`Open ${prov.name}`}
                      >
                        <IconExternalLink className="size-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDisconnect(prov.key)}
                      className="flex size-7 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-colors cursor-pointer"
                      title={`Disconnect ${prov.name}`}
                      aria-label={`Disconnect ${prov.name}`}
                    >
                      <IconX className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {connectedProviders.length > 0 && unconnectedProviders.length > 0 && (
            <div className="border-t border-frost my-0.5" />
          )}

          {unconnectedProviders.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {unconnectedProviders.map((prov) => (
                <div
                  key={prov.key}
                  className="flex items-center justify-between gap-2.5 rounded-xl border border-frost bg-frost/60 p-2.5 hover:border-primary/30 hover:bg-frost/80 transition-colors backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase shrink-0", prov.badgeColor)}>
                      {prov.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openSearch(prov)}
                    className="flex h-7 items-center gap-1 rounded-lg border border-primary/40 bg-primary/15 px-2.5 text-xs font-semibold text-foreground hover:border-primary/60 hover:bg-primary/25 transition-colors cursor-pointer shrink-0 backdrop-blur-md"
                  >
                    <IconPlus className="size-3.5 text-primary" />
                    <span>Connect</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// 5f. BorealisCardHoverWatchlistsTab
// -----------------------------------------------------------------------------
interface CachedPlaylistsData {
  lists: Array<{ id: string; name: string; isPrivate: boolean; entriesCount: number; containsMedia?: boolean }>
  timestamp: number
}

export const HOVER_PLAYLISTS_CACHE = new Map<string, CachedPlaylistsData>()
export const HOVER_PLAYLISTS_INFLIGHT = new Map<string, Promise<any[]>>()
export const HOVER_PLAYLISTS_CACHE_TTL = 60 * 1000 // 60 seconds

export function BorealisCardHoverWatchlistsTab({
  data,
  config,
  isHoverCardEditing = false,
  onEditStart,
  listChanges,
  setListChanges,
  newLists,
  setNewLists,
  refreshKey = 0,
}: {
  data: any
  config: any
  isHoverCardEditing?: boolean
  onEditStart?: () => void
  listChanges: Record<string, boolean>
  setListChanges: (c: Record<string, boolean>) => void
  newLists: string[]
  setNewLists: (n: string[]) => void
  refreshKey?: number
}) {
  const mediaId = getBackendMediaId(data)
  const backendMediaType = toBackendMediaType(data.type)
  const cacheKey = `${backendMediaType}:${mediaId || 0}`

  const [lists, setLists] = useState<
    Array<{ id: string; name: string; isPrivate: boolean; entriesCount: number; containsMedia?: boolean }>
  >(() => {
    const cached = HOVER_PLAYLISTS_CACHE.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < HOVER_PLAYLISTS_CACHE_TTL) {
      return cached.lists
    }
    return []
  })
  const [loading, setLoading] = useState(() => {
    const cached = HOVER_PLAYLISTS_CACHE.get(cacheKey)
    return !(cached && Date.now() - cached.timestamp < HOVER_PLAYLISTS_CACHE_TTL)
  })
  const [newName, setNewName] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mediaId) {
      setLoading(false)
      return
    }
    const cached = HOVER_PLAYLISTS_CACHE.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < HOVER_PLAYLISTS_CACHE_TTL && refreshKey === 0) {
      setLists(cached.lists)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    let promise = HOVER_PLAYLISTS_INFLIGHT.get(cacheKey)
    if (!promise || refreshKey > 0) {
      promise = (async () => {
        const { data: res, error: err } = await (elysia as any).borealis.playlists.get({
          query: { mediaType: backendMediaType, mediaId, limit: 100 },
        })
        if (err) throw err
        return ((res as any)?.playlists ?? []) as any[]
      })().finally(() => {
        HOVER_PLAYLISTS_INFLIGHT.delete(cacheKey)
      })
      HOVER_PLAYLISTS_INFLIGHT.set(cacheKey, promise)
    }

    promise
      .then((fetched) => {
        HOVER_PLAYLISTS_CACHE.set(cacheKey, { lists: fetched, timestamp: Date.now() })
        if (!cancelled) setLists(fetched)
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load custom lists")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [cacheKey, mediaId, backendMediaType, refreshKey])

  const [operatingIds, setOperatingIds] = useState<Record<string, boolean>>({})
  const [isCreatingList, setIsCreatingList] = useState(false)

  const isChecked = (l: (typeof lists)[number]) =>
    Boolean(l.containsMedia)

  const toggle = async (list: (typeof lists)[number]) => {
    if (operatingIds[list.id]) return
    const currentlyChecked = isChecked(list)
    const next = !currentlyChecked

    const updated = lists.map((l) =>
      l.id === list.id
        ? {
          ...l,
          containsMedia: next,
          entriesCount: next ? l.entriesCount + 1 : Math.max(0, l.entriesCount - 1),
        }
        : l
    )
    setLists(updated)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name || isCreatingList) return

    const tempId = `temp-${Date.now()}`
    const updated = [
      {
        id: tempId,
        name,
        isPrivate: false,
        entriesCount: 1,
        containsMedia: true,
      },
      ...lists,
    ]
    setLists(updated)
    setNewName("")
  }

  const canEdit = config?.canEdit !== false

  return (
    <div className="flex flex-col gap-2 p-4 shrink-0">
      {canEdit && isHoverCardEditing && (
        <form onSubmit={handleCreate} className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New list name..."
            disabled={isCreatingList}
            className="h-8 min-w-0 flex-1 rounded-lg border border-frost bg-frost/80 px-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/60 backdrop-blur-md"
          />
          <button
            type="submit"
            disabled={!newName.trim() || isCreatingList}
            className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            {isCreatingList ? (
              <IconLoader2 className="size-3.5 animate-spin" />
            ) : (
              <IconPlus className="size-3.5" />
            )}
            <span>Create</span>
          </button>
        </form>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400">
          <IconAlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <IconLoader2 className="size-5 animate-spin text-primary" />
        </div>
      ) : lists.length > 0 ? (
        <div className="flex flex-col gap-1.5 pe-1">
          {lists.map((wl) => {
            const checked = isChecked(wl)
            const isOperating = Boolean(operatingIds[wl.id])
            return (
              <div
                key={wl.id}
                className={cn(
                  "flex items-center justify-between gap-2.5 rounded-xl border p-2.5 transition-colors backdrop-blur-md",
                  checked
                    ? "border-primary/40 bg-primary/10"
                    : "border-frost bg-frost/60 hover:border-primary/30 hover:bg-frost/80"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <IconFolder className="size-4 text-primary shrink-0" />
                  <span className="truncate text-xs font-semibold text-foreground">{wl.name}</span>
                  {wl.isPrivate && <IconLock className="size-3 text-foreground/70 shrink-0" />}
                  <span className="rounded-full border border-frost bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-foreground/80 font-medium shrink-0 tabular-nums">
                    {wl.entriesCount}
                  </span>
                </div>
                {canEdit && isHoverCardEditing ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-label={`Include in ${wl.name}`}
                    disabled={isOperating}
                    onClick={() => toggle(wl)}
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg border transition-colors cursor-pointer disabled:opacity-50",
                      checked
                        ? "border-primary bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                        : "border-zinc-700/60 bg-zinc-800/80 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-700 hover:text-white"
                    )}
                  >
                    {isOperating ? (
                      <IconLoader2 className="size-3.5 animate-spin" />
                    ) : checked ? (
                      <IconCheck className="size-3.5 stroke-[3]" />
                    ) : (
                      <IconPlus className="size-3.5" />
                    )}
                  </button>
                ) : checked ? (
                  <div
                    className="flex size-7 shrink-0 items-center justify-center text-primary"
                    title="Included in list"
                  >
                    <IconCheck className="size-4 stroke-[2.5]" />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <IconFolder className="size-6 text-primary mb-1" />
          <span className="text-xs font-medium text-foreground">No custom lists</span>
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
