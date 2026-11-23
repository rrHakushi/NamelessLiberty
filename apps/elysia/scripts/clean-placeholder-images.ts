import { prisma } from '@NamelessLiberty/db'

const isDryRun = process.argv.includes('--dry-run')

function isPlaceholderImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false
  const lower = url.trim().toLowerCase()
  if (!lower) return false

  return (
    lower.includes('/banners/images/missing/') ||
    lower.includes('/images/missing/movie.jpg') ||
    lower.includes('/images/missing/series.jpg') ||
    lower.includes('/images/missing/person.jpg') ||
    (lower.includes('anilistcdn/') && lower.endsWith('/default.jpg'))
  )
}

function cleanImagesJson(images: unknown): { changed: boolean; value: unknown } {
  if (!images) return { changed: false, value: images }

  if (Array.isArray(images)) {
    const filtered = images.filter((item) => {
      if (typeof item === 'string') return !isPlaceholderImageUrl(item)
      if (item && typeof item === 'object') {
        const u = (item as any).url || (item as any).image || (item as any).original
        return typeof u !== 'string' || !isPlaceholderImageUrl(u)
      }
      return true
    })
    if (filtered.length === images.length) {
      return { changed: false, value: images }
    }
    return { changed: true, value: filtered.length > 0 ? filtered : null }
  }

  if (typeof images === 'object') {
    let changed = false
    const next: Record<string, unknown> = {}

    for (const [key, val] of Object.entries(images as Record<string, unknown>)) {
      if (Array.isArray(val)) {
        const filtered = val.filter((item) => {
          if (typeof item === 'string') return !isPlaceholderImageUrl(item)
          if (item && typeof item === 'object') {
            const u = (item as any).url || (item as any).image || (item as any).original
            return typeof u !== 'string' || !isPlaceholderImageUrl(u)
          }
          return true
        })
        if (filtered.length !== val.length) changed = true
        if (filtered.length > 0) next[key] = filtered
      } else if (typeof val === 'string') {
        if (isPlaceholderImageUrl(val)) {
          changed = true
        } else {
          next[key] = val
        }
      } else if (val != null) {
        next[key] = val
      }
    }

    if (!changed) return { changed: false, value: images }
    return {
      changed: true,
      value: Object.keys(next).length > 0 ? next : null,
    }
  }

  return { changed: false, value: images }
}

async function cleanSingleImageTable(
  label: string,
  table: any,
  fields: string[]
): Promise<number> {
  let updated = 0
  let cursorId = 0
  const batchSize = 500

  while (true) {
    const rows = (await table
      .where((r: any) => r.id.gt(cursorId))
      .orderBy((r: any) => r.id.asc())
      .select('id', ...fields)
      .limit(batchSize)
      .all()) as Array<Record<string, any>>

    if (rows.length === 0) break
    cursorId = rows[rows.length - 1]!.id

    for (const row of rows) {
      const patch: Record<string, unknown> = {}
      let dirty = false

      for (const field of fields) {
        if (field === 'images') {
          const res = cleanImagesJson(row.images)
          if (res.changed) {
            patch.images = res.value
            dirty = true
          }
        } else if (isPlaceholderImageUrl(row[field])) {
          patch[field] = null
          dirty = true
        }
      }

      if (dirty) {
        updated++
        if (!isDryRun) {
          await table.where({ id: row.id }).update(patch)
        }
      }
    }
  }

  console.log(`[${label}] ${isDryRun ? 'Would clean' : 'Cleaned'} ${updated} row(s)`)
  return updated
}

async function main() {
  console.log(
    isDryRun
      ? 'Running placeholder image cleanup (DRY RUN)...'
      : 'Running placeholder image cleanup...'
  )

  let total = 0
  total += await cleanSingleImageTable('Anime', prisma.orm.public.Anime, [
    'coverImage',
    'bannerImage',
    'images',
  ])
  total += await cleanSingleImageTable('Manga', prisma.orm.public.Manga, [
    'coverImage',
    'bannerImage',
    'images',
  ])
  total += await cleanSingleImageTable('Tv', prisma.orm.public.Tv, [
    'coverImage',
    'bannerImage',
    'images',
  ])
  total += await cleanSingleImageTable('Movie', prisma.orm.public.Movie, [
    'coverImage',
    'bannerImage',
    'images',
  ])
  total += await cleanSingleImageTable('TvSeason', prisma.orm.public.TvSeason, [
    'posterImage',
  ])
  total += await cleanSingleImageTable('TvEpisode', prisma.orm.public.TvEpisode, [
    'thumbnail',
  ])
  total += await cleanSingleImageTable('Character', prisma.orm.public.Character, [
    'image',
  ])
  total += await cleanSingleImageTable('Person', prisma.orm.public.Person, [
    'image',
  ])

  console.log(`Done. Total rows ${isDryRun ? 'to clean' : 'cleaned'}: ${total}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Cleanup failed:', err)
  process.exit(1)
})
