import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncAccountInbox } from '@/lib/imap-monitor'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // Set max duration for Vercel

export async function GET(request: Request) {
    const startTime = Date.now()
    const TIMEOUT_SAFETY_MARGIN = 240 * 1000 // 4 minutes

    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production') {
        const secret = process.env.CRON_SECRET || process.env.AUTHORIZATION
        const isValid = authHeader === `Bearer ${secret}` || authHeader === secret
        if (!isValid) {
            return new Response('Unauthorized', { status: 401 })
        }
    }

    try {
        console.log('Starting Prioritized Unified IMAP Sync...')

        // Get 3 oldest active email accounts (prioritize those not checked recently)
        const accounts = await prisma.emailAccount.findMany({
            where: { status: 'active' },
            orderBy: { lastSyncedAt: 'asc' },
            take: 3
        })

        if (accounts.length === 0) {
            return NextResponse.json({ success: true, message: 'No accounts to check' })
        }

        let totalReplies = 0
        let totalBounces = 0
        let accountsChecked = 0
        const errors: string[] = []

        // Process in parallel to save time, but limited to 3 to prevent IP blocking
        const syncPromises = accounts.map(async (account) => {
            try {
                // Update timestamp immediately so it moves to end of queue if crash occurs
                await prisma.emailAccount.update({
                    where: { id: account.id },
                    data: { lastSyncedAt: new Date() }
                })

                const result = await syncAccountInbox(account)
                
                console.log(`[Cron] Finished ${account.email}: +${result.replies} replies, +${result.bounces} bounces`)
                return result
            } catch (error) {
                console.error(`Error checking ${account.email}:`, error)
                errors.push(`${account.email}: ${error}`)
                return { replies: 0, bounces: 0 }
            }
        })

        const results = await Promise.all(syncPromises)
        
        results.forEach(res => {
            totalReplies += res.replies
            totalBounces += res.bounces
            accountsChecked++
        })

        const totalActive = await prisma.emailAccount.count({ where: { status: 'active' } })

        return NextResponse.json({
            success: true,
            totalReplies,
            totalBounces,
            accountsChecked,
            totalAccounts: totalActive,
            completedBatch: true,
            elapsedSeconds: Math.floor((Date.now() - startTime) / 1000),
            errors: errors.length > 0 ? errors : undefined
        })
    } catch (error) {
        console.error('IMAP check failed:', error)
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        )
    }
}
