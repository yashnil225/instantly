import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

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

        const campaignIds = campaigns.map(c => c.id)

        // Fetch unique event counts
        const eventCounts = await prisma.$queryRaw<{ campaignId: string, type: string, count: number | bigint }[]>`
            SELECT "campaignId", "type", 
                   CASE 
                     WHEN "type" = 'sent' THEN COUNT(id) 
                     ELSE COUNT(DISTINCT "leadId") 
                   END as count
            FROM "SendingEvent"
            WHERE "campaignId" IN (${Prisma.join(campaignIds)})
            AND "type" IN ('sent', 'open', 'click', 'reply')
            GROUP BY "campaignId", "type"
        `

        // Fetch opportunity counts
        const oppCounts = await prisma.$queryRaw<{ campaignId: string, count: number | bigint }[]>`
            AND ("aiLabel" IN ('interested', 'meeting_booked') OR "status" IN ('won', 'converted'))
            GROUP BY "campaignId"
        `

        // Calculate rates and opportunities for each campaign
        const campaignsWithAnalytics = campaigns.map(campaign => {
            // Extract counts from query results safely handling BigInts
            const getUniqueCount = (type: string) => {
                const match = eventCounts.find(e => e.campaignId === campaign.id && e.type === type)
                return match ? Number(match.count) : 0
            }

            const getOppCount = () => {
                const match = oppCounts.find(e => e.campaignId === campaign.id)
                return match ? Number(match.count) : 0
            }

            const sentCount = getUniqueCount('sent')
            const uniqueOpenCount = getUniqueCount('open')
            const uniqueClickCount = getUniqueCount('click')
            const uniqueReplyCount = getUniqueCount('reply')
            const oppCount = getOppCount()

            return {
                ...campaign,
                sentCount, // Override static sentCount with source-of-truth from SendingEvent
                openRate: !campaign.trackOpens ? 'Disabled' : `${sentCount > 0 ? Math.min(Math.round((uniqueOpenCount / sentCount) * 100), 100) : 0}%`,
                clickRate: !campaign.trackLinks ? 'Disabled' : `${sentCount > 0 ? Math.min(Math.round((uniqueClickCount / sentCount) * 100), 100) : 0}%`,
                replyRate: `${sentCount > 0 ? Math.min(Math.round((uniqueReplyCount / sentCount) * 100), 100) : 0}%`,
                opportunities: oppCount // Opportunities = Interested/Won
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
