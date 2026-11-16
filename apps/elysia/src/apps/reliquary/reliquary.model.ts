import { t, type UnwrapSchema } from 'elysia'
import type { ReliquarySidebarNode } from '@NamelessLiberty/shared'

function problemDetailsErrorSchema<S extends number>(
  status: S,
  code: string,
  description: string
) {
  return t.Object(
    {
      type: t.String({ description: `Slug identifying problem type ("${code}")` }),
      title: t.String(),
      status: t.Literal(status),
      detail: t.String(),
      code: t.String(),
      instance: t.Optional(t.String()),
    },
    { description }
  )
}

export const ReliquaryVisibilitySchema = t.Union([
  t.Literal('PUBLIC'),
  t.Literal('UNLISTED'),
  t.Literal('PRIVATE'),
])

export const ReliquaryCategorySchema = t.Union([
  t.Literal('API_DOCS'),
  t.Literal('WIKI'),
  t.Literal('GUIDES'),
  t.Literal('TUTORIALS'),
  t.Literal('REFERENCE'),
  t.Literal('OTHER'),
])

export const ReliquaryCollaboratorRoleSchema = t.Union([
  t.Literal('EDITOR'),
  t.Literal('VIEWER'),
])

export const ReliquarySidebarNodeSchema = t.Unsafe<ReliquarySidebarNode>(
  t.Object({
    id: t.String({ minLength: 1 }),
    label: t.String({ minLength: 1, maxLength: 120 }),
    icon: t.Optional(t.Nullable(t.String({ maxLength: 64 }))),
    pageId: t.Optional(t.Nullable(t.String({ minLength: 1 }))),
    children: t.Optional(t.Array(t.Any())),
  })
)

export const ReliquaryUserPreviewSchema = t.Object({
  id: t.String(),
  username: t.String(),
  displayName: t.Nullable(t.String()),
  avatarUrl: t.Nullable(t.String()),
})

export const ReliquaryLockStatusSchema = t.Object({
  locked: t.Boolean(),
  lockedBy: t.Nullable(ReliquaryUserPreviewSchema),
  lockedAt: t.Nullable(t.String()),
  lockExpiresAt: t.Nullable(t.String()),
  isOwnedByCurrentUser: t.Boolean(),
})

export const ReliquaryMatchedPageSchema = t.Object({
  id: t.String(),
  title: t.String(),
  icon: t.Nullable(t.String()),
})

export const ReliquaryDocSummarySchema = t.Object({
  id: t.String(),
  title: t.String(),
  description: t.Nullable(t.String()),
  icon: t.Nullable(t.String()),
  category: ReliquaryCategorySchema,
  tags: t.Array(t.String()),
  visibility: ReliquaryVisibilitySchema,
  creatorId: t.String(),
  creator: ReliquaryUserPreviewSchema,
  pageCount: t.Number(),
  isBookmarked: t.Boolean(),
  userRole: t.Nullable(t.String()),
  matchedPages: t.Optional(t.Array(ReliquaryMatchedPageSchema)),
  createdAt: t.String(),
  updatedAt: t.String(),
})

export const ReliquaryCollaboratorItemSchema = t.Object({
  id: t.String(),
  userId: t.String(),
  role: ReliquaryCollaboratorRoleSchema,
  createdAt: t.String(),
  user: ReliquaryUserPreviewSchema,
})

export const ReliquaryDocDetailSchema = t.Object({
  id: t.String(),
  title: t.String(),
  description: t.Nullable(t.String()),
  icon: t.Nullable(t.String()),
  category: ReliquaryCategorySchema,
  tags: t.Array(t.String()),
  visibility: ReliquaryVisibilitySchema,
  creatorId: t.String(),
  creator: ReliquaryUserPreviewSchema,
  sidebarConfig: t.Array(ReliquarySidebarNodeSchema),
  pageIds: t.Array(t.String()),
  schema: t.Any(),
  lock: ReliquaryLockStatusSchema,
  isBookmarked: t.Boolean(),
  canEdit: t.Boolean(),
  canManage: t.Boolean(),
  collaborators: t.Optional(t.Array(ReliquaryCollaboratorItemSchema)),
  createdAt: t.String(),
  updatedAt: t.String(),
})

export const ReliquaryPageDetailSchema = t.Object({
  id: t.String(),
  docId: t.String(),
  title: t.String(),
  icon: t.Nullable(t.String()),
  schema: t.Any(),
  creatorId: t.String(),
  lastEditedBy: t.Nullable(ReliquaryUserPreviewSchema),
  lock: ReliquaryLockStatusSchema,
  canEdit: t.Boolean(),
  canManage: t.Boolean(),
  createdAt: t.String(),
  updatedAt: t.String(),
})

export const ReliquaryRecentVisitItemSchema = t.Object({
  id: t.String(),
  docId: t.String(),
  pageId: t.Nullable(t.String()),
  pageTitle: t.Nullable(t.String()),
  visitedAt: t.String(),
  doc: ReliquaryDocSummarySchema,
})

export const ReliquaryPaginationMetaSchema = t.Object({
  page: t.Number(),
  limit: t.Number(),
  total: t.Number(),
  totalPages: t.Number(),
  hasMore: t.Boolean(),
})

export const ReliquaryModel = {
  // --- Path Params ---
  docParam: t.Object({
    docId: t.String({ minLength: 1 }),
  }),
  pageParam: t.Object({
    docId: t.String({ minLength: 1 }),
    pageId: t.String({ minLength: 1 }),
  }),
  collaboratorParam: t.Object({
    docId: t.String({ minLength: 1 }),
    userId: t.String({ minLength: 1 }),
  }),

  // --- Requests ---
  browseDocsQuery: t.Object({
    q: t.Optional(t.String({ maxLength: 120 })),
    category: t.Optional(ReliquaryCategorySchema),
    tag: t.Optional(t.String({ maxLength: 40 })),
    page: t.Optional(t.Union([t.Number({ minimum: 1 }), t.String()])),
    limit: t.Optional(t.Union([t.Number({ minimum: 1, maximum: 100 }), t.String()])),
  }),

  userSearchQuery: t.Object({
    q: t.String({ minLength: 1, maxLength: 64 }),
  }),

  createDocBody: t.Object({
    title: t.String({ minLength: 1, maxLength: 140 }),
    description: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
    icon: t.Optional(t.Nullable(t.String({ maxLength: 64 }))),
    category: t.Optional(ReliquaryCategorySchema),
    tags: t.Optional(t.Array(t.String({ minLength: 1, maxLength: 32 }), { maxItems: 12 })),
    visibility: t.Optional(ReliquaryVisibilitySchema),
  }),

  updateDocMetaBody: t.Object({
    title: t.Optional(t.String({ minLength: 1, maxLength: 140 })),
    description: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
    icon: t.Optional(t.Nullable(t.String({ maxLength: 64 }))),
    category: t.Optional(ReliquaryCategorySchema),
    tags: t.Optional(t.Array(t.String({ minLength: 1, maxLength: 32 }), { maxItems: 12 })),
    visibility: t.Optional(ReliquaryVisibilitySchema),
  }),

  updateDocSchemaBody: t.Object({
    schema: t.Record(t.String(), t.Any()),
    releaseLock: t.Optional(t.Boolean()),
  }),

  updateSidebarBody: t.Object({
    sidebarConfig: t.Array(ReliquarySidebarNodeSchema),
  }),

  createPageBody: t.Object({
    title: t.String({ minLength: 1, maxLength: 140 }),
    icon: t.Optional(t.Nullable(t.String({ maxLength: 64 }))),
    parentNodeId: t.Optional(t.Nullable(t.String({ minLength: 1 }))),
  }),

  updatePageBody: t.Object({
    title: t.Optional(t.String({ minLength: 1, maxLength: 140 })),
    icon: t.Optional(t.Nullable(t.String({ maxLength: 64 }))),
    schema: t.Optional(t.Record(t.String(), t.Any())),
    releaseLock: t.Optional(t.Boolean()),
  }),

  collaboratorBody: t.Object({
    userId: t.String({ minLength: 1 }),
    role: ReliquaryCollaboratorRoleSchema,
  }),

  lockBody: t.Object({
    pageId: t.Optional(t.Nullable(t.String({ minLength: 1 }))),
  }),

  // --- Responses ---
  homeResponse: t.Object({
    recentVisits: t.Array(ReliquaryRecentVisitItemSchema),
    bookmarks: t.Array(ReliquaryDocSummarySchema),
    myDocs: t.Array(ReliquaryDocSummarySchema),
  }),

  browseDocsResponse: t.Object({
    docs: t.Array(ReliquaryDocSummarySchema),
    availableTags: t.Array(t.String()),
    pagination: ReliquaryPaginationMetaSchema,
  }),

  docResponse: t.Object({
    doc: ReliquaryDocDetailSchema,
  }),

  pageResponse: t.Object({
    page: ReliquaryPageDetailSchema,
    doc: t.Object({
      id: t.String(),
      title: t.String(),
      sidebarConfig: t.Array(ReliquarySidebarNodeSchema),
    }),
  }),

  createPageResponse: t.Object({
    page: ReliquaryPageDetailSchema,
    sidebarConfig: t.Array(ReliquarySidebarNodeSchema),
    pageIds: t.Array(t.String()),
  }),

  deletePageResponse: t.Object({
    success: t.Boolean(),
    deletedPageId: t.String(),
    sidebarConfig: t.Array(ReliquarySidebarNodeSchema),
    pageIds: t.Array(t.String()),
  }),

  bookmarkResponse: t.Object({
    docId: t.String(),
    bookmarked: t.Boolean(),
  }),

  collaboratorsResponse: t.Object({
    collaborators: t.Array(ReliquaryCollaboratorItemSchema),
  }),

  collaboratorResponse: t.Object({
    collaborator: ReliquaryCollaboratorItemSchema,
  }),

  userSearchResponse: t.Object({
    users: t.Array(ReliquaryUserPreviewSchema),
  }),

  lockResponse: t.Object({
    docId: t.String(),
    pageId: t.Nullable(t.String()),
    lock: ReliquaryLockStatusSchema,
  }),

  deleteResponse: t.Object({
    success: t.Boolean(),
    deletedId: t.String(),
  }),

  // --- RFC 9457 Errors ---
  badRequestError: problemDetailsErrorSchema(400, 'bad-request', 'Bad request'),
  unauthorizedError: problemDetailsErrorSchema(401, 'unauthorized', 'Authentication required'),
  forbiddenError: problemDetailsErrorSchema(403, 'forbidden', 'Insufficient permissions'),
  notFoundError: problemDetailsErrorSchema(404, 'not-found', 'Resource not found'),
  conflictError: problemDetailsErrorSchema(409, 'conflict', 'Edit lock conflict'),
  validationError: problemDetailsErrorSchema(422, 'validation', 'Validation failed'),
} as const

export type ReliquaryModel = {
  [k in keyof typeof ReliquaryModel]: UnwrapSchema<(typeof ReliquaryModel)[k]>
}
