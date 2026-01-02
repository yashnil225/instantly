import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ type: string }> }
) {
    const { type } = await params
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lid')
    const campaignId = searchParams.get('cid')
    const url = searchParams.get('url') // For clicks

    if (!leadId || !campaignId) {
        return new NextResponse('Missing params', { status: 400 })
    }

    try {
        // Record Event
        if (type === 'open' || type === 'click') {
            await prisma.sendingEvent.create({
                data: {
                    type,
                    leadId,
                    campaignId,
                    metadata: url ? JSON.stringify({ url }) : undefined
                }
            })

            // Update Campaign Stats (Atomic increment)
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            await prisma.campaignStat.upsert({
                where: {
                    campaignId_date: {
                        campaignId,
                        date: today
                    }
                },
                create: {
                    campaignId,
                    date: today,
                    [type === 'open' ? 'opened' : 'clicked']: 1
                },
                update: {
                    [type === 'open' ? 'opened' : 'clicked']: { increment: 1 }
                }
            })

            // Update Campaign Aggregates
            await prisma.campaign.update({
                where: { id: campaignId },
                data: {
                    [type === 'open' ? 'openCount' : 'clickCount']: { increment: 1 }
                }
            })
        }

        // Response
        if (type === 'open') {
            // Return 1x1 transparent GIF
            const pixel = Buffer.from(
                'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                'base64'
            )
            return new NextResponse(pixel, {
                headers: {
                    'Content-Type': 'image/gif',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            })
        } else if (type === 'click' && url) {
            // Redirect to original URL
            return NextResponse.redirect(url)
        }

        return new NextResponse('OK')
    } catch (error) {
        console.error('Tracking error:', error)
        return new NextResponse('Error', { status: 500 })
    }
}
