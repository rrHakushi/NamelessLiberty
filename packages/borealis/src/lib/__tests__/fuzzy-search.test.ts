import { describe, expect, it } from "bun:test"
import {
  fuzzyMatchScore,
  matchesAnyFuzzy,
  normalizeSearchText,
} from "../fuzzy-search"

describe("normalizeSearchText", () => {
  it("strips punctuation, apostrophes, and diacritics consistently", () => {
    expect(normalizeSearchText("Dude, Where's My Car?")).toBe(
      "dude wheres my car"
    )
    expect(normalizeSearchText("Dude Wheres My Car?")).toBe(
      "dude wheres my car"
    )
    expect(normalizeSearchText("Pokémon: Indigo League")).toBe(
      "pokemon indigo league"
    )
    expect(normalizeSearchText("Shōgun")).toBe("shogun")
  })
})

describe("fuzzyMatchScore & matchesAnyFuzzy", () => {
  it("matches titles despite missing commas and apostrophes", () => {
    expect(
      matchesAnyFuzzy("Dude Wheres My Car?", ["Dude, Where's My Car?"])
    ).toBe(true)
    expect(
      matchesAnyFuzzy("Spiderman", ["Spider-Man: Into the Spider-Verse"])
    ).toBe(true)
  })

  it("matches titles with slight misspellings", () => {
    expect(
      matchesAnyFuzzy("Frieran", ["Frieren: Beyond Journey's End"])
    ).toBe(true)
    expect(matchesAnyFuzzy("Sprited Away", ["Spirited Away"])).toBe(true)
    expect(matchesAnyFuzzy("Breking Bad", ["Breaking Bad"])).toBe(true)
    expect(matchesAnyFuzzy("Incpetion", ["Inception"])).toBe(true)
  })

  it("ranks exact/normalized matches higher than fuzzy typo matches", () => {
    const exact = fuzzyMatchScore("Frieren", "Frieren: Beyond Journey's End")
    const typo = fuzzyMatchScore("Frieran", "Frieren: Beyond Journey's End")
    expect(exact).toBeGreaterThan(typo)
    expect(typo).toBeGreaterThan(0)
  })

  it("does not match unrelated titles", () => {
    expect(
      matchesAnyFuzzy("Dude Wheres My Car?", [
        "Chainsaw Man",
        "Breaking Bad",
        "Spirited Away",
      ])
    ).toBe(false)
    expect(matchesAnyFuzzy("xyz", ["Inception"])).toBe(false)
  })
})
