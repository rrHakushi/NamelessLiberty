import { LogFactory } from '@NamelessLiberty/logger'
import type { BaseBullMQWorker } from './base.wrk'
import type { BaseBullMQQueue } from './base.queue'

const logger = new LogFactory('BullMQ:Registry')

/**
 * Coordinates primary-only BullMQ worker startup and graceful shutdown across the cluster.
 */
export class BullMQRegistry {
  private static readonly workers = new Set<BaseBullMQWorker<any, any>>()
  private static readonly queues = new Set<BaseBullMQQueue<any, any>>()

  /**
   * Registers an active worker for coordinated shutdown.
   */
  public static registerWorker(worker: BaseBullMQWorker<any, any>): void {
    this.workers.add(worker)
  }

  /**
   * Registers a queue for coordinated shutdown.
   */
  public static registerQueue(queue: BaseBullMQQueue<any, any>): void {
    this.queues.add(queue)
  }

  /**
   * Gracefully shuts down all registered BullMQ workers and queues.
   */
  public static async shutdownAll(): Promise<void> {
    // Step 1: Pause and close all active workers in parallel
    if (this.workers.size > 0) {
      logger.info(`Shutting down ${this.workers.size} BullMQ worker(s)...`)
      await Promise.allSettled([...this.workers].map((w) => w.shutdown()))
      this.workers.clear()
    }

    // Step 2: Close all queue/event emitters cleanly
    if (this.queues.size > 0) {
      await Promise.allSettled([...this.queues].map((q) => q.close()))
      this.queues.clear()
    }
  }
}
