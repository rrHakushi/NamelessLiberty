import { Queue, QueueEvents, type JobsOptions, type RepeatOptions } from 'bullmq'
import { LogFactory } from '@NamelessLiberty/logger'
import { attachBullMQErrorHandler, getBullMQConnectionOptions } from './redis'

export interface BaseQueueConfig {
  queueName: string
  defaultJobOptions?: JobsOptions
}

/**
 * Abstract base class for BullMQ queues.
 * Centralizes lazy Queue/QueueEvents initialization, exponential backoff defaults,
 * bounded job retention, and repeatable schedule registration.
 */
export abstract class BaseBullMQQueue<TData = unknown, TResult = unknown> {
  protected readonly logger: LogFactory
  public readonly queueName: string
  protected readonly defaultJobOptions: JobsOptions

  private _queue: Queue<TData, TResult> | null = null
  private _events: QueueEvents | null = null

  protected constructor(config: BaseQueueConfig) {
    this.queueName = config.queueName
    this.logger = new LogFactory(`BullMQ:Queue:${config.queueName}`)
    this.defaultJobOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: { count: 200, age: 86400 },
      removeOnFail: { count: 500, age: 86400 * 7 },
      ...config.defaultJobOptions,
    }
  }

  /**
   * Returns (and lazily initializes) the underlying BullMQ `Queue` instance.
   */
  public getQueue(): Queue<TData, TResult> {
    // Step 1: Return cached singleton Queue when already initialized
    if (this._queue) return this._queue

    // Step 2: Construct Queue with BullMQ-safe Redis options and error listener
    this._queue = new Queue<TData, TResult>(this.queueName, {
      connection: getBullMQConnectionOptions(),
      defaultJobOptions: this.defaultJobOptions,
    })
    attachBullMQErrorHandler(this._queue, `Queue:${this.queueName}`)
    return this._queue
  }

  /**
   * Returns (and lazily initializes) a `QueueEvents` listener for job telemetry.
   */
  public getQueueEvents(): QueueEvents {
    // Step 1: Return cached QueueEvents instance if already created
    if (this._events) return this._events

    // Step 2: Create dedicated QueueEvents connection and wire error handler
    this._events = new QueueEvents(this.queueName, {
      connection: getBullMQConnectionOptions(),
    })
    attachBullMQErrorHandler(this._events, `QueueEvents:${this.queueName}`)
    return this._events
  }

  /**
   * Enqueues a single job with merged default options.
   */
  protected async enqueue(name: string, data: TData, opts?: JobsOptions) {
    // Step 1: Delegate to BullMQ Queue.add with queue-wide defaults
    return await this.getQueue().add(name as any, data as any, {
      ...this.defaultJobOptions,
      ...opts,
    })
  }

  /**
   * Registers or updates an idempotent repeatable/cron job with explicit timezone support.
   */
  protected async upsertRepeatable(
    jobId: string,
    name: string,
    data: TData,
    repeat: RepeatOptions,
    opts?: JobsOptions
  ) {
    // Step 1: Normalize timezone default to UTC for deterministic cluster scheduling
    const normalizedRepeat: RepeatOptions = {
      tz: 'UTC',
      ...repeat,
    }

    // Step 2: Register repeatable job with deterministic jobId
    return await this.getQueue().add(name as any, data as any, {
      ...this.defaultJobOptions,
      ...opts,
      jobId,
      repeat: normalizedRepeat,
    } as any)
  }

  /**
   * Gracefully closes the Queue and QueueEvents connections.
   */
  public async close(): Promise<void> {
    // Step 1: Close QueueEvents first, then Queue
    if (this._events) {
      await this._events.close().catch(() => {})
      this._events = null
    }
    if (this._queue) {
      await this._queue.close().catch(() => {})
      this._queue = null
    }
  }
}
