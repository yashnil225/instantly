import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

function extractCleanEmail(input: string): string {
    const match = input.match(/<([^>]+)>/)
    if (match) return match[1].trim().toLowerCase()
    return input.trim().toLowerCase()
}

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { emailId, leadId: explicitLeadId, campaignId: explicitCampaignId, to, subject, body: emailBody, attachmentIds } = body

        if (!to || !to.trim()) {
            return NextResponse.json({ error: 'Recipient email address (To:) is required' }, { status: 400 })
        }

        if (!emailBody || !emailBody.trim()) {
            return NextResponse.json({ error: 'Email body is required' }, { status: 400 })
        }

        // 1. Resolve Context (Original Lead and Original Event)
        let lead: any = null
        let originalEvent: any = null

        // Try to find if emailId is a SendingEvent ID
        if (emailId) {
            originalEvent = await prisma.sendingEvent.findUnique({
                where: { id: emailId },
                include: {
                    lead: {
                        include: {
                            campaign: {
                                include: {
                                    campaignAccounts: {
                                        include: {
                                            emailAccount: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    emailAccount: true
                }
            })
            if (originalEvent) {
                lead = originalEvent.lead
            }
        }

        // If not found yet, check if emailId or explicitLeadId is a Lead ID
        const targetLeadId = explicitLeadId || (lead ? null : emailId)
        if (!lead && targetLeadId) {
            lead = await prisma.lead.findUnique({
                where: { id: targetLeadId },
                include: {
                    campaign: {
                        include: {
                            campaignAccounts: {
                                include: {
                                    emailAccount: true
                                }
                            }
                        }
                    }
                }
            })
        }

        if (!lead) {
            return NextResponse.json({ error: 'Original email context or lead not found' }, { status: 404 })
        }

        // 2. Select Sending Account
        let sendingAccount: any = null

        // Priority 1: Account attached to original event if active
        if (originalEvent?.emailAccount && originalEvent.emailAccount.status === 'active') {
            sendingAccount = originalEvent.emailAccount
        }

        // Priority 2: Account used in last sent event for this lead
        if (!sendingAccount) {
            const lastSentEvent = await prisma.sendingEvent.findFirst({
                where: {
                    leadId: lead.id,
                    type: 'sent'
                },
                orderBy: { createdAt: 'desc' }
            })

            if (lastSentEvent) {
                if (lastSentEvent.metadata) {
                    try {
                        const meta = JSON.parse(lastSentEvent.metadata)
                        if (meta.accountId) {
                            sendingAccount = await prisma.emailAccount.findUnique({ where: { id: meta.accountId } })
                        }
                    } catch (e) { }
                }
                if (!sendingAccount && lastSentEvent.emailAccountId) {
                    sendingAccount = await prisma.emailAccount.findUnique({ where: { id: lastSentEvent.emailAccountId } })
                }
            }
        }

        // Priority 3: Account attached to original event even if not explicitly active status
        if (!sendingAccount && originalEvent?.emailAccount) {
            sendingAccount = originalEvent.emailAccount
        }

        // Priority 4: Active account connected to campaign
        const campaignId = explicitCampaignId || lead.campaignId
        if (!sendingAccount && campaignId) {
            const campaignAccount = await prisma.campaignEmailAccount.findFirst({
                where: {
                    campaignId: campaignId,
                    emailAccount: { status: 'active' }
                },
                include: { emailAccount: true }
            })
            sendingAccount = campaignAccount?.emailAccount
        }

        // Priority 5: Any account connected to campaign
        if (!sendingAccount && campaignId) {
            const campaignAccount = await prisma.campaignEmailAccount.findFirst({
                where: { campaignId: campaignId },
                include: { emailAccount: true }
            })
            sendingAccount = campaignAccount?.emailAccount
        }

        // Priority 6: Any active account owned by user
        if (!sendingAccount && session.user.id) {
            sendingAccount = await prisma.emailAccount.findFirst({
                where: {
                    userId: session.user.id,
                    status: 'active'
                }
            })
        }

        // Priority 7: Any account owned by user
        if (!sendingAccount && session.user.id) {
            sendingAccount = await prisma.emailAccount.findFirst({
                where: { userId: session.user.id }
            })
        }

        if (!sendingAccount) {
            return NextResponse.json({
                error: 'No email account available to send from. Please connect an active email account in Settings.'
            }, { status: 400 })
        }

        // 3. Resolve SMTP Settings (with Google / Microsoft provider fallbacks)
        let smtpDefaults: { host: string; port: number } | null = null
        const providerStr = sendingAccount.provider?.toLowerCase() || ''
        const emailLower = sendingAccount.email?.toLowerCase() || ''

        if (providerStr === 'google' || emailLower.includes('@gmail.com') || emailLower.includes('@googlemail.com')) {
            smtpDefaults = { host: 'smtp.gmail.com', port: 587 }
        } else if (
            providerStr === 'microsoft' ||
            providerStr === 'outlook' ||
            emailLower.includes('@outlook.com') ||
            emailLower.includes('@office365.com') ||
            emailLower.includes('@hotmail.com')
        ) {
            smtpDefaults = { host: 'smtp.office365.com', port: 587 }
        }

        const smtpHost = sendingAccount.smtpHost || smtpDefaults?.host
        const smtpPort = sendingAccount.smtpPort || smtpDefaults?.port || 587
        const smtpUser = sendingAccount.smtpUser || sendingAccount.email
        const smtpPass = sendingAccount.smtpPass || ''

        if (!smtpHost) {
            return NextResponse.json({
                error: `SMTP host not configured for account ${sendingAccount.email}. Please update SMTP settings in Email Accounts.`
            }, { status: 400 })
        }

        if (!smtpPass) {
            return NextResponse.json({
                error: `Password or App Password is missing for ${sendingAccount.email}. Please update credentials in Email Accounts.`
            }, { status: 400 })
        }

        // 4. Attachments
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

        // 5. Send Email via Nodemailer
        const nodemailer = (await import('nodemailer')).default
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000
        })

        // Clean HTML escape for plain text formatting
        const escapeHtml = (str: string) =>
            str.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')

        const isHtml = emailBody.includes('<br') || emailBody.includes('<p') || emailBody.includes('<div')
        const formattedHtml = isHtml
            ? `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; font-size: 14px; color: #222;">${emailBody}</div>`
            : `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; font-size: 14px; color: #222; white-space: pre-wrap;">${escapeHtml(emailBody).replace(/\n/g, '<br />')}</div>`

        const fromName = sendingAccount.firstName
            ? `${sendingAccount.firstName} ${sendingAccount.lastName || ''}`.trim()
            : sendingAccount.email

        const finalSubject = subject || `Fwd: Email from ${lead.email}`

        const info = await transporter.sendMail({
            from: `"${fromName}" <${sendingAccount.email}>`,
            to: to,
            subject: finalSubject,
            text: emailBody, // Provide plain text representation
            html: formattedHtml, // Provide styled HTML representation
            attachments
        })

        // 6. Resolve Recipient Lead (Create or Find Lead for the forwarded recipient)
        // This ensures the forwarded thread does NOT attach to the original sender's thread (Alice),
        // and when the forwarded recipient (Bob) replies, their reply appears in the Unibox under their own lead!
        const recipientEmail = extractCleanEmail(to)
        const targetCampaignId = lead.campaignId || campaignId || ''

        let recipientLead = await prisma.lead.findUnique({
            where: {
                email_campaignId: {
                    email: recipientEmail,
                    campaignId: targetCampaignId
                }
            }
        })

        if (!recipientLead) {
            recipientLead = await prisma.lead.findFirst({
                where: { email: recipientEmail }
            })
        }

        if (!recipientLead) {
            recipientLead = await prisma.lead.create({
                data: {
                    email: recipientEmail,
                    firstName: recipientEmail.split('@')[0],
                    campaignId: targetCampaignId,
                    status: 'contacted'
                }
            })
        }

        // 7. Record SendingEvent under the recipient lead
        await prisma.sendingEvent.create({
            data: {
                type: 'sent',
                leadId: recipientLead.id,
                campaignId: recipientLead.campaignId || targetCampaignId,
                emailAccountId: sendingAccount.id,
                messageId: info.messageId,
                metadata: JSON.stringify({
                    accountId: sendingAccount.id,
                    subject: finalSubject,
                    isForward: true,
                    forwardedTo: to,
                    forwardedFromLeadId: lead.id,
                    forwardedFromEmail: lead.email,
                    originalEmailId: emailId,
                    messageId: info.messageId,
                    bodySnippet: emailBody.substring(0, 100)
                }),
                details: formattedHtml
            }
        })

        // 8. Log an audit event on the original lead so history is kept,
        // using type 'forward_logged' so it does NOT appear as a message bubble in the original lead's thread
        await prisma.sendingEvent.create({
            data: {
                type: 'forward_logged',
                leadId: lead.id,
                campaignId: lead.campaignId || targetCampaignId,
                emailAccountId: sendingAccount.id,
                messageId: info.messageId,
                metadata: JSON.stringify({
                    forwardedTo: to,
                    recipientLeadId: recipientLead.id,
                    subject: finalSubject,
                    originalEmailId: emailId
                }),
                details: `Email forwarded to ${to}`
            }
        }).catch(() => {})

        // Increment sentToday
        await prisma.emailAccount.update({
            where: { id: sendingAccount.id },
            data: { sentToday: { increment: 1 } }
        }).catch(() => {})

        return NextResponse.json({ success: true, messageId: info.messageId })

    } catch (error: any) {
        console.error('Failed to forward email:', error)
        return NextResponse.json({
            error: error?.message || 'Failed to forward email. Please check your email account credentials.'
        }, { status: 500 })
    }
}
