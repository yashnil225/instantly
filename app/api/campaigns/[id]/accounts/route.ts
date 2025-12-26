import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

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
        const { accountIds } = body // Array of strings

        if (!Array.isArray(accountIds)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        const campaignId = id

        // Verify ownership
        const campaign = await prisma.campaign.findFirst({
            where: { id: campaignId, userId: session.user.id }
        })

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        // Transaction to update links
        await prisma.$transaction(async (tx) => {
            // 1. Remove all existing links for this campaign
            await tx.campaignEmailAccount.deleteMany({
                where: { campaignId }
            })

            // 2. Create new links
            if (accountIds.length > 0) {
                await tx.campaignEmailAccount.createMany({
                    data: accountIds.map(accId => ({
                        campaignId,
                        emailAccountId: accId
                    }))
                })
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to link accounts", error)
        return NextResponse.json({ error: 'Failed to update accounts' }, { status: 500 })
    }
}
