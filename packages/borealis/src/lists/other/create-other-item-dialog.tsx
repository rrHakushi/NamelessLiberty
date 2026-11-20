"use client"

import React, { useState, useEffect, useRef } from "react"
import { elysia } from "@/lib/elysia"
import { toast } from "sonner"
import { Dialog } from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Badge } from "@workspace/ui/components/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import {
  IconArrowLeft,
  IconCalendar,
  IconCategory,
  IconChevronRight,
  IconInfoCircle,
  IconLink,
  IconListDetails,
  IconMusic,
  IconPhoto,
  IconPlus,
  IconSettings,
  IconShield,
  IconSparkles,
  IconTags,
  IconTrash,
  IconUpload,
  IconUsers,
  IconX,
} from "@tabler/icons-react"
import {
  ChipInput,
  OneWayCreditsPickers,
  type LinkedCharacterRow,
  type LinkedRelationRow,
  type LinkedStaffRow,
  type LinkedStudioRow,
} from "./other-item-modal-pickers"

export interface OtherCatalogItem {
  id: number
  titlePrimary: string
  titleSecondary?: string | null
  [key: string]: any
}

export interface CreateOtherItemDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (item?: any) => void
  editItem?: any | null
  onDeleted?: () => void
}

type ModalTabKey =
  | "core"
  | "dates"
  | "classification"
  | "details"
  | "credits"
  | "subitems"
  | "custom"
  | "artwork"

const FORMAT_PRESETS = [
  "webnovel",
  "visual_novel",
  "board_game",
  "tabletop",
  "video_series",
  "comic",
  "app",
  "activity",
  "course",
  "habit",
  "workout",
  "project",
  "podcast",
  "other",
] as const

const MEDIA_STATUSES = [
  { id: "UNKNOWN", label: "Unknown" },
  { id: "RELEASING", label: "Releasing / Ongoing" },
  { id: "RELEASED", label: "Released / Finished" },
  { id: "UPCOMING", label: "Upcoming / Not Yet Released" },
  { id: "HIATUS", label: "On Hiatus" },
  { id: "CANCELLED", label: "Cancelled" },
] as const

const SEASONS = ["UNKNOWN", "WINTER", "SPRING", "SUMMER", "FALL"] as const

interface ProgressFieldDraft {
  key: string
  label: string
  unit: string
  max: string
}

interface CustomFieldDraft {
  label: string
  type: "text" | "link" | "badges"
  value: string
}

interface SeasonDraft {
  seasonNumber: number
  name: string
  episodeCount: string
}

interface EpisodeDraft {
  episodeNumber: number
  seasonNumber: string
  name: string
  runtime: string
}

interface TrackDraft {
  trackNumber: number
  discNumber: number
  titlePrimary: string
  artistName: string
  duration: string
}

const SIDEBAR_GROUPS: Array<{
  title: string
  items: Array<{
    key: ModalTabKey
    label: string
    icon: React.ComponentType<{ className?: string }>
  }>
}> = [
  {
    title: "General",
    items: [
      { key: "core", label: "Core Info", icon: IconInfoCircle },
      { key: "dates", label: "Dates & Schedule", icon: IconCalendar },
      { key: "classification", label: "Genres, Tags & Ratings", icon: IconTags },
    ],
  },
  {
    title: "Combined Media Data",
    items: [
      { key: "details", label: "Type-Specific Details", icon: IconListDetails },
      { key: "credits", label: "Credits & Relations", icon: IconUsers },
      { key: "subitems", label: "Episodes & Tracks", icon: IconMusic },
    ],
  },
  {
    title: "Other & Publishing",
    items: [
      { key: "custom", label: "Custom Metadata", icon: IconSparkles },
      { key: "artwork", label: "Artwork, Links & Publish", icon: IconPhoto },
    ],
  },
]

const toNumOrNull = (val: string): number | null => {
  const clean = val.trim()
  if (!clean) return null
  const n = Number(clean)
  return Number.isFinite(n) ? n : null
}

export function CreateOtherItemDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  editItem,
  onDeleted,
}: CreateOtherItemDialogProps): React.JSX.Element {
  const isEdit = Boolean(editItem?.id)

  const [activeTab, setActiveTab] = useState<ModalTabKey>("core")
  const [mobileShowDetail, setMobileShowDetail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [uploadingType, setUploadingType] = useState<"cover" | "banner" | "gallery" | null>(null)

  const [taxonomyGenres, setTaxonomyGenres] = useState<string[]>([])
  const [taxonomyTags, setTaxonomyTags] = useState<string[]>([])

  // Core
  const [titlePrimary, setTitlePrimary] = useState("")
  const [titleSecondary, setTitleSecondary] = useState("")
  const [titleNative, setTitleNative] = useState("")
  const [synonyms, setSynonyms] = useState<string[]>([])
  const [tagline, setTagline] = useState("")
  const [description, setDescription] = useState("")
  const [hashtag, setHashtag] = useState("")
  const [formatPreset, setFormatPreset] = useState<string>("other")
  const [customFormat, setCustomFormat] = useState("")
  const [status, setStatus] = useState<string>("UNKNOWN")
  const [source, setSource] = useState("")

  // Dates & Schedule
  const [startYear, setStartYear] = useState("")
  const [startMonth, setStartMonth] = useState("")
  const [startDay, setStartDay] = useState("")
  const [endYear, setEndYear] = useState("")
  const [endMonth, setEndMonth] = useState("")
  const [endDay, setEndDay] = useState("")
  const [seasonSeason, setSeasonSeason] = useState("UNKNOWN")
  const [seasonYear, setSeasonYear] = useState("")
  const [showType, setShowType] = useState("")
  const [broadcastTime, setBroadcastTime] = useState("")
  const [broadcastDays, setBroadcastDays] = useState<string[]>([])
  const [networks, setNetworks] = useState<string[]>([])
  const [nextAiringEp, setNextAiringEp] = useState("")
  const [nextAiringAt, setNextAiringAt] = useState("")

  // Classification
  const [genres, setGenres] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [countryOfOrigin, setCountryOfOrigin] = useState("")
  const [originalLanguage, setOriginalLanguage] = useState("")
  const [languages, setLanguages] = useState<string[]>([])
  const [isAdult, setIsAdult] = useState(false)
  const [ageRating, setAgeRating] = useState("")
  const [ageRatingGuide, setAgeRatingGuide] = useState("")
  const [esrbRating, setEsrbRating] = useState("")
  const [pegiRating, setPegiRating] = useState("")

  // Combined Type-Specific Details
  const [episodeCount, setEpisodeCount] = useState("")
  const [episodeDuration, setEpisodeDuration] = useState("")
  const [seasonCount, setSeasonCount] = useState("")
  const [chapterCount, setChapterCount] = useState("")
  const [volumeCount, setVolumeCount] = useState("")
  const [pageCount, setPageCount] = useState("")
  const [runtime, setRuntime] = useState("")
  const [duration, setDuration] = useState("")
  const [totalTracks, setTotalTracks] = useState("")

  const [authors, setAuthors] = useState<string[]>([])
  const [developers, setDevelopers] = useState<string[]>([])
  const [publishers, setPublishers] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<string[]>([])
  const [franchise, setFranchise] = useState("")
  const [series, setSeries] = useState("")
  const [seriesPosition, setSeriesPosition] = useState("")
  const [subjects, setSubjects] = useState<string[]>([])
  const [gameModes, setGameModes] = useState<string[]>([])
  const [playerPerspectives, setPlayerPerspectives] = useState<string[]>([])
  const [controllerSupport, setControllerSupport] = useState("")

  const [budget, setBudget] = useState("")
  const [revenue, setRevenue] = useState("")
  const [awards, setAwards] = useState<string[]>([])
  const [isbn10, setIsbn10] = useState("")
  const [isbn13, setIsbn13] = useState("")
  const [retailPrice, setRetailPrice] = useState("")
  const [retailPriceCurrency, setRetailPriceCurrency] = useState("")

  const [albumType, setAlbumType] = useState("")
  const [label, setLabel] = useState("")
  const [artist, setArtist] = useState("")
  const [artists, setArtists] = useState<string[]>([])
  const [bpm, setBpm] = useState("")
  const [gain, setGain] = useState("")
  const [explicitLyrics, setExplicitLyrics] = useState(false)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("")
  const [isrc, setIsrc] = useState("")
  const [lyrics, setLyrics] = useState("")
  const [syncedLyrics, setSyncedLyrics] = useState("")

  // One-way credits & relations
  const [characters, setCharacters] = useState<LinkedCharacterRow[]>([])
  const [staff, setStaff] = useState<LinkedStaffRow[]>([])
  const [studios, setStudios] = useState<LinkedStudioRow[]>([])
  const [relations, setRelations] = useState<LinkedRelationRow[]>([])

  // Sub-items
  const [seasons, setSeasons] = useState<SeasonDraft[]>([])
  const [episodes, setEpisodes] = useState<EpisodeDraft[]>([])
  const [tracks, setTracks] = useState<TrackDraft[]>([])

  // Custom metadata
  const [customFields, setCustomFields] = useState<CustomFieldDraft[]>([])

  // Artwork, Links & Publishing
  const [coverImage, setCoverImage] = useState("")
  const [bannerImage, setBannerImage] = useState("")
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [trailerUrls, setTrailerUrls] = useState<string[]>([])
  const [siteUrl, setSiteUrl] = useState("")
  const [previewLink, setPreviewLink] = useState("")
  const [infoLink, setInfoLink] = useState("")
  const [buyLink, setBuyLink] = useState("")
  const [isPublished, setIsPublished] = useState(false)
  const [progressFields, setProgressFields] = useState<ProgressFieldDraft[]>([
    { key: "progress", label: "Progress", unit: "Units", max: "" },
  ])
  const [incrementFieldKey, setIncrementFieldKey] = useState("progress")

  const coverFileRef = useRef<HTMLInputElement | null>(null)
  const bannerFileRef = useRef<HTMLInputElement | null>(null)
  const galleryFileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setActiveTab("core")
    setMobileShowDetail(false)
    setConfirmDelete(false)

    // Fetch taxonomy suggestions
    ;(elysia.borealis as any).other.taxonomy
      .get()
      .then((res: any) => {
        if (res.data?.success) {
          setTaxonomyGenres((res.data.genres ?? []).map((g: any) => g.name))
          setTaxonomyTags((res.data.tags ?? []).map((t: any) => t.name))
        }
      })
      .catch(() => {})

    if (editItem) {
      setTitlePrimary(editItem.titlePrimary ?? "")
      setTitleSecondary(editItem.titleSecondary ?? "")
      setTitleNative(editItem.titleNative ?? "")
      setSynonyms(editItem.synonyms ?? [])
      setTagline(editItem.tagline ?? "")
      setDescription(editItem.description ?? "")
      setHashtag(editItem.hashtag ?? "")

      const fmt = editItem.format ?? "other"
      if ((FORMAT_PRESETS as readonly string[]).includes(fmt)) {
        setFormatPreset(fmt)
        setCustomFormat("")
      } else {
        setFormatPreset("__custom__")
        setCustomFormat(fmt)
      }
      setStatus(editItem.status ?? "UNKNOWN")
      setSource(editItem.source ?? "")

      setStartYear(editItem.startDateYear != null ? String(editItem.startDateYear) : "")
      setStartMonth(editItem.startDateMonth != null ? String(editItem.startDateMonth) : "")
      setStartDay(editItem.startDateDay != null ? String(editItem.startDateDay) : "")
      setEndYear(editItem.endDateYear != null ? String(editItem.endDateYear) : "")
      setEndMonth(editItem.endDateMonth != null ? String(editItem.endDateMonth) : "")
      setEndDay(editItem.endDateDay != null ? String(editItem.endDateDay) : "")
      setSeasonSeason(editItem.seasonSeason ?? "UNKNOWN")
      setSeasonYear(editItem.seasonYear != null ? String(editItem.seasonYear) : "")
      setShowType(editItem.showType ?? "")
      setBroadcastTime(editItem.broadcastTime ?? "")
      setBroadcastDays(editItem.broadcastDays ?? [])
      setNetworks(editItem.networks ?? [])
      setNextAiringEp(
        editItem.nextAiringEpisodeNumber != null
          ? String(editItem.nextAiringEpisodeNumber)
          : ""
      )
      setNextAiringAt(
        editItem.nextAiringAt
          ? new Date(editItem.nextAiringAt).toISOString().slice(0, 16)
          : ""
      )

      setGenres(
        (editItem.genres ?? []).map((g: any) =>
          typeof g === "string" ? g : g.name ?? g.genre?.name
        ).filter(Boolean)
      )
      setTags(
        (editItem.tags ?? []).map((t: any) =>
          typeof t === "string" ? t : t.name ?? t.tag?.name
        ).filter(Boolean)
      )
      setCountryOfOrigin(editItem.countryOfOrigin ?? "")
      setOriginalLanguage(editItem.originalLanguage ?? "")
      setLanguages(editItem.languages ?? [])
      setIsAdult(Boolean(editItem.isAdult))
      setAgeRating(editItem.ageRating ?? "")
      setAgeRatingGuide(editItem.ageRatingGuide ?? "")
      setEsrbRating(editItem.esrbRating ?? "")
      setPegiRating(editItem.pegiRating ?? "")

      setEpisodeCount(editItem.episodeCount != null ? String(editItem.episodeCount) : "")
      setEpisodeDuration(editItem.episodeDuration != null ? String(editItem.episodeDuration) : "")
      setSeasonCount(editItem.seasonCount != null ? String(editItem.seasonCount) : "")
      setChapterCount(editItem.chapterCount != null ? String(editItem.chapterCount) : "")
      setVolumeCount(editItem.volumeCount != null ? String(editItem.volumeCount) : "")
      setPageCount(editItem.pageCount != null ? String(editItem.pageCount) : "")
      setRuntime(editItem.runtime != null ? String(editItem.runtime) : "")
      setDuration(editItem.duration != null ? String(editItem.duration) : "")
      setTotalTracks(editItem.totalTracks != null ? String(editItem.totalTracks) : "")

      setAuthors(editItem.authors ?? [])
      setDevelopers(editItem.developers ?? [])
      setPublishers(editItem.publishers ?? [])
      setPlatforms(editItem.platforms ?? [])
      setFranchise(editItem.franchise ?? "")
      setSeries(editItem.series ?? "")
      setSeriesPosition(editItem.seriesPosition != null ? String(editItem.seriesPosition) : "")
      setSubjects(editItem.subjects ?? [])
      setGameModes(editItem.gameModes ?? [])
      setPlayerPerspectives(editItem.playerPerspectives ?? [])
      setControllerSupport(editItem.controllerSupport ?? "")

      setBudget(editItem.budget != null ? String(editItem.budget) : "")
      setRevenue(editItem.revenue != null ? String(editItem.revenue) : "")
      setAwards(editItem.awards ?? [])
      setIsbn10(editItem.isbn10 ?? "")
      setIsbn13(editItem.isbn13 ?? "")
      setRetailPrice(editItem.retailPrice != null ? String(editItem.retailPrice) : "")
      setRetailPriceCurrency(editItem.retailPriceCurrency ?? "")

      setAlbumType(editItem.albumType ?? "")
      setLabel(editItem.label ?? "")
      setArtist(editItem.artist ?? "")
      setArtists(editItem.artists ?? [])
      setBpm(editItem.bpm != null ? String(editItem.bpm) : "")
      setGain(editItem.gain != null ? String(editItem.gain) : "")
      setExplicitLyrics(Boolean(editItem.explicitLyrics))
      setAudioPreviewUrl(editItem.audioPreviewUrl ?? "")
      setIsrc(editItem.isrc ?? "")
      setLyrics(editItem.lyrics ?? "")
      setSyncedLyrics(editItem.syncedLyrics ?? "")

      setCharacters(
        (editItem.characters ?? []).map((c: any) => ({
          characterId: c.id ?? c.characterId,
          name: c.characterData?.namePrimary ?? c.namePrimary ?? `#${c.id}`,
          image: c.characterData?.image ?? null,
          role: c.role ?? "MAIN",
          actorId: c.voiceActor?.id ?? c.actorId ?? null,
          actorName: c.voiceActor?.namePrimary ?? null,
        }))
      )
      setStaff(
        (editItem.staff ?? []).map((s: any) => ({
          personId: s.personId ?? s.person?.id,
          name: s.person?.namePrimary ?? s.namePrimary ?? `#${s.personId}`,
          image: s.person?.image ?? null,
          role: s.role ?? "OTHER",
          customRole: s.customRole ?? "",
        }))
      )
      setStudios(
        (editItem.studios ?? []).map((st: any) => ({
          studioId: st.studioId ?? st.studio?.id ?? st.id,
          name: st.studio?.name ?? st.name ?? `#${st.id}`,
          isMain: Boolean(st.isMain),
        }))
      )
      setRelations(
        (editItem.relations ?? []).map((r: any) => ({
          targetType: r.targetType ?? "ANIME",
          targetId: r.targetId ?? r.target?.id,
          title: r.target?.titlePrimary ?? `#${r.targetId}`,
          coverImage: r.target?.coverImage ?? null,
          relationType: r.relationType ?? "OTHER",
        }))
      )

      setSeasons(
        (editItem.seasons ?? []).map((s: any) => ({
          seasonNumber: s.seasonNumber,
          name: s.name ?? "",
          episodeCount: s.episodeCount != null ? String(s.episodeCount) : "",
        }))
      )
      setEpisodes(
        (editItem.episodes ?? []).map((ep: any) => ({
          episodeNumber: ep.episodeNumber,
          seasonNumber: ep.seasonNumber != null ? String(ep.seasonNumber) : "",
          name: ep.name ?? "",
          runtime: ep.runtime != null ? String(ep.runtime) : "",
        }))
      )
      setTracks(
        (editItem.tracks ?? []).map((tr: any) => ({
          trackNumber: tr.trackNumber,
          discNumber: tr.discNumber ?? 1,
          titlePrimary: tr.titlePrimary ?? "",
          artistName: tr.artistName ?? "",
          duration: tr.duration != null ? String(tr.duration) : "",
        }))
      )

      setCustomFields(
        Array.isArray(editItem.customFields)
          ? editItem.customFields.map((cf: any) => ({
              label: cf.label ?? "",
              type: cf.type ?? "text",
              value: Array.isArray(cf.value) ? cf.value.join(", ") : String(cf.value ?? ""),
            }))
          : []
      )

      setCoverImage(editItem.coverImage ?? "")
      setBannerImage(editItem.bannerImage ?? "")
      const gal = Array.isArray(editItem.images)
        ? editItem.images
        : editItem.images?.gallery ?? []
      setGalleryImages(
        (gal as any[]).map((x) => (typeof x === "string" ? x : x?.url)).filter(Boolean)
      )
      setTrailerUrls(
        Array.isArray(editItem.trailers)
          ? editItem.trailers.map((t: any) => (typeof t === "string" ? t : t?.url || t?.site)).filter(Boolean)
          : []
      )
      setSiteUrl(editItem.siteUrl ?? "")
      setPreviewLink(editItem.previewLink ?? "")
      setInfoLink(editItem.infoLink ?? "")
      setBuyLink(editItem.buyLink ?? "")
      setIsPublished(Boolean(editItem.isPublished))

      const pf = Array.isArray(editItem.progressFields) && editItem.progressFields.length > 0
        ? editItem.progressFields.map((f: any) => ({
            key: f.key,
            label: f.label,
            unit: f.unit ?? "",
            max: f.max != null ? String(f.max) : "",
          }))
        : [{ key: "progress", label: "Progress", unit: "Units", max: "" }]
      setProgressFields(pf)
      setIncrementFieldKey(editItem.incrementFieldKey ?? pf[0]!.key)
    } else {
      // Reset for Create mode
      setTitlePrimary("")
      setTitleSecondary("")
      setTitleNative("")
      setSynonyms([])
      setTagline("")
      setDescription("")
      setHashtag("")
      setFormatPreset("other")
      setCustomFormat("")
      setStatus("UNKNOWN")
      setSource("")
      setStartYear("")
      setStartMonth("")
      setStartDay("")
      setEndYear("")
      setEndMonth("")
      setEndDay("")
      setSeasonSeason("UNKNOWN")
      setSeasonYear("")
      setShowType("")
      setBroadcastTime("")
      setBroadcastDays([])
      setNetworks([])
      setNextAiringEp("")
      setNextAiringAt("")
      setGenres([])
      setTags([])
      setCountryOfOrigin("")
      setOriginalLanguage("")
      setLanguages([])
      setIsAdult(false)
      setAgeRating("")
      setAgeRatingGuide("")
      setEsrbRating("")
      setPegiRating("")
      setEpisodeCount("")
      setEpisodeDuration("")
      setSeasonCount("")
      setChapterCount("")
      setVolumeCount("")
      setPageCount("")
      setRuntime("")
      setDuration("")
      setTotalTracks("")
      setAuthors([])
      setDevelopers([])
      setPublishers([])
      setPlatforms([])
      setFranchise("")
      setSeries("")
      setSeriesPosition("")
      setSubjects([])
      setGameModes([])
      setPlayerPerspectives([])
      setControllerSupport("")
      setBudget("")
      setRevenue("")
      setAwards([])
      setIsbn10("")
      setIsbn13("")
      setRetailPrice("")
      setRetailPriceCurrency("")
      setAlbumType("")
      setLabel("")
      setArtist("")
      setArtists([])
      setBpm("")
      setGain("")
      setExplicitLyrics(false)
      setAudioPreviewUrl("")
      setIsrc("")
      setLyrics("")
      setSyncedLyrics("")
      setCharacters([])
      setStaff([])
      setStudios([])
      setRelations([])
      setSeasons([])
      setEpisodes([])
      setTracks([])
      setCustomFields([])
      setCoverImage("")
      setBannerImage("")
      setGalleryImages([])
      setTrailerUrls([])
      setSiteUrl("")
      setPreviewLink("")
      setInfoLink("")
      setBuyLink("")
      setIsPublished(false)
      setProgressFields([
        { key: "progress", label: "Progress", unit: "Units", max: "" },
      ])
      setIncrementFieldKey("progress")
    }
  }, [isOpen, editItem])

  const handleUpload = async (
    file: File | undefined,
    type: "cover" | "banner" | "gallery"
  ) => {
    if (!file) return
    setUploadingType(type)
    try {
      const res = await (elysia.borealis as any).other.upload.post({ file, type })
      if (res.error || !res.data?.url) {
        toast.error((res.error as any)?.value?.message || "Upload failed")
        return
      }
      if (type === "cover") setCoverImage(res.data.url)
      else if (type === "banner") setBannerImage(res.data.url)
      else setGalleryImages((prev) => [...prev, res.data.url])
      toast.success("Image uploaded")
    } catch {
      toast.error("Failed to upload image")
    } finally {
      setUploadingType(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titlePrimary.trim()) {
      toast.error("Primary title is required")
      setActiveTab("core")
      setMobileShowDetail(true)
      return
    }
    const validProgress = progressFields
      .map((f) => ({
        key: f.key.trim(),
        label: f.label.trim() || f.key.trim(),
        unit: f.unit.trim() || undefined,
        max: toNumOrNull(f.max) ?? undefined,
      }))
      .filter((f) => f.key.length > 0)

    if (validProgress.length === 0) {
      toast.error("At least 1 progress field is required")
      setActiveTab("artwork")
      setMobileShowDetail(true)
      return
    }

    const finalIncKey = validProgress.some((f) => f.key === incrementFieldKey)
      ? incrementFieldKey
      : validProgress[0]!.key

    const resolvedFormat =
      formatPreset === "__custom__"
        ? customFormat.trim() || "other"
        : formatPreset

    const payload: Record<string, any> = {
      titlePrimary: titlePrimary.trim(),
      titleSecondary: titleSecondary.trim() || null,
      titleNative: titleNative.trim() || null,
      synonyms,
      tagline: tagline.trim() || null,
      description: description.trim() || null,
      hashtag: hashtag.trim() || null,
      format: resolvedFormat,
      source: source.trim() || null,
      status,
      startDateYear: toNumOrNull(startYear),
      startDateMonth: toNumOrNull(startMonth),
      startDateDay: toNumOrNull(startDay),
      endDateYear: toNumOrNull(endYear),
      endDateMonth: toNumOrNull(endMonth),
      endDateDay: toNumOrNull(endDay),
      seasonSeason: seasonSeason !== "UNKNOWN" ? seasonSeason : null,
      seasonYear: toNumOrNull(seasonYear),
      showType: showType.trim() || null,
      broadcastTime: broadcastTime.trim() || null,
      broadcastDays,
      networks,
      nextAiringEpisodeNumber: toNumOrNull(nextAiringEp),
      nextAiringAt: nextAiringAt ? new Date(nextAiringAt).toISOString() : null,
      genres,
      tags,
      countryOfOrigin: countryOfOrigin.trim() || null,
      originalLanguage: originalLanguage.trim() || null,
      languages,
      isAdult,
      ageRating: ageRating.trim() || null,
      ageRatingGuide: ageRatingGuide.trim() || null,
      esrbRating: esrbRating.trim() || null,
      pegiRating: pegiRating.trim() || null,
      episodeCount: toNumOrNull(episodeCount),
      episodeDuration: toNumOrNull(episodeDuration),
      seasonCount: toNumOrNull(seasonCount),
      chapterCount: toNumOrNull(chapterCount),
      volumeCount: toNumOrNull(volumeCount),
      pageCount: toNumOrNull(pageCount),
      runtime: toNumOrNull(runtime),
      duration: toNumOrNull(duration),
      totalTracks: toNumOrNull(totalTracks),
      authors,
      developers,
      publishers,
      platforms,
      franchise: franchise.trim() || null,
      series: series.trim() || null,
      seriesPosition: toNumOrNull(seriesPosition),
      subjects,
      gameModes,
      playerPerspectives,
      controllerSupport: controllerSupport.trim() || null,
      budget: toNumOrNull(budget),
      revenue: toNumOrNull(revenue),
      awards,
      isbn10: isbn10.trim() || null,
      isbn13: isbn13.trim() || null,
      retailPrice: toNumOrNull(retailPrice),
      retailPriceCurrency: retailPriceCurrency.trim() || null,
      albumType: albumType.trim() || null,
      label: label.trim() || null,
      artist: artist.trim() || null,
      artists,
      bpm: toNumOrNull(bpm),
      gain: toNumOrNull(gain),
      explicitLyrics,
      audioPreviewUrl: audioPreviewUrl.trim() || null,
      isrc: isrc.trim() || null,
      lyrics: lyrics || null,
      syncedLyrics: syncedLyrics || null,
      characters: characters.map((c, idx) => ({
        characterId: c.characterId,
        actorId: c.actorId ?? null,
        role: c.role,
        order: idx,
      })),
      staff: staff.map((s) => ({
        personId: s.personId,
        role: s.role,
        customRole: s.customRole?.trim() || null,
      })),
      studios: studios.map((s) => ({
        studioId: s.studioId,
        isMain: s.isMain,
      })),
      relations: relations.map((r) => ({
        targetType: r.targetType,
        targetId: r.targetId,
        relationType: r.relationType,
      })),
      seasons: seasons.map((s) => ({
        seasonNumber: s.seasonNumber,
        name: s.name.trim() || null,
        episodeCount: toNumOrNull(s.episodeCount),
      })),
      episodes: episodes.map((ep) => ({
        episodeNumber: ep.episodeNumber,
        seasonNumber: toNumOrNull(ep.seasonNumber),
        name: ep.name.trim() || null,
        runtime: toNumOrNull(ep.runtime),
      })),
      tracks: tracks.map((tr) => ({
        trackNumber: tr.trackNumber,
        discNumber: tr.discNumber || 1,
        titlePrimary: tr.titlePrimary.trim() || `Track ${tr.trackNumber}`,
        artistName: tr.artistName.trim() || null,
        duration: toNumOrNull(tr.duration),
      })),
      customFields: customFields
        .filter((cf) => cf.label.trim() && cf.value.trim())
        .map((cf) => ({
          label: cf.label.trim(),
          type: cf.type,
          value:
            cf.type === "badges"
              ? cf.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : cf.value.trim(),
        })),
      coverImage: coverImage.trim() || null,
      bannerImage: bannerImage.trim() || null,
      images: galleryImages.length > 0 ? { gallery: galleryImages } : null,
      trailers:
        trailerUrls.length > 0
          ? trailerUrls.map((u) => ({ url: u, name: "Trailer" }))
          : null,
      siteUrl: siteUrl.trim() || null,
      previewLink: previewLink.trim() || null,
      infoLink: infoLink.trim() || null,
      buyLink: buyLink.trim() || null,
      isPublished,
      progressFields: validProgress,
      incrementFieldKey: finalIncKey,
    }

    setSubmitting(true)
    try {
      const res = isEdit
        ? await (elysia.borealis as any)
            .other({ otherId: editItem.id })
            .patch(payload)
        : await (elysia.borealis as any).other.post(payload)

      if (res.error || !res.data?.success) {
        toast.error(
          (res.error as any)?.value?.message ||
            `Failed to ${isEdit ? "update" : "create"} item`
        )
        return
      }
      toast.success(
        isEdit ? "Other item updated" : "Other item created"
      )
      onSuccess?.(res.data.media)
      onOpenChange(false)
    } catch {
      toast.error("Request failed")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!isEdit) return
    setSubmitting(true)
    try {
      const res = await (elysia.borealis as any)
        .other({ otherId: editItem.id })
        .delete()
      if (res.error || !res.data?.success) {
        toast.error(
          (res.error as any)?.value?.message || "Cannot delete this item"
        )
        return
      }
      toast.success("Item deleted")
      onOpenChange(false)
      onDeleted?.()
    } catch {
      toast.error("Failed to delete item")
    } finally {
      setSubmitting(false)
    }
  }

  const activeNavMeta = SIDEBAR_GROUPS.flatMap((g) => g.items).find(
    (i) => i.key === activeTab
  )

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      showCloseButton={false}
      isDismissable={false}
      aria-label={isEdit ? "Edit Other Item" : "Create Other Item"}
      className="inset-0 top-0 left-0 h-full max-h-none w-full max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none p-0 sm:fixed sm:inset-auto sm:start-1/2 sm:top-1/2 sm:h-[90vh] sm:max-h-[90vh] sm:w-[85vw] sm:max-w-[85vw] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl [&>[data-slot=dialog]]:flex [&>[data-slot=dialog]]:h-full [&>[data-slot=dialog]]:min-h-0 [&>[data-slot=dialog]]:flex-col [&>[data-slot=dialog]]:overflow-hidden"
    >
      <form
        onSubmit={handleSubmit}
        className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background"
      >
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left Navigation Sidebar */}
          <aside
            className={cn(
              "flex w-full shrink-0 flex-col border-e border-border/60 bg-muted/25 sm:w-64 lg:w-72",
              mobileShowDetail ? "hidden sm:flex" : "flex"
            )}
          >
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <IconCategory className="size-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {isEdit ? "Edit Other Item" : "Create Other Item"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    All-in-one customizable media
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 sm:hidden"
                onClick={() => onOpenChange(false)}
                aria-label="Close modal"
              >
                <IconX className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3">
              {SIDEBAR_GROUPS.map((group) => (
                <div key={group.title} className="mb-4 last:mb-0">
                  <div className="px-2.5 pb-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {group.title}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const isActive = activeTab === item.key
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.key)
                            setMobileShowDetail(true)
                          }}
                          className={cn(
                            "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-start text-xs font-medium transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon className="size-4 shrink-0" aria-hidden="true" />
                            <span>{item.label}</span>
                          </span>
                          <IconChevronRight
                            className="size-3.5 opacity-60 sm:hidden"
                            aria-hidden="true"
                          />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          {/* Right Content Pane */}
          <section
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-hidden",
              mobileShowDetail ? "flex" : "hidden sm:flex"
            )}
          >
            <header className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 sm:hidden"
                  onClick={() => setMobileShowDetail(false)}
                  aria-label="Back to sections"
                >
                  <IconArrowLeft className="size-4" aria-hidden="true" />
                </Button>
                <h3 className="text-sm font-semibold text-foreground">
                  {activeNavMeta?.label}
                </h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => onOpenChange(false)}
                aria-label="Close modal"
              >
                <IconX className="size-4" aria-hidden="true" />
              </Button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {activeTab === "core" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label className="text-xs font-medium">
                      Primary Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={titlePrimary}
                      onChange={(e) => setTitlePrimary(e.target.value)}
                      placeholder="e.g. Solo Leveling, Custom Campaign, Webnovel..."
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Secondary / English Title</Label>
                    <Input
                      value={titleSecondary}
                      onChange={(e) => setTitleSecondary(e.target.value)}
                      placeholder="Alternative or localized title"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Native Title</Label>
                    <Input
                      value={titleNative}
                      onChange={(e) => setTitleNative(e.target.value)}
                      placeholder="Original script title"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Format</Label>
                    <Select
                      selectedKey={formatPreset}
                      onSelectionChange={(k) => setFormatPreset(String(k))}
                      aria-label="Format"
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FORMAT_PRESETS.map((fmt) => (
                          <SelectItem key={fmt} id={fmt}>
                            {fmt.replace(/_/g, " ").toUpperCase()}
                          </SelectItem>
                        ))}
                        <SelectItem id="__custom__">CUSTOM...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formatPreset === "__custom__" && (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium">Custom Format Name</Label>
                      <Input
                        value={customFormat}
                        onChange={(e) => setCustomFormat(e.target.value)}
                        placeholder="e.g. audio_drama"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Release Status</Label>
                    <Select
                      selectedKey={status}
                      onSelectionChange={(k) => setStatus(String(k))}
                      aria-label="Release Status"
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDIA_STATUSES.map((st) => (
                          <SelectItem key={st.id} id={st.id}>
                            {st.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Source</Label>
                    <Input
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="e.g. ORIGINAL, NOVEL, GAME, WEB"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Tagline</Label>
                    <Input
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="Short hook or subtitle"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Hashtag</Label>
                    <Input
                      value={hashtag}
                      onChange={(e) => setHashtag(e.target.value)}
                      placeholder="#customtag"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <ChipInput
                      label="Synonyms"
                      values={synonyms}
                      onChange={setSynonyms}
                      placeholder="Add alternate titles..."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label className="text-xs font-medium">Description / Synopsis</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      placeholder="Describe this item..."
                    />
                  </div>
                </div>
              )}

              {activeTab === "dates" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Start Year</Label>
                    <Input type="number" value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="YYYY" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Start Month</Label>
                    <Input type="number" min={1} max={12} value={startMonth} onChange={(e) => setStartMonth(e.target.value)} placeholder="1-12" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Start Day</Label>
                    <Input type="number" min={1} max={31} value={startDay} onChange={(e) => setStartDay(e.target.value)} placeholder="1-31" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">End Year</Label>
                    <Input type="number" value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="YYYY" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">End Month</Label>
                    <Input type="number" min={1} max={12} value={endMonth} onChange={(e) => setEndMonth(e.target.value)} placeholder="1-12" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">End Day</Label>
                    <Input type="number" min={1} max={31} value={endDay} onChange={(e) => setEndDay(e.target.value)} placeholder="1-31" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Release Season</Label>
                    <Select
                      selectedKey={seasonSeason}
                      onSelectionChange={(k) => setSeasonSeason(String(k))}
                      aria-label="Release Season"
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEASONS.map((s) => (
                          <SelectItem key={s} id={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Season Year</Label>
                    <Input type="number" value={seasonYear} onChange={(e) => setSeasonYear(e.target.value)} placeholder="YYYY" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Show / Series Type</Label>
                    <Input value={showType} onChange={(e) => setShowType(e.target.value)} placeholder="Scripted, Anthology, Documentary..." />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Broadcast Time</Label>
                    <Input value={broadcastTime} onChange={(e) => setBroadcastTime(e.target.value)} placeholder="21:00 JST" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Next Airing Episode #</Label>
                    <Input type="number" min={1} value={nextAiringEp} onChange={(e) => setNextAiringEp(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Next Airing Date & Time</Label>
                    <Input type="datetime-local" value={nextAiringAt} onChange={(e) => setNextAiringAt(e.target.value)} />
                  </div>
                  <div className="md:col-span-3">
                    <ChipInput label="Broadcast Days" values={broadcastDays} onChange={setBroadcastDays} placeholder="Monday, Friday..." />
                  </div>
                  <div className="md:col-span-3">
                    <ChipInput label="Networks / Channels" values={networks} onChange={setNetworks} placeholder="YouTube, NHK, HBO..." />
                  </div>
                </div>
              )}

              {activeTab === "classification" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <ChipInput
                      label="Genres (pick existing or type new)"
                      values={genres}
                      onChange={setGenres}
                      suggestions={taxonomyGenres}
                      placeholder="Action, Productivity, Self-Improvement..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <ChipInput
                      label="Tags (pick existing or type new)"
                      values={tags}
                      onChange={setTags}
                      suggestions={taxonomyTags}
                      placeholder="Solo, Co-op, Weekly..."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Country of Origin (ISO)</Label>
                    <Input value={countryOfOrigin} onChange={(e) => setCountryOfOrigin(e.target.value)} placeholder="US, JP, KR..." />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Original Language</Label>
                    <Input value={originalLanguage} onChange={(e) => setOriginalLanguage(e.target.value)} placeholder="en, ja, ko..." />
                  </div>
                  <div className="md:col-span-2">
                    <ChipInput label="Available Languages" values={languages} onChange={setLanguages} placeholder="English, Japanese..." />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/60 px-3.5 py-2.5 md:col-span-2">
                    <div>
                      <p className="text-xs font-medium">Adult / 18+ Content</p>
                      <p className="text-[11px] text-muted-foreground">Marks this item as NSFW / mature</p>
                    </div>
                    <Switch isSelected={isAdult} onChange={setIsAdult} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Age Rating</Label>
                    <Input value={ageRating} onChange={(e) => setAgeRating(e.target.value)} placeholder="PG-13, R, TV-MA..." />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Age Rating Guide</Label>
                    <Input value={ageRatingGuide} onChange={(e) => setAgeRatingGuide(e.target.value)} placeholder="Violence, Mild Language..." />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">ESRB Rating</Label>
                    <Input value={esrbRating} onChange={(e) => setEsrbRating(e.target.value)} placeholder="E, T, M..." />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">PEGI Rating</Label>
                    <Input value={pegiRating} onChange={(e) => setPegiRating(e.target.value)} placeholder="PEGI 12, PEGI 18..." />
                  </div>
                </div>
              )}

              {activeTab === "details" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h4 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Counts & Durations
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <InputField label="Episodes" value={episodeCount} onChange={setEpisodeCount} type="number" />
                      <InputField label="Ep. Duration (min)" value={episodeDuration} onChange={setEpisodeDuration} type="number" />
                      <InputField label="Seasons" value={seasonCount} onChange={setSeasonCount} type="number" />
                      <InputField label="Chapters" value={chapterCount} onChange={setChapterCount} type="number" />
                      <InputField label="Volumes" value={volumeCount} onChange={setVolumeCount} type="number" />
                      <InputField label="Pages" value={pageCount} onChange={setPageCount} type="number" />
                      <InputField label="Runtime (min)" value={runtime} onChange={setRuntime} type="number" />
                      <InputField label="Audio Duration (sec)" value={duration} onChange={setDuration} type="number" />
                      <InputField label="Total Tracks" value={totalTracks} onChange={setTotalTracks} type="number" />
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Creators, Companies & Platforms
                    </h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <ChipInput label="Authors" values={authors} onChange={setAuthors} />
                      <ChipInput label="Developers" values={developers} onChange={setDevelopers} />
                      <ChipInput label="Publishers" values={publishers} onChange={setPublishers} />
                      <ChipInput label="Platforms" values={platforms} onChange={setPlatforms} />
                      <InputField label="Franchise" value={franchise} onChange={setFranchise} />
                      <InputField label="Series" value={series} onChange={setSeries} />
                      <InputField label="Series Position" value={seriesPosition} onChange={setSeriesPosition} type="number" />
                      <InputField label="Controller Support" value={controllerSupport} onChange={setControllerSupport} />
                      <ChipInput label="Subjects" values={subjects} onChange={setSubjects} />
                      <ChipInput label="Game Modes" values={gameModes} onChange={setGameModes} />
                      <ChipInput label="Player Perspectives" values={playerPerspectives} onChange={setPlayerPerspectives} />
                      <ChipInput label="Awards" values={awards} onChange={setAwards} />
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Books, Financials & Music
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <InputField label="ISBN-10" value={isbn10} onChange={setIsbn10} />
                      <InputField label="ISBN-13" value={isbn13} onChange={setIsbn13} />
                      <InputField label="Retail Price" value={retailPrice} onChange={setRetailPrice} type="number" />
                      <InputField label="Currency" value={retailPriceCurrency} onChange={setRetailPriceCurrency} placeholder="USD" />
                      <InputField label="Budget" value={budget} onChange={setBudget} type="number" />
                      <InputField label="Revenue" value={revenue} onChange={setRevenue} type="number" />
                      <InputField label="Album Type" value={albumType} onChange={setAlbumType} placeholder="LP, EP, Single" />
                      <InputField label="Record Label" value={label} onChange={setLabel} />
                      <InputField label="Primary Artist" value={artist} onChange={setArtist} />
                      <InputField label="BPM" value={bpm} onChange={setBpm} type="number" />
                      <InputField label="Gain" value={gain} onChange={setGain} type="number" />
                      <InputField label="ISRC" value={isrc} onChange={setIsrc} />
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      <ChipInput label="Artists" values={artists} onChange={setArtists} />
                      <InputField label="Audio Preview URL" value={audioPreviewUrl} onChange={setAudioPreviewUrl} />
                      <div className="flex items-center justify-between rounded-xl border border-border/60 px-3.5 py-2">
                        <span className="text-xs font-medium">Explicit Lyrics</span>
                        <Switch isSelected={explicitLyrics} onChange={setExplicitLyrics} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium">Lyrics (Plain)</Label>
                        <Textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} rows={3} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium">Synced Lyrics (LRC)</Label>
                        <Textarea value={syncedLyrics} onChange={(e) => setSyncedLyrics(e.target.value)} rows={3} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "credits" && (
                <OneWayCreditsPickers
                  characters={characters}
                  setCharacters={setCharacters}
                  staff={staff}
                  setStaff={setStaff}
                  studios={studios}
                  setStudios={setStudios}
                  relations={relations}
                  setRelations={setRelations}
                />
              )}

              {activeTab === "subitems" && (
                <div className="flex flex-col gap-6">
                  {/* Seasons */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Seasons</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          setSeasons((prev) => [
                            ...prev,
                            { seasonNumber: prev.length + 1, name: "", episodeCount: "" },
                          ])
                        }
                      >
                        <IconPlus className="me-1 size-3.5" aria-hidden="true" />
                        Add Season
                      </Button>
                    </div>
                    {seasons.map((s, idx) => (
                      <div key={idx} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-border/50 p-2">
                        <Input
                          type="number"
                          className="col-span-2 h-8 text-xs"
                          value={s.seasonNumber}
                          onChange={(e) =>
                            setSeasons((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, seasonNumber: Number(e.target.value) || 1 } : x))
                            )
                          }
                          placeholder="#"
                        />
                        <Input
                          className="col-span-6 h-8 text-xs"
                          value={s.name}
                          onChange={(e) =>
                            setSeasons((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                            )
                          }
                          placeholder="Season name"
                        />
                        <Input
                          type="number"
                          className="col-span-3 h-8 text-xs"
                          value={s.episodeCount}
                          onChange={(e) =>
                            setSeasons((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, episodeCount: e.target.value } : x))
                            )
                          }
                          placeholder="Episodes"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="col-span-1 size-7 text-destructive"
                          onClick={() => setSeasons((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <IconTrash className="size-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Episodes */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Episodes</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          setEpisodes((prev) => [
                            ...prev,
                            { episodeNumber: prev.length + 1, seasonNumber: "1", name: "", runtime: "" },
                          ])
                        }
                      >
                        <IconPlus className="me-1 size-3.5" aria-hidden="true" />
                        Add Episode
                      </Button>
                    </div>
                    {episodes.map((ep, idx) => (
                      <div key={idx} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-border/50 p-2">
                        <Input
                          type="number"
                          className="col-span-2 h-8 text-xs"
                          value={ep.seasonNumber}
                          onChange={(e) =>
                            setEpisodes((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, seasonNumber: e.target.value } : x))
                            )
                          }
                          placeholder="S#"
                        />
                        <Input
                          type="number"
                          className="col-span-2 h-8 text-xs"
                          value={ep.episodeNumber}
                          onChange={(e) =>
                            setEpisodes((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, episodeNumber: Number(e.target.value) || 1 } : x))
                            )
                          }
                          placeholder="Ep#"
                        />
                        <Input
                          className="col-span-5 h-8 text-xs"
                          value={ep.name}
                          onChange={(e) =>
                            setEpisodes((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                            )
                          }
                          placeholder="Episode title"
                        />
                        <Input
                          type="number"
                          className="col-span-2 h-8 text-xs"
                          value={ep.runtime}
                          onChange={(e) =>
                            setEpisodes((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, runtime: e.target.value } : x))
                            )
                          }
                          placeholder="Min"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="col-span-1 size-7 text-destructive"
                          onClick={() => setEpisodes((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <IconTrash className="size-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Tracks */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Audio Tracks</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          setTracks((prev) => [
                            ...prev,
                            { trackNumber: prev.length + 1, discNumber: 1, titlePrimary: "", artistName: "", duration: "" },
                          ])
                        }
                      >
                        <IconPlus className="me-1 size-3.5" aria-hidden="true" />
                        Add Track
                      </Button>
                    </div>
                    {tracks.map((tr, idx) => (
                      <div key={idx} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-border/50 p-2">
                        <Input
                          type="number"
                          className="col-span-2 h-8 text-xs"
                          value={tr.trackNumber}
                          onChange={(e) =>
                            setTracks((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, trackNumber: Number(e.target.value) || 1 } : x))
                            )
                          }
                          placeholder="#"
                        />
                        <Input
                          className="col-span-4 h-8 text-xs"
                          value={tr.titlePrimary}
                          onChange={(e) =>
                            setTracks((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, titlePrimary: e.target.value } : x))
                            )
                          }
                          placeholder="Track title"
                        />
                        <Input
                          className="col-span-3 h-8 text-xs"
                          value={tr.artistName}
                          onChange={(e) =>
                            setTracks((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, artistName: e.target.value } : x))
                            )
                          }
                          placeholder="Artist"
                        />
                        <Input
                          type="number"
                          className="col-span-2 h-8 text-xs"
                          value={tr.duration}
                          onChange={(e) =>
                            setTracks((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, duration: e.target.value } : x))
                            )
                          }
                          placeholder="Sec"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="col-span-1 size-7 text-destructive"
                          onClick={() => setTracks((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <IconTrash className="size-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "custom" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold">Custom Metadata Fields</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Shown in the Custom Information sidebar card on the detail page.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() =>
                        setCustomFields((prev) => [
                          ...prev,
                          { label: "", type: "text", value: "" },
                        ])
                      }
                    >
                      <IconPlus className="me-1 size-3.5" aria-hidden="true" />
                      Add Field
                    </Button>
                  </div>
                  {customFields.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                      No custom fields added yet.
                    </div>
                  )}
                  {customFields.map((cf, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 gap-2 rounded-xl border border-border/60 p-3 sm:grid-cols-12"
                    >
                      <Input
                        className="h-8 text-xs sm:col-span-4"
                        value={cf.label}
                        onChange={(e) =>
                          setCustomFields((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x))
                          )
                        }
                        placeholder="Label (e.g. Difficulty)"
                      />
                      <Select
                        selectedKey={cf.type}
                        onSelectionChange={(k) =>
                          setCustomFields((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, type: String(k) as any } : x))
                          )
                        }
                        aria-label="Field type"
                        className="sm:col-span-3"
                      >
                        <SelectTrigger className="h-8 w-full text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem id="text">Text</SelectItem>
                          <SelectItem id="link">Link URL</SelectItem>
                          <SelectItem id="badges">Badges (comma-sep)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        className="h-8 text-xs sm:col-span-4"
                        value={cf.value}
                        onChange={(e) =>
                          setCustomFields((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, value: e.target.value } : x))
                          )
                        }
                        placeholder={cf.type === "badges" ? "Tag 1, Tag 2" : "Value..."}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive sm:col-span-1"
                        onClick={() =>
                          setCustomFields((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        <IconTrash className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "artwork" && (
                <div className="flex flex-col gap-6">
                  {/* Live Card Preview + Cover/Banner */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <div className="flex flex-col gap-3 lg:col-span-8">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium">Cover Image URL</Label>
                        <div className="flex gap-2">
                          <Input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." />
                          <input
                            ref={coverFileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleUpload(e.target.files?.[0], "cover")}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingType !== null}
                            onClick={() => coverFileRef.current?.click()}
                          >
                            <IconUpload className="me-1 size-3.5" aria-hidden="true" />
                            Upload
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium">Banner Image URL</Label>
                        <div className="flex gap-2">
                          <Input value={bannerImage} onChange={(e) => setBannerImage(e.target.value)} placeholder="https://..." />
                          <input
                            ref={bannerFileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleUpload(e.target.files?.[0], "banner")}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingType !== null}
                            onClick={() => bannerFileRef.current?.click()}
                          >
                            <IconUpload className="me-1 size-3.5" aria-hidden="true" />
                            Upload
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">Gallery Images</Label>
                          <input
                            ref={galleryFileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleUpload(e.target.files?.[0], "gallery")}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={uploadingType !== null}
                            onClick={() => galleryFileRef.current?.click()}
                          >
                            <IconUpload className="me-1 size-3.5" aria-hidden="true" />
                            Upload Gallery
                          </Button>
                        </div>
                        <ChipInput
                          label=""
                          values={galleryImages}
                          onChange={setGalleryImages}
                          placeholder="Paste image URL and press Enter..."
                        />
                      </div>
                    </div>

                    {/* Live Compact Card Preview */}
                    <div className="flex flex-col gap-1.5 lg:col-span-4">
                      <Label className="text-xs font-medium">Card Preview</Label>
                      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                        <div className="relative aspect-[2/3] w-full bg-muted">
                          {coverImage ? (
                            <img src={coverImage} alt="Preview" className="size-full object-cover" />
                          ) : (
                            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                              No Cover
                            </div>
                          )}
                          <div className="absolute start-2 top-2 flex gap-1">
                            <Badge variant="secondary" className="text-[10px] uppercase">
                              {formatPreset === "__custom__" ? customFormat || "other" : formatPreset}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-2.5">
                          <p className="truncate text-xs font-semibold">
                            {titlePrimary.trim() || "Untitled Item"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {status} • {isPublished ? "Public" : "Private"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Links & Trailers */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InputField label="Official Website URL" value={siteUrl} onChange={setSiteUrl} />
                    <InputField label="Preview Link" value={previewLink} onChange={setPreviewLink} />
                    <InputField label="Info Link" value={infoLink} onChange={setInfoLink} />
                    <InputField label="Buy / Store Link" value={buyLink} onChange={setBuyLink} />
                    <div className="sm:col-span-2">
                      <ChipInput label="Trailer / Video URLs" values={trailerUrls} onChange={setTrailerUrls} placeholder="https://youtube.com/..." />
                    </div>
                  </div>

                  {/* Progress Fields Builder (Min 1 required) */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-semibold">
                          Progress Tracking Fields (min 1)
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Controls card progress units and HoverCard inputs.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          setProgressFields((prev) => [
                            ...prev,
                            {
                              key: `field_${prev.length + 1}`,
                              label: `Metric ${prev.length + 1}`,
                              unit: "Units",
                              max: "",
                            },
                          ])
                        }
                      >
                        <IconPlus className="me-1 size-3.5" aria-hidden="true" />
                        Add Metric
                      </Button>
                    </div>
                    {progressFields.map((pf, idx) => (
                      <div key={idx} className="grid grid-cols-12 items-center gap-2 rounded-xl border border-border/60 p-2.5">
                        <Input
                          className="col-span-3 h-8 text-xs"
                          value={pf.key}
                          onChange={(e) =>
                            setProgressFields((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, key: e.target.value } : x))
                            )
                          }
                          placeholder="Key"
                        />
                        <Input
                          className="col-span-3 h-8 text-xs"
                          value={pf.label}
                          onChange={(e) =>
                            setProgressFields((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x))
                            )
                          }
                          placeholder="Label"
                        />
                        <Input
                          className="col-span-2 h-8 text-xs"
                          value={pf.unit}
                          onChange={(e) =>
                            setProgressFields((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, unit: e.target.value } : x))
                            )
                          }
                          placeholder="Unit"
                        />
                        <Input
                          type="number"
                          className="col-span-2 h-8 text-xs"
                          value={pf.max}
                          onChange={(e) =>
                            setProgressFields((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, max: e.target.value } : x))
                            )
                          }
                          placeholder="Max"
                        />
                        <div className="col-span-2 flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setIncrementFieldKey(pf.key)}
                            className={cn(
                              "rounded px-1.5 py-1 text-[10px] font-medium",
                              incrementFieldKey === pf.key
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                            title="Primary card increment metric"
                          >
                            Primary
                          </button>
                          {progressFields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive"
                              onClick={() =>
                                setProgressFields((prev) => prev.filter((_, i) => i !== idx))
                              }
                            >
                              <IconTrash className="size-3.5" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Public Visibility */}
                  <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold">Publish to Discover Catalog</p>
                      <p className="text-[11px] text-muted-foreground">
                        Public items appear in Discover and can be tracked by other users.
                      </p>
                    </div>
                    <Switch isSelected={isPublished} onChange={setIsPublished} />
                  </div>

                  {/* Delete Item (Edit Mode Only) */}
                  {isEdit && (
                    <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold text-destructive">Delete Custom Item</p>
                        <p className="text-[11px] text-muted-foreground">
                          Blocked if tracked, favorited, or custom-listed by other users.
                        </p>
                      </div>
                      {confirmDelete ? (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDelete(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={submitting}
                            onClick={handleDelete}
                          >
                            Confirm Delete
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setConfirmDelete(true)}
                        >
                          <IconTrash className="me-1 size-3.5" aria-hidden="true" />
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Pinned Footer */}
        <footer className="flex shrink-0 items-center justify-between border-t border-border/60 bg-muted/20 px-5 py-3.5">
          <span className="text-[11px] text-muted-foreground">
            {isEdit ? `Editing #${editItem.id}` : "Will be created in your Other catalog"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Item"}
            </Button>
          </div>
        </footer>
      </form>
    </Dialog>
  )
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-xs"
      />
    </div>
  )
}
