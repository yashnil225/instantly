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

    const sequences = await prisma.sequence.findMany({
        where: { campaignId: id },
        include: { variants: true },
        orderBy: { stepNumber: 'asc' }
    })

    return NextResponse.json(sequences)
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
        const { steps } = body

        // Verify campaign exists (removed strict userId check for workspace compatibility)
        const campaign = await prisma.campaign.findFirst({
            where: { id }
        })

        if (!campaign) {
            console.error(`Campaign not found: ${id}`)
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        const campaignId = id

        await prisma.$transaction(async (tx) => {
            // Delete existing sequences
            await tx.sequence.deleteMany({
                where: { campaignId }
            })

            // Create new sequences
            for (const step of steps) {
                const sequence = await tx.sequence.create({
                    data: {
                        campaignId,
                        stepNumber: step.stepNumber,
                        dayGap: step.day,
                        // Legacy support (optional)
                        subject: step.variants[0]?.subject,
                        body: step.variants[0]?.body
                    }
                })

                if (step.variants && step.variants.length > 0) {
                    for (const v of step.variants) {
                        await tx.sequenceVariant.create({
                            data: {
                                sequenceId: sequence.id,
                                subject: v.subject,
                                body: v.body,
                                weight: 50 // Default split
                            }
                        })
                    }
                }
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to save sequences:', error)
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to save sequences' }, { status: 500 })
    }
}
