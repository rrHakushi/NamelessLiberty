"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  IconSearch,
  IconSparkles,
  IconFilePencil,
  IconFolder,
  IconTrash,
  IconArrowLeft,
  IconFileCheck,
  IconMovie,
  IconPhotoOff,
  IconClock,
  IconVideo,
  IconFolderOpen,
  IconBookmark,
  IconBookmarkOff,
  IconExternalLink,
  IconUsers,
  IconFiles,
  IconTags,
  IconHistory,
  IconEdit,
  IconDeviceTv,
} from "@tabler/icons-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectList,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"
import { servarrRequest } from "./servarr-client"
import { useServarrRealtime } from "./use-servarr-realtime"
import { elysia } from "@/lib/elysia"
import { dedupGet, invalidateDedup } from "@/lib/request-dedup"
import { toast } from "sonner"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ServarrInteractiveSearchDialog } from "./servarr-interactive-search-dialog"
import { ServarrFileManagerDialog } from "./servarr-file-manager-dialog"
import { ServarrDeleteMediaDialog } from "./servarr-delete-dialog"

export interface ServarrMovieDetailViewProps {
  movieId: number
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes === 0) return "—"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "—"
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

export function ServarrMovieDetailView({
  movieId,
}: ServarrMovieDetailViewProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [movieData, setMovieData] = useState<any>(null)
  const [files, setFiles] = useState<any[]>([])
  const [posterError, setPosterError] = useState(false)
  const [bannerError, setBannerError] = useState(false)

  // Dialog States
  const [isInteractiveSearchOpen, setIsInteractiveSearchOpen] = useState(false)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false)
  const [isManualImportOpen, setIsManualImportOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Extended Radarr Metadata
  const [borealisHref, setBorealisHref] = useState<string | null>(null)
  const [credits, setCredits] = useState<any[]>([])
  const [extraFiles, setExtraFiles] = useState<any[]>([])
  const [altTitles, setAltTitles] = useState<any[]>([])
  const [movieHistory, setMovieHistory] = useState<any[]>([])
  const [qualityProfiles, setQualityProfiles] = useState<{ id: number; name: string }[]>([])
  const [editForm, setEditForm] = useState<{
    monitored: boolean
    qualityProfileId: number
    minimumAvailability: string
    path: string
  }>({
    monitored: true,
    qualityProfileId: 1,
    minimumAvailability: "released",
    path: "",
  })
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const inFlightRef = React.useRef(false)
  const lastFetchedIdRef = React.useRef<number | null>(null)

  const fetchMovie = React.useCallback(
    async (force = false) => {
      if (!force && inFlightRef.current) return
      inFlightRef.current = true
      setIsLoading(true)
      try {
        const res = (await dedupGet(
          `servarr:radarr:movie:${movieId}`,
          () => elysia.servarr.radarr.movies({ id: movieId }).get(),
          { force, ttlMs: 3000 }
        )) as any
        if (res?.data?.success && res.data.movie) {
          setMovieData(res.data.movie)
          setFiles(res.data.files || [])
        } else {
          toast.error("Failed to load movie details", {
            description: res?.data?.message || "Unknown error",
          })
        }
      } catch (err: any) {
        toast.error("Error loading movie", { description: err.message })
      } finally {
        setIsLoading(false)
        inFlightRef.current = false
      }
    },
    [movieId]
  )

  const fetchExtended = React.useCallback(
    async (movie: any) => {
      if (!movie) return
      setEditForm({
        monitored: Boolean(movie.monitored),
        qualityProfileId: Number(movie.qualityProfileId || 1),
        minimumAvailability: movie.minimumAvailability || "released",
        path: movie.path || "",
      })
      const params = new URLSearchParams()
      if (movie.tmdbId) params.set("tmdbId", String(movie.tmdbId))
      if (movie.imdbId) params.set("imdbId", String(movie.imdbId))
      if (movie.title) params.set("title", String(movie.title))

      const [linkRes, credRes, extraRes, altRes, histRes, qpRes] =
        await Promise.all([
          servarrRequest<{ href: string | null }>(
            "radarr",
            `/borealis-link?${params.toString()}`
          ),
          servarrRequest<any[]>("radarr", `/credits?movieId=${movieId}`),
          servarrRequest<any[]>("radarr", `/extrafiles?movieId=${movieId}`),
          servarrRequest<any[]>("radarr", `/alttitles?movieId=${movieId}`),
          servarrRequest<any[]>("radarr", `/history/movie/${movieId}`),
          servarrRequest<{ id: number; name: string }[]>(
            "radarr",
            "/rules/qualityprofile"
          ),
        ])

      if (linkRes.ok && linkRes.data?.href) setBorealisHref(linkRes.data.href)
      if (credRes.ok && Array.isArray(credRes.data)) setCredits(credRes.data)
      if (extraRes.ok && Array.isArray(extraRes.data)) setExtraFiles(extraRes.data)
      if (altRes.ok && Array.isArray(altRes.data)) setAltTitles(altRes.data)
      if (histRes.ok && Array.isArray(histRes.data)) setMovieHistory(histRes.data)
      if (qpRes.ok && Array.isArray(qpRes.data)) setQualityProfiles(qpRes.data)
    },
    [movieId]
  )

  useEffect(() => {
    if (lastFetchedIdRef.current === movieId) return
    lastFetchedIdRef.current = movieId
    fetchMovie()
  }, [movieId, fetchMovie])

  useEffect(() => {
    if (movieData?.id) {
      void fetchExtended(movieData)
    }
  }, [movieData?.id, fetchExtended])

  useServarrRealtime({
    app: "radarr",
    topics: ["movie", "moviefile", "command", "queue"],
    onSync: () => {
      invalidateDedup(`servarr:radarr:movie:${movieId}`)
      void fetchMovie(true)
    },
    fallbackPollMs: 45_000,
  })

  const handleSaveEdit = async () => {
    if (!movieData) return
    setIsSavingEdit(true)
    try {
      const res = await elysia.servarr.radarr.movies({ id: movieId }).put({
        ...movieData,
        monitored: editForm.monitored,
        qualityProfileId: editForm.qualityProfileId,
        minimumAvailability: editForm.minimumAvailability,
        path: editForm.path,
      })
      if (res?.data?.success) {
        toast.success("Movie settings saved")
        setIsEditOpen(false)
        invalidateDedup(`servarr:radarr:movie:${movieId}`)
        await fetchMovie(true)
      } else {
        toast.error(res?.data?.message || "Failed to update movie")
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update movie")
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleToggleMovieMonitoring = async () => {
    if (!movieData) return
    const newMonitored = !movieData.monitored
    setMovieData((prev: any) => ({ ...prev, monitored: newMonitored }))

    try {
      const res = await elysia.servarr.radarr.movies({ id: movieId }).put({
        ...movieData,
        monitored: newMonitored,
      })
      if (res?.data?.success) {
        toast.success(
          `Movie monitoring ${newMonitored ? "enabled" : "disabled"}`
        )
      } else {
        toast.error("Failed to update movie monitoring", {
          description: res?.data?.message || "Unknown error",
        })
        setMovieData((prev: any) => ({ ...prev, monitored: !newMonitored }))
      }
    } catch (err: any) {
      toast.error("Failed to update movie monitoring", {
        description: err.message,
      })
      setMovieData((prev: any) => ({ ...prev, monitored: !newMonitored }))
    }
  }

  const handleSearchMovie = async () => {
    try {
      await elysia.servarr.radarr.command.post({
        name: "MoviesSearch",
        movieIds: [movieId],
      })
      toast.success(`Automatic search started for ${movieData?.title}`)
    } catch (err: any) {
      toast.error("Search request failed", { description: err.message })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Spinner className="size-8 text-primary" />
        <span className="text-xs font-medium">Loading movie details...</span>
      </div>
    )
  }

  if (!movieData) {
    return (
      <div className="mx-auto mt-8 max-w-4xl rounded-3xl border border-dashed border-border/60 p-12 text-center text-muted-foreground">
        <IconMovie className="mx-auto mb-3 size-12 opacity-40" />
        <p className="text-sm font-semibold text-foreground">Movie not found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The requested movie could not be loaded from Radarr.
        </p>
        <Link href="/borealis/servarr/radarr/movies">
          <Button variant="outline" size="sm" className="mt-4 gap-2 rounded-xl">
            <IconArrowLeft className="size-4" /> Return to Movies List
          </Button>
        </Link>
      </div>
    )
  }

  const poster =
    movieData.images?.find((img: any) => img.coverType === "poster")
      ?.remoteUrl ||
    movieData.images?.find((img: any) => img.coverType === "poster")?.url
  const fanart =
    movieData.images?.find((img: any) => img.coverType === "fanart")
      ?.remoteUrl ||
    movieData.images?.find((img: any) => img.coverType === "fanart")?.url

  const movieFile = movieData.movieFile || (files.length > 0 ? files[0] : null)
  const mediaInfo = movieFile?.mediaInfo
  const hasFile = movieData.hasFile || !!movieFile
  const isMovieMonitored = movieData.monitored !== false

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* 1. IRIS Full-Bleed Media Hero Section */}
      <div className="relative w-full border-b border-border/40 bg-card/40">
        {/* Backdrop Banner */}
        <div className="relative h-36 w-full overflow-hidden bg-muted sm:h-48 md:h-56">
          {fanart && !bannerError ? (
            <img
              src={fanart}
              alt=""
              aria-hidden="true"
              onError={() => setBannerError(true)}
              className="h-full w-full object-cover object-center"
            />
          ) : poster && !posterError ? (
            <img
              src={poster}
              alt=""
              aria-hidden="true"
              className="h-full w-full scale-105 object-cover object-center opacity-40 blur-md"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-b from-muted/60 to-background/90" />
          )}

          {/* Smooth Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-radial from-transparent to-background/30" />

          {/* Floating Back Navigation Pill */}
          <div className="absolute start-3 top-3 z-20 sm:start-6 sm:top-4">
            <Link
              href="/borealis/servarr/radarr/movies"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs backdrop-blur-md transition-colors hover:bg-background hover:text-primary"
            >
              <IconArrowLeft className="size-3.5" />
              <span>Back to Movies</span>
            </Link>
          </div>
        </div>

        {/* Hero Content Container */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 pb-4 sm:-mt-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              {/* Floating Poster */}
              <div className="relative aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-background/90 bg-muted shadow-lg sm:w-36 md:w-44">
                {poster && !posterError ? (
                  <img
                    src={poster}
                    alt={movieData.title}
                    onError={() => setPosterError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-muted-foreground/60">
                    <IconPhotoOff className="size-8" aria-hidden="true" />
                    <span className="text-center text-[10px] font-medium">
                      No Image
                    </span>
                  </div>
                )}
              </div>

              {/* Right Column: Title + Metadata + Action Buttons */}
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                {/* Badges & Tags */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Interactive Movie Monitoring Toggle Badge */}
                  <button
                    type="button"
                    onClick={handleToggleMovieMonitoring}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isMovieMonitored
                        ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
                        : "border-border/60 bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                    title={`Click to ${isMovieMonitored ? "unmonitor" : "monitor"} movie`}
                  >
                    {isMovieMonitored ? (
                      <IconBookmark className="size-3 fill-emerald-500 text-emerald-500" />
                    ) : (
                      <IconBookmarkOff className="size-3 text-muted-foreground" />
                    )}
                    <span>
                      {isMovieMonitored ? "Monitored" : "Unmonitored"}
                    </span>
                  </button>

                  <Badge
                    variant="outline"
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
                      hasFile
                        ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-500"
                        : "border-primary/30 bg-primary/10 text-primary"
                    )}
                  >
                    {hasFile ? "Downloaded" : "Wanted"}
                  </Badge>

                  {movieData.studio && (
                    <Badge
                      variant="secondary"
                      className="px-2 py-0.5 text-[10px] font-medium"
                    >
                      {movieData.studio}
                    </Badge>
                  )}

                  {movieData.year && (
                    <span className="text-xs font-semibold text-muted-foreground">
                      {movieData.year}
                    </span>
                  )}

                  {movieData.runtime > 0 && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <IconClock className="size-3 opacity-70" />
                      <span>
                        {Math.floor(movieData.runtime / 60)}h{" "}
                        {movieData.runtime % 60}m
                      </span>
                    </span>
                  )}
                </div>

                {/* Main Title */}
                <div>
                  <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                    {movieData.title}
                  </h1>
                  {movieData.originalTitle &&
                    movieData.originalTitle !== movieData.title && (
                      <p className="font-japanese mt-0.5 text-xs text-muted-foreground/80">
                        {movieData.originalTitle}
                      </p>
                    )}
                </div>

                {/* Overview Synopsis */}
                {movieData.overview && (
                  <p className="line-clamp-3 max-w-4xl text-xs leading-relaxed text-muted-foreground select-text sm:text-sm">
                    {movieData.overview}
                  </p>
                )}

                {/* Metadata Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/40 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                    <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase">
                      Path
                    </span>
                    <span className="max-w-[200px] truncate font-mono font-medium text-foreground sm:max-w-xs">
                      {movieData.path || "—"}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/40 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                    <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase">
                      Profile
                    </span>
                    <span className="font-medium text-foreground">
                      Profile #{movieData.qualityProfileId || 1}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/40 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                    <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase">
                      Disk Size
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {formatBytes(movieData.sizeOnDisk || movieFile?.size)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons Toolbar */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSearchMovie}
                    className="h-8 gap-1.5 rounded-xl text-xs font-semibold shadow-xs"
                  >
                    <IconSparkles className="size-3.5" />
                    <span>Auto Search</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsInteractiveSearchOpen(true)}
                    className="h-8 gap-1.5 rounded-xl text-xs font-medium"
                  >
                    <IconSearch className="size-3.5 text-primary" />
                    <span>Interactive Search</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFileManagerOpen(true)}
                    className="h-8 gap-1.5 rounded-xl text-xs font-medium"
                  >
                    <IconFolder className="size-3.5" />
                    <span>Manage Files</span>
                  </Button>

                  {borealisHref && (
                    <Link
                      href={borealisHref}
                      className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-input bg-background px-3 text-xs font-medium text-primary shadow-xs transition-colors hover:bg-accent"
                    >
                      <IconDeviceTv className="size-3.5" />
                      <span>Open in Borealis</span>
                    </Link>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="ms-auto h-8 gap-1.5 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10"
                  >
                    <IconTrash className="size-3.5" />
                    <span>Delete Movie</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Body: Media File & Stream Specifications */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {movieFile ? (
          <div className="space-y-5 rounded-3xl border border-border/40 bg-card p-6 text-card-foreground shadow-xs ring-1 ring-foreground/5 md:p-8 dark:ring-foreground/10">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="flex items-center gap-2 font-heading text-sm font-semibold tracking-wide text-foreground">
                <IconVideo className="size-4 text-primary" />
                <span>Media File & Stream Specifications</span>
              </h3>
              <Badge
                variant="secondary"
                className="border border-emerald-500/30 bg-emerald-500/15 font-mono text-[10px] text-emerald-500"
              >
                {movieFile.quality?.quality?.name || "Standard Quality"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 font-mono text-xs sm:grid-cols-4">
              <div className="space-y-1 rounded-2xl border border-border/40 bg-muted/30 p-3.5">
                <span className="block font-sans text-[10px] font-bold text-muted-foreground/70 uppercase">
                  Resolution
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {mediaInfo?.resolution || "—"}
                </span>
              </div>

              <div className="space-y-1 rounded-2xl border border-border/40 bg-muted/30 p-3.5">
                <span className="block font-sans text-[10px] font-bold text-muted-foreground/70 uppercase">
                  Video Codec
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {mediaInfo?.videoCodec || "—"}
                </span>
              </div>

              <div className="space-y-1 rounded-2xl border border-border/40 bg-muted/30 p-3.5">
                <span className="block font-sans text-[10px] font-bold text-muted-foreground/70 uppercase">
                  Audio Channels
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {mediaInfo?.audioChannels
                    ? `${mediaInfo.audioChannels} Channels`
                    : "—"}
                </span>
              </div>

              <div className="space-y-1 rounded-2xl border border-border/40 bg-muted/30 p-3.5">
                <span className="block font-sans text-[10px] font-bold text-muted-foreground/70 uppercase">
                  File Size
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {formatBytes(movieFile.size)}
                </span>
              </div>
            </div>

            {/* Path details */}
            <div className="space-y-1 rounded-2xl border border-border/40 bg-muted/20 p-3.5">
              <span className="block flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/70 uppercase">
                <IconFolderOpen className="size-3.5 text-primary" />
                <span>Disk File Path</span>
              </span>
              <p className="font-mono text-xs break-all text-foreground select-text">
                {movieFile.path ||
                  movieFile.relativePath ||
                  movieData.path ||
                  "—"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-3xl border border-dashed border-border/60 p-12 text-center text-xs text-muted-foreground">
            <IconMovie className="mx-auto size-10 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium text-foreground">
              No Movie File Downloaded
            </p>
            <p className="mx-auto max-w-md text-muted-foreground">
              This movie is currently monitored in Radarr. Trigger an automatic
              or interactive search to download a release.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleSearchMovie}
                className="gap-2 rounded-xl text-xs font-semibold shadow-xs"
              >
                <IconSparkles className="size-3.5" /> Auto Search Release
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsInteractiveSearchOpen(true)}
                className="gap-2 rounded-xl text-xs font-medium"
              >
                <IconSearch className="size-3.5 text-primary" /> Interactive
                Search
              </Button>
            </div>
          </div>
        )}

        {/* Extended Radarr Metadata Tabs */}
        <Tabs defaultSelectedKey="credits" className="w-full">
          <TabsList className="h-9 rounded-xl">
            <TabsTrigger id="credits" className="gap-1.5 text-xs">
              <IconUsers className="size-3.5" />
              <span>Credits ({credits.length})</span>
            </TabsTrigger>
            <TabsTrigger id="extrafiles" className="gap-1.5 text-xs">
              <IconFiles className="size-3.5" />
              <span>Extra Files ({extraFiles.length})</span>
            </TabsTrigger>
            <TabsTrigger id="alttitles" className="gap-1.5 text-xs">
              <IconTags className="size-3.5" />
              <span>Alt Titles ({altTitles.length})</span>
            </TabsTrigger>
            <TabsTrigger id="history" className="gap-1.5 text-xs">
              <IconHistory className="size-3.5" />
              <span>History ({movieHistory.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent id="credits" className="mt-4">
            {credits.length === 0 ? (
              <p className="rounded-2xl border border-border/40 bg-card p-6 text-center text-xs text-muted-foreground">
                No credits metadata available.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {credits.slice(0, 24).map((c, idx) => (
                  <div
                    key={c.id ?? `${c.personName}-${idx}`}
                    className="flex items-center justify-between rounded-2xl border border-border/40 bg-card p-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {c.personName}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {c.character || c.job || c.type}
                      </p>
                    </div>
                    <Badge variant="outline" className="ms-2 shrink-0 text-[10px]">
                      {c.type || "cast"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent id="extrafiles" className="mt-4">
            {extraFiles.length === 0 ? (
              <p className="rounded-2xl border border-border/40 bg-card p-6 text-center text-xs text-muted-foreground">
                No extra files (subtitles, metadata, other) indexed.
              </p>
            ) : (
              <div className="space-y-2 rounded-2xl border border-border/40 bg-card p-4">
                {extraFiles.map((ef) => (
                  <div
                    key={ef.id ?? ef.relativePath}
                    className="flex items-center justify-between border-b border-border/30 pb-2 text-xs last:border-0 last:pb-0"
                  >
                    <span className="truncate font-mono text-foreground">
                      {ef.relativePath}
                    </span>
                    <Badge variant="outline" className="ms-2 shrink-0 text-[10px]">
                      {ef.type || ef.extension}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent id="alttitles" className="mt-4">
            {altTitles.length === 0 ? (
              <p className="rounded-2xl border border-border/40 bg-card p-6 text-center text-xs text-muted-foreground">
                No alternative titles recorded.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 rounded-2xl border border-border/40 bg-card p-4">
                {altTitles.map((at) => (
                  <Badge key={at.id ?? at.title} variant="secondary" className="text-xs">
                    {at.title}
                    {at.language?.name ? ` (${at.language.name})` : ""}
                  </Badge>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent id="history" className="mt-4">
            {movieHistory.length === 0 ? (
              <p className="rounded-2xl border border-border/40 bg-card p-6 text-center text-xs text-muted-foreground">
                No history events recorded for this movie.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border/40 bg-card">
                <table className="w-full text-start text-xs">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/40 text-muted-foreground">
                      <th className="p-3 text-start">Event</th>
                      <th className="p-3 text-start">Source Title</th>
                      <th className="p-3 text-start">Quality</th>
                      <th className="p-3 text-start">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {movieHistory.map((h) => (
                      <tr key={h.id}>
                        <td className="p-3 font-medium text-foreground">
                          {h.eventType}
                        </td>
                        <td className="max-w-xs truncate p-3 font-mono text-muted-foreground">
                          {h.sourceTitle}
                        </td>
                        <td className="p-3">{h.quality?.quality?.name || "—"}</td>
                        <td className="p-3 text-muted-foreground">
                          {formatDate(h.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Movie Dialog */}
      <Dialog
        isOpen={isEditOpen}
        onOpenChange={(o) => !o && setIsEditOpen(false)}
        className="p-6 sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Edit Movie — {movieData.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Monitored</Label>
            <Switch
              isSelected={editForm.monitored}
              onChange={(v) =>
                setEditForm((prev) => ({ ...prev, monitored: v }))
              }
            />
          </div>

          {qualityProfiles.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Quality Profile</Label>
              <Select
                selectedKey={String(editForm.qualityProfileId)}
                onSelectionChange={(v) =>
                  setEditForm((prev) => ({
                    ...prev,
                    qualityProfileId: Number(v),
                  }))
                }
              >
                <SelectTrigger className="h-9 text-xs">
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
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Minimum Availability</Label>
            <Select
              selectedKey={editForm.minimumAvailability}
              onSelectionChange={(v) =>
                setEditForm((prev) => ({ ...prev, minimumAvailability: String(v) }))
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectList>
                  <SelectItem id="announced">Announced</SelectItem>
                  <SelectItem id="inCinemas">In Cinemas</SelectItem>
                  <SelectItem id="released">Released</SelectItem>
                </SelectList>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Path</Label>
            <Input
              value={editForm.path}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, path: e.target.value }))
              }
              className="h-9 font-mono text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(false)}
          >
            Cancel
          </Button>
          <Button size="sm" disabled={isSavingEdit} onClick={handleSaveEdit}>
            {isSavingEdit ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Sub-modals */}
      <ServarrDeleteMediaDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        provider="RADARR"
        mediaId={movieId}
        mediaTitle={movieData.title}
        path={movieData.path}
        fileCount={files.length}
        onDeleted={() => router.push("/borealis/servarr/radarr/movies")}
      />

      <ServarrInteractiveSearchDialog
        isOpen={isInteractiveSearchOpen}
        onClose={() => setIsInteractiveSearchOpen(false)}
        provider="RADARR"
        mediaId={movieId}
        mediaTitle={movieData.title}
      />

      <ServarrFileManagerDialog
        isOpen={isFileManagerOpen}
        onClose={() => setIsFileManagerOpen(false)}
        provider="RADARR"
        mediaId={movieId}
        mediaTitle={movieData.title}
        onFilesChanged={() => fetchMovie(true)}
      />
    </div>
  )
}
