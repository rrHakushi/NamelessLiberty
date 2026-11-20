import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { prisma } from '@NamelessLiberty/db'
import {
  extractAniListCharacterIds,
  rewriteAniListCharacterUrls,
  resolveCharacterDescriptionLinks,
  resolveSingleCharacterDescription,
} from '../../src/apps/borealis/_shared/character-description.helper'
import { anilistProvider, animeMappingProvider } from '../../src/apps/borealis/providers'
import { MediaEntitySyncer } from '../../src/apps/borealis/sync/media-entity.syncer'

interface MockCharacterRow {
  id: number
  anilistId: number | null
  namePrimary: string
  description: string | null
  image?: string | null
  gender?: string | null
  age?: string | null
  favorites?: number | null
}

function createInMemoryCharacterOrm(rows: MockCharacterRow[]) {
  let nextId = rows.reduce((max, r) => Math.max(max, r.id), 0) + 1

  const matchRow = (row: MockCharacterRow, filter: any): boolean => {
    if (!filter) return true
    if (typeof filter === 'function') {
      const proxy = {
        id: {
          in: (vals: number[]) => ({ field: 'id', vals }),
          eq: (val: number) => ({ field: 'id', vals: [val] }),
        },
        anilistId: {
          in: (vals: number[]) => ({ field: 'anilistId', vals }),
          eq: (val: number) => ({ field: 'anilistId', vals: [val] }),
        },
      }
      const cond = filter(proxy)
      if (!cond) return true
      const value = (row as any)[cond.field]
      return cond.vals.includes(value)
    }

    return Object.entries(filter).every(([k, v]) => (row as any)[k] === v)
  }

  return {
    where: (filter: any) => {
      const matched = () => rows.filter((r) => matchRow(r, filter))
      return {
        select: (..._fields: string[]) => ({
          first: async () => matched()[0] ?? null,
          all: async () => matched().map((r) => ({ ...r })),
        }),
        first: async () => matched()[0] ?? null,
        all: async () => matched().map((r) => ({ ...r })),
        update: async (data: Record<string, any>) => {
          const targets = matched()
          for (const t of targets) {
            Object.assign(t, data)
          }
          return targets[0] ?? null
        },
      }
    },
    create: async (data: any) => {
      const row: MockCharacterRow = {
        id: nextId++,
        anilistId: data.anilistId ?? null,
        namePrimary: data.namePrimary,
        description: data.description ?? null,
        image: data.image ?? null,
        gender: data.gender ?? null,
        age: data.age ?? null,
        favorites: data.favorites ?? 0,
      }
      rows.push(row)
      return { ...row }
    },
  }
}

function patchCollection(collection: any, impl: Record<string, any>) {
  for (const [k, v] of Object.entries(impl)) {
    collection[k] = v
  }
}

function restoreCollection(collection: any, methods: string[]) {
  for (const m of methods) {
    delete collection[m]
  }
}

describe('Borealis Character Description URL Resolution', () => {
  const originalFetchAnime = anilistProvider.fetchAnime
  const originalFetchManga = anilistProvider.fetchManga
  const originalFetchCharacter = anilistProvider.fetchCharacter
  const originalLookup = animeMappingProvider.lookup
  const originalLookupManga = animeMappingProvider.lookupManga

  let characterRows: MockCharacterRow[] = []

  beforeEach(() => {
    characterRows = []
    patchCollection(prisma.orm.public.Character, createInMemoryCharacterOrm(characterRows))
  })

  afterEach(() => {
    restoreCollection(prisma.orm.public.Character, ['where', 'create'])
    restoreCollection(prisma.orm.public.MediaCharacter, ['where', 'create'])
    restoreCollection(prisma.orm.public.Anime, ['where'])
    restoreCollection(prisma.orm.public.Manga, ['where'])
    anilistProvider.fetchAnime = originalFetchAnime
    anilistProvider.fetchManga = originalFetchManga
    anilistProvider.fetchCharacter = originalFetchCharacter
    animeMappingProvider.lookup = originalLookup
    animeMappingProvider.lookupManga = originalLookupManga
  })

  describe('rewriteAniListCharacterUrls & extractAniListCharacterIds', () => {
    it('replaces markdown AniList character URLs with /borealis/characters/:id', () => {
      const map = new Map<number, number>([[123212, 42]])
      const input =
        'Sits next to [Ayanokouji](https://anilist.co/character/123212/Ayanokouji-Kiyotaka). She is quiet.'
      expect(rewriteAniListCharacterUrls(input, map)).toBe(
        'Sits next to [Ayanokouji](/borealis/characters/42). She is quiet.'
      )
    })

    it('handles www, http, missing slug, trailing slash, and dots inside markdown slugs', () => {
      const map = new Map<number, number>([
        [10, 1],
        [20, 2],
        [30, 3],
      ])
      const input = [
        '[One](http://www.anilist.co/character/10)',
        '[Two](https://anilist.co/character/20/)',
        '[Dr. X](https://anilist.co/character/30/Dr.-X)',
      ].join(' | ')

      expect(rewriteAniListCharacterUrls(input, map)).toBe(
        '[One](/borealis/characters/1) | [Two](/borealis/characters/2) | [Dr. X](/borealis/characters/3)'
      )
    })

    it('preserves trailing sentence punctuation for raw URLs', () => {
      const map = new Map<number, number>([[123212, 42]])
      const input = 'See https://anilist.co/character/123212/Ayanokouji-Kiyotaka.'
      expect(rewriteAniListCharacterUrls(input, map)).toBe('See /borealis/characters/42.')
    })

    it('keeps original AniList URL when target character is not in map', () => {
      const map = new Map<number, number>([[123212, 42]])
      const input =
        'Knows [Ayanokouji](https://anilist.co/character/123212/Ayanokouji-Kiyotaka) and [Unknown](https://anilist.co/character/999999/Unknown-Person).'
      expect(rewriteAniListCharacterUrls(input, map)).toBe(
        'Knows [Ayanokouji](/borealis/characters/42) and [Unknown](https://anilist.co/character/999999/Unknown-Person).'
      )
    })

    it('replaces prefix-similar URLs safely in a single pass', () => {
      const map = new Map<number, number>([[123, 7]])
      const input =
        'First [A](https://anilist.co/character/123) and second [B](https://anilist.co/character/123/Some-Slug).'
      expect(rewriteAniListCharacterUrls(input, map)).toBe(
        'First [A](/borealis/characters/7) and second [B](/borealis/characters/7).'
      )
    })

    it('extracts unique positive AniList character IDs', () => {
      const input =
        '[A](https://anilist.co/character/123212/A) and [B](https://anilist.co/character/123212/A) and [C](http://www.anilist.co/character/456)'
      expect(extractAniListCharacterIds(input)).toEqual([123212, 456])
    })
  })

  describe('resolveCharacterDescriptionLinks & syncMediaCharacters', () => {
    it('resolves forward-referenced characters within the same anime sync without calling AniList character API', async () => {
      let fetchCharacterCalled = false
      anilistProvider.fetchCharacter = async () => {
        fetchCharacterCalled = true
        return null
      }
      animeMappingProvider.lookup = async () => ({} as any)

      patchCollection(prisma.orm.public.Anime, {
        where: () => ({
          select: () => ({ first: async () => ({ id: 100, anilistId: 98659 }) }),
          update: async () => ({}),
        }),
      })
      patchCollection(prisma.orm.public.MediaCharacter, {
        where: () => ({ first: async () => null, update: async () => ({}) }),
        create: async () => ({ id: 1 }),
      })

      anilistProvider.fetchAnime = async () =>
        ({
          id: 98659,
          title: { userPreferred: 'Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e' },
          characters: {
            edges: [
              {
                role: 'MAIN',
                node: {
                  id: 123213,
                  name: { full: 'Suzune Horikita' },
                  description:
                    'Sits next to [Ayanokouji](https://anilist.co/character/123212/Ayanokouji-Kiyotaka). Also knows [Missing](https://anilist.co/character/777777/Missing-Char).',
                },
              },
              {
                role: 'MAIN',
                node: {
                  id: 123212,
                  name: { full: 'Kiyotaka Ayanokouji' },
                  description: 'Class 1-D student.',
                },
              },
            ],
          },
        }) as any

      const res = await MediaEntitySyncer.syncAnime(100, 98659)
      expect(res.synced).toBe(true)
      expect(fetchCharacterCalled).toBe(false)

      const horikita = characterRows.find((c) => c.anilistId === 123213)
      const ayanokouji = characterRows.find((c) => c.anilistId === 123212)
      expect(horikita).toBeDefined()
      expect(ayanokouji).toBeDefined()
      expect(horikita!.description).toBe(
        `Sits next to [Ayanokouji](/borealis/characters/${ayanokouji!.id}). Also knows [Missing](https://anilist.co/character/777777/Missing-Char).`
      )
    })

    it('resolves character description links when syncing manga', async () => {
      animeMappingProvider.lookupManga = async () => ({} as any)

      patchCollection(prisma.orm.public.Manga, {
        where: () => ({
          select: () => ({ first: async () => ({ id: 200, anilistId: 94970 }) }),
          update: async () => ({}),
        }),
      })
      patchCollection(prisma.orm.public.MediaCharacter, {
        where: () => ({ first: async () => null, update: async () => ({}) }),
        create: async () => ({ id: 1 }),
      })

      anilistProvider.fetchManga = async () =>
        ({
          id: 94970,
          title: { userPreferred: 'Classroom of the Elite' },
          characters: {
            edges: [
              {
                role: 'MAIN',
                node: {
                  id: 123212,
                  name: { full: 'Kiyotaka Ayanokouji' },
                  description: 'Main protagonist.',
                },
              },
              {
                role: 'SUPPORTING',
                node: {
                  id: 128000,
                  name: { full: 'Kei Karuizawa' },
                  description:
                    'Closely cooperates with [Ayanokouji](https://anilist.co/character/123212/Ayanokouji-Kiyotaka).',
                },
              },
            ],
          },
        }) as any

      const res = await MediaEntitySyncer.syncManga(200, 94970)
      expect(res.synced).toBe(true)

      const ayanokouji = characterRows.find((c) => c.anilistId === 123212)
      const karuizawa = characterRows.find((c) => c.anilistId === 128000)
      expect(karuizawa!.description).toBe(
        `Closely cooperates with [Ayanokouji](/borealis/characters/${ayanokouji!.id}).`
      )
    })

    it('lazily resolves previously unresolved character links on read once target exists in DB', async () => {
      characterRows.push(
        {
          id: 1,
          anilistId: 123213,
          namePrimary: 'Suzune Horikita',
          description:
            'Sits next to [Ayanokouji](https://anilist.co/character/123212/Ayanokouji-Kiyotaka).',
        },
        {
          id: 42,
          anilistId: 123212,
          namePrimary: 'Kiyotaka Ayanokouji',
          description: 'Class 1-D student.',
        }
      )

      const resolved = await resolveSingleCharacterDescription(characterRows[0]!)
      expect(resolved).toBe('Sits next to [Ayanokouji](/borealis/characters/42).')
      expect(characterRows[0]!.description).toBe(
        'Sits next to [Ayanokouji](/borealis/characters/42).'
      )
    })

    it('resolveCharacterDescriptionLinks handles empty input gracefully', async () => {
      await resolveCharacterDescriptionLinks([])
      expect(characterRows.length).toBe(0)
    })
  })
})
