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
        const openRate = sentCount > 0 ? Math.round((openCount / sentCount) * 100) + '%' : 'Disabled'
        const clickRate = sentCount > 0 ? Math.round((clickCount / sentCount) * 100) + '%' : 'Disabled'

        // Calculate opportunities and conversions from leads
        const opportunities = campaign.leads.filter((l: any) => l.aiLabel === 'opportunity')
        const conversions = campaign.leads.filter((l: any) => l.status === 'converted')

        // Generate chart data
        const chartData = generateChartData(range, campaign)

        // Generate step analytics from sequences
        const stepAnalytics = campaign.sequences.map((seq: any, index: number) => {
            // Estimate metrics per step (in real app, would track per-step)
            const estimatedSent = Math.floor(sentCount / Math.max(1, campaign.sequences.length))
            const estimatedOpened = Math.floor(openCount / Math.max(1, campaign.sequences.length))
            const estimatedReplied = Math.floor(replyCount / Math.max(1, campaign.sequences.length))
            const estimatedClicked = Math.floor(clickCount / Math.max(1, campaign.sequences.length))

            return {
                step: `Step ${seq.stepNumber}: ${seq.subject || 'Email'}`,
                sent: estimatedSent,
                opened: estimatedOpened,
                replied: estimatedReplied,
                clicked: estimatedClicked,
                opportunities: Math.floor(opportunities.length / Math.max(1, campaign.sequences.length))
            }
        })

        // Calculate completion
        const completion = totalLeads > 0 && sentCount > 0
            ? Math.min(100, Math.round((sentCount / (totalLeads * campaign.sequences.length)) * 100))
            : 0

        const analyticsData = {
            name: campaign.name,
            status: campaign.status,
            createdAt: campaign.createdAt,
            completion,
            sequenceStarted: sentCount,
            openRate,
            clickRate,
            opportunities: {
                count: opportunities.length,
                value: 0
            },
            conversions: {
                count: conversions.length,
                value: 0
            },
            chartData,
            stepAnalytics,
            leads: campaign.leads,
            sequences: campaign.sequences
        }

        return NextResponse.json(analyticsData)
    } catch (error) {
        console.error('Campaign analytics error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch campaign analytics' },
            { status: 500 }
        )
    }
}

function generateChartData(range: string, campaign: any) {
    const data = []
    const days = range === 'last_7_days' ? 7 :
        range === 'last_4_weeks' ? 28 :
            range === 'last_3_months' ? 90 :
                range === 'last_6_months' ? 180 :
                    range === 'last_12_months' ? 365 : 30

    const totalSent = campaign.sentCount || 0
    const totalOpens = campaign.openCount || 0
    const totalClicks = campaign.clickCount || 0
    const totalReplies = campaign.replyCount || 0

    const hasActivity = totalSent > 0 || totalOpens > 0 || totalClicks > 0 || totalReplies > 0

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)

        // Distribute metrics across days (in real app, would have daily tracking)
        // Only add random factor if there is actual activity to distribute
        const dailySent = hasActivity ? Math.floor((totalSent / days) + (Math.random() * 2)) : 0
        const dailyOpens = hasActivity ? Math.floor((totalOpens / days) + (Math.random() * 1)) : 0
        const dailyClicks = hasActivity ? Math.floor((totalClicks / days)) : 0
        const dailyReplies = hasActivity ? Math.floor((totalReplies / days)) : 0

        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sent: dailySent,
            totalReplies: dailyReplies,
            uniqueOpens: dailyOpens,
            totalClicks: dailyClicks,
            uniqueClicks: dailyClicks
        })
    }

    return data
}
