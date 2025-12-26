import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params
        const account = await prisma.emailAccount.findUnique({
            where: { id }
        })

        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 })
        }

        // Create Transporter using saved credentials
        const transporter = nodemailer.createTransport({
            host: account.smtpHost!,
            port: account.smtpPort!,
            secure: account.smtpPort === 465,
            auth: {
                user: account.smtpUser!,
                pass: account.smtpPass!
            },
            tls: {
                rejectUnauthorized: false
            }
        })

        // Verify connection
        await transporter.verify()
        console.log(`Connection verified for ${account.email}`)

        // Update status to active if it was error
        if (account.status === 'error') {
            await prisma.emailAccount.update({
                where: { id },
                data: { status: 'active' }
            })
        }

        return NextResponse.json({ success: true, message: "Connection is stable" })

    } catch (error: any) {
        console.error("Test Connection Failed:", error)

        // Update account status to error
        try {
            const { id } = await params
            await prisma.emailAccount.update({
                where: { id },
                data: { status: 'error' }
            })
        } catch (e) {
            // ignore
        }

        return NextResponse.json({
            error: "Connection Failed",
            details: error.message || "Could not connect to SMTP server"
        }, { status: 400 })
    }
}
