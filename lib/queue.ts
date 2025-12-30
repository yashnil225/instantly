import { Queue, Worker, QueueEvents } from 'bullmq'

// Lazy initializing the queue to prevent connection attempts during build
let emailQueueInstance: Queue | null = null

export const getEmailQueue = () => {
    if (emailQueueInstance) return emailQueueInstance

    const redisUrl = process.env.REDIS_URL
    const isProduction = process.env.NODE_ENV === 'production'

    // In production, strictly require REDIS_URL (Upstash)
    // In local development, fallback to localhost:6379
    if (isProduction && !redisUrl) {
        console.warn('[Queue] Skipping Redis initialization: REDIS_URL missing in production.')
        return null
    }

    const connection = redisUrl ? redisUrl : {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    }

    try {
        emailQueueInstance = new Queue('email-sending', {
            connection: connection as any,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
            },
        })

        // Log connection error if it happens later
        emailQueueInstance.on('error', (err) => {
            console.warn('[Queue] Redis connection error:', err.message)
        })

    } catch (e: any) {
        console.warn('[Queue] Could not initialize BullMQ (Redis missing?):', e.message)
        emailQueueInstance = null
    }

    return emailQueueInstance
}

// For compatibility with old imports (will be initialized on first use)
export const emailQueue = {} as Queue // We will update callers to use getEmailQueue instead or proxy this


// Worker setup (should be run in a separate process or instrumentation hook)
// export const emailWorker = new Worker('email-sending', async (job) => {
//   console.log(`Processing job ${job.id} of type ${job.name}`);
//   // Call email sending logic here
// }, { connection });

// export const queueEvents = new QueueEvents('email-sending', { connection });
