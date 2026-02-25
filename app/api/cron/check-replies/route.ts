import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncAccountInbox } from '@/lib/imap-monitor'
import { createTimeoutGuard } from '@/lib/timeout-guard'
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

    // Respond IMMEDIATELY so cron-job.org doesn't kill the connection.
    waitUntil(runReplyCheck())

    return NextResponse.json({ success: true, message: 'Reply check started in background' })
}

async function runReplyCheck() {
    const guard = createTimeoutGuard(25_000) // 25s budget, 35s buffer
    console.log('[check-replies] Starting background IMAP sync...')

    try {
        // Reduced to 2 accounts per run for Hobby plan
        const accounts = await prisma.emailAccount.findMany({
            where: { status: 'active' },
            orderBy: { lastSyncedAt: 'asc' },
            take: 2
        })

        if (accounts.length === 0) {
            console.log('[check-replies] No accounts to check')
            return
        }

        let totalReplies = 0
        let totalBounces = 0

        // Process sequentially with guard checks
        for (const account of accounts) {
            if (guard.isTimedOut()) {
                console.warn(`[check-replies] Stopping early — timeout (${guard.elapsedSec()}s)`)
                break
            }

            try {
                await prisma.emailAccount.update({
                    where: { id: account.id },
                    data: { lastSyncedAt: new Date() }
                })

                const result = await syncAccountInbox(account, guard)
                totalReplies += result.replies
                totalBounces += result.bounces
                console.log(`[check-replies] ${account.email}: +${result.replies} replies, +${result.bounces} bounces, +${result.sentSynced} sent synced`)
            } catch (error) {
                console.error(`[check-replies] Error on ${account.email}:`, error)
            }
        }

        console.log(`[check-replies] Done in ${guard.elapsedSec()}s — ${totalReplies} replies, ${totalBounces} bounces`)
    } catch (error) {
        console.error('[check-replies] Background task failed:', error)
    }
}
