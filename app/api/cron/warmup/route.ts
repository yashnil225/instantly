import { NextResponse } from 'next/server'
import { sendWarmupEmails } from '@/lib/warmup'
import { runPoolWarmupCycle } from '@/lib/warmup-pool'
import { processWarmupMaintenance } from '@/lib/warmup-detection'
import { createTimeoutGuard } from '@/lib/timeout-guard'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // Set max duration for Vercel

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production') {
        const secret = process.env.CRON_SECRET || process.env.AUTHORIZATION
        const isValid = authHeader === `Bearer ${secret}` || authHeader === secret
        if (!isValid) {
            return new Response('Unauthorized', { status: 401 })
        }
    }

    console.log('[Cron] Starting warmup tasks (sending + pool + maintenance)...')
    const guard = createTimeoutGuard(240_000) // 240s safety margin
    const results: Record<string, any> = {}

    try {
        // 1. Send system warmup emails (internal peer-to-peer)
        await sendWarmupEmails(guard)
        results.warmupSent = true

        // 2. Run Pool Warmup Cycle (cross-domain exchange)
        if (!guard.isTimedOut()) {
            const poolResults = await runPoolWarmupCycle(guard)
            console.log(`[Cron] Pool Warmup: Sent ${poolResults.sent}, Errors ${poolResults.errors}`)
            results.pool = poolResults
        } else {
            console.warn(`[Cron] Skipping pool warmup — approaching timeout (${guard.elapsedSec()}s)`)
            results.pool = { skipped: true }
        }

        // 3. Run maintenance (Spam rescue + Auto-replies)
        if (!guard.isTimedOut()) {
            const maintenanceResult = await processWarmupMaintenance()
            results.maintenance = maintenanceResult
        } else {
            console.warn(`[Cron] Skipping maintenance — approaching timeout (${guard.elapsedSec()}s)`)
            results.maintenance = { skipped: true }
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            elapsedSeconds: guard.elapsedSec(),
            ...results
        })
    } catch (error: any) {
        console.error('[Cron] Warmup failed:', error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
