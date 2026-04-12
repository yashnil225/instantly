import { prisma } from '@/lib/prisma'

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
                warmupRepliedToday: 0,
                lastWarmupSentAt: null // Clear timestamp for new day
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

        // Resume campaigns paused due to daily limits
        const pausedCampaigns = await prisma.campaign.findMany({
            where: { status: 'paused' }
        })

        let resumedCount = 0
        const now = new Date()

        for (const campaign of pausedCampaigns) {
            try {
                if (!campaign.settings) continue
                const settings = JSON.parse(campaign.settings)
                
                if (settings.autoResumeAt && new Date(settings.autoResumeAt) <= now) {
                    // Clear auto-resume fields and resume
                    const newSettings = { ...settings }
                    delete newSettings.autoResumeAt
                    delete newSettings.autoResumeReason

                    await prisma.campaign.update({
                        where: { id: campaign.id },
                        data: {
                            status: 'active',
                            settings: JSON.stringify(newSettings)
                        }
                    })
                    resumedCount++
                }
            } catch (e) {
                console.error(`[Daily Reset] Failed to auto-resume campaign ${campaign.id}:`, e)
            }
        }
        console.log(`[Daily Reset] Auto-resumed ${resumedCount} campaigns`)

        const elapsed = Date.now() - startTime
        console.log(`[Daily Reset] Completed in ${elapsed}ms`)

        return {
            success: true,
            accountsReset: accountResult.count,
            warmupIncremented: warmupResult.count,
            errorsCleared: errorClearResult.count,
            campaignsResumed: resumedCount,
            elapsedMs: elapsed
        }
    } catch (error) {
        console.error('[Daily Reset] Failed:', error)
        throw error
    }
}

/**
 * Starts the daily reset job and schedules it to run every 24 hours.
 */
export function startDailyResetJob() {
    console.log('[Daily Reset] Initializing daily reset job...')

    // Run immediately on start
    runDailyReset().catch(err => console.error('[Daily Reset] Initial run failed:', err))

    // Then run every 24 hours
    const interval = 24 * 60 * 60 * 1000
    const timer = setInterval(async () => {
        try {
            await runDailyReset()
        } catch (err) {
            console.error('[Daily Reset] Scheduled run failed:', err)
        }
    }, interval)

    return () => clearInterval(timer)
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
