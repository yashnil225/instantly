import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'last_7_days'
    const workspaceId = searchParams.get('workspaceId')
    const includeAutoReplies = searchParams.get('includeAutoReplies') === 'true'

    try {
        // Calculate date range
        const now = new Date()
        let startDate = new Date()

        switch (range) {
            case 'last_7_days':
                startDate.setDate(now.getDate() - 7)
                break
            case 'month_to_date':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                break
            case 'last_4_weeks':
                startDate.setDate(now.getDate() - 28)
                break
            case 'last_3_months':
                startDate.setMonth(now.getMonth() - 3)
                break
            case 'last_6_months':
                startDate.setMonth(now.getMonth() - 6)
                break
            case 'last_12_months':
                startDate.setMonth(now.getMonth() - 12)
                break
            default:
                startDate.setDate(now.getDate() - 7)
        }

        // Fetch workspace for opportunity value
        const workspace = workspaceId && workspaceId !== 'all'
            ? await prisma.workspace.findUnique({ where: { id: workspaceId } })
            : await prisma.workspace.findFirst({ where: { userId: session.user.id, isDefault: true } })

        const opportunityValue = workspace?.opportunityValue || 5000

        // Fetch leads for opportunities
        const leads = await prisma.lead.findMany({
            where: {
                createdAt: { gte: startDate },
                ...(workspaceId && workspaceId !== 'all' ? {
                    campaign: {
                        campaignWorkspaces: {
                            some: { workspaceId }
                        }
                    }
                } : {
                    campaign: {
                        userId: session.user.id
                    }
                })
            }
        })

        // Opportunities = leads that have received replies (actual reply events from the campaign)
        // Count reply events, not just status, for accurate opportunity calculation
        // Fetch events for accurate real-time stats (replacing CampaignStat aggregation)
        // We fetch ALL events for the filtered scope to ensure 100% accuracy and real-time updates
        const events = await prisma.sendingEvent.findMany({
            where: {
                createdAt: { gte: startDate },
                ...(workspaceId && workspaceId !== 'all' ? {
                    campaign: {
                        campaignWorkspaces: { some: { workspaceId } }
                    }
                } : {
                    campaign: { userId: session.user.id }
                })
            }
        })

        // Fetch reply events with lead data for auto-reply filtering and classification
        const replyEvents = await prisma.sendingEvent.findMany({
            where: {
                type: 'reply',
                createdAt: { gte: startDate },
                ...(workspaceId && workspaceId !== 'all' ? {
                    campaign: {
                        campaignWorkspaces: { some: { workspaceId } }
                    }
                } : {
                    campaign: { userId: session.user.id }
                })
            },
            include: { lead: true }
        })

        // Filter replies based on includeAutoReplies setting
        let filteredReplyEvents = replyEvents
        if (!includeAutoReplies) {
            filteredReplyEvents = replyEvents.filter(e => e.lead?.aiLabel !== 'out_of_office')
        }
        const totalReplied = new Set(filteredReplyEvents.map(e => e.leadId)).size

        // Check for unclassified replies
        const unclassifiedReplies = replyEvents.filter(e => !e.lead?.aiLabel)
        const needsClassification = unclassifiedReplies.length > 0

        // Calculate positive reply rate (if all replies are classified)
        let positiveReplyRate = '0%'
        if (!needsClassification && totalReplied > 0) {
            const positiveReplyCount = new Set(filteredReplyEvents.filter(e =>
                e.lead?.aiLabel && ['interested', 'meeting_booked'].includes(e.lead.aiLabel)
            ).map(e => e.leadId)).size
            positiveReplyRate = Math.round((positiveReplyCount / totalReplied) * 100) + '%'
        } else if (needsClassification) {
            positiveReplyRate = 'calculating...'
        }

        // Calculate all key aggregate counts from events
        const sentEmailsCount = events.filter(e => e.type === 'sent').length
        const uniqueLeadsContactedCount = new Set(events.filter(e => e.type === 'sent').map(e => e.leadId)).size
        const totalOpenedCount = new Set(events.filter(e => e.type === 'open').map(e => e.leadId)).size
        const totalClickedCount = new Set(events.filter(e => e.type === 'click').map(e => e.leadId)).size
        const totalBouncedCount = new Set(events.filter(e => e.type === 'bounce').map(e => e.leadId)).size

        // Delivered = sent - bounced (industry standard denominator)
        const deliveredCount = Math.max(0, sentEmailsCount - totalBouncedCount)

        // Opportunities = interested, meeting_booked, or won
        const opportunityLeads = leads.filter(l =>
            l.status === 'won' || ['interested', 'meeting_booked'].includes(l.aiLabel || '')
        )
        const opportunitiesCount = opportunityLeads.length

        // Calculate conversions value
        const conversions = leads.filter(l => l.status === 'converted' || l.status === 'won')
        const conversionValue = conversions.length * opportunityValue

        // Calculate bounce rate (bounced / sent)
        const bounceRate = sentEmailsCount > 0 ? Math.round((totalBouncedCount / sentEmailsCount) * 100) : 0

        // Calculate heatmap data
        const heatmapData = []
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const hourEvents = events.filter(e => {
                    const date = new Date(e.createdAt)
                    return date.getDay() === day && date.getHours() === hour
                })
                heatmapData.push({
                    day,
                    hour,
                    value: hourEvents.filter(e => e.type === 'sent').length,
                    opens: hourEvents.filter(e => e.type === 'open').length,
                    clicks: hourEvents.filter(e => e.type === 'click').length,
                    replies: hourEvents.filter(e => e.type === 'reply').length
                })
            }
        }

        // Calculate account-level stats
        const accountStats = await prisma.emailAccount.findMany({
            where: {
                userId: session.user.id
            },
            select: {
                id: true,
                email: true,
                status: true,
                healthScore: true,
                sentToday: true,
                warmupEnabled: true,
                sendingEvents: {
                    where: { createdAt: { gte: startDate } },
                    select: { type: true }
                }
            }
        }).then(accounts => accounts.map(acc => {
            const accEvents = acc.sendingEvents
            const sent = accEvents.filter(e => e.type === 'sent').length
            const opened = accEvents.filter(e => e.type === 'open').length
            const replied = accEvents.filter(e => e.type === 'reply').length

            return {
                id: acc.id,
                email: acc.email,
                status: acc.status,
                health: acc.healthScore,
                sent,
                opens: opened,
                replies: replied,
                openRate: sent > 0 ? Math.min(Math.round((opened / sent) * 100), 100) : 0,
                replyRate: sent > 0 ? Math.min(Math.round((replied / sent) * 100), 100) : 0
            }
        }))

        // Overall deliverability metrics

        const deliverability = {
            overallScore: Math.round(accountStats.reduce((acc, curr) => acc + curr.health, 0) / (accountStats.length || 1)),
            bounceRate,
            spamRate: 0.4,   // Placeholder for now
            // Use delivered as denominator (industry standard)
            openRate: deliveredCount > 0 ? Math.min(Math.round((totalOpenedCount / deliveredCount) * 100), 100) : 0,
            replyRate: deliveredCount > 0 ? Math.min(Math.round((totalReplied / deliveredCount) * 100), 100) : 0,
            domainHealth: Array.from(new Set(accountStats.map(a => a.email.split('@')[1]))).map(domain => ({
                domain,
                spf: true,
                dkim: true,
                dmarc: true,
                blacklisted: false
            })),
            recentIssues: []
        }

        // Workspace-wide funnel using delivered as denominator
        const funnelData = [
            { stage: "Sent", value: sentEmailsCount, percentage: 100 },
            { stage: "Delivered", value: deliveredCount, percentage: sentEmailsCount > 0 ? Math.round((deliveredCount / sentEmailsCount) * 100) : 0 },
            { stage: "Opened", value: totalOpenedCount, percentage: deliveredCount > 0 ? Math.min(Math.round((totalOpenedCount / deliveredCount) * 100), 100) : 0 },
            { stage: "Clicked", value: totalClickedCount, percentage: deliveredCount > 0 ? Math.min(Math.round((totalClickedCount / deliveredCount) * 100), 100) : 0 },
            { stage: "Replied", value: totalReplied, percentage: deliveredCount > 0 ? Math.min(Math.round((totalReplied / deliveredCount) * 100), 100) : 0 },
            { stage: "Converted", value: conversions.length, percentage: deliveredCount > 0 ? Math.min(Math.round((conversions.length / deliveredCount) * 100), 100) : 0 }
        ]

        // Per-campaign funnels — fetch campaigns in scope
        const campaignsInScope = await prisma.campaign.findMany({
            where: {
                ...(workspaceId && workspaceId !== 'all' ? {
                    campaignWorkspaces: { some: { workspaceId } }
                } : {
                    userId: session.user.id
                })
            },
            select: { id: true, name: true }
        })

        const campaignFunnels = campaignsInScope.map(campaign => {
            const cEvents = events.filter(e => e.campaignId === campaign.id)
            const cSent = cEvents.filter(e => e.type === 'sent').length
            const cBounced = new Set(cEvents.filter(e => e.type === 'bounce').map(e => e.leadId)).size
            const cDelivered = Math.max(0, cSent - cBounced)
            const cOpened = new Set(cEvents.filter(e => e.type === 'open').map(e => e.leadId)).size
            const cClicked = new Set(cEvents.filter(e => e.type === 'click').map(e => e.leadId)).size
            const cReplied = new Set(cEvents.filter(e => e.type === 'reply').map(e => e.leadId)).size
            const cConverted = leads.filter(l => l.campaignId === campaign.id && (l.status === 'converted' || l.status === 'won')).length
            return {
                campaignId: campaign.id,
                campaignName: campaign.name,
                funnelData: [
                    { stage: "Sent", value: cSent, percentage: 100 },
                    { stage: "Delivered", value: cDelivered, percentage: cSent > 0 ? Math.round((cDelivered / cSent) * 100) : 0 },
                    { stage: "Opened", value: cOpened, percentage: cDelivered > 0 ? Math.min(Math.round((cOpened / cDelivered) * 100), 100) : 0 },
                    { stage: "Clicked", value: cClicked, percentage: cDelivered > 0 ? Math.min(Math.round((cClicked / cDelivered) * 100), 100) : 0 },
                    { stage: "Replied", value: cReplied, percentage: cDelivered > 0 ? Math.min(Math.round((cReplied / cDelivered) * 100), 100) : 0 },
                    { stage: "Converted", value: cConverted, percentage: cDelivered > 0 ? Math.min(Math.round((cConverted / cDelivered) * 100), 100) : 0 }
                ]
            }
        })

        const result = {
            totalSent: sentEmailsCount,
            totalContacted: uniqueLeadsContactedCount,
            totalDelivered: deliveredCount,
            // All rates now use delivered (industry standard: unique actions / delivered * 100)
            opensRate: deliveredCount > 0 ? Math.min(Math.round((totalOpenedCount / deliveredCount) * 100), 100) : 0,
            clickRate: deliveredCount > 0 ? Math.min(Math.round((totalClickedCount / deliveredCount) * 100), 100) : 0,
            replyRate: deliveredCount > 0 ? Math.min(Math.round((totalReplied / deliveredCount) * 100), 100) : 0,
            positiveReplyRate,
            opportunities: {
                count: opportunitiesCount,
                value: opportunitiesCount * opportunityValue
            },
            conversions: {
                count: conversions.length,
                value: conversionValue
            },
            chartData: generateChartData(startDate, now, events),
            heatmapData,
            funnelData,
            campaignFunnels,
            accountStats,
            deliverability,
            _needsClassification: needsClassification,
            _unclassifiedCount: unclassifiedReplies.length
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Analytics error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

interface DailyStat {
    date: Date | string;
    sent?: number;
    opened?: number;
    clicked?: number;
    replied?: number;
}

function generateChartData(startDate: Date, endDate: Date, events: any[]) {
    const data = []
    const currentDate = new Date(startDate)
    currentDate.setHours(0, 0, 0, 0)

    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]

        // Filter events for this day
        const dayEvents = events.filter(e => {
            const eDate = new Date(e.createdAt).toISOString().split('T')[0]
            return eDate === dateStr
        })

        const sent = dayEvents.filter(e => e.type === 'sent').length
        const totalOpens = dayEvents.filter(e => e.type === 'open').length
        const totalReplies = dayEvents.filter(e => e.type === 'reply').length
        const totalClicks = dayEvents.filter(e => e.type === 'click').length
        const uniqueOpens = new Set(dayEvents.filter(e => e.type === 'open').map(e => e.leadId)).size
        const uniqueClicks = new Set(dayEvents.filter(e => e.type === 'click').map(e => e.leadId)).size

        data.push({
            date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sent,
            totalOpens,
            uniqueOpens,
            totalReplies,
            sentClicks: totalClicks,
            uniqueClicks
        })
        currentDate.setDate(currentDate.getDate() + 1)
    }

    return data
}
