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
        const replyEvents = await prisma.sendingEvent.count({
            where: {
                type: 'reply',
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
        const opportunitiesCount = replyEvents

        const stats = await prisma.campaignStat.aggregate({
            where: {
                date: { gte: startDate },
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
            },
            _sum: {
                sent: true,
                opened: true,
                clicked: true,
                replied: true,
                bounced: true, // Added bounced: true
            }
        })

        // Overall totals from aggregated stats
        const totalSent = stats._sum.sent || 0
        const totalOpened = stats._sum.opened || 0
        const totalClicked = stats._sum.clicked || 0
        const totalReplied = stats._sum.replied || 0

        const dailyStats = await prisma.campaignStat.findMany({
            where: {
                date: { gte: startDate },
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
            },
            orderBy: { date: 'asc' }
        })

        // Fetch events for heatmap and funnel
        const events = await prisma.sendingEvent.findMany({
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
            bounceRate: 2.1, // Placeholder for now
            spamRate: 0.4,   // Placeholder for now
            openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
            replyRate: totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0,
            domainHealth: Array.from(new Set(accountStats.map(a => a.email.split('@')[1]))).map(domain => ({
                domain,
                spf: true,
                dkim: true,
                dmarc: true,
                blacklisted: false
            })),
            recentIssues: []
        }

        // Get bounce count for accurate delivery calculation
        const bounceCount = stats._sum.bounced || (await prisma.sendingEvent.count({
            where: {
                type: 'bounce',
                createdAt: { gte: startDate },
                ...(workspaceId && workspaceId !== 'all' ? {
                    campaign: { campaignWorkspaces: { some: { workspaceId } } }
                } : {
                    campaign: { userId: session.user.id }
                })
            }
        }) || 0)

        const delivered = totalSent - bounceCount
        const deliveredPercentage = totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0

        // Calculate funnel data with actual values
        const funnelData = [
            { stage: "Sent", value: totalSent, percentage: 100 },
            { stage: "Delivered", value: delivered, percentage: deliveredPercentage },
            { stage: "Opened", value: totalOpened, percentage: totalSent > 0 ? Math.min(Math.round((totalOpened / totalSent) * 100), 100) : 0 },
            { stage: "Clicked", value: totalClicked, percentage: totalSent > 0 ? Math.min(Math.round((totalClicked / totalSent) * 100), 100) : 0 },
            { stage: "Replied", value: totalReplied, percentage: totalSent > 0 ? Math.min(Math.round((totalReplied / totalSent) * 100), 100) : 0 },
            { stage: "Converted", value: leads.filter(l => l.status === 'converted' || l.status === 'won').length, percentage: totalSent > 0 ? Math.min(Math.round((leads.filter(l => l.status === 'converted' || l.status === 'won').length / totalSent) * 100), 100) : 0 }
        ]

        const result = {
            totalSent,
            opensRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
            clickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
            replyRate: totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0,
            opportunities: {
                count: opportunitiesCount,
                value: opportunitiesCount * opportunityValue
            },
            chartData: generateChartData(startDate, now, dailyStats),
            heatmapData,
            funnelData,
            accountStats,
            deliverability
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

function generateChartData(startDate: Date, endDate: Date, dailyStats: DailyStat[]) {
    const data = []

    const currentDate = new Date(startDate)
    currentDate.setHours(0, 0, 0, 0)

    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]

        // Aggregate stats for this specific day across all campaigns
        const dayStats = dailyStats.filter(s => {
            const sDate = new Date(s.date).toISOString().split('T')[0]
            return sDate === dateStr
        })

        data.push({
            date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sent: dayStats.reduce((sum, s) => sum + (s.sent || 0), 0),
            totalOpens: dayStats.reduce((sum, s) => sum + (s.opened || 0), 0),
            uniqueOpens: dayStats.reduce((sum, s) => sum + (s.opened || 0), 0),
            totalReplies: dayStats.reduce((sum, s) => sum + (s.replied || 0), 0),
            sentClicks: dayStats.reduce((sum, s) => sum + (s.clicked || 0), 0),
            uniqueClicks: dayStats.reduce((sum, s) => sum + (s.clicked || 0), 0)
        })
        currentDate.setDate(currentDate.getDate() + 1)
    }

    return data
}
