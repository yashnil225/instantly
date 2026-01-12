export async function register() {
    // skip during build
    if (process.env.NEXT_PHASE === 'phase-production-build') return

    // NOTE: Cron jobs are triggered externally via cron-job.org
    // which calls /api/cron/send, /api/cron/warmup, etc.
    // No local scheduler needed.
}
