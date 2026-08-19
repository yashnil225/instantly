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
        include: {
            variants: {
                include: { attachments: true }
            }
        },
        orderBy: { stepNumber: 'asc' }
    })

    return NextResponse.json(sequences)
}

import { canUserEditCampaign } from '@/lib/permissions'

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
        const { steps } = body

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
                        const variant = await tx.sequenceVariant.create({
                            data: {
                                sequenceId: sequence.id,
                                subject: v.subject,
                                body: v.body,
                                weight: 50 // Default split
                            }
                        })

                        if (v.attachmentIds && Array.isArray(v.attachmentIds)) {
                            await tx.attachment.updateMany({
                                where: { id: { in: v.attachmentIds } },
                                data: { sequenceVariantId: variant.id }
                            })
                        }
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
