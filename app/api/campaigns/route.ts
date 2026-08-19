import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tagsParam = searchParams.get('tags')
    const tagIds = tagsParam ? tagsParam.split(',') : []

    // Support both single and multiple workspace IDs
    const singleWorkspaceId = searchParams.get('workspaceId')
    const multipleWorkspaceIdsParam = searchParams.get('workspaceIds')
    const multipleWorkspaceIds = multipleWorkspaceIdsParam ? multipleWorkspaceIdsParam.split(',') : []

    const workspaceIds = singleWorkspaceId && singleWorkspaceId !== 'all'
        ? [singleWorkspaceId]
        : multipleWorkspaceIds

    try {
        const campaigns = await prisma.campaign.findMany({
            where: {
                userId: session.user.id,
                ...(workspaceIds.length > 0 ? {
                    campaignWorkspaces: {
                        some: {
                            workspaceId: { in: workspaceIds }
                        }
                    }
                } : {}),
                ...(tagIds.length > 0 ? {
                    tags: {
                        some: {
                            tagId: { in: tagIds }
                        }
                    }
                } : {})
            },
            include: {
                campaignWorkspaces: {
                    include: {
                        workspace: true
                    }
                },
                tags: {
                    include: {
                        tag: true
                    }
                },
                _count: {
                    select: {
                        leads: true,
                        sequences: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        if (campaigns.length === 0) {
            return NextResponse.json([])
        }

        const campaignIds = campaigns.map((c: any) => c.id)

        // Fetch TOTAL event counts (every email dispatch counts)
        // Used for "Total Sent" — if a lead goes through 4 steps, that's 4 sent
        const totalEventCounts = await prisma.$queryRaw<{ campaignId: string, type: string, count: number | bigint }[]>`
            SELECT "campaignId", "type", COUNT(id) as count
            FROM "SendingEvent"
            WHERE "campaignId" IN (${(Prisma as any).join(campaignIds)})
            AND "type" IN ('open', 'click', 'reply')
            GROUP BY "campaignId", "type"
        `

        // Deduplicate SENT events in JS to bypass historical duplicate records
        const allSentEvents = await prisma.sendingEvent.findMany({
            where: { campaignId: { in: campaignIds }, type: 'sent' },
            select: { campaignId: true, leadId: true, metadata: true }
        })
        const deduplicatedSentCount = new Map<string, number>()
        const seenSent = new Set<string>()
        for (const event of allSentEvents) {
            let step = '1'
            try {
                const meta = JSON.parse(event.metadata || '{}')
                step = String(meta.step || '1')
            } catch {}
            const key = `${event.campaignId}_${event.leadId}_step${step}`
            if (!seenSent.has(key)) {
                seenSent.add(key)
                deduplicatedSentCount.set(event.campaignId, (deduplicatedSentCount.get(event.campaignId) || 0) + 1)
            }
        }
        // Fetch UNIQUE lead counts (sequences started / contacted)
        // Used for rates — unique leads who opened/clicked/replied
        const uniqueEventCounts = await prisma.$queryRaw<{ campaignId: string, type: string, count: number | bigint }[]>`
            SELECT "campaignId", "type", COUNT(DISTINCT "leadId") as count
            FROM "SendingEvent"
            WHERE "campaignId" IN (${(Prisma as any).join(campaignIds)})
            AND "type" IN ('sent', 'open', 'click', 'reply')
            GROUP BY "campaignId", "type"
        `

        // Fetch today's sent counts (for limit reaching detection)
        const todayUTC = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z')
        const sentTodayCounts = await prisma.$queryRaw<{ campaignId: string, count: number | bigint }[]>`
            SELECT "campaignId", COUNT(id) as count
            FROM "SendingEvent"
            WHERE "campaignId" IN (${(Prisma as any).join(campaignIds)})
            AND "type" = 'sent'
            AND "metadata" LIKE '%"step":%'
            AND "createdAt" >= ${todayUTC}
            GROUP BY "campaignId"
        `

        // Fetch opportunity counts (interested + won)
        const oppCount = await prisma.$queryRaw<{ campaignId: string, count: number | bigint }[]>`
            SELECT "campaignId", COUNT(DISTINCT "id") as count
            FROM "Lead"
            WHERE "campaignId" IN (${(Prisma as any).join(campaignIds)})
            AND "aiLabel" IN ('interested', 'meeting_booked')
            GROUP BY "campaignId"
        `

        // Fetch completed lead counts (leads who finished ALL sequence steps)
        const completedLeadCounts = await prisma.$queryRaw<{ campaignId: string, count: number | bigint }[]>`
            SELECT "campaignId", COUNT(id) as count
            FROM "Lead"
            WHERE "campaignId" IN (${(Prisma as any).join(campaignIds)})
            AND "status" = 'sequence_complete'
            GROUP BY "campaignId"
        `

        // Calculate rates and opportunities for each campaign
        const campaignsWithAnalytics = campaigns.map((campaign: any) => {
            // Total sent = every email dispatch (all steps count)
            const getTotalCount = (type: string) => {
                const match = totalEventCounts.find((e: any) => e.campaignId === campaign.id && e.type === type)
                return match ? Number(match.count) : 0
            }

            // Unique leads = sequences started / contacted
            const getUniqueCount = (type: string) => {
                const match = uniqueEventCounts.find((e: any) => e.campaignId === campaign.id && e.type === type)
                return match ? Number(match.count) : 0
            }

            const getOppCount = (): number => {
                const match = oppCount.find((e: any) => e.campaignId === campaign.id)
                return match ? Number(match.count) : 0
            }

            const getSentTodayCount = () => {
                const match = sentTodayCounts.find((e: any) => e.campaignId === campaign.id)
                return match ? Number(match.count) : 0
            }

            const getCompletedLeadCount = () => {
                const match = completedLeadCounts.find((e: any) => e.campaignId === campaign.id)
                return match ? Number(match.count) : 0
            }

            const totalSent = deduplicatedSentCount.get(campaign.id) || 0            // Total emails dispatched (all steps)
            const sequencesStarted = getUniqueCount('sent')          // Unique leads contacted (Step 1+)
            const uniqueOpenCount = getUniqueCount('open')           // Unique leads who opened
            const uniqueClickCount = getUniqueCount('click')         // Unique leads who clicked
            const uniqueReplyCount = getUniqueCount('reply')         // Unique leads who replied
            const campaignOppCount = getOppCount()
            const sentToday = getSentTodayCount()
            const completedLeads = getCompletedLeadCount()

            // Rates are calculated against sequencesStarted (unique leads), not totalSent
            return {
                ...campaign,
                sentCount: totalSent,                                // "Sent" column = total emails dispatched
                sequencesStarted,                                    // Unique leads contacted
                completedLeads,                                      // Leads who finished all steps
                sentToday,
                openRate: !campaign.trackOpens ? 'Disabled' : `${sequencesStarted > 0 ? Math.min(Math.round((uniqueOpenCount / sequencesStarted) * 100), 100) : 0}%`,
                clickRate: !campaign.trackLinks ? 'Disabled' : `${sequencesStarted > 0 ? Math.min(Math.round((uniqueClickCount / sequencesStarted) * 100), 100) : 0}%`,
                replyRate: `${sequencesStarted > 0 ? Math.min(Math.round((uniqueReplyCount / sequencesStarted) * 100), 100) : 0}%`,
                opportunities: campaignOppCount
            }
        })

        return NextResponse.json(campaignsWithAnalytics)
    } catch (error) {
        console.error("Failed to fetch campaigns:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { name, workspaceIds } = body

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        const campaign = await prisma.campaign.create({
            data: {
                name,
                userId: session.user.id,
                status: 'draft',
                trackLinks: true,
                trackOpens: true,
                // Assign to workspace(s) if provided
                ...(workspaceIds && workspaceIds.length > 0 && {
                    campaignWorkspaces: {
                        create: workspaceIds.map((workspaceId: string) => ({
                            workspaceId
                        }))
                    }
                })
            },
            include: {
                campaignWorkspaces: {
                    include: {
                        workspace: true
                    }
                }
            }
        })
        return NextResponse.json(campaign, { status: 201 })
    } catch (error) {
        console.error('Failed to create campaign:', error)
        return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }
}
