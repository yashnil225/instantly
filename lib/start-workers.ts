// Master worker file - starts all background workers
import { emailWorker } from './worker'
import { syncWorker, startSyncScheduler } from './reply-worker'
import { warmupWorker, startWarmupScheduler } from './warmup-worker'
import { startDailyResetJob } from './daily-reset'

async function main() {
    console.log('🚀 Starting all workers...')

    // Start schedulers
    await startSyncScheduler()
    await startWarmupScheduler()

    // Start daily reset job
    startDailyResetJob()

    console.log('✅ All workers started successfully!')
    console.log('📧 Email sending worker: ACTIVE')
    console.log('🔄 Reply sync worker: ACTIVE (every 60s)')
    console.log('🔥 Warmup worker: ACTIVE (every hour)')
    console.log('📅 Daily reset job: ACTIVE (every 24h)')
    console.log('\nPress Ctrl+C to stop all workers')
}

main().catch((error) => {
    console.error('Failed to start workers:', error)
    process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n⏹️  Shutting down workers...')
    await emailWorker.close()
    await syncWorker.close()
    await warmupWorker.close()
    console.log('✅ All workers stopped')
    process.exit(0)
})
