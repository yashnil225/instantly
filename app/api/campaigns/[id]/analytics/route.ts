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

        // Get campaign with related data
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                sequences: {
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
        const sentCount = campaign.sentCount || 0
        const openCount = campaign.openCount || 0
        const clickCount = campaign.clickCount || 0
        const replyCount = campaign.replyCount || 0

        // Calculate rates
        // Calculate rates based on tracking settings and sent count
        let openRate = 'Disabled'
        if (campaign.trackOpens) {
            openRate = sentCount > 0 ? Math.round((openCount / sentCount) * 100) + '%' : '0%'
        }

        let clickRate = 'Disabled'
        if (campaign.trackLinks) {
            clickRate = sentCount > 0 ? Math.round((clickCount / sentCount) * 100) + '%' : '0%'
        }

        // Get workspace for opportunity value
        const campaignWithWorkspace = await prisma.campaignWorkspace.findFirst({
            where: { campaignId },
            include: { workspace: true }
        })
        const opportunityValue = campaignWithWorkspace?.workspace?.opportunityValue || 5000

        // Opportunities = reply count (actual conversions from outreach)
        const opportunitiesCount = replyCount
        const conversions = campaign.leads.filter((l: any) => l.status === 'converted' || l.status === 'won')

        // Fetch real daily stats
        const dailyStats = await prisma.campaignStat.findMany({
            where: {
                campaignId: campaignId,
                date: { gte: getStartDate(range) }
            },
            orderBy: { date: 'asc' }
        })

        // Fetch all events for this campaign to calculate accurate step analytics
        const allEvents = await prisma.sendingEvent.findMany({
            where: { campaignId: campaignId }
        })

        // Generate chart data using real stats
        const chartData = generateChartData(range, dailyStats)

        // Generate accurate step analytics from events
        const stepAnalytics = campaign.sequences.map((seq: any) => {
            const stepEvents = allEvents.filter(e => {
                try {
                    const meta = JSON.parse(e.metadata || '{}')
                    return meta.step === seq.stepNumber
                } catch { return false }
            })

            return {
                step: `Step ${seq.stepNumber}: ${seq.subject || 'Email'}`,
                sent: stepEvents.filter(e => e.type === 'sent').length,
                opened: stepEvents.filter(e => e.type === 'open').length,
                replied: stepEvents.filter(e => e.type === 'reply').length,
                clicked: stepEvents.filter(e => e.type === 'click').length,
                opportunities: stepEvents.filter(e => e.type === 'reply').length // Simplified
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
            opportunities: {
                count: opportunitiesCount,
                value: opportunitiesCount * opportunityValue
            },
            conversions: {
                count: conversions.length,
                value: 0
            },
            chartData,
            stepAnalytics,
            heatmapData,
            funnelData,
            leads: campaign.leads,
            sequences: campaign.sequences
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

function getStartDate(range: string) {
    const now = new Date()
    const startDate = new Date()
    const days = range === 'last_7_days' ? 7 :
        range === 'last_4_weeks' ? 28 :
            range === 'last_3_months' ? 90 :
                range === 'last_6_months' ? 180 :
                    range === 'last_12_months' ? 365 : 30
    startDate.setDate(now.getDate() - days)
    startDate.setHours(0, 0, 0, 0)
    return startDate
}

function generateChartData(range: string, dailyStats: any[]) {
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

        const dayStat = dailyStats.find(s => {
            const sDate = new Date(s.date).toISOString().split('T')[0]
            return sDate === dateStr
        })

        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sent: dayStat?.sent || 0,
            totalOpens: dayStat?.opened || 0,
            uniqueOpens: dayStat?.opened || 0,
            totalReplies: dayStat?.replied || 0,
            totalClicks: dayStat?.clicked || 0,
            uniqueClicks: dayStat?.clicked || 0
        })
    }

    return data
}
