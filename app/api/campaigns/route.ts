import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const singleWorkspaceId = searchParams.get('workspaceId')
    const multipleWorkspaceIds = searchParams.get('workspaceIds')?.split(',').filter(Boolean) || []

    // Support both single and multiple workspace IDs
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
                } : {})
            },
            include: {
                campaignWorkspaces: true,
                _count: {
                    select: {
                        leads: true,
                        sequences: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(campaigns)
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
