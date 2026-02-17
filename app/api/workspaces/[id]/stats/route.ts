import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: workspaceId } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Verify user has access to this workspace
        const workspace = await prisma.workspace.findFirst({
            where: {
                id: workspaceId,
                OR: [
                    { userId: session.user.id },
                    { members: { some: { userId: session.user.id } } }
                ]
            },
            include: {
                campaignWorkspaces: {
                    include: {
                        campaign: {
                            select: {
                                id: true
                            }
                        }
                    }
                },
                emailAccountWorkspaces: true
            }
        })

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
        }

        // Get campaign IDs
        const campaignIds = workspace.campaignWorkspaces.map(cw => cw.campaignId)

        // Count leads in these campaigns
        const leadCount = campaignIds.length > 0
            ? await prisma.lead.count({
                where: {
                    campaignId: { in: campaignIds }
                }
            })
            : 0

        // Count email accounts
        const emailAccountCount = workspace.emailAccountWorkspaces.length

        return NextResponse.json({
            leadCount,
            emailAccountCount,
            campaignCount: campaignIds.length
        })
    } catch (error) {
        console.error('[WORKSPACE STATS ERROR]:', error)
        return NextResponse.json({ error: 'Failed to fetch workspace stats' }, { status: 500 })
    }
}
