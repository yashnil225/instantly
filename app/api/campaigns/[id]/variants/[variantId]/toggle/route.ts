import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string, variantId: string }> }
) {
    const { id: campaignId, variantId } = await params
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const variant = await prisma.sequenceVariant.findUnique({
            where: { id: variantId },
            include: { sequence: true }
        })

        if (!variant || variant.sequence.campaignId !== campaignId) {
            return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
        }

        const updatedVariant = await prisma.sequenceVariant.update({
            where: { id: variantId },
            data: { enabled: !variant.enabled }
        })

        return NextResponse.json({ success: true, enabled: updatedVariant.enabled })
    } catch (error) {
        console.error('Failed to toggle variant:', error)
        return NextResponse.json({ error: 'Failed to toggle variant' }, { status: 500 })
    }
}
