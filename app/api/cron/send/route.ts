import { NextResponse } from 'next/server'
import { processBatch } from '@/lib/sender'

export const dynamic = 'force-dynamic' // Prevent caching

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production') {
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response('Unauthorized', { status: 401 })
        }
    }

    try {
        const result = await processBatch()
        return NextResponse.json({ success: true, ...result })
    } catch (error) {
        console.error("Cron Job Failed", error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
