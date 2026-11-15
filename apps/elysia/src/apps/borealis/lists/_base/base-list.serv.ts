import { BaseService } from '../../../../core/base/base.serv'
import { assertSafeExternalUrl } from '../../../../core/utils/network'

/**
 * Abstract base service for Borealis user list CRUD, sync, and import/export workflows.
 */
export abstract class BaseBorealisListService extends BaseService {
  protected constructor(loggerName = 'BorealisListsServ') {
    super(loggerName)
  }

  /**
   * Validates an external import/export URL against private IP / localhost SSRF targets.
   */
  protected static async validateRemoteImportUrl(rawUrl: string): Promise<URL> {
    return await assertSafeExternalUrl(rawUrl)
  }
}
