import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceIds = searchParams.get('workspaceIds')?.split(',').filter(Boolean)

    const where: any = { userId: session.user.id }

    // Filter by workspace(s) if provided
    if (workspaceIds && workspaceIds.length > 0) {
        where.campaignWorkspaces = {
            some: {
                workspaceId: {
                    in: workspaceIds
                }
            }
        }
    }

    const campaigns = await prisma.campaign.findMany({
        where,
        include: {
            campaignWorkspaces: {
                include: {
                    workspace: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
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

    return NextResponse.json(campaigns)
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
