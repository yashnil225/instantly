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
        const { emailId, body: emailBody, replyAll } = body

        if (!emailId || !emailBody) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Handle Demo Email Case
        if (emailId.startsWith('demo-')) {
            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 1000))
            return NextResponse.json({ success: true, message: 'Demo reply sent' })
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

        // 2. Select Sending Account (Logic: Use same account if known, or first available from campaign)
        // For simplicity, pick the first connected account
        const sendingAccount = lead.campaign?.campaignAccounts?.[0]?.emailAccount

        if (!sendingAccount) {
            return NextResponse.json({ error: 'No email account connected to this campaign' }, { status: 400 })
        }

        // 3. Send Email
        const info = await sendEmail({
            config: {
                host: sendingAccount.smtpHost || '',
                port: sendingAccount.smtpPort || 587,
                user: sendingAccount.smtpUser || '',
                pass: sendingAccount.smtpPass || '' // detailed decryption needed in real app
            },
            to: lead.email,
            subject: `Re: ${"Follow up"}`, // Should fetch original subject
            html: emailBody,
            fromName: sendingAccount.firstName ? `${sendingAccount.firstName} ${sendingAccount.lastName}` : sendingAccount.email,
            fromEmail: sendingAccount.email
        })

        // 4. Log the Reply
        await prisma.sendingEvent.create({
            data: {
                type: 'reply_sent',
                leadId: lead.id,
                campaignId: lead.campaignId,
                emailAccountId: sendingAccount.id,
                metadata: JSON.stringify(info)
            }
        })

        // 5. Update Lead Status
        await prisma.lead.update({
            where: { id: lead.id },
            data: { status: 'replied' } // Or 'contacted'
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Failed to send reply:', error)
        return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 })
    }
}
