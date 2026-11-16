import { prisma } from '@NamelessLiberty/db'
import { BaseService } from '../../../core/base/base.serv'
import {
  ServarrServ,
  extractServarrValidationErrors,
  formatServarrError,
  rewriteServarrImages,
  type ServarrApp,
  type ServarrConnectionContext,
} from '../core/servarr.serv'
import { ServarrRealtimeServ } from '../realtime/servarr-realtime.serv'

type ConnectedContext = Required<
  Pick<ServarrConnectionContext, 'adapter' | 'credentials' | 'hostUrl'>
> & {
  connected: true
  provider: 'RADARR' | 'SONARR'
}

export class ServarrExtendedServ extends BaseService {
  private static async withConnection<T = unknown>(
    app: ServarrApp,
    userId: string,
    fallbackMsg: string,
    fn: (ctx: ConnectedContext) => Promise<T>
  ) {
    const ctx = await ServarrServ.getConnectionContext(app, userId)
    if (!ctx.connected || !ctx.adapter || !ctx.credentials) {
      return {
        success: false,
        connected: false,
        provider: ctx.provider,
        message: ctx.error || `No active ${ctx.provider} connection found`,
        data: null as T | null,
        validationErrors: [] as Array<{
          propertyName: string
          errorMessage: string
          severity?: string
        }>,
      }
    }

    try {
      const data = await fn(ctx as ConnectedContext)
      return {
        success: true,
        connected: true,
        provider: ctx.provider,
        data,
        validationErrors: [] as Array<{
          propertyName: string
          errorMessage: string
          severity?: string
        }>,
      }
    } catch (err: unknown) {
      return {
        success: false,
        connected: true,
        provider: ctx.provider,
        message: formatServarrError(err, fallbackMsg),
        data: null as T | null,
        validationErrors: extractServarrValidationErrors(err),
      }
    }
  }

  // ===========================================================================
  // Realtime SignalR Activation
  // ===========================================================================
  public static async connectRealtime(app: ServarrApp, userId: string) {
    const ctx = await ServarrServ.getConnectionContext(app, userId)
    if (!ctx.connected || !ctx.credentials?.hostUrl || !ctx.credentials?.apiKey) {
      return {
        success: true,
        connected: false,
        provider: ctx.provider,
        realtimeStatus: 'disconnected' as const,
      }
    }

    const realtimeStatus = await ServarrRealtimeServ.ensureConnected(
      userId,
      app,
      {
        hostUrl: ctx.credentials.hostUrl,
        apiKey: ctx.credentials.apiKey,
      }
    )

    return {
      success: true,
      connected: true,
      provider: ctx.provider,
      realtimeStatus,
    }
  }

  // ===========================================================================
  // Borealis Cross-Link Resolver ("Open in Borealis")
  // ===========================================================================
  public static async resolveBorealisHref(params: {
    tmdbId?: number | null
    tvdbId?: number | null
    mediaType: 'movie' | 'tv'
  }): Promise<{ href: string | null }> {
    try {
      if (params.mediaType === 'movie' && params.tmdbId) {
        const movie = await prisma.orm.public.Movie.where((m) =>
          m.tmdbId.eq(params.tmdbId!)
        )
          .select('id')
          .first()
        if (movie?.id) {
          return { href: `/borealis/movie/${movie.id}` }
        }
      }

      if (params.mediaType === 'tv') {
        if (params.tvdbId) {
          const tv = await prisma.orm.public.Tv.where((t) =>
            t.tvDBId.eq(params.tvdbId!)
          )
            .select('id')
            .first()
          if (tv?.id) {
            return { href: `/borealis/tv/${tv.id}` }
          }
        }
        if (params.tmdbId) {
          const tv = await prisma.orm.public.Tv.where((t) =>
            t.tmdbId.eq(params.tmdbId!)
          )
            .select('id')
            .first()
          if (tv?.id) {
            return { href: `/borealis/tv/${tv.id}` }
          }
        }
      }
    } catch {
      // Non-critical cross-link lookup
    }
    return { href: null }
  }

  // ===========================================================================
  // Config & Settings Sections (Radarr /config/* <-> Sonarr v5 /settings/*)
  // ===========================================================================
  public static getConfigSection(
    app: ServarrApp,
    userId: string,
    section: string
  ) {
    return this.withConnection(app, userId, `Failed to fetch ${section} settings`, (ctx) =>
      ctx.adapter.getConfigSection(ctx.credentials, section)
    )
  }

  public static updateConfigSection(
    app: ServarrApp,
    userId: string,
    section: string,
    body: Record<string, unknown>
  ) {
    return this.withConnection(app, userId, `Failed to update ${section} settings`, (ctx) =>
      ctx.adapter.updateConfigSection(ctx.credentials, section, body)
    )
  }

  public static getNamingExamples(app: ServarrApp, userId: string) {
    return this.withConnection(app, userId, 'Failed to fetch naming examples', (ctx) =>
      ctx.adapter.getNamingExamples(ctx.credentials)
    )
  }

  // ===========================================================================
  // Generic Schema Providers (indexer, downloadclient, importlist, metadata, autotagging)
  // ===========================================================================
  public static listProviderResources(
    app: ServarrApp,
    userId: string,
    resource: string
  ) {
    return this.withConnection(app, userId, `Failed to list ${resource}`, (ctx) =>
      ctx.adapter.listResource(resource, ctx.credentials)
    )
  }

  public static getProviderSchema(
    app: ServarrApp,
    userId: string,
    resource: string
  ) {
    return this.withConnection(app, userId, `Failed to fetch ${resource} schema`, (ctx) =>
      ctx.adapter.getResourceSchema(resource, ctx.credentials)
    )
  }

  public static createProviderResource(
    app: ServarrApp,
    userId: string,
    resource: string,
    body: Record<string, unknown>
  ) {
    return this.withConnection(app, userId, `Failed to create ${resource}`, (ctx) =>
      ctx.adapter.createResource(resource, body, ctx.credentials)
    )
  }

  public static updateProviderResource(
    app: ServarrApp,
    userId: string,
    resource: string,
    id: number,
    body: Record<string, unknown>
  ) {
    return this.withConnection(app, userId, `Failed to update ${resource}`, (ctx) =>
      ctx.adapter.updateResource(resource, id, body, ctx.credentials)
    )
  }

  public static deleteProviderResource(
    app: ServarrApp,
    userId: string,
    resource: string,
    id: number
  ) {
    return this.withConnection(app, userId, `Failed to delete ${resource}`, (ctx) =>
      ctx.adapter.deleteResource(resource, id, ctx.credentials)
    )
  }

  public static bulkUpdateProviderResources(
    app: ServarrApp,
    userId: string,
    resource: string,
    body: Record<string, unknown>
  ) {
    return this.withConnection(app, userId, `Failed to bulk update ${resource}`, (ctx) =>
      ctx.adapter.bulkUpdateResource(resource, body, ctx.credentials)
    )
  }

  public static bulkDeleteProviderResources(
    app: ServarrApp,
    userId: string,
    resource: string,
    ids: number[]
  ) {
    return this.withConnection(app, userId, `Failed to bulk delete ${resource}`, (ctx) =>
      ctx.adapter.bulkDeleteResource(resource, ids, ctx.credentials)
    )
  }

  public static testProviderResource(
    app: ServarrApp,
    userId: string,
    resource: string,
    body: Record<string, unknown>,
    forceTest = false
  ) {
    return this.withConnection(app, userId, `Failed to test ${resource}`, (ctx) =>
      ctx.adapter.testResource(resource, body, ctx.credentials, forceTest)
    )
  }

  public static testAllProviderResources(
    app: ServarrApp,
    userId: string,
    resource: string
  ) {
    return this.withConnection(app, userId, `Failed to test all ${resource}`, (ctx) =>
      ctx.adapter.testAllResources(resource, ctx.credentials)
    )
  }

  public static runProviderAction(
    app: ServarrApp,
    userId: string,
    resource: string,
    actionName: string,
    body: Record<string, unknown>
  ) {
    return this.withConnection(app, userId, `Failed to run ${resource} action`, (ctx) =>
      ctx.adapter.runResourceAction(resource, actionName, body, ctx.credentials)
    )
  }

  // ===========================================================================
  // Profiles, Quality Definitions, Custom Formats, Rules, Tags, Filters
  // ===========================================================================
  public static listGeneric(
    app: ServarrApp,
    userId: string,
    resource: string,
    query?: Record<string, unknown>
  ) {
    return this.withConnection(app, userId, `Failed to list ${resource}`, (ctx) =>
      ctx.adapter.listResource(resource, ctx.credentials, query)
    )
  }

  public static getSchemaGeneric(
    app: ServarrApp,
    userId: string,
    resource: string
  ) {
    return this.withConnection(app, userId, `Failed to fetch ${resource} schema`, (ctx) =>
      ctx.adapter.getResourceSchema(resource, ctx.credentials)
    )
  }

  public static createGeneric(
    app: ServarrApp,
    userId: string,
    resource: string,
    body: Record<string, unknown>
  ) {
    return this.withConnection(app, userId, `Failed to create ${resource}`, (ctx) =>
      ctx.adapter.createResource(resource, body, ctx.credentials)
    )
  }

  public static updateGeneric(
    app: ServarrApp,
    userId: string,
    resource: string,
    id: number,
    body: Record<string, unknown>
  ) {
    return this.withConnection(app, userId, `Failed to update ${resource}`, (ctx) =>
      ctx.adapter.updateResource(resource, id, body, ctx.credentials)
    )
  }

  public static deleteGeneric(
    app: ServarrApp,
    userId: string,
    resource: string,
    id: number
  ) {
    return this.withConnection(app, userId, `Failed to delete ${resource}`, (ctx) =>
      ctx.adapter.deleteResource(resource, id, ctx.credentials)
    )
  }

  public static bulkUpdateQualityDefinitions(
    app: ServarrApp,
    userId: string,
    definitions: Array<Record<string, unknown>>
  ) {
    return this.withConnection(app, userId, 'Failed to update quality definitions', (ctx) =>
      ctx.adapter.bulkUpdateQualityDefinitions(ctx.credentials, definitions)
    )
  }

  public static getQualityDefinitionLimits(app: ServarrApp, userId: string) {
    return this.withConnection(app, userId, 'Failed to fetch quality definition limits', (ctx) =>
      app === 'radarr'
        ? ctx.adapter.getQualityDefinitionLimits(ctx.credentials)
        : Promise.resolve(null)
    )
  }

  public static reorderDelayProfile(
    app: ServarrApp,
    userId: string,
    id: number,
    moveTo: number
  ) {
    return this.withConnection(app, userId, 'Failed to reorder delay profile', (ctx) =>
      ctx.adapter.reorderDelayProfile(ctx.credentials, id, moveTo)
    )
  }

  public static listExclusions(app: ServarrApp, userId: string) {
    return this.withConnection(app, userId, 'Failed to fetch import list exclusions', (ctx) =>
      ctx.adapter.getExclusions(ctx.credentials)
    )
  }

  public static createExclusion(
    app: ServarrApp,
    userId: string,
    body: Record<string, unknown>
  ) {
    return this.withConnection(app, userId, 'Failed to create exclusion', (ctx) =>
      ctx.adapter.createExclusion(ctx.credentials, body)
    )
  }

  public static deleteExclusion(app: ServarrApp, userId: string, id: number) {
    return this.withConnection(app, userId, 'Failed to delete exclusion', (ctx) =>
      ctx.adapter.deleteExclusion(ctx.credentials, id)
    )
  }

  public static bulkDeleteExclusions(
    app: ServarrApp,
    userId: string,
    ids: number[]
  ) {
    return this.withConnection(app, userId, 'Failed to bulk delete exclusions', (ctx) =>
      ctx.adapter.bulkDeleteExclusions(ctx.credentials, ids)
    )
  }

  public static getTagsDetail(app: ServarrApp, userId: string) {
    return this.withConnection(app, userId, 'Failed to fetch tag details', (ctx) =>
      ctx.adapter.getTagsDetail(ctx.credentials)
    )
  }

  public static getDictionaries(app: ServarrApp, userId: string) {
    return this.withConnection(app, userId, 'Failed to fetch dictionaries', async (ctx) => {
      const [languages, indexerFlags, rootFolders, qualityProfiles, tags] =
        await Promise.all([
          ctx.adapter.getLanguages(ctx.credentials).catch(() => []),
          ctx.adapter.getIndexerFlags(ctx.credentials).catch(() => []),
          ctx.adapter.getRootFolders(ctx.credentials).catch(() => []),
          ctx.adapter.getQualityProfiles(ctx.credentials).catch(() => []),
          ctx.adapter.listResource('tag', ctx.credentials).catch(() => []),
        ])
      return { languages, indexerFlags, rootFolders, qualityProfiles, tags }
    })
  }

  // ===========================================================================
  // Extended Media: Import, Credits, ExtraFiles, AltTitles, Collections, Discover, Parse, SeasonPass
  // ===========================================================================
  public static importMedia(
    app: ServarrApp,
    userId: string,
    items: Array<Record<string, unknown>>
  ) {
    return this.withConnection(app, userId, 'Failed to import media', (ctx) =>
      app === 'radarr'
        ? ctx.adapter.importMovies(ctx.credentials, items)
        : ctx.adapter.importSeries(ctx.credentials, items)
    )
  }

  public static getCredits(userId: string, movieId?: number) {
    return this.withConnection('radarr', userId, 'Failed to fetch credits', (ctx) =>
      ctx.adapter.getCredits(ctx.credentials, movieId)
    )
  }

  public static getExtraFiles(userId: string, movieId: number) {
    return this.withConnection('radarr', userId, 'Failed to fetch extra files', (ctx) =>
      ctx.adapter.getExtraFiles(ctx.credentials, movieId)
    )
  }

  public static getAltTitles(userId: string, movieId?: number) {
    return this.withConnection('radarr', userId, 'Failed to fetch alternate titles', (ctx) =>
      ctx.adapter.getAltTitles(ctx.credentials, movieId)
    )
  }

  public static getCollections(userId: string, tmdbId?: number) {
    return this.withConnection('radarr', userId, 'Failed to fetch collections', async (ctx) => {
      const list = await ctx.adapter.getCollections(ctx.credentials, tmdbId)
      return (Array.isArray(list) ? list : []).map((c: any) =>
        rewriteServarrImages(c, 'radarr')
      )
    })
  }

  public static updateCollection(
    userId: string,
    id: number,
    body: Record<string, unknown>
  ) {
    return this.withConnection('radarr', userId, 'Failed to update collection', (ctx) =>
      ctx.adapter.updateCollection(ctx.credentials, id, body)
    )
  }

  public static getDiscoverMovies(userId: string, params?: Record<string, unknown>) {
    return this.withConnection('radarr', userId, 'Failed to fetch discover movies', (ctx) =>
      ctx.adapter.getDiscoverMovies(ctx.credentials, params)
    )
  }

  public static addDiscoverMovies(
    userId: string,
    movies: Array<Record<string, unknown>>
  ) {
    return this.withConnection('radarr', userId, 'Failed to add discover movies', (ctx) =>
      ctx.adapter.addDiscoverMovies(ctx.credentials, movies)
    )
  }

  public static updateSeriesSeason(
    userId: string,
    seriesId: number,
    body: Record<string, unknown>
  ) {
    return this.withConnection('sonarr', userId, 'Failed to update season', (ctx) =>
      ctx.adapter.updateSeriesSeason(ctx.credentials, seriesId, body)
    )
  }

  public static runSeasonPass(userId: string, body: Record<string, unknown>) {
    return this.withConnection('sonarr', userId, 'Failed to execute Season Pass', (ctx) =>
      ctx.adapter.runSeasonPass(ctx.credentials, body)
    )
  }

  public static updateMediaFile(
    app: ServarrApp,
    userId: string,
    id: number,
    body: Record<string, unknown>
  ) {
    return this.withConnection(app, userId, 'Failed to update media file', (ctx) =>
      app === 'radarr'
        ? ctx.adapter.updateMovieFile(ctx.credentials, id, body)
        : ctx.adapter.updateEpisodeFile(ctx.credentials, id, body)
    )
  }

  public static bulkDeleteMediaFiles(
    app: ServarrApp,
    userId: string,
    fileIds: number[]
  ) {
    return this.withConnection(app, userId, 'Failed to delete media files', (ctx) =>
      app === 'radarr'
        ? ctx.adapter.bulkDeleteMovieFiles(ctx.credentials, fileIds)
        : ctx.adapter.bulkDeleteEpisodeFiles(ctx.credentials, fileIds)
    )
  }

  public static parseRelease(
    app: ServarrApp,
    userId: string,
    params: { title?: string; path?: string }
  ) {
    return this.withConnection(app, userId, 'Failed to parse release', (ctx) =>
      ctx.adapter.parseRelease(ctx.credentials, params)
    )
  }

  // ===========================================================================
  // Extended Activity: Queue Details/Grab/Bulk, History Failed/Scope, Release Push
  // ===========================================================================
  public static getQueueDetails(
    app: ServarrApp,
    userId: string,
    params?: Record<string, unknown>
  ) {
    return this.withConnection(app, userId, 'Failed to fetch queue details', (ctx) =>
      ctx.adapter.getQueueDetails(ctx.credentials, params)
    )
  }

  public static grabQueueItem(app: ServarrApp, userId: string, id: number) {
    return this.withConnection(app, userId, 'Failed to grab queue item', (ctx) =>
      ctx.adapter.grabQueueItem(ctx.credentials, id)
    )
  }

  public static grabQueueBulk(app: ServarrApp, userId: string, ids: number[]) {
    return this.withConnection(app, userId, 'Failed to grab queue items', (ctx) =>
      ctx.adapter.grabQueueBulk(ctx.credentials, ids)
    )
  }

  public static deleteQueueBulk(
    app: ServarrApp,
    userId: string,
    ids: number[],
    options: {
      removeFromClient?: boolean
      blocklist?: boolean
      skipRedownload?: boolean
      changeCategory?: boolean
    }
  ) {
    return this.withConnection(app, userId, 'Failed to remove queue items', (ctx) =>
      ctx.adapter.deleteQueueBulk(ctx.credentials, ids, options)
    )
  }

  public static markHistoryFailed(app: ServarrApp, userId: string, id: number) {
    return this.withConnection(app, userId, 'Failed to mark download as failed', (ctx) =>
      ctx.adapter.markHistoryFailed(ctx.credentials, id)
    )
  }

  public static getScopedHistory(
    app: ServarrApp,
    userId: string,
    params: {
      movieId?: number
      seriesId?: number
      seasonNumber?: number
      episodeId?: number
      eventType?: string
    }
  ) {
    return this.withConnection(app, userId, 'Failed to fetch scoped history', async (ctx) => {
      if (app === 'radarr' && params.movieId) {
        return await ctx.adapter.getMovieHistory(
          ctx.credentials,
          params.movieId,
          params.eventType
        )
      }
      if (app === 'sonarr' && params.episodeId) {
        return await ctx.adapter.getEpisodeHistory(
          ctx.credentials,
          params.episodeId,
          params.eventType
        )
      }
      if (app === 'sonarr' && params.seriesId) {
        return await ctx.adapter.getSeriesHistory(
          ctx.credentials,
          params.seriesId,
          params.seasonNumber,
          params.eventType
        )
      }
      return []
    })
  }

  public static pushRelease(
    app: ServarrApp,
    userId: string,
    release: Record<string, unknown>
  ) {
    return this.withConnection(app, userId, 'Failed to push release', (ctx) =>
      ctx.adapter.pushRelease(ctx.credentials, release)
    )
  }

  // ===========================================================================
  // System, Tasks, Commands, Backups, Updates, Logs & Filesystem
  // ===========================================================================
  public static getSystemOverview(app: ServarrApp, userId: string) {
    return this.withConnection(app, userId, 'Failed to fetch system overview', async (ctx) => {
      const [status, health, diskspace, tasks, commands, updates, statistics] =
        await Promise.all([
          ctx.adapter.getSystemStatus(ctx.credentials).catch(() => null),
          ctx.adapter.getHealth(ctx.credentials).catch(() => []),
          ctx.adapter.getDiskSpace(ctx.credentials).catch(() => []),
          ctx.adapter.getTasks(ctx.credentials).catch(() => []),
          ctx.adapter.getCommands(ctx.credentials).catch(() => []),
          ctx.adapter.getUpdates(ctx.credentials).catch(() => []),
          app === 'sonarr'
            ? ctx.adapter.getStatistics(ctx.credentials).catch(() => null)
            : Promise.resolve(null),
        ])
      return {
        status,
        health,
        diskspace,
        tasks,
        commands,
        updates,
        statistics,
      }
    })
  }

  public static getCommands(app: ServarrApp, userId: string) {
    return this.withConnection(app, userId, 'Failed to fetch commands', (ctx) =>
      ctx.adapter.getCommands(ctx.credentials)
    )
  }

  public static cancelCommand(app: ServarrApp, userId: string, id: number) {
    return this.withConnection(app, userId, 'Failed to cancel command', (ctx) =>
      ctx.adapter.cancelCommand(ctx.credentials, id)
    )
  }

  public static getBackups(app: ServarrApp, userId: string) {
    return this.withConnection(app, userId, 'Failed to fetch backups', (ctx) =>
      ctx.adapter.getBackups(ctx.credentials)
    )
  }

  public static restoreBackup(app: ServarrApp, userId: string, id: number) {
    return this.withConnection(app, userId, 'Failed to restore backup', (ctx) =>
      ctx.adapter.restoreBackup(ctx.credentials, id)
    )
  }

  public static deleteBackup(app: ServarrApp, userId: string, id: number) {
    return this.withConnection(app, userId, 'Failed to delete backup', (ctx) =>
      ctx.adapter.deleteBackup(ctx.credentials, id)
    )
  }

  public static uploadBackupRestore(
    app: ServarrApp,
    userId: string,
    file: File
  ) {
    return this.withConnection(app, userId, 'Failed to upload backup', async (ctx) => {
      const formData = new FormData()
      formData.append('file', file, file.name)
      return await ctx.adapter.uploadBackupRestore(ctx.credentials, formData)
    })
  }

  public static async downloadBackup(
    app: ServarrApp,
    userId: string,
    id: number
  ): Promise<Response> {
    const ctx = await ServarrServ.getConnectionContext(app, userId)
    if (!ctx.connected || !ctx.adapter || !ctx.credentials) {
      return new Response('Connection not found', { status: 404 })
    }
    const backups = await ctx.adapter.getBackups(ctx.credentials)
    const target = Array.isArray(backups)
      ? backups.find((b: any) => Number(b.id) === Number(id))
      : null
    if (!target?.path) {
      return new Response('Backup not found', { status: 404 })
    }
    const upstream = await ctx.adapter.servarrFetchRaw(
      target.path,
      ctx.credentials,
      {},
      true
    )
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type':
          upstream.headers.get('content-type') || 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(target.name || `backup-${id}.zip`)}"`,
      },
    })
  }

  public static restartSystem(app: ServarrApp, userId: string) {
    return this.withConnection(app, userId, 'Failed to restart system', (ctx) =>
      ctx.adapter.restartSystem(ctx.credentials)
    )
  }

  public static shutdownSystem(app: ServarrApp, userId: string) {
    return this.withConnection(app, userId, 'Failed to shutdown system', (ctx) =>
      ctx.adapter.shutdownSystem(ctx.credentials)
    )
  }

  public static getLogs(
    app: ServarrApp,
    userId: string,
    params?: Record<string, unknown>
  ) {
    return this.withConnection(app, userId, 'Failed to fetch logs', (ctx) =>
      ctx.adapter.getLogs(ctx.credentials, params)
    )
  }

  public static getLogFiles(
    app: ServarrApp,
    userId: string,
    update = false
  ) {
    return this.withConnection(app, userId, 'Failed to fetch log files', (ctx) =>
      ctx.adapter.getLogFiles(ctx.credentials, update)
    )
  }

  public static async downloadLogFile(
    app: ServarrApp,
    userId: string,
    filename: string,
    update = false
  ): Promise<Response> {
    const ctx = await ServarrServ.getConnectionContext(app, userId)
    if (!ctx.connected || !ctx.adapter || !ctx.credentials) {
      return new Response('Connection not found', { status: 404 })
    }
    const upstream = await ctx.adapter.downloadLogFile(
      ctx.credentials,
      filename,
      update
    )
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type':
          upstream.headers.get('content-type') || 'text/plain; charset=utf-8',
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
      },
    })
  }

  public static browseFilesystem(
    app: ServarrApp,
    userId: string,
    params: {
      path?: string
      includeFiles?: boolean
      allowFoldersWithoutTrailingSlashes?: boolean
    }
  ) {
    return this.withConnection(app, userId, 'Failed to browse filesystem', (ctx) =>
      ctx.adapter.browseFilesystem(ctx.credentials, params)
    )
  }

  public static getFilesystemMediaFiles(
    app: ServarrApp,
    userId: string,
    path: string
  ) {
    return this.withConnection(app, userId, 'Failed to list media files', (ctx) =>
      ctx.adapter.getFilesystemMediaFiles(ctx.credentials, path)
    )
  }

  public static async proxyMediaCover(
    app: ServarrApp,
    userId: string,
    mediaId: number,
    filename: string
  ): Promise<Response> {
    const ctx = await ServarrServ.getConnectionContext(app, userId)
    if (!ctx.connected || !ctx.adapter || !ctx.credentials) {
      return new Response('Connection not found', { status: 404 })
    }
    try {
      const upstream = await ctx.adapter.getMediaCover(
        ctx.credentials,
        mediaId,
        filename
      )
      return new Response(upstream.body, {
        status: 200,
        headers: {
          'Content-Type':
            upstream.headers.get('content-type') || 'image/jpeg',
          'Cache-Control': 'private, max-age=86400',
        },
      })
    } catch {
      return new Response('Image not found', { status: 404 })
    }
  }
}

