import type { BorealisBadge, BorealisNormalizedData } from "../types"
import { formatBytes, type ServarrApp } from "./servarr-client"

export type ServarrCardKind = "movie" | "series" | "collection" | "discover"

export interface NormalizeServarrCardOptions {
  app: ServarrApp
  kind: ServarrCardKind
  href?: string
  qualityProfileName?: string
  preferBanner?: boolean
}

function pickImageUrl(
  item: any,
  coverType: "poster" | "fanart" | "banner"
): string | null {
  if (coverType === "poster" && item?.posterUrl) return item.posterUrl
  if (coverType === "fanart" && item?.fanartUrl) return item.fanartUrl
  if (coverType === "banner" && item?.bannerUrl) return item.bannerUrl

  if (Array.isArray(item?.images)) {
    const match = item.images.find(
      (img: any) => img?.coverType?.toLowerCase() === coverType
    )
    if (match?.url) return match.url
    if (match?.remoteUrl) return match.remoteUrl
  }
  return item?.remotePoster || null
}

/**
 * Dedicated Servarr normalizer mapping Radarr v3 & Sonarr v5 entities
 * (`MovieResource`, `SeriesResource`, `CollectionResource`, Discover items)
 * into `BorealisNormalizedData` for `BorealisCard` / `BorealisCardExpanded`.
 */
export function normalizeServarrBorealisData(
  item: any,
  options: NormalizeServarrCardOptions
): BorealisNormalizedData {
  const { app, kind, preferBanner = false } = options
  const id = item?.id ?? item?.tmdbId ?? item?.tvdbId ?? item?.title ?? "unknown"

  const poster = pickImageUrl(item, "poster")
  const fanart = pickImageUrl(item, "fanart")
  const banner = pickImageUrl(item, "banner")
  const image = preferBanner ? banner || fanart || poster : poster || fanart

  const isCollection = kind === "collection"
  const isDiscover = kind === "discover"
  const isSeries = kind === "series"

  const defaultHref =
    options.href ??
    (isCollection || isDiscover
      ? `/borealis/servarr/${app}/${isCollection ? "collections" : "discover"}`
      : `/borealis/servarr/${app}/${id}`)

  const badges: BorealisBadge[] = []
  if (item?.monitored !== undefined) {
    badges.push({
      label: item.monitored ? "Monitored" : "Unmonitored",
      variant: item.monitored ? "default" : "secondary",
    })
  }

  const profileLabel =
    options.qualityProfileName ||
    item?.qualityProfile ||
    item?.qualityProfileName
  if (profileLabel) {
    badges.push({ label: profileLabel, variant: "outline" })
  }

  const epTotal =
    item?.episodeCount ??
    item?.statistics?.episodeCount ??
    item?.statistics?.totalEpisodeCount ??
    0
  const epFiles =
    item?.episodeFileCount ?? item?.statistics?.episodeFileCount ?? 0

  let progress: BorealisNormalizedData["progress"] = undefined
  if (isSeries && epTotal > 0) {
    progress = {
      current: epFiles,
      max: epTotal,
      unit: "eps",
    }
  } else if (kind === "movie") {
    const hasFile = Boolean(item?.hasFile)
    progress = {
      current: hasFile ? 1 : 0,
      max: 1,
      unit: hasFile ? "file" : "missing",
    }
  } else if (isCollection && Array.isArray(item?.movies)) {
    const total = item.movies.length
    const missing = item.missingMovies ?? 0
    const owned = Math.max(0, total - missing)
    if (total > 0) {
      progress = {
        current: owned,
        max: total,
        unit: "movies",
      }
    }
  }

  const sizeBytes = item?.sizeOnDisk ?? item?.statistics?.sizeOnDisk ?? 0
  const metaPills: string[] = []
  if (item?.year) metaPills.push(String(item.year))
  if (item?.network) metaPills.push(item.network)
  else if (item?.studio) metaPills.push(item.studio)
  if (sizeBytes > 0) metaPills.push(formatBytes(sizeBytes))

  const subtextParts: string[] = []
  if (item?.year) subtextParts.push(String(item.year))
  if (isSeries && epTotal > 0) {
    subtextParts.push(`${epFiles}/${epTotal} eps`)
  } else if (sizeBytes > 0) {
    subtextParts.push(formatBytes(sizeBytes))
  } else if (item?.status) {
    subtextParts.push(String(item.status))
  }

  const ratingValue =
    item?.ratings?.tmdb?.value ??
    item?.ratings?.imdb?.value ??
    item?.ratings?.value ??
    null

  return {
    id,
    type: isSeries ? "tv" : "movie",
    href: defaultHref,
    title: item?.title || "Untitled",
    titleNative: item?.originalTitle || undefined,
    description: item?.overview || undefined,
    image,
    aspectRatio: preferBanner ? "video" : "poster",
    badges,
    subtext: subtextParts.join(" · ") || undefined,
    metaPills: metaPills.length > 0 ? metaPills : undefined,
    progress,
    hoverDetails: {
      description: item?.overview || undefined,
      genres: Array.isArray(item?.genres) ? item.genres : undefined,
      score: typeof ratingValue === "number" ? ratingValue : undefined,
      year: item?.year || undefined,
      format: isSeries
        ? item?.seriesType?.toUpperCase()
        : item?.minimumAvailability || undefined,
      status: item?.status || undefined,
      episodes: isSeries ? epTotal || undefined : undefined,
      duration: item?.runtime ? `${item.runtime}m` : undefined,
      studios: item?.network
        ? [item.network]
        : item?.studio
          ? [item.studio]
          : undefined,
    },
    raw: item,
  }
}
