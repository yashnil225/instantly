import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkForReplies, checkForBounces } from '@/lib/imap-monitor'

export const dynamic = 'force-dynamic'

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
        console.log('Starting IMAP check for replies and bounces...')

        // Get all active email accounts
        const accounts = await prisma.emailAccount.findMany({
            where: { status: 'active' }
        })

        let totalReplies = 0
        let totalBounces = 0
        const errors: string[] = []

        for (const account of accounts) {
            try {
                // Sequential delay between accounts to prevent rate limiting
                await new Promise(resolve => setTimeout(resolve, 3000))
                
                // Check for replies
                const replies = await checkForReplies(account)
                totalReplies += replies

                // Small delay between ops on same account
                await new Promise(resolve => setTimeout(resolve, 1500))

                // Check for bounces
                const bounces = await checkForBounces(account)
                totalBounces += bounces
            } catch (error) {
                console.error(`Error checking ${account.email}:`, error)
                errors.push(`${account.email}: ${error}`)
            }
        }

        return NextResponse.json({
            success: true,
            totalReplies,
            totalBounces,
            accountsChecked: accounts.length,
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
