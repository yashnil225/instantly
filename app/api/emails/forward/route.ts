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
        const { emailId, to, subject, body: emailBody } = body

        if (!emailId || !to || !emailBody) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Resolve Context (Lead)
        // Similar to Reply, we need to find the lead to know which account to send FROM
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
            if (event) lead = event.lead
        }

        if (!lead) {
            return NextResponse.json({ error: 'Original email context not found' }, { status: 404 })
        }

        // 2. Select Sending Account
        const sendingAccount = lead.campaign?.campaignAccounts?.[0]?.emailAccount

        if (!sendingAccount) {
            return NextResponse.json({ error: 'No sending account available' }, { status: 400 })
        }

        // 3. Send Email
        const info = await sendEmail({
            config: {
                host: sendingAccount.smtpHost || '',
                port: sendingAccount.smtpPort || 587,
                user: sendingAccount.smtpUser || '',
                pass: sendingAccount.smtpPass || ''
            },
            to: to,
            subject: subject || `Fwd: Email from ${lead.email}`,
            html: emailBody,
            fromName: sendingAccount.firstName ? `${sendingAccount.firstName} ${sendingAccount.lastName}` : sendingAccount.email,
            fromEmail: sendingAccount.email
        })

        // 4. Log Event
        await prisma.sendingEvent.create({
            data: {
                type: 'forward_sent',
                leadId: lead.id,
                campaignId: lead.campaignId,
                emailAccountId: sendingAccount.id,
                metadata: JSON.stringify({ ...info, originalEmailId: emailId, forwardedTo: to })
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Failed to forward email:', error)
        return NextResponse.json({ error: 'Failed to forward email' }, { status: 500 })
    }
}
