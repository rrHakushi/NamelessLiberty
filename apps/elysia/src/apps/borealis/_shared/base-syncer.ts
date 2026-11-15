import { LogFactory } from '@NamelessLiberty/logger'

/**
 * Abstract base class for Borealis entity and preview synchronization engines.
 */
export abstract class BaseMediaSyncer {
  protected readonly logger: LogFactory

  protected constructor(syncerName: string) {
    this.logger = new LogFactory(`Syncer:${syncerName}`)
  }
}
