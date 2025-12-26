import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')
        const workspaceId = searchParams.get('workspaceId')
        const search = searchParams.get('search')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const aiLabels = searchParams.get('aiLabels')?.split(',').filter(Boolean)
        const sortField = searchParams.get('sortField') || 'createdAt'
        const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

        const where: any = {}

        if (workspaceId && workspaceId !== 'all') {
            where.campaign = {
                campaignWorkspaces: {
                    some: {
                        workspaceId: workspaceId
                    }
                }
            }
        }

        if (search) {
            where.OR = [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
                { company: { contains: search } },
            ]
        }

        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) where.createdAt.gte = new Date(startDate)
            if (endDate) where.createdAt.lte = new Date(endDate)
        }

        if (aiLabels && aiLabels.length > 0) {
            where.aiLabel = { in: aiLabels }
        }

        const leads = await prisma.lead.findMany({
            take: limit,
            skip: offset,
            where,
            orderBy: { [sortField]: sortOrder },
            include: {
                campaign: {
                    select: { name: true }
                }
            }
        })

        const count = await prisma.lead.count({ where })

        return NextResponse.json({ leads, total: count })
    } catch (error) {
        console.error("Fetch leads error:", error)
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }
}
