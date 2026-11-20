import { prisma } from '@NamelessLiberty/db'

const ANILIST_CHAR_URL_REGEX =
  /https?:\/\/(?:www\.)?anilist\.co\/character\/(\d+)(?:\/[^\s)"\]<>]*)?/gi
const ANILIST_CHAR_HINT_REGEX = /anilist\.co\/character\//i

/**
 * Extracts unique AniList character IDs referenced in a description string.
 */
export function extractAniListCharacterIds(description: string): number[] {
  if (!description || !ANILIST_CHAR_HINT_REGEX.test(description)) return []

  const ids = new Set<number>()
  for (const match of description.matchAll(ANILIST_CHAR_URL_REGEX)) {
    const parsed = Number.parseInt(match[1] ?? '', 10)
    if (Number.isInteger(parsed) && parsed > 0) {
      ids.add(parsed)
    }
  }
  return Array.from(ids)
}

/**
 * Replaces AniList character URLs in a description with local `/borealis/characters/:id` paths
 * for every referenced character present in `anilistToLocalId`.
 * Characters not present in the map retain their original AniList URL.
 */
export function rewriteAniListCharacterUrls(
  description: string,
  anilistToLocalId: ReadonlyMap<number, number>
): string {
  if (!description || anilistToLocalId.size === 0 || !ANILIST_CHAR_HINT_REGEX.test(description)) {
    return description
  }

  return description.replace(
    ANILIST_CHAR_URL_REGEX,
    (fullUrl: string, idStr: string, offset: number, source: string) => {
      const targetAnilistId = Number.parseInt(idStr, 10)
      if (!Number.isInteger(targetAnilistId) || targetAnilistId <= 0) return fullUrl

      const localId = anilistToLocalId.get(targetAnilistId)
      if (!localId) return fullUrl

      const insideMarkdownParens =
        offset > 0 &&
        source[offset - 1] === '(' &&
        source[offset + fullUrl.length] === ')'

      if (!insideMarkdownParens) {
        const trailingMatch = fullUrl.match(/([.,!?;:]+)$/)
        if (trailingMatch?.[1]) {
          return `/borealis/characters/${localId}${trailingMatch[1]}`
        }
      }

      return `/borealis/characters/${localId}`
    }
  )
}

/**
 * Resolves AniList character URLs inside character descriptions for the given local character IDs
 * using strictly the local database (no external AniList API calls).
 */
export async function resolveCharacterDescriptionLinks(
  characterIds: number[],
  knownAnilistToLocal?: ReadonlyMap<number, number>
): Promise<Map<number, string>> {
  const updatedDescriptions = new Map<number, string>()
  const uniqueCharIds = Array.from(new Set(characterIds)).filter(
    (id) => Number.isInteger(id) && id > 0
  )
  if (uniqueCharIds.length === 0) return updatedDescriptions

  const chars = await prisma.orm.public.Character
    .where((c) => c.id.in(uniqueCharIds))
    .select('id', 'anilistId', 'description')
    .all()

  const anilistToLocal = new Map<number, number>(knownAnilistToLocal)
  const candidates: Array<{ id: number; description: string }> = []
  const missingAnilistIds = new Set<number>()

  for (const char of chars) {
    if (char.anilistId) {
      anilistToLocal.set(char.anilistId, char.id)
    }
    if (!char.description || !ANILIST_CHAR_HINT_REGEX.test(char.description)) continue

    candidates.push({ id: char.id, description: char.description })
    for (const targetAnilistId of extractAniListCharacterIds(char.description)) {
      if (!anilistToLocal.has(targetAnilistId)) {
        missingAnilistIds.add(targetAnilistId)
      }
    }
  }

  if (candidates.length === 0) return updatedDescriptions

  if (missingAnilistIds.size > 0) {
    const targets = await prisma.orm.public.Character
      .where((c) => c.anilistId.in(Array.from(missingAnilistIds)))
      .select('id', 'anilistId')
      .all()

    for (const target of targets) {
      if (target.anilistId) {
        anilistToLocal.set(target.anilistId, target.id)
      }
    }
  }

  for (const candidate of candidates) {
    const updatedDesc = rewriteAniListCharacterUrls(candidate.description, anilistToLocal)
    if (updatedDesc !== candidate.description) {
      await prisma.orm.public.Character
        .where({ id: candidate.id })
        .update({ description: updatedDesc })
        .catch(() => {})
      updatedDescriptions.set(candidate.id, updatedDesc)
    }
  }

  return updatedDescriptions
}

/**
 * Lazily resolves any remaining AniList character URLs in a single character's description
 * on read, persisting the rewritten description if any target character now exists in the DB.
 */
export async function resolveSingleCharacterDescription(character: {
  id: number
  description?: string | null
}): Promise<string | null> {
  const description = character.description ?? null
  if (!description || !ANILIST_CHAR_HINT_REGEX.test(description)) {
    return description
  }

  const targetAnilistIds = extractAniListCharacterIds(description)
  if (targetAnilistIds.length === 0) return description

  const targets = await prisma.orm.public.Character
    .where((c) => c.anilistId.in(targetAnilistIds))
    .select('id', 'anilistId')
    .all()

  if (targets.length === 0) return description

  const anilistToLocal = new Map<number, number>()
  for (const target of targets) {
    if (target.anilistId) {
      anilistToLocal.set(target.anilistId, target.id)
    }
  }

  const updatedDesc = rewriteAniListCharacterUrls(description, anilistToLocal)
  if (updatedDesc !== description) {
    await prisma.orm.public.Character
      .where({ id: character.id })
      .update({ description: updatedDesc })
      .catch(() => {})
  }

  return updatedDesc
}
