import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getEmailQueue } from '@/lib/queue'

const prisma = new PrismaClient()

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
        const firstSequence = campaign.sequences[0]
        let queued = 0

        for (const lead of campaign.leads) {
            try {
                const queue = getEmailQueue()
                await queue.add('send-email', {
                    campaignId: campaign.id,
                    leadId: lead.id,
                    sequenceId: firstSequence.id,
                    subject: firstSequence.subject || 'No Subject',
                    emailBody: firstSequence.body
                }, {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 60000 }
                })
                queued++
            } catch (err) {
                console.error(`Failed to queue email for lead ${lead.id}:`, err)
            }
        }

        return NextResponse.json({
            success: true,
            message: `Campaign launched! ${queued} emails queued for sending.`,
            queued
        })

    } catch (error) {
        console.error('Launch error:', error)
        return NextResponse.json({ error: 'Failed to launch campaign' }, { status: 500 })
    }
}
