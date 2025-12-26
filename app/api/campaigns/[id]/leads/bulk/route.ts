import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Bulk delete leads
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { leadIds } = body

        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return NextResponse.json({ error: 'No lead IDs provided' }, { status: 400 })
        }

        // Delete leads that belong to this campaign
        const deleted = await prisma.lead.deleteMany({
            where: {
                id: { in: leadIds },
                campaignId: id
            }
        })

        return NextResponse.json({
            success: true,
            count: deleted.count,
            message: `Deleted ${deleted.count} leads`
        })
    } catch (error) {
        console.error('Bulk delete error:', error)
        return NextResponse.json({ error: 'Failed to delete leads' }, { status: 500 })
    }
}
