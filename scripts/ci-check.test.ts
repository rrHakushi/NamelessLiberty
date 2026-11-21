import { describe, expect, test } from "bun:test";
import {
  compareVersions,
  evaluateCiPlan,
  extractLatestReleaseVersion,
  hasCommitFlag,
  parseVersion,
} from "./ci-check";

describe("parseVersion & compareVersions", () => {
  test("parses 3-part and 4-part versions", () => {
    expect(parseVersion("0.0.1")).toEqual([0, 0, 1]);
    expect(parseVersion("v2.0.3.10")).toEqual([2, 0, 3, 10]);
  });

  test("compares numeric segments properly", () => {
    expect(compareVersions("2.0.3.10", "2.0.3.2")).toBe(1);
    expect(compareVersions("2.0.3.1", "2.0.3.1")).toBe(0);
    expect(compareVersions("0.0.1", "0.0.2")).toBe(-1);
    expect(compareVersions("1.0", "1.0.0")).toBe(0);
  });
});

describe("extractLatestReleaseVersion", () => {
  test("ignores drafts and unrelated prefixes, picks highest version", () => {
    const releases = [
      { tag_name: "jellyborealis-v2.0.3.1", draft: false },
      { tag_name: "jellyborealis-v2.0.4.0", draft: true },
      { tag_name: "jellyborealis-v2.0.3.2", draft: false },
      { tag_name: "nameless-liberty-v0.0.5", draft: false },
    ];

    expect(extractLatestReleaseVersion(releases, "jellyborealis")).toBe("2.0.3.2");
    expect(extractLatestReleaseVersion(releases, "nameless-liberty")).toBe("0.0.5");
    expect(extractLatestReleaseVersion(releases, "other")).toBeNull();
  });
});

describe("hasCommitFlag", () => {
  test("matches commit flags case-insensitively", () => {
    expect(hasCommitFlag("chore: sync schema [DB-UPDATE]", "[db-update]")).toBe(true);
    expect(hasCommitFlag("fix: small tweak", "[rebuild all]")).toBe(false);
  });
});

describe("evaluateCiPlan", () => {
  test("skips all when versions match and no overrides present", () => {
    const plan = evaluateCiPlan({
      dbVersion: "0.0.1",
      prevDbVersion: "0.0.1",
      jellyBorealisVersion: "2.0.3.1",
      latestJellyBorealisRelease: "2.0.3.1",
      tauriVersion: "0.0.1",
      latestTauriRelease: "0.0.1",
      commitMessage: "feat: ui tweak",
    });

    expect(plan.updateDb).toBe(false);
    expect(plan.buildJellyBorealis).toBe(false);
    expect(plan.buildTauri).toBe(false);
  });

  test("triggers DB on rollback (!=), and releases only on strict >", () => {
    const plan = evaluateCiPlan({
      dbVersion: "0.0.1",
      prevDbVersion: "0.0.2",
      jellyBorealisVersion: "2.0.3.0",
      latestJellyBorealisRelease: "2.0.3.1",
      tauriVersion: "0.0.2",
      latestTauriRelease: "0.0.1",
      commitMessage: "revert: rollback db",
    });

    expect(plan.updateDb).toBe(true);
    expect(plan.buildJellyBorealis).toBe(false);
    expect(plan.buildTauri).toBe(true);
  });

  test("triggers DB when state is missing or [db-update] / [rebuild all] is set", () => {
    const missingState = evaluateCiPlan({
      dbVersion: "0.0.1",
      prevDbVersion: null,
      jellyBorealisVersion: "2.0.3.1",
      latestJellyBorealisRelease: "2.0.3.1",
      tauriVersion: "0.0.1",
      latestTauriRelease: "0.0.1",
      commitMessage: "init",
    });
    expect(missingState.updateDb).toBe(true);

    const forced = evaluateCiPlan({
      dbVersion: "0.0.1",
      prevDbVersion: "0.0.1",
      jellyBorealisVersion: "2.0.3.1",
      latestJellyBorealisRelease: "2.0.3.1",
      tauriVersion: "0.0.1",
      latestTauriRelease: "0.0.1",
      commitMessage: "fix: index [db-update]",
    });
    expect(forced.updateDb).toBe(true);
  });
});
