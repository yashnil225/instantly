import { startCronJobs } from '@/lib/cron-scheduler'

export async function register() {
    // skip during build
    if (process.env.NEXT_PHASE === 'phase-production-build') return

    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Automatically start background jobs (Sent, Warmup, Reminders).
        // In Vercel serverless, these will run on cold starts but are primarily
        // designed for local development or long-running environments.
        startCronJobs()
    }
}
