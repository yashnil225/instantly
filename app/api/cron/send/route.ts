import { NextResponse } from 'next/server'
import { processBatch } from '@/lib/sender'
import { waitUntil } from '@vercel/functions'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Hobby plan hard limit

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production') {
        const secret = process.env.CRON_SECRET || process.env.AUTHORIZATION
        const isValid = authHeader === `Bearer ${secret}` || authHeader === secret
        if (!isValid) {
            return new Response('Unauthorized', { status: 401 })
        }
    }

    // Respond IMMEDIATELY so cron-job.org (30s timeout) doesn't kill the connection.
    // waitUntil keeps the Vercel function alive for up to maxDuration in the background.
    const batchWithCeiling = async () => {
        const batchPromise = processBatch().catch(err => console.error('[cron/send] processBatch failed:', err))
        const ceilingPromise = new Promise<void>((resolve) =>
            setTimeout(() => {
                console.warn('[cron/send] Hard 22s ceiling reached, yielding batch safely')
                resolve()
            }, 22000)
        )
        await Promise.race([batchPromise, ceilingPromise])
    }

    waitUntil(batchWithCeiling())

    return NextResponse.json({ success: true, message: 'Email send batch started in background' })
}
