import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: workspaceId } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { name, opportunityValue } = body

        // Allow updating either name or opportunityValue or both
        if (!name && opportunityValue === undefined) {
            return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
        }

        const updateData: any = {}
        if (name) updateData.name = name
        if (opportunityValue !== undefined) updateData.opportunityValue = parseFloat(opportunityValue)

        const workspace = await prisma.workspace.update({
            where: {
                id: workspaceId,
                userId: session.user.id // Only owner can update
            },
            data: updateData
        })

        return NextResponse.json(workspace)
    } catch (error) {
        console.error("[WORKSPACE PATCH ERROR]:", error)
        return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: workspaceId } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Find if it's the default workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                campaignWorkspaces: {
                    include: {
                        campaign: {
                            include: {
                                campaignWorkspaces: true // Get all workspaces this campaign belongs to
                            }
                        }
                    }
                }
            }
        })

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
        }

        if (workspace.isDefault) {
            return NextResponse.json({ error: 'Cannot delete default workspace' }, { status: 400 })
        }

        if (workspace.userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Find campaigns that ONLY belong to this workspace (not shared with others)
        const exclusiveCampaignIds = workspace.campaignWorkspaces
            .filter(cw => cw.campaign.campaignWorkspaces.length === 1)
            .map(cw => cw.campaignId)

        // Delete exclusive campaigns and their related data
        if (exclusiveCampaignIds.length > 0) {
            // Delete leads for these campaigns
            await prisma.lead.deleteMany({
                where: { campaignId: { in: exclusiveCampaignIds } }
            })

            // Delete campaign stats
            await prisma.campaignStat.deleteMany({
                where: { campaignId: { in: exclusiveCampaignIds } }
            })

            // Delete sequences and their variants
            // First get sequence IDs for these campaigns
            const sequences = await prisma.sequence.findMany({
                where: { campaignId: { in: exclusiveCampaignIds } },
                select: { id: true }
            })
            const sequenceIds = sequences.map(s => s.id)

            if (sequenceIds.length > 0) {
                await prisma.sequenceVariant.deleteMany({
                    where: { sequenceId: { in: sequenceIds } }
                })
            }
            await prisma.sequence.deleteMany({
                where: { campaignId: { in: exclusiveCampaignIds } }
            })

            // Delete campaign email accounts
            await prisma.campaignEmailAccount.deleteMany({
                where: { campaignId: { in: exclusiveCampaignIds } }
            })

            // Delete campaign workspace links
            await prisma.campaignWorkspace.deleteMany({
                where: { campaignId: { in: exclusiveCampaignIds } }
            })

            // Delete the campaigns themselves
            await prisma.campaign.deleteMany({
                where: { id: { in: exclusiveCampaignIds } }
            })
        }

        // Delete workspace links for shared campaigns (they remain but lose this workspace)
        await prisma.campaignWorkspace.deleteMany({
            where: { workspaceId }
        })

        // Finally delete the workspace
        await prisma.workspace.delete({
            where: { id: workspaceId }
        })

        return NextResponse.json({
            success: true,
            deletedCampaigns: exclusiveCampaignIds.length
        })
    } catch (error) {
        console.error("[WORKSPACE DELETE ERROR]:", error)
        return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 })
    }
}

