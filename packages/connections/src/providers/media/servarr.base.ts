import {
  BaseConnectionAdapter,
  ConnectionAuthError,
  ConnectionError,
} from "../base.adapter.js";
import type {
  AuthUrlOptions,
  AuthUrlResult,
  ConnectionAuthType,
  ConnectionCategory,
  ConnectionCredentials,
  ConnectionProvider,
  ConnectionUserProfile,
  OAuthTokens,
  ProviderCapability,
} from "../../types/index.js";

export interface ServarrSystemStatus {
  version: string;
  buildTime: string;
  isDebug: boolean;
  isProduction: boolean;
  isAdmin: boolean;
  isUserInteractive: boolean;
  startupPath: string;
  appData: string;
  osName: string;
  osVersion: string;
  isNetCore: boolean;
  databaseType: string;
  appName: string;
  instanceName?: string;
}

export type ServarrApiVersion = "v3" | "v5";

export type ServarrProviderResource =
  | "indexer"
  | "downloadclient"
  | "importlist"
  | "metadata"
  | "autotagging";

export function buildServarrQuery(
  params: Record<string, unknown> = {}
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && item !== "") {
          query.append(key, String(item));
        }
      }
    } else {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export abstract class ServarrBaseAdapter extends BaseConnectionAdapter {
  abstract readonly provider: ConnectionProvider;
  abstract readonly apiVersion: ServarrApiVersion;
  readonly category: ConnectionCategory = "SERVARR";
  readonly authType: ConnectionAuthType = "API_KEY";

  readonly capabilities: ProviderCapability = {
    authType: "API_KEY",
    category: "SERVARR",
    supportsOAuth: false,
    supportsApiKey: true,
    supportsCredentials: true,
    supportsSearch: true,
    supportsLibrarySync: true,
    supportsScrobble: false,
    supportsGamingLibrary: false,
  };

  protected getNormalizedHostUrl(credentials: ConnectionCredentials): string {
    const rawUrl = credentials.hostUrl || "http://localhost:7878";
    return rawUrl.replace(/\/+$/, "");
  }

  protected getApiKey(credentials: ConnectionCredentials): string {
    const key = credentials.apiKey || credentials.accessToken;
    if (!key) {
      throw new ConnectionAuthError(
        `Missing API Key for ${this.provider}`,
        this.provider
      );
    }
    return key;
  }

  async getAuthUrl(_options: AuthUrlOptions): Promise<AuthUrlResult> {
    throw new ConnectionError(
      `${this.provider} uses API Keys and does not support OAuth browser redirects.`,
      this.provider
    );
  }

  async exchangeAuthCode(
    _code: string,
    _redirectUri: string
  ): Promise<OAuthTokens> {
    throw new ConnectionError(
      `${this.provider} uses API Keys and does not support OAuth exchange.`,
      this.provider
    );
  }

  protected buildApiUrl(
    endpoint: string,
    credentials: ConnectionCredentials,
    rootRelative = false
  ): string {
    const host = this.getNormalizedHostUrl(credentials);
    const cleaned = endpoint.replace(/^\/+/, "");
    return rootRelative
      ? `${host}/${cleaned}`
      : `${host}/api/${this.apiVersion}/${cleaned}`;
  }

  protected async servarrFetch<T = unknown>(
    endpoint: string,
    credentials: ConnectionCredentials,
    options: RequestInit = {}
  ): Promise<T> {
    const apiKey = this.getApiKey(credentials);
    const url = this.buildApiUrl(endpoint, credentials);
    const isFormData =
      typeof FormData !== "undefined" && options.body instanceof FormData;

    const headers: Record<string, string> = {
      "X-Api-Key": apiKey,
      Accept: "application/json",
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(options.headers as Record<string, string>),
    };

    return await this.fetchJson<T>(url, {
      ...options,
      headers,
    });
  }

  /**
   * Executes an authenticated raw HTTP request (used for MediaCover images,
   * backup zip downloads/uploads, and log file downloads).
   */
  async servarrFetchRaw(
    endpoint: string,
    credentials: ConnectionCredentials,
    options: RequestInit = {},
    rootRelative = false
  ): Promise<Response> {
    const apiKey = this.getApiKey(credentials);
    const url = this.buildApiUrl(endpoint, credentials, rootRelative);
    const headers: Record<string, string> = {
      "X-Api-Key": apiKey,
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      const errBody = await response.text().catch(() => "");
      throw new ConnectionAuthError(
        `Authentication failed (${response.status}): ${errBody || response.statusText}`,
        this.provider,
        response.status,
        errBody
      );
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new ConnectionError(
        `Request failed with status ${response.status}: ${errBody || response.statusText}`,
        this.provider,
        response.status,
        errBody
      );
    }

    return response;
  }

  async getSystemStatus(
    credentials: ConnectionCredentials
  ): Promise<ServarrSystemStatus> {
    return await this.servarrFetch<ServarrSystemStatus>("system/status", credentials);
  }

  async getProfile(
    credentials: ConnectionCredentials
  ): Promise<ConnectionUserProfile> {
    const status = await this.getSystemStatus(credentials);
    const host = this.getNormalizedHostUrl(credentials);

    return {
      id: `${this.provider.toLowerCase()}_${status.version}`,
      username: status.instanceName || status.appName || this.provider,
      displayName: `${status.appName || this.provider} v${status.version}`,
      profileUrl: host,
      rawMetadata: status as unknown as Record<string, unknown>,
    };
  }

  async testConnection(
    credentials: ConnectionCredentials
  ): Promise<{ ok: boolean; message?: string; profile?: ConnectionUserProfile }> {
    try {
      const profile = await this.getProfile(credentials);
      return { ok: true, profile };
    } catch (err: unknown) {
      return {
        ok: false,
        message: (err as Error).message || `${this.provider} connection test failed`,
      };
    }
  }

  async getRootFolders(
    credentials: ConnectionCredentials
  ): Promise<Array<{ id: number; path: string; freeSpace: number }>> {
    return await this.servarrFetch("rootfolder", credentials);
  }

  async getQualityProfiles(
    credentials: ConnectionCredentials
  ): Promise<Array<{ id: number; name: string }>> {
    return await this.servarrFetch("qualityprofile", credentials);
  }

  async executeCommand(
    credentials: ConnectionCredentials,
    command: { name: string;[key: string]: unknown }
  ): Promise<unknown> {
    return await this.servarrFetch("command", credentials, {
      method: "POST",
      body: JSON.stringify(command),
    });
  }

  async getQueue(
    credentials: ConnectionCredentials,
    params: {
      page?: number;
      pageSize?: number;
      sortKey?: string;
      sortDirection?: "ascending" | "descending";
      includeUnknownSeriesItems?: boolean;
      includeSeries?: boolean;
      includeEpisode?: boolean;
      includeMovie?: boolean;
    } = {}
  ): Promise<any> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.sortKey) query.set("sortKey", params.sortKey);
    if (params.sortDirection) query.set("sortDirection", params.sortDirection);
    if (params.includeUnknownSeriesItems !== undefined)
      query.set("includeUnknownSeriesItems", String(params.includeUnknownSeriesItems));
    if (params.includeSeries !== undefined)
      query.set("includeSeries", String(params.includeSeries));
    if (params.includeEpisode !== undefined)
      query.set("includeEpisode", String(params.includeEpisode));
    if (params.includeMovie !== undefined)
      query.set("includeMovie", String(params.includeMovie));

    const qs = query.toString();
    return await this.servarrFetch(`queue${qs ? `?${qs}` : ""}`, credentials);
  }

  async deleteQueueItem(
    credentials: ConnectionCredentials,
    id: number | string,
    options: { removeFromClient?: boolean; blocklist?: boolean; skipRedownload?: boolean } = {}
  ): Promise<unknown> {
    const query = new URLSearchParams();
    if (options.removeFromClient !== undefined)
      query.set("removeFromClient", String(options.removeFromClient));
    if (options.blocklist !== undefined)
      query.set("blocklist", String(options.blocklist));
    if (options.skipRedownload !== undefined)
      query.set("skipRedownload", String(options.skipRedownload));

    const qs = query.toString();
    return await this.servarrFetch(`queue/${id}${qs ? `?${qs}` : ""}`, credentials, {
      method: "DELETE",
    });
  }

  async getManualImport(
    credentials: ConnectionCredentials,
    params: {
      folder?: string;
      downloadId?: string;
      seriesId?: number;
      movieId?: number;
      filterExistingFiles?: boolean;
    } = {}
  ): Promise<any> {
    const query = new URLSearchParams();
    if (params.folder) query.set("folder", params.folder);
    if (params.downloadId) query.set("downloadId", params.downloadId);
    if (params.seriesId) query.set("seriesId", String(params.seriesId));
    if (params.movieId) query.set("movieId", String(params.movieId));
    if (params.filterExistingFiles !== undefined)
      query.set("filterExistingFiles", String(params.filterExistingFiles));

    const qs = query.toString();
    return await this.servarrFetch(`manualimport${qs ? `?${qs}` : ""}`, credentials);
  }

  async executeManualImport(
    credentials: ConnectionCredentials,
    files: Array<Record<string, unknown>>
  ): Promise<unknown> {
    return await this.servarrFetch("manualimport", credentials, {
      method: "POST",
      body: JSON.stringify(files),
    });
  }

  async getReleases(
    credentials: ConnectionCredentials,
    params: {
      seriesId?: number;
      seasonNumber?: number;
      episodeId?: number;
      movieId?: number;
      term?: string;
      indexerId?: number;
    } = {}
  ): Promise<any> {
    const query = new URLSearchParams();
    if (params.seriesId) query.set("seriesId", String(params.seriesId));
    if (params.seasonNumber !== undefined) query.set("seasonNumber", String(params.seasonNumber));
    if (params.episodeId) query.set("episodeId", String(params.episodeId));
    if (params.movieId) query.set("movieId", String(params.movieId));
    if (params.term) query.set("term", params.term);
    if (params.indexerId) query.set("indexerId", String(params.indexerId));

    const qs = query.toString();
    return await this.servarrFetch(`release${qs ? `?${qs}` : ""}`, credentials);
  }

  async downloadRelease(
    credentials: ConnectionCredentials,
    payload: {
      guid?: string;
      indexerId?: number;
      title?: string;
      downloadUrl?: string;
      protocol?: string;
      publishDate?: string;
      [key: string]: unknown;
    }
  ): Promise<unknown> {
    return await this.servarrFetch("release", credentials, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getHistory(
    credentials: ConnectionCredentials,
    params: {
      page?: number;
      pageSize?: number;
      sortKey?: string;
      sortDirection?: "ascending" | "descending";
      eventType?: number;
      seriesId?: number;
      movieId?: number;
      episodeId?: number;
      downloadId?: string;
    } = {}
  ): Promise<any> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.sortKey) query.set("sortKey", params.sortKey);
    if (params.sortDirection) query.set("sortDirection", params.sortDirection);
    if (params.eventType) query.set("eventType", String(params.eventType));
    if (params.seriesId) query.set("seriesId", String(params.seriesId));
    if (params.movieId) query.set("movieId", String(params.movieId));
    if (params.episodeId) query.set("episodeId", String(params.episodeId));
    if (params.downloadId) query.set("downloadId", params.downloadId);

    const qs = query.toString();
    return await this.servarrFetch(`history${qs ? `?${qs}` : ""}`, credentials);
  }

  async getBlocklist(
    credentials: ConnectionCredentials,
    params: {
      page?: number;
      pageSize?: number;
      sortKey?: string;
      sortDirection?: "ascending" | "descending";
    } = {}
  ): Promise<any> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.sortKey) query.set("sortKey", params.sortKey);
    if (params.sortDirection) query.set("sortDirection", params.sortDirection);

    const qs = query.toString();
    return await this.servarrFetch(`blocklist${qs ? `?${qs}` : ""}`, credentials);
  }

  async deleteBlocklist(
    credentials: ConnectionCredentials,
    id: number | string
  ): Promise<unknown> {
    return await this.servarrFetch(`blocklist/${id}`, credentials, {
      method: "DELETE",
    });
  }

  async deleteBlocklistBulk(
    credentials: ConnectionCredentials,
    ids: number[]
  ): Promise<unknown> {
    return await this.servarrFetch("blocklist/bulk", credentials, {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  }

  async getHealth(credentials: ConnectionCredentials): Promise<any[]> {
    return await this.servarrFetch<any[]>("health", credentials);
  }

  async getDiskSpace(credentials: ConnectionCredentials): Promise<any[]> {
    return await this.servarrFetch<any[]>("diskspace", credentials);
  }

  async getIndexers(credentials: ConnectionCredentials): Promise<any[]> {
    return await this.servarrFetch<any[]>("indexer", credentials);
  }

  async getDownloadClients(credentials: ConnectionCredentials): Promise<any[]> {
    return await this.servarrFetch<any[]>("downloadclient", credentials);
  }

  async getRenamePreview(
    credentials: ConnectionCredentials,
    params: { seriesId?: number; movieId?: number; seasonNumber?: number } = {}
  ): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.seriesId) query.set("seriesId", String(params.seriesId));
    if (params.movieId) query.set("movieId", String(params.movieId));
    if (params.seasonNumber !== undefined) query.set("seasonNumber", String(params.seasonNumber));

    const qs = query.toString();
    return await this.servarrFetch<any[]>(`rename${qs ? `?${qs}` : ""}`, credentials);
  }

  // ===========================================================================
  // Generic Resource & Schema Provider Helpers
  // ===========================================================================

  async listResource<T = any>(
    resource: string,
    credentials: ConnectionCredentials,
    query: Record<string, unknown> = {}
  ): Promise<T[]> {
    return await this.servarrFetch<T[]>(
      `${resource}${buildServarrQuery(query)}`,
      credentials
    );
  }

  async getResource<T = any>(
    resource: string,
    id: number | string,
    credentials: ConnectionCredentials
  ): Promise<T> {
    return await this.servarrFetch<T>(`${resource}/${id}`, credentials);
  }

  async createResource<T = any>(
    resource: string,
    body: Record<string, unknown>,
    credentials: ConnectionCredentials
  ): Promise<T> {
    return await this.servarrFetch<T>(resource, credentials, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async updateResource<T = any>(
    resource: string,
    id: number | string,
    body: Record<string, unknown>,
    credentials: ConnectionCredentials
  ): Promise<T> {
    return await this.servarrFetch<T>(`${resource}/${id}`, credentials, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async deleteResource(
    resource: string,
    id: number | string,
    credentials: ConnectionCredentials
  ): Promise<void> {
    await this.servarrFetch(`${resource}/${id}`, credentials, {
      method: "DELETE",
    });
  }

  async bulkUpdateResource<T = any>(
    resource: string,
    body: Record<string, unknown>,
    credentials: ConnectionCredentials
  ): Promise<T> {
    return await this.servarrFetch<T>(`${resource}/bulk`, credentials, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async bulkDeleteResource(
    resource: string,
    ids: number[],
    credentials: ConnectionCredentials
  ): Promise<void> {
    await this.servarrFetch(`${resource}/bulk`, credentials, {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  }

  async getResourceSchema<T = any>(
    resource: string,
    credentials: ConnectionCredentials
  ): Promise<T> {
    return await this.servarrFetch<T>(`${resource}/schema`, credentials);
  }

  async testResource<T = any>(
    resource: string,
    body: Record<string, unknown>,
    credentials: ConnectionCredentials,
    forceTest = false
  ): Promise<T> {
    const qs = forceTest ? "?forceTest=true" : "";
    return await this.servarrFetch<T>(`${resource}/test${qs}`, credentials, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async testAllResources<T = any>(
    resource: string,
    credentials: ConnectionCredentials
  ): Promise<T[]> {
    return await this.servarrFetch<T[]>(`${resource}/testall`, credentials, {
      method: "POST",
    });
  }

  async runResourceAction<T = any>(
    resource: string,
    actionName: string,
    body: Record<string, unknown>,
    credentials: ConnectionCredentials
  ): Promise<T> {
    return await this.servarrFetch<T>(
      `${resource}/action/${encodeURIComponent(actionName)}`,
      credentials,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
  }

  // ===========================================================================
  // Extended Queue, History, Wanted & Commands
  // ===========================================================================

  async getQueueDetails(
    credentials: ConnectionCredentials,
    params: Record<string, unknown> = {}
  ): Promise<any[]> {
    return await this.servarrFetch<any[]>(
      `queue/details${buildServarrQuery(params)}`,
      credentials
    );
  }

  async getQueueStatus(credentials: ConnectionCredentials): Promise<any> {
    return await this.servarrFetch<any>("queue/status", credentials);
  }

  async grabQueueItem(
    credentials: ConnectionCredentials,
    id: number
  ): Promise<any> {
    return await this.servarrFetch<any>(`queue/grab/${id}`, credentials, {
      method: "POST",
    });
  }

  async grabQueueBulk(
    credentials: ConnectionCredentials,
    ids: number[]
  ): Promise<any> {
    return await this.servarrFetch<any>("queue/grab/bulk", credentials, {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  }

  async deleteQueueBulk(
    credentials: ConnectionCredentials,
    ids: number[],
    options: {
      removeFromClient?: boolean;
      blocklist?: boolean;
      skipRedownload?: boolean;
      changeCategory?: boolean;
    } = {}
  ): Promise<void> {
    const qs = buildServarrQuery({
      removeFromClient: options.removeFromClient ?? true,
      blocklist: options.blocklist ?? false,
      skipRedownload: options.skipRedownload ?? false,
      changeCategory: options.changeCategory,
    });
    await this.servarrFetch(`queue/bulk${qs}`, credentials, {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  }

  async markHistoryFailed(
    credentials: ConnectionCredentials,
    id: number
  ): Promise<void> {
    await this.servarrFetch(`history/failed/${id}`, credentials, {
      method: "POST",
    });
  }

  async getHistorySince(
    credentials: ConnectionCredentials,
    date: string,
    eventType?: number | string
  ): Promise<any[]> {
    return await this.servarrFetch<any[]>(
      `history/since${buildServarrQuery({ date, eventType })}`,
      credentials
    );
  }

  async pushRelease(
    credentials: ConnectionCredentials,
    release: Record<string, unknown>
  ): Promise<any> {
    return await this.servarrFetch<any>("release/push", credentials, {
      method: "POST",
      body: JSON.stringify(release),
    });
  }

  async getCommands(credentials: ConnectionCredentials): Promise<any[]> {
    return await this.servarrFetch<any[]>("command", credentials);
  }

  async getCommandById(
    credentials: ConnectionCredentials,
    id: number
  ): Promise<any> {
    return await this.servarrFetch<any>(`command/${id}`, credentials);
  }

  async cancelCommand(
    credentials: ConnectionCredentials,
    id: number
  ): Promise<void> {
    await this.servarrFetch(`command/${id}`, credentials, {
      method: "DELETE",
    });
  }

  // ===========================================================================
  // System, Tasks, Backups, Updates, Logs, Filesystem & Parser
  // ===========================================================================

  async getTasks(credentials: ConnectionCredentials): Promise<any[]> {
    return await this.servarrFetch<any[]>("system/task", credentials);
  }

  async getTaskById(
    credentials: ConnectionCredentials,
    id: number
  ): Promise<any> {
    return await this.servarrFetch<any>(`system/task/${id}`, credentials);
  }

  async getUpdates(credentials: ConnectionCredentials): Promise<any[]> {
    return await this.servarrFetch<any[]>("update", credentials);
  }

  async getBackups(credentials: ConnectionCredentials): Promise<any[]> {
    return await this.servarrFetch<any[]>("system/backup", credentials);
  }

  async deleteBackup(
    credentials: ConnectionCredentials,
    id: number
  ): Promise<void> {
    await this.servarrFetch(`system/backup/${id}`, credentials, {
      method: "DELETE",
    });
  }

  async restoreBackup(
    credentials: ConnectionCredentials,
    id: number
  ): Promise<any> {
    return await this.servarrFetch<any>(
      `system/backup/restore/${id}`,
      credentials,
      { method: "POST" }
    );
  }

  async uploadBackupRestore(
    credentials: ConnectionCredentials,
    formData: FormData
  ): Promise<any> {
    return await this.servarrFetch<any>(
      "system/backup/restore/upload",
      credentials,
      {
        method: "POST",
        body: formData,
      }
    );
  }

  async restartSystem(credentials: ConnectionCredentials): Promise<void> {
    await this.servarrFetch("system/restart", credentials, { method: "POST" });
  }

  async shutdownSystem(credentials: ConnectionCredentials): Promise<void> {
    await this.servarrFetch("system/shutdown", credentials, { method: "POST" });
  }

  async getLogs(
    credentials: ConnectionCredentials,
    params: Record<string, unknown> = {}
  ): Promise<any> {
    return await this.servarrFetch<any>(
      `log${buildServarrQuery(params)}`,
      credentials
    );
  }

  async getLogFiles(
    credentials: ConnectionCredentials,
    update = false
  ): Promise<any[]> {
    return await this.servarrFetch<any[]>(
      update ? "log/file/update" : "log/file",
      credentials
    );
  }

  async downloadLogFile(
    credentials: ConnectionCredentials,
    filename: string,
    update = false
  ): Promise<Response> {
    const prefix = update ? "log/file/update" : "log/file";
    return await this.servarrFetchRaw(
      `${prefix}/${encodeURIComponent(filename)}`,
      credentials
    );
  }

  async browseFilesystem(
    credentials: ConnectionCredentials,
    params: {
      path?: string;
      includeFiles?: boolean;
      allowFoldersWithoutTrailingSlashes?: boolean;
    } = {}
  ): Promise<any> {
    return await this.servarrFetch<any>(
      `filesystem${buildServarrQuery(params)}`,
      credentials
    );
  }

  async getFilesystemMediaFiles(
    credentials: ConnectionCredentials,
    path: string
  ): Promise<any[]> {
    return await this.servarrFetch<any[]>(
      `filesystem/mediafiles${buildServarrQuery({ path })}`,
      credentials
    );
  }

  async getFilesystemType(
    credentials: ConnectionCredentials,
    path: string
  ): Promise<any> {
    return await this.servarrFetch<any>(
      `filesystem/type${buildServarrQuery({ path })}`,
      credentials
    );
  }

  async parseRelease(
    credentials: ConnectionCredentials,
    params: { title?: string; path?: string }
  ): Promise<any> {
    return await this.servarrFetch<any>(
      `parse${buildServarrQuery(params)}`,
      credentials
    );
  }

  async getLanguages(credentials: ConnectionCredentials): Promise<any[]> {
    return await this.servarrFetch<any[]>("language", credentials);
  }

  async getIndexerFlags(credentials: ConnectionCredentials): Promise<any[]> {
    return await this.servarrFetch<any[]>("indexerflag", credentials);
  }

  async getLocalization(credentials: ConnectionCredentials): Promise<any> {
    return await this.servarrFetch<any>("localization", credentials);
  }

  async getTagsDetail(credentials: ConnectionCredentials): Promise<any[]> {
    return await this.servarrFetch<any[]>("tag/detail", credentials);
  }

  async reorderDelayProfile(
    credentials: ConnectionCredentials,
    id: number,
    moveTo: number
  ): Promise<any[]> {
    return await this.servarrFetch<any[]>(
      `delayprofile/reorder/${id}?moveTo=${moveTo}`,
      credentials,
      { method: "PUT" }
    );
  }

  async createRootFolder(
    credentials: ConnectionCredentials,
    path: string
  ): Promise<any> {
    return await this.servarrFetch<any>("rootfolder", credentials, {
      method: "POST",
      body: JSON.stringify({ path }),
    });
  }

  async deleteRootFolder(
    credentials: ConnectionCredentials,
    id: number
  ): Promise<void> {
    await this.servarrFetch(`rootfolder/${id}`, credentials, {
      method: "DELETE",
    });
  }
}

