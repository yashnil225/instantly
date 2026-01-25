import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

import { auth } from '@/auth'

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { threadId, leadId, campaignId, replyBody } = await request.json()

        if (!leadId || !campaignId || !replyBody) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Find the Lead
        const lead = await prisma.lead.findUnique({ where: { id: leadId } })
        if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

        // 2. Determine Sender Account
        // Try to find the account used in the last 'sent' event for this lead/campaign
        const lastSentEvent = await prisma.sendingEvent.findFirst({
            where: {
                leadId: leadId,
                campaignId: campaignId,
                type: 'sent'
            },
            orderBy: { createdAt: 'desc' }
        })

        let account = null

        if (lastSentEvent && lastSentEvent.metadata) {
            try {
                const meta = JSON.parse(lastSentEvent.metadata)
                if (meta.accountId) {
                    account = await prisma.emailAccount.findUnique({ where: { id: meta.accountId } })
                }
            } catch (e) { }
        }

        // Fallback: If no previous event or account not found, use a random active account attached to campaign
        if (!account) {
            const campaignAccount = await prisma.campaignEmailAccount.findFirst({
                where: { campaignId: campaignId, emailAccount: { status: 'active' } },
                include: { emailAccount: true }
            })
            account = campaignAccount?.emailAccount
        }

        if (!account) {
            return NextResponse.json({ error: 'No active email account found for this campaign' }, { status: 400 })
        }

        // 2b. Determine Subject for Threading
        let subject = "Re: "
        if (lastSentEvent && lastSentEvent.metadata) {
            try {
                const meta = JSON.parse(lastSentEvent.metadata)
                if (meta.subject) {
                    const cleanSubject = meta.subject.replace(/^Re:\s+/i, '') // Remove existing Re:
                    subject = `Re: ${cleanSubject}`
                }
            } catch (e) { }
        } else {
            // Check if we are replying to a received email (Reply event)
            const lastReply = await prisma.sendingEvent.findFirst({
                where: { leadId: leadId, campaignId: campaignId, type: 'reply' },
                orderBy: { createdAt: 'desc' }
            })
            if (lastReply && lastReply.metadata) {
                try {
                    const meta = JSON.parse(lastReply.metadata)
                    if (meta.subject) {
                        const cleanSubject = meta.subject.replace(/^Re:\s+/i, '')
                        subject = `Re: ${cleanSubject}`
                    }
                } catch (e) { }
            }
        }

        // 3. Send Reply
        const nodemailer = (await import('nodemailer')).default
        const transporter = nodemailer.createTransport({
            host: account.smtpHost!,
            port: account.smtpPort!,
            secure: account.smtpPort === 465,
            auth: { user: account.smtpUser!, pass: account.smtpPass! }
        })

        await transporter.sendMail({
            from: `"${account.firstName || ''} ${account.lastName || ''}" <${account.email}>`,
            to: lead.email,
            subject: subject,
            html: `<div style="white-space: pre-wrap;">${replyBody}</div>`,
            // Threading headers
            ...(lastSentEvent?.messageId && {
                inReplyTo: lastSentEvent.messageId,
                references: [lastSentEvent.messageId]
            })
        })

        // 4. Log Event
        await prisma.sendingEvent.create({
            data: {
                type: 'sent', // It is a sent message
                leadId: lead.id,
                campaignId: campaignId,
                metadata: JSON.stringify({
                    accountId: account.id,
                    subject: subject,
                    isReply: true,
                    bodySnippet: replyBody.substring(0, 100)
                }),
                details: replyBody
            }
        })

        // Update stats
        await prisma.emailAccount.update({
            where: { id: account.id },
            data: { sentToday: { increment: 1 } }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Reply send error:', error)
        return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 })
    }
}
