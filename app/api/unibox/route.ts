import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import moment from 'moment'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Fetch 'reply' events
        const events = await prisma.sendingEvent.findMany({
            where: {
                type: 'reply'
            },
            include: {
                lead: true,
                campaign: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        const threads = events.map(event => {
            let metadata: any = {}
            try {
                metadata = JSON.parse(event.metadata || '{}')
            } catch (e) { }

            return {
                id: event.id,
                leadId: event.leadId,
                campaignId: event.campaignId,
                lead: event.lead.firstName ? `${event.lead.firstName} ${event.lead.lastName || ''}`.trim() : event.lead.email,
                email: event.lead.email,
                subject: metadata.subject || 'No Subject',
                preview: metadata.snippet || 'Click to view message...',
                body: metadata.bodyText || metadata.snippet || '',
                time: moment(event.createdAt).fromNow(),
                fullTime: moment(event.createdAt).format('LLLL'),
                read: false, // Schema doesn't have read status yet, assume unread
                status: event.lead.status
            }
        })

        return NextResponse.json(threads)

    } catch (error) {
        console.error("Unibox Fetch Error", error)
        return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
    }
}
