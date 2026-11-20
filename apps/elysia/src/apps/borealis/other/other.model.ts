import { t, type UnwrapSchema } from 'elysia'

export const MediaStatusSchema = t.Union([
  t.Literal('RELEASED'),
  t.Literal('RELEASING'),
  t.Literal('UPCOMING'),
  t.Literal('CANCELLED'),
  t.Literal('HIATUS'),
  t.Literal('UNKNOWN'),
])

export const AnimeSeasonSchema = t.Union([
  t.Literal('WINTER'),
  t.Literal('SPRING'),
  t.Literal('SUMMER'),
  t.Literal('FALL'),
  t.Literal('UNKNOWN'),
])

export const ProgressFieldSchema = t.Object({
  key: t.String({ minLength: 1, maxLength: 64 }),
  label: t.String({ minLength: 1, maxLength: 120 }),
  unit: t.Optional(t.String({ maxLength: 64 })),
  max: t.Optional(t.Number({ minimum: 0 })),
})

export const CustomFieldSchema = t.Object({
  label: t.String({ minLength: 1, maxLength: 120 }),
  value: t.Union([t.String({ maxLength: 2000 }), t.Array(t.String({ maxLength: 200 }))]),
  type: t.Union([t.Literal('text'), t.Literal('link'), t.Literal('badges')]),
})

export const OtherCharacterInputSchema = t.Object({
  characterId: t.Number({ minimum: 1 }),
  actorId: t.Optional(t.Union([t.Number({ minimum: 1 }), t.Null()])),
  role: t.Optional(t.Union([t.Literal('MAIN'), t.Literal('SUPPORTING'), t.Literal('BACKGROUND')])),
  order: t.Optional(t.Union([t.Number(), t.Null()])),
})

export const OtherStaffInputSchema = t.Object({
  personId: t.Number({ minimum: 1 }),
  role: t.Optional(t.String({ maxLength: 64 })),
  customRole: t.Optional(t.Union([t.String({ maxLength: 120 }), t.Null()])),
})

export const OtherStudioInputSchema = t.Object({
  studioId: t.Number({ minimum: 1 }),
  isMain: t.Optional(t.Boolean()),
})

export const OtherRelationInputSchema = t.Object({
  targetType: t.Union([
    t.Literal('ANIME'),
    t.Literal('MANGA'),
    t.Literal('MOVIE'),
    t.Literal('TV'),
    t.Literal('GAME'),
    t.Literal('BOOK'),
    t.Literal('MUSIC'),
    t.Literal('OTHER'),
  ]),
  targetId: t.Number({ minimum: 1 }),
  relationType: t.String({ minLength: 1, maxLength: 64 }),
})

export const OtherSeasonInputSchema = t.Object({
  seasonNumber: t.Number({ minimum: 0 }),
  name: t.Optional(t.Union([t.String({ maxLength: 200 }), t.Null()])),
  overview: t.Optional(t.Union([t.String({ maxLength: 4000 }), t.Null()])),
  posterPath: t.Optional(t.Union([t.String({ maxLength: 1024 }), t.Null()])),
  airDate: t.Optional(t.Union([t.String(), t.Null()])),
  episodeCount: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
})

export const OtherEpisodeInputSchema = t.Object({
  episodeNumber: t.Number({ minimum: 0 }),
  seasonNumber: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  name: t.Optional(t.Union([t.String({ maxLength: 200 }), t.Null()])),
  overview: t.Optional(t.Union([t.String({ maxLength: 4000 }), t.Null()])),
  airDate: t.Optional(t.Union([t.String(), t.Null()])),
  runtime: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  stillPath: t.Optional(t.Union([t.String({ maxLength: 1024 }), t.Null()])),
  episodeType: t.Optional(t.Union([t.String({ maxLength: 64 }), t.Null()])),
})

export const OtherTrackInputSchema = t.Object({
  trackNumber: t.Number({ minimum: 1 }),
  discNumber: t.Optional(t.Number({ minimum: 1 })),
  titlePrimary: t.String({ minLength: 1, maxLength: 255 }),
  artistName: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
  artistPersonId: t.Optional(t.Union([t.Number({ minimum: 1 }), t.Null()])),
  duration: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  explicitLyrics: t.Optional(t.Boolean()),
  audioPreviewUrl: t.Optional(t.Union([t.String({ maxLength: 1024 }), t.Null()])),
})

const SharedMutableFields = {
  titlePrimary: t.String({ minLength: 1, maxLength: 255 }),
  titleSecondary: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
  titleNative: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
  synonyms: t.Optional(t.Array(t.String({ maxLength: 255 }))),
  tagline: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])),
  description: t.Optional(t.Union([t.String({ maxLength: 10000 }), t.Null()])),
  hashtag: t.Optional(t.Union([t.String({ maxLength: 120 }), t.Null()])),
  coverImage: t.Optional(t.Union([t.String({ maxLength: 1024 }), t.Null()])),
  bannerImage: t.Optional(t.Union([t.String({ maxLength: 1024 }), t.Null()])),
  format: t.Optional(t.Union([t.String({ maxLength: 64 }), t.Null()])),
  source: t.Optional(t.Union([t.String({ maxLength: 120 }), t.Null()])),
  status: t.Optional(MediaStatusSchema),

  startDate: t.Optional(t.Union([t.String(), t.Null()])),
  endDate: t.Optional(t.Union([t.String(), t.Null()])),
  startDateYear: t.Optional(t.Union([t.Number(), t.Null()])),
  startDateMonth: t.Optional(t.Union([t.Number({ minimum: 1, maximum: 12 }), t.Null()])),
  startDateDay: t.Optional(t.Union([t.Number({ minimum: 1, maximum: 31 }), t.Null()])),
  endDateYear: t.Optional(t.Union([t.Number(), t.Null()])),
  endDateMonth: t.Optional(t.Union([t.Number({ minimum: 1, maximum: 12 }), t.Null()])),
  endDateDay: t.Optional(t.Union([t.Number({ minimum: 1, maximum: 31 }), t.Null()])),

  seasonSeason: t.Optional(t.Union([AnimeSeasonSchema, t.Null()])),
  seasonYear: t.Optional(t.Union([t.Number(), t.Null()])),
  showType: t.Optional(t.Union([t.String({ maxLength: 64 }), t.Null()])),
  broadcastTime: t.Optional(t.Union([t.String({ maxLength: 64 }), t.Null()])),
  broadcastDays: t.Optional(t.Array(t.String({ maxLength: 32 }))),
  networks: t.Optional(t.Array(t.String({ maxLength: 120 }))),
  countryOfOrigin: t.Optional(t.Union([t.String({ maxLength: 64 }), t.Null()])),
  originalLanguage: t.Optional(t.Union([t.String({ maxLength: 64 }), t.Null()])),
  nextAiringEpisodeNumber: t.Optional(t.Union([t.Number({ minimum: 1 }), t.Null()])),
  nextAiringAt: t.Optional(t.Union([t.String(), t.Null()])),

  isAdult: t.Optional(t.Boolean()),
  ageRating: t.Optional(t.Union([t.String({ maxLength: 64 }), t.Null()])),
  ageRatingGuide: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
  esrbRating: t.Optional(t.Union([t.String({ maxLength: 64 }), t.Null()])),
  pegiRating: t.Optional(t.Union([t.String({ maxLength: 64 }), t.Null()])),

  episodeCount: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  episodeDuration: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  seasonCount: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  chapterCount: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  volumeCount: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  pageCount: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  runtime: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  duration: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  totalTracks: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),

  authors: t.Optional(t.Array(t.String({ maxLength: 200 }))),
  developers: t.Optional(t.Array(t.String({ maxLength: 200 }))),
  publishers: t.Optional(t.Array(t.String({ maxLength: 200 }))),
  platforms: t.Optional(t.Array(t.String({ maxLength: 120 }))),
  franchise: t.Optional(t.Union([t.String({ maxLength: 200 }), t.Null()])),
  series: t.Optional(t.Union([t.String({ maxLength: 200 }), t.Null()])),
  seriesPosition: t.Optional(t.Union([t.Number(), t.Null()])),
  subjects: t.Optional(t.Array(t.String({ maxLength: 120 }))),
  gameModes: t.Optional(t.Array(t.String({ maxLength: 120 }))),
  playerPerspectives: t.Optional(t.Array(t.String({ maxLength: 120 }))),
  controllerSupport: t.Optional(t.Union([t.String({ maxLength: 120 }), t.Null()])),
  requirements: t.Optional(t.Union([t.Any(), t.Null()])),
  languages: t.Optional(t.Array(t.String({ maxLength: 64 }))),

  budget: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  revenue: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  awards: t.Optional(t.Array(t.String({ maxLength: 255 }))),
  isbn10: t.Optional(t.Union([t.String({ maxLength: 32 }), t.Null()])),
  isbn13: t.Optional(t.Union([t.String({ maxLength: 32 }), t.Null()])),
  retailPrice: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  retailPriceCurrency: t.Optional(t.Union([t.String({ maxLength: 16 }), t.Null()])),

  albumType: t.Optional(t.Union([t.String({ maxLength: 64 }), t.Null()])),
  label: t.Optional(t.Union([t.String({ maxLength: 200 }), t.Null()])),
  artist: t.Optional(t.Union([t.String({ maxLength: 200 }), t.Null()])),
  artists: t.Optional(t.Array(t.String({ maxLength: 200 }))),
  artistPersonId: t.Optional(t.Union([t.Number({ minimum: 1 }), t.Null()])),
  bpm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  gain: t.Optional(t.Union([t.Number(), t.Null()])),
  explicitLyrics: t.Optional(t.Boolean()),
  audioPreviewUrl: t.Optional(t.Union([t.String({ maxLength: 1024 }), t.Null()])),
  lyrics: t.Optional(t.Union([t.String({ maxLength: 50000 }), t.Null()])),
  syncedLyrics: t.Optional(t.Union([t.String({ maxLength: 50000 }), t.Null()])),
  isrc: t.Optional(t.Union([t.String({ maxLength: 32 }), t.Null()])),

  siteUrl: t.Optional(t.Union([t.String({ maxLength: 1024 }), t.Null()])),
  externalLinks: t.Optional(t.Union([t.Any(), t.Null()])),
  previewLink: t.Optional(t.Union([t.String({ maxLength: 1024 }), t.Null()])),
  infoLink: t.Optional(t.Union([t.String({ maxLength: 1024 }), t.Null()])),
  buyLink: t.Optional(t.Union([t.String({ maxLength: 1024 }), t.Null()])),
  images: t.Optional(t.Union([t.Any(), t.Null()])),
  trailers: t.Optional(t.Union([t.Any(), t.Null()])),
  themeSongs: t.Optional(t.Union([t.Any(), t.Null()])),

  isPublished: t.Optional(t.Boolean()),
  customFields: t.Optional(t.Array(CustomFieldSchema)),
  progressFields: t.Array(ProgressFieldSchema, { minItems: 1, maxItems: 10 }),
  incrementFieldKey: t.Optional(t.Union([t.String({ maxLength: 64 }), t.Null()])),

  genres: t.Optional(t.Array(t.String({ minLength: 1, maxLength: 100 }))),
  tags: t.Optional(
    t.Array(
      t.Union([
        t.String({ minLength: 1, maxLength: 100 }),
        t.Object({
          name: t.String({ minLength: 1, maxLength: 100 }),
          rank: t.Optional(t.Union([t.Number(), t.Null()])),
          isSpoiler: t.Optional(t.Boolean()),
        }),
      ])
    )
  ),
  characters: t.Optional(t.Array(OtherCharacterInputSchema)),
  staff: t.Optional(t.Array(OtherStaffInputSchema)),
  studios: t.Optional(t.Array(OtherStudioInputSchema)),
  relations: t.Optional(t.Array(OtherRelationInputSchema)),
  seasons: t.Optional(t.Array(OtherSeasonInputSchema)),
  episodes: t.Optional(t.Array(OtherEpisodeInputSchema)),
  tracks: t.Optional(t.Array(OtherTrackInputSchema)),
}

export const BorealisOtherModel = {
  otherParam: t.Object({
    otherId: t.Numeric({ minimum: 1 }),
  }),

  catalogQuery: t.Object({
    cursor: t.Optional(t.Numeric({ minimum: 1 })),
    page: t.Optional(t.Numeric({ default: 1, minimum: 1 })),
    limit: t.Optional(t.Numeric({ default: 50, minimum: 1, maximum: 100 })),
    search: t.Optional(t.String()),
    genres: t.Optional(t.String()),
    tags: t.Optional(t.String()),
    formats: t.Optional(t.String()),
    statuses: t.Optional(t.String()),
    years: t.Optional(t.String()),
    season: t.Optional(t.String()),
    isAdult: t.Optional(t.String()),
    sortBy: t.Optional(
      t.Union([
        t.Literal('popularity'),
        t.Literal('score'),
        t.Literal('title'),
        t.Literal('releaseDate'),
        t.Literal('favorites'),
        t.Literal('updatedAt'),
      ])
    ),
    sortOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
  }),

  createBody: t.Object(SharedMutableFields),

  updateBody: t.Partial(t.Object(SharedMutableFields)),

  uploadBody: t.Object({
    file: t.File({ maxSize: '10m' }),
    type: t.Union([t.Literal('cover'), t.Literal('banner'), t.Literal('gallery')]),
  }),

  friendsQuery: t.Object({
    page: t.Optional(t.Numeric({ default: 1, minimum: 1 })),
    limit: t.Optional(t.Numeric({ default: 20, minimum: 1, maximum: 100 })),
  }),

  peopleQuery: t.Object({
    page: t.Optional(t.Numeric({ default: 1, minimum: 1 })),
    limit: t.Optional(t.Numeric({ default: 20, minimum: 1, maximum: 100 })),
  }),

  similarQuery: t.Object({
    limit: t.Optional(t.Numeric({ default: 24, minimum: 1, maximum: 50 })),
  }),

  catalogResponse: t.Object({
    success: t.Boolean(),
    items: t.Array(t.Any()),
    total: t.Number(),
    page: t.Number(),
    limit: t.Number(),
    totalPages: t.Number(),
    hasMore: t.Boolean(),
    nextCursor: t.Union([t.Number(), t.Null()]),
  }),

  filtersResponse: t.Object({
    success: t.Boolean(),
    formats: t.Array(t.Object({ value: t.String(), count: t.Number() })),
    statuses: t.Array(t.Object({ value: t.String(), count: t.Number() })),
    genres: t.Array(t.Object({ value: t.String(), count: t.Number() })),
    tags: t.Array(t.Object({ value: t.String(), count: t.Number() })),
    years: t.Array(t.Object({ value: t.Number(), count: t.Number() })),
    seasons: t.Array(t.Object({ value: t.String(), count: t.Number() })),
  }),

  taxonomyResponse: t.Object({
    success: t.Boolean(),
    genres: t.Array(t.Object({ id: t.Number(), name: t.String(), slug: t.String() })),
    tags: t.Array(
      t.Object({
        id: t.Number(),
        name: t.String(),
        slug: t.String(),
        category: t.Union([t.String(), t.Null()]),
      })
    ),
  }),

  itemResponse: t.Object({
    success: t.Boolean(),
    media: t.Any(),
  }),

  myItemsResponse: t.Object({
    success: t.Boolean(),
    items: t.Array(t.Any()),
  }),

  uploadResponse: t.Object({
    success: t.Boolean(),
    url: t.String(),
  }),

  deleteResponse: t.Object({
    success: t.Boolean(),
    message: t.String(),
  }),

  forkResponse: t.Object({
    success: t.Boolean(),
    media: t.Any(),
  }),

  similarResponse: t.Object({
    success: t.Boolean(),
    items: t.Array(t.Any()),
  }),

  relationsResponse: t.Object({
    success: t.Boolean(),
    relations: t.Array(t.Any()),
  }),

  charactersResponse: t.Object({
    success: t.Boolean(),
    characters: t.Array(t.Any()),
  }),

  staffResponse: t.Object({
    success: t.Boolean(),
    staff: t.Array(t.Any()),
  }),

  episodesResponse: t.Object({
    success: t.Boolean(),
    episodes: t.Array(t.Any()),
  }),

  seasonsResponse: t.Object({
    success: t.Boolean(),
    seasons: t.Array(t.Any()),
  }),

  imagesResponse: t.Object({
    success: t.Boolean(),
    images: t.Any(),
  }),

  statsResponse: t.Object({
    success: t.Boolean(),
    stats: t.Any(),
  }),

  friendsResponse: t.Object({
    success: t.Boolean(),
    friends: t.Array(t.Any()),
  }),

  peopleResponse: t.Object({
    success: t.Boolean(),
    page: t.Number(),
    limit: t.Number(),
    total: t.Number(),
    totalPages: t.Number(),
    hasMore: t.Boolean(),
    people: t.Array(t.Any()),
  }),

  recommendationsResponse: t.Object({
    success: t.Boolean(),
    recommendations: t.Array(t.Any()),
  }),

  notFoundError: t.Object({
    success: t.Boolean(),
    message: t.String(),
  }),

  forbiddenError: t.Object({
    success: t.Boolean(),
    message: t.String(),
  }),

  conflictError: t.Object({
    success: t.Boolean(),
    message: t.String(),
  }),

  validationError: t.Object({
    success: t.Boolean(),
    message: t.String(),
    errors: t.Optional(t.Any()),
  }),
}

export type OtherCatalogQuery = UnwrapSchema<typeof BorealisOtherModel.catalogQuery>
export type CreateOtherBody = UnwrapSchema<typeof BorealisOtherModel.createBody>
export type UpdateOtherBody = UnwrapSchema<typeof BorealisOtherModel.updateBody>
export type OtherFriendsQuery = UnwrapSchema<typeof BorealisOtherModel.friendsQuery>
export type OtherPeopleQuery = UnwrapSchema<typeof BorealisOtherModel.peopleQuery>
export type OtherSimilarQuery = UnwrapSchema<typeof BorealisOtherModel.similarQuery>
