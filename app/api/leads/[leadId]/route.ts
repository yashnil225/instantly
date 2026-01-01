import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

// GET single lead
export async function GET(
    request: Request,
    { params }: { params: Promise<{ leadId: string }> }
) {
    const { leadId } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: {
                campaign: { select: { id: true, name: true } },
                events: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        })

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        }

        return NextResponse.json(lead)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 })
    }
}

// PATCH - Update lead (label, campaign, read status, etc.)
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ leadId: string }> }
) {
    const { leadId } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { aiLabel, campaignId, isRead, status } = body

        const updateData: any = {}

        if (aiLabel !== undefined) updateData.aiLabel = aiLabel
        if (campaignId !== undefined) updateData.campaignId = campaignId
        if (isRead !== undefined) updateData.isRead = isRead
        if (status !== undefined) updateData.status = status

        const lead = await prisma.lead.update({
            where: { id: leadId },
            data: updateData,
            include: {
                campaign: { select: { id: true, name: true } }
            }
        })

        return NextResponse.json(lead)
    } catch (error) {
        console.error('Failed to update lead:', error)
        return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }
}

// DELETE - Delete lead and add to blocklist
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ leadId: string }> }
) {
    const { leadId } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Get lead email before deletion
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            select: { email: true }
        })

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        }

        // Delete the lead
        await prisma.lead.delete({
            where: { id: leadId }
        })

        // Add to Blocklist
        await prisma.blocklist.create({
            data: {
                email: lead.email,
                reason: "Deleted via Unibox"
            }
        })

        return NextResponse.json({ success: true, deletedEmail: lead.email, blocked: true })
    } catch (error) {
        console.error('Failed to delete lead:', error)
        return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
    }
}
