import { NextResponse } from 'next/server'
import { sendWarmupEmails } from '@/lib/warmup'
import { runPoolWarmupCycle } from '@/lib/warmup-pool'
import { processWarmupMaintenance } from '@/lib/warmup-detection'

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

    try {
        // 1. Send system warmup emails (internal peer-to-peer)
        await sendWarmupEmails()

        // 2. Run Pool Warmup Cycle (cross-domain exchange)
        const poolResults = await runPoolWarmupCycle()
        console.log(`[Cron] Pool Warmup: Sent ${poolResults.sent}, Errors ${poolResults.errors}`)

        // 3. Run maintenance (Spam rescue + Auto-replies)
        const result = await processWarmupMaintenance()

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            ...result
        })
    } catch (error: any) {
        console.error('[Cron] Warmup failed:', error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
