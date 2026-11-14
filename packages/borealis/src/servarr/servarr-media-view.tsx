"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "@/context/session-context"
import {
  IconRefresh,
  IconRss,
  IconSearch,
  IconFileImport,
  IconEdit,
  IconLayoutGrid,
  IconLayoutList,
  IconLayoutCards,
  IconPhoto,
  IconArrowsSort,
  IconFilter,
  IconCheck,
  IconExternalLink,
  IconMovie,
  IconDeviceTv,
  IconLink,
  IconPlus,
  IconTrash,
  IconX,
  IconEye,
  IconEyeOff,
  IconFolder,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectList,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import { toast } from "sonner"
import { elysia } from "@/lib/elysia"
import { dedupGet, invalidateDedup } from "@/lib/request-dedup"
import { ServarrAddMediaDialog } from "./servarr-add-media-dialog"
import { ServarrMediaCard } from "./servarr-media-card"
import {
  ServarrCustomFilterDialog,
  applyServarrCustomFilter,
  type ServarrCustomFilter,
} from "./servarr-custom-filter-dialog"
import { ServarrFilesystemDialog } from "./servarr-filesystem-dialog"
import { useServarrRealtime } from "./use-servarr-realtime"
import {
  formatBytes,
  servarrRequest,
  type ServarrApp,
} from "./servarr-client"

export interface ServarrMediaItem {
  id: string | number
  title: string
  originalTitle?: string | null
  year?: number | null
  overview?: string | null
  monitored: boolean
  hasFile?: boolean
  qualityProfile?: string | null
  qualityProfileId?: number | null
  sizeOnDisk?: number | null
  status?: string | null
  added?: string | null
  posterUrl?: string | null
  fanartUrl?: string | null
  tmdbId?: number | null
  tvdbId?: number | null
  imdbId?: string | null
  path?: string | null
  rootFolderPath?: string | null
  genres?: string[] | null
  episodeCount?: number | null
  episodeFileCount?: number | null
  seasonCount?: number | null
  tags?: number[] | null
}

export type ServarrViewMode = "poster" | "overview" | "banner" | "table"
export type ServarrSortField = "title" | "added" | "year" | "status" | "quality" | "size"
export type ServarrFilter =
  | "all"
  | "monitored"
  | "unmonitored"
  | "downloaded"
  | "missing"

interface ServarrMediaViewProps {
  provider: "RADARR" | "SONARR"
  pageTitle: string
  subtitle?: string
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Unknown"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "Unknown"
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return "Unknown"
  }
}

export function ServarrMediaView({
  provider,
  pageTitle,
}: ServarrMediaViewProps): React.JSX.Element {
  const router = useRouter()
  const { status: authStatus } = useSession()

  const app: ServarrApp = provider === "RADARR" ? "radarr" : "sonarr"
  const providerLower = app

  const [items, setItems] = useState<ServarrMediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRssSyncing, setIsRssSyncing] = useState(false)
  const [isSearchingAll, setIsSearchingAll] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isFsImportOpen, setIsFsImportOpen] = useState(false)
  const [hostUrl, setHostUrl] = useState<string | null>(null)

  // Filters and sorting
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ServarrViewMode>("poster")
  const [sortField, setSortField] = useState<ServarrSortField>("added")
  const [sortAsc, setSortAsc] = useState(false)
  const [filter, setFilter] = useState<ServarrFilter>("all")

  // Custom Filters
  const [customFilters, setCustomFilters] = useState<ServarrCustomFilter[]>([])
  const [activeCustomFilterId, setActiveCustomFilterId] = useState<number | null>(null)
  const [isCustomFilterDialogOpen, setIsCustomFilterDialogOpen] = useState(false)
  const [editingCustomFilter, setEditingCustomFilter] = useState<ServarrCustomFilter | null>(null)

  // Inline Mass Editor
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [qualityProfiles, setQualityProfiles] = useState<{ id: number; name: string }[]>([])
  const [rootFolders, setRootFolders] = useState<{ id: number; path: string }[]>([])
  const [bulkQualityId, setBulkQualityId] = useState<string>("")
  const [bulkRootFolder, setBulkRootFolder] = useState<string>("")
  const [isBulkApplying, setIsBulkApplying] = useState(false)

  const inFlightRef = React.useRef(false)
  const lastLoadedKeyRef = React.useRef<string | null>(null)

  const loadMedia = useCallback(
    async (silent = false, force = false) => {
      if (authStatus === "loading") return
      if (!silent && inFlightRef.current) return
      inFlightRef.current = true
      if (!silent) setIsLoading(true)

      try {
        if (force) {
          invalidateDedup(`servarr:${provider}:library`)
        }
        const { data, error } = (await dedupGet(
          `servarr:${provider}:library`,
          () =>
            provider === "RADARR"
              ? elysia.servarr.radarr.library.get({
                  fetch: { credentials: "include" },
                })
              : elysia.servarr.sonarr.library.get({
                  fetch: { credentials: "include" },
                }),
          { force, ttlMs: 3000 }
        )) as any

        if (error) {
          setIsConnected(false)
          setItems([])
        } else if (data) {
          setIsConnected(data.connected)
          setHostUrl(data.hostUrl || null)
          setItems(data.items || [])
        }
      } catch {
        setIsConnected(false)
        setItems([])
      } finally {
        setIsLoading(false)
        inFlightRef.current = false
      }
    },
    [provider, authStatus]
  )

  const loadMetadata = useCallback(async () => {
    try {
      const [cfRes, qpRes, rfRes] = await Promise.all([
        servarrRequest<ServarrCustomFilter[]>(app, "/rules/customfilter"),
        servarrRequest<{ id: number; name: string }[]>(app, "/rules/qualityprofile"),
        servarrRequest<{ id: number; path: string }[]>(app, "/rules/rootfolder"),
      ])
      if (cfRes.ok && Array.isArray(cfRes.data)) {
        setCustomFilters(cfRes.data)
      }
      if (qpRes.ok && Array.isArray(qpRes.data)) {
        setQualityProfiles(qpRes.data)
      }
      if (rfRes.ok && Array.isArray(rfRes.data)) {
        setRootFolders(rfRes.data)
      }
    } catch {
      // Non-fatal metadata fetch
    }
  }, [app])

  useEffect(() => {
    if (authStatus === "loading") return
    if (lastLoadedKeyRef.current === provider) return
    lastLoadedKeyRef.current = provider
    loadMedia()
    loadMetadata()
  }, [authStatus, provider, loadMedia, loadMetadata])

  // Silent SignalR real-time sync with polling fallback
  useServarrRealtime({
    app,
    topics: ["movie", "series", "command", "queue", "moviefile", "episodefile"],
    onSync: () => {
      void loadMedia(true, true)
    },
    fallbackPollMs: 45_000,
  })

  // Bulk Commands
  const handleUpdateAll = async () => {
    setIsUpdating(true)
    try {
      const res =
        provider === "RADARR"
          ? await elysia.servarr.radarr.command.post(
              { command: "refresh" },
              { fetch: { credentials: "include" } }
            )
          : await elysia.servarr.sonarr.command.post(
              { command: "refresh" },
              { fetch: { credentials: "include" } }
            )

      if (res?.error) {
        toast.error(
          (res.error.value as any)?.message ||
            `Failed to update library in ${pageTitle}`
        )
      } else {
        toast.success(`Library update triggered for ${pageTitle}`)
      }
    } catch {
      toast.error("Failed to trigger update")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRssSync = async () => {
    setIsRssSyncing(true)
    try {
      const res =
        provider === "RADARR"
          ? await elysia.servarr.radarr.command.post(
              { command: "rssSync" },
              { fetch: { credentials: "include" } }
            )
          : await elysia.servarr.sonarr.command.post(
              { command: "rssSync" },
              { fetch: { credentials: "include" } }
            )

      if (res?.error) {
        toast.error(
          (res.error.value as any)?.message ||
            `Failed to trigger RSS sync in ${pageTitle}`
        )
      } else {
        toast.success(`RSS Sync triggered for ${pageTitle}`)
      }
    } catch {
      toast.error("Failed to trigger RSS sync")
    } finally {
      setIsRssSyncing(false)
    }
  }

  const handleSearchAll = async () => {
    setIsSearchingAll(true)
    try {
      const res: any =
        provider === "RADARR"
          ? await elysia.servarr.radarr.command.post(
              { command: "searchMissing" },
              { fetch: { credentials: "include" } }
            )
          : await elysia.servarr.sonarr.command.post(
              { command: "searchMissing" },
              { fetch: { credentials: "include" } }
            )

      if (res?.error) {
        toast.error(
          res.error.value?.message || `Failed to execute search in ${pageTitle}`
        )
      } else {
        toast.success(`Search command queued for missing items in ${pageTitle}`)
      }
    } catch {
      toast.error("Failed to execute search")
    } finally {
      setIsSearchingAll(false)
    }
  }

  // Card Quick Actions
  const handleToggleMonitor = async (item: ServarrMediaItem) => {
    const id = Number(item.id)
    const nextMonitored = !item.monitored
    setItems((prev) =>
      prev.map((m) => (Number(m.id) === id ? { ...m, monitored: nextMonitored } : m))
    )
    try {
      const endpoint =
        app === "radarr" ? `/movie/editor` : `/series/editor`
      const payload =
        app === "radarr"
          ? { movieIds: [id], monitored: nextMonitored }
          : { seriesIds: [id], monitored: nextMonitored }
      const res = await servarrRequest(app, endpoint, {
        method: "PUT",
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error(res.error || "Failed to update monitor state")
      }
      toast.success(`${item.title} ${nextMonitored ? "monitored" : "unmonitored"}`)
    } catch (err: any) {
      setItems((prev) =>
        prev.map((m) => (Number(m.id) === id ? { ...m, monitored: !nextMonitored } : m))
      )
      toast.error(err?.message || "Failed to update monitor state")
    }
  }

  const handleAutoSearch = async (item: ServarrMediaItem) => {
    const id = Number(item.id)
    try {
      const res =
        provider === "RADARR"
          ? await elysia.servarr.radarr.command.post(
              { command: "searchMovie", movieIds: [id] } as any,
              { fetch: { credentials: "include" } }
            )
          : await elysia.servarr.sonarr.command.post(
              { command: "searchSeries", seriesId: id } as any,
              { fetch: { credentials: "include" } }
            )
      if ((res as any)?.error) {
        toast.error("Failed to start search")
      } else {
        toast.success(`Searching for ${item.title}`)
      }
    } catch {
      toast.error("Failed to start search")
    }
  }

  const handleInteractiveSearch = (item: ServarrMediaItem) => {
    router.push(`/borealis/servarr/${providerLower}/${item.id}?tab=search`)
  }

  const handleEditItem = (item: ServarrMediaItem) => {
    router.push(`/borealis/servarr/${providerLower}/${item.id}?edit=1`)
  }

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Inline Mass Editor Actions
  const applyBulkEdit = async (patch: {
    monitored?: boolean
    qualityProfileId?: number
    rootFolderPath?: string
    deleteFiles?: boolean
  }) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setIsBulkApplying(true)
    try {
      if (patch.deleteFiles !== undefined) {
        const res =
          app === "radarr"
            ? await servarrRequest(app, "/movie/editor", {
                method: "DELETE",
                body: JSON.stringify({
                  movieIds: ids,
                  deleteFiles: patch.deleteFiles,
                  addImportExclusion: false,
                }),
              })
            : await servarrRequest(app, "/series/editor", {
                method: "DELETE",
                body: JSON.stringify({
                  seriesIds: ids,
                  deleteFiles: patch.deleteFiles,
                  addImportListExclusion: false,
                }),
              })
        if (!res.ok) throw new Error(res.error || "Bulk delete failed")
        toast.success(`Deleted ${ids.length} item(s)`)
        setSelectedIds(new Set())
      } else {
        const payload =
          app === "radarr"
            ? { movieIds: ids, ...patch }
            : { seriesIds: ids, ...patch }
        const res = await servarrRequest(
          app,
          app === "radarr" ? "/movie/editor" : "/series/editor",
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        )
        if (!res.ok) throw new Error(res.error || "Bulk edit failed")
        toast.success(`Updated ${ids.length} item(s)`)
      }
      await loadMedia(true, true)
    } catch (err: any) {
      toast.error(err?.message || "Bulk operation failed")
    } finally {
      setIsBulkApplying(false)
    }
  }

  // Folder Import Handler
  const handleImportFolder = async (folderPath: string) => {
    try {
      const res = await servarrRequest(app, "/command", {
        method: "POST",
        body: JSON.stringify({
          name: app === "radarr" ? "DownloadedMoviesScan" : "DownloadedEpisodesScan",
          path: folderPath,
        }),
      })
      if (!res.ok) throw new Error(res.error || "Failed to scan folder")
      toast.success(`Scanning "${folderPath}" for media import`)
    } catch (err: any) {
      toast.error(err?.message || "Failed to trigger folder import")
    }
  }

  const handleDeleteCustomFilter = async (id: number) => {
    try {
      const res = await servarrRequest(app, `/rules/customfilter/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(res.error || "Failed to delete filter")
      if (activeCustomFilterId === id) setActiveCustomFilterId(null)
      setCustomFilters((prev) => prev.filter((f) => f.id !== id))
      toast.success("Custom filter deleted")
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete filter")
    }
  }

  const activeCustomFilter = useMemo(
    () => customFilters.find((f) => f.id === activeCustomFilterId) ?? null,
    [customFilters, activeCustomFilterId]
  )

  const qualityProfileMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const qp of qualityProfiles) map.set(qp.id, qp.name)
    return map
  }, [qualityProfiles])

  // Filtered and sorted items
  const processedItems = useMemo(() => {
    let list = [...items]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.originalTitle?.toLowerCase().includes(q) ||
          item.year?.toString().includes(q) ||
          item.genres?.some((g) => g.toLowerCase().includes(q))
      )
    }

    if (filter === "monitored") {
      list = list.filter((i) => i.monitored)
    } else if (filter === "unmonitored") {
      list = list.filter((i) => !i.monitored)
    } else if (filter === "downloaded") {
      list = list.filter((i) => i.hasFile)
    } else if (filter === "missing") {
      list = list.filter((i) => !i.hasFile && i.monitored)
    }

    if (activeCustomFilter) {
      list = applyServarrCustomFilter(list, activeCustomFilter)
    }

    list.sort((a, b) => {
      let res = 0
      if (sortField === "title") {
        res = a.title.localeCompare(b.title)
      } else if (sortField === "year") {
        res = (a.year || 0) - (b.year || 0)
      } else if (sortField === "added") {
        const timeA = a.added ? new Date(a.added).getTime() : 0
        const timeB = b.added ? new Date(b.added).getTime() : 0
        res = timeA - timeB
      } else if (sortField === "quality") {
        res = (a.qualityProfile || "").localeCompare(b.qualityProfile || "")
      } else if (sortField === "status") {
        res = (a.status || "").localeCompare(b.status || "")
      } else if (sortField === "size") {
        res = (a.sizeOnDisk || 0) - (b.sizeOnDisk || 0)
      }
      return sortAsc ? res : -res
    })

    return list
  }, [items, searchQuery, filter, activeCustomFilter, sortField, sortAsc])

  const allSelected =
    processedItems.length > 0 &&
    processedItems.every((i) => selectedIds.has(Number(i.id)))

  return (
    <div className="flex w-full flex-1 flex-col overflow-x-hidden p-4 md:p-6">
      {/* Top Servarr Toolbar Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 border-b border-border/60 pb-3.5">
        {/* Left Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
            className="h-8 gap-1.5 rounded-xl text-xs font-semibold shadow-xs"
          >
            <IconPlus className="size-3.5" />
            <span>Add {provider === "RADARR" ? "Movie" : "Series"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFsImportOpen(true)}
            className="h-8 gap-1.5 rounded-xl text-xs font-medium"
          >
            <IconFileImport className="size-3.5 text-primary" />
            <span>Import Folder</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isUpdating}
            onClick={handleUpdateAll}
            className="h-8 gap-1.5 rounded-xl text-xs font-medium"
          >
            {isUpdating ? (
              <Spinner className="size-3.5" />
            ) : (
              <IconRefresh className="size-3.5 text-primary" />
            )}
            <span>Update All</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isRssSyncing}
            onClick={handleRssSync}
            className="h-8 gap-1.5 rounded-xl text-xs font-medium"
          >
            {isRssSyncing ? (
              <Spinner className="size-3.5" />
            ) : (
              <IconRss className="size-3.5 text-amber-500" />
            )}
            <span>RSS Sync</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isSearchingAll}
            onClick={handleSearchAll}
            className="h-8 gap-1.5 rounded-xl text-xs font-medium"
          >
            {isSearchingAll ? (
              <Spinner className="size-3.5" />
            ) : (
              <IconSearch className="size-3.5 text-primary" />
            )}
            <span>Search Missing</span>
          </Button>

          <Button
            variant={isSelectMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setIsSelectMode((v) => !v)
              setSelectedIds(new Set())
            }}
            className="h-8 gap-1.5 rounded-xl text-xs font-medium"
          >
            <IconEdit className="size-3.5" />
            <span>{isSelectMode ? "Done Editing" : "Mass Edit"}</span>
          </Button>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-40 sm:w-52">
            <IconSearch className="absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={`Filter ${provider === "RADARR" ? "movies" : "series"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 rounded-xl ps-8 text-xs"
            />
          </div>

          <div className="flex items-center rounded-xl border border-border/60 bg-muted/40 p-0.5">
            {(
              [
                { id: "all", label: "All" },
                { id: "downloaded", label: "Downloaded" },
                { id: "missing", label: "Wanted" },
                { id: "unmonitored", label: "Unmonitored" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-all select-none",
                  filter === f.id
                    ? "bg-background font-semibold text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
            <IconArrowsSort className="size-3.5 shrink-0" />
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as ServarrSortField)}
              className="cursor-pointer bg-transparent text-xs font-medium text-foreground outline-hidden"
            >
              <option value="added" className="bg-popover text-foreground">
                Added Date
              </option>
              <option value="title" className="bg-popover text-foreground">
                Title
              </option>
              <option value="year" className="bg-popover text-foreground">
                Release Year
              </option>
              <option value="quality" className="bg-popover text-foreground">
                Quality Profile
              </option>
              <option value="status" className="bg-popover text-foreground">
                Status
              </option>
              <option value="size" className="bg-popover text-foreground">
                Size
              </option>
            </select>
            <button
              type="button"
              onClick={() => setSortAsc(!sortAsc)}
              className="cursor-pointer rounded p-0.5 hover:text-foreground"
              title={sortAsc ? "Sort Ascending" : "Sort Descending"}
            >
              {sortAsc ? "↑" : "↓"}
            </button>
          </div>

          {/* View Mode Toggle: Poster / Overview / Banner / Table */}
          <div className="flex items-center rounded-xl border border-border/60 bg-muted/40 p-0.5">
            {(
              [
                { id: "poster", icon: IconLayoutGrid, title: "Poster Grid" },
                { id: "overview", icon: IconLayoutCards, title: "Overview Cards" },
                { id: "banner", icon: IconPhoto, title: "Banner Cards" },
                { id: "table", icon: IconLayoutList, title: "Table View" },
              ] as const
            ).map((mode) => {
              const Icon = mode.icon
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setViewMode(mode.id)}
                  className={cn(
                    "cursor-pointer rounded-lg p-1 transition-all",
                    viewMode === mode.id
                      ? "bg-background text-primary shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title={mode.title}
                >
                  <Icon className="size-4" />
                </button>
              )
            })}
          </div>

          {hostUrl && (
            <a
              href={hostUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-8 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
              title={`Open ${pageTitle} Web UI (${hostUrl})`}
              aria-label={`Open ${pageTitle} Web UI`}
            >
              <IconExternalLink className="size-4" />
            </a>
          )}
        </div>
      </div>

      {/* Custom Filters Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="me-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <IconFilter className="size-3.5" />
          Custom Filters:
        </span>
        {customFilters.map((cf) => {
          const isActive = cf.id === activeCustomFilterId
          return (
            <div
              key={cf.id ?? cf.label}
              className={cn(
                "flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs transition-colors",
                isActive
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground"
              )}
            >
              <button
                type="button"
                className="cursor-pointer font-medium"
                onClick={() =>
                  setActiveCustomFilterId(isActive ? null : (cf.id ?? null))
                }
              >
                {cf.label}
              </button>
              <button
                type="button"
                className="ms-0.5 cursor-pointer opacity-70 hover:opacity-100"
                title="Edit filter"
                onClick={() => {
                  setEditingCustomFilter(cf)
                  setIsCustomFilterDialogOpen(true)
                }}
              >
                <IconEdit className="size-3" />
              </button>
              {cf.id && (
                <button
                  type="button"
                  className="cursor-pointer opacity-70 hover:text-destructive hover:opacity-100"
                  title="Delete filter"
                  onClick={() => handleDeleteCustomFilter(cf.id!)}
                >
                  <IconX className="size-3" />
                </button>
              )}
            </div>
          )
        })}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            setEditingCustomFilter(null)
            setIsCustomFilterDialogOpen(true)
          }}
        >
          <IconPlus className="size-3" />
          <span>New Filter</span>
        </Button>
      </div>

      {/* Inline Mass Editor Action Bar */}
      {isSelectMode && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <Checkbox
              isSelected={allSelected}
              onChange={(checked) => {
                if (checked) {
                  setSelectedIds(new Set(processedItems.map((i) => Number(i.id))))
                } else {
                  setSelectedIds(new Set())
                }
              }}
            />
            <span className="text-xs font-semibold text-foreground">
              {selectedIds.size} of {processedItems.length} selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={selectedIds.size === 0 || isBulkApplying}
              onClick={() => applyBulkEdit({ monitored: true })}
              className="h-7 gap-1 rounded-lg text-xs"
            >
              <IconEye className="size-3.5" />
              Monitor
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={selectedIds.size === 0 || isBulkApplying}
              onClick={() => applyBulkEdit({ monitored: false })}
              className="h-7 gap-1 rounded-lg text-xs"
            >
              <IconEyeOff className="size-3.5" />
              Unmonitor
            </Button>

            {qualityProfiles.length > 0 && (
              <div className="flex items-center gap-1">
                <Select
                  selectedKey={bulkQualityId || null}
                  onSelectionChange={(k) => setBulkQualityId(String(k ?? ""))}
                  placeholder="Quality Profile"
                >
                  <SelectTrigger className="h-7 w-36 rounded-lg text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectList>
                      {qualityProfiles.map((qp) => (
                        <SelectItem key={qp.id} id={String(qp.id)}>
                          {qp.name}
                        </SelectItem>
                      ))}
                    </SelectList>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!bulkQualityId || selectedIds.size === 0 || isBulkApplying}
                  onClick={() =>
                    applyBulkEdit({ qualityProfileId: Number(bulkQualityId) })
                  }
                  className="h-7 rounded-lg text-xs"
                >
                  Apply
                </Button>
              </div>
            )}

            {rootFolders.length > 0 && (
              <div className="flex items-center gap-1">
                <Select
                  selectedKey={bulkRootFolder || null}
                  onSelectionChange={(k) => setBulkRootFolder(String(k ?? ""))}
                  placeholder="Root Folder"
                >
                  <SelectTrigger className="h-7 w-40 rounded-lg text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectList>
                      {rootFolders.map((rf) => (
                        <SelectItem key={rf.id} id={rf.path}>
                          {rf.path}
                        </SelectItem>
                      ))}
                    </SelectList>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!bulkRootFolder || selectedIds.size === 0 || isBulkApplying}
                  onClick={() =>
                    applyBulkEdit({ rootFolderPath: bulkRootFolder })
                  }
                  className="h-7 rounded-lg text-xs"
                >
                  Move
                </Button>
              </div>
            )}

            <Button
              size="sm"
              variant="destructive"
              disabled={selectedIds.size === 0 || isBulkApplying}
              onClick={() => applyBulkEdit({ deleteFiles: false })}
              className="h-7 gap-1 rounded-lg text-xs"
            >
              <IconTrash className="size-3.5" />
              Remove
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center py-24">
          <Spinner className="size-8 text-primary" />
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            Loading {pageTitle} library...
          </p>
        </div>
      ) : !isConnected ? (
        <Card className="mx-auto max-w-lg rounded-3xl border border-border/40 bg-card p-8 text-center text-card-foreground shadow-xs ring-1 ring-foreground/5 dark:ring-foreground/10">
          <CardContent className="space-y-4 pt-2">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-border/50 bg-muted/50 text-muted-foreground">
              <IconLink className="size-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading text-base font-semibold text-foreground">
                {pageTitle} Not Connected
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Connect your {pageTitle} instance using your Host URL and API
                Key in Account Connections to browse and manage your media
                library.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/settings/connections"
                className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
              >
                Configure Connections
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : processedItems.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 py-20 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            {provider === "RADARR" ? (
              <IconMovie className="size-6" />
            ) : (
              <IconDeviceTv className="size-6" />
            )}
          </div>
          <p className="text-sm font-medium text-foreground">
            No {provider === "RADARR" ? "movies" : "series"} found
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your search, filters, or add new media to {pageTitle}.
          </p>
        </div>
      ) : viewMode !== "table" ? (
        <div
          className={cn(
            "grid gap-3",
            viewMode === "poster" &&
              "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7",
            viewMode === "overview" && "grid-cols-1 lg:grid-cols-2",
            viewMode === "banner" && "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
          )}
        >
          {processedItems.map((item) => {
            const numericId = Number(item.id)
            const qpName =
              item.qualityProfile ||
              (item.qualityProfileId
                ? qualityProfileMap.get(item.qualityProfileId)
                : undefined)
            return (
              <ServarrMediaCard
                key={item.id}
                item={item}
                app={app}
                kind={app === "radarr" ? "movie" : "series"}
                variant={viewMode}
                qualityProfileName={qpName}
                href={`/borealis/servarr/${providerLower}/${item.id}`}
                selectable={isSelectMode}
                selected={selectedIds.has(numericId)}
                onToggleSelect={handleToggleSelect}
              />
            )
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/40 bg-card text-card-foreground shadow-xs ring-1 ring-foreground/5 dark:ring-foreground/10">
          <table className="w-full border-collapse text-start text-xs">
            <thead>
              <tr className="border-b border-border/40 bg-muted/40 font-semibold text-muted-foreground">
                {isSelectMode && <th className="w-10 p-3.5 text-start" />}
                <th className="p-3.5 text-start">Title</th>
                <th className="p-3.5 text-start">Year</th>
                <th className="p-3.5 text-start">Status</th>
                <th className="p-3.5 text-start">Quality Profile</th>
                <th className="p-3.5 text-start">Size</th>
                <th className="p-3.5 text-start">Added Date</th>
                <th className="p-3.5 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {processedItems.map((item) => {
                const numericId = Number(item.id)
                return (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    {isSelectMode && (
                      <td className="p-3.5">
                        <Checkbox
                          isSelected={selectedIds.has(numericId)}
                          onChange={() => handleToggleSelect(numericId)}
                        />
                      </td>
                    )}
                    <td className="p-3.5 font-medium text-foreground">
                      <Link
                        href={`/borealis/servarr/${providerLower}/${item.id}`}
                        className="flex items-center gap-3 transition-colors hover:text-primary"
                      >
                        {item.posterUrl ? (
                          <img
                            src={item.posterUrl}
                            alt={item.title}
                            className="size-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                            {provider === "RADARR" ? (
                              <IconMovie className="size-4" />
                            ) : (
                              <IconDeviceTv className="size-4" />
                            )}
                          </div>
                        )}
                        <span className="font-heading text-xs font-semibold">
                          {item.title}
                        </span>
                      </Link>
                    </td>
                    <td className="p-3.5 font-mono text-muted-foreground">
                      {item.year || "—"}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "py-0 text-[10px] font-semibold",
                          item.hasFile
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                            : item.monitored
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {item.hasFile
                          ? "Downloaded"
                          : item.monitored
                            ? "Wanted"
                            : "Unmonitored"}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      {item.qualityProfile || "—"}
                    </td>
                    <td className="p-3.5 font-mono text-muted-foreground">
                      {formatBytes(item.sizeOnDisk)}
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      {formatDate(item.added)}
                    </td>
                    <td className="p-3.5 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={item.monitored ? "Unmonitor" : "Monitor"}
                          onClick={() => handleToggleMonitor(item)}
                        >
                          {item.monitored ? (
                            <IconEye className="size-3.5 text-primary" />
                          ) : (
                            <IconEyeOff className="size-3.5 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label="Search"
                          onClick={() => handleAutoSearch(item)}
                        >
                          <IconSearch className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Media Dialog */}
      <ServarrAddMediaDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        provider={provider}
        onAdded={() => loadMedia(true, true)}
      />

      {/* Custom Filter Dialog */}
      <ServarrCustomFilterDialog
        app={app}
        isOpen={isCustomFilterDialogOpen}
        onClose={() => setIsCustomFilterDialogOpen(false)}
        initialFilter={editingCustomFilter}
        onSaved={() => {
          void loadMetadata()
        }}
      />

      {/* Server Filesystem Import Dialog */}
      <ServarrFilesystemDialog
        app={app}
        isOpen={isFsImportOpen}
        onClose={() => setIsFsImportOpen(false)}
        onSelect={handleImportFolder}
        title={`Import Existing ${provider === "RADARR" ? "Movies" : "Series"} Folder`}
      />
    </div>
  )
}
