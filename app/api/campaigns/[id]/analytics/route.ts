import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import moment from 'moment-timezone'

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
        let allEvents = await prisma.sendingEvent.findMany({
            where: { campaignId: campaignId },
            orderBy: { createdAt: 'asc' }
        })

        // Dynamically deduplicate SENT events to hide historical duplicates caused by previous race condition
        const seenSent = new Set()
        allEvents = allEvents.filter((e: any) => {
            if (e.type === 'sent') {
                let step = '1'
                try {
                    const meta = JSON.parse(e.metadata || '{}')
                    step = String(meta.step || '1')
                } catch {}
                const key = `${e.leadId}_step${step}`
                if (seenSent.has(key)) return false
                seenSent.add(key)
            }
            return true
        })

        // Total Sent = every email dispatch counts (all steps)
        const totalSent = allEvents.filter((e: any) => e.type === 'sent').length
        // Sequences Started = unique leads contacted (only counts once per lead)
        const sequencesStarted = new Set(allEvents.filter((e: any) => e.type === 'sent').map((e: any) => e.leadId)).size
        const openCount = new Set(allEvents.filter((e: any) => e.type === 'open').map((e: any) => e.leadId)).size
        const clickCount = new Set(allEvents.filter((e: any) => e.type === 'click').map((e: any) => e.leadId)).size
        const bounceCount = new Set(allEvents.filter((e: any) => e.type === 'bounce').map((e: any) => e.leadId)).size

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
            filteredReplyEvents = replyEvents.filter((e: any) => e.lead?.aiLabel !== 'out_of_office')
        }
        // Unique leads who replied
        const replyCount = new Set(filteredReplyEvents.map((e: any) => e.leadId)).size

        // Check for unclassified replies
        const unclassifiedReplies = replyEvents.filter((e: any) => !e.lead?.aiLabel)
        const needsClassification = unclassifiedReplies.length > 0

        // Calculate rates based on tracking settings and sent count
        let openRate = 'Disabled'
        if (campaign.trackOpens) {
            openRate = sequencesStarted > 0 ? Math.round((openCount / sequencesStarted) * 100) + '%' : '0%'
        }

        let clickRate = 'Disabled'
        if (campaign.trackLinks) {
            clickRate = sequencesStarted > 0 ? Math.round((clickCount / sequencesStarted) * 100) + '%' : '0%'
        }

        const replyRate = sequencesStarted > 0 ? Math.round((replyCount / sequencesStarted) * 100) + '%' : '0%'
        const bounceRate = sequencesStarted > 0 ? Math.round((bounceCount / sequencesStarted) * 100) + '%' : '0%'

        // Get workspace for opportunity value
        const campaignWithWorkspace = await prisma.campaignWorkspace.findFirst({
            where: { campaignId },
            include: { workspace: true }
        })
        const opportunityValue = campaignWithWorkspace?.workspace?.opportunityValue || 5000

        // Opportunities = interested, meeting_booked, or won
        const opportunityLeads = campaign.leads.filter((l: any) =>
            ['interested', 'meeting_booked'].includes(l.aiLabel || '')
        )
        const opportunitiesCount = opportunityLeads.length

        // Calculate positive reply rate
        let positiveReplyRate = '0%'
        let positiveReplyCount = 0
        if (!needsClassification && replyCount > 0) {
            positiveReplyCount = new Set(filteredReplyEvents.filter((e: any) =>
                e.lead?.aiLabel && ['interested', 'meeting_booked'].includes(e.lead.aiLabel)
            ).map((e: any) => e.leadId)).size
            positiveReplyRate = Math.round((positiveReplyCount / replyCount) * 100) + '%'
        } else if (needsClassification) {
            positiveReplyRate = 'calculating...'
        }


        // Pre-process events to attribute opens/clicks/replies to the correct step and variant
        const enrichedEvents = allEvents.map((e: any) => {
            let step = null;
            let variantId = null;
            let originalEventId = null;

            try {
                const meta = JSON.parse(e.metadata || '{}')
                if (e.type === 'sent') {
                    step = meta.step
                    variantId = meta.variantId
                } else {
                    originalEventId = meta.originalEventId
                }
            } catch {}

            if (e.type !== 'sent') {
                let parentSent = null;
                if (originalEventId) {
                    parentSent = allEvents.find((se: any) => se.id === originalEventId)
                } 
                if (!parentSent) {
                    // Fallback: most recent sent event for this lead before this open/click
                    const previousSents = allEvents.filter((se: any) => 
                        se.type === 'sent' && 
                        se.leadId === e.leadId && 
                        new Date(se.createdAt).getTime() <= new Date(e.createdAt).getTime()
                    )
                    if (previousSents.length > 0) {
                        previousSents.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        parentSent = previousSents[0]
                    }
                }

                if (parentSent) {
                    try {
                        const meta = JSON.parse(parentSent.metadata || '{}')
                        step = meta.step
                        variantId = meta.variantId
                    } catch {}
                }
            }

            return { ...e, enrichedStep: step, enrichedVariantId: variantId }
        })

        // Generate chart data using real stats form events
        const chartData = generateChartData(range, enrichedEvents)

        // Generate accurate step analytics from enriched events
        const stepAnalytics = campaign.sequences.map((seq: any) => {
            const stepEvents = enrichedEvents.filter((e: any) => e.enrichedStep === seq.stepNumber)

            // Calculate variant stats
            const variantsStats = (seq.variants || []).map((v: any) => {
                const variantEvents = stepEvents.filter((e: any) => e.enrichedVariantId === v.id)
                
                // Use Set to ensure we only count unique leads for opens/clicks/replies per variant
                const sent = variantEvents.filter((e: any) => e.type === 'sent').length
                const opened = new Set(variantEvents.filter((e: any) => e.type === 'open').map((e: any) => e.leadId)).size
                const replied = new Set(variantEvents.filter((e: any) => e.type === 'reply').map((e: any) => e.leadId)).size
                const clicked = new Set(variantEvents.filter((e: any) => e.type === 'click').map((e: any) => e.leadId)).size

                return {
                    id: v.id,
                    label: v.label || 'A',
                    subject: v.subject,
                    enabled: v.enabled,
                    sent,
                    opened,
                    replied,
                    clicked,
                }
            })

            const sent = stepEvents.filter((e: any) => e.type === 'sent').length
            const opened = new Set(stepEvents.filter((e: any) => e.type === 'open').map((e: any) => e.leadId)).size
            const replied = new Set(stepEvents.filter((e: any) => e.type === 'reply').map((e: any) => e.leadId)).size
            const clicked = new Set(stepEvents.filter((e: any) => e.type === 'click').map((e: any) => e.leadId)).size

            return {
                stepId: seq.id,
                stepNumber: seq.stepNumber,
                step: `Step ${seq.stepNumber}: ${seq.subject || 'Email'}`,
                sent,
                opened,
                replied,
                clicked,
                opportunities: new Set(stepEvents.filter((e: any) => {
                    const lead = campaign.leads.find((l: any) => l.id === e.leadId)
                    return lead && (['won', 'converted'].includes(lead.status || '') || ['interested', 'meeting_booked'].includes(lead.aiLabel || ''))
                }).map((e: any) => e.leadId)).size,
                variants: variantsStats
            }
        })

        // Calculate completion — only counts leads who completed ALL sequence steps
        const completedLeads = campaign.leads.filter((l: any) => l.status === 'sequence_complete').length
        const completion = campaign.status === 'completed'
            ? 100
            : totalLeads > 0
                ? Math.min(100, Math.round((completedLeads / totalLeads) * 100))
                : 0

        // Determine target timezone from campaign schedule settings
        let targetTimezone = campaign.timezone || 'UTC'
        if (campaign.schedules) {
            try {
                const parsed = JSON.parse(campaign.schedules)
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].timezone) {
                    targetTimezone = parsed[0].timezone
                }
            } catch {}
        }
        // Allow client to request a specific timezone via query params if desired
        const requestedTimezone = searchParams.get('timezone')
        if (requestedTimezone && moment.tz.zone(requestedTimezone)) {
            targetTimezone = requestedTimezone
        }

        // Calculate heatmap data for this specific campaign in its schedule timezone
        const heatmapData = []
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const hourEvents = allEvents.filter((e: any) => {
                    const m = moment(e.createdAt).tz(targetTimezone)
                    return m.day() === day && m.hour() === hour
                })
                heatmapData.push({
                    day,
                    hour,
                    value: hourEvents.filter((e: any) => e.type === 'sent').length,
                    opens: hourEvents.filter((e: any) => e.type === 'open').length,
                    clicks: hourEvents.filter((e: any) => e.type === 'click').length,
                    replies: hourEvents.filter((e: any) => e.type === 'reply').length
                })
            }
        }

        // Calculate funnel data for this specific campaign with actual bounce count
        const bounceEvents = allEvents.filter((e: any) => e.type === 'bounce').length
        const totalBounces = Math.max(bounceEvents, campaign.bounceCount || 0)
        const delivered = Math.max(0, totalSent - totalBounces)
        const deliveredPercentage = totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0

        const funnelData = [
            { stage: "Sent", value: totalSent, percentage: 100 },
            { stage: "Delivered", value: delivered, percentage: deliveredPercentage },
            { stage: "Opened", value: openCount, percentage: totalSent > 0 ? Math.min(Math.round((openCount / totalSent) * 100), 100) : 0 },
            { stage: "Clicked", value: clickCount, percentage: totalSent > 0 ? Math.min(Math.round((clickCount / totalSent) * 100), 100) : 0 },
            { stage: "Replied", value: replyCount, percentage: totalSent > 0 ? Math.min(Math.round((replyCount / totalSent) * 100), 100) : 0 }
        ]

        // Recent campaign activity
        const recentActivity = allEvents.slice(0, 50).map((e: any) => ({
            id: e.id,
            type: e.type,
            createdAt: e.createdAt,
            leadEmail: e.lead?.email || 'Lead',
            leadName: `${e.lead?.firstName || ''} ${e.lead?.lastName || ''}`.trim() || e.lead?.email,
            metadata: e.metadata
        }))

        const analyticsData = {
            name: campaign.name,
            status: campaign.status,
            createdAt: campaign.createdAt,
            completion,
            totalSent,
            sequenceStarted: sequencesStarted,
            openRate,
            clickRate,
            replyRate,
            positiveReplyRate,
            bounceRate,
            opportunities: {
                count: opportunitiesCount,
                value: opportunitiesCount * opportunityValue
            },
            openCount,
            clickCount,
            replyCount,
            positiveReplyCount,
            chartData,
            stepAnalytics,
            heatmapData,
            timezone: targetTimezone,
            funnelData,
            recentActivity,
            leads: campaign.leads,
            sequences: campaign.sequences,
            _needsClassification: needsClassification,
            _unclassifiedCount: unclassifiedReplies.length,
            dailyLimit: campaign.dailyLimit,
            trackOpens: campaign.trackOpens,
            trackLinks: campaign.trackLinks,
            stopOnReply: campaign.stopOnReply,
            sendAsTextOnly: campaign.settings ? (() => { try { return JSON.parse(campaign.settings).sendAsTextOnly } catch { return false } })() : false,
            settings: campaign.settings
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
