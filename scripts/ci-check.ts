import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";

export interface GitHubReleaseSummary {
  tag_name?: string;
  draft?: boolean;
}

export interface CiPlanInput {
  dbVersion: string;
  prevDbVersion: string | null;
  jellyBorealisVersion: string;
  latestJellyBorealisRelease: string | null;
  tauriVersion: string;
  latestTauriRelease: string | null;
  commitMessage: string;
}

export interface CiPlan {
  updateDb: boolean;
  dbVersion: string;
  buildJellyBorealis: boolean;
  jellyBorealisVersion: string;
  buildTauri: boolean;
  tauriVersion: string;
}

/**
 * Parse a version string like "v2.0.3.1" or "0.0.1-beta.1" into numeric segments.
 */
export function parseVersion(version: string): number[] {
  return version
    .trim()
    .replace(/^v/i, "")
    .split(".")
    .map((segment) => {
      const digits = segment.match(/^\d+/)?.[0] ?? "0";
      return Number.parseInt(digits, 10);
    });
}

/**
 * Compare two dotted version strings.
 * Returns 1 if a > b, -1 if a < b, 0 if equal.
 */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

/**
 * Find the highest non-draft GitHub release version matching `<prefix>-v<version>`.
 */
export function extractLatestReleaseVersion(
  releases: GitHubReleaseSummary[],
  tagPrefix: string
): string | null {
  const prefix = `${tagPrefix}-v`;
  let latest: string | null = null;

  for (const rel of releases) {
    if (rel.draft) continue;
    const tag = rel.tag_name ?? "";
    if (!tag.startsWith(prefix)) continue;
    const ver = tag.slice(prefix.length);
    if (!ver) continue;
    if (latest === null || compareVersions(ver, latest) > 0) {
      latest = ver;
    }
  }

  return latest;
}

/**
 * Case-insensitive check for a commit message tag such as `[db-update]`.
 */
export function hasCommitFlag(commitMessage: string, flag: string): boolean {
  return commitMessage.toLowerCase().includes(flag.toLowerCase());
}

/**
 * Compute CI build/update flags from local versions, cached state, and GitHub releases.
 */
export function evaluateCiPlan(input: CiPlanInput): CiPlan {
  const forceAll = hasCommitFlag(input.commitMessage, "[rebuild all]");
  const forceDb = forceAll || hasCommitFlag(input.commitMessage, "[db-update]");

  const updateDb =
    forceDb ||
    input.prevDbVersion === null ||
    input.prevDbVersion.trim() !== input.dbVersion.trim();

  const buildJellyBorealis =
    input.latestJellyBorealisRelease === null ||
    compareVersions(input.jellyBorealisVersion, input.latestJellyBorealisRelease) > 0;

  const buildTauri =
    input.latestTauriRelease === null ||
    compareVersions(input.tauriVersion, input.latestTauriRelease) > 0;

  return {
    updateDb,
    dbVersion: input.dbVersion,
    buildJellyBorealis,
    jellyBorealisVersion: input.jellyBorealisVersion,
    buildTauri,
    tauriVersion: input.tauriVersion,
  };
}

function readJsonVersion(filePath: string): string {
  const raw = readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as { version?: string };
  if (!parsed.version) {
    throw new Error(`Missing "version" in ${filePath}`);
  }
  return parsed.version.trim();
}

async function fetchGitHubReleases(
  repoSlug: string,
  token?: string
): Promise<GitHubReleaseSummary[] | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "NamelessLiberty-CI",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repoSlug}/releases?per_page=100`,
      { headers }
    );
    if (!res.ok) {
      console.warn(
        `[ci-check] GitHub Releases API returned ${res.status}; skipping release builds unless local state is available.`
      );
      return null;
    }
    return (await res.json()) as GitHubReleaseSummary[];
  } catch (err) {
    console.warn(`[ci-check] Failed to query GitHub Releases API:`, err);
    return null;
  }
}

async function main() {
  const repoRoot = resolve(import.meta.dir, "..");
  const stateFile = process.env.CI_DB_STATE_FILE || "/ci-cache/state/db-version";
  const flagsFile = process.env.CI_FLAGS_FILE || resolve(repoRoot, ".ci-flags");
  const repoSlug = process.env.GITHUB_REPO || "rrHakushi/NamelessLiberty";
  const commitMessage = process.env.DRONE_COMMIT_MESSAGE || "";

  const dbVersion = readJsonVersion(resolve(repoRoot, "packages/database/package.json"));
  const jellyBorealisVersion = readJsonVersion(
    resolve(repoRoot, "plugins/JellyBorealis/meta.json")
  );
  const tauriVersion = readJsonVersion(resolve(repoRoot, "apps/tauri/package.json"));

  const prevDbVersion = existsSync(stateFile)
    ? readFileSync(stateFile, "utf-8").trim()
    : null;

  const releases = await fetchGitHubReleases(repoSlug, process.env.GITHUB_TOKEN);

  let latestJellyBorealisRelease: string | null = null;
  let latestTauriRelease: string | null = null;
  let plan: CiPlan;

  if (releases === null) {
    // Avoid accidentally rebuilding release artifacts if GitHub API is unreachable.
    const forceAll = hasCommitFlag(commitMessage, "[rebuild all]");
    const forceDb = forceAll || hasCommitFlag(commitMessage, "[db-update]");
    plan = {
      updateDb:
        forceDb || prevDbVersion === null || prevDbVersion !== dbVersion,
      dbVersion,
      buildJellyBorealis: false,
      jellyBorealisVersion,
      buildTauri: false,
      tauriVersion,
    };
  } else {
    latestJellyBorealisRelease = extractLatestReleaseVersion(releases, "jellyborealis");
    latestTauriRelease = extractLatestReleaseVersion(releases, "nameless-liberty");
    plan = evaluateCiPlan({
      dbVersion,
      prevDbVersion,
      jellyBorealisVersion,
      latestJellyBorealisRelease,
      tauriVersion,
      latestTauriRelease,
      commitMessage,
    });
  }

  const lines = [
    `UPDATE_DB=${plan.updateDb ? "1" : "0"}`,
    `DB_VER=${plan.dbVersion}`,
    `BUILD_JELLYBOREALIS=${plan.buildJellyBorealis ? "1" : "0"}`,
    `JELLYBOREALIS_VER=${plan.jellyBorealisVersion}`,
    `BUILD_TAURI=${plan.buildTauri ? "1" : "0"}`,
    `TAURI_VER=${plan.tauriVersion}`,
  ];

  appendFileSync(flagsFile, `${lines.join("\n")}\n`, "utf-8");

  console.info("[ci-check] Version-gated CI plan:");
  console.info(
    `  DB:            ${plan.dbVersion} (prev: ${prevDbVersion ?? "none"}) -> ${plan.updateDb ? "UPDATE" : "SKIP"}`
  );
  console.info(
    `  JellyBorealis: ${plan.jellyBorealisVersion} (latest: ${latestJellyBorealisRelease ?? "none"}) -> ${plan.buildJellyBorealis ? "BUILD" : "SKIP"}`
  );
  console.info(
    `  Tauri:         ${plan.tauriVersion} (latest: ${latestTauriRelease ?? "none"}) -> ${plan.buildTauri ? "BUILD" : "SKIP"}`
  );
}

if (import.meta.main) {
  await main();
}
