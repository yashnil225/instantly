import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

import { auth } from '@/auth'

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { threadId, leadId, campaignId, replyBody, attachmentIds } = await request.json()

        if (!leadId || !replyBody) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Find the Lead
        const lead = await prisma.lead.findUnique({ where: { id: leadId } })
        if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

        const targetCampaignId = campaignId || lead.campaignId || ''

        // 2. Determine Sender Account
        // Try to find the account used in the last 'sent' event for this lead/campaign
        const lastSentEvent = await prisma.sendingEvent.findFirst({
            where: {
                leadId: leadId,
                ...(targetCampaignId ? { campaignId: targetCampaignId } : {}),
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

        // Fallback: If no previous event or account not found, use an active account attached to campaign
        if (!account && targetCampaignId) {
            const campaignAccount = await prisma.campaignEmailAccount.findFirst({
                where: { campaignId: targetCampaignId, emailAccount: { status: 'active' } },
                include: { emailAccount: true }
            })
            account = campaignAccount?.emailAccount
        }

        // Fallback 2: Any active account owned by user
        if (!account && session.user.id) {
            account = await prisma.emailAccount.findFirst({
                where: { userId: session.user.id, status: 'active' }
            })
        }

        if (!account) {
            return NextResponse.json({ error: 'No active email account found to send this reply' }, { status: 400 })
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
        let smtpDefaults = null;
        const providerStr = account.provider?.toLowerCase() || '';
        if (providerStr === 'google') smtpDefaults = { host: 'smtp.gmail.com', port: 587 };
        else if (providerStr === 'microsoft' || providerStr === 'outlook') smtpDefaults = { host: 'smtp.office365.com', port: 587 };

        const smtpHost = account.smtpHost || smtpDefaults?.host;
        const smtpPort = account.smtpPort || smtpDefaults?.port || 587;

        if (!smtpHost) {
            return NextResponse.json({ 
                error: 'Email account SMTP credentials not configured. Please reconnect or configure SMTP settings for this account.' 
            }, { status: 400 })
        }

        const nodemailer = (await import('nodemailer')).default
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: account.smtpUser || account.email, pass: account.smtpPass || '' }
        })

        // Fetch attachments if any
        let attachments: any[] = []
        if (attachmentIds && Array.isArray(attachmentIds) && attachmentIds.length > 0) {
            const dbAttachments = await prisma.attachment.findMany({
                where: { id: { in: attachmentIds } }
            })
            attachments = dbAttachments.map((a: any) => ({
                filename: a.filename,
                content: a.content,
                contentType: a.mimeType
            }))
        }

        const formattedReplyBody = replyBody.replace(/\n/g, '<br />')

        const info = await transporter.sendMail({
            from: `"${account.firstName || ''} ${account.lastName || ''}" <${account.email}>`,
            to: lead.email,
            subject: subject,
            html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 24px; font-size: 15px; color: #000;">${formattedReplyBody}</div>`,
            attachments,
            // Threading headers
            ...(lastSentEvent?.messageId && {
                inReplyTo: lastSentEvent.messageId,
                references: [lastSentEvent.messageId]
            })
        })

        // 4. Log Event
        const newEvent = await prisma.sendingEvent.create({
            data: {
                type: 'sent', // It is a sent message
                leadId: lead.id,
                campaignId: targetCampaignId,
                emailAccountId: account.id,
                messageId: info.messageId,
                metadata: JSON.stringify({
                    accountId: account.id,
                    subject: subject,
                    isReply: true,
                    messageId: info.messageId,
                    bodySnippet: replyBody.substring(0, 100)
                }),
                details: replyBody
            }
        })

        // Also touch lead.updatedAt so the thread is bumped to top of inbox
        await prisma.lead.update({
            where: { id: lead.id },
            data: { updatedAt: new Date(), status: 'contacted' }
        }).catch(() => {})

        // Update stats
        await prisma.emailAccount.update({
            where: { id: account.id },
            data: { sentToday: { increment: 1 } }
        }).catch(() => {})

        return NextResponse.json({ success: true, eventId: newEvent.id, messageId: info.messageId })

    } catch (error) {
        console.error('Reply send error:', error)
        return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 })
    }
}
