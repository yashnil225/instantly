import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

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
                campaignWorkspaces: true,
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

        // Calculate rates and opportunities for each campaign
        const campaignsWithAnalytics = campaigns.map(campaign => {
            const sentCount = campaign.sentCount || 0
            const openCount = campaign.openCount || 0
            const clickCount = campaign.clickCount || 0
            const replyCount = campaign.replyCount || 0

            return {
                ...campaign,
                openRate: sentCount > 0 ? Math.min(Math.round((openCount / sentCount) * 100), 100) : 0,
                clickRate: sentCount > 0 ? Math.min(Math.round((clickCount / sentCount) * 100), 100) : 0,
                replyRate: sentCount > 0 ? Math.min(Math.round((replyCount / sentCount) * 100), 100) : 0,
                opportunities: replyCount // Opportunities = Replies
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
