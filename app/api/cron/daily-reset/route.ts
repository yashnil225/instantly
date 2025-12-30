import { NextResponse } from 'next/server'
import { runDailyReset } from '@/lib/daily-reset'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production') {
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response('Unauthorized', { status: 401 })
        }
    }

    console.log('[Cron] Starting daily reset...')

    try {
        const result = await runDailyReset()
        return NextResponse.json({
            success: true,
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
