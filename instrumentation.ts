export async function register() {
    // skip during build
    if (process.env.NEXT_PHASE === 'phase-production-build') return

    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // NOTE: In Vercel serverless environment, we use API routes triggered by external crons
        // instead of persistent workers to avoid Redis connection errors and timeout issues.
        // startCronJobs() 
        // startWorker()
    }
}
