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
        console.log('Starting Unified IMAP Sync...')

        // Get all active email accounts
        const accounts = await prisma.emailAccount.findMany({
            where: { status: 'active' }
        })

        let totalReplies = 0
        let totalBounces = 0
        let accountsChecked = 0
        const errors: string[] = []

        for (const account of accounts) {
            // Safety timeout check
            const elapsed = Date.now() - startTime
            if (elapsed > TIMEOUT_SAFETY_MARGIN) {
                console.warn(`[Cron] Approaching Vercel timeout (${elapsed/1000}s). Stopping sync early. Checked ${accountsChecked}/${accounts.length} accounts.`)
                break
            }

            try {
                // Sequential delay to prevent concurrent connections
                await new Promise(resolve => setTimeout(resolve, 2000))
                
                const result = await syncAccountInbox(account)
                totalReplies += result.replies
                totalBounces += result.bounces
                accountsChecked++
                
                console.log(`[Cron] Finished ${account.email}: +${result.replies} replies, +${result.bounces} bounces`)
            } catch (error) {
                console.error(`Error checking ${account.email}:`, error)
                errors.push(`${account.email}: ${error}`)
                accountsChecked++
            }
        }

        return NextResponse.json({
            success: true,
            totalReplies,
            totalBounces,
            accountsChecked,
            totalAccounts: accounts.length,
            completed: accountsChecked === accounts.length,
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
