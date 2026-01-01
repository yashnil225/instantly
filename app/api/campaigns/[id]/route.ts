import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'


export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    let dateFilter = {}
    if (startDateStr && endDateStr) {
        dateFilter = {
            date: {
                gte: new Date(startDateStr),
                lte: new Date(endDateStr)
            }
        }
    }

    const campaign = await prisma.campaign.findUnique({
        where: {
            id,
            userId: session.user.id
        },
        include: {
            stats: {
                where: dateFilter
            },
            campaignWorkspaces: {
                include: { workspace: true }
            }
        }
    })

    if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Pass dynamic stats
    const aggregatedStats = {
        sent: campaign.stats.reduce((acc, curr) => acc + curr.sent, 0),
        opened: campaign.stats.reduce((acc, curr) => acc + curr.opened, 0),
        clicked: campaign.stats.reduce((acc, curr) => acc + curr.clicked, 0),
        replied: campaign.stats.reduce((acc, curr) => acc + curr.replied, 0),
    }

    return NextResponse.json({ ...campaign, ...aggregatedStats })
}


export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { workspaceIds, ...updateData } = body

        // Handle automatic start date for resume
        if (updateData.status === 'active') {
            const current = await prisma.campaign.findUnique({
                where: { id: id },
                select: { startDate: true }
            })
            if (current && !current.startDate && !updateData.startDate) {
                updateData.startDate = new Date()
            }
        }

        // If workspaceIds is provided, update workspace assignments
        if (workspaceIds !== undefined) {
            // First delete existing assignments
            await prisma.campaignWorkspace.deleteMany({
                where: { campaignId: id }
            })

            // Then create new assignments
            if (workspaceIds.length > 0) {
                await prisma.campaignWorkspace.createMany({
                    data: workspaceIds.map((workspaceId: string) => ({
                        campaignId: id,
                        workspaceId
                    }))
                })
            }
        }

        const campaign = await prisma.campaign.update({
            where: { id: id, userId: session.user.id },
            data: updateData,
            include: {
                campaignWorkspaces: {
                    include: { workspace: true }
                }
            }
        })
        return NextResponse.json(campaign)
    } catch (error) {
        console.error('Failed to update campaign:', error)
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await prisma.campaign.delete({
            where: { id: id, userId: session.user.id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}
