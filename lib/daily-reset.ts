import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Daily Reset Job
 * Resets the sentToday counter for all email accounts at midnight.
 * Also resets warmup counters.
 * 
 * This should be run via a cron job or scheduled task at 00:00 daily.
 * Example cron: 0 0 * * * node dist/lib/daily-reset.js
 * 
 * For development, you can call the API route: POST /api/cron/daily-reset
 */
export async function runDailyReset() {
    console.log('[Daily Reset] Starting daily reset job...')
    const startTime = Date.now()

    try {
        // Reset sentToday for all email accounts
        const accountResult = await prisma.emailAccount.updateMany({
            data: {
                sentToday: 0,
                warmupSentToday: 0,
                warmupRepliedToday: 0
            }
        })
        console.log(`[Daily Reset] Reset sentToday for ${accountResult.count} accounts`)

        // Increment warmup day for accounts with warmup enabled
        const warmupResult = await prisma.emailAccount.updateMany({
            where: { warmupEnabled: true },
            data: {
                warmupCurrentDay: { increment: 1 }
            }
        })
        console.log(`[Daily Reset] Incremented warmup day for ${warmupResult.count} accounts`)

        // Clear any temporary error states that are older than 24 hours
        // (This gives time for transient issues to resolve)
        const errorClearResult = await prisma.emailAccount.updateMany({
            where: {
                status: 'error',
                updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            },
            data: {
                status: 'active',
                errorDetail: null
            }
        })
        console.log(`[Daily Reset] Cleared ${errorClearResult.count} stale error states`)

        const elapsed = Date.now() - startTime
        console.log(`[Daily Reset] Completed in ${elapsed}ms`)

        return {
            success: true,
            accountsReset: accountResult.count,
            warmupIncremented: warmupResult.count,
            errorsCleared: errorClearResult.count,
            elapsedMs: elapsed
        }
    } catch (error) {
        console.error('[Daily Reset] Failed:', error)
        throw error
    }
}

// Run if called directly
if (require.main === module) {
    runDailyReset()
        .then((result) => {
            console.log('[Daily Reset] Result:', result)
            process.exit(0)
        })
        .catch((error) => {
            console.error('[Daily Reset] Error:', error)
            process.exit(1)
        })
}
