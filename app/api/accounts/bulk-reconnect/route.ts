import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'


export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const ids = body.ids

        // Build query
        const whereClause: any = {
            userId: session.user.id
        }

        if (ids && Array.isArray(ids) && ids.length > 0) {
            // If specific IDs provided, use them regardless of status
            whereClause.id = { in: ids }
        } else {
            // If no specific IDs, get all user accounts (not just error ones)
            // This way "Reconnect all accounts" actually reconnects all
        }

        // Get accounts to verify existence AND get credentials
        const accounts = await prisma.emailAccount.findMany({
            where: whereClause
        })

        if (accounts.length === 0) {
            return NextResponse.json({ error: 'No accounts found' }, { status: 404 })
        }

        let successCount = 0
        let errorCount = 0
        const results = []

        // Process sequentially to avoid overwhelming resources (or parallel with limit in production)
        for (const account of accounts) {
            try {
                // Skip if no credentials
                if (!account.smtpHost || !account.smtpPass) {
                    throw new Error("Missing credentials")
                }

                const nodemailer = (await import('nodemailer')).default
                const transporter = nodemailer.createTransport({
                    host: account.smtpHost,
                    port: account.smtpPort || 587,
                    secure: account.smtpPort === 465,
                    auth: {
                        user: account.smtpUser!,
                        pass: account.smtpPass
                    },
                    tls: { rejectUnauthorized: false }
                })

                await transporter.verify()

                // Success: Update status and clear error detail
                await prisma.emailAccount.update({
                    where: { id: account.id },
                    data: { status: 'active', errorDetail: null }
                })
                successCount++
                results.push({ id: account.id, status: 'success' })

            } catch (err: any) {
                errorCount++
                // Set to error state with error detail
                const errorMessage = err.message || 'Unknown connection error'
                await prisma.emailAccount.update({
                    where: { id: account.id },
                    data: { status: 'error', errorDetail: errorMessage }
                })
                results.push({ id: account.id, status: 'error', message: errorMessage })
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${accounts.length} accounts. Success: ${successCount}, Failed: ${errorCount}`,
            results
        })

    } catch (error: any) {
        console.error('Bulk reconnect failed:', error)
        return NextResponse.json({ error: 'Bulk processing failed', details: error.message }, { status: 500 })
    }
}
