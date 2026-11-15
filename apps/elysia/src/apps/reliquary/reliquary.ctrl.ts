import { Elysia, t } from 'elysia'
import { session } from '../../core/plugins/session'
import { ReliquaryModel } from './reliquary.model'
import { ReliquaryServ } from './reliquary.serv'

export const reliquary = new Elysia({ prefix: '/reliquary' })
  .use(session())

  // --- 1. GET /reliquary/home ---
  .get(
    '/home',
    {
      detail: {
        summary: 'Get recently visited, bookmarked, and owned/shared Reliquary documents',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.homeResponse,
        401: ReliquaryModel.unauthorizedError,
      },
    },
    async ({ session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.getHome(user)
    }
  )

  // --- 2. GET /reliquary/users/search ---
  .get(
    '/users/search',
    {
      query: ReliquaryModel.userSearchQuery,
      detail: {
        summary: 'Search IRIS users by username to invite as Reliquary collaborators',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.userSearchResponse,
        401: ReliquaryModel.unauthorizedError,
        422: ReliquaryModel.validationError,
      },
    },
    async ({ query, session: userSession }) => {
      userSession.requireUser()
      return await ReliquaryServ.searchUsers(query.q)
    }
  )

  // --- 3. GET /reliquary/docs ---
  .get(
    '/docs',
    {
      query: ReliquaryModel.browseDocsQuery,
      detail: {
        summary: 'Browse and title-search accessible Reliquary books',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.browseDocsResponse,
        422: ReliquaryModel.validationError,
      },
    },
    async ({ query, session: userSession }) => {
      const currentUser = userSession.getUser()
      return await ReliquaryServ.browseDocs(currentUser, query)
    }
  )

  // --- 4. POST /reliquary/docs ---
  .post(
    '/docs',
    {
      body: ReliquaryModel.createDocBody,
      detail: {
        summary: 'Create a new Reliquary Main Doc (UUID v7)',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.docResponse,
        400: ReliquaryModel.badRequestError,
        401: ReliquaryModel.unauthorizedError,
        422: ReliquaryModel.validationError,
      },
    },
    async ({ body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.createDoc(user, body)
    }
  )

  // --- 5. GET /reliquary/docs/:docId ---
  .get(
    '/docs/:docId',
    {
      params: ReliquaryModel.docParam,
      detail: {
        summary: 'Get a Reliquary Main Doc landing schema and 5-level sidebar tree',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.docResponse,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
      },
    },
    async ({ params, session: userSession }) => {
      const currentUser = userSession.getUser()
      return await ReliquaryServ.getDoc(currentUser, params.docId)
    }
  )

  // --- 6. PATCH /reliquary/docs/:docId ---
  .patch(
    '/docs/:docId',
    {
      params: ReliquaryModel.docParam,
      body: ReliquaryModel.updateDocMetaBody,
      detail: {
        summary: 'Update Main Doc metadata and visibility (Creator or Admin)',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.docResponse,
        400: ReliquaryModel.badRequestError,
        401: ReliquaryModel.unauthorizedError,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
        422: ReliquaryModel.validationError,
      },
    },
    async ({ params, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.updateDocMeta(user, params.docId, body)
    }
  )

  // --- 7. PUT /reliquary/docs/:docId/schema ---
  .put(
    '/docs/:docId/schema',
    {
      params: ReliquaryModel.docParam,
      body: ReliquaryModel.updateDocSchemaBody,
      detail: {
        summary: 'Save Main Doc landing IrisPage schema',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.docResponse,
        401: ReliquaryModel.unauthorizedError,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
        409: ReliquaryModel.conflictError,
        422: ReliquaryModel.validationError,
      },
    },
    async ({ params, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.updateDocSchema(user, params.docId, body)
    }
  )

  // --- 8. PUT /reliquary/docs/:docId/sidebar ---
  .put(
    '/docs/:docId/sidebar',
    {
      params: ReliquaryModel.docParam,
      body: ReliquaryModel.updateSidebarBody,
      detail: {
        summary: 'Update 5-level sidebarConfig tree and synchronized pageIds',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.docResponse,
        400: ReliquaryModel.badRequestError,
        401: ReliquaryModel.unauthorizedError,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
        409: ReliquaryModel.conflictError,
        422: ReliquaryModel.validationError,
      },
    },
    async ({ params, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.updateSidebar(user, params.docId, body)
    }
  )

  // --- 9. DELETE /reliquary/docs/:docId ---
  .delete(
    '/docs/:docId',
    {
      params: ReliquaryModel.docParam,
      detail: {
        summary: 'Delete a Reliquary Main Doc (Creator or Admin)',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.deleteResponse,
        401: ReliquaryModel.unauthorizedError,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
      },
    },
    async ({ params, session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.deleteDoc(user, params.docId)
    }
  )

  // --- 10. POST /reliquary/docs/:docId/pages ---
  .post(
    '/docs/:docId/pages',
    {
      params: ReliquaryModel.docParam,
      body: ReliquaryModel.createPageBody,
      detail: {
        summary: 'Create a sub-doc page (UUID v7) and insert into sidebarConfig',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.createPageResponse,
        400: ReliquaryModel.badRequestError,
        401: ReliquaryModel.unauthorizedError,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
        409: ReliquaryModel.conflictError,
        422: ReliquaryModel.validationError,
      },
    },
    async ({ params, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.createPage(user, params.docId, body)
    }
  )

  // --- 11. GET /reliquary/docs/:docId/pages/:pageId ---
  .get(
    '/docs/:docId/pages/:pageId',
    {
      params: ReliquaryModel.pageParam,
      detail: {
        summary: 'Get a sub-doc IrisPage schema and lock state',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.pageResponse,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
      },
    },
    async ({ params, session: userSession }) => {
      const currentUser = userSession.getUser()
      return await ReliquaryServ.getPage(currentUser, params.docId, params.pageId)
    }
  )

  // --- 12. PUT /reliquary/docs/:docId/pages/:pageId ---
  .put(
    '/docs/:docId/pages/:pageId',
    {
      params: ReliquaryModel.pageParam,
      body: ReliquaryModel.updatePageBody,
      detail: {
        summary: 'Update a sub-doc page title, icon, or IrisPage schema',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.pageResponse,
        400: ReliquaryModel.badRequestError,
        401: ReliquaryModel.unauthorizedError,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
        409: ReliquaryModel.conflictError,
        422: ReliquaryModel.validationError,
      },
    },
    async ({ params, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.updatePage(user, params.docId, params.pageId, body)
    }
  )

  // --- 13. DELETE /reliquary/docs/:docId/pages/:pageId ---
  .delete(
    '/docs/:docId/pages/:pageId',
    {
      params: ReliquaryModel.pageParam,
      detail: {
        summary: 'Delete a sub-doc page and promote child sidebar nodes up one level',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.deletePageResponse,
        401: ReliquaryModel.unauthorizedError,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
        409: ReliquaryModel.conflictError,
      },
    },
    async ({ params, session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.deletePage(user, params.docId, params.pageId)
    }
  )

  // --- 14. POST /reliquary/docs/:docId/bookmark ---
  .post(
    '/docs/:docId/bookmark',
    {
      params: ReliquaryModel.docParam,
      detail: {
        summary: 'Bookmark a Reliquary Main Doc',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.bookmarkResponse,
        401: ReliquaryModel.unauthorizedError,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
      },
    },
    async ({ params, session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.setBookmark(user, params.docId, true)
    }
  )

  // --- 15. DELETE /reliquary/docs/:docId/bookmark ---
  .delete(
    '/docs/:docId/bookmark',
    {
      params: ReliquaryModel.docParam,
      detail: {
        summary: 'Remove bookmark from a Reliquary Main Doc',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.bookmarkResponse,
        401: ReliquaryModel.unauthorizedError,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
      },
    },
    async ({ params, session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.setBookmark(user, params.docId, false)
    }
  )

  // --- 16. GET /reliquary/docs/:docId/collaborators ---
  .get(
    '/docs/:docId/collaborators',
    {
      params: ReliquaryModel.docParam,
      detail: {
        summary: 'List Main Doc collaborators (Creator or Admin)',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.collaboratorsResponse,
        401: ReliquaryModel.unauthorizedError,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
      },
    },
    async ({ params, session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.listCollaborators(user, params.docId)
    }
  )

  // --- 17. POST /reliquary/docs/:docId/collaborators ---
  .post(
    '/docs/:docId/collaborators',
    {
      params: ReliquaryModel.docParam,
      body: ReliquaryModel.collaboratorBody,
      detail: {
        summary: 'Add or update a collaborator role on a Main Doc (Creator or Admin)',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.collaboratorResponse,
        400: ReliquaryModel.badRequestError,
        401: ReliquaryModel.unauthorizedError,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
        422: ReliquaryModel.validationError,
      },
    },
    async ({ params, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.upsertCollaborator(user, params.docId, body)
    }
  )

  // --- 18. DELETE /reliquary/docs/:docId/collaborators/:userId ---
  .delete(
    '/docs/:docId/collaborators/:userId',
    {
      params: ReliquaryModel.collaboratorParam,
      detail: {
        summary: 'Remove a collaborator from a Main Doc (Creator or Admin)',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.deleteResponse,
        401: ReliquaryModel.unauthorizedError,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
      },
    },
    async ({ params, session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.removeCollaborator(user, params.docId, params.userId)
    }
  )

  // --- 19. POST /reliquary/docs/:docId/locks/acquire ---
  .post(
    '/docs/:docId/locks/acquire',
    {
      params: ReliquaryModel.docParam,
      body: ReliquaryModel.lockBody,
      detail: {
        summary: 'Acquire a 2-minute edit lease on a Main Doc or sub-page',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.lockResponse,
        401: ReliquaryModel.unauthorizedError,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
        409: ReliquaryModel.conflictError,
        422: ReliquaryModel.validationError,
      },
    },
    async ({ params, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.acquireLock(user, params.docId, body.pageId)
    }
  )

  // --- 20. POST /reliquary/docs/:docId/locks/heartbeat ---
  .post(
    '/docs/:docId/locks/heartbeat',
    {
      params: ReliquaryModel.docParam,
      body: ReliquaryModel.lockBody,
      detail: {
        summary: 'Extend an active edit lease while PageBuilder remains open',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.lockResponse,
        401: ReliquaryModel.unauthorizedError,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
        409: ReliquaryModel.conflictError,
        422: ReliquaryModel.validationError,
      },
    },
    async ({ params, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.heartbeatLock(user, params.docId, body.pageId)
    }
  )

  // --- 21. POST /reliquary/docs/:docId/locks/release ---
  .post(
    '/docs/:docId/locks/release',
    {
      params: ReliquaryModel.docParam,
      body: t.Optional(ReliquaryModel.lockBody),
      detail: {
        summary: 'Release an active edit lease held by the caller',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.lockResponse,
        401: ReliquaryModel.unauthorizedError,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
      },
    },
    async ({ params, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.releaseLock(user, params.docId, body?.pageId)
    }
  )

  // --- 22. POST /reliquary/docs/:docId/locks/force-unlock ---
  .post(
    '/docs/:docId/locks/force-unlock',
    {
      params: ReliquaryModel.docParam,
      body: ReliquaryModel.lockBody,
      detail: {
        summary: 'Force release an active edit lease (Creator or Admin)',
        tags: ['Reliquary'],
      },
      response: {
        200: ReliquaryModel.lockResponse,
        401: ReliquaryModel.unauthorizedError,
        403: ReliquaryModel.forbiddenError,
        404: ReliquaryModel.notFoundError,
      },
    },
    async ({ params, body, session: userSession }) => {
      const user = userSession.requireUser()
      return await ReliquaryServ.forceUnlockLock(user, params.docId, body.pageId)
    }
  )

export default reliquary
