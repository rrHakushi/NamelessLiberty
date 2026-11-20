import { prisma } from '@NamelessLiberty/db'

export interface PaginatedRawResult<T> {
  items: T[]
  hasMore: boolean
}

function paginateRows<T>(rows: T[], limit: number): PaginatedRawResult<T> {
  const hasMore = rows.length > limit
  return {
    items: hasMore ? rows.slice(0, limit) : rows,
    hasMore,
  }
}

type RowSpec = Record<string, string>

/**
 * Executes a parameterized raw SQL query through Prisma 8's raw SQL lane
 * with explicit column codecs, returning typed rows in a single round-trip.
 */
function runRaw<T extends Record<string, unknown>>(rowSpec: RowSpec) {
  return async (
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    const plan = (prisma as any).raw
      .sql(strings, ...values)
      .returnsRow(rowSpec)
      .build()
    return (await (prisma as any).query(plan)) as T[]
  }
}

const ANIME_ROW_SPEC: RowSpec = {
  id: 'pg/int4@1',
  titlePrimary: 'pg/text@1',
  titleSecondary: 'pg/text@1',
  titleNative: 'pg/text@1',
  coverImage: 'pg/text@1',
  bannerImage: 'pg/text@1',
  description: 'pg/text@1',
  format: 'pg/text@1',
  status: 'pg/text@1',
  source: 'pg/text@1',
  seasonYear: 'pg/int4@1',
  seasonSeason: 'pg/text@1',
  episodeCount: 'pg/int4@1',
  averageScore: 'pg/float8@1',
  popularity: 'pg/int4@1',
  favorites: 'pg/int4@1',
  alUpdatedAt: 'pg/int4@1',
  genres: 'pg/json@1',
  studios: 'pg/json@1',
  _score: 'pg/float8@1',
}

const MANGA_ROW_SPEC: RowSpec = {
  id: 'pg/int4@1',
  titlePrimary: 'pg/text@1',
  titleSecondary: 'pg/text@1',
  titleNative: 'pg/text@1',
  coverImage: 'pg/text@1',
  bannerImage: 'pg/text@1',
  description: 'pg/text@1',
  format: 'pg/text@1',
  status: 'pg/text@1',
  source: 'pg/text@1',
  startDateYear: 'pg/int4@1',
  chapterCount: 'pg/int4@1',
  volumeCount: 'pg/int4@1',
  averageScore: 'pg/float8@1',
  popularity: 'pg/int4@1',
  favorites: 'pg/int4@1',
  alUpdatedAt: 'pg/int4@1',
  genres: 'pg/json@1',
  _score: 'pg/float8@1',
}

const MOVIE_ROW_SPEC: RowSpec = {
  id: 'pg/int4@1',
  titlePrimary: 'pg/text@1',
  titleSecondary: 'pg/text@1',
  titleNative: 'pg/text@1',
  coverImage: 'pg/text@1',
  bannerImage: 'pg/text@1',
  description: 'pg/text@1',
  status: 'pg/text@1',
  runtime: 'pg/int4@1',
  duration: 'pg/int4@1',
  releaseDateYear: 'pg/int4@1',
  averageScore: 'pg/float8@1',
  popularity: 'pg/int4@1',
  favorites: 'pg/int4@1',
  tvdbUpdatedAt: 'pg/int4@1',
  genres: 'pg/json@1',
  studios: 'pg/json@1',
  _score: 'pg/float8@1',
}

const TV_ROW_SPEC: RowSpec = {
  id: 'pg/int4@1',
  titlePrimary: 'pg/text@1',
  titleSecondary: 'pg/text@1',
  titleNative: 'pg/text@1',
  coverImage: 'pg/text@1',
  bannerImage: 'pg/text@1',
  description: 'pg/text@1',
  status: 'pg/text@1',
  episodeCount: 'pg/int4@1',
  firstAiredYear: 'pg/int4@1',
  releaseDateYear: 'pg/int4@1',
  averageScore: 'pg/float8@1',
  popularity: 'pg/int4@1',
  favorites: 'pg/int4@1',
  tvdbUpdatedAt: 'pg/int4@1',
  genres: 'pg/json@1',
  _score: 'pg/float8@1',
}

const GAME_ROW_SPEC: RowSpec = {
  id: 'pg/int4@1',
  titlePrimary: 'pg/text@1',
  titleSecondary: 'pg/text@1',
  titleNative: 'pg/text@1',
  coverImage: 'pg/text@1',
  bannerImage: 'pg/text@1',
  description: 'pg/text@1',
  platforms: 'pg/text-array@1',
  status: 'pg/text@1',
  releaseDateYear: 'pg/int4@1',
  averageScore: 'pg/float8@1',
  popularity: 'pg/int4@1',
  favorites: 'pg/int4@1',
  igdbUpdatedAt: 'pg/int4@1',
  genres: 'pg/json@1',
  studios: 'pg/json@1',
  _score: 'pg/float8@1',
}

const MUSIC_ROW_SPEC: RowSpec = {
  id: 'pg/int4@1',
  titlePrimary: 'pg/text@1',
  titleSecondary: 'pg/text@1',
  artistName: 'pg/text@1',
  artist: 'pg/text@1',
  coverImage: 'pg/text@1',
  type: 'pg/text@1',
  duration: 'pg/int4@1',
  durationMs: 'pg/int4@1',
  releaseDateYear: 'pg/int4@1',
  albumTitle: 'pg/text@1',
  genres: 'pg/json@1',
  _score: 'pg/float8@1',
}

const BOOK_ROW_SPEC: RowSpec = {
  id: 'pg/int4@1',
  titlePrimary: 'pg/text@1',
  titleSecondary: 'pg/text@1',
  coverImage: 'pg/text@1',
  bannerImage: 'pg/text@1',
  description: 'pg/text@1',
  format: 'pg/text@1',
  authors: 'pg/text-array@1',
  pageCount: 'pg/int4@1',
  chapterCount: 'pg/int4@1',
  releaseDateYear: 'pg/int4@1',
  averageScore: 'pg/float8@1',
  popularity: 'pg/int4@1',
  favorites: 'pg/int4@1',
  genres: 'pg/json@1',
  _score: 'pg/float8@1',
}

const CHARACTER_ROW_SPEC: RowSpec = {
  id: 'pg/int4@1',
  namePrimary: 'pg/text@1',
  nameNative: 'pg/text@1',
  image: 'pg/text@1',
  gender: 'pg/text@1',
  age: 'pg/text@1',
  description: 'pg/text@1',
  dateOfBirthDay: 'pg/int4@1',
  dateOfBirthMonth: 'pg/int4@1',
  favorites: 'pg/int4@1',
  _score: 'pg/float8@1',
}

const PERSON_ROW_SPEC: RowSpec = {
  id: 'pg/int4@1',
  namePrimary: 'pg/text@1',
  nameNative: 'pg/text@1',
  image: 'pg/text@1',
  gender: 'pg/text@1',
  age: 'pg/text@1',
  language: 'pg/text@1',
  primaryOccupations: 'pg/text-array@1',
  description: 'pg/text@1',
  homeTown: 'pg/text@1',
  birthPlace: 'pg/text@1',
  favorites: 'pg/int4@1',
  _score: 'pg/float8@1',
}

const STUDIO_ROW_SPEC: RowSpec = {
  id: 'pg/int4@1',
  name: 'pg/text@1',
  isAnimationStudio: 'pg/bool@1',
  siteUrl: 'pg/text@1',
  favorites: 'pg/int4@1',
  _score: 'pg/float8@1',
}

const OTHER_ROW_SPEC: RowSpec = {
  id: 'pg/int4@1',
  titlePrimary: 'pg/text@1',
  titleSecondary: 'pg/text@1',
  description: 'pg/text@1',
  coverImage: 'pg/text@1',
  bannerImage: 'pg/text@1',
  format: 'pg/text@1',
  startDate: 'pg/timestamp-date@1',
  endDate: 'pg/timestamp-date@1',
  averageScore: 'pg/float8@1',
  favorites: 'pg/int4@1',
  popularity: 'pg/int4@1',
  progressFields: 'pg/jsonb@1',
  incrementFieldKey: 'pg/text@1',
  creatorId: 'pg/text@1',
  creator: 'pg/json@1',
  _score: 'pg/float8@1',
}

export async function searchAnimeRaw(
  cleanQuery: string,
  limit: number,
  skip: number
): Promise<PaginatedRawResult<any>> {
  const fetchLimit = limit + 1
  const rows = await runRaw(ANIME_ROW_SPEC)`
    WITH q AS (
      SELECT public.iris_normalize_search(${cleanQuery}) AS nq
    )
    SELECT
      a."id",
      a."titlePrimary",
      a."titleSecondary",
      a."titleNative",
      a."coverImage",
      a."bannerImage",
      a."description",
      a."format",
      a."status",
      a."source",
      a."seasonYear",
      a."seasonSeason",
      a."episodeCount",
      a."averageScore",
      a."popularity",
      a."favorites",
      a."alUpdatedAt",
      coalesce(
        (
          SELECT json_agg(json_build_object('id', g."id", 'name', g."name"))
          FROM "_AnimeToGenre" ag
          JOIN "Genre" g ON g."id" = ag."B"
          WHERE ag."A" = a."id"
        ),
        '[]'::json
      ) AS "genres",
      coalesce(
        (
          SELECT json_agg(json_build_object('id', s."id", 'name', s."name"))
          FROM "MediaStudio" ms
          JOIN "Studio" s ON s."id" = ms."studioId"
          WHERE ms."animeId" = a."id"
        ),
        '[]'::json
      ) AS "studios",
      (CASE
        WHEN public.iris_normalize_search(a."titlePrimary") = q.nq THEN 3.0
        WHEN public.iris_normalize_search(a."titlePrimary") LIKE q.nq || '%' THEN 2.5
        WHEN public.iris_normalize_search(a."titlePrimary") LIKE '%' || q.nq || '%' THEN 2.0
        WHEN public.iris_normalize_search(a."titleSecondary") LIKE '%' || q.nq || '%' THEN 1.8
        WHEN public.iris_normalize_search(a."titleNative") LIKE '%' || q.nq || '%' THEN 1.7
        ELSE GREATEST(
          word_similarity(q.nq, public.iris_normalize_search(a."titlePrimary")),
          coalesce(word_similarity(q.nq, public.iris_normalize_search(a."titleSecondary")), 0),
          coalesce(word_similarity(q.nq, public.iris_normalize_search(a."titleNative")), 0)
        )
      END)::float8 AS "_score"
    FROM "Anime" a
    CROSS JOIN q
    WHERE q.nq <> ''
      AND (
        public.iris_normalize_search(a."titlePrimary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(a."titleSecondary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(a."titleNative") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(a."titlePrimary") %> q.nq
        OR public.iris_normalize_search(a."titleSecondary") %> q.nq
        OR public.iris_normalize_search(a."titleNative") %> q.nq
      )
    ORDER BY "_score" DESC, a."popularity" DESC NULLS LAST
    LIMIT ${fetchLimit} OFFSET ${skip}
  `
  return paginateRows(
    rows.map(({ _score, ...rest }) => rest),
    limit
  )
}

export async function searchMangaRaw(
  cleanQuery: string,
  limit: number,
  skip: number
): Promise<PaginatedRawResult<any>> {
  const fetchLimit = limit + 1
  const rows = await runRaw(MANGA_ROW_SPEC)`
    WITH q AS (
      SELECT public.iris_normalize_search(${cleanQuery}) AS nq
    )
    SELECT
      m."id",
      m."titlePrimary",
      m."titleSecondary",
      m."titleNative",
      m."coverImage",
      m."bannerImage",
      m."description",
      m."format",
      m."status",
      m."source",
      m."startDateYear",
      m."chapterCount",
      m."volumeCount",
      m."averageScore",
      m."popularity",
      m."favorites",
      m."alUpdatedAt",
      coalesce(
        (
          SELECT json_agg(json_build_object('id', g."id", 'name', g."name"))
          FROM "_GenreToManga" gm
          JOIN "Genre" g ON g."id" = gm."A"
          WHERE gm."B" = m."id"
        ),
        '[]'::json
      ) AS "genres",
      (CASE
        WHEN public.iris_normalize_search(m."titlePrimary") = q.nq THEN 3.0
        WHEN public.iris_normalize_search(m."titlePrimary") LIKE q.nq || '%' THEN 2.5
        WHEN public.iris_normalize_search(m."titlePrimary") LIKE '%' || q.nq || '%' THEN 2.0
        WHEN public.iris_normalize_search(m."titleSecondary") LIKE '%' || q.nq || '%' THEN 1.8
        WHEN public.iris_normalize_search(m."titleNative") LIKE '%' || q.nq || '%' THEN 1.7
        ELSE GREATEST(
          word_similarity(q.nq, public.iris_normalize_search(m."titlePrimary")),
          coalesce(word_similarity(q.nq, public.iris_normalize_search(m."titleSecondary")), 0),
          coalesce(word_similarity(q.nq, public.iris_normalize_search(m."titleNative")), 0)
        )
      END)::float8 AS "_score"
    FROM "Manga" m
    CROSS JOIN q
    WHERE q.nq <> ''
      AND (
        public.iris_normalize_search(m."titlePrimary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(m."titleSecondary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(m."titleNative") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(m."titlePrimary") %> q.nq
        OR public.iris_normalize_search(m."titleSecondary") %> q.nq
        OR public.iris_normalize_search(m."titleNative") %> q.nq
      )
    ORDER BY "_score" DESC, m."popularity" DESC NULLS LAST
    LIMIT ${fetchLimit} OFFSET ${skip}
  `
  return paginateRows(
    rows.map(({ _score, ...rest }) => rest),
    limit
  )
}

export async function searchMovieRaw(
  cleanQuery: string,
  limit: number,
  skip: number
): Promise<PaginatedRawResult<any>> {
  const fetchLimit = limit + 1
  const rows = await runRaw(MOVIE_ROW_SPEC)`
    WITH q AS (
      SELECT public.iris_normalize_search(${cleanQuery}) AS nq
    )
    SELECT
      m."id",
      m."titlePrimary",
      m."titleSecondary",
      m."titleNative",
      m."coverImage",
      m."bannerImage",
      m."description",
      m."status",
      m."runtime",
      m."runtime" AS "duration",
      m."releaseDateYear",
      m."averageScore",
      m."popularity",
      m."favorites",
      m."tvdbUpdatedAt",
      coalesce(
        (
          SELECT json_agg(json_build_object('id', g."id", 'name', g."name"))
          FROM "_GenreToMovie" gm
          JOIN "Genre" g ON g."id" = gm."A"
          WHERE gm."B" = m."id"
        ),
        '[]'::json
      ) AS "genres",
      coalesce(
        (
          SELECT json_agg(json_build_object('id', s."id", 'name', s."name"))
          FROM "MediaStudio" ms
          JOIN "Studio" s ON s."id" = ms."studioId"
          WHERE ms."movieId" = m."id"
        ),
        '[]'::json
      ) AS "studios",
      (CASE
        WHEN public.iris_normalize_search(m."titlePrimary") = q.nq THEN 3.0
        WHEN public.iris_normalize_search(m."titlePrimary") LIKE q.nq || '%' THEN 2.5
        WHEN public.iris_normalize_search(m."titlePrimary") LIKE '%' || q.nq || '%' THEN 2.0
        WHEN public.iris_normalize_search(m."titleSecondary") LIKE '%' || q.nq || '%' THEN 1.8
        WHEN public.iris_normalize_search(m."titleNative") LIKE '%' || q.nq || '%' THEN 1.7
        ELSE GREATEST(
          word_similarity(q.nq, public.iris_normalize_search(m."titlePrimary")),
          coalesce(word_similarity(q.nq, public.iris_normalize_search(m."titleSecondary")), 0),
          coalesce(word_similarity(q.nq, public.iris_normalize_search(m."titleNative")), 0)
        )
      END)::float8 AS "_score"
    FROM "Movie" m
    CROSS JOIN q
    WHERE q.nq <> ''
      AND (
        public.iris_normalize_search(m."titlePrimary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(m."titleSecondary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(m."titleNative") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(m."titlePrimary") %> q.nq
        OR public.iris_normalize_search(m."titleSecondary") %> q.nq
        OR public.iris_normalize_search(m."titleNative") %> q.nq
      )
    ORDER BY "_score" DESC, m."popularity" DESC NULLS LAST
    LIMIT ${fetchLimit} OFFSET ${skip}
  `
  return paginateRows(
    rows.map(({ _score, ...rest }) => rest),
    limit
  )
}

export async function searchTvRaw(
  cleanQuery: string,
  limit: number,
  skip: number
): Promise<PaginatedRawResult<any>> {
  const fetchLimit = limit + 1
  const rows = await runRaw(TV_ROW_SPEC)`
    WITH q AS (
      SELECT public.iris_normalize_search(${cleanQuery}) AS nq
    )
    SELECT
      t."id",
      t."titlePrimary",
      t."titleSecondary",
      t."titleNative",
      t."coverImage",
      t."bannerImage",
      t."description",
      t."status",
      t."episodeCount",
      t."firstAiredYear",
      t."firstAiredYear" AS "releaseDateYear",
      t."averageScore",
      t."popularity",
      t."favorites",
      t."tvdbUpdatedAt",
      coalesce(
        (
          SELECT json_agg(json_build_object('id', g."id", 'name', g."name"))
          FROM "_GenreToTv" gt
          JOIN "Genre" g ON g."id" = gt."A"
          WHERE gt."B" = t."id"
        ),
        '[]'::json
      ) AS "genres",
      (CASE
        WHEN public.iris_normalize_search(t."titlePrimary") = q.nq THEN 3.0
        WHEN public.iris_normalize_search(t."titlePrimary") LIKE q.nq || '%' THEN 2.5
        WHEN public.iris_normalize_search(t."titlePrimary") LIKE '%' || q.nq || '%' THEN 2.0
        WHEN public.iris_normalize_search(t."titleSecondary") LIKE '%' || q.nq || '%' THEN 1.8
        WHEN public.iris_normalize_search(t."titleNative") LIKE '%' || q.nq || '%' THEN 1.7
        ELSE GREATEST(
          word_similarity(q.nq, public.iris_normalize_search(t."titlePrimary")),
          coalesce(word_similarity(q.nq, public.iris_normalize_search(t."titleSecondary")), 0),
          coalesce(word_similarity(q.nq, public.iris_normalize_search(t."titleNative")), 0)
        )
      END)::float8 AS "_score"
    FROM "Tv" t
    CROSS JOIN q
    WHERE q.nq <> ''
      AND (
        public.iris_normalize_search(t."titlePrimary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(t."titleSecondary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(t."titleNative") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(t."titlePrimary") %> q.nq
        OR public.iris_normalize_search(t."titleSecondary") %> q.nq
        OR public.iris_normalize_search(t."titleNative") %> q.nq
      )
    ORDER BY "_score" DESC, t."popularity" DESC NULLS LAST
    LIMIT ${fetchLimit} OFFSET ${skip}
  `
  return paginateRows(
    rows.map(({ _score, ...rest }) => rest),
    limit
  )
}

export async function searchGameRaw(
  cleanQuery: string,
  limit: number,
  skip: number
): Promise<PaginatedRawResult<any>> {
  const fetchLimit = limit + 1
  const rows = await runRaw(GAME_ROW_SPEC)`
    WITH q AS (
      SELECT public.iris_normalize_search(${cleanQuery}) AS nq
    )
    SELECT
      g."id",
      g."titlePrimary",
      g."titleSecondary",
      g."titleNative",
      g."coverImage",
      g."bannerImage",
      g."description",
      g."platforms",
      g."status",
      g."releaseDateYear",
      g."averageScore",
      g."popularity",
      g."favorites",
      g."igdbUpdatedAt",
      coalesce(
        (
          SELECT json_agg(json_build_object('id', ge."id", 'name', ge."name"))
          FROM "_GameToGenre" gg
          JOIN "Genre" ge ON ge."id" = gg."B"
          WHERE gg."A" = g."id"
        ),
        '[]'::json
      ) AS "genres",
      coalesce(
        (
          SELECT json_agg(json_build_object('id', s."id", 'name', s."name"))
          FROM "MediaStudio" ms
          JOIN "Studio" s ON s."id" = ms."studioId"
          WHERE ms."gameId" = g."id"
        ),
        '[]'::json
      ) AS "studios",
      (CASE
        WHEN public.iris_normalize_search(g."titlePrimary") = q.nq THEN 3.0
        WHEN public.iris_normalize_search(g."titlePrimary") LIKE q.nq || '%' THEN 2.5
        WHEN public.iris_normalize_search(g."titlePrimary") LIKE '%' || q.nq || '%' THEN 2.0
        WHEN public.iris_normalize_search(g."titleSecondary") LIKE '%' || q.nq || '%' THEN 1.8
        WHEN public.iris_normalize_search(g."titleNative") LIKE '%' || q.nq || '%' THEN 1.7
        ELSE GREATEST(
          word_similarity(q.nq, public.iris_normalize_search(g."titlePrimary")),
          coalesce(word_similarity(q.nq, public.iris_normalize_search(g."titleSecondary")), 0),
          coalesce(word_similarity(q.nq, public.iris_normalize_search(g."titleNative")), 0)
        )
      END)::float8 AS "_score"
    FROM "Game" g
    CROSS JOIN q
    WHERE q.nq <> ''
      AND (
        public.iris_normalize_search(g."titlePrimary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(g."titleSecondary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(g."titleNative") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(g."titlePrimary") %> q.nq
        OR public.iris_normalize_search(g."titleSecondary") %> q.nq
        OR public.iris_normalize_search(g."titleNative") %> q.nq
      )
    ORDER BY "_score" DESC, g."popularity" DESC NULLS LAST
    LIMIT ${fetchLimit} OFFSET ${skip}
  `
  return paginateRows(
    rows.map(({ _score, ...rest }) => ({
      ...rest,
      platforms: Array.isArray(rest.platforms) ? [...rest.platforms] : [],
    })),
    limit
  )
}

export async function searchMusicRaw(
  cleanQuery: string,
  limit: number,
  skip: number
): Promise<PaginatedRawResult<any>> {
  const fetchLimit = limit + 1
  const rows = await runRaw(MUSIC_ROW_SPEC)`
    WITH q AS (
      SELECT public.iris_normalize_search(${cleanQuery}) AS nq
    )
    SELECT
      m."id",
      m."titlePrimary",
      m."titleSecondary",
      m."artistName",
      m."artistName" AS "artist",
      m."coverImage",
      m."type",
      m."duration",
      (CASE WHEN m."duration" IS NOT NULL THEN m."duration" * 1000 ELSE NULL END)::int4 AS "durationMs",
      m."releaseDateYear",
      alb."titlePrimary" AS "albumTitle",
      coalesce(
        (
          SELECT json_agg(json_build_object('id', g."id", 'name', g."name"))
          FROM "_GenreToMusic" gm
          JOIN "Genre" g ON g."id" = gm."A"
          WHERE gm."B" = m."id"
        ),
        '[]'::json
      ) AS "genres",
      (CASE
        WHEN public.iris_normalize_search(m."titlePrimary") = q.nq THEN 3.0
        WHEN public.iris_normalize_search(m."titlePrimary") LIKE q.nq || '%' THEN 2.5
        WHEN public.iris_normalize_search(m."titlePrimary") LIKE '%' || q.nq || '%' THEN 2.0
        WHEN public.iris_normalize_search(m."titleSecondary") LIKE '%' || q.nq || '%' THEN 1.8
        WHEN public.iris_normalize_search(m."artistName") LIKE '%' || q.nq || '%' THEN 1.7
        ELSE GREATEST(
          word_similarity(q.nq, public.iris_normalize_search(m."titlePrimary")),
          coalesce(word_similarity(q.nq, public.iris_normalize_search(m."titleSecondary")), 0),
          coalesce(word_similarity(q.nq, public.iris_normalize_search(m."artistName")), 0)
        )
      END)::float8 AS "_score"
    FROM "Music" m
    LEFT JOIN "Music" alb ON alb."id" = m."albumId"
    CROSS JOIN q
    WHERE q.nq <> ''
      AND (
        public.iris_normalize_search(m."titlePrimary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(m."titleSecondary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(m."artistName") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(m."titlePrimary") %> q.nq
        OR public.iris_normalize_search(m."titleSecondary") %> q.nq
        OR public.iris_normalize_search(m."artistName") %> q.nq
      )
    ORDER BY "_score" DESC, m."popularity" DESC NULLS LAST
    LIMIT ${fetchLimit} OFFSET ${skip}
  `
  return paginateRows(
    rows.map(({ _score, ...rest }) => rest),
    limit
  )
}

export async function searchBookRaw(
  cleanQuery: string,
  limit: number,
  skip: number
): Promise<PaginatedRawResult<any>> {
  const fetchLimit = limit + 1
  const rows = await runRaw(BOOK_ROW_SPEC)`
    WITH q AS (
      SELECT public.iris_normalize_search(${cleanQuery}) AS nq
    )
    SELECT
      b."id",
      b."titlePrimary",
      b."titleSecondary",
      b."coverImage",
      b."bannerImage",
      b."description",
      b."format",
      b."authors",
      b."pageCount",
      b."chapterCount",
      b."releaseDateYear",
      b."averageScore",
      b."popularity",
      b."favorites",
      coalesce(
        (
          SELECT json_agg(json_build_object('id', g."id", 'name', g."name"))
          FROM "_BookToGenre" bg
          JOIN "Genre" g ON g."id" = bg."B"
          WHERE bg."A" = b."id"
        ),
        '[]'::json
      ) AS "genres",
      (CASE
        WHEN public.iris_normalize_search(b."titlePrimary") = q.nq THEN 3.0
        WHEN public.iris_normalize_search(b."titlePrimary") LIKE q.nq || '%' THEN 2.5
        WHEN public.iris_normalize_search(b."titlePrimary") LIKE '%' || q.nq || '%' THEN 2.0
        WHEN public.iris_normalize_search(b."titleSecondary") LIKE '%' || q.nq || '%' THEN 1.8
        ELSE GREATEST(
          word_similarity(q.nq, public.iris_normalize_search(b."titlePrimary")),
          coalesce(word_similarity(q.nq, public.iris_normalize_search(b."titleSecondary")), 0)
        )
      END)::float8 AS "_score"
    FROM "Book" b
    CROSS JOIN q
    WHERE q.nq <> ''
      AND (
        public.iris_normalize_search(b."titlePrimary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(b."titleSecondary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(b."titlePrimary") %> q.nq
        OR public.iris_normalize_search(b."titleSecondary") %> q.nq
      )
    ORDER BY "_score" DESC, b."popularity" DESC NULLS LAST
    LIMIT ${fetchLimit} OFFSET ${skip}
  `
  return paginateRows(
    rows.map(({ _score, ...rest }) => ({
      ...rest,
      authors: Array.isArray(rest.authors) ? [...rest.authors] : [],
    })),
    limit
  )
}

export async function searchCharacterRaw(
  cleanQuery: string,
  limit: number,
  skip: number
): Promise<PaginatedRawResult<any>> {
  const fetchLimit = limit + 1
  const rows = await runRaw(CHARACTER_ROW_SPEC)`
    WITH q AS (
      SELECT public.iris_normalize_search(${cleanQuery}) AS nq
    )
    SELECT
      c."id",
      c."namePrimary",
      c."nameNative",
      c."image",
      c."gender",
      c."age",
      c."description",
      c."dateOfBirthDay",
      c."dateOfBirthMonth",
      c."favorites",
      (CASE
        WHEN public.iris_normalize_search(c."namePrimary") = q.nq THEN 3.0
        WHEN public.iris_normalize_search(c."namePrimary") LIKE q.nq || '%' THEN 2.5
        WHEN public.iris_normalize_search(c."namePrimary") LIKE '%' || q.nq || '%' THEN 2.0
        WHEN public.iris_normalize_search(c."nameNative") LIKE '%' || q.nq || '%' THEN 1.8
        ELSE GREATEST(
          word_similarity(q.nq, public.iris_normalize_search(c."namePrimary")),
          coalesce(word_similarity(q.nq, public.iris_normalize_search(c."nameNative")), 0)
        )
      END)::float8 AS "_score"
    FROM "Character" c
    CROSS JOIN q
    WHERE q.nq <> ''
      AND (
        public.iris_normalize_search(c."namePrimary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(c."nameNative") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(c."namePrimary") %> q.nq
        OR public.iris_normalize_search(c."nameNative") %> q.nq
      )
    ORDER BY "_score" DESC, c."favorites" DESC NULLS LAST
    LIMIT ${fetchLimit} OFFSET ${skip}
  `
  return paginateRows(
    rows.map(({ _score, ...rest }) => rest),
    limit
  )
}

export async function searchPersonRaw(
  cleanQuery: string,
  limit: number,
  skip: number
): Promise<PaginatedRawResult<any>> {
  const fetchLimit = limit + 1
  const rows = await runRaw(PERSON_ROW_SPEC)`
    WITH q AS (
      SELECT public.iris_normalize_search(${cleanQuery}) AS nq
    )
    SELECT
      p."id",
      p."namePrimary",
      p."nameNative",
      p."image",
      p."gender",
      p."age",
      p."language",
      p."primaryOccupations",
      p."description",
      p."homeTown",
      p."birthPlace",
      p."favorites",
      (CASE
        WHEN public.iris_normalize_search(p."namePrimary") = q.nq THEN 3.0
        WHEN public.iris_normalize_search(p."namePrimary") LIKE q.nq || '%' THEN 2.5
        WHEN public.iris_normalize_search(p."namePrimary") LIKE '%' || q.nq || '%' THEN 2.0
        WHEN public.iris_normalize_search(p."nameNative") LIKE '%' || q.nq || '%' THEN 1.8
        ELSE GREATEST(
          word_similarity(q.nq, public.iris_normalize_search(p."namePrimary")),
          coalesce(word_similarity(q.nq, public.iris_normalize_search(p."nameNative")), 0)
        )
      END)::float8 AS "_score"
    FROM "Person" p
    CROSS JOIN q
    WHERE q.nq <> ''
      AND (
        public.iris_normalize_search(p."namePrimary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(p."nameNative") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(p."namePrimary") %> q.nq
        OR public.iris_normalize_search(p."nameNative") %> q.nq
      )
    ORDER BY "_score" DESC, p."favorites" DESC NULLS LAST
    LIMIT ${fetchLimit} OFFSET ${skip}
  `
  return paginateRows(
    rows.map(({ _score, ...rest }) => ({
      ...rest,
      primaryOccupations: Array.isArray(rest.primaryOccupations)
        ? [...rest.primaryOccupations]
        : [],
    })),
    limit
  )
}

export async function searchStudioRaw(
  cleanQuery: string,
  limit: number,
  skip: number
): Promise<PaginatedRawResult<any>> {
  const fetchLimit = limit + 1
  const rows = await runRaw(STUDIO_ROW_SPEC)`
    WITH q AS (
      SELECT public.iris_normalize_search(${cleanQuery}) AS nq
    )
    SELECT
      s."id",
      s."name",
      s."isAnimationStudio",
      s."siteUrl",
      s."favorites",
      (CASE
        WHEN public.iris_normalize_search(s."name") = q.nq THEN 3.0
        WHEN public.iris_normalize_search(s."name") LIKE q.nq || '%' THEN 2.5
        WHEN public.iris_normalize_search(s."name") LIKE '%' || q.nq || '%' THEN 2.0
        ELSE word_similarity(q.nq, public.iris_normalize_search(s."name"))
      END)::float8 AS "_score"
    FROM "Studio" s
    CROSS JOIN q
    WHERE q.nq <> ''
      AND (
        public.iris_normalize_search(s."name") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(s."name") %> q.nq
      )
    ORDER BY "_score" DESC, s."favorites" DESC NULLS LAST
    LIMIT ${fetchLimit} OFFSET ${skip}
  `
  return paginateRows(
    rows.map(({ _score, ...rest }) => rest),
    limit
  )
}

export async function searchOtherRaw(
  cleanQuery: string,
  limit: number,
  skip: number
): Promise<PaginatedRawResult<any>> {
  const fetchLimit = limit + 1
  const rows = await runRaw(OTHER_ROW_SPEC)`
    WITH q AS (
      SELECT public.iris_normalize_search(${cleanQuery}) AS nq
    )
    SELECT
      o."id",
      o."titlePrimary",
      o."titleSecondary",
      o."description",
      o."coverImage",
      o."bannerImage",
      o."format",
      o."startDate",
      o."endDate",
      o."averageScore",
      o."favorites",
      o."popularity",
      o."progressFields",
      o."incrementFieldKey",
      o."creatorId",
      CASE
        WHEN u."id" IS NOT NULL THEN json_build_object('id', u."id", 'username', u."username")
        ELSE NULL
      END AS "creator",
      (CASE
        WHEN public.iris_normalize_search(o."titlePrimary") = q.nq THEN 3.0
        WHEN public.iris_normalize_search(o."titlePrimary") LIKE q.nq || '%' THEN 2.5
        WHEN public.iris_normalize_search(o."titlePrimary") LIKE '%' || q.nq || '%' THEN 2.0
        WHEN public.iris_normalize_search(o."titleSecondary") LIKE '%' || q.nq || '%' THEN 1.8
        ELSE GREATEST(
          word_similarity(q.nq, public.iris_normalize_search(o."titlePrimary")),
          coalesce(word_similarity(q.nq, public.iris_normalize_search(o."titleSecondary")), 0)
        )
      END)::float8 AS "_score"
    FROM "Other" o
    LEFT JOIN "User" u ON u."id" = o."creatorId"
    CROSS JOIN q
    WHERE o."isPublished" = true
      AND q.nq <> ''
      AND (
        public.iris_normalize_search(o."titlePrimary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(o."titleSecondary") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(o."description") LIKE '%' || q.nq || '%'
        OR public.iris_normalize_search(o."titlePrimary") %> q.nq
        OR public.iris_normalize_search(o."titleSecondary") %> q.nq
      )
    ORDER BY "_score" DESC, o."popularity" DESC NULLS LAST, o."averageScore" DESC NULLS LAST
    LIMIT ${fetchLimit} OFFSET ${skip}
  `
  return paginateRows(
    rows.map(({ _score, ...rest }) => ({
      ...rest,
      mediaType: 'other',
    })),
    limit
  )
}
