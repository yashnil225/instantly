import { Worker, Queue } from 'bullmq'
import { syncAllAccounts } from './imap-sync'

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
}

// Create queue for scheduling sync jobs
export const syncQueue = new Queue('imap-sync', { connection })

// Worker to process sync jobs
export const syncWorker = new Worker('imap-sync', async (job) => {
    console.log(`Processing IMAP sync job ${job.id}`)

    try {
        await syncAllAccounts()
        console.log('IMAP sync completed successfully')
    } catch (error) {
        console.error('IMAP sync failed:', error)
        throw error
    }
}, { connection })

// Schedule sync every 60 seconds
export async function startSyncScheduler() {
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

syncWorker.on('completed', (job) => {
    console.log(`Sync job ${job.id} completed`)
})

syncWorker.on('failed', (job, err) => {
    console.log(`Sync job ${job?.id} failed: ${err.message}`)
})
