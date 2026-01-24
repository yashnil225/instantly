import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const tab = searchParams.get('tab') || 'primary'

    if (!query || query.length < 2) {
        return NextResponse.json([])
    }

    try {
        // Search leads by email, name, company, or content
        const leads = await prisma.lead.findMany({
            where: {
                campaign: {
                    userId: session.user.id
                },
                OR: [
                    { email: { contains: query, mode: 'insensitive' } },
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    { company: { contains: query, mode: 'insensitive' } }
                ],
                status: {
                    not: 'new' // Only show leads that have been contacted
                }
            },
            include: {
                campaign: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                events: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                    include: {
                        emailAccount: {
                            select: {
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { updatedAt: "desc" },
            take: 50
        })

        // Filter by tab
        const filteredLeads = tab === 'primary'
            ? leads.filter(l => !['out_of_office', 'auto_reply', 'unsubscribed'].includes(l.aiLabel || ''))
            : leads.filter(l => ['out_of_office', 'auto_reply', 'unsubscribed'].includes(l.aiLabel || ''))

        // Transform to email format
        const emails = filteredLeads.map(lead => {
            const lastEvent = lead.events[0]
            const replyEvent = lead.events.find(e => e.type === "reply")
            const sentEvent = lead.events.find(e => e.type === "sent")

            // Get preview from reply content if available
            let preview = "Waiting for response"
            if (replyEvent?.details) {
                preview = replyEvent.details.trim()
            } else if (replyEvent) {
                preview = "Replied to your email"
            }

            return {
                id: lead.id,
                from: lead.email,
                fromName: `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || lead.email,
                company: lead.company,
                subject: replyEvent ? "Re: " + (sentEvent?.metadata ? JSON.parse(sentEvent.metadata).subject : "Follow up") : (sentEvent?.metadata ? JSON.parse(sentEvent.metadata).subject : "Follow up"),
                preview,
                timestamp: lead.updatedAt,
                isRead: lead.isRead,
                status: lead.status,
                aiLabel: lead.aiLabel,
                campaign: lead.campaign,
                hasReply: !!replyEvent,
                sentFrom: lastEvent?.emailAccount?.email
            }
        })

        return NextResponse.json(emails)
    } catch (error) {
        console.error('Search error:', error)
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
}
