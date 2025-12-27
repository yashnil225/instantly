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

    // Verify campaign ownership
    const campaign = await prisma.campaign.findFirst({
        where: { id, userId: session.user.id }
    })

    if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
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
        const body = await request.json()
        const { email, firstName, lastName, company } = body

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Verify campaign ownership
        const campaign = await prisma.campaign.findFirst({
            where: { id, userId: session.user.id }
        })

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
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
