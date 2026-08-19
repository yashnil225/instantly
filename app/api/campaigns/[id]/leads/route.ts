import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { canUserEditCampaign } from '@/lib/permissions'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to campaign
    const campaign = await prisma.campaign.findFirst({
        where: {
            id,
            OR: [
                { userId: session.user.id },
                {
                    campaignWorkspaces: {
                        some: {
                            workspace: {
                                OR: [
                                    { userId: session.user.id },
                                    { members: { some: { userId: session.user.id } } }
                                ]
                            }
                        }
                    }
                }
            ]
        }
    })

    if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found or unauthorized' }, { status: 404 })
    }

    const leads = await prisma.lead.findMany({
        where: { campaignId: id },
        orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(leads)
}

export async function POST(
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
        const { email, firstName, lastName, company } = body

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Deduplication check
        const existingLead = await prisma.lead.findFirst({
            where: { email, campaignId: id }
        })

        if (existingLead) {
            return NextResponse.json({ error: 'Lead already exists in this campaign' }, { status: 400 })
        }

        const lead = await prisma.lead.create({
            data: {
                email,
                firstName,
                lastName,
                company,
                campaignId: id,
                status: 'new'
            }
        })
        return NextResponse.json(lead, { status: 201 })
    } catch (error) {
        console.error("Failed to add lead", error)
        return NextResponse.json({ error: 'Failed to add lead' }, { status: 500 })
    }
}
