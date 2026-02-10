import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { classifyEmailStatus } from '@/lib/ai-service'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: campaignId } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Verify campaign belongs to user
        const campaign = await prisma.campaign.findFirst({
            where: { 
                id: campaignId,
                userId: session.user.id
            }
        })

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        // Get unclassified reply events
        const unclassifiedEvents = await prisma.sendingEvent.findMany({
            where: {
                campaignId,
                type: 'reply',
                lead: { aiLabel: null }
            },
            include: { lead: true }
        })

        const results = []
        
        for (const event of unclassifiedEvents) {
            try {
                const metadata = JSON.parse(event.metadata || '{}')
                let classification = null
                let retries = 0
                const maxRetries = 1

                // Retry logic: try Gemini, wait 5s on fail, retry once, then fallback
                while (retries <= maxRetries && !classification) {
                    try {
                        classification = await classifyEmailStatus(
                            metadata.subject || 'No Subject',
                            metadata.bodyText || ''
                        )
                    } catch (error) {
                        retries++
                        if (retries <= maxRetries) {
                            console.log(`Classification failed for lead ${event.leadId}, retrying in 5s... (${retries}/${maxRetries})`)
                            await new Promise(resolve => setTimeout(resolve, 5000))
                        } else {
                            console.log(`Classification failed after retries for lead ${event.leadId}, using fallback`)
                            // Use fallback classification
                            const text = ((metadata.subject || '') + " " + (metadata.bodyText || '')).toLowerCase()
                            if (text.includes("out of office") || text.includes("away until") || text.includes("vacation")) {
                                classification = "out_of_office"
                            } else if (text.includes("meeting") || text.includes("calendar") || text.includes("schedule a call")) {
                                classification = "meeting_booked"
                            } else if (text.includes("interested") || text.includes("sounds good") || text.includes("tell me more") || text.includes("send over")) {
                                classification = "interested"
                            } else if (text.includes("not interested") || text.includes("no thanks") || text.includes("remove me")) {
                                classification = "not_interested"
                            } else if (text.includes("wrong person") || text.includes("not the right contact")) {
                                classification = "wrong_person"
                            } else if (text.includes("fuck") || text.includes("stop") || text.includes("scam") || text.includes("don't email")) {
                                classification = "lost"
                            } else {
                                classification = "interested" // Default
                            }
                        }
                    }
                }

                // Update lead with classification
                await prisma.lead.update({
                    where: { id: event.leadId },
                    data: { aiLabel: classification }
                })

                results.push({ leadId: event.leadId, classification, success: true })
                console.log(`Classified lead ${event.leadId} as: ${classification}`)
            } catch (error) {
                console.error(`Failed to classify lead ${event.leadId}:`, error)
                results.push({ 
                    leadId: event.leadId, 
                    error: error instanceof Error ? error.message : 'Unknown error',
                    success: false 
                })
            }
        }

        return NextResponse.json({
            classified: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            total: unclassifiedEvents.length,
            results
        })
    } catch (error) {
        console.error('Classify replies error:', error)
        return NextResponse.json(
            { error: 'Failed to classify replies' },
            { status: 500 }
        )
    }
}
