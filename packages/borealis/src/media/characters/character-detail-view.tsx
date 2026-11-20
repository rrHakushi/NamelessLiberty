"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  IconCalendar,
  IconChartBar,
  IconClock,
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconHash,
  IconHeartFilled,
  IconInfoCircle,
  IconLanguage,
  IconMicrophone,
  IconMovie,
  IconWorld,
} from "@tabler/icons-react"
import { Badge } from "@workspace/ui/components/badge"
import type { CharacterDetails } from "@NamelessLiberty/elysia"
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

interface CharacterDetailViewProps {
  character: CharacterDetails
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
    default:
      return "anime"
  }
}

function formatRoleLabel(role?: string | null, year?: number | null): string {
  const roleLabel = role
    ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    : ""
  if (roleLabel && year) return `${roleLabel} • ${year}`
  if (roleLabel) return roleLabel
  if (year) return String(year)
  return ""
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

function extractGenreNames(genres: any): string[] {
  if (!Array.isArray(genres)) return []
  return genres
    .map((g: any) => (typeof g === "string" ? g : g?.name || g?.genre?.name || ""))
    .filter(Boolean)
}

export function CharacterDetailView({ character }: CharacterDetailViewProps) {
  const { user } = useUser()
  const titlePref = getMediaPreferences(user?.customization).title || "primary"
  const [showSpoilers, setShowSpoilers] = useState(false)

  // Track page visit in Browse recently visited
  useEffect(() => {
    if (!character?.id) return
    addBrowseVisitToStore("characters", {
      id: character.id,
      title: character.namePrimary,
      titlePrimary: character.namePrimary,
      titleNative: character.nameNative,
      coverImage: character.image,
      description: character.description,
      gender: character.gender,
      age: character.age,
      format: character.gender || "Character",
    })
  }, [
    character.id,
    character.namePrimary,
    character.nameNative,
    character.image,
    character.description,
    character.gender,
    character.age,
  ])

  const formattedBirthday = useMemo(
    () =>
      formatPartialDate(
        character.dateOfBirthYear,
        character.dateOfBirthMonth,
        character.dateOfBirthDay
      ),
    [
      character.dateOfBirthYear,
      character.dateOfBirthMonth,
      character.dateOfBirthDay,
    ]
  )

  // Extract unique voice actors / actors across all media appearances
  const uniqueActors = useMemo(() => {
    const actorMap = new Map<
      number,
      {
        id: number
        namePrimary: string
        nameNative: string | null
        image: string | null
        language: string | null
        description: string | null
        gender: string | null
        age: number | null
        homeTown: string | null
        birthPlace: string | null
        primaryOccupations: string[]
        favorites: number | null
        rolesCount: number
      }
    >()

    character.mediaCharacters.forEach((mc) => {
      if (mc.actor) {
        const existing = actorMap.get(mc.actor.id)
        if (existing) {
          existing.rolesCount += 1
        } else {
          actorMap.set(mc.actor.id, {
            id: mc.actor.id,
            namePrimary: mc.actor.namePrimary,
            nameNative: mc.actor.nameNative ?? null,
            image: mc.actor.image,
            language: mc.actor.language ?? null,
            description: mc.actor.description ?? null,
            gender: mc.actor.gender ?? null,
            age: mc.actor.age ?? null,
            homeTown: mc.actor.homeTown ?? null,
            birthPlace: mc.actor.birthPlace ?? null,
            primaryOccupations: mc.actor.primaryOccupations ?? [],
            favorites: mc.actor.favorites ?? null,
            rolesCount: 1,
          })
        }
      }
    })

    // Sort: Japanese first, then English, then others
    return Array.from(actorMap.values()).sort((a, b) => {
      if (a.language === "Japanese") return -1
      if (b.language === "Japanese") return 1
      if (a.language === "English") return -1
      if (b.language === "English") return 1
      return a.namePrimary.localeCompare(b.namePrimary)
    })
  }, [character.mediaCharacters])

  // Deduplicate media appearances by mediaType + mediaId
  const deduplicatedMedia = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string
        mediaType: "ANIME" | "MANGA" | "MOVIE" | "TV" | "BOOK"
        mediaId: number
        role: string
        order: number | null
        titlePrimary: string
        titleSecondary?: string | null
        titleNative?: string | null
        coverImage?: string | null
        bannerImage?: string | null
        description?: string | null
        status?: string | null
        year?: number | null
        score?: number | null
        format?: string | null
        episodeCount?: number | null
        chapterCount?: number | null
        volumeCount?: number | null
        popularity?: number | null
        favorites?: number | null
        genres: string[]
      }
    >()

    character.mediaCharacters.forEach((mc) => {
      const type = mc.mediaType.toUpperCase() as
        | "ANIME"
        | "MANGA"
        | "MOVIE"
        | "TV"
        | "BOOK"
      const key = `${type}-${mc.mediaId}`

      if (!map.has(key)) {
        const mediaObj = mc.anime || mc.manga || mc.movie || mc.tv || mc.book
        const mediaTitle =
          mediaObj?.titlePrimary || `${mc.mediaType} #${mc.mediaId}`
        const mediaNative = (mediaObj as any)?.titleNative ?? null
        const mediaSecondary = mediaObj?.titleSecondary ?? null
        const mediaImage = mediaObj?.coverImage ?? null
        const mediaBanner = (mediaObj as any)?.bannerImage ?? null
        const mediaDescription = (mediaObj as any)?.description ?? null
        const mediaStatus = (mediaObj as any)?.status ?? null
        const mediaYear =
          mc.anime?.seasonYear ||
          mc.anime?.startDateYear ||
          mc.manga?.startDateYear ||
          mc.movie?.releaseDateYear ||
          mc.tv?.firstAiredYear ||
          mc.book?.releaseDateYear ||
          null
        const mediaScore = mediaObj?.averageScore ?? null
        const mediaFormat =
          mc.anime?.format ||
          mc.manga?.format ||
          (mc.tv ? mc.tv.showType || "TV" : null) ||
          mc.book?.format ||
          (mc.movie ? "MOVIE" : null)

        map.set(key, {
          key,
          mediaType: type,
          mediaId: mc.mediaId,
          role: mc.role,
          order: mc.order,
          titlePrimary: mediaTitle,
          titleSecondary: mediaSecondary,
          titleNative: mediaNative,
          coverImage: mediaImage,
          bannerImage: mediaBanner,
          description: mediaDescription,
          status: mediaStatus,
          year: mediaYear,
          score: mediaScore,
          format: mediaFormat,
          episodeCount:
            mc.anime?.episodeCount ?? mc.tv?.episodeCount ?? null,
          chapterCount:
            mc.manga?.chapterCount ?? mc.book?.chapterCount ?? null,
          volumeCount:
            mc.manga?.volumeCount ?? mc.book?.volumeCount ?? null,
          popularity: (mediaObj as any)?.popularity ?? null,
          favorites: (mediaObj as any)?.favorites ?? null,
          genres: extractGenreNames((mediaObj as any)?.genres),
        })
      }
    })

    return Array.from(map.values())
  }, [character.mediaCharacters])

  // Group deduplicated media appearances by type
  const mediaByType = useMemo(() => {
    const anime = deduplicatedMedia.filter((m) => m.mediaType === "ANIME")
    const manga = deduplicatedMedia.filter((m) => m.mediaType === "MANGA")
    const movies = deduplicatedMedia.filter((m) => m.mediaType === "MOVIE")
    const tv = deduplicatedMedia.filter((m) => m.mediaType === "TV")
    const books = deduplicatedMedia.filter((m) => m.mediaType === "BOOK")

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
  }, [deduplicatedMedia])

  const displayName =
    titlePref === "native" && character.nameNative
      ? character.nameNative
      : character.namePrimary

  const externalSources = useMemo(() => {
    const items: Array<{ key: string; name: string; href: string }> = []
    if (character.anilistId) {
      items.push({
        key: "anilist",
        name: "AniList",
        href: `https://anilist.co/character/${character.anilistId}`,
      })
    }
    if (character.malId) {
      items.push({
        key: "mal",
        name: "MyAnimeList",
        href: `https://myanimelist.net/character/${character.malId}`,
      })
    }
    if (character.aniDBId) {
      items.push({
        key: "anidb",
        name: "AniDB",
        href: `https://anidb.net/character/${character.aniDBId}`,
      })
    }
    if (character.tvDBId) {
      items.push({
        key: "tvdb",
        name: "TheTVDB",
        href: `https://thetvdb.com/dereferrer/people/${character.tvDBId}`,
      })
    }
    if (character.bangumiId) {
      items.push({
        key: "bangumi",
        name: "Bangumi",
        href: `https://bgm.tv/character/${character.bangumiId}`,
      })
    }
    return items
  }, [
    character.anilistId,
    character.malId,
    character.aniDBId,
    character.tvDBId,
    character.bangumiId,
  ])

  const updatedFormatted = useMemo(() => {
    const d = new Date(character.updatedAt)
    if (isNaN(d.getTime())) return null
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [character.updatedAt])

  const renderAppearanceCard = (
    item: (typeof deduplicatedMedia)[number]
  ) => (
    <BorealisCard
      key={item.key}
      type={toBorealisEntityType(item.mediaType)}
      titlePreference={titlePref}
      showSubtitle={false}
      showExtras={true}
      showProgress={false}
      data={{
        id: item.mediaId,
        titlePrimary: item.titlePrimary,
        titleSecondary: item.titleSecondary,
        titleNative: item.titleNative,
        coverImage: item.coverImage,
        bannerImage: item.bannerImage,
        description: item.description,
        format: item.format,
        status: item.status,
        seasonYear: item.year,
        year: item.year,
        score: item.score,
        averageScore: item.score,
        episodeCount: item.episodeCount,
        chapterCount: item.chapterCount,
        volumeCount: item.volumeCount,
        genres: item.genres,
        popularity: item.popularity,
        favorites: item.favorites,
        subtext: formatRoleLabel(item.role, item.year) || undefined,
      }}
    />
  )

  const renderActorCard = (actor: (typeof uniqueActors)[number]) => (
    <BorealisCard
      key={actor.id}
      type="staff"
      titlePreference={titlePref}
      showSubtitle={false}
      showExtras={false}
      data={{
        id: actor.id,
        personId: actor.id,
        namePrimary: actor.namePrimary,
        nameNative: actor.nameNative,
        image: actor.image,
        role: actor.language || "Voice Actor",
        customRole: actor.language || "Voice Actor",
        description: actor.description,
        gender: actor.gender,
        age: actor.age,
        language: actor.language,
        homeTown: actor.homeTown,
        birthPlace: actor.birthPlace,
        primaryOccupations: actor.primaryOccupations,
        favorites: actor.favorites,
      }}
    />
  )

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* 1. Hero Header (matching MediaHero) */}
      <div className="relative w-full">
        {/* Backdrop Banner */}
        <div className="relative h-40 w-full overflow-hidden bg-muted sm:h-52 md:h-60">
          {character.image ? (
            <img
              src={character.image}
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
                type="character"
                data={character}
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
                  targetId={character.id}
                  type="CHARACTER"
                  title={character.namePrimary}
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
                  text={character.description}
                  fallbackText="No biography available for this character."
                />
              </GlassCard>
            </section>

            {/* Voice Actors & Cast */}
            {uniqueActors.length > 0 && (
              <BorealisCardGroup
                title="Voice Actors & Cast"
                rowCount={1}
                dragFree
                expandable
                variant="none"
              >
                {uniqueActors.map(renderActorCard)}
              </BorealisCardGroup>
            )}

            {/* Media Appearances */}
            {mediaByType.map((group) => (
              <BorealisCardGroup
                key={group.type}
                title={
                  mediaByType.length === 1
                    ? "Appearances"
                    : `${group.title} Appearances`
                }
                rowCount={1}
                dragFree
                expandable
                variant="none"
              >
                {group.items.map(renderAppearanceCard)}
              </BorealisCardGroup>
            ))}
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
                      {typeof character.favorites === "number"
                        ? character.favorites.toLocaleString()
                        : "0"}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Favorites
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border/30 bg-muted/30 px-2 py-2.5 text-center">
                  <div className="flex items-center gap-1 text-primary">
                    <IconMovie className="size-3.5" aria-hidden="true" />
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {deduplicatedMedia.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Works
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border/30 bg-muted/30 px-2 py-2.5 text-center">
                  <div className="flex items-center gap-1 text-primary">
                    <IconMicrophone
                      className="size-3.5"
                      aria-hidden="true"
                    />
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {uniqueActors.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Cast
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* 2. Information Card */}
            {(character.gender ||
              character.age ||
              formattedBirthday ||
              character.nameNative) && (
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
                  {character.nameNative && (
                    <div className="flex items-start justify-between gap-3 py-1.5">
                      <span className="shrink-0 text-muted-foreground">
                        Native Name
                      </span>
                      <span className="font-japanese text-end font-medium text-foreground">
                        {character.nameNative}
                      </span>
                    </div>
                  )}

                  {character.gender && (
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <span className="shrink-0 text-muted-foreground">
                        Gender
                      </span>
                      <span className="text-end font-medium text-foreground">
                        {character.gender}
                      </span>
                    </div>
                  )}

                  {character.age && (
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <span className="shrink-0 text-muted-foreground">
                        Age
                      </span>
                      <span className="text-end font-medium text-foreground">
                        {character.age}
                      </span>
                    </div>
                  )}

                  {formattedBirthday && (
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <span className="shrink-0 text-muted-foreground">
                        Birthday
                      </span>
                      <span className="inline-flex items-center gap-1 text-end font-medium text-foreground">
                        <IconCalendar
                          className="size-3 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span>{formattedBirthday}</span>
                      </span>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {/* 3. Alternative Names Card */}
            {((character.nameAlternative &&
              character.nameAlternative.length > 0) ||
              (character.nameAlternativeSpoiler &&
                character.nameAlternativeSpoiler.length > 0)) && (
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

                {character.nameAlternative &&
                  character.nameAlternative.length > 0 && (
                    <ul className="flex flex-col divide-y divide-border/15">
                      {character.nameAlternative.map((alt, idx) => (
                        <li
                          key={idx}
                          className="py-1 text-end text-[11px] leading-snug break-words text-foreground/85"
                        >
                          {alt}
                        </li>
                      ))}
                    </ul>
                  )}

                {character.nameAlternativeSpoiler &&
                  character.nameAlternativeSpoiler.length > 0 && (
                    <div className="flex flex-col gap-1.5 border-t border-border/20 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowSpoilers((prev) => !prev)}
                        className="inline-flex cursor-pointer items-center gap-1 self-start rounded-md px-1.5 py-0.5 text-[11px] font-medium text-amber-500 transition-colors hover:bg-amber-500/10"
                      >
                        {showSpoilers ? (
                          <IconEyeOff
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        ) : (
                          <IconEye className="size-3.5" aria-hidden="true" />
                        )}
                        <span>
                          {showSpoilers
                            ? "Hide Spoiler Aliases"
                            : `Show Spoiler Aliases (${character.nameAlternativeSpoiler.length})`}
                        </span>
                      </button>

                      {showSpoilers && (
                        <div className="flex flex-wrap justify-end gap-1">
                          {character.nameAlternativeSpoiler.map(
                            (spoiler, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="border-amber-500/40 text-[10px] font-normal text-amber-600 dark:text-amber-400"
                              >
                                {spoiler}
                              </Badge>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}
              </GlassCard>
            )}

            {/* 4. IDs Card */}
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
                  {character.anilistId && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">AniList</span>
                      <a
                        href={`https://anilist.co/character/${character.anilistId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-end font-mono text-[11px] font-medium text-primary hover:underline"
                      >
                        #{character.anilistId}
                      </a>
                    </div>
                  )}
                  {character.malId && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">MyAnimeList</span>
                      <a
                        href={`https://myanimelist.net/character/${character.malId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-end font-mono text-[11px] font-medium text-primary hover:underline"
                      >
                        #{character.malId}
                      </a>
                    </div>
                  )}
                  {character.aniDBId && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">AniDB</span>
                      <a
                        href={`https://anidb.net/character/${character.aniDBId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-end font-mono text-[11px] font-medium text-primary hover:underline"
                      >
                        #{character.aniDBId}
                      </a>
                    </div>
                  )}
                  {character.tvDBId && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">TheTVDB</span>
                      <a
                        href={`https://thetvdb.com/dereferrer/people/${character.tvDBId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-end font-mono text-[11px] font-medium text-primary hover:underline"
                      >
                        #{character.tvDBId}
                      </a>
                    </div>
                  )}
                  {character.bangumiId && (
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground">Bangumi</span>
                      <a
                        href={`https://bgm.tv/character/${character.bangumiId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-end font-mono text-[11px] font-medium text-primary hover:underline"
                      >
                        #{character.bangumiId}
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
