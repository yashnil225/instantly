import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkForReplies, checkForBounces } from '@/lib/imap-monitor'

export async function GET() {
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
                // Check for replies
                const replies = await checkForReplies(account)
                totalReplies += replies

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
