import { Worker, Queue } from 'bullmq'
import { sendWarmupEmails, resetDailyCounters } from './warmup'

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
}

// Create queue for warmup jobs
export const warmupQueue = new Queue('warmup', { connection })

// Worker to process warmup jobs
export const warmupWorker = new Worker('warmup', async (job) => {
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

// Schedule warmup emails every hour
export async function startWarmupScheduler() {
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

warmupWorker.on('completed', (job) => {
    console.log(`Warmup job ${job.id} completed`)
})

warmupWorker.on('failed', (job, err) => {
    console.log(`Warmup job ${job?.id} failed: ${err.message}`)
})
