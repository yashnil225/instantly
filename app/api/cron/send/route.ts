import { NextResponse } from 'next/server'
import { processBatch } from '@/lib/sender'

export const dynamic = 'force-dynamic' // Prevent caching

export async function GET() {
    try {
        const result = await processBatch()
        return NextResponse.json({ success: true, ...result })
    } catch (error) {
        console.error("Cron Job Failed", error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
