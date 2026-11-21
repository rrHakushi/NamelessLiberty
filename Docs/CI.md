# Drone CI Pipeline

The Drone CI pipeline ([.drone.yml](../../.drone.yml)) runs on pushes to `main` using 7 consolidated steps and version-gated builds so unchanged services and release artifacts are skipped automatically.

## Pipeline Steps

1. **Clone** — Shallow-clones the commit and writes bootstrap `.env` secrets.
2. **Infra** — Starts `postgre`, `redis`, `infisical`, and `databasus`, waits for healthchecks, and compares `apps/elysia/package.json` and `apps/next/package.json` versions against the running containers' `org.opencontainers.image.version` labels.
3. **Env & DB** — Exports Infisical `prod` secrets, runs `scripts/ci-check.ts` to evaluate DB/JellyBorealis/Tauri versions, installs workspace dependencies only if DB/Elysia/Next need an update, runs Prisma `contract:emit` + `prisma db update` + `scripts/setup-search-indexes.ts` when `packages/database/package.json` changes, and builds workspace packages if Elysia or Next need a rebuild.
4. **Deploy & Verify** — Starts `rustfs`, `deemix`, and `searxng`, conditionally rebuilds/restarts `elysia` and `next`, and verifies all 9 containers are running.
5. **JellyBorealis** — Exits immediately if `plugins/JellyBorealis/meta.json` `version` is `<=` the latest non-draft `jellyborealis-v*` GitHub release; otherwise builds, updates `manifest.json`, and publishes to GitHub Releases.
6. **NamelessLiberty** — Exits immediately if `apps/tauri/package.json` `version` is `<=` the latest non-draft `nameless-liberty-v*` GitHub release; otherwise sequentially builds Linux, Windows (signed with `osslsigncode`), and Android (zipaligned + signed with `apksigner`) using isolated `CARGO_TARGET_DIR`s and persistent toolchain caches, then publishes to GitHub Releases.
7. **Cleanup** — Removes `.env` and `.ci-flags`, prunes dangling Docker images, and enforces a **30 GB** total CI disk cap (15 GB Docker BuildKit cache + 15 GB `/var/cache/namelessliberty-ci`).

---

## Commit Message Override Tags

Include any of these case-insensitive tags in a commit message to force a rebuild/update even when the corresponding `package.json` version has not changed:

| Tag | Effect |
| :--- | :--- |
| `[rebuild elysia]` | Forces `NamelessLiberty-Elysia` Docker image rebuild and redeploy |
| `[rebuild next]` | Forces `NamelessLiberty-Next` Docker image rebuild and redeploy |
| `[db-update]` | Forces Prisma `contract:emit`, `prisma db update`, and `setup-search-indexes.ts` |
| `[rebuild all]` | Forces Elysia, Next, and Database update together |

---

## Version-Gating Rules

| Target | Version Source | Compared Against | Trigger Condition |
| :--- | :--- | :--- | :--- |
| **Elysia** | `apps/elysia/package.json` | Running container `org.opencontainers.image.version` | `!=` or container stopped/missing or commit tag |
| **Next** | `apps/next/package.json` | Running container `org.opencontainers.image.version` | `!=` or container stopped/missing or commit tag |
| **Database** | `packages/database/package.json` | `/var/cache/namelessliberty-ci/state/db-version` | `!=` or state missing or `[db-update]` |
| **JellyBorealis** | `plugins/JellyBorealis/meta.json` | Latest GitHub release `jellyborealis-v*` | Strictly `>` |
| **NamelessLiberty** | `apps/tauri/package.json` | Latest GitHub release `nameless-liberty-v*` | Strictly `>` |
