import { Worker, Queue } from 'bullmq'
import { sendWarmupEmails, resetDailyCounters } from './warmup'

const getRedisConnection = () => {
    const redisUrl = process.env.REDIS_URL
    const isProduction = process.env.NODE_ENV === 'production'

    if (isProduction && !redisUrl) return null

    return redisUrl ? redisUrl : {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    }
}

const connection = getRedisConnection() as any

// Create queue for warmup jobs
let warmupQueue: Queue | null = null
if (connection) {
    try {
        warmupQueue = new Queue('warmup', { connection })
        warmupQueue.on('error', (err) => console.warn('[WarmupQueue] Redis connection error:', err.message))
    } catch (e: any) {
        console.warn('[WarmupQueue] Could not initialize (Redis missing?):', e.message)
    }
}

// Worker to process warmup jobs
let warmupWorker: Worker | null = null
if (connection) {
    try {
        warmupWorker = new Worker('warmup', async (job) => {
            console.log(`Processing warmup job ${job.id}: ${job.name}`)

            try {
                if (job.name === 'send-warmup-emails') {
                    await sendWarmupEmails()
                } else if (job.name === 'reset-daily-counters') {
                    await resetDailyCounters()
                }
                console.log(`Warmup job ${job.name} completed`)
            } catch (error) {
                console.error(`Warmup job ${job.name} failed:`, error)
                throw error
            }
        }, { connection })
        warmupWorker.on('error', (err) => console.warn('[WarmupWorker] Redis connection error:', err.message))
    } catch (e: any) {
        console.warn('[WarmupWorker] Could not initialize (Redis missing?):', e.message)
    }
}

export { warmupQueue, warmupWorker }

// Schedule warmup emails every hour
export async function startWarmupScheduler() {
    if (!warmupQueue) {
        console.warn('Warmup scheduler skipped (Redis missing)')
        return
    }
    // Send warmup emails every hour
    await warmupQueue.add(
        'send-warmup-emails',
        {},
        {
            repeat: {
                every: 3600000 // 1 hour
            }
        }
    )

    // Reset daily counters at midnight
    await warmupQueue.add(
        'reset-daily-counters',
        {},
        {
            repeat: {
                pattern: '0 0 * * *' // Cron: Every day at midnight
            }
        }
    )

    console.log('Warmup scheduler started')
}

if (warmupWorker) {
    warmupWorker.on('completed', (job) => {
        console.log(`Warmup job ${job.id} completed`)
    })

    warmupWorker.on('failed', (job, err) => {
        console.log(`Warmup job ${job?.id} failed: ${err.message}`)
    })
}
