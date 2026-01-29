import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import moment from 'moment'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const searchParams = request.nextUrl.searchParams
        const status = searchParams.get('status')
        const campaignId = searchParams.get('campaign')
        const accountId = searchParams.get('inbox')
        const aiLabel = searchParams.get('aiLabel')
        const search = searchParams.get('search')
        const tab = searchParams.get('tab')

        // Build filter conditions
        const where: any = {
            type: 'reply',
            campaign: {
                // Ensure user owns the campaign or is a member
                // For now, assuming direct ownership via userId or workspace access would be checked
                // But simplified:
                // userId: session.user.id
            }
        }

        // Filter by Campaign
        if (campaignId) {
            where.campaignId = campaignId
        }

        // Filter by Inbox (Email Account)
        if (accountId) {
            where.emailAccountId = accountId
        }

        // Filters on the Lead model relation
        if (status || aiLabel || search) {
            where.lead = {}

            if (status === 'unread') {
                where.lead.isRead = false
            } else if (status === 'starred') {
                where.lead.isStarred = true
            } else if (status === 'archived') {
                where.lead.isArchived = true
            }

            if (aiLabel) {
                where.lead.aiLabel = aiLabel
            }

            if (search) {
                where.OR = [
                    { lead: { email: { contains: search } } }, // SQLite search is case-insensitive usually, but Prisma depends
                    { lead: { firstName: { contains: search } } },
                    { lead: { lastName: { contains: search } } },
                    { metadata: { contains: search } } // Search in metadata (subject/snippet)
                ]
            }
        }

        // Fetch 'reply' events
        const events = await prisma.sendingEvent.findMany({
            where,
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
                id: event.id, // Using event ID as thread ID
                leadId: event.leadId,
                campaignId: event.campaignId,
                lead: event.lead.firstName ? `${event.lead.firstName} ${event.lead.lastName || ''}`.trim() : event.lead.email,
                email: event.lead.email,
                subject: metadata.subject || 'No Subject',
                preview: metadata.snippet || 'Click to view message...',
                body: metadata.bodyText || metadata.snippet || '',
                time: moment(event.createdAt).fromNow(),
                fullTime: moment(event.createdAt).format('LLLL'),
                read: event.lead.isRead,
                isStarred: event.lead.isStarred,
                isArchived: event.lead.isArchived,
                aiLabel: event.lead.aiLabel,
                status: event.lead.status,
                campaign: {
                    id: event.campaign.id,
                    name: event.campaign.name
                }
            }
        })

        return NextResponse.json(threads)

    } catch (error) {
        console.error("Unibox Fetch Error", error)
        return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
    }
}
