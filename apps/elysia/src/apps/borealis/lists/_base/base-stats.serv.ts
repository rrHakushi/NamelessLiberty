import { BaseService } from '../../../../core/base/base.serv'

/**
 * Abstract base service for Borealis user media statistics aggregation.
 */
export abstract class BaseMediaStatsService extends BaseService {
  protected constructor(loggerName = 'UserMediaStatsServ') {
    super(loggerName)
  }
}
