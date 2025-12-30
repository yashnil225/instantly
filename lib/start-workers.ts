import { startWorker } from './worker'
import { syncWorker, startSyncScheduler } from './reply-worker'
import { warmupWorker, startWarmupScheduler } from './warmup-worker'
import { startDailyResetJob } from './daily-reset'

async function main() {
    console.log('🚀 Starting all workers...')

    // Initialize BullMQ Workers
    startWorker()

    // Start schedulers
    await startSyncScheduler()
    await startWarmupScheduler()

    // Start daily reset job
    startDailyResetJob()

    console.log('✅ Background processes initialized!')
    console.log('📧 Email sending: READY')
    console.log('🔄 Reply sync: READY (every 60s)')
    console.log('🔥 Warmup: READY (every hour)')
    console.log('📅 Daily reset: READY (every 24h)')
    console.log('\nPress Ctrl+C to stop all workers')
}

main().catch((error) => {
    console.error('Failed to start workers:', error)
    process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n⏹️  Shutting down workers...')
    // We don't have direct access to emailWorker anymore as it's local to startWorker
    // But syncWorker and warmupWorker are exported
    if (syncWorker) await syncWorker.close()
    if (warmupWorker) await warmupWorker.close()
    console.log('✅ Processes stopped')
    process.exit(0)
})
