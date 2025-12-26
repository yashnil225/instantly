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

        // Filter leads that are "opportunities" (replied or labeled)
        const opportunitiesLeads = leads.filter(l => l.status === 'replied' || (l.aiLabel && l.aiLabel !== 'interested'))

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
                sentCount: true,
                openCount: true,
                clickCount: true,
                replyCount: true,
            }
        })

        const totalSent = stats._sum.sentCount || 0
        const mockData = {
            totalSent,
            opensRate: totalSent > 0 ? Math.round(((stats._sum.openCount || 0) / totalSent) * 100) : 0,
            clickRate: totalSent > 0 ? Math.round(((stats._sum.clickCount || 0) / totalSent) * 100) : 0,
            replyRate: totalSent > 0 ? Math.round(((stats._sum.replyCount || 0) / totalSent) * 100) : 0,
            opportunities: {
                count: opportunitiesLeads.length,
                value: opportunitiesLeads.length * opportunityValue
            },
            chartData: generateChartData(startDate, now)
        }

        return NextResponse.json(mockData)
    } catch (error) {
        console.error('Analytics error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        )
    }
}

function generateChartData(startDate: Date, endDate: Date) {
    const data = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
        data.push({
            date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sent: 0,
            totalOpens: 0,
            uniqueOpens: 0,
            totalReplies: 0,
            sentClicks: 0,
            uniqueClicks: 0
        })
        currentDate.setDate(currentDate.getDate() + 1)
    }

    return data
}
