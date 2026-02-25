import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: campaignId } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const range = searchParams.get('range') || 'last_7_days'
        const includeAutoReplies = searchParams.get('includeAutoReplies') === 'true'

        // Get campaign with related data
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                sequences: {
                    include: { variants: true },
                    orderBy: { stepNumber: 'asc' }
                },
                leads: true
            }
        })

        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            )
        }

        // Use campaign aggregate counts
        const totalLeads = campaign.leads.length

        // Fetch all events for this campaign to calculate accurate step analytics
        const allEvents = await prisma.sendingEvent.findMany({
            where: { campaignId: campaignId }
        })

        // Calculate real-time stats from events for accuracy (Unique Opens/Clicks)
        const sentCount = allEvents.filter(e => e.type === 'sent').length
        const openCount = new Set(allEvents.filter(e => e.type === 'open').map(e => e.leadId)).size
        const clickCount = new Set(allEvents.filter(e => e.type === 'click').map(e => e.leadId)).size
        const bounceCount = new Set(allEvents.filter(e => e.type === 'bounce').map(e => e.leadId)).size

        // Fetch reply events with lead data for auto-reply filtering and classification
        const replyEvents = await prisma.sendingEvent.findMany({
            where: {
                campaignId: campaignId,
                type: 'reply'
            },
            include: { lead: true }
        })

        // Filter replies based on includeAutoReplies setting
        let filteredReplyEvents = replyEvents
        if (!includeAutoReplies) {
            filteredReplyEvents = replyEvents.filter(e => e.lead?.aiLabel !== 'out_of_office')
        }
        // Unique leads who replied
        const replyCount = new Set(filteredReplyEvents.map(e => e.leadId)).size

        // Check for unclassified replies
        const unclassifiedReplies = replyEvents.filter(e => !e.lead?.aiLabel)
        const needsClassification = unclassifiedReplies.length > 0

        // Calculate rates based on tracking settings and sent count
        let openRate = 'Disabled'
        if (campaign.trackOpens) {
            openRate = sentCount > 0 ? Math.round((openCount / sentCount) * 100) + '%' : '0%'
        }

        let clickRate = 'Disabled'
        if (campaign.trackLinks) {
            clickRate = sentCount > 0 ? Math.round((clickCount / sentCount) * 100) + '%' : '0%'
        }

        const replyRate = sentCount > 0 ? Math.round((replyCount / sentCount) * 100) + '%' : '0%'
        const bounceRate = sentCount > 0 ? Math.round((bounceCount / sentCount) * 100) + '%' : '0%'

        // Get workspace for opportunity value
        const campaignWithWorkspace = await prisma.campaignWorkspace.findFirst({
            where: { campaignId },
            include: { workspace: true }
        })
        const opportunityValue = campaignWithWorkspace?.workspace?.opportunityValue || 5000

        // Opportunities = interested, meeting_booked, or won
        const opportunityLeads = campaign.leads.filter((l: any) =>
            l.status === 'won' || ['interested', 'meeting_booked'].includes(l.aiLabel || '')
        )
        const opportunitiesCount = opportunityLeads.length
        const conversions = campaign.leads.filter((l: any) => l.status === 'converted' || l.status === 'won')
        const conversionValue = conversions.length * opportunityValue

        // Calculate positive reply rate (if all replies are classified)
        let positiveReplyRate = '0%'
        if (!needsClassification && replyCount > 0) {
            const positiveReplyCount = new Set(filteredReplyEvents.filter(e =>
                e.lead?.aiLabel && ['interested', 'meeting_booked'].includes(e.lead.aiLabel)
            ).map(e => e.leadId)).size
            positiveReplyRate = Math.round((positiveReplyCount / replyCount) * 100) + '%'
        } else if (needsClassification) {
            positiveReplyRate = 'calculating...'
        }


        // Generate chart data using real stats form events
        const chartData = generateChartData(range, allEvents)

        // Generate accurate step analytics from events
        const stepAnalytics = campaign.sequences.map((seq: any) => {
            const stepEvents = allEvents.filter(e => {
                try {
                    const meta = JSON.parse(e.metadata || '{}')
                    return meta.step === seq.stepNumber
                } catch { return false }
            })

            // Calculate variant stats
            const variantsStats = (seq.variants || []).map((v: any) => {
                const variantEvents = stepEvents.filter(e => {
                    try {
                        const meta = JSON.parse(e.metadata || '{}')
                        return meta.variantId === v.id
                    } catch { return false }
                })
                return {
                    id: v.id,
                    label: v.label || 'A',
                    subject: v.subject,
                    enabled: v.enabled,
                    sent: variantEvents.filter(e => e.type === 'sent').length,
                    opened: variantEvents.filter(e => e.type === 'open').length,
                    replied: variantEvents.filter(e => e.type === 'reply').length,
                    clicked: variantEvents.filter(e => e.type === 'click').length,
                }
            })

            return {
                stepId: seq.id,
                stepNumber: seq.stepNumber,
                step: `Step ${seq.stepNumber}: ${seq.subject || 'Email'}`,
                sent: stepEvents.filter(e => e.type === 'sent').length,
                opened: stepEvents.filter(e => e.type === 'open').length,
                replied: stepEvents.filter(e => e.type === 'reply').length,
                clicked: stepEvents.filter(e => e.type === 'click').length,
                opportunities: stepEvents.filter(e => e.type === 'reply').length,
                variants: variantsStats
            }
        })

        // Calculate completion
        const completion = campaign.status === 'completed'
            ? 100
            : totalLeads > 0 && sentCount > 0
                ? Math.min(100, Math.round((sentCount / (totalLeads * campaign.sequences.length)) * 100))
                : 0

        // Calculate heatmap data for this specific campaign
        const heatmapData = []
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const hourEvents = allEvents.filter(e => {
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

        // Calculate funnel data for this specific campaign with actual bounce count
        const bounceEvents = allEvents.filter(e => e.type === 'bounce').length
        const delivered = sentCount - bounceEvents - (campaign.bounceCount || 0)
        const deliveredPercentage = sentCount > 0 ? Math.round((delivered / sentCount) * 100) : 0

        const funnelData = [
            { stage: "Sent", value: sentCount, percentage: 100 },
            { stage: "Delivered", value: Math.max(0, delivered), percentage: Math.max(0, deliveredPercentage) },
            { stage: "Opened", value: openCount, percentage: sentCount > 0 ? Math.min(Math.round((openCount / sentCount) * 100), 100) : 0 },
            { stage: "Clicked", value: clickCount, percentage: sentCount > 0 ? Math.min(Math.round((clickCount / sentCount) * 100), 100) : 0 },
            { stage: "Replied", value: replyCount, percentage: sentCount > 0 ? Math.min(Math.round((replyCount / sentCount) * 100), 100) : 0 },
            { stage: "Converted", value: conversions.length, percentage: sentCount > 0 ? Math.min(Math.round((conversions.length / sentCount) * 100), 100) : 0 }
        ]

        const analyticsData = {
            name: campaign.name,
            status: campaign.status,
            createdAt: campaign.createdAt,
            completion,
            sequenceStarted: sentCount,
            openRate,
            clickRate,
            replyRate,
            positiveReplyRate,
            bounceRate,
            opportunities: {
                count: opportunitiesCount,
                value: opportunitiesCount * opportunityValue
            },
            conversions: {
                count: conversions.length,
                value: conversionValue
            },
            chartData,
            stepAnalytics,
            heatmapData,
            funnelData,
            leads: campaign.leads,
            sequences: campaign.sequences,
            _needsClassification: needsClassification,
            _unclassifiedCount: unclassifiedReplies.length,
            dailyLimit: campaign.dailyLimit,
            trackOpens: campaign.trackOpens,
            trackLinks: campaign.trackLinks,
            stopOnReply: campaign.stopOnReply
        }

        return NextResponse.json(analyticsData)
    } catch (error) {
        console.error('Campaign analytics error:', error)
        return NextResponse.json(
            { error: 'Failed' },
            { status: 500 }
        )
    }
}



function generateChartData(range: string, events: any[]) {
    const data = []
    const days = range === 'last_7_days' ? 7 :
        range === 'last_4_weeks' ? 28 :
            range === 'last_3_months' ? 90 :
                range === 'last_6_months' ? 180 :
                    range === 'last_12_months' ? 365 : 30

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        // Filter events for this day
        const dayEvents = events.filter(e => {
            const eDate = new Date(e.createdAt).toISOString().split('T')[0]
            return eDate === dateStr
        })

        const sent = dayEvents.filter(e => e.type === 'sent').length
        const totalReplies = dayEvents.filter(e => e.type === 'reply').length
        const totalClicks = dayEvents.filter(e => e.type === 'click').length
        const totalOpens = dayEvents.filter(e => e.type === 'open').length

        // Unique counts per lead
        const uniqueOpens = new Set(dayEvents.filter(e => e.type === 'open').map(e => e.leadId)).size
        const uniqueClicks = new Set(dayEvents.filter(e => e.type === 'click').map(e => e.leadId)).size

        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sent,
            totalOpens,
            uniqueOpens,
            totalReplies,
            totalClicks,
            uniqueClicks
        })
    }

    return data
}
