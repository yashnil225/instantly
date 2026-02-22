import { NextResponse } from 'next/server'
import { processReminders } from '@/lib/reminder-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production') {
        const secret = process.env.CRON_SECRET || process.env.AUTHORIZATION
        const isValid = authHeader === `Bearer ${secret}` || authHeader === secret
        if (!isValid) {
            return new Response('Unauthorized', { status: 401 })
        }
    }
    try {
        const result = await processReminders()
        return NextResponse.json({ success: true, ...result })
    } catch (error) {
        console.error("Cron Job Failed", error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
