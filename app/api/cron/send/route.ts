import { NextResponse } from 'next/server'
import { processBatch } from '@/lib/sender'

export const dynamic = 'force-dynamic' // Prevent caching
export const maxDuration = 60 // Max timeout in seconds (requires Vercel Pro for > 10s)

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
        const result = await processBatch()
        return NextResponse.json({ success: true, ...result })
    } catch (error) {
        console.error("Cron Job Failed", error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
