import { Elysia } from 'elysia'
import { session } from '../../../core/plugins/session'
import { hasPermission, IRISFlags } from '@NamelessLiberty/permissions'
import { BorealisOtherModel } from './other.model'
import { BorealisOtherServ } from './other.serv'

// Split into small Elysia instances to avoid TS2589 (excessively deep type instantiation).
const routes1 = new Elysia()
  .use(session())

  .get(
    '',
    {
      query: BorealisOtherModel.catalogQuery,
      detail: {
        summary: 'Get public custom items catalog',
        description: 'Returns 50 published custom items per page with cursor/page pagination.',
        tags: ['Borealis - Other'],
      },
      response: {
        200: BorealisOtherModel.catalogResponse,
        422: BorealisOtherModel.validationError,
      },
    },
    async ({ query }) => {
      return await BorealisOtherServ.getCatalog(query)
    }
  )

  .get(
    '/filters',
    {
      detail: {
        summary: 'Get catalog filters for custom items',
        description: 'Returns available formats, statuses, genres, tags, years, and seasons.',
        tags: ['Borealis - Other'],
      },
      response: {
        200: BorealisOtherModel.filtersResponse,
      },
    },
    async () => {
      return await BorealisOtherServ.getFilters()
    }
  )

  .get(
    '/taxonomy',
    {
      detail: {
        summary: 'Get shared genres and tags for autocomplete',
        description: 'Returns existing Genre and Tag entries for the Other item editor.',
        tags: ['Borealis - Other'],
      },
      response: {
        200: BorealisOtherModel.taxonomyResponse,
      },
    },
    async () => {
      return await BorealisOtherServ.getTaxonomy()
    }
  )

  .get(
    '/my-items',
    {
      detail: {
        summary: 'Get items created by current user',
        description: 'Returns all custom items created by the authenticated user.',
        tags: ['Borealis - Other'],
      },
      response: {
        200: BorealisOtherModel.myItemsResponse,
      },
    },
    async ({ session: userSession }) => {
      const user = userSession.requireUser()
      return await BorealisOtherServ.getMyItems(user.id)
    }
  )

  .post(
    '/upload',
    {
      body: BorealisOtherModel.uploadBody,
      detail: {
        summary: 'Upload cover, banner, or gallery image for a custom item',
        tags: ['Borealis - Other'],
      },
      response: {
        200: BorealisOtherModel.uploadResponse,
        422: BorealisOtherModel.validationError,
      },
    },
    async ({ session: userSession, body }) => {
      const user = userSession.requireUser()
      return await BorealisOtherServ.uploadAsset(user.id, body.file, body.type)
    }
  )

const routes2 = new Elysia()
  .use(session())

  .post(
    '',
    {
      body: BorealisOtherModel.createBody,
      detail: {
        summary: 'Create a new custom item',
        tags: ['Borealis - Other'],
      },
      response: {
        200: BorealisOtherModel.itemResponse,
        403: BorealisOtherModel.forbiddenError,
        422: BorealisOtherModel.validationError,
      },
    },
    async ({ session: userSession, body }) => {
      const user = userSession.requireUser()
      const isAdmin = hasPermission(user.permissions, IRISFlags.ADMINISTRATOR)
      return await BorealisOtherServ.createItem(user.id, body, isAdmin)
    }
  )

  .get(
    '/:otherId',
    {
      params: BorealisOtherModel.otherParam,
      detail: {
        summary: 'Get custom item by ID',
        tags: ['Borealis - Other'],
      },
      response: {
        200: BorealisOtherModel.itemResponse,
        403: BorealisOtherModel.forbiddenError,
        404: BorealisOtherModel.notFoundError,
      },
    },
    async ({ params: { otherId }, session: userSession }) => {
      const user = userSession.getUser()
      const isAdmin = user ? hasPermission(user.permissions, IRISFlags.ADMINISTRATOR) : false
      return await BorealisOtherServ.getItem(otherId, user?.id, isAdmin)
    }
  )

  .patch(
    '/:otherId',
    {
      params: BorealisOtherModel.otherParam,
      body: BorealisOtherModel.updateBody,
      detail: {
        summary: 'Update custom item',
        tags: ['Borealis - Other'],
      },
      response: {
        200: BorealisOtherModel.itemResponse,
        403: BorealisOtherModel.forbiddenError,
        404: BorealisOtherModel.notFoundError,
        422: BorealisOtherModel.validationError,
      },
    },
    async ({ session: userSession, params: { otherId }, body }) => {
      const user = userSession.requireUser()
      const isAdmin = hasPermission(user.permissions, IRISFlags.ADMINISTRATOR)
      return await BorealisOtherServ.updateItem(user.id, otherId, body, isAdmin)
    }
  )

  .put(
    '/:otherId',
    {
      params: BorealisOtherModel.otherParam,
      body: BorealisOtherModel.updateBody,
      detail: {
        summary: 'Update custom item (PUT alias)',
        tags: ['Borealis - Other'],
      },
      response: {
        200: BorealisOtherModel.itemResponse,
        403: BorealisOtherModel.forbiddenError,
        404: BorealisOtherModel.notFoundError,
        422: BorealisOtherModel.validationError,
      },
    },
    async ({ session: userSession, params: { otherId }, body }) => {
      const user = userSession.requireUser()
      const isAdmin = hasPermission(user.permissions, IRISFlags.ADMINISTRATOR)
      return await BorealisOtherServ.updateItem(user.id, otherId, body, isAdmin)
    }
  )

  .delete(
    '/:otherId',
    {
      params: BorealisOtherModel.otherParam,
      detail: {
        summary: 'Delete custom item',
        tags: ['Borealis - Other'],
      },
      response: {
        200: BorealisOtherModel.deleteResponse,
        403: BorealisOtherModel.forbiddenError,
        404: BorealisOtherModel.notFoundError,
        409: BorealisOtherModel.conflictError,
      },
    },
    async ({ session: userSession, params: { otherId } }) => {
      const user = userSession.requireUser()
      const isAdmin = hasPermission(user.permissions, IRISFlags.ADMINISTRATOR)
      return await BorealisOtherServ.deleteItem(user.id, otherId, isAdmin)
    }
  )

  .post(
    '/:otherId/fork',
    {
      params: BorealisOtherModel.otherParam,
      detail: {
        summary: 'Fork a custom item into a personal private copy',
        tags: ['Borealis - Other'],
      },
      response: {
        200: BorealisOtherModel.forkResponse,
        403: BorealisOtherModel.forbiddenError,
        404: BorealisOtherModel.notFoundError,
      },
    },
    async ({ session: userSession, params: { otherId } }) => {
      const user = userSession.requireUser()
      const isAdmin = hasPermission(user.permissions, IRISFlags.ADMINISTRATOR)
      return await BorealisOtherServ.forkItem(user.id, otherId, isAdmin)
    }
  )

const routes3 = new Elysia()
  .use(session())

  .get(
    '/:otherId/similar',
    {
      params: BorealisOtherModel.otherParam,
      query: BorealisOtherModel.similarQuery,
      detail: { summary: 'Get similar published custom items', tags: ['Borealis - Other'] },
      response: { 200: BorealisOtherModel.similarResponse, 404: BorealisOtherModel.notFoundError },
    },
    async ({ params: { otherId }, query }) => {
      return await BorealisOtherServ.getSimilar(otherId, query.limit ?? 24)
    }
  )

  .get(
    '/:otherId/relations',
    {
      params: BorealisOtherModel.otherParam,
      detail: { summary: 'Get one-way media relations', tags: ['Borealis - Other'] },
      response: { 200: BorealisOtherModel.relationsResponse, 404: BorealisOtherModel.notFoundError },
    },
    async ({ params: { otherId } }) => {
      return await BorealisOtherServ.getRelations(otherId)
    }
  )

  .get(
    '/:otherId/characters',
    {
      params: BorealisOtherModel.otherParam,
      detail: { summary: 'Get linked characters', tags: ['Borealis - Other'] },
      response: { 200: BorealisOtherModel.charactersResponse, 404: BorealisOtherModel.notFoundError },
    },
    async ({ params: { otherId } }) => {
      return await BorealisOtherServ.getCharacters(otherId)
    }
  )

  .get(
    '/:otherId/staff',
    {
      params: BorealisOtherModel.otherParam,
      detail: { summary: 'Get linked staff', tags: ['Borealis - Other'] },
      response: { 200: BorealisOtherModel.staffResponse, 404: BorealisOtherModel.notFoundError },
    },
    async ({ params: { otherId } }) => {
      return await BorealisOtherServ.getStaff(otherId)
    }
  )

  .get(
    '/:otherId/episodes',
    {
      params: BorealisOtherModel.otherParam,
      detail: { summary: 'Get custom item episodes', tags: ['Borealis - Other'] },
      response: { 200: BorealisOtherModel.episodesResponse, 404: BorealisOtherModel.notFoundError },
    },
    async ({ params: { otherId } }) => {
      return await BorealisOtherServ.getEpisodes(otherId)
    }
  )

  .get(
    '/:otherId/seasons',
    {
      params: BorealisOtherModel.otherParam,
      detail: { summary: 'Get custom item seasons', tags: ['Borealis - Other'] },
      response: { 200: BorealisOtherModel.seasonsResponse, 404: BorealisOtherModel.notFoundError },
    },
    async ({ params: { otherId } }) => {
      return await BorealisOtherServ.getSeasons(otherId)
    }
  )

  .get(
    '/:otherId/images',
    {
      params: BorealisOtherModel.otherParam,
      detail: { summary: 'Get custom item images', tags: ['Borealis - Other'] },
      response: { 200: BorealisOtherModel.imagesResponse, 404: BorealisOtherModel.notFoundError },
    },
    async ({ params: { otherId } }) => {
      return await BorealisOtherServ.getImages(otherId)
    }
  )

const routes4 = new Elysia()
  .use(session())

  .get(
    '/:otherId/stats',
    {
      params: BorealisOtherModel.otherParam,
      detail: { summary: 'Get stats for this custom item', tags: ['Borealis - Other'] },
      response: { 200: BorealisOtherModel.statsResponse, 404: BorealisOtherModel.notFoundError },
    },
    async ({ params: { otherId } }) => {
      return await BorealisOtherServ.getStats(otherId)
    }
  )

  .get(
    '/:otherId/friends',
    {
      params: BorealisOtherModel.otherParam,
      query: BorealisOtherModel.friendsQuery,
      detail: { summary: 'Get friends tracking this custom item', tags: ['Borealis - Other'] },
      response: { 200: BorealisOtherModel.friendsResponse, 404: BorealisOtherModel.notFoundError },
    },
    async ({ params: { otherId }, session: userSession, query }) => {
      const user = userSession.getUser()
      return await BorealisOtherServ.getFriends(otherId, user?.id, query)
    }
  )

  .get(
    '/:otherId/people',
    {
      params: BorealisOtherModel.otherParam,
      query: BorealisOtherModel.peopleQuery,
      detail: { summary: 'Get all public users tracking this custom item', tags: ['Borealis - Other'] },
      response: { 200: BorealisOtherModel.peopleResponse, 404: BorealisOtherModel.notFoundError },
    },
    async ({ params: { otherId }, query }) => {
      return await BorealisOtherServ.getPeople(otherId, query)
    }
  )

  .get(
    '/:otherId/recommendations',
    {
      params: BorealisOtherModel.otherParam,
      detail: { summary: 'Get recommendations for this custom item', tags: ['Borealis - Other'] },
      response: { 200: BorealisOtherModel.recommendationsResponse, 404: BorealisOtherModel.notFoundError },
    },
    async ({ params: { otherId } }) => {
      return await BorealisOtherServ.getRecommendations(otherId)
    }
  )

export const borealisOther = new Elysia({ prefix: '/borealis/other' })
  .use(routes1)
  .use(routes2)
  .use(routes3)
  .use(routes4)

export default borealisOther
