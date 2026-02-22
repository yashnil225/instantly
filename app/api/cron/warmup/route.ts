import { NextResponse } from 'next/server'
import { sendWarmupEmails } from '@/lib/warmup'
import { runPoolWarmupCycle } from '@/lib/warmup-pool'
import { processWarmupMaintenance } from '@/lib/warmup-detection'
import { createTimeoutGuard } from '@/lib/timeout-guard'
import { waitUntil } from '@vercel/functions'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production') {
        const secret = process.env.CRON_SECRET || process.env.AUTHORIZATION
        const isValid = authHeader === `Bearer ${secret}` || authHeader === secret
        if (!isValid) {
            return new Response('Unauthorized', { status: 401 })
        }
    }

    // Respond IMMEDIATELY so cron-job.org (30s timeout) doesn't kill the connection.
    // waitUntil keeps the Vercel function alive for up to maxDuration (300s) in the background.
    waitUntil(runWarmupTasks())

    return NextResponse.json({ success: true, message: 'Warmup tasks started in background' })
}

async function runWarmupTasks() {
    console.log('[Warmup] Starting background warmup tasks...')
    const guard = createTimeoutGuard(240_000) // 240s safety margin

    try {
        // 1. Send system warmup emails (internal peer-to-peer)
        await sendWarmupEmails(guard)
        console.log(`[Warmup] Phase 1 done (${guard.elapsedSec()}s)`)

        // 2. Run Pool Warmup Cycle (cross-domain exchange)
        if (!guard.isTimedOut()) {
            const poolResults = await runPoolWarmupCycle(guard)
            console.log(`[Warmup] Phase 2 done — Sent ${poolResults.sent}, Errors ${poolResults.errors} (${guard.elapsedSec()}s)`)
        } else {
            console.warn(`[Warmup] Skipping pool cycle — timeout approaching (${guard.elapsedSec()}s)`)
        }

        // 3. Run maintenance (spam rescue + auto-replies)
        if (!guard.isTimedOut()) {
            await processWarmupMaintenance()
            console.log(`[Warmup] Phase 3 done (${guard.elapsedSec()}s)`)
        } else {
            console.warn(`[Warmup] Skipping maintenance — timeout approaching (${guard.elapsedSec()}s)`)
        }

        console.log(`[Warmup] All tasks completed in ${guard.elapsedSec()}s`)
    } catch (error: any) {
        console.error('[Warmup] Background task failed:', error?.message || error)
    }
}
