export async function register() {
    // skip during build
    if (process.env.NEXT_PHASE === 'phase-production-build') return

    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { startCronJobs } = await import('@/lib/cron-scheduler')
        const { startWorker } = await import('@/lib/worker')
        startCronJobs()
        startWorker()
    }
}
