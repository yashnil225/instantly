import { NextResponse } from 'next/server'
import { runDailyReset } from '@/lib/daily-reset'

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

    console.log('[Cron] Starting daily reset...')

    try {
        const result = await runDailyReset()
        return NextResponse.json({
            timestamp: new Date().toISOString(),
            ...result
        })
    } catch (error: any) {
        console.error('[Cron] Daily reset failed:', error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
