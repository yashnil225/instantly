import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'


export async function GET(
    request: Request,
    prop: { params: Promise<{ id: string }> }
) {
    const params = await prop.params;
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
            id: params.id,
            userId: session.user.id
        },
        include: {
            stats: {
                where: dateFilter
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
    prop: { params: Promise<{ id: string }> }
) {
    const params = await prop.params;
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()

        // Handle automatic start date for resume
        if (body.status === 'active') {
            const current = await prisma.campaign.findUnique({
                where: { id: params.id },
                select: { startDate: true }
            })
            if (current && !current.startDate && !body.startDate) {
                body.startDate = new Date()
            }
        }

        const campaign = await prisma.campaign.update({
            where: { id: params.id, userId: session.user.id },
            data: body
        })
        return NextResponse.json(campaign)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    prop: { params: Promise<{ id: string }> }
) {
    const params = await prop.params;
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await prisma.campaign.delete({
            where: { id: params.id, userId: session.user.id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}
