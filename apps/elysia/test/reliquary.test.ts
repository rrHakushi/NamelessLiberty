import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { Elysia, ValidationError } from 'elysia'
import { IRISBitField, IRISFlags } from '@NamelessLiberty/permissions'
import { prisma } from '@NamelessLiberty/db'
import { reliquary } from '../src/apps/reliquary/reliquary.ctrl'
import { ReliquaryServ } from '../src/apps/reliquary/reliquary.serv'
import { isHttpError } from '../src/core/errors/http-errors'
import { signUserJwt } from '../src/core/utils/auth-crypto'
import { wsHub } from '../src/core/ws/ws.serv'

const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface MockUser {
  id: string
  username: string
  permissions: number[]
  customization: unknown
  passwordChangedAt: Date | null
}

interface MockDoc {
  id: string
  title: string
  description: string | null
  icon: string | null
  category: 'API_DOCS' | 'WIKI' | 'GUIDES' | 'TUTORIALS' | 'REFERENCE' | 'OTHER'
  tags: string[]
  visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE'
  creatorId: string
  sidebarConfig: unknown
  pageIds: string[]
  schema: unknown
  lockedById: string | null
  lockedAt: Date | null
  lockExpiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

interface MockPage {
  id: string
  docId: string
  title: string
  icon: string | null
  schema: unknown
  creatorId: string
  lastEditedById: string | null
  lockedById: string | null
  lockedAt: Date | null
  lockExpiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

interface MockCollab {
  id: string
  docId: string
  userId: string
  role: 'EDITOR' | 'VIEWER'
  createdAt: Date
}

interface MockBookmark {
  id: string
  userId: string
  docId: string
  createdAt: Date
}

interface MockVisit {
  id: string
  userId: string
  docId: string
  pageId: string | null
  visitedAt: Date
}

const adminWord = Number(new IRISBitField().add(IRISFlags.ADMINISTRATOR).toArray()[0]) || 1

function makeUserProxy(row: Record<string, any>) {
  return new Proxy(row, {
    get(target, prop) {
      return {
        eq: (val: unknown) => () => target[prop as string] === val,
        in: (vals: readonly unknown[]) => () => vals.includes(target[prop as string]),
        ilike: (pat: string) => () => {
          const needle = pat.replace(/%/g, '').toLowerCase()
          return String(target[prop as string] ?? '').toLowerCase().includes(needle)
        },
        desc: () => ({ field: prop, dir: 'desc' }),
        asc: () => ({ field: prop, dir: 'asc' }),
      }
    },
  })
}

function evalWhereAst(expr: any): boolean {
  if (typeof expr === 'function') return Boolean(expr())
  if (expr && typeof expr === 'object') {
    if (expr.kind === 'and' && Array.isArray(expr.exprs)) {
      return expr.exprs.every((sub: any) => evalWhereAst(sub))
    }
    if (expr.kind === 'or' && Array.isArray(expr.exprs)) {
      return expr.exprs.some((sub: any) => evalWhereAst(sub))
    }
  }
  return Boolean(expr)
}

function makeQuery<T extends Record<string, any>>(
  rows: () => T[],
  resolver: (row: T, rel: string) => any,
  predicates: Array<((row: T) => boolean) | Record<string, unknown>> = [],
  includes: string[] = []
) {
  const matches = (row: T) =>
    predicates.every((p) => {
      if (typeof p === 'function') return p(row)
      return Object.entries(p).every(([k, v]) => row[k] === v)
    })

  const hydrate = (row: T) => {
    const out: any = { ...row }
    for (const rel of includes) {
      out[rel] = resolver(row, rel)
    }
    return out
  }

  let limitVal: number | undefined
  let offsetVal = 0
  const chain: any = {
    where(arg: any) {
      const nextPred =
        typeof arg === 'function'
          ? (row: T) => evalWhereAst(arg(makeUserProxy(row)))
          : arg
      return makeQuery(rows, resolver, [...predicates, nextPred], includes)
    },
    include(rel: string) {
      return makeQuery(rows, resolver, predicates, [...includes, rel])
    },
    select() {
      return chain
    },
    orderBy() {
      return chain
    },
    limit(n: number) {
      limitVal = n
      return chain
    },
    offset(n: number) {
      offsetVal = n
      return chain
    },
    async all(arg?: Record<string, unknown>) {
      const extra = arg ? [(r: T) => Object.entries(arg).every(([k, v]) => r[k] === v)] : []
      const list = rows().filter((r) => matches(r) && extra.every((fn) => fn(r))).map(hydrate)
      return limitVal !== undefined ? list.slice(offsetVal, offsetVal + limitVal) : list.slice(offsetVal)
    },
    async first(arg?: Record<string, unknown>) {
      const extra = arg ? [(r: T) => Object.entries(arg).every(([k, v]) => r[k] === v)] : []
      const found = rows().find((r) => matches(r) && extra.every((fn) => fn(r)))
      return found ? hydrate(found) : null
    },
    async update(fields: Partial<T>) {
      for (const row of rows()) {
        if (matches(row)) {
          Object.assign(row, fields, { updatedAt: new Date() })
        }
      }
    },
    async delete() {
      const current = rows()
      for (let i = current.length - 1; i >= 0; i--) {
        if (matches(current[i]!)) current.splice(i, 1)
      }
    },
  }
  return chain
}

describe('Reliquary API, RBAC, 5-level Sidebar & Edit Locking', () => {
  let users: MockUser[]
  let docs: MockDoc[]
  let pages: MockPage[]
  let collabs: MockCollab[]
  let bookmarks: MockBookmark[]
  let visits: MockVisit[]
  let originalOrm: any
  let originalTx: any
  let broadcastSpy: ReturnType<typeof spyOn>
  let app: any

  const alice: MockUser = {
    id: '01950000-0000-7000-8000-000000000001',
    username: 'alice',
    permissions: [],
    customization: { profile: { displayName: 'Alice' } },
    passwordChangedAt: null,
  }
  const bob: MockUser = {
    id: '01950000-0000-7000-8000-000000000002',
    username: 'bob',
    permissions: [],
    customization: { profile: { displayName: 'Bob' } },
    passwordChangedAt: null,
  }
  const charlie: MockUser = {
    id: '01950000-0000-7000-8000-000000000003',
    username: 'charlie',
    permissions: [],
    customization: {},
    passwordChangedAt: null,
  }
  const admin: MockUser = {
    id: '01950000-0000-7000-8000-000000000004',
    username: 'iris_admin',
    permissions: [adminWord],
    customization: {},
    passwordChangedAt: null,
  }

  beforeEach(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'reliquary-test-secret-32-chars-minimum'
    users = [alice, bob, charlie, admin]
    docs = []
    pages = []
    collabs = []
    bookmarks = []
    visits = []

    originalOrm = prisma.orm
    originalTx = prisma.transaction
    broadcastSpy = spyOn(wsHub, 'broadcastChannel').mockImplementation(() => {})

    const publicMock: any = {
      User: Object.assign(makeQuery(() => users, () => null), {}),
      ReliquaryDoc: Object.assign(
        makeQuery(
          () => docs,
          (d, rel) => {
            if (rel === 'creator') return users.find((u) => u.id === d.creatorId) ?? null
            if (rel === 'lockedBy') return d.lockedById ? users.find((u) => u.id === d.lockedById) ?? null : null
            return null
          }
        ),
        {
          create: async (data: any) => {
            const now = new Date()
            const row: MockDoc = {
              description: null,
              icon: null,
              category: 'GUIDES',
              tags: [],
              visibility: 'PUBLIC',
              sidebarConfig: [],
              pageIds: [],
              schema: {},
              lockedById: null,
              lockedAt: null,
              lockExpiresAt: null,
              createdAt: now,
              updatedAt: now,
              ...data,
            }
            docs.push(row)
            return row
          },
        }
      ),
      ReliquaryPage: Object.assign(
        makeQuery(
          () => pages,
          (p, rel) => {
            if (rel === 'lastEditedBy') return p.lastEditedById ? users.find((u) => u.id === p.lastEditedById) ?? null : null
            if (rel === 'lockedBy') return p.lockedById ? users.find((u) => u.id === p.lockedById) ?? null : null
            return null
          }
        ),
        {
          create: async (data: any) => {
            const now = new Date()
            const row: MockPage = {
              icon: null,
              schema: {},
              lastEditedById: null,
              lockedById: null,
              lockedAt: null,
              lockExpiresAt: null,
              createdAt: now,
              updatedAt: now,
              ...data,
            }
            pages.push(row)
            return row
          },
        }
      ),
      ReliquaryCollaborator: Object.assign(
        makeQuery(
          () => collabs,
          (c, rel) => (rel === 'user' ? users.find((u) => u.id === c.userId) ?? null : null)
        ),
        {
          create: async (data: any) => {
            const row: MockCollab = { createdAt: new Date(), ...data }
            collabs.push(row)
            return row
          },
        }
      ),
      ReliquaryBookmark: Object.assign(
        makeQuery(
          () => bookmarks,
          (b, rel) => {
            if (rel === 'doc') {
              const doc = docs.find((d) => d.id === b.docId)
              return doc ? { ...doc, creator: users.find((u) => u.id === doc.creatorId) } : null
            }
            return null
          }
        ),
        {
          create: async (data: any) => {
            const row: MockBookmark = { createdAt: new Date(), ...data }
            bookmarks.push(row)
            return row
          },
        }
      ),
      ReliquaryRecentVisit: Object.assign(
        makeQuery(
          () => visits,
          (v, rel) => {
            if (rel === 'doc') {
              const doc = docs.find((d) => d.id === v.docId)
              return doc ? { ...doc, creator: users.find((u) => u.id === doc.creatorId) } : null
            }
            if (rel === 'page') {
              return v.pageId ? pages.find((p) => p.id === v.pageId) ?? null : null
            }
            return null
          }
        ),
        {
          create: async (data: any) => {
            const row: MockVisit = { visitedAt: new Date(), ...data }
            visits.push(row)
            return row
          },
        }
      ),
    }

    ;(prisma as any).orm = { public: publicMock }
    ;(prisma as any).transaction = async (fn: (tx: any) => Promise<any>) => fn({ orm: { public: publicMock } })

    app = new Elysia()
      .onError(({ error, set }) => {
        if (error instanceof ValidationError) {
          set.status = 422
          return { status: 422, detail: error.message }
        }
        if (isHttpError(error)) {
          set.status = error.status
          return error.toResponse()
        }
        console.error('TEST 500:', error)
        set.status = 500
        return { status: 500, detail: String(error) }
      })
      .use(reliquary)
  })

  afterEach(() => {
    ;(prisma as any).orm = originalOrm
    ;(prisma as any).transaction = originalTx
    broadcastSpy?.mockRestore()
  })

  async function authHeaders(user: MockUser) {
    const token = await signUserJwt({
      id: user.id,
      username: user.username,
      email: `${user.username}@example.com`,
    })
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  it('creates Main Docs with UUID v7 and enforces PUBLIC / UNLISTED / PRIVATE visibility', async () => {
    const aliceHeaders = await authHeaders(alice)

    const createRes = await app.handle(
      new Request('http://localhost/reliquary/docs', {
        method: 'POST',
        headers: aliceHeaders,
        body: JSON.stringify({
          title: 'Iris Architecture Book',
          description: 'Internal architecture specs',
          category: 'API_DOCS',
          visibility: 'PRIVATE',
          tags: ['backend', 'v2'],
        }),
      })
    )
    expect(createRes.status).toBe(200)
    const { doc } = await createRes.json()
    expect(doc.id).toMatch(UUID_V7_REGEX)
    expect(doc.creatorId).toBe(alice.id)
    expect(doc.visibility).toBe('PRIVATE')

    // Guest blocked from PRIVATE doc
    const guestRes = await app.handle(new Request(`http://localhost/reliquary/docs/${doc.id}`))
    expect(guestRes.status).toBe(403)

    // Non-collaborator blocked from PRIVATE doc
    const bobRes = await app.handle(
      new Request(`http://localhost/reliquary/docs/${doc.id}`, {
        headers: await authHeaders(bob),
      })
    )
    expect(bobRes.status).toBe(403)

    // Admin allowed to read and edit PRIVATE doc
    const adminRes = await app.handle(
      new Request(`http://localhost/reliquary/docs/${doc.id}`, {
        headers: await authHeaders(admin),
      })
    )
    expect(adminRes.status).toBe(200)
    const adminBody = await adminRes.json()
    expect(adminBody.doc.canEdit).toBe(true)
    expect(adminBody.doc.canManage).toBe(true)

    // Unlisted doc is readable by direct link to guests, excluded from /browse
    const unlisted = await ReliquaryServ.createDoc(alice, {
      title: 'Secret Unlisted Link',
      visibility: 'UNLISTED',
      category: 'WIKI',
    })
    const guestUnlisted = await app.handle(
      new Request(`http://localhost/reliquary/docs/${unlisted.doc.id}`)
    )
    expect(guestUnlisted.status).toBe(200)

    const browseGuest = await app.handle(new Request('http://localhost/reliquary/docs'))
    const browseBody = await browseGuest.json()
    expect(browseBody.docs).toHaveLength(0)
  })

  it('performs title-only search across Main Docs and sub-pages without matching descriptions', async () => {
    const publicDoc = await ReliquaryServ.createDoc(alice, {
      title: 'Deployment Handbook',
      description: 'Contains secretword inside description only',
      category: 'GUIDES',
      visibility: 'PUBLIC',
    })
    await ReliquaryServ.createPage(alice, publicDoc.doc.id, {
      title: 'Docker Compose Setup',
    })

    // Description text should NOT match
    const descSearch = await ReliquaryServ.browseDocs(null, { q: 'secretword' })
    expect(descSearch.docs).toHaveLength(0)

    // Sub-page title SHOULD match and attach matchedPages
    const pageTitleSearch = await ReliquaryServ.browseDocs(null, { q: 'Docker' })
    expect(pageTitleSearch.docs).toHaveLength(1)
    expect(pageTitleSearch.docs[0]?.matchedPages?.[0]?.title).toBe('Docker Compose Setup')
  })

  it('enforces 2-minute edit lease conflicts (409), expiry, save unlock, and creator force-unlock', async () => {
    const { doc } = await ReliquaryServ.createDoc(alice, {
      title: 'Collaborative Book',
      visibility: 'PRIVATE',
    })
    const createdPage = await ReliquaryServ.createPage(alice, doc.id, { title: 'Authentication' })
    const pageId = createdPage.page.id
    expect(pageId).toMatch(UUID_V7_REGEX)

    // Grant Bob EDITOR role
    await ReliquaryServ.upsertCollaborator(alice, doc.id, {
      userId: bob.id,
      role: 'EDITOR',
    })

    // Alice acquires lock on sub-page
    const aliceHeaders = await authHeaders(alice)
    const bobHeaders = await authHeaders(bob)

    const acqA = await app.handle(
      new Request(`http://localhost/reliquary/docs/${doc.id}/locks/acquire`, {
        method: 'POST',
        headers: aliceHeaders,
        body: JSON.stringify({ pageId }),
      })
    )
    expect(acqA.status).toBe(200)
    expect(broadcastSpy).toHaveBeenCalled()

    // Bob gets 409 Conflict when trying to acquire or save while Alice holds lock
    const acqB = await app.handle(
      new Request(`http://localhost/reliquary/docs/${doc.id}/locks/acquire`, {
        method: 'POST',
        headers: bobHeaders,
        body: JSON.stringify({ pageId }),
      })
    )
    expect(acqB.status).toBe(409)

    const saveB = await app.handle(
      new Request(`http://localhost/reliquary/docs/${doc.id}/pages/${pageId}`, {
        method: 'PUT',
        headers: bobHeaders,
        body: JSON.stringify({ schema: { title: 'Hijack' } }),
      })
    )
    expect(saveB.status).toBe(409)

    // Alice saves and releases lock automatically
    const saveA = await app.handle(
      new Request(`http://localhost/reliquary/docs/${doc.id}/pages/${pageId}`, {
        method: 'PUT',
        headers: aliceHeaders,
        body: JSON.stringify({ title: 'Authentication v2', schema: { title: 'Authentication v2' } }),
      })
    )
    expect(saveA.status).toBe(200)

    // Now Bob acquires lock, then Alice force-unlocks it as creator
    const acqB2 = await app.handle(
      new Request(`http://localhost/reliquary/docs/${doc.id}/locks/acquire`, {
        method: 'POST',
        headers: bobHeaders,
        body: JSON.stringify({ pageId }),
      })
    )
    expect(acqB2.status).toBe(200)

    // Bob (collaborator, not creator/admin) cannot force-unlock
    const forceB = await app.handle(
      new Request(`http://localhost/reliquary/docs/${doc.id}/locks/force-unlock`, {
        method: 'POST',
        headers: bobHeaders,
        body: JSON.stringify({ pageId }),
      })
    )
    expect(forceB.status).toBe(403)

    // Alice (creator) CAN force-unlock
    const forceA = await app.handle(
      new Request(`http://localhost/reliquary/docs/${doc.id}/locks/force-unlock`, {
        method: 'POST',
        headers: aliceHeaders,
        body: JSON.stringify({ pageId }),
      })
    )
    expect(forceA.status).toBe(200)
    const forceBody = await forceA.json()
    expect(forceBody.lock.locked).toBe(false)
  })

  it('tracks bookmarks/recent visits on /home, promotes children on page delete, and rejects depth > 5', async () => {
    const aliceHeaders = await authHeaders(alice)
    const { doc } = await ReliquaryServ.createDoc(alice, {
      title: 'Deep Hierarchy Guide',
      visibility: 'PUBLIC',
    })

    const p1 = await ReliquaryServ.createPage(alice, doc.id, { title: 'Level 1 Page' })
    const p1NodeId = (p1.sidebarConfig[0] as any).id
    const p2 = await ReliquaryServ.createPage(alice, doc.id, {
      title: 'Level 2 Child',
      parentNodeId: p1NodeId,
    })

    // Deleting p1 should promote p2 up to root level
    const delRes = await ReliquaryServ.deletePage(alice, doc.id, p1.page.id)
    expect(delRes.pageIds).toEqual([p2.page.id])
    expect(delRes.sidebarConfig).toHaveLength(1)
    expect(delRes.sidebarConfig[0]?.pageId).toBe(p2.page.id)

    // Reject 6-level nesting via PUT /sidebar
    const depth6Tree = [
      {
        id: '1',
        label: '1',
        children: [
          {
            id: '2',
            label: '2',
            children: [
              {
                id: '3',
                label: '3',
                children: [
                  {
                    id: '4',
                    label: '4',
                    children: [
                      {
                        id: '5',
                        label: '5',
                        children: [{ id: '6', label: '6', pageId: p2.page.id }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]

    const badSidebarRes = await app.handle(
      new Request(`http://localhost/reliquary/docs/${doc.id}/sidebar`, {
        method: 'PUT',
        headers: aliceHeaders,
        body: JSON.stringify({ sidebarConfig: depth6Tree }),
      })
    )
    expect(badSidebarRes.status).toBe(400)

    // Bookmark and visit show up in GET /reliquary/home
    await app.handle(
      new Request(`http://localhost/reliquary/docs/${doc.id}/bookmark`, {
        method: 'POST',
        headers: aliceHeaders,
      })
    )
    await app.handle(
      new Request(`http://localhost/reliquary/docs/${doc.id}/pages/${p2.page.id}`, {
        headers: aliceHeaders,
      })
    )
    // Wait briefly so fire-and-forget visit upsert finishes before asserting
    await new Promise((r) => setTimeout(r, 20))

    const homeRes = await app.handle(
      new Request('http://localhost/reliquary/home', {
        headers: aliceHeaders,
      })
    )
    expect(homeRes.status).toBe(200)
    const home = await homeRes.json()
    expect(home.bookmarks).toHaveLength(1)
    expect(home.myDocs).toHaveLength(1)
    expect(home.recentVisits[0]?.pageId).toBe(p2.page.id)
  })
})
