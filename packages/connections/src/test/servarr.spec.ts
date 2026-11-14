import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { RadarrAdapter } from "../providers/media/radarr.adapter.js";
import { SonarrAdapter } from "../providers/media/sonarr.adapter.js";
import type { ConnectionCredentials } from "../types/index.js";

const CREDS: ConnectionCredentials = {
  hostUrl: "http://127.0.0.1:7878",
  apiKey: "test-api-key",
};

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockJsonFetch(
  captured: Array<{ url: string; init?: RequestInit }>,
  payload: unknown = []
) {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    captured.push({ url: String(input), init });
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}

describe("@NamelessLiberty/connections - Radarr v3 & Sonarr v5 Adapters", () => {
  it("routes RadarrAdapter exclusively through /api/v3 and maps general -> config/host", async () => {
    const radarr = new RadarrAdapter();
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    mockJsonFetch(calls, { id: 1 });

    await radarr.getConfigSection(CREDS, "general");
    await radarr.getCollections(CREDS, 123);
    await radarr.getDiscoverMovies(CREDS);

    assert.equal(calls[0]!.url, "http://127.0.0.1:7878/api/v3/config/host");
    assert.equal(calls[1]!.url, "http://127.0.0.1:7878/api/v3/collection?tmdbId=123");
    assert.equal(calls[2]!.url, "http://127.0.0.1:7878/api/v3/importlist/movie");
  });

  it("routes SonarrAdapter exclusively through /api/v5 and maps settings/general, seasonpass, statistics", async () => {
    const sonarr = new SonarrAdapter();
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    mockJsonFetch(calls, {});

    await sonarr.getConfigSection(CREDS, "host");
    await sonarr.getConfigSection(CREDS, "naming");
    await sonarr.runSeasonPass(CREDS, { series: [], monitoringOptions: {} });
    await sonarr.getStatistics(CREDS);
    await sonarr.getExclusions(CREDS);

    assert.equal(calls[0]!.url, "http://127.0.0.1:7878/api/v5/settings/general");
    assert.equal(calls[1]!.url, "http://127.0.0.1:7878/api/v5/settings/naming");
    assert.equal(calls[2]!.url, "http://127.0.0.1:7878/api/v5/seasonpass");
    assert.equal(calls[3]!.url, "http://127.0.0.1:7878/api/v5/statistics");
    assert.equal(calls[4]!.url, "http://127.0.0.1:7878/api/v5/importlistexclusion");
  });

  it("supports raw root-relative backup downloads and multipart FormData backup restore uploads", async () => {
    const sonarr = new SonarrAdapter();
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    mockJsonFetch(calls, { ok: true });

    await sonarr.servarrFetchRaw("/backup/manual/sonarr.zip", CREDS, {}, true);
    const form = new FormData();
    form.append("file", new Blob(["zip"]), "backup.zip");
    await sonarr.uploadBackupRestore(CREDS, form);

    assert.equal(
      calls[0]!.url,
      "http://127.0.0.1:7878/backup/manual/sonarr.zip"
    );
    assert.equal(
      calls[1]!.url,
      "http://127.0.0.1:7878/api/v5/system/backup/restore/upload"
    );
    const uploadHeaders = calls[1]!.init?.headers as Record<string, string>;
    assert.equal(uploadHeaders["Content-Type"], undefined);
  });
});

