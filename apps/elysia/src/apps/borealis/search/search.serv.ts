import { BaseService } from '../../../core/base/base.serv'
import { BadRequest } from '../../../core/errors/http-errors'
import { BorealisExternalSearchServ } from './external-search.serv'
import type { PreviewResult } from '../sync/media-preview.syncer'
import {
  searchAnimeRaw,
  searchBookRaw,
  searchCharacterRaw,
  searchGameRaw,
  searchMangaRaw,
  searchMovieRaw,
  searchMusicRaw,
  searchOtherRaw,
  searchPersonRaw,
  searchStudioRaw,
  searchTvRaw,
} from './search-query.helper'

export interface SearchQuery {
  q: string
  category?:
    | 'media'
    | 'anime'
    | 'manga'
    | 'movies'
    | 'movie'
    | 'tv'
    | 'games'
    | 'game'
    | 'music'
    | 'books'
    | 'book'
    | 'characters'
    | 'character'
    | 'people'
    | 'staff'
    | 'studios'
    | 'studio'
    | 'other'
  page?: number
  limit?: number
  external?: boolean | string
}

function mergeWithExternal<T extends { id: number }>(
  items: T[],
  externalStubs: PreviewResult[],
  mediaType: string,
  skip: number,
  hasMore: boolean
) {
  const externalIds = new Set(externalStubs.map((s) => s.id))
  const results = items.map((x) => ({
    ...x,
    mediaType,
    queuedForFetch:
      externalIds.has(x.id) ||
      (x as any).alUpdatedAt === null ||
      (x as any).tvdbUpdatedAt === null,
  }))

  const existingIds = new Set(items.map((x) => x.id))
  const newStubs = externalStubs
    .filter((stub) => !existingIds.has(stub.id))
    .map((stub) => ({
      ...stub,
      mediaType,
      queuedForFetch: true,
    }))

  const combined = [...results, ...newStubs]
  const total = skip + combined.length + (hasMore ? 1 : 0)
  return {
    results: combined,
    total,
    hasMore,
  }
}

export class BorealisSearchServ extends BaseService {
  /**
   * Unified catalog search across media formats and entities.
   */
  public static async search(query: SearchQuery) {
    const rawQuery = query.q
    if (!rawQuery || rawQuery.trim().length === 0) {
      throw new BadRequest('Query parameter "q" cannot be empty.')
    }

    const cleanQuery = rawQuery.trim()
    const category = query.category || 'media'
    const page = Math.max(1, Number(query.page || 1))
    const limit = Math.min(50, Math.max(1, Number(query.limit || 20)))
    const skip = (page - 1) * limit
    const isExternal =
      query.external === true ||
      query.external === 'true' ||
      query.external === '1'

    let externalStubs: PreviewResult[] = []
    if (
      isExternal &&
      [
        'anime',
        'manga',
        'movies',
        'tv',
        'games',
        'books',
        'music',
        'characters',
        'people',
        'staff',
      ].includes(category)
    ) {
      externalStubs = await BorealisExternalSearchServ.enqueueSearchFetch(
        category,
        cleanQuery,
        limit
      )
    }

    const formatPaginated = (
      results: any[],
      total: number,
      hasMore: boolean,
      cat: string = category
    ) => ({
      success: true,
      category: cat,
      query: cleanQuery,
      results,
      pagination: {
        page,
        limit,
        total,
        hasMore,
      },
    })

    switch (category) {
      case 'anime': {
        const { items, hasMore } = await searchAnimeRaw(cleanQuery, limit, skip)
        const merged = mergeWithExternal(items, externalStubs, 'anime', skip, hasMore)
        return formatPaginated(merged.results, merged.total, merged.hasMore)
      }

      case 'manga': {
        const { items, hasMore } = await searchMangaRaw(cleanQuery, limit, skip)
        const merged = mergeWithExternal(items, externalStubs, 'manga', skip, hasMore)
        return formatPaginated(merged.results, merged.total, merged.hasMore)
      }

      case 'movie':
      case 'movies': {
        const { items, hasMore } = await searchMovieRaw(cleanQuery, limit, skip)
        const merged = mergeWithExternal(items, externalStubs, 'movie', skip, hasMore)
        return formatPaginated(merged.results, merged.total, merged.hasMore)
      }

      case 'tv': {
        const { items, hasMore } = await searchTvRaw(cleanQuery, limit, skip)
        const merged = mergeWithExternal(items, externalStubs, 'tv', skip, hasMore)
        return formatPaginated(merged.results, merged.total, merged.hasMore)
      }

      case 'game':
      case 'games': {
        const { items, hasMore } = await searchGameRaw(cleanQuery, limit, skip)
        const merged = mergeWithExternal(items, externalStubs, 'game', skip, hasMore)
        return formatPaginated(merged.results, merged.total, merged.hasMore)
      }

      case 'music': {
        const { items, hasMore } = await searchMusicRaw(cleanQuery, limit, skip)
        const merged = mergeWithExternal(items, externalStubs, 'music', skip, hasMore)
        return formatPaginated(merged.results, merged.total, merged.hasMore)
      }

      case 'book':
      case 'books': {
        const { items, hasMore } = await searchBookRaw(cleanQuery, limit, skip)
        const merged = mergeWithExternal(items, externalStubs, 'book', skip, hasMore)
        return formatPaginated(merged.results, merged.total, merged.hasMore)
      }

      case 'character':
      case 'characters': {
        const { items, hasMore } = await searchCharacterRaw(cleanQuery, limit, skip)
        const merged = mergeWithExternal(items, externalStubs, 'characters', skip, hasMore)
        return formatPaginated(merged.results, merged.total, merged.hasMore)
      }

      case 'staff':
      case 'people': {
        const { items, hasMore } = await searchPersonRaw(cleanQuery, limit, skip)
        const merged = mergeWithExternal(items, externalStubs, 'people', skip, hasMore)
        return formatPaginated(merged.results, merged.total, merged.hasMore)
      }

      case 'studio':
      case 'studios': {
        const { items, hasMore } = await searchStudioRaw(cleanQuery, limit, skip)
        const total = skip + items.length + (hasMore ? 1 : 0)
        return formatPaginated(items, total, hasMore)
      }

      case 'other': {
        const { items, hasMore } = await searchOtherRaw(cleanQuery, limit, skip)
        const total = skip + items.length + (hasMore ? 1 : 0)
        return formatPaginated(items, total, hasMore)
      }

      case 'media':
      default: {
        const [anime, manga, tv, movie, game, book, music, other] =
          await Promise.all([
            searchAnimeRaw(cleanQuery, limit, 0),
            searchMangaRaw(cleanQuery, limit, 0),
            searchTvRaw(cleanQuery, limit, 0),
            searchMovieRaw(cleanQuery, limit, 0),
            searchGameRaw(cleanQuery, limit, 0),
            searchBookRaw(cleanQuery, limit, 0),
            searchMusicRaw(cleanQuery, limit, 0),
            searchOtherRaw(cleanQuery, limit, 0),
          ])

        const combined = [
          ...anime.items.map((x) => ({ ...x, mediaType: 'anime' })),
          ...manga.items.map((x) => ({ ...x, mediaType: 'manga' })),
          ...tv.items.map((x) => ({ ...x, mediaType: 'tv' })),
          ...movie.items.map((x) => ({ ...x, mediaType: 'movie' })),
          ...game.items.map((x) => ({ ...x, mediaType: 'game' })),
          ...book.items.map((x) => ({ ...x, mediaType: 'book' })),
          ...music.items.map((x) => ({ ...x, mediaType: 'music' })),
          ...other.items.map((x) => ({ ...x, mediaType: 'other' })),
        ]

        const total = combined.length
        const results = combined.slice(skip, skip + limit)
        return formatPaginated(results, total, skip + results.length < total, 'media')
      }
    }
  }
}
