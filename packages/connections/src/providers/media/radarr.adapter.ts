import { ServarrBaseAdapter, buildServarrQuery } from "./servarr.base.js";
import type {
  ConnectionCredentials,
  ConnectionProvider,
  LibraryItem,
  MediaSearchResult,
  SearchOptions,
} from "../../types/index.js";

export interface RadarrMovie {
  id?: number;
  title: string;
  originalTitle?: string;
  tmdbId?: number;
  imdbId?: string;
  year?: number;
  overview?: string;
  monitored?: boolean;
  hasFile?: boolean;
  images?: Array<{ coverType: string; remoteUrl?: string; url?: string }>;
  rootFolderPath?: string;
  qualityProfileId?: number;
}

export class RadarrAdapter extends ServarrBaseAdapter {
  readonly provider: ConnectionProvider = "RADARR";
  readonly apiVersion = "v3" as const;
  readonly iconUrl = "/icons/connections/radarr.svg";
  readonly defaultHostUrl = "http://localhost:7878";

  async searchMedia(
    query: string,
    credentials?: ConnectionCredentials,
    _options?: SearchOptions
  ): Promise<MediaSearchResult[]> {
    if (!credentials) {
      return [];
    }

    const movies = await this.servarrFetch<RadarrMovie[]>(
      `movie/lookup?term=${encodeURIComponent(query)}`,
      credentials
    );

    return (movies || []).map((m) => {
      const poster = m.images?.find((img) => img.coverType === "poster")?.remoteUrl;
      const fanart = m.images?.find((img) => img.coverType === "fanart")?.remoteUrl;

      return {
        id: String(m.tmdbId || m.id || m.title),
        externalId: String(m.tmdbId || m.id),
        provider: "RADARR",
        mediaType: "MOVIE",
        title: {
          userPreferred: m.title,
          english: m.title,
        },
        description: m.overview,
        coverImage: {
          large: poster,
        },
        bannerImage: fanart,
        releaseYear: m.year,
      };
    });
  }

  async getLibrary(credentials: ConnectionCredentials): Promise<LibraryItem[]> {
    const movies = await this.servarrFetch<RadarrMovie[]>("movie", credentials);
    return (movies || []).map((m) => ({
      id: String(m.id || m.tmdbId),
      externalId: String(m.tmdbId || m.id),
      provider: "RADARR",
      mediaType: "MOVIE" as const,
      title: m.title,
      status: m.hasFile ? ("COMPLETED" as const) : ("PLANNED" as const),
      releaseYear: m.year,
      notes: m.overview,
    }));
  }

  async getMovies(credentials: ConnectionCredentials): Promise<RadarrMovie[]> {
    return await this.servarrFetch<RadarrMovie[]>("movie", credentials);
  }

  async addMovie(
    credentials: ConnectionCredentials,
    movie: RadarrMovie
  ): Promise<RadarrMovie> {
    return await this.servarrFetch<RadarrMovie>("movie", credentials, {
      method: "POST",
      body: JSON.stringify({
        ...movie,
        monitored: movie.monitored ?? true,
        addOptions: {
          searchForMovie: true,
        },
      }),
    });
  }

  async bulkUpdateMovies(
    credentials: ConnectionCredentials,
    payload: {
      movieIds: number[];
      monitored?: boolean;
      qualityProfileId?: number;
      minimumAvailability?: string;
      rootFolderPath?: string;
    }
  ): Promise<RadarrMovie[]> {
    return await this.servarrFetch<RadarrMovie[]>("movie/editor", credentials, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async bulkDeleteMovies(
    credentials: ConnectionCredentials,
    payload: {
      movieIds: number[];
      deleteFiles?: boolean;
      addImportListExclusion?: boolean;
      addImportExclusion?: boolean;
    }
  ): Promise<unknown> {
    const formattedPayload = {
      movieIds: payload.movieIds,
      deleteFiles: payload.deleteFiles ?? false,
      addImportExclusion:
        payload.addImportExclusion ?? payload.addImportListExclusion ?? false,
      addImportListExclusion:
        payload.addImportListExclusion ?? payload.addImportExclusion ?? false,
    };
    return await this.servarrFetch("movie/editor", credentials, {
      method: "DELETE",
      body: JSON.stringify(formattedPayload),
    });
  }

  async getMovieFiles(
    credentials: ConnectionCredentials,
    movieId: number
  ): Promise<any[]> {
    return await this.servarrFetch<any[]>(
      `moviefile?movieId=${movieId}`,
      credentials
    );
  }

  async deleteMovieFile(
    credentials: ConnectionCredentials,
    fileId: number
  ): Promise<unknown> {
    return await this.servarrFetch(`moviefile/${fileId}`, credentials, {
      method: "DELETE",
    });
  }

  async getMovieById(
    credentials: ConnectionCredentials,
    id: number
  ): Promise<RadarrMovie> {
    return await this.servarrFetch<RadarrMovie>(`movie/${id}`, credentials);
  }

  async updateMovie(
    credentials: ConnectionCredentials,
    movie: Partial<RadarrMovie> & { id: number }
  ): Promise<RadarrMovie> {
    return await this.servarrFetch<RadarrMovie>(`movie/${movie.id}`, credentials, {
      method: "PUT",
      body: JSON.stringify(movie),
    });
  }

  async deleteMovie(
    credentials: ConnectionCredentials,
    id: number,
    deleteFiles: boolean = false,
    addImportListExclusion: boolean = false
  ): Promise<unknown> {
    return await this.servarrFetch(
      `movie/${id}?deleteFiles=${deleteFiles}&addImportListExclusion=${addImportListExclusion}&addImportExclusion=${addImportListExclusion}`,
      credentials,
      { method: "DELETE" }
    );
  }

  async lookupMovies(
    credentials: ConnectionCredentials,
    term: string
  ): Promise<RadarrMovie[]> {
    return await this.servarrFetch<RadarrMovie[]>(
      `movie/lookup?term=${encodeURIComponent(term)}`,
      credentials
    );
  }

  async getWantedMissing(
    credentials: ConnectionCredentials,
    params: {
      page?: number;
      pageSize?: number;
      sortKey?: string;
      sortDirection?: "ascending" | "descending";
      monitored?: boolean;
    } = {}
  ): Promise<any> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.sortKey) query.set("sortKey", params.sortKey);
    if (params.sortDirection) query.set("sortDirection", params.sortDirection);
    if (params.monitored !== undefined) query.set("monitored", String(params.monitored));

    const qs = query.toString();
    return await this.servarrFetch(`wanted/missing${qs ? `?${qs}` : ""}`, credentials);
  }

  async getWantedCutoff(
    credentials: ConnectionCredentials,
    params: {
      page?: number;
      pageSize?: number;
      sortKey?: string;
      sortDirection?: "ascending" | "descending";
      monitored?: boolean;
    } = {}
  ): Promise<any> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.sortKey) query.set("sortKey", params.sortKey);
    if (params.sortDirection) query.set("sortDirection", params.sortDirection);
    if (params.monitored !== undefined) query.set("monitored", String(params.monitored));

    const qs = query.toString();
    return await this.servarrFetch(`wanted/cutoff${qs ? `?${qs}` : ""}`, credentials);
  }

  // ===========================================================================
  // Extended Radarr v3 Coverage
  // ===========================================================================

  private mapConfigSection(section: string): string {
    const normalized = section.toLowerCase();
    return normalized === "general" ? "host" : normalized;
  }

  async getConfigSection(
    credentials: ConnectionCredentials,
    section: string
  ): Promise<any> {
    return await this.servarrFetch(
      `config/${this.mapConfigSection(section)}`,
      credentials
    );
  }

  async updateConfigSection(
    credentials: ConnectionCredentials,
    section: string,
    body: Record<string, unknown>
  ): Promise<any> {
    const mapped = this.mapConfigSection(section);
    const id = body.id ? `/${body.id}` : "";
    return await this.servarrFetch(`config/${mapped}${id}`, credentials, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async getNamingExamples(credentials: ConnectionCredentials): Promise<any> {
    return await this.servarrFetch("config/naming/examples", credentials);
  }

  async getQualityDefinitions(credentials: ConnectionCredentials): Promise<any[]> {
    return await this.servarrFetch<any[]>("qualitydefinition", credentials);
  }

  async getQualityDefinitionLimits(credentials: ConnectionCredentials): Promise<any> {
    return await this.servarrFetch("qualitydefinition/limits", credentials);
  }

  async updateQualityDefinition(
    credentials: ConnectionCredentials,
    id: number,
    body: Record<string, unknown>
  ): Promise<any> {
    return await this.servarrFetch(`qualitydefinition/${id}`, credentials, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async bulkUpdateQualityDefinitions(
    credentials: ConnectionCredentials,
    definitions: Array<Record<string, unknown>>
  ): Promise<any[]> {
    return await this.servarrFetch<any[]>(
      "qualitydefinition/update",
      credentials,
      {
        method: "PUT",
        body: JSON.stringify(definitions),
      }
    );
  }

  async lookupMovieByTmdb(
    credentials: ConnectionCredentials,
    tmdbId: number
  ): Promise<any> {
    return await this.servarrFetch(
      `movie/lookup/tmdb?tmdbId=${tmdbId}`,
      credentials
    );
  }

  async lookupMovieByImdb(
    credentials: ConnectionCredentials,
    imdbId: string
  ): Promise<any> {
    return await this.servarrFetch(
      `movie/lookup/imdb?imdbId=${encodeURIComponent(imdbId)}`,
      credentials
    );
  }

  async importMovies(
    credentials: ConnectionCredentials,
    movies: Array<Record<string, unknown>>
  ): Promise<any[]> {
    return await this.servarrFetch<any[]>("movie/import", credentials, {
      method: "POST",
      body: JSON.stringify(movies),
    });
  }

  async getMovieFolder(
    credentials: ConnectionCredentials,
    id: number
  ): Promise<any> {
    return await this.servarrFetch(`movie/${id}/folder`, credentials);
  }

  async updateMovieFile(
    credentials: ConnectionCredentials,
    id: number,
    body: Record<string, unknown>
  ): Promise<any> {
    return await this.servarrFetch(`moviefile/${id}`, credentials, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async bulkUpdateMovieFiles(
    credentials: ConnectionCredentials,
    body: Record<string, unknown>
  ): Promise<any> {
    return await this.servarrFetch("moviefile/editor", credentials, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async bulkDeleteMovieFiles(
    credentials: ConnectionCredentials,
    movieFileIds: number[]
  ): Promise<void> {
    await this.servarrFetch("moviefile/bulk", credentials, {
      method: "DELETE",
      body: JSON.stringify({ movieFileIds }),
    });
  }

  async getCredits(
    credentials: ConnectionCredentials,
    movieId?: number
  ): Promise<any[]> {
    return await this.servarrFetch<any[]>(
      `credit${buildServarrQuery({ movieId })}`,
      credentials
    );
  }

  async getExtraFiles(
    credentials: ConnectionCredentials,
    movieId: number
  ): Promise<any[]> {
    return await this.servarrFetch<any[]>(
      `extrafile${buildServarrQuery({ movieId })}`,
      credentials
    );
  }

  async getAltTitles(
    credentials: ConnectionCredentials,
    movieId?: number
  ): Promise<any[]> {
    return await this.servarrFetch<any[]>(
      `alttitle${buildServarrQuery({ movieId })}`,
      credentials
    );
  }

  async getMovieHistory(
    credentials: ConnectionCredentials,
    movieId: number,
    eventType?: number | string
  ): Promise<any[]> {
    return await this.servarrFetch<any[]>(
      `history/movie${buildServarrQuery({ movieId, eventType })}`,
      credentials
    );
  }

  async getMovieBlocklist(
    credentials: ConnectionCredentials,
    movieId: number
  ): Promise<any[]> {
    return await this.servarrFetch<any[]>(
      `blocklist/movie${buildServarrQuery({ movieId })}`,
      credentials
    );
  }

  async getCollections(
    credentials: ConnectionCredentials,
    tmdbId?: number
  ): Promise<any[]> {
    return await this.servarrFetch<any[]>(
      `collection${buildServarrQuery({ tmdbId })}`,
      credentials
    );
  }

  async getCollectionById(
    credentials: ConnectionCredentials,
    id: number
  ): Promise<any> {
    return await this.servarrFetch(`collection/${id}`, credentials);
  }

  async updateCollection(
    credentials: ConnectionCredentials,
    id: number,
    body: Record<string, unknown>
  ): Promise<any> {
    return await this.servarrFetch(`collection/${id}`, credentials, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async updateCollections(
    credentials: ConnectionCredentials,
    body: Record<string, unknown>
  ): Promise<any[]> {
    return await this.servarrFetch<any[]>("collection", credentials, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async getDiscoverMovies(
    credentials: ConnectionCredentials,
    params: Record<string, unknown> = {}
  ): Promise<any[]> {
    return await this.servarrFetch<any[]>(
      `importlist/movie${buildServarrQuery(params)}`,
      credentials
    );
  }

  async addDiscoverMovies(
    credentials: ConnectionCredentials,
    movies: Array<Record<string, unknown>>
  ): Promise<any[]> {
    return await this.servarrFetch<any[]>("importlist/movie", credentials, {
      method: "POST",
      body: JSON.stringify(movies),
    });
  }

  async getExclusions(credentials: ConnectionCredentials): Promise<any[]> {
    return await this.servarrFetch<any[]>("exclusions", credentials);
  }

  async getExclusionsPaged(
    credentials: ConnectionCredentials,
    params: Record<string, unknown> = {}
  ): Promise<any> {
    return await this.servarrFetch<any>(
      `exclusions/paged${buildServarrQuery(params)}`,
      credentials
    );
  }

  async createExclusion(
    credentials: ConnectionCredentials,
    body: Record<string, unknown>
  ): Promise<any> {
    return await this.servarrFetch("exclusions", credentials, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async updateExclusion(
    credentials: ConnectionCredentials,
    id: number,
    body: Record<string, unknown>
  ): Promise<any> {
    return await this.servarrFetch(`exclusions/${id}`, credentials, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async deleteExclusion(
    credentials: ConnectionCredentials,
    id: number
  ): Promise<void> {
    await this.servarrFetch(`exclusions/${id}`, credentials, {
      method: "DELETE",
    });
  }

  async bulkDeleteExclusions(
    credentials: ConnectionCredentials,
    ids: number[]
  ): Promise<void> {
    await this.servarrFetch("exclusions/bulk", credentials, {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  }

  async getMediaCover(
    credentials: ConnectionCredentials,
    movieId: number,
    filename: string
  ): Promise<Response> {
    return await this.servarrFetchRaw(
      `mediacover/${movieId}/${encodeURIComponent(filename)}`,
      credentials
    );
  }
}

