import { describe, it, expect, beforeAll } from 'bun:test'
import { Elysia, ValidationError } from 'elysia'
import { prisma } from '@NamelessLiberty/db'
import { IRISFlags } from '@NamelessLiberty/permissions'
import { isHttpError } from '../../src/core/errors/http-errors'
import { BorealisAnimeServ } from '../../src/apps/borealis/anime/anime.serv'
import { borealisOther } from '../../src/apps/borealis/other/other.ctrl'
import { borealisLists } from '../../src/apps/borealis/lists/lists.ctrl'
import { signUserJwt } from '../../src/core/utils/auth-crypto'

describe('Borealis Other & Custom Item System', () => {
  let app: any
  let aliceToken: string
  let bobToken: string
  let adminToken: string

  beforeAll(async () => {
    Bun.env.JWT_SECRET = 'iris-default-secret-key-32-chars!!'

    aliceToken = await signUserJwt({
      id: '00000000-0000-0000-0000-000000000001',
      username: 'alice',
      email: 'alice@example.com',
      permissions: [],
    })

    bobToken = await signUserJwt({
      id: '00000000-0000-0000-0000-000000000002',
      username: 'bob',
      email: 'bob@example.com',
      permissions: [],
    })

    adminToken = await signUserJwt({
      id: '00000000-0000-0000-0000-000000000003',
      username: 'admin',
      email: 'admin@example.com',
      permissions: [1], // ADMINISTRATOR
    })

    app = new Elysia()
      .onError(({ error, set }) => {
        if (isHttpError(error)) {
          set.status = error.status
          return error.toResponse()
        }
        if (error instanceof ValidationError) {
          set.status = 422
          return {
            type: 'validation',
            title: 'Unprocessable Content',
            status: 422,
            code: 'validation',
            detail: error.message,
          }
        }
      })
      .use(borealisOther)
      .use(borealisLists)

    const ensureUser = async (u: {
      id: string
      username: string
      email: string
      passwordHash: string
      permissions: number[]
    }) => {
      const existing = await prisma.orm.public.User.where({ id: u.id })
        .select('id')
        .first()
      if (!existing) {
        await prisma.orm.public.User.create(u)
      }
    }

    await ensureUser({
      id: '00000000-0000-0000-0000-000000000001',
      username: 'alice',
      email: 'alice@example.com',
      passwordHash: 'test-hash-alice',
      permissions: [],
    })

    await ensureUser({
      id: '00000000-0000-0000-0000-000000000002',
      username: 'bob',
      email: 'bob@example.com',
      passwordHash: 'test-hash-bob',
      permissions: [],
    })

    await ensureUser({
      id: '00000000-0000-0000-0000-000000000003',
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: 'test-hash-admin',
      permissions: [1],
    })
  })

  it('validates progressFields and incrementFieldKey when creating an item', async () => {
    // Missing progressFields
    const res1 = await app.handle(
      new Request('http://localhost/borealis/other', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${aliceToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          titlePrimary: 'Invalid Item',
          progressFields: [],
          incrementFieldKey: 'foo',
        }),
      })
    )
    expect(res1.status).toBe(422)

    // incrementFieldKey does not match progress fields
    const res2 = await app.handle(
      new Request('http://localhost/borealis/other', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${aliceToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          titlePrimary: 'Mismatch Item',
          progressFields: [{ key: 'pages', label: 'Pages' }],
          incrementFieldKey: 'chapters',
        }),
      })
    )
    expect(res2.status).toBe(400)
  })

  it('creates custom item with start/end dates and progress fields', async () => {
    const res = await app.handle(
      new Request('http://localhost/borealis/other', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${aliceToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          titlePrimary: 'Learn TypeScript 6',
          description: 'Mastering new TS features',
          coverImage: 'https://example.com/ts.png',
          startDate: '2026-02-01T00:00:00.000Z',
          endDate: '2026-06-01T00:00:00.000Z',
          isPublished: true,
          progressFields: [
            { key: 'chapters', label: 'Chapters', unit: 'ch', max: 20 },
            { key: 'projects', label: 'Projects', unit: 'proj', max: 5 },
          ],
          incrementFieldKey: 'chapters',
        }),
      })
    )

    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.success).toBe(true)
    expect(data.media.titlePrimary).toBe('Learn TypeScript 6')
    expect(data.media.creatorId).toBe('00000000-0000-0000-0000-000000000001')
    expect(data.media.incrementFieldKey).toBe('chapters')
    expect(data.media.progressFields.length).toBe(2)
    expect(data.media.isPublished).toBe(true)
  })

  it('allows another user to add published item to their list and increment designated field', async () => {
    // 1. Create published item by Alice
    const createRes = await app.handle(
      new Request('http://localhost/borealis/other', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${aliceToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          titlePrimary: 'Shared Workout Plan',
          isPublished: true,
          progressFields: [{ key: 'sessions', label: 'Sessions', max: 30 }],
          incrementFieldKey: 'sessions',
        }),
      })
    )
    const createdItem = ((await createRes.json()) as any).media

    // 2. Bob adds to his Other list
    const addRes = await app.handle(
      new Request(`http://localhost/borealis/lists/other/${createdItem.id}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${bobToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          progressValues: { sessions: 5 },
        }),
      })
    )
    expect(addRes.status).toBe(200)
    const addData = (await addRes.json()) as any
    expect(addData.entry.progress).toBe(5)

    // 3. Bob increments
    const incRes = await app.handle(
      new Request(`http://localhost/borealis/lists/other/${createdItem.id}/increment`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${bobToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ count: 2 }),
      })
    )
    expect(incRes.status).toBe(200)
    const incData = (await incRes.json()) as any
    expect(incData.entry.progress).toBe(7)

    // 4. Strict deletion protection: Alice attempts to delete the item while Bob is tracking it
    const deleteAttempt = await app.handle(
      new Request(`http://localhost/borealis/other/${createdItem.id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${aliceToken}` },
      })
    )
    expect(deleteAttempt.status).toBe(409)

    // 5. Even Admin is strictly blocked if other users track it
    const adminDeleteAttempt = await app.handle(
      new Request(`http://localhost/borealis/other/${createdItem.id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${adminToken}` },
      })
    )
    expect(adminDeleteAttempt.status).toBe(409)
  })

  it('saves pre-update snapshot and allows forking a private copy', async () => {
    // 1. Create item
    const createRes = await app.handle(
      new Request('http://localhost/borealis/other', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${aliceToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          titlePrimary: 'Original Recipe Guide',
          description: 'Version 1.0 notes',
          isPublished: true,
          progressFields: [{ key: 'steps', label: 'Steps', max: 10 }],
          incrementFieldKey: 'steps',
        }),
      })
    )
    const item = ((await createRes.json()) as any).media

    // 2. Bob adds it to his list
    await app.handle(
      new Request(`http://localhost/borealis/lists/other/${item.id}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${bobToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          progressValues: { steps: 3 },
        }),
      })
    )

    // 3. Alice updates the item
    const updateRes = await app.handle(
      new Request(`http://localhost/borealis/other/${item.id}`, {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${aliceToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          titlePrimary: 'Updated Recipe Guide (v2)',
          description: 'Version 2.0 overhaul',
        }),
      })
    )
    expect(updateRes.status).toBe(200)

    // 4. Bob forks the pre-update copy
    const forkRes = await app.handle(
      new Request(`http://localhost/borealis/other/${item.id}/fork`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${bobToken}`,
        },
      })
    )
    expect(forkRes.status).toBe(200)
    const forkData = (await forkRes.json()) as any
    expect(forkData.success).toBe(true)
    expect(forkData.media.creatorId).toBe('00000000-0000-0000-0000-000000000002')
    expect(forkData.media.titlePrimary).toContain('Original Recipe Guide')
    expect(forkData.media.isPublished).toBe(false)
  })

  it('allows deletion when only the creator has it in their list', async () => {
    // 1. Create draft item
    const createRes = await app.handle(
      new Request('http://localhost/borealis/other', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${aliceToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          titlePrimary: 'Temporary Solitary Project',
          isPublished: false,
          progressFields: [{ key: 'tasks', label: 'Tasks', max: 5 }],
          incrementFieldKey: 'tasks',
        }),
      })
    )
    const item = ((await createRes.json()) as any).media

    // 2. Alice adds to her list
    await app.handle(
      new Request(`http://localhost/borealis/lists/other/${item.id}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${aliceToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ status: 'PLANNED' }),
      })
    )

    // 3. Delete succeeds
    const deleteRes = await app.handle(
      new Request(`http://localhost/borealis/other/${item.id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${aliceToken}` },
      })
    )
    expect(deleteRes.status).toBe(200)

    // 4. Item and list entry no longer exist
    const getRes = await app.handle(
      new Request(`http://localhost/borealis/other/${item.id}`, {
        headers: { authorization: `Bearer ${aliceToken}` },
      })
    )
    expect(getRes.status).toBe(404)
  })

  it('normalizes format to lowercase and records activity on list actions', async () => {
    // 1. Create item with custom format "Workout" (mixed case)
    const createRes = await app.handle(
      new Request('http://localhost/borealis/other', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${aliceToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          titlePrimary: 'Morning Workout Routine',
          format: '  Workout  ',
          isPublished: true,
          progressFields: [{ key: 'sessions', label: 'Sessions', max: 30 }],
          incrementFieldKey: 'sessions',
        }),
      })
    )
    expect(createRes.status).toBe(200)
    const item = ((await createRes.json()) as any).media
    expect(item.format).toBe('workout')

    // 2. Alice adds item to her list with TRACKING status
    const addRes = await app.handle(
      new Request(`http://localhost/borealis/lists/other/${item.id}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${aliceToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          progress: 5,
        }),
      })
    )
    expect(addRes.status).toBe(200)

    // Wait a brief tick for setImmediate activity logging
    await new Promise((resolve) => setTimeout(resolve, 50))

    // 3. Verify ActivityLog was recorded
    const activities = await prisma.orm.public.ActivityLog.where({
      userId: '00000000-0000-0000-0000-000000000001',
      mediaType: 'OTHER',
      mediaId: item.id,
    }).all()
    expect(activities.length).toBeGreaterThan(0)
    const firstAct = activities[0]!
    expect(firstAct.title).toBe('Morning Workout Routine')
    expect(firstAct.metadata).toMatchObject({
      format: 'workout',
    })

    // 4. Test GET /borealis/lists/other/filters returns user list facets
    const filtersRes = await app.handle(
      new Request('http://localhost/borealis/lists/other/filters?userId=00000000-0000-0000-0000-000000000001', {
        headers: {
          authorization: `Bearer ${aliceToken}`,
        },
      })
    )
    expect(filtersRes.status).toBe(200)
    const filtersData = (await filtersRes.json()) as any
    expect(filtersData.success).toBe(true)
    expect(filtersData.formats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'workout' }),
      ])
    )
    expect(filtersData.statuses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'IN_PROGRESS' }),
      ])
    )

    // 5. Test GET /borealis/lists/other with format query filtering
    const listFilteredRes = await app.handle(
      new Request('http://localhost/borealis/lists/other?format=workout&userId=00000000-0000-0000-0000-000000000001', {
        headers: {
          authorization: `Bearer ${aliceToken}`,
        },
      })
    )
    expect(listFilteredRes.status).toBe(200)
    const listFilteredData = (await listFilteredRes.json()) as any
    expect(listFilteredData.success).toBe(true)
    expect(listFilteredData.items.length).toBeGreaterThanOrEqual(1)
    for (const entry of listFilteredData.items) {
      expect(entry.media.format).toBe('workout')
    }

    // 6. Test GET /borealis/lists/other with non-matching format returns empty
    const emptyListRes = await app.handle(
      new Request('http://localhost/borealis/lists/other?format=nonexistent&userId=00000000-0000-0000-0000-000000000001', {
        headers: {
          authorization: `Bearer ${aliceToken}`,
        },
      })
    )
    expect(emptyListRes.status).toBe(200)
    const emptyListData = (await emptyListRes.json()) as any
    expect(emptyListData.items.length).toBe(0)
  })

  it('supports MediaStatus, customFields, inline taxonomy, one-way isolation, MAYBE status, and UserStats', async () => {
    const uniqueGenre = `OtherExclusiveGenre_${Date.now()}`
    const uniqueTag = `OtherExclusiveTag_${Date.now()}`

    const createRes = await app.handle(
      new Request('http://localhost/borealis/other', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${aliceToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          titlePrimary: 'Unified All-In-One Item',
          titleNative: '統合カスタム',
          format: 'webnovel',
          status: 'RELEASING',
          isPublished: true,
          startDateYear: 2026,
          genres: [uniqueGenre],
          tags: [uniqueTag],
          customFields: [
            { label: 'Difficulty', value: 'Hardcore', type: 'text' },
            { label: 'Stacks', value: ['TS', 'Bun'], type: 'badges' },
          ],
          episodes: [{ episodeNumber: 1, seasonNumber: 1, name: 'Pilot', runtime: 24 }],
          tracks: [{ trackNumber: 1, titlePrimary: 'Opening Theme', duration: 90 }],
          progressFields: [{ key: 'ep', label: 'Episodes', unit: 'eps', max: 12 }],
          incrementFieldKey: 'ep',
        }),
      })
    )
    expect(createRes.status).toBe(200)
    const created = ((await createRes.json()) as any).media
    expect(created.status).toBe('RELEASING')
    expect(created.hasEpisodes).toBe(true)
    expect(created.hasTracks).toBe(true)
    expect(created.hasCharacters).toBe(false)
    expect(created.customFields).toHaveLength(2)
    expect(created.genres.map((g: any) => g.name)).toContain(uniqueGenre)

    // One-way isolation: Other-only genres with 0 anime count must not leak into Anime Discover filters
    const animeFilters = await BorealisAnimeServ.getFilters()
    expect(animeFilters.genres.map((g: any) => g.value)).not.toContain(uniqueGenre)

    // Other catalog filters expose RELEASING and the new genre
    const otherFiltersRes = await app.handle(
      new Request('http://localhost/borealis/other/filters')
    )
    expect(otherFiltersRes.status).toBe(200)
    const otherFilters = (await otherFiltersRes.json()) as any
    expect(otherFilters.statuses.map((s: any) => s.value)).toContain('RELEASING')
    expect(otherFilters.genres.map((g: any) => g.value)).toContain(uniqueGenre)

    // Add to OtherList with MAYBE status + rewatched count, then check full UserStats
    const listRes = await app.handle(
      new Request(`http://localhost/borealis/lists/other/${created.id}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${aliceToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          status: 'MAYBE',
          rewatched: 2,
          progressValues: { ep: 3 },
          score: 9,
        }),
      })
    )
    expect(listRes.status).toBe(200)

    const statsRes = await app.handle(
      new Request('http://localhost/borealis/lists/other/stats?userId=00000000-0000-0000-0000-000000000001', {
        headers: {
          authorization: `Bearer ${aliceToken}`,
        },
      })
    )
    expect(statsRes.status).toBe(200)
    const statsJson = (await statsRes.json()) as any
    expect(statsJson.success).toBe(true)
    expect(statsJson.data?.mediaType).toBe('other')
  })
})
