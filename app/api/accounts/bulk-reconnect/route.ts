import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { ids } = await request.json()

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No accounts selected' }, { status: 400 })
        }

        // Get accounts to verify existence AND get credentials
        const accounts = await prisma.emailAccount.findMany({
            where: {
                id: { in: ids }
            }
        })

        if (accounts.length === 0) {
            return NextResponse.json({ error: 'No valid accounts found' }, { status: 404 })
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

                // Success: Update status
                await prisma.emailAccount.update({
                    where: { id: account.id },
                    data: { status: 'active' } // Clear error status
                })
                successCount++
                results.push({ id: account.id, status: 'success' })

            } catch (err: any) {
                errorCount++
                // Set to error state
                await prisma.emailAccount.update({
                    where: { id: account.id },
                    data: { status: 'error' }
                })
                results.push({ id: account.id, status: 'error', message: err.message })
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
