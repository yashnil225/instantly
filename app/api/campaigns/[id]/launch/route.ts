import { NextResponse } from 'next/server'
import { getEmailQueue } from '@/lib/queue'
import { prisma } from '@/lib/prisma'

// Launch a campaign - starts sending emails
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const campaignId = id

        // Get campaign with leads and sequences
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                leads: { where: { status: 'new' } },
                sequences: { orderBy: { stepNumber: 'asc' } },
                campaignAccounts: { include: { emailAccount: true } }
            }
        })

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        if (campaign.sequences.length === 0) {
            return NextResponse.json({ error: 'No sequences configured. Add at least one email step.' }, { status: 400 })
        }

        if (campaign.campaignAccounts.length === 0) {
            return NextResponse.json({ error: 'No email accounts assigned to this campaign.' }, { status: 400 })
        }

        if (campaign.leads.length === 0) {
            return NextResponse.json({ error: 'No leads to send to. Add leads first.' }, { status: 400 })
        }

        // Update campaign status to active
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'active' }
        })

        // Queue emails for the first sequence step
        const firstSequence = await prisma.sequence.findFirst({
            where: { campaignId: campaign.id, stepNumber: 1 },
            include: { variants: { where: { enabled: true } } }
        })

        if (!firstSequence) {
            return NextResponse.json({ error: 'No first sequence step found.' }, { status: 400 })
        }

        const variants = firstSequence.variants
        let queued = 0

        for (let i = 0; i < campaign.leads.length; i++) {
            const lead = campaign.leads[i]
            try {
                const queue = getEmailQueue()
                if (queue) {
                    // Round-robin selection of variant
                    const variant = variants.length > 0
                        ? variants[i % variants.length]
                        : null

                    await queue.add('send-email', {
                        campaignId: campaign.id,
                        leadId: lead.id,
                        sequenceId: firstSequence.id,
                        variantId: variant?.id,
                        subject: variant?.subject || firstSequence.subject || 'No Subject',
                        emailBody: variant?.body || firstSequence.body || ''
                    }, {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 60000 }
                    })
                    queued++
                }
            } catch (err) {
                console.error(`Failed to queue email for lead ${lead.id}:`, err)
            }
        }

        const message = queued > 0
            ? `Campaign launched! ${queued} emails queued for sending.`
            : `Campaign launched! Background process will start sending soon.`

        return NextResponse.json({
            success: true,
            message,
            queued
        })

    } catch (error) {
        console.error('Launch error:', error)
        return NextResponse.json({ error: 'Failed to launch campaign' }, { status: 500 })
    }
}
