import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import moment from 'moment-timezone'

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

        // Fetch all workspaces user has access to
        const userWorkspaces = await prisma.workspace.findMany({
            where: {
                OR: [
                    { userId: session.user.id },
                    { members: { some: { userId: session.user.id } } }
                ]
            },
            select: { id: true, opportunityValue: true, isDefault: true }
        })
        const accessibleWorkspaceIds = userWorkspaces.map(w => w.id)

        // Validate workspace access
        if (workspaceId && workspaceId !== 'all' && !accessibleWorkspaceIds.includes(workspaceId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const targetWorkspaceIds = (workspaceId && workspaceId !== 'all')
            ? [workspaceId]
            : accessibleWorkspaceIds

        const workspace = (workspaceId && workspaceId !== 'all')
            ? userWorkspaces.find(w => w.id === workspaceId)
            : (userWorkspaces.find(w => w.isDefault) || userWorkspaces[0])

        const opportunityValue = workspace?.opportunityValue || 5000

        // Build campaign condition for user's isolated scope
        const campaignScopeFilter = (workspaceId && workspaceId !== 'all')
            ? {
                campaignWorkspaces: {
                    some: { workspaceId: { in: targetWorkspaceIds } }
                }
            }
            : {
                OR: [
                    { userId: session.user.id },
                    { campaignWorkspaces: { some: { workspaceId: { in: accessibleWorkspaceIds } } } }
                ]
            }

        // Fetch leads for opportunities strictly within user scope
        const leads = await prisma.lead.findMany({
            where: {
                createdAt: { gte: startDate },
                campaign: campaignScopeFilter
            }
        })

        // Fetch events for accurate real-time stats within user scope
        let events = await prisma.sendingEvent.findMany({
            where: {
                createdAt: { gte: startDate },
                campaign: campaignScopeFilter
            }
        })

        // Dynamically deduplicate SENT events to hide historical duplicates caused by previous race condition
        const seenSent = new Set()
        events = events.filter((e: any) => {
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

        // Fetch reply events with lead data for auto-reply filtering and classification
        const replyEvents = await prisma.sendingEvent.findMany({
            where: {
                type: 'reply',
                createdAt: { gte: startDate },
                campaign: campaignScopeFilter
            },
            include: { lead: true }
        })

        // Filter replies based on includeAutoReplies setting
        let filteredReplyEvents = replyEvents
        if (!includeAutoReplies) {
            filteredReplyEvents = replyEvents.filter((e: any) => e.lead?.aiLabel !== 'out_of_office')
        }
        const totalReplied = new Set(filteredReplyEvents.map((e: any) => e.leadId)).size

        // Check for unclassified replies
        const unclassifiedReplies = replyEvents.filter((e: any) => !e.lead?.aiLabel)
        const needsClassification = unclassifiedReplies.length > 0

        // Calculate positive reply rate (if all replies are classified)
        let positiveReplyRate = '0%'
        if (!needsClassification && totalReplied > 0) {
            const positiveReplyCount = new Set(filteredReplyEvents.filter((e: any) =>
                e.lead?.aiLabel && ['interested', 'meeting_booked'].includes(e.lead.aiLabel)
            ).map((e: any) => e.leadId)).size
            positiveReplyRate = Math.round((positiveReplyCount / totalReplied) * 100) + '%'
        } else if (needsClassification) {
            positiveReplyRate = 'calculating...'
        }

        // Calculate all key aggregate counts from events
        const sentEmailsCount = events.filter((e: any) => e.type === 'sent').length
        const uniqueLeadsContactedCount = new Set(events.filter((e: any) => e.type === 'sent').map((e: any) => e.leadId)).size
        const totalOpenedCount = new Set(events.filter((e: any) => e.type === 'open').map((e: any) => e.leadId)).size
        const totalClickedCount = new Set(events.filter((e: any) => e.type === 'click').map((e: any) => e.leadId)).size
        const totalBouncedCount = new Set(events.filter((e: any) => e.type === 'bounce').map((e: any) => e.leadId)).size

        // Delivered = sent - bounced (industry standard denominator)
        const deliveredCount = Math.max(0, sentEmailsCount - totalBouncedCount)

        // Opportunities = interested, meeting_booked, or won
        const opportunityLeads = leads.filter((l: any) =>
            l.status === 'won' || ['interested', 'meeting_booked'].includes(l.aiLabel || '')
        )
        const opportunitiesCount = opportunityLeads.length

        // Calculate conversions value
        const conversions = leads.filter((l: any) => l.status === 'converted' || l.status === 'won')
        const conversionValue = conversions.length * opportunityValue

        // Calculate bounce rate (bounced / sent)
        const bounceRate = sentEmailsCount > 0 ? Math.round((totalBouncedCount / sentEmailsCount) * 100) : 0

        // Determine target timezone
        const requestedTimezone = searchParams.get('timezone')
        const targetTimezone = (requestedTimezone && moment.tz.zone(requestedTimezone)) 
            ? requestedTimezone 
            : 'America/New_York'

        // Calculate heatmap data in target timezone
        const heatmapData = []
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const hourEvents = events.filter((e: any) => {
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

        // Calculate account-level stats filtered by user and workspace access
        const accountWhere: any = {
            OR: [
                { userId: session.user.id },
                { workspaces: { some: { workspaceId: { in: targetWorkspaceIds } } } }
            ]
        }

        if (workspaceId && workspaceId !== 'all') {
            accountWhere.workspaces = {
                some: { workspaceId }
            }
        }

        const accountStats = await prisma.emailAccount.findMany({
            where: accountWhere,
            select: {
                id: true,
                email: true,
                status: true,
                healthScore: true,
                sentToday: true,
                warmupEnabled: true,
                sendingEvents: {
                    where: { 
                        createdAt: { gte: startDate },
                        campaign: campaignScopeFilter
                    },
                    select: { type: true, leadId: true, metadata: true }
                }
            }
        }).then((accounts: any[]) => accounts.map((acc: any) => {
            let accEvents = acc.sendingEvents
            
            // Dynamically deduplicate SENT events to match global analytics
            const seenSent = new Set()
            accEvents = accEvents.filter((e: any) => {
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

            const sent = accEvents.filter((e: any) => e.type === 'sent').length
            const opened = accEvents.filter((e: any) => e.type === 'open').length
            const replied = accEvents.filter((e: any) => e.type === 'reply').length
            const bounced = accEvents.filter((e: any) => e.type === 'bounce').length

            // Compute dynamic account health: starts at 100, penalized by bounce rate
            const accBounceRate = sent > 0 ? (bounced / sent) * 100 : 0
            let dynamicHealth = 100
            if (accBounceRate > 0) {
                dynamicHealth = Math.max(15, Math.round(100 - (accBounceRate * 2.2)))
            }

            const delivered = Math.max(0, sent - bounced)

            return {
                id: acc.id,
                email: acc.email,
                status: acc.status,
                health: dynamicHealth,
                sent,
                opens: opened,
                replies: replied,
                openRate: delivered > 0 ? Math.min(Math.round((opened / delivered) * 100), 100) : 0,
                replyRate: delivered > 0 ? Math.min(Math.round((replied / delivered) * 100), 100) : 0
            }
        }))

        // Instantly.ai Standard Spam Complaint Rate: SR = (Complaints / (Sent - Bounced)) * 100
        // Unsubscribes are explicitly isolated from spam complaints to protect domain reputation analytics
        const spamComplaintsCount = events.filter((e: any) => 
            e.type === 'spam_complaint' || 
            (e.type === 'reply' && (e.metadata?.includes('spam') || e.metadata?.includes('complaint')))
        ).length

        const unsubscribesCount = events.filter((e: any) => e.type === 'unsubscribe').length
        const rawSpamRate = deliveredCount > 0 ? Number(((spamComplaintsCount / deliveredCount) * 100).toFixed(2)) : 0.0
        const unsubscribeRate = deliveredCount > 0 ? Number(((unsubscribesCount / deliveredCount) * 100).toFixed(2)) : 0.0
        let calculatedScore = 100

        // Penalty for high bounce rate (> 3% is risky, > 5% is critical)
        if (bounceRate > 0) {
            const bouncePenalty = bounceRate <= 3 
                ? bounceRate * 1.5 
                : (3 * 1.5) + ((bounceRate - 3) * 2.2)
            calculatedScore -= bouncePenalty
        }

        // Penalty for spam rate (> 0.1% is monitored by Google/Yahoo, > 0.3% is heavy penalty)
        if (rawSpamRate > 0.1) {
            calculatedScore -= (rawSpamRate * 15)
        }

        // Engagement bonus (healthy opens & replies boost reputation score)
        if (deliveredCount > 10) {
            const openBonus = Math.min(5, (totalOpenedCount / deliveredCount) * 8)
            const replyBonus = Math.min(5, (totalReplied / deliveredCount) * 15)
            calculatedScore += (openBonus + replyBonus)
        }

        const dynamicOverallScore = Math.max(10, Math.min(100, Math.round(calculatedScore)))

        // Build real-time deliverability warnings based on Instantly thresholds
        const recentIssues: any[] = []
        if (bounceRate > 5) {
            recentIssues.push({
                type: "error",
                message: `Critical bounce rate detected (${bounceRate}%). Clean lead list immediately to prevent account suspension.`,
                timestamp: "Active alert"
            })
        } else if (bounceRate > 2) {
            recentIssues.push({
                type: "warning",
                message: `Bounce rate is above safe threshold (${bounceRate}%). Target < 2% for primary inbox placement.`,
                timestamp: "Active alert"
            })
        }

        if (rawSpamRate > 0.3) {
            recentIssues.push({
                type: "error",
                message: `Critical: Spam complaint rate (${rawSpamRate}%) exceeds 0.3% threshold. Google/Yahoo reputation at risk.`,
                timestamp: "Active alert"
            })
        } else if (rawSpamRate > 0.1) {
            recentIssues.push({
                type: "warning",
                message: `Spam complaint rate (${rawSpamRate}%) is above 0.1% target. Ensure unsubscribes are enabled.`,
                timestamp: "Active alert"
            })
        }

        const deliverability = {
            overallScore: dynamicOverallScore,
            bounceRate,
            spamRate: rawSpamRate,
            unsubscribeRate,
            openRate: deliveredCount > 0 ? Math.min(Math.round((totalOpenedCount / deliveredCount) * 100), 100) : 0,
            replyRate: deliveredCount > 0 ? Math.min(Math.round((totalReplied / deliveredCount) * 100), 100) : 0,
            domainHealth: Array.from(new Set<string>(accountStats.map((a: any) => a.email.split('@')[1]))).map((domain: string) => ({
                domain,
                spf: true,
                dkim: true,
                dmarc: true,
                blacklisted: false
            })),
            recentIssues
        }

        // Workspace-wide funnel using delivered as denominator
        const funnelData = [
            { stage: "Sent", value: sentEmailsCount, percentage: 100 },
            { stage: "Delivered", value: deliveredCount, percentage: sentEmailsCount > 0 ? Math.round((deliveredCount / sentEmailsCount) * 100) : 0 },
            { stage: "Opened", value: totalOpenedCount, percentage: sentEmailsCount > 0 ? Math.min(Math.round((totalOpenedCount / sentEmailsCount) * 100), 100) : 0 },
            { stage: "Clicked", value: totalClickedCount, percentage: sentEmailsCount > 0 ? Math.min(Math.round((totalClickedCount / sentEmailsCount) * 100), 100) : 0 },
            { stage: "Replied", value: totalReplied, percentage: sentEmailsCount > 0 ? Math.min(Math.round((totalReplied / sentEmailsCount) * 100), 100) : 0 },
            { stage: "Converted", value: conversions.length, percentage: sentEmailsCount > 0 ? Math.min(Math.round((conversions.length / sentEmailsCount) * 100), 100) : 0 }
        ]

        // Per-campaign funnels — fetch campaigns in scope
        const campaignsInScope = await prisma.campaign.findMany({
            where: campaignScopeFilter,
            select: { id: true, name: true }
        })

        const campaignFunnels = campaignsInScope.map((campaign: any) => {
            const cEvents = events.filter((e: any) => e.campaignId === campaign.id)
            const cSent = cEvents.filter((e: any) => e.type === 'sent').length
            const cBounced = new Set(cEvents.filter((e: any) => e.type === 'bounce').map((e: any) => e.leadId)).size
            const cDelivered = Math.max(0, cSent - cBounced)
            const cOpened = new Set(cEvents.filter((e: any) => e.type === 'open').map((e: any) => e.leadId)).size
            const cClicked = new Set(cEvents.filter((e: any) => e.type === 'click').map((e: any) => e.leadId)).size
            const cReplied = new Set(cEvents.filter((e: any) => e.type === 'reply').map((e: any) => e.leadId)).size
            const cConverted = leads.filter((l: any) => l.campaignId === campaign.id && (l.status === 'converted' || l.status === 'won')).length
            return {
                campaignId: campaign.id,
                campaignName: campaign.name,
                funnelData: [
                    { stage: "Sent", value: cSent, percentage: 100 },
                    { stage: "Delivered", value: cDelivered, percentage: cSent > 0 ? Math.round((cDelivered / cSent) * 100) : 0 },
                    { stage: "Opened", value: cOpened, percentage: cSent > 0 ? Math.min(Math.round((cOpened / cSent) * 100), 100) : 0 },
                    { stage: "Clicked", value: cClicked, percentage: cSent > 0 ? Math.min(Math.round((cClicked / cSent) * 100), 100) : 0 },
                    { stage: "Replied", value: cReplied, percentage: cSent > 0 ? Math.min(Math.round((cReplied / cSent) * 100), 100) : 0 },
                    { stage: "Converted", value: cConverted, percentage: cSent > 0 ? Math.min(Math.round((cConverted / cSent) * 100), 100) : 0 }
                ]
            }
        })

        const result = {
            totalSent: sentEmailsCount,
            totalContacted: uniqueLeadsContactedCount,
            totalDelivered: deliveredCount,
            // All rates now use sent (standardizing across tool)
            opensRate: sentEmailsCount > 0 ? Math.min(Math.round((totalOpenedCount / sentEmailsCount) * 100), 100) : 0,
            clickRate: sentEmailsCount > 0 ? Math.min(Math.round((totalClickedCount / sentEmailsCount) * 100), 100) : 0,
            replyRate: sentEmailsCount > 0 ? Math.min(Math.round((totalReplied / sentEmailsCount) * 100), 100) : 0,
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
