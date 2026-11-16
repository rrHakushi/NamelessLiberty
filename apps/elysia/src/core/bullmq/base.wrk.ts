import { Worker, type Job, type WorkerOptions } from 'bullmq'
import { LogFactory } from '@NamelessLiberty/logger'
import { attachBullMQErrorHandler, getBullMQConnectionOptions } from './redis'
import { BullMQRegistry } from './registry'

export interface BaseWorkerConfig {
  queueName: string
  concurrency?: number
  limiter?: WorkerOptions['limiter']
  lockDuration?: number
  stalledInterval?: number
  maxStalledCount?: number
}

/**
 * Abstract base class for BullMQ workers.
 * Provides standardized lifecycle management, `active`/`completed`/`failed`/`stalled`/`error`
 * instrumentation, and coordinated graceful shutdown via `BullMQRegistry`.
 */
export abstract class BaseBullMQWorker<TData = unknown, TResult = unknown> {
  protected readonly logger: LogFactory
  public readonly queueName: string
  protected readonly config: BaseWorkerConfig

  private _worker: Worker<TData, TResult> | null = null

  protected constructor(config: BaseWorkerConfig) {
    this.queueName = config.queueName
    this.config = config
    this.logger = new LogFactory(`BullMQ:Worker:${config.queueName}`)
  }

  /**
   * Subclasses implement domain job execution logic here.
   */
  protected abstract processJob(job: Job<TData, TResult>): Promise<TResult>

  /**
   * Starts the BullMQ Worker if not already running and registers it for shutdown.
   */
  public start(): Worker<TData, TResult> {
    // Step 1: Reuse existing worker instance when already active
    if (this._worker) return this._worker

    // Step 2: Instantiate Worker with BullMQ-compliant Redis config & concurrency limits
    this._worker = new Worker<TData, TResult>(
      this.queueName,
      async (job) => await this.processJob(job),
      {
        connection: getBullMQConnectionOptions(),
        concurrency: this.config.concurrency ?? 2,
        ...(this.config.limiter ? { limiter: this.config.limiter } : {}),
        ...(this.config.lockDuration ? { lockDuration: this.config.lockDuration } : {}),
        ...(this.config.stalledInterval ? { stalledInterval: this.config.stalledInterval } : {}),
        ...(this.config.maxStalledCount ? { maxStalledCount: this.config.maxStalledCount } : {}),
      }
    )

    // Step 3: Attach required lifecycle and failure listeners
    attachBullMQErrorHandler(this._worker, `Worker:${this.queueName}`)

    this._worker.on('completed', (job) => {
      this.logger.info(`Job ${job.id} (${job.name}) completed`)
    })

    this._worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id ?? 'unknown'} (${job?.name ?? 'unknown'}) failed:`, err)
    })

    this._worker.on('stalled', (jobId) => {
      this.logger.warn(`Job ${jobId} stalled and will be reprocessed`)
    })

    // Step 4: Register worker with central cluster-primary coordinator
    BullMQRegistry.registerWorker(this)
    this.logger.info(`Worker started (concurrency=${this.config.concurrency ?? 2})`)

    return this._worker
  }

  /**
   * Returns true if the worker is currently instantiated.
   */
  public isRunning(): boolean {
    return this._worker !== null
  }

  /**
   * Gracefully pauses intake and drains in-flight jobs before closing the Redis connection.
   */
  public async shutdown(): Promise<void> {
    // Step 1: Exit early if worker was never started
    if (!this._worker) return

    const worker = this._worker
    this._worker = null

    try {
      // Step 2: Pause new job fetching and close cleanly
      await worker.pause().catch(() => {})
      await worker.close()
      this.logger.info('Worker shut down cleanly')
    } catch (err) {
      this.logger.error('Error while closing worker:', err)
    }
  }
}
