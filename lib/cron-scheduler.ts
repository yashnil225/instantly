import { processBatch } from '@/lib/sender'
import { processReminders } from '@/lib/reminder-service'

let isRunning = false

export function startCronJobs() {
    if (isRunning) return
    isRunning = true

    console.log('[Scheduler] Starting background jobs...')

    // Run immediately on start
    runJobs()

    // Then runs every 60 seconds
    setInterval(runJobs, 60000)
}

async function runJobs() {
    try {
        console.log('[Scheduler] Running batch processing...')

        // 1. Process Campaigns
        try {
            const campaignResult = await processBatch()
            if (campaignResult.totalSent > 0 || campaignResult.errors > 0) {
                console.log(`[Scheduler] Campaigns: Sent ${campaignResult.totalSent}, Errors ${campaignResult.errors}`)
            }
        } catch (e) {
            console.error('[Scheduler] Campaign processing failed', e)
        }

        // 2. Process Reminders
        try {
            const reminderResult = await processReminders()
            if (reminderResult.processed > 0 || reminderResult.errors > 0) {
                console.log(`[Scheduler] Reminders: Sent ${reminderResult.processed}, Errors ${reminderResult.errors}`)
            }
        } catch (e) {
            console.error('[Scheduler] Reminder processing failed', e)
        }

    } catch (error) {
        console.error('[Scheduler] Job execution failed', error)
    }
}
