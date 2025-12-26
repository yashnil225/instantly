import { NextResponse } from 'next/server'
import { processReminders } from '@/lib/reminder-service'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const result = await processReminders()
        return NextResponse.json({ success: true, ...result })
    } catch (error) {
        console.error("Cron Job Failed", error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
