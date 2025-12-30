import { Worker, Queue } from 'bullmq'
import { syncAllAccounts } from './imap-sync'

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

// Create queue for scheduling sync jobs
let syncQueue: Queue | null = null
if (connection) {
    try {
        syncQueue = new Queue('imap-sync', { connection })
        syncQueue.on('error', (err) => console.warn('[SyncQueue] Redis connection error:', err.message))
    } catch (e: any) {
        console.warn('[SyncQueue] Could not initialize (Redis missing?):', e.message)
    }
}

// Worker to process sync jobs
let syncWorker: Worker | null = null
if (connection) {
    try {
        syncWorker = new Worker('imap-sync', async (job) => {
            console.log(`Processing IMAP sync job ${job.id}`)

            try {
                await syncAllAccounts()
                console.log('IMAP sync completed successfully')
            } catch (error) {
                console.error('IMAP sync failed:', error)
                throw error
            }
        }, { connection })
        syncWorker.on('error', (err) => console.warn('[SyncWorker] Redis connection error:', err.message))
    } catch (e: any) {
        console.warn('[SyncWorker] Could not initialize (Redis missing?):', e.message)
    }
}

export { syncQueue, syncWorker }

// Schedule sync every 60 seconds
export async function startSyncScheduler() {
    if (!syncQueue) {
        console.warn('IMAP sync scheduler skipped (Redis missing)')
        return
    }
    await syncQueue.add(
        'sync-all-accounts',
        {},
        {
            repeat: {
                every: 60000 // 60 seconds
            }
        }
    )
    console.log('IMAP sync scheduler started (every 60 seconds)')
}

if (syncWorker) {
    syncWorker.on('completed', (job) => {
        console.log(`Sync job ${job.id} completed`)
    })

    syncWorker.on('failed', (job, err) => {
        console.log(`Sync job ${job?.id} failed: ${err.message}`)
    })
}
