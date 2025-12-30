import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

interface RouteContext {
    params: Promise<{ id: string }>
}

/**
 * POST /api/v2/campaigns/[id]/ab-test
 * Create A/B test variants for a campaign
 */
export async function POST(req: NextRequest, context: RouteContext) {
    const auth = await validateApiKey()
    if (auth.error || !auth.user) {
        return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: (auth as any).status || 401 })
    }

    const { id } = await context.params

    try {
        // Verify ownership
        const campaign = await prisma.campaign.findFirst({
            where: { id, userId: auth.user.id },
            include: { sequences: { orderBy: { stepNumber: "asc" }, take: 1 } }
        })

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
        }

        const { variants } = await req.json()

        if (!variants || !Array.isArray(variants) || variants.length < 2) {
            return NextResponse.json({ error: "At least 2 variants are required" }, { status: 400 })
        }

        // Get the first sequence step
        const sequence = campaign.sequences[0]
        if (!sequence) {
            return NextResponse.json({ error: "Campaign has no sequence steps" }, { status: 400 })
        }

        // Delete existing variants and create new ones
        await prisma.sequenceVariant.deleteMany({
            where: { sequenceId: sequence.id }
        })

        const createdVariants = await Promise.all(
            variants.map((v: { subject?: string; body?: string }, index: number) =>
                prisma.sequenceVariant.create({
                    data: {
                        sequenceId: sequence.id,
                        label: `Variant ${String.fromCharCode(65 + index)}`, // A, B, C...
                        subject: v.subject || sequence.subject || "",
                        body: v.body || sequence.body || "",
                        weight: Math.floor(100 / variants.length) // Equal distribution
                    }
                })
            )
        )

        return NextResponse.json({
            message: `Created ${createdVariants.length} A/B test variants`,
            variants: createdVariants
        })
    } catch (error) {
        console.error("API POST /v2/campaigns/[id]/ab-test error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
