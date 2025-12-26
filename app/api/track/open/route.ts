export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PIXEL = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
)

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eid')

    if (eventId) {
        // Find the original sent event
        const sentEvent = await prisma.sendingEvent.findUnique({
            where: { id: eventId },
            include: { lead: true, campaign: true }
        })

        if (sentEvent && sentEvent.type === 'sent') {
            try {
                // Record Open
                await prisma.$transaction([
                    prisma.sendingEvent.create({
                        data: {
                            type: 'open',
                            campaignId: sentEvent.campaignId,
                            leadId: sentEvent.leadId,
                            metadata: JSON.stringify({ originalEventId: eventId })
                        }
                    }),
                    prisma.campaign.update({
                        where: { id: sentEvent.campaignId },
                        data: { openCount: { increment: 1 } }
                    }),
                    prisma.campaignStat.upsert({
                        where: {
                            campaignId_date: {
                                campaignId: sentEvent.campaignId,
                                date: new Date(new Date().setHours(0, 0, 0, 0))
                            }
                        },
                        create: {
                            campaignId: sentEvent.campaignId,
                            date: new Date(new Date().setHours(0, 0, 0, 0)),
                            opened: 1
                        },
                        update: {
                            opened: { increment: 1 }
                        }
                    })
                ])
            } catch (e) {
                console.error("Open tracking error", e)
            }
        }
    }

    return new NextResponse(PIXEL, {
        headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    })
}
