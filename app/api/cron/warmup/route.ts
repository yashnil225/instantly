import { NextResponse } from 'next/server'
import { sendWarmupEmails } from '@/lib/warmup'
import { processWarmupMaintenance } from '@/lib/warmup-detection'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production') {
        const secret = process.env.CRON_SECRET || process.env.AUTHORIZATION
        const isValid = authHeader === `Bearer ${secret}` || authHeader === secret
        if (!isValid) {
            return new Response('Unauthorized', { status: 401 })
        }
    }

    console.log('[Cron] Starting warmup tasks (sending + maintenance)...')

    try {
        // 1. Send new warmup emails
        await sendWarmupEmails()

        // 2. Run maintenance (Spam rescue + Auto-replies)
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
