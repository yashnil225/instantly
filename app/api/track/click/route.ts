export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eid')
    const targetUrl = searchParams.get('url')

    if (!targetUrl) {
        return new NextResponse("Missing URL", { status: 400 })
    }

    if (eventId) {
        const sentEvent = await prisma.sendingEvent.findUnique({
            where: { id: eventId },
            include: { lead: true, campaign: true }
        })

        if (sentEvent && sentEvent.type === 'sent') {
            try {
                await prisma.$transaction([
                    prisma.sendingEvent.create({
                        data: {
                            type: 'click',
                            campaignId: sentEvent.campaignId,
                            leadId: sentEvent.leadId,
                            metadata: JSON.stringify({ originalEventId: eventId, url: targetUrl })
                        }
                    }),
                    prisma.campaign.update({
                        where: { id: sentEvent.campaignId },
                        data: { clickCount: { increment: 1 } }
                    }),
                    prisma.campaignStat.upsert({
                        where: {
                            campaignId_date: {
                                campaignId: sentEvent.campaignId,
                                date: new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z')
                            }
                        },
                        create: {
                            campaignId: sentEvent.campaignId,
                            date: new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z'),
                            clicked: 1
                        },
                        update: {
                            clicked: { increment: 1 }
                        }
                    })
                ])
            } catch (e) {
                console.error("Click tracking error", e)
            }
        }
    }

    return NextResponse.redirect(targetUrl)
}
