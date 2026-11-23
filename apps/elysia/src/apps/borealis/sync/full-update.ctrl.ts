import { Elysia } from 'elysia'
import { hasPermission, IRISFlags } from '@NamelessLiberty/permissions'
import { session } from '../../../core/plugins/session'
import { Forbidden } from '../../../core/errors/http-errors'
import { BorealisFullUpdateModel } from './full-update.model'
import { BorealisFullUpdateServ } from './full-update.serv'

export const borealisFullUpdate = new Elysia({
  prefix: '/borealis/admin/media-update',
})
  .use(session())

  .get(
    '/status',
    {
      detail: {
        summary: 'Get live full media update progress (Admin only)',
        description:
          'Returns the current status, per-media-type progress, current item, and recent logs for the sequential full media update.',
        tags: ['Borealis - Admin'],
      },
      response: {
        200: BorealisFullUpdateModel.statusResponse,
      },
    },
    async ({ session: userSession }) => {
      const user = userSession.requireUser()
      if (!hasPermission(user.permissions, IRISFlags.ADMINISTRATOR)) {
        throw new Forbidden('Administrator permission required')
      }

      return {
        success: true,
        progress: BorealisFullUpdateServ.getStatus(),
      }
    }
  )

  .post(
    '/start',
    {
      body: BorealisFullUpdateModel.startBody,
      detail: {
        summary: 'Start sequential full media update (Admin only)',
        description:
          'Starts an in-process sequential metadata update across books, games, tv, movies, manga, and anime.',
        tags: ['Borealis - Admin'],
      },
      response: {
        200: BorealisFullUpdateModel.startResponse,
      },
    },
    async ({ session: userSession, body }) => {
      const user = userSession.requireUser()
      if (!hasPermission(user.permissions, IRISFlags.ADMINISTRATOR)) {
        throw new Forbidden('Administrator permission required')
      }

      const result = BorealisFullUpdateServ.start(
        user.username || user.id,
        body?.only && body.only.length > 0 ? { only: body.only } : undefined
      )

      return {
        success: true,
        started: result.started,
        progress: result.status,
      }
    }
  )

  .post(
    '/cancel',
    {
      detail: {
        summary: 'Cancel active full media update (Admin only)',
        description:
          'Requests a graceful stop of the active full media update after the current item finishes.',
        tags: ['Borealis - Admin'],
      },
      response: {
        200: BorealisFullUpdateModel.cancelResponse,
      },
    },
    async ({ session: userSession }) => {
      const user = userSession.requireUser()
      if (!hasPermission(user.permissions, IRISFlags.ADMINISTRATOR)) {
        throw new Forbidden('Administrator permission required')
      }

      const result = BorealisFullUpdateServ.cancel()

      return {
        success: true,
        cancelled: result.cancelled,
        progress: result.status,
      }
    }
  )
