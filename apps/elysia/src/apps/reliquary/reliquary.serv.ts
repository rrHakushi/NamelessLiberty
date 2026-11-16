import {
  and,
  or,
  prisma,
  toDate,
  type CollaboratorRole,
  type ReliquaryCategory,
  type ReliquaryVisibility,
} from '@NamelessLiberty/db'
import {
  appendPageToSidebarTree,
  extractPageIdsFromSidebarTree,
  getProfileCustomization,
  RELIQUARY_LOCK_TTL_MS,
  removePageFromSidebarTree,
  updateNodeInSidebarTree,
  validateSidebarTreeDepth,
  type ReliquarySidebarNode,
} from '@NamelessLiberty/shared'
import { BaseService } from '../../core/base/base.serv'
import { BadRequest, Conflict, Forbidden, NotFound } from '../../core/errors/http-errors'
import { wsHub } from '../../core/ws/ws.serv'
import type { ReliquaryModel } from './reliquary.model'

export interface ReliquarySessionUser {
  id: string
  username?: string
  permissions?: number[] | null
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}

function normalizeTags(tags?: readonly string[]): string[] {
  if (!tags || tags.length === 0) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of tags) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(trimmed)
  }
  return result
}

function formatUserPreview(user: {
  id: string
  username: string
  customization?: unknown
}) {
  const profile = getProfileCustomization(user.customization)
  return {
    id: user.id,
    username: user.username,
    displayName: profile.displayName || null,
    avatarUrl: profile.avatarUrl || null,
  }
}

function parseSidebarConfig(raw: unknown): ReliquarySidebarNode[] {
  return Array.isArray(raw) ? (raw as ReliquarySidebarNode[]) : []
}

function buildStarterDocSchema(title: string, description?: string | null): Record<string, unknown> {
  const headerChildren: Record<string, unknown>[] = [
    {
      type: 'h1',
      props: { className: 'text-3xl font-bold tracking-tight' },
      text: title,
    },
  ]

  if (description) {
    headerChildren.push({
      type: 'p',
      props: { className: 'text-muted-foreground text-sm leading-relaxed' },
      text: description,
    })
  }

  return {
    title,
    ...(description ? { description } : {}),
    root: {
      type: 'div',
      props: { className: 'max-w-4xl mx-auto p-6 md:p-10 space-y-6' },
      children: [
        {
          type: 'div',
          props: { className: 'space-y-2 border-b border-border/60 pb-5' },
          children: headerChildren,
        },
        {
          type: 'Callout',
          props: {
            variant: 'info',
            title: 'Book Overview',
          },
          text: 'Edit this landing page with the Document Editor or add structured sub-pages from the sidebar.',
        },
      ],
    },
  }
}

function buildStarterPageSchema(title: string): Record<string, unknown> {
  return {
    title,
    root: {
      type: 'div',
      props: { className: 'max-w-4xl mx-auto p-6 md:p-10 space-y-6' },
      children: [
        {
          type: 'h1',
          props: { className: 'text-3xl font-bold tracking-tight border-b border-border/60 pb-4' },
          text: title,
        },
        {
          type: 'p',
          props: { className: 'text-muted-foreground leading-relaxed' },
          text: 'Start writing documentation content for this page.',
        },
      ],
    },
  }
}

interface LockableRecord {
  id: string
  lockedById: string | null
  lockedBy?: { id: string; username: string; customization?: unknown } | null
  lockedAt: unknown
  lockExpiresAt: unknown
}

function isLockActive(record: LockableRecord, nowMs = Date.now()): boolean {
  if (!record.lockedById || !record.lockExpiresAt) return false
  return toDate(record.lockExpiresAt).getTime() > nowMs
}

function buildLockStatus(record: LockableRecord, currentUserId?: string) {
  const active = isLockActive(record)
  if (!active || !record.lockedById) {
    return {
      locked: false,
      lockedBy: null,
      lockedAt: null,
      lockExpiresAt: null,
      isOwnedByCurrentUser: false,
    }
  }

  return {
    locked: true,
    lockedBy: record.lockedBy ? formatUserPreview(record.lockedBy) : null,
    lockedAt: record.lockedAt ? toDate(record.lockedAt).toISOString() : null,
    lockExpiresAt: record.lockExpiresAt ? toDate(record.lockExpiresAt).toISOString() : null,
    isOwnedByCurrentUser: Boolean(currentUserId && record.lockedById === currentUserId),
  }
}

function assertNotLockedByOther(record: LockableRecord, callerId: string): void {
  if (!isLockActive(record) || record.lockedById === callerId) return
  const holder = record.lockedBy?.username ? `@${record.lockedBy.username}` : 'another editor'
  const until = record.lockExpiresAt ? toDate(record.lockExpiresAt).toISOString() : 'soon'
  throw new Conflict(`Currently locked for editing by ${holder} (expires ${until}).`)
}

export class ReliquaryServ extends BaseService {
  private static readonly _instance = new ReliquaryServ()

  constructor() {
    super('Reliquary')
  }

  private static docChannel(docId: string): string {
    return `reliquary-doc-${docId}`
  }

  private static async loadDocWithAccess(docId: string, user: ReliquarySessionUser | null) {
    const doc = await prisma.orm.public.ReliquaryDoc.where({ id: docId })
      .include('creator')
      .include('lockedBy')
      .first()

    if (!doc) {
      throw new NotFound('Reliquary document not found')
    }

    const admin = user ? this._instance.isAdmin(user.permissions) : false
    const collab = user
      ? await prisma.orm.public.ReliquaryCollaborator.where({ docId, userId: user.id }).first()
      : null

    const canView =
      doc.visibility === 'PUBLIC' ||
      doc.visibility === 'UNLISTED' ||
      (Boolean(user) && (doc.creatorId === user!.id || admin || Boolean(collab)))

    if (!canView) {
      throw new Forbidden('You do not have permission to view this document')
    }

    const canManage = Boolean(user && (doc.creatorId === user.id || admin))
    const canEdit = Boolean(
      user && (doc.creatorId === user.id || admin || collab?.role === 'EDITOR')
    )

    return { doc, collab, admin, canManage, canEdit }
  }

  private static formatDocSummary(
    doc: {
      id: string
      title: string
      description: string | null
      icon: string | null
      category: ReliquaryCategory
      tags: readonly string[]
      visibility: ReliquaryVisibility
      creatorId: string
      creator: { id: string; username: string; customization?: unknown }
      pageIds: readonly string[]
      createdAt: unknown
      updatedAt: unknown
    },
    opts: {
      bookmarkedIds: Set<string>
      collabRoles: Map<string, CollaboratorRole>
      currentUserId?: string
      matchedPages?: Array<{ id: string; title: string; icon: string | null }>
    }
  ) {
    const userRole =
      opts.currentUserId && doc.creatorId === opts.currentUserId
        ? 'CREATOR'
        : (opts.collabRoles.get(doc.id) ?? null)

    return {
      id: doc.id,
      title: doc.title,
      description: doc.description ?? null,
      icon: doc.icon ?? null,
      category: doc.category,
      tags: [...doc.tags],
      visibility: doc.visibility,
      creatorId: doc.creatorId,
      creator: formatUserPreview(doc.creator),
      pageCount: doc.pageIds.length,
      isBookmarked: opts.bookmarkedIds.has(doc.id),
      userRole,
      ...(opts.matchedPages ? { matchedPages: opts.matchedPages } : {}),
      createdAt: toDate(doc.createdAt).toISOString(),
      updatedAt: toDate(doc.updatedAt).toISOString(),
    }
  }

  private static async loadUserDocMaps(userId?: string) {
    if (!userId) {
      return {
        bookmarkedIds: new Set<string>(),
        collabRoles: new Map<string, CollaboratorRole>(),
      }
    }

    const [bookmarks, collabs] = await Promise.all([
      prisma.orm.public.ReliquaryBookmark.where({ userId }).all(),
      prisma.orm.public.ReliquaryCollaborator.where({ userId }).all(),
    ])

    return {
      bookmarkedIds: new Set(bookmarks.map((b) => b.docId)),
      collabRoles: new Map(collabs.map((c) => [c.docId, c.role])),
    }
  }

  private static async recordRecentVisit(
    userId: string,
    docId: string,
    pageId?: string | null
  ): Promise<void> {
    const existing = await prisma.orm.public.ReliquaryRecentVisit.where({
      userId,
      docId,
    }).first()

    if (existing) {
      await prisma.orm.public.ReliquaryRecentVisit.where({ id: existing.id }).update({
        pageId: pageId ?? null,
        visitedAt: new Date(),
      })
      return
    }

    await prisma.orm.public.ReliquaryRecentVisit.create({
      id: Bun.randomUUIDv7(),
      userId,
      docId,
      pageId: pageId ?? null,
      visitedAt: new Date(),
    })
  }

  private static formatPageDetail(
    page: {
      id: string
      docId: string
      title: string
      icon: string | null
      schema: unknown
      creatorId: string
      lastEditedBy?: { id: string; username: string; customization?: unknown } | null
      lockedById: string | null
      lockedBy?: { id: string; username: string; customization?: unknown } | null
      lockedAt: unknown
      lockExpiresAt: unknown
      createdAt: unknown
      updatedAt: unknown
    },
    access: { canEdit: boolean; canManage: boolean },
    currentUserId?: string
  ) {
    return {
      id: page.id,
      docId: page.docId,
      title: page.title,
      icon: page.icon ?? null,
      schema: page.schema,
      creatorId: page.creatorId,
      lastEditedBy: page.lastEditedBy ? formatUserPreview(page.lastEditedBy) : null,
      lock: buildLockStatus(page, currentUserId),
      canEdit: access.canEdit,
      canManage: access.canManage,
      createdAt: toDate(page.createdAt).toISOString(),
      updatedAt: toDate(page.updatedAt).toISOString(),
    }
  }

  /**
   * Home summary: recently visited docs/pages, bookmarks, and created/collaborated docs.
   */
  public static async getHome(user: ReliquarySessionUser) {
    const admin = this._instance.isAdmin(user.permissions)
    const { bookmarkedIds, collabRoles } = await this.loadUserDocMaps(user.id)
    const collabDocIds = Array.from(collabRoles.keys())

    const [recentRaw, bookmarkRaw, myDocsRaw] = await Promise.all([
      prisma.orm.public.ReliquaryRecentVisit.where({ userId: user.id })
        .include('doc', (q) => q.include('creator'))
        .include('page')
        .orderBy((v) => v.visitedAt.desc())
        .limit(24)
        .all(),
      prisma.orm.public.ReliquaryBookmark.where({ userId: user.id })
        .include('doc', (q) => q.include('creator'))
        .orderBy((b) => b.createdAt.desc())
        .limit(24)
        .all(),
      prisma.orm.public.ReliquaryDoc.where((d) =>
        collabDocIds.length > 0 ? or(d.creatorId.eq(user.id), d.id.in(collabDocIds)) : d.creatorId.eq(user.id)
      )
        .include('creator')
        .orderBy((d) => d.updatedAt.desc())
        .limit(48)
        .all(),
    ])

    const canStillView = (doc: { visibility: ReliquaryVisibility; creatorId: string; id: string }) =>
      doc.visibility !== 'PRIVATE' ||
      admin ||
      doc.creatorId === user.id ||
      collabRoles.has(doc.id)

    const summaryOpts = { bookmarkedIds, collabRoles, currentUserId: user.id }

    const recentVisits = recentRaw
      .filter((v) => v.doc !== null && canStillView(v.doc))
      .slice(0, 12)
      .map((v) => ({
        id: v.id,
        docId: v.docId,
        pageId: v.pageId ?? null,
        pageTitle: v.page?.title ?? null,
        visitedAt: toDate(v.visitedAt).toISOString(),
        doc: this.formatDocSummary(v.doc!, summaryOpts),
      }))

    const bookmarks = bookmarkRaw
      .filter((b) => b.doc !== null && canStillView(b.doc))
      .map((b) => this.formatDocSummary(b.doc!, summaryOpts))

    const myDocs = myDocsRaw.map((d) => this.formatDocSummary(d, summaryOpts))

    return { recentVisits, bookmarks, myDocs }
  }

  /**
   * Browse PUBLIC + authorized PRIVATE docs (UNLISTED excluded), with title-only search.
   */
  public static async browseDocs(
    user: ReliquarySessionUser | null,
    query: ReliquaryModel['browseDocsQuery']
  ) {
    const { page, limit, skip } = this._instance.clampPagination(query.page, query.limit, 24, 100)
    const search = query.q?.trim() ?? ''
    const tagFilter = query.tag?.trim().toLowerCase() ?? ''

    const admin = user ? this._instance.isAdmin(user.permissions) : false
    const { bookmarkedIds, collabRoles } = await this.loadUserDocMaps(user?.id)
    const collabDocIds = Array.from(collabRoles.keys())

    const accessibleQuery = prisma.orm.public.ReliquaryDoc.where((d) => {
      const visibilityFilter = !user
        ? d.visibility.eq('PUBLIC')
        : admin
          ? or(d.visibility.eq('PUBLIC'), d.visibility.eq('PRIVATE'))
          : collabDocIds.length > 0
            ? or(
                d.visibility.eq('PUBLIC'),
                and(d.visibility.eq('PRIVATE'), or(d.creatorId.eq(user.id), d.id.in(collabDocIds)))
              )
            : or(
                d.visibility.eq('PUBLIC'),
                and(d.visibility.eq('PRIVATE'), d.creatorId.eq(user.id))
              )

      return query.category
        ? and(visibilityFilter, d.category.eq(query.category))
        : visibilityFilter
    })

    const allAccessibleDocs = await accessibleQuery
      .include('creator')
      .orderBy((d) => d.updatedAt.desc())
      .all()

    const tagSet = new Set<string>()
    for (const d of allAccessibleDocs) {
      for (const t of d.tags) {
        tagSet.add(t)
      }
    }

    const matchedPagesByDoc = new Map<string, Array<{ id: string; title: string; icon: string | null }>>()
    const searchLower = search.toLowerCase()

    if (search && allAccessibleDocs.length > 0) {
      const accessibleDocIds = allAccessibleDocs.map((d) => d.id)
      const escaped = escapeLikePattern(search)
      const matchingPages = await prisma.orm.public.ReliquaryPage.where((p) =>
        and(p.docId.in(accessibleDocIds), p.title.ilike(`%${escaped}%`))
      )
        .orderBy((p) => p.updatedAt.desc())
        .all()

      for (const p of matchingPages) {
        const list = matchedPagesByDoc.get(p.docId) ?? []
        if (list.length < 5) {
          list.push({ id: p.id, title: p.title, icon: p.icon ?? null })
        }
        matchedPagesByDoc.set(p.docId, list)
      }
    }

    const filteredDocs = allAccessibleDocs.filter((doc) => {
      if (tagFilter && !doc.tags.some((t) => t.toLowerCase() === tagFilter)) {
        return false
      }
      if (!searchLower) return true
      const docTitleMatches = doc.title.toLowerCase().includes(searchLower)
      const hasMatchingSubPage = matchedPagesByDoc.has(doc.id)
      return docTitleMatches || hasMatchingSubPage
    })

    const total = filteredDocs.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const pagedDocs = filteredDocs.slice(skip, skip + limit)

    return {
      docs: pagedDocs.map((d) =>
        this.formatDocSummary(d, {
          bookmarkedIds,
          collabRoles,
          currentUserId: user?.id,
          matchedPages: search ? (matchedPagesByDoc.get(d.id) ?? []) : undefined,
        })
      ),
      availableTags: Array.from(tagSet).sort((a, b) => a.localeCompare(b)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    }
  }

  /**
   * Create a new Main Doc (UUID v7).
   */
  public static async createDoc(
    user: ReliquarySessionUser,
    body: ReliquaryModel['createDocBody']
  ) {
    const title = body.title.trim()
    if (!title) throw new BadRequest('Document title is required')

    const id = Bun.randomUUIDv7()
    const description = body.description?.trim() || null
    const icon = body.icon?.trim() || null
    const category = body.category ?? 'GUIDES'
    const visibility = body.visibility ?? 'PUBLIC'
    const tags = normalizeTags(body.tags)

    await prisma.orm.public.ReliquaryDoc.create({
      id,
      title,
      description,
      icon,
      category,
      tags,
      visibility,
      creatorId: user.id,
      sidebarConfig: [],
      pageIds: [],
      schema: buildStarterDocSchema(title, description) as any,
    })

    return await this.getDoc(user, id, { skipVisitTracking: true })
  }

  /**
   * Get Main Doc details, sidebarConfig, permissions, and lock status.
   */
  public static async getDoc(
    user: ReliquarySessionUser | null,
    docId: string,
    opts?: { skipVisitTracking?: boolean }
  ) {
    const { doc, canEdit, canManage } = await this.loadDocWithAccess(docId, user)

    if (user && !opts?.skipVisitTracking) {
      this.recordRecentVisit(user.id, doc.id, null).catch((err) => {
        this._instance['logger'].warn(`Failed to record visit for doc ${doc.id}: ${err}`)
      })
    }

    const [bookmark, collaboratorsRaw] = await Promise.all([
      user
        ? prisma.orm.public.ReliquaryBookmark.where({ userId: user.id, docId: doc.id }).first()
        : Promise.resolve(null),
      canManage
        ? prisma.orm.public.ReliquaryCollaborator.where({ docId: doc.id })
            .include('user')
            .orderBy((c) => c.createdAt.asc())
            .all()
        : Promise.resolve(undefined),
    ])

    return {
      doc: {
        id: doc.id,
        title: doc.title,
        description: doc.description ?? null,
        icon: doc.icon ?? null,
        category: doc.category,
        tags: [...doc.tags],
        visibility: doc.visibility,
        creatorId: doc.creatorId,
        creator: formatUserPreview(doc.creator),
        sidebarConfig: parseSidebarConfig(doc.sidebarConfig),
        pageIds: [...doc.pageIds],
        schema: doc.schema,
        lock: buildLockStatus(doc, user?.id),
        isBookmarked: Boolean(bookmark),
        canEdit,
        canManage,
        ...(collaboratorsRaw
          ? {
              collaborators: collaboratorsRaw.map((c) => ({
                id: c.id,
                userId: c.userId,
                role: c.role,
                createdAt: toDate(c.createdAt).toISOString(),
                user: formatUserPreview(c.user),
              })),
            }
          : {}),
        createdAt: toDate(doc.createdAt).toISOString(),
        updatedAt: toDate(doc.updatedAt).toISOString(),
      },
    }
  }

  /**
   * Update Main Doc metadata/visibility (Creator or ADMINISTRATOR only).
   */
  public static async updateDocMeta(
    user: ReliquarySessionUser,
    docId: string,
    body: ReliquaryModel['updateDocMetaBody']
  ) {
    const { doc, canManage } = await this.loadDocWithAccess(docId, user)
    if (!canManage) {
      throw new Forbidden('Only the document creator or an administrator can update document settings')
    }

    const nextTitle = body.title !== undefined ? body.title.trim() : doc.title
    if (!nextTitle) throw new BadRequest('Document title cannot be empty')

    await prisma.orm.public.ReliquaryDoc.where({ id: doc.id }).update({
      title: nextTitle,
      description: body.description !== undefined ? body.description?.trim() || null : doc.description,
      icon: body.icon !== undefined ? body.icon?.trim() || null : doc.icon,
      category: body.category ?? doc.category,
      tags: body.tags !== undefined ? normalizeTags(body.tags) : [...doc.tags],
      visibility: body.visibility ?? doc.visibility,
    })

    return await this.getDoc(user, doc.id, { skipVisitTracking: true })
  }

  /**
   * Update Main Doc landing IrisPage schema (enforces lock and optionally releases lock).
   */
  public static async updateDocSchema(
    user: ReliquarySessionUser,
    docId: string,
    body: ReliquaryModel['updateDocSchemaBody']
  ) {
    const { doc, canEdit } = await this.loadDocWithAccess(docId, user)
    if (!canEdit) {
      throw new Forbidden('You do not have permission to edit this document')
    }

    assertNotLockedByOther(doc, user.id)

    const shouldRelease = body.releaseLock !== false
    await prisma.orm.public.ReliquaryDoc.where({ id: doc.id }).update({
      schema: body.schema as any,
      ...(shouldRelease && doc.lockedById === user.id
        ? { lockedById: null, lockedAt: null, lockExpiresAt: null }
        : {}),
    })

    if (shouldRelease && doc.lockedById === user.id) {
      this.broadcastLockChange(doc.id, null, {
        locked: false,
        lockedBy: null,
        lockedAt: null,
        lockExpiresAt: null,
        isOwnedByCurrentUser: false,
      })
    }

    return await this.getDoc(user, doc.id, { skipVisitTracking: true })
  }

  /**
   * Update 5-level sidebarConfig tree and synchronize ordered pageIds.
   */
  public static async updateSidebar(
    user: ReliquarySessionUser,
    docId: string,
    body: ReliquaryModel['updateSidebarBody']
  ) {
    const { doc, canEdit } = await this.loadDocWithAccess(docId, user)
    if (!canEdit) {
      throw new Forbidden('You do not have permission to edit document structure')
    }

    assertNotLockedByOther(doc, user.id)

    const validation = validateSidebarTreeDepth(body.sidebarConfig)
    if (!validation.valid) {
      throw new BadRequest(validation.reason ?? 'Invalid sidebar structure')
    }

    const nextPageIds = extractPageIdsFromSidebarTree(body.sidebarConfig)
    if (nextPageIds.length > 0) {
      const existingPages = await prisma.orm.public.ReliquaryPage.where({ docId: doc.id }).all()
      const validIds = new Set(existingPages.map((p) => p.id))
      for (const pid of nextPageIds) {
        if (!validIds.has(pid)) {
          throw new BadRequest(`Page "${pid}" does not belong to this document`)
        }
      }
    }

    await prisma.orm.public.ReliquaryDoc.where({ id: doc.id }).update({
      sidebarConfig: body.sidebarConfig as any,
      pageIds: nextPageIds,
    })

    return await this.getDoc(user, doc.id, { skipVisitTracking: true })
  }

  /**
   * Delete a Main Doc permanently (Creator or ADMINISTRATOR only).
   */
  public static async deleteDoc(user: ReliquarySessionUser, docId: string) {
    const { doc, canManage } = await this.loadDocWithAccess(docId, user)
    if (!canManage) {
      throw new Forbidden('Only the document creator or an administrator can delete this document')
    }

    await prisma.orm.public.ReliquaryDoc.where({ id: doc.id }).delete()
    return { success: true, deletedId: doc.id }
  }

  /**
   * Create a sub-doc page (UUID v7) and insert it into sidebarConfig and pageIds.
   */
  public static async createPage(
    user: ReliquarySessionUser,
    docId: string,
    body: ReliquaryModel['createPageBody']
  ) {
    const { doc, canEdit, canManage } = await this.loadDocWithAccess(docId, user)
    if (!canEdit) {
      throw new Forbidden('You do not have permission to create pages in this document')
    }

    assertNotLockedByOther(doc, user.id)

    const title = body.title.trim()
    if (!title) throw new BadRequest('Page title is required')

    const pageId = Bun.randomUUIDv7()
    const nodeId = Bun.randomUUIDv7()
    const icon = body.icon?.trim() || null

    const currentSidebar = parseSidebarConfig(doc.sidebarConfig)
    const insertResult = appendPageToSidebarTree(
      currentSidebar,
      { id: nodeId, label: title, icon, pageId },
      body.parentNodeId ?? null
    )

    if (!insertResult.added) {
      throw new BadRequest(insertResult.reason ?? 'Could not insert page into sidebar')
    }

    const nextPageIds = extractPageIdsFromSidebarTree(insertResult.nodes)
    const createdPage = await prisma.transaction(async (tx) => {
      const pageRow = await tx.orm.public.ReliquaryPage.create({
        id: pageId,
        docId: doc.id,
        title,
        icon,
        schema: buildStarterPageSchema(title) as any,
        creatorId: user.id,
        lastEditedById: user.id,
      })

      await tx.orm.public.ReliquaryDoc.where({ id: doc.id }).update({
        sidebarConfig: insertResult.nodes as any,
        pageIds: nextPageIds,
      })

      return pageRow
    })

    return {
      page: this.formatPageDetail(createdPage, { canEdit, canManage }, user.id),
      sidebarConfig: insertResult.nodes,
      pageIds: nextPageIds,
    }
  }

  /**
   * Get sub-doc page content + parent doc navigation tree.
   */
  public static async getPage(
    user: ReliquarySessionUser | null,
    docId: string,
    pageId: string
  ) {
    const { doc, canEdit, canManage } = await this.loadDocWithAccess(docId, user)

    const page = await prisma.orm.public.ReliquaryPage.where({ id: pageId, docId: doc.id })
      .include('lastEditedBy')
      .include('lockedBy')
      .first()

    if (!page) {
      throw new NotFound('Reliquary page not found')
    }

    if (user) {
      this.recordRecentVisit(user.id, doc.id, page.id).catch((err) => {
        this._instance['logger'].warn(`Failed to record visit for page ${page.id}: ${err}`)
      })
    }

    return {
      page: this.formatPageDetail(page, { canEdit, canManage }, user?.id),
      doc: {
        id: doc.id,
        title: doc.title,
        sidebarConfig: parseSidebarConfig(doc.sidebarConfig),
      },
    }
  }

  /**
   * Update sub-doc page title, icon, and/or IrisPage schema (syncs sidebar node title/icon too).
   */
  public static async updatePage(
    user: ReliquarySessionUser,
    docId: string,
    pageId: string,
    body: ReliquaryModel['updatePageBody']
  ) {
    const { doc, canEdit } = await this.loadDocWithAccess(docId, user)
    if (!canEdit) {
      throw new Forbidden('You do not have permission to edit pages in this document')
    }

    const page = await prisma.orm.public.ReliquaryPage.where({ id: pageId, docId: doc.id })
      .include('lockedBy')
      .first()
    if (!page) {
      throw new NotFound('Reliquary page not found')
    }

    assertNotLockedByOther(page, user.id)

    const nextTitle = body.title !== undefined ? body.title.trim() : page.title
    if (!nextTitle) throw new BadRequest('Page title cannot be empty')
    const nextIcon = body.icon !== undefined ? body.icon?.trim() || null : page.icon
    const shouldRelease = body.releaseLock !== false
    const releasingOwnLock = shouldRelease && page.lockedById === user.id

    await prisma.orm.public.ReliquaryPage.where({ id: page.id }).update({
      title: nextTitle,
      icon: nextIcon,
      ...(body.schema !== undefined ? { schema: body.schema as any } : {}),
      lastEditedById: user.id,
      ...(releasingOwnLock ? { lockedById: null, lockedAt: null, lockExpiresAt: null } : {}),
    })

    // Sync matching node label/icon in doc sidebarConfig when title/icon changed
    if (body.title !== undefined || body.icon !== undefined) {
      const updatedTree = updateNodeInSidebarTree(
        parseSidebarConfig(doc.sidebarConfig),
        (n) => n.pageId === page.id,
        (n) => ({ ...n, label: nextTitle, icon: nextIcon })
      )
      if (updatedTree.updated) {
        await prisma.orm.public.ReliquaryDoc.where({ id: doc.id }).update({
          sidebarConfig: updatedTree.nodes as any,
        })
      }
    }

    if (releasingOwnLock) {
      this.broadcastLockChange(doc.id, page.id, {
        locked: false,
        lockedBy: null,
        lockedAt: null,
        lockExpiresAt: null,
        isOwnedByCurrentUser: false,
      })
    }

    return await this.getPage(user, doc.id, page.id)
  }

  /**
   * Delete a sub-doc page and promote its child nodes in sidebarConfig up one level.
   */
  public static async deletePage(user: ReliquarySessionUser, docId: string, pageId: string) {
    const { doc, canEdit } = await this.loadDocWithAccess(docId, user)
    if (!canEdit) {
      throw new Forbidden('You do not have permission to delete pages in this document')
    }

    assertNotLockedByOther(doc, user.id)

    const page = await prisma.orm.public.ReliquaryPage.where({ id: pageId, docId: doc.id })
      .include('lockedBy')
      .first()
    if (!page) {
      throw new NotFound('Reliquary page not found')
    }

    assertNotLockedByOther(page, user.id)

    const currentSidebar = parseSidebarConfig(doc.sidebarConfig)
    const promoted = removePageFromSidebarTree(currentSidebar, page.id)
    const nextPageIds = extractPageIdsFromSidebarTree(promoted.nodes)

    await prisma.transaction(async (tx) => {
      await tx.orm.public.ReliquaryPage.where({ id: page.id }).delete()
      await tx.orm.public.ReliquaryDoc.where({ id: doc.id }).update({
        sidebarConfig: promoted.nodes as any,
        pageIds: nextPageIds,
      })
    })

    return {
      success: true,
      deletedPageId: page.id,
      sidebarConfig: promoted.nodes,
      pageIds: nextPageIds,
    }
  }

  /**
   * Toggle bookmark state on a Main Doc.
   */
  public static async setBookmark(
    user: ReliquarySessionUser,
    docId: string,
    bookmarked: boolean
  ) {
    await this.loadDocWithAccess(docId, user)

    const existing = await prisma.orm.public.ReliquaryBookmark.where({
      userId: user.id,
      docId,
    }).first()

    if (bookmarked && !existing) {
      await prisma.orm.public.ReliquaryBookmark.create({
        id: Bun.randomUUIDv7(),
        userId: user.id,
        docId,
      })
    } else if (!bookmarked && existing) {
      await prisma.orm.public.ReliquaryBookmark.where({ id: existing.id }).delete()
    }

    return { docId, bookmarked }
  }

  /**
   * List collaborators (Creator or ADMINISTRATOR only).
   */
  public static async listCollaborators(user: ReliquarySessionUser, docId: string) {
    const { canManage } = await this.loadDocWithAccess(docId, user)
    if (!canManage) {
      throw new Forbidden('Only the document creator or an administrator can view collaborators')
    }

    const rows = await prisma.orm.public.ReliquaryCollaborator.where({ docId })
      .include('user')
      .orderBy((c) => c.createdAt.asc())
      .all()

    return {
      collaborators: rows.map((c) => ({
        id: c.id,
        userId: c.userId,
        role: c.role,
        createdAt: toDate(c.createdAt).toISOString(),
        user: formatUserPreview(c.user),
      })),
    }
  }

  /**
   * Add or update a collaborator role on a Main Doc (Creator or ADMINISTRATOR only).
   */
  public static async upsertCollaborator(
    user: ReliquarySessionUser,
    docId: string,
    body: ReliquaryModel['collaboratorBody']
  ) {
    const { doc, canManage } = await this.loadDocWithAccess(docId, user)
    if (!canManage) {
      throw new Forbidden('Only the document creator or an administrator can manage collaborators')
    }

    if (body.userId === doc.creatorId) {
      throw new BadRequest('The document creator already owns full permissions')
    }

    const targetUser = await prisma.orm.public.User.where({ id: body.userId }).first()
    if (!targetUser) {
      throw new NotFound('Target user not found')
    }

    const existing = await prisma.orm.public.ReliquaryCollaborator.where({
      docId,
      userId: targetUser.id,
    }).first()

    let record
    if (existing) {
      await prisma.orm.public.ReliquaryCollaborator.where({ id: existing.id }).update({
        role: body.role,
      })
      record = { ...existing, role: body.role }
    } else {
      record = await prisma.orm.public.ReliquaryCollaborator.create({
        id: Bun.randomUUIDv7(),
        docId,
        userId: targetUser.id,
        role: body.role,
      })
    }

    return {
      collaborator: {
        id: record.id,
        userId: record.userId,
        role: record.role,
        createdAt: toDate(record.createdAt).toISOString(),
        user: formatUserPreview(targetUser),
      },
    }
  }

  /**
   * Remove a collaborator from a Main Doc (Creator or ADMINISTRATOR only).
   */
  public static async removeCollaborator(
    user: ReliquarySessionUser,
    docId: string,
    targetUserId: string
  ) {
    const { canManage } = await this.loadDocWithAccess(docId, user)
    if (!canManage) {
      throw new Forbidden('Only the document creator or an administrator can remove collaborators')
    }

    const existing = await prisma.orm.public.ReliquaryCollaborator.where({
      docId,
      userId: targetUserId,
    }).first()

    if (!existing) {
      throw new NotFound('Collaborator not found')
    }

    await prisma.orm.public.ReliquaryCollaborator.where({ id: existing.id }).delete()
    return { success: true, deletedId: targetUserId }
  }

  /**
   * Search IRIS users by username to invite as Reliquary collaborators.
   */
  public static async searchUsers(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return { users: [] }
    const escaped = escapeLikePattern(trimmed)
    const users = await prisma.orm.public.User.where((u) => u.username.ilike(`%${escaped}%`))
      .orderBy((u) => u.username.asc())
      .limit(10)
      .all()

    return {
      users: users.map((u) => formatUserPreview(u)),
    }
  }

  // --- Shared Edit Lock Management ---

  private static broadcastLockChange(
    docId: string,
    pageId: string | null,
    lock: ReturnType<typeof buildLockStatus>
  ) {
    wsHub.broadcastChannel(this.docChannel(docId), 'reliquary:lock-changed', {
      docId,
      pageId,
      lock,
    })
  }

  private static async resolveLockTarget(
    user: ReliquarySessionUser,
    docId: string,
    pageId?: string | null
  ): Promise<{
    target: LockableRecord
    canEdit: boolean
    canManage: boolean
    writeLock: (fields: {
      lockedById: string | null
      lockedAt: Date | null
      lockExpiresAt: Date | null
    }) => Promise<void>
  }> {
    const { doc, canEdit, canManage } = await this.loadDocWithAccess(docId, user)

    if (!pageId) {
      return {
        target: doc,
        canEdit,
        canManage,
        writeLock: async (fields) => {
          await prisma.orm.public.ReliquaryDoc.where({ id: doc.id }).update(fields)
        },
      }
    }

    const page = await prisma.orm.public.ReliquaryPage.where({ id: pageId, docId: doc.id })
      .include('lockedBy')
      .first()
    if (!page) {
      throw new NotFound('Reliquary page not found')
    }

    return {
      target: page,
      canEdit,
      canManage,
      writeLock: async (fields) => {
        await prisma.orm.public.ReliquaryPage.where({ id: page.id }).update(fields)
      },
    }
  }

  /**
   * Acquires or extends the 2-minute edit lease on a Main Doc or Sub-Page.
   */
  public static async acquireLock(
    user: ReliquarySessionUser,
    docId: string,
    pageId?: string | null
  ) {
    const { target, canEdit, writeLock } = await this.resolveLockTarget(user, docId, pageId)
    if (!canEdit) {
      throw new Forbidden('You do not have permission to edit this document')
    }

    assertNotLockedByOther(target, user.id)

    const now = new Date()
    const expires = new Date(now.getTime() + RELIQUARY_LOCK_TTL_MS)
    const lockedAt =
      isLockActive(target, now.getTime()) && target.lockedById === user.id && target.lockedAt
        ? toDate(target.lockedAt)
        : now

    await writeLock({
      lockedById: user.id,
      lockedAt,
      lockExpiresAt: expires,
    })

    const locker = await prisma.orm.public.User.where({ id: user.id }).first()
    const lockStatus = {
      locked: true,
      lockedBy: locker
        ? formatUserPreview(locker)
        : { id: user.id, username: user.username ?? 'editor', displayName: null, avatarUrl: null },
      lockedAt: lockedAt.toISOString(),
      lockExpiresAt: expires.toISOString(),
      isOwnedByCurrentUser: true,
    }

    this.broadcastLockChange(docId, pageId ?? null, {
      ...lockStatus,
      isOwnedByCurrentUser: false,
    })

    return {
      docId,
      pageId: pageId ?? null,
      lock: lockStatus,
    }
  }

  /**
   * Refreshes an active edit lease while the user keeps PageBuilder open.
   */
  public static async heartbeatLock(
    user: ReliquarySessionUser,
    docId: string,
    pageId?: string | null
  ) {
    return await this.acquireLock(user, docId, pageId)
  }

  /**
   * Releases an edit lock held by the current user (idempotent if already expired/unlocked).
   */
  public static async releaseLock(
    user: ReliquarySessionUser,
    docId: string,
    pageId?: string | null
  ) {
    const { target, writeLock } = await this.resolveLockTarget(user, docId, pageId)

    if (target.lockedById === user.id) {
      await writeLock({ lockedById: null, lockedAt: null, lockExpiresAt: null })
      const cleared = {
        locked: false,
        lockedBy: null,
        lockedAt: null,
        lockExpiresAt: null,
        isOwnedByCurrentUser: false,
      }
      this.broadcastLockChange(docId, pageId ?? null, cleared)
      return { docId, pageId: pageId ?? null, lock: cleared }
    }

    return {
      docId,
      pageId: pageId ?? null,
      lock: buildLockStatus(target, user.id),
    }
  }

  /**
   * Forces an edit lock release (Main Doc creator or ADMINISTRATOR only).
   */
  public static async forceUnlockLock(
    user: ReliquarySessionUser,
    docId: string,
    pageId?: string | null
  ) {
    const { canManage, writeLock } = await this.resolveLockTarget(user, docId, pageId)
    if (!canManage) {
      throw new Forbidden('Only the document creator or an administrator can force unlock')
    }

    await writeLock({ lockedById: null, lockedAt: null, lockExpiresAt: null })
    const cleared = {
      locked: false,
      lockedBy: null,
      lockedAt: null,
      lockExpiresAt: null,
      isOwnedByCurrentUser: false,
    }
    this.broadcastLockChange(docId, pageId ?? null, cleared)

    return { docId, pageId: pageId ?? null, lock: cleared }
  }
}
