import { processBatch } from '@/lib/sender'
import { processReminders } from '@/lib/reminder-service'
import { sendWarmupEmails } from '@/lib/warmup'
import { runPoolWarmupCycle } from '@/lib/warmup-pool'
import { processWarmupMaintenance } from '@/lib/warmup-detection'

let isRunning = false

export function startCronJobs() {
    if (isRunning) return
    if (process.env.NEXT_RUNTIME !== 'nodejs') return
    
    isRunning = true

    console.log('[Scheduler] Starting background jobs...')

    // Run immediately on start (with a small delay for DB readiness)
    setTimeout(runJobs, 5000)

    // Then runs every 5 minutes (standard warmup/send interval to avoid overloading)
    setInterval(runJobs, 5 * 60 * 1000)
}

async function runJobs() {
    try {
        console.log('[Scheduler] Running scheduled tasks...')

        // 1. Process Campaigns
        try {
            const campaignResult = await processBatch()
            console.log(`[Scheduler] Campaigns: Sent ${campaignResult.totalSent}, Errors ${campaignResult.errors}`)
        } catch (e) {
            console.error('[Scheduler] Campaign processing failed', e)
        }

        // 2. Process Warmup
        try {
            await sendWarmupEmails()
            await runPoolWarmupCycle()
            await processWarmupMaintenance()
            console.log(`[Scheduler] Warmup tasks completed`)
        } catch (e) {
            console.error('[Scheduler] Warmup processing failed', e)
        }

        // 3. Process Reminders
        try {
            const reminderResult = await processReminders()
            console.log(`[Scheduler] Reminders: Processed ${reminderResult.processed}`)
        } catch (e) {
            console.error('[Scheduler] Reminder processing failed', e)
        }

    } catch (error) {
        console.error('[Scheduler] Job execution failed', error)
    }
}
