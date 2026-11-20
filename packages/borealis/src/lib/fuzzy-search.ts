/**
 * Punctuation-, diacritic-, and typo-tolerant search utilities for Borealis.
 */

/**
 * Normalizes text for search comparisons:
 * - Decomposes Unicode (NFD) and strips combining diacritics (e.g. Pokémon -> pokemon, Shōgun -> shogun)
 * - Lowercases
 * - Strips apostrophes and quotes without inserting spaces (e.g. Where's -> wheres)
 * - Replaces remaining punctuation/symbols with spaces and collapses whitespace
 */
export function normalizeSearchText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’"`]+/g, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Computes Damerau-Levenshtein edit distance (optimal string alignment)
 * between two strings, treating adjacent transpositions as 1 edit.
 */
export function damerauLevenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  )

  for (let i = 0; i <= m; i++) dp[i]![0] = i
  for (let j = 0; j <= n; j++) dp[0]![j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let best = Math.min(
        dp[i - 1]![j]! + 1, // deletion
        dp[i]![j - 1]! + 1, // insertion
        dp[i - 1]![j - 1]! + cost // substitution
      )
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        best = Math.min(best, dp[i - 2]![j - 2]! + 1) // transposition
      }
      dp[i]![j] = best
    }
  }

  return dp[m]![n]!
}

function maxEditsForLength(len: number): number {
  if (len <= 3) return 0
  if (len <= 6) return 1
  return 2
}

/**
 * Returns a relevance score in [0, 1] for how well `candidate` matches `query`.
 * Returns 0 when it does not match.
 */
export function fuzzyMatchScore(
  query: string,
  candidate: string | null | undefined
): number {
  if (!candidate) return 0
  const normQuery = normalizeSearchText(query)
  if (!normQuery) return 1

  const normCandidate = normalizeSearchText(candidate)
  if (!normCandidate) return 0

  // 1. Exact normalized equality
  if (normCandidate === normQuery) return 1.0

  // 2. Normalized substring match (handles "Dude Wheres My Car?" vs "Dude, Where's My Car?")
  if (normCandidate.includes(normQuery)) {
    return normCandidate.startsWith(normQuery) ? 0.95 : 0.9
  }

  // 3. Space-stripped comparison (handles "spiderman" vs "Spider-Man")
  const compactQuery = normQuery.replace(/\s+/g, "")
  const compactCandidate = normCandidate.replace(/\s+/g, "")
  if (compactQuery.length >= 3 && compactCandidate.includes(compactQuery)) {
    return 0.85
  }

  // 4. Token-by-token fuzzy matching (all query tokens must match at least one candidate token)
  const queryTokens = normQuery.split(" ")
  const candidateTokens = normCandidate.split(" ")

  let tokenScoreSum = 0
  for (const qTok of queryTokens) {
    let bestTokScore = 0
    const maxEdits = maxEditsForLength(qTok.length)

    for (const cTok of candidateTokens) {
      if (cTok === qTok) {
        bestTokScore = 1.0
        break
      }
      if (cTok.startsWith(qTok) || (qTok.length >= 4 && cTok.includes(qTok))) {
        bestTokScore = Math.max(bestTokScore, 0.85)
        continue
      }
      if (maxEdits > 0 && Math.abs(cTok.length - qTok.length) <= maxEdits) {
        const dist = damerauLevenshtein(qTok, cTok)
        if (dist <= maxEdits) {
          const sim = 1 - dist / Math.max(qTok.length, cTok.length)
          bestTokScore = Math.max(bestTokScore, sim * 0.8)
        }
      }
    }

    if (bestTokScore === 0) {
      // Whole-string fuzzy fallback for short single/merged-word queries (e.g. "frieran")
      if (queryTokens.length === 1 && compactQuery.length >= 4) {
        const wholeMax = maxEditsForLength(compactQuery.length)
        if (Math.abs(compactCandidate.length - compactQuery.length) <= wholeMax) {
          const dist = damerauLevenshtein(compactQuery, compactCandidate)
          if (dist <= wholeMax) {
            return (1 - dist / Math.max(compactQuery.length, compactCandidate.length)) * 0.75
          }
        }
      }
      return 0
    }

    tokenScoreSum += bestTokScore
  }

  return tokenScoreSum / queryTokens.length
}

/**
 * Returns true if `query` fuzzy-matches at least one non-empty candidate string.
 */
export function matchesAnyFuzzy(
  query: string,
  candidates: Array<string | null | undefined>
): boolean {
  if (!query.trim()) return true
  for (const candidate of candidates) {
    if (fuzzyMatchScore(query, candidate) > 0) {
      return true
    }
  }
  return false
}
