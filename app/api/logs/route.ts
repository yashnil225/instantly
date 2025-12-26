import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET audit logs for user
export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const type = searchParams.get('type') // filter by action type
    const skip = (page - 1) * limit

    const whereClause: any = { userId: session.user.id }
    if (type && type !== 'all') {
        whereClause.action = type
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            select: {
                id: true,
                action: true,
                resource: true,
                resourceId: true,
                details: true,
                ipAddress: true,
                createdAt: true
            }
        }),
        prisma.auditLog.count({ where: whereClause })
    ])

    // Transform for frontend
    const transformedLogs = logs.map(log => ({
        id: log.id,
        timestamp: log.createdAt.toISOString().replace('T', ' ').slice(0, 19),
        type: log.action.charAt(0).toUpperCase() + log.action.slice(1).replace(/_/g, ' '),
        ip: log.ipAddress || '-',
        campaign: log.resource === 'campaign' ? log.resourceId : '-',
        list: log.resource === 'leads' ? log.resourceId : '-'
    }))

    return NextResponse.json({
        logs: transformedLogs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    })
}
