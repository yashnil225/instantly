import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'


export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id: accountId } = await params
        const { to, subject, body } = await request.json()

        if (!to) {
            return NextResponse.json({ error: 'Recipient address is required' }, { status: 400 })
        }

        const account = await prisma.emailAccount.findUnique({
            where: { id: accountId }
        })

        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 })
        }

        if (account.userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const smtpDefaultsByProvider: Record<string, { host: string; port: number }> = {
            google: { host: 'smtp.gmail.com', port: 587 },
            microsoft: { host: 'smtp.office365.com', port: 587 },
            outlook: { host: 'smtp.office365.com', port: 587 },
        }
        const defaults = smtpDefaultsByProvider[account.provider?.toLowerCase() ?? '']
        const smtpHost = account.smtpHost || defaults?.host
        const smtpPort = account.smtpPort || defaults?.port || 587

        if (!smtpHost) {
            return NextResponse.json({ error: 'No SMTP host configured for this account.', details: 'Please update your account settings to include the SMTP host.' }, { status: 400 })
        }

        const nodemailer = (await import('nodemailer')).default
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: account.smtpUser || account.email,
                pass: account.smtpPass!
            }
        })

        const fromName = `${account.firstName || ''} ${account.lastName || ''}`.trim() || account.email

        await transporter.sendMail({
            from: `"${fromName}" <${account.email}>`,
            to,
            subject: subject || 'Instantly.ai Test Email',
            text: body || `This is a test email from Instantly.ai sent via ${account.email}.`,
            html: body ? body.replace(/\n/g, '<br>') : `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #3b82f6;">Instantly.ai Test</h2>
                    <p>Your email account <strong>${account.email}</strong> is successfully connected and able to send emails!</p>
                    <div style="margin-top: 20px; padding: 10px; background: #f9f9f9; border-left: 4px solid #3b82f6;">
                        <small>Sent at: ${new Date().toLocaleString()}</small>
                    </div>
                </div>`
        })

        return NextResponse.json({ success: true, message: 'Test email sent successfully' })
    } catch (error: any) {
        console.error('Test send failed:', error)
        return NextResponse.json({
            error: 'Failed to send test email',
            details: error.message
        }, { status: 500 })
    }
}
