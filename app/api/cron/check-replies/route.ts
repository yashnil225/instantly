import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncAccountInbox } from '@/lib/imap-monitor'
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
    waitUntil(runReplyCheck())

    return NextResponse.json({ success: true, message: 'Reply check started in background' })
}

async function runReplyCheck() {
    const startTime = Date.now()
    console.log('[check-replies] Starting background IMAP sync...')

    try {
        const accounts = await prisma.emailAccount.findMany({
            where: { status: 'active' },
            orderBy: { lastSyncedAt: 'asc' },
            take: 3
        })

        if (accounts.length === 0) {
            console.log('[check-replies] No accounts to check')
            return
        }

        let totalReplies = 0
        let totalBounces = 0

        // Process accounts with staggered starts to prevent IP blocks
        const syncPromises = accounts.map(async (account, index) => {
            try {
                if (index > 0) {
                    await new Promise(resolve => setTimeout(resolve, index * 1000))
                }

                await prisma.emailAccount.update({
                    where: { id: account.id },
                    data: { lastSyncedAt: new Date() }
                })

                const result = await syncAccountInbox(account)
                console.log(`[check-replies] ${account.email}: +${result.replies} replies, +${result.bounces} bounces`)
                return result
            } catch (error) {
                console.error(`[check-replies] Error on ${account.email}:`, error)
                return { replies: 0, bounces: 0 }
            }
        })

        const results = await Promise.all(syncPromises)
        results.forEach(r => { totalReplies += r.replies; totalBounces += r.bounces })

        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        console.log(`[check-replies] Done in ${elapsed}s — ${totalReplies} replies, ${totalBounces} bounces`)
    } catch (error) {
        console.error('[check-replies] Background task failed:', error)
    }
}
