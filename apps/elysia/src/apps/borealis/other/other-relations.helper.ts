import {
  prisma,
  type CharacterRole,
  type MediaType,
  type StaffRole,
} from '@NamelessLiberty/db'
import { BadRequest } from '../../../core/errors/http-errors'
import type { CreateOtherBody, UpdateOtherBody } from './other.model'

type TxClient = Parameters<Parameters<typeof prisma.transaction>[0]>[0]

function slugifyTaxonomy(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item'
}

export function normalizeDateInput(val?: string | null): Date | null | undefined {
  if (val === undefined) return undefined
  if (val === null || val === '') return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Builds the flat scalar/JSON payload for Other.create / Other.update
 * without duplicating field mapping across both paths.
 */
export function buildOtherScalarData(
  body: Partial<CreateOtherBody> | UpdateOtherBody,
  isCreate = false
): Record<string, any> {
  const data: Record<string, any> = {}

  const directKeys = [
    'titleSecondary',
    'titleNative',
    'tagline',
    'description',
    'hashtag',
    'coverImage',
    'bannerImage',
    'format',
    'source',
    'status',
    'startDateYear',
    'startDateMonth',
    'startDateDay',
    'endDateYear',
    'endDateMonth',
    'endDateDay',
    'seasonSeason',
    'seasonYear',
    'showType',
    'broadcastTime',
    'countryOfOrigin',
    'originalLanguage',
    'nextAiringEpisodeNumber',
    'isAdult',
    'ageRating',
    'ageRatingGuide',
    'esrbRating',
    'pegiRating',
    'episodeCount',
    'episodeDuration',
    'seasonCount',
    'chapterCount',
    'volumeCount',
    'pageCount',
    'runtime',
    'duration',
    'totalTracks',
    'franchise',
    'series',
    'seriesPosition',
    'controllerSupport',
    'requirements',
    'budget',
    'revenue',
    'isbn10',
    'isbn13',
    'retailPrice',
    'retailPriceCurrency',
    'albumType',
    'label',
    'artist',
    'artistPersonId',
    'bpm',
    'gain',
    'explicitLyrics',
    'audioPreviewUrl',
    'lyrics',
    'syncedLyrics',
    'isrc',
    'siteUrl',
    'externalLinks',
    'previewLink',
    'infoLink',
    'buyLink',
    'images',
    'trailers',
    'themeSongs',
    'isPublished',
    'customFields',
    'progressFields',
    'incrementFieldKey',
  ] as const

  if (body.titlePrimary !== undefined) {
    data.titlePrimary = body.titlePrimary.trim()
  }

  for (const key of directKeys) {
    const val = (body as any)[key]
    if (val !== undefined) {
      data[key] = typeof val === 'string' ? val.trim() || null : val
    }
  }
  if (typeof data.format === 'string') {
    data.format = data.format.toLowerCase()
  }

  // Keep empty strings clean for required-ish optional strings
  if (body.lyrics !== undefined) data.lyrics = body.lyrics
  if (body.syncedLyrics !== undefined) data.syncedLyrics = body.syncedLyrics
  if (body.description !== undefined) data.description = body.description

  const arrayKeys = [
    'synonyms',
    'broadcastDays',
    'networks',
    'authors',
    'developers',
    'publishers',
    'platforms',
    'subjects',
    'gameModes',
    'playerPerspectives',
    'languages',
    'awards',
    'artists',
  ] as const

  for (const key of arrayKeys) {
    const val = (body as any)[key]
    if (val !== undefined) {
      data[key] = Array.isArray(val)
        ? val.map((s) => String(s).trim()).filter(Boolean)
        : []
    }
  }

  const sd = normalizeDateInput(body.startDate)
  if (sd !== undefined) data.startDate = sd
  const ed = normalizeDateInput(body.endDate)
  if (ed !== undefined) data.endDate = ed
  const na = normalizeDateInput(body.nextAiringAt)
  if (na !== undefined) data.nextAiringAt = na

  // Derive fallback startDateYear/Month/Day from startDate if omitted
  if (sd instanceof Date && data.startDateYear === undefined) {
    data.startDateYear = sd.getUTCFullYear()
    data.startDateMonth = sd.getUTCMonth() + 1
    data.startDateDay = sd.getUTCDate()
  }
  if (ed instanceof Date && data.endDateYear === undefined) {
    data.endDateYear = ed.getUTCFullYear()
    data.endDateMonth = ed.getUTCMonth() + 1
    data.endDateDay = ed.getUTCDate()
  }

  if (isCreate) {
    if (data.status === undefined) data.status = 'UNKNOWN'
    if (data.isPublished === undefined) data.isPublished = false
    if (data.customFields === undefined) data.customFields = []
  }

  return data
}

/**
 * Syncs one-way sub-tables (genres, tags, characters, staff, studios, relations, seasons, episodes, tracks)
 * when explicitly provided in the request payload.
 */
export async function syncOtherRelations(
  tx: TxClient,
  otherId: number,
  body: Partial<CreateOtherBody> | UpdateOtherBody
): Promise<void> {
  // 1. Genres (shared Genre table + inline creation)
  if (body.genres !== undefined) {
    await tx.orm.public.OtherGenre.where({ otherId }).delete()
    const seen = new Set<number>()
    for (const rawName of body.genres) {
      const name = rawName.trim()
      if (!name) continue
      const slug = slugifyTaxonomy(name)
      let genre = await tx.orm.public.Genre.where({ slug }).select('id').first()
      if (!genre) {
        genre = await tx.orm.public.Genre.where({ name }).select('id').first()
      }
      if (!genre) {
        genre = await tx.orm.public.Genre.create({ name, slug })
      }
      if (!seen.has(genre.id)) {
        seen.add(genre.id)
        await tx.orm.public.OtherGenre.create({ otherId, genreId: genre.id })
      }
    }
  }

  // 2. Tags (shared Tag table + inline creation)
  if (body.tags !== undefined) {
    await tx.orm.public.OtherTag.where({ otherId }).delete()
    const seen = new Set<number>()
    for (const entry of body.tags) {
      const name = (typeof entry === 'string' ? entry : entry.name).trim()
      if (!name) continue
      const rank = typeof entry === 'string' ? null : (entry.rank ?? null)
      const isSpoiler = typeof entry === 'string' ? false : Boolean(entry.isSpoiler)
      const slug = slugifyTaxonomy(name)
      let tag = await tx.orm.public.Tag.where({ slug }).select('id').first()
      if (!tag) {
        tag = await tx.orm.public.Tag.where({ name }).select('id').first()
      }
      if (!tag) {
        tag = await tx.orm.public.Tag.create({ name, slug })
      }
      if (!seen.has(tag.id)) {
        seen.add(tag.id)
        await tx.orm.public.OtherTag.create({
          otherId,
          tagId: tag.id,
          rank,
          isSpoiler,
        })
      }
    }
  }

  // 3. Characters (strictly existing DB Characters + optional Person actor)
  if (body.characters !== undefined) {
    await tx.orm.public.OtherCharacter.where({ otherId }).delete()
    for (const ch of body.characters) {
      const exists = await tx.orm.public.Character.where({ id: ch.characterId })
        .select('id')
        .first()
      if (!exists) {
        throw new BadRequest(`Character #${ch.characterId} does not exist`)
      }
      if (ch.actorId) {
        const actorExists = await tx.orm.public.Person.where({ id: ch.actorId })
          .select('id')
          .first()
        if (!actorExists) {
          throw new BadRequest(`Actor person #${ch.actorId} does not exist`)
        }
      }
      await tx.orm.public.OtherCharacter.create({
        otherId,
        characterId: ch.characterId,
        actorId: ch.actorId ?? null,
        role: (ch.role ?? 'MAIN') as CharacterRole,
        order: ch.order ?? null,
      })
    }
  }

  // 4. Staff (strictly existing DB Person)
  if (body.staff !== undefined) {
    await tx.orm.public.OtherStaff.where({ otherId }).delete()
    for (const st of body.staff) {
      const exists = await tx.orm.public.Person.where({ id: st.personId })
        .select('id')
        .first()
      if (!exists) {
        throw new BadRequest(`Person #${st.personId} does not exist`)
      }
      await tx.orm.public.OtherStaff.create({
        otherId,
        personId: st.personId,
        role: (st.role || 'OTHER') as StaffRole,
        customRole: st.customRole ?? null,
      })
    }
  }

  // 5. Studios (strictly existing DB Studio)
  if (body.studios !== undefined) {
    await tx.orm.public.OtherStudio.where({ otherId }).delete()
    const seen = new Set<number>()
    for (const st of body.studios) {
      if (seen.has(st.studioId)) continue
      seen.add(st.studioId)
      const exists = await tx.orm.public.Studio.where({ id: st.studioId })
        .select('id')
        .first()
      if (!exists) {
        throw new BadRequest(`Studio #${st.studioId} does not exist`)
      }
      await tx.orm.public.OtherStudio.create({
        otherId,
        studioId: st.studioId,
        isMain: Boolean(st.isMain),
      })
    }
  }

  // 6. Relations (strictly one-way to existing media)
  if (body.relations !== undefined) {
    await tx.orm.public.OtherRelation.where({ otherId }).delete()
    for (const rel of body.relations) {
      if (rel.targetType === 'OTHER' && rel.targetId === otherId) {
        throw new BadRequest('An item cannot relate to itself')
      }
      await tx.orm.public.OtherRelation.create({
        otherId,
        targetType: rel.targetType as MediaType,
        targetId: rel.targetId,
        relationType: rel.relationType,
      })
    }
  }

  // 7. Seasons & Episodes
  const seasonIdByNumber = new Map<number, number>()
  if (body.seasons !== undefined) {
    await tx.orm.public.OtherEpisode.where({ otherId }).delete()
    await tx.orm.public.OtherSeason.where({ otherId }).delete()
    for (const s of body.seasons) {
      const created = await tx.orm.public.OtherSeason.create({
        otherId,
        seasonNumber: s.seasonNumber,
        name: s.name ?? null,
        overview: s.overview ?? null,
        posterPath: s.posterPath ?? null,
        airDate: normalizeDateInput(s.airDate) ?? null,
        episodeCount: s.episodeCount ?? null,
      })
      seasonIdByNumber.set(s.seasonNumber, created.id)
    }
  }

  if (body.episodes !== undefined) {
    if (body.seasons === undefined) {
      await tx.orm.public.OtherEpisode.where({ otherId }).delete()
      const existingSeasons = await tx.orm.public.OtherSeason.where({ otherId })
        .select('id', 'seasonNumber')
        .all()
      for (const s of existingSeasons) {
        seasonIdByNumber.set(s.seasonNumber, s.id)
      }
    }
    for (const ep of body.episodes) {
      const seasonId =
        ep.seasonNumber != null ? (seasonIdByNumber.get(ep.seasonNumber) ?? null) : null
      await tx.orm.public.OtherEpisode.create({
        otherId,
        seasonId,
        episodeNumber: ep.episodeNumber,
        seasonNumber: ep.seasonNumber ?? null,
        name: ep.name ?? null,
        overview: ep.overview ?? null,
        airDate: normalizeDateInput(ep.airDate) ?? null,
        runtime: ep.runtime ?? null,
        stillPath: ep.stillPath ?? null,
        episodeType: ep.episodeType ?? null,
      })
    }
  }

  // 8. Tracks
  if (body.tracks !== undefined) {
    await tx.orm.public.OtherTrack.where({ otherId }).delete()
    for (const tr of body.tracks) {
      await tx.orm.public.OtherTrack.create({
        otherId,
        trackNumber: tr.trackNumber,
        discNumber: tr.discNumber ?? 1,
        titlePrimary: tr.titlePrimary.trim(),
        artistName: tr.artistName ?? null,
        artistPersonId: tr.artistPersonId ?? null,
        duration: tr.duration ?? null,
        explicitLyrics: Boolean(tr.explicitLyrics),
        audioPreviewUrl: tr.audioPreviewUrl ?? null,
      })
    }
  }
}

/**
 * Resolves OtherRelation targets across all Borealis media tables (read-only, one-way).
 */
export async function resolveOtherRelations(otherId: number) {
  const rels = await prisma.orm.public.OtherRelation.where({ otherId }).all()
  if (rels.length === 0) return []

  const results = await Promise.all(
    rels.map(async (r) => {
      let target: any = null
      const id = r.targetId
      switch (r.targetType) {
        case 'ANIME':
          target = await prisma.orm.public.Anime.where({ id })
            .select('id', 'titlePrimary', 'titleSecondary', 'titleNative', 'coverImage', 'bannerImage', 'format', 'status', 'seasonYear', 'averageScore')
            .first()
          break
        case 'MANGA':
          target = await prisma.orm.public.Manga.where({ id })
            .select('id', 'titlePrimary', 'titleSecondary', 'titleNative', 'coverImage', 'bannerImage', 'format', 'status', 'startDateYear', 'averageScore')
            .first()
          break
        case 'MOVIE':
          target = await prisma.orm.public.Movie.where({ id })
            .select('id', 'titlePrimary', 'titleSecondary', 'titleNative', 'coverImage', 'bannerImage', 'status', 'releaseDateYear', 'averageScore')
            .first()
          break
        case 'TV':
          target = await prisma.orm.public.Tv.where({ id })
            .select('id', 'titlePrimary', 'titleSecondary', 'titleNative', 'coverImage', 'bannerImage', 'showType', 'status', 'firstAiredYear', 'averageScore')
            .first()
          break
        case 'GAME':
          target = await prisma.orm.public.Game.where({ id })
            .select('id', 'titlePrimary', 'titleSecondary', 'titleNative', 'coverImage', 'bannerImage', 'status', 'releaseDateYear', 'averageScore')
            .first()
          break
        case 'BOOK':
          target = await prisma.orm.public.Book.where({ id })
            .select('id', 'titlePrimary', 'titleSecondary', 'coverImage', 'bannerImage', 'format', 'status', 'releaseDateYear', 'averageScore')
            .first()
          break
        case 'MUSIC':
          target = await prisma.orm.public.Music.where({ id })
            .select('id', 'titlePrimary', 'titleSecondary', 'coverImage', 'type', 'releaseDateYear')
            .first()
          break
        case 'OTHER':
          target = await prisma.orm.public.Other.where({ id })
            .select('id', 'titlePrimary', 'titleSecondary', 'titleNative', 'coverImage', 'bannerImage', 'format', 'status', 'startDateYear', 'averageScore')
            .first()
          break
      }
      if (!target) return null
      const category = r.targetType.toLowerCase()
      return {
        id: r.id,
        relationType: r.relationType,
        targetType: r.targetType,
        targetId: r.targetId,
        target: {
          ...target,
          type: category === 'movie' ? 'movies' : category === 'game' ? 'games' : category === 'book' ? 'books' : category,
          year:
            target.seasonYear ??
            target.startDateYear ??
            target.releaseDateYear ??
            target.firstAiredYear ??
            null,
        },
      }
    })
  )

  return results.filter(Boolean)
}
