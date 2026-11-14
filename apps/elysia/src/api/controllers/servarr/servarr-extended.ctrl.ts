import { Elysia, t } from 'elysia'
import { session } from '../../../plugins/session'
import { ServarrExtendedServ } from '../../../services/servarr/servarr-extended.serv'
import { ServarrModel } from '../../models/servarr/servarr.model'

const appParam = t.Object({
  app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
})

const providerResourceUnion = t.Union([
  t.Literal('indexer'),
  t.Literal('downloadclient'),
  t.Literal('importlist'),
  t.Literal('metadata'),
  t.Literal('autotagging'),
])

const ruleResourceUnion = t.Union([
  t.Literal('qualityprofile'),
  t.Literal('qualitydefinition'),
  t.Literal('delayprofile'),
  t.Literal('releaseprofile'),
  t.Literal('customformat'),
  t.Literal('remotepathmapping'),
  t.Literal('rootfolder'),
  t.Literal('customfilter'),
  t.Literal('tag'),
])

const configSectionUnion = t.Union([
  t.Literal('mediamanagement'),
  t.Literal('naming'),
  t.Literal('downloadclient'),
  t.Literal('indexer'),
  t.Literal('importlist'),
  t.Literal('metadata'),
  t.Literal('general'),
  t.Literal('host'),
  t.Literal('ui'),
  t.Literal('update'),
])

const extendedEnvelope = t.Object({
  success: t.Boolean(),
  connected: t.Boolean(),
  provider: t.String(),
  data: t.Any(),
  message: t.Optional(t.String()),
  validationErrors: t.Optional(
    t.Array(
      t.Object({
        propertyName: t.String(),
        errorMessage: t.String(),
        severity: t.Optional(t.String()),
      })
    )
  ),
})

const standardErrors = {
  401: ServarrModel.unauthorizedError,
  422: ServarrModel.validationError,
} as const

// Split into focused sub-routers to keep Elysia generic route inference fast and bounded
const servarrRealtimeAndProxyRouter = new Elysia({ prefix: '/:app' })
  .use(session())
  .post(
    '/realtime/connect',
    {
      params: appParam,
      detail: { summary: 'Activate upstream SignalR relay', tags: ['Servarr - Realtime'] },
      response: {
        200: t.Object({
          success: t.Boolean(),
          connected: t.Boolean(),
          provider: t.String(),
          realtimeStatus: t.Union([t.Literal('connected'), t.Literal('disconnected')]),
        }),
        ...standardErrors,
      },
    },
    async ({ params: { app }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.connectRealtime(app, user.id)
    }
  )
  .get(
    '/borealis-link',
    {
      params: appParam,
      query: t.Object({
        tmdbId: t.Optional(t.Numeric()),
        tvdbId: t.Optional(t.Numeric()),
      }),
      detail: { summary: 'Resolve Borealis internal href by external ID', tags: ['Servarr - Media'] },
      response: {
        200: t.Object({ href: t.Nullable(t.String()) }),
        ...standardErrors,
      },
    },
    async ({ params: { app }, query, session: userSession }) => {
      userSession.requireUser()
      return await ServarrExtendedServ.resolveBorealisHref({
        tmdbId: query.tmdbId ? Number(query.tmdbId) : undefined,
        tvdbId: query.tvdbId ? Number(query.tvdbId) : undefined,
        mediaType: app === 'radarr' ? 'movie' : 'tv',
      })
    }
  )
  .get(
    '/mediacover/:mediaId/:filename',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        mediaId: t.Numeric(),
        filename: t.String(),
      }),
      detail: { summary: 'Proxy *arr MediaCover image', tags: ['Servarr - Proxy'] },
    },
    async ({ params: { app, mediaId, filename }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.proxyMediaCover(
        app,
        user.id,
        Number(mediaId),
        filename
      )
    }
  )

const servarrConfigAndProvidersRouter = new Elysia({ prefix: '/:app' })
  .use(session())
  .get(
    '/config/naming/examples',
    {
      params: appParam,
      detail: { summary: 'Get naming token examples', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getNamingExamples(app, user.id)
    }
  )
  .get(
    '/config/:section',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        section: configSectionUnion,
      }),
      detail: { summary: 'Get settings section', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, section }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getConfigSection(app, user.id, section)
    }
  )
  .put(
    '/config/:section',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        section: configSectionUnion,
      }),
      body: t.Record(t.String(), t.Any()),
      detail: { summary: 'Update settings section', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, section }, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.updateConfigSection(app, user.id, section, body)
    }
  )
  .get(
    '/providers/:resource',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        resource: providerResourceUnion,
      }),
      detail: { summary: 'List schema-driven providers', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, resource }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.listProviderResources(app, user.id, resource)
    }
  )
  .get(
    '/providers/:resource/schema',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        resource: providerResourceUnion,
      }),
      detail: { summary: 'Get provider implementation schemas', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, resource }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getProviderSchema(app, user.id, resource)
    }
  )
  .post(
    '/providers/:resource',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        resource: providerResourceUnion,
      }),
      body: t.Record(t.String(), t.Any()),
      detail: { summary: 'Create provider resource', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, resource }, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.createProviderResource(app, user.id, resource, body)
    }
  )
  .put(
    '/providers/:resource/:id',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        resource: providerResourceUnion,
        id: t.Numeric(),
      }),
      body: t.Record(t.String(), t.Any()),
      detail: { summary: 'Update provider resource', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, resource, id }, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.updateProviderResource(
        app,
        user.id,
        resource,
        Number(id),
        body
      )
    }
  )
  .delete(
    '/providers/:resource/:id',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        resource: providerResourceUnion,
        id: t.Numeric(),
      }),
      detail: { summary: 'Delete provider resource', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, resource, id }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.deleteProviderResource(
        app,
        user.id,
        resource,
        Number(id)
      )
    }
  )
  .post(
    '/providers/:resource/test',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        resource: providerResourceUnion,
      }),
      query: t.Optional(t.Object({ forceTest: t.Optional(t.Boolean()) })),
      body: t.Record(t.String(), t.Any()),
      detail: { summary: 'Test provider configuration', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, resource }, query, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.testProviderResource(
        app,
        user.id,
        resource,
        body,
        Boolean(query?.forceTest)
      )
    }
  )
  .post(
    '/providers/:resource/testall',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        resource: providerResourceUnion,
      }),
      detail: { summary: 'Test all configured providers', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, resource }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.testAllProviderResources(app, user.id, resource)
    }
  )
  .post(
    '/providers/:resource/action/:name',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        resource: providerResourceUnion,
        name: t.String(),
      }),
      body: t.Record(t.String(), t.Any()),
      detail: { summary: 'Run provider dynamic field action', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, resource, name }, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.runProviderAction(
        app,
        user.id,
        resource,
        name,
        body
      )
    }
  )

const servarrRulesAndExclusionsRouter = new Elysia({ prefix: '/:app' })
  .use(session())
  .get(
    '/dictionaries',
    {
      params: appParam,
      detail: { summary: 'Get languages, flags, profiles, folders, tags', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getDictionaries(app, user.id)
    }
  )
  .get(
    '/tags/detail',
    {
      params: appParam,
      detail: { summary: 'Get tag usage details', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getTagsDetail(app, user.id)
    }
  )
  .put(
    '/rules/delayprofile/reorder/:id',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        id: t.Numeric(),
      }),
      query: t.Object({ moveTo: t.Numeric() }),
      detail: { summary: 'Reorder delay profile priority', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, id }, query: { moveTo }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.reorderDelayProfile(
        app,
        user.id,
        Number(id),
        Number(moveTo)
      )
    }
  )
  .put(
    '/rules/qualitydefinition/bulk',
    {
      params: appParam,
      body: t.Array(t.Record(t.String(), t.Any())),
      detail: { summary: 'Bulk update quality definitions', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.bulkUpdateQualityDefinitions(app, user.id, body)
    }
  )
  .get(
    '/rules/qualitydefinition/limits',
    {
      params: appParam,
      detail: { summary: 'Get Radarr quality definition limits', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getQualityDefinitionLimits(app, user.id)
    }
  )
  .get(
    '/rules/:resource',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        resource: ruleResourceUnion,
      }),
      detail: { summary: 'List rule/profile/filter resource', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, resource }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.listGeneric(app, user.id, resource)
    }
  )
  .get(
    '/rules/:resource/schema',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        resource: ruleResourceUnion,
      }),
      detail: { summary: 'Get rule/profile schema', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, resource }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getSchemaGeneric(app, user.id, resource)
    }
  )
  .post(
    '/rules/:resource',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        resource: ruleResourceUnion,
      }),
      body: t.Record(t.String(), t.Any()),
      detail: { summary: 'Create rule/profile/filter resource', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, resource }, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.createGeneric(app, user.id, resource, body)
    }
  )
  .put(
    '/rules/:resource/:id',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        resource: ruleResourceUnion,
        id: t.Numeric(),
      }),
      body: t.Record(t.String(), t.Any()),
      detail: { summary: 'Update rule/profile/filter resource', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, resource, id }, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.updateGeneric(
        app,
        user.id,
        resource,
        Number(id),
        body
      )
    }
  )
  .delete(
    '/rules/:resource/:id',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        resource: ruleResourceUnion,
        id: t.Numeric(),
      }),
      detail: { summary: 'Delete rule/profile/filter resource', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, resource, id }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.deleteGeneric(app, user.id, resource, Number(id))
    }
  )
  .get(
    '/exclusions',
    {
      params: appParam,
      detail: { summary: 'List import list exclusions', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.listExclusions(app, user.id)
    }
  )
  .post(
    '/exclusions',
    {
      params: appParam,
      body: t.Record(t.String(), t.Any()),
      detail: { summary: 'Add import list exclusion', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.createExclusion(app, user.id, body)
    }
  )
  .delete(
    '/exclusions/bulk',
    {
      params: appParam,
      body: t.Object({ ids: t.Array(t.Number()) }),
      detail: { summary: 'Bulk delete import list exclusions', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.bulkDeleteExclusions(app, user.id, body.ids)
    }
  )
  .delete(
    '/exclusions/:id',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        id: t.Numeric(),
      }),
      detail: { summary: 'Delete import list exclusion', tags: ['Servarr - Settings'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, id }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.deleteExclusion(app, user.id, Number(id))
    }
  )

const servarrMediaAndActivityExtendedRouter = new Elysia({ prefix: '/:app' })
  .use(session())
  .post(
    '/import',
    {
      params: appParam,
      body: t.Array(t.Record(t.String(), t.Any())),
      detail: { summary: 'Bulk import existing library folders', tags: ['Servarr - Media'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.importMedia(app, user.id, body)
    }
  )
  .put(
    '/files/:id',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        id: t.Numeric(),
      }),
      body: t.Record(t.String(), t.Any()),
      detail: { summary: 'Update movie/episode file metadata', tags: ['Servarr - Files'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, id }, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.updateMediaFile(app, user.id, Number(id), body)
    }
  )
  .delete(
    '/files/bulk',
    {
      params: appParam,
      body: t.Object({ ids: t.Array(t.Number()) }),
      detail: { summary: 'Bulk delete movie/episode files', tags: ['Servarr - Files'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.bulkDeleteMediaFiles(app, user.id, body.ids)
    }
  )
  .get(
    '/parse',
    {
      params: appParam,
      query: t.Object({
        title: t.Optional(t.String()),
        path: t.Optional(t.String()),
      }),
      detail: { summary: 'Parse release title/path', tags: ['Servarr - Tools'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, query, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.parseRelease(app, user.id, query)
    }
  )
  .get(
    '/credits',
    {
      params: appParam,
      query: t.Optional(t.Object({ movieId: t.Optional(t.Numeric()) })),
      detail: { summary: 'Get Radarr movie credits', tags: ['Servarr - Radarr'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ query, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getCredits(
        user.id,
        query?.movieId ? Number(query.movieId) : undefined
      )
    }
  )
  .get(
    '/extrafiles',
    {
      params: appParam,
      query: t.Object({ movieId: t.Numeric() }),
      detail: { summary: 'Get Radarr movie extra files', tags: ['Servarr - Radarr'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ query, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getExtraFiles(user.id, Number(query.movieId))
    }
  )
  .get(
    '/alttitles',
    {
      params: appParam,
      query: t.Optional(t.Object({ movieId: t.Optional(t.Numeric()) })),
      detail: { summary: 'Get Radarr movie alternative titles', tags: ['Servarr - Radarr'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ query, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getAltTitles(
        user.id,
        query?.movieId ? Number(query.movieId) : undefined
      )
    }
  )
  .get(
    '/collections',
    {
      params: appParam,
      query: t.Optional(t.Object({ tmdbId: t.Optional(t.Numeric()) })),
      detail: { summary: 'List Radarr collections', tags: ['Servarr - Radarr'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ query, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getCollections(
        user.id,
        query?.tmdbId ? Number(query.tmdbId) : undefined
      )
    }
  )
  .put(
    '/collections/:id',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        id: t.Numeric(),
      }),
      body: t.Record(t.String(), t.Any()),
      detail: { summary: 'Update Radarr collection', tags: ['Servarr - Radarr'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { id }, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.updateCollection(user.id, Number(id), body)
    }
  )
  .get(
    '/discover',
    {
      params: appParam,
      query: t.Optional(
        t.Object({
          includeRecommendations: t.Optional(t.Boolean()),
          includeTrending: t.Optional(t.Boolean()),
          includePopular: t.Optional(t.Boolean()),
        })
      ),
      detail: { summary: 'Get Radarr Discover movies', tags: ['Servarr - Radarr'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ query, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getDiscoverMovies(user.id, query ?? {})
    }
  )
  .post(
    '/discover',
    {
      params: appParam,
      body: t.Array(t.Record(t.String(), t.Any())),
      detail: { summary: 'Add Radarr Discover movies', tags: ['Servarr - Radarr'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.addDiscoverMovies(user.id, body)
    }
  )
  .put(
    '/series/:id/season',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        id: t.Numeric(),
      }),
      body: t.Record(t.String(), t.Any()),
      detail: { summary: 'Update Sonarr v5 series season', tags: ['Servarr - Sonarr'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { id }, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.updateSeriesSeason(user.id, Number(id), body)
    }
  )
  .post(
    '/seasonpass',
    {
      params: appParam,
      body: t.Record(t.String(), t.Any()),
      detail: { summary: 'Run Sonarr v5 Season Pass bulk update', tags: ['Servarr - Sonarr'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.runSeasonPass(user.id, body)
    }
  )
  .get(
    '/queue/details',
    {
      params: appParam,
      query: t.Optional(
        t.Object({
          movieId: t.Optional(t.Numeric()),
          seriesId: t.Optional(t.Numeric()),
        })
      ),
      detail: { summary: 'Get queue details', tags: ['Servarr - Activity'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, query, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getQueueDetails(app, user.id, query ?? {})
    }
  )
  .post(
    '/queue/grab/bulk',
    {
      params: appParam,
      body: t.Object({ ids: t.Array(t.Number()) }),
      detail: { summary: 'Bulk grab pending queue items', tags: ['Servarr - Activity'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.grabQueueBulk(app, user.id, body.ids)
    }
  )
  .post(
    '/queue/grab/:id',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        id: t.Numeric(),
      }),
      detail: { summary: 'Grab pending queue item', tags: ['Servarr - Activity'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, id }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.grabQueueItem(app, user.id, Number(id))
    }
  )
  .delete(
    '/queue/bulk',
    {
      params: appParam,
      body: t.Object({
        ids: t.Array(t.Number()),
        removeFromClient: t.Optional(t.Boolean()),
        blocklist: t.Optional(t.Boolean()),
        skipRedownload: t.Optional(t.Boolean()),
        changeCategory: t.Optional(t.Boolean()),
      }),
      detail: { summary: 'Bulk remove queue items', tags: ['Servarr - Activity'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.deleteQueueBulk(app, user.id, body.ids, body)
    }
  )
  .get(
    '/history/scoped',
    {
      params: appParam,
      query: t.Object({
        movieId: t.Optional(t.Numeric()),
        seriesId: t.Optional(t.Numeric()),
        seasonNumber: t.Optional(t.Numeric()),
        episodeId: t.Optional(t.Numeric()),
        eventType: t.Optional(t.String()),
      }),
      detail: { summary: 'Get scoped movie/series/season/episode history', tags: ['Servarr - Activity'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, query, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getScopedHistory(app, user.id, {
        movieId: query.movieId ? Number(query.movieId) : undefined,
        seriesId: query.seriesId ? Number(query.seriesId) : undefined,
        seasonNumber:
          query.seasonNumber !== undefined ? Number(query.seasonNumber) : undefined,
        episodeId: query.episodeId ? Number(query.episodeId) : undefined,
        eventType: query.eventType,
      })
    }
  )
  .post(
    '/history/failed/:id',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        id: t.Numeric(),
      }),
      detail: { summary: 'Mark history download as failed', tags: ['Servarr - Activity'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, id }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.markHistoryFailed(app, user.id, Number(id))
    }
  )

const servarrSystemAndFilesystemRouter = new Elysia({ prefix: '/:app' })
  .use(session())
  .get(
    '/system/overview',
    {
      params: appParam,
      detail: { summary: 'Get system status, health, diskspace, tasks, updates, stats', tags: ['Servarr - System'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getSystemOverview(app, user.id)
    }
  )
  .get(
    '/system/commands',
    {
      params: appParam,
      detail: { summary: 'List active and recent commands', tags: ['Servarr - System'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getCommands(app, user.id)
    }
  )
  .delete(
    '/system/commands/:id',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        id: t.Numeric(),
      }),
      detail: { summary: 'Cancel running command', tags: ['Servarr - System'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, id }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.cancelCommand(app, user.id, Number(id))
    }
  )
  .get(
    '/system/backups',
    {
      params: appParam,
      detail: { summary: 'List system backups', tags: ['Servarr - System'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getBackups(app, user.id)
    }
  )
  .post(
    '/system/backups/restore/upload',
    {
      params: appParam,
      body: t.Object({ file: t.File() }),
      detail: { summary: 'Upload and restore backup archive', tags: ['Servarr - System'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.uploadBackupRestore(app, user.id, body.file)
    }
  )
  .post(
    '/system/backups/restore/:id',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        id: t.Numeric(),
      }),
      detail: { summary: 'Restore existing backup', tags: ['Servarr - System'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, id }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.restoreBackup(app, user.id, Number(id))
    }
  )
  .get(
    '/system/backups/:id/download',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        id: t.Numeric(),
      }),
      detail: { summary: 'Download backup archive', tags: ['Servarr - System'] },
    },
    async ({ params: { app, id }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.downloadBackup(app, user.id, Number(id))
    }
  )
  .delete(
    '/system/backups/:id',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        id: t.Numeric(),
      }),
      detail: { summary: 'Delete backup archive', tags: ['Servarr - System'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app, id }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.deleteBackup(app, user.id, Number(id))
    }
  )
  .post(
    '/system/restart',
    {
      params: appParam,
      detail: { summary: 'Restart *arr instance', tags: ['Servarr - System'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.restartSystem(app, user.id)
    }
  )
  .post(
    '/system/shutdown',
    {
      params: appParam,
      detail: { summary: 'Shutdown *arr instance', tags: ['Servarr - System'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.shutdownSystem(app, user.id)
    }
  )
  .get(
    '/log',
    {
      params: appParam,
      query: t.Optional(
        t.Object({
          page: t.Optional(t.Numeric()),
          pageSize: t.Optional(t.Numeric()),
          sortKey: t.Optional(t.String()),
          sortDirection: t.Optional(t.String()),
          level: t.Optional(t.String()),
        })
      ),
      detail: { summary: 'Get paginated system event logs', tags: ['Servarr - System'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, query, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getLogs(app, user.id, query ?? {})
    }
  )
  .get(
    '/log/file',
    {
      params: appParam,
      query: t.Optional(t.Object({ update: t.Optional(t.Boolean()) })),
      detail: { summary: 'List log files', tags: ['Servarr - System'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, query, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getLogFiles(
        app,
        user.id,
        Boolean(query?.update)
      )
    }
  )
  .get(
    '/log/file/:filename/download',
    {
      params: t.Object({
        app: t.Union([t.Literal('radarr'), t.Literal('sonarr')]),
        filename: t.String(),
      }),
      query: t.Optional(t.Object({ update: t.Optional(t.Boolean()) })),
      detail: { summary: 'Download log file contents', tags: ['Servarr - System'] },
    },
    async ({ params: { app, filename }, query, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.downloadLogFile(
        app,
        user.id,
        filename,
        Boolean(query?.update)
      )
    }
  )
  .get(
    '/filesystem',
    {
      params: appParam,
      query: t.Optional(
        t.Object({
          path: t.Optional(t.String()),
          includeFiles: t.Optional(t.Boolean()),
          allowFoldersWithoutTrailingSlashes: t.Optional(t.Boolean()),
        })
      ),
      detail: { summary: 'Browse remote *arr server filesystem', tags: ['Servarr - Tools'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, query, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.browseFilesystem(app, user.id, query ?? {})
    }
  )
  .get(
    '/filesystem/mediafiles',
    {
      params: appParam,
      query: t.Object({ path: t.String() }),
      detail: { summary: 'List media files in server directory', tags: ['Servarr - Tools'] },
      response: { 200: extendedEnvelope, ...standardErrors },
    },
    async ({ params: { app }, query, session: userSession }) => {
      const user = userSession.requireUser()
      return await ServarrExtendedServ.getFilesystemMediaFiles(
        app,
        user.id,
        query.path
      )
    }
  )

export const servarrExtendedRouter = new Elysia()
  .use(servarrRealtimeAndProxyRouter)
  .use(servarrConfigAndProvidersRouter)
  .use(servarrRulesAndExclusionsRouter)
  .use(servarrMediaAndActivityExtendedRouter)
  .use(servarrSystemAndFilesystemRouter)
