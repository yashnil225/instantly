import { NextResponse } from 'next/server'
import { syncAllAccounts } from '@/lib/imap-sync'
import { waitUntil } from '@vercel/functions'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

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
    // waitUntil keeps the Vercel function alive for up to maxDuration (300s) in the background.
    waitUntil(
        syncAllAccounts().catch(err => console.error('[sync/replies] syncAllAccounts failed:', err))
    )

    return NextResponse.json({ success: true, message: 'Reply sync started in background' })
}
