import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

async function verifyLeadAccess(userId: string, leadId: string) {
    const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
            campaign: {
                include: {
                    campaignWorkspaces: {
                        include: {
                            workspace: {
                                include: {
                                    members: { where: { userId } }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    if (!lead) return null
    const isOwner = lead.campaign.userId === userId
    const isWsMember = lead.campaign.campaignWorkspaces.some(
        cw => cw.workspace.userId === userId || cw.workspace.members.length > 0
    )
    if (!isOwner && !isWsMember) return null
    return lead
}

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
        const authorizedLead = await verifyLeadAccess(session.user.id, leadId)
        if (!authorizedLead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        }

        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: {
                campaign: { select: { id: true, name: true } },
                events: {
                    orderBy: { createdAt: 'asc' }, // Ascending so thread is chronological
                    take: 50,
                    include: {
                        emailAccount: {
                            select: { email: true, firstName: true, lastName: true }
                        }
                    }
                }
            }
        })

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
        const authorizedLead = await verifyLeadAccess(session.user.id, leadId)
        if (!authorizedLead) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

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
        const authorizedLead = await verifyLeadAccess(session.user.id, leadId)
        if (!authorizedLead) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Delete the lead
        await prisma.lead.delete({
            where: { id: leadId }
        })

        // Add to Blocklist
        await prisma.blocklist.create({
            data: {
                email: authorizedLead.email,
                reason: "Deleted via Unibox"
            }
        })

        return NextResponse.json({ success: true, deletedEmail: authorizedLead.email, blocked: true })
    } catch (error: any) {
        // Handle race condition where lead was already deleted
        if (error.code === 'P2025') {
            return NextResponse.json({ success: true, message: 'Lead already deleted' })
        }
        console.error('Failed to delete lead:', error)
        return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
    }
}
