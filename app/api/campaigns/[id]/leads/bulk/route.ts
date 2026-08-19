import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordLeadMemory } from '@/lib/lead-memory'

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

        // Ensure memory is recorded for any contacted/bounced/replied/unsubscribed leads before deletion
        const leadsToDelete = await prisma.lead.findMany({
            where: {
                id: { in: leadIds },
                campaignId: id,
                status: { in: ['contacted', 'replied', 'bounced', 'unsubscribed', 'sequence_complete', 'lead'] }
            },
            select: { email: true, status: true }
        })

        for (const l of leadsToDelete) {
            if (l.status !== 'new' && l.status !== 'lead') {
                await recordLeadMemory({
                    campaignId: id,
                    email: l.email,
                    status: l.status
                })
            }
        }

        // Manually delete dependent SendingEvent records first to bypass Turso constraint limits
        await prisma.sendingEvent.deleteMany({
            where: {
                leadId: { in: leadIds },
                campaignId: id
            }
        })

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
