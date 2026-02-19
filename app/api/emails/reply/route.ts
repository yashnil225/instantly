import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { emailId, body: emailBody } = body

        if (!emailId || !emailBody) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }



        // 1. Resolve Lead/Email context
        // Try to find if emailId is a Lead ID (common in Unibox for thread view)
        let lead = await prisma.lead.findUnique({
            where: { id: emailId },
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

        // If not a lead ID, maybe it's a SendingEvent ID (specific message)
        if (!lead) {
            const event = await prisma.sendingEvent.findUnique({
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
                    }
                }
            })
            if (event) {
                lead = event.lead
            }
        }

        if (!lead) {
            return NextResponse.json({ error: 'Lead or Email not found' }, { status: 404 })
        }

        // 2. Find the last message sent to this lead to enable threading
        const lastSentEvent = await prisma.sendingEvent.findFirst({
            where: {
                leadId: lead.id,
                type: 'sent'
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // 3. Select Sending Account
        const sendingAccount = lead.campaign?.campaignAccounts?.[0]?.emailAccount

        if (!sendingAccount) {
            return NextResponse.json({ error: 'No email account connected to this campaign' }, { status: 400 })
        }

        // 4. Prepare Threading Headers
        const inReplyTo = lastSentEvent?.messageId || undefined
        const references = lastSentEvent?.messageId ? [lastSentEvent.messageId] : undefined

        // Attempt to get original subject
        let originalSubject = "Follow up"
        if (lastSentEvent?.metadata) {
            try {
                const metadata = JSON.parse(lastSentEvent.metadata)
                if (metadata.subject) originalSubject = metadata.subject
            } catch (e) {
                console.error("Failed to parse metadata subject", e)
            }
        }

        const subject = originalSubject.toLowerCase().startsWith('re:')
            ? originalSubject
            : `Re: ${originalSubject}`

        // 5. Send Email
        const info = await sendEmail({
            config: {
                host: sendingAccount.smtpHost || '',
                port: sendingAccount.smtpPort || 587,
                user: sendingAccount.smtpUser || '',
                pass: sendingAccount.smtpPass || '',
                inReplyTo,
                references
            },
            to: lead.email,
            subject,
            html: emailBody,
            fromName: sendingAccount.firstName ? `${sendingAccount.firstName} ${sendingAccount.lastName}` : sendingAccount.email,
            fromEmail: sendingAccount.email
        })

        // 6. Log the Reply
        await prisma.sendingEvent.create({
            data: {
                type: 'reply_sent',
                leadId: lead.id,
                campaignId: lead.campaignId,
                emailAccountId: sendingAccount.id,
                messageId: info.messageId, // Store the new message ID
                metadata: JSON.stringify({
                    ...info,
                    subject
                })
            }
        })

        // 7. Update Lead Status
        await prisma.lead.update({
            where: { id: lead.id },
            data: { status: 'replied' }
        })

        return NextResponse.json({ success: true, messageId: info.messageId })

    } catch (error) {
        console.error('Failed to send reply:', error)
        return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 })
    }
}
