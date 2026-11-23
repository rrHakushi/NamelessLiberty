"use client"

import React, { useEffect, useMemo } from "react"
import {
  IconBriefcase,
  IconCalendarEvent,
  IconChartBar,
  IconClock,
  IconDisc,
  IconExternalLink,
  IconHash,
  IconHeartFilled,
  IconInfoCircle,
  IconLanguage,
  IconMicrophone,
  IconWorld,
} from "@tabler/icons-react"
import { Badge } from "@workspace/ui/components/badge"
import type { PersonDetails } from "@NamelessLiberty/elysia"
import { useUser } from "@/context/user-context"
import { getMediaPreferences } from "@NamelessLiberty/shared"
import { addBrowseVisitToStore } from "@NamelessLiberty/borealis/lib/browse-history"
import {
  BorealisCard,
  BorealisCardGroup,
  type BorealisEntityType,
} from "@NamelessLiberty/borealis"
import { GlassCard } from "../../glass-card"
import { FormattedDescription } from "../formatted-description"
import { FavoriteButton } from "../favorite-button"

interface PersonDetailViewProps {
  person: PersonDetails
}

interface MusicAlbumItem {
  id: number
  titlePrimary: string
  titleSecondary?: string | null
  titleNative?: string | null
  coverImage?: string | null
  description?: string | null
  status?: string | null
  albumType?: string | null
  releaseDateYear?: number | null
  listeners?: number | null
  playCount?: number | null
  popularity?: number | null
  favorites?: number | null
  genres: string[]
  role: string
}

interface MusicTrackItem {
  id: number
  titlePrimary: string
  titleSecondary?: string | null
  titleNative?: string | null
  coverImage?: string | null
  description?: string | null
  status?: string | null
  albumId?: number | null
  albumTitle?: string | null
  trackNumber?: number | null
  duration?: number | null
  releaseDateYear?: number | null
  listeners?: number | null
  playCount?: number | null
  popularity?: number | null
  favorites?: number | null
  genres: string[]
  role: string
}

function toBorealisEntityType(mediaType: string): BorealisEntityType {
  switch (mediaType.toUpperCase()) {
    case "ANIME":
      return "anime"
    case "MANGA":
      return "manga"
    case "MOVIE":
      return "movies"
    case "TV":
      return "tv"
    case "BOOK":
      return "books"
    case "MUSIC":
      return "music"
    default:
      return "anime"
  }
}

function formatMediaFormat(format?: string | null, mediaType?: string): string {
  if (!format) {
    if (!mediaType) return ""
    return mediaType.charAt(0).toUpperCase() + mediaType.slice(1).toLowerCase()
  }
  const f = format.toUpperCase()
  switch (f) {
    case "TV":
      return "TV"
    case "TV_SHORT":
      return "TV Short"
    case "MOVIE":
      return "Movie"
    case "SPECIAL":
      return "Special"
    case "OVA":
      return "OVA"
    case "ONA":
      return "ONA"
    case "MUSIC":
      return "Music"
    case "MANGA":
      return "Manga"
    case "NOVEL":
      return "Novel"
    case "LIGHT_NOVEL":
      return "Light Novel"
    case "ONE_SHOT":
      return "One Shot"
    case "DOUJINSHI":
      return "Doujinshi"
    default:
      return format
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
  }
}

function formatStaffRoleLabel(role: string): string {
  return role
    .replace(/_/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (
        word.length <= 3 &&
        word === word.toUpperCase() &&
        !/^[A-Z]$/.test(word)
      ) {
        return word
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(" ")
}

function formatPartialDate(
  year?: number | null,
  month?: number | null,
  day?: number | null
): string | null {
  if (!month && !day && !year) return null
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  const monthName = month ? months[month - 1] ?? "" : ""
  const dayStr = day ? `${day}` : ""
  const md = [monthName, dayStr].filter(Boolean).join(" ")
  if (md && year) return `${md}, ${year}`
  if (md) return md
  return year ? `${year}` : null
}

function formatSingleHeight(
  val?: { metric?: number | null; imperial?: string | null } | null
): string | null {
  if (!val) return null
  const metric = typeof val.metric === "number" ? `${val.metric} cm` : null
  const imperial = val.imperial?.trim() || null
  if (metric && imperial) return `${metric} (${imperial})`
  return metric || imperial
}

function formatHeight(
  height?: {
    initial?: { metric?: number | null; imperial?: string | null } | null
    min?: { metric?: number | null; imperial?: string | null } | null
    max?: { metric?: number | null; imperial?: string | null } | null
  } | null
): string | null {
  if (!height || typeof height !== "object") return null

  const { initial, min, max } = height
  if (initial && (initial.metric != null || initial.imperial)) {
    const formatted = formatSingleHeight(initial)
    return formatted ? `${formatted} (initial)` : null
  }

  const hasMin = Boolean(min && (min.metric != null || min.imperial))
  const hasMax = Boolean(max && (max.metric != null || max.imperial))

  if (hasMin && hasMax) {
    const sameMetric =
      min!.metric != null && max!.metric != null && min!.metric === max!.metric
    const sameImperial =
      min!.imperial != null &&
      max!.imperial != null &&
      min!.imperial.trim() === max!.imperial.trim()

    if (
      sameMetric ||
      (min!.metric == null && max!.metric == null && sameImperial)
    ) {
      return formatSingleHeight(min)
    }

    const metricRange =
      min!.metric != null && max!.metric != null
        ? `${min!.metric}–${max!.metric} cm`
        : min!.metric != null
          ? `${min!.metric} cm`
          : max!.metric != null
            ? `${max!.metric} cm`
            : null

    const minImp = min!.imperial?.trim() || null
    const maxImp = max!.imperial?.trim() || null
    const imperialRange =
      minImp && maxImp
        ? minImp === maxImp
          ? minImp
          : `${minImp}–${maxImp}`
        : minImp || maxImp

    if (metricRange && imperialRange) return `${metricRange} (${imperialRange})`
    return metricRange || imperialRange
  }

  if (hasMin) return formatSingleHeight(min)
  if (hasMax) return formatSingleHeight(max)
  return null
}

function extractGenreNames(genres: any): string[] {
  if (!Array.isArray(genres)) return []
  return genres
    .map((g: any) => (typeof g === "string" ? g : g?.name || g?.genre?.name || ""))
    .filter(Boolean)
}

export function PersonDetailView({ person }: PersonDetailViewProps) {
  const { user } = useUser()
  const titlePref = getMediaPreferences(user?.customization).title || "primary"

  // Track page visit in Browse recently visited
  useEffect(() => {
    if (!person?.id) return
    addBrowseVisitToStore("people", {
      id: person.id,
      title: person.namePrimary,
      titlePrimary: person.namePrimary,
      titleNative: person.nameNative,
      coverImage: person.image,
      description: person.description,
      gender: person.gender,
      age: person.age,
      format: person.language || "Person",
    })
  }, [
    person.id,
    person.namePrimary,
    person.nameNative,
    person.image,
    person.description,
    person.gender,
    person.age,
    person.language,
  ])

  const formattedHeight = useMemo(
    () => formatHeight(person.height),
    [person.height]
  )

  const formattedBirthday = useMemo(
    () =>
      formatPartialDate(
        person.dateOfBirthYear,
        person.dateOfBirthMonth,
        person.dateOfBirthDay
      ),
    [
      person.dateOfBirthYear,
      person.dateOfBirthMonth,
      person.dateOfBirthDay,
    ]
  )

  const formattedDeathDate = useMemo(
    () =>
      formatPartialDate(
        person.dateOfDeathYear,
        person.dateOfDeathMonth,
        person.dateOfDeathDay
      ),
    [
      person.dateOfDeathYear,
      person.dateOfDeathMonth,
      person.dateOfDeathDay,
    ]
  )

  // Deduplicate and merge voiced characters by characterId
  const deduplicatedVoicedRoles = useMemo(() => {
    const roleRank = (r: string) =>
      r?.toUpperCase() === "MAIN"
        ? 0
        : r?.toUpperCase() === "SUPPORTING"
          ? 1
          : 2

    const map = new Map<
      number,
      {
        key: string
        characterId: number
        characterNamePrimary: string
        characterNameNative: string | null
        characterImage: string | null
        characterDescription: string | null
        characterGender: string | null
        characterAge: string | null
        characterFavorites: number | null
        role: string
        order: number | null
        appearances: Array<{
          id: number
          mediaType: "ANIME" | "MOVIE" | "TV" | "BOOK"
          titlePrimary: string
          titleSecondary?: string | null
          titleNative?: string | null
          coverImage?: string | null
          format?: string | null
          year?: number | null
        }>
      }
    >()

    person.voicedCharacters.forEach((vc) => {
      if (!vc.character) return
      const type = vc.mediaType.toUpperCase() as
        | "ANIME"
        | "MOVIE"
        | "TV"
        | "BOOK"

      const mediaObj = vc.anime || vc.movie || vc.tv || vc.book
      const mediaTitle =
        mediaObj?.titlePrimary || `${vc.mediaType} #${vc.mediaId}`
      const mediaSecondary = mediaObj?.titleSecondary ?? null
      const mediaNative = (mediaObj as any)?.titleNative ?? null
      const mediaCover = mediaObj?.coverImage ?? null
      const mediaYear =
        vc.anime?.seasonYear ||
        vc.anime?.startDateYear ||
        vc.movie?.releaseDateYear ||
        vc.tv?.firstAiredYear ||
        vc.book?.releaseDateYear ||
        null
      const mediaFormat =
        vc.anime?.format ||
        (vc.tv ? vc.tv.showType || "TV" : null) ||
        vc.book?.format ||
        (vc.movie ? "MOVIE" : null)

      const appearanceEntry = {
        id: vc.mediaId,
        mediaType: type,
        titlePrimary: mediaTitle,
        titleSecondary: mediaSecondary,
        titleNative: mediaNative,
        coverImage: mediaCover,
        format: formatMediaFormat(mediaFormat, type),
        year: mediaYear,
      }

      let existing = map.get(vc.character.id)
      if (!existing) {
        existing = {
          key: `char-${vc.character.id}`,
          characterId: vc.character.id,
          characterNamePrimary: vc.character.namePrimary,
          characterNameNative: vc.character.nameNative ?? null,
          characterImage: vc.character.image ?? null,
          characterDescription: vc.character.description ?? null,
          characterGender: vc.character.gender ?? null,
          characterAge: vc.character.age ?? null,
          characterFavorites: vc.character.favorites ?? null,
          role: vc.role,
          order: vc.order ?? null,
          appearances: [appearanceEntry],
        }
        map.set(vc.character.id, existing)
      } else {
        if (roleRank(vc.role) < roleRank(existing.role)) {
          existing.role = vc.role
        }
        if (
          vc.order !== null &&
          vc.order !== undefined &&
          (existing.order === null || vc.order < existing.order)
        ) {
          existing.order = vc.order
        }
        const alreadyHasMedia = existing.appearances.some(
          (a) => a.mediaType === type && a.id === vc.mediaId
        )
        if (!alreadyHasMedia) {
          existing.appearances.push(appearanceEntry)
        }
      }
    })

    const list = Array.from(map.values())
    for (const item of list) {
      item.appearances.sort((a, b) => {
        if (a.year && b.year && a.year !== b.year) return a.year - b.year
        if (a.year && !b.year) return -1
        if (!a.year && b.year) return 1
        return a.titlePrimary.localeCompare(b.titlePrimary)
      })
    }

    return list.sort((a, b) => {
      const rDiff = roleRank(a.role) - roleRank(b.role)
      if (rDiff !== 0) return rDiff
      return (a.order ?? 999) - (b.order ?? 999)
    })
  }, [person.voicedCharacters])

  // Deduplicate and combine roles per unique media for Production Staff credits
  const deduplicatedStaffRoles = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string
        mediaType: "ANIME" | "MANGA" | "MOVIE" | "TV" | "BOOK"
        mediaId: number
        roles: string[]
        mediaTitle: string
        mediaTitleSecondary?: string | null
        mediaTitleNative?: string | null
        mediaCover?: string | null
        mediaBanner?: string | null
        mediaDescription?: string | null
        mediaStatus?: string | null
        mediaYear?: number | null
        mediaScore?: number | null
        mediaFormat?: string | null
        episodeCount?: number | null
        chapterCount?: number | null
        volumeCount?: number | null
        popularity?: number | null
        favorites?: number | null
        genres: string[]
      }
    >()

    person.mediaStaff.forEach((ms) => {
      if (ms.mediaType === "MUSIC_ALBUM" || ms.mediaType === "MUSIC_TRACK") {
        return
      }
      const type = ms.mediaType.toUpperCase() as
        | "ANIME"
        | "MANGA"
        | "MOVIE"
        | "TV"
        | "BOOK"
      const key = `${type}-${ms.mediaId}`
      const roleLabel = formatStaffRoleLabel(ms.customRole || ms.role)

      const existing = map.get(key)
      if (existing) {
        if (roleLabel && !existing.roles.includes(roleLabel)) {
          existing.roles.push(roleLabel)
        }
        return
      }

      const mediaObj = ms.anime || ms.manga || ms.movie || ms.tv || ms.book
      const mediaTitle =
        mediaObj?.titlePrimary || `${ms.mediaType} #${ms.mediaId}`
      const mediaSecondary = mediaObj?.titleSecondary ?? null
      const mediaNative = (mediaObj as any)?.titleNative ?? null
      const mediaCover = mediaObj?.coverImage ?? null
      const mediaBanner = (mediaObj as any)?.bannerImage ?? null
      const mediaDescription = (mediaObj as any)?.description ?? null
      const mediaStatus = (mediaObj as any)?.status ?? null
      const mediaYear =
        ms.anime?.seasonYear ||
        ms.anime?.startDateYear ||
        ms.manga?.startDateYear ||
        ms.movie?.releaseDateYear ||
        ms.tv?.firstAiredYear ||
        ms.book?.releaseDateYear ||
        null
      const mediaScore = mediaObj?.averageScore ?? null
      const mediaFormat =
        ms.anime?.format ||
        ms.manga?.format ||
        (ms.tv ? ms.tv.showType || "TV" : null) ||
        ms.book?.format ||
        (ms.movie ? "MOVIE" : null)

      map.set(key, {
        key,
        mediaType: type,
        mediaId: ms.mediaId,
        roles: roleLabel ? [roleLabel] : [],
        mediaTitle,
        mediaTitleSecondary: mediaSecondary,
        mediaTitleNative: mediaNative,
        mediaCover,
        mediaBanner,
        mediaDescription,
        mediaStatus,
        mediaYear,
        mediaScore,
        mediaFormat,
        episodeCount:
          ms.anime?.episodeCount ?? ms.tv?.episodeCount ?? null,
        chapterCount:
          ms.manga?.chapterCount ?? ms.book?.chapterCount ?? null,
        volumeCount:
          ms.manga?.volumeCount ?? ms.book?.volumeCount ?? null,
        popularity: (mediaObj as any)?.popularity ?? null,
        favorites: (mediaObj as any)?.favorites ?? null,
        genres: extractGenreNames((mediaObj as any)?.genres),
      })
    })

    return Array.from(map.values())
  }, [person.mediaStaff])

  const staffByType = useMemo(() => {
    const anime = deduplicatedStaffRoles.filter((m) => m.mediaType === "ANIME")
    const manga = deduplicatedStaffRoles.filter((m) => m.mediaType === "MANGA")
    const movies = deduplicatedStaffRoles.filter((m) => m.mediaType === "MOVIE")
    const tv = deduplicatedStaffRoles.filter((m) => m.mediaType === "TV")
    const books = deduplicatedStaffRoles.filter((m) => m.mediaType === "BOOK")

    return [
      {
        type: "ANIME" as const,
        title: "Anime",
        count: anime.length,
        items: anime,
      },
      {
        type: "MANGA" as const,
        title: "Manga",
        count: manga.length,
        items: manga,
      },
      {
        type: "MOVIE" as const,
        title: "Movies",
        count: movies.length,
        items: movies,
      },
      { type: "TV" as const, title: "TV Shows", count: tv.length, items: tv },
      {
        type: "BOOK" as const,
        title: "Books",
        count: books.length,
        items: books,
      },
    ].filter((group) => group.count > 0)
  }, [deduplicatedStaffRoles])

  // Deduplicate and process music releases (Albums & Tracks)
  const { musicAlbums, musicTracks } = useMemo(() => {
    const albumMap = new Map<number, MusicAlbumItem>()
    const trackMap = new Map<number, MusicTrackItem>()

    const directTracks = (person.musicTracks || []) as any[]
    directTracks.forEach((m) => {
      if (m.type === "ALBUM") {
        if (!albumMap.has(m.id)) {
          albumMap.set(m.id, {
            id: m.id,
            titlePrimary: m.titlePrimary || `Album #${m.id}`,
            titleSecondary: m.titleSecondary ?? null,
            titleNative: m.titleNative ?? null,
            coverImage: m.coverImage ?? null,
            description: m.description ?? null,
            status: m.status ?? null,
            albumType: m.recordType ?? null,
            releaseDateYear: m.releaseDateYear ?? null,
            listeners: m.listeners ?? null,
            playCount: m.playCount ?? null,
            popularity: m.popularity ?? null,
            favorites: m.favorites ?? null,
            genres: extractGenreNames(m.genres),
            role: "Artist",
          })
        }
      } else {
        if (!trackMap.has(m.id)) {
          trackMap.set(m.id, {
            id: m.id,
            titlePrimary: m.titlePrimary || `Track #${m.id}`,
            titleSecondary: m.titleSecondary ?? null,
            titleNative: m.titleNative ?? null,
            coverImage: m.coverImage || m.album?.coverImage || null,
            description: m.description ?? null,
            status: m.status ?? null,
            albumId: m.albumId ?? null,
            albumTitle: m.album?.titlePrimary ?? null,
            trackNumber: m.trackPosition ?? null,
            duration: m.duration ?? null,
            releaseDateYear: m.releaseDateYear ?? null,
            listeners: m.listeners ?? null,
            playCount: m.playCount ?? null,
            popularity: m.popularity ?? null,
            favorites: m.favorites ?? null,
            genres: extractGenreNames(m.genres),
            role: "Artist",
          })
        }
      }
    })

    person.mediaStaff.forEach((ms) => {
      const music = ms.music
      if (music) {
        if (music.type === "ALBUM" && !albumMap.has(music.id)) {
          albumMap.set(music.id, {
            id: music.id,
            titlePrimary:
              music.titlePrimary || ms.customRole || `Album #${music.id}`,
            titleSecondary: music.titleSecondary ?? null,
            titleNative: music.titleNative ?? null,
            coverImage: music.coverImage ?? null,
            description: music.description ?? null,
            status: music.status ?? null,
            albumType: music.recordType ?? null,
            releaseDateYear: music.releaseDateYear ?? null,
            listeners: music.listeners ?? null,
            playCount: music.playCount ?? null,
            popularity: music.popularity ?? null,
            favorites: music.favorites ?? null,
            genres: extractGenreNames(music.genres),
            role: formatStaffRoleLabel(ms.customRole || ms.role),
          })
        } else if (music.type === "TRACK" && !trackMap.has(music.id)) {
          trackMap.set(music.id, {
            id: music.id,
            titlePrimary:
              music.titlePrimary || ms.customRole || `Track #${music.id}`,
            titleSecondary: music.titleSecondary ?? null,
            titleNative: music.titleNative ?? null,
            coverImage: music.coverImage || music.album?.coverImage || null,
            description: music.description ?? null,
            status: music.status ?? null,
            albumId: music.albumId ?? null,
            albumTitle: music.album?.titlePrimary ?? null,
            trackNumber: music.trackPosition ?? null,
            duration: music.duration ?? null,
            releaseDateYear: music.releaseDateYear ?? null,
            listeners: music.listeners ?? null,
            playCount: music.playCount ?? null,
            popularity: music.popularity ?? null,
            favorites: music.favorites ?? null,
            genres: extractGenreNames(music.genres),
            role: formatStaffRoleLabel(ms.customRole || ms.role),
          })
        }
      }
    })

    const albums = Array.from(albumMap.values()).sort((a, b) => {
      if (
        b.releaseDateYear &&
        a.releaseDateYear &&
        b.releaseDateYear !== a.releaseDateYear
      ) {
        return b.releaseDateYear - a.releaseDateYear
      }
      return a.titlePrimary.localeCompare(b.titlePrimary)
    })

    const tracks = Array.from(trackMap.values()).sort((a, b) => {
      const bPlays = b.playCount || b.listeners || b.popularity || 0
      const aPlays = a.playCount || a.listeners || a.popularity || 0
      if (bPlays !== aPlays) return bPlays - aPlays
      return a.titlePrimary.localeCompare(b.titlePrimary)
    })

    return { musicAlbums: albums, musicTracks: tracks }
  }, [person.mediaStaff, person.musicTracks])

  const totalMusicReleases = musicAlbums.length + musicTracks.length

  const displayName =
    titlePref === "native" && person.nameNative
      ? person.nameNative
      : person.namePrimary

  const hometownDisplay = person.homeTown ?? person.hometown ?? null

  const externalSources = useMemo(() => {
    const items: Array<{ key: string; name: string; href: string }> = []
    if (person.deezerLink || person.deezerId) {
      items.push({
        key: "deezer",
        name: "Deezer",
        href:
          person.deezerLink ||
          `https://www.deezer.com/artist/${person.deezerId}`,
      })
    }
    if (person.lastFmUrl) {
      items.push({
        key: "lastfm",
        name: "Last.fm",
        href: person.lastFmUrl,
      })
    }
    if (person.spotifyId) {
      items.push({
        key: "spotify",
        name: "Spotify",
        href: `https://open.spotify.com/artist/${person.spotifyId}`,
      })
    }
    if (person.anilistId) {
      items.push({
        key: "anilist",
        name: "AniList",
        href: `https://anilist.co/staff/${person.anilistId}`,
      })
    }
    if (person.malId) {
      items.push({
        key: "mal",
        name: "MyAnimeList",
        href: `https://myanimelist.net/people/${person.malId}`,
      })
    }
    if (person.aniDBId) {
      items.push({
        key: "anidb",
        name: "AniDB",
        href: `https://anidb.net/creator/${person.aniDBId}`,
      })
    }
    if (person.tvDBId) {
      items.push({
        key: "tvdb",
        name: "TheTVDB",
        href: `https://thetvdb.com/dereferrer/people/${person.tvDBId}`,
      })
    }
    if (person.bangumiId) {
      items.push({
        key: "bangumi",
        name: "Bangumi",
        href: `https://bgm.tv/person/${person.bangumiId}`,
      })
    }
    if (person.imdbId) {
      items.push({
        key: "imdb",
        name: "IMDb",
        href: `https://www.imdb.com/name/${person.imdbId}`,
      })
    }
    if (person.tmdbId) {
      items.push({
        key: "tmdb",
        name: "TMDB",
        href: `https://www.themoviedb.org/person/${person.tmdbId}`,
      })
    }
    return items
  }, [person])

  const updatedFormatted = useMemo(() => {
    const d = new Date(person.updatedAt)
    if (isNaN(d.getTime())) return null
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [person.updatedAt])

  const renderVoicedCard = (
    item: (typeof deduplicatedVoicedRoles)[number]
  ) => (
    <BorealisCard
      key={item.key}
      type="character"
      titlePreference={titlePref}
      showSubtitle={false}
      data={{
        id: item.characterId,
        characterId: item.characterId,
        namePrimary: item.characterNamePrimary,
        nameNative: item.characterNameNative,
        image: item.characterImage,
        role: item.role,
        description: item.characterDescription,
        gender: item.characterGender,
        age: item.characterAge,
        favorites: item.characterFavorites,
        media: item.appearances[0] ?? null,
        appearances: item.appearances,
      }}
    />
  )

  const renderStaffCard = (
    item: (typeof deduplicatedStaffRoles)[number]
  ) => {
    const rolesText = item.roles.join(", ")
    const subtext = [rolesText, item.mediaYear].filter(Boolean).join(" • ")
    return (
      <BorealisCard
        key={item.key}
        type={toBorealisEntityType(item.mediaType)}
        titlePreference={titlePref}
        showSubtitle={false}
        showExtras={true}
        showProgress={false}
        data={{
          id: item.mediaId,
          titlePrimary: item.mediaTitle,
          titleSecondary: item.mediaTitleSecondary,
          titleNative: item.mediaTitleNative,
          coverImage: item.mediaCover,
          bannerImage: item.mediaBanner,
          description: item.mediaDescription,
          format: item.mediaFormat,
          status: item.mediaStatus,
          seasonYear: item.mediaYear,
          year: item.mediaYear,
          score: item.mediaScore,
          averageScore: item.mediaScore,
          episodeCount: item.episodeCount,
          chapterCount: item.chapterCount,
          volumeCount: item.volumeCount,
          genres: item.genres,
          popularity: item.popularity,
          favorites: item.favorites,
          subtext: subtext || undefined,
        }}
      />
    )
  }

  const renderAlbumCard = (album: MusicAlbumItem) => (
    <BorealisCard
      key={`album-${album.id}`}
      type="music"
      href={`/borealis/music/albums/${album.id}`}
      titlePreference={titlePref}
      showSubtitle={false}
      showExtras={true}
      showProgress={false}
      data={{
        id: album.id,
        titlePrimary: album.titlePrimary,
        titleSecondary: album.titleSecondary,
        titleNative: album.titleNative,
        coverImage: album.coverImage,
        description: album.description,
        status: album.status,
        format: album.albumType || "ALBUM",
        releaseDateYear: album.releaseDateYear,
        year: album.releaseDateYear,
        popularity: album.popularity,
        favorites: album.favorites,
        genres: album.genres,
        subtext:
          [
            album.role !== "Artist" ? album.role : null,
            album.releaseDateYear,
          ]
            .filter(Boolean)
            .join(" • ") || "Album",
      }}
    />
  )

  const renderTrackCard = (track: MusicTrackItem) => {
    const durationStr =
      typeof track.duration === "number" && track.duration > 0
        ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, "0")}`
        : null
    return (
      <BorealisCard
        key={`track-${track.id}`}
        type="music"
        href={`/borealis/music/tracks/${track.id}`}
        titlePreference={titlePref}
        showSubtitle={false}
        showExtras={true}
        showProgress={false}
        data={{
          id: track.id,
          titlePrimary: track.titlePrimary,
          titleSecondary: track.titleSecondary,
          titleNative: track.titleNative,
          coverImage: track.coverImage,
          description: track.description,
          status: track.status,
          format: "TRACK",
          releaseDateYear: track.releaseDateYear,
          year: track.releaseDateYear,
          popularity: track.popularity,
          favorites: track.favorites,
          genres: track.genres,
          subtext:
            [track.albumTitle, durationStr].filter(Boolean).join(" • ") ||
            track.role,
        }}
      />
    )
  }

  const middleStatValue =
    deduplicatedVoicedRoles.length > 0
      ? deduplicatedVoicedRoles.length
      : totalMusicReleases > 0
        ? totalMusicReleases
        : deduplicatedStaffRoles.length

  const middleStatLabel =
    deduplicatedVoicedRoles.length > 0
      ? "Voiced"
      : totalMusicReleases > 0
        ? "Releases"
        : "Credits"

  const MiddleStatIcon =
    deduplicatedVoicedRoles.length > 0
      ? IconMicrophone
      : totalMusicReleases > 0
        ? IconDisc
        : IconBriefcase

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* 1. Hero Header (matching MediaHero) */}
      <div className="relative w-full">
        {/* Backdrop Banner */}
        <div className="relative h-40 w-full overflow-hidden bg-muted sm:h-52 md:h-60">
          {person.image ? (
            <img
              src={person.image}
              alt=""
              aria-hidden="true"
              className="h-full w-full scale-125 object-cover object-center blur-xl brightness-50"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-b from-muted/80 via-muted/40 to-background" />
          )}
        </div>

        {/* Hero Row: BorealisCard Portrait + Title GlassCard */}
        <div className="relative z-10 -mt-28 w-full px-4 sm:-mt-36 sm:px-6 md:-mt-40 lg:px-8">
          <div className="flex items-end gap-3 sm:gap-4 md:gap-5">
            {/* Portrait BorealisCard */}
            <div className="shrink-0">
              <BorealisCard
                type="staff"
                data={person}
                href="#"
                titlePreference={titlePref}
                showHoverCard={false}
                showSubtitle={false}
                showHoverSubtitle={false}
                showBadges={false}
                className="w-28 shadow-2xl sm:w-32 md:w-36"
              >
                <BorealisCard.Image aspectRatio="poster" showBadges={false} />
              </BorealisCard>
            </div>

            {/* Title GlassCard */}
            <div className="min-w-0 pb-1">
              <GlassCard
                variant="tinted"
                className="flex w-fit max-w-full flex-wrap items-center gap-3 p-2.5 sm:px-5 sm:py-4"
              >
                <h1 className="font-mono text-base leading-tight font-bold tracking-tight text-balance text-foreground sm:text-2xl lg:text-3xl">
                  {displayName}
                </h1>
                <FavoriteButton
                  targetId={person.id}
                  type="PERSON"
                  title={person.namePrimary}
                  size="sm"
                  variant="secondary"
                  showLabel
                  className="h-7 rounded-xl px-2.5"
                />
              </GlassCard>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Pane (matching General / Overview tab) */}
      <main className="w-full flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_260px]">
          {/* Main Column */}
          <div className="flex min-w-0 flex-col gap-8">
            {/* Biography */}
            <section aria-labelledby="bio-heading">
              <GlassCard variant="normal" className="p-4 sm:p-5">
                <h2
                  id="bio-heading"
                  className="mb-2.5 text-base font-semibold text-foreground"
                >
                  Biography
                </h2>
                <FormattedDescription
                  text={person.description}
                  fallbackText="No biography available for this person."
                />
              </GlassCard>
            </section>

            {/* Voiced Characters */}
            {deduplicatedVoicedRoles.length > 0 && (
              <BorealisCardGroup
                title="Voiced Characters"
                rowCount={1}
                dragFree
                expandable
                variant="none"
              >
                {deduplicatedVoicedRoles.map(renderVoicedCard)}
              </BorealisCardGroup>
            )}

            {/* Production Staff */}
            {staffByType.map((group) => (
              <BorealisCardGroup
                key={group.type}
                title={
                  staffByType.length === 1
                    ? "Production Staff"
                    : `${group.title} Staff Credits`
                }
                rowCount={1}
                dragFree
                expandable
                variant="none"
              >
                {group.items.map(renderStaffCard)}
              </BorealisCardGroup>
            ))}

            {/* Discography */}
            {musicAlbums.length > 0 && (
              <BorealisCardGroup
                title="Albums & Releases"
                rowCount={1}
                dragFree
                expandable
                variant="none"
              >
                {musicAlbums.map(renderAlbumCard)}
              </BorealisCardGroup>
            )}

            {musicTracks.length > 0 && (
              <BorealisCardGroup
                title="Popular Tracks"
                rowCount={1}
                dragFree
                expandable
                variant="none"
              >
                {musicTracks.map(renderTrackCard)}
              </BorealisCardGroup>
            )}
          </div>

          {/* Right Narrow Sidebar (260px, matching OverviewTab) */}
          <aside className="flex flex-col gap-3.5">
            {/* 1. Stats Card */}
            <GlassCard
              variant="normal"
              className="flex flex-col gap-3 p-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-border/30 pb-2">
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Stats
                </span>
                <IconChartBar
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border/30 bg-muted/30 px-2 py-2.5 text-center">
                  <div className="flex items-center gap-1 text-primary">
                    <IconHeartFilled
                      className="size-3.5"
                      aria-hidden="true"
                    />
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {typeof person.favorites === "number"
                        ? person.favorites.toLocaleString()
                        : "0"}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Favorites
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border/30 bg-muted/30 px-2 py-2.5 text-center">
                  <div className="flex items-center gap-1 text-primary">
                    <MiddleStatIcon
                      className="size-3.5"
                      aria-hidden="true"
                    />
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {middleStatValue}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {middleStatLabel}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border/30 bg-muted/30 px-2 py-2.5 text-center">
                  <div className="flex items-center gap-1 text-primary">
                    <IconBriefcase
                      className="size-3.5"
                      aria-hidden="true"
                    />
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {deduplicatedStaffRoles.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Staff
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* 2. Information Card */}
            {(person.nameNative ||
              person.language ||
              person.gender ||
              typeof person.age === "number" ||
              formattedHeight ||
              person.bloodType ||
              person.birthPlace ||
              hometownDisplay ||
              (person.primaryOccupations &&
                person.primaryOccupations.length > 0) ||
              (person.yearsActive && person.yearsActive.length > 0)) && (
              <GlassCard
                variant="normal"
                className="flex flex-col gap-2 p-4 text-xs"
              >
                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                  <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Information
                  </span>
                  <IconInfoCircle
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>

                <div className="flex flex-col divide-y divide-border/20">
                  {person.nameNative && (
                    <div className="flex items-start justify-between gap-3 py-1.5">
                      <span className="shrink-0 text-muted-foreground">
                        Native Name
                      </span>
                      <span className="font-japanese text-end font-medium text-foreground">
                        {person.nameNative}
                      </span>
                    </div>
                  )}

                  {person.language && (
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <span className="shrink-0 text-muted-foreground">
                        Language
                      </span>
                      <span className="text-end font-medium text-foreground">
                        {person.language}
                      </span>
                    </div>
                  )}

                  {person.gender && (
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <span className="shrink-0 text-muted-foreground">
                        Gender
                      </span>
                      <span className="text-end font-medium text-foreground">
                        {person.gender}
                      </span>
                    </div>
                  )}

                  {typeof person.age === "number" && person.age > 0 && (
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <span className="shrink-0 text-muted-foreground">
                        Age
                      </span>
                      <span className="text-end font-medium text-foreground tabular-nums">
                        {person.age}
                      </span>
                    </div>
                  )}

                  {formattedHeight && (
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <span className="shrink-0 text-muted-foreground">
                        Height
                      </span>
                      <span className="text-end font-medium text-foreground tabular-nums">
                        {formattedHeight}
                      </span>
                    </div>
                  )}

                  {person.bloodType && (
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <span className="shrink-0 text-muted-foreground">
                        Blood Type
                      </span>
                      <span className="text-end font-medium text-foreground">
                        {person.bloodType}
                      </span>
                    </div>
                  )}

                  {person.birthPlace && (
                    <div className="flex items-start justify-between gap-3 py-1.5">
                      <span className="shrink-0 text-muted-foreground">
                        Birthplace
                      </span>
                      <span className="text-end font-medium text-foreground">
                        {person.birthPlace}
                      </span>
                    </div>
                  )}

                  {hometownDisplay &&
                    hometownDisplay !== person.birthPlace && (
                      <div className="flex items-start justify-between gap-3 py-1.5">
                        <span className="shrink-0 text-muted-foreground">
                          Hometown
                        </span>
                        <span className="text-end font-medium text-foreground">
                          {hometownDisplay}
                        </span>
                      </div>
                    )}

                  {person.yearsActive && person.yearsActive.length > 0 && (
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <span className="shrink-0 text-muted-foreground">
                        Years Active
                      </span>
                      <span className="text-end font-medium text-foreground tabular-nums">
                        {person.yearsActive.length >= 2
                          ? `${person.yearsActive[0]} – ${person.yearsActive[1] || "Present"}`
                          : `${person.yearsActive[0]} – Present`}
                      </span>
                    </div>
                  )}

                  {person.primaryOccupations &&
                    person.primaryOccupations.length > 0 && (
                      <div className="flex flex-col gap-1.5 py-1.5">
                        <span className="text-muted-foreground">
                          Occupations
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {person.primaryOccupations.map((occ, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-[10px] font-medium"
                            >
                              {occ}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </GlassCard>
            )}

            {/* 3. Dates Card */}
            {(formattedBirthday || formattedDeathDate) && (
              <GlassCard
                variant="normal"
                className="flex flex-col gap-2 p-4 text-xs"
              >
                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                  <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Dates
                  </span>
                  <IconCalendarEvent
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>

                <div className="flex flex-col divide-y divide-border/20">
                  {formattedBirthday && (
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <span className="shrink-0 text-muted-foreground">
                        Born
                      </span>
                      <span className="text-end font-medium text-foreground">
                        {formattedBirthday}
                      </span>
                    </div>
                  )}
                  {formattedDeathDate && (
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <span className="shrink-0 text-muted-foreground">
                        Died
                      </span>
                      <span className="text-end font-medium text-foreground">
                        {formattedDeathDate}
                      </span>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {/* 4. Alternative Names Card */}
            {(person.givenName ||
              person.familyName ||
              (person.nameAlternative &&
                person.nameAlternative.length > 0)) && (
              <GlassCard
                variant="normal"
                className="flex flex-col gap-2 p-4 text-xs"
              >
                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                  <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Alternative Names
                  </span>
                  <IconLanguage
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <ul className="flex flex-col divide-y divide-border/15">
                  {person.givenName && (
                    <li className="flex items-baseline justify-between gap-3 py-1 text-[11px] leading-snug">
                      <span className="shrink-0 text-muted-foreground">
                        Given
                      </span>
                      <span className="text-end break-words text-foreground/85">
                        {person.givenName}
                      </span>
                    </li>
                  )}
                  {person.familyName && (
                    <li className="flex items-baseline justify-between gap-3 py-1 text-[11px] leading-snug">
                      <span className="shrink-0 text-muted-foreground">
                        Family
                      </span>
                      <span className="text-end break-words text-foreground/85">
                        {person.familyName}
                      </span>
                    </li>
                  )}
                  {(person.nameAlternative ?? [])
                    .filter((alt) => alt !== person.namePrimary)
                    .map((alt, idx) => (
                      <li
                        key={idx}
                        className="py-1 text-end text-[11px] leading-snug break-words text-foreground/85"
                      >
                        {alt}
                      </li>
                    ))}
                </ul>
              </GlassCard>
            )}

            {/* 5. External Links Card */}
            {(person.deezerLink ||
              person.deezerId ||
              person.lastFmUrl ||
              person.spotifyId) && (
              <GlassCard
                variant="normal"
                className="flex flex-col gap-2.5 p-4 text-xs"
              >
                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                  <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    External Links
                  </span>
                  <IconWorld
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(person.deezerLink || person.deezerId) && (
                    <a
                      href={
                        person.deezerLink ||
                        `https://www.deezer.com/artist/${person.deezerId}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-border/40 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-border hover:bg-muted"
                    >
                      <span>Deezer</span>
                      <IconExternalLink
                        className="size-3 opacity-60"
                        aria-hidden="true"
                      />
                    </a>
                  )}
                  {person.lastFmUrl && (
                    <a
                      href={person.lastFmUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-red-600/10 px-2.5 py-1 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-600/20"
                    >
                      <span>Last.fm</span>
                      <IconExternalLink
                        className="size-3 opacity-60"
                        aria-hidden="true"
                      />
                    </a>
                  )}
                  {person.spotifyId && (
                    <a
                      href={`https://open.spotify.com/artist/${person.spotifyId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-500 transition-colors hover:bg-emerald-500/20"
                    >
                      <span>Spotify</span>
                      <IconExternalLink
                        className="size-3 opacity-60"
                        aria-hidden="true"
                      />
                    </a>
                  )}
                </div>
              </GlassCard>
            )}

            {/* 6. IDs Card */}
            {externalSources.length > 0 && (
              <GlassCard
                variant="normal"
                className="flex flex-col gap-2 p-4 text-xs"
              >
                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                  <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    IDs
                  </span>
                  <IconHash
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex flex-col divide-y divide-border/20 text-xs">
                  {person.deezerId && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">Deezer</span>
                      <a
                        href={`https://www.deezer.com/artist/${person.deezerId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-end font-mono text-[11px] font-medium text-primary hover:underline"
                      >
                        #{person.deezerId}
                      </a>
                    </div>
                  )}
                  {person.anilistId && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">AniList</span>
                      <a
                        href={`https://anilist.co/staff/${person.anilistId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-end font-mono text-[11px] font-medium text-primary hover:underline"
                      >
                        #{person.anilistId}
                      </a>
                    </div>
                  )}
                  {person.malId && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">MyAnimeList</span>
                      <a
                        href={`https://myanimelist.net/people/${person.malId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-end font-mono text-[11px] font-medium text-primary hover:underline"
                      >
                        #{person.malId}
                      </a>
                    </div>
                  )}
                  {person.aniDBId && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">AniDB</span>
                      <a
                        href={`https://anidb.net/creator/${person.aniDBId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-end font-mono text-[11px] font-medium text-primary hover:underline"
                      >
                        #{person.aniDBId}
                      </a>
                    </div>
                  )}
                  {person.tvDBId && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">TheTVDB</span>
                      <a
                        href={`https://thetvdb.com/dereferrer/people/${person.tvDBId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-end font-mono text-[11px] font-medium text-primary hover:underline"
                      >
                        #{person.tvDBId}
                      </a>
                    </div>
                  )}
                  {person.bangumiId && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">Bangumi</span>
                      <a
                        href={`https://bgm.tv/person/${person.bangumiId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-end font-mono text-[11px] font-medium text-primary hover:underline"
                      >
                        #{person.bangumiId}
                      </a>
                    </div>
                  )}
                  {person.imdbId && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">IMDb</span>
                      <a
                        href={`https://www.imdb.com/name/${person.imdbId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-end font-mono text-[11px] font-medium text-primary hover:underline"
                      >
                        {person.imdbId}
                      </a>
                    </div>
                  )}
                  {person.tmdbId && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">TMDB</span>
                      <a
                        href={`https://www.themoviedb.org/person/${person.tmdbId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-end font-mono text-[11px] font-medium text-primary hover:underline"
                      >
                        #{person.tmdbId}
                      </a>
                    </div>
                  )}
                  {person.spotifyId && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">Spotify</span>
                      <a
                        href={`https://open.spotify.com/artist/${person.spotifyId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-end font-mono text-[11px] font-medium text-primary hover:underline"
                      >
                        {person.spotifyId}
                      </a>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}
          </aside>
        </div>
      </main>

      {/* 3. Footer (matching MediaFooter) */}
      <footer className="mt-12 border-t border-border/40 bg-card/30 py-8 text-xs text-muted-foreground">
        <div className="flex w-full flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <IconWorld className="size-4 text-primary" aria-hidden="true" />
              <span>Data Sources</span>
            </div>
            {externalSources.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {externalSources.map((source) => (
                  <a
                    key={source.key}
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-muted-foreground outline-none hover:text-foreground hover:underline focus-visible:underline"
                  >
                    <span>{source.name}</span>
                    <IconExternalLink
                      className="size-3 opacity-60"
                      aria-hidden="true"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground/70 italic">
                External sources not linked
              </span>
            )}
          </div>

          {updatedFormatted && (
            <div
              className="flex items-center gap-1.5 text-muted-foreground"
              suppressHydrationWarning
            >
              <IconClock className="size-3.5" aria-hidden="true" />
              <span suppressHydrationWarning>
                Last updated: {updatedFormatted}
              </span>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
