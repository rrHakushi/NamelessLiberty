import { readdirSync, readFileSync, existsSync } from "node:fs"
import { join, resolve } from "node:path"

const REPO_SLUG = "rrHakushi/NamelessLiberty"
const TAURI_DIR = resolve(import.meta.dir)
const REPO_ROOT = resolve(TAURI_DIR, "../..")
const RELEASES_DIR = join(REPO_ROOT, "releases", "NamelessLiberty")

interface PackageJson {
  version: string
}

async function main() {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    console.log("GITHUB_TOKEN not set; skipping GitHub Release publish.")
    return
  }

  if (!existsSync(RELEASES_DIR)) {
    console.log(`No release artifacts found at ${RELEASES_DIR}; skipping.`)
    return
  }

  const pkg = JSON.parse(
    readFileSync(join(TAURI_DIR, "package.json"), "utf-8")
  ) as PackageJson
  const tag = `nameless-liberty-v${pkg.version}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "NamelessLiberty-Release",
  }

  const existing = await fetch(
    `https://api.github.com/repos/${REPO_SLUG}/releases/tags/${tag}`,
    { headers }
  )
  if (existing.ok) {
    console.log(`Release ${tag} already exists; skipping publish.`)
    return
  }

  const createRes = await fetch(
    `https://api.github.com/repos/${REPO_SLUG}/releases`,
    {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        tag_name: tag,
        name: `NamelessLiberty v${pkg.version}`,
        body: `NamelessLiberty desktop release v${pkg.version}`,
        draft: false,
        prerelease: false,
      }),
    }
  )

  if (!createRes.ok) {
    throw new Error(
      `Failed to create GitHub release (${createRes.status}): ${await createRes.text()}`
    )
  }

  const release = (await createRes.json()) as { upload_url: string }
  const uploadBase = release.upload_url.replace(/\{[^}]+\}$/, "")

  const files = readdirSync(RELEASES_DIR).filter((f) => !f.startsWith("."))
  for (const file of files) {
    const filePath = join(RELEASES_DIR, file)
    const data = readFileSync(filePath)
    const uploadRes = await fetch(
      `${uploadBase}?name=${encodeURIComponent(file)}`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/octet-stream",
        },
        body: data,
      }
    )
    if (!uploadRes.ok) {
      throw new Error(
        `Failed to upload ${file} (${uploadRes.status}): ${await uploadRes.text()}`
      )
    }
    console.log(`Uploaded ${file} to ${tag}`)
  }
}

await main()
