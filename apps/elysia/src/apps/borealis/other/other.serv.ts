import { BaseBorealisMediaService } from '../_shared/base-media.serv'
import {
  prisma,
  and,
  or,
  not,
  countOf,
  toDate,
  type MediaType,
} from '@NamelessLiberty/db'
import {
  BadRequest,
  Forbidden,
  NotFound,
  Conflict,
} from '../../../core/errors/http-errors'
import { uploadPublicAsset } from '../../../core/utils/s3'
import { CarinaNotificationsServ } from '../../carina/notifications/notifications.serv'
import { getProfileCustomization } from '@NamelessLiberty/shared'
import {
  buildOtherScalarData,
  resolveOtherRelations,
  syncOtherRelations,
} from './other-relations.helper'
import type {
  CreateOtherBody,
  UpdateOtherBody,
  OtherCatalogQuery,
  OtherFriendsQuery,
  OtherPeopleQuery,
} from './other.model'

function parseList(val?: unknown): string[] {
  if (!val || typeof val !== 'string') return []
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function validateProgressFields(
  progressFields?: Array<{ key: string; label: string; unit?: string; max?: number }>,
  incrementFieldKey?: string | null
) {
  if (!progressFields) return
  if (!Array.isArray(progressFields) || progressFields.length === 0) {
    throw new BadRequest('At least 1 progress field is required')
  }
  const keys = new Set<string>()
  for (const f of progressFields) {
    const k = f.key?.trim()
    if (!k) throw new BadRequest('Progress field key cannot be empty')
    if (keys.has(k)) throw new BadRequest(`Duplicate progress field key: ${k}`)
    keys.add(k)
  }
  if (incrementFieldKey && !keys.has(incrementFieldKey)) {
    throw new BadRequest(
      `incrementFieldKey "${incrementFieldKey}" must match one of the progressFields keys`
    )
  }
}

export class BorealisOtherServ extends BaseBorealisMediaService {
  /**
   * Get public catalog of custom items with pagination and filters.
   */
  public static async getCatalog(query?: OtherCatalogQuery) {
    const page = Math.max(1, Number(query?.page ?? 1))
    const limit = Math.max(1, Math.min(100, Number(query?.limit ?? 50)))
    const skip = query?.cursor ? 0 : (page - 1) * limit

    const search = query?.search?.trim()
    const genres = parseList(query?.genres)
    const tags = parseList(query?.tags)
    const formats = parseList(query?.formats)
    const statuses = parseList(query?.statuses)
    const years = parseList(query?.years)
      .map((y) => Number(y))
      .filter((y) => Number.isFinite(y))
    const season = query?.season?.trim()
    const isAdult = query?.isAdult?.trim().toLowerCase()
    const sortBy = query?.sortBy ?? 'popularity'
    const sortOrder = query?.sortOrder ?? (sortBy === 'title' ? 'asc' : 'desc')

    let q = prisma.orm.public.Other.where({ isPublished: true })
    if (search) {
      q = q.where((m) =>
        or(
          m.titlePrimary.ilike(`%${search}%`),
          m.titleSecondary.ilike(`%${search}%`),
          m.titleNative.ilike(`%${search}%`)
        )
      )
    }
    if (genres.length > 0) {
      q = q.where((m) =>
        m.genres.some((g) => g.genre.some((ge) => ge.name.in(genres)))
      )
    }
    if (tags.length > 0) {
      q = q.where((m) =>
        m.tags.some((t) => t.tag.some((te) => te.name.in(tags)))
      )
    }
    if (formats.length > 0) {
      q = q.where((m) => m.format.in(formats))
    }
    if (statuses.length > 0) {
      q = q.where((m) => m.status.in(statuses as any))
    }
    if (years.length > 0) {
      q = q.where((m) => m.startDateYear.in(years))
    }
    if (season) {
      q = q.where({ seasonSeason: season as any })
    }
    if (isAdult === 'sfw' || isAdult === 'false') {
      q = q.where({ isAdult: false })
    } else if (isAdult === 'nsfw' || isAdult === 'true') {
      q = q.where({ isAdult: true })
    }
    if (query?.cursor) {
      q = q.where((m) =>
        sortOrder === 'asc' ? m.id.gt(query.cursor!) : m.id.lt(query.cursor!)
      )
    }

    let itemsQ = q
    if (sortBy === 'score') {
      itemsQ = itemsQ.orderBy([
        (x) =>
          sortOrder === 'asc'
            ? x.averageScore.asc({ nulls: 'last' })
            : x.averageScore.desc({ nulls: 'last' }),
        (x) => x.id.asc(),
      ])
    } else if (sortBy === 'title') {
      itemsQ = itemsQ.orderBy([
        (x) => (sortOrder === 'desc' ? x.titlePrimary.desc() : x.titlePrimary.asc()),
        (x) => x.id.asc(),
      ])
    } else if (sortBy === 'releaseDate') {
      itemsQ = itemsQ.orderBy([
        (x) =>
          sortOrder === 'asc'
            ? x.startDateYear.asc({ nulls: 'last' })
            : x.startDateYear.desc({ nulls: 'last' }),
        (x) => x.id.asc(),
      ])
    } else if (sortBy === 'favorites') {
      itemsQ = itemsQ.orderBy([
        (x) => (sortOrder === 'asc' ? x.favorites.asc() : x.favorites.desc()),
        (x) => x.id.asc(),
      ])
    } else if (sortBy === 'updatedAt') {
      itemsQ = itemsQ.orderBy([
        (x) => (sortOrder === 'asc' ? x.updatedAt.asc() : x.updatedAt.desc()),
        (x) => x.id.asc(),
      ])
    } else {
      itemsQ = itemsQ.orderBy([
        (x) => (sortOrder === 'asc' ? x.popularity.asc() : x.popularity.desc()),
        (x) => x.id.asc(),
      ])
    }

    const [total, items] = await Promise.all([
      countOf(q),
      itemsQ
        .offset(skip)
        .limit(limit)
        .include('genres', (g) => g.include('genre', (ge) => ge.select('id', 'name')))
        .include('tags', (t) => t.include('tag', (te) => te.select('id', 'name')))
        .all(),
    ])

    const totalPages = Math.ceil(total / limit) || 1
    const last = items[items.length - 1]
    const nextCursor = items.length === limit && last ? last.id : null

    return {
      success: true,
      items: items.map((m: any) => ({
        id: m.id,
        creatorId: m.creatorId,
        titlePrimary: m.titlePrimary,
        titleSecondary: m.titleSecondary ?? null,
        titleNative: m.titleNative ?? null,
        coverImage: m.coverImage ?? null,
        bannerImage: m.bannerImage ?? null,
        description: m.description ?? null,
        format: m.format ?? null,
        status: m.status ?? 'UNKNOWN',
        isPublished: m.isPublished,
        isAdult: Boolean(m.isAdult),
        startDateYear: m.startDateYear ?? null,
        startDateMonth: m.startDateMonth ?? null,
        startDateDay: m.startDateDay ?? null,
        seasonSeason: m.seasonSeason ?? null,
        seasonYear: m.seasonYear ?? null,
        progressFields: m.progressFields ?? [],
        incrementFieldKey: m.incrementFieldKey ?? null,
        averageScore: m.averageScore ?? null,
        popularity: m.popularity ?? 0,
        favorites: m.favorites ?? 0,
        genres: (m.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => g.genre.name),
        tags: (m.tags || []).filter((t: any) => Boolean(t.tag)).map((t: any) => t.tag.name),
      })),
      total,
      page,
      limit,
      totalPages,
      hasMore: query?.cursor ? items.length === limit : page < totalPages,
      nextCursor,
    }
  }

  /**
   * Get aggregated filters for published custom items.
   */
  public static async getFilters() {
    const [allPublished, allGenres, allTags] = await Promise.all([
      prisma.orm.public.Other.where({ isPublished: true })
        .select('format', 'status', 'startDateYear', 'seasonSeason')
        .all(),
      prisma.orm.public.Genre.select('id', 'name')
        .include('others', (o) => o.where((x) => x.other.some((ot) => ot.isPublished.eq(true))).count())
        .orderBy((g) => g.name.asc())
        .all(),
      prisma.orm.public.Tag.select('id', 'name')
        .include('others', (o) => o.where((x) => x.other.some((ot) => ot.isPublished.eq(true))).count())
        .orderBy((t) => t.name.asc())
        .all(),
    ])

    const formatCounts: Record<string, number> = {}
    const statusCounts: Record<string, number> = {}
    const yearCounts: Record<number, number> = {}
    const seasonCounts: Record<string, number> = {}

    for (const m of allPublished) {
      if (m.format) formatCounts[m.format] = (formatCounts[m.format] || 0) + 1
      if (m.status) statusCounts[m.status] = (statusCounts[m.status] || 0) + 1
      if (m.startDateYear) yearCounts[m.startDateYear] = (yearCounts[m.startDateYear] || 0) + 1
      if (m.seasonSeason) seasonCounts[m.seasonSeason] = (seasonCounts[m.seasonSeason] || 0) + 1
    }

    return {
      success: true,
      formats: Object.entries(formatCounts).map(([value, count]) => ({ value, count })),
      statuses: Object.entries(statusCounts).map(([value, count]) => ({ value, count })),
      genres: allGenres
        .map((g: any) => ({ value: g.name, count: g.others ?? 0 }))
        .filter((g) => g.count > 0),
      tags: allTags
        .map((t: any) => ({ value: t.name, count: t.others ?? 0 }))
        .filter((t) => t.count > 0),
      years: Object.entries(yearCounts)
        .map(([value, count]) => ({ value: Number(value), count }))
        .sort((a, b) => b.value - a.value),
      seasons: Object.entries(seasonCounts).map(([value, count]) => ({ value, count })),
    }
  }

  /**
   * Returns shared Genre & Tag lists for modal autocomplete.
   */
  public static async getTaxonomy() {
    const [genres, tags] = await Promise.all([
      prisma.orm.public.Genre.select('id', 'name', 'slug').orderBy((g) => g.name.asc()).all(),
      prisma.orm.public.Tag.select('id', 'name', 'slug', 'category').orderBy((t) => t.name.asc()).all(),
    ])
    return {
      success: true,
      genres,
      tags,
    }
  }

  /**
   * Get all custom items created by a user (including private).
   */
  public static async getMyItems(userId: string) {
    const items = await prisma.orm.public.Other.where({ creatorId: userId })
      .orderBy((o) => o.updatedAt.desc())
      .all()

    return {
      success: true,
      items,
    }
  }

  /**
   * Create a new custom item.
   */
  public static async createItem(userId: string, body: CreateOtherBody, isAdmin: boolean) {
    if (!isAdmin) {
      const existingCount = await countOf(
        prisma.orm.public.Other.where({ creatorId: userId })
      )
      if (existingCount >= 500) {
        throw new Forbidden('You have reached the maximum limit of 500 custom items.')
      }
    }

    validateProgressFields(body.progressFields, body.incrementFieldKey)

    const scalarData = buildOtherScalarData(body, true)
    const createdId = await prisma.transaction(async (tx) => {
      const created = await tx.orm.public.Other.create({
        ...(scalarData as any),
        creatorId: userId,
      })
      await syncOtherRelations(tx, created.id, body)
      return created.id
    })

    return await this.getItem(createdId, userId, isAdmin)
  }

  /**
   * Fetch a single custom item with full metadata & one-way sections.
   */
  public static async getItem(otherId: number, currentUserId?: string, isAdmin = false) {
    const item: any = await prisma.orm.public.Other.where({ id: otherId })
      .include('creator', (u) => u.select('id', 'username', 'customization'))
      .include('genres', (g) => g.include('genre', (ge) => ge.select('id', 'name', 'slug')))
      .include('tags', (t) =>
        t.include('tag', (te) => te.select('id', 'name', 'slug', 'category', 'description'))
      )
      .include('studios', (s) => s.include('studio'))
      .include('characters', (c) =>
        c
          .include('character')
          .include('actor', (a) => a.select('id', 'namePrimary', 'nameNative', 'image'))
      )
      .include('staff', (s) =>
        s.include('person', (p) => p.select('id', 'namePrimary', 'nameNative', 'image'))
      )
      .include('seasons')
      .include('episodes')
      .include('tracks')
      .first()

    if (!item) {
      throw new NotFound(`Other item #${otherId} not found`)
    }

    if (!item.isPublished && item.creatorId !== currentUserId && !isAdmin) {
      throw new Forbidden('This custom item is private.')
    }

    const relations = await resolveOtherRelations(otherId)
    const creatorProfile = item.creator
      ? getProfileCustomization(item.creator.customization)
      : null

    const genres = (item.genres || [])
      .filter((g: any) => Boolean(g.genre))
      .map((g: any) => g.genre)
    const tags = (item.tags || [])
      .filter((t: any) => Boolean(t.tag))
      .map((t: any) => ({
        ...t.tag,
        rank: t.rank ?? null,
        isSpoiler: Boolean(t.isSpoiler),
      }))
    const studios = (item.studios || [])
      .filter((s: any) => Boolean(s.studio))
      .map((s: any) => ({
        id: s.id,
        studioId: s.studioId,
        isMain: Boolean(s.isMain),
        studio: s.studio,
      }))
    const characters = (item.characters || [])
      .filter((c: any) => Boolean(c.character))
      .map((c: any) => ({
        id: c.characterId,
        role: c.role,
        order: c.order ?? null,
        characterData: c.character,
        voiceActor: c.actor ?? null,
      }))
    const staff = (item.staff || [])
      .filter((s: any) => Boolean(s.person))
      .map((s: any) => ({
        id: s.id,
        personId: s.personId,
        role: s.role,
        customRole: s.customRole ?? null,
        person: s.person,
      }))
    const seasons = [...(item.seasons || [])].sort(
      (a: any, b: any) => a.seasonNumber - b.seasonNumber
    )
    const episodes = [...(item.episodes || [])].sort((a: any, b: any) => {
      const sa = a.seasonNumber ?? 1
      const sb = b.seasonNumber ?? 1
      if (sa !== sb) return sa - sb
      return a.episodeNumber - b.episodeNumber
    })
    const tracks = [...(item.tracks || [])].sort((a: any, b: any) => {
      if ((a.discNumber ?? 1) !== (b.discNumber ?? 1)) {
        return (a.discNumber ?? 1) - (b.discNumber ?? 1)
      }
      return a.trackNumber - b.trackNumber
    })

    const galleryImages = Array.isArray(item.images)
      ? item.images
      : item.images?.gallery ?? item.images?.backdrops ?? item.images?.posters ?? []
    const hasImages =
      (Array.isArray(galleryImages) && galleryImages.length > 0) ||
      Boolean(item.coverImage) ||
      Boolean(item.bannerImage)
    const hasTrailers = Array.isArray(item.trailers) && item.trailers.length > 0

    return {
      success: true,
      media: {
        ...item,
        creator: item.creator
          ? {
              id: item.creator.id,
              username: item.creator.username,
              displayName: creatorProfile?.displayName || item.creator.username,
              avatarUrl: creatorProfile?.avatarUrl || null,
            }
          : null,
        genres,
        tags,
        studios,
        characters,
        staff,
        relations,
        seasons,
        episodes,
        tracks,
        hasCharacters: characters.length > 0,
        hasStaff: staff.length > 0,
        hasRelations: relations.length > 0,
        hasEpisodes: episodes.length > 0 || seasons.length > 0,
        hasTracks: tracks.length > 0,
        hasLyrics: Boolean(item.lyrics || item.syncedLyrics),
        hasImages,
        hasTrailers,
      },
    }
  }

  /**
   * Update a custom item. Stores preUpdateSnapshot if published and notifies trackers.
   */
  public static async updateItem(
    userId: string,
    otherId: number,
    body: UpdateOtherBody,
    isAdmin = false
  ) {
    const existing: any = await prisma.orm.public.Other.where({ id: otherId }).first()
    if (!existing) {
      throw new NotFound(`Other item #${otherId} not found`)
    }
    if (existing.creatorId !== userId && !isAdmin) {
      throw new Forbidden('You do not have permission to edit this custom item.')
    }

    if (body.progressFields !== undefined || body.incrementFieldKey !== undefined) {
      const nextFields = (body.progressFields ?? existing.progressFields) as any[]
      const nextInc =
        body.incrementFieldKey !== undefined
          ? body.incrementFieldKey
          : existing.incrementFieldKey
      validateProgressFields(nextFields, nextInc)
    }

    const scalarData = buildOtherScalarData(body, false)

    // Store snapshot before mutating a published item
    if (existing.isPublished) {
      scalarData.preUpdateSnapshot = {
        titlePrimary: existing.titlePrimary,
        titleSecondary: existing.titleSecondary,
        titleNative: existing.titleNative,
        description: existing.description,
        coverImage: existing.coverImage,
        bannerImage: existing.bannerImage,
        format: existing.format,
        status: existing.status,
        progressFields: existing.progressFields,
        incrementFieldKey: existing.incrementFieldKey,
        customFields: existing.customFields,
        snapshotAt: new Date().toISOString(),
      }
    }

    await prisma.transaction(async (tx) => {
      if (Object.keys(scalarData).length > 0) {
        await tx.orm.public.Other.where({ id: otherId }).update(scalarData)
      }
      await syncOtherRelations(tx, otherId, body)
    })

    // Notify other users tracking this published item
    if (existing.isPublished) {
      const trackers = await prisma.orm.public.OtherList.where({ otherId })
        .select('userId')
        .all()
      const notifyTargets = trackers
        .map((t) => t.userId)
        .filter((uid) => uid !== userId && uid !== existing.creatorId)
      if (notifyTargets.length > 0) {
        await Promise.allSettled(
          notifyTargets.map((targetUid) =>
            CarinaNotificationsServ.createNotification({
              userId: targetUid,
              app: 'borealis',
              category: 'other_item_updated',
              type: 'INFO',
              content: {
                title: 'Tracked Custom Item Updated',
                body: `"${existing.titlePrimary}" was updated by its creator. You can fork a personal snapshot if needed.`,
                link: `/borealis/other/${otherId}`,
                metadata: { otherId, kind: 'other_item_updated' },
              },
            })
          )
        )
      }
    }

    return await this.getItem(otherId, userId, isAdmin)
  }

  /**
   * Delete a custom item. Blocked if tracked, favorited, or custom-listed by other users.
   */
  public static async deleteItem(userId: string, otherId: number, isAdmin = false) {
    const existing = await prisma.orm.public.Other.where({ id: otherId }).first()
    if (!existing) {
      throw new NotFound(`Other item #${otherId} not found`)
    }
    if (existing.creatorId !== userId && !isAdmin) {
      throw new Forbidden('You do not have permission to delete this custom item.')
    }

    const [otherUsersLists, otherUsersFavorites, otherUsersCustomLists] = await Promise.all([
      countOf(
        prisma.orm.public.OtherList.where((l) =>
          and(l.otherId.eq(otherId), not(l.userId.eq(existing.creatorId)))
        )
      ),
      countOf(
        prisma.orm.public.Favorite.where((f) =>
          and(
            f.type.eq('OTHER'),
            f.targetId.eq(otherId),
            not(f.userId.eq(existing.creatorId))
          )
        )
      ),
      countOf(
        prisma.orm.public.CustomListEntry.where((c) =>
          and(
            c.otherId.eq(otherId),
            c.customList.some((cl) => not(cl.userId.eq(existing.creatorId)))
          )
        )
      ),
    ])

    if (otherUsersLists > 0 || otherUsersFavorites > 0 || otherUsersCustomLists > 0) {
      throw new Conflict(
        'Cannot delete this item because other users are tracking, favoriting, or listing it.'
      )
    }

    await prisma.transaction(async (tx) => {
      await tx.orm.public.OtherList.where({ otherId }).delete()
      await tx.orm.public.Favorite.where({ type: 'OTHER', targetId: otherId }).delete()
      await tx.orm.public.CustomListEntry.where({ otherId }).delete()
      await tx.orm.public.Other.where({ id: otherId }).delete()
    })

    return {
      success: true,
      message: 'Custom item deleted successfully.',
    }
  }

  /**
   * Fork a custom item (from preUpdateSnapshot or current version) into the caller's private copy.
   */
  public static async forkItem(userId: string, otherId: number, isAdmin = false) {
    const source: any = await prisma.orm.public.Other.where({ id: otherId })
      .include('genres')
      .include('tags')
      .include('characters')
      .include('staff')
      .include('studios')
      .include('relations')
      .include('seasons')
      .include('episodes')
      .include('tracks')
      .first()

    if (!source) {
      throw new NotFound(`Other item #${otherId} not found`)
    }
    if (!source.isPublished && source.creatorId !== userId && !isAdmin) {
      throw new Forbidden('You cannot fork a private item.')
    }

    const snap: any = source.preUpdateSnapshot || {}
    const forkedId = await prisma.transaction(async (tx) => {
      const created = await tx.orm.public.Other.create({
        creatorId: userId,
        titlePrimary: snap.titlePrimary ?? source.titlePrimary,
        titleSecondary: snap.titleSecondary ?? source.titleSecondary,
        titleNative: snap.titleNative ?? source.titleNative,
        synonyms: source.synonyms ?? [],
        tagline: source.tagline,
        description: snap.description ?? source.description,
        hashtag: source.hashtag,
        coverImage: snap.coverImage ?? source.coverImage,
        bannerImage: snap.bannerImage ?? source.bannerImage,
        format: snap.format ?? source.format,
        source: source.source,
        status: (snap.status ?? source.status ?? 'UNKNOWN') as any,
        startDate: source.startDate,
        endDate: source.endDate,
        startDateYear: source.startDateYear,
        startDateMonth: source.startDateMonth,
        startDateDay: source.startDateDay,
        endDateYear: source.endDateYear,
        endDateMonth: source.endDateMonth,
        endDateDay: source.endDateDay,
        seasonSeason: source.seasonSeason,
        seasonYear: source.seasonYear,
        showType: source.showType,
        broadcastTime: source.broadcastTime,
        broadcastDays: source.broadcastDays ?? [],
        networks: source.networks ?? [],
        countryOfOrigin: source.countryOfOrigin,
        originalLanguage: source.originalLanguage,
        isAdult: Boolean(source.isAdult),
        ageRating: source.ageRating,
        ageRatingGuide: source.ageRatingGuide,
        esrbRating: source.esrbRating,
        pegiRating: source.pegiRating,
        episodeCount: source.episodeCount,
        episodeDuration: source.episodeDuration,
        seasonCount: source.seasonCount,
        chapterCount: source.chapterCount,
        volumeCount: source.volumeCount,
        pageCount: source.pageCount,
        runtime: source.runtime,
        duration: source.duration,
        totalTracks: source.totalTracks,
        authors: source.authors ?? [],
        developers: source.developers ?? [],
        publishers: source.publishers ?? [],
        platforms: source.platforms ?? [],
        franchise: source.franchise,
        series: source.series,
        seriesPosition: source.seriesPosition,
        subjects: source.subjects ?? [],
        gameModes: source.gameModes ?? [],
        playerPerspectives: source.playerPerspectives ?? [],
        controllerSupport: source.controllerSupport,
        requirements: source.requirements,
        languages: source.languages ?? [],
        budget: source.budget,
        revenue: source.revenue,
        awards: source.awards ?? [],
        isbn10: source.isbn10,
        isbn13: source.isbn13,
        retailPrice: source.retailPrice,
        retailPriceCurrency: source.retailPriceCurrency,
        albumType: source.albumType,
        label: source.label,
        artist: source.artist,
        artists: source.artists ?? [],
        artistPersonId: source.artistPersonId,
        bpm: source.bpm,
        gain: source.gain,
        explicitLyrics: Boolean(source.explicitLyrics),
        audioPreviewUrl: source.audioPreviewUrl,
        lyrics: source.lyrics,
        syncedLyrics: source.syncedLyrics,
        isrc: source.isrc,
        siteUrl: source.siteUrl,
        externalLinks: source.externalLinks,
        previewLink: source.previewLink,
        infoLink: source.infoLink,
        buyLink: source.buyLink,
        images: source.images,
        trailers: source.trailers,
        themeSongs: source.themeSongs,
        customFields: snap.customFields ?? source.customFields ?? [],
        progressFields: snap.progressFields ?? source.progressFields ?? [],
        incrementFieldKey: snap.incrementFieldKey ?? source.incrementFieldKey,
        isPublished: false,
      })

      for (const g of source.genres || []) {
        await tx.orm.public.OtherGenre.create({ otherId: created.id, genreId: g.genreId })
      }
      for (const t of source.tags || []) {
        await tx.orm.public.OtherTag.create({
          otherId: created.id,
          tagId: t.tagId,
          rank: t.rank,
          isSpoiler: t.isSpoiler,
        })
      }
      for (const c of source.characters || []) {
        await tx.orm.public.OtherCharacter.create({
          otherId: created.id,
          characterId: c.characterId,
          actorId: c.actorId,
          role: c.role,
          order: c.order,
        })
      }
      for (const s of source.staff || []) {
        await tx.orm.public.OtherStaff.create({
          otherId: created.id,
          personId: s.personId,
          role: s.role,
          customRole: s.customRole,
        })
      }
      for (const st of source.studios || []) {
        await tx.orm.public.OtherStudio.create({
          otherId: created.id,
          studioId: st.studioId,
          isMain: st.isMain,
        })
      }
      for (const rel of source.relations || []) {
        await tx.orm.public.OtherRelation.create({
          otherId: created.id,
          targetType: rel.targetType,
          targetId: rel.targetId,
          relationType: rel.relationType,
        })
      }
      const seasonMap = new Map<number, number>()
      for (const sn of source.seasons || []) {
        const createdSeason = await tx.orm.public.OtherSeason.create({
          otherId: created.id,
          seasonNumber: sn.seasonNumber,
          name: sn.name,
          overview: sn.overview,
          posterPath: sn.posterPath,
          airDate: sn.airDate,
          episodeCount: sn.episodeCount,
        })
        seasonMap.set(sn.id, createdSeason.id)
      }
      for (const ep of source.episodes || []) {
        await tx.orm.public.OtherEpisode.create({
          otherId: created.id,
          seasonId: ep.seasonId ? (seasonMap.get(ep.seasonId) ?? null) : null,
          episodeNumber: ep.episodeNumber,
          seasonNumber: ep.seasonNumber,
          name: ep.name,
          overview: ep.overview,
          airDate: ep.airDate,
          runtime: ep.runtime,
          stillPath: ep.stillPath,
          episodeType: ep.episodeType,
        })
      }
      for (const tr of source.tracks || []) {
        await tx.orm.public.OtherTrack.create({
          otherId: created.id,
          trackNumber: tr.trackNumber,
          discNumber: tr.discNumber,
          titlePrimary: tr.titlePrimary,
          artistName: tr.artistName,
          artistPersonId: tr.artistPersonId,
          duration: tr.duration,
          explicitLyrics: tr.explicitLyrics,
          audioPreviewUrl: tr.audioPreviewUrl,
        })
      }

      return created.id
    })

    const existingListEntry = await prisma.orm.public.OtherList.where({
      userId,
      otherId,
    }).first()

    if (existingListEntry) {
      await prisma.orm.public.OtherList.where({ id: existingListEntry.id }).delete()
      await prisma.orm.public.OtherList.create({
        userId,
        otherId: forkedId,
        status: existingListEntry.status,
        priority: existingListEntry.priority,
        progressValues: existingListEntry.progressValues ?? {},
        score: existingListEntry.score,
        notes: existingListEntry.notes,
        private: existingListEntry.private,
        rewatched: existingListEntry.rewatched ?? 0,
        rewatchHistory: existingListEntry.rewatchHistory ?? null,
        startedAt: existingListEntry.startedAt,
        completedAt: existingListEntry.completedAt,
      })
    }

    return await this.getItem(forkedId, userId, isAdmin)
  }

  /**
   * Upload a cover, banner, or gallery WebP asset to S3.
   */
  public static async uploadAsset(
    userId: string,
    file: File,
    type: 'cover' | 'banner' | 'gallery'
  ) {
    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.byteLength > 10 * 1024 * 1024) {
      throw new BadRequest('File must be smaller than 10MB')
    }
    const ext = file.type === 'image/webp' ? 'webp' : file.name.split('.').pop() || 'webp'
    const key = `borealis/other/${userId}/${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { publicUrl } = await uploadPublicAsset({
      key,
      body: buffer,
      contentType: file.type || 'image/webp',
    })
    return {
      success: true,
      url: publicUrl,
    }
  }

  /**
   * Similar published Other items ranked by shared genres, tags, and format.
   */
  public static async getSimilar(otherId: number, limit = 24) {
    const source: any = await prisma.orm.public.Other.where({ id: otherId })
      .include('genres', (g) => g.include('genre', (ge) => ge.select('id', 'name')))
      .include('tags', (t) => t.include('tag', (te) => te.select('id', 'name')))
      .first()

    if (!source) {
      throw new NotFound(`Other item #${otherId} not found`)
    }

    const sourceGenreIds = new Set<number>(
      (source.genres || []).map((g: any) => g.genreId).filter(Boolean)
    )
    const sourceTagIds = new Set<number>(
      (source.tags || []).map((t: any) => t.tagId).filter(Boolean)
    )

    const candidates: any[] = await prisma.orm.public.Other.where((o) =>
      and(o.isPublished.eq(true), not(o.id.eq(otherId)))
    )
      .include('genres', (g) => g.include('genre', (ge) => ge.select('id', 'name')))
      .include('tags')
      .orderBy((o) => o.popularity.desc())
      .limit(120)
      .all()

    const scored = candidates
      .map((c) => {
        let overlap = 0
        for (const g of c.genres || []) {
          if (sourceGenreIds.has(g.genreId)) overlap += 3
        }
        for (const t of c.tags || []) {
          if (sourceTagIds.has(t.tagId)) overlap += 2
        }
        if (source.format && c.format === source.format) overlap += 2
        return { item: c, score: overlap }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return (b.item.popularity ?? 0) - (a.item.popularity ?? 0)
      })
      .slice(0, limit)

    return {
      success: true,
      items: scored.map(({ item: m }) => ({
        id: m.id,
        type: 'other',
        format: m.format ?? null,
        coverImage: m.coverImage ?? null,
        bannerImage: m.bannerImage ?? null,
        description: m.description ?? null,
        status: m.status ?? 'UNKNOWN',
        titlePrimary: m.titlePrimary,
        titleSecondary: m.titleSecondary ?? null,
        titleNative: m.titleNative ?? null,
        startDateYear: m.startDateYear ?? null,
        averageScore: m.averageScore ?? null,
        genres: (m.genres || []).filter((g: any) => Boolean(g.genre)).map((g: any) => g.genre.name),
      })),
    }
  }

  public static async getRelations(otherId: number) {
    const exists = await prisma.orm.public.Other.where({ id: otherId }).select('id').first()
    if (!exists) throw new NotFound(`Other item #${otherId} not found`)
    const relations = await resolveOtherRelations(otherId)
    return { success: true, relations }
  }

  public static async getCharacters(otherId: number) {
    const item = await prisma.orm.public.Other.where({ id: otherId })
      .select('id')
      .include('characters', (c) =>
        c
          .include('character')
          .include('actor', (a) => a.select('id', 'namePrimary', 'nameNative', 'image'))
      )
      .first()
    if (!item) throw new NotFound(`Other item #${otherId} not found`)
    const characters = ((item as any).characters || [])
      .filter((c: any) => Boolean(c.character))
      .map((c: any) => ({
        id: c.characterId,
        role: c.role,
        order: c.order ?? null,
        characterData: c.character,
        voiceActor: c.actor ?? null,
      }))
    return { success: true, characters }
  }

  public static async getStaff(otherId: number) {
    const item = await prisma.orm.public.Other.where({ id: otherId })
      .select('id')
      .include('staff', (s) =>
        s.include('person', (p) => p.select('id', 'namePrimary', 'nameNative', 'image'))
      )
      .first()
    if (!item) throw new NotFound(`Other item #${otherId} not found`)
    const staff = ((item as any).staff || [])
      .filter((s: any) => Boolean(s.person))
      .map((s: any) => ({
        id: s.id,
        personId: s.personId,
        role: s.role,
        customRole: s.customRole ?? null,
        person: s.person,
      }))
    return { success: true, staff }
  }

  public static async getEpisodes(otherId: number) {
    const exists = await prisma.orm.public.Other.where({ id: otherId }).select('id').first()
    if (!exists) throw new NotFound(`Other item #${otherId} not found`)
    const episodes = await prisma.orm.public.OtherEpisode.where({ otherId }).all()
    episodes.sort((a, b) => {
      const sa = a.seasonNumber ?? 1
      const sb = b.seasonNumber ?? 1
      if (sa !== sb) return sa - sb
      return a.episodeNumber - b.episodeNumber
    })
    return { success: true, episodes }
  }

  public static async getSeasons(otherId: number) {
    const exists = await prisma.orm.public.Other.where({ id: otherId }).select('id').first()
    if (!exists) throw new NotFound(`Other item #${otherId} not found`)
    const seasons = await prisma.orm.public.OtherSeason.where({ otherId })
      .orderBy((s) => s.seasonNumber.asc())
      .all()
    return { success: true, seasons }
  }

  public static async getImages(otherId: number) {
    const item = await prisma.orm.public.Other.where({ id: otherId })
      .select('id', 'coverImage', 'bannerImage', 'images')
      .first()
    if (!item) throw new NotFound(`Other item #${otherId} not found`)
    return {
      success: true,
      images: {
        coverImage: item.coverImage ?? null,
        bannerImage: item.bannerImage ?? null,
        ...(typeof item.images === 'object' && item.images && !Array.isArray(item.images)
          ? item.images
          : { gallery: Array.isArray(item.images) ? item.images : [] }),
      },
    }
  }

  public static async getStats(otherId: number) {
    const item = await prisma.orm.public.Other.where({ id: otherId })
      .select(
        'id',
        'averageScore',
        'popularity',
        'favorites',
        'statusDistribution',
        'scoreDistribution'
      )
      .first()
    if (!item) throw new NotFound(`Other item #${otherId} not found`)
    return {
      success: true,
      stats: {
        averageScore: item.averageScore ?? null,
        popularity: item.popularity ?? 0,
        favorites: item.favorites ?? 0,
        statusDistribution: item.statusDistribution ?? {},
        scoreDistribution: item.scoreDistribution ?? {},
      },
    }
  }

  public static async getFriends(
    otherId: number,
    currentUserId?: string,
    _query?: OtherFriendsQuery
  ) {
    if (!currentUserId) return { success: true, friends: [] }
    const friendships = await prisma.orm.public.Friend.where((f) =>
      or(f.userId.eq(currentUserId), f.friendId.eq(currentUserId))
    )
      .select('userId', 'friendId')
      .all()
    const friendIds = friendships.map((f) =>
      f.userId === currentUserId ? f.friendId : f.userId
    )
    if (friendIds.length === 0) return { success: true, friends: [] }

    const entries = await prisma.orm.public.OtherList.where((l) =>
      and(l.otherId.eq(otherId), l.userId.in(friendIds), l.private.eq(false))
    )
      .include('user', (u) => u.select('id', 'username', 'customization'))
      .orderBy((l) => l.updatedAt.desc())
      .all()

    return {
      success: true,
      friends: entries.map((e: any) => {
        const profile = getProfileCustomization(e.user?.customization)
        return {
          id: e.id,
          userId: e.userId,
          status: e.status,
          score: e.score ?? null,
          progressValues: e.progressValues ?? {},
          updatedAt: toDate(e.updatedAt).toISOString(),
          user: {
            id: e.user?.id ?? e.userId,
            username: e.user?.username ?? 'Unknown',
            displayName: profile.displayName || e.user?.username || 'Unknown',
            avatarUrl: profile.avatarUrl || null,
          },
        }
      }),
    }
  }

  public static async getPeople(otherId: number, query?: OtherPeopleQuery) {
    const page = Math.max(1, Number(query?.page ?? 1))
    const limit = Math.max(1, Math.min(100, Number(query?.limit ?? 20)))
    const skip = (page - 1) * limit

    const q = prisma.orm.public.OtherList.where((l) =>
      and(l.otherId.eq(otherId), l.private.eq(false))
    )
    const [total, entries] = await Promise.all([
      countOf(q),
      q
        .include('user', (u) => u.select('id', 'username', 'customization'))
        .orderBy((l) => l.updatedAt.desc())
        .offset(skip)
        .limit(limit)
        .all(),
    ])

    const totalPages = Math.ceil(total / limit) || 1
    return {
      success: true,
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
      people: entries.map((e: any) => {
        const profile = getProfileCustomization(e.user?.customization)
        return {
          id: e.id,
          userId: e.userId,
          status: e.status,
          score: e.score ?? null,
          progressValues: e.progressValues ?? {},
          updatedAt: toDate(e.updatedAt).toISOString(),
          user: {
            id: e.user?.id ?? e.userId,
            username: e.user?.username ?? 'Unknown',
            displayName: profile.displayName || e.user?.username || 'Unknown',
            avatarUrl: profile.avatarUrl || null,
          },
        }
      }),
    }
  }

  /**
   * Community recommendations scoped strictly to sourceType = 'OTHER'.
   */
  public static async getRecommendations(otherId: number) {
    const recs = await prisma.orm.public.MediaRecommendation.where((r) =>
      and(r.sourceType.eq('OTHER' as MediaType), r.sourceId.eq(otherId))
    )
      .include('user', (u: any) => u.select('id', 'username', 'customization'))
      .orderBy((r) => r.score.desc())
      .all()

    return {
      success: true,
      recommendations: recs.map((r: any) => {
        const profile = getProfileCustomization(r.user?.customization)
        return {
          id: r.id,
          sourceType: r.sourceType,
          sourceId: r.sourceId,
          targetType: r.targetType,
          targetId: r.targetId,
          body: r.body,
          upvotes: r.upvotes,
          downvotes: r.downvotes,
          score: r.score,
          createdAt: toDate(r.createdAt).toISOString(),
          user: {
            id: r.user?.id || r.userId,
            username: r.user?.username || 'Unknown',
            displayName: profile.displayName || r.user?.username || 'Unknown',
            avatarUrl: profile.avatarUrl || null,
          },
        }
      }),
    }
  }
}
