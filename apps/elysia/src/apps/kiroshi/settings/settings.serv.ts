import { prisma } from '@NamelessLiberty/db'
import { BaseService } from '../../../core/base/base.serv'
import { NotFound } from '../../../core/errors/http-errors'

/**
 * Service managing Kiroshi search engine user preferences.
 */
export class KiroshiSettingsService extends BaseService {
  constructor() {
    super('Kiroshi:Settings')
  }

  /**
   * Retrieves search engine settings and preferences for the user.
   */
  public async getSettings(userId: string) {
    // Step 1: Load user JSON settings from PostgreSQL
    const dbUser = await prisma.orm.public.User
      .select('settings')
      .first({ id: userId })

    if (!dbUser) {
      throw new NotFound('User not found.')
    }

    // Step 2: Normalize search settings with historyEnabled defaulting to true
    const rawSettings = (dbUser.settings as Record<string, any>) || {}
    const searchSettings = rawSettings.search || {}

    return {
      success: true,
      settings: {
        historyEnabled: searchSettings.historyEnabled !== false,
      },
    }
  }

  /**
   * Updates search engine settings and preferences for the user.
   */
  public async updateSettings(userId: string, body: { historyEnabled: boolean }) {
    // Step 1: Load current user settings object
    const dbUser = await prisma.orm.public.User
      .select('settings')
      .first({ id: userId })

    if (!dbUser) {
      throw new NotFound('User not found.')
    }

    // Step 2: Merge updated search.historyEnabled flag without clobbering unrelated settings
    const rawSettings = (dbUser.settings as Record<string, any>) || {}
    const updatedSettings = {
      ...rawSettings,
      search: {
        ...(rawSettings.search || {}),
        historyEnabled: body.historyEnabled,
      },
    }

    await prisma.orm.public.User.where({ id: userId }).update({
      settings: updatedSettings,
    })

    return {
      success: true,
      settings: {
        historyEnabled: body.historyEnabled,
      },
    }
  }
}

export const kiroshiSettingsServ = new KiroshiSettingsService()

/**
 * Static facade preserving legacy callers.
 */
export abstract class KiroshiSettingsServ {
  static async getSettings(userId: string) {
    return await kiroshiSettingsServ.getSettings(userId)
  }

  static async updateSettings(userId: string, body: { historyEnabled: boolean }) {
    return await kiroshiSettingsServ.updateSettings(userId, body)
  }
}
