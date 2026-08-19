import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { canUserEditCampaign, canUserViewCampaign } from '@/lib/permissions'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const check = await canUserViewCampaign(session.user.id, id)
    if (!check.allowed) {
        return NextResponse.json({ error: check.reason || 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    let dateWhereClause: any = (Prisma as any).empty
    let sentDateFilter: any = { campaignId: id, type: 'sent' }
    
    if (startDateStr && endDateStr) {
        const start = new Date(startDateStr)
        const end = new Date(endDateStr)
        end.setHours(23, 59, 59, 999)
        
        dateWhereClause = (Prisma as any).sql`AND "createdAt" >= ${start} AND "createdAt" <= ${end}`
        sentDateFilter.createdAt = { gte: start, lte: end }
    }

    const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
            campaignWorkspaces: {
                include: { workspace: true }
            },
            campaignAccounts: {
                include: { emailAccount: true }
            }
        }
    })

    if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found or unauthorized' }, { status: 404 })
    }

    // Deduplicate SENT events in JS to bypass historical duplicate records
    const allSentEvents = await prisma.sendingEvent.findMany({
        where: sentDateFilter,
        select: { leadId: true, metadata: true }
    })
    let sent = 0
    const seenSent = new Set<string>()
    for (const event of allSentEvents) {
        let step = '1'
        try {
            const meta = JSON.parse(event.metadata || '{}')
            step = String(meta.step || '1')
        } catch {}
        const key = `${event.leadId}_step${step}`
        if (!seenSent.has(key)) {
            seenSent.add(key)
            sent++
        }
    }

    // Fetch UNIQUE lead counts for rates (opened, clicked, replied)
    const uniqueEventCounts = await prisma.$queryRaw<{ type: string, count: number | bigint }[]>`
        SELECT "type", COUNT(DISTINCT "leadId") as count
        FROM "SendingEvent"
        WHERE "campaignId" = ${id}
        AND "type" IN ('open', 'click', 'reply')
        ${dateWhereClause}
        GROUP BY "type"
    `

    let opened = 0
    let clicked = 0
    let replied = 0

    for (const row of uniqueEventCounts) {
        if (row.type === 'open') opened = Number(row.count)
        if (row.type === 'click') clicked = Number(row.count)
        if (row.type === 'reply') replied = Number(row.count)
    }

    const aggregatedStats = { sent, opened, clicked, replied }

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
        const check = await canUserEditCampaign(session.user.id, id)
        if (!check.allowed) {
            return NextResponse.json({ error: check.reason || 'Forbidden' }, { status: 403 })
        }

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

        // Ensure schedules is stringified if it's an object/array
        if (updateData.schedules && typeof updateData.schedules !== 'string') {
            updateData.schedules = JSON.stringify(updateData.schedules)
        }

        const campaign = await prisma.campaign.update({
            where: { id: id },
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
        const check = await canUserEditCampaign(session.user.id, id)
        if (!check.allowed) {
            return NextResponse.json({ error: check.reason || 'Forbidden' }, { status: 403 })
        }

        await prisma.campaign.delete({
            where: { id: id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}
